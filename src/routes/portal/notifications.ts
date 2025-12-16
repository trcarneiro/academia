import { FastifyInstance } from 'fastify';
import { portalAuthMiddleware } from '@/middlewares/portalAuth';
import { prisma } from '@/utils/database';
import { ResponseHelper } from '@/utils/response';

export default async function portalNotificationsRoutes(fastify: FastifyInstance) {
    fastify.addHook('preHandler', portalAuthMiddleware);

    // List notifications
    fastify.get('/', async (request, reply) => {
        const studentId = request.studentId;
        if (!studentId) return ResponseHelper.error(reply, 'Aluno não identificado', 400);

        try {
            const notifications = await prisma.studentNotification.findMany({
                where: {
                    studentId,
                    dismissed: false
                },
                orderBy: [
                    { read: 'asc' },
                    { createdAt: 'desc' }
                ],
                take: 50
            });

            const unreadCount = await prisma.studentNotification.count({
                where: {
                    studentId,
                    read: false,
                    dismissed: false
                }
            });

            return ResponseHelper.success(reply, {
                notifications,
                unreadCount
            });
        } catch (error) {
            console.error(error);
            return ResponseHelper.error(reply, 'Erro ao buscar notificações', 500);
        }
    });

    // Mark as read
    fastify.post('/:id/read', async (request, reply) => {
        const studentId = request.studentId;
        const { id } = request.params as { id: string };
        if (!studentId) return ResponseHelper.error(reply, 'Aluno não identificado', 400);

        try {
            await prisma.studentNotification.update({
                where: {
                    id,
                    studentId // Ensure ownership
                },
                data: {
                    read: true,
                    readAt: new Date()
                }
            });

            return ResponseHelper.success(reply, { message: 'Notificação marcada como lida' });
        } catch (error) {
            return ResponseHelper.error(reply, 'Notificação não encontrada', 404);
        }
    });

    // Mark all as read
    fastify.post('/read-all', async (request, reply) => {
        const studentId = request.studentId;
        if (!studentId) return ResponseHelper.error(reply, 'Aluno não identificado', 400);

        try {
            await prisma.studentNotification.updateMany({
                where: {
                    studentId,
                    read: false
                },
                data: {
                    read: true,
                    readAt: new Date()
                }
            });

            return ResponseHelper.success(reply, { message: 'Todas as notificações marcadas como lidas' });
        } catch (error) {
            console.error(error);
            return ResponseHelper.error(reply, 'Erro ao atualizar notificações', 500);
        }
    });
}