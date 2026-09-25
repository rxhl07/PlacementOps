import { z } from 'zod';

export const createDriveSchema = z.object({
    name: z.string().min(1, 'Drive name is required'),
    academicYear: z.string().min(1, 'Academic year is required'),
    startDate: z.string().datetime({ message: 'Invalid start date ISO string' }),
    endDate: z.string().datetime({ message: 'Invalid end date ISO string' }),
});

export const updateDriveSchema = createDriveSchema.partial().extend({
    isActive: z.boolean().optional(),
});