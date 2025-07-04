import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import FinancialResponsibleService from '../services/financialResponsibleService';
import { prisma } from '@/utils/database';

// Helper function to get organization ID dynamically
async function getOrganizationId(): Promise<string> {
  const org = await prisma.organization.findFirst();
  if (!org) {
    throw new Error('No organization found');
  }
  return org.id;
}

// Schemas de validação
const createFinancialResponsibleSchema = z.object({
  name: z.string().min(1),
  cpfCnpj: z.string().min(11),
  email: z.string().email(),
  phone: z.string().optional(),
  birthDate: z.string().datetime().optional(),
  address: z.string().optional(),
  addressNumber: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  relationshipType: z.string().optional()
});

const importAsaasCustomerSchema = z.object({
  asaasCustomerId: z.string().min(1),
  relationshipType: z.string().optional(),
  studentIds: z.array(z.string().uuid()).optional()
});

const associateStudentsSchema = z.object({
  studentIds: z.array(z.string().uuid())
});

export default async function financialResponsibleRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  
  // ==========================================
  // FINANCIAL RESPONSIBLE MANAGEMENT
  // ==========================================

  // GET /api/financial-responsible - Listar responsáveis financeiros
  fastify.get('/', {
    schema: {
      description: 'List financial responsibles',
      tags: ['Financial Responsible'],
      querystring: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string' },
          cpfCnpj: { type: 'string' },
          isActive: { type: 'boolean' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const organizationId = await getOrganizationId();
      const service = new FinancialResponsibleService(organizationId);
      
      const { name, email, cpfCnpj, isActive } = request.query as any;
      const filters: any = {};
      
      if (name) filters.name = { contains: name, mode: 'insensitive' };
      if (email) filters.email = { contains: email, mode: 'insensitive' };
      if (cpfCnpj) filters.cpfCnpj = cpfCnpj;
      if (isActive !== undefined) filters.isActive = isActive;

      const responsibles = await service.listFinancialResponsibles(filters);

      return {
        success: true,
        data: responsibles
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: 'Failed to fetch financial responsibles',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // POST /api/financial-responsible - Criar responsável financeiro
  fastify.post('/', {
    schema: {
      description: 'Create financial responsible',
      tags: ['Financial Responsible'],
      body: {
        type: 'object',
        required: ['name', 'cpfCnpj', 'email'],
        properties: {
          name: { type: 'string' },
          cpfCnpj: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          birthDate: { type: 'string', format: 'date-time' },
          address: { type: 'string' },
          addressNumber: { type: 'string' },
          complement: { type: 'string' },
          neighborhood: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
          zipCode: { type: 'string' },
          relationshipType: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const organizationId = await getOrganizationId();
      const service = new FinancialResponsibleService(organizationId);
      
      const validatedData = createFinancialResponsibleSchema.parse(request.body);
      const data = {
        ...validatedData,
        birthDate: validatedData.birthDate ? new Date(validatedData.birthDate) : undefined
      };
      
      const responsible = await service.createFinancialResponsible(data);

      return {
        success: true,
        data: responsible,
        message: 'Financial responsible created successfully'
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: 'Failed to create financial responsible',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // GET /api/financial-responsible/:id - Buscar responsável específico
  fastify.get('/:id', {
    schema: {
      description: 'Get financial responsible by ID',
      tags: ['Financial Responsible'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      }
    }
  }, async (request, reply) => {
    try {
      const organizationId = await getOrganizationId();
      const service = new FinancialResponsibleService(organizationId);
      
      const { id } = request.params as { id: string };
      const responsible = await service.getFinancialResponsible(id);

      if (!responsible) {
        reply.code(404);
        return {
          success: false,
          error: 'Financial responsible not found'
        };
      }

      return {
        success: true,
        data: responsible
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: 'Failed to fetch financial responsible',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // GET /api/financial-responsible/:id/summary - Resumo financeiro
  fastify.get('/:id/summary', {
    schema: {
      description: 'Get financial responsible summary',
      tags: ['Financial Responsible'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      }
    }
  }, async (request, reply) => {
    try {
      const organizationId = await getOrganizationId();
      const service = new FinancialResponsibleService(organizationId);
      
      const { id } = request.params as { id: string };
      const summary = await service.getFinancialSummary(id);

      return {
        success: true,
        data: summary
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: 'Failed to fetch financial summary',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // ==========================================
  // ASAAS INTEGRATION
  // ==========================================

  // GET /api/financial-responsible/asaas/customers - Listar clientes do Asaas
  fastify.get('/asaas/customers', {
    schema: {
      description: 'List Asaas customers',
      tags: ['Financial Responsible'],
      querystring: {
        type: 'object',
        properties: {
          offset: { type: 'number' },
          limit: { type: 'number' },
          name: { type: 'string' },
          email: { type: 'string' },
          cpfCnpj: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const organizationId = await getOrganizationId();
      const service = new FinancialResponsibleService(organizationId);
      
      const params = request.query as any;
      const customers = await service.listAsaasCustomers(params);

      return {
        success: true,
        data: customers
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: 'Failed to fetch Asaas customers',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // POST /api/financial-responsible/asaas/import - Importar cliente do Asaas
  fastify.post('/asaas/import', {
    schema: {
      description: 'Import customer from Asaas',
      tags: ['Financial Responsible'],
      body: {
        type: 'object',
        required: ['asaasCustomerId'],
        properties: {
          asaasCustomerId: { type: 'string' },
          relationshipType: { type: 'string' },
          studentIds: {
            type: 'array',
            items: { type: 'string', format: 'uuid' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const organizationId = await getOrganizationId();
      const service = new FinancialResponsibleService(organizationId);
      
      const validatedData = importAsaasCustomerSchema.parse(request.body);
      const responsible = await service.importAsaasCustomer(validatedData);

      return {
        success: true,
        data: responsible,
        message: 'Customer imported successfully from Asaas'
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: 'Failed to import customer from Asaas',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // ==========================================
  // STUDENTS ASSOCIATION
  // ==========================================

  // POST /api/financial-responsible/:id/students - Associar estudantes
  fastify.post('/:id/students', {
    schema: {
      description: 'Associate students to financial responsible',
      tags: ['Financial Responsible'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        required: ['studentIds'],
        properties: {
          studentIds: {
            type: 'array',
            items: { type: 'string', format: 'uuid' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const organizationId = await getOrganizationId();
      const service = new FinancialResponsibleService(organizationId);
      
      const { id } = request.params as { id: string };
      const { studentIds } = associateStudentsSchema.parse(request.body);
      
      await service.associateStudents(id, studentIds);

      return {
        success: true,
        message: 'Students associated successfully'
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: 'Failed to associate students',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // DELETE /api/financial-responsible/students/:studentId - Remover associação
  fastify.delete('/students/:studentId', {
    schema: {
      description: 'Remove student association',
      tags: ['Financial Responsible'],
      params: {
        type: 'object',
        properties: {
          studentId: { type: 'string', format: 'uuid' }
        },
        required: ['studentId']
      }
    }
  }, async (request, reply) => {
    try {
      const organizationId = await getOrganizationId();
      const service = new FinancialResponsibleService(organizationId);
      
      const { studentId } = request.params as { studentId: string };
      await service.removeStudentAssociation(studentId);

      return {
        success: true,
        message: 'Student association removed successfully'
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: 'Failed to remove student association',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });
}