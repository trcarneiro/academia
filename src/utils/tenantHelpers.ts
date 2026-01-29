import { FastifyRequest, FastifyReply } from 'fastify';
import { ResponseHelper } from '@/utils/response';
import fs from 'fs';
import path from 'path';

// Debug logger
const debugLogFile = path.resolve('debug_requests.log');
function logToFile(msg: string) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(debugLogFile, `[${timestamp}] ${msg}\n`);
}

// Resolve organizationId from authenticated user, request headers, query string, or request body
export function resolveOrganizationId(request: FastifyRequest): string | undefined {
  const fromTenant = (request as any).tenant?.organizationId as string | undefined;
  const fromUser = (request as any).user?.organizationId as string | undefined;
  const fromHeader = request.headers['x-organization-id'] as string | undefined;
  const fromQuery = (request.query as any)?.organizationId as string | undefined;
  const fromBody = (request.body as any)?.organizationId as string | undefined;

  const orgId = fromTenant || fromUser || fromHeader || fromQuery || fromBody;

  logToFile(`🔍 resolveOrganizationId for ${request.url}: fromTenant=${fromTenant}, fromUser=${fromUser}, fromHeader=${fromHeader}, fromQuery=${fromQuery}, fromBody=${fromBody}`);

  // Sanitize organizationId (remove quotes if present)
  if (orgId) {
    const sanitized = orgId.replace(/['"]/g, '');
    logToFile(`✅ Result: ${sanitized}`);
    return sanitized;
  }

  logToFile('⚠️ Result: undefined');
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

