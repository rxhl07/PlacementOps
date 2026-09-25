import { z } from 'zod';
import { Role } from '@prisma/client';

export const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    role: z.nativeEnum(Role).default(Role.STUDENT),
    // If role is STUDENT:
    name: z.string().min(1, 'Name is required'),
    rollNumber: z.string().optional(),
    branch: z.string().optional(),
    cgpa: z.number().min(0).max(10).optional(),
    graduationYear: z.number().int().optional(),
});

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});