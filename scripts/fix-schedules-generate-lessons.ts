import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixSchedulesAndGenerate() {
    try {
        console.log('🔧 Corrigindo schedules das turmas...\n');

        // Buscar turmas de Krav Maga
        const turmas = await prisma.turma.findMany({
            where: {
                isActive: true,
                course: { name: { contains: 'Krav Maga', mode: 'insensitive' } }
            },
            include: { course: true }
        });

        console.log(`✅ Turmas encontradas: ${turmas.length}\n`);

        for (const turma of turmas) {
            console.log(`🏋️ Processando: ${turma.name}`);

            // Analisar schedule atual
            const oldSchedule = turma.schedule as any;
            console.log(`   Schedule atual: ${JSON.stringify(oldSchedule)}`);

            // Converter para novo formato
            const daysOfWeek: number[] = [];
            let time = "18:00";

            if (oldSchedule) {
                // Mapear dias da semana
                const dayMap: Record<string, number> = {
                    sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
                    thursday: 4, friday: 5, saturday: 6
                };

                for (const [day, config] of Object.entries(oldSchedule)) {
                    if ((config as any)?.enabled) {
                        const dayNum = dayMap[day.toLowerCase()];
                        if (dayNum !== undefined) {
                            daysOfWeek.push(dayNum);
                            if ((config as any)?.startTime) {
                                time = (config as any).startTime;
                            }
                        }
                    }
                }

                // Se já tem daysOfWeek, usar
                if (oldSchedule.daysOfWeek && Array.isArray(oldSchedule.daysOfWeek)) {
                    daysOfWeek.length = 0;
                    daysOfWeek.push(...oldSchedule.daysOfWeek);
                }
                if (oldSchedule.time) {
                    time = oldSchedule.time;
                }
            }

            // Se não tem dias configurados, definir Segunda e Quinta
            if (daysOfWeek.length === 0) {
                daysOfWeek.push(1, 4); // Segunda e Quinta
            }

            const newSchedule = {
                daysOfWeek,
                time,
                duration: 60
            };

            console.log(`   Novo schedule: ${JSON.stringify(newSchedule)}`);

            // Atualizar turma com novo schedule
            await prisma.turma.update({
                where: { id: turma.id },
                data: {
                    schedule: newSchedule,
                    startDate: new Date() // Iniciar hoje
                }
            });

            console.log(`   ✅ Schedule atualizado`);

            // Deletar aulas antigas
            const deleted = await prisma.turmaLesson.deleteMany({
                where: { turmaId: turma.id }
            });
            console.log(`   🗑️  Deletadas ${deleted.count} aulas antigas`);

            // Buscar planos de aula do curso
            const lessonPlans = await prisma.lessonPlan.findMany({
                where: { courseId: turma.courseId, isActive: true },
                orderBy: { lessonNumber: 'asc' }
            });

            console.log(`   📚 Planos de aula: ${lessonPlans.length}`);

            if (lessonPlans.length === 0) {
                console.log(`   ⚠️ Sem planos, pulando geração`);
                continue;
            }

            // Gerar novas aulas manualmente
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const endDate = new Date(today);
            endDate.setMonth(endDate.getMonth() + 6); // 6 meses

            const [hours, minutes] = time.split(':').map(Number);

            let currentDate = new Date(today);
            let lessonIndex = 0;
            const lessons: any[] = [];

            while (currentDate <= endDate && lessonIndex < lessonPlans.length * 2) {
                if (daysOfWeek.includes(currentDate.getDay())) {
                    const scheduledDate = new Date(currentDate);
                    scheduledDate.setHours(hours, minutes, 0, 0);

                    const lessonPlan = lessonPlans[lessonIndex % lessonPlans.length];

                    lessons.push({
                        turmaId: turma.id,
                        lessonPlanId: lessonPlan.id,
                        lessonNumber: lessonIndex + 1,
                        title: lessonPlan.title,
                        scheduledDate,
                        status: 'SCHEDULED',
                        duration: 60
                    });

                    lessonIndex++;
                }

                currentDate.setDate(currentDate.getDate() + 1);
            }

            // Criar aulas
            if (lessons.length > 0) {
                await prisma.turmaLesson.createMany({ data: lessons });
                console.log(`   ✅ Criadas ${lessons.length} novas aulas`);
            }
        }

        // Verificar aulas de hoje
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayLessons = await prisma.turmaLesson.findMany({
            where: {
                scheduledDate: { gte: today, lt: tomorrow }
            },
            include: {
                turma: true,
                lessonPlan: true
            },
            orderBy: { scheduledDate: 'asc' }
        });

        console.log(`\n📅 AULAS DE HOJE (${today.toLocaleDateString('pt-BR')}):\n`);

        for (const lesson of todayLessons.slice(0, 5)) {
            const time = lesson.scheduledDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            console.log(`   ${time} | ${lesson.turma.name}`);
            console.log(`         ${lesson.lessonPlan?.title || 'Sem plano'}`);
        }

        if (todayLessons.length > 5) {
            console.log(`   ... e mais ${todayLessons.length - 5} aulas`);
        }

        console.log('\n✅ Processo concluído!');

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixSchedulesAndGenerate();
