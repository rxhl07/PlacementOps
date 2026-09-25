import { Router, Request, Response, NextFunction } from 'express';
import { SchedulesService } from './schedule.service';
import { authenticate, authorize } from '../../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

// Trigger full schedule generation for a drive
router.post(
    '/generate/:driveId',
    authenticate,
    authorize(Role.ADMIN, Role.COORDINATOR),
    async (req: Request<{ driveId: string }>, res: Response, next: NextFunction) => {
        try {
            const result = await SchedulesService.generateDriveSchedule(req.params.driveId);
            res.status(201).json({
                success: true,
                data: result,
            });
        } catch (err) {
            next(err);
        }
    }
);

// Fetch current active schedule
router.get(
    '/active/:driveId',
    authenticate,
    async (req: Request<{ driveId: string }>, res: Response, next: NextFunction) => {
        try {
            const schedule = await SchedulesService.getActiveSchedule(req.params.driveId);
            res.status(200).json({ success: true, data: schedule });
        } catch (err) {
            next(err);
        }
    }
);

export default router;