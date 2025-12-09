/**
 * Script para analisar duplicados e inconsistências nos alunos
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyze() {
  const orgId = '8c72f327-025f-4f94-8921-477a30a07ef7';
  
  console.log('📊 ANÁLISE DE ALUNOS - Smart Defence');
  console.log('=====================================\n');
  
  // Total de alunos
  const totalStudents = await prisma.student.count({ where: { organizationId: orgId } });
  const activeStudents = await prisma.student.count({ where: { organizationId: orgId, isActive: true } });
  const inactiveStudents = await prisma.student.count({ where: { organizationId: orgId, isActive: false } });
  
  console.log('👥 CONTAGEM DE ALUNOS');
  console.log('─'.repeat(40));
  console.log(`  Total: ${totalStudents}`);
  console.log(`  Ativos: ${activeStudents}`);
  console.log(`  Inativos: ${inactiveStudents}`);
  
  // Verificar duplicados por email
  const duplicateEmails = await prisma.$queryRaw<{email: string, count: bigint}[]>`
    SELECT u.email, COUNT(*)::int as count 
    FROM students s 
    JOIN users u ON s."userId" = u.id
    WHERE s.organization_id = ${orgId}::uuid AND u.email IS NOT NULL AND u.email != ''
    GROUP BY u.email 
    HAVING COUNT(*) > 1
    ORDER BY count DESC
    LIMIT 15
  `;
  
  console.log(`\n📧 EMAILS DUPLICADOS: ${duplicateEmails.length} encontrados`);
  console.log('─'.repeat(40));
  for (const d of duplicateEmails) {
    console.log(`  ${d.email}: ${d.count}x`);
  }
  
  // Verificar duplicados por nome
  const duplicateNames = await prisma.$queryRaw<{name: string, count: bigint}[]>`
    SELECT CONCAT(u.first_name, ' ', u.last_name) as name, COUNT(*)::int as count 
    FROM students s 
    JOIN users u ON s."userId" = u.id
    WHERE s.organization_id = ${orgId}::uuid
    GROUP BY CONCAT(u.first_name, ' ', u.last_name)
    HAVING COUNT(*) > 1
    ORDER BY count DESC
    LIMIT 15
  `;
  
  console.log(`\n👤 NOMES DUPLICADOS: ${duplicateNames.length} encontrados`);
  console.log('─'.repeat(40));
  for (const d of duplicateNames) {
    console.log(`  ${d.name}: ${d.count}x`);
  }
  
  // Subscriptions
  const totalSubs = await prisma.studentSubscription.count({ where: { organizationId: orgId } });
  const activeSubs = await prisma.studentSubscription.count({ where: { organizationId: orgId, isActive: true } });
  const inactiveSubs = await prisma.studentSubscription.count({ where: { organizationId: orgId, isActive: false } });
  
  console.log('\n💳 SUBSCRIPTIONS (MATRÍCULAS)');
  console.log('─'.repeat(40));
  console.log(`  Total: ${totalSubs}`);
  console.log(`  Ativas: ${activeSubs}`);
  console.log(`  Inativas: ${inactiveSubs}`);
  
  // Alunos com múltiplas subscriptions ativas
  const multiSubs = await prisma.$queryRaw<{student_id: string, count: bigint}[]>`
    SELECT student_id, COUNT(*)::int as count 
    FROM student_subscriptions 
    WHERE organization_id = ${orgId}::uuid AND is_active = true
    GROUP BY student_id 
    HAVING COUNT(*) > 1
    ORDER BY count DESC
    LIMIT 10
  `;
  
  console.log(`\n⚠️  ALUNOS COM MÚLTIPLAS MATRÍCULAS ATIVAS: ${multiSubs.length}`);
  console.log('─'.repeat(40));
  for (const s of multiSubs) {
    const student = await prisma.student.findUnique({
      where: { id: s.student_id },
      include: { user: { select: { firstName: true, lastName: true } } }
    });
    if (student) {
      console.log(`  ${student.user.firstName} ${student.user.lastName}: ${s.count} matrículas ativas`);
    }
  }
  
  // Alunos ativos SEM matrícula ativa
  const studentsWithoutSub = await prisma.$queryRaw<{count: bigint}[]>`
    SELECT COUNT(*)::int as count
    FROM students s
    WHERE s.organization_id = ${orgId}::uuid 
      AND s.is_active = true
      AND NOT EXISTS (
        SELECT 1 FROM student_subscriptions ss 
        WHERE ss.student_id = s.id AND ss.is_active = true
      )
  `;
  
  console.log(`\n🚫 ALUNOS ATIVOS SEM MATRÍCULA: ${studentsWithoutSub[0]?.count || 0}`);
  
  // Alunos inativos COM matrícula ativa
  const inactiveWithSub = await prisma.$queryRaw<{count: bigint}[]>`
    SELECT COUNT(*)::int as count
    FROM students s
    WHERE s.organization_id = ${orgId}::uuid 
      AND s.is_active = false
      AND EXISTS (
        SELECT 1 FROM student_subscriptions ss 
        WHERE ss.student_id = s.id AND ss.is_active = true
      )
  `;
  
  console.log(`⚠️  ALUNOS INATIVOS COM MATRÍCULA ATIVA: ${inactiveWithSub[0]?.count || 0}`);
  
  // Planos
  const plans = await prisma.billingPlan.findMany({
    where: { organizationId: orgId },
    select: { id: true, name: true, isActive: true }
  });
  
  console.log('\n📋 PLANOS CADASTRADOS');
  console.log('─'.repeat(40));
  for (const p of plans) {
    const subsCount = await prisma.studentSubscription.count({
      where: { planId: p.id, isActive: true }
    });
    console.log(`  ${p.name}: ${subsCount} matrículas ativas ${p.isActive ? '✓' : '(inativo)'}`);
  }
  
  await prisma.$disconnect();
}

analyze().catch(console.error);
