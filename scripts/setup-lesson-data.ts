
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🛠️ Iniciando Setup de Dados para Teste (Dinâmico)...');

    const studentId = '5bc7eb2c-3ebb-4902-90c9-ba9aef96384d';

    // 1. Encontrar Aula Dinâmica
    const now = new Date();
    const openLessons = await prisma.turmaLesson.findMany({
        where: {
            scheduledDate: {
                gte: new Date(now.getTime() - 60 * 60 * 1000),
                lte: new Date(now.getTime() + 60 * 60 * 1000)
            },
            status: 'SCHEDULED'
        },
        include: { turma: true, lessonPlan: true }
    });

    if (openLessons.length === 0) return console.error('❌ Nenhuma aula disponível.');
    const lesson = openLessons[0];
    const lessonId = lesson.id;

    const student = await prisma.student.findUnique({ where: { id: studentId }, include: { user: true } });
    if (!student) return console.error('❌ Aluno não encontrado');

    console.log(`👤 Aluno: ${student.user.firstName}`);
    console.log(`📅 Aula: ${lesson.title} (${lessonId})`);
    const courseId = lesson.turma.courseId;

    // --- TÉCNICAS ---
    console.log('\n🥋 Técnicas...');
    const techniquesData = [
        { name: 'Jab Direto', difficulty: 1 },
        { name: 'Defesa 360', difficulty: 2 }
    ];

    const techniques = [];
    for (const t of techniquesData) {
        let tech = await prisma.technique.findFirst({ where: { name: t.name } });
        if (!tech) {
            tech = await prisma.technique.create({
                data: {
                    name: t.name, difficulty: t.difficulty,
                    objectives: [], resources: [], assessmentCriteria: [], risksMitigation: [], tags: [], references: [], prerequisites: [], instructions: [], stepByStep: [], bnccCompetencies: []
                }
            });
        }
        techniques.push(tech);
    }

    // --- LESSON PLAN ---
    console.log('\n📝 Plano de Aula...');
    let lessonPlanId = lesson.lessonPlanId;
    if (!lessonPlanId) {
        const lp = await prisma.lessonPlan.create({
            data: {
                courseId,
                title: `Plano Auto - ${lesson.title}`,
                lessonNumber: 1, weekNumber: 1,
                warmup: {}, techniques: { list: techniques.map(t => ({ id: t.id, name: t.name })) }, simulations: {}, cooldown: {}, isActive: true,
                objectives: [], equipment: [], activities: []
            }
        });
        lessonPlanId = lp.id;
        await prisma.turmaLesson.update({ where: { id: lesson.id }, data: { lessonPlanId } });
    } else {
        await prisma.lessonPlan.update({
            where: { id: lessonPlanId },
            data: { techniques: { list: techniques.map(t => ({ id: t.id, name: t.name })) } }
        });
    }

    // --- STUDENT TECHNIQUE PROGRESS ---
    console.log('\n📈 Progresso Técnicas...');
    for (const tech of techniques) {
        try {
            await prisma.studentTechniqueProgress.create({
                data: {
                    studentId, techniqueId: tech.id,
                    completed: true, rating: 5
                }
            });
            console.log(`   ✓ Progresso criado: ${tech.name}`);
        } catch (e) {
            // Ignora P2002 (Unique violation)
            if (e.code !== 'P2002') console.log(`   ! Erro téc ${tech.name}: ${e.code}`);
        }
    }

    // --- GRADUAÇÃO ---
    console.log('\n🎓 Graduação...');

    /*
    try {
        await prisma.studentDegreeHistory.create({
            data: {
                studentId, courseId, degree: 0, degreePercentage: 0.0, belt: 'Faixa Branca',
                completedLessons: 1, totalRepetitions: 50, attendanceRate: 100.0
            }
        });
    } catch (e) { console.log('   ! Erro ao criar histórico (ignorando):', e.message); }
    */

    try {
        await prisma.studentGraduation.create({
            data: {
                studentId, courseId,
                fromBelt: 'Iniciante', toBelt: 'Faixa Branca',
                approvedBy: 'SYSTEM', finalAttendanceRate: 100, finalQualityRating: 5, totalRepetitions: 0, totalLessonsCompleted: 0
            }
        });
        console.log('   ✓ Graduação criada.');
    } catch (e) { console.log('   . Graduação já existe ou erro:', e.code); }

    // Aulas
    try {
        await prisma.studentProgress.create({
            data: { studentId, courseId, attendedClasses: 1, lastAttendance: new Date(), totalTimeMinutes: 60 }
        });
        console.log('   ✓ Progresso (StudentProgress) criado.');
    } catch (e) {
        console.log('   . Progresso já existe ou erro:', e.code);
        // Se já existe, tenta update simples (opcional, mas create basta pra garantir existência inicial)
    }

    console.log('✅ Setup Dinâmico Finalizado!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
