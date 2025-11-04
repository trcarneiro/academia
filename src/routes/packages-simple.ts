import { FastifyInstance } from 'fastify';
import { prisma } from '@/utils/database';
import { ResponseHelper } from '@/utils/response';

/**
 * 📦 Packages Routes - API de Pacotes (Planos de Assinatura)
 * Versão simplificada sem schemas inline - TEMPORARY
 */
function resolveOrganizationId(request: any) {
  return request.user?.organizationId || '452c0b35-1822-4890-851e-922356c812fb';
}

function normalizeBillingType(rawType?: string) {
  if (!rawType) return 'MONTHLY';
  const upper = rawType.toUpperCase();
  if (['RECURRING', 'SUBSCRIPTION'].includes(upper)) return 'MONTHLY';
  if (upper === 'CREDIT') return 'CREDITS';
  if (['MONTHLY', 'QUARTERLY', 'YEARLY', 'CREDIT_CARD_INSTALLMENT', 'CREDITS'].includes(upper)) {
    return upper;
  }
  return upper;
}

function toOptionalNumber(value: any) {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function toOptionalStringNumber(value: any) {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed.toString();
}

function toOptionalBoolean(value: any) {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lower = value.trim().toLowerCase();
    if (['true', '1', 'on', 'yes'].includes(lower)) return true;
    if (['false', '0', 'off', 'no'].includes(lower)) return false;
  }
  if (typeof value === 'number') return value === 1;
  return Boolean(value);
}

function buildPackagePayload(body: any, options: { existing?: any; includeOrganization?: boolean; organizationId?: string } = {}) {
  const payload: Record<string, any> = {};

  if (options.includeOrganization && options.organizationId) {
    payload.organizationId = options.organizationId;
  }

  if (body.name !== undefined) payload.name = body.name;
  if (body.description !== undefined) payload.description = body.description;

  if (body.billingType !== undefined) {
    payload.billingType = normalizeBillingType(body.billingType);
  }

  if (body.price !== undefined) {
    payload.price = toOptionalStringNumber(body.price) ?? body.price;
  }

  if (body.classesPerWeek !== undefined) {
    const classes = toOptionalNumber(body.classesPerWeek);
    payload.classesPerWeek = classes === undefined ? null : classes;
  }

  if (body.maxClasses !== undefined) {
    payload.maxClasses = toOptionalNumber(body.maxClasses) ?? null;
  }

  if (body.pricePerClass !== undefined) {
    payload.pricePerClass = toOptionalStringNumber(body.pricePerClass) ?? body.pricePerClass;
  }

  if (body.creditsValidity !== undefined) {
    payload.creditsValidity = toOptionalNumber(body.creditsValidity) ?? null;
  }

  if (body.duration !== undefined) payload.duration = body.duration;

  if (body.features !== undefined) payload.features = body.features;

  const booleanFields = [
    'hasPersonalTraining',
    'hasNutrition',
    'isActive',
    'allowInstallments',
    'isRecurring',
    'allowFreeze',
    'accessAllModalities',
    'isUnlimitedAccess'
  ];

  booleanFields.forEach((field) => {
    const parsed = toOptionalBoolean(body[field]);
    if (parsed !== undefined) {
      payload[field] = parsed;
    }
  });

  if (payload.isUnlimitedAccess === true) {
    payload.classesPerWeek = null;
  }

  if (body.maxInstallments !== undefined) {
    payload.maxInstallments = toOptionalNumber(body.maxInstallments) ?? 1;
  }

  if (body.freezeMaxDays !== undefined) {
    payload.freezeMaxDays = toOptionalNumber(body.freezeMaxDays) ?? 0;
  }

  if (payload.isUnlimitedAccess) {
    payload.classesPerWeek = null;
  }

  return payload;
}

export default async function packagesRoutes(fastify: FastifyInstance) {
  // GET /api/packages - Listar todos os pacotes
  fastify.get('/', async (request, reply) => {
    try {
      // 🔧 TEMPORARY: Use hardcoded organizationId when no auth
      const organizationId = resolveOrganizationId(request);

      const packages = await prisma.billingPlan.findMany({
        where: { organizationId },
        include: {
          _count: {
            select: {
              subscriptions: true
            }
          }
        },
        orderBy: [
          { isActive: 'desc' },
          { price: 'asc' }
        ]
      });

      return ResponseHelper.success(reply, packages);
    } catch (error) {
      console.error('Erro ao buscar pacotes:', error);
      return ResponseHelper.error(reply, error);
    }
  });

  // GET /api/packages/:id - Buscar pacote específico
  fastify.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const organizationId = resolveOrganizationId(request);

      const packageData = await prisma.billingPlan.findFirst({
        where: { id, organizationId },
        include: {
          subscriptions: {
            include: {
              student: {
                include: { user: true }
              }
            }
          },
          _count: {
            select: {
              subscriptions: true
            }
          }
        }
      });

      if (!packageData) {
        return ResponseHelper.notFound(reply, 'Pacote não encontrado');
      }

      return ResponseHelper.success(reply, packageData);
    } catch (error) {
      console.error('Erro ao buscar pacote:', error);
      return ResponseHelper.error(reply, error);
    }
  });

  // POST /api/packages - Criar novo pacote (versão simplificada)
  fastify.post('/', async (request, reply) => {
    try {
      const organizationId = resolveOrganizationId(request);
      const body = request.body as any;

      const payload = buildPackagePayload(body, {
        includeOrganization: true,
        organizationId
      });

      if (!payload.name) {
        return ResponseHelper.badRequest(reply, 'Nome do pacote é obrigatório');
      }

      payload.billingType = payload.billingType || 'MONTHLY';
      payload.isActive = payload.isActive ?? true;
      payload.maxInstallments = payload.maxInstallments ?? 1;

      const created = await prisma.billingPlan.create({
        data: payload
      });

      return ResponseHelper.success(reply, created, 'Pacote criado com sucesso', 201);
    } catch (error) {
      console.error('Erro ao criar pacote:', error);
      return ResponseHelper.error(reply, error);
    }
  });

  // PUT /api/packages/:id - Atualizar pacote (versão simplificada)
  fastify.put('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const organizationId = resolveOrganizationId(request);
      const body = request.body as any;

      const existing = await prisma.billingPlan.findFirst({
        where: { id, organizationId }
      });

      if (!existing) {
        return ResponseHelper.notFound(reply, 'Pacote não encontrado');
      }

      const payload = buildPackagePayload(body);
      payload.updatedAt = new Date();

      const updated = await prisma.billingPlan.update({
        where: { id },
        data: payload
      });

      return ResponseHelper.success(reply, updated, 'Pacote atualizado com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar pacote:', error);
      return ResponseHelper.error(reply, error);
    }
  });
}

export {
  toOptionalNumber,
  toOptionalStringNumber,
  toOptionalBoolean,
  buildPackagePayload
};
