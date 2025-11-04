// Script para salvar credenciais Google Ads de TESTE
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('📝 Salvando credenciais Google Ads de TESTE...\n');

    const orgId = '452c0b35-1822-4890-851e-922356c812fb';

    // Credenciais de teste (valores fictícios mas realistas)
    const testCredentials = {
      googleAdsClientId: 'test-client-123456.apps.googleusercontent.com',
      googleAdsClientSecret: 'Ov22l9Z5_KkYm9X2testAbc123XyZ789',
      googleAdsDeveloperToken: 'test1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZtesttoken123',
      googleAdsCustomerId: '1234567890',
      googleAdsConnected: false,
      googleAdsEnabled: true,
    };

    // Atualizar CrmSettings
    const updated = await prisma.crmSettings.update({
      where: { organizationId: orgId },
      data: testCredentials,
      select: {
        id: true,
        organizationId: true,
        googleAdsClientId: true,
        googleAdsClientSecret: true,
        googleAdsDeveloperToken: true,
        googleAdsCustomerId: true,
        googleAdsConnected: true,
        googleAdsEnabled: true,
      }
    });

    console.log('✅ Credenciais de TESTE salvas com sucesso!\n');
    console.log('Dados salvos:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Client ID:       ${updated.googleAdsClientId}`);
    console.log(`Client Secret:   ${updated.googleAdsClientSecret.substring(0, 20)}...`);
    console.log(`Developer Token: ${updated.googleAdsDeveloperToken.substring(0, 30)}...`);
    console.log(`Customer ID:     ${updated.googleAdsCustomerId}`);
    console.log(`Connected:       ${updated.googleAdsConnected}`);
    console.log(`Enabled:         ${updated.googleAdsEnabled}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🔍 Agora teste:');
    console.log('1. Abrir http://localhost:3000');
    console.log('2. Ir para CRM → Configurações → Google Ads');
    console.log('3. Os campos devem aparecer preenchidos');
    console.log('4. Se vazios ainda → há problema na API');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();
