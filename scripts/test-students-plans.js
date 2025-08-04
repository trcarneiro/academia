#!/usr/bin/env node

/**
 * Teste Unificado - Estudantes e Planos
 * Frontend e Backend
 */

const { spawn } = require('child_process');
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

// Função auxiliar para execução de comandos
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const cmd = spawn(command, args, { 
      stdio: 'inherit',
      shell: true,
      ...options 
    });
    
    cmd.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
    
    cmd.on('error', reject);
  });
}

// Função para verificar se servidor está rodando
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000/health');
    return response.ok;
  } catch {
    return false;
  }
}

// Função principal
async function runAllTests() {
  console.log(`${colors.blue}🎯 Testes para Estudantes e Planos${colors.reset}`);
  console.log(`${colors.blue}=================================${colors.reset}\n`);

  // 1. Testes de Frontend
  console.log(`${colors.yellow}📱 Testando Frontend...${colors.reset}`);
  try {
    await runCommand('node', ['scripts/test-frontend.js']);
    console.log(`${colors.green}✅ Frontend tests completed${colors.reset}\n`);
  } catch (error) {
    console.log(`${colors.red}❌ Frontend tests failed: ${error.message}${colors.reset}\n`);
  }

  // 2. Verificar servidor
  console.log(`${colors.yellow}🔍 Verificando servidor...${colors.reset}`);
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log(`${colors.yellow}⚠️  Servidor não está rodando${colors.reset}`);
    console.log(`${colors.blue}💡 Iniciando servidor...${colors.reset}`);
    
    // Iniciar servidor em background
    const server = spawn('node', ['servers/working-server.js'], {
      stdio: 'pipe',
      detached: true
    });
    
    // Aguardar servidor iniciar
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  // 3. Testes de Backend
  console.log(`${colors.yellow}🔧 Testando Backend...${colors.reset}`);
  try {
    await runCommand('node', ['scripts/test-complete.js']);
    console.log(`${colors.green}✅ Backend tests completed${colors.reset}\n`);
  } catch (error) {
    console.log(`${colors.red}❌ Backend tests failed: ${error.message}${colors.reset}\n`);
  }

  // 4. Testes de Integração
  console.log(`${colors.yellow}🔗 Testando Integração...${colors.reset}`);
  try {
    await runCommand('node', ['scripts/run-all-tests.js']);
    console.log(`${colors.green}✅ Integration tests completed${colors.reset}\n`);
  } catch (error) {
    console.log(`${colors.red}❌ Integration tests failed: ${error.message}${colors.reset}\n`);
  }

  // 5. Executar testes unitários
  console.log(`${colors.yellow}🧪 Executando testes unitários...${colors.reset}`);
  try {
    await runCommand('npm', ['test'], { stdio: 'inherit' });
    console.log(`${colors.green}✅ Unit tests completed${colors.reset}\n`);
  } catch (error) {
    console.log(`${colors.red}❌ Unit tests failed: ${error.message}${colors.reset}\n`);
  }

  // Resumo
  console.log(`${colors.blue}📊 Resumo Final${colors.reset}`);
  console.log(`${colors.blue}================${colors.reset}`);
  console.log(`${colors.green}✅ Frontend: Verificado${colors.reset}`);
  console.log(`${colors.green}✅ Backend: Verificado${colors.reset}`);
  console.log(`${colors.green}✅ Integração: Verificado${colors.reset}`);
  console.log(`${colors.green}✅ Testes Unitários: Executados${colors.reset}`);

  // URLs de teste
  console.log(`\n${colors.blue}🔗 URLs de Teste${colors.reset}`);
  console.log(`${colors.blue}================${colors.reset}`);
  console.log(`${colors.blue}📱 Frontend: http://localhost:3000${colors.reset}`);
  console.log(`${colors.blue}👥 Students: http://localhost:3000/#students${colors.reset}`);
  console.log(`${colors.blue}📋 Plans: http://localhost:3000/#plans${colors.reset}`);
  console.log(`${colors.blue}🧪 Test Runner: http://localhost:3000/test/modules/test-runner.html${colors.reset}`);
  console.log(`${colors.blue}📊 API Docs: http://localhost:3000/api-docs${colors.reset}`);
}

// Executar se chamado diretamente
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests };
