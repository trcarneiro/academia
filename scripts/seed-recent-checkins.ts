import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedRecentCheckIns() {
  try {
    console.log('🌱 Criando check-ins recentes para testes...\n');

    // Pegar organização padrão
    const orgId = '452c0b35-1822-4890-851e-922356c812fb';

    // Pegar primeira turma ativa
    const turma = await prisma.turma.findFirst({
      where: { organizationId: orgId, isActive: true },
    });

    if (!turma) {
      console.log('❌ Nenhuma turma ativa encontrada');
      return;
    }

    console.log(`✅ Usando turma: ${turma.name}`);

    // Pegar aulas da turma
    const lessons = await prisma.turmaLesson.findMany({
      where: { turmaId: turma.id },
      take: 10,
    });

    if (lessons.length === 0) {
      console.log('❌ Nenhuma aula encontrada para a turma');
      return;
    }

    console.log(`✅ Encontradas ${lessons.length} aulas`);

    // Pegar 5 estudantes vinculados à turma (TurmaStudent)
    const turmaStudents = await prisma.turmaStudent.findMany({
      where: { turmaId: turma.id },
      take: 5,
      include: { student: true },
    });

    console.log(`✅ Encontrados ${turmaStudents.length} alunos matriculados na turma\n`);

    if (turmaStudents.length === 0) {
      console.log('❌ Nenhum aluno matriculado na turma');
      return;
    }

    // Criar check-ins dos últimos 7 dias
    const checkInsToCreate = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(19, 0, 0, 0); // 19:00

      // Usar aula diferente para cada dia
      const lesson = lessons[i % lessons.length];

      for (const turmaStudent of turmaStudents) {
        checkInsToCreate.push({
          id: `test-checkin-${turmaStudent.studentId}-lesson${lesson.id}-day${i}`,
          turmaId: turma.id,
          turmaLessonId: lesson.id,
          turmaStudentId: turmaStudent.id,
          studentId: turmaStudent.studentId,
          present: true,
          late: i % 3 === 0, // 33% atrasados
          justified: false,
          checkedAt: date,
          createdAt: date,
          updatedAt: date,
        });
      }
    }

    console.log(`📦 Criando ${checkInsToCreate.length} check-ins...`);

    // Criar novos com upsert (atualiza se já existir)
    for (const checkIn of checkInsToCreate) {
      await prisma.turmaAttendance.upsert({
        where: {
          turmaLessonId_studentId: {
            turmaLessonId: checkIn.turmaLessonId,
            studentId: checkIn.studentId,
          },
        },
        update: {
          checkedAt: checkIn.checkedAt,
          present: checkIn.present,
          late: checkIn.late,
        },
        create: checkIn,
      });
    }

    console.log('✅ Check-ins de teste criados!\n');

    // Verificar
    const recentCount = await prisma.turmaAttendance.count({
      where: {
        checkedAt: {
          gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    console.log(`📊 Total de check-ins nos últimos 7 dias: ${recentCount}`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erro:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

seedRecentCheckIns();
