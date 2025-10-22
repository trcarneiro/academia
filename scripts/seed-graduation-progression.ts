/**
 * Script de Seed - Dados de Progressão de Graduação
 * 
 * Cria alunos com diferentes níveis de progressão (graus) e check-ins
 * para demonstrar o sistema de graduação
 * 
 * Execução: npx tsx scripts/seed-graduation-progression.ts
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../src/utils/logger';

const prisma = new PrismaClient();

const ORG_ID = '452c0b35-1822-4890-851e-922356c812fb';
const COURSE_ID = 'krav-maga-faixa-branca-2025';

interface StudentData {
  name: string;
  email: string;
  cpf: string;
  completedLessons: number; // Quantas aulas já completou
  targetDegree: number; // Grau alvo (1=20%, 2=40%, 3=60%, 4=80%)
  averageRating: number; // Performance média (1-5)
}

const SEED_STUDENTS: StudentData[] = [
  {
    name: 'Ana Silva',
    email: 'ana.silva@email.com',
    cpf: '111.111.111-11',
    completedLessons: 10, // ~20% de 48 aulas = 1º Grau
    targetDegree: 1,
    averageRating: 4.5,
  },
  {
    name: 'Bruno Costa',
    email: 'bruno.costa@email.com',
    cpf: '222.222.222-22',
    completedLessons: 20, // ~40% de 48 aulas = 2º Grau
    targetDegree: 2,
    averageRating: 4.0,
  },
  {
    name: 'Carlos Oliveira',
    email: 'carlos.oliveira@email.com',
    cpf: '333.333.333-33',
    completedLessons: 30, // ~60% de 48 aulas = 3º Grau
    targetDegree: 3,
    averageRating: 3.5,
  },
  {
    name: 'Diana Santos',
    email: 'diana.santos@email.com',
    cpf: '444.444.444-44',
    completedLessons: 38, // ~80% de 48 aulas = 4º Grau (pronto para graduar)
    targetDegree: 4,
    averageRating: 5.0,
  },
  {
    name: 'Eduardo Lima',
    email: 'eduardo.lima@email.com',
    cpf: '555.555.555-55',
    completedLessons: 5, // Iniciante
    targetDegree: 0,
    averageRating: 3.0,
  },
];

async function main() {
  console.log('🌱 Iniciando seed de progressão de graduação...\n');

  try {
    // 1. Verificar se o curso existe
    console.log('📚 Verificando curso...');
    const course = await prisma.course.findUnique({
      where: { id: COURSE_ID },
      include: { lessonPlans: { orderBy: { lessonNumber: 'asc' } } },
    });

    if (!course) {
      throw new Error(`Curso ${COURSE_ID} não encontrado. Execute o importador de cursos primeiro.`);
    }

    console.log(`✅ Curso encontrado: ${course.name}`);
    console.log(`   - Total de aulas: ${course.lessonPlans.length}`);
    console.log(`   - Nivel: ${course.level}\n`);

    // 2. Buscar ou criar turma
    console.log('🏫 Verificando turma...');
    let turma = await prisma.turma.findFirst({
      where: {
        organizationId: ORG_ID,
        courseId: COURSE_ID,
        isActive: true,
      },
    });

    if (!turma) {
      console.log('   Criando turma de demonstração...');
      turma = await prisma.turma.create({
        data: {
          organizationId: ORG_ID,
          courseId: COURSE_ID,
          name: 'Turma Demo - Faixa Branca',
          description: 'Turma de demonstração para sistema de graduação',
          schedule: 'Segunda, Quarta e Sexta - 19:00',
          maxStudents: 20,
          currentStudents: 0,
          startDate: new Date('2025-01-15'),
          isActive: true,
        },
      });
    }

    console.log(`✅ Turma: ${turma.name} (ID: ${turma.id})\n`);

    // 3. Buscar instrutor (usa o primeiro encontrado)
    console.log('👨‍🏫 Verificando instrutor...');
    const instructor = await prisma.instructor.findFirst({
      where: { organizationId: ORG_ID, isActive: true },
      include: { user: true },
    });

    if (!instructor) {
      throw new Error('Nenhum instrutor ativo encontrado. Crie um instrutor primeiro.');
    }

    const instructorName = instructor.user 
      ? `${instructor.user.firstName || ''} ${instructor.user.lastName || ''}`.trim() 
      : 'Instrutor ID: ' + instructor.id;

    console.log(`✅ Instrutor: ${instructorName}\n`);

    // 🧹 Limpar dados antigos da turma (evitar conflicts de unique constraints)
    console.log('🧹 Limpando dados antigos da turma...');
    
    // Deletar attendances antigas (cascade vai cuidar das relações)
    const deletedAttendances = await prisma.turmaAttendance.deleteMany({
      where: { turmaId: turma.id },
    });
    console.log(`   ✅ ${deletedAttendances.count} attendances antigas deletadas`);
    
    // Deletar lessons antigas
    const deletedLessons = await prisma.turmaLesson.deleteMany({
      where: { turmaId: turma.id },
    });
    console.log(`   ✅ ${deletedLessons.count} lessons antigas deletadas\n`);

    // 4. Criar alunos com progressão
    console.log('👥 Criando alunos com progressão...\n');

    for (const studentData of SEED_STUDENTS) {
      console.log(`\n📌 Processando: ${studentData.name}`);
      console.log(`   Meta: ${studentData.completedLessons} aulas (${studentData.targetDegree}º Grau)`);

      // 4.1. Criar usuário
      const [firstName, ...lastNameParts] = studentData.name.split(' ');
      const lastName = lastNameParts.join(' ');

      const user = await prisma.user.create({
        data: {
          organizationId: ORG_ID,
          firstName,
          lastName,
          email: studentData.email,
          cpf: studentData.cpf,
          phone: '(11) 99999-9999',
          role: 'STUDENT',
          password: 'demo123', // Password simplificado para demo
          isActive: true,
        },
      });

      console.log(`   ✅ Usuário criado (ID: ${user.id})`);

      // 4.2. Criar estudante
      const student = await prisma.student.create({
        data: {
          organizationId: ORG_ID,
          userId: user.id,
          category: 'ADULT',
          gender: 'MASCULINO',
          age: 25 + Math.floor(Math.random() * 15),
          physicalCondition: 'INICIANTE',
          isActive: true,
        },
      });

      console.log(`   ✅ Estudante criado (ID: ${student.id})`);

      // 4.3. Matricular no curso
      const enrollment = await prisma.studentCourse.create({
        data: {
          studentId: student.id,
          courseId: COURSE_ID,
          status: 'ACTIVE',
          startDate: new Date('2025-01-15'),
          isActive: true,
        },
      });

      console.log(`   ✅ Matrícula criada (ID: ${enrollment.id})`);

      // 4.4. Adicionar à turma
      const turmaStudent = await prisma.turmaStudent.create({
        data: {
          turmaId: turma.id,
          studentId: student.id,
          enrolledAt: new Date('2025-01-15'),
          isActive: true,
        },
      });

      console.log(`   ✅ Adicionado à turma (TurmaStudent ID: ${turmaStudent.id})`);

      // 4.5. Criar check-ins (frequências) nas aulas
      console.log(`   📝 Criando ${studentData.completedLessons} check-ins...`);

      const lessonsToComplete = course.lessonPlans.slice(0, studentData.completedLessons);

      for (const [index, lessonPlan] of lessonsToComplete.entries()) {
        // Criar lesson (aula agendada) - UPSERT para reusar se já existe
        const scheduledDate = new Date('2025-01-15');
        scheduledDate.setDate(scheduledDate.getDate() + index * 2); // Espaça as aulas

        const lesson = await prisma.turmaLesson.upsert({
          where: {
            turmaId_lessonNumber: {
              turmaId: turma.id,
              lessonNumber: lessonPlan.lessonNumber,
            },
          },
          update: {}, // Se já existe, não atualizar nada (reusar)
          create: {
            turmaId: turma.id,
            lessonPlanId: lessonPlan.id,
            lessonNumber: lessonPlan.lessonNumber,
            title: lessonPlan.title || `Aula ${lessonPlan.lessonNumber}`,
            scheduledDate,
            actualDate: scheduledDate, // Aula já aconteceu
            duration: 60,
            status: 'COMPLETED',
          },
        });

        // Criar attendance (check-in) - USANDO MODELO CORRETO: TurmaAttendance
        const checkinDate = new Date(scheduledDate);
        checkinDate.setHours(19, 0, 0); // 19:00

        await prisma.turmaAttendance.create({
          data: {
            turmaId: turma.id,
            turmaLessonId: lesson.id, // TurmaLesson ID (não lessonId)
            turmaStudentId: turmaStudent.id, // TurmaStudent ID
            studentId: student.id,
            present: true,
            checkedAt: checkinDate,
            checkedBy: instructor.userId, // Instrutor que fez o check-in
          },
        });

        // A cada 10 aulas, registrar conquista de grau
        if ((index + 1) % 10 === 0 && studentData.targetDegree > 0) {
          const degreeAchieved = Math.floor(((index + 1) / 48) * 4); // Calcula grau baseado em %

          if (degreeAchieved > 0 && degreeAchieved <= 4) {
            await prisma.studentDegreeHistory.create({
              data: {
                studentId: student.id,
                courseId: COURSE_ID,
                degree: degreeAchieved,
                degreePercentage: degreeAchieved * 20,
                belt: 'Faixa Branca',
                completedLessons: index + 1,
                totalRepetitions: (index + 1) * 80, // Estima repetições
                averageQuality: studentData.averageRating,
                attendanceRate: 100, // Todas presentes
                achievedAt: checkinDate,
              },
            });

            console.log(`      🎖️ Grau ${degreeAchieved} conquistado!`);
          }
        }
      }

      console.log(`   ✅ ${studentData.completedLessons} check-ins criados`);

      // 4.6. Criar registros de progresso quantitativo (opcional)
      // Exemplo: Criar alguns StudentProgress para atividades específicas
      const sampleActivities = [
        { name: 'POSTURAS: Postura de Combate', completed: 100, target: 100 },
        { name: 'SOCOS: Jab Direto', completed: 150, target: 200 },
        { name: 'CHUTES: Chute Frontal', completed: 80, target: 150 },
        { name: 'DEFESAS: Defesa 360°', completed: 50, target: 100 },
      ];

      for (const activity of sampleActivities) {
        const progressRecord = await prisma.studentProgress.create({
          data: {
            studentId: student.id,
            courseId: COURSE_ID,
            lessonNumber: 1, // Primeira aula
            activityName: activity.name,
            completedReps: activity.completed,
            targetReps: activity.target,
            completionPercentage: Math.round((activity.completed / activity.target) * 100),
            lastUpdated: new Date(),
          },
        });

        // Adicionar avaliação qualitativa do instrutor
        await prisma.qualitativeAssessment.create({
          data: {
            studentProgressId: progressRecord.id,
            instructorId: instructor.id,
            rating: Math.floor(studentData.averageRating),
            notes: `Performance ${studentData.averageRating >= 4 ? 'excelente' : 'boa'}. Continue praticando!`,
            assessmentDate: new Date(),
          },
        });
      }

      console.log(`   ✅ Progresso quantitativo registrado (${sampleActivities.length} atividades)\n`);
    }

    console.log('\n✅ SEED DE GRADUAÇÃO CONCLUÍDO COM SUCESSO!\n');
    console.log('📊 Resumo:');
    console.log(`   - ${SEED_STUDENTS.length} alunos criados`);
    console.log(`   - Diferentes níveis de progressão (0 a 4 graus)`);
    console.log(`   - Check-ins e histórico de graus registrados`);
    console.log(`   - Progresso quantitativo e qualitativo configurado\n`);

    console.log('🔍 Para testar:');
    console.log('   1. Acesse http://localhost:3000/#graduation');
    console.log('   2. Você verá 5 alunos com diferentes progressos');
    console.log('   3. Teste filtros, edição manual e visualização de stats\n');

  } catch (error) {
    console.error('\n❌ ERRO NO SEED:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });
