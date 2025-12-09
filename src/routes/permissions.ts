/**
 * Permissions Routes
 * 
 * Endpoints para gerenciamento de permissões
 * 
 * @module routes/permissions
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import { serverSupabase } from '@/utils/supabase';

interface AuthUser {
  id: string;
  role: string;
  organizationId: string;
}

/**
 * Middleware para autenticar usuário via JWT ou Supabase
 * Suporta tanto tokens JWT locais quanto tokens Supabase
 */
async function authenticateRequest(request: FastifyRequest, reply: FastifyReply): Promise<AuthUser | null> {
  const token = request.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return null;
  }
  
  // Tentar verificar como JWT local (dev-auth)
  try {
    const decoded = await (request as any).jwtVerify();
    if (decoded) {
      // Buscar usuário do banco para garantir dados atualizados
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId || decoded.id },
        select: { id: true, role: true, organizationId: true }
      });
      
      if (user) {
        return {
          id: user.id,
          role: user.role,
          organizationId: user.organizationId || ''
        };
      }
    }
  } catch {
    // JWT local falhou, tentar Supabase
  }
  
  // Tentar verificar com Supabase
  try {
    const { data: { user }, error } = await serverSupabase.auth.getUser(token);
    if (!error && user) {
      return {
        id: user.id,
        role: (user.app_metadata?.role as string) || 'STUDENT',
        organizationId: (user.app_metadata?.orgId as string) || ''
      };
    }
  } catch {
    // Supabase também falhou
  }
  
  return null;
}

export default async function permissionsRoutes(fastify: FastifyInstance) {
  
  /**
   * GET /api/auth/permissions
   * Retorna as permissões do usuário logado
   */
  fastify.get('/permissions', {
    schema: {
      description: 'Retorna as permissões efetivas do usuário logado',
      tags: ['Auth'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                role: { type: 'string' },
                permissions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      module: { type: 'string' },
                      action: { type: 'string' },
                      scope: { type: 'string' }
                    }
                  }
                },
                moduleAccess: {
                  type: 'object',
                  additionalProperties: {
                    type: 'object',
                    properties: {
                      view: { type: 'boolean' },
                      create: { type: 'boolean' },
                      edit: { type: 'boolean' },
                      delete: { type: 'boolean' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = await authenticateRequest(request, reply);
      
      if (!user) {
        return reply.code(401).send({
          success: false,
          error: 'Não autenticado',
          code: 'UNAUTHORIZED'
        });
      }
      
      // Super admin tem acesso total
      if (user.role === 'SUPER_ADMIN') {
        const allModules = await prisma.permission.findMany({
          distinct: ['module']
        });
        
        const moduleAccess: Record<string, Record<string, boolean>> = {};
        const permissions: Array<{ module: string; action: string; scope: string }> = [];
        
        for (const perm of allModules) {
          if (!moduleAccess[perm.module]) {
            moduleAccess[perm.module] = {};
          }
          moduleAccess[perm.module] = {
            view: true,
            create: true,
            edit: true,
            delete: true,
            manage: true
          };
        }
        
        // Adicionar todas as permissões com scope ALL
        const allPerms = await prisma.permission.findMany();
        for (const perm of allPerms) {
          permissions.push({
            module: perm.module,
            action: perm.action,
            scope: 'ALL'
          });
        }
        
        return reply.send({
          success: true,
          data: {
            role: user.role,
            permissions,
            moduleAccess
          }
        });
      }
      
      // Buscar permissões do role
      const rolePermissions = await prisma.rolePermission.findMany({
        where: { role: user.role as any },
        include: { permission: true }
      });
      
      // Buscar overrides do usuário
      const userOverrides = await prisma.userPermissionOverride.findMany({
        where: { userId: user.id },
        include: { permission: true }
      });
      
      // Montar mapa de permissões
      const permissionMap = new Map<string, { module: string; action: string; scope: string }>();
      
      // Adicionar permissões do role
      for (const rp of rolePermissions) {
        const key = `${rp.permission.module}.${rp.permission.action}`;
        permissionMap.set(key, {
          module: rp.permission.module,
          action: rp.permission.action,
          scope: rp.scope
        });
      }
      
      // Aplicar overrides do usuário
      for (const override of userOverrides) {
        const key = `${override.permission.module}.${override.permission.action}`;
        if (override.granted) {
          permissionMap.set(key, {
            module: override.permission.module,
            action: override.permission.action,
            scope: override.scope || 'ALL'
          });
        } else {
          // Override nega a permissão
          permissionMap.delete(key);
        }
      }
      
      const permissions = Array.from(permissionMap.values());
      
      // Montar acesso por módulo para facilitar uso no frontend
      const moduleAccess: Record<string, Record<string, boolean>> = {};
      
      for (const perm of permissions) {
        if (!moduleAccess[perm.module]) {
          moduleAccess[perm.module] = {
            view: false,
            create: false,
            edit: false,
            delete: false,
            manage: false
          };
        }
        moduleAccess[perm.module][perm.action] = true;
      }
      
      return reply.send({
        success: true,
        data: {
          role: user.role,
          permissions,
          moduleAccess
        }
      });
      
    } catch (error) {
      logger.error('Error fetching permissions:', error);
      return reply.code(500).send({
        success: false,
        error: 'Erro ao buscar permissões',
        code: 'INTERNAL_ERROR'
      });
    }
  });
  
  /**
   * GET /api/auth/permissions/check
   * Verifica se usuário tem uma permissão específica
   */
  fastify.get('/permissions/check', {
    schema: {
      description: 'Verifica se usuário tem uma permissão específica',
      tags: ['Auth'],
      querystring: {
        type: 'object',
        properties: {
          module: { type: 'string' },
          action: { type: 'string' }
        },
        required: ['module', 'action']
      }
    }
  }, async (request: FastifyRequest<{ Querystring: { module: string; action: string } }>, reply: FastifyReply) => {
    try {
      const user = await authenticateRequest(request, reply);
      
      if (!user) {
        return reply.code(401).send({
          success: false,
          error: 'Não autenticado',
          code: 'UNAUTHORIZED'
        });
      }
      
      const { module, action } = request.query;
      
      // Super admin sempre tem permissão
      if (user.role === 'SUPER_ADMIN') {
        return reply.send({
          success: true,
          data: {
            allowed: true,
            scope: 'ALL'
          }
        });
      }
      
      // Verificar permissão do role
      const rolePermission = await prisma.rolePermission.findFirst({
        where: {
          role: user.role as any,
          permission: {
            module,
            action
          }
        },
        include: { permission: true }
      });
      
      // Verificar override do usuário
      const userOverride = await prisma.userPermissionOverride.findFirst({
        where: {
          userId: user.id,
          permission: {
            module,
            action
          }
        }
      });
      
      // Override tem precedência
      if (userOverride) {
        return reply.send({
          success: true,
          data: {
            allowed: userOverride.granted,
            scope: userOverride.granted ? (userOverride.scope || 'ALL') : 'NONE'
          }
        });
      }
      
      // Usar permissão do role
      if (rolePermission) {
        return reply.send({
          success: true,
          data: {
            allowed: true,
            scope: rolePermission.scope
          }
        });
      }
      
      // Sem permissão
      return reply.send({
        success: true,
        data: {
          allowed: false,
          scope: 'NONE'
        }
      });
      
    } catch (error) {
      logger.error('Error checking permission:', error);
      return reply.code(500).send({
        success: false,
        error: 'Erro ao verificar permissão',
        code: 'INTERNAL_ERROR'
      });
    }
  });
  
  /**
   * GET /api/admin/permissions
   * Lista todas as permissões disponíveis (admin only)
   */
  fastify.get('/admin/permissions', {
    schema: {
      description: 'Lista todas as permissões disponíveis (admin only)',
      tags: ['Admin']
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = await authenticateRequest(request, reply);
      
      if (!user || !['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
        return reply.code(403).send({
          success: false,
          error: 'Acesso negado',
          code: 'FORBIDDEN'
        });
      }
      
      const permissions = await prisma.permission.findMany({
        orderBy: [{ module: 'asc' }, { action: 'asc' }]
      });
      
      // Agrupar por módulo
      const grouped: Record<string, typeof permissions> = {};
      for (const perm of permissions) {
        if (!grouped[perm.module]) {
          grouped[perm.module] = [];
        }
        grouped[perm.module].push(perm);
      }
      
      return reply.send({
        success: true,
        data: {
          permissions,
          grouped,
          total: permissions.length
        }
      });
      
    } catch (error) {
      logger.error('Error listing permissions:', error);
      return reply.code(500).send({
        success: false,
        error: 'Erro ao listar permissões',
        code: 'INTERNAL_ERROR'
      });
    }
  });
  
  /**
   * GET /api/admin/permissions/roles/:role
   * Lista permissões de um role específico
   */
  fastify.get('/admin/permissions/roles/:role', {
    schema: {
      description: 'Lista permissões de um role específico',
      tags: ['Admin'],
      params: {
        type: 'object',
        properties: {
          role: { type: 'string', enum: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'INSTRUCTOR', 'STUDENT'] }
        },
        required: ['role']
      }
    }
  }, async (request: FastifyRequest<{ Params: { role: string } }>, reply: FastifyReply) => {
    try {
      const user = await authenticateRequest(request, reply);
      
      if (!user || !['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
        return reply.code(403).send({
          success: false,
          error: 'Acesso negado',
          code: 'FORBIDDEN'
        });
      }
      
      const { role } = request.params;
      
      const rolePermissions = await prisma.rolePermission.findMany({
        where: { role: role as any },
        include: { permission: true },
        orderBy: [{ permission: { module: 'asc' } }, { permission: { action: 'asc' } }]
      });
      
      return reply.send({
        success: true,
        data: {
          role,
          permissions: rolePermissions.map(rp => ({
            id: rp.id,
            module: rp.permission.module,
            action: rp.permission.action,
            description: rp.permission.description,
            scope: rp.scope
          })),
          total: rolePermissions.length
        }
      });
      
    } catch (error) {
      logger.error('Error listing role permissions:', error);
      return reply.code(500).send({
        success: false,
        error: 'Erro ao listar permissões do role',
        code: 'INTERNAL_ERROR'
      });
    }
  });
  
  /**
   * POST /api/admin/permissions/users/:userId/override
   * Adiciona ou atualiza override de permissão para usuário
   */
  fastify.post('/admin/permissions/users/:userId/override', {
    schema: {
      description: 'Adiciona ou atualiza override de permissão para usuário',
      tags: ['Admin'],
      params: {
        type: 'object',
        properties: {
          userId: { type: 'string' }
        },
        required: ['userId']
      },
      body: {
        type: 'object',
        properties: {
          permissionId: { type: 'string' },
          granted: { type: 'boolean' },
          scope: { type: 'string', enum: ['ALL', 'OWN', 'TEAM', 'NONE'] }
        },
        required: ['permissionId', 'granted']
      }
    }
  }, async (request: FastifyRequest<{ Params: { userId: string }; Body: { permissionId: string; granted: boolean; scope?: string } }>, reply: FastifyReply) => {
    try {
      const user = await authenticateRequest(request, reply);
      
      if (!user || !['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
        return reply.code(403).send({
          success: false,
          error: 'Acesso negado',
          code: 'FORBIDDEN'
        });
      }
      
      const { userId } = request.params;
      const { permissionId, granted, scope } = request.body;
      
      // Verificar se usuário existe
      const targetUser = await prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!targetUser) {
        return reply.code(404).send({
          success: false,
          error: 'Usuário não encontrado',
          code: 'NOT_FOUND'
        });
      }
      
      // Verificar se permissão existe
      const permission = await prisma.permission.findUnique({
        where: { id: permissionId }
      });
      
      if (!permission) {
        return reply.code(404).send({
          success: false,
          error: 'Permissão não encontrada',
          code: 'NOT_FOUND'
        });
      }
      
      // Criar ou atualizar override
      const override = await prisma.userPermissionOverride.upsert({
        where: {
          userId_permissionId: {
            userId,
            permissionId
          }
        },
        update: {
          granted,
          scope: scope || 'ALL'
        },
        create: {
          userId,
          permissionId,
          granted,
          scope: scope || 'ALL'
        },
        include: { permission: true }
      });
      
      logger.info(`Permission override set: user=${userId}, permission=${permission.module}.${permission.action}, granted=${granted}`);
      
      return reply.send({
        success: true,
        data: {
          id: override.id,
          userId: override.userId,
          module: override.permission.module,
          action: override.permission.action,
          granted: override.granted,
          scope: override.scope
        },
        message: `Override ${granted ? 'concedido' : 'negado'} com sucesso`
      });
      
    } catch (error) {
      logger.error('Error setting permission override:', error);
      return reply.code(500).send({
        success: false,
        error: 'Erro ao definir override de permissão',
        code: 'INTERNAL_ERROR'
      });
    }
  });
  
  /**
   * DELETE /api/admin/permissions/users/:userId/override/:permissionId
   * Remove override de permissão de usuário
   */
  fastify.delete('/admin/permissions/users/:userId/override/:permissionId', {
    schema: {
      description: 'Remove override de permissão de usuário',
      tags: ['Admin'],
      params: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          permissionId: { type: 'string' }
        },
        required: ['userId', 'permissionId']
      }
    }
  }, async (request: FastifyRequest<{ Params: { userId: string; permissionId: string } }>, reply: FastifyReply) => {
    try {
      const user = await authenticateRequest(request, reply);
      
      if (!user || !['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
        return reply.code(403).send({
          success: false,
          error: 'Acesso negado',
          code: 'FORBIDDEN'
        });
      }
      
      const { userId, permissionId } = request.params;
      
      await prisma.userPermissionOverride.deleteMany({
        where: {
          userId,
          permissionId
        }
      });
      
      return reply.send({
        success: true,
        message: 'Override removido com sucesso'
      });
      
    } catch (error) {
      logger.error('Error removing permission override:', error);
      return reply.code(500).send({
        success: false,
        error: 'Erro ao remover override de permissão',
        code: 'INTERNAL_ERROR'
      });
    }
  });
}
