#!/usr/bin/env npx tsx

/**
 * 🎯 SEED DE HISTÓRICO DE FREQUÊNCIA
 * ===================================
 * 
 * Cria Turmas, Aulas (TurmaLesson) e Presenças (TurmaAttendance)
 * para testar a tela de Histórico de Frequência.
 * 
 * COMO USAR:
 * npx tsx scripts/seed-frequency-history.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ORG_ID = '452c0b35-1822-4890-851e-922356c812fb'; // Academia Krav Maga Demo

async function seedFrequencyHistory() {
  console.log('📋 Criando histórico de frequência...');
  
  try {
    // 1. Buscar organização
    const org = await prisma.organization.findUnique({
      where: { id: ORG_ID }
    });

    if (!org) {
      console.error(`❌ Organização ${ORG_ID} não encontrada`);
      return;
    }

    // 2. Buscar curso Krav Maga
    let course = await prisma.course.findFirst({
      where: { 
        organizationId: ORG_ID,
        name: { contains: 'Krav Maga' }
      }
    });

    if (!course) {
      console.log('⚠️ Curso Krav Maga não encontrado, criando...');
      course = await prisma.course.create({
        data: {
          organizationId: ORG_ID,
          name: 'Krav Maga - Defesa Pessoal 1',
          description: 'Curso básico de defesa pessoal',
          level: 'BEGINNER',
          duration: 12,
          classesPerWeek: 2,
          totalClasses: 24,
          objectives: ['Posturas básicas', 'Defesas iniciais', 'Golpes fundamentais']
        }
      });
    }

    // 3. Buscar instrutor
    let instructor = await prisma.instructor.findFirst({
      where: { organizationId: ORG_ID }
    });

    if (!instructor) {
      console.log('⚠️ Instrutor não encontrado, criando...');
      
      // Criar usuário instrutor
      const instructorUser = await prisma.user.create({
        data: {
          organizationId: ORG_ID,
          email: 'instrutor.demo@academia.com',
          password: '$2a$12$RzWS/zz4OrQr4SuKSZxN2OuNTBrj4E/.fR7IdgWi.wlpiEmK23xrO',
          role: 'INSTRUCTOR',
          firstName: 'Carlos',
          lastName: 'Instrutor'
        }
      });

      instructor = await prisma.instructor.create({
        data: {
          organizationId: ORG_ID,
          userId: instructorUser.id,
          specializations: ['Krav Maga', 'Defesa Pessoal']
        }
      });
    }

    // 4. Criar Turma
    let turma = await prisma.turma.findFirst({
      where: { 
        organizationId: ORG_ID,
        courseId: course.id
      }
    });

    if (!turma) {
      console.log('📚 Criando turma...');
      turma = await prisma.turma.create({
        data: {
          name: 'Turma Segunda/Quarta 19h',
          description: 'Turma de iniciantes',
          schedule: {
            daysOfWeek: [1, 3], // Segunda e Quarta
            startTime: '19:00',
            endTime: '20:30'
          },
          maxStudents: 20,
          status: 'ACTIVE',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-06-30'),
          organization: {
            connect: { id: ORG_ID }
          },
          course: {
            connect: { id: course.id }
          },
          instructor: {
            connect: { id: instructor.userId }
          }
        }
      });
    }

    // 5. Buscar alunos
    const students = await prisma.student.findMany({
      where: { organizationId: ORG_ID },
      take: 5 // Pegar até 5 alunos
    });

    if (students.length === 0) {
      console.error('❌ Nenhum aluno encontrado. Execute npm run seed:quick primeiro');
      return;
    }

    console.log(`✅ Encontrados ${students.length} alunos`);

    // 6. Associar alunos à turma (TurmaStudent)
    console.log('👥 Associando alunos à turma...');
    const turmaStudents = [];
    for (const student of students) {
      const existingTurmaStudent = await prisma.turmaStudent.findFirst({
        where: {
          turmaId: turma.id,
          studentId: student.id
        }
      });

      if (!existingTurmaStudent) {
        const turmaStudent = await prisma.turmaStudent.create({
          data: {
            turma: { connect: { id: turma.id } },
            student: { connect: { id: student.id } },
            status: 'ACTIVE'
          }
        });
        turmaStudents.push(turmaStudent);
      } else {
        turmaStudents.push(existingTurmaStudent);
      }
    }

    console.log(`✅ ${turmaStudents.length} alunos matriculados na turma`);

    // 7. Criar TurmaLessons (aulas passadas)
    const lessonsToCreate = [
      {
        date: new Date('2025-10-01'),
        lessonNumber: 1,
        title: 'Aula 1 - Introdução ao Krav Maga',
        description: 'Posturas básicas e primeiro soco (Jab)',
        theme: 'Fundamentos'
      },
      {
        date: new Date('2025-10-03'),
        lessonNumber: 2,
        title: 'Aula 2 - Soco Direto',
        description: 'Aprimoramento do Jab e Cross',
        theme: 'Socos Básicos'
      },
      {
        date: new Date('2025-10-07'),
        lessonNumber: 3,
        title: 'Aula 3 - Chutes Iniciais',
        description: 'Chute reto e chute empurrão',
        theme: 'Chutes Fundamentais'
      }
    ];

    console.log('📅 Criando aulas (TurmaLessons)...');

    for (const lessonData of lessonsToCreate) {
      const startTime = new Date(lessonData.date);
      startTime.setHours(19, 0, 0, 0);

      const endTime = new Date(lessonData.date);
      endTime.setHours(20, 30, 0, 0);

      // Verificar se aula já existe
      const existingLesson = await prisma.turmaLesson.findFirst({
        where: {
          turmaId: turma.id,
          lessonNumber: lessonData.lessonNumber
        }
      });

      if (existingLesson) {
        console.log(`  ⏭️ Aula ${lessonData.lessonNumber} já existe`);
        continue;
      }

      const turmaLesson = await prisma.turmaLesson.create({
        data: {
          lessonNumber: lessonData.lessonNumber,
          title: lessonData.title,
          scheduledDate: lessonData.date,
          actualDate: lessonData.date,
          status: 'COMPLETED',
          duration: 90,
          turma: {
            connect: { id: turma.id }
          }
        }
      });

      console.log(`  ✅ Aula ${lessonData.lessonNumber} criada`);

      // Criar presenças aleatórias para essa aula
      for (let i = 0; i < turmaStudents.length; i++) {
        const turmaStudent = turmaStudents[i];
        const student = students[i];
        const isPresent = Math.random() > 0.3; // 70% de chance de presença
        
        if (isPresent) {
          await prisma.turmaAttendance.create({
            data: {
              present: true,
              late: false,
              justified: false,
              checkedAt: new Date(lessonData.date),
              turma: {
                connect: { id: turma.id }
              },
              lesson: {
                connect: { id: turmaLesson.id }
              },
              student: {
                connect: { id: student.id }
              },
              turmaStudent: {
                connect: { id: turmaStudent.id }
              }
            }
          });
        }
      }
    }

    console.log('\n🎉 Histórico de frequência criado com sucesso!');
    console.log(`📊 Turma: ${turma.name}`);
    console.log(`📚 Curso: ${course.name}`);
    console.log(`👥 ${students.length} alunos com presenças`);
    console.log(`📅 ${lessonsToCreate.length} aulas criadas`);

  } catch (error) {
    console.error('❌ Erro:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
if (require.main === module) {
  seedFrequencyHistory().catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
}

export { seedFrequencyHistory };
