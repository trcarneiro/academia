// Teste simples para verificar se há dados no banco
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Verificando organizações...');
    const orgs = await prisma.organization.findMany();
    console.log(`📊 Encontradas ${orgs.length} organizações`);
    
    console.log('🔍 Verificando clientes Asaas...');
    const customers = await prisma.asaasCustomer.findMany();
    console.log(`📊 Encontrados ${customers.length} clientes Asaas`);
    
    if (customers.length > 0) {
      console.log('📋 Primeiros 3 clientes:');
      customers.slice(0, 3).forEach((customer, i) => {
        console.log(`${i + 1}. ${customer.name} (${customer.asaasId})`);
      });
    } else {
      console.log('❌ Nenhum cliente Asaas encontrado no banco de dados');
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar banco:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
