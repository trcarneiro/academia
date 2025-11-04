/**
 * Auditoria Completa dos Dados de Seed
 * Verifica se todos os alunos têm planos, cursos, turmas e frequência
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuditReport {
  timestamp: string;
  summary: {
    totalStudents: number;
    studentsWithActivePlans: number;
    studentsWithCourses: number;
    studentsWithAttendance: number;
    totalCourses: number;
    totalClasses: number;
    totalAttendances: number;
  };
  students: StudentAudit[];
  issues: string[];
  recommendations: string[];
}

interface StudentAudit {
  id: string;
  name: string;
  email: string;
  registrationNumber: string | null;
  enrollmentDate: string;
  status: {
    hasActivePlan: boolean;
    planDetails: string | null;
    hasEnrolledCourses: boolean;
    courseDetails: string[];
    hasAttendance: boolean;
    attendanceCount: number;
  };
  issues: string[];
}

async function auditSeedData(): Promise<AuditReport> {
  console.log('🔍 Iniciando auditoria dos dados de seed...\n');

  const report: AuditReport = {
    timestamp: new Date().toISOString(),
    summary: {
      totalStudents: 0,
      studentsWithActivePlans: 0,
      studentsWithCourses: 0,
      studentsWithAttendance: 0,
      totalCourses: 0,
      totalClasses: 0,
      totalAttendances: 0
    },
    students: [],
    issues: [],
    recommendations: []
  };

  try {
    // 1. Auditar Alunos
    console.log('📊 1. AUDITANDO ALUNOS...');
    const students = await prisma.student.findMany({
      include: {
        user: true,
        subscriptions: {
          include: {
            plan: true
          }
        },
        studentCourses: {
          include: {
            course: true
          }
        },
        turmaAttendances: true,
        _count: {
          select: {
            subscriptions: true,
            studentCourses: true,
            turmaAttendances: true
          }
        }
      }
    });

    report.summary.totalStudents = students.length;
    console.log(`   ✅ Total de alunos: ${students.length}`);

    // 2. Analisar cada aluno
    for (const student of students) {
      const activePlan = student.subscriptions.find(s => s.status === 'ACTIVE' && s.isActive);
      const hasActivePlan = !!activePlan;
      const hasEnrolledCourses = student.studentCourses.length > 0;
      const hasAttendance = student.turmaAttendances.length > 0;

      if (hasActivePlan) report.summary.studentsWithActivePlans++;
      if (hasEnrolledCourses) report.summary.studentsWithCourses++;
      if (hasAttendance) report.summary.studentsWithAttendance++;

      const studentIssues: string[] = [];

      // Verificar problemas
      if (!hasActivePlan) {
        studentIssues.push('❌ SEM PLANO ATIVO');
        report.issues.push(`Aluno "${student.user.firstName} ${student.user.lastName}" não tem plano ativo`);
      }

      if (!hasEnrolledCourses) {
        studentIssues.push('❌ SEM MATRÍCULA EM CURSO');
        report.issues.push(`Aluno "${student.user.firstName} ${student.user.lastName}" não está matriculado em nenhum curso`);
      }

      if (!hasAttendance) {
        studentIssues.push('⚠️ SEM REGISTRO DE FREQUÊNCIA');
        report.issues.push(`Aluno "${student.user.firstName} ${student.user.lastName}" não tem presença registrada`);
      }

      const studentAudit: StudentAudit = {
        id: student.id,
        name: `${student.user.firstName} ${student.user.lastName}`,
        email: student.user.email,
        registrationNumber: student.registrationNumber,
        enrollmentDate: student.enrollmentDate.toISOString().split('T')[0],
        status: {
          hasActivePlan,
          planDetails: activePlan 
            ? `${activePlan.plan.name} (R$ ${activePlan.currentPrice})` 
            : null,
          hasEnrolledCourses,
          courseDetails: student.studentCourses.map(e => e.course.name),
          hasAttendance,
          attendanceCount: student.turmaAttendances.length
        },
        issues: studentIssues
      };

      report.students.push(studentAudit);
    }

    // 3. Auditar Cursos
    console.log('\n📚 2. AUDITANDO CURSOS...');
    const courses = await prisma.course.findMany({
      include: {
        _count: {
          select: {
            studentCourses: true,
            lessonPlans: true
          }
        }
      }
    });

    report.summary.totalCourses = courses.length;
    console.log(`   ✅ Total de cursos: ${courses.length}`);

    for (const course of courses) {
      console.log(`   📖 ${course.name}`);
      console.log(`      - Alunos matriculados: ${course._count.studentCourses}`);
      console.log(`      - Planos de aula: ${course._count.lessonPlans}`);

      if (course._count.studentCourses === 0) {
        report.issues.push(`Curso "${course.name}" não tem alunos matriculados`);
      }

      if (course._count.lessonPlans === 0) {
        report.issues.push(`Curso "${course.name}" não tem planos de aula`);
      }
    }

    // 4. Auditar Turmas (usando modelo Turma ao invés de Class)
    console.log('\n👥 3. AUDITANDO TURMAS...');
    const turmas = await prisma.turma.findMany({
      include: {
        instructor: true, // User model
        _count: {
          select: {
            attendances: true
          }
        }
      }
    });

    report.summary.totalClasses = turmas.length;
    console.log(`   ✅ Total de turmas: ${turmas.length}`);

    for (const turma of turmas) {
      console.log(`   📅 Turma: ${turma.name}`);
      console.log(`      - Instrutor: ${turma.instructor?.firstName || 'N/A'}`);
      console.log(`      - Presenças: ${turma._count.attendances}`);

      if (turma._count.attendances === 0) {
        report.issues.push(`Turma "${turma.name}" não tem presenças registradas`);
      }
    }

    // 5. Auditar Frequência
    console.log('\n✅ 4. AUDITANDO FREQUÊNCIA...');
    const attendances = await prisma.turmaAttendance.findMany({
      include: {
        student: {
          include: {
            user: true
          }
        },
        turma: true
      }
    });

    report.summary.totalAttendances = attendances.length;
    console.log(`   ✅ Total de presenças registradas: ${attendances.length}`);

    // 6. Gerar Recomendações
    console.log('\n💡 5. GERANDO RECOMENDAÇÕES...');

    if (report.summary.studentsWithActivePlans < report.summary.totalStudents) {
      const missing = report.summary.totalStudents - report.summary.studentsWithActivePlans;
      report.recommendations.push(
        `Criar planos ativos para ${missing} aluno(s) sem plano`
      );
    }

    if (report.summary.studentsWithCourses < report.summary.totalStudents) {
      const missing = report.summary.totalStudents - report.summary.studentsWithCourses;
      report.recommendations.push(
        `Matricular ${missing} aluno(s) em cursos`
      );
    }

    if (report.summary.studentsWithAttendance < report.summary.totalStudents) {
      const missing = report.summary.totalStudents - report.summary.studentsWithAttendance;
      report.recommendations.push(
        `Registrar frequência para ${missing} aluno(s) sem presença`
      );
    }

    if (report.summary.totalClasses === 0) {
      report.recommendations.push(
        'Criar turmas/aulas para permitir registro de frequência'
      );
    }

    return report;
  } catch (error) {
    console.error('❌ Erro na auditoria:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

function printReport(report: AuditReport) {
  console.log('\n' + '='.repeat(80));
  console.log('📋 RELATÓRIO DE AUDITORIA - DADOS DE SEED');
  console.log('='.repeat(80));
  console.log(`⏰ Timestamp: ${report.timestamp}\n`);

  // Resumo
  console.log('📊 RESUMO GERAL:');
  console.log(`   👥 Total de Alunos: ${report.summary.totalStudents}`);
  console.log(`   💳 Alunos com Plano Ativo: ${report.summary.studentsWithActivePlans} (${Math.round(report.summary.studentsWithActivePlans / report.summary.totalStudents * 100)}%)`);
  console.log(`   📚 Alunos Matriculados: ${report.summary.studentsWithCourses} (${Math.round(report.summary.studentsWithCourses / report.summary.totalStudents * 100)}%)`);
  console.log(`   ✅ Alunos com Presença: ${report.summary.studentsWithAttendance} (${Math.round(report.summary.studentsWithAttendance / report.summary.totalStudents * 100)}%)`);
  console.log(`   📖 Total de Cursos: ${report.summary.totalCourses}`);
  console.log(`   👥 Total de Turmas: ${report.summary.totalClasses}`);
  console.log(`   📅 Total de Presenças: ${report.summary.totalAttendances}\n`);

  // Detalhes dos Alunos
  console.log('👥 DETALHES DOS ALUNOS:');
  console.log('-'.repeat(80));

  for (const student of report.students) {
    const statusIcon = student.issues.length === 0 ? '✅' : '⚠️';
    console.log(`\n${statusIcon} ${student.name}`);
    console.log(`   📧 Email: ${student.email}`);
    console.log(`   🆔 Matrícula: ${student.registrationNumber || 'N/A'}`);
    console.log(`   📅 Data Matrícula: ${student.enrollmentDate}`);
    console.log(`   💳 Plano: ${student.status.planDetails || '❌ SEM PLANO'}`);
    console.log(`   📚 Cursos: ${student.status.courseDetails.length > 0 ? student.status.courseDetails.join(', ') : '❌ SEM CURSO'}`);
    console.log(`   ✅ Presenças: ${student.status.attendanceCount}`);

    if (student.issues.length > 0) {
      console.log(`   ⚠️ Problemas:`);
      student.issues.forEach(issue => console.log(`      ${issue}`));
    }
  }

  // Problemas
  if (report.issues.length > 0) {
    console.log('\n\n❌ PROBLEMAS ENCONTRADOS:');
    console.log('-'.repeat(80));
    report.issues.forEach((issue, i) => {
      console.log(`${i + 1}. ${issue}`);
    });
  } else {
    console.log('\n\n✅ NENHUM PROBLEMA ENCONTRADO!');
  }

  // Recomendações
  if (report.recommendations.length > 0) {
    console.log('\n\n💡 RECOMENDAÇÕES:');
    console.log('-'.repeat(80));
    report.recommendations.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec}`);
    });
  }

  console.log('\n' + '='.repeat(80));
}

// Executar auditoria
auditSeedData()
  .then(report => {
    printReport(report);

    // Salvar relatório em JSON
    const fs = require('fs');
    const filename = `audit-report-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    console.log(`\n💾 Relatório salvo em: ${filename}`);

    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
