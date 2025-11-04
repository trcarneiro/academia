const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPlans() {
  try {
    const total = await prisma.billingPlan.count();
    const active = await prisma.billingPlan.count({ where: { isActive: true } });
    
    console.log('📋 ESTATÍSTICAS DOS PLANOS:');
    console.log('==========================');
    console.log('📈 Total de planos: ' + total);
    console.log('✅ Planos ativos: ' + active);
    
    const plans = await prisma.billingPlan.findMany({
      take: 5,
      orderBy: { price: 'asc' },
      where: { isActive: true }
    });
    
    console.log('');
    console.log('💰 TOP 5 PLANOS POR PREÇO:');
    plans.forEach((plan, i) => {
      console.log((i + 1) + '. ' + plan.name + ' - R$ ' + plan.price + ' (' + plan.billingType + ')');
    });
    
    // Verificar subscriptions ativas
    const subscriptions = await prisma.studentSubscription.count({ where: { status: 'ACTIVE' } });
    console.log('');
    console.log('👥 Assinaturas ativas: ' + subscriptions);
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPlans();
