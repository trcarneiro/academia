
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { courseController } from '../controllers/courseController';

// Middleware de autenticação (simulado)
async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Em um app real, isso verificaria o token JWT
    // await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
}

export async function coursesRoutes(app: FastifyInstance) {
  // Aplica o hook de autenticação para todas as rotas de cursos
  app.addHook('preHandler', authenticate);

  // Rotas CRUD para Cursos
  app.get('/', courseController.list);
  app.get('/:id', courseController.show);
  app.post('/', courseController.create);
  app.patch('/:id', courseController.update);
  app.delete('/:id', courseController.delete);
}

