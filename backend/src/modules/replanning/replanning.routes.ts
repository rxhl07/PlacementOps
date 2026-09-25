import { Router, Request, Response, NextFunction } from 'express';
import { ReplanEngine } from './replan.engine';
import { validate } from '../../middleware/validate';
import { replanSchema } from './replanning.schema';
import { authenticate, authorize } from '../../middleware/auth';
import { Role, Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';

const router = Router();

// Trigger Dynamic Replanning for a Disruption Event
router.post(
    '/',
    authenticate,
    authorize(Role.ADMIN, Role.COORDINATOR),
    validate(replanSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await ReplanEngine.handleDisruption(req.body);
            res.status(200).json({ success: true, data: result });
        } catch (err) {
            next(err);
        }
    }
);

// Fetch Schedule Diff between versions
router.get(
    '/diff/:newVersionId',
    authenticate,
    async (req: Request<{ newVersionId: string }>, res: Response, next: NextFunction) => {
        try {
            const diffs = await prisma.scheduleDiff.findMany({
                where: { newScheduleVersionId: req.params.newVersionId },
            });
            res.status(200).json({ success: true, data: diffs });
        } catch (err) {
            next(err);
        }
    }
);

export default router;