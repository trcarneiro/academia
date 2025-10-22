// Verificar TODOS os CrmSettings
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('🔍 Verificando TODOS os CrmSettings no banco...\n');

    const allSettings = await prisma.crmSettings.findMany({
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    if (allSettings.length === 0) {
      console.log('❌ Nenhum CrmSettings encontrado no banco');
    } else {
      console.log(`✅ Encontrados ${allSettings.length} registro(s) de CrmSettings:\n`);
      allSettings.forEach((settings, idx) => {
        console.log(`[${idx + 1}] Organização: ${settings.organization.name} (${settings.organization.id})`);
        console.log(`    Has Google Ads Credentials: ${settings.googleAdsClientId ? 'SIM' : 'NÃO'}`);
        console.log(`    Client ID: ${settings.googleAdsClientId ? '***HIDDEN***' : 'null'}`);
        console.log(`    Developer Token: ${settings.googleAdsDeveloperToken ? '***HIDDEN***' : 'null'}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();
