/**
 * Sincronizar matrículas locais com assinaturas reais do Asaas
 * 
 * 1. Buscar assinaturas ativas no Asaas
 * 2. Desativar todas as matrículas locais
 * 3. Ativar apenas as matrículas que correspondem a assinaturas reais
 * 4. Atualizar status dos alunos
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ORG_ID = 'ff5ee00e-d8a3-4291-9428-d28b852fb472';
const DRY_RUN = process.argv.includes('--dry-run');

// Detectar ambiente pela API key
const apiKey = process.env.ASAAS_API_KEY!;
const isProd = apiKey?.includes('$aact_prod');
const baseUrl = isProd 
  ? 'https://www.asaas.com/api/v3'
  : 'https://sandbox.asaas.com/api/v3';

interface AsaasSubscription {
  id: string;
  customer: string;
  value: number;
  cycle: string;
  status: string;
  nextDueDate: string;
}

async function fetchAsaasSubscriptions(): Promise<AsaasSubscription[]> {
  const allSubscriptions: AsaasSubscription[] = [];
  let offset = 0;
  const limit = 100;
  
  while (true) {
    const response = await fetch(`${baseUrl}/subscriptions?status=ACTIVE&limit=${limit}&offset=${offset}`, {
      headers: {
        'access_token': apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar assinaturas: ${response.status}`);
    }
    
    const data = await response.json();
    allSubscriptions.push(...data.data);
    
    if (!data.hasMore || data.data.length < limit) break;
    offset += limit;
  }
  
  return allSubscriptions;
}

async function main() {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`🔄 SINCRONIZAÇÃO COM ASAAS - ${DRY_RUN ? 'DRY RUN' : 'EXECUÇÃO REAL'}`);
  console.log(`${'═'.repeat(60)}\n`);
  console.log(`Ambiente: ${isProd ? 'PRODUÇÃO' : 'SANDBOX'}`);
  console.log(`URL: ${baseUrl}\n`);
  
  // 1. Buscar assinaturas ativas no Asaas
  console.log('📡 Buscando assinaturas ativas no Asaas...');
  const asaasSubscriptions = await fetchAsaasSubscriptions();
  console.log(`   Encontradas: ${asaasSubscriptions.length} assinaturas ativas\n`);
  
  // 2. Mapear customer ID do Asaas para alunos locais
  const asaasCustomers = await prisma.asaasCustomer.findMany({
    where: { organizationId: ORG_ID },
    include: {
      student: {
        include: {
          user: { select: { firstName: true, lastName: true } },
          subscriptions: { where: { isActive: true } }
        }
      }
    }
  });
  
  // Criar mapa de asaasId -> student
  const customerMap = new Map<string, typeof asaasCustomers[0]>();
  asaasCustomers.forEach(c => {
    customerMap.set(c.asaasId, c);
  });
  
  console.log(`📋 Clientes Asaas vinculados no sistema: ${asaasCustomers.length}\n`);
  
  // 3. Identificar quem tem assinatura ativa no Asaas
  const studentsWithActiveAsaas = new Set<string>();
  const subscriptionDetails = new Map<string, AsaasSubscription>();
  
  for (const sub of asaasSubscriptions) {
    const customer = customerMap.get(sub.customer);
    if (customer && customer.student) {
      studentsWithActiveAsaas.add(customer.studentId);
      subscriptionDetails.set(customer.studentId, sub);
    }
  }
  
  console.log(`✅ Alunos com assinatura ativa no Asaas: ${studentsWithActiveAsaas.size}\n`);
  
  // 4. Buscar todas as matrículas ativas locais
  const activeLocalSubs = await prisma.studentSubscription.findMany({
    where: {
      student: { organizationId: ORG_ID },
      isActive: true
    },
    include: {
      student: {
        include: { user: { select: { firstName: true, lastName: true } } }
      }
    }
  });
  
  console.log(`📊 Matrículas ativas locais: ${activeLocalSubs.length}\n`);
  
  // 5. Desativar matrículas de quem NÃO tem assinatura ativa no Asaas
  let deactivatedCount = 0;
  let keptCount = 0;
  
  console.log('🔄 Processando matrículas...\n');
  
  for (const sub of activeLocalSubs) {
    const studentId = sub.studentId;
    const name = `${sub.student.user.firstName} ${sub.student.user.lastName}`;
    
    if (studentsWithActiveAsaas.has(studentId)) {
      // Manter ativa - tem assinatura no Asaas
      const asaasSub = subscriptionDetails.get(studentId);
      console.log(`   ✅ MANTER: ${name.padEnd(40)} | Asaas: R$ ${asaasSub?.value}`);
      keptCount++;
    } else {
      // Desativar - NÃO tem assinatura no Asaas
      console.log(`   ❌ DESATIVAR: ${name.padEnd(37)}`);
      
      if (!DRY_RUN) {
        await prisma.studentSubscription.update({
          where: { id: sub.id },
          data: { isActive: false, status: 'INACTIVE' }
        });
      }
      deactivatedCount++;
    }
  }
  
  // 6. Atualizar status dos alunos
  console.log('\n👥 Atualizando status dos alunos...\n');
  
  if (!DRY_RUN) {
    // Desativar alunos sem assinatura ativa no Asaas
    const deactivatedStudents = await prisma.student.updateMany({
      where: {
        organizationId: ORG_ID,
        isActive: true,
        id: { notIn: Array.from(studentsWithActiveAsaas) }
      },
      data: { isActive: false }
    });
    console.log(`   Alunos desativados: ${deactivatedStudents.count}`);
    
    // Ativar alunos COM assinatura ativa no Asaas
    const activatedStudents = await prisma.student.updateMany({
      where: {
        organizationId: ORG_ID,
        id: { in: Array.from(studentsWithActiveAsaas) }
      },
      data: { isActive: true }
    });
    console.log(`   Alunos ativados: ${activatedStudents.count}`);
  }
  
  // Resumo
  console.log(`\n${'═'.repeat(60)}`);
  console.log('📊 RESUMO DA SINCRONIZAÇÃO');
  console.log(`${'═'.repeat(60)}`);
  console.log(`   Assinaturas ativas no Asaas: ${asaasSubscriptions.length}`);
  console.log(`   Matrículas locais mantidas: ${keptCount}`);
  console.log(`   Matrículas locais desativadas: ${deactivatedCount}`);
  console.log(`   Alunos ativos após sync: ${studentsWithActiveAsaas.size}`);
  
  if (DRY_RUN) {
    console.log('\n⚠️  DRY RUN - Nenhuma alteração foi feita');
    console.log('Execute sem --dry-run para aplicar');
  } else {
    console.log('\n✅ Sincronização concluída!');
  }
  
  // Verificação final
  if (!DRY_RUN) {
    const finalActiveStudents = await prisma.student.count({
      where: { organizationId: ORG_ID, isActive: true }
    });
    const finalActiveSubs = await prisma.studentSubscription.count({
      where: { student: { organizationId: ORG_ID }, isActive: true }
    });
    
    console.log(`\n📊 CONTAGEM FINAL:`);
    console.log(`   Alunos ativos: ${finalActiveStudents}`);
    console.log(`   Matrículas ativas: ${finalActiveSubs}`);
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);
