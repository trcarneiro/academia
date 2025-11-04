// Script seguro para remover (ou zerar) credenciais de TESTE do Google Ads
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ORG_ID = '452c0b35-1822-4890-851e-922356c812fb';

(async () => {
  try {
    console.log('🧹 Limpando credenciais Google Ads de TESTE para org:', ORG_ID);

    const updated = await prisma.crmSettings.updateMany({
      where: { organizationId: ORG_ID },
      data: {
        googleAdsClientId: null,
        googleAdsClientSecret: null,
        googleAdsDeveloperToken: null,
        googleAdsCustomerId: null,
        googleAdsConnected: false,
        googleAdsEnabled: false,
        updatedAt: new Date()
      }
    });

    console.log(`✅ Registros afetados: ${updated.count}`);
    console.log('Agora verifique com: GET /api/google-ads/auth/status (com header x-organization-id)');

  } catch (err) {
    console.error('❌ Erro ao limpar credenciais:', err.message || err);
  } finally {
    await prisma.$disconnect();
  }
})();
