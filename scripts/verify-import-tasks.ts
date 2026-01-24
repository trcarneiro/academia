
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    console.log('--- Verification Started ---');

    // Check total students
    const students = await prisma.student.count();
    console.log(`Total students in DB: ${students}`);

    // Check for users with temp email
    const tempEmailUsers = await prisma.user.count({
        where: {
            email: {
                endsWith: '@asaas-import.temp'
            }
        }
    });
    console.log(`Users with temp email (@asaas-import.temp): ${tempEmailUsers}`);

    // Check if AgentTasks were created for these users
    const tasks = await prisma.agentTask.count({
        where: {
            category: 'ENROLLMENT',
            actionType: 'UPDATE_RECORD',
            title: 'Atualizar Email de Aluno Importado'
        }
    });
    console.log(`Email update tasks created (Category: ENROLLMENT): ${tasks}`);

    // List a few recent tasks to verify details
    if (tasks > 0) {
        const recentTasks = await prisma.agentTask.findMany({
            where: {
                category: 'ENROLLMENT',
                actionType: 'UPDATE_RECORD',
                title: 'Atualizar Email de Aluno Importado'
            },
            take: 3,
            orderBy: {
                createdAt: 'desc'
            }
        });
        console.log('Recent 3 tasks:', JSON.stringify(recentTasks, null, 2));
    } else {
        console.log('No Email Update tasks found.');
    }

    const sampleStudent = await prisma.student.findFirst({
        where: {
            medicalConditions: {
                contains: 'Imported from Asaas'
            }
        }
    });

    if (sampleStudent) {
        console.log('Sample Imported Student:', {
            id: sampleStudent.id,
            medicalConditions: sampleStudent.medicalConditions,
            preferredDays: sampleStudent.preferredDays,
            preferredTimes: sampleStudent.preferredTimes
        });
    } else {
        console.log('No student found with "Imported from Asaas" in medicalConditions');
    }

    console.log('--- Verification Completed ---');
}

check()
    .catch(e => {
        console.error('Verification Failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
