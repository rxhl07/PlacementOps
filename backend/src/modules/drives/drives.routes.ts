import { Router, Request, Response, NextFunction } from 'express';
import { DrivesService } from './drives.service';
import { validate } from '../../middleware/validate';
import { createDriveSchema } from './drives.schema';
import { authenticate, authorize } from '../../middleware/auth';
import { Role } from '@prisma/client';
import { prisma } from '../../config/prisma';

const router = Router();

router.post(
    '/',
    authenticate,
    authorize(Role.ADMIN, Role.COORDINATOR),
    validate(createDriveSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const drive = await DrivesService.createDrive(req.body);
            res.status(201).json({ success: true, data: drive });
        } catch (err) {
            next(err);
        }
    }
);

router.post(
    '/:id/schedule-versions',
    authenticate,
    authorize(Role.ADMIN, Role.COORDINATOR),
    async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
        try {
            const scheduleVersion = await prisma.scheduleVersion.create({
                data: {
                    placementDriveId: req.params.id,
                    versionNumber: 1,
                    isCurrent: true,
                    triggerReason: 'Initial Schedule Version',
                },
            });
            res.status(201).json({ success: true, data: scheduleVersion });
        } catch (err) {
            next(err);
        }
    }
);

router.get('/', authenticate, async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const drives = await DrivesService.getAllDrives();
        res.status(200).json({ success: true, data: drives });
    } catch (err) {
        next(err);
    }
});

router.get('/:id', authenticate, async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
        const drive = await DrivesService.getDriveById(req.params.id);
        res.status(200).json({ success: true, data: drive });
    } catch (err) {
        next(err);
    }
});

export default router;