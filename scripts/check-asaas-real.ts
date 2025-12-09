/**
 * Check real subscriptions in Asaas
 */

import 'dotenv/config';

async function main() {
  const apiKey = process.env.ASAAS_API_KEY;
  // Detectar ambiente pela API key (prod começa com $aact_prod)
  const isProd = apiKey?.includes('$aact_prod');
  const baseUrl = isProd 
    ? 'https://www.asaas.com/api/v3'
    : 'https://sandbox.asaas.com/api/v3';
  
  console.log('\n📊 CONSULTANDO ASAAS');
  console.log('═══════════════════════════════════════\n');
  console.log('Ambiente:', isProd ? 'PRODUÇÃO' : 'SANDBOX');
  console.log('API Key:', apiKey ? `${apiKey.slice(0, 15)}...` : 'NÃO CONFIGURADA');
  console.log('URL:', baseUrl);
  
  if (!apiKey) {
    console.log('\n❌ ASAAS_API_KEY não configurada no .env');
    return;
  }
  
  // Buscar assinaturas ativas no Asaas
  const response = await fetch(`${baseUrl}/subscriptions?status=ACTIVE&limit=100`, {
    headers: {
      'access_token': apiKey!,
      'Content-Type': 'application/json'
    }
  });
  
  console.log('Status da resposta:', response.status);
  
  if (!response.ok) {
    const text = await response.text();
    console.log('Erro:', text.slice(0, 200));
    return;
  }
  
  const data = await response.json();
  
  console.log('\n📋 ASSINATURAS ATIVAS NO ASAAS:');
  console.log('─────────────────────────────────');
  console.log('Total:', data.totalCount ?? data.data?.length ?? 0);
  
  if (data.data && data.data.length > 0) {
    console.log('\nPrimeiras 10:');
    data.data.slice(0, 10).forEach((s: any) => {
      console.log(`   - Customer: ${s.customer} | Valor: R$ ${s.value} | Ciclo: ${s.cycle}`);
    });
  }
  
  // Buscar total de clientes
  const customersResponse = await fetch(`${baseUrl}/customers?limit=10`, {
    headers: {
      'access_token': apiKey,
      'Content-Type': 'application/json'
    }
  });
  
  const customersData = await customersResponse.json();
  
  console.log('\n👥 CLIENTES NO ASAAS:');
  console.log('─────────────────────────────────');
  console.log('Total:', customersData.totalCount ?? '?');
  
  // Buscar cobranças pendentes/confirmadas
  const paymentsResponse = await fetch(`${baseUrl}/payments?status=PENDING,CONFIRMED&limit=10`, {
    headers: {
      'access_token': apiKey,
      'Content-Type': 'application/json'
    }
  });
  
  const paymentsData = await paymentsResponse.json();
  
  console.log('\n💰 COBRANÇAS PENDENTES/CONFIRMADAS:');
  console.log('─────────────────────────────────');
  console.log('Total:', paymentsData.totalCount ?? '?');
}

main().catch(console.error);
