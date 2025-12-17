import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { UserRole } from '@/types';
import { checkTenantAccess, addTenantFilter } from '@/middlewares/tenant';
import { ProgressionService } from '@/services/progressionService';
import { GamificationService } from '@/services/gamificationService';
import { AchievementService } from '@/services/achievementService';
import { ChallengeService } from '@/services/challengeService';
import { prisma } from '@/utils/database';
import { ResponseHelper } from '@/utils/response';
import { logger } from '@/utils/logger';
import { StudentCategory } from '@prisma/client';

// Validation schemas
const CourseEnrollmentSchema = z.object({
  studentId: z.string().uuid(),
  courseId: z.string().uuid(),
  category: z.enum(['ADULT', 'MASTER_1', 'MASTER_2', 'MASTER_3', 'HERO_1', 'HERO_2', 'HERO_3']),
  gender: z.enum(['M', 'F']),
  expectedEndDate: z.string().datetime().optional(),
});

const TechniqueProgressSchema = z.object({
  enrollmentId: z.string().uuid(),
  techniqueId: z.string().uuid(),
  status: z.enum(['LEARNING', 'PRACTICING', 'COMPETENT', 'PROFICIENT', 'EXPERT', 'MASTERED']).optional(),
  accuracy: z.number().min(0).max(100).optional(),
  videoUrl: z.string().url().optional(),
  instructorNotes: z.string().optional(),
});

const ChallengeProgressSchema = z.object({
  enrollmentId: z.string().uuid(),
  challengeId: z.string().uuid(),
  actualMetric: z.number().int().min(0).optional(),
  actualTime: z.number().int().min(0).optional(),
  videoUrl: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
});

const EvaluationSchema = z.object({
  enrollmentId: z.string().uuid(),
  type: z.enum(['GRADING', 'PROGRESS', 'TECHNIQUE', 'SPARRING', 'FITNESS', 'KNOWLEDGE']),
  lessonNumber: z.number().int().min(1).max(48),
  techniquesTested: z.array(z.object({
    techniqueId: z.string().uuid(),
    accuracy: z.number().min(0).max(100),
    passed: z.boolean(),
  })),
  physicalTest: z.object({
    type: z.string(),
    completed: z.number().int().min(0),
    target: z.number().int().min(0),
    passed: z.boolean(),
  }).optional(),
  overallScore: z.number().min(0).max(100),
  passed: z.boolean(),
  instructorNotes: z.string().optional(),
  videoUrl: z.string().url().optional(),
  recommendedActions: z.array(z.string()).optional(),
});

const CreateCourseSchema = z.object({
  martialArtId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT', 'MASTER']),
  duration: z.number().int().min(1).max(52),
  classesPerWeek: z.number().int().min(1).max(7).default(2),
  minAge: z.number().int().min(3).max(100).default(16),
  maxAge: z.number().int().min(3).max(100).optional(),
  category: z.enum(['ADULT', 'MASTER_1', 'MASTER_2', 'MASTER_3', 'HERO_1', 'HERO_2', 'HERO_3']).default('ADULT'),
  prerequisites: z.array(z.string()).default([]),
  objectives: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  imageUrl: z.string().url().optional(),
});

const CreateChallengeSchema = z.object({
  courseId: z.string().uuid(),
  weekNumber: z.number().int().min(1).max(24),
  type: z.enum(['ATTENDANCE', 'TECHNIQUE', 'STREAK', 'SOCIAL', 'FITNESS', 'CUSTOM']),
  baseActivity: z.string().min(1).max(255),
  baseMetric: z.number().int().min(1),
  baseTime: z.number().int().min(1).optional(),
  description: z.string().optional(),
  xpReward: z.number().int().min(1).default(15),
});

export const pedagogicalRoutes = async (fastify: FastifyInstance) => {
  // Course Enrollment Routes
  fastify.post('/enrollments', {
    preHandler: [checkTenantAccess([UserRole.ADMIN, UserRole.MANAGER, UserRole.INSTRUCTOR])],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = CourseEnrollmentSchema.parse(request.body);
        const organizationId = request.tenant!.organizationId;

        // Validate student and course belong to organization
        const [student, course] = await Promise.all([
          prisma.student.findFirst({
            where: addTenantFilter({ id: body.studentId }, organizationId),
          }),
          prisma.course.findFirst({
            where: addTenantFilter({ id: body.courseId }, organizationId),
          }),
        ]);

        if (!student) {
          return ResponseHelper.error(reply, 'Student not found', 404);
        }

        if (!course) {
          return ResponseHelper.error(reply, 'Course not found', 404);
        }

        // Check if already enrolled
        const existingEnrollment = await prisma.courseEnrollment.findFirst({
          where: {
            studentId: body.studentId,
            courseId: body.courseId,
            status: { in: ['ACTIVE', 'COMPLETED'] },
          },
        });

        if (existingEnrollment) {
          return ResponseHelper.error(reply, 'Student already enrolled in this course', 400);
        }

        // Calculate expected end date if not provided
        const expectedEndDate = body.expectedEndDate 
          ? new Date(body.expectedEndDate)
          : new Date(Date.now() + (course.duration * 7 * 24 * 60 * 60 * 1000));

        const enrollment = await prisma.courseEnrollment.create({
          data: {
            studentId: body.studentId,
            courseId: body.courseId,
            category: body.category,
            gender: body.gender,
            expectedEndDate,
            status: 'ACTIVE',
          },
          include: {
            student: {
              select: {
                id: true,
                user: { select: { firstName: true, lastName: true } },
              },
            },
            course: {
              select: {
                id: true,
                name: true,
                level: true,
                duration: true,
              },
            },
          },
        });

        // Award enrollment XP
        await GamificationService.awardXP(
          body.studentId,
          50,
          'ACHIEVEMENT',
          course.id,
          `Enrolled in ${course.name}`
        );

        logger.info(
          { studentId: body.studentId, courseId: body.courseId, enrollmentId: enrollment.id },
          'Student enrolled in course'
        );

        return ResponseHelper.success(reply, enrollment);
      } catch (error) {
        logger.error({ error }, 'Failed to create enrollment');
        return ResponseHelper.error(reply, 'Failed to create enrollment', 500);
      }
    },
  });

  fastify.get('/enrollments/:enrollmentId', {
    preHandler: [checkTenantAccess([UserRole.ADMIN, UserRole.MANAGER, UserRole.INSTRUCTOR, UserRole.STUDENT])],
    handler: async (request: FastifyRequest<{ Params: { enrollmentId: string } }>, reply: FastifyReply) => {
      try {
        const { enrollmentId } = request.params;
        const organizationId = request.tenant!.organizationId;

        const enrollment = await prisma.courseEnrollment.findFirst({
          where: {
            id: enrollmentId,
            student: { organizationId },
          },
          include: {
            student: {
              select: {
                id: true,
                user: { select: { firstName: true, lastName: true, email: true } },
                category: true,
                totalXP: true,
                globalLevel: true,
              },
            },
            course: {
              select: {
                id: true,
                name: true,
                description: true,
                level: true,
                duration: true,
                totalClasses: true,
                objectives: true,
                requirements: true,
              },
            },
            techniqueProgress: {
              include: {
                technique: {
                  select: {
                    id: true,
                    name: true,
                    category: true,
                    difficulty: true,
                  },
                },
              },
            },
            challengeProgress: {
              include: {
                challenge: {
                  select: {
                    id: true,
                    baseActivity: true,
                    baseMetric: true,
                    baseTime: true,
                    weekNumber: true,
                    type: true,
                  },
                },
              },
            },
            evaluations: {
              orderBy: { evaluatedAt: 'desc' },
              take: 5,
            },
          },
        });

        if (!enrollment) {
          return ResponseHelper.error(reply, 'Enrollment not found', 404);
        }

        return ResponseHelper.success(reply, enrollment);
      } catch (error) {
        logger.error({ error }, 'Failed to fetch enrollment');
        return ResponseHelper.error(reply, 'Failed to fetch enrollment', 500);
      }
    },
  });

  fastify.get('/enrollments/:enrollmentId/progress', {
    preHandler: [checkTenantAccess([UserRole.ADMIN, UserRole.MANAGER, UserRole.INSTRUCTOR, UserRole.STUDENT])],
    handler: async (request: FastifyRequest<{ Params: { enrollmentId: string } }>, reply: FastifyReply) => {
      try {
        const { enrollmentId } = request.params;

        const [canTakeEval, dropoutRisk, recommendations, courseCompletion] = await Promise.all([
          ProgressionService.canTakeEvaluation(enrollmentId),
          ProgressionService.calculateDropoutRisk(enrollmentId),
          ProgressionService.getPersonalizedRecommendations(enrollmentId),
          ProgressionService.calculateCourseCompletion(enrollmentId),
        ]);

        return ResponseHelper.success(reply, {
          evaluation: canTakeEval,
          dropoutRisk,
          recommendations,
          completion: courseCompletion,
        });
      } catch (error) {
        logger.error({ error, enrollmentId: request.params.enrollmentId }, 'Failed to fetch enrollment progress');
        return ResponseHelper.error(reply, 'Failed to fetch enrollment progress', 500);
      }
    },
  });

  // Technique Progress Routes
  fastify.post('/technique-progress', {
    preHandler: [checkTenantAccess([UserRole.ADMIN, UserRole.MANAGER, UserRole.INSTRUCTOR])],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = TechniqueProgressSchema.parse(request.body);
        const organizationId = request.tenant!.organizationId;

        // Validate enrollment belongs to organization
        const enrollment = await prisma.courseEnrollment.findFirst({
          where: {
            id: body.enrollmentId,
            student: { organizationId },
          },
          include: { student: true },
        });

        if (!enrollment) {
          return ResponseHelper.error(reply, 'Enrollment not found', 404);
        }

        // Check if technique progress already exists
        const existingProgress = await prisma.techniqueProgress.findFirst({
          where: {
            enrollmentId: body.enrollmentId,
            techniqueId: body.techniqueId,
          },
        });

        let techniqueProgress;

        if (existingProgress) {
          // Update existing progress
          techniqueProgress = await prisma.techniqueProgress.update({
            where: { id: existingProgress.id },
            data: {
              status: body.status || existingProgress.status,
              accuracy: body.accuracy,
              attempts: { increment: 1 },
              practiceCount: { increment: 1 },
              videoUrl: body.videoUrl,
              instructorNotes: body.instructorNotes,
              instructorValidated: !!body.instructorNotes,
              validatedBy: body.instructorNotes ? request.user!.id : undefined,
              validatedAt: body.instructorNotes ? new Date() : undefined,
              masteredAt: body.status === 'MASTERED' ? new Date() : existingProgress.masteredAt,
            },
            include: {
              technique: true,
            },
          });
        } else {
          // Create new progress
          techniqueProgress = await prisma.techniqueProgress.create({
            data: {
              enrollmentId: body.enrollmentId,
              techniqueId: body.techniqueId,
              status: body.status || 'LEARNING',
              accuracy: body.accuracy,
              attempts: 1,
              practiceCount: 1,
              videoUrl: body.videoUrl,
              instructorNotes: body.instructorNotes,
              instructorValidated: !!body.instructorNotes,
              validatedBy: body.instructorNotes ? request.user!.id : undefined,
              validatedAt: body.instructorNotes ? new Date() : undefined,
              masteredAt: body.status === 'MASTERED' ? new Date() : undefined,
            },
            include: {
              technique: true,
            },
          });
        }

        // Award XP for technique progress
        if (body.status === 'MASTERED' && !existingProgress?.masteredAt) {
          await GamificationService.awardXP(
            enrollment.student.id,
            techniqueProgress.technique.masteryXP,
            'TECHNIQUE',
            body.techniqueId,
            `Mastered ${techniqueProgress.technique.name}`
          );
        } else if (body.status && body.status !== existingProgress?.status) {
          await GamificationService.awardXP(
            enrollment.student.id,
            techniqueProgress.technique.baseXP,
            'TECHNIQUE',
            body.techniqueId,
            `Progress in ${techniqueProgress.technique.name}`
          );
        }

        // Update enrollment progress
        await ProgressionService.updateEnrollmentProgress(body.enrollmentId);

        return ResponseHelper.success(reply, techniqueProgress);
      } catch (error) {
        logger.error({ error }, 'Failed to update technique progress');
        return ResponseHelper.error(reply, 'Failed to update technique progress', 500);
      }
    },
  });

  // Challenge Progress Routes
  fastify.post('/challenge-progress', {
    preHandler: [checkTenantAccess([UserRole.ADMIN, UserRole.MANAGER, UserRole.INSTRUCTOR, UserRole.STUDENT])],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = ChallengeProgressSchema.parse(request.body);
        const organizationId = request.tenant!.organizationId;

        // Validate enrollment and challenge
        const [enrollment, challenge] = await Promise.all([
          prisma.courseEnrollment.findFirst({
            where: {
              id: body.enrollmentId,
              student: { organizationId },
            },
            include: { student: true },
          }),
          prisma.courseChallenge.findFirst({
            where: { id: body.challengeId },
          }),
        ]);

        if (!enrollment || !challenge) {
          return ResponseHelper.error(reply, 'Enrollment or challenge not found', 404);
        }

        // Calculate if challenge is completed
        let completed = false;
        if (body.actualMetric !== undefined) {
          const adjustedMetric = ProgressionService.calculateAdjustedMetrics(enrollment, challenge.baseMetric);
          completed = body.actualMetric >= adjustedMetric;
        }

        if (body.actualTime !== undefined && challenge.baseTime) {
          const adjustedTime = ProgressionService.calculateAdjustedMetrics(enrollment, challenge.baseTime);
          completed = completed && body.actualTime <= adjustedTime;
        }

        // Check if progress already exists
        const existingProgress = await prisma.challengeProgress.findFirst({
          where: {
            enrollmentId: body.enrollmentId,
            challengeId: body.challengeId,
          },
        });

        let challengeProgress;

        if (existingProgress) {
          challengeProgress = await prisma.challengeProgress.update({
            where: { id: existingProgress.id },
            data: {
              attempted: true,
              completed,
              actualMetric: body.actualMetric,
              actualTime: body.actualTime,
              videoUrl: body.videoUrl,
              imageUrl: body.imageUrl,
              completedAt: completed ? new Date() : undefined,
              xpEarned: completed && !existingProgress.completed ? challenge.xpReward : existingProgress.xpEarned,
            },
          });
        } else {
          challengeProgress = await prisma.challengeProgress.create({
            data: {
              enrollmentId: body.enrollmentId,
              challengeId: body.challengeId,
              attempted: true,
              completed,
              actualMetric: body.actualMetric,
              actualTime: body.actualTime,
              videoUrl: body.videoUrl,
              imageUrl: body.imageUrl,
              completedAt: completed ? new Date() : undefined,
              xpEarned: completed ? challenge.xpReward : 0,
            },
          });
        }

        // Award XP if challenge was completed for the first time
        if (completed && !existingProgress?.completed) {
          await GamificationService.awardXP(
            enrollment.student.id,
            challenge.xpReward,
            'CHALLENGE',
            body.challengeId,
            `Completed challenge: ${challenge.baseActivity}`
          );
        }

        return ResponseHelper.success(reply, challengeProgress);
      } catch (error) {
        logger.error({ error }, 'Failed to update challenge progress');
        return ResponseHelper.error(reply, 'Failed to update challenge progress', 500);
      }
    },
  });

  // Evaluation Routes
  fastify.post('/evaluations', {
    preHandler: [checkTenantAccess([UserRole.ADMIN, UserRole.MANAGER, UserRole.INSTRUCTOR])],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = EvaluationSchema.parse(request.body);
        const organizationId = request.tenant!.organizationId;

        // Validate enrollment
        const enrollment = await prisma.courseEnrollment.findFirst({
          where: {
            id: body.enrollmentId,
            student: { organizationId },
          },
          include: { student: true },
        });

        if (!enrollment) {
          return ResponseHelper.error(reply, 'Enrollment not found', 404);
        }

        // Check if student can take this evaluation
        const canTakeEval = await ProgressionService.canTakeEvaluation(body.enrollmentId);
        if (!canTakeEval.canTake) {
          return ResponseHelper.error(reply, `Cannot take evaluation: ${canTakeEval.reasons.join(', ')}`, 400);
        }

        const evaluation = await prisma.evaluation.create({
          data: {
            enrollmentId: body.enrollmentId,
            type: body.type,
            lessonNumber: body.lessonNumber,
            techniqueseTested: body.techniquesTested,
            physicalTest: body.physicalTest,
            overallScore: body.overallScore,
            passed: body.passed,
            instructorNotes: body.instructorNotes,
            videoUrl: body.videoUrl,
            recommendedActions: body.recommendedActions || [],
            evaluatedBy: request.user!.id,
          },
        });

        // Award XP based on evaluation performance
        const baseXP = body.passed ? 100 : 25;
        const bonusXP = Math.floor((body.overallScore - 70) / 10) * 25; // Bonus for scores above 70
        const totalXP = Math.max(baseXP + bonusXP, 25);

        await GamificationService.awardXP(
          enrollment.student.id,
          totalXP,
          'EVALUATION',
          evaluation.id,
          `Evaluation ${body.passed ? 'passed' : 'attempted'}: ${body.overallScore}%`
        );

        // Update enrollment progress
        await ProgressionService.updateEnrollmentProgress(body.enrollmentId);

        return ResponseHelper.success(reply, evaluation);
      } catch (error) {
        logger.error({ error }, 'Failed to create evaluation');
        return ResponseHelper.error(reply, 'Failed to create evaluation', 500);
      }
    },
  });

  // Course Management Routes (Admin only)
  fastify.post('/courses', {
    preHandler: [checkTenantAccess([UserRole.ADMIN, UserRole.MANAGER])],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = CreateCourseSchema.parse(request.body);
        const organizationId = request.tenant!.organizationId;

        // Calculate total classes
        const totalClasses = body.duration * body.classesPerWeek;

        const course = await prisma.course.create({
          data: {
            ...body,
            organizationId,
            totalClasses,
          },
          include: {
            martialArt: true,
          },
        });

        return ResponseHelper.success(reply, course);
      } catch (error) {
        logger.error({ error }, 'Failed to create course');
        return ResponseHelper.error(reply, 'Failed to create course', 500);
      }
    },
  });

  fastify.post('/courses/:courseId/challenges', {
    preHandler: [checkTenantAccess([UserRole.ADMIN, UserRole.MANAGER, UserRole.INSTRUCTOR])],
    handler: async (request: FastifyRequest<{ Params: { courseId: string } }>, reply: FastifyReply) => {
      try {
        const body = CreateChallengeSchema.parse(request.body);
        const { courseId } = request.params;
        const organizationId = request.tenant!.organizationId;

        // Validate course belongs to organization
        const course = await prisma.course.findFirst({
          where: addTenantFilter({ id: courseId }, organizationId),
        });

        if (!course) {
          return ResponseHelper.error(reply, 'Course not found', 404);
        }

        // Check if challenge already exists for this week
        const existingChallenge = await prisma.courseChallenge.findFirst({
          where: {
            courseId,
            weekNumber: body.weekNumber,
          },
        });

        if (existingChallenge) {
          return ResponseHelper.error(reply, 'Challenge already exists for this week', 400);
        }

        const challenge = await prisma.courseChallenge.create({
          data: {
            ...body,
            courseId,
          },
        });

        return ResponseHelper.success(reply, challenge);
      } catch (error) {
        logger.error({ error }, 'Failed to create course challenge');
        return ResponseHelper.error(reply, 'Failed to create course challenge', 500);
      }
    },
  });

  // Student Stats Route
  fastify.get('/students/:studentId/stats', {
    preHandler: [checkTenantAccess([UserRole.ADMIN, UserRole.MANAGER, UserRole.INSTRUCTOR, UserRole.STUDENT])],
    handler: async (request: FastifyRequest<{ Params: { studentId: string } }>, reply: FastifyReply) => {
      try {
        const { studentId } = request.params;
        const organizationId = request.tenant!.organizationId;

        // Validate student belongs to organization
        const student = await prisma.student.findFirst({
          where: addTenantFilter({ id: studentId }, organizationId),
        });

        if (!student) {
          return ResponseHelper.error(reply, 'Student not found', 404);
        }

        const stats = await GamificationService.getStudentStats(studentId);

        return ResponseHelper.success(reply, stats);
      } catch (error) {
        logger.error({ error }, 'Failed to fetch student stats');
        return ResponseHelper.error(reply, 'Failed to fetch student stats', 500);
      }
    },
  });

  // Achievement Routes
  fastify.get('/achievements', {
    preHandler: [checkTenantAccess([UserRole.ADMIN, UserRole.MANAGER, UserRole.INSTRUCTOR, UserRole.STUDENT])],
    handler: async (request: FastifyRequest<{ 
      Querystring: { 
        category?: string; 
        rarity?: string; 
        isHidden?: boolean; 
        martialArtId?: string;
        page?: number;
        limit?: number;
      } 
    }>, reply: FastifyReply) => {
      try {
        const organizationId = request.tenant!.organizationId;
        const options = request.query;

        const result = await AchievementService.getOrganizationAchievements(organizationId, options);

        return ResponseHelper.success(reply, result);
      } catch (error) {
        logger.error({ error }, 'Failed to fetch achievements');
        return ResponseHelper.error(reply, 'Failed to fetch achievements', 500);
      }
    },
  });

  fastify.get('/students/:studentId/achievements', {
    preHandler: [checkTenantAccess([UserRole.ADMIN, UserRole.MANAGER, UserRole.INSTRUCTOR, UserRole.STUDENT])],
    handler: async (request: FastifyRequest<{ 
      Params: { studentId: string };
      Querystring: { 
        includeProgress?: boolean; 
        category?: string; 
        unlocked?: boolean;
      };
    }>, reply: FastifyReply) => {
      try {
        const { studentId } = request.params;
        const organizationId = request.tenant!.organizationId;

        // Validate student belongs to organization
        const student = await prisma.student.findFirst({
          where: addTenantFilter({ id: studentId }, organizationId),
        });

        if (!student) {
          return ResponseHelper.error(reply, 'Student not found', 404);
        }

        const achievements = await AchievementService.getStudentAchievements(studentId, request.query);

        return ResponseHelper.success(reply, achievements);
      } catch (error) {
        logger.error({ error }, 'Failed to fetch student achievements');
        return ResponseHelper.error(reply, 'Failed to fetch student achievements', 500);
      }
    },
  });

  fastify.get('/leaderboard', {
    preHandler: [checkTenantAccess([UserRole.ADMIN, UserRole.MANAGER, UserRole.INSTRUCTOR, UserRole.STUDENT])],
    handler: async (request: FastifyRequest<{ 
      Querystring: { 
        timeframe?: 'week' | 'month' | 'quarter' | 'year' | 'all';
        limit?: number;
        category?: string;
        martialArtId?: string;
      };
    }>, reply: FastifyReply) => {
      try {
        const organizationId = request.tenant!.organizationId;
        const leaderboard = await AchievementService.getAchievementLeaderboard(organizationId, request.query);

        return ResponseHelper.success(reply, leaderboard);
      } catch (error) {
        logger.error({ error }, 'Failed to fetch leaderboard');
        return ResponseHelper.error(reply, 'Failed to fetch leaderboard', 500);
      }
    },
  });

  // Admin-only Achievement Management
  fastify.post('/achievements', {
    preHandler: [checkTenantAccess([UserRole.ADMIN, UserRole.MANAGER])],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const organizationId = request.tenant!.organizationId;
        
        // Validation would be done here with the schemas
        const achievementData = request.body as any;
        
        const achievement = await AchievementService.createAchievement(organizationId, achievementData);

        return ResponseHelper.success(reply, achievement);
      } catch (error) {
        logger.error({ error }, 'Failed to create achievement');
        return ResponseHelper.error(reply, 'Failed to create achievement', 500);
      }
    },
  });

  fastify.post('/achievements/defaults', {
    preHandler: [checkTenantAccess([UserRole.ADMIN])],
    handler: async (request: FastifyRequest<{ 
      Body: { martialArtId?: string };
    }>, reply: FastifyReply) => {
      try {
        const organizationId = request.tenant!.organizationId;
        const { martialArtId } = request.body || {};

        await AchievementService.createDefaultAchievements(organizationId, martialArtId);

        return ResponseHelper.success(reply, { message: 'Default achievements created successfully' });
      } catch (error) {
        logger.error({ error }, 'Failed to create default achievements');
        return ResponseHelper.error(reply, 'Failed to create default achievements', 500);
      }
    },
  });

  // Weekly Challenges Routes
  fastify.get('/courses/:courseId/challenges/current', {
    preHandler: [checkTenantAccess([UserRole.ADMIN, UserRole.MANAGER, UserRole.INSTRUCTOR, UserRole.STUDENT])],
    handler: async (request: FastifyRequest<{ Params: { courseId: string } }>, reply: FastifyReply) => {
      try {
        const { courseId } = request.params;
        const organizationId = request.tenant!.organizationId;

        // Validate course belongs to organization
        const course = await prisma.course.findFirst({
          where: addTenantFilter({ id: courseId }, organizationId),
        });

        if (!course) {
          return ResponseHelper.error(reply, 'Course not found', 404);
        }

        const challenges = await ChallengeService.getCurrentWeekChallenges(courseId);

        return ResponseHelper.success(reply, challenges);
      } catch (error) {
        logger.error({ error }, 'Failed to fetch current week challenges');
        return ResponseHelper.error(reply, 'Failed to fetch current week challenges', 500);
      }
    },
  });

  fastify.get('/students/:studentId/challenges', {
    preHandler: [checkTenantAccess([UserRole.ADMIN, UserRole.MANAGER, UserRole.INSTRUCTOR, UserRole.STUDENT])],
    handler: async (request: FastifyRequest<{ 
      Params: { studentId: string };
      Querystring: { 
        courseId?: string;
        weekNumber?: number;
        completed?: boolean;
        timeframe?: 'current' | 'all';
      };
    }>, reply: FastifyReply) => {
      try {
        const { studentId } = request.params;
        const organizationId = request.tenant!.organizationId;

        // Validate student belongs to organization
        const student = await prisma.student.findFirst({
          where: addTenantFilter({ id: studentId }, organizationId),
        });

        if (!student) {
          return ResponseHelper.error(reply, 'Student not found', 404);
        }

        const progress = await ChallengeService.getStudentChallengeProgress(studentId, request.query);

        return ResponseHelper.success(reply, progress);
      } catch (error) {
        logger.error({ error }, 'Failed to fetch student challenge progress');
        return ResponseHelper.error(reply, 'Failed to fetch student challenge progress', 500);
      }
    },
  });

  fastify.post('/challenges/submit', {
    preHandler: [checkTenantAccess([UserRole.ADMIN, UserRole.MANAGER, UserRole.INSTRUCTOR, UserRole.STUDENT])],
    handler: async (request: FastifyRequest<{
      Body: {
        enrollmentId: string;
        challengeId: string;
        actualMetric?: number;
        actualTime?: number;
        videoUrl?: string;
        imageUrl?: string;
        notes?: string;
      };
    }>, reply: FastifyReply) => {
      try {
        const body = request.body;
        const organizationId = request.tenant!.organizationId;

        // Validate enrollment belongs to organization
        const enrollment = await prisma.courseEnrollment.findFirst({
          where: {
            id: body.enrollmentId,
            student: { organizationId },
          },
        });

        if (!enrollment) {
          return ResponseHelper.error(reply, 'Enrollment not found', 404);
        }

        const result = await ChallengeService.submitChallengeAttempt(
          body.enrollmentId,
          body.challengeId,
          {
            actualMetric: body.actualMetric,
            actualTime: body.actualTime,
            videoUrl: body.videoUrl,
            imageUrl: body.imageUrl,
            notes: body.notes,
          }
        );

        return ResponseHelper.success(reply, result);
      } catch (error) {
        logger.error({ error }, 'Failed to submit challenge attempt');
        return ResponseHelper.error(reply, 'Failed to submit challenge attempt', 500);
      }
    },
  });

  fastify.post('/challenges/:challengeProgressId/validate', {
    preHandler: [checkTenantAccess([UserRole.ADMIN, UserRole.MANAGER, UserRole.INSTRUCTOR])],
    handler: async (request: FastifyRequest<{
      Params: { challengeProgressId: string };
      Body: {
        approved: boolean;
        notes?: string;
        adjustedMetric?: number;
        adjustedTime?: number;
      };
    }>, reply: FastifyReply) => {
      try {
        const { challengeProgressId } = request.params;
        const body = request.body;
        const instructorId = request.user!.id;

        await ChallengeService.validateChallengeSubmission(
          challengeProgressId,
          instructorId,
          body
        );

        return ResponseHelper.success(reply, { message: 'Challenge submission validated successfully' });
      } catch (error) {
        logger.error({ error }, 'Failed to validate challenge submission');
        return ResponseHelper.error(reply, 'Failed to validate challenge submission', 500);
      }
    },
  });

  fastify.get('/challenges/:challengeId/leaderboard', {
    preHandler: [checkTenantAccess([UserRole.ADMIN, UserRole.MANAGER, UserRole.INSTRUCTOR, UserRole.STUDENT])],
    handler: async (request: FastifyRequest<{ 
      Params: { challengeId: string };
      Querystring: { 
        limit?: number;
        metric?: 'performance' | 'completion_time';
      };
    }>, reply: FastifyReply) => {
      try {
        const { challengeId } = request.params;
        const leaderboard = await ChallengeService.getChallengeLeaderboard(challengeId, request.query);

        return ResponseHelper.success(reply, leaderboard);
      } catch (error) {
        logger.error({ error }, 'Failed to fetch challenge leaderboard');
        return ResponseHelper.error(reply, 'Failed to fetch challenge leaderboard', 500);
      }
    },
  });

  fastify.get('/challenges/stats', {
    preHandler: [checkTenantAccess([UserRole.ADMIN, UserRole.MANAGER, UserRole.INSTRUCTOR])],
    handler: async (request: FastifyRequest<{ 
      Querystring: { weekNumber?: number };
    }>, reply: FastifyReply) => {
      try {
        const organizationId = request.tenant!.organizationId;
        const { weekNumber } = request.query;

        const stats = await ChallengeService.getWeeklyChallengeStats(organizationId, weekNumber);

        return ResponseHelper.success(reply, stats);
      } catch (error) {
        logger.error({ error }, 'Failed to fetch challenge stats');
        return ResponseHelper.error(reply, 'Failed to fetch challenge stats', 500);
      }
    },
  });

  fastify.post('/courses/:courseId/challenges/generate', {
    preHandler: [checkTenantAccess([UserRole.ADMIN, UserRole.MANAGER])],
    handler: async (request: FastifyRequest<{ Params: { courseId: string } }>, reply: FastifyReply) => {
      try {
        const { courseId } = request.params;
        const organizationId = request.tenant!.organizationId;

        // Validate course belongs to organization
        const course = await prisma.course.findFirst({
          where: addTenantFilter({ id: courseId }, organizationId),
        });

        if (!course) {
          return ResponseHelper.error(reply, 'Course not found', 404);
        }

        await ChallengeService.createWeeklyChallengesForCourse(courseId);

        return ResponseHelper.success(reply, { message: 'Weekly challenges generated successfully' });
      } catch (error) {
        logger.error({ error }, 'Failed to generate weekly challenges');
        return ResponseHelper.error(reply, 'Failed to generate weekly challenges', 500);
      }
    },
  });
};