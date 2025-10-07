import { FastifyPluginAsync } from 'fastify';
import { AgendaController } from '@/controllers/agendaController';

interface AgendaQuerystring {
  date?: string;
  startDate?: string;
  endDate?: string;
  instructor?: string;
  course?: string;
  status?: string;
  type?: string;
  limit?: string;
  offset?: string;
}

interface AgendaParams {
  id: string;
}

const agendaRoutes: FastifyPluginAsync = async (fastify) => {
  const agendaController = new AgendaController(fastify);

  // GET /api/agenda/classes - Buscar aulas por data
  fastify.get<{
    Querystring: AgendaQuerystring;
  }>('/classes', async (request, reply) => {
    try {
      const { date, startDate, endDate, instructor, course, status, type, limit = '50', offset = '0' } = request.query;
      const normalizedType = (type === 'CLASS' || type === 'PERSONAL_SESSION' || type === 'TURMA') ? type : undefined;
      
      const filters: any = {
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10)
      };
      if (date) filters.date = date;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      if (instructor) filters.instructor = instructor;
      if (course) filters.course = course;
      if (status) filters.status = status;
      if (normalizedType) filters.type = normalizedType;

      const classes = await agendaController.getClasses(filters);

      return reply.code(200).send(classes);
    } catch (error) {
  fastify.log.error({ err: error }, 'Error fetching agenda classes:');
      return reply.code(500).send({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  });

  // GET /api/agenda/stats - Estatísticas do dia
  fastify.get('/stats', async (_request, reply) => {
    try {
      const stats = await agendaController.getDayStats();
      return reply.code(200).send(stats);
    } catch (error) {
  fastify.log.error({ err: error }, 'Error fetching agenda stats:');
      return reply.code(500).send({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  });

  // GET /api/agenda/today - Aulas de hoje
  fastify.get('/today', async (_request, reply) => {
    try {
      const todayClasses = await agendaController.getTodayClasses();
      return reply.code(200).send(todayClasses);
    } catch (error) {
  fastify.log.error({ err: error }, 'Error fetching today classes:');
      return reply.code(500).send({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  });

  // GET /api/agenda/week - Aulas da semana
  fastify.get('/week', async (_request, reply) => {
    try {
      const weekClasses = await agendaController.getWeekClasses();
      return reply.code(200).send(weekClasses);
    } catch (error) {
  fastify.log.error({ err: error }, 'Error fetching week classes:');
      return reply.code(500).send({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  });

  // GET /api/agenda/instructors - Lista de instrutores
  fastify.get('/instructors', async (_request, reply) => {
    try {
      const instructors = await agendaController.getInstructors();
      return reply.code(200).send(instructors);
    } catch (error) {
  fastify.log.error({ err: error }, 'Error fetching instructors:');
      return reply.code(500).send({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  });

  // GET /api/agenda/courses - Lista de cursos
  fastify.get('/courses', async (_request, reply) => {
    try {
      const courses = await agendaController.getCourses();
      return reply.code(200).send(courses);
    } catch (error) {
  fastify.log.error({ err: error }, 'Error fetching courses:');
      return reply.code(500).send({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  });

  // PUT /api/agenda/class/:id/status - Atualizar status da aula
  fastify.put<{
    Params: AgendaParams;
    Body: { status: string };
  }>('/class/:id/status', async (request, reply) => {
    try {
      const { id } = request.params;
      const { status } = request.body;

      if (!status || !['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(status)) {
        return reply.code(400).send({
          success: false,
          error: 'Status inválido'
        });
      }

      const updatedClass = await agendaController.updateClassStatus(id, status);
      return reply.code(200).send(updatedClass);
    } catch (error) {
  fastify.log.error({ err: error }, 'Error updating class status:');
      return reply.code(500).send({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  });

  // GET /api/agenda/class/:id - Detalhes da aula
  fastify.get<{
    Params: AgendaParams;
  }>('/class/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const classDetails = await agendaController.getClassDetails(id);
      
      if (!classDetails.success) {
        return reply.code(404).send(classDetails);
      }

      return reply.code(200).send(classDetails);
    } catch (error) {
  fastify.log.error({ err: error }, 'Error fetching class details:');
      return reply.code(500).send({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  });

  // GET /api/agenda/schedule/:date - Agenda de uma data específica
  fastify.get<{
    Params: { date: string };
  }>('/schedule/:date', async (request, reply) => {
    try {
      const { date } = request.params;
      
      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return reply.code(400).send({
          success: false,
          error: 'Formato de data inválido. Use YYYY-MM-DD'
        });
      }

      const schedule = await agendaController.getScheduleByDate(date);
      return reply.code(200).send(schedule);
    } catch (error) {
  fastify.log.error({ err: error }, 'Error fetching schedule:');
      return reply.code(500).send({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  });

  // GET /api/agenda/turmas/schedules - Turmas com horários
  fastify.get('/turmas/schedules', async (_request, reply) => {
    try {
      const turmasWithSchedules = await agendaController.getTurmasWithSchedules();
      return reply.code(200).send(turmasWithSchedules);
    } catch (error) {
  fastify.log.error({ err: error }, 'Error fetching turmas schedules:');
      return reply.code(500).send({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  });

  // GET /api/agenda/checkins - Check-ins por data
  fastify.get<{
    Querystring: { date: string };
  }>('/checkins', async (request, reply) => {
    try {
      const { date } = request.query;
      
      if (!date) {
        return reply.code(400).send({
          success: false,
          error: 'Parâmetro date é obrigatório'
        });
      }

      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return reply.code(400).send({
          success: false,
          error: 'Formato de data inválido. Use YYYY-MM-DD'
        });
      }

      const checkins = await agendaController.getCheckinsByDate(date);
      return reply.code(200).send(checkins);
    } catch (error) {
  fastify.log.error({ err: error }, 'Error fetching checkins:');
      return reply.code(500).send({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  });
};

export default agendaRoutes;
