import { FastifyInstance } from 'fastify';
import { prisma } from '@/utils/database';
import { ResponseHelper } from '@/utils/response';
import StudentCourseService from '@/services/studentCourseService';

/**
 * Helper: Extract organizationId from request or use fallback
 */
function getOrganizationId(request: any): string {
  return request.user?.organizationId || 
         request.headers['x-organization-id'] as string ||
         'ff5ee00e-d8a3-4291-9428-d28b852fb472'; // Smart Defence Demo (fallback)
}

/**
 * Helper: Desativar todas as assinaturas ativas de um aluno
 * Garante que cada aluno tenha apenas UMA assinatura ativa
 */
async function deactivateOtherSubscriptions(studentId: string, exceptSubscriptionId?: string): Promise<number> {
  const whereClause: any = {
    studentId,
    status: 'ACTIVE'
  };
  
  if (exceptSubscriptionId) {
    whereClause.id = { not: exceptSubscriptionId };
  }
  
  const result = await prisma.studentSubscription.updateMany({
    where: whereClause,
    data: { status: 'INACTIVE', isActive: false }
  });
  
  if (result.count > 0) {
    console.log(`⚠️ ${result.count} assinatura(s) anterior(es) desativada(s) automaticamente para aluno ${studentId}`);
  }
  
  return result.count;
}

/**
 * 📅 Subscriptions Routes - API de Assinaturas dos Alunos
 */
export default async function subscriptionsRoutes(fastify: FastifyInstance) {
  
  // GET /api/subscriptions - Listar todas as assinaturas ativas
  fastify.get('/', async (request, reply) => {
    try {
      const organizationId = getOrganizationId(request);
      
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
      const organizationId = getOrganizationId(request);
      
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

  // POST /api/subscriptions - Criar nova assinatura
  fastify.post('/', {
    schema: {
      description: 'Create new subscription for student',
      tags: ['Subscriptions'],
      body: {
        type: 'object',
        required: ['studentId', 'planId'],
        properties: {
          studentId: { type: 'string', format: 'uuid' },
          planId: { type: 'string' },
          startDate: { type: 'string', format: 'date' },
          status: { type: 'string', enum: ['ACTIVE', 'PENDING', 'INACTIVE'] }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { studentId, planId, startDate, status = 'ACTIVE' } = request.body as { 
        studentId: string; 
        planId: string;
        startDate?: string;
        status?: string;
      };
      const organizationId = getOrganizationId(request);
      
      console.log(`📝 POST /api/subscriptions - studentId: ${studentId}, planId: ${planId}`);
      
      // Verificar se aluno existe
      const student = await prisma.student.findFirst({
        where: { id: studentId, organizationId }
      });
      
      if (!student) {
        return ResponseHelper.notFound(reply, 'Aluno não encontrado');
      }
      
      // Verificar se plano existe
      const plan = await prisma.billingPlan.findFirst({
        where: { id: planId, organizationId, isActive: true }
      });
      
      if (!plan) {
        return ResponseHelper.notFound(reply, 'Plano não encontrado');
      }
      
      // Desativar assinaturas ativas anteriores (cada aluno só pode ter UMA ativa)
      if (status === 'ACTIVE') {
        await deactivateOtherSubscriptions(studentId);
      }
      
      // Criar assinatura
      const subscription = await prisma.studentSubscription.create({
        data: {
          studentId,
          planId,
          organizationId,
          status: status as any,
          startDate: startDate ? new Date(startDate) : new Date(),
          currentPrice: plan.price,
          billingType: plan.billingType
        },
        include: {
          plan: {
            select: {
              name: true,
              price: true,
              billingType: true
            }
          },
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
          }
        }
      });
      
      // Ativar o aluno se a assinatura for ACTIVE
      if (status === 'ACTIVE') {
        await prisma.student.update({
          where: { id: studentId },
          data: { isActive: true }
        });
        console.log(`✅ Aluno ${studentId} ativado`);

        // Trigger course activation logic
        try {
          await StudentCourseService.activateStudentCourses(studentId, organizationId);
          console.log(`✅ Cursos ativados automaticamente para aluno ${studentId}`);
        } catch (err) {
          console.error(`⚠️ Erro ao ativar cursos automaticamente:`, err);
          // Non-blocking error
        }
      }
      
      console.log(`✅ Assinatura criada: ${subscription.id}`);
      return ResponseHelper.success(reply, subscription, 'Assinatura criada com sucesso');
      
    } catch (error) {
      console.error('❌ Erro ao criar assinatura:', error);
      return ResponseHelper.error(reply, error);
    }
  });

  // PATCH /api/subscriptions/:id - Editar assinatura
  fastify.patch('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { currentPrice, startDate, status } = request.body as { currentPrice?: number; startDate?: string; status?: string };
      const organizationId = getOrganizationId(request);
      
      // Buscar assinatura
      const subscription = await prisma.studentSubscription.findFirst({ where: { id, organizationId } });
      if (!subscription) {
        return ResponseHelper.notFound(reply, 'Assinatura não encontrada');
      }
      
      // Se for ativar, desativar outras assinaturas ativas do mesmo aluno
      if (status === 'ACTIVE') {
        await deactivateOtherSubscriptions(subscription.studentId, id);
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
      const organizationId = getOrganizationId(request);
      
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
      const attendances = await prisma.attendance.count({
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

  // ==========================================
  // POST /api/subscriptions/reactivate - Gerar link de pagamento para reativação
  // ==========================================
  fastify.post('/reactivate', async (request, reply) => {
    try {
      const { studentId, planId } = request.body as { studentId: string; planId: string };
      const organizationId = getOrganizationId(request);
      
      if (!studentId || !planId) {
        return ResponseHelper.badRequest(reply, 'studentId e planId são obrigatórios');
      }

      // Buscar aluno com dados do usuário
      const student = await prisma.student.findFirst({
        where: { id: studentId, organizationId },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              cpf: true
            }
          },
          asaasCustomer: true
        }
      });

      if (!student) {
        return ResponseHelper.notFound(reply, 'Aluno não encontrado');
      }

      // Buscar plano selecionado
      const plan = await prisma.billingPlan.findFirst({
        where: { id: planId, organizationId, isActive: true }
      });

      if (!plan) {
        return ResponseHelper.notFound(reply, 'Plano não encontrado');
      }

      // Verificar se Asaas está configurado
      const asaasApiKey = process.env.ASAAS_API_KEY;
      const isSandbox = process.env.ASAAS_SANDBOX !== 'false';

      if (!asaasApiKey) {
        // Modo sem Asaas - criar subscription pendente localmente
        const subscription = await prisma.studentSubscription.create({
          data: {
            studentId,
            planId,
            organizationId,
            status: 'PENDING',
            startDate: new Date(),
            currentPrice: plan.price,
            billingType: plan.billingType
          },
          include: { plan: true }
        });

        return ResponseHelper.success(reply, {
          subscriptionId: subscription.id,
          plan: {
            name: plan.name,
            price: Number(plan.price)
          },
          paymentMethod: 'LOCAL',
          message: 'Procure a recepção para efetuar o pagamento'
        }, 'Solicitação de reativação criada');
      }

      // Modo com Asaas - gerar cobrança PIX
      const { AsaasService } = await import('@/services/asaasService');
      const asaasService = new AsaasService(asaasApiKey, isSandbox);

      // Verificar/Criar customer no Asaas
      let asaasCustomer = student.asaasCustomer;
      
      if (!asaasCustomer) {
        // Criar customer no Asaas
        const cpf = student.user.cpf?.replace(/\D/g, '') || '';
        if (cpf.length < 11) {
          return ResponseHelper.badRequest(reply, 'CPF do aluno não cadastrado. Procure a recepção.');
        }

        const asaasCustomerData = {
          name: `${student.user.firstName} ${student.user.lastName || ''}`.trim(),
          cpfCnpj: cpf,
          email: student.user.email || undefined,
          phone: student.user.phone?.replace(/\D/g, '') || undefined
        };

        const createdCustomer = await asaasService.createCustomer(asaasCustomerData);
        
        asaasCustomer = await prisma.asaasCustomer.create({
          data: {
            studentId: student.id,
            organizationId,
            asaasId: createdCustomer.id,
            name: asaasCustomerData.name,
            cpfCnpj: cpf,
            email: student.user.email
          }
        });
      }

      // Criar cobrança PIX no Asaas
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 3); // Vencimento em 3 dias

      const paymentData = {
        customer: asaasCustomer.asaasId,
        billingType: 'PIX' as const,
        value: Number(plan.price),
        dueDate: dueDate.toISOString().split('T')[0],
        description: `Reativação - ${plan.name} - ${student.user.firstName}`,
        externalReference: `reactivation_${studentId}_${Date.now()}`
      };

      const asaasPayment = await asaasService.createPayment(paymentData);

      // Buscar QR Code PIX
      let pixQrCode = null;
      let pixCopyPaste = null;
      
      try {
        const pixData = await asaasService.makeRequest<any>(`/payments/${asaasPayment.id}/pixQrCode`);
        pixQrCode = pixData.encodedImage;
        pixCopyPaste = pixData.payload;
      } catch (err) {
        console.warn('Não foi possível obter QR Code PIX:', err);
      }

      // Criar subscription pendente
      const subscription = await prisma.studentSubscription.create({
        data: {
          studentId,
          planId,
          organizationId,
          asaasCustomerId: asaasCustomer.id,
          status: 'PENDING',
          startDate: new Date(),
          currentPrice: plan.price,
          billingType: plan.billingType
        }
      });

      // Criar registro de pagamento
      await prisma.payment.create({
        data: {
          organizationId,
          studentId,
          subscriptionId: subscription.id,
          asaasCustomerId: asaasCustomer.id,
          amount: plan.price,
          description: paymentData.description,
          dueDate,
          status: 'PENDING',
          asaasPaymentId: asaasPayment.id,
          asaasChargeUrl: (asaasPayment as any).invoiceUrl || undefined,
          pixCode: pixCopyPaste || undefined
        }
      });

      return ResponseHelper.success(reply, {
        subscriptionId: subscription.id,
        paymentId: asaasPayment.id,
        plan: {
          name: plan.name,
          price: Number(plan.price)
        },
        pix: {
          qrCode: pixQrCode,
          copyPaste: pixCopyPaste,
          expiresAt: dueDate.toISOString()
        },
        invoiceUrl: (asaasPayment as any).invoiceUrl,
        paymentMethod: 'PIX'
      }, 'Pagamento PIX gerado com sucesso');

    } catch (error) {
      console.error('Erro ao criar reativação:', error);
      return ResponseHelper.error(reply, error);
    }
  });
}
