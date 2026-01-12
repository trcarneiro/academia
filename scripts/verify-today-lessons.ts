import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyTodayLessons() {
    try {
        console.log('📅 Verificando aulas de hoje...\n');

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const lessons = await prisma.turmaLesson.findMany({
            where: {
                scheduledDate: { gte: today, lt: tomorrow }
            },
            include: {
                turma: true,
                lessonPlan: {
                    include: {
                        techniqueLinks: {
                            include: {
                                technique: true
                            }
                        }
                    }
                }
            },
            orderBy: { scheduledDate: 'asc' }
        });

        console.log(`Encontradas ${lessons.length} aulas para hoje:\n`);

        for (const lesson of lessons) {
            const time = lesson.scheduledDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            console.log(`⏰ ${time} - ${lesson.turma.name}`);
            console.log(`   ID: ${lesson.id}`);

            if (lesson.lessonPlan) {
                console.log(`   📚 Plano: ${lesson.lessonPlan.title}`);
                const techs = lesson.lessonPlan.techniqueLinks.length;
                console.log(`   🥋 Técnicas vinculadas: ${techs}`);

                if (techs > 0) {
                    console.log(`   ✅ PRONTA PARA CHECK-IN!`);
                    lesson.lessonPlan.techniqueLinks.slice(0, 3).forEach(t => {
                        console.log(`      - ${t.technique.name}`);
                    });
                }
            } else {
                console.log(`   ⚠️ Sem plano de aula vinculado`);
            }
            console.log();
        }

        // Buscar aluno para teste
        const student = await prisma.student.findFirst({
            where: { isActive: true },
            include: { user: true }
        });

        if (student) {
            console.log(`\n👤 Aluno para teste:`);
            console.log(`   Nome: ${student.user.firstName} ${student.user.lastName}`);
            console.log(`   Matrícula: ${student.registrationNumber || student.id.slice(0, 8)}`);
        }

        console.log(`\n🔗 Acesse: http://localhost:3000/checkin-kiosk`);

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyTodayLessons();
