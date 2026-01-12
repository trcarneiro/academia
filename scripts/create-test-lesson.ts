import { PrismaClient } from '@prisma/client';
import dayjs from 'dayjs';

const prisma = new PrismaClient();

async function createTestLesson() {
    try {
        console.log('🧪 Criando aula de teste para HOJE...\n');

        // Buscar turma de Krav Maga
        const turma = await prisma.turma.findFirst({
            where: { isActive: true, name: { contains: 'Defesa Pessoal', mode: 'insensitive' } }
        });

        if (!turma) { console.log('❌ Turma não encontrada'); return; }
        console.log(`✅ Turma: ${turma.name}`);

        // Buscar plano "Aula 02" (tem técnicas vinculadas)
        const lessonPlan = await prisma.lessonPlan.findFirst({
            where: { lessonNumber: 2, isActive: true }
        });

        if (!lessonPlan) { console.log('❌ Plano não encontrado'); return; }
        console.log(`✅ Plano: ${lessonPlan.title}`);

        // Verificar técnicas vinculadas
        const techniques = await prisma.lessonPlanTechniques.findMany({
            where: { lessonPlanId: lessonPlan.id },
            include: { technique: { select: { name: true } } }
        });
        console.log(`✅ Técnicas no plano: ${techniques.length}`);
        techniques.slice(0, 3).forEach(t => console.log(`   - ${t.technique.name}`));

        // Criar aula para HOJE às 18h
        const lessonDate = dayjs().hour(18).minute(0).second(0);

        const lesson = await prisma.turmaLesson.create({
            data: {
                turmaId: turma.id,
                lessonPlanId: lessonPlan.id,
                scheduledDate: lessonDate.toDate(),
                duration: 60,
                status: 'SCHEDULED',
                topic: lessonPlan.title
            }
        });

        console.log(`\n✅ AULA CRIADA!`);
        console.log(`   ID: ${lesson.id}`);
        console.log(`   Data: ${lessonDate.format('DD/MM/YYYY HH:mm')}`);

        // Buscar aluno para teste
        const student = await prisma.student.findFirst({
            where: { isActive: true },
            include: { user: true }
        });

        if (student) {
            console.log(`\n👤 Aluno para teste:`);
            console.log(`   ${student.user.firstName} ${student.user.lastName}`);
            console.log(`   Matrícula: ${student.registrationNumber || student.id.slice(0, 8)}`);
        }

        console.log(`\n🔗 http://localhost:3000/checkin-kiosk`);

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createTestLesson();
