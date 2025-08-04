#!/usr/bin/env node

/**
 * Teste Final de Verificação - Estudantes e Planos
 * Verifica se o sistema está funcionando corretamente
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// Contadores
let testsPassed = 0;
let testsFailed = 0;

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
    console.log(`${colors.green}✅ ${description}${colors.reset}`);
    testsPassed++;
  } catch (error) {
    console.log(`${colors.red}❌ ${description}: ${error.message}${colors.reset}`);
    testsFailed++;
  }
}

// Testes principais
async function runTests() {
  console.log(`${colors.blue}🎯 Teste Final - Verificação Completa${colors.reset}`);
  console.log(`${colors.blue}======================================${colors.reset}\n`);

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
    
    const count = response.data?.data?.length || 0;
    console.log(`   📊 ${count} estudantes encontrados`);
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
    
    const count = response.data?.data?.length || 0;
    console.log(`   📊 ${count} planos encontrados`);
  });

  // 4. Verificar arquivos essenciais
  await test('Arquivos essenciais', () => {
    const essentialFiles = [
      'public/index.html',
      'public/js/modules/students.js',
      'public/js/modules/plans.js',
      'public/views/students.html',
      'public/views/plans.html',
      'public/views/student-editor.html',
      'public/views/plan-editor.html',
      'public/test/modules/test-runner.html',
      'public/test/students-plans-frontend.html'
    ];
    
    for (const file of essentialFiles) {
      const fullPath = path.join(__dirname, '..', file);
      if (!fs.existsSync(fullPath)) {
        throw new Error(`Arquivo não encontrado: ${file}`);
      }
    }
  });

  // 5. Testar rotas principais
  await test('Rotas principais', async () => {
    const routes = [
      '/',
      '/#students',
      '/#plans',
      '/test/modules/test-runner.html'
    ];
    
    for (const route of routes) {
      const response = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: route,
        method: 'GET'
      });
      
      if (response.status !== 200) {
        throw new Error(`Rota ${route} retornou ${response.status}`);
      }
    }
  });

  // 6. Verificar módulos de teste
  await test('Módulos de teste', () => {
    const testModules = [
      'public/test/modules/students.test.js',
      'public/test/modules/plan-editor.test.js',
      'public/test/modules/student-editor.test.js'
    ];
    
    for (const file of testModules) {
      const fullPath = path.join(__dirname, '..', file);
      if (!fs.existsSync(fullPath)) {
        throw new Error(`Módulo de teste não encontrado: ${file}`);
      }
    }
  });

  // Resumo
  console.log(`\n${colors.blue}📊 Resumo Final${colors.reset}`);
  console.log(`${colors.blue}================${colors.reset}`);
  console.log(`${colors.green}✅ Passou: ${testsPassed}${colors.reset}`);
  console.log(`${colors.red}❌ Falhou: ${testsFailed}${colors.reset}`);
  console.log(`${colors.blue}📈 Total: ${testsPassed + testsFailed}${colors.reset}`);

  if (testsFailed === 0) {
    console.log(`\n${colors.green}🎉 Sistema de Estudantes e Planos está funcionando perfeitamente!${colors.reset}`);
    console.log(`\n${colors.blue}🔗 Acesso rápido:${colors.reset}`);
    console.log(`${colors.blue}   • Sistema: http://localhost:3000${colors.reset}`);
    console.log(`${colors.blue}   • Estudantes: http://localhost:3000/#students${colors.reset}`);
    console.log(`${colors.blue}   • Planos: http://localhost:3000/#plans${colors.reset}`);
    console.log(`${colors.blue}   • Testes: http://localhost:3000/test/modules/test-runner.html${colors.reset}`);
    console.log(`\n${colors.green}✨ Tudo pronto para uso!${colors.reset}`);
  } else {
    console.log(`\n${colors.yellow}⚠️  ${testsFailed} teste(s) falharam - verifique os detalhes acima${colors.reset}`);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runTests().catch(error => {
    console.error(`${colors.red}Erro crítico: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

module.exports = { runTests };
