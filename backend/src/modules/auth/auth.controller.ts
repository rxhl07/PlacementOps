import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';

export class AuthController {
    static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await AuthService.register(req.body);
            res.status(201).json({
                success: true,
                data: result,
            });
        } catch (err) {
            next(err);
        }
    }

    static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { email, password } = req.body;
            const result = await AuthService.login(email, password);
            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (err) {
            next(err);
        }
    }

    static async me(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            res.status(200).json({
                success: true,
                data: req.user,
            });
        } catch (err) {
            next(err);
        }
    }
}