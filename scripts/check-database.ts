import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';

async function checkDatabase() {
  try {
    logger.info('=== VERIFICANDO DADOS NO BANCO ===\n');

    // Verificar estudantes
    const studentsCount = await prisma.student.count();
    logger.info(`📚 Total de Estudantes: ${studentsCount}`);
    if (studentsCount > 0) {
      const students = await prisma.student.findMany({ include: { user: true }, take: 5 });
      logger.info(`   Primeiros 5: ${students.map(s => s.user?.firstName || 'N/A').join(', ')}`);
    }

    // Verificar instrutores
    const instructorsCount = await prisma.instructor.count();
    logger.info(`\n👨‍🏫 Total de Instrutores: ${instructorsCount}`);
    if (instructorsCount > 0) {
      const instructors = await prisma.instructor.findMany({ include: { user: true }, take: 5 });
      logger.info(`   Primeiros 5: ${instructors.map(i => i.user?.firstName || 'N/A').join(', ')}`);
    }

    // Verificar aulas/turmas
    const turmasCount = await prisma.turma.count();
    logger.info(`\n📅 Total de Turmas: ${turmasCount}`);
    if (turmasCount > 0) {
      const turmas = await prisma.turma.findMany({ take: 3 });
      logger.info(`   Primeiros 3: ${turmas.map(t => t.name).join(', ')}`);
    }

    // Verificar cursos
    const coursesCount = await prisma.course.count();
    logger.info(`\n🥋 Total de Cursos: ${coursesCount}`);
    if (coursesCount > 0) {
      const courses = await prisma.course.findMany({ take: 3 });
      logger.info(`   Primeiros 3: ${courses.map(c => c.name).join(', ')}`);
    }

    // Verificar leads CRM
    const leadsCount = await prisma.lead.count();
    logger.info(`\n💼 Total de Leads: ${leadsCount}`);

    // Verificar organizações
    const orgsCount = await prisma.organization.count();
    logger.info(`\n🏢 Total de Organizações: ${orgsCount}`);

    // Verificar usuários
    const usersCount = await prisma.user.count();
    logger.info(`\n👤 Total de Usuários: ${usersCount}`);

    logger.info('\n=== FIM DA VERIFICAÇÃO ===');

  } catch (error) {
    logger.error('❌ ERRO ao verificar banco:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
