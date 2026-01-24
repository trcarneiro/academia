import { AsaasService } from '../src/services/asaasService';

// Test different key formats
const PROVIDED_KEY = '17a6e28d-bdf0-4630-b7b0-d106ecb9b494';
const PREFIXED_KEY = `$aact_${PROVIDED_KEY}`;

async function testKeyFormats() {
    console.log('🧪 Testing Asaas API Key Formats...\n');

    // Test 1: Original key as provided
    console.log('Test 1: Original UUID format');
    console.log(`Key: ${PROVIDED_KEY.substring(0, 20)}...`);
    try {
        const asaas1 = new AsaasService(PROVIDED_KEY, true);
        const result = await asaas1.listCustomers({ limit: 1 });
        console.log('✅ SUCCESS with original format');
        console.log(`   Customers found: ${result.totalCount}\n`);
    } catch (error: any) {
        console.log('❌ FAILED with original format');
        console.log(`   Error: ${error.message}\n`);
    }

    // Test 2: With $aact_ prefix
    console.log('Test 2: With $aact_ prefix');
    console.log(`Key: ${PREFIXED_KEY.substring(0, 25)}...`);
    try {
        const asaas2 = new AsaasService(PREFIXED_KEY, true);
        const result = await asaas2.listCustomers({ limit: 1 });
        console.log('✅ SUCCESS with $aact_ prefix');
        console.log(`   Customers found: ${result.totalCount}\n`);
    } catch (error: any) {
        console.log('❌ FAILED with $aact_ prefix');
        console.log(`   Error: ${error.message}\n`);
    }

    console.log('\n📝 Note: If both fail, the key itself may be invalid.');
    console.log('   Please verify the API key from Asaas Dashboard > Integrações');
}

testKeyFormats();
