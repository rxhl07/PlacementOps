import { z } from 'zod';

export const createAssignmentSchema = z.object({
    scheduleVersionId: z.string().uuid(),
    studentId: z.string().uuid(),
    companyId: z.string().uuid(),
    roundId: z.string().uuid(),
    roomId: z.string().uuid(),
    panelId: z.string().uuid(),
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
});