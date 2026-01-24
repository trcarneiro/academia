
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fix() {
    console.log('--- Starting Cleanup of Duplicate Kellem Records ---');

    const duplicateUserIds = [
        '4f4cf659-7de9-48d7-b49b-9cf3513779b3', // Old import
        '54e5fc83-9aab-430b-bb4c-73eb86600981'  // New import
    ];

    for (const userId of duplicateUserIds) {
        console.log(`\nProcessing User ID: ${userId}`);

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                student: {
                    include: {
                        // Check relations via include to be safe
                        subscriptions: true,
                        attendances: true
                    }
                }
            }
        });

        if (!user) {
            console.log('User not found (already deleted?)');
            continue;
        }

        console.log(`Found User: ${user.firstName} ${user.lastName} (${user.email})`);

        if (user.student) {
            console.log(`Found Student ID: ${user.student.id}`);

            // Double check safeguards using loaded relations
            const attendanceCount = user.student.attendances?.length || 0;
            const subCount = user.student.subscriptions?.length || 0;

            if (attendanceCount > 0 || subCount > 0) {
                console.error(`SAFETY CHECK FAILED: Student has ${attendanceCount} attendances and ${subCount} subscriptions. SKIPPING DELETION.`);
                continue;
            }

            // Delete AgentTasks first
            console.log('Deleting associated AgentTasks...');

            const tasks = await prisma.agentTask.findMany({
                where: {
                    targetEntity: 'Student'
                }
            });

            const tasksToDelete = tasks.filter(t => {
                const payload = t.actionPayload as any;
                return payload && payload.studentId === user.student?.id;
            });

            for (const task of tasksToDelete) {
                await prisma.agentTask.delete({ where: { id: task.id } });
                console.log(`Deleted AgentTask: ${task.id} (${task.title})`);
            }
        }

        // Delete User (cascades to Student)
        console.log('Deleting User record...');
        await prisma.user.delete({ where: { id: userId } });
        console.log('User deleted successfully.');
    }

    console.log('\n--- Cleanup Completed ---');
}

fix()
    .catch(e => {
        console.error('Cleanup Failed:', e);
        // Log full error details
        console.dir(e, { depth: null });
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
