/**
 * Script para analisar duplicados e inconsistências nos alunos
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyze() {
  const orgId = 'ff5ee00e-d8a3-4291-9428-d28b852fb472';
  
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
  
  // Buscar todos os alunos com seus dados
  const allStudents = await prisma.student.findMany({
    where: { organizationId: orgId },
    include: { 
      user: { select: { firstName: true, lastName: true, email: true } },
      subscriptions: { where: { isActive: true } }
    }
  });
  
  // Verificar duplicados por email
  const emailCount: Record<string, number> = {};
  for (const s of allStudents) {
    const email = s.user.email?.toLowerCase() || '';
    if (email) {
      emailCount[email] = (emailCount[email] || 0) + 1;
    }
  }
  const duplicateEmails = Object.entries(emailCount).filter(([_, count]) => count > 1).sort((a, b) => b[1] - a[1]);
  
  console.log(`\n📧 EMAILS DUPLICADOS: ${duplicateEmails.length} encontrados`);
  console.log('─'.repeat(40));
  for (const [email, count] of duplicateEmails.slice(0, 15)) {
    console.log(`  ${email}: ${count}x`);
  }
  
  // Verificar duplicados por nome
  const nameCount: Record<string, number> = {};
  for (const s of allStudents) {
    const name = `${s.user.firstName} ${s.user.lastName}`.trim().toLowerCase();
    if (name) {
      nameCount[name] = (nameCount[name] || 0) + 1;
    }
  }
  const duplicateNames = Object.entries(nameCount).filter(([_, count]) => count > 1).sort((a, b) => b[1] - a[1]);
  
  console.log(`\n👤 NOMES DUPLICADOS: ${duplicateNames.length} encontrados`);
  console.log('─'.repeat(40));
  for (const [name, count] of duplicateNames.slice(0, 15)) {
    console.log(`  ${name}: ${count}x`);
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
  const multiSubStudents = allStudents.filter(s => s.subscriptions.length > 1);
  console.log(`\n⚠️  ALUNOS COM MÚLTIPLAS MATRÍCULAS ATIVAS: ${multiSubStudents.length}`);
  console.log('─'.repeat(40));
  for (const s of multiSubStudents.slice(0, 10)) {
    console.log(`  ${s.user.firstName} ${s.user.lastName}: ${s.subscriptions.length} matrículas ativas`);
  }
  
  // Alunos ativos SEM matrícula
  const activeWithoutSub = allStudents.filter(s => s.isActive && s.subscriptions.length === 0);
  console.log(`\n🚫 ALUNOS ATIVOS SEM MATRÍCULA: ${activeWithoutSub.length}`);
  
  // Alunos inativos COM matrícula ativa
  const inactiveWithSub = allStudents.filter(s => !s.isActive && s.subscriptions.length > 0);
  console.log(`⚠️  ALUNOS INATIVOS COM MATRÍCULA ATIVA: ${inactiveWithSub.length}`);
  
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
  
  // Resumo final
  console.log('\n' + '═'.repeat(50));
  console.log('📊 RESUMO DE PROBLEMAS');
  console.log('═'.repeat(50));
  console.log(`  Emails duplicados: ${duplicateEmails.length}`);
  console.log(`  Nomes duplicados: ${duplicateNames.length}`);
  console.log(`  Múltiplas matrículas: ${multiSubStudents.length}`);
  console.log(`  Ativos sem matrícula: ${activeWithoutSub.length}`);
  console.log(`  Inativos com matrícula: ${inactiveWithSub.length}`);
  
  await prisma.$disconnect();
}

analyze().catch(console.error);
