import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '@/utils/database';

interface PlanParams { id: string }
interface PlanCoursesBody { add?: string[]; remove?: string[] }

// Minimal course view used by the UI
type CourseView = {
  id: string;
  name: string;
  description?: string | null;
  level?: string | null;
  duration?: number | null;
  isActive?: boolean | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export default async function planCoursesRoutes(app: FastifyInstance) {
  // GET /api/plans/:id/courses - list courses associated to a plan
  app.get('/plans/:id/courses', async (request: FastifyRequest<{ Params: PlanParams }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;

      // Try explicit join model first
      if ((prisma as any).planCourse) {
        const links = await (prisma as any).planCourse.findMany({
          where: { planId: id },
          include: { course: true },
        });
        if (links.length) {
          const courses: CourseView[] = (links as Array<{ course: CourseView }>)
            .map((l) => l.course)
            .filter((c) => c && (c.isActive ?? true));
          return reply.send({ success: true, data: courses });
        }
        // If there are no links, fall back to JSON features
      }

      // Fallback: association stored in billingPlan.features.courseIds (JSON)
      const plan = await prisma.billingPlan.findUnique({ where: { id } });
      if (!plan) {
        return reply.code(404).send({ success: false, message: 'Plano não encontrado' });
      }

      const features: any = (plan as any).features || {};
      const courseIds: string[] = Array.isArray(features.courseIds) ? features.courseIds : [];

      if (!courseIds.length) {
        return reply.send({ success: true, data: [] });
      }

      const courses = await prisma.course.findMany({
        where: { id: { in: courseIds } },
        orderBy: { name: 'asc' },
      });

      const activeCourses = (courses as any[]).filter((c: any) => c.isActive !== false);
      return reply.send({ success: true, data: activeCourses });
    } catch (error: any) {
      request.log.error({ err: error }, 'Failed to fetch courses for plan');
      return reply.code(500).send({ success: false, message: 'Failed to fetch plan courses', error: error.message });
    }
  });

  // POST /api/plans/:id/courses - add/remove associations (diff)
  app.post('/plans/:id/courses', async (request: FastifyRequest<{ Params: PlanParams; Body: PlanCoursesBody }>, reply: FastifyReply) => {
    const { id } = request.params;
    const body = request.body || {};
    const add = Array.isArray(body.add) ? body.add : [];
    const remove = Array.isArray(body.remove) ? body.remove : [];

    try {
      const planExists = await prisma.billingPlan.findUnique({ where: { id } });
      if (!planExists) {
        return reply.code(404).send({ success: false, message: 'Plano não encontrado' });
      }

      // Preferred: join model if available
      if ((prisma as any).planCourse) {
        await prisma.$transaction(async (tx) => {
          if (add.length) {
            await (tx as any).planCourse.createMany({
              data: add.map((courseId: string) => ({ planId: id, courseId })),
              skipDuplicates: true,
            });
          }
          if (remove.length) {
            for (const courseId of remove) {
              await (tx as any).planCourse.delete({ where: { planId_courseId: { planId: id, courseId } } });
            }
          }
        });

        // Mirror into features.courseIds so both strategies stay consistent
        try {
          const existing = await (prisma as any).planCourse.findMany({
            where: { planId: id },
            select: { courseId: true },
          });
          const nextIds = Array.from(new Set((existing as Array<{ courseId: string }>).map((r) => String(r.courseId))));
          const prevFeatures: any = (planExists as any).features || {};
          const updatedFeatures = { ...prevFeatures, courseIds: nextIds };
          await prisma.billingPlan.update({ where: { id }, data: { features: updatedFeatures } });
        } catch (mirrorErr) {
          request.log.warn({ err: mirrorErr }, 'Could not mirror plan-course links into features.courseIds');
        }

        return reply.send({ success: true, message: 'Associações atualizadas' });
      }

      // Fallback: update JSON features.courseIds on billingPlan
      const features: any = (planExists as any).features || {};
      const current: string[] = Array.isArray(features.courseIds) ? [...features.courseIds] : [];
      const toAdd = add.filter((cid) => !current.includes(cid));
      const next = current.filter((cid) => !remove.includes(cid)).concat(toAdd);

      const updatedFeatures = { ...features, courseIds: next };
      await prisma.billingPlan.update({ where: { id }, data: { features: updatedFeatures } });

      return reply.send({ success: true, message: 'Associações atualizadas' });
    } catch (error: any) {
      request.log.error({ err: error }, 'Failed to update plan-course associations');
      return reply.code(500).send({ success: false, message: 'Erro ao atualizar associações', error: error.message });
    }
  });
}
