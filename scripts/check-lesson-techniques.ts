import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkLessonPlans() {
    try {
        console.log('🔍 Buscando planos de aula de Krav Maga...\n');

        // Buscar planos de aula relacionados a Krav Maga
        const plans = await prisma.lessonPlan.findMany({
            where: {
                OR: [
                    { title: { contains: 'krav', mode: 'insensitive' } },
                    { title: { contains: 'branca', mode: 'insensitive' } },
                    { course: { name: { contains: 'krav', mode: 'insensitive' } } }
                ]
            },
            include: {
                course: true,
                techniqueLinks: {
                    include: {
                        technique: true
                    }
                }
            },
            take: 5
        });

        if (plans.length === 0) {
            console.log('❌ Nenhum plano de aula de Krav Maga encontrado.');
            console.log('📊 Buscando qualquer plano de aula...\n');

            const anyPlans = await prisma.lessonPlan.findMany({
                include: {
                    course: true,
                    techniqueLinks: {
                        include: {
                            technique: true
                        }
                    }
                },
                take: 3
            });

            if (anyPlans.length > 0) {
                console.log(`✅ Encontrados ${anyPlans.length} planos de aula:\n`);
                anyPlans.forEach(plan => {
                    console.log(`📘 ${plan.title}`);
                    console.log(`   Curso: ${plan.course.name}`);
                    console.log(`   Aula ${plan.lessonNumber} - Semana ${plan.weekNumber}`);
                    console.log(`   Técnicas vinculadas: ${plan.techniqueLinks.length}`);

                    if (plan.techniqueLinks.length > 0) {
                        console.log('\n   🥋 Técnicas:');
                        plan.techniqueLinks.forEach(link => {
                            console.log(`      - ${link.technique.name}`);
                            console.log(`        Ordem: ${link.order}`);
                            console.log(`        Tempo: ${link.allocationMinutes} min`);
                            console.log(`        Objetivos: ${link.objectiveMapping.join(', ') || 'N/A'}`);
                        });
                    }

                    // Análise do campo techniques (JSON)
                    console.log('\n   📋 Campo techniques (JSON):');
                    console.log(JSON.stringify(plan.techniques, null, 4));
                    console.log('\n---\n');
                });
            } else {
                console.log('❌ Nenhum plano de aula encontrado no banco.');
            }
        } else {
            console.log(`✅ Encontrados ${plans.length} planos de Krav Maga:\n`);

            plans.forEach(plan => {
                console.log(`📘 ${plan.title}`);
                console.log(`   Curso: ${plan.course.name}`);
                console.log(`   Aula ${plan.lessonNumber} - Semana ${plan.weekNumber}`);
                console.log(`   Técnicas vinculadas: ${plan.techniqueLinks.length}`);

                if (plan.techniqueLinks.length > 0) {
                    console.log('\n   🥋 Técnicas via LessonPlanTechniques:');
                    plan.techniqueLinks.forEach(link => {
                        console.log(`      - ${link.technique.name}`);
                        console.log(`        Ordem: ${link.order}`);
                        console.log(`        Tempo alocado: ${link.allocationMinutes} min`);
                        console.log(`        Objetivos: ${link.objectiveMapping.join(', ') || 'N/A'}`);
                    });
                }

                // Análise do campo techniques (JSON)
                console.log('\n   📋 Campo techniques (JSON):');
                console.log(JSON.stringify(plan.techniques, null, 4));
                console.log('\n---\n');
            });
        }

        // Estatísticas gerais
        const totalPlans = await prisma.lessonPlan.count();
        const plansWithTechniques = await prisma.lessonPlan.count({
            where: {
                techniqueLinks: {
                    some: {}
                }
            }
        });

        console.log('\n📊 ESTATÍSTICAS:');
        console.log(`Total de planos de aula: ${totalPlans}`);
        console.log(`Planos com técnicas vinculadas: ${plansWithTechniques}`);
        console.log(`Planos sem técnicas vinculadas: ${totalPlans - plansWithTechniques}`);

    } catch (error) {
        console.error('❌ Erro ao buscar planos:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkLessonPlans();
