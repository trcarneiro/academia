import { FastifyInstance } from 'fastify';
import { fastifyActivityController } from '../controllers/fastifyActivityController';

export default async function activitiesRoutes(app: FastifyInstance) {
  // Main CRUD routes
  app.get('/', fastifyActivityController.getAll);
  app.get('/count', fastifyActivityController.getCount);
  app.get('/ids', fastifyActivityController.getAllIds);
  app.get('/:id', fastifyActivityController.getById);
  app.post('/', fastifyActivityController.create);
  app.put('/:id', fastifyActivityController.update);
  app.delete('/:id', fastifyActivityController.delete);
  
  // Health check
  app.get('/healthz/activities', async () => ({ ok: true }));
}
