import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '@/utils/database';
import { ResponseHelper } from '@/utils/response';
import { logger } from '@/utils/logger';

// Validation schemas
const StudentProgressParamsSchema = z.object({
  studentId: z.string().uuid(),
  courseId: z.string().uuid(),
});

const ProgressRecordSchema = z.object({
  studentId: z.string().uuid(),
  courseId: z.string().uuid(),
  lessonNumber: z.number().int().min(1).max(48),
  techniquesLearned: z.array(z.string()).optional().default([]),
  challengesCompleted: z.array(z.string()).optional().default([]),
  points: z.number().int().min(0).optional().default(0),
  reflections: z.string().optional(),
  notes: z.string().optional(), // Legacy field, maps to reflections
  completed: z.boolean().optional().default(false),
});

const LessonTechniquesParamsSchema = z.object({
  courseId: z.string().uuid(),
  lessonNumber: z.string().transform(Number),
});

export default async function progressRoutes(fastify: FastifyInstance) {
  // Get student progress in a specific course
  fastify.get('/students/:studentId/progress/:courseId', {
    schema: {
      params: {
        type: 'object',
        properties: {
          studentId: { type: 'string' },
          courseId: { type: 'string' }
        },
        required: ['studentId', 'courseId']
      },
      tags: ['Progress'],
      summary: 'Get student progress in course',
    },
    handler: async (request: FastifyRequest<{ Params: z.infer<typeof StudentProgressParamsSchema> }>, reply: FastifyReply) => {
      try {
        const { studentId, courseId } = request.params;
        
        // Get student course enrollment
        const studentCourse = await prisma.studentCourse.findFirst({
          where: { studentId, courseId },
          include: {
            course: { select: { name: true, totalClasses: true } },
            class: { select: { title: true } }
          }
        });

        if (!studentCourse) {
          return ResponseHelper.error(reply, 'Student not enrolled in this course', 404);
        }

        // Get attendance records
        const attendanceRecords = await prisma.attendanceRecord.findMany({
          where: { studentId, courseId },
          orderBy: { lessonNumber: 'asc' }
        });

        // Get progress records
        const progressRecords = await prisma.progress.findMany({
          where: { studentId, courseId },
          orderBy: { lessonNumber: 'asc' }
        });

        // Calculate statistics
        const totalClasses = attendanceRecords.length;
        const presentClasses = attendanceRecords.filter(a => a.present).length;
        const attendanceRate = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;
        
        const totalTechniques = progressRecords.reduce((acc, p) => acc + p.techniquesLearned.length, 0);
        const totalPoints = progressRecords.reduce((acc, p) => acc + p.points, 0);
        const completedChallenges = progressRecords.reduce((acc, p) => acc + p.challengesCompleted.length, 0);

        const data = {
          studentCourse,
          stats: {
            attendanceRate,
            totalClasses,
            presentClasses,
            totalTechniques,
            totalPoints,
            completedChallenges,
            currentLesson: Math.max(...attendanceRecords.map(a => a.lessonNumber), 0)
          },
          attendanceRecords: attendanceRecords.slice(-10), // Last 10 classes
          progressRecords: progressRecords.slice(-5) // Last 5 progress entries
        };

        return ResponseHelper.success(reply, data, 'Student progress retrieved successfully');
      } catch (error) {
        logger.error({ error }, 'Failed to retrieve student progress');
        return ResponseHelper.error(reply, 'Failed to retrieve student progress', 500);
      }
    }
  });

  // Record student progress for a lesson
  fastify.post('/progress', {
    schema: {
      body: {
        type: 'object',
        properties: {
          studentId: { type: 'string' },
          courseId: { type: 'string' },
          lessonNumber: { type: 'integer', minimum: 1, maximum: 48 },
          techniquesLearned: { type: 'array', items: { type: 'string' } },
          challengesCompleted: { type: 'array', items: { type: 'string' } },
          points: { type: 'integer', minimum: 0 },
          reflections: { type: 'string' },
          notes: { type: 'string' },
          completed: { type: 'boolean' }
        },
        required: ['studentId', 'courseId', 'lessonNumber']
      },
      tags: ['Progress'],
      summary: 'Record student progress for a lesson',
    },
    handler: async (request: FastifyRequest<{ Body: z.infer<typeof ProgressRecordSchema> }>, reply: FastifyReply) => {
      try {
        const body = request.body;
        
        // Check if progress already exists for this lesson
        const existingProgress = await prisma.progress.findFirst({
          where: {
            studentId: body.studentId,
            courseId: body.courseId,
            lessonNumber: body.lessonNumber
          }
        });

        if (existingProgress) {
          // Update existing progress
          const updatedProgress = await prisma.progress.update({
            where: { id: existingProgress.id },
            data: {
              techniquesLearned: body.techniquesLearned,
              challengesCompleted: body.challengesCompleted,
              points: body.points,
              reflections: body.reflections || body.notes || null,
              completedAt: body.completed ? new Date() : null
            },
            include: {
              student: {
                include: {
                  user: {
                    select: { firstName: true, lastName: true }
                  }
                }
              }
            }
          });

          return ResponseHelper.success(reply, updatedProgress, 'Progress updated successfully');
        } else {
          // Create new progress record
          const newProgress = await prisma.progress.create({
            data: {
              studentId: body.studentId,
              courseId: body.courseId,
              lessonNumber: body.lessonNumber,
              techniquesLearned: body.techniquesLearned,
              challengesCompleted: body.challengesCompleted,
              points: body.points,
              reflections: body.reflections || body.notes || null,
              completedAt: body.completed ? new Date() : null
            },
            include: {
              student: {
                include: {
                  user: {
                    select: { firstName: true, lastName: true }
                  }
                }
              }
            }
          });

          return ResponseHelper.success(reply, newProgress, 'Progress recorded successfully');
        }
      } catch (error) {
        logger.error({ error }, 'Failed to record progress');
        return ResponseHelper.error(reply, 'Failed to record progress', 500);
      }
    }
  });

  // Get techniques for a specific lesson
  fastify.get('/courses/:courseId/lessons/:lessonNumber/techniques', {
    schema: {
      params: {
        type: 'object',
        properties: {
          courseId: { type: 'string' },
          lessonNumber: { type: 'string' }
        },
        required: ['courseId', 'lessonNumber']
      },
      tags: ['Progress'],
      summary: 'Get techniques for a specific lesson',
    },
    handler: async (request: FastifyRequest<{ Params: z.infer<typeof LessonTechniquesParamsSchema> }>, reply: FastifyReply) => {
      try {
        const { courseId, lessonNumber } = request.params;
        
        const techniques = await prisma.techniqueDetail.findMany({
          where: { 
            courseId,
            lessonNumber: lessonNumber
          },
          orderBy: { orderInLesson: 'asc' }
        });

        return ResponseHelper.success(reply, techniques, 'Lesson techniques retrieved successfully');
      } catch (error) {
        logger.error({ error }, 'Failed to fetch lesson techniques');
        return ResponseHelper.error(reply, 'Failed to fetch lesson techniques', 500);
      }
    }
  });

  // Get comprehensive progress summary for a student in a course
  fastify.get('/students/:studentId/progress-summary/:courseId', {
    schema: {
      params: {
        type: 'object',
        properties: {
          studentId: { type: 'string' },
          courseId: { type: 'string' }
        },
        required: ['studentId', 'courseId']
      },
      tags: ['Progress'],
      summary: 'Get comprehensive progress summary',
    },
    handler: async (request: FastifyRequest<{ Params: z.infer<typeof StudentProgressParamsSchema> }>, reply: FastifyReply) => {
      try {
        const { studentId, courseId } = request.params;
        
        // Get all progress and attendance data
        const [studentCourse, progressRecords, attendanceRecords, course] = await Promise.all([
          prisma.studentCourse.findFirst({
            where: { studentId, courseId },
            include: {
              class: { select: { title: true } }
            }
          }),
          prisma.progress.findMany({
            where: { studentId, courseId },
            orderBy: { lessonNumber: 'asc' }
          }),
          prisma.attendanceRecord.findMany({
            where: { studentId, courseId },
            orderBy: { lessonNumber: 'asc' }
          }),
          prisma.course.findUnique({
            where: { id: courseId },
            select: { name: true, totalClasses: true, duration: true }
          })
        ]);

        if (!studentCourse || !course) {
          return ResponseHelper.error(reply, 'Student not enrolled in this course', 404);
        }

        // Calculate comprehensive statistics
        const attendanceStats = {
          totalClasses: attendanceRecords.length,
          presentClasses: attendanceRecords.filter(a => a.present).length,
          lateArrivals: attendanceRecords.filter(a => a.arrived_late).length,
          earlyDepartures: attendanceRecords.filter(a => a.left_early).length,
        };
        attendanceStats.attendanceRate = attendanceStats.totalClasses > 0 
          ? Math.round((attendanceStats.presentClasses / attendanceStats.totalClasses) * 100) 
          : 0;

        const progressStats = {
          totalLessonsWithProgress: progressRecords.length,
          totalTechniques: progressRecords.reduce((acc, p) => acc + p.techniquesLearned.length, 0),
          totalPoints: progressRecords.reduce((acc, p) => acc + p.points, 0),
          totalChallenges: progressRecords.reduce((acc, p) => acc + p.challengesCompleted.length, 0),
          averagePointsPerLesson: progressRecords.length > 0 
            ? Math.round(progressRecords.reduce((acc, p) => acc + p.points, 0) / progressRecords.length)
            : 0,
        };

        const currentWeek = Math.ceil(attendanceRecords.length / 2); // Assuming 2 classes per week
        const progressRate = course.totalClasses > 0 
          ? Math.round((attendanceRecords.length / course.totalClasses) * 100)
          : 0;

        const summary = {
          student: studentCourse,
          course,
          currentWeek,
          progressRate,
          attendanceStats,
          progressStats,
          recentProgress: progressRecords.slice(-5),
          recentAttendance: attendanceRecords.slice(-10)
        };

        return ResponseHelper.success(reply, summary, 'Progress summary retrieved successfully');
      } catch (error) {
        logger.error({ error }, 'Failed to retrieve progress summary');
        return ResponseHelper.error(reply, 'Failed to retrieve progress summary', 500);
      }
    }
  });
}