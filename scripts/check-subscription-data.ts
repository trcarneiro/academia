/**
 * Verificar dados de assinatura R$ 199 no banco
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSubscriptionData() {
  console.log('🔍 Verificando dados de assinaturas...\n');

  try {
    // 1. Verificar BillingPlans (pacotes disponíveis)
    const billingPlans = await prisma.billingPlan.findMany({
      where: {
        organizationId: 'a55ad715-2eb0-493c-996c-bb0f60bacec9'
      },
      orderBy: { price: 'asc' }
    });

    console.log(`📦 Total de Planos/Pacotes: ${billingPlans.length}`);
    billingPlans.forEach(plan => {
      console.log(`   - ${plan.name}: R$ ${plan.price.toFixed(2)} (${plan.billingType}) - ${plan.isActive ? '✅ Ativo' : '❌ Inativo'}`);
    });

    // 2. Verificar StudentSubscriptions (assinaturas ativas de alunos)
    const subscriptions = await prisma.studentSubscription.findMany({
      where: {
        organizationId: 'a55ad715-2eb0-493c-996c-bb0f60bacec9'
      },
      include: {
        student: { 
          select: { 
            id: true,
            user: { select: { firstName: true, lastName: true } }
          } 
        },
        plan: { select: { name: true, price: true } }
      },
      orderBy: { currentPrice: 'desc' }
    });

    console.log(`\n📅 Total de Assinaturas de Alunos: ${subscriptions.length}`);
    subscriptions.forEach(sub => {
      const studentName = sub.student?.user ? `${sub.student.user.firstName} ${sub.student.user.lastName}` : 'Aluno desconhecido';
      const planName = sub.plan?.name || 'Plano desconhecido';
      console.log(`   - ${studentName}: ${planName} - R$ ${sub.currentPrice.toFixed(2)} (${sub.status})`);
    });

    // 3. Verificar CreditPurchases (compras de crédito)
    const creditPurchases = await prisma.creditPurchase.findMany({
      where: {
        organizationId: 'a55ad715-2eb0-493c-996c-bb0f60bacec9'
      },
      include: {
        student: { 
          select: { 
            id: true,
            user: { select: { firstName: true, lastName: true } }
          } 
        }
      },
      orderBy: { price: 'desc' }
    });

    console.log(`\n🎫 Total de Compras de Crédito: ${creditPurchases.length}`);
    creditPurchases.forEach(credit => {
      const studentName = credit.student?.user ? `${credit.student.user.firstName} ${credit.student.user.lastName}` : 'Aluno desconhecido';
      console.log(`   - ${studentName}: ${credit.creditsTotal} créditos (${credit.creditsRemaining} restantes) - R$ ${credit.price.toFixed(2)}`);
    });

    // 4. Buscar especificamente a assinatura de R$ 199
    const plan199 = billingPlans.find(p => p.price === 199);
    if (plan199) {
      console.log(`\n✅ ENCONTRADO: Plano de R$ 199.00`);
      console.log(`   ID: ${plan199.id}`);
      console.log(`   Nome: ${plan199.name}`);
      console.log(`   Tipo: ${plan199.billingType}`);
      console.log(`   Ativo: ${plan199.isActive ? 'Sim' : 'Não'}`);
      console.log(`   Descrição: ${plan199.description || 'N/A'}`);
      console.log(`   Categoria: ${plan199.category || 'N/A'}`);
    } else {
      console.log(`\n❌ NÃO ENCONTRADO: Plano de R$ 199.00`);
      console.log(`   Valores disponíveis: ${billingPlans.map(p => `R$ ${p.price.toFixed(2)}`).join(', ')}`);
    }

  } catch (error) {
    console.error('❌ Erro ao verificar dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSubscriptionData();
