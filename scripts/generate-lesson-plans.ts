import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const WARMUP_PADRAO = {
    fase1_cardio: [
        { nome: 'Corrida no Tatame', reps: 10 },
        { nome: 'Agachamento', reps: 20 },
        { nome: 'Flexão de Braços', reps: 20 },
        { nome: 'Abdominal', reps: 100 }
    ],
    fase2_coordenacao: [
        { nome: 'Polichinelo Lateral', reps: 30 },
        { nome: 'Polichinelo Frontal', reps: 30 },
        { nome: 'Tesoura Cruzada', reps: 30 },
        { nome: 'Rotação Quadril', reps: 30 }
    ],
    fase3_mobilidade: [
        { nome: 'Pescoço', reps: 60 },
        { nome: 'Ombros', reps: 20 },
        { nome: 'Pulsos', reps: 20 }
    ]
};

const COOLDOWN_PADRAO = {
    alongamentos: [
        { nome: 'Borboleta', tempo: 30 },
        { nome: 'Spider-man', tempo: 30 },
        { nome: 'Abertura Frontal', tempo: 30 }
    ]
};

async function generateLessonPlans() {
    try {
        console.log('🎯 Gerando 48 planos de aula...\n');

        const course = await prisma.course.findFirst({
            where: { name: { contains: 'Krav Maga - Faixa Branca', mode: 'insensitive' } }
        });

        if (!course) {
            console.log('❌ Curso não encontrado');
            return;
        }

        console.log(`✅ Curso: ${course.name}`);

        const combatTechniques = await prisma.courseTechnique.findMany({
            where: {
                courseId: course.id,
                technique: {
                    NOT: { category: { in: ['AQUECIMENTO', 'ALONGAMENTO'] } }
                }
            },
            include: { technique: true },
            orderBy: { orderIndex: 'asc' }
        });

        console.log(`✅ Técnicas de combate: ${combatTechniques.length}`);

        const TOTAL_AULAS = 48;
        const techPerLesson = Math.max(1, Math.ceil(combatTechniques.length / TOTAL_AULAS));

        let created = 0;

        for (let lessonNum = 1; lessonNum <= TOTAL_AULAS; lessonNum++) {
            const weekNum = Math.ceil(lessonNum / 2);

            const existing = await prisma.lessonPlan.findFirst({
                where: { courseId: course.id, lessonNumber: lessonNum, isActive: true }
            });

            if (existing) {
                console.log(`⏭️  Aula ${lessonNum} já existe`);
                continue;
            }

            const startIdx = (lessonNum - 1) * techPerLesson;
            const endIdx = Math.min(startIdx + techPerLesson, combatTechniques.length);
            const lessonTechs = combatTechniques.slice(startIdx, endIdx);

            const techNames = lessonTechs.map(t => t.technique.name).slice(0, 2);
            const title = `Aula ${String(lessonNum).padStart(2, '0')} - ${techNames.join(' e ') || 'Revisão Geral'}`;

            const lessonPlan = await prisma.lessonPlan.create({
                data: {
                    courseId: course.id,
                    title: title,
                    description: `Semana ${weekNum}`,
                    lessonNumber: lessonNum,
                    weekNumber: weekNum,
                    level: Math.min(1 + Math.floor(lessonNum / 12), 4),
                    difficulty: Math.min(1 + Math.floor(lessonNum / 10), 5),
                    duration: 60,
                    objectives: ['Praticar técnicas', 'Condicionamento'],
                    equipment: ['Tatame'],
                    warmup: WARMUP_PADRAO,
                    techniques: { lista: lessonTechs.map(t => ({ id: t.techniqueId, nome: t.technique.name, reps: 20 })) },
                    simulations: { descricao: 'Prática em duplas' },
                    cooldown: COOLDOWN_PADRAO
                }
            });

            // Vincular técnicas ao plano
            for (let i = 0; i < lessonTechs.length; i++) {
                try {
                    await prisma.lessonPlanTechniques.create({
                        data: {
                            lessonPlanId: lessonPlan.id,
                            techniqueId: lessonTechs[i].techniqueId,
                            order: i + 1,
                            allocationMinutes: 10,
                            objectiveMapping: ['Técnica principal']
                        }
                    });
                } catch (e) { }
            }

            console.log(`✅ ${title}`);
            created++;
        }

        console.log(`\n📊 Resultado: ${created} planos criados`);

        const total = await prisma.lessonPlan.count({ where: { courseId: course.id } });
        console.log(`📚 Total no curso: ${total}`);

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
}

generateLessonPlans();
