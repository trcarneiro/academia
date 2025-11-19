/**
 * Script para verificar se a organização Smart Defence existe no banco
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkOrganization() {
  try {
    console.log('🔍 Verificando organizações no banco...\n');

    // Buscar todas as organizações
    const allOrgs = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📊 Total de organizações encontradas: ${allOrgs.length}\n`);

    if (allOrgs.length === 0) {
      console.log('❌ Nenhuma organização encontrada no banco!');
      console.log('🔧 Criando organização Smart Defence...\n');

      const newOrg = await prisma.organization.create({
        data: {
          id: 'ff5ee00e-d8a3-4291-9428-d28b852fb472',
          name: 'Smart Defence',
          slug: 'smart-defence',
          email: 'contato@smartdefence.com.br',
          phone: '(11) 99999-9999',
          address: 'São Paulo - SP',
          isActive: true
        }
      });

      console.log('✅ Organização criada:', newOrg);
    } else {
      console.log('📋 Organizações existentes:');
      allOrgs.forEach((org, index) => {
        console.log(`${index + 1}. ${org.name} (${org.id})`);
        console.log(`   Slug: ${org.slug}`);
        console.log(`   Criada em: ${org.createdAt}\n`);
      });

      // Verificar se Smart Defence existe
      const smartDefence = allOrgs.find(
        org => org.id === 'ff5ee00e-d8a3-4291-9428-d28b852fb472'
      );

      if (smartDefence) {
        console.log('✅ Organização Smart Defence encontrada!');
        console.log(`   ID: ${smartDefence.id}`);
        console.log(`   Nome: ${smartDefence.name}`);
        console.log(`   Slug: ${smartDefence.slug}`);
      } else {
        console.log('❌ Organização Smart Defence NÃO encontrada!');
        console.log('🔧 Criando organização Smart Defence...\n');

        const newOrg = await prisma.organization.create({
          data: {
            id: 'ff5ee00e-d8a3-4291-9428-d28b852fb472',
            name: 'Smart Defence',
            slug: 'smart-defence',
            email: 'contato@smartdefence.com.br',
            phone: '(11) 99999-9999',
            address: 'São Paulo - SP',
            isActive: true
          }
        });

        console.log('✅ Organização criada:', newOrg);
      }
    }

    // Verificar billing plans existentes
    console.log('\n📦 Verificando pacotes de assinatura...');
    const plans = await prisma.billingPlan.findMany({
      where: {
        organizationId: 'ff5ee00e-d8a3-4291-9428-d28b852fb472'
      },
      select: {
        id: true,
        name: true,
        price: true,
        billingType: true,
        isActive: true
      }
    });

    console.log(`\n📊 Total de pacotes da Smart Defence: ${plans.length}`);
    if (plans.length > 0) {
      plans.forEach((plan, index) => {
        console.log(`${index + 1}. ${plan.name} - R$ ${plan.price} (${plan.billingType})`);
      });
    }

  } catch (error) {
    console.error('❌ Erro ao verificar organização:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkOrganization()
  .then(() => {
    console.log('\n✅ Verificação concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro:', error);
    process.exit(1);
  });
