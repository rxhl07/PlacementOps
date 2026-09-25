import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny, ZodError, ZodIssue } from 'zod';
import { AppError } from '../common/errors';

export const validate = (schema: ZodTypeAny) => {
    return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
        try {
            req.body = await schema.parseAsync(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errorMessages = error.issues
                    .map((issue: ZodIssue) => `${issue.path.join('.')}: ${issue.message}`)
                    .join(', ');
                next(AppError.unprocessable(`Validation error: ${errorMessages}`));
            } else {
                next(error);
            }
        }
    };
};