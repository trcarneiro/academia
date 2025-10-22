#!/usr/bin/env npx tsx

/**
 * 🔍 Check Organization Dependencies
 * Verifica o que está bloqueando a exclusão da organização secundária
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SECONDARY_ORG_ID = '6fad4290-c504-46e7-ab60-afb76363b1a9'; // Academia Demo

async function main() {
  console.log('🔍 Verificando dependências da organização secundária...\n');
  
  // 1. Students
  const students = await prisma.student.findMany({
    where: { organizationId: SECONDARY_ORG_ID },
    include: { user: { select: { firstName: true, lastName: true } } }
  });
  console.log(`👥 Alunos: ${students.length}`);
  students.forEach(s => console.log(`  - ${s.user.firstName} ${s.user.lastName}`));
  
  // 2. Subscriptions
  const subscriptions = await prisma.studentSubscription.findMany({
    where: { organizationId: SECONDARY_ORG_ID }
  });
  console.log(`\n💳 Assinaturas: ${subscriptions.length}`);
  
  // 3. Billing Plans
  const plans = await prisma.billingPlan.findMany({
    where: { organizationId: SECONDARY_ORG_ID }
  });
  console.log(`📦 Planos: ${plans.length}`);
  
  // 4. Courses
  const courses = await prisma.course.findMany({
    where: { organizationId: SECONDARY_ORG_ID }
  });
  console.log(`📚 Cursos: ${courses.length}`);
  
  // 5. Turmas
  const turmas = await prisma.turma.findMany({
    where: { organizationId: SECONDARY_ORG_ID }
  });
  console.log(`🏫 Turmas: ${turmas.length}`);
  
  // 6. Instructors
  const instructors = await prisma.instructor.findMany({
    where: { organizationId: SECONDARY_ORG_ID }
  });
  console.log(`👨‍🏫 Instrutores: ${instructors.length}`);
  
  // 7. Units
  const units = await prisma.unit.findMany({
    where: { organizationId: SECONDARY_ORG_ID }
  });
  console.log(`🏢 Unidades: ${units.length}`);
  
  // 8. Organization Details
  const org = await prisma.organization.findUnique({
    where: { id: SECONDARY_ORG_ID },
    select: { name: true, createdAt: true }
  });
  
  console.log(`\n📋 Organização: ${org?.name}`);
  console.log(`📅 Criada em: ${org?.createdAt}`);
  
  const hasData = students.length + subscriptions.length + plans.length + courses.length + turmas.length + instructors.length + units.length;
  
  if (hasData === 0) {
    console.log('\n✅ Organização pode ser deletada sem problemas!');
  } else {
    console.log(`\n⚠️  Organização tem ${hasData} registro(s) associado(s)`);
    console.log('💡 Opções:');
    console.log('  1. Migrar dados para organização principal');
    console.log('  2. Deletar dados manualmente primeiro');
    console.log('  3. Adicionar CASCADE ao schema Prisma');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
