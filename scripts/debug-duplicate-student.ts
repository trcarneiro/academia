
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    console.log('--- Searching for Records ---');
    const searchTerm = 'Kellem';
    const cpfSearch = '068226896'; // Partial search provided by user

    // Find users by name or CPF
    const users = await prisma.user.findMany({
        where: {
            OR: [
                { firstName: { contains: searchTerm } },
                { lastName: { contains: searchTerm } },
                { cpf: { contains: cpfSearch } }
            ]
        },
        include: {
            student: {
                include: {
                    _count: {
                        select: {
                            attendances: true,
                            subscriptions: true,
                        }
                    }
                }
            }
        }
    });

    console.log(`Found ${users.length} matching users/students:`);

    for (const user of users) {
        console.log(`\nUser ID: ${user.id}`);
        console.log(`Name: ${user.firstName} ${user.lastName}`);
        console.log(`Email: ${user.email}`);
        console.log(`CPF: ${user.cpf}`);
        console.log(`Role: ${user.role}`);
        console.log(`Active: ${user.isActive}`);
        console.log(`Created At: ${user.createdAt.toISOString()}`);

        if (user.student) {
            console.log(`Student ID: ${user.student.id}`);
            console.log(`Counts: Attendances=${user.student._count.attendances}, Subscriptions=${user.student._count.subscriptions}`);

            // Check for AgentTasks related to this student
            // We fetch them and manually filter to avoid complex query errors if any
            const tasks = await prisma.agentTask.findMany({
                where: {
                    targetEntity: 'Student',
                    status: 'PENDING'
                },
                take: 100
            });

            const relatedTasks = tasks.filter(t => {
                const payload = t.actionPayload as any;
                return payload && payload.studentId === user.student?.id;
            });

            console.log(`Pending AgentTasks: ${relatedTasks.length}`);
        } else {
            console.log('No associated Student record.');
        }
    }

    console.log('--- Search Completed ---');
}

check()
    .catch(e => {
        console.error('Search Failed:', e);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
