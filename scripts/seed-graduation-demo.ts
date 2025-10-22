/**
 * Script de Seed para Demo de Graduação
 * 
 * Cria dados de demonstração para o módulo de Graduação:
 * - 5 alunos com diferentes níveis de progresso (0%, 20%, 40%, 60%, 80%)
 * - Check-ins distribuídos em aulas do curso Faixa Branca
 * - Execuções de atividades com ratings variados
 * - Sistema de graus configurado
 * 
 * Como usar:
 * npx tsx scripts/seed-graduation-demo.ts
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../src/utils/logger';

const prisma = new PrismaClient();

const ORG_ID = '452c0b35-1822-4890-851e-922356c812fb';
const COURSE_ID = 'krav-maga-faixa-branca-2025';

interface StudentProgress {
  name: string;
  email: string;
  lessonsToComplete: number; // Quantas aulas completar (de 48 total)
  targetDegree: number; // Grau alvo (0-4)
  avgRating: number; // Rating médio (1-5)
}

const STUDENTS: StudentProgress[] = [
  {
    name: 'João Silva',
    email: 'joao.silva@demo.com',
    lessonsToComplete: 0,
    targetDegree: 0,
    avgRating: 0,
  },
  {
    name: 'Maria Santos',
    email: 'maria.santos@demo.com',
    lessonsToComplete: 10, // ~20% das 48 aulas
    targetDegree: 1,
    avgRating: 3.5,
  },
  {
    name: 'Pedro Costa',
    email: 'pedro.costa@demo.com',
    lessonsToComplete: 20, // ~40% das 48 aulas
    targetDegree: 2,
    avgRating: 4.0,
  },
  {
    name: 'Ana Oliveira',
    email: 'ana.oliveira@demo.com',
    lessonsToComplete: 30, // ~60% das 48 aulas
    targetDegree: 3,
    avgRating: 4.5,
  },
  {
    name: 'Carlos Ferreira',
    email: 'carlos.ferreira@demo.com',
    lessonsToComplete: 40, // ~80% das 48 aulas
    targetDegree: 4,
    avgRating: 5.0,
  },
];

async function main() {
  logger.info('🎓 Iniciando seed de dados de graduação...');

  // 1. Verificar se curso existe
  const course = await prisma.course.findUnique({
    where: { id: COURSE_ID },
    include: {
      lessonPlans: {
        orderBy: { lessonNumber: 'asc' },
        include: {
          activities: true,
        },
      },
    },
  });

  if (!course) {
    logger.error(`Curso ${COURSE_ID} não encontrado!`);
    process.exit(1);
  }

  logger.info(`✅ Curso encontrado: ${course.name} (${course.lessonPlans.length} aulas)`);

  // 2. Criar turma para vincular os check-ins
  logger.info('📅 Criando turma demo...');
  
  const turma = await prisma.turma.upsert({
    where: { id: 'turma-faixa-branca-demo' },
    update: {},
    create: {
      id: 'turma-faixa-branca-demo',
      name: 'Turma Demo - Faixa Branca',
      organizationId: ORG_ID,
      courseId: COURSE_ID,
      schedule: 'SEG/QUA/SEX 19:00',
      maxStudents: 20,
      isActive: true,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
    },
  });

  logger.info(`✅ Turma criada: ${turma.name}`);

  // 3. Criar aulas na turma (uma por lesson plan)
  logger.info('📚 Criando aulas na turma...');
  
  const lessons = await Promise.all(
    course.lessonPlans.map(async (lessonPlan, index) => {
      const scheduledDate = new Date('2025-01-06'); // Segunda-feira
      scheduledDate.setDate(scheduledDate.getDate() + index * 2); // A cada 2 dias

      return prisma.lesson.upsert({
        where: {
          id: `lesson-demo-${lessonPlan.lessonNumber}`,
        },
        update: {},
        create: {
          id: `lesson-demo-${lessonPlan.lessonNumber}`,
          turmaId: turma.id,
          lessonPlanId: lessonPlan.id,
          lessonNumber: lessonPlan.lessonNumber,
          scheduledDate,
          status: index < 40 ? 'COMPLETED' : 'SCHEDULED', // Primeiras 40 já aconteceram
        },
      });
    })
  );

  logger.info(`✅ ${lessons.length} aulas criadas`);

  // 4. Criar alunos com progressos variados
  for (const studentData of STUDENTS) {
    logger.info(`\n👤 Criando aluno: ${studentData.name}`);

    // 4.1. Criar User
    const user = await prisma.user.upsert({
      where: { email: studentData.email },
      update: {},
      create: {
        email: studentData.email,
        name: studentData.name,
        firstName: studentData.name.split(' ')[0],
        lastName: studentData.name.split(' ').slice(1).join(' '),
        password: '$2a$10$dummyhash', // Hash fictício
        role: 'STUDENT',
        organizationId: ORG_ID,
      },
    });

    // 4.2. Criar Student
    const student = await prisma.student.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        organizationId: ORG_ID,
        category: 'ADULT',
        isActive: true,
        enrollmentDate: new Date('2025-01-01'),
      },
    });

    logger.info(`  ✅ User e Student criados (${student.id})`);

    // 4.3. Matricular no curso
    const enrollment = await prisma.studentCourse.upsert({
      where: {
        studentId_courseId: {
          studentId: student.id,
          courseId: COURSE_ID,
        },
      },
      update: {},
      create: {
        studentId: student.id,
        courseId: COURSE_ID,
        organizationId: ORG_ID,
        enrolledAt: new Date('2025-01-01'),
        startDate: new Date('2025-01-01'),
        status: 'ACTIVE',
        isActive: true,
      },
    });

    logger.info(`  ✅ Matriculado no curso`);

    // 4.4. Vincular à turma
    await prisma.turmaStudent.upsert({
      where: {
        turmaId_studentId: {
          turmaId: turma.id,
          studentId: student.id,
        },
      },
      update: {},
      create: {
        turmaId: turma.id,
        studentId: student.id,
        enrolledAt: new Date('2025-01-01'),
        isActive: true,
      },
    });

    logger.info(`  ✅ Vinculado à turma`);

    // 4.5. Criar check-ins nas primeiras N aulas
    if (studentData.lessonsToComplete > 0) {
      logger.info(`  📋 Criando ${studentData.lessonsToComplete} check-ins...`);

      for (let i = 0; i < studentData.lessonsToComplete && i < lessons.length; i++) {
        const lesson = lessons[i];
        const lessonPlan = course.lessonPlans.find(lp => lp.id === lesson.lessonPlanId);

        if (!lessonPlan) continue;

        // Criar attendance na turma
        const attendance = await prisma.turmaAttendance.create({
          data: {
            studentId: student.id,
            lessonId: lesson.id,
            turmaId: turma.id,
            present: true,
            checkedAt: lesson.scheduledDate,
            checkedBy: 'SYSTEM',
          },
        });

        // Criar execuções de atividades com ratings
        if (lessonPlan.activities && lessonPlan.activities.length > 0) {
          const activitiesToExecute = lessonPlan.activities.slice(0, 3); // Primeiras 3 atividades

          for (const activity of activitiesToExecute) {
            // Rating varia um pouco em torno da média
            const rating = Math.max(
              1,
              Math.min(5, Math.round(studentData.avgRating + (Math.random() - 0.5)))
            );

            await prisma.lessonActivityExecution.create({
              data: {
                attendanceId: attendance.id,
                studentId: student.id,
                instructorId: null, // Auto-validado
                activityId: activity.id,
                activityName: activity.activityName,
                repetitionsCount: activity.targetRepetitions || 10,
                performanceRating: rating,
                durationMinutes: activity.durationMinutes,
                notes: rating >= 4 ? 'Execução excelente!' : 'Continuar praticando',
                validatedAt: lesson.scheduledDate,
                validationMode: 'AUTO',
              },
            });
          }
        }
      }

      logger.info(`  ✅ ${studentData.lessonsToComplete} check-ins criados com execuções de atividades`);

      // 4.6. Registrar graus conquistados automaticamente
      const progressPercentage = (studentData.lessonsToComplete / course.lessonPlans.length) * 100;
      const degreesAchieved = Math.floor(progressPercentage / 20);

      if (degreesAchieved > 0) {
        logger.info(`  🏆 Registrando ${degreesAchieved} graus conquistados...`);

        for (let degree = 1; degree <= degreesAchieved; degree++) {
          const lessonsForDegree = Math.ceil((degree * 20 / 100) * course.lessonPlans.length);

          await prisma.studentDegreeHistory.upsert({
            where: {
              studentId_courseId_degree: {
                studentId: student.id,
                courseId: COURSE_ID,
                degree,
              },
            },
            update: {},
            create: {
              studentId: student.id,
              courseId: COURSE_ID,
              degree,
              degreePercentage: degree * 20,
              belt: 'Faixa Branca',
              completedLessons: lessonsForDegree,
              totalRepetitions: lessonsForDegree * 30, // Estimativa
              averageQuality: studentData.avgRating,
              attendanceRate: 100, // Demo sempre 100%
              achievedAt: new Date(`2025-${String(degree * 2).padStart(2, '0')}-01`),
            },
          });
        }

        logger.info(`  ✅ ${degreesAchieved} graus registrados`);
      }
    } else {
      logger.info(`  ⏭️ Aluno sem check-ins (baseline)`);
    }
  }

  // 5. Criar sistema de graduação do curso (se não existir)
  logger.info('\n⚙️ Configurando sistema de graduação do curso...');

  await prisma.courseGraduationLevel.upsert({
    where: { courseId: COURSE_ID },
    update: {},
    create: {
      courseId: COURSE_ID,
      fromBelt: 'Faixa Branca',
      toBelt: 'Faixa Amarela',
      totalDegrees: 4,
      minimumAttendanceRate: 80,
      minimumQualityRating: 3.0,
      minimumRepetitionsTotal: 500,
      minimumMonthsEnrolled: 3,
    },
  });

  logger.info('✅ Sistema de graduação configurado');

  // 6. Criar requisitos de graduação por categoria
  logger.info('📋 Criando requisitos de graduação...');

  const categories = [
    { name: 'POSTURAS', minReps: 100, minRating: 3.0 },
    { name: 'SOCOS', minReps: 200, minRating: 3.5 },
    { name: 'CHUTES', minReps: 150, minRating: 3.5 },
    { name: 'DEFESAS', minReps: 100, minRating: 4.0 },
    { name: 'QUEDAS', minReps: 50, minRating: 3.0 },
    { name: 'COMBINAÇÕES', minReps: 100, minRating: 4.0 },
  ];

  for (const category of categories) {
    await prisma.courseRequirement.upsert({
      where: {
        courseId_beltLevel_activityName: {
          courseId: COURSE_ID,
          beltLevel: 'Faixa Amarela',
          activityName: category.name,
        },
      },
      update: {},
      create: {
        courseId: COURSE_ID,
        beltLevel: 'Faixa Amarela',
        category: category.name,
        activityName: category.name,
        minimumReps: category.minReps,
        minimumRating: category.minRating,
        isMandatory: true,
        description: `Mínimo de ${category.minReps} repetições com rating ${category.minRating}+`,
      },
    });
  }

  logger.info(`✅ ${categories.length} requisitos criados`);

  logger.info('\n🎉 Seed de graduação concluído com sucesso!');
  logger.info('\n📊 Resumo dos dados criados:');
  logger.info(`   - ${STUDENTS.length} alunos`);
  logger.info(`   - 1 turma com ${lessons.length} aulas`);
  logger.info(`   - Check-ins distribuídos por nível (0%, 20%, 40%, 60%, 80%)`);
  logger.info(`   - Execuções de atividades com ratings variados`);
  logger.info(`   - Sistema de graus configurado`);
  logger.info(`   - ${categories.length} categorias de requisitos`);
  logger.info('\n✅ Agora você pode acessar o módulo de Graduação e ver os dados!');
}

main()
  .catch((e) => {
    logger.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
