/**
 * Authorization Middleware
 * 
 * Middleware para controle de acesso baseado em roles e permissões
 * 
 * @module middlewares/authorization
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@/utils/database';

// Tipos
type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'INSTRUCTOR' | 'STUDENT';
type PermissionScope = 'ALL' | 'OWN' | 'TEAM' | 'NONE';

interface AuthUser {
  id: string;
  role: UserRole;
  organizationId: string;
  instructorId?: string;
  studentId?: string;
}

interface PermissionCheck {
  module: string;
  action: string;
  scope: PermissionScope;
}

// Cache de permissões (5 minutos)
const permissionCache = new Map<string, { permissions: PermissionCheck[], expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Obtém usuário do request (assumindo que JWT já foi verificado)
 */
export function getAuthUser(request: FastifyRequest): AuthUser | null {
  // O JWT middleware já deve ter populado request.user
  const user = (request as any).user;
  if (!user) return null;
  
  return {
    id: user.id,
    role: user.role,
    organizationId: user.organizationId,
    instructorId: user.instructorId,
    studentId: user.studentId
  };
}

/**
 * Carrega permissões do usuário do cache ou banco
 */
async function loadUserPermissions(userId: string, role: UserRole): Promise<PermissionCheck[]> {
  const cacheKey = `${userId}:${role}`;
  const cached = permissionCache.get(cacheKey);
  
  if (cached && cached.expiry > Date.now()) {
    return cached.permissions;
  }
  
  // Buscar permissões do role
  const rolePermissions = await prisma.rolePermission.findMany({
    where: { role },
    include: { permission: true }
  });
  
  // Buscar overrides do usuário
  const userOverrides = await prisma.userPermissionOverride.findMany({
    where: { userId },
    include: { permission: true }
  });
  
  // Montar mapa de permissões
  const permissionMap = new Map<string, PermissionCheck>();
  
  // Adicionar permissões do role
  for (const rp of rolePermissions) {
    const key = `${rp.permission.module}.${rp.permission.action}`;
    permissionMap.set(key, {
      module: rp.permission.module,
      action: rp.permission.action,
      scope: rp.scope as PermissionScope
    });
  }
  
  // Aplicar overrides do usuário
  for (const override of userOverrides) {
    const key = `${override.permission.module}.${override.permission.action}`;
    if (override.granted) {
      permissionMap.set(key, {
        module: override.permission.module,
        action: override.permission.action,
        scope: override.scope as PermissionScope || 'ALL'
      });
    } else {
      // Override nega a permissão
      permissionMap.set(key, {
        module: override.permission.module,
        action: override.permission.action,
        scope: 'NONE'
      });
    }
  }
  
  const permissions = Array.from(permissionMap.values());
  
  // Cachear
  permissionCache.set(cacheKey, {
    permissions,
    expiry: Date.now() + CACHE_TTL
  });
  
  return permissions;
}

/**
 * Verifica se usuário tem permissão específica
 */
export async function checkPermission(
  user: AuthUser,
  module: string,
  action: string
): Promise<{ allowed: boolean; scope: PermissionScope }> {
  // Super admin tem acesso total
  if (user.role === 'SUPER_ADMIN') {
    return { allowed: true, scope: 'ALL' };
  }
  
  const permissions = await loadUserPermissions(user.id, user.role);
  const permission = permissions.find(p => p.module === module && p.action === action);
  
  if (!permission || permission.scope === 'NONE') {
    return { allowed: false, scope: 'NONE' };
  }
  
  return { allowed: true, scope: permission.scope };
}

/**
 * Limpa cache de permissões de um usuário
 */
export function clearPermissionCache(userId?: string): void {
  if (userId) {
    // Limpar apenas do usuário específico
    for (const key of permissionCache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        permissionCache.delete(key);
      }
    }
  } else {
    // Limpar todo o cache
    permissionCache.clear();
  }
}

// ========================================
// MIDDLEWARES
// ========================================

/**
 * Middleware que exige autenticação
 */
export function requireAuth() {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = getAuthUser(request);
    
    if (!user) {
      return reply.code(401).send({
        success: false,
        error: 'Não autenticado',
        code: 'UNAUTHORIZED'
      });
    }
  };
}

/**
 * Middleware que exige um ou mais roles
 * 
 * @example
 * app.get('/admin-only', { preHandler: requireRole('ADMIN', 'SUPER_ADMIN') }, handler)
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = getAuthUser(request);
    
    if (!user) {
      return reply.code(401).send({
        success: false,
        error: 'Não autenticado',
        code: 'UNAUTHORIZED'
      });
    }
    
    if (!allowedRoles.includes(user.role)) {
      return reply.code(403).send({
        success: false,
        error: 'Sem permissão para esta ação',
        code: 'FORBIDDEN',
        required: allowedRoles,
        current: user.role
      });
    }
  };
}

/**
 * Middleware que exige permissão específica
 * 
 * @example
 * app.post('/students', { preHandler: requirePermission('students', 'create') }, handler)
 */
export function requirePermission(module: string, action: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = getAuthUser(request);
    
    if (!user) {
      return reply.code(401).send({
        success: false,
        error: 'Não autenticado',
        code: 'UNAUTHORIZED'
      });
    }
    
    const { allowed, scope } = await checkPermission(user, module, action);
    
    if (!allowed) {
      return reply.code(403).send({
        success: false,
        error: `Sem permissão: ${module}.${action}`,
        code: 'FORBIDDEN',
        module,
        action
      });
    }
    
    // Anexar scope ao request para uso posterior
    (request as any).permissionScope = scope;
  };
}

/**
 * Middleware que verifica múltiplas permissões (todas devem ser válidas)
 * 
 * @example
 * app.delete('/students/:id', { 
 *   preHandler: requireAllPermissions([
 *     { module: 'students', action: 'delete' },
 *     { module: 'students', action: 'view' }
 *   ]) 
 * }, handler)
 */
export function requireAllPermissions(permissions: Array<{ module: string; action: string }>) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = getAuthUser(request);
    
    if (!user) {
      return reply.code(401).send({
        success: false,
        error: 'Não autenticado',
        code: 'UNAUTHORIZED'
      });
    }
    
    for (const perm of permissions) {
      const { allowed } = await checkPermission(user, perm.module, perm.action);
      
      if (!allowed) {
        return reply.code(403).send({
          success: false,
          error: `Sem permissão: ${perm.module}.${perm.action}`,
          code: 'FORBIDDEN',
          module: perm.module,
          action: perm.action
        });
      }
    }
  };
}

/**
 * Middleware que verifica se pelo menos uma permissão é válida
 * 
 * @example
 * app.get('/data', { 
 *   preHandler: requireAnyPermission([
 *     { module: 'students', action: 'view' },
 *     { module: 'instructors', action: 'view' }
 *   ]) 
 * }, handler)
 */
export function requireAnyPermission(permissions: Array<{ module: string; action: string }>) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = getAuthUser(request);
    
    if (!user) {
      return reply.code(401).send({
        success: false,
        error: 'Não autenticado',
        code: 'UNAUTHORIZED'
      });
    }
    
    for (const perm of permissions) {
      const { allowed, scope } = await checkPermission(user, perm.module, perm.action);
      
      if (allowed) {
        (request as any).permissionScope = scope;
        return; // Pelo menos uma permissão válida
      }
    }
    
    return reply.code(403).send({
      success: false,
      error: 'Sem permissão para nenhuma das ações requeridas',
      code: 'FORBIDDEN',
      required: permissions
    });
  };
}

// ========================================
// HELPERS PARA FILTRAR DADOS POR SCOPE
// ========================================

/**
 * Aplica filtro de scope na query Prisma
 * 
 * @example
 * const where = applyScopeFilter(request, { organizationId: orgId });
 * const students = await prisma.student.findMany({ where });
 */
export function applyScopeFilter(
  request: FastifyRequest,
  baseWhere: Record<string, any> = {}
): Record<string, any> {
  const user = getAuthUser(request);
  const scope = (request as any).permissionScope as PermissionScope;
  
  if (!user) return baseWhere;
  
  switch (scope) {
    case 'ALL':
      // Acesso total (filtrado apenas por organização)
      return {
        ...baseWhere,
        organizationId: user.organizationId
      };
      
    case 'OWN':
      // Apenas próprios dados
      if (user.studentId) {
        return {
          ...baseWhere,
          organizationId: user.organizationId,
          OR: [
            { id: user.studentId },
            { userId: user.id }
          ]
        };
      }
      if (user.instructorId) {
        return {
          ...baseWhere,
          organizationId: user.organizationId,
          OR: [
            { id: user.instructorId },
            { userId: user.id }
          ]
        };
      }
      return {
        ...baseWhere,
        organizationId: user.organizationId,
        userId: user.id
      };
      
    case 'TEAM':
      // Dados do time/turmas relacionadas
      if (user.instructorId) {
        return {
          ...baseWhere,
          organizationId: user.organizationId,
          // Precisa implementar lógica de turmas do instrutor
          turmas: {
            some: {
              instructorId: user.instructorId
            }
          }
        };
      }
      return {
        ...baseWhere,
        organizationId: user.organizationId
      };
      
    case 'NONE':
    default:
      // Sem acesso - retorna filtro impossível
      return {
        ...baseWhere,
        id: 'NONE' // Isso nunca vai retornar resultados
      };
  }
}

/**
 * Verifica se usuário pode acessar um recurso específico
 */
export async function canAccessResource(
  request: FastifyRequest,
  resourceOwnerId: string,
  module: string,
  action: string
): Promise<boolean> {
  const user = getAuthUser(request);
  if (!user) return false;
  
  const { allowed, scope } = await checkPermission(user, module, action);
  if (!allowed) return false;
  
  switch (scope) {
    case 'ALL':
      return true;
    case 'OWN':
      return resourceOwnerId === user.id || 
             resourceOwnerId === user.studentId || 
             resourceOwnerId === user.instructorId;
    case 'TEAM':
      // Implementar lógica de verificação de time
      return true; // Simplificado por enquanto
    default:
      return false;
  }
}

export default {
  requireAuth,
  requireRole,
  requirePermission,
  requireAllPermissions,
  requireAnyPermission,
  applyScopeFilter,
  canAccessResource,
  checkPermission,
  clearPermissionCache,
  getAuthUser
};
