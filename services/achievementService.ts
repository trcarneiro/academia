import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import { GamificationService } from '@/services/gamificationService';
import { AchievementCategory, AchievementRarity, TechniqueProficiency } from '@/types';
import dayjs from 'dayjs';

export interface AchievementCriteria {
  type: 'attendance' | 'technique' | 'progression' | 'social' | 'challenge' | 'streak' | 'evaluation' | 'custom';
  condition: string;
  targetValue?: number;
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'all_time';
  martialArtId?: string;
  courseId?: string;
  metadata?: Record<string, any>;
}

export interface CreateAchievementData {
  name: string;
  description: string;
  category: AchievementCategory;
  criteria: AchievementCriteria;
  xpReward: number;
  badgeImageUrl?: string;
  rarity: AchievementRarity;
  isHidden: boolean;
  martialArtId?: string;
}

export class AchievementService {
  static async createAchievement(organizationId: string, data: CreateAchievementData) {
    const achievement = await prisma.achievement.create({
      data: {
        organizationId,
        ...data,
        criteria: data.criteria as any,
      },
    });

    logger.info(
      { organizationId, achievementId: achievement.id, name: data.name },
      'Achievement created'
    );

    return achievement;
  }

  static async getOrganizationAchievements(
    organizationId: string,
    options: {
      category?: AchievementCategory;
      rarity?: AchievementRarity;
      isHidden?: boolean;
      martialArtId?: string;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const { page = 1, limit = 20, ...filters } = options;
    const skip = (page - 1) * limit;

    const where = {
      organizationId,
      ...filters,
    };

    const [achievements, total] = await Promise.all([
      prisma.achievement.findMany({
        where,
        orderBy: [
          { rarity: 'desc' },
          { xpReward: 'desc' },
          { name: 'asc' },
        ],
        skip,
        take: limit,
        include: {
          martialArt: {
            select: { id: true, name: true },
          },
          _count: {
            select: { studentAchievements: true },
          },
        },
      }),
      prisma.achievement.count({ where }),
    ]);

    return {
      achievements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  static async getStudentAchievements(
    studentId: string,
    options: {
      includeProgress?: boolean;
      category?: AchievementCategory;
      unlocked?: boolean;
    } = {}
  ) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { organizationId: true },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    // Get all achievements for the organization
    const allAchievements = await prisma.achievement.findMany({
      where: {
        organizationId: student.organizationId,
        ...(options.category && { category: options.category }),
        ...(options.unlocked !== undefined && options.unlocked === false && { isHidden: false }),
      },
      include: {
        martialArt: {
          select: { id: true, name: true },
        },
      },
    });

    // Get student's unlocked achievements
    const studentAchievements = await prisma.studentAchievement.findMany({
      where: { studentId },
      include: {
        achievement: true,
      },
    });

    const unlockedMap = new Map(
      studentAchievements.map(sa => [sa.achievementId, sa])
    );

    const result = await Promise.all(
      allAchievements.map(async (achievement) => {
        const unlocked = unlockedMap.get(achievement.id);
        let progress = 0;

        // Calculate progress for locked achievements if requested
        if (!unlocked && options.includeProgress) {
          progress = await this.calculateAchievementProgress(studentId, achievement.criteria as any);
        }

        return {
          ...achievement,
          isUnlocked: !!unlocked,
          unlockedAt: unlocked?.unlockedAt,
          progress: unlocked ? 100 : progress,
        };
      })
    );

    // Filter by unlocked status if specified
    if (options.unlocked !== undefined) {
      return result.filter(item => item.isUnlocked === options.unlocked);
    }

    return result;
  }

  static async calculateAchievementProgress(studentId: string, criteria: AchievementCriteria): Promise<number> {
    try {
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          attendances: true,
          enrollments: {
            include: {
              techniqueProgress: true,
              challengeProgress: true,
              evaluations: true,
            },
          },
        },
      });

      if (!student) return 0;

      const targetValue = criteria.targetValue || 1;
      let currentValue = 0;

      switch (criteria.type) {
        case 'attendance':
          currentValue = this.calculateAttendanceProgress(student, criteria);
          break;

        case 'technique':
          currentValue = this.calculateTechniqueProgress(student, criteria);
          break;

        case 'progression':
          currentValue = this.calculateProgressionProgress(student, criteria);
          break;

        case 'challenge':
          currentValue = this.calculateChallengeProgress(student, criteria);
          break;

        case 'streak':
          currentValue = this.calculateStreakProgress(student, criteria);
          break;

        case 'evaluation':
          currentValue = this.calculateEvaluationProgress(student, criteria);
          break;

        case 'social':
          currentValue = this.calculateSocialProgress(student, criteria);
          break;

        default:
          return 0;
      }

      return Math.min(Math.round((currentValue / targetValue) * 100), 100);
    } catch (error) {
      logger.warn({ error, studentId, criteria }, 'Failed to calculate achievement progress');
      return 0;
    }
  }

  private static calculateAttendanceProgress(student: any, criteria: AchievementCriteria): number {
    const attendances = this.filterByTimeframe(student.attendances, criteria.timeframe, 'checkInTime');

    switch (criteria.condition) {
      case 'total_classes':
        return attendances.length;

      case 'consecutive_days':
        return this.getConsecutiveAttendanceDays(student.attendances);

      case 'perfect_month':
        const thisMonth = dayjs().startOf('month');
        const monthlyAttendance = student.attendances.filter((a: any) => 
          dayjs(a.checkInTime).isAfter(thisMonth)
        ).length;
        const daysInMonth = dayjs().daysInMonth();
        const workingDays = Math.floor(daysInMonth * 0.7); // Assuming 70% are working days
        return Math.min(monthlyAttendance, workingDays);

      case 'early_bird':
        return student.attendances.filter((a: any) => {
          const hour = dayjs(a.checkInTime).hour();
          return hour < 8; // Before 8 AM
        }).length;

      default:
        return attendances.length;
    }
  }

  private static calculateTechniqueProgress(student: any, criteria: AchievementCriteria): number {
    const allTechniqueProgress = student.enrollments.flatMap((e: any) => e.techniqueProgress);

    switch (criteria.condition) {
      case 'techniques_mastered':
        return allTechniqueProgress.filter((tp: any) => 
          tp.status === TechniqueProficiency.MASTERED
        ).length;

      case 'category_mastery':
        return allTechniqueProgress.filter((tp: any) => 
          tp.technique?.category === criteria.metadata?.category && 
          tp.status === TechniqueProficiency.MASTERED
        ).length;

      case 'perfect_accuracy':
        return allTechniqueProgress.filter((tp: any) => 
          tp.accuracy === 100 && tp.attempts >= 3
        ).length;

      case 'technique_variety':
        const uniqueCategories = new Set(
          allTechniqueProgress
            .filter((tp: any) => tp.status === TechniqueProficiency.MASTERED)
            .map((tp: any) => tp.technique?.category)
        );
        return uniqueCategories.size;

      default:
        return allTechniqueProgress.filter((tp: any) => 
          tp.status === TechniqueProficiency.MASTERED
        ).length;
    }
  }

  private static calculateProgressionProgress(student: any, criteria: AchievementCriteria): number {
    switch (criteria.condition) {
      case 'level_reached':
        return student.globalLevel;

      case 'xp_earned':
        if (criteria.timeframe) {
          // Would need XP transaction history for timeframe filtering
          return student.totalXP;
        }
        return student.totalXP;

      case 'course_completed':
        return student.enrollments.filter((e: any) => e.status === 'COMPLETED').length;

      case 'multiple_arts':
        const uniqueArts = new Set(
          student.enrollments.map((e: any) => e.course?.martialArtId)
        );
        return uniqueArts.size;

      default:
        return student.globalLevel;
    }
  }

  private static calculateChallengeProgress(student: any, criteria: AchievementCriteria): number {
    const allChallengeProgress = student.enrollments.flatMap((e: any) => e.challengeProgress);
    const filteredProgress = this.filterByTimeframe(allChallengeProgress, criteria.timeframe, 'completedAt');

    switch (criteria.condition) {
      case 'challenges_completed':
        return filteredProgress.filter((cp: any) => cp.completed).length;

      case 'perfect_week':
        const weeklyCompletions = this.groupChallengesByWeek(allChallengeProgress);
        return Object.values(weeklyCompletions).filter((week: any) => 
          week.completed === week.total && week.total > 0
        ).length;

      case 'streak_challenges':
        return this.calculateChallengeStreak(allChallengeProgress);

      default:
        return filteredProgress.filter((cp: any) => cp.completed).length;
    }
  }

  private static calculateStreakProgress(student: any, criteria: AchievementCriteria): number {
    switch (criteria.condition) {
      case 'attendance_streak':
        return student.currentStreak || 0;

      case 'challenge_streak':
        const allChallengeProgress = student.enrollments.flatMap((e: any) => e.challengeProgress);
        return this.calculateChallengeStreak(allChallengeProgress);

      case 'login_streak':
        // Would need login history for this
        return 0;

      default:
        return student.currentStreak || 0;
    }
  }

  private static calculateEvaluationProgress(student: any, criteria: AchievementCriteria): number {
    const allEvaluations = student.enrollments.flatMap((e: any) => e.evaluations);
    const filteredEvaluations = this.filterByTimeframe(allEvaluations, criteria.timeframe, 'evaluatedAt');

    switch (criteria.condition) {
      case 'evaluations_passed':
        return filteredEvaluations.filter((e: any) => e.passed).length;

      case 'perfect_score':
        return filteredEvaluations.filter((e: any) => e.overallScore === 100).length;

      case 'high_scores':
        const minScore = criteria.metadata?.minScore || 90;
        return filteredEvaluations.filter((e: any) => e.overallScore >= minScore).length;

      case 'evaluation_streak':
        return this.calculateEvaluationStreak(allEvaluations);

      default:
        return filteredEvaluations.filter((e: any) => e.passed).length;
    }
  }

  private static calculateSocialProgress(student: any, criteria: AchievementCriteria): number {
    // Social achievements would require additional data (referrals, reviews, etc.)
    // For now, return 0 as these features aren't implemented yet
    return 0;
  }

  private static filterByTimeframe(items: any[], timeframe?: string, dateField: string = 'createdAt'): any[] {
    if (!timeframe || timeframe === 'all_time') return items;

    const now = dayjs();
    let startDate: dayjs.Dayjs;

    switch (timeframe) {
      case 'daily':
        startDate = now.startOf('day');
        break;
      case 'weekly':
        startDate = now.startOf('week');
        break;
      case 'monthly':
        startDate = now.startOf('month');
        break;
      case 'quarterly':
        startDate = now.startOf('quarter');
        break;
      case 'yearly':
        startDate = now.startOf('year');
        break;
      default:
        return items;
    }

    return items.filter((item: any) => 
      item[dateField] && dayjs(item[dateField]).isAfter(startDate)
    );
  }

  private static getConsecutiveAttendanceDays(attendances: any[]): number {
    if (attendances.length === 0) return 0;

    const sortedDates = attendances
      .map(a => dayjs(a.checkInTime).format('YYYY-MM-DD'))
      .sort()
      .filter((date, index, arr) => arr.indexOf(date) === index);

    let maxStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const currentDate = dayjs(sortedDates[i]);
      const previousDate = dayjs(sortedDates[i - 1]);
      
      if (currentDate.diff(previousDate, 'days') === 1) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }

    return maxStreak;
  }

  private static groupChallengesByWeek(challengeProgress: any[]): Record<string, { completed: number; total: number }> {
    const weeklyData: Record<string, { completed: number; total: number }> = {};

    challengeProgress.forEach(cp => {
      const week = dayjs(cp.createdAt).format('YYYY-[W]WW');
      if (!weeklyData[week]) {
        weeklyData[week] = { completed: 0, total: 0 };
      }
      weeklyData[week].total++;
      if (cp.completed) {
        weeklyData[week].completed++;
      }
    });

    return weeklyData;
  }

  private static calculateChallengeStreak(challengeProgress: any[]): number {
    const sortedProgress = challengeProgress
      .filter((cp: any) => cp.completed)
      .sort((a: any, b: any) => dayjs(b.completedAt).diff(dayjs(a.completedAt)));

    if (sortedProgress.length === 0) return 0;

    let streak = 1;
    for (let i = 1; i < sortedProgress.length; i++) {
      const currentWeek = dayjs(sortedProgress[i - 1].completedAt).week();
      const previousWeek = dayjs(sortedProgress[i].completedAt).week();
      
      if (currentWeek === previousWeek + 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  private static calculateEvaluationStreak(evaluations: any[]): number {
    const sortedEvaluations = evaluations
      .filter((e: any) => e.passed)
      .sort((a: any, b: any) => dayjs(b.evaluatedAt).diff(dayjs(a.evaluatedAt)));

    if (sortedEvaluations.length === 0) return 0;

    let streak = 1;
    for (let i = 1; i < sortedEvaluations.length; i++) {
      const current = dayjs(sortedEvaluations[i - 1].evaluatedAt);
      const previous = dayjs(sortedEvaluations[i].evaluatedAt);
      
      // Evaluations should be roughly 8 lessons apart
      const weeksDiff = current.diff(previous, 'weeks');
      if (weeksDiff >= 3 && weeksDiff <= 10) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  static async getAchievementLeaderboard(
    organizationId: string,
    options: {
      timeframe?: 'week' | 'month' | 'quarter' | 'year' | 'all';
      limit?: number;
      category?: string;
      martialArtId?: string;
    } = {}
  ) {
    const { timeframe = 'month', limit = 10 } = options;

    // Get time range
    let dateFilter = {};
    if (timeframe !== 'all') {
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
        case 'year':
          startDate = now.startOf('year');
          break;
      }

      dateFilter = {
        unlockedAt: {
          gte: startDate.toDate(),
        },
      };
    }

    const leaderboard = await prisma.student.findMany({
      where: {
        organizationId,
        isActive: true,
        ...(options.category && { category: options.category }),
      },
      select: {
        id: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        totalXP: true,
        globalLevel: true,
        category: true,
        achievements: {
          where: dateFilter,
          select: {
            unlockedAt: true,
            achievement: {
              select: {
                xpReward: true,
                rarity: true,
              },
            },
          },
        },
        enrollments: {
          where: {
            ...(options.martialArtId && {
              course: { martialArtId: options.martialArtId },
            }),
          },
          select: {
            currentXP: true,
            currentLevel: true,
          },
        },
      },
      orderBy: {
        totalXP: 'desc',
      },
      take: limit,
    });

    return leaderboard.map((student, index) => ({
      rank: index + 1,
      student: {
        id: student.id,
        name: `${student.user.firstName} ${student.user.lastName}`,
        avatarUrl: student.user.avatarUrl,
        category: student.category,
      },
      stats: {
        totalXP: student.totalXP,
        globalLevel: student.globalLevel,
        achievementsCount: student.achievements.length,
        recentXP: student.achievements.reduce((sum, a) => sum + a.achievement.xpReward, 0),
        courseXP: student.enrollments.reduce((sum, e) => sum + e.currentXP, 0),
      },
    }));
  }

  static async createDefaultAchievements(organizationId: string, martialArtId?: string): Promise<void> {
    const achievements: CreateAchievementData[] = [
      // Attendance Achievements
      {
        name: 'Primeira Aula',
        description: 'Completou sua primeira aula de treino',
        category: AchievementCategory.ATTENDANCE,
        criteria: {
          type: 'attendance',
          condition: 'total_classes',
          targetValue: 1,
          timeframe: 'all_time',
        },
        xpReward: 50,
        rarity: AchievementRarity.COMMON,
        isHidden: false,
        martialArtId,
      },
      {
        name: 'Guerreiro Dedicado',
        description: 'Frequentou 10 aulas de treino',
        category: AchievementCategory.ATTENDANCE,
        criteria: {
          type: 'attendance',
          condition: 'total_classes',
          targetValue: 10,
          timeframe: 'all_time',
        },
        xpReward: 100,
        rarity: AchievementRarity.COMMON,
        isHidden: false,
        martialArtId,
      },
      {
        name: 'Lutador Persistente',
        description: 'Frequentou 50 aulas de treino',
        category: AchievementCategory.ATTENDANCE,
        criteria: {
          type: 'attendance',
          condition: 'total_classes',
          targetValue: 50,
          timeframe: 'all_time',
        },
        xpReward: 250,
        rarity: AchievementRarity.UNCOMMON,
        isHidden: false,
        martialArtId,
      },
      {
        name: 'Mestre da Consistência',
        description: 'Frequentou aulas por 7 dias consecutivos',
        category: AchievementCategory.ATTENDANCE,
        criteria: {
          type: 'attendance',
          condition: 'consecutive_days',
          targetValue: 7,
          timeframe: 'all_time',
        },
        xpReward: 150,
        rarity: AchievementRarity.UNCOMMON,
        isHidden: false,
        martialArtId,
      },
      {
        name: 'Madrugador',
        description: 'Chegou cedo (antes das 8h) em 5 aulas',
        category: AchievementCategory.ATTENDANCE,
        criteria: {
          type: 'attendance',
          condition: 'early_bird',
          targetValue: 5,
          timeframe: 'all_time',
        },
        xpReward: 75,
        rarity: AchievementRarity.COMMON,
        isHidden: false,
        martialArtId,
      },

      // Technique Achievements
      {
        name: 'Primeiro Domínio',
        description: 'Dominou sua primeira técnica',
        category: AchievementCategory.TECHNIQUE,
        criteria: {
          type: 'technique',
          condition: 'techniques_mastered',
          targetValue: 1,
          timeframe: 'all_time',
        },
        xpReward: 75,
        rarity: AchievementRarity.COMMON,
        isHidden: false,
        martialArtId,
      },
      {
        name: 'Técnico Avançado',
        description: 'Dominou 10 técnicas diferentes',
        category: AchievementCategory.TECHNIQUE,
        criteria: {
          type: 'technique',
          condition: 'techniques_mastered',
          targetValue: 10,
          timeframe: 'all_time',
        },
        xpReward: 200,
        rarity: AchievementRarity.RARE,
        isHidden: false,
        martialArtId,
      },
      {
        name: 'Perfeccionista',
        description: 'Executou 3 técnicas com 100% de precisão',
        category: AchievementCategory.TECHNIQUE,
        criteria: {
          type: 'technique',
          condition: 'perfect_accuracy',
          targetValue: 3,
          timeframe: 'all_time',
        },
        xpReward: 150,
        rarity: AchievementRarity.RARE,
        isHidden: false,
        martialArtId,
      },
      {
        name: 'Especialista Versátil',
        description: 'Dominou técnicas de 4 categorias diferentes',
        category: AchievementCategory.TECHNIQUE,
        criteria: {
          type: 'technique',
          condition: 'technique_variety',
          targetValue: 4,
          timeframe: 'all_time',
        },
        xpReward: 300,
        rarity: AchievementRarity.EPIC,
        isHidden: false,
        martialArtId,
      },

      // Progression Achievements
      {
        name: 'Subindo de Nível',
        description: 'Alcançou o nível 5',
        category: AchievementCategory.PROGRESSION,
        criteria: {
          type: 'progression',
          condition: 'level_reached',
          targetValue: 5,
          timeframe: 'all_time',
        },
        xpReward: 100,
        rarity: AchievementRarity.UNCOMMON,
        isHidden: false,
        martialArtId,
      },
      {
        name: 'Guerreiro Experiente',
        description: 'Alcançou o nível 10',
        category: AchievementCategory.PROGRESSION,
        criteria: {
          type: 'progression',
          condition: 'level_reached',
          targetValue: 10,
          timeframe: 'all_time',
        },
        xpReward: 300,
        rarity: AchievementRarity.RARE,
        isHidden: false,
        martialArtId,
      },
      {
        name: 'Colecionador de XP',
        description: 'Acumulou 1000 pontos de experiência',
        category: AchievementCategory.PROGRESSION,
        criteria: {
          type: 'progression',
          condition: 'xp_earned',
          targetValue: 1000,
          timeframe: 'all_time',
        },
        xpReward: 200,
        rarity: AchievementRarity.UNCOMMON,
        isHidden: false,
        martialArtId,
      },

      // Challenge Achievements
      {
        name: 'Desafiador',
        description: 'Completou 5 desafios',
        category: AchievementCategory.CHALLENGE,
        criteria: {
          type: 'challenge',
          condition: 'challenges_completed',
          targetValue: 5,
          timeframe: 'all_time',
        },
        xpReward: 125,
        rarity: AchievementRarity.COMMON,
        isHidden: false,
        martialArtId,
      },
      {
        name: 'Semana Perfeita',
        description: 'Completou todos os desafios de uma semana',
        category: AchievementCategory.CHALLENGE,
        criteria: {
          type: 'challenge',
          condition: 'perfect_week',
          targetValue: 1,
          timeframe: 'all_time',
        },
        xpReward: 200,
        rarity: AchievementRarity.RARE,
        isHidden: false,
        martialArtId,
      },

      // Special Achievements
      {
        name: 'Mês Perfeito',
        description: 'Frequentou pelo menos 20 aulas em um mês',
        category: AchievementCategory.SPECIAL,
        criteria: {
          type: 'attendance',
          condition: 'perfect_month',
          targetValue: 20,
          timeframe: 'monthly',
        },
        xpReward: 500,
        rarity: AchievementRarity.LEGENDARY,
        isHidden: true,
        martialArtId,
      },
    ];

    for (const achievementData of achievements) {
      await this.createAchievement(organizationId, achievementData);
    }

    logger.info(
      { organizationId, count: achievements.length, martialArtId },
      'Default achievements created'
    );
  }
}