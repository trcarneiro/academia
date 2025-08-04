const request = require('supertest');
const { app } = require('../../servers/working-server');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('Financial Module Simple Integration Tests', () => {
    let testStudent;
    let testPlan;
    let testOrganization;

    beforeAll(async () => {
        // Create test organization
        testOrganization = await prisma.organization.create({
            data: {
                name: 'Test Organization Financial',
                slug: 'test-org-financial-' + Date.now()
            }
        });

        // Create test student
        testStudent = await prisma.student.create({
            data: {
                id: 'test-student-fin-' + Date.now(),
                category: 'ADULT',
                organizationId: testOrganization.id,
                user: {
                    create: {
                        firstName: 'Test',
                        lastName: 'Student',
                        email: 'test.financial.' + Date.now() + '@example.com',
                        phone: '(11) 99999-9999',
                        password: 'test123',
                        organizationId: testOrganization.id
                    }
                }
            },
            include: {
                user: true
            }
        });

        // Create test billing plan
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

    afterAll(async () => {
        // Clean up test data
        await prisma.payment.deleteMany({
            where: { subscription: { studentId: testStudent.id } }
        });
        await prisma.subscription.deleteMany({
            where: { studentId: testStudent.id }
        });
        await prisma.billingPlan.deleteMany({
            where: { organizationId: testOrganization.id }
        });
        await prisma.student.deleteMany({
            where: { organizationId: testOrganization.id }
        });
        await prisma.user.deleteMany({
            where: { organizationId: testOrganization.id }
        });
        await prisma.organization.delete({
            where: { id: testOrganization.id }
        });
        await prisma.$disconnect();
    });

    beforeEach(async () => {
        // Clean subscriptions before each test
        await prisma.subscription.deleteMany({
            where: { studentId: testStudent.id }
        });
    });

    describe('GET /api/billing-plans', () => {
        it('should return all billing plans', async () => {
            const response = await request(app)
                .get('/api/billing-plans')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);
        });
    });

    describe('GET /api/billing-plans/:id', () => {
        it('should return a specific billing plan', async () => {
            const response = await request(app)
                .get(`/api/billing-plans/${testPlan.id}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(testPlan.id);
            expect(response.body.data.name).toBe(testPlan.name);
        });

        it('should return 404 for non-existent plan', async () => {
            const response = await request(app)
                .get('/api/billing-plans/non-existent-id')
                .expect(404);

            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/billing-plans', () => {
        it('should create a new billing plan', async () => {
            const newPlan = {
                name: 'New Test Plan',
                description: 'Test description',
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
    });

    describe('GET /api/students/:id/subscriptions', () => {
        it('should return student subscriptions', async () => {
            // Create a subscription
            await prisma.subscription.create({
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
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBe(1);
            expect(response.body.data[0].planId).toBe(testPlan.id);
        });
    });

    describe('POST /api/students/:id/subscriptions', () => {
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

        it('should prevent duplicate active subscriptions', async () => {
            // Create first subscription
            await prisma.subscription.create({
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
    });

    describe('DELETE /api/students/:studentId/subscriptions/:id', () => {
        it('should cancel a subscription', async () => {
            const subscription = await prisma.subscription.create({
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

            const updatedSubscription = await prisma.subscription.findUnique({
                where: { id: subscription.id }
            });
            expect(updatedSubscription.status).toBe('CANCELLED');
        });
    });

    describe('POST /api/subscriptions/:id/payments', () => {
        it('should record a payment for subscription', async () => {
            const subscription = await prisma.subscription.create({
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
    });

    describe('GET /api/students/:id/payments', () => {
        it('should get payment history for student', async () => {
            const subscription = await prisma.subscription.create({
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
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);
        });
    });
});
