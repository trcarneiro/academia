import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { buildApp } from '@/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Sanity: Financial Lifecycle', () => {
    let app: any;
    let organizationId: string;
    let studentId: string;

    beforeAll(async () => {
        try {
            app = await buildApp();
            await app.ready();

            // Setup Org and Student
            const org = await prisma.organization.create({
                data: {
                    name: 'Financial Sanity Org',
                    slug: `fin-sanity-${Date.now()}`,
                }
            });
            organizationId = org.id;

            const user = await prisma.user.create({
                data: {
                    email: `student-fin-${Date.now()}@test.com`,
                    password: 'password',
                    firstName: 'Financial',
                    lastName: 'Student',
                    organizationId,
                    isActive: true
                }
            });

            const student = await prisma.student.create({
                data: {
                    organizationId,
                    userId: user.id,
                    specialNeeds: {},
                    preferredDays: [],
                    preferredTimes: []
                }
            });
            studentId = student.id;
        } catch (error) {
            console.error('BEFORE ALL ERROR:', error);
            throw error;
        }
    });

    afterAll(async () => {
        await prisma.payment.deleteMany({ where: { organizationId } });
        await prisma.student.deleteMany({ where: { organizationId } });
        await prisma.user.deleteMany({ where: { organizationId } });
        await prisma.organization.deleteMany({ where: { id: organizationId } });
        await prisma.$disconnect();
    });

    it('Step 1: Create local payment record', async () => {
        const payment = await prisma.payment.create({
            data: {
                organizationId,
                studentId,
                amount: 199.90,
                status: 'PENDING',
                paymentMethod: 'PIX',
                description: 'Mensalidade KM',
                dueDate: new Date()
            }
        });

        expect(payment.id).toBeDefined();
        expect(payment.amount.toString()).toBe("199.9");
    });

    it('Step 2: Update payment status (Simulated Webhook)', async () => {
        const payment = await prisma.payment.findFirst({
            where: { studentId, status: 'PENDING' }
        });

        const updated = await prisma.payment.update({
            where: { id: payment!.id },
            data: {
                status: 'PAID',
                paidDate: new Date()
            }
        });

        expect(updated.status).toBe('PAID');
        expect(updated.paidDate).not.toBeNull();
    });
});
