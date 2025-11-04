import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixSeedData() {
  console.log('🔧 Iniciando correção dos dados de seed...\n');

  try {
    // 1. Buscar dados necessários
    console.log('📥 1. BUSCANDO DADOS EXISTENTES...');
    
    const students = await prisma.student.findMany({
      include: { user: true }
    });
    console.log(`   ✅ ${students.length} alunos encontrados`);

    const course = await prisma.course.findFirst({
      where: { name: { contains: 'Krav Maga' } }
    });
    if (!course) {
      throw new Error('❌ Curso "Krav Maga - Faixa Branca" não encontrado');
    }
    console.log(`   ✅ Curso encontrado: ${course.name}`);

    const turma = await prisma.turma.findFirst();
    if (!turma) {
      throw new Error('❌ Nenhuma turma encontrada');
    }
    console.log(`   ✅ Turma encontrada: ${turma.name}`);

    const billingPlan = await prisma.billingPlan.findFirst({
      where: { name: 'Plano Básico' }
    });
    if (!billingPlan) {
      throw new Error('❌ Plano "Plano Básico" não encontrado');
    }
    console.log(`   ✅ Plano de pagamento encontrado: ${billingPlan.name}\n`);

    // 2. Criar plano ativo para o aluno sem plano
    console.log('💳 2. CRIANDO PLANO ATIVO PARA ALUNO SEM PLANO...');
    const studentWithoutPlan = students.find(s => s.user.email === 'aluno.teste.progressao@teste.com');
    
    if (studentWithoutPlan) {
      const existingSubscription = await prisma.studentSubscription.findFirst({
        where: { 
          studentId: studentWithoutPlan.id,
          status: 'ACTIVE'
        }
      });

      if (!existingSubscription) {
        await prisma.studentSubscription.create({
          data: {
            studentId: studentWithoutPlan.id,
            planId: billingPlan.id,
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 dias
            status: 'ACTIVE',
            currentPrice: billingPlan.price,
            billingType: 'MONTHLY',
            organizationId: studentWithoutPlan.organizationId
          }
        });
        console.log(`   ✅ Plano criado para "${studentWithoutPlan.user.firstName}"`);
      } else {
        console.log(`   ℹ️ Aluno "${studentWithoutPlan.user.firstName}" já tem plano ativo`);
      }
    }

    // 3. Matricular todos os alunos no curso Krav Maga
    console.log('\n📚 3. MATRICULANDO ALUNOS NO CURSO...');
    
    for (const student of students) {
      const existingEnrollment = await prisma.studentCourse.findFirst({
        where: {
          studentId: student.id,
          courseId: course.id
        }
      });

      if (!existingEnrollment) {
        // Criar matrícula no curso (StudentCourse)
        await prisma.studentCourse.create({
          data: {
            studentId: student.id,
            courseId: course.id,
            status: 'ACTIVE',
            startDate: new Date()
          }
        });

        // Adicionar aluno à turma (TurmaStudent)
        const existingTurmaStudent = await prisma.turmaStudent.findFirst({
          where: {
            turmaId: turma.id,
            studentId: student.id
          }
        });

        if (!existingTurmaStudent) {
          await prisma.turmaStudent.create({
            data: {
              turmaId: turma.id,
              studentId: student.id,
              status: 'ACTIVE',
              paymentStatus: 'PAID'
            }
          });
        }

        console.log(`   ✅ Aluno "${student.user.firstName}" matriculado`);
      } else {
        console.log(`   ℹ️ Aluno "${student.user.firstName}" já está matriculado`);
      }
    }

    // 4. Criar registros de frequência
    console.log('\n✅ 4. REGISTRANDO PRESENÇAS...');
    
    // Primeiro, verificar se já existem TurmaLessons
    const turmaLessons = await prisma.turmaLesson.findMany({
      where: { turmaId: turma.id },
      take: 3
    });

    if (turmaLessons.length === 0) {
      console.log('   ⚠️ Nenhuma TurmaLesson encontrada. Não é possível registrar presenças.');
      console.log('   💡 Você precisa primeiro criar TurmaLessons para esta turma.');
    } else {
      // Criar presenças para cada aluno em cada lesson existente
      for (const student of students) {
        const turmaStudent = await prisma.turmaStudent.findFirst({
          where: {
            turmaId: turma.id,
            studentId: student.id
          }
        });

        if (!turmaStudent) continue;

        for (const turmaLesson of turmaLessons) {
          const existingAttendance = await prisma.turmaAttendance.findFirst({
            where: {
              turmaLessonId: turmaLesson.id,
              studentId: student.id
            }
          });

          if (!existingAttendance) {
            await prisma.turmaAttendance.create({
              data: {
                turmaId: turma.id,
                turmaLessonId: turmaLesson.id,
                turmaStudentId: turmaStudent.id,
                studentId: student.id,
                present: true,
                late: false,
                justified: false,
                notes: `Seed data - Frequência registrada`
              }
            });
            console.log(`   ✅ Presença registrada para "${student.user.firstName}" - Lesson ${turmaLesson.id.substring(0, 8)}`);
          }
        }
      }
    }

    console.log('\n✅ CORREÇÃO CONCLUÍDA!\n');

    // 5. Mostrar resumo
    const totalEnrollments = await prisma.studentCourse.count();
    const totalAttendances = await prisma.turmaAttendance.count();
    const studentsWithPlans = await prisma.studentSubscription.count({
      where: { status: 'ACTIVE' }
    });

    console.log('📊 RESUMO PÓS-CORREÇÃO:');
    console.log(`   ✅ Alunos com plano ativo: ${studentsWithPlans}/${students.length}`);
    console.log(`   ✅ Matrículas em cursos: ${totalEnrollments}`);
    console.log(`   ✅ Presenças registradas: ${totalAttendances}`);
    console.log('\n💡 Execute novamente `npx tsx scripts/audit-seed-data.ts` para verificar');

  } catch (error) {
    console.error('\n❌ Erro na correção:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixSeedData()
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
