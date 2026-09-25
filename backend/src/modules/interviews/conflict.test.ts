import supertest from 'supertest';
import app from '../../server';
import { prisma } from '../../config/prisma';

const request = supertest(app);

describe('Health & Auth Integration Tests', () => {
    afterAll(async () => {
        await prisma.$disconnect();
    });

    it('GET /health - should return HTTP 200 with CONNECTED status', async () => {
        const res = await request.get('/health');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('UP');
        expect(res.body.database).toBe('CONNECTED');
    });

    it('POST /api/auth/login - should fail with invalid credentials', async () => {
        const res = await request.post('/api/auth/login').send({
            email: 'nonexistent@campus.edu',
            password: 'wrongpassword',
        });
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
    });
});