import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function simpleAnalysis() {
    try {
        console.log('📊 ANÁLISE RÁPIDA\n');

        // Cursos
        const courses = await prisma.course.count();
        console.log(`Cursos: ${courses}`);

        // Técnicas
        const techniques = await prisma.technique.count();
        console.log(`Técnicas: ${techniques}`);

        // Planos de Aula
        const lessonPlans = await prisma.lessonPlan.count();
        console.log(`Planos de Aula: ${lessonPlans}`);

        // Turmas
        const turmas = await prisma.turma.count();
        console.log(`Turmas: ${turmas}`);

        // TurmaLesson (aulas agendadas)
        const turmaLessons = await prisma.turmaLesson.count();
        console.log(`Aulas Agendadas: ${turmaLessons}`);

        // Alunos
        const students = await prisma.student.count({ where: { isActive: true } });
        console.log(`Alunos: ${students}`);

        // Check-ins
        const checkins = await prisma.turmaAttendance.count();
        console.log(`Check-ins: ${checkins}`);

        // TechniqueRecord
        const techRecords = await prisma.techniqueRecord.count();
        console.log(`Registros de Técnicas: ${techRecords}`);

        console.log('\n---\n');

        // Krav Maga específico
        const kravMaga = await prisma.course.findFirst({
            where: { name: { contains: 'Krav Maga', mode: 'insensitive' } },
            include: {
                techniques: true,
                lessonPlans: true,
                turmas: {
                    include: {
                        turmaLessons: true,
                        turmaStudents: true
                    }
                }
            }
        });

        if (kravMaga) {
            console.log(`\n🥋 KRAV MAGA - FAIXA BRANCA`);
            console.log(`   Técnicas: ${kravMaga.techniques.length}`);
            console.log(`   Planos de Aula: ${kravMaga.lessonPlans.length}`);
            console.log(`   Turmas: ${kravMaga.turmas.length}`);

            for (const t of kravMaga.turmas) {
                console.log(`     - ${t.name}: ${t.turmaLessons.length} aulas, ${t.turmaStudents.length} alunos`);
            }
        }

        console.log('\n---\nO QUE FALTA:\n');

        if (lessonPlans === 0) console.log('❌ Criar planos de aula');
        if (turmaLessons === 0) console.log('❌ Agendar aulas nas turmas');
        if (techRecords === 0) console.log('❌ Auto-registro de técnicas no check-in');
        if (kravMaga && kravMaga.lessonPlans.length === 0) console.log('❌ Vincular planos ao curso Krav Maga');

    } catch (error) {
        console.error('Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
}

simpleAnalysis();
