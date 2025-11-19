const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createEnrollment() {
  try {
    console.log('\n🎓 Criando matrícula para Pedro Teste...');
    
    const studentId = 'dc9c17ff-582c-45c6-bc46-7eee1cee4564';
    const organizationId = 'ff5ee00e-d8a3-4291-9428-d28b852fb472';
    
    // 1. Buscar cursos disponíveis
    console.log('\n📚 Buscando cursos...');
    const courses = await prisma.course.findMany({
      where: { organizationId },
      select: { id: true, name: true, level: true }
    });
    
    console.log(`Cursos encontrados: ${courses.length}`);
    if (courses.length > 0) {
      courses.forEach(c => console.log(`  - ${c.name} (${c.level})`));
    }
    
    if (courses.length === 0) {
      console.log('\n❌ Nenhum curso encontrado. Não é possível criar matrícula.');
      return;
    }
    
    // 2. Usar o primeiro curso
    const course = courses[0];
    console.log(`\n✅ Usando curso: ${course.name}`);
    
    // 3. Verificar se já existe matrícula
    const existing = await prisma.studentCourse.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId: course.id
        }
      }
    });
    
    if (existing) {
      console.log('\n⚠️ Pedro Teste já está matriculado neste curso!');
      console.log(`   Progresso: ${existing.progressPercentage}%`);
      console.log(`   Status: ${existing.status}`);
      return;
    }
    
    // 4. Criar matrícula
    const enrollment = await prisma.studentCourse.create({
      data: {
        studentId,
        courseId: course.id,
        status: 'ACTIVE',
        startDate: new Date(),
        progressPercentage: 0,
        currentLesson: 1,
        isActive: true
      }
    });
    
    console.log('\n🎉 MATRÍCULA CRIADA COM SUCESSO!');
    console.log(`   ID: ${enrollment.id}`);
    console.log(`   Curso: ${course.name}`);
    console.log(`   Status: ${enrollment.status}`);
    console.log(`   Data Início: ${enrollment.startDate.toLocaleDateString('pt-BR')}`);
    
  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

createEnrollment();
