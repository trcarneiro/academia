// Quick test of all endpoints
const fetch = require('node-fetch');

async function testEndpoints() {
    const baseUrl = 'http://localhost:3000';
    
    const endpoints = [
        '/health',
        '/ultimate',
        '/dashboard', 
        '/api/students',
        '/api/organizations',
        '/api/techniques'
    ];
    
    console.log('🔍 Testing all endpoints...\n');
    
    for (const endpoint of endpoints) {
        try {
            const response = await fetch(`${baseUrl}${endpoint}`, {
                timeout: 5000
            });
            
            const status = response.status;
            const statusText = response.statusOk ? '✅' : '❌';
            
            console.log(`${statusText} ${endpoint} - Status: ${status}`);
            
            if (endpoint.startsWith('/api/')) {
                const data = await response.text();
                console.log(`   Response: ${data.substring(0, 100)}...`);
            }
            
        } catch (error) {
            console.log(`❌ ${endpoint} - Error: ${error.message}`);
        }
    }
    
    console.log('\n🎯 Test completed!');
}

testEndpoints();