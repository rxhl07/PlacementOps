import { prisma } from '../../config/prisma';
import { CompanyPriority } from '@prisma/client';

export interface UnscheduledReason {
    studentId: string;
    studentName: string;
    companyId: string;
    companyName: string;
    roundId: string;
    roundName: string;
    reasons: string[];
}

export interface GenerationMetrics {
    totalRequested: number;
    totalScheduled: number;
    totalUnscheduled: number;
    scheduledPercentage: number;
    unscheduledBreakdown: UnscheduledReason[];
}

export class ScheduleGenerator {
    private static getPriorityScore(priority: CompanyPriority): number {
        switch (priority) {
            case 'HIGH':
                return 3;
            case 'MEDIUM':
                return 2;
            case 'LOW':
                return 1;
            default:
                return 1;
        }
    }

    private static generateTimeSlots(start: Date, end: Date, durationMinutes: number): { start: Date; end: Date }[] {
        const slots: { start: Date; end: Date }[] = [];
        let current = new Date(start.getTime());

        while (current.getTime() + durationMinutes * 60000 <= end.getTime()) {
            const slotEnd = new Date(current.getTime() + durationMinutes * 60000);
            slots.push({ start: new Date(current), end: slotEnd });
            current = slotEnd;
        }

        return slots;
    }

    static async generateSchedule(placementDriveId: string, triggerReason: string = 'Initial Schedule Generation') {
        console.log(`[ScheduleGenerator] Starting fast schedule generation for drive ${placementDriveId}...`);

        // 1. Fetch All Placement Resources in a single database batch query
        const drive = await prisma.placementDrive.findUnique({
            where: { id: placementDriveId },
            include: {
                companies: {
                    include: {
                        rounds: { orderBy: { sequenceOrder: 'asc' } },
                        shortlists: { include: { student: true } },
                    },
                },
                rooms: { where: { isAvailable: true } },
                panels: { where: { isAvailable: true } },
            },
        });

        if (!drive) {
            throw new Error(`Placement Drive with ID ${placementDriveId} not found.`);
        }

        // Sort Companies by Tier Priority (HIGH -> MEDIUM -> LOW)
        const sortedCompanies = [...drive.companies].sort(
            (a, b) => this.getPriorityScore(b.priority) - this.getPriorityScore(a.priority)
        );

        // 2. Prepare Schedule Version Record
        const newVersion = await prisma.$transaction(async (tx) => {
            await tx.scheduleVersion.updateMany({
                where: { placementDriveId, isCurrent: true },
                data: { isCurrent: false },
            });

            const lastVersion = await tx.scheduleVersion.findFirst({
                where: { placementDriveId },
                orderBy: { versionNumber: 'desc' },
            });

            const nextVersionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;

            return tx.scheduleVersion.create({
                data: {
                    placementDriveId,
                    versionNumber: nextVersionNumber,
                    isCurrent: true,
                    triggerReason,
                },
            });
        });

        // 3. Fast In-Memory State Tracking Sets
        // Key format: `${entityId}_${startTimeISO}`
        const busyStudents = new Set<string>();
        const busyRooms = new Set<string>();
        const busyPanels = new Set<string>();

        let totalRequested = 0;
        let totalScheduled = 0;
        const assignmentsToCreate: any[] = [];
        const unscheduledBreakdown: UnscheduledReason[] = [];

        // 4. In-Memory Constraint Solving Loop
        for (const company of sortedCompanies) {
            const companyArrival = company.actualArrival || company.expectedArrival;
            const companyDeparture = company.expectedDeparture;

            for (const round of company.rounds) {
                const timeSlots = this.generateTimeSlots(companyArrival, companyDeparture, round.durationMinutes);

                for (const shortlist of company.shortlists) {
                    const student = shortlist.student;
                    if (student.status === 'WITHDRAWN') continue;

                    totalRequested++;
                    let isAssigned = false;

                    slotLoop: for (const slot of timeSlots) {
                        const timeKey = slot.start.toISOString();
                        const studentKey = `${student.id}_${timeKey}`;

                        // Skip slot if student is already occupied elsewhere
                        if (busyStudents.has(studentKey)) continue;

                        for (const room of drive.rooms) {
                            const roomKey = `${room.id}_${timeKey}`;
                            if (busyRooms.has(roomKey)) continue;

                            for (const panel of drive.panels) {
                                const panelKey = `${panel.id}_${timeKey}`;
                                if (busyPanels.has(panelKey)) continue;

                                // Valid non-conflicting assignment found!
                                busyStudents.add(studentKey);
                                busyRooms.add(roomKey);
                                busyPanels.add(panelKey);

                                assignmentsToCreate.push({
                                    scheduleVersionId: newVersion.id,
                                    studentId: student.id,
                                    companyId: company.id,
                                    roundId: round.id,
                                    roomId: room.id,
                                    panelId: panel.id,
                                    startTime: slot.start,
                                    endTime: slot.end,
                                });

                                totalScheduled++;
                                isAssigned = true;
                                break slotLoop;
                            }
                        }
                    }

                    if (!isAssigned) {
                        unscheduledBreakdown.push({
                            studentId: student.id,
                            studentName: student.name,
                            companyId: company.id,
                            companyName: company.name,
                            roundId: round.id,
                            roundName: round.name,
                            reasons: ['No available time slot, room, or panel without scheduling conflicts.'],
                        });
                    }
                }
            }
        }

        // 5. Single Batch Insert for All Assignments
        console.log(`[ScheduleGenerator] Bulk inserting ${assignmentsToCreate.length} assignments...`);
        if (assignmentsToCreate.length > 0) {
            await prisma.interviewAssignment.createMany({
                data: assignmentsToCreate,
            });
        }

        const totalUnscheduled = totalRequested - totalScheduled;
        const metrics: GenerationMetrics = {
            totalRequested,
            totalScheduled,
            totalUnscheduled,
            scheduledPercentage: totalRequested > 0 ? Number(((totalScheduled / totalRequested) * 100).toFixed(2)) : 0,
            unscheduledBreakdown,
        };

        console.log(`[ScheduleGenerator] Completed cleanly: ${totalScheduled}/${totalRequested} scheduled.`);

        return {
            version: newVersion,
            metrics,
        };
    }
}