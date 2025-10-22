import { FastifyInstance } from 'fastify';
import { prisma } from '@/utils/database';
import { ResponseHelper } from '@/utils/response';

/**
 * 📅 Subscriptions Routes - API de Assinaturas dos Alunos
 */
export default async function subscriptionsRoutes(fastify: FastifyInstance) {
  
  // GET /api/subscriptions - Listar todas as assinaturas ativas
  fastify.get('/', async (request, reply) => {
    try {
      // 🔧 TEMPORARY: Use hardcoded organizationId when no auth
      const organizationId = request.user?.organizationId || '452c0b35-1822-4890-851e-922356c812fb';
      
      const subscriptions = await prisma.studentSubscription.findMany({
        where: {
          organizationId,
          status: 'ACTIVE'
        },
        include: {
          student: {
            select: {
              id: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          plan: {
            select: {
              name: true,
              price: true,
              billingType: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      return ResponseHelper.success(reply, subscriptions);
      
    } catch (error) {
      console.error('Erro ao buscar assinaturas:', error);
      return ResponseHelper.error(reply, error);
    }
  });

  // GET /api/subscriptions/:id - Buscar assinatura específica
  fastify.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const organizationId = request.user?.organizationId || '452c0b35-1822-4890-851e-922356c812fb';
      
      const subscription = await prisma.studentSubscription.findFirst({
        where: {
          id,
          organizationId
        },
        include: {
          student: {
            select: {
              id: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          },
          plan: {
            select: {
              name: true,
              description: true,
              price: true,
              billingType: true,
              classesPerWeek: true
            }
          }
        }
      });
      
      if (!subscription) {
        return ResponseHelper.notFound(reply, 'Assinatura não encontrada');
      }
      
      return ResponseHelper.success(reply, subscription);
      
    } catch (error) {
      console.error('Erro ao buscar assinatura:', error);
      return ResponseHelper.error(reply, error);
    }
  });

  // PATCH /api/subscriptions/:id - Editar assinatura
  fastify.patch('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { currentPrice, startDate, status } = request.body as { currentPrice?: number; startDate?: string; status?: string };
      const organizationId = request.user?.organizationId || '452c0b35-1822-4890-851e-922356c812fb';
      
      // Buscar assinatura
      const subscription = await prisma.studentSubscription.findFirst({ where: { id, organizationId } });
      if (!subscription) {
        return ResponseHelper.notFound(reply, 'Assinatura não encontrada');
      }
      
      // Se for ativar, garantir que não há outra ativa para o mesmo aluno
      if (status === 'ACTIVE') {
        const otherActive = await prisma.studentSubscription.findFirst({
          where: {
            studentId: subscription.studentId,
            status: 'ACTIVE',
            id: { not: id }
          }
        });
        if (otherActive) {
          return ResponseHelper.badRequest(reply, 'Já existe outra assinatura ativa para este aluno');
        }
      }
      
      // Atualizar assinatura
      const updated = await prisma.studentSubscription.update({
        where: { id },
        data: {
          currentPrice: currentPrice !== undefined ? currentPrice : subscription.currentPrice,
          startDate: startDate ? new Date(startDate) : subscription.startDate,
          status: status || subscription.status
        }
      });
      
      return ResponseHelper.success(reply, updated, 'Assinatura atualizada');
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  });

  // DELETE /api/subscriptions/:id - Deletar assinatura
  fastify.delete('/:id', {
    schema: {
      description: 'Delete subscription',
      tags: ['Subscriptions'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const organizationId = request.headers['x-organization-id'] as string || 
                            request.user?.organizationId || 
                            '452c0b35-1822-4890-851e-922356c812fb';
      
      console.log(`🗑️ DELETE /api/subscriptions/${id} - organizationId: ${organizationId}`);
      
      // Buscar assinatura
      const subscription = await prisma.studentSubscription.findFirst({
        where: {
          id,
          organizationId
        }
      });
      
      console.log(`   subscription found:`, subscription ? `✅ ${subscription.id}` : '❌ null');
      
      if (!subscription) {
        return ResponseHelper.notFound(reply, 'Assinatura não encontrada');
      }
      
      // Verificar se há checkins/frequências
      const attendances = await prisma.studentAttendance.count({
        where: {
          studentId: subscription.studentId
        }
      });
      
      console.log(`   attendances count: ${attendances}`);
      
      if (attendances > 0) {
        console.log(`   ❌ Cannot delete - has attendances`);
        return ResponseHelper.badRequest(
          reply, 
          `Não é possível deletar. Este aluno tem ${attendances} entrada(s) no sistema`
        );
      }
      
      // Deletar assinatura
      console.log(`   ✅ Proceeding with delete...`);
      await prisma.studentSubscription.delete({
        where: { id }
      });
      
      console.log(`   ✅ Delete completed successfully`);
      return ResponseHelper.success(reply, { id }, 'Assinatura deletada com sucesso');
      
    } catch (error) {
      console.error('❌ Erro ao deletar assinatura:', error);
      console.error('   Error message:', (error as any)?.message);
      return ResponseHelper.error(reply, error);
    }
  });
}
