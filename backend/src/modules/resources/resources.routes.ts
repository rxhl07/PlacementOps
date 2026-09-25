import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { authenticate, authorize } from '../../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

// Create Room
router.post(
    '/rooms',
    authenticate,
    authorize(Role.ADMIN, Role.COORDINATOR),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const room = await prisma.room.create({
                data: {
                    placementDriveId: req.body.placementDriveId,
                    name: req.body.name,
                    type: req.body.type,
                    capacity: req.body.capacity,
                },
            });
            res.status(201).json({ success: true, data: room });
        } catch (err) {
            next(err);
        }
    }
);

// Create Panel
router.post(
    '/panels',
    authenticate,
    authorize(Role.ADMIN, Role.COORDINATOR),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const panel = await prisma.panel.create({
                data: {
                    placementDriveId: req.body.placementDriveId,
                    name: req.body.name,
                    specialization: req.body.specialization,
                },
            });
            res.status(201).json({ success: true, data: panel });
        } catch (err) {
            next(err);
        }
    }
);

export default router;