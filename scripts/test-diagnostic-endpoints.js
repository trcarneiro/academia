const http = require('http');

async function testEndpoint(path) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:3000${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log(`\n=== ${path} ===`);
          console.log(`Status: ${res.statusCode}`);
          console.log(`Success: ${json.success}`);
          console.log(`Data length: ${Array.isArray(json.data) ? json.data.length : 'N/A'}`);
          console.log(`Error: ${json.error || 'None'}`);
        } catch (error) {
          console.log(`\n=== ${path} ===`);
          console.log(`Status: ${res.statusCode}`);
          console.log(`Parse error: ${error.message}`);
          console.log(`Raw data: ${data.substring(0, 100)}...`);
        }
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.log(`\n=== ${path} ===`);
      console.log(`ERROR: ${error.message}`);
      resolve();
    });
    
    req.setTimeout(5000, () => {
      console.log(`\n=== ${path} ===`);
      console.log('ERROR: Timeout');
      req.destroy();
      resolve();
    });
  });
}

async function main() {
  console.log('🔍 Testing Diagnostic Endpoints...');
  
  const endpoints = [
    '/health',
    '/api/students',
    '/api/courses',
    '/api/classes',
    '/api/organizations',
    '/api/techniques',
    '/api/billing-plans',
    '/api/financial-responsibles'
  ];
  
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
  }
}

main().catch(console.error);
