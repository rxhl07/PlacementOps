import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

// Fetch student schedule and assignments across the active schedule version
router.get('/:id/schedule', authenticate, async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
        const studentId = req.params.id;

        // Find the current active schedule version for any active drive
        const activeVersion = await prisma.scheduleVersion.findFirst({
            where: { isCurrent: true },
            orderBy: { createdAt: 'desc' },
        });

        if (!activeVersion) {
            res.status(200).json({ success: true, data: [] });
            return;
        }

        // Fetch all interview assignments for this specific student in the active version
        const assignments = await prisma.interviewAssignment.findMany({
            where: {
                studentId: studentId,
                scheduleVersionId: activeVersion.id,
            },
            include: {
                company: true,
                round: true,
                room: true,
                panel: true,
            },
            orderBy: { startTime: 'asc' },
        });

        res.status(200).json({ success: true, data: assignments });
    } catch (err) {
        next(err);
    }
});

export default router;