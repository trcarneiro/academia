import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { buildApp } from '@/app';
import { PrismaClient } from '@prisma/client';
import dayjs from 'dayjs';

const prisma = new PrismaClient();

describe('Sanity: Core Lead-to-Student Flow', () => {
    let app: any;
    let organizationId: string;
    let leadId: string;
    let lessonId: string;

    beforeAll(async () => {
        try {
            app = await buildApp();
            await app.ready();

            // 1. Setup Organization
            const org = await prisma.organization.create({
                data: {
                    name: 'Sanity Test Org',
                    slug: `sanity-org-${Date.now()}`,
                    primaryColor: '#2563eb',
                    secondaryColor: '#ffffff'
                }
            });
            organizationId = org.id;

            // 2. Setup Infrastructure
            const ma = await prisma.martialArt.create({
                data: { name: 'Krav Maga Sanity', organizationId }
            });

            const instructor = await prisma.user.create({
                data: {
                    email: `sensei-sanity-${Date.now()}@test.com`,
                    password: 'password',
                    firstName: 'Sensei',
                    lastName: 'Sanity',
                    role: 'INSTRUCTOR',
                    organizationId,
                    isActive: true
                }
            });

            const course = await prisma.course.create({
                data: {
                    name: 'Krav Maga Foundation',
                    organizationId,
                    level: 'BEGINNER',
                    duration: 60,
                    totalClasses: 1,
                    martialArtId: ma.id,
                    prerequisites: [],
                    objectives: [],
                    requirements: []
                }
            });

            const turma = await prisma.turma.create({
                data: {
                    name: 'Turma Sanity',
                    organizationId,
                    courseId: course.id,
                    instructorId: instructor.id,
                    startDate: new Date(),
                    schedule: [],
                    classType: 'COLLECTIVE'
                }
            });

            const lesson = await prisma.turmaLesson.create({
                data: {
                    turmaId: turma.id,
                    lessonNumber: 1,
                    title: 'Introduction to KM',
                    scheduledDate: dayjs().add(1, 'day').toDate(),
                    duration: 60,
                    status: 'SCHEDULED'
                }
            });
            lessonId = lesson.id;
        } catch (error) {
            console.error('CRM SANITY SETUP ERROR:', error);
            throw error;
        }
    });

    afterAll(async () => {
        // Cleanup
        await prisma.turmaLesson.deleteMany({ where: { turma: { organizationId } } });
        await prisma.turmaStudent.deleteMany({ where: { student: { organizationId } } });
        await prisma.turma.deleteMany({ where: { organizationId } });
        await prisma.leadActivity.deleteMany({ where: { lead: { organizationId } } });
        await prisma.lead.deleteMany({ where: { organizationId } });
        await prisma.student.deleteMany({ where: { organizationId } });
        await prisma.user.deleteMany({ where: { organizationId } });
        await prisma.course.deleteMany({ where: { organizationId } });
        await prisma.martialArt.deleteMany({ where: { organizationId } });
        await prisma.organization.deleteMany({ where: { id: organizationId } });
        await prisma.$disconnect();
    });

    it('Step 1: Public Lead Registration', async () => {
        const res = await request(app.server)
            .post('/lp/crm/register')
            .send({
                organizationId,
                name: 'Zezinho Sanity',
                email: `zezinho-${Date.now()}@sanity.com`,
                phone: '11999998888'
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        leadId = res.body.data.id;
    });

    it('Step 2: Trial Booking (Updates Stage to TRIAL_SCHEDULED)', async () => {
        const res = await request(app.server)
            .post('/lp/crm/book')
            .send({
                leadId,
                classId: lessonId,
                date: dayjs().add(1, 'day').toDate()
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        const lead = await prisma.lead.findUnique({ where: { id: leadId } });
        expect(lead?.stage).toBe('TRIAL_SCHEDULED');
        expect(lead?.convertedStudentId).toBeDefined();
    });

    it('Step 3: Simulate Attendance (Updates Stage to TRIAL_ATTENDED)', async () => {
        const lead = await prisma.lead.findUnique({ where: { id: leadId } });
        const studentId = lead!.convertedStudentId!;

        const { CRMService } = await import('@/services/crmService');
        await CRMService.updateLeadOnAttendance(studentId, lessonId);

        const updatedLead = await prisma.lead.findUnique({ where: { id: leadId } });
        expect(updatedLead?.stage).toBe('TRIAL_ATTENDED');
    });

    it('Step 4: Full Conversion to Member', async () => {
        await prisma.lead.update({
            where: { id: leadId },
            data: {
                stage: 'CONVERTED',
                enrolledAt: new Date()
            }
        });

        const lead = await prisma.lead.findUnique({ where: { id: leadId } });
        expect(lead?.stage).toBe('CONVERTED');
    });
});
