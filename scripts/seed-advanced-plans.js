// Advanced Billing Plans Seed
// Implementa os novos tipos de planos conforme especificação

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const advancedPlans = [
  // === PLANOS ADULTOS ===
  {
    name: "Plano Mensal Adulto Básico",
    description: "Acesso básico com 2 aulas por semana",
    category: "ADULT",
    price: 150.00,
    billingType: "MONTHLY",
    classesPerWeek: 2,
    maxClasses: 8,
    isUnlimitedAccess: false,
    allowInstallments: false,
    isRecurring: true,
    recurringInterval: 30
  },
  {
    name: "Plano Anual Adulto Premium",
    description: "Plano anual com desconto - pagamento à vista ou parcelado",
    category: "ADULT", 
    price: 1500.00, // 10 meses de desconto
    billingType: "YEARLY",
    classesPerWeek: 3,
    maxClasses: null,
    isUnlimitedAccess: true,
    allowInstallments: true,
    maxInstallments: 8,
    isRecurring: false,
    accessAllModalities: true,
    features: {
      hasDiscount: true,
      discountPercentage: 16.67,
      benefits: ["Personal training mensal", "Plano nutricional", "Acesso VIP"]
    }
  },
  {
    name: "Plano Ilimitado Adulto - Cartão 8x",
    description: "Acesso ilimitado com parcelamento no cartão",
    category: "ADULT",
    price: 2400.00,
    billingType: "CREDIT_CARD_INSTALLMENT", 
    classesPerWeek: 7,
    maxClasses: null,
    isUnlimitedAccess: true,
    allowInstallments: true,
    maxInstallments: 8, // 8x de R$ 300,00
    accessAllModalities: true,
    hasPersonalTraining: true,
    hasNutrition: true,
    features: {
      installmentValue: 300.00,
      vipAccess: true,
      priorityBooking: true
    }
  },

  // === PLANOS FEMININOS ===
  {
    name: "Plano Mensal Feminino",
    description: "Horários exclusivos femininos com 3 aulas por semana",
    category: "FEMALE",
    price: 170.00,
    billingType: "MONTHLY",
    classesPerWeek: 3,
    maxClasses: 12,
    isUnlimitedAccess: false,
    isRecurring: true,
    recurringInterval: 30,
    features: {
      exclusiveFemaleHours: true,
      specializedInstructor: true,
      selfDefenseFocus: true
    }
  },
  {
    name: "Plano Anual Feminino Premium",
    description: "Plano anual feminino com benefícios extras",
    category: "FEMALE",
    price: 1700.00,
    billingType: "YEARLY", 
    classesPerWeek: 4,
    isUnlimitedAccess: true,
    allowInstallments: true,
    maxInstallments: 6,
    hasNutrition: true,
    accessAllModalities: false,
    features: {
      womenOnlyClasses: true,
      nutritionistConsult: true,
      selfDefenseWorkshops: true
    }
  },

  // === PLANOS INFANTIS ===
  {
    name: "Plano Mensal Infantil",
    description: "Krav Maga Kids - 2 aulas por semana",
    category: "CHILD",
    price: 120.00,
    billingType: "MONTHLY",
    classesPerWeek: 2,
    maxClasses: 8,
    isUnlimitedAccess: false,
    isRecurring: true,
    recurringInterval: 30,
    features: {
      parentProgress: true,
      antiImpagingProgram: true,
      ludiciducativo: true,
      certificateProgram: true
    }
  },
  {
    name: "Plano Semestral Infantil",
    description: "6 meses de treinamento com desconto",
    category: "CHILD",
    price: 600.00, // 5 meses de desconto
    billingType: "QUARTERLY",
    classesPerWeek: 2,
    maxClasses: 48,
    allowInstallments: true,
    maxInstallments: 3,
    features: {
      discountApplied: true,
      parentWorkshops: true,
      progressReport: true
    }
  },

  // === PLANOS SENIOR ===
  {
    name: "Plano Mensal Senior",
    description: "Adaptado para idosos com foco em mobilidade e defesa",
    category: "SENIOR",
    price: 130.00,
    billingType: "MONTHLY",
    classesPerWeek: 2,
    maxClasses: 8,
    isUnlimitedAccess: false,
    isRecurring: true,
    recurringInterval: 30,
    features: {
      adaptedTraining: true,
      medicalClearance: true,
      lowImpactFocus: true,
      flexibilityEmphasis: true
    }
  },
  {
    name: "Plano Anual Senior Premium",
    description: "Plano anual para seniors com benefícios de saúde",
    category: "SENIOR",
    price: 1300.00,
    billingType: "YEARLY",
    classesPerWeek: 3,
    isUnlimitedAccess: true,
    allowInstallments: true,
    maxInstallments: 4,
    hasNutrition: true,
    features: {
      healthMonitoring: true,
      physiotherapyPartnership: true,
      seniorWorkshops: true,
      familyDiscount: true
    }
  },

  // === PLANOS RECORRENTES ESPECIAIS ===
  {
    name: "Plano Corporativo Recorrente",
    description: "Assinatura automática para empresas",
    category: "ADULT",
    price: 5000.00,
    billingType: "RECURRING",
    classesPerWeek: 7,
    isUnlimitedAccess: true,
    isRecurring: true,
    recurringInterval: 30,
    accessAllModalities: true,
    features: {
      corporateDiscount: 20,
      minEmployees: 10,
      maxEmployees: 50,
      corporateReports: true,
      flexibleScheduling: true
    }
  },
  {
    name: "Plano VIP Ilimitado",
    description: "Acesso total com todos os benefícios",
    category: "ADULT",
    price: 500.00,
    billingType: "MONTHLY",
    classesPerWeek: 7,
    isUnlimitedAccess: true,
    hasPersonalTraining: true,
    hasNutrition: true,
    accessAllModalities: true,
    allowFreeze: true,
    freezeMaxDays: 60,
    isRecurring: true,
    recurringInterval: 30,
    features: {
      vipArea: true,
      prioritySupport: true,
      guestPasses: 4,
      nutritionistConsult: true,
      personalTrainerHours: 4
    }
  }
];

async function seedAdvancedPlans() {
  try {
    console.log('🚀 Iniciando seed de planos avançados...');
    
    // Buscar organização existente
    const organization = await prisma.organization.findFirst();
    if (!organization) {
      throw new Error('❌ Nenhuma organização encontrada. Execute o seed básico primeiro.');
    }

    // Buscar curso existente (se houver)
    const course = await prisma.course.findFirst();
    
    console.log(`📋 Criando ${advancedPlans.length} planos avançados...`);
    
    for (const planData of advancedPlans) {
      const plan = await prisma.billingPlan.create({
        data: {
          ...planData,
          organizationId: organization.id,
          courseId: course?.id || null,
          price: planData.price
        }
      });
      
      console.log(`✅ Criado: ${plan.name} - R$ ${plan.price} (${plan.category})`);
    }
    
    console.log('🎉 Seed de planos avançados concluído com sucesso!');
    
    // Estatísticas
    const stats = await prisma.billingPlan.groupBy({
      by: ['category', 'billingType'],
      _count: true
    });
    
    console.log('\n📊 ESTATÍSTICAS DOS PLANOS:');
    stats.forEach(stat => {
      console.log(`   ${stat.category} - ${stat.billingType}: ${stat._count} planos`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao executar seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  seedAdvancedPlans()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { seedAdvancedPlans };