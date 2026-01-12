import { FastifyRequest, FastifyReply } from 'fastify';
import { UserRole } from '@prisma/client';

/**
 * Middleware para verificar se o usuário está autenticado
 */
export async function requireAuth(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const user = (request as any).user;

    if (!user) {
        return reply.code(401).send({
            success: false,
            error: 'Não autenticado',
            message: 'Você precisa estar logado para acessar este recurso'
        });
    }
}

/**
 * Middleware para verificar se o usuário tem um dos roles permitidos
 * @param allowedRoles - Array de roles permitidos
 */
export function requireRole(...allowedRoles: UserRole[]) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        const user = (request as any).user;

        if (!user) {
            return reply.code(401).send({
                success: false,
                error: 'Não autenticado',
                message: 'Você precisa estar logado para acessar este recurso'
            });
        }

        if (!allowedRoles.includes(user.role)) {
            return reply.code(403).send({
                success: false,
                error: 'Acesso negado',
                message: `Este recurso requer um dos seguintes perfis: ${allowedRoles.join(', ')}`,
                requiredRoles: allowedRoles,
                userRole: user.role
            });
        }
    };
}

/**
 * Middleware para verificar se o usuário tem permissão para acessar uma organização específica
 */
export async function requireOrganization(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const user = (request as any).user;
    const { organizationId } = request.params as any;

    if (!user) {
        return reply.code(401).send({
            success: false,
            error: 'Não autenticado'
        });
    }

    // SUPER_ADMIN pode acessar qualquer organização
    if (user.role === 'SUPER_ADMIN') {
        return;
    }

    // Outros usuários só podem acessar sua própria organização
    if (user.organizationId !== organizationId) {
        return reply.code(403).send({
            success: false,
            error: 'Acesso negado',
            message: 'Você não tem permissão para acessar esta organização'
        });
    }
}

/**
 * Middleware para verificar se o usuário pode gerenciar agentes de IA
 */
export async function requireAgentPermissions(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const user = (request as any).user;

    if (!user) {
        return reply.code(401).send({
            success: false,
            error: 'Não autenticado'
        });
    }

    const allowedRoles: UserRole[] = ['SUPER_ADMIN', 'ADMIN'];

    if (!allowedRoles.includes(user.role) && !user.canCreateAgents) {
        return reply.code(403).send({
            success: false,
            error: 'Acesso negado',
            message: 'Você não tem permissão para gerenciar agentes de IA'
        });
    }
}

/**
 * Verifica se o usuário pode aprovar tarefas de agentes
 */
export function canApproveAgentTasks(user: any): boolean {
    if (!user) return false;

    const allowedRoles: UserRole[] = ['SUPER_ADMIN', 'ADMIN'];
    return allowedRoles.includes(user.role) || user.canApproveAgentTasks === true;
}

/**
 * Verifica se o usuário pode executar tarefas de agentes
 */
export function canExecuteAgentTasks(user: any): boolean {
    if (!user) return false;

    const allowedRoles: UserRole[] = ['SUPER_ADMIN', 'ADMIN'];
    return allowedRoles.includes(user.role) || user.canExecuteAgentTasks === true;
}

/**
 * Verifica se o usuário tem acesso a módulo específico
 */
export function hasModuleAccess(user: any, moduleName: string): boolean {
    if (!user) return false;

    // SUPER_ADMIN tem acesso a tudo
    if (user.role === 'SUPER_ADMIN') return true;

    const modulePermissions: Record<string, UserRole[]> = {
        'students': ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'INSTRUCTOR'],
        'quickEnrollment': ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
        'crm': ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
        'packages': ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
        'activities': ['SUPER_ADMIN', 'ADMIN', 'INSTRUCTOR'],
        'lesson-plans': ['SUPER_ADMIN', 'ADMIN', 'INSTRUCTOR'],
        'courses': ['SUPER_ADMIN', 'ADMIN', 'INSTRUCTOR'],
        'turmas': ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'INSTRUCTOR'],
        'organizations': ['SUPER_ADMIN', 'ADMIN'],
        'units': ['SUPER_ADMIN', 'ADMIN'],
        'instructors': ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
        'instructor-dashboard': ['SUPER_ADMIN', 'ADMIN', 'INSTRUCTOR'],
        'classroom-display': ['SUPER_ADMIN', 'ADMIN', 'INSTRUCTOR'],
        'checkin-kiosk': ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'INSTRUCTOR'],
        'agenda': ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'INSTRUCTOR'],
        'frequency': ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'INSTRUCTOR'],
        'student-progress': ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'INSTRUCTOR', 'STUDENT'],
        'graduation': ['SUPER_ADMIN', 'ADMIN', 'INSTRUCTOR', 'STUDENT'],
        'ai': ['SUPER_ADMIN', 'ADMIN'],
        'marketing': ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
        'import': ['SUPER_ADMIN', 'ADMIN'],
        'settings': ['SUPER_ADMIN', 'ADMIN']
    };

    const allowedRoles = modulePermissions[moduleName] || [];
    return allowedRoles.includes(user.role);
}
