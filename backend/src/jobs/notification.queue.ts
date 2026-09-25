import { Queue, Worker, Job } from 'bullmq';
import { redis } from '../config/redis';

export const NOTIFICATION_QUEUE_NAME = 'notification-queue';

export interface NotificationJobData {
    userId?: string;
    email?: string;
    title: string;
    message: string;
    type: 'SCHEDULE_CHANGE' | 'REPLAN_NOTICE' | 'DISRUPTION_ALERT';
}

// Initialize BullMQ Queue
export const notificationQueue = new Queue<NotificationJobData>(NOTIFICATION_QUEUE_NAME, {
    connection: redis,
});

// Worker to process notification jobs asynchronously
export const notificationWorker = new Worker<NotificationJobData>(
    NOTIFICATION_QUEUE_NAME,
    async (job: Job<NotificationJobData>) => {
        console.log(`[Notification Worker] Processing job ${job.id} for type ${job.data.type}`);
        console.log(`[Notification Payload]: ${job.data.title} - ${job.data.message}`);

        // Here notification triggers (In-App DB write or Email dispatch) are processed
        await new Promise((resolve) => setTimeout(resolve, 100));
    },
    { connection: redis }
);

notificationWorker.on('completed', (job) => {
    console.log(`[Notification Worker] Job ${job.id} completed successfully`);
});

notificationWorker.on('failed', (job, err) => {
    console.error(`[Notification Worker] Job ${job?.id} failed:`, err.message);
});