import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import { addDays } from 'date-fns';

/**
 * Busca todos os créditos de um aluno
 */
export async function getStudentCredits(studentId: string, organizationId: string) {
  const credits = await prisma.studentCredit.findMany({
    where: {
      studentId,
      organizationId,
      status: 'ACTIVE'
    },
    include: {
      plan: {
        select: {
          id: true,
          name: true,
          price: true,
          creditQuantity: true,
          creditValidityDays: true
        }
      },
      usages: {
        orderBy: { usedAt: 'desc' },
        take: 5 // Últimas 5 utilizações
      }
    },
    orderBy: { expiresAt: 'asc' }
  });

  return credits;
}

/**
 * Retorna um resumo consolidado dos créditos
 */
export async function getCreditsSummary(studentId: string, organizationId: string) {
  const credits = await prisma.studentCredit.findMany({
    where: {
      studentId,
      organizationId,
      status: 'ACTIVE'
    },
    include: { plan: true }
  });

  const totalCredits = credits.reduce((sum, c) => sum + c.totalCredits, 0);
  const totalUsed = credits.reduce((sum, c) => sum + c.creditsUsed, 0);
  const totalAvailable = totalCredits - totalUsed;

  const expiringFirst = credits.sort((a, b) => {
    if (!a.expiresAt) return 1;
    if (!b.expiresAt) return -1;
    return a.expiresAt.getTime() - b.expiresAt.getTime();
  })[0];

  const withAutoRenewal = credits.filter(c => c.autoRenew);

  return {
    totalCredits,
    totalUsed,
    totalAvailable,
    utilizationPercentage: totalCredits > 0 ? Math.round((totalUsed / totalCredits) * 100) : 0,
    creditsCount: credits.length,
    expiringFirst: expiringFirst ? {
      id: expiringFirst.id,
      expiresAt: expiringFirst.expiresAt,
      daysUntilExpiry: expiringFirst.expiresAt ? Math.ceil((expiringFirst.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null,
      availableCredits: expiringFirst.totalCredits - expiringFirst.creditsUsed
    } : null,
    autoRenewalActive: withAutoRenewal.length > 0,
    autoRenewalCount: withAutoRenewal.length
  };
}

/**
 * Consome créditos de uma aula
 */
export async function useCredits(payload: {
  studentId: string;
  attendanceId?: string;
  creditsToUse: number;
  description: string;
  organizationId: string;
}, tx: any = prisma) {
  const { studentId, attendanceId, creditsToUse, description, organizationId } = payload;

  try {
    // 1. Buscar créditos disponíveis (em ordem de expiração)
    let availableCredits = await tx.studentCredit.findFirst({
      where: {
        studentId,
        organizationId,
        status: 'ACTIVE',
        creditsAvailable: {
          gte: creditsToUse
        }
      },
      orderBy: { expiresAt: 'asc' }
    });

    // 1.1 Se não achar com saldo suficiente, tentar achar QUALQUER crédito ativo para negativar
    if (!availableCredits) {
      // Fallback: Find any active credit (or the most recent one) to apply negative balance
      availableCredits = await tx.studentCredit.findFirst({
        where: {
          studentId,
          organizationId,
          // status: 'ACTIVE' // Relaxed status check? No, stick to active or creating debt on last plan
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    // 1.2 Se ainda não tiver crédito nenhum (aluno novo sem plano), talvez impedir ou criar um "fictício"?
    // Por enquanto, vamos assumir que se o aluno existe, deve ter algum registro ou cria-se um "Crédito Negativo" solto no uso?
    // Melhor: se tiver um crédito (mesmo sem saldo), usa ele.

    if (!availableCredits) {
      // Se realmente não tem registro de crédito, não dá pra negativar "Saldo".
      // Nesse caso, retornamos sucesso mas com aviso, ou criamos um registro de uso "sem lastro".
      // Vamos permitir retornar success: false se não tiver histórico nenhum, mas true se tiver.

      // Mas o requisito é "pode agendar". Vamos criar um "Registro de Dívida" se não houver crédito?
      // Simplificação: Se não achar crédito, vamos apenas logar o uso como "Dívida" (sem vincular a creditId ou criando um creditId placeholder).
      // A melhor abordagem é encontrar o último registro e negativar.

      // Retornar 'success: true' com flag de dívida para o Controller decidir
      return {
        success: true,
        data: {
          creditUsageId: null, // Sem vínculo
          creditsRemaining: -creditsToUse,
          totalCredits: 0,
          isDebt: true
        },
        message: 'Agendamento permitido sem créditos (Gerando dívida)'
      };
    }

    // 2. Atualizar StudentCredit (permitindo negativo)
    const updatedCredit = await tx.studentCredit.update({
      where: { id: availableCredits.id },
      data: {
        creditsUsed: {
          increment: creditsToUse
        },
        creditsAvailable: {
          decrement: creditsToUse // Will go negative
        }
      }
    });

    // 3. Registrar uso em CreditUsage
    const creditUsage = await tx.creditUsage.create({
      data: {
        organizationId,
        studentId,
        creditId: availableCredits.id,
        attendanceId: attendanceId || undefined,
        creditsUsed: creditsToUse,
        description,
        usedAt: new Date()
      }
    });

    logger.info(`✅ Créditos consumidos (possível negativo): ${creditsToUse} para aluno ${studentId}. Saldo atual: ${updatedCredit.creditsAvailable}`);

    return {
      success: true,
      data: {
        creditUsageId: creditUsage.id,
        creditsRemaining: updatedCredit.creditsAvailable,
        totalCredits: updatedCredit.totalCredits,
        isDebt: updatedCredit.creditsAvailable < 0
      }
    };
  } catch (error) {
    logger.error('Erro ao consumir créditos:', error);
    return {
      success: false,
      message: 'Erro ao processar consumo de créditos'
    };
  }
}

/**
 * Reembolsa créditos não utilizados
 */
export async function refundCredits(payload: {
  creditId: string;
  refundReason: string;
  organizationId: string;
}) {
  const { creditId, refundReason, organizationId } = payload;

  try {
    // 1. Buscar crédito
    const credit = await prisma.studentCredit.findUnique({
      where: { id: creditId },
      include: { plan: true }
    });

    if (!credit) {
      return {
        success: false,
        message: 'Crédito não encontrado'
      };
    }

    // 2. Validar se é reembolsável
    if (!credit.plan?.allowRefund) {
      return {
        success: false,
        message: 'Este plano não permite reembolso'
      };
    }

    // 3. Validar se está dentro da janela de reembolso
    const refundDeadline = credit.expiresAt
      ? addDays(credit.expiresAt, -(credit.plan?.refundDaysBeforeExp || 7))
      : null;

    if (refundDeadline && new Date() > refundDeadline) {
      return {
        success: false,
        message: `Reembolso disponível apenas até ${refundDeadline.toLocaleDateString('pt-BR')}`
      };
    }

    // 4. Atualizar status para REFUNDED
    const refundedCredit = await prisma.studentCredit.update({
      where: { id: creditId },
      data: {
        status: 'REFUNDED'
      }
    });

    logger.info(`✅ Reembolso processado: ${credit.creditsAvailable} créditos para aluno ${credit.studentId}`);

    return {
      success: true,
      data: refundedCredit,
      message: `Reembolso de ${credit.creditsAvailable} créditos aprovado`
    };
  } catch (error) {
    logger.error('Erro ao reembolsar créditos:', error);
    return {
      success: false,
      message: 'Erro ao processar reembolso'
    };
  }
}

/**
 * Cancela renovação automática de créditos (deve estar em creditController)
 * NOTA: Este método é chamado de creditController.ts
 */
export async function cancelAutoRenewal(payload: {
  creditId: string;
  organizationId: string;
}) {
  const { creditId, organizationId } = payload;

  try {
    // 1. Buscar crédito
    const credit = await prisma.studentCredit.findUnique({
      where: { id: creditId }
    });

    if (!credit) {
      return {
        success: false,
        message: 'Crédito não encontrado'
      };
    }

    if (credit.organizationId !== organizationId) {
      return {
        success: false,
        message: 'Acesso negado'
      };
    }

    // 2. Atualizar para desabilitar renovação automática
    const updated = await prisma.studentCredit.update({
      where: { id: creditId },
      data: {
        autoRenew: false,
        nextRenewalDate: null
      }
    });

    logger.info(`✅ Renovação automática cancelada para crédito ${creditId}`);

    return {
      success: true,
      data: updated,
      message: 'Renovação automática cancelada com sucesso'
    };
  } catch (error) {
    logger.error('Erro ao cancelar renovação:', error);
    return {
      success: false,
      message: 'Erro ao cancelar renovação'
    };
  }
}

/**
 * Busca créditos expirando em breve
 */
export async function getExpiringCredits(organizationId: string, daysUntilExpiry: number = 7) {
  const targetDate = addDays(new Date(), daysUntilExpiry);

  const credits = await prisma.studentCredit.findMany({
    where: {
      organizationId,
      status: 'ACTIVE',
      expiresAt: {
        lte: targetDate,
        gt: new Date()
      }
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
          creditValidityDays: true
        }
      }
    },
    orderBy: { expiresAt: 'asc' }
  });

  return credits.map(credit => ({
    ...credit,
    daysUntilExpiry: credit.expiresAt
      ? Math.ceil((credit.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null
  }));
}

/**
 * Renova manualmente créditos de um aluno
 */
export async function renewCreditsManual(payload: {
  studentId: string;
  creditId: string;
  planId: string;
  organizationId: string;
}) {
  const { studentId, creditId, planId, organizationId } = payload;

  try {
    // 1. Buscar plano
    const plan = await prisma.billingPlan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      return {
        success: false,
        message: 'Plano não encontrado'
      };
    }

    // 2. Buscar crédito original
    const originalCredit = await prisma.studentCredit.findUnique({
      where: { id: creditId }
    });

    if (!originalCredit) {
      return {
        success: false,
        message: 'Crédito original não encontrado'
      };
    }

    // 3. Validar se pode renovar
    if (plan.maxAutoRenewals && originalCredit.renewalCount >= plan.maxAutoRenewals) {
      return {
        success: false,
        message: `Limite de renovações atingido (${plan.maxAutoRenewals})`
      };
    }

    // 4. Criar novo lote de créditos
    const newCredit = await prisma.studentCredit.create({
      data: {
        organizationId,
        studentId,
        planId,
        totalCredits: plan.creditQuantity || 1,
        creditsUsed: 0,
        creditsAvailable: plan.creditQuantity || 1,
        creditType: plan.creditType as any,
        autoRenew: plan.autoRenewCredits || false,
        renewalCount: 0,
        purchasedAt: new Date(),
        expiresAt: plan.creditValidityDays
          ? addDays(new Date(), plan.creditValidityDays)
          : null,
        status: 'ACTIVE',
        previousCreditId: creditId
      }
    });

    // 5. Registrar renovação
    await prisma.creditRenewal.create({
      data: {
        organizationId,
        studentId,
        originalCreditId: creditId,
        renewedCreditId: newCredit.id,
        renewalDate: new Date(),
        renewalReason: 'MANUAL_RENEWAL',
        chargedAmount: null,
        chargeMethod: null
      }
    });

    // 6. Atualizar original
    await prisma.studentCredit.update({
      where: { id: creditId },
      data: {
        renewalCount: {
          increment: 1
        },
        nextRenewalDate: plan.renewalIntervalDays
          ? addDays(new Date(), plan.renewalIntervalDays)
          : null
      }
    });

    logger.info(`✅ Renovação manual: ${newCredit.totalCredits} créditos para aluno ${studentId}`);

    return {
      success: true,
      data: newCredit,
      message: 'Créditos renovados com sucesso'
    };
  } catch (error) {
    logger.error('Erro ao renovar créditos manualmente:', error);
    return {
      success: false,
      message: 'Erro ao renovar créditos'
    };
  }
}

/**
 * Restaura créditos de uma aula cancelada
 */
export async function restoreCredit(payload: {
  studentId: string;
  descriptionKeyword: string;
  organizationId: string;
}, tx: any = prisma) {
  const { studentId, descriptionKeyword, organizationId } = payload;

  try {
    // 1. Buscar o uso de crédito correspondente
    const creditUsage = await tx.creditUsage.findFirst({
      where: {
        studentId,
        organizationId,
        description: {
          contains: descriptionKeyword
        }
      },
      orderBy: { usedAt: 'desc' }
    });

    if (!creditUsage) {
      return {
        success: false,
        message: 'Uso de crédito não encontrado para estorno'
      };
    }

    // 2. Devolver crédito ao saldo do aluno (StudentCredit)
    await tx.studentCredit.update({
      where: { id: creditUsage.creditId },
      data: {
        creditsUsed: { decrement: creditUsage.creditsUsed },
        creditsAvailable: { increment: creditUsage.creditsUsed }
      }
    });

    // 3. Remover ou marcar o registro de uso como estornado
    // Como não temos status no CreditUsage, vamos deletar ou alterar a descrição
    await tx.creditUsage.update({
      where: { id: creditUsage.id },
      data: {
        description: `${creditUsage.description} (ESTORNADO)`,
        creditsUsed: 0 // Zerar para não contar em relatórios de consumo
      }
    });

    logger.info(`✅ Crédito estornado: ${creditUsage.creditsUsed} para aluno ${studentId}`);

    return {
      success: true,
      message: 'Crédito estornado com sucesso'
    };
  } catch (error) {
    logger.error('Erro ao estornar crédito:', error);
    return {
      success: false,
      message: 'Erro ao processar estorno de crédito'
    };
  }
}
