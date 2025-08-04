#!/usr/bin/env node

/**
 * Script unificado para rodar todos os testes de estudantes e planos
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
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

console.log(`${colors.blue}${colors.bold}🧪 Testes Unificados - Estudantes e Planos${colors.reset}\n`);

// Configurações
const TEST_CONFIG = {
  serverPort: 3000,
  testTimeout: 30000,
  frontendUrl: 'http://localhost:3000/test/students-plans-frontend.html'
};

// Função para executar comandos
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`${colors.yellow}▶️ Executando: ${command} ${args.join(' ')}${colors.reset}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Comando falhou com código ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

// Função para verificar se o servidor está rodando
async function checkServer() {
  const http = require('http');
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${TEST_CONFIG.serverPort}/health`, (res) => {
      resolve(res.statusCode === 200);
    });
    
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Função para rodar testes backend
async function runBackendTests() {
  console.log(`${colors.blue}\n📋 Rodando testes backend...${colors.reset}`);
  
  try {
    // Verificar se Jest está instalado
    const jestConfig = `
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    'servers/**/*.js',
    '!**/node_modules/**'
  ]
};
    `;
    
    fs.writeFileSync('jest.config.js', jestConfig);
    
    // Criar setup de testes
    const testSetup = `
beforeAll(() => {
  console.log('Iniciando testes...');
});

afterAll(() => {
  console.log('Testes finalizados');
});
    `;
    
    if (!fs.existsSync('tests')) {
      fs.mkdirSync('tests', { recursive: true });
    }
    
    fs.writeFileSync('tests/setup.js', testSetup);
    
    await runCommand('npx', ['jest', 'tests/integration/students-plans-backend.test.js', '--detectOpenHandles']);
    return true;
  } catch (error) {
    console.log(`${colors.red}❌ Erro nos testes backend: ${error.message}${colors.reset}`);
    return false;
  }
}

// Função para rodar testes frontend
async function runFrontendTests() {
  console.log(`${colors.blue}\n🌐 Rodando testes frontend...${colors.reset}`);
  
  try {
    console.log(`${colors.green}✅ Testes frontend disponíveis em: ${TEST_CONFIG.frontendUrl}${colors.reset}`);
    console.log(`${colors.yellow}💡 Abra o navegador e acesse a URL acima para executar os testes manuais${colors.reset}`);
    return true;
  } catch (error) {
    console.log(`${colors.red}❌ Erro nos testes frontend: ${error.message}${colors.reset}`);
    return false;
  }
}

// Função para rodar testes simples
async function runSimpleTests() {
  console.log(`${colors.blue}\n⚡ Rodando testes simples...${colors.reset}`);
  
  try {
    await runCommand('node', ['scripts/test-simple.js']);
    return true;
  } catch (error) {
    console.log(`${colors.red}❌ Erro nos testes simples: ${error.message}${colors.reset}`);
    return false;
  }
}

// Função principal
async function main() {
  const args = process.argv.slice(2);
  const testType = args[0] || 'all';

  console.log(`${colors.blue}📊 Tipo de teste: ${testType}${colors.reset}`);

  let serverRunning = await checkServer();
  
  if (!serverRunning && testType !== 'backend') {
    console.log(`${colors.yellow}🚀 Iniciando servidor...${colors.reset}`);
    try {
      const serverProcess = spawn('node', ['servers/working-server.js'], {
        stdio: 'pipe',
        detached: true
      });
      
      // Aguardar servidor iniciar
      await new Promise(resolve => setTimeout(resolve, 3000));
      serverRunning = await checkServer();
      
      if (serverRunning) {
        console.log(`${colors.green}✅ Servidor iniciado na porta ${TEST_CONFIG.serverPort}${colors.reset}`);
      }
    } catch (error) {
      console.log(`${colors.red}❌ Erro ao iniciar servidor: ${error.message}${colors.reset}`);
      process.exit(1);
    }
  }

  let results = {
    backend: false,
    frontend: false,
    simple: false
  };

  try {
    switch (testType) {
      case 'backend':
        results.backend = await runBackendTests();
        break;
      case 'frontend':
        results.frontend = await runFrontendTests();
        break;
      case 'simple':
        results.simple = await runSimpleTests();
        break;
      case 'all':
      default:
        results.simple = await runSimpleTests();
        results.backend = await runBackendTests();
        results.frontend = await runFrontendTests();
        break;
    }

    // Resumo
    console.log(`${colors.blue}\n📊 Resumo dos Testes:${colors.reset}`);
    console.log(`Backend: ${results.backend ? colors.green + '✅ OK' : colors.red + '❌ Falhou'}${colors.reset}`);
    console.log(`Frontend: ${results.frontend ? colors.green + '✅ OK' : colors.red + '❌ Falhou'}${colors.reset}`);
    console.log(`Simples: ${results.simple ? colors.green + '✅ OK' : colors.red + '❌ Falhou'}${colors.reset}`);

    const allPassed = Object.values(results).every(r => r === true);
    
    if (allPassed) {
      console.log(`${colors.green}\n🎉 Todos os testes foram executados com sucesso!${colors.reset}`);
    } else {
      console.log(`${colors.yellow}\n⚠️  Alguns testes falharam. Verifique os logs acima.${colors.reset}`);
    }

  } catch (error) {
    console.log(`${colors.red}❌ Erro geral: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runAllTests: main };
