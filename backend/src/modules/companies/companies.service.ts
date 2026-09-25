import { prisma } from '../../config/prisma';
import { AppError } from '../../common/errors';
import { CompanyPriority } from '@prisma/client';

export class CompaniesService {
    static async createCompany(data: {
        placementDriveId: string;
        name: string;
        priority: CompanyPriority;
        minimumCgpa: number;
        eligibleBranches: string[];
        expectedArrival: string;
        expectedDeparture: string;
    }) {
        return prisma.company.create({
            data: {
                placementDriveId: data.placementDriveId,
                name: data.name,
                priority: data.priority,
                minimumCgpa: data.minimumCgpa,
                eligibleBranches: data.eligibleBranches,
                expectedArrival: new Date(data.expectedArrival),
                expectedDeparture: new Date(data.expectedDeparture),
            },
        });
    }

    static async addRoundToCompany(
        companyId: string,
        data: {
            name: string;
            sequenceOrder: number;
            durationMinutes: number;
            requiredPanelCount: number;
        }
    ) {
        const company = await prisma.company.findUnique({ where: { id: companyId } });
        if (!company) {
            throw new AppError('Company not found', 404);
        }

        return prisma.companyRound.create({
            data: {
                companyId,
                name: data.name,
                sequenceOrder: data.sequenceOrder,
                durationMinutes: data.durationMinutes,
                requiredPanelCount: data.requiredPanelCount,
            },
        });
    }

    static async getCompanyDetails(id: string) {
        const company = await prisma.company.findUnique({
            where: { id },
            include: {
                rounds: { orderBy: { sequenceOrder: 'asc' } },
                shortlists: { include: { student: true } },
            },
        });

        if (!company) {
            throw new AppError('Company not found', 404);
        }

        return company;
    }
}