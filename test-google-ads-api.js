/**
 * Script para testar a API Google Ads e as credenciais
 * Execute isto no Console do navegador (F12 → Console)
 */

async function testGoogleAdsAPI() {
  console.log('🧪 Testando Google Ads API...\n');

  try {
    // Teste 1: Chamar a API
    console.log('📡 Requisição: GET /api/google-ads/auth/status');
    const response = await fetch('/api/google-ads/auth/status', {
      method: 'GET',
      headers: {
        'x-organization-id': '452c0b35-1822-4890-851e-922356c812fb',
        'Content-Type': 'application/json'
      }
    });

    console.log(`📊 Status HTTP: ${response.status}`);

    const data = await response.json();
    
    console.log('\n✅ Resposta da API:');
    console.table(data);

    // Teste 2: Verificar se credenciais estão presentes
    console.log('\n🔍 Análise das credenciais:');
    
    if (data.data.clientId) {
      console.log('✅ Client ID: PREENCHIDO', data.data.clientId.substring(0, 20) + '...');
    } else {
      console.log('❌ Client ID: VAZIO');
    }

    if (data.data.clientSecret) {
      console.log('✅ Client Secret: PREENCHIDO');
    } else {
      console.log('❌ Client Secret: VAZIO');
    }

    if (data.data.developerToken) {
      console.log('✅ Developer Token: PREENCHIDO', data.data.developerToken.substring(0, 20) + '...');
    } else {
      console.log('❌ Developer Token: VAZIO');
    }

    if (data.data.customerId) {
      console.log('✅ Customer ID: PREENCHIDO', data.data.customerId);
    } else {
      console.log('❌ Customer ID: VAZIO');
    }

    console.log('\n📋 Resumo:');
    console.log(`Status Connected: ${data.data.connected}`);
    console.log(`Status Enabled: ${data.data.enabled}`);

    // Teste 3: Instruções
    console.log('\n🎯 Próximos passos:');
    console.log('1. Se as credenciais aparecem PREENCHIDAS acima → API está OK!');
    console.log('2. Agora verifique se os campos de formulário no CRM Settings aparecem preenchidos');
    console.log('3. Se campos do CRM estão vazios → é problema no frontend loadGoogleAdsSettings()');
    console.log('4. Se campos do CRM estão preenchidos → SUCESSO! Sistema funcionando! ✅');

  } catch (error) {
    console.error('❌ Erro:', error);
    console.log('Verifique se:');
    console.log('1. Servidor está rodando (npm run dev)');
    console.log('2. Credenciais foram salvas no banco');
  }
}

// Executar
testGoogleAdsAPI();
