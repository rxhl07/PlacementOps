import { prisma } from '../../config/prisma';
import { ConflictEngine } from '../interviews/conflict.engine';
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
    /**
     * Helper to convert CompanyPriority enum into numeric priority score.
     */
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

    /**
     * Generates continuous time-slots of duration `durationMinutes` between start and end.
     */
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
        // 1. Fetch All Placement Resources
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

        // 2. Prepare Transaction for Schedule Version Creation
        const newVersion = await prisma.$transaction(async (tx) => {
            // Mark existing schedule versions as inactive
            await tx.scheduleVersion.updateMany({
                where: { placementDriveId, isCurrent: true },
                data: { isCurrent: false },
            });

            // Find highest version number
            const lastVersion = await tx.scheduleVersion.findFirst({
                where: { placementDriveId },
                orderBy: { versionNumber: 'desc' },
            });

            const nextVersionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;

            // Create new schedule version
            return tx.scheduleVersion.create({
                data: {
                    placementDriveId,
                    versionNumber: nextVersionNumber,
                    isCurrent: true,
                    triggerReason,
                },
            });
        });

        let totalRequested = 0;
        let totalScheduled = 0;
        const unscheduledBreakdown: UnscheduledReason[] = [];

        // 3. Iterative Scheduling Engine
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
                    const failureReasonsForCandidate: string[] = [];

                    // Search available time-slots, rooms, and panels
                    slotLoop: for (const slot of timeSlots) {
                        for (const room of drive.rooms) {
                            for (const panel of drive.panels) {
                                const proposed = {
                                    scheduleVersionId: newVersion.id,
                                    studentId: student.id,
                                    companyId: company.id,
                                    roundId: round.id,
                                    roomId: room.id,
                                    panelId: panel.id,
                                    startTime: slot.start,
                                    endTime: slot.end,
                                };

                                // Validate against ConflictEngine
                                const conflictCheck = await ConflictEngine.validateAssignment(proposed);

                                if (!conflictCheck.hasConflict) {
                                    // Persist assignment
                                    await prisma.interviewAssignment.create({
                                        data: proposed,
                                    });

                                    totalScheduled++;
                                    isAssigned = true;
                                    break slotLoop; // Successfully scheduled, move to next student
                                } else {
                                    failureReasonsForCandidate.push(...conflictCheck.reasons);
                                }
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
                            reasons: Array.from(new Set(failureReasonsForCandidate)), // Deduplicate reasons
                        });
                    }
                }
            }
        }

        const totalUnscheduled = totalRequested - totalScheduled;
        const metrics: GenerationMetrics = {
            totalRequested,
            totalScheduled,
            totalUnscheduled,
            scheduledPercentage: totalRequested > 0 ? Number(((totalScheduled / totalRequested) * 100).toFixed(2)) : 0,
            unscheduledBreakdown,
        };

        return {
            version: newVersion,
            metrics,
        };
    }
}