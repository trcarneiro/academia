import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteOrganization() {
  const ORG_TO_DELETE = '6fad4290-c504-46e7-ab60-afb76363b1a9'; // Academia Demo
  
  try {
    console.log('🗑️ Deletando organização Academia Demo...');
    
    // Deletar em cascata (seguindo ordem de dependências)
    
    // 1. StudentSubscriptions ligadas aos plans desta org
    const plans = await prisma.billingPlan.findMany({
      where: { organizationId: ORG_TO_DELETE },
      select: { id: true }
    });
    const planIds = plans.map(p => p.id);
    
    const subsDeleted = await prisma.studentSubscription.deleteMany({
      where: { planId: { in: planIds } }
    });
    console.log(`   ✅ ${subsDeleted.count} student subscriptions deletadas`);
    
    // 2. BillingPlans
    const plansDeleted = await prisma.billingPlan.deleteMany({
      where: { organizationId: ORG_TO_DELETE }
    });
    console.log(`   ✅ ${plansDeleted.count} billing plans deletados`);
    
    // 2. Users
    const usersDeleted = await prisma.user.deleteMany({
      where: { organizationId: ORG_TO_DELETE }
    });
    console.log(`   ✅ ${usersDeleted.count} users deletados`);
    
    // 3. Students (se tiver)
    const studentsDeleted = await prisma.student.deleteMany({
      where: { organizationId: ORG_TO_DELETE }
    });
    console.log(`   ✅ ${studentsDeleted.count} students deletados`);
    
    // 4. Courses
    const coursesDeleted = await prisma.course.deleteMany({
      where: { organizationId: ORG_TO_DELETE }
    });
    console.log(`   ✅ ${coursesDeleted.count} courses deletados`);
    
    // 5. Organization
    await prisma.organization.delete({
      where: { id: ORG_TO_DELETE }
    });
    console.log('   ✅ Organização deletada');
    
    console.log('\n🎉 Academia Demo deletada com sucesso!');
    console.log('✅ Agora temos apenas: Academia Krav Maga Demo');
    
  } catch (error) {
    console.error('❌ Erro ao deletar:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteOrganization();
