import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function simpleUpdate() {
    // Buscar aula
    const lesson = await prisma.turmaLesson.findFirst({
        select: {
            id: true,
            turmaId: true,
            lessonPlanId: true,
            scheduledDate: true,
            topic: true
        }
    });

    console.log('Aula atual:', lesson);

    // Buscar plano
    const plan = await prisma.lessonPlan.findFirst({
        where: { lessonNumber: 2 },
        select: { id: true, title: true }
    });

    console.log('Plano:', plan);

    if (lesson && plan) {
        // Atualizar apenas o topic
        const updated = await prisma.turmaLesson.update({
            where: { id: lesson.id },
            data: {
                lessonPlan: { connect: { id: plan.id } },
                topic: plan.title
            }
        });
        console.log('Atualizado:', updated.id);
    }

    await prisma.$disconnect();
}

simpleUpdate().catch(console.error);
