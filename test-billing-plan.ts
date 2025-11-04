import { prisma } from './src/utils/database';

async function testBillingPlan() {
  try {
    const plan = await prisma.billingPlan.create({
      data: {
        organizationId: 'a55ad715-2eb0-493c-996c-bb0f60bacec9',
        name: 'Test Plan',
        description: 'Test description',
        price: '100.00',
        billingType: 'MONTHLY'
      }
    });
    console.log('✅ Plan created:', plan);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBillingPlan();