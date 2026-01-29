import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { buildApp } from '@/app';
import { prisma } from '@/utils/database';
import { LeadStage } from '@prisma/client';
import dayjs from 'dayjs';

describe('Public CRM Integration', () => {
    let app: any;
    let organizationId: string;
    let leadId: string;
    let courseId: string;
    let turretId: string;
    let lessonId: string;
    let instructorId: string;
    let martialArtId: string;

    beforeAll(async () => {
        console.log('Starting Setup...');
        app = await buildApp();
        await app.ready();

        // 1. Setup Organization
        const org = await prisma.organization.create({
            data: {
                name: 'Test Public Org',
                slug: `test-public-org-${Date.now()}`,
                primaryColor: '#000000',
                secondaryColor: '#ffffff'
            }
        });
        organizationId = org.id;
        console.log('Org created:', organizationId);

        // 2. Setup Instructor User
        console.log('Creating Instructor User...');
        try {
            const instructor = await prisma.user.create({
                data: {
                    email: `instr-${Date.now()}@test.com`,
                    password: 'password',
                    firstName: 'Sensei',
                    lastName: 'Test',
                    role: 'INSTRUCTOR',
                    organizationId,
                    isActive: true
                }
            });
            instructorId = instructor.id;
            console.log('Instructor created:', instructorId);
        } catch (e) {
            console.error('Error creating instructor:', e);
            throw e;
        }

        // 3. Setup Course & Martial Art
        const ma = await prisma.martialArt.create({
            data: {
                name: 'Krav Maga',
                organizationId
            }
        });
        martialArtId = ma.id;

        const course = await prisma.course.create({
            data: {
                name: 'Defesa Pessoal',
                organizationId,
                description: 'Curso de teste',
                duration: 60,
                totalClasses: 10,
                level: 'BEGINNER',
                martialArtId: ma.id,
                prerequisites: [],
                objectives: [],
                requirements: []
            }
        });
        courseId = course.id;

        // 4. Setup Turma (Class Group)
        const turma = await prisma.turma.create({
            data: {
                name: 'Turma A',
                organizationId,
                courseId,
                instructorId,
                startDate: new Date(),
                schedule: [],
                classType: 'COLLECTIVE'
            }
        });
        turretId = turma.id;

        // 5. Setup TurmaLesson (Specific Class Session)
        const lesson = await prisma.turmaLesson.create({
            data: {
                turmaId: turma.id,
                lessonNumber: 1,
                title: 'Aula 1',
                scheduledDate: dayjs().add(1, 'day').hour(19).minute(0).toDate(),
                duration: 60,
                status: 'SCHEDULED'
            }
        });
        lessonId = lesson.id;

        // 6. Setup Lead
        const lead = await prisma.lead.create({
            data: {
                organizationId,
                name: 'Public Booking Lead',
                email: `lead-${Date.now()}@test.com`,
                phone: '11988887777',
                stage: LeadStage.NEW,
                tags: []
            }
        });
        leadId = lead.id;
        console.log('Setup Complete');
    });

    afterAll(async () => {
        // Cleanup
        await prisma.turmaLesson.deleteMany({ where: { turma: { organizationId } } });
        await prisma.turma.deleteMany({ where: { organizationId } });
        await prisma.lead.deleteMany({ where: { organizationId } });
        await prisma.course.deleteMany({ where: { organizationId } });
        await prisma.martialArt.deleteMany({ where: { organizationId } });
        await prisma.user.deleteMany({ where: { organizationId } });
        await prisma.organization.deleteMany({ where: { id: organizationId } });
    });

    it('should fetch lead info publicly', async () => {
        const res = await request(app)
            .get(`/lp/crm/info/${leadId}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe('Public Booking Lead');
        expect(res.body.data.organization.primaryColor).toBe('#000000');
    });

    it('should list available classes for trial', async () => {
        const res = await request(app)
            .get(`/lp/crm/classes`)
            .query({ leadId }); // Use leadId to auto-detect org

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        const dateKey = dayjs().add(1, 'day').format('YYYY-MM-DD');
        expect(res.body.data[dateKey]).toBeDefined();
        expect(res.body.data[dateKey][0].courseName).toBe('Defesa Pessoal');
        expect(res.body.data[dateKey][0].modality).toBe('Krav Maga');
    });

    it('should book a trial class PUBLICLY', async () => {
        const res = await request(app)
            .post('/lp/crm/book')
            .send({
                leadId,
                classId: lessonId,
                date: dayjs().add(1, 'day').hour(19).minute(0).toDate()
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        // Verify Lead Stage Update
        const updatedLead = await prisma.lead.findUnique({ where: { id: leadId } });
        expect(updatedLead?.stage).toBe(LeadStage.TRIAL_SCHEDULED);
    });
});
