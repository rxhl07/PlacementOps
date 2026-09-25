import { ScheduleGenerator } from './schedule.generator';
import { prisma } from '../../config/prisma';
import { AppError } from '../../common/errors';

export class SchedulesService {
    static async generateDriveSchedule(placementDriveId: string) {
        const drive = await prisma.placementDrive.findUnique({ where: { id: placementDriveId } });
        if (!drive) {
            throw new AppError('Placement Drive not found', 404);
        }

        return ScheduleGenerator.generateSchedule(placementDriveId, 'Manual Coordinator Trigger');
    }

    static async getActiveSchedule(placementDriveId: string) {
        const currentVersion = await prisma.scheduleVersion.findFirst({
            where: { placementDriveId, isCurrent: true },
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

        if (!currentVersion) {
            throw new AppError('No active schedule found for this drive. Run generator first.', 404);
        }

        return currentVersion;
    }
}