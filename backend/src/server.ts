import dotenv from 'dotenv';
import { createApp } from './app';
import { prisma } from './config/prisma';

dotenv.config();

const PORT = process.env.PORT || 5000;
const app = createApp();

if (process.env.NODE_ENV !== 'test') {
    // Only register background worker when running the real server
    import('./jobs/notification.queue');

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
}

export default app;