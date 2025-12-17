// @ts-nocheck
import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import { GamificationService } from '@/services/gamificationService';
import { ProgressionService } from '@/services/progressionService';
import { ChallengeType, StudentCategory } from '@/types';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';

dayjs.extend(weekOfYear);

export interface WeeklyChallengeTemplate {
  week: number;
  type: ChallengeType;
  baseActivity: string;
  baseMetric: number;
  baseTime?: number;
  description?: string;
  xpReward: number;
}

export interface ChallengeProgress {
  challengeId: string;
  studentId: string;
  attempted: boolean;
  completed: boolean;
  actualMetric?: number;
  actualTime?: number;
  progress: number;
  adjustedTarget: number;
  timeRemaining: number;
}

export class ChallengeService {
  // Krav Maga weekly challenge templates for 24-week course
  private static readonly KRAV_MAGA_CHALLENGES: WeeklyChallengeTemplate[] = [
    // Weeks 1-6: Foundation Building
    { week: 1, type: 'FITNESS', baseActivity: '30 Push-ups', baseMetric: 30, xpReward: 15, description: 'Complete 30 push-ups to build upper body strength' },
    { week: 2, type: 'TECHNIQUE', baseActivity: '50 Straight Punches', baseMetric: 50, baseTime: 120, xpReward: 20, description: 'Execute 50 straight punches in 2 minutes' },
    { week: 3, type: 'FITNESS', baseActivity: '2-minute Plank Hold', baseMetric: 120, xpReward: 25, description: 'Hold a plank position for 2 minutes' },
    { week: 4, type: 'TECHNIQUE', baseActivity: '100 Knee Strikes', baseMetric: 100, baseTime: 180, xpReward: 20, description: 'Execute 100 knee strikes in 3 minutes' },
    { week: 5, type: 'FITNESS', baseActivity: '50 Burpees', baseMetric: 50, baseTime: 300, xpReward: 30, description: 'Complete 50 burpees in 5 minutes' },
    { week: 6, type: 'ATTENDANCE', baseActivity: '5 Classes This Week', baseMetric: 5, xpReward: 35, description: 'Attend 5 classes this week' },

    // Weeks 7-12: Skill Development
    { week: 7, type: 'TECHNIQUE', baseActivity: '200 Palm Strikes', baseMetric: 200, baseTime: 300, xpReward: 25, description: 'Execute 200 palm strikes in 5 minutes' },
    { week: 8, type: 'FITNESS', baseActivity: '100 Mountain Climbers', baseMetric: 100, baseTime: 180, xpReward: 20, description: 'Complete 100 mountain climbers in 3 minutes' },
    { week: 9, type: 'TECHNIQUE', baseActivity: '150 Elbow Strikes', baseMetric: 150, baseTime: 240, xpReward: 25, description: 'Execute 150 elbow strikes in 4 minutes' },
    { week: 10, type: 'FITNESS', baseActivity: '3-minute Wall Sit', baseMetric: 180, xpReward: 30, description: 'Hold a wall sit for 3 minutes' },
    { week: 11, type: 'TECHNIQUE', baseActivity: '75 Front Kicks', baseMetric: 75, baseTime: 300, xpReward: 25, description: 'Execute 75 front kicks in 5 minutes' },
    { week: 12, type: 'STREAK', baseActivity: '6-day Training Streak', baseMetric: 6, xpReward: 40, description: 'Train for 6 consecutive days' },

    // Weeks 13-18: Combat Applications
    { week: 13, type: 'TECHNIQUE', baseActivity: '100 Hammer Fists', baseMetric: 100, baseTime: 180, xpReward: 25, description: 'Execute 100 hammer fist strikes in 3 minutes' },
    { week: 14, type: 'FITNESS', baseActivity: '200 Jump Squats', baseMetric: 200, baseTime: 360, xpReward: 35, description: 'Complete 200 jump squats in 6 minutes' },
    { week: 15, type: 'TECHNIQUE', baseActivity: '50 Side Kicks', baseMetric: 50, baseTime: 240, xpReward: 30, description: 'Execute 50 side kicks in 4 minutes' },
    { week: 16, type: 'FITNESS', baseActivity: '500m Sprint', baseMetric: 500, baseTime: 150, xpReward: 35, description: 'Run 500 meters in under 2:30 minutes' },
    { week: 17, type: 'TECHNIQUE', baseActivity: '100 Roundhouse Kicks', baseMetric: 100, baseTime: 360, xpReward: 30, description: 'Execute 100 roundhouse kicks in 6 minutes' },
    { week: 18, type: 'ATTENDANCE', baseActivity: '100% Weekly Attendance', baseMetric: 100, xpReward: 50, description: 'Attend all scheduled classes this week' },

    // Weeks 19-24: Advanced Conditioning
    { week: 19, type: 'FITNESS', baseActivity: '300 Sit-ups', baseMetric: 300, baseTime: 600, xpReward: 40, description: 'Complete 300 sit-ups in 10 minutes' },
    { week: 20, type: 'TECHNIQUE', baseActivity: '200 Uppercuts', baseMetric: 200, baseTime: 300, xpReward: 35, description: 'Execute 200 uppercuts in 5 minutes' },
    { week: 21, type: 'FITNESS', baseActivity: '5-minute Cardio Circuit', baseMetric: 300, baseTime: 300, xpReward: 45, description: 'Complete 300 seconds of high-intensity cardio' },
    { week: 22, type: 'TECHNIQUE', baseActivity: '150 Hook Punches', baseMetric: 150, baseTime: 240, xpReward: 35, description: 'Execute 150 hook punches in 4 minutes' },
    { week: 23, type: 'FITNESS', baseActivity: '100 Pull-ups/Assisted', baseMetric: 100, baseTime: 600, xpReward: 50, description: 'Complete 100 pull-ups (assisted allowed) in 10 minutes' },
    { week: 24, type: 'CUSTOM', baseActivity: 'Master Challenge', baseMetric: 1, xpReward: 100, description: 'Complete the final master challenge designed by your instructor' },
  ];

  static async createWeeklyChallengesForCourse(courseId: string): Promise<void> {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { martialArt: true },
    });

    if (!course) {
      throw new Error('Course not found');
    }

    // Use Krav Maga challenges as template (can be extended for other martial arts)
    const challenges = this.KRAV_MAGA_CHALLENGES.slice(0, Math.min(course.duration, 24));

    for (const challengeTemplate of challenges) {
      try {
        await prisma.courseChallenge.create({
          data: {
            courseId,
            weekNumber: challengeTemplate.week,
            type: challengeTemplate.type,
            baseActivity: challengeTemplate.baseActivity,
            baseMetric: challengeTemplate.baseMetric,
            baseTime: challengeTemplate.baseTime,
            description: challengeTemplate.description,
            xpReward: challengeTemplate.xpReward,
          },
        });
      } catch (error) {
        // Skip if challenge already exists for this week
        if (error instanceof Error && error.message.includes('Unique constraint')) {
          continue;
        }
        throw error;
      }
    }

    logger.info(
      { courseId, challengeCount: challenges.length },
      'Weekly challenges created for course'
    );
  }

  static async getCurrentWeekChallenges(courseId: string): Promise<any[]> {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { createdAt: true, duration: true },
    });

    if (!course) {
      throw new Error('Course not found');
    }

    // Calculate current week of the course
    const courseStartWeek = dayjs(course.createdAt).week();
    const currentWeek = dayjs().week();
    const courseWeek = Math.max(1, Math.min(currentWeek - courseStartWeek + 1, course.duration));

    const challenges = await prisma.courseChallenge.findMany({
      where: {
        courseId,
        weekNumber: courseWeek,
      },
      orderBy: { createdAt: 'asc' },
    });

    return challenges;
  }

  static async getStudentChallengeProgress(
    studentId: string,
    options: {
      courseId?: string;
      weekNumber?: number;
      completed?: boolean;
      timeframe?: 'current' | 'all';
    } = {}
  ): Promise<ChallengeProgress[]> {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        enrollments: {
          where: {
            status: 'ACTIVE',
            ...(options.courseId && { courseId: options.courseId }),
          },
          include: {
            course: true,
            challengeProgress: {
              include: {
                challenge: true,
              },
              where: {
                ...(options.completed !== undefined && { completed: options.completed }),
                ...(options.weekNumber && { challenge: { weekNumber: options.weekNumber } }),
              },
            },
          },
        },
      },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    const allProgress: ChallengeProgress[] = [];

    for (const enrollment of student.enrollments) {
      for (const challengeProgress of enrollment.challengeProgress) {
        const challenge = challengeProgress.challenge;
        
        // Calculate adjusted target based on student category
        const adjustedTarget = ProgressionService.calculateAdjustedMetrics(
          enrollment,
          challenge.baseMetric
        );

        // Calculate progress percentage
        let progress = 0;
        if (challengeProgress.actualMetric !== null && challenge.baseMetric > 0) {
          progress = Math.min((challengeProgress.actualMetric / adjustedTarget) * 100, 100);
        }

        // Calculate time remaining for the challenge
        const challengeEndDate = dayjs(enrollment.enrolledAt)
          .add(challenge.weekNumber, 'weeks')
          .endOf('week');
        const timeRemaining = Math.max(0, challengeEndDate.diff(dayjs(), 'hours'));

        allProgress.push({
          challengeId: challenge.id,
          studentId,
          attempted: challengeProgress.attempted,
          completed: challengeProgress.completed,
          actualMetric: challengeProgress.actualMetric || undefined,
          actualTime: challengeProgress.actualTime || undefined,
          progress,
          adjustedTarget,
          timeRemaining,
        });
      }
    }

    return allProgress;
  }

  static async submitChallengeAttempt(
    enrollmentId: string,
    challengeId: string,
    data: {
      actualMetric?: number;
      actualTime?: number;
      videoUrl?: string;
      imageUrl?: string;
      notes?: string;
    }
  ): Promise<{
    success: boolean;
    completed: boolean;
    xpAwarded: number;
    newAchievements: string[];
  }> {
    const [enrollment, challenge] = await Promise.all([
      prisma.courseEnrollment.findUnique({
        where: { id: enrollmentId },
        include: { student: true },
      }),
      prisma.courseChallenge.findUnique({
        where: { id: challengeId },
      }),
    ]);

    if (!enrollment || !challenge) {
      throw new Error('Enrollment or challenge not found');
    }

    // Calculate if challenge is completed
    const adjustedMetric = ProgressionService.calculateAdjustedMetrics(
      enrollment,
      challenge.baseMetric
    );

    let completed = false;
    if (data.actualMetric !== undefined) {
      completed = data.actualMetric >= adjustedMetric;
    }

    if (data.actualTime !== undefined && challenge.baseTime) {
      const adjustedTime = ProgressionService.calculateAdjustedMetrics(
        enrollment,
        challenge.baseTime
      );
      completed = completed && data.actualTime <= adjustedTime;
    }

    // Update or create challenge progress
    const challengeProgress = await prisma.challengeProgress.upsert({
      where: {
        enrollmentId_challengeId: {
          enrollmentId,
          challengeId,
        },
      },
      update: {
        attempted: true,
        completed,
        actualMetric: data.actualMetric,
        actualTime: data.actualTime,
        videoUrl: data.videoUrl,
        imageUrl: data.imageUrl,
        completedAt: completed ? new Date() : undefined,
        xpEarned: completed ? challenge.xpReward : 0,
      },
      create: {
        enrollmentId,
        challengeId,
        attempted: true,
        completed,
        actualMetric: data.actualMetric,
        actualTime: data.actualTime,
        videoUrl: data.videoUrl,
        imageUrl: data.imageUrl,
        completedAt: completed ? new Date() : undefined,
        xpEarned: completed ? challenge.xpReward : 0,
      },
    });

    let xpAwarded = 0;
    let newAchievements: string[] = [];

    // Award XP and check achievements if challenge was completed for the first time
    if (completed && challengeProgress.xpEarned > 0) {
      const xpResult = await GamificationService.awardXP(
        enrollment.student.id,
        challenge.xpReward,
        'CHALLENGE',
        challengeId,
        `Completed challenge: ${challenge.baseActivity}`
      );

      xpAwarded = xpResult.xpAwarded;
      newAchievements = xpResult.unlockedAchievements;
    }

    logger.info(
      {
        studentId: enrollment.student.id,
        challengeId,
        completed,
        actualMetric: data.actualMetric,
        actualTime: data.actualTime,
        xpAwarded,
      },
      'Challenge attempt submitted'
    );

    return {
      success: true,
      completed,
      xpAwarded,
      newAchievements,
    };
  }

  static async validateChallengeSubmission(
    challengeProgressId: string,
    instructorId: string,
    validation: {
      approved: boolean;
      notes?: string;
      adjustedMetric?: number;
      adjustedTime?: number;
    }
  ): Promise<void> {
    const challengeProgress = await prisma.challengeProgress.findUnique({
      where: { id: challengeProgressId },
      include: {
        challenge: true,
        enrollment: { include: { student: true } },
      },
    });

    if (!challengeProgress) {
      throw new Error('Challenge progress not found');
    }

    await prisma.challengeProgress.update({
      where: { id: challengeProgressId },
      data: {
        instructorValidated: true,
        validatedBy: instructorId,
        validatedAt: new Date(),
        instructorNotes: validation.notes,
        ...(validation.adjustedMetric && { actualMetric: validation.adjustedMetric }),
        ...(validation.adjustedTime && { actualTime: validation.adjustedTime }),
        completed: validation.approved,
      },
    });

    // If instructor approved and student hadn't completed before, award XP
    if (validation.approved && !challengeProgress.completed) {
      await GamificationService.awardXP(
        challengeProgress.enrollment.student.id,
        challengeProgress.challenge.xpReward,
        'CHALLENGE',
        challengeProgress.challengeId,
        `Challenge validated by instructor: ${challengeProgress.challenge.baseActivity}`
      );
    }

    logger.info(
      {
        challengeProgressId,
        instructorId,
        approved: validation.approved,
        studentId: challengeProgress.enrollment.student.id,
      },
      'Challenge submission validated'
    );
  }

  static async getChallengeLeaderboard(
    challengeId: string,
    options: {
      limit?: number;
      metric?: 'performance' | 'completion_time';
    } = {}
  ): Promise<any[]> {
    const { limit = 10, metric = 'performance' } = options;

    const challenge = await prisma.courseChallenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      throw new Error('Challenge not found');
    }

    const progressRecords = await prisma.challengeProgress.findMany({
      where: {
        challengeId,
        completed: true,
      },
      include: {
        enrollment: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: metric === 'performance' 
        ? { actualMetric: 'desc' }
        : { actualTime: 'asc' },
      take: limit,
    });

    return progressRecords.map((progress, index) => ({
      rank: index + 1,
      student: {
        id: progress.enrollment.student.id,
        name: `${progress.enrollment.student.user.firstName} ${progress.enrollment.student.user.lastName}`,
        avatarUrl: progress.enrollment.student.user.avatarUrl,
        category: progress.enrollment.category,
      },
      performance: {
        actualMetric: progress.actualMetric,
        actualTime: progress.actualTime,
        completedAt: progress.completedAt,
        adjustedTarget: ProgressionService.calculateAdjustedMetrics(
          progress.enrollment,
          challenge.baseMetric
        ),
      },
    }));
  }

  static async getWeeklyChallengeStats(
    organizationId: string,
    weekNumber?: number
  ): Promise<{
    totalChallenges: number;
    activeParticipants: number;
    completionRate: number;
    avgPerformance: number;
    topPerformers: any[];
  }> {
    const whereClause = weekNumber 
      ? { challenge: { weekNumber } }
      : {};

    const [totalChallenges, progressRecords] = await Promise.all([
      prisma.courseChallenge.count({
        where: {
          course: { organizationId },
          ...(weekNumber && { weekNumber }),
        },
      }),
      prisma.challengeProgress.findMany({
        where: {
          ...whereClause,
          enrollment: {
            student: { organizationId },
          },
        },
        include: {
          challenge: true,
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
            },
          },
        },
      }),
    ]);

    const activeParticipants = new Set(progressRecords.map(p => p.enrollment.studentId)).size;
    const completedChallenges = progressRecords.filter(p => p.completed).length;
    const completionRate = progressRecords.length > 0 
      ? (completedChallenges / progressRecords.length) * 100 
      : 0;

    // Calculate average performance (percentage of target achieved)
    let totalPerformance = 0;
    let performanceCount = 0;

    progressRecords.forEach(progress => {
      if (progress.actualMetric && progress.challenge.baseMetric > 0) {
        const adjustedTarget = ProgressionService.calculateAdjustedMetrics(
          progress.enrollment,
          progress.challenge.baseMetric
        );
        const performance = Math.min((progress.actualMetric / adjustedTarget) * 100, 100);
        totalPerformance += performance;
        performanceCount++;
      }
    });

    const avgPerformance = performanceCount > 0 ? totalPerformance / performanceCount : 0;

    // Get top performers
    const topPerformers = progressRecords
      .filter(p => p.completed)
      .sort((a, b) => (b.actualMetric || 0) - (a.actualMetric || 0))
      .slice(0, 5)
      .map(p => ({
        studentName: `${p.enrollment.student.user.firstName} ${p.enrollment.student.user.lastName}`,
        challengeName: p.challenge.baseActivity,
        performance: p.actualMetric,
        completedAt: p.completedAt,
      }));

    return {
      totalChallenges,
      activeParticipants,
      completionRate: Math.round(completionRate * 100) / 100,
      avgPerformance: Math.round(avgPerformance * 100) / 100,
      topPerformers,
    };
  }
}