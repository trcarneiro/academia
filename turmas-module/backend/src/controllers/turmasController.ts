import { FastifyReply, FastifyRequest } from 'fastify';
import { TurmasService } from '../services/turmasService';

export class TurmasController {
    private turmasService: TurmasService;

    constructor() {
        this.turmasService = new TurmasService();
    }

    async executeSchedule(request: FastifyRequest, reply: FastifyReply) {
        const { startDate } = request.body;

        try {
            const schedule = await this.turmasService.executeSchedule(startDate);
            reply.send({ success: true, data: schedule });
        } catch (error) {
            window.app.handleError(error, 'TurmasController.executeSchedule');
            reply.status(500).send({ success: false, message: 'Failed to execute schedule' });
        }
    }

    async trackAttendance(request: FastifyRequest, reply: FastifyReply) {
        const { classId, studentId, positionExecuted } = request.body;

        try {
            const attendanceRecord = await this.turmasService.trackAttendance(classId, studentId, positionExecuted);
            reply.send({ success: true, data: attendanceRecord });
        } catch (error) {
            window.app.handleError(error, 'TurmasController.trackAttendance');
            reply.status(500).send({ success: false, message: 'Failed to track attendance' });
        }
    }
}