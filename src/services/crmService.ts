import { prisma } from '@/utils/database';
import { LeadStage, LeadStatus, LeadActivityType, UserRole } from '@prisma/client';
import { logger } from '@/utils/logger';
import { FastifyRequest } from 'fastify';

export class CRMService {
    /**
     * Generates a link for the lead to book a trial class
     */
    static async generateTrialLink(leadId: string) {
        // In a real app, this would be a signed URL or token
        // For now, we return a simple direct link
        return `https://app.smartdefence.com.br/public/schedule-trial?leadId=${leadId}`;
    }

    /**
     * Generates a link for the lead to checkout/purchase a plan
     */
    static async generatePurchaseLink(leadId: string, planId?: string) {
        let url = `https://app.smartdefence.com.br/public/checkout?leadId=${leadId}`;
        if (planId) {
            url += `&planId=${planId}`;
        }
        return url;
    }

    /**
     * Books a trial class for a lead.
     * This involves:
     * 1. Ensuring the lead exists.
     * 2. Creating a temporary/shadow Student record if not exists.
     * 3. Enrolling the student in the class (or TurmaLesson).
     * 4. Updating Lead stage to TRIAL_SCHEDULED.
     */
    static async bookTrial(leadId: string, classId: string, date: Date, organizationId: string) {
        const lead = await prisma.lead.findUnique({ where: { id: leadId } });
        if (!lead) throw new Error('Lead not found');

        // 1. Create or Find User/Student for this Lead
        let student = await prisma.student.findFirst({
            where: { convertedFromLead: { id: leadId } }
        });

        if (lead.convertedStudentId) {
            student = await prisma.student.findUnique({ where: { id: lead.convertedStudentId } });
        }

        if (!student) {
            // Create or find Shadow User & Student
            // We use email from lead
            const existingUser = await prisma.user.findFirst({
                where: { email: lead.email },
                include: { student: true }
            });

            let studentId: string;

            if (existingUser) {
                if (existingUser.student) {
                    studentId = existingUser.student.id;
                } else {
                    const newStudent = await prisma.student.create({
                        data: {
                            organization: { connect: { id: organizationId } },
                            user: { connect: { id: existingUser.id } },
                            enrollmentDate: new Date(),
                            isActive: true,
                            specialNeeds: {},
                            preferredDays: [],
                            preferredTimes: []
                        }
                    });
                    studentId = newStudent.id;
                }
            } else {
                const user = await prisma.user.create({
                    data: {
                        organization: { connect: { id: organizationId } },
                        email: lead.email,
                        firstName: lead.name.split(' ')[0],
                        lastName: lead.name.split(' ').slice(1).join(' ') || '',
                        role: UserRole.STUDENT,
                        password: 'temp-trial-password',
                        isActive: true
                    }
                });
                const newStudent = await prisma.student.create({
                    data: {
                        organization: { connect: { id: organizationId } },
                        user: { connect: { id: user.id } },
                        enrollmentDate: new Date(),
                        isActive: true,
                        specialNeeds: {},
                        preferredDays: [],
                        preferredTimes: []
                    }
                });
                studentId = newStudent.id;
            }

            // Link Lead to Student
            await prisma.lead.update({
                where: { id: leadId },
                data: { convertedStudentId: studentId }
            });

            // Re-fetch student object for later use
            student = await prisma.student.findUnique({ where: { id: studentId } });
        }

        if (!student) throw new Error('Failed to identify or create student');

        // 2. Enroll in Class (TurmaLesson)
        const lesson = await prisma.turmaLesson.findUnique({
            where: { id: classId },
            include: { turma: true }
        });

        if (!lesson) throw new Error('Lesson not found');

        // Check if already enrolled
        const existingEnrollment = await prisma.turmaStudent.findUnique({
            where: { turmaId_studentId: { turmaId: lesson.turmaId, studentId: student.id } }
        });

        if (!existingEnrollment) {
            await prisma.turmaStudent.create({
                data: {
                    student: { connect: { id: student.id } },
                    turma: { connect: { id: lesson.turmaId } },
                    status: 'ACTIVE',
                    isActive: true
                }
            });
        }

        // 3. Update Lead Stage
        await prisma.lead.update({
            where: { id: leadId },
            data: {
                stage: LeadStage.TRIAL_SCHEDULED,
                trialScheduledAt: new Date()
            }
        });

        // 4. Log Activity
        await prisma.leadActivity.create({
            data: {
                leadId,
                userId: student.userId, // Assigned to self/system?
                type: 'MEETING' as any,
                title: 'Aula Experimental Agendada',
                description: `Aula agendada para ${date.toISOString()}`,
                scheduledFor: date
            }
        });

        return { success: true, studentId: student.id };
    }

    /**
     * Called by AttendanceService when a student checks in.
     * If the student is a Lead in TRIAL_SCHEDULED, move to TRIAL_ATTENDED.
     */
    static async updateLeadOnAttendance(studentId: string, classId: string) {
        try {
            // Find lead linked to this student
            const lead = await prisma.lead.findUnique({
                where: { convertedStudentId: studentId }
            });

            if (!lead) return;

            if (lead.stage === LeadStage.TRIAL_SCHEDULED || lead.stage === LeadStage.NEW || lead.stage === LeadStage.CONTACTED) {

                logger.info(`[CRM] Updating Lead ${lead.id} to TRIAL_ATTENDED after check-in`);

                await prisma.lead.update({
                    where: { id: lead.id },
                    data: {
                        stage: LeadStage.TRIAL_ATTENDED,
                        trialAttendedAt: new Date()
                    }
                });

                await prisma.leadActivity.create({
                    data: {
                        leadId: lead.id,
                        userId: lead.assignedToId || 'system', // TODO: User ID handling
                        type: 'MEETING' as any, // or similar
                        title: 'Aula Experimental Realizada',
                        description: 'Lead realizou check-in na aula experimental.'
                    }
                });

                // Optional: Trigger notification/automation
            }
        } catch (error) {
            logger.error({ error, studentId }, 'Error updating lead on attendance');
        }
    }
}
