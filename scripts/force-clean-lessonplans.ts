import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function forceClean() {
  try {
    console.log('🗑️  Deletando TODOS os lesson plans...');
    
    const result = await prisma.lessonPlan.deleteMany({});
    
    console.log(`✅ ${result.count} lesson plans deletados!`);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

forceClean();
