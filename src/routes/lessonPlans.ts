import { FastifyInstance } from 'fastify';
import { lessonPlanController } from '../controllers/lessonPlanController';
import { prisma } from '@/utils/database';

// Middleware de autenticação (simulado)
async function authenticate(_request: any, reply: any) {
  try {
    // Em um app real, isso verificaria o token JWT
    // await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
}

export async function lessonPlansRoutes(app: FastifyInstance) {
  // Aplica o hook de autenticação para todas as rotas de lesson plans
  app.addHook('preHandler', authenticate);

  // Rotas CRUD para Lesson Plans
  app.get('/', lessonPlanController.list);
  app.get('/:id', lessonPlanController.show);
  app.post('/', lessonPlanController.create);
  app.put('/:id', lessonPlanController.update);
  app.delete('/:id', lessonPlanController.delete);
  
  // Rotas específicas para lesson plans de um curso
  app.get('/course/:courseId', lessonPlanController.listByCourse);

  const db: any = prisma as any;

  // === Import lesson plan ===
  app.post('/import', async (request, reply) => {
    try {
      const body = (request.body as any) || {};
      const courseId = body.courseId;
      if (!courseId) return reply.code(400).send({ success: false, error: 'courseId é obrigatório' });

      const title: string = (body.title || body.name || 'Plano de Aula').toString();
      const lessonNumber = Number(body.lessonNumber || 1);
      const weekNumber = Number(body.weekNumber || 1);
      const duration = Number(body.duration || 60);
      const description: string | null = body.description ?? null;
      const objectives: string[] = Array.isArray(body.objectives) ? body.objectives : [];
      const equipment: string[] = Array.isArray(body.equipment) ? body.equipment : [];

      // Create lesson plan
      const plan = await prisma.lessonPlan.create({
        data: {
          courseId,
          title,
          description,
          lessonNumber,
          weekNumber,
          duration,
          warmup: body.warmup ?? {},
          techniques: body.techniques ?? {},
          simulations: body.simulations ?? {},
          cooldown: body.cooldown ?? {},
          mentalModule: body.mentalModule ?? null,
          tacticalModule: body.tacticalModule ?? null,
          adaptations: body.adaptations ?? null,
          difficulty: Number(body.difficulty || 1),
          objectives,
          equipment,
          activities: Array.isArray(body.activities) ? body.activities : [],
          videoUrl: body.videoUrl ?? null,
          thumbnailUrl: body.thumbnailUrl ?? null,
        }
      });

      // Optional: items import
      let imported = 0;
      if (Array.isArray(body.items) && body.items.length) {
        const items = body.items
          .map((it: any, idx: number) => ({
            lessonPlanId: plan.id,
            activityId: it.activityId || it.activity?.id,
            segment: (it.segment || 'TECHNIQUE').toString().toUpperCase(),
            ord: typeof it.ord === 'number' ? it.ord : idx + 1,
            params: it.params ?? null,
            objectives: it.objectives ?? null,
            safetyNotes: it.safetyNotes ?? null,
            adaptations: it.adaptations ?? null,
          }))
          .filter((x: any) => x.activityId);
        if (items.length) {
          await db.lessonPlanActivity.createMany({ data: items });
          imported = items.length;
        }
      }

      return reply.send({ success: true, data: { id: plan.id }, summary: { importedItems: imported } });
    } catch (e: any) {
      reply.code(500);
      return { success: false, error: e?.message || 'Erro ao importar plano de aula' };
    }
  });

  // === Lesson Plan Activities ===
  // GET items for a lesson plan
  app.get('/:id/activities', async (request, reply) => {
    try {
      const { id } = request.params as any;
      const items = await db.lessonPlanActivity.findMany({
        where: { lessonPlanId: id },
        orderBy: { ord: 'asc' },
        include: { activity: true }
      });
      return { success: true, data: items };
    } catch (e) {
      reply.code(500);
      return { success: false, error: 'Erro ao buscar atividades do plano' };
    }
  });

  // POST replace items for a lesson plan
  app.post('/:id/activities', async (request, reply) => {
    try {
      const { id } = request.params as any;
      const body = (request.body as any) || {};
      const items = Array.isArray(body.items) ? body.items : [];
      // Transaction: delete all and recreate with new order
      await prisma.$transaction(async (tx) => {
        const t: any = tx as any;
        await t.lessonPlanActivity.deleteMany({ where: { lessonPlanId: id } });
        if (items.length) {
          await t.lessonPlanActivity.createMany({
            data: items.map((it: any, idx: number) => ({
              lessonPlanId: id,
              activityId: it.activityId,
              segment: it.segment || 'TECHNIQUE',
              ord: typeof it.ord === 'number' ? it.ord : idx + 1,
              params: it.params ?? null,
              objectives: it.objectives ?? null,
              safetyNotes: it.safetyNotes ?? null,
              adaptations: it.adaptations ?? null,
            }))
          });
        }
      });
      return { success: true };
    } catch (e) {
      reply.code(500);
      return { success: false, error: 'Erro ao salvar atividades do plano' };
    }
  });

  // PUT reorder only
  app.put('/:id/activities/reorder', async (request, reply) => {
    try {
      const { id } = request.params as any;
      const body = (request.body as any) || {};
      const order: string[] = Array.isArray(body.order) ? body.order : [];
      await prisma.$transaction(async (tx) => {
        const t: any = tx as any;
        for (let idx = 0; idx < order.length; idx++) {
          const itemId = order[idx];
          await t.lessonPlanActivity.update({
            where: { id: itemId },
            data: { ord: idx + 1, lessonPlanId: id }
          });
        }
      });
      return { success: true };
    } catch (e) {
      reply.code(500);
      return { success: false, error: 'Erro ao reordenar atividades do plano' };
    }
  });
}
