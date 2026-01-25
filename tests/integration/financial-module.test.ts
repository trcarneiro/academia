import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { app } from '../../src/server';

const prisma = new PrismaClient();

describe('Financial Module Integration Tests', () => {
    let testStudent: any;
    let testPlan: any;
    let testOrganization: any;

    beforeEach(async () => {
        // Create test organization
        testOrganization = await prisma.organization.create({
            data: {
                name: 'Test Organization',
                slug: `test-org-financial-${Date.now()}`
            }
        });

        // Create test data
        testStudent = await prisma.student.create({
            data: {
                id: `test-student-fin-${Date.now()}`,
                category: 'ADULT',
                organization: { connect: { id: testOrganization.id } },
                user: {
                    create: {
                        firstName: 'Test',
                        lastName: 'Student',
                        email: `test.financial.${Date.now()}@example.com`,
                        phone: '(11) 99999-9999',
                        password: 'test123',
                        organizationId: testOrganization.id
                    }
                },
                specialNeeds: [],
                preferredDays: [],
                preferredTimes: []
            },
            include: {
                user: true
            }
        });

        testPlan = await prisma.billingPlan.create({
            data: {
                name: 'Test Plan',
                description: 'Test plan for financial module',
                price: 99.99,
                billingType: 'MONTHLY',
                category: 'ADULT',
                isActive: true,
                organizationId: testOrganization.id
            }
        });
    });

    describe('Billing Plans API', () => {
        it('should list all billing plans', async () => {
            const response = await request(app)
                .get('/api/billing-plans')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
        });

        it('should get billing plan by ID', async () => {
            const response = await request(app)
                .get(`/api/billing-plans/${testPlan.id}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(testPlan.id);
            expect(response.body.data.name).toBe(testPlan.name);
        });

        it('should create a new billing plan', async () => {
            const newPlan = {
                name: 'New Test Plan',
                description: 'New test plan',
                price: 149.99,
                billingType: 'MONTHLY',
                category: 'ADULT',
                isActive: true
            };

            const response = await request(app)
                .post('/api/billing-plans')
                .send(newPlan)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe(newPlan.name);
            expect(response.body.data.price).toBe(newPlan.price);

            // Clean up
            await prisma.billingPlan.delete({
                where: { id: response.body.data.id }
            });
        });

        it('should update a billing plan', async () => {
            const updateData = {
                name: 'Updated Test Plan',
                price: 129.99
            };

            const response = await request(app)
                .put(`/api/billing-plans/${testPlan.id}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe(updateData.name);
            expect(response.body.data.price).toBe(updateData.price);
        });

        it('should delete a billing plan', async () => {
            const tempPlan = await prisma.billingPlan.create({
                data: {
                    name: 'Temp Plan',
                    description: 'Temp plan for deletion test',
                    price: 79.99,
                    billingType: 'MONTHLY',
                    category: 'ADULT',
                    isActive: true,
                    organizationId: testOrganization.id
                }
            });

            const response = await request(app)
                .delete(`/api/billing-plans/${tempPlan.id}`)
                .expect(200);

            expect(response.body.success).toBe(true);

            const deletedPlan = await prisma.billingPlan.findUnique({
                where: { id: tempPlan.id }
            });
            expect(deletedPlan).toBeNull();
        });
    });

    describe('Student Subscriptions API', () => {
        it('should list student subscriptions', async () => {
            // Create a subscription first
            await prisma.studentSubscription.create({
                data: {
                    studentId: testStudent.id,
                    planId: testPlan.id,
                    startDate: new Date(),
                    status: 'ACTIVE'
                }
            });

            const response = await request(app)
                .get(`/api/students/${testStudent.id}/subscriptions`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.data.length).toBe(1);
            expect(response.body.data[0].planId).toBe(testPlan.id);
        });

        it('should create a new subscription', async () => {
            const subscriptionData = {
                planId: testPlan.id,
                startDate: new Date().toISOString()
            };

            const response = await request(app)
                .post(`/api/students/${testStudent.id}/subscriptions`)
                .send(subscriptionData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.studentId).toBe(testStudent.id);
            expect(response.body.data.planId).toBe(testPlan.id);
            expect(response.body.data.status).toBe('ACTIVE');
        });

        it('should not create duplicate active subscriptions', async () => {
            // Create first subscription
            await prisma.studentSubscription.create({
                data: {
                    studentId: testStudent.id,
                    planId: testPlan.id,
                    startDate: new Date(),
                    status: 'ACTIVE'
                }
            });

            const subscriptionData = {
                planId: testPlan.id,
                startDate: new Date().toISOString()
            };

            const response = await request(app)
                .post(`/api/students/${testStudent.id}/subscriptions`)
                .send(subscriptionData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('already has an active subscription');
        });

        it('should cancel a subscription', async () => {
            const subscription = await prisma.studentSubscription.create({
                data: {
                    studentId: testStudent.id,
                    planId: testPlan.id,
                    startDate: new Date(),
                    status: 'ACTIVE'
                }
            });

            const response = await request(app)
                .delete(`/api/students/${testStudent.id}/subscriptions/${subscription.id}`)
                .expect(200);

            expect(response.body.success).toBe(true);

            const updatedSubscription = await prisma.studentSubscription.findUnique({
                where: { id: subscription.id }
            });
            expect(updatedSubscription?.status).toBe('CANCELLED');
        });

        it('should get subscription details', async () => {
            const subscription = await prisma.studentSubscription.create({
                data: {
                    studentId: testStudent.id,
                    planId: testPlan.id,
                    startDate: new Date(),
                    status: 'ACTIVE',
                    currentPrice: 99.99
                },
                include: {
                    plan: true
                }
            });

            const response = await request(app)
                .get(`/api/students/${testStudent.id}/subscriptions/${subscription.id}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(subscription.id);
            expect(response.body.data.plan).toBeDefined();
        });
    });

    describe('Financial Data Validation', () => {
        it('should validate subscription data', async () => {
            const invalidSubscription = {
                planId: 'invalid-plan-id',
                startDate: 'invalid-date'
            };

            const response = await request(app)
                .post(`/api/students/${testStudent.id}/subscriptions`)
                .send(invalidSubscription)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBeDefined();
        });

        it('should handle non-existent student', async () => {
            const subscriptionData = {
                planId: testPlan.id,
                startDate: new Date().toISOString()
            };

            const response = await request(app)
                .post('/api/students/non-existent-student/subscriptions')
                .send(subscriptionData)
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should handle non-existent plan', async () => {
            const subscriptionData = {
                planId: 'non-existent-plan',
                startDate: new Date().toISOString()
            };

            const response = await request(app)
                .post(`/api/students/${testStudent.id}/subscriptions`)
                .send(subscriptionData)
                .expect(404);

            expect(response.body.success).toBe(false);
        });
    });

    describe('Payment Processing', () => {
        it('should record payment for subscription', async () => {
            const subscription = await prisma.studentSubscription.create({
                data: {
                    studentId: testStudent.id,
                    planId: testPlan.id,
                    startDate: new Date(),
                    status: 'ACTIVE'
                }
            });

            const paymentData = {
                amount: 99.99,
                paymentDate: new Date().toISOString(),
                paymentMethod: 'CREDIT_CARD',
                status: 'PAID'
            };

            const response = await request(app)
                .post(`/api/subscriptions/${subscription.id}/payments`)
                .send(paymentData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.amount).toBe(paymentData.amount);
            expect(response.body.data.status).toBe('PAID');
        });

        it('should get payment history for student', async () => {
            const subscription = await prisma.studentSubscription.create({
                data: {
                    studentId: testStudent.id,
                    planId: testPlan.id,
                    startDate: new Date(),
                    status: 'ACTIVE'
                }
            });

            await prisma.payment.create({
                data: {
                    subscriptionId: subscription.id,
                    amount: 99.99,
                    paymentDate: new Date(),
                    paymentMethod: 'CREDIT_CARD',
                    status: 'PAID'
                }
            });

            const response = await request(app)
                .get(`/api/students/${testStudent.id}/payments`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.data.length).toBeGreaterThan(0);
        });
    });
});
