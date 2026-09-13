import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { prisma } from './config/prisma';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Deep health check verifying PostgreSQL connection
app.get('/health', async (_req: Request, res: Response, next: NextFunction) => {
    try {
        // Executes a simple ping query through Prisma
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

const server = app.listen(PORT, () => {
    console.log(`PlacementOps Backend running on http://localhost:${PORT}`);
});

process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(async () => {
        await prisma.$disconnect();
        console.log('HTTP server closed, database disconnected');
        process.exit(0);
    });
});

export default app;