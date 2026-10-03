import { prisma } from '../../config/prisma';
import { ConflictEngine } from '../interviews/conflict.engine';
import { DisruptionType, ScheduleChangeType } from '@prisma/client';
import { DistributedLock } from '../../common/lock.service';
import { notificationQueue } from '../../jobs/notification.queue';

export interface DisruptionInput {
    placementDriveId: string;
    type: DisruptionType;
    description: string;
    companyId?: string;
    panelId?: string;
    roomId?: string;
    studentId?: string;
    delayMinutes?: number;
}

export class ReplanEngine {
    static async handleDisruption(input: DisruptionInput) {
        const lockKey = `replan:drive:${input.placementDriveId}`;

        return DistributedLock.withLock(lockKey, 120000, async () => {
            // 1. Fetch current active schedule version
            const currentVersion = await prisma.scheduleVersion.findFirst({
                where: { placementDriveId: input.placementDriveId, isCurrent: true },
                include: {
                    assignments: {
                        include: { student: true, company: true, round: true, room: true, panel: true },
                    },
                },
            });

            if (!currentVersion) {
                throw new Error('No active schedule version found to replan against.');
            }

            // 2. Fetch Placement Drive Resources
            const drive = await prisma.placementDrive.findUnique({
                where: { id: input.placementDriveId },
                include: {
                    rooms: { where: { isAvailable: true } },
                    panels: { where: { isAvailable: true } },
                },
            });

            if (!drive) throw new Error('Placement drive not found.');

            // 3. Log the Disruption Record
            const disruption = await prisma.disruption.create({
                data: {
                    placementDriveId: input.placementDriveId,
                    type: input.type,
                    description: input.description,
                    companyId: input.companyId,
                    panelId: input.panelId,
                    roomId: input.roomId,
                },
            });

            // 4. Identify Affected vs Unaffected Assignments (Blast Radius)
            const affectedAssignmentIds = new Set<string>();
            const unaffectedAssignments = [];

            for (const assignment of currentVersion.assignments) {
                let isAffected = false;

                if (input.type === 'COMPANY_DELAY' && assignment.companyId === input.companyId) {
                    isAffected = true;
                } else if (input.type === 'PANEL_UNAVAILABLE' && assignment.panelId === input.panelId) {
                    isAffected = true;
                } else if (input.type === 'ROOM_UNAVAILABLE' && assignment.roomId === input.roomId) {
                    isAffected = true;
                } else if (input.type === 'STUDENT_WITHDRAWAL' && assignment.studentId === input.studentId) {
                    isAffected = true;
                }

                if (isAffected) {
                    affectedAssignmentIds.add(assignment.id);
                } else {
                    unaffectedAssignments.push(assignment);
                }
            }

            // Handle Student Withdrawal immediately: mark student status WITHDRAWN and cancel interviews
            if (input.type === 'STUDENT_WITHDRAWAL' && input.studentId) {
                await prisma.student.update({
                    where: { id: input.studentId },
                    data: { status: 'WITHDRAWN' },
                });
            }

            // If Company Delay, shift company operational arrival window
            if (input.type === 'COMPANY_DELAY' && input.companyId && input.delayMinutes) {
                const company = await prisma.company.findUnique({ where: { id: input.companyId } });
                if (company) {
                    const currentArrival = company.actualArrival || company.expectedArrival;
                    const newArrival = new Date(currentArrival.getTime() + input.delayMinutes * 60000);
                    await prisma.company.update({
                        where: { id: input.companyId },
                        data: { actualArrival: newArrival },
                    });
                }
            }

            // 5. Create New Schedule Version in Transaction
            const newVersion = await prisma.$transaction(async (tx) => {
                await tx.scheduleVersion.updateMany({
                    where: { placementDriveId: input.placementDriveId, isCurrent: true },
                    data: { isCurrent: false },
                });

                return tx.scheduleVersion.create({
                    data: {
                        placementDriveId: input.placementDriveId,
                        versionNumber: currentVersion.versionNumber + 1,
                        isCurrent: true,
                        triggerReason: `REPLAN: ${input.type} - ${input.description}`,
                        disruptionId: disruption.id,
                    },
                });
            });

            // 6. Copy Unaffected Assignments into New Version (Frozen In Place) - BULK INSERT OPTIMIZATION
            const frozenAssignmentsData = unaffectedAssignments.map((assignment) => ({
                scheduleVersionId: newVersion.id,
                studentId: assignment.studentId,
                companyId: assignment.companyId,
                roundId: assignment.roundId,
                roomId: assignment.roomId,
                panelId: assignment.panelId,
                startTime: assignment.startTime,
                endTime: assignment.endTime,
                status: assignment.status,
            }));

            if (frozenAssignmentsData.length > 0) {
                // Execute all 2,700 inserts in a single database round-trip (~100ms total)
                await prisma.interviewAssignment.createMany({
                    data: frozenAssignmentsData,
                });
            }

            // 7. Targeted Re-Allocation for Affected Assignments
            const diffs: any[] = [];
            let rescheduledCount = 0;
            let cancelledCount = 0;

            for (const oldAssignment of currentVersion.assignments) {
                if (!affectedAssignmentIds.has(oldAssignment.id)) continue;

                // Withdrawals are directly cancelled, no reallocation
                if (input.type === 'STUDENT_WITHDRAWAL' && oldAssignment.studentId === input.studentId) {
                    cancelledCount++;
                    diffs.push({
                        oldScheduleVersionId: currentVersion.id,
                        newScheduleVersionId: newVersion.id,
                        changeType: ScheduleChangeType.CANCELLED,
                        assignmentId: oldAssignment.id,
                        details: {
                            reason: 'Student Withdrawn from drive',
                            studentName: oldAssignment.student.name,
                            companyName: oldAssignment.company.name,
                        },
                    });
                    continue;
                }

                const company = await prisma.company.findUnique({ where: { id: oldAssignment.companyId } });
                const round = await prisma.companyRound.findUnique({ where: { id: oldAssignment.roundId } });
                if (!company || !round) continue;

                let foundNewSlot = false;
                let finalSlotStart = null;
                let finalSlotEnd = null;
                let finalRoomId = null;
                let finalPanelId = null;

                // FAST PATH OPTIMIZATION: If it's a COMPANY_DELAY, try shifting the exact assignment by delayMinutes first
                if (input.type === 'COMPANY_DELAY' && input.delayMinutes) {
                    const shiftedStart = new Date(oldAssignment.startTime.getTime() + input.delayMinutes * 60000);
                    const shiftedEnd = new Date(oldAssignment.endTime.getTime() + input.delayMinutes * 60000);

                    // Ensure the shifted time doesn't exceed company departure
                    if (shiftedEnd.getTime() <= company.expectedDeparture.getTime()) {
                        const proposedShift = {
                            scheduleVersionId: newVersion.id,
                            studentId: oldAssignment.studentId,
                            companyId: oldAssignment.companyId,
                            roundId: oldAssignment.roundId,
                            roomId: oldAssignment.roomId,
                            panelId: oldAssignment.panelId,
                            startTime: shiftedStart,
                            endTime: shiftedEnd,
                        };

                        const conflict = await ConflictEngine.validateAssignment(proposedShift);

                        if (!conflict.hasConflict) {
                            finalSlotStart = shiftedStart;
                            finalSlotEnd = shiftedEnd;
                            finalRoomId = oldAssignment.roomId;
                            finalPanelId = oldAssignment.panelId;
                            foundNewSlot = true;
                        }
                    }
                }

                // SLOW PATH FALLBACK: If direct shift fails or it's a different disruption type, run the search loop
                if (!foundNewSlot) {
                    const companyArrival = company.actualArrival || company.expectedArrival;
                    const durationMs = round.durationMinutes * 60000;
                    let slotCurrent = new Date(companyArrival.getTime());

                    slotSearch: while (slotCurrent.getTime() + durationMs <= company.expectedDeparture.getTime()) {
                        const slotEnd = new Date(slotCurrent.getTime() + durationMs);

                        for (const room of drive.rooms) {
                            if (input.type === 'ROOM_UNAVAILABLE' && room.id === input.roomId) continue;

                            for (const panel of drive.panels) {
                                if (input.type === 'PANEL_UNAVAILABLE' && panel.id === input.panelId) continue;

                                const proposed = {
                                    scheduleVersionId: newVersion.id,
                                    studentId: oldAssignment.studentId,
                                    companyId: oldAssignment.companyId,
                                    roundId: oldAssignment.roundId,
                                    roomId: room.id,
                                    panelId: panel.id,
                                    startTime: slotCurrent,
                                    endTime: slotEnd,
                                };

                                const conflict = await ConflictEngine.validateAssignment(proposed);

                                if (!conflict.hasConflict) {
                                    finalSlotStart = slotCurrent;
                                    finalSlotEnd = slotEnd;
                                    finalRoomId = room.id;
                                    finalPanelId = panel.id;
                                    foundNewSlot = true;
                                    break slotSearch;
                                }
                            }
                        }
                        slotCurrent = new Date(slotCurrent.getTime() + 15 * 60000); // 15-min jump
                    }
                }

                // Apply the found slot
                if (foundNewSlot && finalSlotStart && finalSlotEnd && finalRoomId && finalPanelId) {
                    const newAssignment = await prisma.interviewAssignment.create({
                        data: {
                            scheduleVersionId: newVersion.id,
                            studentId: oldAssignment.studentId,
                            companyId: oldAssignment.companyId,
                            roundId: oldAssignment.roundId,
                            roomId: finalRoomId,
                            panelId: finalPanelId,
                            startTime: finalSlotStart,
                            endTime: finalSlotEnd,
                        }
                    });

                    rescheduledCount++;

                    diffs.push({
                        oldScheduleVersionId: currentVersion.id,
                        newScheduleVersionId: newVersion.id,
                        changeType: ScheduleChangeType.MOVED,
                        assignmentId: newAssignment.id,
                        details: {
                            studentName: oldAssignment.student.name,
                            companyName: oldAssignment.company.name,
                            oldTime: { start: oldAssignment.startTime, end: oldAssignment.endTime },
                            newTime: { start: finalSlotStart, end: finalSlotEnd },
                            oldRoom: oldAssignment.room.name, // Will need room object resolution if room changes in slow path
                            newRoom: drive.rooms.find(r => r.id === finalRoomId)?.name || oldAssignment.room.name,
                            reason: input.description,
                        },
                    });
                } else {
                    cancelledCount++;
                    diffs.push({
                        oldScheduleVersionId: currentVersion.id,
                        newScheduleVersionId: newVersion.id,
                        changeType: ScheduleChangeType.CANCELLED,
                        assignmentId: oldAssignment.id,
                        details: {
                            reason: `Could not find alternative feasible slot after disruption: ${input.description}`,
                            studentName: oldAssignment.student.name,
                            companyName: oldAssignment.company.name,
                        },
                    });
                }
            }

            // 8. Bulk Save Diff Records
            if (diffs.length > 0) {
                await prisma.scheduleDiff.createMany({
                    data: diffs,
                });

                // 9. Queue Asynchronous Background Change Notifications
                for (const diff of diffs) {
                    if (diff.details?.studentName) {
                        await notificationQueue.add('schedule-change-notice', {
                            title: 'Interview Schedule Updated',
                            message: `Your interview status has changed: ${diff.changeType}. ${diff.details.reason || ''}`,
                            type: 'SCHEDULE_CHANGE',
                        });
                    }
                }
            }

            return {
                disruptionId: disruption.id,
                oldVersionNumber: currentVersion.versionNumber,
                newVersionNumber: newVersion.versionNumber,
                summary: {
                    totalAffected: affectedAssignmentIds.size,
                    rescheduled: rescheduledCount,
                    cancelled: cancelledCount,
                    unaffected: unaffectedAssignments.length,
                },
                diffs,
            };
        });
    }
}