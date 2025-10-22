import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';

const ORG_ID = '452c0b35-1822-4890-851e-922356c812fb';

/**
 * Seed complementar com planos adicionais:
 * - Packs de Créditos (10, 20, 30 aulas)
 * - Trial 7 dias
 * - Aula Avulsa
 */

async function seedAdditionalPlans() {
  try {
    logger.info('🌱 Iniciando seed de PLANOS ADICIONAIS...');

    // PACKS DE CRÉDITOS
    logger.info('📦 Adicionando PACKS DE CRÉDITOS...');

    const creditPacks = await Promise.all([
      // Pack 10 Aulas
      prisma.billingPlan.upsert({
        where: { id: 'pack-10-aulas' },
        update: {},
        create: {
          id: 'pack-10-aulas',
          organizationId: ORG_ID,
          name: '📦 Pack 10 Aulas',
          description: '10 créditos (aulas avulsas) com validade de 90 dias',
          category: 'ADULT',
          price: 350.0,
          billingType: 'CREDITS',
          creditQuantity: 10,
          creditType: 'CLASS',
          creditValidityDays: 90,
          creditRenewalTrigger: 'MANUAL',
          creditRenewalMethod: 'SEPARATE',
          isActive: true,
          planType: 'CREDIT_PACK',
        },
      }),

      // Pack 20 Aulas (com 8% desconto)
      prisma.billingPlan.upsert({
        where: { id: 'pack-20-aulas' },
        update: {},
        create: {
          id: 'pack-20-aulas',
          organizationId: ORG_ID,
          name: '📦 Pack 20 Aulas',
          description: '20 créditos com 8% desconto (validade 120 dias)',
          category: 'ADULT',
          price: 644.0, // 20 × 35 = 700, menos 8% = 644
          billingType: 'CREDITS',
          creditQuantity: 20,
          creditType: 'CLASS',
          creditValidityDays: 120,
          creditRenewalTrigger: 'MANUAL',
          creditRenewalMethod: 'SEPARATE',
          isActive: true,
          planType: 'CREDIT_PACK',
        },
      }),

      // Pack 30 Aulas (com 15% desconto)
      prisma.billingPlan.upsert({
        where: { id: 'pack-30-aulas' },
        update: {},
        create: {
          id: 'pack-30-aulas',
          organizationId: ORG_ID,
          name: '📦 Pack 30 Aulas',
          description: '30 créditos com 15% desconto (validade 150 dias)',
          category: 'ADULT',
          price: 892.5, // 30 × 35 = 1050, menos 15% = 892.5
          billingType: 'CREDITS',
          creditQuantity: 30,
          creditType: 'CLASS',
          creditValidityDays: 150,
          creditRenewalTrigger: 'MANUAL',
          creditRenewalMethod: 'SEPARATE',
          isActive: true,
          planType: 'CREDIT_PACK',
        },
      }),
    ]);

    logger.info(`✅ ${creditPacks.length} Packs de Créditos criados`);

    // TRIAL E AULA AVULSA
    logger.info('🎉 Adicionando TRIAL e AULA AVULSA...');

    const specialPlans = await Promise.all([
      // Trial 7 dias
      prisma.billingPlan.upsert({
        where: { id: 'trial-7-dias' },
        update: {},
        create: {
          id: 'trial-7-dias',
          organizationId: ORG_ID,
          name: '🎉 Trial 7 Dias',
          description: 'Teste gratuito com 7 aulas experimentais (válido por 7 dias)',
          category: 'ADULT',
          price: 0.0,
          billingType: 'LIFETIME',
          creditQuantity: 7,
          creditType: 'CLASS',
          creditValidityDays: 7,
          creditRenewalTrigger: 'MANUAL',
          creditRenewalMethod: 'INCLUDED',
          maxAutoRenewals: 0,
          isActive: true,
          planType: 'TRIAL',
        },
      }),

      // Aula Avulsa
      prisma.billingPlan.upsert({
        where: { id: 'aula-avulsa' },
        update: {},
        create: {
          id: 'aula-avulsa',
          organizationId: ORG_ID,
          name: '✨ Aula Avulsa',
          description: 'Uma aula avulsa a qualquer momento (válida por 30 dias)',
          category: 'ADULT',
          price: 50.0,
          billingType: 'CREDITS',
          creditQuantity: 1,
          creditType: 'CLASS',
          creditValidityDays: 30,
          creditRenewalTrigger: 'MANUAL',
          creditRenewalMethod: 'SEPARATE',
          isActive: true,
          planType: 'CREDIT_PACK',
        },
      }),
    ]);

    logger.info(`✅ ${specialPlans.length} planos especiais (Trial + Avulsa) criados`);

    // RESUMO FINAL
    const totalAdditional = creditPacks.length + specialPlans.length;
    logger.info(`
╔════════════════════════════════════════════╗
║      ✅ SEED DE PLANOS ADICIONAIS         ║
╠════════════════════════════════════════════╣
║ 📦 Packs de Créditos:  ${creditPacks.length} planos    ║
║ 🎉 Trial + Avulsa:     ${specialPlans.length} planos    ║
║                                            ║
║ 📊 TOTAL ADICIONAIS:   ${totalAdditional} planos    ║
╚════════════════════════════════════════════╝

📈 RESUMO COMPLETO (Base + Adicionais):
   ✅ Personal: 4 planos
   ✅ Kids: 4 planos
   ✅ Adultos: 2 planos
   ✅ Adicionais: ${totalAdditional} planos
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🎉 TOTAL GERAL: 14 planos (10 base + ${totalAdditional} adicionais)
    `);

    logger.info('🎉 Todos os planos adicionais criados com sucesso!');
  } catch (error) {
    logger.error('❌ Erro ao fazer seed de adicionais:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
seedAdditionalPlans();
