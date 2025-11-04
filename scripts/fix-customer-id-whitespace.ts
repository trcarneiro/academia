/**
 * Fix Customer ID Leading Whitespace
 * Removes leading/trailing spaces from Customer ID in CrmSettings
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixCustomerIdWhitespace() {
    console.log('🔧 Starting Customer ID whitespace fix...');
    
    const organizationId = '452c0b35-1822-4890-851e-922356c812fb';
    
    try {
        // Get current settings
        const settings = await prisma.crmSettings.findUnique({
            where: { organizationId }
        });
        
        if (!settings) {
            console.log('❌ CrmSettings not found for organization:', organizationId);
            return;
        }
        
        console.log('\n📊 Current Customer ID:', JSON.stringify(settings.googleAdsCustomerId));
        console.log('📏 Length:', settings.googleAdsCustomerId?.length);
        
        if (settings.googleAdsCustomerId) {
            const trimmed = settings.googleAdsCustomerId.trim();
            
            if (trimmed !== settings.googleAdsCustomerId) {
                console.log('\n✂️  Trimming whitespace...');
                console.log('   Before:', JSON.stringify(settings.googleAdsCustomerId));
                console.log('   After:', JSON.stringify(trimmed));
                
                await prisma.crmSettings.update({
                    where: { organizationId },
                    data: { googleAdsCustomerId: trimmed }
                });
                
                console.log('\n✅ Customer ID whitespace fixed successfully!');
                console.log('   New value:', trimmed);
                console.log('   Length:', trimmed.length);
            } else {
                console.log('\n✅ Customer ID has no leading/trailing whitespace');
            }
        } else {
            console.log('\n⚠️  Customer ID is null or undefined');
        }
        
    } catch (error) {
        console.error('❌ Error fixing Customer ID:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

fixCustomerIdWhitespace()
    .then(() => {
        console.log('\n🎉 Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Script failed:', error);
        process.exit(1);
    });
