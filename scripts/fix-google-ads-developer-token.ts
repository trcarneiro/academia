import { PrismaClient } from '@prisma/client';

// Create prisma instance directly (tsx doesn't resolve @ alias)
const prisma = new PrismaClient();

async function fixDeveloperToken() {
  const orgId = '452c0b35-1822-4890-851e-922356c812fb';
  
  console.log('🔍 Buscando Google Ads Integration...\n');
  
  const integration = await prisma.googleAdsIntegration.findUnique({
    where: { organizationId: orgId }
  });
  
  if (!integration) {
    console.log('❌ Integration not found');
    await prisma.$disconnect();
    return;
  }
  
  console.log('📊 Current state:');
  console.log('   Customer ID:', integration.customerId);
  console.log('   Developer Token (raw):', JSON.stringify(integration.developerToken));
  console.log('   Developer Token (length):', integration.developerToken?.length || 0);
  console.log('   Has Refresh Token:', !!integration.refreshToken);
  console.log('');
  
  // Trim whitespace from developer token
  const cleanToken = integration.developerToken?.trim();
  
  if (cleanToken !== integration.developerToken) {
    console.log('⚠️  Developer token has leading/trailing whitespace!');
    console.log('   Old:', JSON.stringify(integration.developerToken));
    console.log('   New:', JSON.stringify(cleanToken));
    console.log('');
    
    await prisma.googleAdsIntegration.update({
      where: { organizationId: orgId },
      data: { developerToken: cleanToken }
    });
    
    console.log('✅ Developer token cleaned!');
  } else {
    console.log('✅ Developer token is already clean (no whitespace)');
  }
  
  console.log('');
  console.log('📋 Next steps:');
  console.log('   1. Delete the invalid refresh token (via Prisma Studio or SQL)');
  console.log('   2. Reload CRM Settings page');
  console.log('   3. Click "Conectar Google Ads" button');
  console.log('   4. Complete OAuth flow');
  console.log('   5. Test connection');
  console.log('   6. Sync campaigns');
  
  await prisma.$disconnect();
}

fixDeveloperToken()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
