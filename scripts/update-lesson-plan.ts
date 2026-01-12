import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateLessonWithPlan() {
    try {
        console.log('🔧 Atualizando aula existente com plano correto...\n');

        // Buscar plano "Aula 02" (tem técnicas)
        const lessonPlan = await prisma.lessonPlan.findFirst({
            where: { lessonNumber: 2, isActive: true },
            include: {
                techniqueLinks: { include: { technique: true } }
            }
        });

        if (!lessonPlan) {
            console.log('❌ Plano não encontrado');
            return;
        }

        console.log(`✅ Plano: ${lessonPlan.title}`);
        console.log(`   Técnicas: ${lessonPlan.techniqueLinks.length}`);
        lessonPlan.techniqueLinks.forEach(t => {
            console.log(`      - ${t.technique.name}`);
        });

        // Buscar aula de hoje
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const existingLesson = await prisma.turmaLesson.findFirst({
            where: {
                scheduledDate: { gte: today, lt: tomorrow }
            },
            include: { turma: true }
        });

        if (!existingLesson) {
            console.log('❌ Nenhuma aula para hoje');
            return;
        }

        console.log(`\n📅 Aula encontrada: ${existingLesson.turma.name}`);
        console.log(`   ID: ${existingLesson.id}`);

        // Atualizar com novo plano
        await prisma.turmaLesson.update({
            where: { id: existingLesson.id },
            data: {
                lessonPlanId: lessonPlan.id,
                title: lessonPlan.title
            }
        });

        console.log(`\n✅ AULA ATUALIZADA!`);
        console.log(`   Novo plano: ${lessonPlan.title}`);
        console.log(`   Técnicas que serão registradas: ${lessonPlan.techniqueLinks.length}`);

        // Buscar aluno
        const student = await prisma.student.findFirst({
            where: { isActive: true },
            include: { user: true }
        });

        if (student) {
            console.log(`\n👤 Aluno: ${student.user.firstName} ${student.user.lastName}`);
            console.log(`   Matrícula: ${student.registrationNumber || student.id.slice(0, 8)}`);
        }

        console.log(`\n🔗 http://localhost:3000/checkin-kiosk`);

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
}

updateLessonWithPlan();
