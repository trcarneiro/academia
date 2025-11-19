import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanAndReimport() {
  try {
    console.log('🧹 Iniciando limpeza do curso...\n');

    const courseId = 'krav-maga-faixa-branca-2025';

    // 1. Verificar estado atual
    const courseBefore = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        _count: {
          select: {
            lessonPlans: true,
            techniques: true
          }
        }
      }
    });

    if (!courseBefore) {
      console.log('❌ Curso não encontrado');
      return;
    }

    console.log('📊 Estado ANTES da limpeza:');
    console.log(`   Aulas: ${courseBefore._count.lessonPlans}`);
    console.log(`   Técnicas: ${courseBefore._count.techniques}\n`);

    // 2. Deletar lesson plans (CASCADE deleta activities)
    const deletedLessons = await prisma.lessonPlan.deleteMany({
      where: { courseId }
    });
    console.log(`✅ ${deletedLessons.count} aulas deletadas`);

    // 3. Deletar associações curso-técnica
    const deletedTechAssoc = await prisma.courseTechnique.deleteMany({
      where: { courseId }
    });
    console.log(`✅ ${deletedTechAssoc.count} associações técnica-curso deletadas`);

    // 4. Deletar o curso
    await prisma.course.delete({
      where: { id: courseId }
    });
    console.log(`✅ Curso deletado\n`);

    console.log('🎉 Limpeza concluída com sucesso!');
    console.log('\n📝 Próximo passo:');
    console.log('   Reimporte o curso pela interface (com o fix de race condition ativo)');

  } catch (error) {
    console.error('❌ Erro na limpeza:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanAndReimport();
