import { z } from 'zod';
import { CompanyPriority } from '@prisma/client';

export const createCompanySchema = z.object({
    placementDriveId: z.string().uuid('Invalid Drive UUID'),
    name: z.string().min(1, 'Company name is required'),
    priority: z.nativeEnum(CompanyPriority).default(CompanyPriority.MEDIUM),
    minimumCgpa: z.number().min(0).max(10).default(0.0),
    eligibleBranches: z.array(z.string()).default([]),
    expectedArrival: z.string().datetime('Invalid expected arrival timestamp'),
    expectedDeparture: z.string().datetime('Invalid expected departure timestamp'),
});

export const createRoundSchema = z.object({
    name: z.string().min(1, 'Round name required'),
    sequenceOrder: z.number().int().min(1),
    durationMinutes: z.number().int().min(15),
    requiredPanelCount: z.number().int().min(1).default(1),
});