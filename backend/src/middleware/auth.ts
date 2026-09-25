import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { AppError } from '../common/errors';

interface TokenPayload {
    id: string;
    email: string;
    role: Role;
}

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AppError('Authentication required. Missing or malformed token.', 401);
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'fallback_secret';

    try {
        const decoded = jwt.verify(token, secret) as TokenPayload;
        req.user = decoded;
        next();
    } catch (err) {
        throw new AppError('Invalid or expired token.', 401);
    }
};

export const authorize = (...allowedRoles: Role[]) => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        if (!req.user) {
            throw new AppError('Authentication required.', 401);
        }

        if (!allowedRoles.includes(req.user.role)) {
            throw new AppError('Forbidden: Insufficient role permissions.', 403);
        }

        next();
    };
};