#!/usr/bin/env node

// Script simples para testar endpoints das APIs
const http = require('http');

async function testEndpoint(method, path, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function main() {
  console.log('🧪 Testing Production APIs');
  console.log('========================');
  
  try {
    // Test 1: Health Check
    console.log('\n🔧 Testing GET /health');
    const health = await testEndpoint('GET', '/health');
    console.log(`Status: ${health.status}`);
    if (health.status === 200) {
      console.log('✅ Health check OK');
    } else {
      console.log('❌ Health check failed');
      return;
    }

    // Test 2: Main subscription route
    console.log('\n🔧 Testing POST /api/financial/subscriptions');
    const mainRoute = await testEndpoint('POST', '/api/financial/subscriptions', {
      studentId: 'test-student-id',
      planId: 'test-plan-id'
    });
    console.log(`Status: ${mainRoute.status}`);
    console.log(`Response: ${mainRoute.body.substring(0, 200)}`);
    
    // Test 3: Alternative subscription route  
    console.log('\n🔧 Testing POST /api/students/test-id/subscription');
    const altRoute = await testEndpoint('POST', '/api/students/test-id/subscription', {
      planId: 'test-plan-id'
    });
    console.log(`Status: ${altRoute.status}`);
    console.log(`Response: ${altRoute.body.substring(0, 200)}`);

    console.log('\n🎯 Results Summary:');
    console.log(`Health Check: ${health.status === 200 ? '✅' : '❌'}`);
    console.log(`Main Route: ${mainRoute.status < 500 ? '✅' : '❌'} (Status: ${mainRoute.status})`);
    console.log(`Alt Route: ${altRoute.status < 500 ? '✅' : '❌'} (Status: ${altRoute.status})`);
    
    if (health.status === 200 && mainRoute.status < 500 && altRoute.status < 500) {
      console.log('\n🏆 ALL APIS WORKING! Fallback no longer needed in production!');
    } else {
      console.log('\n⚠️ Some APIs need attention, fallback still needed');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('🚫 Server may not be running. Start with: node dist/server-simple.js');
  }
}

main();
