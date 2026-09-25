import { prisma } from '../../config/prisma';
import { AppError } from '../../common/errors';

export class DrivesService {
    static async createDrive(data: {
        name: string;
        academicYear: string;
        startDate: string;
        endDate: string;
    }) {
        return prisma.placementDrive.create({
            data: {
                name: data.name,
                academicYear: data.academicYear,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
            },
        });
    }

    static async getAllDrives() {
        return prisma.placementDrive.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: {
                        companies: true,
                        rooms: true,
                        panels: true,
                    },
                },
            },
        });
    }

    static async getDriveById(id: string) {
        const drive = await prisma.placementDrive.findUnique({
            where: { id },
            include: {
                companies: true,
                rooms: true,
                panels: true,
            },
        });

        if (!drive) {
            throw new AppError('Placement Drive not found', 404);
        }

        return drive;
    }
}