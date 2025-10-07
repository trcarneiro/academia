#!/usr/bin/env npx tsx

/**
 * 🧹 SCRIPT DE LIMPEZA SIMPLES 
 * =============================
 * 
 * Limpeza usando Prisma Client ao invés de SQL raw.
 * Mais seguro e compatível com diferentes bancos.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ORG_ID = '452c0b35-1822-4890-851e-922356c812fb';

async function cleanDemoDataSafe() {
  console.log('🧹 Limpeza segura dos dados demo...');
  
  try {
    let totalDeleted = 0;

    // 1. Presenças
    const deletedAttendances = await prisma.attendance.deleteMany({
      where: { organizationId: ORG_ID }
    });
    console.log(`   ✅ Presenças: ${deletedAttendances.count} removidas`);
    totalDeleted += deletedAttendances.count;

    // 2. Assinaturas de estudantes
    const deletedSubscriptions = await prisma.studentSubscription.deleteMany({
      where: { organizationId: ORG_ID }
    });
    console.log(`   ✅ Assinaturas: ${deletedSubscriptions.count} removidas`);
    totalDeleted += deletedSubscriptions.count;

    // 3. Pagamentos
    const deletedPayments = await prisma.payment.deleteMany({
      where: { organizationId: ORG_ID }
    });
    console.log(`   ✅ Pagamentos: ${deletedPayments.count} removidos`);
    totalDeleted += deletedPayments.count;

    // 4. Aulas
    const deletedClasses = await prisma.class.deleteMany({
      where: { organizationId: ORG_ID }
    });
    console.log(`   ✅ Aulas: ${deletedClasses.count} removidas`);
    totalDeleted += deletedClasses.count;

    // 5. Estudantes  
    const deletedStudents = await prisma.student.deleteMany({
      where: { organizationId: ORG_ID }
    });
    console.log(`   ✅ Estudantes: ${deletedStudents.count} removidos`);
    totalDeleted += deletedStudents.count;

    // 6. Instrutores
    const deletedInstructors = await prisma.instructor.deleteMany({
      where: { organizationId: ORG_ID }
    });
    console.log(`   ✅ Instrutores: ${deletedInstructors.count} removidos`);
    totalDeleted += deletedInstructors.count;

    // 7. Planos de cobrança
    const deletedPlans = await prisma.billingPlan.deleteMany({
      where: { organizationId: ORG_ID }
    });
    console.log(`   ✅ Planos: ${deletedPlans.count} removidos`);
    totalDeleted += deletedPlans.count;

    // 8. Cursos
    const deletedCourses = await prisma.course.deleteMany({
      where: { organizationId: ORG_ID }
    });
    console.log(`   ✅ Cursos: ${deletedCourses.count} removidos`);
    totalDeleted += deletedCourses.count;

    // 9. Usuários (exceto admins)
    const deletedUsers = await prisma.user.deleteMany({
      where: { 
        organizationId: ORG_ID,
        role: { not: 'ADMIN' }
      }
    });
    console.log(`   ✅ Usuários: ${deletedUsers.count} removidos`);
    totalDeleted += deletedUsers.count;

    console.log(`\n🎯 Limpeza concluída!`);
    console.log(`📊 Total: ${totalDeleted} registros removidos`);

  } catch (error) {
    console.error('❌ Erro:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
if (require.main === module) {
  cleanDemoDataSafe().catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
}

export { cleanDemoDataSafe };
