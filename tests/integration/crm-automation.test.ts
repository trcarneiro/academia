
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/server';
import { prisma } from '../../src/utils/database';
import { LeadStage, UserRole } from '@prisma/client';
import { CRMService } from '../../src/services/crmService';

describe('CRM Automation Integration', () => {
    let leadId: string;
    let studentId: string;
    let classId: string;
    let organizationId: string;

    beforeAll(async () => {
        // Setup Organization
        const org = await prisma.organization.create({
            data: {
                name: 'CRM Test Org',
                slug: `crm-test-org-${Date.now()}`,
                isActive: true
            }
        });
        organizationId = org.id;

        // Setup Turma/Class for trial
        const course = await prisma.course.create({
            data: {
                organizationId,
                name: 'Jiu Jitsu Trial',
                totalClasses: 10,
                duration: 60,
                level: 'BEGINNER',
                category: 'ADULT',
                prerequisites: [],
                objectives: [],
                requirements: []
            }
        });

        const instructorUser = await prisma.user.create({
            data: {
                organizationId,
                email: `instr-${Date.now()}@test.com`,
                firstName: 'Sensei',
                lastName: 'Test',
                role: UserRole.INSTRUCTOR,
                password: 'password'
            }
        });

        const instructor = await prisma.instructor.create({
            data: {
                organizationId,
                userId: instructorUser.id,
                specializations: [],
                certifications: [],
                martialArts: [],
                preferredUnits: []
            }
        });
        console.log('Org:', org.id);
        console.log('Course:', course.id);
        console.log('User:', instructorUser.id);
        console.log('Instructor Obj:', instructor);
        console.log('Instructor ID:', instructor.id);

        const verify = await prisma.instructor.findUnique({ where: { id: instructor.id } });
        console.log('Verify Instructor in DB:', verify);

        const turma = await prisma.turma.create({
            data: {
                organizationId,
                courseId: course.id,
                instructorId: instructorUser.id,
                name: 'Turma Trial 1',
                maxStudents: 10,
                startDate: new Date(),
                endDate: new Date(),
                isActive: true,
                schedule: []
            }
        });

        const lesson = await prisma.turmaLesson.create({
            data: {
                turmaId: turma.id,
                scheduledDate: new Date(),
                status: 'SCHEDULED',
                duration: 60,
                lessonNumber: 1,
                title: 'Trial Lesson 1'
            }
        });
        classId = lesson.id;
    });

    afterAll(async () => {
        // Cleanup based on organizationId cascade ideally, or manual
        await prisma.organization.delete({ where: { id: organizationId } }).catch(() => { });
    });

    it('should create a lead', async () => {
        const res = await request(app)
            .post('/api/crm/leads')
            .set('x-organization-id', organizationId)
            .send({
                name: 'Trial Lead',
                email: `trial-lead-${Date.now()}@test.com`,
                phone: '11999999999',
                stage: LeadStage.NEW
            });

        expect(res.status).toBe(201);
        expect(res.body.data.id).toBeDefined();
        leadId = res.body.data.id;
    });

    it('should generate a trial link', async () => {
        const res = await request(app)
            .get(`/api/crm/leads/${leadId}/trial-link`);

        expect(res.status).toBe(200);
        expect(res.body.link).toContain(leadId);
    });

    it('should book a trial class', async () => {
        const res = await request(app)
            .post(`/api/crm/leads/${leadId}/book-trial`)
            .set('x-organization-id', organizationId)
            .send({
                classId,
                date: new Date().toISOString()
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        // Verify lead stage updated
        const updatedLead = await prisma.lead.findUnique({ where: { id: leadId } });
        expect(updatedLead?.stage).toBe(LeadStage.TRIAL_SCHEDULED);
        expect(updatedLead?.convertedStudentId).toBeDefined();

        studentId = updatedLead?.convertedStudentId!;
    });

    it('should update lead stage to TRIAL_ATTENDED after check-in', async () => {
        // Simulate check-in
        const res = await request(app)
            .post('/api/attendance/checkin')
            .send({
                studentId, // Kiosk mode
                classId,
                method: 'MANUAL',
                location: 'Reception'
            });

        expect(res.status).toBe(201);

        // Verify lead stage updated (async operation, might need delay if real queue, but direct call here)
        // Wait a small bit since the CRM update is unawaited in controller (catch block)
        await new Promise(r => setTimeout(r, 1000));

        const updatedLead = await prisma.lead.findUnique({ where: { id: leadId } });
        expect(updatedLead?.stage).toBe(LeadStage.TRIAL_ATTENDED);
        expect(updatedLead?.trialAttendedAt).toBeDefined();
    });
});
