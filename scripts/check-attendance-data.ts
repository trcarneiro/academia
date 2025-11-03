import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAttendanceData() {
  try {
    console.log('🔍 Verificando dados de frequência...\n');

    // 1. Total de check-ins
    const totalAttendances = await prisma.turmaAttendance.count();
    console.log(`📊 Total de TurmaAttendances: ${totalAttendances}`);

    // 2. Check-ins recentes
    const recentCheckIns = await prisma.turmaAttendance.findMany({
      take: 5,
      orderBy: { checkedAt: 'desc' },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        turma: true,
      },
    });

    console.log('\n📅 Check-ins recentes:');
    recentCheckIns.forEach(ci => {
      const studentName = `${ci.student.user.firstName} ${ci.student.user.lastName}`;
      console.log(`  - ${studentName} em ${ci.turma.name} às ${ci.checkedAt}`);
    });

    // 3. Total de aulas agendadas
    const totalLessons = await prisma.turmaLesson.count();
    console.log(`\n🏫 Total de TurmaLessons agendadas: ${totalLessons}`);

    // 4. Total de turmas
    const totalTurmas = await prisma.turma.count();
    console.log(`👥 Total de Turmas: ${totalTurmas}`);

    // 5. Total de estudantes
    const totalStudents = await prisma.student.count();
    console.log(`🎓 Total de Estudantes: ${totalStudents}`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erro:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkAttendanceData();
