import { FastifyInstance } from 'fastify';
import { prisma } from '@/utils/database';
import { authenticateToken, instructorOrAdmin, allRoles } from '@/middlewares/auth';

export default async function assessmentsRoutes(app: FastifyInstance) {
  const db: any = prisma as any;

  // === Assessment Definitions ===
  app.get('/definitions', { preHandler: [authenticateToken, allRoles] }, async (request, reply) => {
    try {
      const q = (request.query as any) || {};
      const where: any = {};
      if (q.courseId) where.courseId = q.courseId;
      const items = await db.assessmentDefinition.findMany({ where, orderBy: { name: 'asc' } });
      return { success: true, data: items };
    } catch (e) {
      reply.code(500); return { success: false, error: 'Failed to list assessment definitions' };
    }
  });

  app.post('/definitions', { preHandler: [authenticateToken, instructorOrAdmin] }, async (request, reply) => {
    try {
      const body = (request.body as any) || {};
      const created = await db.assessmentDefinition.create({ data: {
        courseId: body.courseId,
        name: body.name,
        type: body.type || 'TECHNICAL',
        when: body.when ?? null,
        rubricId: body.rubricId ?? null,
      }});
      reply.code(201); return { success: true, data: created };
    } catch (e) {
      reply.code(500); return { success: false, error: 'Failed to create assessment definition' };
    }
  });

  app.get('/definitions/:id', { preHandler: [authenticateToken, allRoles] }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const item = await db.assessmentDefinition.findUnique({ where: { id }, include: { rubric: true } });
      if (!item) { reply.code(404); return { success: false, error: 'Not found' }; }
      return { success: true, data: item };
    } catch (e) {
      reply.code(500); return { success: false, error: 'Failed to get assessment definition' };
    }
  });

  app.put('/definitions/:id', { preHandler: [authenticateToken, instructorOrAdmin] }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const body = (request.body as any) || {};
      const updated = await db.assessmentDefinition.update({ where: { id }, data: body });
      return { success: true, data: updated };
    } catch (e) {
      reply.code(500); return { success: false, error: 'Failed to update assessment definition' };
    }
  });

  app.delete('/definitions/:id', { preHandler: [authenticateToken, instructorOrAdmin] }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      await db.assessmentDefinition.delete({ where: { id } });
      return { success: true };
    } catch (e) {
      reply.code(500); return { success: false, error: 'Failed to delete assessment definition' };
    }
  });

  // === Assessment Attempts ===
  app.get('/attempts', { preHandler: [authenticateToken, allRoles] }, async (request, reply) => {
    try {
      const q = (request.query as any) || {};
      const where: any = {};
      if (q.assessmentId) where.assessmentId = q.assessmentId;
      if (q.studentId) where.studentId = q.studentId;
      if (q.classId) where.classId = q.classId;
      const items = await db.assessmentAttempt.findMany({ where, orderBy: { startedAt: 'desc' } });
      return { success: true, data: items };
    } catch (e) {
      reply.code(500); return { success: false, error: 'Failed to list assessment attempts' };
    }
  });

  app.post('/attempts', { preHandler: [authenticateToken, instructorOrAdmin] }, async (request, reply) => {
    try {
      const b = (request.body as any) || {};
      const created = await db.assessmentAttempt.create({ data: {
        assessmentId: b.assessmentId,
        studentId: b.studentId,
        classId: b.classId ?? null,
        evaluatorId: b.evaluatorId ?? null,
        startedAt: b.startedAt ?? new Date(),
        details: b.details ?? null,
      }});
      reply.code(201); return { success: true, data: created };
    } catch (e) {
      reply.code(500); return { success: false, error: 'Failed to create assessment attempt' };
    }
  });

  app.put('/attempts/:id', { preHandler: [authenticateToken, instructorOrAdmin] }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const b = (request.body as any) || {};
      const updated = await db.assessmentAttempt.update({ where: { id }, data: b });
      return { success: true, data: updated };
    } catch (e) {
      reply.code(500); return { success: false, error: 'Failed to update assessment attempt' };
    }
  });

  app.post('/attempts/:id/complete', { preHandler: [authenticateToken, instructorOrAdmin] }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const b = (request.body as any) || {};
      const updated = await db.assessmentAttempt.update({ where: { id }, data: {
        completedAt: new Date(),
        scoreTotal: b.scoreTotal ?? null,
        details: b.details ?? null,
      }});
      return { success: true, data: updated };
    } catch (e) {
      reply.code(500); return { success: false, error: 'Failed to complete assessment attempt' };
    }
  });
}
