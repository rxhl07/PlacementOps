import { prisma } from '../../config/prisma';

export interface ProposedAssignment {
    studentId: string;
    companyId: string;
    roundId: string;
    roomId: string;
    panelId: string;
    startTime: Date;
    endTime: Date;
    scheduleVersionId: string;
    excludeAssignmentId?: string; // Optional: used when evaluating updates/replans for an existing assignment
}

export interface ConflictResult {
    hasConflict: boolean;
    reasons: string[];
}

export class ConflictEngine {
    /**
     * Helper function to detect time window overlaps.
     * Two intervals [A_start, A_end) and [B_start, B_end) overlap if:
     * A_start < B_end AND A_end > B_start
     */
    private static isOverlapping(startA: Date, endA: Date, startB: Date, endB: Date): boolean {
        return startA < endB && endA > startB;
    }

    static async validateAssignment(proposed: ProposedAssignment): Promise<ConflictResult> {
        const reasons: string[] = [];

        // 1. Validate Company Operating Hours Window
        const company = await prisma.company.findUnique({
            where: { id: proposed.companyId },
        });

        if (!company) {
            reasons.push(`Company with ID ${proposed.companyId} does not exist.`);
        } else {
            const arrival = company.actualArrival || company.expectedArrival;
            if (proposed.startTime < arrival || proposed.endTime > company.expectedDeparture) {
                reasons.push(
                    `Company Operating Window Conflict: Interview (${proposed.startTime.toISOString()} - ${proposed.endTime.toISOString()}) falls outside company availability (${arrival.toISOString()} - ${company.expectedDeparture.toISOString()}).`
                );
            }
        }

        // 2. Validate Student Shortlist & Status
        const student = await prisma.student.findUnique({
            where: { id: proposed.studentId },
            include: {
                shortlists: {
                    where: { companyId: proposed.companyId },
                },
            },
        });

        if (!student) {
            reasons.push(`Student with ID ${proposed.studentId} does not exist.`);
        } else {
            if (student.status === 'WITHDRAWN') {
                reasons.push(`Student Status Conflict: Student ${student.name} has WITHDRAWN from placement drives.`);
            }
            if (student.shortlists.length === 0) {
                reasons.push(`Student Shortlist Conflict: Student ${student.name} is not shortlisted by company ${company?.name || proposed.companyId}.`);
            }
        }

        // Fetch active assignments in this schedule version excluding the target assignment if updating
        const existingAssignments = await prisma.interviewAssignment.findMany({
            where: {
                scheduleVersionId: proposed.scheduleVersionId,
                status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
                ...(proposed.excludeAssignmentId ? { id: { not: proposed.excludeAssignmentId } } : {}),
                OR: [
                    { studentId: proposed.studentId },
                    { roomId: proposed.roomId },
                    { panelId: proposed.panelId },
                ],
            },
        });

        // 3. Check Overlapping Student Assignments
        const studentConflict = existingAssignments.find(
            (a) =>
                a.studentId === proposed.studentId &&
                this.isOverlapping(proposed.startTime, proposed.endTime, a.startTime, a.endTime)
        );
        if (studentConflict) {
            reasons.push(
                `Student Schedule Conflict: Student is already assigned to an interview from ${studentConflict.startTime.toISOString()} to ${studentConflict.endTime.toISOString()}.`
            );
        }

        // 4. Check Overlapping Room Assignments
        const roomConflict = existingAssignments.find(
            (a) =>
                a.roomId === proposed.roomId &&
                this.isOverlapping(proposed.startTime, proposed.endTime, a.startTime, a.endTime)
        );
        if (roomConflict) {
            reasons.push(
                `Room Schedule Conflict: Room is already booked for an interview from ${roomConflict.startTime.toISOString()} to ${roomConflict.endTime.toISOString()}.`
            );
        }

        // 5. Check Overlapping Panel Assignments
        const panelConflict = existingAssignments.find(
            (a) =>
                a.panelId === proposed.panelId &&
                this.isOverlapping(proposed.startTime, proposed.endTime, a.startTime, a.endTime)
        );
        if (panelConflict) {
            reasons.push(
                `Panel Schedule Conflict: Panel is already assigned to an interview from ${panelConflict.startTime.toISOString()} to ${panelConflict.endTime.toISOString()}.`
            );
        }

        // 6. Check Explicit Room and Panel Unavailability Overrides
        const roomUnavailabilities = await prisma.roomAvailability.findMany({
            where: {
                roomId: proposed.roomId,
                isAvailable: false,
            },
        });

        const roomUnavail = roomUnavailabilities.find((u) =>
            this.isOverlapping(proposed.startTime, proposed.endTime, u.startTime, u.endTime)
        );
        if (roomUnavail) {
            reasons.push(`Room Unavailability Conflict: Room is explicitly marked unavailable during this slot.`);
        }

        const panelUnavailabilities = await prisma.panelAvailability.findMany({
            where: {
                panelId: proposed.panelId,
                isAvailable: false,
            },
        });

        const panelUnavail = panelUnavailabilities.find((u) =>
            this.isOverlapping(proposed.startTime, proposed.endTime, u.startTime, u.endTime)
        );
        if (panelUnavail) {
            reasons.push(`Panel Unavailability Conflict: Panel is explicitly marked unavailable during this slot.`);
        }

        return {
            hasConflict: reasons.length > 0,
            reasons,
        };
    }
}