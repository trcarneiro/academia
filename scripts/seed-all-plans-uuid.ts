import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';

const ORG_ID = '452c0b35-1822-4890-851e-922356c812fb';

/**
 * Seed CORRIGIDO com UUIDs válidos para planId
 * Todos os planos agora têm IDs tipo UUID
 */

async function seedAllPlansWithUUIDs() {
  try {
    logger.info('🌱 Recriando seed com UUIDs válidos...');

    // Primeiro, deletar planos antigos com IDs inválidos
    await prisma.billingPlan.deleteMany({
      where: {
        organizationId: ORG_ID,
        id: {
          in: [
            'personal-agendado-1x',
            'personal-agendado-2x',
            'personal-creditos-1x',
            'personal-creditos-2x',
            'kids-anual-ilimitado',
            'kids-anual-2x',
            'kids-mensal-ilimitado',
            'kids-mensal-2x',
            'adultos-anual-ilimitado',
            'adultos-mensal-ilimitado',
            'pack-10-aulas',
            'pack-20-aulas',
            'pack-30-aulas',
            'trial-7-dias',
            'aula-avulsa',
          ],
        },
      },
    });

    logger.info('✅ Planos antigos deletados');

    // 1. PERSONAL TRAINING PLANS
    logger.info('💪 Adicionando planos de Personal Training...');

    const personalPlans = await Promise.all([
      prisma.billingPlan.create({
        data: {
          id: uuidv4(),
          organizationId: ORG_ID,
          name: '💪 Personal - Aulas Agendadas (1x/semana)',
          description: 'Horário fixo previamente combinado. Sem direito à remarcação em caso de falta ou feriado.',
          category: 'ADULT',
          price: 480,
          billingType: 'MONTHLY',
          isUnlimitedAccess: false,
          hasPersonalTraining: true,
          hasNutrition: false,
          maxClasses: 4,
          classesPerWeek: 1,
          isRecurring: true,
          allowFreeze: true,
          freezeMaxDays: 30,
          features: { type: 'SCHEDULED', replenishment: false },
          isActive: true,
          planType: 'MONTHLY',
        },
      }),
      prisma.billingPlan.create({
        data: {
          id: uuidv4(),
          organizationId: ORG_ID,
          name: '💪 Personal - Aulas Agendadas (2x/semana)',
          description: 'Horário fixo previamente combinado. Sem direito à remarcação em caso de falta ou feriado.',
          category: 'ADULT',
          price: 960,
          billingType: 'MONTHLY',
          isUnlimitedAccess: false,
          hasPersonalTraining: true,
          hasNutrition: false,
          maxClasses: 8,
          classesPerWeek: 2,
          isRecurring: true,
          allowFreeze: true,
          freezeMaxDays: 30,
          features: { type: 'SCHEDULED', replenishment: false },
          isActive: true,
          planType: 'MONTHLY',
        },
      }),
      prisma.billingPlan.create({
        data: {
          id: uuidv4(),
          organizationId: ORG_ID,
          name: '💪 Personal - Aulas por Créditos (1x/semana)',
          description: 'Pague apenas pelas aulas realizadas. Flexibilidade total com agendamentos. Cancelamento com 24h de antecedência.',
          category: 'ADULT',
          price: 600,
          billingType: 'CREDITS',
          isUnlimitedAccess: false,
          hasPersonalTraining: true,
          hasNutrition: false,
          creditQuantity: 4,
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
          autoRenewCredits: true,
          creditRenewalTrigger: 'ON_CONSUMPTION',
          creditRenewalMethod: 'SEPARATE',
          renewalIntervalDays: 30,
          maxAutoRenewals: null,
          planType: 'CREDIT_PACK',
        },
      }),
      prisma.billingPlan.create({
        data: {
          id: uuidv4(),
          organizationId: ORG_ID,
          name: '💪 Personal - Aulas por Créditos (2x/semana)',
          description: 'Pague apenas pelas aulas realizadas. Flexibilidade total com agendamentos. Cancelamento com 24h de antecedência.',
          category: 'ADULT',
          price: 1200,
          billingType: 'CREDITS',
          isUnlimitedAccess: false,
          hasPersonalTraining: true,
          hasNutrition: false,
          creditQuantity: 8,
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

    // 2. KIDS PLANS
    logger.info('👧 Adicionando planos Kids (Smart Defence)...');

    const kidsPlans = await Promise.all([
      prisma.billingPlan.create({
        data: {
          id: uuidv4(),
          organizationId: ORG_ID,
          name: '👧 Kids Smart Defence - Anual Ilimitado',
          description: 'Acesso ilimitado a todas modalidades (Krav Maga + Jiu-Jitsu). 12 meses com fidelidade.',
          category: 'TEEN',
          price: 249.9,
          billingType: 'MONTHLY',
          isUnlimitedAccess: true,
          hasPersonalTraining: false,
          hasNutrition: false,
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
      prisma.billingPlan.create({
        data: {
          id: uuidv4(),
          organizationId: ORG_ID,
          name: '👧 Kids Smart Defence - Anual 2x/semana',
          description: '2 aulas por semana (8 aulas/mês). 12 meses com fidelidade.',
          category: 'TEEN',
          price: 199.9,
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
      prisma.billingPlan.create({
        data: {
          id: uuidv4(),
          organizationId: ORG_ID,
          name: '👧 Kids Smart Defence - Mensal Ilimitado',
          description: 'Acesso ilimitado a todas modalidades. Sem fidelidade, cancele quando quiser.',
          category: 'TEEN',
          price: 299.9,
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
      prisma.billingPlan.create({
        data: {
          id: uuidv4(),
          organizationId: ORG_ID,
          name: '👧 Kids Smart Defence - Mensal 2x/semana',
          description: '2 aulas por semana. Sem fidelidade, cancele quando quiser.',
          category: 'TEEN',
          price: 229.9,
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

    // 3. ADULTOS COLETIVOS
    logger.info('🥋 Adicionando planos Adultos Coletivos (Smart Defence)...');

    const adultPlans = await Promise.all([
      prisma.billingPlan.create({
        data: {
          id: uuidv4(),
          organizationId: ORG_ID,
          name: '🥋 Smart Defence - Anual Ilimitado',
          description: 'Acesso ilimitado a todas modalidades (Jiu-Jitsu + Defesa Pessoal + Boxe). 12 meses com fidelidade.',
          category: 'ADULT',
          price: 229.9,
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
          features: { familyDiscount: 0.1, fidelity: 12 },
          isActive: true,
          planType: 'MONTHLY',
        },
      }),
      prisma.billingPlan.create({
        data: {
          id: uuidv4(),
          organizationId: ORG_ID,
          name: '🥋 Smart Defence - Mensal Ilimitado',
          description: 'Acesso ilimitado a todas modalidades. Sem fidelidade, cancele quando quiser.',
          category: 'ADULT',
          price: 269.9,
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

    // 4. CREDIT PACKS
    logger.info('📦 Adicionando PACKS DE CRÉDITOS...');

    const creditPacks = await Promise.all([
      prisma.billingPlan.create({
        data: {
          id: uuidv4(),
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
      prisma.billingPlan.create({
        data: {
          id: uuidv4(),
          organizationId: ORG_ID,
          name: '📦 Pack 20 Aulas',
          description: '20 créditos com 8% desconto (validade 120 dias)',
          category: 'ADULT',
          price: 644.0,
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
      prisma.billingPlan.create({
        data: {
          id: uuidv4(),
          organizationId: ORG_ID,
          name: '📦 Pack 30 Aulas',
          description: '30 créditos com 15% desconto (validade 150 dias)',
          category: 'ADULT',
          price: 892.5,
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

    // 5. TRIAL E AULA AVULSA
    logger.info('🎉 Adicionando TRIAL e AULA AVULSA...');

    const specialPlans = await Promise.all([
      prisma.billingPlan.create({
        data: {
          id: uuidv4(),
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
      prisma.billingPlan.create({
        data: {
          id: uuidv4(),
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

    // RESUMO
    const total = personalPlans.length + kidsPlans.length + adultPlans.length + creditPacks.length + specialPlans.length;
    logger.info(`
╔════════════════════════════════════════════╗
║        ✅ SEED COM UUIDs - TODOS OS PLANOS ║
╠════════════════════════════════════════════╣
║ 💪 Personal Training:        ${personalPlans.length} planos    ║
║ 👧 Kids Smart Defence:       ${kidsPlans.length} planos    ║
║ 🥋 Adultos Coletivos:        ${adultPlans.length} planos    ║
║ 📦 Credit Packs:             ${creditPacks.length} planos    ║
║ 🎉 Trial + Avulsa:           ${specialPlans.length} planos    ║
║                                            ║
║ 📊 TOTAL:                    ${total} planos    ║
╚════════════════════════════════════════════╝
    `);

    logger.info('✅ Seed executado com sucesso! Todos os planos agora têm UUIDs válidos.');
  } catch (error) {
    logger.error('❌ Erro ao fazer seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
seedAllPlansWithUUIDs();
