import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteCourseIfExists() {
  const courseId = 'krav-maga-faixa-branca-2025';
  
  try {
    // Verificar se curso existe
    const existing = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        _count: {
          select: {
            lessonPlans: true,
            graduationLevels: true
          }
        }
      }
    });

    if (existing) {
      console.log('📦 Curso existente encontrado:', existing.name);
      console.log('📚 Lesson plans:', existing._count.lessonPlans);
      console.log('🎓 Graduation levels:', existing._count.graduationLevels);
      
      // Deletar (cascade vai limpar lesson plans, activities, etc.)
      await prisma.course.delete({
        where: { id: courseId }
      });
      
      console.log('✅ Curso deletado com sucesso (cascade)');
    } else {
      console.log('ℹ️  Nenhum curso existente com ID:', courseId);
    }
  } catch (error) {
    console.error('❌ Erro ao deletar curso:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

deleteCourseIfExists();
