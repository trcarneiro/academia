import { FastifyInstance } from 'fastify';
import { prisma } from '@/utils/database';
import { z } from 'zod';

export default async function portalNotificationsRoutes(fastify: FastifyInstance) {
    // List notifications
    fastify.get('/', async (request, reply) => {
        // @ts-ignore
        const studentId = request.user.id;

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

        return reply.send({
            success: true,
            notifications,
            unreadCount
        });
    });

    // Mark as read
    fastify.post('/:id/read', async (request, reply) => {
        // @ts-ignore
        const studentId = request.user.id;
        const { id } = request.params as { id: string };

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

            return reply.send({ success: true });
        } catch (error) {
            return reply.status(404).send({
                success: false,
                message: 'Notificação não encontrada'
            });
        }
    });

    // Mark all as read
    fastify.post('/read-all', async (request, reply) => {
        // @ts-ignore
        const studentId = request.user.id;

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

        return reply.send({ success: true });
    });
}