import { Router, Request, Response, NextFunction } from 'express';
import { CompaniesService } from './companies.service';
import { validate } from '../../middleware/validate';
import { createCompanySchema, createRoundSchema } from './companies.schema';
import { authenticate, authorize } from '../../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.post(
    '/',
    authenticate,
    authorize(Role.ADMIN, Role.COORDINATOR),
    validate(createCompanySchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const company = await CompaniesService.createCompany(req.body);
            res.status(201).json({ success: true, data: company });
        } catch (err) {
            next(err);
        }
    }
);

router.post(
    '/:id/rounds',
    authenticate,
    authorize(Role.ADMIN, Role.COORDINATOR),
    validate(createRoundSchema),
    async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
        try {
            const round = await CompaniesService.addRoundToCompany(req.params.id, req.body);
            res.status(201).json({ success: true, data: round });
        } catch (err) {
            next(err);
        }
    }
);

router.get('/:id', authenticate, async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
        const company = await CompaniesService.getCompanyDetails(req.params.id);
        res.status(200).json({ success: true, data: company });
    } catch (err) {
        next(err);
    }
});

export default router;