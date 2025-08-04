#!/usr/bin/env node

// Script para testar endpoints das APIs de produção
const { spawn } = require('child_process');
const http = require('http');

const BASE_URL = 'http://localhost:3000';

async function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          statusMessage: res.statusMessage,
          body: body
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testEndpoint(method, path, body = null) {
  try {
    console.log(`\n🔧 Testing ${method} ${path}`);
    if (body) {
      console.log(`📝 Body:`, JSON.stringify(body, null, 2));
    }
    
    const response = await makeRequest(method, path, body);
    
    console.log(`📊 Status: ${response.status} ${response.statusMessage}`);
    
    try {
      const jsonData = JSON.parse(response.body);
      console.log(`✅ Response:`, JSON.stringify(jsonData, null, 2));
    } catch (e) {
      console.log(`📄 Response (raw):`, response.body.substring(0, 300));
    }
    
    return response;
  } catch (error) {
    console.error(`❌ Error testing ${method} ${path}:`, error.message);
    return null;
  }
}

function startServer() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Starting server...');
    const server = spawn('node', ['dist/server-simple.js'], {
      stdio: 'pipe',
      cwd: process.cwd()
    });

    let started = false;
    
    server.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`📋 Server: ${output.trim()}`);
      
      if (output.includes('Server running') || output.includes('listening')) {
        if (!started) {
          started = true;
          setTimeout(() => resolve(server), 2000); // Wait 2s for server to be ready
        }
      }
    });

    server.stderr.on('data', (data) => {
      console.error(`❌ Server Error: ${data.toString().trim()}`);
    });

    server.on('error', (error) => {
      reject(error);
    });

    // If no output after 5 seconds, assume it started
    setTimeout(() => {
      if (!started) {
        started = true;
        resolve(server);
      }
    }, 5000);
  });
}

async function main() {
  console.log('🚀 Testing API endpoints for production configuration');
  console.log('==================================================');
  
  // Start server
  let server;
  try {
    server = await startServer();
    console.log('✅ Server started successfully');
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    return;
  }

  // Wait a bit more for server to be ready
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  try {
    // 1. Test server health
    await testEndpoint('GET', '/health');
    
    // 2. Test billing plans endpoint
    await testEndpoint('GET', '/api/financial/plans');
    
    // 3. Test students endpoint
    await testEndpoint('GET', '/api/students');
    
    // 4. Test subscription creation (main route)
    const subscriptionData = {
      studentId: 'test-student-id',
      planId: 'test-plan-id',
      startDate: new Date().toISOString()
    };
    
    await testEndpoint('POST', '/api/financial/subscriptions', subscriptionData);
    
    // 5. Test alternative subscription route
    await testEndpoint('POST', '/api/students/test-student-id/subscription', {
      planId: 'test-plan-id',
      startDate: new Date().toISOString()
    });
    
    console.log('\n🏁 Test completed');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    // Kill server
    if (server) {
      console.log('\n🛑 Stopping server...');
      server.kill();
    }
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testEndpoint };
