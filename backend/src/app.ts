import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { prisma } from './config/prisma';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './modules/auth/auth.routes';
import drivesRoutes from './modules/drives/drives.routes';
import companiesRoutes from './modules/companies/companies.routes';
import resourcesRoutes from './modules/resources/resources.routes';
import interviewsRoutes from './modules/interviews/interviews.routes';
import schedulesRoutes from './modules/schedules/schedule.routes';
import replanningRoutes from './modules/replanning/replanning.routes';

export const createApp = () => {
    const app = express();

    app.use(helmet());
    app.use(cors());
    app.use(express.json());

    app.use('/api/auth', authRoutes);
    app.use('/api/drives', drivesRoutes);
    app.use('/api/companies', companiesRoutes);
    app.use('/api/resources', resourcesRoutes);
    app.use('/api/interviews', interviewsRoutes);
    app.use('/api/schedules', schedulesRoutes);
    app.use('/api/replans', replanningRoutes);

    // Deep health check verifying PostgreSQL connection
    app.get('/health', async (_req: Request, res: Response, next: NextFunction) => {
        try {
            await prisma.$queryRaw`SELECT 1`;
            res.status(200).json({
                status: 'UP',
                timestamp: new Date().toISOString(),
                database: 'CONNECTED',
            });
        } catch (error) {
            next(error);
        }
    });

    // Register global error handler
    app.use(errorHandler);

    return app;
};

export default createApp;
