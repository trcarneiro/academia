import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createWorkingLesson() {
    try {
        console.log('🔧 Criando aula funcional para teste...\n');

        // Buscar turma de Krav Maga
        const turma = await prisma.turma.findFirst({
            where: {
                isActive: true,
                name: { contains: 'Defesa Pessoal', mode: 'insensitive' }
            }
        });

        if (!turma) {
            console.log('❌ Turma não encontrada');
            return;
        }

        console.log(`✅ Turma: ${turma.name}`);

        // Buscar plano "Aula 02" (tem técnicas)
        const lessonPlan = await prisma.lessonPlan.findFirst({
            where: {
                lessonNumber: 2,
                isActive: true
            },
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

        // Criar aula para AGORA
        const now = new Date();

        const lesson = await prisma.turmaLesson.create({
            data: {
                turmaId: turma.id,
                lessonPlanId: lessonPlan.id,
                lessonNumber: 1,
                title: lessonPlan.title,
                scheduledDate: now,
                status: 'SCHEDULED',
                duration: 60
            }
        });

        console.log(`\n✅ AULA CRIADA!`);
        console.log(`   ID: ${lesson.id}`);
        console.log(`   Data: ${now.toLocaleString('pt-BR')}`);

        // Buscar aluno
        const student = await prisma.student.findFirst({
            where: { isActive: true },
            include: { user: true }
        });

        if (student) {
            console.log(`\n👤 Aluno: ${student.user.firstName}`);
            console.log(`   Matrícula: ${student.registrationNumber || student.id.slice(0, 8)}`);
        }

        console.log(`\n🔗 http://localhost:3000/checkin-kiosk`);
        console.log(`\n✅ Ao fazer check-in, o sistema irá registrar ${lessonPlan.techniqueLinks.length} técnicas automaticamente!`);

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createWorkingLesson();
