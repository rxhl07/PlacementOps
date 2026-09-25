import { prisma } from '../../config/prisma';
import { AppError } from '../../common/errors';
import { ConflictEngine, ProposedAssignment } from './conflict.engine';

export class InterviewsService {
    static async createAssignment(data: ProposedAssignment) {
        // 1. Validate through ConflictEngine
        const conflictResult = await ConflictEngine.validateAssignment(data);

        if (conflictResult.hasConflict) {
            throw new AppError(
                `Assignment Conflict Detected:\n- ${conflictResult.reasons.join('\n- ')}`,
                409
            );
        }

        // 2. Persist Interview Assignment
        return prisma.interviewAssignment.create({
            data: {
                scheduleVersionId: data.scheduleVersionId,
                studentId: data.studentId,
                companyId: data.companyId,
                roundId: data.roundId,
                roomId: data.roomId,
                panelId: data.panelId,
                startTime: data.startTime,
                endTime: data.endTime,
            },
        });
    }

    static async getScheduleForDrive(placementDriveId: string, versionNumber?: number) {
        // Fetch active schedule version if version number is not specified
        const scheduleVersion = await prisma.scheduleVersion.findFirst({
            where: {
                placementDriveId,
                ...(versionNumber !== undefined ? { versionNumber } : { isCurrent: true }),
            },
            include: {
                assignments: {
                    include: {
                        student: true,
                        company: true,
                        round: true,
                        room: true,
                        panel: true,
                    },
                    orderBy: { startTime: 'asc' },
                },
            },
        });

        if (!scheduleVersion) {
            throw new AppError('No schedule version found for this placement drive', 404);
        }

        return scheduleVersion;
    }
}