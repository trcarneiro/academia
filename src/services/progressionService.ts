import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import { StudentCategory, EnrollmentStatus, TechniqueProficiency } from '@/types';
import dayjs from 'dayjs';

export class ProgressionService {
  // Category adjustment multipliers based on age and gender
  private static readonly CATEGORY_ADJUSTMENTS = {
    ADULT: { M: 1.0, F: 0.8 },
    MASTER_1: { M: 0.9, F: 0.72 }, // 35+ years
    MASTER_2: { M: 0.8, F: 0.64 }, // 45+ years
    MASTER_3: { M: 0.7, F: 0.56 }, // 55+ years
    HERO_1: { M: 0.6, F: 0.48 },   // 6-9 years
    HERO_2: { M: 0.7, F: 0.56 },   // 10-12 years
    HERO_3: { M: 0.8, F: 0.64 },   // 13-15 years
  };

  static calculateAdjustedMetrics(
    enrollment: any,
    baseMetric: number
  ): number {
    const category = enrollment.category as StudentCategory;
    const gender = enrollment.gender as 'M' | 'F';
    
    const adjustment = this.CATEGORY_ADJUSTMENTS[category]?.[gender] || 1.0;
    return Math.round(baseMetric * adjustment);
  }

  static async canTakeEvaluation(enrollmentId: string): Promise<{
    canTake: boolean;
    reasons: string[];
    requirements: {
      attendanceRate: number;
      requiredRate: number;
      techniquesMastered: number;
      requiredTechniques: number;
      lessonsCompleted: number;
      requiredLessons: number;
    };
  }> {
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        student: true,
        course: {
          include: {
            techniques: {
              include: {
                technique: true,
              },
              where: { isRequired: true },
            },
          },
        },
        techniqueProgress: {
          where: {
            status: {
              in: [TechniqueProficiency.PROFICIENT, TechniqueProficiency.EXPERT, TechniqueProficiency.MASTERED],
            },
          },
        },
        evaluations: {
          orderBy: { evaluatedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    const reasons: string[] = [];
    const requiredAttendanceRate = 0.8; // 80%
    const requiredTechniques = Math.floor(enrollment.course.techniques.length * 0.7); // 70% of techniques
    
    // Determine required lessons based on next evaluation
    let requiredLessons = 8; // Default for first mini-test
    if (enrollment.evaluations.length > 0) {
      const lastEval = enrollment.evaluations[0];
      if (lastEval.lessonNumber === 8) requiredLessons = 16;
      else if (lastEval.lessonNumber === 16) requiredLessons = 24;
      else if (lastEval.lessonNumber === 24) requiredLessons = 32;
      else if (lastEval.lessonNumber === 32) requiredLessons = 40;
      else if (lastEval.lessonNumber === 40) requiredLessons = 48;
    }

    // Check attendance rate
    if (enrollment.attendanceRate < requiredAttendanceRate) {
      reasons.push(`Taxa de presença insuficiente: ${(enrollment.attendanceRate * 100).toFixed(1)}% (mínimo: ${(requiredAttendanceRate * 100)}%)`);
    }

    // Check technique mastery
    if (enrollment.techniqueProgress.length < requiredTechniques) {
      reasons.push(`Técnicas dominadas insuficientes: ${enrollment.techniqueProgress.length} (mínimo: ${requiredTechniques})`);
    }

    // Check lessons completed
    if (enrollment.lessonsCompleted < requiredLessons) {
      reasons.push(`Aulas completadas insuficientes: ${enrollment.lessonsCompleted} (mínimo: ${requiredLessons})`);
    }

    return {
      canTake: reasons.length === 0,
      reasons,
      requirements: {
        attendanceRate: enrollment.attendanceRate,
        requiredRate: requiredAttendanceRate,
        techniquesMastered: enrollment.techniqueProgress.length,
        requiredTechniques,
        lessonsCompleted: enrollment.lessonsCompleted,
        requiredLessons,
      },
    };
  }

  static async calculateDropoutRisk(enrollmentId: string): Promise<{
    riskScore: number; // 0-100
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    factors: string[];
    recommendations: string[];
  }> {
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        student: {
          include: {
            attendances: {
              orderBy: { checkInTime: 'desc' },
              take: 10, // Last 10 attendances
            },
          },
        },
        techniqueProgress: true,
        challengeProgress: true,
      },
    });

    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    let riskScore = 0;
    const factors: string[] = [];
    const recommendations: string[] = [];

    // Factor 1: Attendance rate (40% weight)
    if (enrollment.attendanceRate < 0.5) {
      riskScore += 40;
      factors.push('Taxa de presença muito baixa');
      recommendations.push('Conversar sobre dificuldades de comparecimento');
    } else if (enrollment.attendanceRate < 0.7) {
      riskScore += 25;
      factors.push('Taxa de presença baixa');
      recommendations.push('Incentivar maior frequência');
    }

    // Factor 2: Days since last attendance (25% weight)
    const lastAttendance = enrollment.student.attendances[0];
    if (lastAttendance) {
      const daysSinceLastClass = dayjs().diff(dayjs(lastAttendance.checkInTime), 'days');
      if (daysSinceLastClass > 14) {
        riskScore += 25;
        factors.push('Muito tempo sem treinar');
        recommendations.push('Entrar em contato imediatamente');
      } else if (daysSinceLastClass > 7) {
        riskScore += 15;
        factors.push('Tempo sem treinar');
        recommendations.push('Enviar lembrete motivacional');
      }
    } else {
      riskScore += 30;
      factors.push('Nunca compareceu');
      recommendations.push('Contato urgente para onboarding');
    }

    // Factor 3: Technique progress (20% weight)
    const expectedProgress = Math.floor((enrollment.currentLesson / enrollment.course.totalClasses) * 
      (await prisma.courseTechnique.count({ where: { courseId: enrollment.courseId, isRequired: true } })));
    
    if (enrollment.techniqueProgress.length < expectedProgress * 0.3) {
      riskScore += 20;
      factors.push('Progresso técnico muito baixo');
      recommendations.push('Sessão de reforço individual');
    } else if (enrollment.techniqueProgress.length < expectedProgress * 0.6) {
      riskScore += 10;
      factors.push('Progresso técnico baixo');
      recommendations.push('Apoio técnico adicional');
    }

    // Factor 4: Challenge participation (15% weight)
    const totalChallenges = await prisma.courseChallenge.count({
      where: { courseId: enrollment.courseId },
    });
    const completedChallenges = enrollment.challengeProgress.filter(cp => cp.completed).length;
    
    if (totalChallenges > 0 && completedChallenges / totalChallenges < 0.3) {
      riskScore += 15;
      factors.push('Baixa participação em desafios');
      recommendations.push('Motivar participação em desafios');
    }

    // Determine risk level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    if (riskScore < 25) riskLevel = 'LOW';
    else if (riskScore < 50) riskLevel = 'MEDIUM';
    else if (riskScore < 75) riskLevel = 'HIGH';
    else riskLevel = 'CRITICAL';

    // Add general recommendations based on risk level
    if (riskLevel === 'HIGH' || riskLevel === 'CRITICAL') {
      recommendations.push('Agendar reunião pessoal');
      recommendations.push('Revisar objetivos pessoais');
    }

    return {
      riskScore: Math.min(riskScore, 100),
      riskLevel,
      factors,
      recommendations,
    };
  }

  static async getPersonalizedRecommendations(enrollmentId: string): Promise<{
    techniques: Array<{
      techniqueId: string;
      techniqueName: string;
      category: string;
      priority: 'HIGH' | 'MEDIUM' | 'LOW';
      reason: string;
    }>;
    challenges: Array<{
      challengeId: string;
      challengeName: string;
      priority: 'HIGH' | 'MEDIUM' | 'LOW';
      reason: string;
    }>;
    generalActions: string[];
  }> {
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: {
          include: {
            techniques: {
              include: {
                technique: true,
              },
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
        techniqueProgress: {
          include: {
            technique: true,
          },
        },
        challengeProgress: {
          include: {
            challenge: true,
          },
        },
      },
    });

    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    const techniques: any[] = [];
    const challenges: any[] = [];
    const generalActions: string[] = [];

    // Technique recommendations
    const masteredTechniqueIds = new Set(
      enrollment.techniqueProgress
        .filter(tp => tp.status === TechniqueProficiency.MASTERED)
        .map(tp => tp.techniqueId)
    );

    const strugglingTechniques = enrollment.techniqueProgress
      .filter(tp => tp.attempts > 5 && tp.accuracy && tp.accuracy < 70)
      .slice(0, 3);

    strugglingTechniques.forEach(tp => {
      techniques.push({
        techniqueId: tp.techniqueId,
        techniqueName: tp.technique.name,
        category: tp.technique.category,
        priority: 'HIGH' as const,
        reason: `Baixa precisão (${tp.accuracy?.toFixed(1)}%) após ${tp.attempts} tentativas`,
      });
    });

    // Next techniques to learn
    const nextTechniques = enrollment.course.techniques
      .filter(ct => !masteredTechniqueIds.has(ct.techniqueId))
      .slice(0, 2);

    nextTechniques.forEach(ct => {
      techniques.push({
        techniqueId: ct.techniqueId,
        techniqueName: ct.technique.name,
        category: ct.technique.category,
        priority: 'MEDIUM' as const,
        reason: 'Próxima técnica na progressão',
      });
    });

    // Challenge recommendations
    const incompleteChallenges = enrollment.challengeProgress
      .filter(cp => !cp.completed && cp.attempted)
      .slice(0, 2);

    incompleteChallenges.forEach(cp => {
      challenges.push({
        challengeId: cp.challengeId,
        challengeName: cp.challenge.baseActivity,
        priority: 'HIGH' as const,
        reason: 'Desafio iniciado mas não completado',
      });
    });

    // General action recommendations
    if (enrollment.attendanceRate < 0.8) {
      generalActions.push('Aumentar frequência de treinos para pelo menos 80%');
    }

    if (enrollment.student.currentStreak === 0) {
      generalActions.push('Estabelecer uma rotina de treinos consistente');
    }

    const totalProgress = (enrollment.lessonsCompleted / enrollment.course.totalClasses) * 100;
    if (totalProgress < 50) {
      generalActions.push('Focar em completar as aulas básicas');
    }

    return {
      techniques,
      challenges,
      generalActions,
    };
  }

  static async updateEnrollmentProgress(enrollmentId: string): Promise<void> {
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        student: {
          include: {
            attendances: {
              where: {
                class: {
                  courseId: enrollment?.courseId,
                },
              },
            },
          },
        },
        course: true,
        techniqueProgress: {
          where: {
            status: {
              in: [TechniqueProficiency.PROFICIENT, TechniqueProficiency.EXPERT, TechniqueProficiency.MASTERED],
            },
          },
        },
      },
    });

    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    // Calculate attendance rate for this course
    const totalExpectedClasses = Math.floor(
      (dayjs().diff(dayjs(enrollment.enrolledAt), 'weeks') + 1) * enrollment.course.classesPerWeek
    );
    const attendanceRate = totalExpectedClasses > 0 
      ? Math.min(enrollment.student.attendances.length / totalExpectedClasses, 1.0)
      : 0;

    // Calculate current lesson based on attendance
    const currentLesson = Math.min(enrollment.student.attendances.length + 1, enrollment.course.totalClasses);

    // Update enrollment
    await prisma.courseEnrollment.update({
      where: { id: enrollmentId },
      data: {
        attendanceRate,
        currentLesson,
        lessonsCompleted: enrollment.student.attendances.length,
        updatedAt: new Date(),
      },
    });

    logger.info(
      {
        enrollmentId,
        attendanceRate,
        currentLesson,
        lessonsCompleted: enrollment.student.attendances.length,
      },
      'Enrollment progress updated'
    );
  }

  static async getNextEvaluation(enrollmentId: string): Promise<{
    nextEvaluationType: string;
    nextEvaluationLesson: number;
    canTakeNow: boolean;
    requirements: any;
  } | null> {
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        evaluations: {
          orderBy: { evaluatedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    const evaluationSchedule = [
      { lesson: 8, type: 'MINI_TEST_1' },
      { lesson: 16, type: 'MINI_TEST_2' },
      { lesson: 24, type: 'MINI_TEST_3' },
      { lesson: 32, type: 'MINI_TEST_4' },
      { lesson: 40, type: 'MINI_TEST_5' },
      { lesson: 48, type: 'FINAL_EXAM' },
    ];

    let nextEval = evaluationSchedule[0];
    
    if (enrollment.evaluations.length > 0) {
      const lastEval = enrollment.evaluations[0];
      const nextIndex = evaluationSchedule.findIndex(e => e.lesson > lastEval.lessonNumber);
      
      if (nextIndex === -1) {
        return null; // All evaluations completed
      }
      
      nextEval = evaluationSchedule[nextIndex];
    }

    const canTakeResult = await this.canTakeEvaluation(enrollmentId);

    return {
      nextEvaluationType: nextEval.type,
      nextEvaluationLesson: nextEval.lesson,
      canTakeNow: canTakeResult.canTake,
      requirements: canTakeResult.requirements,
    };
  }

  static async calculateCourseCompletion(enrollmentId: string): Promise<{
    overallProgress: number; // 0-100%
    attendanceProgress: number;
    techniqueProgress: number;
    challengeProgress: number;
    evaluationProgress: number;
    estimatedCompletionDate: string;
  }> {
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: {
          include: {
            techniques: { where: { isRequired: true } },
          },
        },
        techniqueProgress: {
          where: {
            status: {
              in: [TechniqueProficiency.PROFICIENT, TechniqueProficiency.EXPERT, TechniqueProficiency.MASTERED],
            },
          },
        },
        challengeProgress: { where: { completed: true } },
        evaluations: { where: { passed: true } },
      },
    });

    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    // Calculate progress percentages
    const attendanceProgress = (enrollment.lessonsCompleted / enrollment.course.totalClasses) * 100;
    
    const techniqueProgress = enrollment.course.techniques.length > 0
      ? (enrollment.techniqueProgress.length / enrollment.course.techniques.length) * 100
      : 100;

    const totalChallenges = await prisma.courseChallenge.count({
      where: { courseId: enrollment.courseId },
    });
    const challengeProgress = totalChallenges > 0
      ? (enrollment.challengeProgress.length / totalChallenges) * 100
      : 100;

    const evaluationProgress = (enrollment.evaluations.length / 6) * 100; // 6 total evaluations

    // Weighted overall progress
    const overallProgress = (
      attendanceProgress * 0.4 +
      techniqueProgress * 0.3 +
      challengeProgress * 0.2 +
      evaluationProgress * 0.1
    );

    // Estimate completion date based on current pace
    const weeksElapsed = dayjs().diff(dayjs(enrollment.enrolledAt), 'weeks');
    const progressRate = overallProgress / Math.max(weeksElapsed, 1);
    const estimatedWeeksToComplete = Math.ceil((100 - overallProgress) / Math.max(progressRate, 1));
    const estimatedCompletionDate = dayjs().add(estimatedWeeksToComplete, 'weeks').format('YYYY-MM-DD');

    return {
      overallProgress: Math.round(overallProgress * 100) / 100,
      attendanceProgress: Math.round(attendanceProgress * 100) / 100,
      techniqueProgress: Math.round(techniqueProgress * 100) / 100,
      challengeProgress: Math.round(challengeProgress * 100) / 100,
      evaluationProgress: Math.round(evaluationProgress * 100) / 100,
      estimatedCompletionDate,
    };
  }
}