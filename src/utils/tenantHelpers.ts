import { FastifyRequest, FastifyReply } from 'fastify';
import { ResponseHelper } from '@/utils/response';

// Resolve organizationId from authenticated user, request headers, query string, or request body
export function resolveOrganizationId(request: FastifyRequest): string | undefined {
  const fromUser = (request as any).user?.organizationId as string | undefined;
  const fromHeader = request.headers['x-organization-id'] as string | undefined;
  const fromQuery = (request.query as any)?.organizationId as string | undefined;
  const fromBody = (request.body as any)?.organizationId as string | undefined;
  
  const orgId = fromUser || fromHeader || fromQuery || fromBody;
  
  // Sanitize organizationId (remove quotes if present)
  if (orgId) {
    return orgId.replace(/['"]/g, '');
  }
  
  return orgId;
}

// Ensure an organizationId is present, otherwise return a 400 response
export function requireOrganizationId(
  request: FastifyRequest,
  reply: FastifyReply
): string | undefined {
  const organizationId = resolveOrganizationId(request);
  if (!organizationId) {
    ResponseHelper.error(reply, 'Organization context required', 400);
    return undefined;
  }
  return organizationId;
}

