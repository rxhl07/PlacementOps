import { z } from 'zod';
import { DisruptionType } from '@prisma/client';

export const replanSchema = z.object({
    placementDriveId: z.string().uuid(),
    type: z.nativeEnum(DisruptionType),
    description: z.string().min(1, 'Description required'),
    companyId: z.string().uuid().optional(),
    panelId: z.string().uuid().optional(),
    roomId: z.string().uuid().optional(),
    studentId: z.string().uuid().optional(),
    delayMinutes: z.number().int().positive().optional(),
});