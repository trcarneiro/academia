const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('\n=== VERIFICANDO DADOS NO BANCO ===\n');

    // Verificar estudantes
    const studentsCount = await prisma.student.count();
    console.log(`📚 Total de Estudantes: ${studentsCount}`);
    if (studentsCount > 0) {
      const students = await prisma.student.findMany({ include: { user: true }, take: 5 });
      console.log(`   Primeiros 5: ${students.map(s => `${s.user?.firstName} ${s.user?.lastName}`).join(', ')}`);
    }

    // Verificar instrutores
    const instructorsCount = await prisma.instructor.count();
    console.log(`\n👨‍🏫 Total de Instrutores: ${instructorsCount}`);
    if (instructorsCount > 0) {
      const instructors = await prisma.instructor.findMany({ include: { user: true }, take: 5 });
      console.log(`   Primeiros 5: ${instructors.map(i => `${i.user?.firstName} ${i.user?.lastName}`).join(', ')}`);
    }

    // Verificar turmas
    const turmasCount = await prisma.turma.count();
    console.log(`\n📅 Total de Turmas: ${turmasCount}`);
    if (turmasCount > 0) {
      const turmas = await prisma.turma.findMany({ take: 3 });
      console.log(`   Primeiros 3: ${turmas.map(t => t.name).join(', ')}`);
    }

    // Verificar cursos
    const coursesCount = await prisma.course.count();
    console.log(`\n🥋 Total de Cursos: ${coursesCount}`);
    if (coursesCount > 0) {
      const courses = await prisma.course.findMany({ take: 3 });
      console.log(`   Primeiros 3: ${courses.map(c => c.name).join(', ')}`);
    }

    // Verificar leads CRM
    const leadsCount = await prisma.lead.count();
    console.log(`\n💼 Total de Leads: ${leadsCount}`);

    // Verificar organizações
    const orgsCount = await prisma.organization.count();
    console.log(`\n🏢 Total de Organizações: ${orgsCount}`);
    if (orgsCount > 0) {
      const orgs = await prisma.organization.findMany({ take: 3 });
      console.log(`   Primeiros 3: ${orgs.map(o => o.name).join(', ')}`);
    }

    // Verificar usuários
    const usersCount = await prisma.user.count();
    console.log(`\n👤 Total de Usuários: ${usersCount}`);

    // Verificar subscriptions
    const subsCount = await prisma.studentSubscription.count();
    console.log(`\n💳 Total de Subscriptions: ${subsCount}`);

    // Verificar planos de aula
    const lessonPlansCount = await prisma.lessonPlan.count();
    console.log(`\n📖 Total de Planos de Aula: ${lessonPlansCount}`);

    console.log('\n=== FIM DA VERIFICAÇÃO ===\n');

  } catch (error) {
    console.error('❌ ERRO ao verificar banco:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
