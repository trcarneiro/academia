import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCourseState() {
  try {
    const course = await prisma.course.findUnique({
      where: { id: 'krav-maga-faixa-branca-2025' },
      include: {
        _count: {
          select: {
            lessonPlans: true,
            techniques: true,
            graduations: true
          }
        }
      }
    });

    if (course) {
      console.log('✅ CURSO EXISTE NO BANCO');
      console.log(`📚 Nome: ${course.name}`);
      console.log(`📖 Aulas: ${course._count.lessonPlans} de 28 esperadas`);
      console.log(`🥋 Técnicas: ${course._count.techniques} de 65 esperadas`);
      console.log(`🎓 Graduações: ${course._count.graduations}`);
      console.log(`📅 Criado em: ${course.createdAt}`);
      console.log(`\n🔍 Status: ${course._count.lessonPlans === 28 ? '✅ COMPLETO' : '⚠️ PARCIAL'}`);
    } else {
      console.log('❌ CURSO NÃO EXISTE NO BANCO');
    }
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCourseState();
