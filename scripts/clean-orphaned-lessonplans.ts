import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanOrphanedLessonPlans(courseId: string) {
  try {
    console.log(`🔍 Buscando lesson plans órfãos para courseId: ${courseId}`);
    
    const orphanedLessons = await prisma.lessonPlan.findMany({
      where: { courseId }
    });
    
    if (orphanedLessons.length === 0) {
      console.log('✅ Não há lesson plans órfãos');
      return;
    }
    
    console.log(`🗑️  Deletando ${orphanedLessons.length} lesson plans órfãos...`);
    
    const result = await prisma.lessonPlan.deleteMany({
      where: { courseId }
    });
    
    console.log(`✅ ${result.count} lesson plans deletados!`);
    
  } catch (error) {
    console.error('❌ Erro ao deletar lesson plans:', error);
  } finally {
    await prisma.$disconnect();
  }
}

const courseId = process.argv[2] || 'krav-maga-faixa-branca-2025';
cleanOrphanedLessonPlans(courseId);
