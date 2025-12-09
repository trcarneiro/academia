/**
 * Final Cleanup Script
 * 
 * 1. Remove test students
 * 2. Remove remaining name duplicates
 * 3. Consolidate multiple active subscriptions into one
 * 4. Fix inactive students with active subscriptions
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ORG_ID = 'ff5ee00e-d8a3-4291-9428-d28b852fb472';
const DRY_RUN = process.argv.includes('--dry-run');

// Helper to get full name
function getFullName(user: { firstName: string; lastName: string }): string {
  return `${user.firstName} ${user.lastName}`.trim();
}

async function main() {
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`🧹 LIMPEZA FINAL - ${DRY_RUN ? 'DRY RUN' : 'EXECUÇÃO REAL'}`);
  console.log(`${'═'.repeat(50)}\n`);

  let testDeleted = 0;
  let dupesDeleted = 0;
  let subsDeactivated = 0;
  let studentsActivated = 0;

  // 1. Delete test students
  console.log('📋 ETAPA 1: Removendo alunos de teste...\n');
  
  const allStudentsForTest = await prisma.student.findMany({
    where: { organizationId: ORG_ID },
    include: { user: true }
  });
  
  const testStudents = allStudentsForTest.filter(s => {
    const fullName = getFullName(s.user).toLowerCase();
    return fullName.includes('test') || fullName.includes('teste');
  });

  for (const student of testStudents) {
    const fullName = getFullName(student.user);
    console.log(`  ❌ Deletando: ${fullName} (${student.id.slice(0, 8)})`);
    if (!DRY_RUN) {
      try {
        // Delete subscriptions
        await prisma.studentSubscription.deleteMany({
          where: { studentId: student.id }
        });
        // Delete Asaas customer
        await prisma.asaasCustomer.deleteMany({
          where: { studentId: student.id }
        });
        // Delete student
        await prisma.student.delete({ where: { id: student.id } });
        // Delete user
        await prisma.user.delete({ where: { id: student.userId } });
        console.log(`     🗑️  DELETADO`);
        testDeleted++;
      } catch (err: any) {
        console.log(`     ⚠️  Erro: ${err.message?.slice(0, 50)}`);
      }
    } else {
      testDeleted++;
    }
  }

  // 2. Remove remaining name duplicates
  console.log('\n📋 ETAPA 2: Removendo duplicados por nome restantes...\n');
  
  // Reload after test deletions
  const allStudents = await prisma.student.findMany({
    where: { organizationId: ORG_ID },
    include: {
      user: true,
      asaasCustomer: true,
      subscriptions: { where: { isActive: true } },
      attendances: true
    }
  });

  // Group by normalized name
  const byName = new Map<string, typeof allStudents>();
  for (const s of allStudents) {
    const key = getFullName(s.user).toUpperCase().trim();
    if (!byName.has(key)) byName.set(key, []);
    byName.get(key)!.push(s);
  }

  // Find groups with duplicates
  for (const [name, group] of byName) {
    if (group.length <= 1) continue;
    if (name.includes('TEST')) continue; // Already handled

    console.log(`📋 Nome: ${name}`);
    console.log(`${'─'.repeat(50)}`);

    // Sort: prefer those with Asaas, then subscriptions, then attendances
    group.sort((a, b) => {
      const scoreA = (a.asaasCustomer ? 100 : 0) + a.subscriptions.length * 10 + a.attendances.length;
      const scoreB = (b.asaasCustomer ? 100 : 0) + b.subscriptions.length * 10 + b.attendances.length;
      return scoreB - scoreA;
    });

    const [keeper, ...duplicates] = group;
    const keeperName = getFullName(keeper.user);
    console.log(`  ✅ MANTER: ${keeperName} (${keeper.id.slice(0, 8)})`);
    console.log(`     Asaas: ${keeper.asaasCustomer ? '✓' : '✗'} | Sub: ${keeper.subscriptions.length} | Freq: ${keeper.attendances.length}`);

    for (const dup of duplicates) {
      const dupName = getFullName(dup.user);
      console.log(`  ❌ DELETAR: ${dupName} (${dup.id.slice(0, 8)})`);
      console.log(`     Asaas: ${dup.asaasCustomer ? '✓' : '✗'} | Sub: ${dup.subscriptions.length} | Freq: ${dup.attendances.length}`);
      
      if (!DRY_RUN) {
        try {
          await prisma.studentSubscription.deleteMany({
            where: { studentId: dup.id }
          });
          await prisma.asaasCustomer.deleteMany({
            where: { studentId: dup.id }
          });
          await prisma.student.delete({ where: { id: dup.id } });
          await prisma.user.delete({ where: { id: dup.userId } });
          console.log(`     🗑️  DELETADO`);
          dupesDeleted++;
        } catch (err: any) {
          console.log(`     ⚠️  Erro: ${err.message?.slice(0, 50)}`);
        }
      } else {
        dupesDeleted++;
      }
    }
    console.log();
  }

  // 3. Consolidate multiple active subscriptions
  console.log('\n📋 ETAPA 3: Consolidando múltiplas matrículas ativas...\n');

  // Reload after duplicate deletions
  const studentsWithSubs = await prisma.student.findMany({
    where: { organizationId: ORG_ID },
    include: {
      user: true,
      subscriptions: {
        where: { isActive: true },
        include: { plan: true }
      }
    }
  });

  for (const student of studentsWithSubs) {
    if (student.subscriptions.length <= 1) continue;

    const fullName = getFullName(student.user);
    console.log(`👤 ${fullName}: ${student.subscriptions.length} matrículas`);
    
    // Find the best subscription (Ilimitado with highest price)
    const sorted = [...student.subscriptions].sort((a, b) => {
      // Prefer Ilimitado
      if (a.plan.name === 'Ilimitado' && b.plan.name !== 'Ilimitado') return -1;
      if (b.plan.name === 'Ilimitado' && a.plan.name !== 'Ilimitado') return 1;
      // Then by currentPrice
      const priceA = a.currentPrice?.toNumber() || 0;
      const priceB = b.currentPrice?.toNumber() || 0;
      return priceB - priceA;
    });

    const [keeper, ...toDeactivate] = sorted;
    console.log(`  ✅ Manter: ${keeper.plan.name} - R$ ${keeper.currentPrice?.toNumber() || 'N/A'}`);

    for (const sub of toDeactivate) {
      console.log(`  ❌ Desativar: ${sub.plan.name} - R$ ${sub.currentPrice?.toNumber() || 'N/A'}`);
      
      if (!DRY_RUN) {
        await prisma.studentSubscription.update({
          where: { id: sub.id },
          data: { isActive: false }
        });
        subsDeactivated++;
      } else {
        subsDeactivated++;
      }
    }
  }

  // 4. Fix inactive students with active subscriptions
  console.log('\n📋 ETAPA 4: Ativando alunos com matrículas ativas...\n');

  const inactiveWithActiveSub = await prisma.student.findMany({
    where: {
      organizationId: ORG_ID,
      isActive: false,
      subscriptions: {
        some: { isActive: true }
      }
    },
    include: {
      user: true,
      subscriptions: { where: { isActive: true } }
    }
  });

  console.log(`  Encontrados: ${inactiveWithActiveSub.length} alunos inativos com matrícula ativa\n`);

  if (!DRY_RUN && inactiveWithActiveSub.length > 0) {
    await prisma.student.updateMany({
      where: {
        organizationId: ORG_ID,
        isActive: false,
        subscriptions: {
          some: { isActive: true }
        }
      },
      data: { isActive: true }
    });
    studentsActivated = inactiveWithActiveSub.length;
    console.log(`  ✅ ${studentsActivated} alunos ativados`);
  } else {
    studentsActivated = inactiveWithActiveSub.length;
  }

  // Summary
  console.log(`\n${'═'.repeat(50)}`);
  console.log('📊 RESUMO DA LIMPEZA FINAL');
  console.log(`${'═'.repeat(50)}`);
  console.log(`  Alunos de teste deletados: ${testDeleted}`);
  console.log(`  Duplicados por nome deletados: ${dupesDeleted}`);
  console.log(`  Matrículas extras desativadas: ${subsDeactivated}`);
  console.log(`  Alunos ativados: ${studentsActivated}`);

  if (DRY_RUN) {
    console.log('\n⚠️  DRY RUN - Nenhuma alteração foi feita');
    console.log('Execute sem --dry-run para aplicar');
  } else {
    console.log('\n✅ Limpeza final concluída!');
  }

  // Final counts
  const finalCount = await prisma.student.count({
    where: { organizationId: ORG_ID }
  });
  const activeCount = await prisma.student.count({
    where: { organizationId: ORG_ID, isActive: true }
  });
  const activeSubCount = await prisma.studentSubscription.count({
    where: { 
      student: { organizationId: ORG_ID },
      isActive: true
    }
  });

  console.log(`\n📊 CONTAGEM FINAL:`);
  console.log(`  Total de alunos: ${finalCount}`);
  console.log(`  Alunos ativos: ${activeCount}`);
  console.log(`  Matrículas ativas: ${activeSubCount}`);

  await prisma.$disconnect();
}

main().catch(console.error);
