import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedFinancialData() {
  try {
    console.log('🏦 Seeding financial data...');

    // Get organization
    const organization = await prisma.organization.findFirst();
    if (!organization) {
      throw new Error('No organization found. Please run main seed first.');
    }

    // Create billing plans
    const plans = [
      {
        name: 'Krav Maga Básico - Adulto',
        description: 'Plano mensal para alunos adultos com 2 aulas por semana',
        category: 'ADULT' as const,
        price: 149.90,
        billingType: 'MONTHLY' as const,
        classesPerWeek: 2,
        maxClasses: 8,
        hasPersonalTraining: false,
        hasNutrition: false
      },
      {
        name: 'Krav Maga Premium - Adulto',
        description: 'Plano mensal premium com aulas ilimitadas e personal training',
        category: 'ADULT' as const,
        price: 249.90,
        billingType: 'MONTHLY' as const,
        classesPerWeek: 5,
        hasPersonalTraining: true,
        hasNutrition: true
      },
      {
        name: 'Krav Maga Kids - Herói 1',
        description: 'Plano mensal para crianças de 6-9 anos',
        category: 'HEROI1' as const,
        price: 99.90,
        billingType: 'MONTHLY' as const,
        classesPerWeek: 2,
        maxClasses: 8,
        hasPersonalTraining: false,
        hasNutrition: false
      },
      {
        name: 'Krav Maga Master 1',
        description: 'Plano especial para alunos Master 1 (35+ anos)',
        category: 'MASTER_1' as const,
        price: 129.90,
        billingType: 'MONTHLY' as const,
        classesPerWeek: 2,
        maxClasses: 8,
        hasPersonalTraining: false,
        hasNutrition: false
      },
      {
        name: 'Plano Trimestral - Adulto',
        description: 'Plano trimestral com desconto especial',
        category: 'ADULT' as const,
        price: 399.90,
        billingType: 'QUARTERLY' as const,
        classesPerWeek: 2,
        maxClasses: 24,
        hasPersonalTraining: false,
        hasNutrition: false
      },
      {
        name: 'Plano Anual - Premium',
        description: 'Plano anual com máximo desconto e benefícios',
        category: 'ADULT' as const,
        price: 1799.90,
        billingType: 'YEARLY' as const,
        classesPerWeek: 5,
        hasPersonalTraining: true,
        hasNutrition: true
      }
    ];

    const createdPlans = [];
    for (const planData of plans) {
      const plan = await prisma.billingPlan.create({
        data: {
          ...planData,
          organizationId: organization.id
        }
      });
      createdPlans.push(plan);
      console.log(`✅ Created plan: ${plan.name} - R$ ${plan.price}`);
    }

    // Create or update financial settings
    const financialSettings = await prisma.financialSettings.upsert({
      where: { organizationId: organization.id },
      update: {
        asaasApiKey: process.env.ASAAS_API_KEY || 'sandbox_key_placeholder',
        asaasWebhookUrl: `${process.env.BASE_URL || 'http://localhost:3000'}/api/financial/webhooks/asaas`,
        asaasWebhookToken: 'webhook_secret_token',
        isSandbox: true,
        defaultBillingType: 'MONTHLY',
        lateFeePercentage: 2.0,
        interestRate: 1.0,
        sendReminders: true,
        reminderDaysBefore: 3
      },
      create: {
        organizationId: organization.id,
        // Note: In production, these should be encrypted
        asaasApiKey: process.env.ASAAS_API_KEY || 'sandbox_key_placeholder',
        asaasWebhookUrl: `${process.env.BASE_URL || 'http://localhost:3000'}/api/financial/webhooks/asaas`,
        asaasWebhookToken: 'webhook_secret_token',
        isSandbox: true,
        defaultBillingType: 'MONTHLY',
        lateFeePercentage: 2.0,
        interestRate: 1.0,
        sendReminders: true,
        reminderDaysBefore: 3
      }
    });

    console.log('✅ Created financial settings');

    // Get students for sample subscriptions
    const students = await prisma.student.findMany({
      take: 4,
      include: { user: true }
    });

    if (students.length > 0) {
      console.log('👥 Creating sample subscriptions...');

      // Create sample Asaas customers and subscriptions
      for (let i = 0; i < students.length; i++) {
        const student = students[i];
        const plan = createdPlans[i % createdPlans.length];

        // Create Asaas customer record
        const asaasCustomer = await prisma.asaasCustomer.create({
          data: {
            organizationId: organization.id,
            studentId: student.id,
            asaasId: `cus_${Date.now()}_${i}`, // Mock Asaas ID
            name: `${student.user.firstName} ${student.user.lastName}`,
            cpfCnpj: student.user.document || `000.000.00${i}-0${i}`,
            email: student.user.email,
            phone: student.user.phone || `(11) 9999${i}-000${i}`,
            externalReference: student.id
          }
        });

        // Create subscription
        const subscription = await prisma.studentSubscription.create({
          data: {
            organizationId: organization.id,
            studentId: student.id,
            planId: plan.id,
            asaasCustomerId: asaasCustomer.id,
            currentPrice: plan.price,
            billingType: plan.billingType,
            startDate: new Date('2025-06-01'),
            nextBillingDate: new Date('2025-07-01'),
            status: i === 0 ? 'ACTIVE' : i === 3 ? 'EXPIRED' : 'ACTIVE'
          }
        });

        // Create sample payments
        const paymentDates = [
          { due: '2025-06-01', paid: '2025-06-01', status: 'PAID' as const },
          { due: '2025-07-01', paid: '2025-07-02', status: 'PAID' as const },
          { due: '2025-08-01', paid: null, status: i === 3 ? 'FAILED' as const : 'PENDING' as const }
        ];

        for (let j = 0; j < paymentDates.length; j++) {
          const paymentData = paymentDates[j];
          
          await prisma.payment.create({
            data: {
              organizationId: organization.id,
              studentId: student.id,
              subscriptionId: subscription.id,
              asaasCustomerId: asaasCustomer.id,
              amount: plan.price,
              description: `${plan.name} - ${new Date(paymentData.due).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
              dueDate: new Date(paymentData.due),
              paidDate: paymentData.paid ? new Date(paymentData.paid) : null,
              status: paymentData.status,
              paymentMethod: paymentData.status === 'PAID' ? 'PIX' : null,
              asaasPaymentId: `pay_${Date.now()}_${i}_${j}`,
              pixCode: paymentData.status === 'PENDING' ? `PIX_CODE_${i}_${j}` : null
            }
          });
        }

        console.log(`✅ Created subscription for ${student.user.firstName} - ${plan.name}`);
      }
    }

    console.log('\n💰 Financial data seeded successfully!');
    console.log(`📊 Created:`);
    console.log(`   - ${createdPlans.length} billing plans`);
    console.log(`   - 1 financial settings`);
    console.log(`   - ${students.length} Asaas customers`);
    console.log(`   - ${students.length} subscriptions`);
    console.log(`   - ${students.length * 3} payments`);

  } catch (error) {
    console.error('❌ Error seeding financial data:', error);
    throw error;
  }
}

// Execute if called directly
if (require.main === module) {
  seedFinancialData()
    .then(() => {
      console.log('🎉 Financial seed completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Financial seed failed:', error);
      process.exit(1);
    });
}

export default seedFinancialData;