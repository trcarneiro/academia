import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCourseData() {
  try {
    console.log('🔍 Verificando estrutura de Cursos e Técnicas...\n');

    // Buscar cursos
    const courses = await prisma.course.findMany({
      include: {
        techniques: {
          include: {
            technique: true
          }
        },
        martialArt: true
      },
      take: 3
    });

    if (courses.length === 0) {
      console.log('❌ Nenhum curso encontrado no banco.\n');
    } else {
      console.log(`✅ Encontrados ${courses.length} cursos:\n`);

      courses.forEach(course => {
        console.log(`📚 ${course.name}`);
        console.log(`   Arte Marcial: ${course.martialArt?.name || 'N/A'}`);
        console.log(`   Nível: ${course.level}`);
        console.log(`   Duração: ${course.duration} meses`);
        console.log(`   Aulas/semana: ${course.classesPerWeek}`);
        console.log(`   Total de aulas: ${course.totalClasses}`);
        console.log(`   Técnicas vinculadas: ${course.techniques.length}`);

        if (course.techniques.length > 0) {
          console.log('\n   🥋 Técnicas do Curso (CourseTechnique):');
          course.techniques.forEach(ct => {
            console.log(`      ${ct.orderIndex}. ${ct.technique.name}`);
            console.log(`         Semana: ${ct.weekNumber || 'N/A'}`);
            console.log(`         Aula: ${ct.lessonNumber || 'N/A'}`);
            console.log(`         Obrigatória: ${ct.isRequired ? 'Sim' : 'Não'}`);
          });
        }

        console.log('\n---\n');
      });
    }

    // Estatísticas
    const totalCourses = await prisma.course.count();
    const coursesWithTechniques = await prisma.course.count({
      where: {
        techniques: {
          some: {}
        }
      }
    });

    console.log('📊 ESTATÍSTICAS:');
    console.log(`Total de cursos: ${totalCourses}`);
    console.log(`Cursos com técnicas: ${coursesWithTechniques}`);
    console.log(`Cursos sem técnicas: ${totalCourses - coursesWithTechniques}\n`);

    // Verificar templates
    const templates = await prisma.courseTemplate.findMany({
      take: 3
    });

    console.log(`📋 Templates de Curso: ${templates.length}`);
    if (templates.length > 0) {
      templates.forEach(t => {
        console.log(`   - ${t.name} (${t.category})`);
        console.log(`     Estrutura JSON: ${JSON.stringify(t.structure).substring(0, 100)}...`);
      });
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCourseData();
