import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function billingPlansRoutes(fastify: FastifyInstance) {
  fastify.get('/api/billing-plans', async (_request, reply) => {
    try {
      const plans = await prisma.billingPlan.findMany({
        where: { isActive: true },
      });
      reply.send({ success: true, data: plans });
    } catch (error) {
      reply.status(500).send({ success: false, error: 'Failed to fetch billing plans' });
    }
  });

  // Get courses associated with a plan
  fastify.get('/plans/:id/courses', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      // Use raw query fallback if prisma.planCourse not yet generated
      let courses: any[] = [];
      if ((prisma as any).planCourse) {
        const planCourses = await (prisma as any).planCourse.findMany({
          where: { planId: id },
          include: { course: true }
        });
        courses = planCourses.map((pc: any) => pc.course).filter((c: any) => c.isActive);
      } else {
        const rows: any = await prisma.$queryRawUnsafe(`SELECT c.* FROM plan_courses pc JOIN courses c ON c.id = pc.course_id WHERE pc.plan_id = $1`, id);
        courses = rows.filter((c: any) => c.is_active !== false);
      }
      reply.send({ success: true, data: courses });
    } catch (error: any) {
      reply.status(500).send({ success: false, message: 'Erro ao buscar cursos do plano', error: error.message });
    }
  });

  // Update (diff) courses associated with a plan
  fastify.post('/plans/:id/courses', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { add?: string[]; remove?: string[] };
    const add = Array.isArray(body.add) ? body.add : [];
    const remove = Array.isArray(body.remove) ? body.remove : [];
    try {
      const planExists = await prisma.billingPlan.findUnique({ where: { id } });
      if (!planExists) return reply.status(404).send({ success: false, message: 'Plano não encontrado' });

      await prisma.$transaction(async (tx) => {
        if (add.length) {
          if ((tx as any).planCourse) {
            await (tx as any).planCourse.createMany({ data: add.map(courseId => ({ planId: id, courseId })), skipDuplicates: true });
          } else {
            for (const courseId of add) {
              await tx.$executeRawUnsafe(`INSERT INTO plan_courses (plan_id, course_id, created_at) VALUES ($1,$2, NOW()) ON CONFLICT DO NOTHING`, id, courseId);
            }
          }
        }
        if (remove.length) {
            if ((tx as any).planCourse) {
              for (const courseId of remove) {
                await (tx as any).planCourse.delete({ where: { planId_courseId: { planId: id, courseId } } });
              }
            } else {
              for (const courseId of remove) {
                await tx.$executeRawUnsafe(`DELETE FROM plan_courses WHERE plan_id = $1 AND course_id = $2`, id, courseId);
              }
            }
        }
      });

      reply.send({ success: true, message: 'Associações atualizadas' });
    } catch (error: any) {
      reply.status(500).send({ success: false, message: 'Erro ao atualizar associações', error: error.message });
    }
  });

  // Update plan
  fastify.put('/api/billing-plans/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = request.body as any;
    
    try {
      const updatedPlan = await prisma.billingPlan.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          price: data.price,
          billingType: data.billingType,
          category: data.category,
          classesPerWeek: data.classesPerWeek,
          hasPersonalTraining: data.hasPersonalTraining,
          hasNutrition: data.hasNutrition,
          allowFreeze: data.allowFreeze
        }
      });
      reply.send({ success: true, data: updatedPlan });
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: 'Failed to update plan',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}
