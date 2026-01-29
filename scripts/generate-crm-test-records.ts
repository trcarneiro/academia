import { PrismaClient, LeadStage, LeadStatus, LeadTemperature, UserRole } from '@prisma/client';
import { CRMService } from '../src/services/crmService';

const prisma = new PrismaClient();

const ORG_ID = 'ad74071d-6e09-4900-8492-02ce594566de';
const USER_ID = '3bec925f-9d96-49f7-b58b-1387b5d9e316';

async function generateData() {
    console.log('--- Generating CRM Test Data ---');

    const lessons = await prisma.turmaLesson.findMany({
        where: { turma: { organizationId: ORG_ID } },
        take: 5
    });

    if (lessons.length === 0) {
        console.error('No lessons found for this organization. Please create lessons first.');
        return;
    }

    const testLeads = [
        { name: 'Joao Novo 1', stage: LeadStage.NEW },
        { name: 'Joao Novo 2', stage: LeadStage.NEW },
        { name: 'Maria Contato 1', stage: LeadStage.CONTACTED },
        { name: 'Maria Contato 2', stage: LeadStage.CONTACTED },
        { name: 'Ricardo Agendado 1', stage: LeadStage.TRIAL_SCHEDULED },
        { name: 'Ricardo Agendado 2', stage: LeadStage.TRIAL_SCHEDULED },
        { name: 'Fernanda Compareceu 1', stage: LeadStage.TRIAL_ATTENDED },
        { name: 'Fernanda Compareceu 2', stage: LeadStage.TRIAL_ATTENDED },
        { name: 'Lucas Convertido', stage: LeadStage.CONVERTED },
    ];

    for (const leadData of testLeads) {
        const email = `${leadData.name.toLowerCase().replace(/ /g, '.')}@test.com`;

        // Delete if exists
        await prisma.lead.deleteMany({ where: { email } });

        const lead = await prisma.lead.create({
            data: {
                organizationId: ORG_ID,
                name: leadData.name,
                email: email,
                phone: '(11) 98888-' + Math.floor(1000 + Math.random() * 9000),
                stage: leadData.stage,
                status: LeadStatus.ACTIVE,
                temperature: LeadTemperature.WARM,
                assignedToId: USER_ID,
                tags: ['TEST_DATA']
            }
        });

        console.log(`Created Lead: ${lead.name} [${lead.stage}]`);

        // If TRIAL_SCHEDULED or further, perform booking
        if (leadData.stage === LeadStage.TRIAL_SCHEDULED || leadData.stage === LeadStage.TRIAL_ATTENDED || leadData.stage === LeadStage.CONVERTED) {
            const lesson = lessons[Math.floor(Math.random() * lessons.length)];
            console.log(`  Booking trial for ${lead.name} in lesson ${lesson.id}`);
            await CRMService.bookTrial(lead.id, lesson.id, lesson.scheduledDate, ORG_ID);

            // Re-fetch lead to get studentId
            const updatedLead = await prisma.lead.findUnique({ where: { id: lead.id } });
            console.log(`  Updated Lead student ID: ${updatedLead?.convertedStudentId}`);

            if (leadData.stage === LeadStage.TRIAL_ATTENDED || leadData.stage === LeadStage.CONVERTED) {
                if (!updatedLead?.convertedStudentId) {
                    throw new Error(`Lead ${lead.id} has no studentId after booking`);
                }
                console.log(`  Simulating attendance for ${lead.name} (Student: ${updatedLead.convertedStudentId})`);
                await CRMService.updateLeadOnAttendance(updatedLead.convertedStudentId, lesson.id);
            }

            if (leadData.stage === LeadStage.CONVERTED) {
                console.log(`  Converting ${lead.name} to Student`);
                await prisma.lead.update({
                    where: { id: lead.id },
                    data: {
                        stage: LeadStage.CONVERTED,
                        enrolledAt: new Date()
                    }
                });
            }
        }
    }

    console.log('--- Data Generation Complete ---');
}

generateData()
    .catch(e => {
        const fs = require('fs');
        const err = {
            message: e.message,
            stack: e.stack,
            code: e.code,
            meta: e.meta
        };
        fs.writeFileSync('error-log.txt', JSON.stringify(err, null, 2));
        console.error('ERROR during generation. Check error-log.txt');
    })
    .finally(async () => await prisma.$disconnect());
