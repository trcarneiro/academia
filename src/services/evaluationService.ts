import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import { GamificationService } from '@/services/gamificationService';
import { ProgressionService } from '@/services/progressionService';
import { EvaluationType, TechniqueProficiency } from '@/types';
import dayjs from 'dayjs';

export interface TechniqueTested {
  techniqueId: string;
  accuracy: number;
  passed: boolean;
  notes?: string;
}

export interface PhysicalTest {
  type: string;
  completed: number;
  target: number;
  passed: boolean;
  timeInSeconds?: number;
  notes?: string;
}

export interface EvaluationData {
  enrollmentId: string;
  type: EvaluationType;
  lessonNumber: number;
  techniquesTested: TechniqueTested[];
  physicalTest?: PhysicalTest;
  overallScore: number;
  passed: boolean;
  instructorNotes?: string;
  videoUrl?: string;
  recommendedActions?: string[];
}

export interface EvaluationResult {
  id: string;
  passed: boolean;
  overallScore: number;
  xpAwarded: number;
  newAchievements: string[];
  nextEvaluation?: {
    type: string;
    lessonNumber: number;
    requirements: any;
  };
}

export class EvaluationService {
  // Krav Maga evaluation schedules and requirements
  private static readonly EVALUATION_SCHEDULES = {
    KRAV_MAGA: [
      {
        lessonNumber: 8,
        type: 'PROGRESS' as EvaluationType,
        name: 'Mini-Test 1',
        requiredTechniques: ['straight_punch', 'palm_strike', 'knee_strike'],
        physicalTests: [
          { type: '30 Straight Punches', target: 30, timeLimit: 60 },
          { type: '20 Knee Strikes', target: 20, timeLimit: 45 },
        ],
        passingScore: 70,
        xpReward: 100,
      },
      {
        lessonNumber: 16,
        type: 'PROGRESS' as EvaluationType,
        name: 'Mini-Test 2',
        requiredTechniques: ['elbow_strike', 'front_kick', 'guard_position'],
        physicalTests: [
          { type: '25 Elbow Strikes', target: 25, timeLimit: 60 },
          { type: '15 Front Kicks', target: 15, timeLimit: 45 },
        ],
        passingScore: 75,
        xpReward: 150,
      },
      {
        lessonNumber: 24,
        type: 'TECHNIQUE' as EvaluationType,
        name: 'Mini-Test 3',
        requiredTechniques: ['side_kick', 'roundhouse_kick', 'basic_defense'],
        physicalTests: [
          { type: '20 Side Kicks', target: 20, timeLimit: 60 },
          { type: '30 Defense Movements', target: 30, timeLimit: 90 },
        ],
        passingScore: 75,
        xpReward: 200,
      },
      {
        lessonNumber: 32,
        type: 'TECHNIQUE' as EvaluationType,
        name: 'Mini-Test 4',
        requiredTechniques: ['combination_strikes', 'advanced_defense', 'counter_attacks'],
        physicalTests: [
          { type: '3-Minute Continuous Movement', target: 180, timeLimit: 180 },
          { type: '40 Combination Strikes', target: 40, timeLimit: 120 },
        ],
        passingScore: 80,
        xpReward: 250,
      },
      {
        lessonNumber: 40,
        type: 'SPARRING' as EvaluationType,
        name: 'Mini-Test 5',
        requiredTechniques: ['sparring_techniques', 'situational_awareness', 'stress_responses'],
        physicalTests: [
          { type: '5-Minute Sparring Session', target: 300, timeLimit: 300 },
          { type: 'Stress Test Scenarios', target: 5, timeLimit: 600 },
        ],
        passingScore: 80,
        xpReward: 300,
      },
      {
        lessonNumber: 48,
        type: 'GRADING' as EvaluationType,
        name: 'Final Exam',
        requiredTechniques: ['all_basic_techniques', 'all_advanced_techniques', 'application_scenarios'],
        physicalTests: [
          { type: 'Complete Technique Demonstration', target: 20, timeLimit: 1200 },
          { type: 'Real-World Scenario Test', target: 3, timeLimit: 900 },
          { type: 'Physical Fitness Test', target: 100, timeLimit: 600 },
        ],
        passingScore: 85,
        xpReward: 500,
      },
    ],
  };

  static async createEvaluation(
    evaluationData: EvaluationData,
    instructorId: string
  ): Promise<EvaluationResult> {
    // Validate enrollment and check if student can take this evaluation
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: { id: evaluationData.enrollmentId },
      include: {
        student: true,
        course: { include: { martialArt: true } },
        evaluations: { orderBy: { evaluatedAt: 'desc' } },
      },
    });

    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    // Check if student meets requirements for this evaluation
    const canTakeEval = await ProgressionService.canTakeEvaluation(evaluationData.enrollmentId);
    if (!canTakeEval.canTake) {
      throw new Error(`Student cannot take evaluation: ${canTakeEval.reasons.join(', ')}`);
    }

    // Create evaluation record
    const evaluation = await prisma.evaluation.create({
      data: {
        enrollmentId: evaluationData.enrollmentId,
        type: evaluationData.type,
        lessonNumber: evaluationData.lessonNumber,
        techniqueseTested: evaluationData.techniquesTested,
        physicalTest: evaluationData.physicalTest,
        overallScore: evaluationData.overallScore,
        passed: evaluationData.passed,
        instructorNotes: evaluationData.instructorNotes,
        videoUrl: evaluationData.videoUrl,
        recommendedActions: evaluationData.recommendedActions || [],
        evaluatedBy: instructorId,
      },
    });

    // Update technique progress based on evaluation results
    for (const technique of evaluationData.techniquesTested) {
      await EvaluationService.updateTechniqueProgressFromEvaluation(
        evaluationData.enrollmentId,
        technique
      );
    }

    // Calculate XP reward based on performance
    const baseXP = EvaluationService.calculateBaseXP(evaluationData.type, evaluationData.lessonNumber);
    const performanceBonus = Math.floor((evaluationData.overallScore - 70) / 5) * 10; // 10 XP per 5% above 70%
    const passBonus = evaluationData.passed ? 50 : 0;
    const totalXP = Math.max(baseXP + performanceBonus + passBonus, 25);

    // Award XP
    const xpResult = await GamificationService.awardXP(
      enrollment.student.id,
      totalXP,
      'EVALUATION',
      evaluation.id,
      `Evaluation ${evaluationData.passed ? 'passed' : 'attempted'}: ${evaluationData.overallScore}%`
    );

    // Update enrollment progress
    await ProgressionService.updateEnrollmentProgress(evaluationData.enrollmentId);

    // Get next evaluation info
    const nextEvaluation = await ProgressionService.getNextEvaluation(evaluationData.enrollmentId);

    logger.info(
      {
        evaluationId: evaluation.id,
        studentId: enrollment.student.id,
        type: evaluationData.type,
        passed: evaluationData.passed,
        score: evaluationData.overallScore,
        xpAwarded: xpResult.xpAwarded,
      },
      'Evaluation completed'
    );

    return {
      id: evaluation.id,
      passed: evaluationData.passed,
      overallScore: evaluationData.overallScore,
      xpAwarded: xpResult.xpAwarded,
      newAchievements: xpResult.unlockedAchievements,
      nextEvaluation,
    };
  }

  static async getEvaluationHistory(
    enrollmentId: string,
    options: {
      type?: EvaluationType;
      passed?: boolean;
      limit?: number;
    } = {}
  ) {
    const { type, passed, limit = 10 } = options;

    const evaluations = await prisma.evaluation.findMany({
      where: {
        enrollmentId,
        ...(type && { type }),
        ...(passed !== undefined && { passed }),
      },
      orderBy: { evaluatedAt: 'desc' },
      take: limit,
      include: {
        enrollment: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
            course: {
              select: {
                name: true,
                level: true,
              },
            },
          },
        },
      },
    });

    return evaluations.map(evaluation => ({
      ...evaluation,
      studentName: `${evaluation.enrollment.student.user.firstName} ${evaluation.enrollment.student.user.lastName}`,
      courseName: evaluation.enrollment.course.name,
      courseLevel: evaluation.enrollment.course.level,
    }));
  }

  static async getEvaluationRequirements(
    enrollmentId: string,
    lessonNumber: number
  ): Promise<{
    canTake: boolean;
    requirements: any;
    suggestedTechniques: string[];
    physicalTests: any[];
    passingScore: number;
  }> {
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: { include: { martialArt: true } },
      },
    });

    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    // Find evaluation template for this lesson
    const evaluationTemplate = EvaluationService.EVALUATION_SCHEDULES.KRAV_MAGA.find(
      item => item.lessonNumber === lessonNumber
    );

    if (!evaluationTemplate) {
      throw new Error('No evaluation defined for this lesson number');
    }

    // Check if student can take this evaluation
    const canTakeResult = await ProgressionService.canTakeEvaluation(enrollmentId);

    return {
      canTake: canTakeResult.canTake,
      requirements: canTakeResult.requirements,
      suggestedTechniques: evaluationTemplate.requiredTechniques,
      physicalTests: evaluationTemplate.physicalTests,
      passingScore: evaluationTemplate.passingScore,
    };
  }

  static async generateEvaluationReport(
    evaluationId: string
  ): Promise<{
    evaluation: any;
    studentProfile: any;
    progressSummary: any;
    recommendations: string[];
    nextSteps: string[];
  }> {
    const evaluation = await prisma.evaluation.findUnique({
      where: { id: evaluationId },
      include: {
        enrollment: {
          include: {
            student: {
              include: {
                user: true,
              },
            },
            course: {
              include: { martialArt: true },
            },
            techniqueProgress: {
              include: { technique: true },
            },
            challengeProgress: {
              where: { completed: true },
            },
            evaluations: {
              orderBy: { evaluatedAt: 'desc' },
              take: 5,
            },
          },
        },
      },
    });

    if (!evaluation) {
      throw new Error('Evaluation not found');
    }

    const enrollment = evaluation.enrollment;
    const student = enrollment.student;

    // Calculate progress summary
    const totalTechniques = await prisma.courseTechnique.count({
      where: { courseId: enrollment.courseId, isRequired: true },
    });

    const masteredTechniques = enrollment.techniqueProgress.filter(
      tp => tp.status === TechniqueProficiency.MASTERED
    ).length;

    const progressSummary = {
      courseProgress: (enrollment.lessonsCompleted / enrollment.course.totalClasses) * 100,
      techniqueMastery: totalTechniques > 0 ? (masteredTechniques / totalTechniques) * 100 : 0,
      attendanceRate: enrollment.attendanceRate * 100,
      challengesCompleted: enrollment.challengeProgress.length,
      evaluationsPassed: enrollment.evaluations.filter(e => e.passed).length,
      currentLevel: enrollment.currentLevel,
      totalXP: enrollment.currentXP,
    };

    // Generate recommendations based on evaluation results
    const recommendations = EvaluationService.generateRecommendations(evaluation, progressSummary);
    const nextSteps = EvaluationService.generateNextSteps(evaluation, enrollment);

    return {
      evaluation: {
        ...evaluation,
        studentName: `${student.user.firstName} ${student.user.lastName}`,
        courseName: enrollment.course.name,
        martialArt: enrollment.course.martialArt.name,
      },
      studentProfile: {
        id: student.id,
        name: `${student.user.firstName} ${student.user.lastName}`,
        email: student.user.email,
        category: student.category,
        enrollmentDate: enrollment.enrolledAt,
        totalXP: student.totalXP,
        globalLevel: student.globalLevel,
      },
      progressSummary,
      recommendations,
      nextSteps,
    };
  }

  static async getEvaluationStatistics(
    organizationId: string,
    options: {
      courseId?: string;
      timeframe?: 'week' | 'month' | 'quarter' | 'year';
      type?: EvaluationType;
    } = {}
  ) {
    const { courseId, timeframe = 'month', type } = options;

    // Calculate date range
    let dateFilter = {};
    if (timeframe !== 'year') {
      const now = dayjs();
      let startDate: dayjs.Dayjs;

      switch (timeframe) {
        case 'week':
          startDate = now.startOf('week');
          break;
        case 'month':
          startDate = now.startOf('month');
          break;
        case 'quarter':
          startDate = now.startOf('quarter');
          break;
      }

      dateFilter = {
        evaluatedAt: {
          gte: startDate.toDate(),
        },
      };
    }

    const evaluations = await prisma.evaluation.findMany({
      where: {
        enrollment: {
          student: { organizationId },
          ...(courseId && { courseId }),
        },
        ...(type && { type }),
        ...dateFilter,
      },
      include: {
        enrollment: {
          include: {
            student: {
              include: { user: true },
            },
            course: true,
          },
        },
      },
    });

    const totalEvaluations = evaluations.length;
    const passedEvaluations = evaluations.filter(e => e.passed).length;
    const passRate = totalEvaluations > 0 ? (passedEvaluations / totalEvaluations) * 100 : 0;

    const avgScore = totalEvaluations > 0
      ? evaluations.reduce((sum, e) => sum + e.overallScore, 0) / totalEvaluations
      : 0;

    // Group by evaluation type
    const byType = evaluations.reduce((acc, eval) => {
      if (!acc[eval.type]) {
        acc[eval.type] = { total: 0, passed: 0, avgScore: 0 };
      }
      acc[eval.type].total++;
      if (eval.passed) acc[eval.type].passed++;
      acc[eval.type].avgScore += eval.overallScore;
      return acc;
    }, {} as Record<string, any>);

    // Calculate averages for each type
    Object.keys(byType).forEach(type => {
      byType[type].avgScore = byType[type].avgScore / byType[type].total;
      byType[type].passRate = (byType[type].passed / byType[type].total) * 100;
    });

    // Top performers
    const topPerformers = evaluations
      .filter(e => e.passed)
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, 10)
      .map(e => ({
        studentName: `${e.enrollment.student.user.firstName} ${e.enrollment.student.user.lastName}`,
        courseName: e.enrollment.course.name,
        type: e.type,
        score: e.overallScore,
        evaluatedAt: e.evaluatedAt,
      }));

    return {
      summary: {
        totalEvaluations,
        passedEvaluations,
        passRate: Math.round(passRate * 100) / 100,
        avgScore: Math.round(avgScore * 100) / 100,
      },
      byType,
      topPerformers,
      trends: {
        // Could add weekly/monthly trend calculations here
      },
    };
  }

  private static async updateTechniqueProgressFromEvaluation(
    enrollmentId: string,
    technique: TechniqueTested
  ): Promise<void> {
    const proficiencyLevel = EvaluationService.determineProficiencyFromAccuracy(technique.accuracy);

    await prisma.techniqueProgress.upsert({
      where: {
        enrollmentId_techniqueId: {
          enrollmentId,
          techniqueId: technique.techniqueId,
        },
      },
      update: {
        status: proficiencyLevel,
        accuracy: technique.accuracy,
        attempts: { increment: 1 },
        instructorValidated: true,
        instructorNotes: technique.notes,
        masteredAt: proficiencyLevel === TechniqueProficiency.MASTERED ? new Date() : undefined,
      },
      create: {
        enrollmentId,
        techniqueId: technique.techniqueId,
        status: proficiencyLevel,
        accuracy: technique.accuracy,
        attempts: 1,
        instructorValidated: true,
        instructorNotes: technique.notes,
        masteredAt: proficiencyLevel === TechniqueProficiency.MASTERED ? new Date() : undefined,
      },
    });
  }

  private static determineProficiencyFromAccuracy(accuracy: number): TechniqueProficiency {
    if (accuracy >= 95) return TechniqueProficiency.MASTERED;
    if (accuracy >= 85) return TechniqueProficiency.EXPERT;
    if (accuracy >= 75) return TechniqueProficiency.PROFICIENT;
    if (accuracy >= 65) return TechniqueProficiency.COMPETENT;
    if (accuracy >= 50) return TechniqueProficiency.PRACTICING;
    return TechniqueProficiency.LEARNING;
  }

  private static calculateBaseXP(type: EvaluationType, lessonNumber: number): number {
    const baseXPByType = {
      PROGRESS: 75,
      TECHNIQUE: 100,
      SPARRING: 125,
      FITNESS: 50,
      KNOWLEDGE: 50,
      GRADING: 200,
    };

    const lessonMultiplier = Math.floor(lessonNumber / 8) + 1; // Increases every 8 lessons
    return baseXPByType[type] * lessonMultiplier;
  }

  private static generateRecommendations(evaluation: any, progressSummary: any): string[] {
    const recommendations: string[] = [];

    if (evaluation.overallScore < 70) {
      recommendations.push('Foque em revisar as técnicas básicas antes da próxima avaliação');
    }

    if (progressSummary.attendanceRate < 80) {
      recommendations.push('Melhore a frequência às aulas para acelerar o progresso');
    }

    if (progressSummary.techniqueMastery < 60) {
      recommendations.push('Dedique mais tempo ao treinamento técnico individual');
    }

    if (evaluation.physicalTest && !evaluation.physicalTest.passed) {
      recommendations.push('Intensifique o treinamento físico e condicionamento');
    }

    const failedTechniques = evaluation.techniqueseTested.filter((t: any) => !t.passed);
    if (failedTechniques.length > 0) {
      recommendations.push(`Pratique especificamente: ${failedTechniques.map((t: any) => t.techniqueName || 'técnica específica').join(', ')}`);
    }

    if (progressSummary.challengesCompleted < 3) {
      recommendations.push('Participe mais ativamente dos desafios semanais');
    }

    return recommendations;
  }

  private static generateNextSteps(evaluation: any, enrollment: any): string[] {
    const nextSteps: string[] = [];

    if (evaluation.passed) {
      nextSteps.push('Parabéns! Continue progredindo para a próxima etapa do curso');

      if (evaluation.lessonNumber < 48) {
        nextSteps.push('Prepare-se para as técnicas da próxima fase');
      } else {
        nextSteps.push('Considere matricular-se no próximo nível ou curso especializado');
      }
    } else {
      nextSteps.push('Agende uma sessão de reforço com o instrutor');
      nextSteps.push('Revise o material das últimas aulas');
      nextSteps.push('Reagende a avaliação quando se sentir preparado');
    }

    // Add specific recommendations based on course progress
    const progressPercent = (enrollment.lessonsCompleted / enrollment.course.totalClasses) * 100;

    if (progressPercent < 25) {
      nextSteps.push('Foque no domínio das técnicas fundamentais');
    } else if (progressPercent < 50) {
      nextSteps.push('Comece a praticar combinações de técnicas');
    } else if (progressPercent < 75) {
      nextSteps.push('Prepare-se para aplicações mais avançadas');
    } else {
      nextSteps.push('Refine todas as técnicas para o exame final');
    }

    return nextSteps;
  }
}