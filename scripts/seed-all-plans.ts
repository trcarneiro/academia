import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';

const ORG_ID = '452c0b35-1822-4890-851e-922356c812fb';

/**
 * Seed completo com todos os planos:
 * - Personal (Aulas Agendadas + Aulas por Créditos)
 * - Kids (4 tipos: 2 anuais + 2 mensais)
 * - Adultos Coletivos (Ilimitado + 2x/semana, anual + mensal)
 */

async function seedAllPlans() {
  try {
    logger.info('🌱 Iniciando seed de TODOS os planos...');

    // 1. PERSONAL TRAINING PLANS
    logger.info('💪 Adicionando planos de Personal Training...');

    const personalPlans = await Promise.all([
      // Personal: Aulas Agendadas (SEM reposição)
      prisma.billingPlan.upsert({
        where: { id: 'personal-agendado-1x' },
        update: {},
        create: {
          id: 'personal-agendado-1x',
          organizationId: ORG_ID,
          name: '💪 Personal - Aulas Agendadas (1x/semana)',
          description: 'Horário fixo previamente combinado. Sem direito à remarcação em caso de falta ou feriado.',
          category: 'ADULT',
          price: 480,
          billingType: 'MONTHLY',
          isUnlimitedAccess: false,
          hasPersonalTraining: true,
          hasNutrition: false,
          maxClasses: 4, // ~1x semana = 4 aulas/mês
          classesPerWeek: 1,
          isRecurring: true,
          allowFreeze: true,
          freezeMaxDays: 30,
          features: { type: 'SCHEDULED', replenishment: false },
          isActive: true,
          // Não usa créditos - aulas agendadas
          planType: 'MONTHLY',
        },
      }),
      prisma.billingPlan.upsert({
        where: { id: 'personal-agendado-2x' },
        update: {},
        create: {
          id: 'personal-agendado-2x',
          organizationId: ORG_ID,
          name: '💪 Personal - Aulas Agendadas (2x/semana)',
          description: 'Horário fixo previamente combinado. Sem direito à remarcação em caso de falta ou feriado.',
          category: 'ADULT',
          price: 960,
          billingType: 'MONTHLY',
          isUnlimitedAccess: false,
          hasPersonalTraining: true,
          hasNutrition: false,
          maxClasses: 8, // ~2x semana = 8 aulas/mês
          classesPerWeek: 2,
          isRecurring: true,
          allowFreeze: true,
          freezeMaxDays: 30,
          features: { type: 'SCHEDULED', replenishment: false },
          isActive: true,
          planType: 'MONTHLY',
        },
      }),

      // Personal: Aulas por Créditos (COM reposição)
      prisma.billingPlan.upsert({
        where: { id: 'personal-creditos-1x' },
        update: {},
        create: {
          id: 'personal-creditos-1x',
          organizationId: ORG_ID,
          name: '💪 Personal - Aulas por Créditos (1x/semana)',
          description: 'Pague apenas pelas aulas realizadas. Flexibilidade total com agendamentos. Cancelamento com 24h de antecedência.',
          category: 'ADULT',
          price: 600,
          billingType: 'CREDITS',
          isUnlimitedAccess: false,
          hasPersonalTraining: true,
          hasNutrition: false,
          creditQuantity: 4, // ~1x semana = 4 créditos/mês
          creditType: 'PERSONAL_HOUR',
          creditValidityDays: 90,
          minCreditsPerClass: 1,
          allowPartialCredit: false,
          allowRefund: true,
          refundDaysBeforeExp: 7,
          isRecurring: true,
          allowFreeze: true,
          freezeMaxDays: 30,
          features: { type: 'CREDIT_BASED', replenishment: true },
          isActive: true,
          // RENOVAÇÃO: ON_CONSUMPTION (quando créditos acabam)
          autoRenewCredits: true,
          creditRenewalTrigger: 'ON_CONSUMPTION',
          creditRenewalMethod: 'SEPARATE',
          renewalIntervalDays: 30,
          maxAutoRenewals: null, // Ilimitado
          planType: 'CREDIT_PACK',
        },
      }),
      prisma.billingPlan.upsert({
        where: { id: 'personal-creditos-2x' },
        update: {},
        create: {
          id: 'personal-creditos-2x',
          organizationId: ORG_ID,
          name: '💪 Personal - Aulas por Créditos (2x/semana)',
          description: 'Pague apenas pelas aulas realizadas. Flexibilidade total com agendamentos. Cancelamento com 24h de antecedência.',
          category: 'ADULT',
          price: 1200,
          billingType: 'CREDITS',
          isUnlimitedAccess: false,
          hasPersonalTraining: true,
          hasNutrition: false,
          creditQuantity: 8, // ~2x semana = 8 créditos/mês
          creditType: 'PERSONAL_HOUR',
          creditValidityDays: 90,
          minCreditsPerClass: 1,
          allowPartialCredit: false,
          allowRefund: true,
          refundDaysBeforeExp: 7,
          isRecurring: true,
          allowFreeze: true,
          freezeMaxDays: 30,
          features: { type: 'CREDIT_BASED', replenishment: true },
          isActive: true,
          // RENOVAÇÃO: ON_CONSUMPTION
          autoRenewCredits: true,
          creditRenewalTrigger: 'ON_CONSUMPTION',
          creditRenewalMethod: 'SEPARATE',
          renewalIntervalDays: 30,
          maxAutoRenewals: null,
          planType: 'CREDIT_PACK',
        },
      }),
    ]);

    logger.info(`✅ ${personalPlans.length} planos Personal criados`);

    // 2. KIDS PLANS (Smart Defence)
    logger.info('👧 Adicionando planos Kids (Smart Defence)...');

    const kidsPlans = await Promise.all([
      // Kids Annual: Ilimitado
      prisma.billingPlan.upsert({
        where: { id: 'kids-anual-ilimitado' },
        update: {},
        create: {
          id: 'kids-anual-ilimitado',
          organizationId: ORG_ID,
          name: '👧 Kids Smart Defence - Anual Ilimitado',
          description: 'Acesso ilimitado a todas modalidades (Krav Maga + Jiu-Jitsu). 12 meses com fidelidade.',
          category: 'TEEN',
          price: 249.90,
          billingType: 'MONTHLY',
          isUnlimitedAccess: true,
          hasPersonalTraining: false,
          hasNutrition: false,
          duration: 12,
          isRecurring: true,
          recurringInterval: 12,
          allowFreeze: true,
          freezeMaxDays: 30,
          features: { familyDiscount: 0.2, fidelity: 12 }, // 20% desconto família
          isActive: true,
          planType: 'MONTHLY',
        },
      }),

      // Kids Annual: 2x/semana
      prisma.billingPlan.upsert({
        where: { id: 'kids-anual-2x' },
        update: {},
        create: {
          id: 'kids-anual-2x',
          organizationId: ORG_ID,
          name: '👧 Kids Smart Defence - Anual 2x/semana',
          description: '2 aulas por semana (8 aulas/mês). 12 meses com fidelidade.',
          category: 'TEEN',
          price: 199.90,
          billingType: 'MONTHLY',
          isUnlimitedAccess: false,
          hasPersonalTraining: false,
          hasNutrition: false,
          classesPerWeek: 2,
          maxClasses: 8,
          duration: 12,
          isRecurring: true,
          recurringInterval: 12,
          allowFreeze: true,
          freezeMaxDays: 30,
          features: { familyDiscount: 0.2, fidelity: 12 },
          isActive: true,
          planType: 'MONTHLY',
        },
      }),

      // Kids Monthly: Ilimitado (sem fidelidade)
      prisma.billingPlan.upsert({
        where: { id: 'kids-mensal-ilimitado' },
        update: {},
        create: {
          id: 'kids-mensal-ilimitado',
          organizationId: ORG_ID,
          name: '👧 Kids Smart Defence - Mensal Ilimitado',
          description: 'Acesso ilimitado a todas modalidades. Sem fidelidade, cancele quando quiser.',
          category: 'TEEN',
          price: 299.90,
          billingType: 'MONTHLY',
          isUnlimitedAccess: true,
          hasPersonalTraining: false,
          hasNutrition: false,
          isRecurring: false,
          allowFreeze: true,
          freezeMaxDays: 30,
          features: { familyDiscount: 0.2 },
          isActive: true,
          planType: 'MONTHLY',
        },
      }),

      // Kids Monthly: 2x/semana (sem fidelidade)
      prisma.billingPlan.upsert({
        where: { id: 'kids-mensal-2x' },
        update: {},
        create: {
          id: 'kids-mensal-2x',
          organizationId: ORG_ID,
          name: '👧 Kids Smart Defence - Mensal 2x/semana',
          description: '2 aulas por semana. Sem fidelidade, cancele quando quiser.',
          category: 'TEEN',
          price: 229.90,
          billingType: 'MONTHLY',
          isUnlimitedAccess: false,
          hasPersonalTraining: false,
          hasNutrition: false,
          classesPerWeek: 2,
          maxClasses: 8,
          isRecurring: false,
          allowFreeze: true,
          freezeMaxDays: 30,
          features: { familyDiscount: 0.2 },
          isActive: true,
          planType: 'MONTHLY',
        },
      }),
    ]);

    logger.info(`✅ ${kidsPlans.length} planos Kids criados`);

    // 3. ADULTOS COLETIVOS (Smart Defence)
    logger.info('🥋 Adicionando planos Adultos Coletivos (Smart Defence)...');

    const adultPlans = await Promise.all([
      // Adultos Annual: Ilimitado
      prisma.billingPlan.upsert({
        where: { id: 'adultos-anual-ilimitado' },
        update: {},
        create: {
          id: 'adultos-anual-ilimitado',
          organizationId: ORG_ID,
          name: '🥋 Smart Defence - Anual Ilimitado',
          description: 'Acesso ilimitado a todas modalidades (Jiu-Jitsu + Defesa Pessoal + Boxe). 12 meses com fidelidade.',
          category: 'ADULT',
          price: 229.90,
          billingType: 'MONTHLY',
          isUnlimitedAccess: true,
          hasPersonalTraining: false,
          hasNutrition: false,
          duration: 12,
          isRecurring: true,
          recurringInterval: 12,
          accessAllModalities: true,
          allowFreeze: true,
          freezeMaxDays: 30,
          features: { familyDiscount: 0.1, fidelity: 12 }, // 10% desconto família
          isActive: true,
          planType: 'MONTHLY',
        },
      }),

      // Adultos Monthly: Ilimitado (sem fidelidade)
      prisma.billingPlan.upsert({
        where: { id: 'adultos-mensal-ilimitado' },
        update: {},
        create: {
          id: 'adultos-mensal-ilimitado',
          organizationId: ORG_ID,
          name: '🥋 Smart Defence - Mensal Ilimitado',
          description: 'Acesso ilimitado a todas modalidades. Sem fidelidade, cancele quando quiser.',
          category: 'ADULT',
          price: 269.90,
          billingType: 'MONTHLY',
          isUnlimitedAccess: true,
          hasPersonalTraining: false,
          hasNutrition: false,
          isRecurring: false,
          accessAllModalities: true,
          allowFreeze: true,
          freezeMaxDays: 30,
          features: { familyDiscount: 0.1 },
          isActive: true,
          planType: 'MONTHLY',
        },
      }),
    ]);

    logger.info(`✅ ${adultPlans.length} planos Adultos criados`);

    // RESUMO
    const total = personalPlans.length + kidsPlans.length + adultPlans.length;
    logger.info(`
╔════════════════════════════════════════════╗
║        ✅ SEED COMPLETO - TODOS OS PLANOS ║
╠════════════════════════════════════════════╣
║ 💪 Personal Training:        ${personalPlans.length} planos    ║
║ 👧 Kids Smart Defence:       ${kidsPlans.length} planos    ║
║ 🥋 Adultos Coletivos:        ${adultPlans.length} planos    ║
║                                            ║
║ 📊 TOTAL:                    ${total} planos    ║
╚════════════════════════════════════════════╝
    `);

    logger.info('🎉 Seed executado com sucesso!');
  } catch (error) {
    logger.error('❌ Erro ao fazer seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
seedAllPlans();
