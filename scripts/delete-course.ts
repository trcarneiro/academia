import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteCourse(courseId: string) {
  try {
    console.log(`🔍 Buscando curso: ${courseId}`);
    
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });
    
    if (!course) {
      console.log('❌ Curso não encontrado');
      return;
    }
    
    console.log(`✅ Curso encontrado: ${course.name}`);
    console.log(`🗑️  Deletando curso (cascade)...`);
    
    await prisma.course.delete({
      where: { id: courseId }
    });
    
    console.log('✅ Curso deletado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao deletar curso:', error);
  } finally {
    await prisma.$disconnect();
  }
}

const courseId = process.argv[2] || 'krav-maga-faixa-branca-2025';
deleteCourse(courseId);
