#!/usr/bin/env npx tsx

/**
 * 🎓 SCRIPT DE SEED PARA TESTES DE GRADUAÇÃO
 * ==========================================
 * 
 * Cria cenários realistas de alunos em diferentes estágios de progressão
 * no curso de Faixa Branca para testar todo o sistema de graduação.
 * 
 * CENÁRIOS SIMULADOS:
 * - 10+ alunos com check-ins históricos variados
 * - Diferentes percentuais de conclusão (0% até 100%)
 * - Múltiplas turmas e horários
 * - Frequência variada (bons al      degrees.push({
        studentId: student.id,
        courseId: COURSE_ID,
        degree: i,
        degreePercentage: degreePercentage,
        belt: 'BRANCA',
        achievedAt: degreeDate,
        completedLessons: completedLessons,
        totalRepetitions: completedLessons * 50, // Estimativa de 50 reps por aula
        attendanceRate: scenario.attendanceRate
      });os, etc)
 * - Diferentes graus (1º, 2º, 3º, 4º)
 * - Alunos elegíveis para graduação
 * 
 * COMO USAR:
 * npx tsx scripts/seed-graduation-test.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ===== CONFIGURAÇÕES =====
const ORG_ID = 'a55ad715-2eb0-493c-996c-bb0f60bacec9'; // Organization ID real

// IDs fixos para referência
const COURSE_ID = 'course-faixa-branca-2025';
const PLAN_ID = 'plan-mensal-ilimitado';

// ===== HELPERS =====
function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(startDays: number, endDays: number): Date {
  const now = new Date();
  const start = new Date(now.getTime() - startDays * 24 * 60 * 60 * 1000);
  const end = new Date(now.getTime() - endDays * 24 * 60 * 60 * 1000);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// ===== CENÁRIOS DE ALUNOS =====
const studentScenarios = [
  {
    name: 'Lucas Mendes',
    email: 'lucas.mendes@test.com',
    scenario: 'INICIANTE_REGULAR',
    monthsTraining: 1,
    attendanceRate: 0.90, // 90% de presença
    targetPercentage: 15, // Quase 1º grau
    description: 'Aluno iniciante muito dedicado, quase atingindo 1º grau'
  },
  {
    name: 'Mariana Costa',
    email: 'mariana.costa@test.com',
    scenario: 'PRIMEIRO_GRAU',
    monthsTraining: 2,
    attendanceRate: 0.85,
    targetPercentage: 25, // 1º grau conquistado
    description: 'Conquistou 1º grau recentemente'
  },
  {
    name: 'Pedro Oliveira',
    email: 'pedro.oliveira@test.com',
    scenario: 'PRIMEIRO_GRAU_AVANCADO',
    monthsTraining: 3,
    attendanceRate: 0.80,
    targetPercentage: 35, // Próximo do 2º grau
    description: 'No 1º grau, evoluindo para 2º'
  },
  {
    name: 'Juliana Santos',
    email: 'juliana.santos@test.com',
    scenario: 'SEGUNDO_GRAU',
    monthsTraining: 4,
    attendanceRate: 0.88,
    targetPercentage: 45, // 2º grau conquistado
    description: '2º grau, boa evolução'
  },
  {
    name: 'Rafael Lima',
    email: 'rafael.lima@test.com',
    scenario: 'SEGUNDO_GRAU_FALTOSO',
    monthsTraining: 5,
    attendanceRate: 0.65, // Muitas faltas
    targetPercentage: 42, // 2º grau mas com baixa frequência
    description: '2º grau mas com frequência irregular'
  },
  {
    name: 'Camila Rodrigues',
    email: 'camila.rodrigues@test.com',
    scenario: 'TERCEIRO_GRAU',
    monthsTraining: 6,
    attendanceRate: 0.92,
    targetPercentage: 65, // 3º grau conquistado
    description: '3º grau, aluna exemplar'
  },
  {
    name: 'Fernando Alves',
    email: 'fernando.alves@test.com',
    scenario: 'TERCEIRO_GRAU_AVANCADO',
    monthsTraining: 7,
    attendanceRate: 0.87,
    targetPercentage: 75, // Próximo do 4º grau
    description: 'No 3º grau, quase atingindo 4º'
  },
  {
    name: 'Beatriz Carvalho',
    email: 'beatriz.carvalho@test.com',
    scenario: 'QUARTO_GRAU',
    monthsTraining: 8,
    attendanceRate: 0.91,
    targetPercentage: 85, // 4º grau conquistado
    description: '4º grau, próxima da graduação'
  },
  {
    name: 'Gustavo Ferreira',
    email: 'gustavo.ferreira@test.com',
    scenario: 'QUARTO_GRAU_COMPLETO',
    monthsTraining: 10,
    attendanceRate: 0.95,
    targetPercentage: 98, // Quase 100%
    description: 'Quase completou todo o curso, aguardando aprovação'
  },
  {
    name: 'Amanda Silva',
    email: 'amanda.silva@test.com',
    scenario: 'ELEGIVEL_GRADUACAO',
    monthsTraining: 11,
    attendanceRate: 0.96,
    targetPercentage: 100, // 100% completo
    description: '100% do curso, elegível para faixa amarela'
  },
  {
    name: 'Thiago Souza',
    email: 'thiago.souza@test.com',
    scenario: 'IRREGULAR',
    monthsTraining: 6,
    attendanceRate: 0.45, // Muito irregular
    targetPercentage: 28, // Apenas 1º grau após 6 meses
    description: 'Frequência muito irregular, progresso lento'
  },
  {
    name: 'Larissa Martins',
    email: 'larissa.martins@test.com',
    scenario: 'RETOMANDO',
    monthsTraining: 4,
    attendanceRate: 0.55, // Começou faltando, depois melhorou
    targetPercentage: 22, // Apenas 1º grau
    description: 'Começou irregular mas está retomando o ritmo'
  }
];

// ===== FUNÇÕES PRINCIPAIS =====

async function setupCourseAndPlan() {
  console.log('📚 Configurando curso e plano...');
  
  // 0. Garantir que a organização existe
  await prisma.organization.upsert({
    where: { id: ORG_ID },
    update: {},
    create: {
      id: ORG_ID,
      name: 'Academia Krav Maga - Teste',
      slug: 'academia-teste',
      description: 'Academia para testes do sistema de graduação'
    }
  });

  // 0.5 Criar instrutor padrão
  const instructor = await prisma.user.upsert({
    where: { id: 'instructor-default-test' },
    update: {},
    create: {
      id: 'instructor-default-test',
      organizationId: ORG_ID,
      email: 'instrutor@academia.test',
      password: 'senha123',
      firstName: 'Instrutor',
      lastName: 'Teste',
      role: 'INSTRUCTOR',
      isActive: true
    }
  });

  // Criar ou buscar o curso de Faixa Branca
  const course = await prisma.course.upsert({
    where: { id: COURSE_ID },
    update: {},
    create: {
      id: COURSE_ID,
      organizationId: ORG_ID,
      name: 'Krav Maga - Faixa Branca',
      description: 'Curso completo de fundamentos do Krav Maga para iniciantes',
      level: 'BEGINNER',
      duration: 12,
      classesPerWeek: 2,
      totalClasses: 96, // ~12 meses x 2 aulas/semana x 4 semanas
      minAge: 16,
      category: 'ADULT',
      prerequisites: [],
      objectives: [
        'Dominar posturas básicas',
        'Executar socos e chutes fundamentais',
        'Aprender defesas contra agarrões',
        'Desenvolver condicionamento físico'
      ],
      requirements: ['Iniciantes', 'Sem experiência em artes marciais']
    }
  });

  // Criar plano de pagamento
  const plan = await prisma.billingPlan.upsert({
    where: { id: PLAN_ID },
    update: {},
    create: {
      id: PLAN_ID,
      organizationId: ORG_ID,
      name: 'Plano Mensal Ilimitado',
      description: 'Acesso ilimitado a todas as aulas',
      price: 199.90,
      billingType: 'MONTHLY',
      classesPerWeek: 0 // Ilimitado
    }
  });

  console.log(`✅ Curso criado: ${course.name}`);
  console.log(`✅ Plano criado: ${plan.name}`);
  
  return { course, plan, instructorId: instructor.id };
}

async function createTurmas() {
  console.log('🏫 Criando turmas...');
  
  const instructorId = 'instructor-default-test';
  
  const turmas = [
    {
      id: 'turma-manha-seg-qua',
      name: 'Turma Manhã - Segunda/Quarta',
      schedule: { days: [1, 3], time: '08:00' }, // JSON format
      capacity: 20,
      dayOfWeek: [1, 3], // Segunda e Quarta
      startTime: '08:00'
    },
    {
      id: 'turma-tarde-ter-qui',
      name: 'Turma Tarde - Terça/Quinta',
      schedule: { days: [2, 4], time: '18:00' }, // JSON format
      capacity: 20,
      dayOfWeek: [2, 4], // Terça e Quinta
      startTime: '18:00'
    },
    {
      id: 'turma-noite-seg-qua-sex',
      name: 'Turma Noite - Seg/Qua/Sex',
      schedule: { days: [1, 3, 5], time: '19:00' }, // JSON format
      capacity: 25,
      dayOfWeek: [1, 3, 5], // Segunda, Quarta e Sexta
      startTime: '19:00'
    }
  ];

  const createdTurmas = [];
  for (const turmaData of turmas) {
    const turma = await prisma.turma.upsert({
      where: { id: turmaData.id },
      update: {},
      create: {
        id: turmaData.id,
        organizationId: ORG_ID,
        courseId: COURSE_ID,
        instructorId: instructorId,
        name: turmaData.name,
        schedule: turmaData.schedule,
        maxStudents: turmaData.capacity,
        startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // 1 ano atrás
      }
    });
    createdTurmas.push({ ...turma, dayOfWeek: turmaData.dayOfWeek, startTime: turmaData.startTime });
    console.log(`  ✅ ${turma.name}`);
  }

  return createdTurmas;
}

async function createLessonPlans(turmas: any[]) {
  console.log('📋 Criando planos de aula históricos...');

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 12); // 12 meses atrás

  // Criar 1 aula por semana para cada turma nos últimos 12 meses
  for (const turma of turmas) {
    let currentDate = new Date(startDate);
    let lessonCount = 0;
    const lessonsToCreate = [];

    while (currentDate <= new Date()) {
      // Ajustar para próximo dia da semana da turma
      const targetDay = turma.dayOfWeek[0]; // Usar primeiro dia da semana
      while (currentDate.getDay() !== targetDay) {
        currentDate.setDate(currentDate.getDate() + 1);
      }

      if (currentDate > new Date()) break;

      lessonCount++; // Incrementar ANTES de criar
      
      lessonsToCreate.push({
        turmaId: turma.id,
        lessonNumber: lessonCount,
        title: `Aula ${lessonCount} - Faixa Branca`,
        scheduledDate: new Date(currentDate),
        duration: 60,
        status: currentDate < new Date() ? 'COMPLETED' : 'SCHEDULED',
        objectives: ['Técnica', 'Condicionamento'],
        materials: []
      });

      // Avançar 1 semana
      currentDate.setDate(currentDate.getDate() + 7);
    }

    // Criar todas as aulas de uma vez com createMany
    if (lessonsToCreate.length > 0) {
      await prisma.turmaLesson.createMany({
        data: lessonsToCreate
      });
    }
  }

  // Buscar todas as aulas criadas com IDs
  const allLessons = await prisma.turmaLesson.findMany({
    where: {
      turmaId: { in: turmas.map(t => t.id) }
    },
    orderBy: { scheduledDate: 'asc' }
  });

  console.log(`✅ ${allLessons.length} planos de aula criados`);
  return allLessons;
}

async function createStudentWithHistory(scenario: typeof studentScenarios[0], turmas: any[], lessonPlans: any[], instructorId: string) {
  console.log(`\n👤 Criando aluno: ${scenario.name} (${scenario.scenario})`);

  // 1. Criar usuário
  const user = await prisma.user.create({
    data: {
      organizationId: ORG_ID,
      email: scenario.email,
      password: 'senha123',
      firstName: scenario.name.split(' ')[0],
      lastName: scenario.name.split(' ').slice(1).join(' '),
      role: 'STUDENT',
      isActive: true
    }
  });

  // 2. Criar student
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - scenario.monthsTraining);

  const student = await prisma.student.create({
    data: {
      organizationId: ORG_ID,
      userId: user.id,
      enrollmentDate: startDate,
      isActive: true
    }
  });

  // 3. Criar assinatura ativa
  const subscription = await prisma.studentSubscription.create({
    data: {
      organizationId: ORG_ID,
      studentId: student.id,
      planId: PLAN_ID,
      status: 'ACTIVE',
      billingType: 'MONTHLY',
      currentPrice: 199.90,
      startDate: startDate,
      nextBillingDate: addDays(new Date(), 30)
    }
  });

  // 4. Matricular no curso
  const turma = turmas[randomBetween(0, turmas.length - 1)]; // Turma aleatória
  
  const enrollment = await prisma.studentCourse.create({
    data: {
      studentId: student.id,
      courseId: COURSE_ID,
      startDate: startDate,
      isActive: true
    }
  });

  // 4.5 Matricular na turma (criar TurmaStudent)
  const turmaStudent = await prisma.turmaStudent.create({
    data: {
      turmaId: turma.id,
      studentId: student.id,
      enrolledAt: startDate,
      status: 'ACTIVE'
    }
  });

  // 5. Filtrar aulas da turma do aluno
  const turmaLessons = lessonPlans.filter(lp => 
    lp.turmaId === turma.id && 
    lp.scheduledDate >= startDate &&
    lp.scheduledDate <= new Date() &&
    lp.status === 'COMPLETED'
  );

  // 6. Calcular quantas aulas deve ter comparecido baseado no targetPercentage
  const totalLessons = turmaLessons.length;
  const targetLessons = Math.ceil((scenario.targetPercentage / 100) * 96); // 96 é o total de aulas do curso
  const lessonsToAttend = Math.min(targetLessons, totalLessons);
  
  // Aplicar taxa de frequência
  const actualAttendances = Math.ceil(lessonsToAttend * scenario.attendanceRate);

  console.log(`  📊 Total de aulas disponíveis: ${totalLessons}`);
  console.log(`  🎯 Meta de aulas: ${lessonsToAttend} (${scenario.targetPercentage}%)`);
  console.log(`  ✅ Comparecimentos: ${actualAttendances} (${Math.round(scenario.attendanceRate * 100)}% frequência)`);

  // 7. Criar check-ins (selecionar aulas aleatórias)
  const attendedLessons = turmaLessons
    .sort(() => Math.random() - 0.5) // Embaralhar
    .slice(0, actualAttendances)
    .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime()); // Reordenar por data

  let checkinsCreated = 0;
  for (const lesson of attendedLessons) {
    await prisma.turmaAttendance.create({
      data: {
        turmaId: turma.id,
        turmaLessonId: lesson.id,
        turmaStudentId: turmaStudent.id,
        studentId: student.id,
        present: true,
        late: Math.random() < 0.1, // 10% chance de atraso
        justified: false,
        checkedAt: lesson.scheduledDate
      }
    });
    checkinsCreated++;
  }

  console.log(`  ✅ ${checkinsCreated} check-ins registrados`);

  // 8. Calcular grau atual baseado no percentual
  const currentDegree = Math.floor(scenario.targetPercentage / 20);
  
  if (currentDegree >= 1) {
    // Registrar histórico de graus
    const degrees = [];
    for (let i = 1; i <= currentDegree; i++) {
      const degreeDate = new Date(startDate);
      degreeDate.setMonth(degreeDate.getMonth() + (i * scenario.monthsTraining / currentDegree));
      const degreePercentage = i * 20; // Cada grau = 20%
      const completedLessons = Math.ceil((degreePercentage / 100) * totalLessons);
      
      degrees.push({
        studentId: student.id,
        courseId: COURSE_ID,
        degree: i,
        degreePercentage: degreePercentage,
        belt: 'BRANCA', // Faixa Branca
        achievedAt: degreeDate,
        completedLessons: completedLessons,
        totalRepetitions: completedLessons * 50, // Estimativa de 50 reps por aula
        attendanceRate: scenario.attendanceRate
      });
    }

    await prisma.studentDegreeHistory.createMany({
      data: degrees
    });

    console.log(`  ⭐ Graus registrados: ${currentDegree}º grau`);
  }

  // 9. Se elegível para graduação (100%), criar solicitação
  if (scenario.targetPercentage >= 100) {
    const graduation = await prisma.studentGraduation.create({
      data: {
        studentId: student.id,
        courseId: COURSE_ID,
        fromBelt: 'BRANCA',
        toBelt: 'AMARELA',
        approvedBy: instructorId, // Instrutor que criou o curso
        finalAttendanceRate: scenario.attendanceRate,
        finalQualityRating: randomBetween(4.0, 5.0),
        totalRepetitions: actualAttendances * 50, // Estimativa
        totalLessonsCompleted: actualAttendances
      }
    });

    console.log(`  🎓 Graduação aprovada (BRANCA → AMARELA)`);
  }

  console.log(`  ✅ Aluno ${scenario.name} criado com sucesso!`);
  return student;
}

// ===== MAIN =====
async function main() {
  console.log('🎓 INICIANDO SEED DE TESTES DE GRADUAÇÃO\n');
  console.log('=' .repeat(60));

  try {
    // Limpar dados anteriores do teste
    console.log('🧹 Limpando dados antigos de teste...');
    await prisma.studentGraduation.deleteMany({ where: { courseId: COURSE_ID } });
    await prisma.studentDegreeHistory.deleteMany({ where: { courseId: COURSE_ID } });
    await prisma.turmaAttendance.deleteMany({});
    await prisma.studentCourse.deleteMany({ where: { courseId: COURSE_ID } });
    await prisma.studentSubscription.deleteMany({ where: { planId: PLAN_ID } });
    await prisma.student.deleteMany({ where: { organizationId: ORG_ID } });
    await prisma.user.deleteMany({ where: { organizationId: ORG_ID, role: 'STUDENT' } });
    await prisma.turmaLesson.deleteMany({});
    await prisma.turma.deleteMany({ where: { courseId: COURSE_ID } });
    await prisma.course.deleteMany({ where: { id: COURSE_ID } });
    await prisma.billingPlan.deleteMany({ where: { id: PLAN_ID } });
    console.log('✅ Limpeza concluída\n');

    // 1. Setup básico
    const { course, plan, instructorId } = await setupCourseAndPlan();
    const turmas = await createTurmas();
    const lessonPlans = await createLessonPlans(turmas);

    console.log('\n' + '='.repeat(60));
    console.log('👥 CRIANDO ALUNOS COM HISTÓRICOS\n');

    // 2. Criar cada aluno com seu histórico
    for (const scenario of studentScenarios) {
      await createStudentWithHistory(scenario, turmas, lessonPlans, instructorId);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ SEED COMPLETO!\n');
    console.log('📊 RESUMO:');
    console.log(`  - Curso: Krav Maga - Faixa Branca`);
    console.log(`  - Turmas: ${turmas.length}`);
    console.log(`  - Planos de aula: ${lessonPlans.length}`);
    console.log(`  - Alunos criados: ${studentScenarios.length}`);
    console.log('\n🧪 CENÁRIOS DE TESTE DISPONÍVEIS:');
    console.log('  - Iniciantes (0-19%): 1 aluno');
    console.log('  - 1º Grau (20-39%): 3 alunos');
    console.log('  - 2º Grau (40-59%): 2 alunos');
    console.log('  - 3º Grau (60-79%): 2 alunos');
    console.log('  - 4º Grau (80-99%): 2 alunos');
    console.log('  - Elegíveis (100%): 1 aluno');
    console.log('  - Irregulares: 1 aluno');
    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('  1. Testar check-in kiosk');
    console.log('  2. Ver dashboard de progressão');
    console.log('  3. Testar cálculo de graus');
    console.log('  4. Aprovar graduações pendentes');
    console.log('  5. Gerar certificados');
    console.log('\n🚀 Acesse: http://localhost:3000');

  } catch (error) {
    console.error('❌ Erro durante seed:', error);
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
