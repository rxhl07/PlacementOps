import { Request, Response, NextFunction } from 'express';
import { AppError } from '../common/errors';

export const errorHandler = (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            error: {
                message: err.message,
            },
        });
        return;
    }

    console.error('[Unhandled Error]:', err);
    res.status(500).json({
        success: false,
        error: {
            message: 'Internal server error',
        },
    });
};