import { Router, Request, Response, NextFunction } from 'express';
import { InterviewsService } from './interviews.service';
import { validate } from '../../middleware/validate';
import { createAssignmentSchema } from './interviews.schema';
import { authenticate, authorize } from '../../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

// Create single assignment manually (with strict conflict checking)
router.post(
    '/',
    authenticate,
    authorize(Role.ADMIN, Role.COORDINATOR),
    validate(createAssignmentSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const assignment = await InterviewsService.createAssignment({
                scheduleVersionId: req.body.scheduleVersionId,
                studentId: req.body.studentId,
                companyId: req.body.companyId,
                roundId: req.body.roundId,
                roomId: req.body.roomId,
                panelId: req.body.panelId,
                startTime: new Date(req.body.startTime),
                endTime: new Date(req.body.endTime),
            });

            res.status(201).json({ success: true, data: assignment });
        } catch (err) {
            next(err);
        }
    }
);

// Fetch active schedule assignments for a Placement Drive
router.get(
    '/drive/:driveId',
    authenticate,
    async (req: Request<{ driveId: string }>, res: Response, next: NextFunction) => {
        try {
            const versionNumber = req.query.version ? Number(req.query.version) : undefined;
            const schedule = await InterviewsService.getScheduleForDrive(req.params.driveId, versionNumber);
            res.status(200).json({ success: true, data: schedule });
        } catch (err) {
            next(err);
        }
    }
);

export default router;