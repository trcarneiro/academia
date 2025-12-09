/**
 * Script para configurar plano Ilimitado e associar alunos com Asaas ativo
 * 
 * Este script:
 * 1. Cria ou atualiza um plano "Ilimitado" padrão
 * 2. Associa SOMENTE alunos que têm conta no Asaas (asaasCustomerId)
 * 3. Mantém o valor personalizado na matrícula (StudentSubscription)
 * 
 * Uso: npx tsx scripts/setup-unlimited-plan.ts [--dry-run]
 */

import { PrismaClient, BillingType, SubscriptionStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Configuração do plano Ilimitado
const UNLIMITED_PLAN_CONFIG = {
  name: 'Ilimitado',
  description: 'Acesso ilimitado a todas as aulas e modalidades',
  price: 199.00, // Preço base (pode ser personalizado por aluno)
  billingType: BillingType.MONTHLY,
  isUnlimitedAccess: true,
  accessAllModalities: true,
  classesPerWeek: null, // Sem limite
  maxClasses: null, // Sem limite
  isActive: true,
  allowFreeze: true,
  freezeMaxDays: 30,
  isRecurring: true,
};

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  
  console.log('🚀 Setup do Plano Ilimitado (Somente Alunos com Asaas)');
  console.log('=======================================================');
  if (isDryRun) {
    console.log('⚠️  MODO DRY-RUN: Nenhuma alteração será feita\n');
  }

  // 1. Buscar todas as organizações
  const organizations = await prisma.organization.findMany({
    select: { id: true, name: true }
  });

  console.log(`📊 Organizações encontradas: ${organizations.length}\n`);

  for (const org of organizations) {
    console.log(`\n🏢 Processando: ${org.name}`);
    console.log('─'.repeat(50));

    // 2. Verificar se já existe plano Ilimitado
    let unlimitedPlan = await prisma.billingPlan.findFirst({
      where: {
        organizationId: org.id,
        name: 'Ilimitado'
      }
    });

    if (!unlimitedPlan) {
      console.log('  📋 Criando plano Ilimitado...');
      
      if (!isDryRun) {
        unlimitedPlan = await prisma.billingPlan.create({
          data: {
            organizationId: org.id,
            ...UNLIMITED_PLAN_CONFIG,
            price: UNLIMITED_PLAN_CONFIG.price,
          }
        });
        console.log(`  ✅ Plano criado: ${unlimitedPlan.id}`);
      } else {
        console.log('  [DRY-RUN] Plano seria criado');
        unlimitedPlan = { id: 'fake-plan-id' } as any;
      }
    } else {
      console.log(`  ✓ Plano Ilimitado já existe: ${unlimitedPlan.id}`);
      
      // Atualizar para garantir que está com as configurações corretas
      if (!isDryRun) {
        await prisma.billingPlan.update({
          where: { id: unlimitedPlan.id },
          data: {
            isUnlimitedAccess: true,
            accessAllModalities: true,
            isActive: true,
          }
        });
      }
    }

    // 3. Buscar alunos que têm conta no Asaas (asaasCustomer vinculado)
    const studentsWithAsaas = await prisma.student.findMany({
      where: {
        organizationId: org.id,
        isActive: true,
        // SOMENTE alunos que têm AsaasCustomer vinculado
        asaasCustomer: {
          isNot: null
        }
      },
      include: {
        asaasCustomer: true,
        subscriptions: {
          where: { isActive: true },
          take: 1
        },
        user: {
          select: { firstName: true, lastName: true }
        }
      }
    });

    // Também buscar total de alunos para comparação
    const totalStudents = await prisma.student.count({
      where: { organizationId: org.id, isActive: true }
    });

    console.log(`  👥 Alunos ativos total: ${totalStudents}`);
    console.log(`  💳 Alunos COM Asaas: ${studentsWithAsaas.length}`);
    console.log(`  ⚠️  Alunos SEM Asaas: ${totalStudents - studentsWithAsaas.length}`);

    let created = 0;
    let skipped = 0;
    let updated = 0;

    for (const student of studentsWithAsaas) {
      const studentName = `${student.user.firstName} ${student.user.lastName}`;
      
      // Verificar se já tem subscription no plano Ilimitado
      const existingSubscription = student.subscriptions.find(
        s => s.planId === unlimitedPlan!.id
      );

      if (existingSubscription) {
        skipped++;
        continue;
      }

      // Verificar se tem outra subscription ativa (pegar o valor dela)
      const currentSubscription = student.subscriptions[0];
      const customPrice = currentSubscription 
        ? Number(currentSubscription.currentPrice) 
        : UNLIMITED_PLAN_CONFIG.price;

      if (!isDryRun) {
        // Desativar subscriptions antigas
        if (currentSubscription) {
          await prisma.studentSubscription.update({
            where: { id: currentSubscription.id },
            data: { isActive: false, status: SubscriptionStatus.CANCELLED }
          });
          updated++;
        }

        // Criar nova subscription no plano Ilimitado
        try {
          await prisma.studentSubscription.create({
            data: {
              organizationId: org.id,
              studentId: student.id,
              planId: unlimitedPlan!.id,
              currentPrice: customPrice,
              billingType: BillingType.MONTHLY,
              status: SubscriptionStatus.ACTIVE,
              isActive: true,
              startDate: new Date(),
              autoRenew: true,
            }
          });
          created++;
          console.log(`    ✅ ${studentName}: R$ ${customPrice.toFixed(2)}`);
        } catch (err: any) {
          console.error(`    ❌ Erro ao criar subscription para ${studentName}: ${err.message}`);
        }
      } else {
        console.log(`  [DRY-RUN] ${studentName}: R$ ${customPrice.toFixed(2)}`);
        created++;
      }
    }

    console.log(`  📊 Resultado:`);
    console.log(`     - Criados: ${created}`);
    console.log(`     - Atualizados: ${updated}`);
    console.log(`     - Já no plano: ${skipped}`);
  }

  // 4. Resumo final
  console.log('\n');
  console.log('═'.repeat(50));
  console.log('📋 RESUMO FINAL');
  console.log('═'.repeat(50));

  const totalPlans = await prisma.billingPlan.count({
    where: { name: 'Ilimitado' }
  });

  const totalSubscriptions = await prisma.studentSubscription.count({
    where: { 
      isActive: true,
      plan: { name: 'Ilimitado' }
    }
  });

  console.log(`  ✅ Planos "Ilimitado" ativos: ${totalPlans}`);
  console.log(`  ✅ Alunos no plano Ilimitado: ${totalSubscriptions}`);

  if (isDryRun) {
    console.log('\n⚠️  Execute sem --dry-run para aplicar as mudanças');
  }
}

main()
  .catch((error) => {
    console.error('❌ Erro:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
