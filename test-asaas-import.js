// Test script for Asaas import endpoint
const fetch = require('node-fetch');

async function testImport() {
  const organizationId = 'ff5ee00e-d8a3-4291-9428-d28b852fb472';
  const customerId = 'cus_000146570039'; // Brenda Oliveira Duarte
  
  console.log('🧪 Testing Asaas import...');
  console.log(`Organization: ${organizationId}`);
  console.log(`Customer: ${customerId}`);
  
  try {
    const response = await fetch('http://localhost:3000/api/asaas/import-customer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-organization-id': organizationId,
      },
      body: JSON.stringify({ customerId }),
    });
    
    console.log(`\n📊 Response status: ${response.status}`);
    
    const data = await response.json();
    console.log('\n📦 Response data:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('\n✅ Import successful!');
    } else {
      console.log('\n❌ Import failed:');
      console.log(`Error: ${data.error || data.message}`);
    }
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

testImport();
