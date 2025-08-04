#!/usr/bin/env node

/**
 * Teste Simples - Estudantes e Planos
 * Verifica funcionalidade básica sem dependências complexas
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

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

// Função auxiliar para testes
function runTest(description, testFn) {
  try {
    console.log(`🧪 ${description}`);
    testFn();
    console.log(`✅ ${description}`);
    testsPassed++;
  } catch (err) {
    console.log(`❌ ${description}: ${err.message}`);
    testsFailed++;
  }
}

// Função para verificar se arquivo existe e tem conteúdo
function checkFile(filePath, minSize = 100) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Arquivo não encontrado: ${filePath}`);
  }
  
  const stats = fs.statSync(fullPath);
  if (stats.size < minSize) {
    throw new Error(`Arquivo muito pequeno: ${filePath}`);
  }
  
  return true;
}

// Função para verificar servidor
function checkServer(port = 3000) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/health`, (res) => {
      resolve(res.statusCode === 200);
    });
    
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Testes de estrutura
function testStructure() {
  console.log(`${colors.blue}📁 Verificando estrutura do projeto...${colors.reset}`);
  
  // Arquivos essenciais
  const essentialFiles = [
    'public/index.html',
    'public/js/modules/students.js',
    'public/js/modules/plans.js',
    'public/views/students.html',
    'public/views/plans.html',
    'public/views/student-editor.html',
    'public/views/plan-editor.html',
    'servers/working-server.js'
  ];
  
  for (const file of essentialFiles) {
    runTest(`Arquivo: ${file}`, () => checkFile(file));
  }
}

// Testes de API
async function testAPI() {
  console.log(`${colors.blue}🔌 Verificando API...${colors.reset}`);
  
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.log(`${colors.yellow}⚠️  Servidor não está rodando na porta 3000${colors.reset}`);
    console.log(`${colors.blue}💡 Execute: node servers/working-server.js${colors.reset}`);
    return;
  }
  
  console.log(`${colors.green}✅ Servidor está rodando${colors.reset}`);
  
  // Testar endpoints básicos
  const endpoints = [
    '/api/students',
    '/api/billing-plans',
    '/api/health'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`http://localhost:3000${endpoint}`);
      console.log(`   ${endpoint}: ${response.status} ${response.statusText}`);
      if (response.ok) testsPassed++;
      else testsFailed++;
    } catch (err) {
      console.log(`   ${endpoint}: Erro - ${err.message}`);
      testsFailed++;
    }
  }
}

// Testes de frontend
function testFrontend() {
  console.log(`${colors.blue}🎨 Verificando frontend...${colors.reset}`);
  
  // Verificar se arquivos de teste existem
  const testFiles = [
    'public/test/modules/test-runner.html',
    'public/test/students-plans-frontend.html',
    'public/test/modules/students.test.js',
    'public/test/modules/plan-editor.test.js'
  ];
  
  for (const file of testFiles) {
    runTest(`Teste: ${file}`, () => checkFile(file));
  }
}

// Função principal
async function runAllTests() {
  console.log(`${colors.blue}🎯 Testes Simples - Estudantes e Planos${colors.reset}`);
  console.log(`${colors.blue}=====================================${colors.reset}\n`);
  
  // 1. Estrutura
  testStructure();
  
  // 2. Frontend
  testFrontend();
  
  // 3. API (se servidor estiver rodando)
  await testAPI();
  
  // Resumo
  console.log(`\n${colors.blue}📊 Resumo dos Testes${colors.reset}`);
  console.log(`${colors.blue}====================${colors.reset}`);
  console.log(`${colors.green}✅ Passou: ${testsPassed}${colors.reset}`);
  console.log(`${colors.red}❌ Falhou: ${testsFailed}${colors.reset}`);
  console.log(`${colors.blue}📈 Total: ${testsPassed + testsFailed}${colors.reset}`);
  
  if (testsFailed === 0) {
    console.log(`\n${colors.green}🎉 Todos os testes passaram!${colors.reset}`);
  } else {
    console.log(`\n${colors.yellow}⚠️  Alguns testes falharam - verifique os detalhes acima${colors.reset}`);
  }
  
  // Instruções
  console.log(`\n${colors.blue}🔗 Próximos Passos${colors.reset}`);
  console.log(`${colors.blue}=================${colors.reset}`);
  console.log(`${colors.blue}1. Execute: node servers/working-server.js${colors.reset}`);
  console.log(`${colors.blue}2. Abra: http://localhost:3000${colors.reset}`);
  console.log(`${colors.blue}3. Teste: http://localhost:3000/test/modules/test-runner.html${colors.reset}`);
  console.log(`${colors.blue}4. Students: http://localhost:3000/#students${colors.reset}`);
  console.log(`${colors.blue}5. Plans: http://localhost:3000/#plans${colors.reset}`);
}

// Executar se chamado diretamente
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests };
