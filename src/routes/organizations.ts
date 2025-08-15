import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { prisma } from '@/utils/database';

interface CreateOrganizationBody {
  name: string;
  slug: string;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string | null;
  maxStudents?: number;
  maxStaff?: number;
  isActive?: boolean;
}

export default async function organizationsRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  
  // GET /api/organizations - List organizations
  fastify.get('/', {
    schema: {
      description: 'List organizations',
      tags: ['Organizations']
    }
  }, async (request, reply) => {
    try {
      const organizations = await prisma.organization.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          email: true,
          phone: true,
          website: true,
          address: true,
          city: true,
          state: true,
          zipCode: true,
          country: true,
          maxStudents: true,
          maxStaff: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return {
        success: true,
        data: organizations
      };
    } catch (error) {
      console.error('❌ Erro ao buscar organizações:', error);
      reply.code(500);
      return {
        success: false,
        error: 'Failed to fetch organizations',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // GET /api/organizations/:id - Get organization by ID
  fastify.get('/:id', {
    schema: {
      description: 'Get organization by ID',
      tags: ['Organizations'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const organization = await prisma.organization.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          email: true,
          phone: true,
          website: true,
          address: true,
          city: true,
          state: true,
          zipCode: true,
          country: true,
          maxStudents: true,
          maxStaff: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              users: true
            }
          }
        }
      });

      if (!organization) {
        reply.code(404);
        return {
          success: false,
          error: 'Organization not found'
        };
      }

      return {
        success: true,
        data: organization
      };
    } catch (error) {
      console.error('❌ Erro ao buscar organização:', error);
      reply.code(500);
      return {
        success: false,
        error: 'Failed to fetch organization',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // POST /api/organizations - Create organization
  fastify.post('/', {
    schema: {
      description: 'Create organization',
      tags: ['Organizations'],
      body: {
        type: 'object',
        required: ['name', 'slug'],
        properties: {
          name: { type: 'string' },
          slug: { type: 'string' },
          description: { type: 'string', nullable: true },
          email: { type: 'string', nullable: true },
          phone: { type: 'string', nullable: true },
          website: { type: 'string', nullable: true },
          address: { type: 'string', nullable: true },
          city: { type: 'string', nullable: true },
          state: { type: 'string', nullable: true },
          zipCode: { type: 'string', nullable: true },
          country: { type: 'string', nullable: true },
          maxStudents: { type: 'integer', minimum: 1 },
          maxStaff: { type: 'integer', minimum: 1 },
          isActive: { type: 'boolean' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const data = request.body as CreateOrganizationBody;

      // Verificar se slug já existe
      const existingOrg = await prisma.organization.findUnique({
        where: { slug: data.slug }
      });

      if (existingOrg) {
        reply.code(400);
        return {
          success: false,
          error: 'Organization with this slug already exists'
        };
      }

      const organization = await prisma.organization.create({
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description,
          email: data.email,
          phone: data.phone,
          website: data.website,
          address: data.address,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
          country: data.country || 'Brazil',
          maxStudents: data.maxStudents || 100,
          maxStaff: data.maxStaff || 10,
          isActive: data.isActive !== false
        }
      });

      console.log('✅ Organização criada:', organization.name);

      return {
        success: true,
        data: organization,
        message: 'Organization created successfully'
      };
    } catch (error) {
      console.error('❌ Erro ao criar organização:', error);
      reply.code(500);
      return {
        success: false,
        error: 'Failed to create organization',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // PUT /api/organizations/:id - Update organization
  fastify.put('/:id', {
    schema: {
      description: 'Update organization',
      tags: ['Organizations'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          slug: { type: 'string' },
          description: { type: 'string', nullable: true },
          email: { type: 'string', nullable: true },
          phone: { type: 'string', nullable: true },
          website: { type: 'string', nullable: true },
          address: { type: 'string', nullable: true },
          city: { type: 'string', nullable: true },
          state: { type: 'string', nullable: true },
          zipCode: { type: 'string', nullable: true },
          country: { type: 'string', nullable: true },
          maxStudents: { type: 'integer', minimum: 1 },
          maxStaff: { type: 'integer', minimum: 1 },
          isActive: { type: 'boolean' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = request.body as Partial<CreateOrganizationBody>;

      // Verificar se organização existe
      const existingOrg = await prisma.organization.findUnique({
        where: { id }
      });

      if (!existingOrg) {
        reply.code(404);
        return {
          success: false,
          error: 'Organization not found'
        };
      }

      // Se slug foi alterado, verificar duplicatas
      if (data.slug && data.slug !== existingOrg.slug) {
        const slugExists = await prisma.organization.findUnique({
          where: { slug: data.slug }
        });

        if (slugExists) {
          reply.code(400);
          return {
            success: false,
            error: 'Organization with this slug already exists'
          };
        }
      }

      const organization = await prisma.organization.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.slug && { slug: data.slug }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.email !== undefined && { email: data.email }),
          ...(data.phone !== undefined && { phone: data.phone }),
          ...(data.website !== undefined && { website: data.website }),
          ...(data.address !== undefined && { address: data.address }),
          ...(data.city !== undefined && { city: data.city }),
          ...(data.state !== undefined && { state: data.state }),
          ...(data.zipCode !== undefined && { zipCode: data.zipCode }),
          ...(data.country !== undefined && { country: data.country }),
          ...(data.maxStudents !== undefined && { maxStudents: data.maxStudents }),
          ...(data.maxStaff !== undefined && { maxStaff: data.maxStaff }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
          updatedAt: new Date()
        }
      });

      console.log('✅ Organização atualizada:', organization.name);

      return {
        success: true,
        data: organization,
        message: 'Organization updated successfully'
      };
    } catch (error) {
      console.error('❌ Erro ao atualizar organização:', error);
      reply.code(500);
      return {
        success: false,
        error: 'Failed to update organization',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // DELETE /api/organizations/:id - Delete organization
  fastify.delete('/:id', {
    schema: {
      description: 'Delete organization',
      tags: ['Organizations'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      // Verificar se organização existe
      const existingOrg = await prisma.organization.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              users: true
            }
          }
        }
      });

      if (!existingOrg) {
        reply.code(404);
        return {
          success: false,
          error: 'Organization not found'
        };
      }

      // Verificar se há usuários associados
      if (existingOrg._count.users > 0) {
        reply.code(400);
        return {
          success: false,
          error: 'Cannot delete organization with associated users',
          message: `This organization has ${existingOrg._count.users} associated users. Please remove them first.`
        };
      }

      await prisma.organization.delete({
        where: { id }
      });

      console.log('✅ Organização excluída:', existingOrg.name);

      return {
        success: true,
        message: 'Organization deleted successfully'
      };
    } catch (error) {
      console.error('❌ Erro ao excluir organização:', error);
      reply.code(500);
      return {
        success: false,
        error: 'Failed to delete organization',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });
}