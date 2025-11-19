const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testProgress() {
  try {
    const studentId = 'dc9c17ff-582c-45c6-bc46-7eee1cee4564';
    
    console.log('\n📚 1. Buscando matrícula ativa...');
    const enrollment = await prisma.studentCourse.findFirst({
      where: {
        studentId,
        status: 'ACTIVE',
        isActive: true,
      },
      include: {
        course: true
      },
      orderBy: { startDate: 'desc' },
    });
    
    if (!enrollment) {
      console.log('❌ Nenhuma matrícula ativa encontrada');
      return;
    }
    
    console.log(`✅ Matrícula encontrada: ${enrollment.course.name}`);
    console.log(`   Course ID: ${enrollment.courseId}`);
    console.log(`   Status: ${enrollment.status}`);
    console.log(`   Start Date: ${enrollment.startDate.toLocaleDateString('pt-BR')}`);
    
    console.log('\n📖 2. Buscando lesson plans do curso...');
    const plans = await prisma.lessonPlan.findMany({
      where: { courseId: enrollment.courseId },
      select: { id: true, lessonNumber: true, title: true }
    });
    
    console.log(`✅ Lesson plans encontrados: ${plans.length}`);
    if (plans.length > 0) {
      plans.slice(0, 3).forEach(p => {
        console.log(`   - Aula ${p.lessonNumber}: ${p.title || 'Sem título'}`);
      });
    }
    
    console.log('\n🎯 3. Buscando progresso do aluno...');
    const planIds = plans.map(p => p.id);
    
    const progress = await prisma.studentProgress.findMany({
      where: {
        studentId,
        activity: {
          lesson: {
            planId: { in: planIds }
          }
        }
      },
      include: {
        activity: {
          include: {
            lesson: true
          }
        }
      }
    });
    
    console.log(`✅ Progresso encontrado: ${progress.length} atividades`);
    
    console.log('\n📊 RESUMO:');
    console.log(`   Curso: ${enrollment.course.name}`);
    console.log(`   Aulas planejadas: ${plans.length}`);
    console.log(`   Atividades completadas: ${progress.length}`);
    console.log(`   Progress: ${plans.length > 0 ? Math.round((progress.length / (plans.length * 3)) * 100) : 0}%`);
    
  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testProgress();
