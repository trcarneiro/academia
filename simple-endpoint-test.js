console.log('🔍 Testing Diagnostic Endpoints...');

const http = require('http');

function testEndpoint(path) {
  return new Promise((resolve) => {
    console.log(`Testing ${path}...`);
    
    const req = http.get(`http://localhost:3000${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log(`✅ ${path}: Status ${res.statusCode}, Success: ${json.success}, Data: ${Array.isArray(json.data) ? json.data.length + ' items' : 'N/A'}`);
        } catch (error) {
          console.log(`❌ ${path}: Status ${res.statusCode}, Parse error: ${error.message}`);
        }
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ ${path}: ${error.message}`);
      resolve();
    });
    
    req.setTimeout(3000, () => {
      console.log(`⏰ ${path}: Timeout`);
      req.destroy();
      resolve();
    });
  });
}

(async () => {
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
  
  console.log('✅ Testing complete!');
})();
