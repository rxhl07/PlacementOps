import { prisma } from '../../config/prisma';
import { AppError } from '../../common/errors';

export class ShortlistsService {
    static async addStudentToShortlist(studentId: string, companyId: string) {
        const student = await prisma.student.findUnique({ where: { id: studentId } });
        const company = await prisma.company.findUnique({ where: { id: companyId } });

        if (!student || !company) {
            throw new AppError('Student or Company not found', 404);
        }

        // Validate CGPA cutoff
        if (student.cgpa.toNumber() < company.minimumCgpa.toNumber()) {
            throw new AppError(
                `Eligibility Violation: Student CGPA (${student.cgpa}) is below company cutoff (${company.minimumCgpa})`,
                422
            );
        }

        // Validate Branch eligibility
        if (
            company.eligibleBranches.length > 0 &&
            !company.eligibleBranches.includes(student.branch)
        ) {
            throw new AppError(
                `Eligibility Violation: Student branch '${student.branch}' is not in company eligible branches [${company.eligibleBranches.join(', ')}]`,
                422
            );
        }

        return prisma.studentCompanyShortlist.create({
            data: {
                studentId,
                companyId,
            },
        });
    }
}