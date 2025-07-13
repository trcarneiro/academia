const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixKMA0001CheckIn() {
  try {
    console.log('🔍 Searching for student KMA0001...');
    
    // Find student KMA0001
    const student = await prisma.student.findFirst({
      where: { matricula: 'KMA0001' },
      include: { 
        user: true, 
        subscriptions: {
          where: { isActive: true }
        }
      }
    });
    
    if (!student) {
      console.error('❌ Student KMA0001 not found!');
      return;
    }
    
    console.log(`✅ Found student: ${student.user.firstName} ${student.user.lastName}`);
    console.log(`📊 Current active subscriptions: ${student.subscriptions.length}`);
    
    // If already has active subscription, skip
    if (student.subscriptions.length > 0) {
      console.log('✅ Student already has active subscription - check-in should work!');
      return;
    }
    
    // Find a suitable billing plan
    console.log('🔍 Looking for suitable billing plan...');
    const plan = await prisma.billingPlan.findFirst({
      where: {
        category: student.category, // Match student category
        isActive: true
      }
    });
    
    if (!plan) {
      // Get any active plan as fallback
      const fallbackPlan = await prisma.billingPlan.findFirst({
        where: { isActive: true }
      });
      
      if (!fallbackPlan) {
        console.error('❌ No active billing plans found!');
        return;
      }
      
      console.log(`⚠️ No plan for category ${student.category}, using fallback: ${fallbackPlan.name}`);
      
      // Create subscription with fallback plan
      await createSubscription(student.id, fallbackPlan.id, fallbackPlan.name);
    } else {
      console.log(`✅ Found matching plan: ${plan.name} (${plan.category})`);
      
      // Create subscription
      await createSubscription(student.id, plan.id, plan.name);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function createSubscription(studentId, planId, planName) {
  try {
    console.log(`🔧 Creating subscription for plan: ${planName}...`);
    
    const subscription = await prisma.studentSubscription.create({
      data: {
        organizationId: 'krav-maga-academy', // Default org ID
        studentId: studentId,
        planId: planId,
        currentPrice: 0, // Free for testing
        billingType: 'MONTHLY',
        startDate: new Date(),
        status: 'ACTIVE',
        isActive: true
      }
    });
    
    console.log('✅ Subscription created successfully!');
    console.log(`📝 Subscription ID: ${subscription.id}`);
    console.log('🎉 KMA0001 should now be able to check-in!');
    
  } catch (error) {
    console.error('❌ Failed to create subscription:', error.message);
  }
}

fixKMA0001CheckIn();
