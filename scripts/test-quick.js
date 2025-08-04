#!/usr/bin/env node

/**
 * Script rápido para testar estudantes e planos
 * Verifica se os endpoints estão funcionando
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
const TEST_TIMEOUT = 5000;

// Cores para console
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

console.log(`${colors.blue}${colors.bold}⚡ Teste Rápido - Estudantes e Planos${colors.reset}\n`);

// Função para testar endpoint
function testEndpoint(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = http.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = {
            status: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null
          };
          resolve(response);
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(TEST_TIMEOUT, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Função principal
async function runQuickTests() {
  const tests = [
    { name: 'Health Check', method: 'GET', path: '/health' },
    { name: 'List Students', method: 'GET', path: '/api/students' },
    { name: 'List Plans', method: 'GET', path: '/api/billing-plans' },
    { name: 'List Courses', method: 'GET', path: '/api/courses' }
  ];

  console.log(`${colors.yellow}🔄 Verificando endpoints...${colors.reset}\n`);

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await testEndpoint(test.method, test.path);
      
      if (result.status >= 200 && result.status < 300) {
        console.log(`${colors.green}✅ ${test.name}: ${result.status}${colors.reset}`);
        passed++;
      } else {
        console.log(`${colors.red}❌ ${test.name}: ${result.status}${colors.reset}`);
        failed++;
      }
    } catch (error) {
      console.log(`${colors.red}❌ ${test.name}: ${error.message}${colors.reset}`);
      failed++;
    }
  }

  console.log(`\n${colors.blue}📊 Resumo:${colors.reset}`);
  console.log(`Passou: ${colors.green}${passed}${colors.reset}`);
  console.log(`Falhou: ${colors.red}${failed}${colors.reset}`);
  console.log(`Total: ${colors.blue}${passed + failed}${colors.reset}`);

  if (failed === 0) {
    console.log(`\n${colors.green}🎉 Todos os testes passaram!${colors.reset}`);
    console.log(`${colors.yellow}💡 Para testes mais completos, execute: node scripts/run-all-tests.js${colors.reset}`);
  } else {
    console.log(`\n${colors.red}⚠️  Alguns testes falharam. Verifique se o servidor está rodando.${colors.reset}`);
    console.log(`${colors.yellow}🚀 Para iniciar o servidor: node servers/working-server.js${colors.reset}`);
  }
}

// Verificar se servidor está rodando
function checkServer() {
  return new Promise((resolve) => {
    const req = http.get(`${BASE_URL}/health`, (res) => {
      resolve(res.statusCode === 200);
    });
    
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Executar
async function main() {
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log(`${colors.red}❌ Servidor não está rodando na porta 3000${colors.reset}`);
    console.log(`${colors.yellow}🚀 Inicie o servidor com: node servers/working-server.js${colors.reset}`);
    process.exit(1);
  }

  console.log(`${colors.green}✅ Servidor detectado na porta 3000${colors.reset}`);
  await runQuickTests();
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runQuickTests: main };
