// Simple endpoint tester without dependencies that might conflict
const http = require('http');

function testEndpoint(path, callback) {
  console.log(`Testing ${path}...`);
  
  const req = http.get(`http://localhost:3000${path}`, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        console.log(`✅ ${path}: Status ${res.statusCode}, Success: ${json.success}, Data: ${Array.isArray(json.data) ? json.data.length + ' items' : 'N/A'}`);
      } catch (error) {
        console.log(`❌ ${path}: Status ${res.statusCode}, Parse error, Raw: ${data.substring(0, 100)}`);
      }
      callback();
    });
  });
  
  req.on('error', (error) => {
    console.log(`❌ ${path}: ${error.message}`);
    callback();
  });
  
  req.setTimeout(3000, () => {
    console.log(`⏰ ${path}: Timeout`);
    req.destroy();
    callback();
  });
}

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

let index = 0;

function testNext() {
  if (index >= endpoints.length) {
    console.log('✅ Testing complete!');
    return;
  }
  
  testEndpoint(endpoints[index], () => {
    index++;
    setTimeout(testNext, 100);
  });
}

console.log('🔍 Testing Diagnostic Endpoints...');
testNext();
