import { FastifyInstance } from 'fastify';
import { lessonPlanController } from '../controllers/lessonPlanController';

// Middleware de autenticação (simulado)
async function authenticate(_request: any, reply: any) {
  try {
    // Em um app real, isso verificaria o token JWT
    // await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
}

export async function lessonPlansRoutes(app: FastifyInstance) {
  // Aplica o hook de autenticação para todas as rotas de lesson plans
  app.addHook('preHandler', authenticate);

  // Main CRUD routes
  app.get('/', lessonPlanController.getAll);
  app.get('/:id', lessonPlanController.getById);
  app.post('/', lessonPlanController.create);
  app.put('/:id', lessonPlanController.update);
  app.delete('/:id', lessonPlanController.delete);
  
  // Import route
  app.post('/import', lessonPlanController.import);
  
  // Activity management routes
  app.get('/:id/activities', lessonPlanController.getActivities);
  app.post('/:id/activities', lessonPlanController.addActivity);
  app.delete('/:id/activities/:activityId', lessonPlanController.removeActivity);
}
