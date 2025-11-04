const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkGoogleAdsConfig() {
  try {
    console.log('\n=== VERIFICANDO CONFIGURAÇÃO GOOGLE ADS ===\n');

    // Verificar CrmSettings
    const crmSettings = await prisma.crmSettings.findMany({
      include: { organization: true }
    });

    console.log(`📋 Total de CrmSettings: ${crmSettings.length}`);
    
    if (crmSettings.length > 0) {
      crmSettings.forEach((settings, idx) => {
        console.log(`\n[${idx + 1}] Organização: ${settings.organization?.name}`);
        console.log(`    Organization ID: ${settings.organizationId}`);
        console.log(`    Google Ads Customer ID: ${settings.googleAdsCustomerId || '❌ NÃO CONFIGURADO'}`);
        console.log(`    Google Ads Developer Token: ${settings.googleAdsDeveloperToken ? '✅ CONFIGURADO' : '❌ NÃO CONFIGURADO'}`);
        console.log(`    Sync Enabled: ${settings.syncEnabled ? '✅ SIM' : '❌ NÃO'}`);
        console.log(`    Auto-sync Enabled: ${settings.autoSyncEnabled ? '✅ SIM' : '❌ NÃO'}`);
        console.log(`    Last Sync: ${settings.lastSyncAt ? new Date(settings.lastSyncAt).toLocaleString('pt-BR') : '❌ NUNCA'}`);
      });
    } else {
      console.log('❌ Nenhuma configuração CRM encontrada');
    }

    // Verificar Google Ads Campaigns
    const campaignsCount = await prisma.googleAdsCampaign.count();
    console.log(`\n📊 Google Ads Campaigns no banco: ${campaignsCount}`);
    
    if (campaignsCount > 0) {
      const campaigns = await prisma.googleAdsCampaign.findMany({ take: 5 });
      console.log('   Primeiros 5:');
      campaigns.forEach(c => {
        console.log(`   - ${c.name} (ID: ${c.googleAdsId}, Status: ${c.status})`);
      });
    }

    // Verificar Ad Groups
    const adGroupsCount = await prisma.googleAdsAdGroup.count();
    console.log(`\n📋 Google Ads Ad Groups no banco: ${adGroupsCount}`);

    // Verificar Keywords
    const keywordsCount = await prisma.googleAdsKeyword.count();
    console.log(`🔑 Google Ads Keywords no banco: ${keywordsCount}`);

    console.log('\n=== VERIFICAÇÃO COMPLETA ===\n');

  } catch (error) {
    console.error('❌ ERRO ao verificar config:', error.message);
    console.error('\nStack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

checkGoogleAdsConfig();
