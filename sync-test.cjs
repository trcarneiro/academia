const http = require('http');
const fs = require('fs');

// Health check básico
const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/health',
  method: 'GET',
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const result = { status: res.statusCode, body: JSON.parse(data) };
    fs.writeFileSync('health-result.json', JSON.stringify(result, null, 2));
    console.log('Health:', JSON.stringify(result));
    
    // Agora testar register
    testRegister();
  });
});

req.on('error', (e) => {
  fs.writeFileSync('health-result.json', JSON.stringify({ error: e.message }));
  console.log('Error:', e.message);
});

req.end();

function testRegister() {
  const body = JSON.stringify({
    name: 'Teste API',
    email: `teste.${Date.now()}@teste.com`,
    cpf: `${Math.floor(10000000000 + Math.random() * 89999999999)}`,
    phone: '11999999999',
    password: 'Teste@123',
    organizationId: '927cecbe-d042-43d4-8d7c-20e6f5e4746e'
  });
  
  const req = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/portal/auth/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const result = { status: res.statusCode, body: JSON.parse(data) };
      fs.writeFileSync('register-result.json', JSON.stringify(result, null, 2));
      console.log('Register:', JSON.stringify(result));
    });
  });
  
  req.on('error', (e) => {
    fs.writeFileSync('register-result.json', JSON.stringify({ error: e.message }));
    console.log('Register Error:', e.message);
  });
  
  req.write(body);
  req.end();
}
