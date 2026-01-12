import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import { StudentCategory, AchievementCategory, ChallengeType, TechniqueProficiency } from '@/types';
import dayjs from 'dayjs';

// XP Configuration for check-ins
const CHECK_IN_XP_CONFIG = {
  BASE_XP: 50,
  TECHNIQUE_XP: 10,
  FIRST_OF_MONTH_BONUS: 25,
  STREAK_MULTIPLIERS: {
    7: 1.5,   // 7+ dias = +50%
    30: 2.0,  // 30+ dias = +100%
    60: 2.5,  // 60+ dias = +150%
    100: 3.0, // 100+ dias = +200%
  } as Record<number, number>,
};

export class GamificationService {
  // Level progression XP requirements
  private static readonly LEVEL_XP_REQUIREMENTS = [
    0,     // Level 1
    100,   // Level 2
    250,   // Level 3
    450,   // Level 4
    700,   // Level 5
    1000,  // Level 6
    1350,  // Level 7
    1750,  // Level 8
    2200,  // Level 9
    2700,  // Level 10
    3250,  // Level 11
    3850,  // Level 12
    4500,  // Level 13
    5200,  // Level 14
    5950,  // Level 15
    6750,  // Level 16
    7600,  // Level 17
    8500,  // Level 18
    9450,  // Level 19
    10450, // Level 20
  ];

  // XP multipliers based on student category
  private static readonly CATEGORY_XP_MULTIPLIERS = {
    ADULT: 1.0,
    MASTER_1: 1.1,  // 35+ years get 10% bonus
    MASTER_2: 1.2,  // 45+ years get 20% bonus
    MASTER_3: 1.3,  // 55+ years get 30% bonus
    HERO_1: 0.7,    // 6-9 years
    HERO_2: 0.8,    // 10-12 years
    HERO_3: 0.9,    // 13-15 years
  };

  static async awardXP(
    studentId: string,
    amount: number,
    type: 'ATTENDANCE' | 'TECHNIQUE' | 'CHALLENGE' | 'ACHIEVEMENT' | 'EVALUATION',
    source?: string,
    description?: string
  ): Promise<{
    newLevel: number;
    leveledUp: boolean;
    totalXP: number;
    xpAwarded: number;
    unlockedAchievements: string[];
  }> {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        totalXP: true,
        globalLevel: true,
        category: true,
        enrollments: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            currentXP: true,
            currentLevel: true,
            category: true,
          },
        },
      },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    // Apply category multiplier
    const multiplier = this.CATEGORY_XP_MULTIPLIERS[student.category as StudentCategory] || 1.0;
    const adjustedXP = Math.round(amount * multiplier);

    const oldLevel = student.globalLevel;
    const newTotalXP = student.totalXP + adjustedXP;
    const newLevel = this.calculateLevel(newTotalXP);
    const leveledUp = newLevel > oldLevel;

    // Update student's global XP and level
    await prisma.student.update({
      where: { id: studentId },
      data: {
        totalXP: newTotalXP,
        globalLevel: newLevel,
      },
    });

    // Update course-specific XP for active enrollments
    if (student.enrollments.length > 0) {
      const enrollment = student.enrollments[0]; // Most recent active enrollment
      const newCourseXP = enrollment.currentXP + adjustedXP;
      const newCourseLevel = this.calculateLevel(newCourseXP);

      await prisma.courseEnrollment.update({
        where: { id: enrollment.id },
        data: {
          currentXP: newCourseXP,
          currentLevel: newCourseLevel,
        },
      });
    }

    // Check for unlocked achievements
    const unlockedAchievements = await this.checkAchievements(studentId, {
      type,
      amount: adjustedXP,
      source,
      leveledUp,
      newLevel,
      newTotalXP,
    });

    logger.info(
      {
        studentId,
        type,
        xpAwarded: adjustedXP,
        newTotalXP,
        newLevel,
        leveledUp,
        unlockedAchievements: unlockedAchievements.length,
      },
      'XP awarded to student'
    );

    return {
      newLevel,
      leveledUp,
      totalXP: newTotalXP,
      xpAwarded: adjustedXP,
      unlockedAchievements,
    };
  }

  static calculateLevel(totalXP: number): number {
    for (let level = this.LEVEL_XP_REQUIREMENTS.length - 1; level >= 1; level--) {
      if (totalXP >= this.LEVEL_XP_REQUIREMENTS[level]) {
        return level + 1;
      }
    }
    return 1;
  }

  static getXPForNextLevel(currentXP: number): number {
    const currentLevel = this.calculateLevel(currentXP);
    if (currentLevel >= this.LEVEL_XP_REQUIREMENTS.length) {
      return 0; // Max level reached
    }
    return this.LEVEL_XP_REQUIREMENTS[currentLevel] - currentXP;
  }

  static getProgressToNextLevel(currentXP: number): number {
    const currentLevel = this.calculateLevel(currentXP);
    if (currentLevel >= this.LEVEL_XP_REQUIREMENTS.length) {
      return 100; // Max level reached
    }

    const currentLevelXP = this.LEVEL_XP_REQUIREMENTS[currentLevel - 1];
    const nextLevelXP = this.LEVEL_XP_REQUIREMENTS[currentLevel];
    const progress = ((currentXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;

    return Math.min(Math.max(progress, 0), 100);
  }

  static async checkAchievements(
    studentId: string,
    context: {
      type: string;
      amount: number;
      source?: string;
      leveledUp?: boolean;
      newLevel?: number;
      newTotalXP?: number;
    }
  ): Promise<string[]> {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        attendances: true,
        enrollments: {
          include: {
            techniqueProgress: true,
            challengeProgress: true,
            evaluations: { where: { passed: true } },
          },
        },
        achievements: {
          select: { achievementId: true },
        },
      },
    });

    if (!student) return [];

    const unlockedAchievements: string[] = [];
    const alreadyUnlocked = new Set(student.achievements.map(a => a.achievementId));

    // Get all available achievements for this organization
    const availableAchievements = await prisma.achievement.findMany({
      where: {
        organizationId: student.organizationId,
      },
    });

    for (const achievement of availableAchievements) {
      if (alreadyUnlocked.has(achievement.id)) continue;

      const criteria = achievement.criteria as any;
      let unlocked = false;

      switch (achievement.category) {
        case AchievementCategory.ATTENDANCE:
          unlocked = this.checkAttendanceAchievement(student, criteria);
          break;

        case AchievementCategory.TECHNIQUE:
          unlocked = this.checkTechniqueAchievement(student, criteria);
          break;

        case AchievementCategory.PROGRESSION:
          unlocked = this.checkProgressionAchievement(student, criteria, context);
          break;

        case AchievementCategory.CHALLENGE:
          unlocked = this.checkChallengeAchievement(student, criteria);
          break;

        case AchievementCategory.SOCIAL:
          unlocked = this.checkSocialAchievement(student, criteria);
          break;

        case AchievementCategory.SPECIAL:
          unlocked = this.checkSpecialAchievement(student, criteria, context);
          break;
      }

      if (unlocked) {
        // Unlock achievement
        await prisma.studentAchievement.create({
          data: {
            studentId,
            achievementId: achievement.id,
            unlockedAt: new Date(),
            progress: 100,
          },
        });

        // Award XP bonus if configured
        if (achievement.xpReward > 0) {
          await this.awardXP(studentId, achievement.xpReward, 'ACHIEVEMENT', achievement.id, `Achievement: ${achievement.name}`);
        }

        unlockedAchievements.push(achievement.id);

        logger.info(
          { studentId, achievementId: achievement.id, achievementName: achievement.name },
          'Achievement unlocked'
        );
      }
    }

    return unlockedAchievements;
  }

  private static checkAttendanceAchievement(student: any, criteria: any): boolean {
    const attendanceCount = student.attendances.length;

    switch (criteria.type) {
      case 'total_classes':
        return attendanceCount >= criteria.targetValue;
      case 'consecutive_days':
        return this.getConsecutiveAttendanceDays(student.attendances) >= criteria.targetValue;
      case 'monthly_attendance':
        const thisMonth = dayjs().startOf('month');
        const monthlyAttendance = student.attendances.filter((a: any) =>
          dayjs(a.checkInTime).isAfter(thisMonth)
        ).length;
        return monthlyAttendance >= criteria.targetValue;
      default:
        return false;
    }
  }

  private static checkTechniqueAchievement(student: any, criteria: any): boolean {
    const allTechniqueProgress = student.enrollments.flatMap((e: any) => e.techniqueProgress);

    switch (criteria.type) {
      case 'techniques_mastered':
        const masteredCount = allTechniqueProgress.filter((tp: any) =>
          tp.status === TechniqueProficiency.MASTERED
        ).length;
        return masteredCount >= criteria.targetValue;
      case 'category_mastery':
        // Count mastered techniques in specific category
        const categoryMastered = allTechniqueProgress.filter((tp: any) =>
          tp.technique?.category === criteria.category && tp.status === TechniqueProficiency.MASTERED
        ).length;
        return categoryMastered >= criteria.targetValue;
      default:
        return false;
    }
  }

  private static checkProgressionAchievement(student: any, criteria: any, context: any): boolean {
    switch (criteria.type) {
      case 'level_reached':
        return context.newLevel >= criteria.targetValue;
      case 'xp_earned':
        return context.newTotalXP >= criteria.targetValue;
      case 'course_completed':
        const completedCourses = student.enrollments.filter((e: any) => e.status === 'COMPLETED').length;
        return completedCourses >= criteria.targetValue;
      default:
        return false;
    }
  }

  private static checkChallengeAchievement(student: any, criteria: any): boolean {
    const allChallengeProgress = student.enrollments.flatMap((e: any) => e.challengeProgress);

    switch (criteria.type) {
      case 'challenges_completed':
        const completedCount = allChallengeProgress.filter((cp: any) => cp.completed).length;
        return completedCount >= criteria.targetValue;
      case 'perfect_week':
        // Check if student completed all challenges in any week
        const weeklyCompletions = this.groupChallengesByWeek(allChallengeProgress);
        return Object.values(weeklyCompletions).some((week: any) => week.completed === week.total);
      default:
        return false;
    }
  }

  private static checkSocialAchievement(student: any, criteria: any): boolean {
    // Social achievements would require additional data not available in current schema
    // For now, return false - could be implemented with referral system, social features, etc.
    return false;
  }

  private static checkSpecialAchievement(student: any, criteria: any, context: any): boolean {
    switch (criteria.type) {
      case 'first_class':
        return student.attendances.length === 1;
      case 'perfect_month':
        const thisMonth = dayjs().startOf('month');
        const daysInMonth = dayjs().daysInMonth();
        const monthlyAttendance = student.attendances.filter((a: any) =>
          dayjs(a.checkInTime).isAfter(thisMonth)
        ).length;
        // Perfect month = at least 20 days of attendance
        return monthlyAttendance >= Math.min(20, daysInMonth);
      case 'early_bird':
        // Check if student consistently arrives early
        const earlyArrivals = student.attendances.filter((a: any) => {
          const checkInTime = dayjs(a.checkInTime);
          const hour = checkInTime.hour();
          return hour < 8; // Before 8 AM
        }).length;
        return earlyArrivals >= criteria.targetValue;
      default:
        return false;
    }
  }

  private static getConsecutiveAttendanceDays(attendances: any[]): number {
    if (attendances.length === 0) return 0;

    const sortedDates = attendances
      .map(a => dayjs(a.checkInTime).format('YYYY-MM-DD'))
      .sort()
      .filter((date, index, arr) => arr.indexOf(date) === index); // Remove duplicates

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

  static async getStudentStats(studentId: string): Promise<{
    totalXP: number;
    globalLevel: number;
    progressToNextLevel: number;
    xpToNextLevel: number;
    currentStreak: number;
    longestStreak: number;
    achievementsCount: number;
    challengesCompleted: number;
    techniquesLearned: number;
    classesAttended: number;
  }> {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        attendances: {
          orderBy: { checkInTime: 'desc' },
        },
        achievements: true,
        enrollments: {
          include: {
            techniqueProgress: {
              where: {
                status: {
                  in: [TechniqueProficiency.PROFICIENT, TechniqueProficiency.EXPERT, TechniqueProficiency.MASTERED],
                },
              },
            },
            challengeProgress: {
              where: { completed: true },
            },
          },
        },
      },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    const progressToNextLevel = this.getProgressToNextLevel(student.totalXP);
    const xpToNextLevel = this.getXPForNextLevel(student.totalXP);
    const currentStreak = this.calculateCurrentStreak(student.attendances);
    const longestStreak = this.getConsecutiveAttendanceDays(student.attendances);
    const techniquesLearned = student.enrollments.reduce((sum, e) => sum + e.techniqueProgress.length, 0);
    const challengesCompleted = student.enrollments.reduce((sum, e) => sum + e.challengeProgress.length, 0);

    return {
      totalXP: student.totalXP,
      globalLevel: student.globalLevel,
      progressToNextLevel,
      xpToNextLevel,
      currentStreak,
      longestStreak,
      achievementsCount: student.achievements.length,
      challengesCompleted,
      techniquesLearned,
      classesAttended: student.attendances.length,
    };
  }

  private static calculateCurrentStreak(attendances: any[]): number {
    if (attendances.length === 0) return 0;

    const today = dayjs();
    let streak = 0;
    let currentDate = today;

    // Check if student attended today or yesterday (to allow for different class schedules)
    const recentAttendances = attendances
      .map(a => dayjs(a.checkInTime).format('YYYY-MM-DD'))
      .filter((date, index, arr) => arr.indexOf(date) === index) // Remove duplicates
      .sort((a, b) => dayjs(b).diff(dayjs(a))); // Sort descending

    if (recentAttendances.length === 0) return 0;

    const lastAttendance = dayjs(recentAttendances[0]);
    const daysSinceLastAttendance = today.diff(lastAttendance, 'days');

    // If last attendance was more than 2 days ago, streak is broken
    if (daysSinceLastAttendance > 2) return 0;

    // Count consecutive days working backwards
    for (let i = 0; i < recentAttendances.length; i++) {
      const attendanceDate = dayjs(recentAttendances[i]);
      const expectedDate = today.subtract(i, 'days');

      // Allow for 1 day gap (rest days)
      if (attendanceDate.isSame(expectedDate, 'day') || attendanceDate.isSame(expectedDate.subtract(1, 'day'), 'day')) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  static async createDefaultAchievements(organizationId: string): Promise<void> {
    const defaultAchievements = [
      // Attendance Achievements
      {
        name: 'Primeira Aula',
        description: 'Completou sua primeira aula',
        category: AchievementCategory.SPECIAL,
        criteria: { type: 'first_class', targetValue: 1 },
        xpReward: 50,
        rarity: 'COMMON' as const,
      },
      {
        name: 'Guerreiro Dedicado',
        description: 'Frequentou 10 aulas',
        category: AchievementCategory.ATTENDANCE,
        criteria: { type: 'total_classes', targetValue: 10 },
        xpReward: 100,
        rarity: 'COMMON' as const,
      },
      {
        name: 'Lutador Persistente',
        description: 'Frequentou 50 aulas',
        category: AchievementCategory.ATTENDANCE,
        criteria: { type: 'total_classes', targetValue: 50 },
        xpReward: 250,
        rarity: 'UNCOMMON' as const,
      },
      {
        name: 'Mestre da Consistência',
        description: 'Frequentou aulas por 7 dias consecutivos',
        category: AchievementCategory.ATTENDANCE,
        criteria: { type: 'consecutive_days', targetValue: 7 },
        xpReward: 150,
        rarity: 'UNCOMMON' as const,
      },

      // Technique Achievements
      {
        name: 'Primeiro Domínio',
        description: 'Dominou sua primeira técnica',
        category: AchievementCategory.TECHNIQUE,
        criteria: { type: 'techniques_mastered', targetValue: 1 },
        xpReward: 75,
        rarity: 'COMMON' as const,
      },
      {
        name: 'Técnico Avançado',
        description: 'Dominou 10 técnicas',
        category: AchievementCategory.TECHNIQUE,
        criteria: { type: 'techniques_mastered', targetValue: 10 },
        xpReward: 200,
        rarity: 'RARE' as const,
      },

      // Progression Achievements
      {
        name: 'Subindo de Nível',
        description: 'Alcançou o nível 5',
        category: AchievementCategory.PROGRESSION,
        criteria: { type: 'level_reached', targetValue: 5 },
        xpReward: 100,
        rarity: 'UNCOMMON' as const,
      },
      {
        name: 'Guerreiro Experiente',
        description: 'Alcançou o nível 10',
        category: AchievementCategory.PROGRESSION,
        criteria: { type: 'level_reached', targetValue: 10 },
        xpReward: 300,
        rarity: 'RARE' as const,
      },

      // Challenge Achievements
      {
        name: 'Desafiador',
        description: 'Completou 5 desafios',
        category: AchievementCategory.CHALLENGE,
        criteria: { type: 'challenges_completed', targetValue: 5 },
        xpReward: 125,
        rarity: 'COMMON' as const,
      },
      {
        name: 'Semana Perfeita',
        description: 'Completou todos os desafios de uma semana',
        category: AchievementCategory.CHALLENGE,
        criteria: { type: 'perfect_week' },
        xpReward: 200,
        rarity: 'RARE' as const,
      },
    ];

    for (const achievement of defaultAchievements) {
      await prisma.achievement.create({
        data: {
          ...achievement,
          organizationId,
        },
      });
    }

    logger.info({ organizationId }, 'Default achievements created');
  }

  // ============================================
  // PROCESSAMENTO DE CHECK-IN (AUTOMÁTICO)
  // ============================================

  /**
   * Processa gamificação após check-in - CHAMADO AUTOMATICAMENTE
   * Atualiza XP, streak, nível e verifica conquistas
   */
  static async processCheckIn(
    studentId: string,
    turmaLessonId: string,
    techniquesCount: number = 0
  ): Promise<{
    xpAwarded: number;
    streak: number;
    level: number;
    levelUp: boolean;
    newAchievements: string[];
  }> {
    try {
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        select: {
          totalXP: true,
          globalLevel: true,
          currentStreak: true,
          longestStreak: true,
          lastCheckinDate: true,
          category: true,
        },
      });

      if (!student) {
        logger.warn({ studentId }, 'Student not found for gamification');
        return { xpAwarded: 0, streak: 0, level: 1, levelUp: false, newAchievements: [] };
      }

      // 1. Calcular e atualizar streak
      const streakResult = await this.updateStudentStreak(studentId);

      // 2. Calcular XP base com multiplicador de streak
      const streakMultiplier = this.getStreakMultiplier(streakResult.newStreak);
      let totalXPToAward = Math.floor(CHECK_IN_XP_CONFIG.BASE_XP * streakMultiplier);

      // 3. Adicionar XP por técnicas praticadas
      totalXPToAward += techniquesCount * CHECK_IN_XP_CONFIG.TECHNIQUE_XP;

      // 4. Verificar bônus de primeira aula do mês
      const isFirstOfMonth = await this.isFirstCheckInOfMonth(studentId);
      if (isFirstOfMonth) {
        totalXPToAward += CHECK_IN_XP_CONFIG.FIRST_OF_MONTH_BONUS;
      }

      // 5. Conceder XP usando método existente
      const xpResult = await this.awardXP(
        studentId,
        totalXPToAward,
        'ATTENDANCE',
        turmaLessonId,
        `Check-in automático (streak: ${streakResult.newStreak})`
      );

      logger.info({
        studentId,
        turmaLessonId,
        xpAwarded: xpResult.xpAwarded,
        streak: streakResult.newStreak,
        level: xpResult.newLevel,
        levelUp: xpResult.leveledUp,
        achievementsUnlocked: xpResult.unlockedAchievements.length,
      }, 'Gamification processed for check-in');

      return {
        xpAwarded: xpResult.xpAwarded,
        streak: streakResult.newStreak,
        level: xpResult.newLevel,
        levelUp: xpResult.leveledUp,
        newAchievements: xpResult.unlockedAchievements,
      };
    } catch (error) {
      logger.error({ error, studentId, turmaLessonId }, 'Error processing gamification');
      // Não propagar erro para não quebrar o check-in
      return { xpAwarded: 0, streak: 0, level: 1, levelUp: false, newAchievements: [] };
    }
  }

  /**
   * Retorna o multiplicador de XP baseado no streak
   */
  private static getStreakMultiplier(streak: number): number {
    const thresholds = Object.keys(CHECK_IN_XP_CONFIG.STREAK_MULTIPLIERS)
      .map(Number)
      .sort((a, b) => b - a);

    for (const threshold of thresholds) {
      if (streak >= threshold) {
        return CHECK_IN_XP_CONFIG.STREAK_MULTIPLIERS[threshold];
      }
    }

    return 1.0;
  }

  /**
   * Atualiza o streak do aluno
   */
  private static async updateStudentStreak(studentId: string): Promise<{
    newStreak: number;
    longestStreak: number;
    streakBroken: boolean;
  }> {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        currentStreak: true,
        longestStreak: true,
        lastCheckinDate: true,
      },
    });

    if (!student) {
      return { newStreak: 1, longestStreak: 1, streakBroken: false };
    }

    const now = new Date();
    const today = dayjs().startOf('day');
    let newStreak = 1;
    let streakBroken = false;

    if (student.lastCheckinDate) {
      const lastCheckIn = dayjs(student.lastCheckinDate).startOf('day');
      const diffInDays = today.diff(lastCheckIn, 'day');

      if (diffInDays === 0) {
        // Mesmo dia - não incrementa (evita múltiplos check-ins)
        newStreak = student.currentStreak;
      } else if (diffInDays === 1) {
        // Dia seguinte - incrementa streak
        newStreak = student.currentStreak + 1;
      } else if (diffInDays <= 3) {
        // 2-3 dias - dá uma chance (pode ter sido fim de semana)
        newStreak = student.currentStreak + 1;
      } else {
        // Mais de 3 dias sem check-in - reseta streak
        newStreak = 1;
        streakBroken = true;
      }
    }

    const newLongestStreak = Math.max(newStreak, student.longestStreak);

    // Atualizar no banco
    await prisma.student.update({
      where: { id: studentId },
      data: {
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        lastCheckinDate: now,
      },
    });

    if (streakBroken) {
      logger.info({ studentId, previousStreak: student.currentStreak }, 'Student streak broken');
    }

    return {
      newStreak,
      longestStreak: newLongestStreak,
      streakBroken,
    };
  }

  /**
   * Verifica se é o primeiro check-in do mês
   */
  private static async isFirstCheckInOfMonth(studentId: string): Promise<boolean> {
    const startOfMonth = dayjs().startOf('month').toDate();

    const count = await prisma.turmaAttendance.count({
      where: {
        studentId,
        createdAt: { gte: startOfMonth },
      },
    });

    return count === 1; // 1 = esse check-in é o primeiro
  }

  // ============================================
  // BÔNUS DO PROFESSOR (OPCIONAL)
  // ============================================

  /**
   * Concede XP bônus manualmente (intervenção do professor)
   */
  static async grantInstructorBonus(
    studentId: string,
    amount: number,
    reason: string,
    grantedByUserId: string
  ): Promise<{ newTotalXP: number; newLevel: number }> {
    const result = await this.awardXP(
      studentId,
      amount,
      'ACHIEVEMENT', // Using ACHIEVEMENT type for bonuses
      `bonus_${grantedByUserId}`,
      `Bônus do instrutor: ${reason}`
    );

    logger.info({ studentId, amount, reason, grantedByUserId }, 'Instructor bonus XP granted');

    return { newTotalXP: result.totalXP, newLevel: result.newLevel };
  }

  // ============================================
  // LEADERBOARD
  // ============================================

  /**
   * Retorna o ranking de XP da organização
   */
  static async getLeaderboard(organizationId: string, limit: number = 10) {
    const students = await prisma.student.findMany({
      where: {
        organizationId,
        isActive: true,
      },
      orderBy: { totalXP: 'desc' },
      take: limit,
      select: {
        id: true,
        totalXP: true,
        globalLevel: true,
        currentStreak: true,
        user: {
          select: { firstName: true, lastName: true, avatarUrl: true },
        },
      },
    });

    return students.map((s, index) => ({
      rank: index + 1,
      studentId: s.id,
      name: `${s.user.firstName} ${s.user.lastName}`,
      avatarUrl: s.user.avatarUrl,
      totalXP: s.totalXP,
      level: s.globalLevel,
      streak: s.currentStreak,
    }));
  }

  /**
   * Retorna o perfil de gamificação do aluno
   */
  static async getGamificationProfile(studentId: string) {
    const stats = await this.getStudentStats(studentId);

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        user: { select: { firstName: true, lastName: true } },
        achievements: {
          include: { achievement: true },
          orderBy: { unlockedAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    // Buscar histórico de XP recente
    const recentTransactions = await prisma.pointsTransaction.findMany({
      where: { studentId },
      orderBy: { occurredAt: 'desc' },
      take: 10,
    });

    return {
      name: `${student.user.firstName} ${student.user.lastName}`,
      ...stats,
      recentAchievements: student.achievements.map(a => ({
        id: a.achievementId,
        name: a.achievement.name,
        description: a.achievement.description,
        rarity: a.achievement.rarity,
        badgeImageUrl: a.achievement.badgeImageUrl,
        unlockedAt: a.unlockedAt,
        xpReward: a.achievement.xpReward,
      })),
      recentXP: recentTransactions.map(t => ({
        amount: t.amount,
        source: t.source,
        occurredAt: t.occurredAt,
      })),
    };
  }
}
