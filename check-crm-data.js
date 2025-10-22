// Script rápido para verificar dados CRM
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('🔍 Verificando dados do CrmSettings...\n');

    // Organização correta
    const orgId = '452c0b35-1822-4890-851e-922356c812fb';

    // Verificar CrmSettings para essa organização
    const crmSettings = await prisma.crmSettings.findUnique({
      where: { organizationId: orgId },
      select: {
        id: true,
        organizationId: true,
        googleAdsConnected: true,
        googleAdsEnabled: true,
        googleAdsCustomerId: true,
        googleAdsClientId: true,
        googleAdsClientSecret: true,
        googleAdsDeveloperToken: true,
      }
    });

    if (!crmSettings) {
      console.log('❌ Nenhum CrmSettings encontrado para organização:', orgId);
      console.log('\n📋 Criando registro vazio...');
      
      const newSettings = await prisma.crmSettings.create({
        data: {
          organizationId: orgId,
          googleAdsConnected: false,
          googleAdsEnabled: false,
        }
      });
      console.log('✅ Criado:', newSettings);
    } else {
      console.log('✅ CrmSettings encontrado:');
      console.log(JSON.stringify(crmSettings, null, 2));
      
      if (crmSettings.googleAdsClientId && crmSettings.googleAdsClientSecret) {
        console.log('\n✅ Credenciais Google Ads estão SALVAS no banco!');
      } else {
        console.log('\n⚠️ Credenciais Google Ads estão VAZIAS no banco');
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();
