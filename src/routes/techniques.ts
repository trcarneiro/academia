import { FastifyInstance } from 'fastify';
import {
  CreateTechniqueSchema,
  TechniqueIdParamSchema,
  TechniqueSearchQuerySchema,
  UpdateTechniqueSchema,
  LinkTechniqueToEducationalPlanSchema,
  LinkTechniqueToLessonPlanSchema,
} from '../schemas/techniques';
import TechniquesService from '../services/techniquesService';

export default async function techniquesRoutes(app: FastifyInstance) {
  // List with filters/pagination
  app.get('/api/techniques', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          q: { type: 'string' },
          category: { type: 'string' },
          subcategory: { type: 'string' },
          modality: { type: 'string' },
          complexity: { type: 'string' },
          minDuration: { type: 'integer' },
          maxDuration: { type: 'integer' },
          minGroupSize: { type: 'integer' },
          maxGroupSize: { type: 'integer' },
          tag: { type: 'string' },
          bncc: { type: 'string' },
          skill: { type: 'string' },
          page: { type: 'integer', default: 1 },
          limit: { type: 'integer', default: 20 },
        },
        additionalProperties: false,
        required: [], // explicit empty array to satisfy AJV "data/required must be array"
      },
    },
  }, async (req, reply) => {
    try {
      const parse = TechniqueSearchQuerySchema.safeParse(req.query);
      if (!parse.success) {
        return reply.status(400).send({ success: false, error: parse.error.message, code: 'VALIDATION_ERROR' });
      }
      
      console.log('🔍 Techniques endpoint called with query:', parse.data);
      const result = await TechniquesService.list(parse.data);
      console.log('📊 Service returned:', {
        success: result.success,
        techniqueCount: result.data?.techniques?.length || 0,
        hasData: !!result.data,
        firstTechniqueKeys: result.data?.techniques?.[0] ? Object.keys(result.data.techniques[0]) : 'no techniques'
      });
      
      // Ensure we always have a valid response structure
      if (!result.success || !result.data) {
        return reply.status(500).send({ success: false, error: 'Failed to fetch techniques' });
      }
      
      return reply.send(result);
    } catch (error) {
      console.error('❌ Error in techniques endpoint:', error);
      return reply.status(500).send({ success: false, error: 'Internal server error' });
    }
  });

  // Simple search endpoint (q param)
  app.get('/api/techniques/search', async (req, reply) => {
    const { q = '', page = 1, limit = 20 } = req.query as any;
    const result = await TechniquesService.search(q, Number(page), Number(limit));
    return reply.send(result);
  });

  // Get by id
  app.get('/api/techniques/:id', async (req, reply) => {
    const parse = TechniqueIdParamSchema.safeParse(req.params);
    if (!parse.success) {
      return reply.status(400).send({ success: false, error: parse.error.message, code: 'VALIDATION_ERROR' });
    }
    const result = await TechniquesService.getById(parse.data.id);
    const status = (result as any).success ? 200 : 404;
    return reply.status(status).send(result);
  });

  // Create
  app.post('/api/techniques', {
    schema: {
      body: {
        type: 'object',
        additionalProperties: true,
        required: [], // avoid Fastify/AJV "required must be array" when empty
      },
    },
  }, async (req, reply) => {
    const parse = CreateTechniqueSchema.safeParse(req.body);
    if (!parse.success) {
      return reply.status(400).send({ success: false, error: parse.error.message, code: 'VALIDATION_ERROR' });
    }
    const result = await TechniquesService.create(parse.data);
    const status = (result as any).success ? 201 : 409;
    return reply.status(status).send(result);
  });

  // Update
  app.put('/api/techniques/:id', async (req, reply) => {
    const pParams = TechniqueIdParamSchema.safeParse(req.params);
    if (!pParams.success) {
      return reply.status(400).send({ success: false, error: pParams.error.message, code: 'VALIDATION_ERROR' });
    }
    const pBody = UpdateTechniqueSchema.safeParse(req.body);
    if (!pBody.success) {
      return reply.status(400).send({ success: false, error: pBody.error.message, code: 'VALIDATION_ERROR' });
    }
    const result = await TechniquesService.update(pParams.data.id, pBody.data);
    return reply.send(result);
  });

  // Delete
  app.delete('/api/techniques/:id', {
    schema: {
      params: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id'],
        additionalProperties: false
      }
    }
  }, async (req, reply) => {
    const parse = TechniqueIdParamSchema.safeParse(req.params);
    if (!parse.success) {
      return reply.status(400).send({ success: false, error: parse.error.message, code: 'VALIDATION_ERROR' });
    }
    const result = await TechniquesService.remove(parse.data.id);
    return reply.send(result);
  });

  // Link to EducationalPlan
  app.post('/api/techniques/:id/link-educational-plan', {
    schema: {
      params: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id'],
        additionalProperties: false
      },
      body: {
        type: 'object',
        additionalProperties: true,
        required: [],
      }
    }
  }, async (req, reply) => {
    const pParams = TechniqueIdParamSchema.safeParse(req.params);
    const pBody = LinkTechniqueToEducationalPlanSchema.safeParse(req.body);
    if (!pParams.success) {
      return reply.status(400).send({ success: false, error: pParams.error.message, code: 'VALIDATION_ERROR' });
    }
    if (!pBody.success) {
      return reply.status(400).send({ success: false, error: pBody.error.message, code: 'VALIDATION_ERROR' });
    }
    const linkPayload: {
      techniqueId: string;
      educationalPlanId: string;
      order?: number;
      notes?: string;
    } = {
      techniqueId: pParams.data.id,
      educationalPlanId: pBody.data.educationalPlanId,
      order: pBody.data.order,
    };
    if (typeof (pBody.data as any).notes === 'string') {
      linkPayload.notes = (pBody.data as any).notes;
    }
    const result = await TechniquesService.linkToEducationalPlan(linkPayload);
    const status = (result as any).success ? 200 : 404;
    return reply.status(status).send(result);
  });

  // Link to LessonPlan
  app.post('/api/techniques/:id/link-lesson-plan', {
    schema: {
      params: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id'],
        additionalProperties: false
      },
      body: {
        type: 'object',
        additionalProperties: true,
        required: [],
      }
    }
  }, async (req, reply) => {
    const pParams = TechniqueIdParamSchema.safeParse(req.params);
    const pBody = LinkTechniqueToLessonPlanSchema.safeParse(req.body);
    if (!pParams.success) {
      return reply.status(400).send({ success: false, error: pParams.error.message, code: 'VALIDATION_ERROR' });
    }
    if (!pBody.success) {
      return reply.status(400).send({ success: false, error: pBody.error.message, code: 'VALIDATION_ERROR' });
    }
    const linkLessonPayload: {
      techniqueId: string;
      lessonPlanId: string;
      order?: number;
      allocationMinutes?: number;
      objectiveMapping?: string[];
    } = {
      techniqueId: pParams.data.id,
      lessonPlanId: pBody.data.lessonPlanId,
    };
    if (typeof (pBody.data as any).order === 'number') linkLessonPayload.order = (pBody.data as any).order;
    if (typeof (pBody.data as any).allocationMinutes === 'number') linkLessonPayload.allocationMinutes = (pBody.data as any).allocationMinutes;
    if (Array.isArray((pBody.data as any).objectiveMapping)) linkLessonPayload.objectiveMapping = (pBody.data as any).objectiveMapping as string[];
    const result = await TechniquesService.linkToLessonPlan(linkLessonPayload);
    const status = (result as any).success ? 200 : 404;
    return reply.status(status).send(result);
  });
}
