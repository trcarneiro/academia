/**
 * Set Correct Customer ID
 * Updates Customer ID to 4118936474 (411-893-6474 without hyphens)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setCorrectCustomerId() {
    console.log('🔧 Setting correct Customer ID...');
    
    const organizationId = '452c0b35-1822-4890-851e-922356c812fb';
    const correctCustomerId = '4118936474'; // 411-893-6474 (conta com campanhas)
    
    try {
        // Get current settings
        const settings = await prisma.crmSettings.findUnique({
            where: { organizationId }
        });
        
        if (!settings) {
            console.log('❌ CrmSettings not found for organization:', organizationId);
            return;
        }
        
        console.log('\n📊 Current Customer ID:', settings.googleAdsCustomerId);
        console.log('🎯 Correct Customer ID:', correctCustomerId);
        
        if (settings.googleAdsCustomerId !== correctCustomerId) {
            console.log('\n✏️  Updating Customer ID...');
            
            await prisma.crmSettings.update({
                where: { organizationId },
                data: { googleAdsCustomerId: correctCustomerId }
            });
            
            console.log('\n✅ Customer ID updated successfully!');
            console.log('   From:', settings.googleAdsCustomerId);
            console.log('   To:', correctCustomerId);
        } else {
            console.log('\n✅ Customer ID is already correct');
        }
        
        console.log('\n📋 Summary:');
        console.log('   Account: 411-893-6474 (Conta do Google Ads)');
        console.log('   Customer ID: 4118936474');
        console.log('   Status: Active with campaigns ✅');
        
    } catch (error) {
        console.error('❌ Error updating Customer ID:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

setCorrectCustomerId()
    .then(() => {
        console.log('\n🎉 Script completed successfully');
        console.log('\n📌 Next steps:');
        console.log('   1. Refresh the CRM page (F5)');
        console.log('   2. Click "Testar Conexão"');
        console.log('   3. Click "Sincronizar Campanhas"');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Script failed:', error);
        process.exit(1);
    });
