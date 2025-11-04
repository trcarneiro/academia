import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { prisma } from '@/utils/database';
import { z } from 'zod';
import { requireOrganizationId } from '@/utils/tenantHelpers';

// Validation schemas
const createUnitSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  address: z.string().min(1),
  addressNumber: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(2).max(2),
  zipCode: z.string().min(8).max(9),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  capacity: z.number().int().min(1).default(100),
  totalMats: z.number().int().min(1).default(1),
  responsibleName: z.string().optional(),
  isActive: z.boolean().default(true)
});

const updateUnitSchema = createUnitSchema.partial();

const querySchema = z.object({
  organizationId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20)
});

export default async function unitsRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
) {
  // Get all units with organization hierarchy
  fastify.get('/', async (request, reply) => {
    try {
      const organizationId = requireOrganizationId(request as any, reply as any) as string; if (!organizationId) { return; }
      const query = querySchema.parse(request.query);
      
      const where: any = { organizationId };
      
      // Ignore query.organizationId to enforce header/tenant scoping
      
      if (query.isActive !== undefined) {
        where.isActive = query.isActive;
      }
      
      if (query.search) {
        where.OR = [
          { name: { contains: query.search, mode: 'insensitive' } },
          { city: { contains: query.search, mode: 'insensitive' } },
          { neighborhood: { contains: query.search, mode: 'insensitive' } }
        ];
      }

      const skip = (query.page - 1) * query.limit;

      let [units, total] = await Promise.all([
        prisma.unit.findMany({
          where,
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            },
            _count: {
              select: {
                classes: true,
                turmas: true,
                mats: true
              }
            }
          },
          orderBy: [
            { isActive: 'desc' },
            { name: 'asc' }
          ],
          skip,
          take: query.limit
        }),
        prisma.unit.count({ where })
      ]);
      
      // If no units exist, create a default one
      if (units.length === 0 && !query.search) {
        // Get or create default organization
        let defaultOrg = await prisma.organization.findFirst();
        if (!defaultOrg) {
          defaultOrg = await prisma.organization.create({
            data: {
              name: 'Academia Krav Maga',
              slug: 'academia-krav-maga',
              email: 'contato@academiakravmaga.com.br',
              isActive: true
            }
          });
        }
        
        // Create default unit
        const defaultUnit = await prisma.unit.create({
          data: {
            name: 'Unidade Principal',
            address: 'Rua das Artes Marciais, 123',
            city: 'São Paulo',
            state: 'SP',
            zipCode: '01234567',
            organizationId: defaultOrg.id,
            capacity: 100,
            totalMats: 2,
            isActive: true
          },
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            },
            _count: {
              select: {
                classes: true,
                turmas: true,
                mats: true
              }
            }
          }
        });
        
        units = [defaultUnit];
        total = 1;
      }

      return { success: true, data: units, pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit)
      }};
    } catch (error) {
      request.log.error(error);
      reply.code(500);
      return { success: false, error: 'Failed to fetch units' };
    }
  });

  // Get unit by ID with full details
  fastify.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const organizationId = requireOrganizationId(request as any, reply as any) as string; if (!organizationId) { return; }
      
      const unit = await prisma.unit.findFirst({
        where: { id, organizationId },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          classes: {
            select: {
              id: true,
              title: true,
              status: true,
              date: true,
              startTime: true,
              endTime: true,
              instructorId: true,
              courseId: true
            }
          },
          turmas: {
            select: {
              id: true,
              name: true,
              isActive: true
            }
          },
          mats: {
            select: {
              id: true,
              name: true,
              isActive: true
            }
          },
          _count: {
            select: {
              classes: true,
              turmas: true,
              mats: true
            }
          }
        }
      });

      if (!unit) { 
        reply.code(404); 
        return { success: false, error: 'Unit not found' }; 
      }
      return { success: true, data: unit };
    } catch (error) {
  request.log.error(error);
  reply.code(500);
  // During development, include the error message/stack to aid debugging.
  return { success: false, error: 'Failed to fetch unit', message: (error as Error).message, stack: (error as Error).stack };
    }
  });

  // Create unit
  fastify.post('/', async (request, reply) => {
    try {
      const data = createUnitSchema.parse(request.body);
      const organizationId = requireOrganizationId(request as any, reply as any) as string; if (!organizationId) { return; }
      if (data.organizationId !== organizationId) {
        reply.code(403);
        return { success: false, error: 'Access denied to this organization' };
      }
      
      // Verify organization exists
      const organization = await prisma.organization.findUnique({ where: { id: data.organizationId } });
      
      if (!organization) {
        reply.code(404);
        return { success: false, error: 'Organization not found' };
      }

      // Check for duplicate name within organization
      const existingUnit = await prisma.unit.findFirst({
        where: {
          organizationId: data.organizationId,
          name: data.name
        }
      });

      if (existingUnit) {
        reply.code(409);
        return { success: false, error: 'Unit name already exists in this organization' };
      }

      const unit = await prisma.unit.create({
        // cast to any to satisfy Prisma client input typing under strict TS settings
        data: data as any,
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      });

      reply.code(201);
      return { success: true, data: unit };
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400);
        return { success: false, error: 'Validation error', details: error.errors };
      }
      request.log.error(error);
      reply.code(500);
      return { success: false, error: 'Failed to create unit' };
    }
  });

  // Update unit
  fastify.put('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = updateUnitSchema.parse(request.body);

      // Verify unit exists
      const existingUnit = await prisma.unit.findUnique({
        where: { id }
      });

      if (!existingUnit) {
        reply.code(404);
        return { success: false, error: 'Unit not found' };
      }

      // If updating organization, verify it exists
      if (data.organizationId && data.organizationId !== existingUnit.organizationId) {
        const organization = await prisma.organization.findUnique({
          where: { id: data.organizationId }
        });
        
        if (!organization) {
          reply.code(404);
          return { success: false, error: 'Organization not found' };
        }
      }

      // Check for duplicate name within organization
      if (data.name && data.name !== existingUnit.name) {
        const duplicateUnit = await prisma.unit.findFirst({
          where: {
            organizationId: data.organizationId || existingUnit.organizationId,
            name: data.name,
            id: { not: id }
          }
        });

        if (duplicateUnit) {
          reply.code(409);
          return { success: false, error: 'Unit name already exists in this organization' };
        }
      }

      const unit = await prisma.unit.update({
        where: { id },
        // cast to any to satisfy Prisma client input typing under strict TS settings
        data: data as any,
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      });

      return { success: true, data: unit };
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400);
        return { success: false, error: 'Validation error', details: error.errors };
      }
      request.log.error(error);
      reply.code(500);
      return { success: false, error: 'Failed to update unit' };
    }
  });

  // Delete unit
  fastify.delete('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      // Verify unit exists
      const unit = await prisma.unit.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              classes: true,
              turmas: true,
              mats: true
            }
          }
        }
      });

      if (!unit) {
        reply.code(404);
        return { success: false, error: 'Unit not found' };
      }

      // Check if unit has dependencies
      const hasClasses = unit._count.classes > 0;
      const hasTurmas = unit._count.turmas > 0;
      const hasMats = unit._count.mats > 0;

      if (hasClasses || hasTurmas || hasMats) {
        reply.code(409);
        return { success: false, error: 'Cannot delete unit with existing classes, turmas, or mats' };
      }

      await prisma.unit.delete({
        where: { id }
      });

      return { success: true, message: 'Unit deleted successfully' };
    } catch (error) {
      request.log.error(error);
      reply.code(500);
      return { success: false, error: 'Failed to delete unit' };
    }
  });

  // Get units by organization
  fastify.get('/by-organization/:organizationId', async (request, reply) => {
    try {
      const { organizationId } = request.params as { organizationId: string };
      
      const units = await prisma.unit.findMany({
        where: { organizationId },
        include: {
          _count: {
            select: {
              classes: true,
              turmas: true,
              mats: true
            }
          }
        },
        orderBy: [
          { isActive: 'desc' },
          { name: 'asc' }
        ]
      });

      return { success: true, data: units };
    } catch (error) {
      request.log.error(error);
      reply.code(500);
      return { success: false, error: 'Failed to fetch organization units' };
    }
  });
}
