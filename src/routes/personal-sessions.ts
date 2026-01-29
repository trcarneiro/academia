import { FastifyInstance } from 'fastify';
import { PersonalSessionsController } from '../controllers/personalSessionsController';

async function personalSessionsRoutes(fastify: FastifyInstance) {
  // GET /api/personal-sessions - Listar sessões
  fastify.get('/', PersonalSessionsController.list);

  // GET /api/personal-sessions/:id - Obter sessão por ID
  fastify.get('/:id', PersonalSessionsController.getById);

  // POST /api/personal-sessions - Criar nova sessão
  fastify.post('/', PersonalSessionsController.create);

  // PUT /api/personal-sessions/:id/cancel - Cancelar sessão
  fastify.put('/:id/cancel', PersonalSessionsController.cancel);

  // PUT /api/personal-sessions/:id/confirm-attendance - Confirmar presença
  fastify.put('/:id/confirm-attendance', PersonalSessionsController.confirmAttendance);

  // DELETE /api/personal-sessions/:id - Excluir sessão
  fastify.delete('/:id', PersonalSessionsController.delete);

  // TODO: Implement update and reschedule methods in controller if needed
  // fastify.put('/:id', PersonalSessionsController.update);
  // fastify.put('/:id/reschedule', PersonalSessionsController.reschedule);
}

export default personalSessionsRoutes;