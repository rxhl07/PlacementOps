import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { authenticate, authorize } from '../../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

// Fetch all registered user accounts with associated entity profiles
router.get('/', authenticate, authorize(Role.ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
                student: {
                    select: {
                        name: true,
                        rollNumber: true,
                        branch: true,
                    },
                },
                companyCoordinator: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.status(200).json({
            success: true,
            data: users,
        });
    } catch (err) {
        next(err);
    }
});

export default router;