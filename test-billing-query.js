const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testBillingPlansQuery() {
  try {
    console.log('🧪 Testing billing plans query...');
    
    // Test the same query that was failing in the server
    const billingPlans = await prisma.billingPlan.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        billingType: true,
        isActive: true,
        features: true,
        category: true,  // This was the problematic field
        classesPerWeek: true,
        hasPersonalTraining: true,
        hasNutrition: true,
        allowFreeze: true,
        createdAt: true,
        updatedAt: true
      },
      where: {
        isActive: true
      },
      orderBy: {
        price: 'asc'
      }
    });
    
    console.log('✅ Query successful! Found', billingPlans.length, 'plans');
    console.log('First plan:', billingPlans[0] ? {
      name: billingPlans[0].name,
      price: billingPlans[0].price.toString(),
      category: billingPlans[0].category
    } : 'No plans found');
    
  } catch (error) {
    console.error('❌ Query failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testBillingPlansQuery();
