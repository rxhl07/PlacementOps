import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../common/errors';

export class AuthService {
    static async register(data: {
        email: string;
        password: string;
        role: Role;
        name: string;
        rollNumber?: string;
        branch?: string;
        cgpa?: number;
        graduationYear?: number;
    }) {
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) {
            throw new AppError('Email is already registered.', 409);
        }

        const passwordHash = await bcrypt.hash(data.password, 10);

        // Run inside transaction to atomically create User and associated Student profile
        const user = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    email: data.email,
                    passwordHash,
                    role: data.role,
                },
            });

            if (data.role === Role.STUDENT) {
                if (!data.rollNumber || !data.branch || data.cgpa === undefined || !data.graduationYear) {
                    throw new AppError('Missing required student profile fields.', 400);
                }

                await tx.student.create({
                    data: {
                        userId: newUser.id,
                        name: data.name,
                        rollNumber: data.rollNumber,
                        branch: data.branch,
                        cgpa: data.cgpa,
                        graduationYear: data.graduationYear,
                    },
                });
            }

            return newUser;
        });

        return {
            id: user.id,
            email: user.email,
            role: user.role,
        };
    }

    static async login(email: string, password: string) {
        const user = await prisma.user.findUnique({
            where: { email },
            include: { student: true, companyCoordinator: true },
        });

        if (!user) {
            throw new AppError('Invalid credentials.', 401);
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            throw new AppError('Invalid credentials.', 401);
        }

        const secret = process.env.JWT_SECRET || 'fallback_secret';
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            secret,
            { expiresIn: '7d' }
        );

        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                student: user.student,
                companyCoordinator: user.companyCoordinator,
            },
        };
    }
}