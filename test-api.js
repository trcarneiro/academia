// Simple test script to test the student API
const http = require('http');

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
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

async function testStudentAPI() {
  console.log('Testing student API...');
  
  try {
    // First test GET
    console.log('Testing GET /api/students...');
    const getResponse = await makeRequest('GET', '/api/students');
    console.log('GET Response status:', getResponse.status);
    console.log('GET Response body:', getResponse.body);
    
    // Then test POST
    console.log('Testing POST /api/students...');
    const postResponse = await makeRequest('POST', '/api/students', {
      name: 'Test Student',
      email: 'test@test.com',
      phone: '+5511999999999'
    });
    
    console.log('POST Response status:', postResponse.status);
    console.log('POST Response body:', postResponse.body);
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testStudentAPI();
