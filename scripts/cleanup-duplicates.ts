/**
 * Script para limpar alunos duplicados e corrigir inconsistências
 * 
 * Este script:
 * 1. Identifica alunos duplicados por email
 * 2. Mescla dados (matrículas, frequências) para o registro mais recente
 * 3. Remove registros duplicados órfãos
 * 4. Desativa planos antigos desnecessários
 * 
 * Uso: npx tsx scripts/cleanup-duplicates.ts [--dry-run]
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ORG_ID = 'ff5ee00e-d8a3-4291-9428-d28b852fb472';

interface DuplicateGroup {
  email: string;
  students: {
    id: string;
    name: string;
    isActive: boolean;
    hasSubscription: boolean;
    hasAsaas: boolean;
    attendanceCount: number;
    createdAt: Date;
  }[];
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  
  console.log('🧹 LIMPEZA DE DUPLICADOS - Smart Defence');
  console.log('=========================================');
  if (isDryRun) {
    console.log('⚠️  MODO DRY-RUN: Nenhuma alteração será feita\n');
  } else {
    console.log('🔴 MODO PRODUÇÃO: Alterações serão aplicadas!\n');
  }

  // 1. Buscar todos os alunos com dados relevantes
  console.log('📊 Carregando dados...');
  const allStudents = await prisma.student.findMany({
    where: { organizationId: ORG_ID },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
      subscriptions: { select: { id: true, isActive: true } },
      asaasCustomer: { select: { id: true } },
      attendances: { select: { id: true } },
    },
    orderBy: { createdAt: 'desc' } // Mais recentes primeiro
  });

  console.log(`  Total de alunos: ${allStudents.length}`);

  // 2. Agrupar por email (duplicados)
  const emailGroups: Record<string, typeof allStudents> = {};
  for (const student of allStudents) {
    const email = student.user.email?.toLowerCase().trim() || '';
    if (email) {
      if (!emailGroups[email]) {
        emailGroups[email] = [];
      }
      emailGroups[email].push(student);
    }
  }

  // Filtrar apenas duplicados
  const duplicateGroups = Object.entries(emailGroups)
    .filter(([_, students]) => students.length > 1)
    .map(([email, students]) => ({
      email,
      students: students.map(s => ({
        id: s.id,
        name: `${s.user.firstName} ${s.user.lastName}`,
        isActive: s.isActive,
        hasSubscription: s.subscriptions.some(sub => sub.isActive),
        hasAsaas: !!s.asaasCustomer,
        attendanceCount: s.attendances.length,
        createdAt: s.createdAt,
        userId: s.user.id,
      }))
    }));

  console.log(`\n📧 DUPLICADOS POR EMAIL: ${duplicateGroups.length} grupos\n`);

  let totalRemoved = 0;
  let totalMerged = 0;

  for (const group of duplicateGroups) {
    console.log(`\n🔄 ${group.email}`);
    console.log('─'.repeat(50));

    // Ordenar: priorizar quem tem Asaas > Subscription ativa > Mais frequências > Ativo > Mais recente
    const sorted = group.students.sort((a, b) => {
      // Prioridade 1: Tem Asaas
      if (a.hasAsaas && !b.hasAsaas) return -1;
      if (!a.hasAsaas && b.hasAsaas) return 1;
      
      // Prioridade 2: Tem subscription ativa
      if (a.hasSubscription && !b.hasSubscription) return -1;
      if (!a.hasSubscription && b.hasSubscription) return 1;
      
      // Prioridade 3: Mais frequências
      if (a.attendanceCount !== b.attendanceCount) return b.attendanceCount - a.attendanceCount;
      
      // Prioridade 4: Está ativo
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      
      // Prioridade 5: Mais recente
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    const keeper = sorted[0];
    const toRemove = sorted.slice(1);

    console.log(`  ✅ MANTER: ${keeper.name} (${keeper.id.slice(0, 8)}...)`);
    console.log(`     - Asaas: ${keeper.hasAsaas ? '✓' : '✗'}`);
    console.log(`     - Subscription: ${keeper.hasSubscription ? '✓' : '✗'}`);
    console.log(`     - Frequências: ${keeper.attendanceCount}`);
    console.log(`     - Ativo: ${keeper.isActive ? '✓' : '✗'}`);

    for (const dup of toRemove) {
      console.log(`  ❌ REMOVER: ${dup.name} (${dup.id.slice(0, 8)}...)`);
      console.log(`     - Asaas: ${dup.hasAsaas ? '✓' : '✗'}`);
      console.log(`     - Subscription: ${dup.hasSubscription ? '✓' : '✗'}`);
      console.log(`     - Frequências: ${dup.attendanceCount}`);

      if (!isDryRun) {
        // Mover subscriptions para o keeper (se não tiver asaas no duplicado)
        if (!dup.hasAsaas) {
          const movedSubs = await prisma.studentSubscription.updateMany({
            where: { studentId: dup.id },
            data: { studentId: keeper.id }
          });
          if (movedSubs.count > 0) {
            console.log(`     📦 Moveu ${movedSubs.count} subscription(s)`);
            totalMerged += movedSubs.count;
          }
        }

        // Mover frequências
        const movedAttendances = await prisma.attendance.updateMany({
          where: { studentId: dup.id },
          data: { studentId: keeper.id }
        });
        if (movedAttendances.count > 0) {
          console.log(`     📦 Moveu ${movedAttendances.count} frequência(s)`);
          totalMerged += movedAttendances.count;
        }

        // Desativar o duplicado (não deletar, por segurança)
        await prisma.student.update({
          where: { id: dup.id },
          data: { isActive: false }
        });
        console.log(`     🔒 Desativado`);
        totalRemoved++;
      }
    }
  }

  // 3. Limpar nomes duplicados (sem email)
  console.log('\n\n👤 ANALISANDO NOMES DUPLICADOS (sem email ou email diferente)...');
  
  const nameGroups: Record<string, typeof allStudents> = {};
  for (const student of allStudents) {
    const name = `${student.user.firstName} ${student.user.lastName}`.toLowerCase().trim();
    if (name && name !== 'test student') { // Ignorar test students
      if (!nameGroups[name]) {
        nameGroups[name] = [];
      }
      nameGroups[name].push(student);
    }
  }

  const nameDuplicates = Object.entries(nameGroups)
    .filter(([_, students]) => students.length > 1)
    .filter(([_, students]) => {
      // Verificar se são emails diferentes (já tratamos emails iguais)
      const emails = new Set(students.map(s => s.user.email?.toLowerCase() || ''));
      return emails.size > 1 || emails.has('');
    });

  console.log(`  Encontrados: ${nameDuplicates.length} grupos de nomes duplicados com emails diferentes`);
  console.log('  ⚠️  Estes precisam de revisão manual (podem ser pessoas diferentes)\n');

  // 4. Desativar planos antigos sem uso
  console.log('\n📋 LIMPANDO PLANOS ANTIGOS...');
  
  const plans = await prisma.billingPlan.findMany({
    where: { organizationId: ORG_ID },
    include: {
      subscriptions: { where: { isActive: true }, select: { id: true } }
    }
  });

  let plansDeactivated = 0;
  for (const plan of plans) {
    // Manter apenas o "Ilimitado" e planos com subscriptions ativas
    if (plan.name !== 'Ilimitado' && plan.subscriptions.length === 0) {
      if (!isDryRun) {
        await prisma.billingPlan.update({
          where: { id: plan.id },
          data: { isActive: false }
        });
      }
      console.log(`  ❌ Desativado: ${plan.name} (0 matrículas)`);
      plansDeactivated++;
    } else {
      console.log(`  ✅ Mantido: ${plan.name} (${plan.subscriptions.length} matrículas)`);
    }
  }

  // 5. Corrigir alunos inativos com matrícula ativa
  console.log('\n🔧 CORRIGINDO INCONSISTÊNCIAS...');
  
  const inactiveWithActiveSub = await prisma.student.findMany({
    where: {
      organizationId: ORG_ID,
      isActive: false,
      subscriptions: { some: { isActive: true } }
    },
    include: {
      user: { select: { firstName: true, lastName: true } },
      subscriptions: { where: { isActive: true } }
    }
  });

  console.log(`  Alunos inativos com matrícula ativa: ${inactiveWithActiveSub.length}`);
  
  for (const student of inactiveWithActiveSub) {
    if (!isDryRun) {
      // Desativar as matrículas
      await prisma.studentSubscription.updateMany({
        where: { studentId: student.id, isActive: true },
        data: { isActive: false }
      });
    }
    console.log(`  🔧 ${student.user.firstName} ${student.user.lastName}: matrículas desativadas`);
  }

  // 6. Remover Test Students
  console.log('\n🧪 REMOVENDO TEST STUDENTS...');
  
  const testStudents = await prisma.student.findMany({
    where: {
      organizationId: ORG_ID,
      user: {
        OR: [
          { firstName: { contains: 'Test', mode: 'insensitive' } },
          { firstName: { contains: 'Teste', mode: 'insensitive' } },
          { lastName: { contains: 'Student', mode: 'insensitive' } },
        ]
      }
    },
    include: {
      user: { select: { firstName: true, lastName: true } }
    }
  });

  console.log(`  Test students encontrados: ${testStudents.length}`);
  
  for (const student of testStudents) {
    if (!isDryRun) {
      await prisma.student.update({
        where: { id: student.id },
        data: { isActive: false }
      });
    }
    console.log(`  🗑️  Desativado: ${student.user.firstName} ${student.user.lastName}`);
  }

  // Resumo final
  console.log('\n' + '═'.repeat(50));
  console.log('📊 RESUMO DA LIMPEZA');
  console.log('═'.repeat(50));
  console.log(`  Duplicados por email desativados: ${totalRemoved}`);
  console.log(`  Dados mesclados: ${totalMerged}`);
  console.log(`  Planos desativados: ${plansDeactivated}`);
  console.log(`  Matrículas inconsistentes corrigidas: ${inactiveWithActiveSub.length}`);
  console.log(`  Test students desativados: ${testStudents.length}`);
  
  if (isDryRun) {
    console.log('\n⚠️  Execute sem --dry-run para aplicar as mudanças');
  } else {
    console.log('\n✅ Limpeza concluída!');
  }

  await prisma.$disconnect();
}

main().catch(console.error);
