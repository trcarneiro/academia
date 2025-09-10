import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { courseController } from '../controllers/courseController';
import { prisma } from '@/utils/database';
import { z } from 'zod';
import { TechniqueImportService } from '../services/techniqueImportService';
import { CourseImportService } from '../services/courseImportService';

// Helper: resolve organizationId (first org fallback)
async function getOrganizationId(): Promise<string> {
  const org = await prisma.organization.findFirst();
  if (!org) throw new Error('No organization found');
  return org.id;
}

// Middleware de autenticação (simulado)
async function authenticate(_request: FastifyRequest, reply: FastifyReply) {
  try {
    // Em um app real, isso verificaria o token JWT
    // await request.jwtVerify();
  } catch (err) {
    reply.send(err as any);
  }
}

export async function coursesRoutes(app: FastifyInstance) {
  // Aplica o hook de autenticação para todas as rotas de cursos
  app.addHook('preHandler', authenticate);

  // Rotas CRUD para Cursos
  app.get('/', courseController.list);
  app.get('/:id', courseController.show);
  app.post('/', courseController.create);
  app.patch('/:id', courseController.update);
  app.put('/:id', courseController.update); // Alias for PATCH to support frontend expectations
  app.delete('/:id', courseController.delete);

  // Replace course techniques association
  app.post('/:id/techniques', async (request, reply) => {
    try {
      const { id } = request.params as any;
      const body = (request.body as any) || {};

      const schema = z.object({
        replace: z.boolean().optional().default(true),
        techniques: z.array(z.object({
          id: z.union([z.string(), z.number()]).transform(String),
          name: z.string().optional(),
          orderIndex: z.number().int().positive().optional(),
          weekNumber: z.number().int().positive().nullable().optional(),
          lessonNumber: z.number().int().positive().nullable().optional(),
          isRequired: z.boolean().optional().default(true)
        })).min(1, 'Lista de técnicas não pode estar vazia')
      });

      const input = schema.parse(body);

      // Ensure course exists
      const course = await prisma.course.findUnique({ where: { id } });
      if (!course) return reply.code(404).send({ success: false, error: 'Curso não encontrado' });

      // Replace existing associations if requested
      if (input.replace) {
        await prisma.courseTechnique.deleteMany({ where: { courseId: id } });
      }

      // Link techniques in order
      let order = 1;
      let linked = 0, skipped = 0;
      for (const t of input.techniques) {
        // find technique by id or by name as fallback
        let tech = null as any;
        if (t.id) tech = await prisma.technique.findUnique({ where: { id: t.id } });
        if (!tech && t.name) tech = await prisma.technique.findFirst({ where: { name: t.name } });
        if (!tech) { skipped++; continue; }

        await prisma.courseTechnique.create({
          data: {
            courseId: id,
            techniqueId: tech.id,
            orderIndex: t.orderIndex || order++,
            weekNumber: t.weekNumber ?? null,
            lessonNumber: t.lessonNumber ?? null,
            isRequired: t.isRequired ?? true,
          }
        });
        linked++;
      }

      return reply.send({ success: true, summary: { linked, skipped } });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ success: false, error: error.flatten() });
      }
      request.log?.error(error);
      return reply.code(500).send({ success: false, error: 'Erro ao associar técnicas' });
    }
  });

  // Import course with techniques
  app.post('/import', async (request, reply) => {
    try {
      const body = (request.body as any) || {};
      const orgId = await getOrganizationId();

      // Basic mapping and defaults
      const name: string = body.name?.toString().trim();
      if (!name) return reply.code(400).send({ success: false, error: 'name is required' });
      const level = (body.level || 'BEGINNER').toString();
      const duration = Number(body.duration || 16);
      const classesPerWeek = Number(body.classesPerWeek || 2);
      const totalClasses = Number(body.totalClasses || (duration * classesPerWeek));
      const description: string | null = body.description ?? null;
      const objectives: string[] = [
        ...(Array.isArray(body.objectives?.general) ? body.objectives.general : []),
        ...(Array.isArray(body.objectives?.specific) ? body.objectives.specific : [])
      ];
      const requirements: string[] = Array.isArray(body.requirements) ? body.requirements : [];
      const category = (body.category || 'ADULT').toString();

      // Upsert by organizationId+name
      const existing = await prisma.course.findFirst({ where: { organizationId: orgId, name } });
      let course = existing;
      if (existing) {
        course = await prisma.course.update({
          where: { id: existing.id },
          data: { description, level, duration, classesPerWeek, totalClasses, objectives, requirements, category }
        });
      } else {
        course = await prisma.course.create({
          data: { organizationId: orgId, name, description, level, duration, classesPerWeek, totalClasses, objectives, requirements, category }
        });
      }

      // Techniques association (replace mode)
      let linked = 0, skipped = 0;
      if (Array.isArray(body.techniques)) {
        await prisma.courseTechnique.deleteMany({ where: { courseId: course.id } });
        let orderIndex = 1;
        for (const t of body.techniques) {
          const techId = t?.id || t?.techniqueId;
          const techName = t?.name;
          let technique = null as any;
          if (techId) technique = await prisma.technique.findUnique({ where: { id: techId } });
          if (!technique && techName) technique = await prisma.technique.findFirst({ where: { name: techName } });
          if (!technique) { skipped++; continue; }
          const wk = t?.weekNumber ?? null;
          const ln = t?.lessonNumber ?? null;
          const isRequired = t?.isRequired ?? true;
          await prisma.courseTechnique.create({ data: {
            courseId: course.id,
            techniqueId: technique.id,
            orderIndex: t?.orderIndex || orderIndex++,
            weekNumber: wk,
            lessonNumber: ln,
            isRequired
          }});
          linked++;
        }
      }

      return reply.send({ success: true, data: { id: course.id }, summary: { linkedTechniques: linked, skipped } });
    } catch (e: any) {
      request.log?.error(e);
      reply.code(500);
      return { success: false, error: e?.message || 'Erro ao importar curso' };
    }
  });

  // Import techniques endpoint with proper validation
  app.post('/import-techniques', async (request, reply) => {
    try {
      const body = (request.body as any) || {};
      
      // Debug: Log the incoming request
      console.log('🔍 Incoming technique import request:', JSON.stringify(body, null, 2));
      
      // Validation schema for technique import
      const techniqueSchema = z.object({
        id: z.string().min(1, 'ID é obrigatório'),
        type: z.string().min(1, 'Tipo é obrigatório'),
        title: z.string().min(1, 'Título é obrigatório'),
        description: z.string().min(1, 'Descrição é obrigatória'),
        difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
        defaultParams: z.object({
          repetitions: z.record(z.string(), z.number()).optional(),
          duration: z.string().optional(),
          precision: z.string().optional(),
          equipment: z.array(z.string()).optional(),
          safety: z.string().optional(),
          adaptations: z.array(z.string()).optional(),
          refTechniqueId: z.array(z.string()).optional()
        }).optional()
      });

      const importSchema = z.object({
        techniques: z.array(techniqueSchema).min(1, 'Lista de técnicas não pode estar vazia')
      });

      // Validate the request body
      const validatedData = importSchema.parse(body);

      // Sanitize optional properties for exactOptionalPropertyTypes compatibility
      const techniques = validatedData.techniques.map((t: any) => {
        const { defaultParams, ...rest } = t;
        return defaultParams === undefined ? rest : { ...rest, defaultParams };
      });

      // Use TechniqueImportService to process techniques
      const result = await TechniqueImportService.importTechniques(techniques as any);

      return reply.send({
        success: true,
        data: result
      });

    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: 'Dados de técnica inválidos',
          details: error.flatten().fieldErrors
        });
      }

      console.error('❌ Import techniques error:', error);
      return reply.code(500).send({
        success: false,
        error: 'Erro interno ao importar técnicas'
      });
    }
  });

  // List lesson plans for a course (summary)
  app.get('/:id/lesson-plans', async (request, reply) => {
    try {
      const { id } = request.params as any;
      const plans = await prisma.lessonPlan.findMany({
        where: { courseId: id },
        orderBy: [{ weekNumber: 'asc' }, { lessonNumber: 'asc' }],
        select: {
          id: true,
          title: true,
          lessonNumber: true,
          weekNumber: true,
          updatedAt: true,
        }
      });
      const planIds = plans.map(p => p.id);
      const countsByPlan = new Map<string, number>();
      if (planIds.length) {
        const countsRaw = await prisma.$queryRawUnsafe<any[]>(
          `SELECT "lessonPlanId" as id, COUNT(*)::int as cnt FROM lesson_plan_activities WHERE "lessonPlanId" IN (${planIds.map((_,i)=>`$${i+1}`).join(',')}) GROUP BY 1`,
          ...planIds
        );
        countsRaw.forEach((row:any)=> countsByPlan.set(row.id, row.cnt));
      }
      const data = (plans as any[]).map((p) => ({
        id: p.id,
        name: p.title,
        week: p.weekNumber,
        lesson: p.lessonNumber,
        itemsCount: countsByPlan.get(p.id) ?? 0,
        updatedAt: p.updatedAt
      }));
      return { success: true, data };
    } catch (e) {
      reply.code(500);
      return { success: false, error: 'Erro ao listar planos de aula do curso' };
    }
  });

  // Generate lesson plans from syllabus (cronograma)
  app.post('/:id/generate-lesson-plans', async (request, reply) => {
    try {
      const { id } = request.params as any;
      const body = (request.body as any) || {};
      const syllabus: Array<{ aula: number; unidade_nivel?: string; tecnicas_atividades?: string; objetivo?: string; }>
        = Array.isArray(body.syllabus) ? body.syllabus : [];
      const replace: boolean = !!body.replace;
      const dryRun: boolean = !!body.dryRun;

      if (!syllabus.length) return reply.code(400).send({ success: false, error: 'syllabus é obrigatório (array)' });

      const course = await prisma.course.findUnique({ where: { id } });
      if (!course) return reply.code(404).send({ success: false, error: 'Curso não encontrado' });

      const cpw = Number(course.classesPerWeek || 2);
      const summary = { created: 0, replaced: 0, dryRun };

      await prisma.$transaction(async (tx) => {
        // Replace existing plans if requested
        if (replace) {
          const existing = await tx.lessonPlan.findMany({ where: { courseId: id }, select: { id: true } });
          if (existing.length) {
            const planIds = existing.map(p => p.id);
            await (tx as any).lessonPlanActivity.deleteMany({ where: { lessonPlanId: { in: planIds } } });
            await tx.lessonPlan.deleteMany({ where: { id: { in: planIds } } });
            summary.replaced = existing.length;
          }
        }

        for (const entry of syllabus) {
          const n = Number(entry?.aula);
          if (!n || n < 1) continue;

          const weekNumber = Math.ceil(n / cpw);
          const lessonNumber = ((n - 1) % cpw) + 1;
          const title = `Aula ${n} - ${(entry.unidade_nivel || 'Plano').trim()}`;
          const description = entry.objetivo || entry.tecnicas_atividades || null;

          if (dryRun) {
            summary.created++;
            continue;
          }

          await tx.lessonPlan.create({
            data: {
              courseId: id,
              title,
              description,
              lessonNumber,
              weekNumber,
              duration: 60,
              objectives: description ? [description] : [],
              equipment: [],
              difficulty: 1,
              warmup: {},
              techniques: {},
              simulations: {},
              cooldown: {},
              activities: [],
            }
          });

          summary.created++;
        }
      });

      return reply.send({ success: true, summary });
    } catch (e: any) {
      request.log?.error(e);
      reply.code(500);
      return { success: false, error: e?.message || 'Erro ao gerar planos de aula' };
    }
  });

  // Import full course endpoint
  app.post('/import-full-course', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const courseData = request.body as any;
      const organizationId = await getOrganizationId();

      // Validate basic structure
      if (!courseData.courseId || !courseData.name || !courseData.techniques) {
        return reply.code(400).send({
          success: false,
          message: 'Dados do curso inválidos. Campos obrigatórios: courseId, name, techniques'
        });
      }

      const result = await CourseImportService.importFullCourse(courseData, organizationId);
      
      if (result.success) {
        reply.code(201).send(result);
      } else {
        reply.code(400).send(result);
      }

    } catch (error) {
      console.error('Erro no endpoint de importação:', error);
      reply.code(500).send({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get import preview endpoint
  app.post('/import-preview', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const courseData = request.body as any;
      
      // Validate basic structure
      if (!courseData.courseId || !courseData.name || !courseData.techniques) {
        return reply.code(400).send({
          success: false,
          message: 'Dados do curso inválidos para prévia'
        });
      }

      const preview = await CourseImportService.validateImportData(courseData);
      
      reply.send({
        success: true,
        data: preview
      });

    } catch (error) {
      reply.code(500).send({
        success: false,
        message: 'Erro na validação',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get lesson techniques for course schedule display
  app.get('/:id/lesson-techniques', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };

      // Get all lesson plans for this course with their associated activities
      const lessonPlans = await prisma.lessonPlan.findMany({
        where: { courseId: id },
        include: {
          activityItems: {
            include: {
              activity: {
                select: {
                  id: true,
                  title: true,
                  type: true,
                  description: true
                }
              }
            },
            where: {
              activity: {
                type: 'TECHNIQUE'
              }
            },
            orderBy: { ord: 'asc' }
          }
        },
        orderBy: { lessonNumber: 'asc' }
      });

      // Format the response
      const lessonsWithTechniques = lessonPlans.map(lesson => ({
        lessonNumber: lesson.lessonNumber,
        weekNumber: lesson.weekNumber,
        title: lesson.title,
        techniques: lesson.activityItems.map(item => ({
          id: item.activity.id,
          title: item.activity.title,
          type: item.activity.type,
          description: item.activity.description,
          segment: item.segment,
          order: item.ord
        }))
      }));

      reply.send({
        success: true,
        data: lessonsWithTechniques
      });

    } catch (error) {
      console.error('Error fetching lesson techniques:', error);
      reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}

