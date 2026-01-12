import { PrismaClient } from '@prisma/client';
import dayjs from 'dayjs';

const prisma = new PrismaClient();

async function updateExistingLesson() {
    try {
        console.log('🔄 Atualizando aula existente com plano correto...\n');

        // Buscar aula existente de hoje
        const today = dayjs().startOf('day');

        const existingLesson = await prisma.turmaLesson.findFirst({
            where: {
                scheduledDate: {
                    gte: today.toDate(),
                    lt: today.add(1, 'day').toDate()
                }
            },
            include: { turma: true, lessonPlan: true }
        });

        if (!existingLesson) {
            console.log('❌ Nenhuma aula para hoje');
            return;
        }

        console.log(`✅ Aula encontrada: ${existingLesson.turma.name}`);
        console.log(`   Plano atual: ${existingLesson.lessonPlan?.title || 'Nenhum'}`);

        // Buscar plano "Aula 02"
        const lessonPlan = await prisma.lessonPlan.findFirst({
            where: { lessonNumber: 2, isActive: true }
        });

        if (!lessonPlan) {
            console.log('❌ Plano Aula 02 não encontrado');
            return;
        }

        // Atualizar aula com novo plano
        await prisma.turmaLesson.update({
            where: { id: existingLesson.id },
            data: {
                lessonPlanId: lessonPlan.id,
                topic: lessonPlan.title
            }
        });

        console.log(`\n✅ AULA ATUALIZADA!`);
        console.log(`   ID: ${existingLesson.id}`);
        console.log(`   Novo plano: ${lessonPlan.title}`);

        // Verificar técnicas
        const techniques = await prisma.lessonPlanTechniques.findMany({
            where: { lessonPlanId: lessonPlan.id },
            include: { technique: { select: { name: true } } }
        });
        console.log(`   Técnicas: ${techniques.length}`);
        techniques.forEach(t => console.log(`      - ${t.technique.name}`));

        // Buscar aluno
        const student = await prisma.student.findFirst({
            where: { isActive: true },
            include: { user: true }
        });

        if (student) {
            console.log(`\n👤 Aluno para teste: ${student.user.firstName}`);
            console.log(`   Matrícula: ${student.registrationNumber || student.id.slice(0, 8)}`);
        }

        console.log(`\n🔗 http://localhost:3000/checkin-kiosk`);

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
}

updateExistingLesson();
