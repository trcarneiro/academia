import { FastifyRequest, FastifyReply } from 'fastify';
import { UserRole, TenantContext, AuthenticatedUser } from '@/types';
import { ResponseHelper } from '@/utils/response';
import { logger } from '@/utils/logger';
import { prisma } from '@/utils/database';

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

export const extractTenantContext = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  try {
    let organizationId: string | undefined;

    // Method 1: From authenticated user
    if (request.user) {
      organizationId = (request.user as AuthenticatedUser).organizationId;
    }

    // Method 2: From header (for API clients)
    if (!organizationId) {
      organizationId = request.headers['x-organization-id'] as string;
    }

    // Method 3: From subdomain (for SaaS)
    if (!organizationId) {
      const host = request.headers.host;
      if (host) {
        const subdomain = host.split('.')[0];
        if (subdomain !== 'api' && subdomain !== 'www') {
          // Find organization by slug (subdomain)
          const org = await prisma.organization.findUnique({
            where: { slug: subdomain },
            select: {
              id: true,
              name: true,
              slug: true,
              isActive: true,
              organizationSettings: true,
            },
          });
          
          if (org && org.isActive) {
            organizationId = org.id;
            request.tenant = {
              organizationId: org.id,
              organization: {
                id: org.id,
                name: org.name,
                slug: org.slug,
                settings: org.organizationSettings || undefined,
              },
            };
          }
        }
      }
    }

    // If we have organizationId but no tenant context yet, fetch it
    if (organizationId && !request.tenant) {
      try {
        // Check cache first
        let organization = getCachedOrg(organizationId);
        
        if (!organization) {
          // Not in cache, fetch from database with timeout
          const orgPromise = prisma.organization.findUnique({
            where: { id: organizationId },
            select: {
              id: true,
              name: true,
              slug: true,
              isActive: true,
              organizationSettings: true,
            },
          });

          // Timeout after 5 seconds (reduced from 10s)
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Organization fetch timeout')), 5000);
          });

          organization = await Promise.race([
            orgPromise,
            timeoutPromise
          ]) as any;
          
          // Cache the result
          if (organization) {
            setCachedOrg(organizationId, organization);
          }
        }

        if (!organization || !organization.isActive) {
          // ⚠️ TEMPORARY: In development, allow fallback to default organization
          // Rate-limited warning to avoid log spam
          const now = Date.now();
          const lastWarning = warningCache.get(organizationId);
          
          if (!lastWarning || (now - lastWarning) > WARNING_INTERVAL_MS) {
            logger.warn('⚠️ Organization not found, using development fallback:', {
              orgId: organizationId,
              path: request.url,
              method: request.method
            });
            warningCache.set(organizationId, now);
          }
          
          request.tenant = {
            organizationId,
            organization: {
              id: organizationId,
              name: 'Development Organization',
              slug: 'dev',
              settings: undefined,
            },
          };
          return; // Continue without error
          
          // TODO: Uncomment this when organization seeding is complete
          // return ResponseHelper.error(reply, 'Organization not found or inactive', 404);
        }

        request.tenant = {
          organizationId: organization.id,
          organization: {
            id: organization.id,
            name: organization.name,
            slug: organization.slug,
            settings: organization.organizationSettings || undefined,
          },
        };
      } catch (error: any) {
        logger.error('❌ Failed to fetch organization:', {
          organizationId,
          error: error.message,
          code: error.code
        });
        
        // Return 503 Service Unavailable for connection issues
        if (error.code === 'P2024' || error.code === 'P1017' || error.message?.includes('timeout')) {
          return ResponseHelper.error(reply, 'Database temporarily unavailable, please try again', 503);
        }
        
        // ⚠️ TEMPORARY: In development, allow fallback on errors
        logger.warn('⚠️ Failed to fetch organization, using development fallback');
        request.tenant = {
          organizationId,
          organization: {
            id: organizationId,
            name: 'Development Organization',
            slug: 'dev',
            settings: undefined,
          },
        };
        return; // Continue without error
        
        // TODO: Uncomment this when organization seeding is complete
        // return ResponseHelper.error(reply, 'Failed to load organization context', 500);
      }
    }

    // If still no tenant context found
    if (!request.tenant) {
      // ⚠️ TEMPORARY: Create default tenant context for development
      logger.warn('⚠️ No tenant context, using development fallback');
      request.tenant = {
        organizationId: 'ff5ee00e-d8a3-4291-9428-d28b852fb472',
        organization: {
          id: 'ff5ee00e-d8a3-4291-9428-d28b852fb472',
          name: 'Smart Defence (Dev)',
          slug: 'smart-defence',
          settings: undefined,
        },
      };
      return; // Continue without error
      
      // TODO: Uncomment this when organization seeding is complete
      // return ResponseHelper.error(reply, 'Organization context required', 400);
    }

    logger.debug(
      { organizationId: request.tenant.organizationId },
      'Tenant context extracted'
    );
  } catch (error) {
    logger.error({ error }, 'Failed to extract tenant context');
    return ResponseHelper.error(reply, 'Failed to determine organization context', 500);
  }
};

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