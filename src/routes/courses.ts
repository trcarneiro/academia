import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '@/utils/database';
import { ResponseHelper } from '@/utils/response';
import { logger } from '@/utils/logger';

// Validation schemas
const CreateCourseSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT', 'MASTER']),
  category: z.enum(['ADULT', 'MASTER_1', 'MASTER_2', 'MASTER_3', 'HERO_1', 'HERO_2', 'HERO_3']).default('ADULT'),
  duration: z.number().int().min(1).max(52),
  classesPerWeek: z.number().int().min(1).max(7).default(2),
  totalClasses: z.number().int().min(1).max(500).optional(),
  minAge: z.number().int().min(3).max(100).default(16),
  maxAge: z.number().int().min(3).max(100).optional(),
  objectives: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  prerequisites: z.array(z.string()).default([]),
  imageUrl: z.string().url().optional(),
  martialArtId: z.string().uuid().optional(),
});

const UpdateCourseSchema = CreateCourseSchema.partial();

const CreateLessonPlanSchema = z.object({
  lessonNumber: z.number().int().min(1).max(500),
  title: z.string().min(1).max(255),
  objectives: z.array(z.string()).default([]),
  warmUp: z.string().optional(),
  techniques: z.array(z.string()).default([]),
  practiceExercises: z.array(z.string()).default([]),
  coolDown: z.string().optional(),
  evaluationCriteria: z.array(z.string()).default([]),
  materials: z.array(z.string()).default([]),
  duration: z.number().int().min(30).max(180).default(60),
  notes: z.string().optional(),
});

export const coursesRoutes = async (fastify: FastifyInstance) => {
  // Debug endpoint
  fastify.get('/debug', {
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const organization = await prisma.organization.findFirst({
          where: { isActive: true }
        });
        
        const martialArt = await prisma.martialArt.findFirst({
          where: { 
            name: 'Krav Maga',
            organizationId: organization?.id
          }
        });

        return {
          success: true,
          data: {
            organization: organization ? { id: organization.id, name: organization.name } : null,
            martialArt: martialArt ? { id: martialArt.id, name: martialArt.name } : null
          }
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    },
  });

  // GET /api/courses-management - Lista cursos para administração
  fastify.get('/', {
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const courses = await prisma.course.findMany({
          include: {
            martialArt: true,
            classes: {
              include: {
                _count: { select: { studentCourses: true } }
              }
            },
            techniques: {
              include: { technique: true },
              orderBy: { orderIndex: 'asc' }
            },
            _count: {
              select: {
                enrollments: true,
                classes: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        });

        return ResponseHelper.success(reply, {
          courses: courses.map(course => ({
            id: course.id,
            name: course.name,
            description: course.description,
            level: course.level,
            category: course.category,
            duration: course.duration,
            classesPerWeek: course.classesPerWeek,
            totalClasses: course.totalClasses,
            minAge: course.minAge,
            maxAge: course.maxAge,
            objectives: course.objectives,
            requirements: course.requirements,
            prerequisites: course.prerequisites,
            imageUrl: course.imageUrl,
            isActive: course.isActive,
            martialArt: course.martialArt?.name || 'N/A',
            stats: {
              totalEnrollments: course._count.enrollments,
              totalClasses: course._count.classes,
              totalTechniques: course.techniques?.length || 0
            },
            classes: course.classes.map(cls => ({
              id: cls.id,
              name: cls.name,
              schedule: `${cls.dayOfWeek} ${cls.startTime}`,
              maxStudents: cls.maxStudents,
              enrolledStudents: cls._count.studentCourses
            })),
            createdAt: course.createdAt,
            updatedAt: course.updatedAt
          }))
        });
      } catch (error) {
        logger.error({ error }, 'Failed to retrieve courses');
        return ResponseHelper.error(reply, 'Failed to retrieve courses', 500);
      }
    },
  });

  // POST /api/courses-management - Criar novo curso
  fastify.post('/', {
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = CreateCourseSchema.parse(request.body);

        // Get default organization
        const organization = await prisma.organization.findFirst({
          where: { isActive: true }
        });

        if (!organization) {
          return ResponseHelper.error(reply, 'No active organization found', 400);
        }

        // Get or create default martial art if not provided
        let martialArtId = body.martialArtId;
        if (!martialArtId) {
          const defaultMartialArt = await prisma.martialArt.findFirst({
            where: { 
              name: 'Krav Maga',
              organizationId: organization.id
            }
          });

          if (!defaultMartialArt) {
            return ResponseHelper.error(reply, 'No Krav Maga martial art found. Please create one first.', 400);
          } else {
            martialArtId = defaultMartialArt.id;
          }
        }

        // Calculate total classes if not provided
        const totalClasses = body.totalClasses || (body.duration * body.classesPerWeek);

        const course = await prisma.course.create({
          data: {
            name: body.name,
            description: body.description,
            level: body.level,
            category: body.category || 'ADULT',
            duration: body.duration,
            classesPerWeek: body.classesPerWeek || 2,
            totalClasses,
            minAge: body.minAge || 16,
            maxAge: body.maxAge,
            objectives: body.objectives || [],
            requirements: body.requirements || [],
            prerequisites: body.prerequisites || [],
            imageUrl: body.imageUrl,
            organizationId: organization.id,
            martialArtId,
            isActive: true,
          },
          include: {
            martialArt: true,
          },
        });

        logger.info({ courseId: course.id, name: course.name }, 'Course created successfully');

        return ResponseHelper.success(reply, course);
      } catch (error) {
        logger.error({ error, body: request.body }, 'Failed to create course');
        return ResponseHelper.error(reply, `Failed to create course: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
      }
    },
  });

  // PUT /api/courses-management/:id - Editar curso
  fastify.put('/:id', {
    handler: async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const body = UpdateCourseSchema.parse(request.body);

        // Check if course exists
        const existingCourse = await prisma.course.findUnique({
          where: { id },
        });

        if (!existingCourse) {
          return ResponseHelper.error(reply, 'Course not found', 404);
        }

        // Calculate total classes if duration or classesPerWeek changed
        const updateData = { ...body };
        if (body.duration || body.classesPerWeek) {
          const duration = body.duration || existingCourse.duration;
          const classesPerWeek = body.classesPerWeek || existingCourse.classesPerWeek;
          updateData.totalClasses = duration * classesPerWeek;
        }

        const course = await prisma.course.update({
          where: { id },
          data: updateData,
          include: {
            martialArt: true,
          },
        });

        logger.info({ courseId: course.id }, 'Course updated successfully');

        return ResponseHelper.success(reply, course);
      } catch (error) {
        logger.error({ error }, 'Failed to update course');
        return ResponseHelper.error(reply, 'Failed to update course', 500);
      }
    },
  });

  // GET /api/courses-management/:id/lesson-plans - Planos de aula do curso
  fastify.get('/:id/lesson-plans', {
    handler: async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;

        // Check if course exists
        const course = await prisma.course.findUnique({
          where: { id },
        });

        if (!course) {
          return ResponseHelper.error(reply, 'Course not found', 404);
        }

        const lessonPlans = await prisma.lessonPlan.findMany({
          where: { courseId: id },
          orderBy: { lessonNumber: 'asc' },
        });

        return ResponseHelper.success(reply, lessonPlans);
      } catch (error) {
        logger.error({ error }, 'Failed to retrieve lesson plans');
        return ResponseHelper.error(reply, 'Failed to retrieve lesson plans', 500);
      }
    },
  });

  // POST /api/courses-management/:id/lesson-plans - Criar/Atualizar plano de aula
  fastify.post('/:id/lesson-plans', {
    handler: async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const body = CreateLessonPlanSchema.parse(request.body);

        // Check if course exists
        const course = await prisma.course.findUnique({
          where: { id },
        });

        if (!course) {
          return ResponseHelper.error(reply, 'Course not found', 404);
        }

        // Check if lesson plan already exists
        const existingPlan = await prisma.lessonPlan.findFirst({
          where: {
            courseId: id,
            lessonNumber: body.lessonNumber,
          },
        });

        let lessonPlan;

        if (existingPlan) {
          lessonPlan = await prisma.lessonPlan.update({
            where: { id: existingPlan.id },
            data: body,
          });
        } else {
          lessonPlan = await prisma.lessonPlan.create({
            data: {
              ...body,
              courseId: id,
            },
          });
        }

        logger.info({ courseId: id, lessonNumber: body.lessonNumber }, 'Lesson plan created/updated');

        return ResponseHelper.success(reply, lessonPlan);
      } catch (error) {
        logger.error({ error }, 'Failed to create/update lesson plan');
        return ResponseHelper.error(reply, 'Failed to create/update lesson plan', 500);
      }
    },
  });

  // DELETE /api/courses-management/:id - Delete course
  fastify.delete('/:id', {
    handler: async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;

        // Check if course exists
        const course = await prisma.course.findUnique({
          where: { id },
        });

        if (!course) {
          return ResponseHelper.error(reply, 'Course not found', 404);
        }

        // Check if course has active enrollments
        const activeEnrollments = await prisma.courseEnrollment.count({
          where: {
            courseId: id,
            status: 'ACTIVE',
          },
        });

        if (activeEnrollments > 0) {
          return ResponseHelper.error(reply, 'Cannot delete course with active enrollments', 400);
        }

        // Soft delete by setting isActive to false
        await prisma.course.update({
          where: { id },
          data: { isActive: false },
        });

        logger.info({ courseId: id }, 'Course deleted successfully');

        return ResponseHelper.success(reply, { message: 'Course deleted successfully' });
      } catch (error) {
        logger.error({ error }, 'Failed to delete course');
        return ResponseHelper.error(reply, 'Failed to delete course', 500);
      }
    },
  });
};