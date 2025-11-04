import { FastifyRequest, FastifyReply } from 'fastify';
import { ResponseHelper } from '@/utils/response';

// Resolve organizationId from authenticated user or request headers
export function resolveOrganizationId(request: FastifyRequest): string | undefined {
  const fromUser = (request as any).user?.organizationId as string | undefined;
  const fromHeader = request.headers['x-organization-id'] as string | undefined;
  return fromUser || fromHeader;
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

