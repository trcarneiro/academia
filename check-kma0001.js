const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log('🔍 Connecting to database...');
    
    // Check if KMA0001 exists
    const student = await prisma.student.findFirst({
      where: { matricula: 'KMA0001' },
      include: { 
        user: true, 
        subscriptions: {
          where: { isActive: true }
        }
      }
    });
    
    console.log('Student KMA0001:', student ? {
      id: student.id,
      name: student.user.firstName + ' ' + student.user.lastName,
      matricula: student.matricula,
      activeSubscriptions: student.subscriptions.length
    } : 'NOT FOUND');
    
    // Check available billing plans
    const plans = await prisma.billingPlan.findMany({
      where: { isActive: true },
      take: 3
    });
    
    console.log('Available Plans:', plans.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price.toString(),
      billingType: p.billingType,
      category: p.category
    })));
    
    // If KMA0001 exists but has no subscriptions, fix it
    if (student && student.subscriptions.length === 0 && plans.length > 0) {
      console.log('⚠️ KMA0001 has no active subscriptions - creating one...');
      
      const subscription = await prisma.studentSubscription.create({
        data: {
          organizationId: 'krav-maga-academy',
          studentId: student.id,
          planId: plans[0].id,
          currentPrice: plans[0].price,
          billingType: plans[0].billingType,
          startDate: new Date(),
          status: 'ACTIVE',
          isActive: true
        }
      });
      
      console.log('✅ Subscription created:', {
        id: subscription.id,
        planName: plans[0].name,
        status: subscription.status
      });
      console.log('🎉 KMA0001 should now be able to check-in!');
    } else if (student && student.subscriptions.length > 0) {
      console.log('✅ KMA0001 already has active subscription - check-in should work!');
    } else if (!student) {
      console.log('❌ KMA0001 student not found in database');
    } else {
      console.log('❌ No billing plans available to create subscription');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
