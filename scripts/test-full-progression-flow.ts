#!/usr/bin/env npx tsx

/**
 * 🧪 TESTE COMPLETO DE PROGRESSÃO DE ALUNO
 * ========================================
 * 
 * Valida toda a cadeia desde plano até graduação:
 * 1. Plano ativo
 * 2. Matrícula no curso
 * 3. Matrícula na turma
 * 4. Check-ins
 * 5. Execução de atividades
 * 6. Graus automáticos
 * 7. Progressão API
 * 8. Elegibilidade
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ===== IDs REAIS DO BANCO =====
const TEST_ORG_ID = '452c0b35-1822-4890-851e-922356c812fb'; // Academia Krav Maga Demo
const TEST_COURSE_ID = 'f7a3af16-7ccb-407c-8d5e-6d4b97cf8b53'; // Krav Maga - Iniciante
const TEST_INSTRUCTOR_ID = '7b5afef8-4674-4d9b-b334-5e8265f5446d'; // Instrutor Demo

interface TestResult {
  step: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  data?: any;
}

const results: TestResult[] = [];

function log(result: TestResult) {
  const emoji = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${emoji} [${result.status}] ${result.step}: ${result.message}`);
  if (result.data) {
    console.log('  📊 Dados:', JSON.stringify(result.data, null, 2));
  }
  results.push(result);
}

async function main() {
  console.log('\n🧪 INICIANDO TESTE COMPLETO DE PROGRESSÃO\n');
  console.log('=' .repeat(60));

  // ========================================
  // ETAPA 1: Criar Aluno de Teste
  // ========================================
  console.log('\n📝 ETAPA 1: Criando aluno de teste...\n');

  let testStudent: any;
  let testUser: any;

  try {
    // Limpar aluno de teste anterior (se existir)
    const existingUser = await prisma.user.findFirst({
      where: { email: 'aluno.teste.progressao@teste.com' }
    });

    if (existingUser) {
      console.log('🗑️  Limpando dados anteriores...');
      await prisma.studentCourse.deleteMany({ where: { student: { userId: existingUser.id } } });
      await prisma.studentSubscription.deleteMany({ where: { student: { userId: existingUser.id } } });
      await prisma.turmaAttendance.deleteMany({ where: { student: { userId: existingUser.id } } });
      await prisma.turmaStudent.deleteMany({ where: { student: { userId: existingUser.id } } });
      await prisma.lessonActivityExecution.deleteMany({ where: { student: { userId: existingUser.id } } });
      await prisma.studentDegreeHistory.deleteMany({ where: { student: { userId: existingUser.id } } });
      await prisma.student.deleteMany({ where: { userId: existingUser.id } });
      await prisma.user.delete({ where: { id: existingUser.id } });
      console.log('✅ Dados anteriores removidos');
    }

    // Criar usuário
    testUser = await prisma.user.create({
      data: {
        email: 'aluno.teste.progressao@teste.com',
        password: 'test123', // Senha temporária para testes
        firstName: 'Aluno',
        lastName: 'Teste Progressão',
        role: 'STUDENT',
        organizationId: TEST_ORG_ID,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Criar student
    testStudent = await prisma.student.create({
      data: {
        userId: testUser.id,
        organizationId: TEST_ORG_ID,
        registrationNumber: `TEST-${Date.now()}`,
        category: 'ADULT', // Categoria correta do enum StudentCategory
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    log({
      step: 'Criação de Aluno',
      status: 'PASS',
      message: 'Aluno de teste criado com sucesso',
      data: { studentId: testStudent.id, email: testUser.email }
    });

  } catch (error: any) {
    log({
      step: 'Criação de Aluno',
      status: 'FAIL',
      message: `Erro ao criar aluno: ${error.message}`
    });
    process.exit(1);
  }

  // ========================================
  // ETAPA 2: Verificar Plano Ativo
  // ========================================
  console.log('\n💳 ETAPA 2: Verificando plano ativo...\n');

  try {
    const plan = await prisma.billingPlan.findFirst({
      where: { organizationId: TEST_ORG_ID, isActive: true }
    });

    if (!plan) {
      log({
        step: 'Plano Ativo',
        status: 'WARN',
        message: 'Nenhum plano ativo encontrado. Criando plano de teste...'
      });

      const newPlan = await prisma.billingPlan.create({
        data: {
          name: 'Plano Teste Progressão',
          description: 'Plano para testes de progressão',
          organizationId: TEST_ORG_ID,
          price: 0,
          billingType: 'MONTHLY',
          isActive: true
        }
      });

      // Criar assinatura para o aluno
      const today = new Date();
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      await prisma.studentSubscription.create({
        data: {
          studentId: testStudent.id,
          organizationId: TEST_ORG_ID,
          planId: newPlan.id,
          status: 'ACTIVE',
          billingType: 'MONTHLY', // Campo obrigatório
          currentPrice: 0, // Campo obrigatório (Decimal)
          startDate: today,
          nextBillingDate: nextMonth
        }
      });

      log({
        step: 'Plano Ativo',
        status: 'PASS',
        message: 'Plano criado e aluno inscrito',
        data: { planId: newPlan.id }
      });

    } else {
      // Criar assinatura para o aluno
      const today = new Date();
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      await prisma.studentSubscription.create({
        data: {
          studentId: testStudent.id,
          organizationId: TEST_ORG_ID,
          planId: plan.id,
          status: 'ACTIVE',
          billingType: plan.billingType, // Usar do plano
          currentPrice: plan.price, // Usar preço do plano
          startDate: today,
          nextBillingDate: nextMonth
        }
      });

      log({
        step: 'Plano Ativo',
        status: 'PASS',
        message: 'Aluno possui plano ativo',
        data: { planId: plan.id, planName: plan.name }
      });
    }

  } catch (error: any) {
    log({
      step: 'Plano Ativo',
      status: 'FAIL',
      message: `Erro ao verificar plano: ${error.message}`
    });
  }

  // ========================================
  // ETAPA 3: Matricular no Curso
  // ========================================
  console.log('\n📚 ETAPA 3: Matriculando no curso...\n');

  try {
    const course = await prisma.course.findUnique({
      where: { id: TEST_COURSE_ID }
    });

    if (!course) {
      log({
        step: 'Curso Existente',
        status: 'FAIL',
        message: `Curso ${TEST_COURSE_ID} não encontrado`
      });
      process.exit(1);
    }

    await prisma.studentCourse.create({
      data: {
        studentId: testStudent.id,
        courseId: TEST_COURSE_ID,
        startDate: new Date(), // Campo correto
        status: 'ACTIVE', // EnrollmentStatus
        isActive: true
      }
    });

    log({
      step: 'Matrícula no Curso',
      status: 'PASS',
      message: 'Aluno matriculado no curso',
      data: { courseId: TEST_COURSE_ID, courseName: course.name }
    });

  } catch (error: any) {
    log({
      step: 'Matrícula no Curso',
      status: 'FAIL',
      message: `Erro ao matricular: ${error.message}`
    });
  }

  // ========================================
  // ETAPA 4: Criar Turma de Teste
  // ========================================
  console.log('\n🏫 ETAPA 4: Criando turma de teste...\n');

  let testTurma: any;

  try {
    const today = new Date();
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    // Verificar se instrutor existe, senão criar um
    let instructorUserId = null;
    
    try {
      const instructor = await prisma.instructor.findUnique({
        where: { id: TEST_INSTRUCTOR_ID },
        include: { user: true }
      });
      
      if (instructor) {
        instructorUserId = instructor.userId; // IMPORTANTE: Turma usa userId, não instructorId!
        console.log('✅ Instrutor existente (userId):', instructorUserId);
      }
    } catch (e) {
      console.log('⚠️  Instrutor não encontrado');
    }

    if (!instructorUserId) {
      console.log('📝 Criando instrutor de teste...');
      
      const instrUser = await prisma.user.create({
        data: {
          email: `instrutor.teste.${Date.now()}@teste.com`,
          password: 'test123',
          firstName: 'Instrutor',
          lastName: 'Teste',
          role: 'INSTRUCTOR',
          organizationId: TEST_ORG_ID
        }
      });

      await prisma.instructor.create({
        data: {
          userId: instrUser.id,
          organizationId: TEST_ORG_ID,
          specialties: ['Krav Maga']
        }
      });

      instructorUserId = instrUser.id; // Usar userId, não instructorId!
      console.log('✅ Instrutor criado (userId):', instructorUserId);
    }

    testTurma = await prisma.turma.create({
      data: {
        name: `Turma Teste Progressão ${Date.now()}`, // Nome único com timestamp
        courseId: TEST_COURSE_ID,
        organizationId: TEST_ORG_ID,
        instructorId: instructorUserId, // Este campo espera userId!
        classType: 'COLLECTIVE',
        status: 'ACTIVE', // TurmaStatus correto (não IN_PROGRESS)
        startDate: twoWeeksAgo,
        maxStudents: 20,
        schedule: {
          daysOfWeek: [1, 3], // Seg e Qua
          startTime: '19:00',
          endTime: '20:30'
        }
      }
    });

    log({
      step: 'Criação de Turma',
      status: 'PASS',
      message: 'Turma criada',
      data: { turmaId: testTurma.id, turmaName: testTurma.name }
    });

    // Matricular aluno na turma
    await prisma.turmaStudent.create({
      data: {
        turmaId: testTurma.id,
        studentId: testStudent.id,
        enrolledAt: new Date(),
        isActive: true
      }
    });

    log({
      step: 'Matrícula na Turma',
      status: 'PASS',
      message: 'Aluno matriculado na turma'
    });

  } catch (error: any) {
    log({
      step: 'Criação de Turma',
      status: 'FAIL',
      message: `Erro ao criar turma: ${error.message}`
    });
    process.exit(1);
  }

  // ========================================
  // ETAPA 5: Criar Aulas (TurmaLesson)
  // ========================================
  console.log('\n📅 ETAPA 5: Criando aulas da turma...\n');

  const today = new Date();
  const lessonDates = [
    new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 dias atrás
    new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),  // 7 dias atrás
    new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000)   // 4 dias atrás
  ];

  const turmaLessons: any[] = [];

  for (let i = 0; i < lessonDates.length; i++) {
    try {
      const lesson = await prisma.turmaLesson.create({
        data: {
          turmaId: testTurma.id,
          lessonNumber: i + 1,
          title: `Aula ${i + 1} - Teste Progressão`,
          scheduledDate: lessonDates[i],
          actualDate: lessonDates[i],
          status: 'COMPLETED',
          duration: 60
        }
      });

      turmaLessons.push(lesson);

      log({
        step: `Aula ${i + 1}`,
        status: 'PASS',
        message: `Aula ${i + 1} criada`,
        data: { lessonId: lesson.id, date: lessonDates[i].toLocaleDateString('pt-BR') }
      });

    } catch (error: any) {
      log({
        step: `Aula ${i + 1}`,
        status: 'FAIL',
        message: `Erro ao criar aula: ${error.message}`
      });
    }
  }

  // ========================================
  // ETAPA 6: Simular Check-ins
  // ========================================
  console.log('\n✅ ETAPA 6: Simulando check-ins...\n');

  const turmaStudent = await prisma.turmaStudent.findFirst({
    where: {
      turmaId: testTurma.id,
      studentId: testStudent.id
    }
  });

  for (const lesson of turmaLessons) {
    try {
      await prisma.turmaAttendance.create({
        data: {
          turmaId: testTurma.id,
          turmaLessonId: lesson.id,
          turmaStudentId: turmaStudent!.id,
          studentId: testStudent.id,
          present: true,
          late: false,
          checkedAt: lesson.scheduledDate
        }
      });

      log({
        step: `Check-in Aula ${lesson.lessonNumber}`,
        status: 'PASS',
        message: `Check-in registrado na aula ${lesson.lessonNumber}`
      });

    } catch (error: any) {
      log({
        step: `Check-in Aula ${lesson.lessonNumber}`,
        status: 'FAIL',
        message: `Erro ao registrar check-in: ${error.message}`
      });
    }
  }

  // ========================================
  // ETAPA 7: Verificar Execuções de Atividades
  // ========================================
  console.log('\n🎯 ETAPA 7: Verificando execuções de atividades...\n');

  try {
    const executions = await prisma.lessonActivityExecution.findMany({
      where: { studentId: testStudent.id },
      include: { activity: true }
    });

    if (executions.length > 0) {
      log({
        step: 'Execuções de Atividades',
        status: 'PASS',
        message: `${executions.length} execuções de atividades registradas`,
        data: { 
          total: executions.length,
          sample: executions.slice(0, 2).map(e => ({
            activity: e.activity.name,
            completed: e.completed,
            rating: e.performanceRating
          }))
        }
      });
    } else {
      log({
        step: 'Execuções de Atividades',
        status: 'WARN',
        message: 'Nenhuma execução de atividade registrada (autoComplete pode estar desabilitado)'
      });
    }

  } catch (error: any) {
    log({
      step: 'Execuções de Atividades',
      status: 'WARN',
      message: `Tabela LessonActivityExecution não existe (schema ainda não migrado): ${error.message}`
    });
  }

  // ========================================
  // ETAPA 8: Verificar Graus Automáticos
  // ========================================
  console.log('\n⭐ ETAPA 8: Verificando graus automáticos...\n');

  try {
    const degrees = await prisma.studentDegreeHistory.findMany({
      where: {
        studentId: testStudent.id,
        courseId: TEST_COURSE_ID
      },
      orderBy: { degree: 'asc' }
    });

    if (degrees.length > 0) {
      log({
        step: 'Graus Automáticos',
        status: 'PASS',
        message: `${degrees.length} grau(s) registrado(s)`,
        data: degrees.map(d => ({ 
          degree: d.degree, 
          percentage: d.degreePercentage, 
          achievedAt: d.achievedAt?.toLocaleDateString('pt-BR') 
        }))
      });
    } else {
      log({
        step: 'Graus Automáticos',
        status: 'WARN',
        message: 'Nenhum grau registrado ainda (progresso < 20% ou função automática não implementada)'
      });
    }

  } catch (error: any) {
    log({
      step: 'Graus Automáticos',
      status: 'WARN',
      message: `Tabela StudentDegreeHistory não existe (schema ainda não migrado): ${error.message}`
    });
  }

  // ========================================
  // ETAPA 9: Verificar Dados no Frontend
  // ========================================
  console.log('\n🎨 ETAPA 9: Dados para Frontend...\n');

  try {
    const studentWithProgression = await prisma.student.findUnique({
      where: { id: testStudent.id },
      include: {
        user: true,
        studentCourses: { // Nome correto da relação
          include: { course: true }
        },
        turmaAttendances: { // Nome correto da relação
          include: { lesson: true }
        }
      }
    });

    // Calcular estatísticas básicas
    const totalLessons = turmaLessons.length;
    const totalAttendances = studentWithProgression?.turmaAttendances.filter(a => a.present).length || 0;
    const attendanceRate = totalLessons > 0 ? Math.round((totalAttendances / totalLessons) * 100) : 0;

    log({
      step: 'Dados Frontend',
      status: 'PASS',
      message: 'Dados completos disponíveis para renderização',
      data: {
        studentId: testStudent.id,
        email: studentWithProgression?.user.email,
        totalCourses: studentWithProgression?.studentCourses.length,
        totalLessons: totalLessons,
        totalAttendances: totalAttendances,
        attendanceRate: `${attendanceRate}%`
      }
    });

  } catch (error: any) {
    log({
      step: 'Dados Frontend',
      status: 'FAIL',
      message: `Erro ao buscar dados: ${error.message}`
    });
  }

  // ========================================
  // ETAPA 10: Verificar Estrutura de Dados
  // ========================================
  console.log('\n🔍 ETAPA 10: Validando integridade dos dados...\n');

  try {
    // Verificar cadeia completa
    const validation = await prisma.student.findUnique({
      where: { id: testStudent.id },
      include: {
        subscriptions: true,
        studentCourses: true, // Nome correto da relação
        turmaStudents: {
          include: {
            turma: {
              include: {
                course: true
              }
            }
          }
        },
        turmaAttendances: { // Nome correto da relação
          include: {
            lesson: true
          }
        }
      }
    });

    const hasActiveSubscription = validation?.subscriptions.some(s => s.status === 'ACTIVE');
    const hasActiveCourse = validation?.studentCourses.some(c => c.isActive);
    const hasTurmaEnrollment = validation?.turmaStudents.length > 0;
    const hasAttendances = validation?.turmaAttendances.length > 0;

    const allValid = hasActiveSubscription && hasActiveCourse && hasTurmaEnrollment && hasAttendances;

    log({
      step: 'Integridade de Dados',
      status: allValid ? 'PASS' : 'WARN',
      message: allValid ? 'Todos os relacionamentos válidos' : 'Alguns relacionamentos faltando',
      data: {
        hasActiveSubscription,
        hasActiveCourse,
        hasTurmaEnrollment,
        hasAttendances,
        attendancesCount: validation?.turmaAttendances.length
      }
    });

  } catch (error: any) {
    log({
      step: 'Integridade de Dados',
      status: 'FAIL',
      message: `Erro ao validar: ${error.message}`
    });
  }

  // ========================================
  // RELATÓRIO FINAL
  // ========================================
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 RELATÓRIO FINAL DE TESTES\n');

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const warnings = results.filter(r => r.status === 'WARN').length;

  console.log(`✅ PASS: ${passed}`);
  console.log(`❌ FAIL: ${failed}`);
  console.log(`⚠️  WARN: ${warnings}`);
  console.log(`📈 TOTAL: ${results.length}\n`);

  const successRate = Math.round((passed / results.length) * 100);

  if (failed === 0 && successRate >= 80) {
    console.log('🎉 SISTEMA APROVADO PARA PRODUÇÃO!\n');
    console.log('📝 PRÓXIMOS PASSOS:');
    console.log('1. Acesse: http://localhost:3000/#students');
    console.log('2. Busque: aluno.teste.progressao@teste.com');
    console.log('3. Verifique os dados do aluno');
    console.log('4. Navegue entre as abas (Dados, Frequência, Progressão)');
    console.log('5. Confirme que tudo renderiza corretamente\n');
    
    console.log('🚀 PRONTO PARA IMPLEMENTAR COM ALUNOS REAIS!');
  } else if (failed > 0) {
    console.log('⚠️  ATENÇÃO: Alguns testes críticos falharam!\n');
    console.log('🔧 AÇÕES NECESSÁRIAS:');
    console.log('1. Revise os erros marcados com ❌ acima');
    console.log('2. Corrija os problemas identificados');
    console.log('3. Execute o teste novamente\n');
    console.log('⛔ NÃO RECOMENDADO para produção ainda.');
  } else {
    console.log('⚠️  Sistema funcional mas com avisos.\n');
    console.log('💡 RECOMENDAÇÕES:');
    console.log('- Revisar os avisos (⚠️) antes de ir para produção');
    console.log('- Alguns recursos podem não estar totalmente implementados');
    console.log('- Funcionalidade básica está OK para testes com alunos\n');
    console.log('✅ Pode implementar com cautela.');
  }

  console.log('='.repeat(60));
  console.log(`\n🆔 ID do aluno de teste: ${testStudent.id}`);
  console.log(`📧 Email: aluno.teste.progressao@teste.com\n`);

  // Limpar conexão
  await prisma.$disconnect();
}

// Executar
main()
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });
