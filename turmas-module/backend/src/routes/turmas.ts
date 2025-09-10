import { FastifyInstance } from 'fastify';
import { TurmasController } from '../controllers/turmasController';

export default async function turmasRoutes(fastify: FastifyInstance) {
    const turmasController = new TurmasController();

    fastify.post('/turmas/schedule', async (request, reply) => {
        try {
            const { startDate } = request.body;
            const result = await turmasController.executeSchedule(startDate);
            reply.send(result);
        } catch (error) {
            reply.status(500).send({ error: 'Failed to execute schedule' });
        }
    });

    fastify.post('/turmas/attendance', async (request, reply) => {
        try {
            const { classId, studentId, position } = request.body;
            const result = await turmasController.trackAttendance(classId, studentId, position);
            reply.send(result);
        } catch (error) {
            reply.status(500).send({ error: 'Failed to track attendance' });
        }
    });
}