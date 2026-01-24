
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fix() {
    const userId = '2047d18b-41d4-4a31-b628-2492457e7551';
    console.log(`Deleting final duplicate user: ${userId}`);

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { student: true }
        });

        if (user && user.student) {
            // Delete tasks
            const tasks = await prisma.agentTask.findMany({ where: { targetEntity: 'Student' } });
            const tasksToDelete = tasks.filter(t => (t.actionPayload as any)?.studentId === user.student?.id);
            for (const t of tasksToDelete) {
                await prisma.agentTask.delete({ where: { id: t.id } });
                console.log(`Deleted Task: ${t.id}`);
            }
        }

        await prisma.user.delete({ where: { id: userId } });
        console.log('Deleted successfully.');
    } catch (e) {
        console.error('Failed or already deleted:', e);
    }
}

fix().finally(async () => await prisma.$disconnect());
