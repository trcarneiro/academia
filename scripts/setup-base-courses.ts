/**
 * Script para criar cursos base para cada arte marcial
 * Executa a estrutura necessária para matrícula automática
 */

import { PrismaClient, CourseLevel, StudentCategory } from '@prisma/client';

const prisma = new PrismaClient();

interface BaseCourseData {
  martialArtName: string;
  courseName: string;
  description: string;
  level: CourseLevel;
  duration: number;
  totalClasses: number;
  sequence: number;
}

const baseCourses: BaseCourseData[] = [
  {
    martialArtName: 'Krav Maga',
    courseName: 'Krav Maga - Faixa Branca',
    description: 'Curso base de Krav Maga para iniciantes. Aprenda fundamentos de defesa pessoal, técnicas básicas e condicionamento físico.',
    level: 'BEGINNER' as CourseLevel,
    duration: 48,
    totalClasses: 48,
    sequence: 1
  },
  {
    martialArtName: 'Jiu Jitsu',
    courseName: 'Jiu Jitsu - Faixa Branca',
    description: 'Curso base de Jiu Jitsu para iniciantes. Fundamentos, posições básicas, quedas e primeiras técnicas de solo.',
    level: 'BEGINNER' as CourseLevel,
    duration: 48,
    totalClasses: 48,
    sequence: 1
  },
  {
    martialArtName: 'Muay Thai',
    courseName: 'Muay Thai - Iniciante',
    description: 'Curso base de Muay Thai. Aprenda stance, socos, chutes, joelhadas e cotovelos fundamentais da arte tailandesa.',
    level: 'BEGINNER' as CourseLevel,
    duration: 40,
    totalClasses: 40,
    sequence: 1
  },
  {
    martialArtName: 'Boxe',
    courseName: 'Boxe - Iniciante',
    description: 'Curso base de Boxe. Fundamentos do pugilismo: jab, direto, cruzado, gancho e uppercut com técnica e condicionamento.',
    level: 'BEGINNER' as CourseLevel,
    duration: 40,
    totalClasses: 40,
    sequence: 1
  }
];

async function main() {
  console.log('🎯 Configurando cursos base para matrícula automática...\n');

  try {
    // 1. Buscar ou criar organização
    let organization = await prisma.organization.findFirst();
    
    if (!organization) {
      console.log('📝 Criando organização demo...');
      organization = await prisma.organization.create({
        data: {
          name: 'Academia Demo',
          slug: 'academia-demo',
          email: 'contato@academiademo.com'
        }
      });
      console.log(`✅ Organização criada: ${organization.name}\n`);
    } else {
      console.log(`✅ Organização encontrada: ${organization.name}\n`);
    }

    // 2. Criar/atualizar artes marciais e seus cursos base
    for (const baseCourse of baseCourses) {
      console.log(`🥋 Processando: ${baseCourse.martialArtName}...`);

      // Buscar ou criar arte marcial
      let martialArt = await prisma.martialArt.findFirst({
        where: {
          organizationId: organization.id,
          name: baseCourse.martialArtName
        }
      });

      if (!martialArt) {
        console.log(`   📝 Criando arte marcial: ${baseCourse.martialArtName}`);
        martialArt = await prisma.martialArt.create({
          data: {
            organizationId: organization.id,
            name: baseCourse.martialArtName,
            description: `Arte marcial ${baseCourse.martialArtName}`,
            hasGrading: true,
            gradingSystem: 'BELT',
            maxLevel: 10,
            isActive: true
          }
        });
      }

      // Verificar se curso base já existe
      const existingBaseCourse = await prisma.course.findFirst({
        where: {
          organizationId: organization.id,
          martialArtId: martialArt.id,
          name: baseCourse.courseName
        }
      });

      // Upsert curso base (cria ou atualiza)
      console.log(`   📝 Criando/atualizando curso base: ${baseCourse.courseName}`);
      
      const course = await prisma.course.upsert({
        where: {
          organizationId_name: {
            organizationId: organization.id,
            name: baseCourse.courseName
          }
        },
        update: {
          martialArtId: martialArt.id,
          description: baseCourse.description,
          level: baseCourse.level,
          duration: baseCourse.duration,
          totalClasses: baseCourse.totalClasses,
          isBaseCourse: true,
          sequence: baseCourse.sequence,
          isActive: true
        },
        create: {
          organizationId: organization.id,
          martialArtId: martialArt.id,
          name: baseCourse.courseName,
          description: baseCourse.description,
          level: baseCourse.level,
          duration: baseCourse.duration,
          totalClasses: baseCourse.totalClasses,
          classesPerWeek: 2,
          minAge: 16,
          category: 'ADULT' as StudentCategory,
          isBaseCourse: true,
          sequence: baseCourse.sequence,
          isActive: true,
          objectives: [
            'Dominar fundamentos básicos',
            'Desenvolver condicionamento físico',
            'Aprender técnicas essenciais',
            'Preparar para próximo nível'
          ],
          requirements: [
            'Atestado médico',
            'Compromisso com treinos regulares'
          ],
          prerequisites: []
        }
      });

      console.log(`   ✅ Curso base configurado: ${course.name}\n`);
    }

    // 3. Resumo final
    console.log('\n📊 RESUMO FINAL:\n');
    
    const allCourses = await prisma.course.findMany({
      where: {
        organizationId: organization.id,
        isBaseCourse: true
      },
      include: {
        martialArt: true
      }
    });

    console.log('✅ Cursos Base Configurados:\n');
    allCourses.forEach(course => {
      console.log(`   🥋 ${course.martialArt?.name || 'N/A'}`);
      console.log(`      📚 ${course.name}`);
      console.log(`      📊 Nível: ${course.level}`);
      console.log(`      🎯 Sequência: ${course.sequence}`);
      console.log(`      ✅ Ativo: ${course.isActive ? 'Sim' : 'Não'}\n`);
    });

    console.log('🎉 Setup de cursos base concluído com sucesso!');
    console.log('💡 Agora o sistema pode matricular alunos automaticamente no curso base da arte escolhida.\n');

  } catch (error) {
    console.error('❌ Erro ao configurar cursos base:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
