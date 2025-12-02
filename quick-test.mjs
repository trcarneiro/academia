// Quick test - salva resultado em arquivo
import { writeFileSync } from 'fs';

async function test() {
  const results = [];
  
  try {
    // Test 1: Health
    const health = await fetch('http://localhost:3000/health');
    const healthData = await health.json();
    results.push({ test: 'health', status: health.status, data: healthData });
  } catch (e) {
    results.push({ test: 'health', error: e.message });
  }
  
  try {
    // Test 2: Register (GET should return 404 or method not allowed)
    const check = await fetch('http://localhost:3000/api/portal/auth/register');
    results.push({ test: 'register-get', status: check.status });
  } catch (e) {
    results.push({ test: 'register-get', error: e.message });
  }
  
  try {
    // Test 3: Register POST
    const body = {
      name: 'Teste API',
      email: `teste.${Date.now()}@teste.com`,
      cpf: `${Math.floor(10000000000 + Math.random() * 89999999999)}`,
      phone: '11999999999',
      password: 'Teste@123',
      organizationId: '927cecbe-d042-43d4-8d7c-20e6f5e4746e'
    };
    
    const register = await fetch('http://localhost:3000/api/portal/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const registerData = await register.json();
    results.push({ test: 'register-post', status: register.status, data: registerData });
  } catch (e) {
    results.push({ test: 'register-post', error: e.message });
  }
  
  // Salva resultado
  writeFileSync('test-results.json', JSON.stringify(results, null, 2));
  console.log('RESULTADOS:', JSON.stringify(results, null, 2));
}

test();
