// Teste do endpoint de registro do portal
// Execute com: node test-portal-api.mjs

async function testPortalRegister() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Testando Portal do Aluno API...\n');
  
  // Test 1: Health check
  try {
    console.log('1. Testando health check...');
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthData = await healthRes.json();
    console.log('   ✅ Health:', healthData.status || 'ok');
  } catch (error) {
    console.log('   ❌ Servidor não está acessível:', error.message);
    process.exit(1);
  }
  
  // Test 2: Register
  try {
    console.log('\n2. Testando cadastro de aluno...');
    const registerData = {
      name: 'João Teste Portal',
      email: `teste.portal.${Date.now()}@example.com`,
      phone: '11999887766',
      cpf: `${Date.now()}`.slice(-11).padStart(11, '0'),
      password: 'senha123',
      organizationId: '01968de6-1f54-7b72-9aac-15d9f7310ca7'
    };
    
    console.log('   Dados:', JSON.stringify(registerData, null, 2));
    
    const registerRes = await fetch(`${baseUrl}/api/portal/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerData)
    });
    
    const registerResult = await registerRes.json();
    
    if (registerResult.success) {
      console.log('   ✅ Cadastro OK!');
      console.log('   Student ID:', registerResult.student?.id);
      console.log('   Token:', registerResult.token?.substring(0, 50) + '...');
    } else {
      console.log('   ❌ Erro:', registerResult.message || registerResult.error);
    }
  } catch (error) {
    console.log('   ❌ Erro no cadastro:', error.message);
  }
  
  // Test 3: Login
  try {
    console.log('\n3. Testando login...');
    const loginData = {
      email: 'teste.portal@example.com',
      password: 'senha123',
      organizationId: '01968de6-1f54-7b72-9aac-15d9f7310ca7'
    };
    
    const loginRes = await fetch(`${baseUrl}/api/portal/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginData)
    });
    
    const loginResult = await loginRes.json();
    
    if (loginResult.success) {
      console.log('   ✅ Login OK!');
      console.log('   Student:', loginResult.student?.name);
    } else {
      console.log('   ⚠️ Login falhou (esperado se email não existe):', loginResult.message);
    }
  } catch (error) {
    console.log('   ❌ Erro no login:', error.message);
  }
  
  console.log('\n✅ Testes concluídos!');
}

testPortalRegister();
