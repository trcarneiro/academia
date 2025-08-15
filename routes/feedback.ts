import { FastifyInstance } from 'fastify';
import { prisma } from '@/utils/database';
import { authenticateToken, instructorOrAdmin, allRoles } from '@/middlewares/auth';

export default async function feedbackRoutes(app: FastifyInstance) {
  const db: any = prisma as any;

  // === Lesson Feedback ===
  app.get('/lessons', { preHandler: [authenticateToken, allRoles] }, async (request, reply) => {
    try {
      const q = (request.query as any) || {};
      const where: any = {};
      if (q.classId) where.classId = q.classId;
      if (q.studentId) where.studentId = q.studentId;
      const items = await db.feedbackLesson.findMany({ where, orderBy: { createdAt: 'desc' } });
      return { success: true, data: items };
    } catch (e) { reply.code(500); return { success: false, error: 'Failed to list lesson feedback' }; }
  });

  app.post('/lessons', { preHandler: [authenticateToken, allRoles] }, async (request, reply) => {
    try {
      const b = (request.body as any) || {};
      const created = await db.feedbackLesson.create({ data: {
        classId: b.classId,
        studentId: b.studentId,
        rating: b.rating,
        mood: b.mood ?? null,
        comment: b.comment ?? null,
      }});
      reply.code(201); return { success: true, data: created };
    } catch (e) { reply.code(500); return { success: false, error: 'Failed to create lesson feedback' }; }
  });

  app.put('/lessons/:id', { preHandler: [authenticateToken, allRoles] }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const b = (request.body as any) || {};
      const updated = await db.feedbackLesson.update({ where: { id }, data: b });
      return { success: true, data: updated };
    } catch (e) { reply.code(500); return { success: false, error: 'Failed to update lesson feedback' }; }
  });

  app.delete('/lessons/:id', { preHandler: [authenticateToken, instructorOrAdmin] }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      await db.feedbackLesson.delete({ where: { id } });
      return { success: true };
    } catch (e) { reply.code(500); return { success: false, error: 'Failed to delete lesson feedback' }; }
  });

  // === Activity Feedback ===
  app.get('/activities', { preHandler: [authenticateToken, allRoles] }, async (request, reply) => {
    try {
      const q = (request.query as any) || {};
      const where: any = {};
      if (q.classActivityId) where.classActivityId = q.classActivityId;
      if (q.studentId) where.studentId = q.studentId;
      const items = await db.feedbackActivity.findMany({ where, orderBy: { createdAt: 'desc' } });
      return { success: true, data: items };
    } catch (e) { reply.code(500); return { success: false, error: 'Failed to list activity feedback' }; }
  });

  app.post('/activities', { preHandler: [authenticateToken, allRoles] }, async (request, reply) => {
    try {
      const b = (request.body as any) || {};
      const created = await db.feedbackActivity.create({ data: {
        classActivityId: b.classActivityId,
        studentId: b.studentId,
        rating: b.rating,
        perceivedDifficulty: b.perceivedDifficulty ?? null,
        comment: b.comment ?? null,
      }});
      reply.code(201); return { success: true, data: created };
    } catch (e) { reply.code(500); return { success: false, error: 'Failed to create activity feedback' }; }
  });

  app.put('/activities/:id', { preHandler: [authenticateToken, allRoles] }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const b = (request.body as any) || {};
      const updated = await db.feedbackActivity.update({ where: { id }, data: b });
      return { success: true, data: updated };
    } catch (e) { reply.code(500); return { success: false, error: 'Failed to update activity feedback' }; }
  });

  app.delete('/activities/:id', { preHandler: [authenticateToken, instructorOrAdmin] }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      await db.feedbackActivity.delete({ where: { id } });
      return { success: true };
    } catch (e) { reply.code(500); return { success: false, error: 'Failed to delete activity feedback' }; }
  });
}
