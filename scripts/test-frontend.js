#!/usr/bin/env node

/**
 * Teste Frontend - Estudantes e Planos
 * Validação de arquivos e módulos frontend
 */

const fs = require('fs');
const path = require('path');

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

// Funções de teste
function testFrontendModules() {
  const modules = [
    'public/js/modules/students.js',
    'public/js/modules/plans.js',
    'public/js/modules/student-editor.js',
    'public/js/modules/plan-editor.js',
    'public/js/modules/courses.js',
    'public/js/modules/lessons.js',
    'public/js/modules/dashboard-optimized.js'
  ];
  
  for (const module of modules) {
    if (!fs.existsSync(path.join(__dirname, '..', module))) {
      throw new Error(`Module file not found: ${module}`);
    }
    
    // Verificar se o arquivo tem conteúdo
    const content = fs.readFileSync(path.join(__dirname, '..', module), 'utf8');
    if (content.length < 100) {
      throw new Error(`Module file too small: ${module}`);
    }
  }
  console.log(`   Found ${modules.length} frontend modules`);
}

function testViews() {
  const views = [
    'public/views/students.html',
    'public/views/plans.html',
    'public/views/student-editor.html',
    'public/views/plan-editor.html',
    'public/views/courses.html',
    'public/views/lessons.html',
    'public/index.html'
  ];
  
  for (const view of views) {
    if (!fs.existsSync(path.join(__dirname, '..', view))) {
      throw new Error(`View file not found: ${view}`);
    }
    
    // Verificar se o arquivo tem conteúdo
    const content = fs.readFileSync(path.join(__dirname, '..', view), 'utf8');
    if (content.length < 100) {
      throw new Error(`View file too small: ${view}`);
    }
  }
  console.log(`   Found ${views.length} view files`);
}

function testTestFiles() {
  const testFiles = [
    'public/test/modules/students.test.js',
    'public/test/modules/student-editor.test.js',
    'public/test/modules/plan-editor.test.js',
    'public/test/modules/test-runner.html',
    'public/test/students-plans-frontend.html'
  ];
  
  for (const testFile of testFiles) {
    if (!fs.existsSync(path.join(__dirname, '..', testFile))) {
      throw new Error(`Test file not found: ${testFile}`);
    }
  }
  console.log(`   Found ${testFiles.length} test files`);
}

function testCSSFiles() {
  const cssFiles = [
    'public/css/modules/students.css',
    'public/css/modules/courses.css',
    'public/css/modules/plans.css'
  ];
  
  for (const cssFile of cssFiles) {
    if (!fs.existsSync(path.join(__dirname, '..', cssFile))) {
      throw new Error(`CSS file not found: ${cssFile}`);
    }
  }
  console.log(`   Found ${cssFiles.length} CSS files`);
}

function testIntegrationTests() {
  const integrationTests = [
    'tests/integration/students-plans-backend.test.js',
    'tests/integration/students-api.test.ts',
    'tests/integration/billing-plans-api.test.ts',
    'tests/integration/students-plans.test.js'
  ];
  
  for (const testFile of integrationTests) {
    if (!fs.existsSync(path.join(__dirname, '..', testFile))) {
      throw new Error(`Integration test not found: ${testFile}`);
    }
  }
  console.log(`   Found ${integrationTests.length} integration tests`);
}

function testPackageJson() {
  const packagePath = path.join(__dirname, '..', 'package.json');
  if (!fs.existsSync(packagePath)) {
    throw new Error('package.json not found');
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // Verificar dependências necessárias
  const requiredDeps = ['axios', 'express'];
  const requiredDevDeps = ['jest', 'vitest'];
  
  for (const dep of requiredDeps) {
    if (!packageJson.dependencies || !packageJson.dependencies[dep]) {
      console.log(`   ⚠️  Missing dependency: ${dep}`);
    }
  }
  
  for (const dep of requiredDevDeps) {
    if (!packageJson.devDependencies || !packageJson.devDependencies[dep]) {
      console.log(`   ⚠️  Missing dev dependency: ${dep}`);
    }
  }
}

// Função principal
function runAllTests() {
  console.log('🎯 Iniciando Testes Frontend - Estudantes e Planos');
  console.log('================================================\n');

  // Executar testes
  runTest('Frontend Modules', testFrontendModules);
  runTest('View Files', testViews);
  runTest('Test Files', testTestFiles);
  runTest('CSS Files', testCSSFiles);
  runTest('Integration Tests', testIntegrationTests);
  runTest('Package.json', testPackageJson);

  // Resumo
  console.log('\n📊 Resumo dos Testes');
  console.log('====================');
  console.log(`✅ Passou: ${testsPassed}`);
  console.log(`❌ Falhou: ${testsFailed}`);
  console.log(`📈 Total: ${testsPassed + testsFailed}`);

  if (testsFailed === 0) {
    console.log('\n🎉 Todos os testes frontend passaram!');
    console.log('💡 O sistema de estudantes e planos está estruturado corretamente.');
  } else {
    console.log('\n⚠️  Alguns testes falharam.');
    console.log('💡 Verifique os logs acima para mais detalhes.');
  }

  // Instruções
  console.log('\n🔗 Próximos Passos');
  console.log('=================');
  console.log('1. Execute: node servers/working-server.js');
  console.log('2. Abra: http://localhost:3000');
  console.log('3. Teste: node scripts/test-complete.js');
  console.log('4. Frontend: http://localhost:3000/test/modules/test-runner.html');
}

// Executar se chamado diretamente
if (require.main === module) {
  runAllTests();
}

module.exports = { runAllTests };
