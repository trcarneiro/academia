import { FastifyRequest, FastifyReply } from 'fastify';
import { UserRole, TenantContext, AuthenticatedUser } from '@/types';
import { ResponseHelper } from '@/utils/response';
import { logger } from '@/utils/logger';
import { prisma } from '@/utils/database';
import fs from 'fs';
import path from 'path';

declare module 'fastify' {
  interface FastifyRequest {
    tenant?: TenantContext;
    // user is already defined by fastify-jwt
  }
}

// Rate limiter for dev fallback warnings (max 1 per minute per orgId)
const warningCache = new Map<string, number>();
const WARNING_INTERVAL_MS = 60000; // 1 minute

// Organization cache to reduce database queries (5 min TTL)
const orgCache = new Map<string, { org: any, timestamp: number }>();
const ORG_CACHE_TTL_MS = 300000; // 5 minutes

function getCachedOrg(orgId: string) {
  const cached = orgCache.get(orgId);
  if (cached && (Date.now() - cached.timestamp) < ORG_CACHE_TTL_MS) {
    return cached.org;
  }
  return null;
}

function setCachedOrg(orgId: string, org: any) {
  orgCache.set(orgId, { org, timestamp: Date.now() });
}

const debugLogFile = path.resolve('debug_requests.log');
function logToFile(msg: string) {
  const timestamp = new Date().toISOString();
  try {
    fs.appendFileSync(debugLogFile, `[${timestamp}] ${msg}\n`);
  } catch (e) { }
}

export const extractTenantContext = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  logToFile(`🔍 extractTenantContext MINIMAL - Starting for ${request.method} ${request.url}`);
  try {
    const organizationId = 'b03d6cc5-7d58-437e-87a7-834226931d2a';
    request.tenant = {
      organizationId,
      organization: {
        id: organizationId,
        name: 'Academia Demo',
        slug: 'academia-demo',
      }
    };
    logToFile(`✅ extractTenantContext MINIMAL - Done`);
  } catch (error: any) {
    console.error('❌ DARK ERROR IN TENANT MIDDLEWARE:', error);
    logToFile(`❌ CRITICAL ERROR in extractTenantContext: ${error.toString()}`);
    return ResponseHelper.error(reply, 'Failed to determine organization context', 500);
  }
}

export const requireTenant = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  if (!request.tenant) {
    return ResponseHelper.error(reply, 'Organization context required', 400);
  }
};

export const checkTenantAccess = (allowedRoles: UserRole[]) => {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const user = request.user as AuthenticatedUser | undefined;
    if (!user || !request.tenant) {
      return ResponseHelper.error(reply, 'Authentication and organization context required', 401);
    }

    // Super admins can access any organization
    if (user.role === UserRole.SUPER_ADMIN) {
      return;
    }

    // Check if user belongs to the organization
    if (user.organizationId !== request.tenant.organizationId) {
      return ResponseHelper.error(reply, 'Access denied to this organization', 403);
    }

    // Check role permissions
    if (!allowedRoles.includes(user.role)) {
      return ResponseHelper.error(reply, 'Insufficient permissions', 403);
    }
  };
};

export const addTenantFilter = (whereClause: any, organizationId: string): any => {
  return {
    ...whereClause,
    organizationId,
  };
};

export const validateTenantLimits = async (
  organizationId: string,
  limitType: 'students' | 'staff' | 'classes'
): Promise<boolean> => {
  try {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { maxStudents: true, maxStaff: true },
    });

    if (!organization) return false;

    const plan = 'PREMIUM'; // Default to PREMIUM as plan field is missing

    switch (limitType) {
      case 'students':
        const studentCount = await prisma.student.count({
          where: { organizationId, isActive: true },
        });
        return studentCount < organization.maxStudents;

      case 'staff':
        const staffCount = await prisma.instructor.count({
          where: { organizationId, isActive: true },
        });
        return staffCount < organization.maxStaff;

      case 'classes':
        // Different plans might have different class limits
        const currentDate = new Date();
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const classCount = await prisma.class.count({
          where: {
            organizationId,
            date: { gte: startOfMonth },
          },
        });

        // Basic plan: 100 classes/month, Standard: 500, Premium: unlimited
        const limits = {
          BASIC: 100,
          STANDARD: 500,
          PREMIUM: 999999,
          ENTERPRISE: 999999,
        };

        return classCount < limits[plan];

      default:
        return true;
    }
  } catch (error) {
    logger.error({ error, organizationId, limitType }, 'Failed to validate tenant limits');
    return false;
  }
};

export const tenantAware = (tableName: string) => {
  return {
    findMany: (args: any = {}) => {
      const organizationId = getCurrentOrganizationId();
      return (prisma as any)[tableName].findMany({
        ...args,
        where: addTenantFilter(args.where || {}, organizationId),
      });
    },

    findUnique: (args: any) => {
      const organizationId = getCurrentOrganizationId();
      return (prisma as any)[tableName].findUnique({
        ...args,
        where: addTenantFilter(args.where || {}, organizationId),
      });
    },

    create: (args: any) => {
      const organizationId = getCurrentOrganizationId();
      return (prisma as any)[tableName].create({
        ...args,
        data: {
          ...args.data,
          organizationId,
        },
      });
    },

    update: (args: any) => {
      const organizationId = getCurrentOrganizationId();
      return (prisma as any)[tableName].update({
        ...args,
        where: addTenantFilter(args.where || {}, organizationId),
      });
    },

    delete: (args: any) => {
      const organizationId = getCurrentOrganizationId();
      return (prisma as any)[tableName].delete({
        ...args,
        where: addTenantFilter(args.where || {}, organizationId),
      });
    },

    count: (args: any = {}) => {
      const organizationId = getCurrentOrganizationId();
      return (prisma as any)[tableName].count({
        ...args,
        where: addTenantFilter(args.where || {}, organizationId),
      });
    },
  };
};

// Thread-local storage for organization context (simplified version)
let currentOrganizationId: string | null = null;

export const setCurrentOrganizationId = (organizationId: string): void => {
  currentOrganizationId = organizationId;
};

export const getCurrentOrganizationId = (): string => {
  if (!currentOrganizationId) {
    throw new Error('No organization context available');
  }
  return currentOrganizationId;
};

export const clearCurrentOrganizationId = (): void => {
  currentOrganizationId = null;
};