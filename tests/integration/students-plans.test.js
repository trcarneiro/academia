const request = require('supertest');
const { app } = require('../../servers/working-server');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('Students and Plans Integration Tests', () => {
    let testOrganization;
    let testStudent;
    let testPlan;
    let testCourse;

    beforeAll(async () => {
        // Create test organization
        testOrganization = await prisma.organization.create({
            data: {
                name: 'Test Organization Students Plans',
                slug: 'test-org-students-plans-' + Date.now()
            }
        });

        // Create test course
        testCourse = await prisma.course.create({
            data: {
                name: 'Test Course',
                description: 'Test course for students and plans',
                level: 'BEGINNER',
                duration: 12,
                organizationId: testOrganization.id
            }
        });

        // Create test plan
        testPlan = await prisma.billingPlan.create({
            data: {
                name: 'Test Student Plan',
                description: 'Test plan for students',
                price: 89.90,
                billingType: 'MONTHLY',
                category: 'ADULT',
                isActive: true,
                organizationId: testOrganization.id
            }
        });
    });

    afterAll(async () => {
        // Clean up test data in reverse order
        await prisma.payment.deleteMany({
            where: { subscription: { student: { organizationId: testOrganization.id } } }
        });
        await prisma.subscription.deleteMany({
            where: { student: { organizationId: testOrganization.id } }
        });
        await prisma.studentCourse.deleteMany({
            where: { student: { organizationId: testOrganization.id } }
        });
        await prisma.student.deleteMany({
            where: { organizationId: testOrganization.id }
        });
        await prisma.user.deleteMany({
            where: { organizationId: testOrganization.id }
        });
        await prisma.billingPlan.deleteMany({
            where: { organizationId: testOrganization.id }
        });
        await prisma.course.deleteMany({
            where: { organizationId: testOrganization.id }
        });
        await prisma.organization.delete({
            where: { id: testOrganization.id }
        });
        await prisma.$disconnect();
    });

    beforeEach(async () => {
        // Clean students before each test
        await prisma.student.deleteMany({
            where: { organizationId: testOrganization.id }
        });
    });

    describe('Student Management', () => {
        it('should create a new student with user', async () => {
            const studentData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe.' + Date.now() + '@example.com',
                phone: '(11) 98765-4321',
                category: 'ADULT',
                dateOfBirth: '1990-01-15',
                emergencyContact: '(11) 91234-5678',
                healthInfo: 'No allergies',
                notes: 'Test student'
            };

            const response = await request(app)
                .post('/api/students')
                .send(studentData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user.firstName).toBe(studentData.firstName);
            expect(response.body.data.user.email).toBe(studentData.email);
            expect(response.body.data.category).toBe(studentData.category);
        });

        it('should list all students', async () => {
            // Create test students
            await prisma.student.create({
                data: {
                    id: 'test-student-1-' + Date.now(),
                    category: 'ADULT',
                    organizationId: testOrganization.id,
                    user: {
                        create: {
                            firstName: 'Alice',
                            lastName: 'Smith',
                            email: 'alice.' + Date.now() + '@example.com',
                            phone: '(11) 11111-1111',
                            password: 'test123',
                            organizationId: testOrganization.id
                        }
                    }
                }
            });

            await prisma.student.create({
                data: {
                    id: 'test-student-2-' + Date.now(),
                    category: 'CHILD',
                    organizationId: testOrganization.id,
                    user: {
                        create: {
                            firstName: 'Bob',
                            lastName: 'Johnson',
                            email: 'bob.' + Date.now() + '@example.com',
                            phone: '(11) 22222-2222',
                            password: 'test123',
                            organizationId: testOrganization.id
                        }
                    }
                }
            });

            const response = await request(app)
                .get('/api/students')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThanOrEqual(2);
        });

        it('should get student by ID', async () => {
            const student = await prisma.student.create({
                data: {
                    id: 'test-student-get-' + Date.now(),
                    category: 'ADULT',
                    organizationId: testOrganization.id,
                    user: {
                        create: {
                            firstName: 'Test',
                            lastName: 'Student',
                            email: 'test.get.' + Date.now() + '@example.com',
                            phone: '(11) 33333-3333',
                            password: 'test123',
                            organizationId: testOrganization.id
                        }
                    }
                },
                include: {
                    user: true
                }
            });

            const response = await request(app)
                .get(`/api/students/${student.id}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(student.id);
            expect(response.body.data.user.firstName).toBe('Test');
        });

        it('should update student information', async () => {
            const student = await prisma.student.create({
                data: {
                    id: 'test-student-update-' + Date.now(),
                    category: 'ADULT',
                    organizationId: testOrganization.id,
                    user: {
                        create: {
                            firstName: 'Original',
                            lastName: 'Name',
                            email: 'original.' + Date.now() + '@example.com',
                            phone: '(11) 44444-4444',
                            password: 'test123',
                            organizationId: testOrganization.id
                        }
                    }
                }
            });

            const updateData = {
                firstName: 'Updated',
                lastName: 'Name',
                phone: '(11) 55555-5555',
                emergencyContact: '(11) 99999-9999',
                healthInfo: 'Updated health info'
            };

            const response = await request(app)
                .put(`/api/students/${student.id}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user.firstName).toBe('Updated');
            expect(response.body.data.user.phone).toBe('(11) 55555-5555');
        });

        it('should delete a student', async () => {
            const student = await prisma.student.create({
                data: {
                    id: 'test-student-delete-' + Date.now(),
                    category: 'ADULT',
                    organizationId: testOrganization.id,
                    user: {
                        create: {
                            firstName: 'Delete',
                            lastName: 'Me',
                            email: 'delete.' + Date.now() + '@example.com',
                            phone: '(11) 66666-6666',
                            password: 'test123',
                            organizationId: testOrganization.id
                        }
                    }
                }
            });

            const response = await request(app)
                .delete(`/api/students/${student.id}`)
                .expect(200);

            expect(response.body.success).toBe(true);

            const deletedStudent = await prisma.student.findUnique({
                where: { id: student.id }
            });
            expect(deletedStudent).toBeNull();
        });
    });

    describe('Student Course Enrollment', () => {
        it('should enroll student in a course', async () => {
            const student = await prisma.student.create({
                data: {
                    id: 'test-student-enroll-' + Date.now(),
                    category: 'ADULT',
                    organizationId: testOrganization.id,
                    user: {
                        create: {
                            firstName: 'Enroll',
                            lastName: 'Student',
                            email: 'enroll.' + Date.now() + '@example.com',
                            phone: '(11) 77777-7777',
                            password: 'test123',
                            organizationId: testOrganization.id
                        }
                    }
                }
            });

            const enrollmentData = {
                courseId: testCourse.id,
                enrollmentDate: new Date().toISOString(),
                status: 'ACTIVE'
            };

            const response = await request(app)
                .post(`/api/students/${student.id}/courses`)
                .send(enrollmentData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.studentId).toBe(student.id);
            expect(response.body.data.courseId).toBe(testCourse.id);
            expect(response.body.data.status).toBe('ACTIVE');
        });

        it('should list student courses', async () => {
            const student = await prisma.student.create({
                data: {
                    id: 'test-student-courses-' + Date.now(),
                    category: 'ADULT',
                    organizationId: testOrganization.id,
                    user: {
                        create: {
                            firstName: 'Course',
                            lastName: 'Student',
                            email: 'course.' + Date.now() + '@example.com',
                            phone: '(11) 88888-8888',
                            password: 'test123',
                            organizationId: testOrganization.id
                        }
                    }
                }
            });

            await prisma.studentCourse.create({
                data: {
                    studentId: student.id,
                    courseId: testCourse.id,
                    enrollmentDate: new Date(),
                    status: 'ACTIVE'
                }
            });

            const response = await request(app)
                .get(`/api/students/${student.id}/courses`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBe(1);
            expect(response.body.data[0].courseId).toBe(testCourse.id);
        });
    });

    describe('Student Plan Subscription', () => {
        it('should subscribe student to a billing plan', async () => {
            const student = await prisma.student.create({
                data: {
                    id: 'test-student-subscribe-' + Date.now(),
                    category: 'ADULT',
                    organizationId: testOrganization.id,
                    user: {
                        create: {
                            firstName: 'Subscribe',
                            lastName: 'Student',
                            email: 'subscribe.' + Date.now() + '@example.com',
                            phone: '(11) 99999-9999',
                            password: 'test123',
                            organizationId: testOrganization.id
                        }
                    }
                }
            });

            const subscriptionData = {
                planId: testPlan.id,
                startDate: new Date().toISOString()
            };

            const response = await request(app)
                .post(`/api/students/${student.id}/subscriptions`)
                .send(subscriptionData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.studentId).toBe(student.id);
            expect(response.body.data.planId).toBe(testPlan.id);
            expect(response.body.data.status).toBe('ACTIVE');
        });

        it('should get student subscription details', async () => {
            const student = await prisma.student.create({
                data: {
                    id: 'test-student-sub-details-' + Date.now(),
                    category: 'ADULT',
                    organizationId: testOrganization.id,
                    user: {
                        create: {
                            firstName: 'SubDetails',
                            lastName: 'Student',
                            email: 'subdetails.' + Date.now() + '@example.com',
                            phone: '(11) 00000-0000',
                            password: 'test123',
                            organizationId: testOrganization.id
                        }
                    }
                }
            });

            const subscription = await prisma.subscription.create({
                data: {
                    studentId: student.id,
                    planId: testPlan.id,
                    startDate: new Date(),
                    status: 'ACTIVE'
                },
                include: {
                    plan: true
                }
            });

            const response = await request(app)
                .get(`/api/students/${student.id}/subscriptions/${subscription.id}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(subscription.id);
            expect(response.body.data.plan).toBeDefined();
            expect(response.body.data.plan.name).toBe(testPlan.name);
        });
    });

    describe('Student Search and Filtering', () => {
        beforeEach(async () => {
            // Create test students for search
            await prisma.student.create({
                data: {
                    id: 'search-student-1-' + Date.now(),
                    category: 'ADULT',
                    organizationId: testOrganization.id,
                    user: {
                        create: {
                            firstName: 'John',
                            lastName: 'Smith',
                            email: 'john.smith.' + Date.now() + '@example.com',
                            phone: '(11) 11111-1111',
                            password: 'test123',
                            organizationId: testOrganization.id
                        }
                    }
                }
            });

            await prisma.student.create({
                data: {
                    id: 'search-student-2-' + Date.now(),
                    category: 'CHILD',
                    organizationId: testOrganization.id,
                    user: {
                        create: {
                            firstName: 'Jane',
                            lastName: 'Doe',
                            email: 'jane.doe.' + Date.now() + '@example.com',
                            phone: '(11) 22222-2222',
                            password: 'test123',
                            organizationId: testOrganization.id
                        }
                    }
                }
            });
        });

        it('should search students by name', async () => {
            const response = await request(app)
                .get('/api/students?search=John')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.some(s => s.user.firstName === 'John')).toBe(true);
        });

        it('should filter students by category', async () => {
            const response = await request(app)
                .get('/api/students?category=CHILD')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.every(s => s.category === 'CHILD')).toBe(true);
        });

        it('should combine search and filter', async () => {
            const response = await request(app)
                .get('/api/students?search=Jane&category=CHILD')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBe(1);
            expect(response.body.data[0].user.firstName).toBe('Jane');
            expect(response.body.data[0].category).toBe('CHILD');
        });
    });
});
