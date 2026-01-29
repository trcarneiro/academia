import { FastifyInstance } from 'fastify';
import { portalAuthMiddleware } from '@/middlewares/portalAuth';
import prisma from '@/utils/prisma';
import { ResponseHelper } from '@/utils/response';
import { logger } from '@/utils/logger';

export default async function adminBroadcastRoutes(fastify: FastifyInstance) {
    fastify.addHook('preHandler', portalAuthMiddleware);

    // List all broadcasts for the organization
    fastify.get('/', async (request, reply) => {
        try {
            const organizationId = request.organizationId;
            const studentId = (request as any).studentId;
            if (!organizationId) return ResponseHelper.error(reply, 'Organização não identificada', 400);

            // Fetch user via student to check role
            const student = await prisma.student.findUnique({
                where: { id: studentId },
                include: { user: true }
            });

            if (!student || (student.user.role !== 'ADMIN' && student.user.role !== 'SUPER_ADMIN')) {
                return ResponseHelper.error(reply, 'Acesso negado: Apenas administradores podem acessar esta área', 403);
            }

            const broadcasts = await (prisma as any).broadcast.findMany({
                where: { organizationId },
                orderBy: { createdAt: 'desc' },
                include: {
                    author: {
                        select: {
                            firstName: true,
                            lastName: true
                        }
                    }
                }
            });

            return ResponseHelper.success(reply, broadcasts);
        } catch (error) {
            logger.error('Error fetching broadcasts:', error);
            return ResponseHelper.error(reply, 'Erro ao buscar broadcasts', 500);
        }
    });

    // Create a new broadcast
    fastify.post('/', async (request, reply) => {
        try {
            const organizationId = request.organizationId;
            const studentId = (request as any).studentId;
            const { title, message, segment, channels } = request.body as any;

            if (!organizationId) return ResponseHelper.error(reply, 'Organização não identificada', 400);

            // Fetch user via student
            const student = await prisma.student.findUnique({
                where: { id: studentId },
                include: { user: true }
            });

            if (!student || (student.user.role !== 'ADMIN' && student.user.role !== 'SUPER_ADMIN')) {
                return ResponseHelper.error(reply, 'Acesso negado', 403);
            }

            // Simplified broadcast creation
            const broadcast = await (prisma as any).broadcast.create({
                data: {
                    organizationId,
                    title,
                    message,
                    segment,
                    channels: channels || ['PUSH'],
                    status: 'COMPLETED',
                    sentAt: new Date(),
                    authorId: student.userId,
                    stats: { sent: 0 }
                }
            });

            // Trigger notification creation for students (background-ish)
            // This is a simplified version, ideally handled by a worker
            let studentWhere: any = { organizationId, isActive: true };
            if (segment === 'ACTIVE') studentWhere.isActive = true; // Placeholder for real status filter
            if (segment === 'INACTIVE') studentWhere.isActive = false;

            const targetStudents = await prisma.student.findMany({ where: studentWhere });

            if (targetStudents.length > 0) {
                await prisma.studentNotification.createMany({
                    data: targetStudents.map(s => ({
                        studentId: s.id,
                        title,
                        message,
                        type: 'MARKETING' as any,
                        priority: 'NORMAL' as any,
                        read: false,
                        metadata: { broadcastId: broadcast.id } as any
                    }))
                });

                await (prisma as any).broadcast.update({
                    where: { id: broadcast.id },
                    data: { stats: { sent: targetStudents.length } }
                });
            }

            return ResponseHelper.success(reply, broadcast);
        } catch (error) {
            logger.error('Error creating broadcast:', error);
            return ResponseHelper.error(reply, 'Erro ao criar broadcast', 500);
        }
    });
}
