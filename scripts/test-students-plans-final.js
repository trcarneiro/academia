#!/usr/bin/env node

/**
 * Teste Final - Estudantes e Planos
 * Testa a funcionalidade completa de forma simplificada
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Configurações
const BASE_URL = 'http://localhost:3000';
const COLORS = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// Contadores
let passed = 0;
let failed = 0;

// Função auxiliar para requisições HTTP
function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : null;
          resolve({ status: res.statusCode, data: json });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Função para verificar servidor
async function checkServer() {
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/students',
      method: 'GET'
    });
    return response.status === 200;
  } catch {
    return false;
  }
}

// Função de teste
async function test(description, testFn) {
  try {
    console.log(`🧪 ${description}`);
    await testFn();
    console.log(`${COLORS.green}✅ ${description}${COLORS.reset}`);
    passed++;
  } catch (error) {
    console.log(`${COLORS.red}❌ ${description}: ${error.message}${COLORS.reset}`);
    failed++;
  }
}

// Testes principais
async function runTests() {
  console.log(`${COLORS.blue}🎯 Testes Finais - Estudantes e Planos${COLORS.reset}`);
  console.log(`${COLORS.blue}======================================${COLORS.reset}\n`);
  
  // 1. Verificar servidor
  await test('Servidor está rodando', async () => {
    const running = await checkServer();
    if (!running) throw new Error('Servidor não está rodando na porta 3000');
  });
  
  // 2. Testar API de estudantes
  await test('API de estudantes', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/students',
      method: 'GET'
    });
    
    if (response.status !== 200) {
      throw new Error(`Status ${response.status}`);
    }
    
    if (!Array.isArray(response.data)) {
      throw new Error('Resposta não é um array');
    }
  });
  
  // 3. Testar API de planos
  await test('API de planos', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/billing-plans',
      method: 'GET'
    });
    
    if (response.status !== 200) {
      throw new Error(`Status ${response.status}`);
    }
    
    if (!Array.isArray(response.data)) {
      throw new Error('Resposta não é um array');
    }
  });
  
  // 4. Testar criação de estudante
  await test('Criar estudante', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/students',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        name: 'Teste Estudante',
        email: 'teste@email.com',
        phone: '11999999999'
      }
    });
    
    if (response.status !== 201 && response.status !== 200) {
      throw new Error(`Status ${response.status}`);
    }
  });
  
  // 5. Testar criação de plano
  await test('Criar plano', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/billing-plans',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        name: 'Plano Teste',
        price: 100,
        duration: 30,
        description: 'Plano de teste'
      }
    });
    
    if (response.status !== 201 && response.status !== 200) {
      throw new Error(`Status ${response.status}`);
    }
  });
  
  // 6. Verificar arquivos de teste frontend
  await test('Arquivos de teste frontend', () => {
    const testFiles = [
      'public/test/modules/test-runner.html',
      'public/test/students-plans-frontend.html'
    ];
    
    for (const file of testFiles) {
      const fullPath = path.join(__dirname, '..', file);
      if (!fs.existsSync(fullPath)) {
        throw new Error(`Arquivo não encontrado: ${file}`);
      }
    }
  });
  
  // 7. Verificar rotas principais
  await test('Rotas principais', async () => {
    const routes = [
      '/',
      '/#students',
      '/#plans',
      '/test/modules/test-runner.html'
    ];
    
    for (const route of routes) {
      try {
        const response = await makeRequest({
          hostname: 'localhost',
          port: 3000,
          path: route,
          method: 'GET'
        });
        
        if (response.status !== 200) {
          throw new Error(`Rota ${route} retornou ${response.status}`);
        }
      } catch (error) {
        throw new Error(`Erro ao acessar ${route}: ${error.message}`);
      }
    }
  });
  
  // Resumo
  console.log(`\n${COLORS.blue}📊 Resumo Final${COLORS.reset}`);
  console.log(`${COLORS.blue}================${COLORS.reset}`);
  console.log(`${COLORS.green}✅ Passou: ${passed}${COLORS.reset}`);
  console.log(`${COLORS.red}❌ Falhou: ${failed}${COLORS.reset}`);
  console.log(`${COLORS.blue}📈 Total: ${passed + failed}${COLORS.reset}`);
  
  if (failed === 0) {
    console.log(`\n${COLORS.green}🎉 Todos os testes finais passaram!${COLORS.reset}`);
    console.log(`\n${COLORS.blue}🔗 Acesso rápido:${COLORS.reset}`);
    console.log(`${COLORS.blue}   • Sistema: http://localhost:3000${COLORS.reset}`);
    console.log(`${COLORS.blue}   • Estudantes: http://localhost:3000/#students${COLORS.reset}`);
    console.log(`${COLORS.blue}   • Planos: http://localhost:3000/#plans${COLORS.reset}`);
    console.log(`${COLORS.blue}   • Testes: http://localhost:3000/test/modules/test-runner.html${COLORS.reset}`);
  } else {
    console.log(`\n${COLORS.yellow}⚠️  ${failed} teste(s) falharam - verifique os detalhes acima${COLORS.reset}`);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runTests().catch(error => {
    console.error(`${COLORS.red}Erro crítico: ${error.message}${COLORS.reset}`);
    process.exit(1);
  });
}

module.exports = { runTests };
