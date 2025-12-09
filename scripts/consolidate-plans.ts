/**
 * Script para consolidar todos os planos no plano "Ilimitado" de R$ 269
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Buscando planos existentes...\n');
  
  // 1. Listar todos os planos
  const allPlans = await prisma.billingPlan.findMany({
    include: {
      _count: {
        select: { subscriptions: true }
      }
    }
  });

  console.log('📋 Planos encontrados:');
  for (const plan of allPlans) {
    console.log(`  - ${plan.name}: R$ ${plan.price} (${plan._count.subscriptions} assinaturas)`);
  }
  console.log('');

  // 2. Encontrar o plano Ilimitado
  const unlimitedPlan = allPlans.find((p: any) => 
    p.name.toLowerCase().includes('ilimitado')
  );

  if (!unlimitedPlan) {
    console.log('❌ Plano Ilimitado não encontrado!');
    return;
  }

  console.log(`✅ Plano Ilimitado encontrado: ${unlimitedPlan.name} (ID: ${unlimitedPlan.id})`);
  console.log(`   Preço atual: R$ ${unlimitedPlan.price}`);

  // 3. Atualizar o preço do plano Ilimitado para R$ 269
  await prisma.billingPlan.update({
    where: { id: unlimitedPlan.id },
    data: { price: 269 }
  });
  console.log(`   ✅ Preço atualizado para R$ 269\n`);

  // 4. Migrar assinaturas de outros planos para o Ilimitado
  const otherPlans = allPlans.filter((p: any) => p.id !== unlimitedPlan.id);
  
  for (const plan of otherPlans) {
    const subscriptions = await prisma.subscription.findMany({
      where: { billingPlanId: plan.id },
      include: { student: { include: { user: true } } }
    });

    if (subscriptions.length > 0) {
      console.log(`📦 Migrando ${subscriptions.length} assinaturas de "${plan.name}"...`);
      
      for (const sub of subscriptions) {
        const studentName = sub.student?.user?.name || 'Aluno desconhecido';
        const oldPrice = sub.price;
        
        await prisma.subscription.update({
          where: { id: sub.id },
          data: {
            billingPlanId: unlimitedPlan.id,
            price: 269
          }
        });
        
        console.log(`   ✅ ${studentName}: R$ ${oldPrice} → R$ 269`);
      }
    }
  }

  // 5. Também atualizar assinaturas já no plano Ilimitado para R$ 269
  console.log('\n📦 Atualizando preços das assinaturas existentes no Ilimitado...');
  const unlimitedSubs = await prisma.subscription.findMany({
    where: { billingPlanId: unlimitedPlan.id },
    include: { student: { include: { user: true } } }
  });

  for (const sub of unlimitedSubs) {
    if (Number(sub.price) !== 269) {
      const studentName = sub.student?.user?.name || 'Aluno desconhecido';
      const oldPrice = sub.price;
      
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { price: 269 }
      });
      
      console.log(`   ✅ ${studentName}: R$ ${oldPrice} → R$ 269`);
    }
  }

  // 6. Excluir os outros planos
  console.log('\n🗑️ Excluindo planos antigos...');
  for (const plan of otherPlans) {
    try {
      await prisma.billingPlan.delete({
        where: { id: plan.id }
      });
      console.log(`   ✅ Plano "${plan.name}" excluído`);
    } catch (error: any) {
      console.log(`   ⚠️ Não foi possível excluir "${plan.name}": ${error.message}`);
    }
  }

  // 7. Verificar resultado final
  console.log('\n📊 Resultado final:');
  const remainingPlans = await prisma.billingPlan.findMany({
    include: { _count: { select: { subscriptions: true } } }
  });
  
  for (const plan of remainingPlans) {
    console.log(`  - ${plan.name}: R$ ${plan.price} (${plan._count.subscriptions} assinaturas)`);
  }

  console.log('\n✅ Consolidação concluída!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
