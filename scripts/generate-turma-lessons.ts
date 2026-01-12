import { PrismaClient } from '@prisma/client';
import dayjs from 'dayjs';

const prisma = new PrismaClient();

async function generateTurmaLessons() {
    try {
        console.log('📅 Gerando aulas automáticas para turmas...\n');

        // Buscar turmas ativas do Krav Maga
        const turmas = await prisma.turma.findMany({
            where: {
                isActive: true,
                course: { name: { contains: 'Krav Maga', mode: 'insensitive' } }
            },
            include: { course: true }
        });

        console.log(`✅ Turmas encontradas: ${turmas.length}\n`);

        // Buscar planos de aula do curso
        const lessonPlans = await prisma.lessonPlan.findMany({
            where: {
                course: { name: { contains: 'Krav Maga', mode: 'insensitive' } },
                isActive: true
            },
            orderBy: { lessonNumber: 'asc' }
        });

        console.log(`📚 Planos de aula: ${lessonPlans.length}`);

        if (lessonPlans.length === 0) {
            console.log('❌ Nenhum plano de aula encontrado');
            return;
        }

        const today = dayjs().startOf('day');
        const endDate = today.add(3, 'month'); // Gerar 3 meses de aulas

        let totalCreated = 0;

        for (const turma of turmas) {
            console.log(`\n🏋️ Turma: ${turma.name}`);

            // Parsear schedule da turma (JSON com dias e horários)
            const schedule = turma.schedule as any;
            if (!schedule) {
                console.log('   ⚠️ Sem horário definido');
                continue;
            }

            // Mapear dias da semana
            const daysOfWeek: { [key: string]: number } = {
                sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
                thursday: 4, friday: 5, saturday: 6
            };

            let lessonIndex = 0;
            let current = today;

            while (current.isBefore(endDate)) {
                const dayName = current.format('dddd').toLowerCase();
                const daySchedule = schedule[dayName];

                if (daySchedule?.enabled && daySchedule?.startTime) {
                    // Verificar se já existe aula para este dia
                    const existingLesson = await prisma.turmaLesson.findFirst({
                        where: {
                            turmaId: turma.id,
                            scheduledDate: {
                                gte: current.toDate(),
                                lt: current.add(1, 'day').toDate()
                            }
                        }
                    });

                    if (!existingLesson) {
                        // Criar aula
                        const [hours, minutes] = daySchedule.startTime.split(':');
                        const lessonDate = current.hour(parseInt(hours)).minute(parseInt(minutes || 0));

                        // Pegar plano de aula correspondente (cicla se acabar)
                        const lessonPlan = lessonPlans[lessonIndex % lessonPlans.length];

                        await prisma.turmaLesson.create({
                            data: {
                                turmaId: turma.id,
                                lessonPlanId: lessonPlan.id,
                                scheduledDate: lessonDate.toDate(),
                                duration: 60,
                                status: 'SCHEDULED',
                                topic: lessonPlan.title
                            }
                        });

                        console.log(`   ✅ ${lessonDate.format('DD/MM/YYYY HH:mm')} - ${lessonPlan.title}`);
                        lessonIndex++;
                        totalCreated++;
                    }
                }

                current = current.add(1, 'day');
            }
        }

        console.log(`\n📊 Total de aulas criadas: ${totalCreated}`);

        // Verificar aulas de hoje
        const todayLessons = await prisma.turmaLesson.findMany({
            where: {
                scheduledDate: {
                    gte: today.toDate(),
                    lt: today.add(1, 'day').toDate()
                }
            },
            include: {
                turma: true,
                lessonPlan: true
            }
        });

        console.log(`\n📅 Aulas de hoje (${today.format('DD/MM/YYYY')}):`);
        todayLessons.forEach(l => {
            console.log(`   - ${dayjs(l.scheduledDate).format('HH:mm')} | ${l.turma.name} | ${l.lessonPlan?.title || 'Sem plano'}`);
        });

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
}

generateTurmaLessons();
