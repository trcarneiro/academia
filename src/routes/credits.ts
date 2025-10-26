import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import * as creditService from '@/services/creditService';
import { logger } from '@/utils/logger';
import { requireOrganizationId } from '@/utils/tenantHelpers';

export default async function creditsRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/credits/student/:studentId
   * Busca todos os créditos de um aluno
   */
  fastify.get('/student/:studentId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { studentId } = request.params as { studentId: string };
      const organizationId = requireOrganizationId(request, reply);
      if (!organizationId) return;

      if (!studentId || !organizationId) {
        return reply.code(400).send({
          success: false,
          message: 'studentId e organizationId são obrigatórios'
        });
      }

      const credits = await creditService.getStudentCredits(studentId, organizationId);

      return reply.send({
        success: true,
        data: credits,
        total: credits.length
      });
    } catch (error) {
      logger.error('Erro ao buscar créditos:', error);
      return reply.code(500).send({
        success: false,
        message: 'Erro ao buscar créditos'
      });
    }
  });

  /**
   * GET /api/credits/summary/:studentId
   * Retorna resumo consolidado dos créditos
   */
  fastify.get('/summary/:studentId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { studentId } = request.params as { studentId: string };
      const organizationId = requireOrganizationId(request, reply);
      if (!organizationId) return;

      if (!studentId || !organizationId) {
        return reply.code(400).send({
          success: false,
          message: 'studentId e organizationId são obrigatórios'
        });
      }

      const summary = await creditService.getCreditsSummary(studentId, organizationId);

      return reply.send({
        success: true,
        data: summary
      });
    } catch (error) {
      logger.error('Erro ao buscar resumo de créditos:', error);
      return reply.code(500).send({
        success: false,
        message: 'Erro ao buscar resumo de créditos'
      });
    }
  });

  /**
   * POST /api/credits/use
   * Consome créditos de uma aula
   */
  fastify.post('/use', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const organizationId = requireOrganizationId(request, reply);
      if (!organizationId) return;

      if (!organizationId) {
        return reply.code(400).send({
          success: false,
          message: 'organizationId é obrigatório'
        });
      }

      const { studentId, attendanceId, creditsToUse, description } = request.body as any;

      if (!studentId || !attendanceId || !creditsToUse) {
        return reply.code(400).send({
          success: false,
          message: 'studentId, attendanceId e creditsToUse são obrigatórios'
        });
      }

      const result = await creditService.useCredits({
        studentId,
        attendanceId,
        creditsToUse,
        description: description || 'Aula frequentada',
        organizationId
      });

      const statusCode = result.success ? 200 : 400;
      return reply.code(statusCode).send(result);
    } catch (error) {
      logger.error('Erro ao consumir créditos:', error);
      return reply.code(500).send({
        success: false,
        message: 'Erro ao consumir créditos'
      });
    }
  });

  /**
   * POST /api/credits/refund
   * Reembolsa créditos não utilizados
   */
  fastify.post('/refund', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const organizationId = requireOrganizationId(request, reply);
      if (!organizationId) return;

      if (!organizationId) {
        return reply.code(400).send({
          success: false,
          message: 'organizationId é obrigatório'
        });
      }

      const { creditId, refundReason } = request.body as any;

      if (!creditId) {
        return reply.code(400).send({
          success: false,
          message: 'creditId é obrigatório'
        });
      }

      const result = await creditService.refundCredits({
        creditId,
        refundReason: refundReason || 'Reembolso solicitado',
        organizationId
      });

      const statusCode = result.success ? 200 : 400;
      return reply.code(statusCode).send(result);
    } catch (error) {
      logger.error('Erro ao reembolsar créditos:', error);
      return reply.code(500).send({
        success: false,
        message: 'Erro ao reembolsar créditos'
      });
    }
  });

  /**
   * GET /api/credits/expiring-soon
   * Busca créditos expirando em breve
   */
  fastify.get('/expiring-soon', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const organizationId = requireOrganizationId(request, reply);
      if (!organizationId) return;
      const { days } = request.query as { days?: string };

      if (!organizationId) {
        return reply.code(400).send({
          success: false,
          message: 'organizationId é obrigatório'
        });
      }

      const daysUntilExpiry = days ? parseInt(days, 10) : 7;
      const credits = await creditService.getExpiringCredits(organizationId, daysUntilExpiry);

      return reply.send({
        success: true,
        data: credits,
        total: credits.length,
        filters: {
          daysUntilExpiry
        }
      });
    } catch (error) {
      logger.error('Erro ao buscar créditos expirando:', error);
      return reply.code(500).send({
        success: false,
        message: 'Erro ao buscar créditos expirando'
      });
    }
  });

  /**
   * POST /api/credits/renew-manual
   * Renova manualmente créditos de um aluno
   */
  fastify.post('/renew-manual', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const organizationId = requireOrganizationId(request, reply);
      if (!organizationId) return;

      if (!organizationId) {
        return reply.code(400).send({
          success: false,
          message: 'organizationId é obrigatório'
        });
      }

      const { studentId, creditId, planId } = request.body as any;

      if (!studentId || !creditId || !planId) {
        return reply.code(400).send({
          success: false,
          message: 'studentId, creditId e planId são obrigatórios'
        });
      }

      const result = await creditService.renewCreditsManual({
        studentId,
        creditId,
        planId,
        organizationId
      });

      const statusCode = result.success ? 200 : 400;
      return reply.code(statusCode).send(result);
    } catch (error) {
      logger.error('Erro ao renovar créditos:', error);
      return reply.code(500).send({
        success: false,
        message: 'Erro ao renovar créditos'
      });
    }
  });

  /**
   * PATCH /api/credits/:creditId/cancel-renewal
   * Cancela renovação automática de créditos
   */
  fastify.patch('/:creditId/cancel-renewal', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { creditId } = request.params as { creditId: string };
      const organizationId = request.headers['x-organization-id'] as string;

      if (!creditId || !organizationId) {
        return reply.code(400).send({
          success: false,
          message: 'creditId e organizationId são obrigatórios'
        });
      }

      // Buscar crédito
      const credit = await (global as any).prisma.studentCredit.findUnique({
        where: { id: creditId }
      });

      if (!credit) {
        return reply.code(404).send({
          success: false,
          message: 'Crédito não encontrado'
        });
      }

      if (credit.organizationId !== organizationId) {
        return reply.code(403).send({
          success: false,
          message: 'Acesso negado'
        });
      }

      // Atualizar para desabilitar renovação automática
      const updated = await (global as any).prisma.studentCredit.update({
        where: { id: creditId },
        data: {
          autoRenew: false,
          nextRenewalDate: null
        }
      });

      logger.info(`✅ Renovação automática cancelada para crédito ${creditId}`);

      return reply.send({
        success: true,
        data: updated,
        message: 'Renovação automática cancelada com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao cancelar renovação:', error);
      return reply.code(500).send({
        success: false,
        message: 'Erro ao cancelar renovação'
      });
    }
  });

  /**
   * GET /api/credits/renewal-history/:studentId
   * Busca histórico de renovações de um aluno
   */
  fastify.get('/renewal-history/:studentId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { studentId } = request.params as { studentId: string };
      const organizationId = request.headers['x-organization-id'] as string;

      if (!studentId || !organizationId) {
        return reply.code(400).send({
          success: false,
          message: 'studentId e organizationId são obrigatórios'
        });
      }

      const renewals = await (global as any).prisma.creditRenewal.findMany({
        where: {
          studentId,
          organizationId
        },
        include: {
          originalCredit: {
            select: {
              id: true,
              totalCredits: true,
              expiresAt: true
            }
          },
          renewedCredit: {
            select: {
              id: true,
              totalCredits: true,
              expiresAt: true
            }
          }
        },
        orderBy: { renewalDate: 'desc' }
      });

      return reply.send({
        success: true,
        data: renewals,
        total: renewals.length
      });
    } catch (error) {
      logger.error('Erro ao buscar histórico de renovações:', error);
      return reply.code(500).send({
        success: false,
        message: 'Erro ao buscar histórico de renovações'
      });
    }
  });
}
