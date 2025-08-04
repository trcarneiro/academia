#!/usr/bin/env node

/**
 * Script simples para rodar testes de estudantes e planos
 * Não requer instalação de dependências adicionais
 */

const http = require('http');
const { spawn } = require('child_process');

// Configurações
const SERVER_URL = 'http://localhost:3000';
const TEST_TIMEOUT = 30000; // 30 segundos

// Cores para output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

console.log(`${colors.blue}🧪 Testes para Estudantes e Planos${colors.reset}\n`);

// Função para verificar se o servidor está rodando
function checkServer() {
    return new Promise((resolve, reject) => {
        const req = http.get(SERVER_URL + '/health', (res) => {
            if (res.statusCode === 200) {
                resolve(true);
            } else {
                reject(new Error(`Status: ${res.statusCode}`));
            }
        });
        
        req.on('error', (err) => {
            reject(err);
        });
        
        req.setTimeout(5000, () => {
            req.destroy();
            reject(new Error('Timeout'));
        });
    });
}

// Função para rodar testes com Node.js puro
async function runBasicTests() {
    console.log(`${colors.yellow}📋 Rodando testes básicos...${colors.reset}\n`);
    
    const tests = [
        {
            name: 'Verificar endpoints de estudantes',
            test: async () => {
                const response = await fetch(SERVER_URL + '/api/students');
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data = await response.json();
                if (!data.success) throw new Error('API retornou erro');
                console.log(`  ✅ GET /api/students - ${data.data?.length || 0} estudantes`);
            }
        },
        {
            name: 'Verificar endpoints de planos',
            test: async () => {
                const response = await fetch(SERVER_URL + '/api/billing-plans');
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data = await response.json();
                if (!data.success) throw new Error('API retornou erro');
                console.log(`  ✅ GET /api/billing-plans - ${data.data?.length || 0} planos`);
            }
        },
        {
            name: 'Verificar health check',
            test: async () => {
                const response = await fetch(SERVER_URL + '/health');
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                console.log(`  ✅ GET /health - servidor respondendo`);
            }
        }
    ];

    let passed = 0;
    let failed = 0;

    for (const testCase of tests) {
        try {
            await testCase.test();
            passed++;
        } catch (error) {
            console.log(`  ❌ ${testCase.name}: ${error.message}`);
            failed++;
        }
    }

    return { passed, failed };
}

// Função principal
async function main() {
    try {
        console.log(`${colors.yellow}🔍 Verificando servidor...${colors.reset}`);
        await checkServer();
        console.log(`${colors.green}✅ Servidor está rodando${colors.reset}\n`);
        
        const results = await runBasicTests();
        
        console.log(`\n${colors.blue}📊 Resultados:${colors.reset}`);
        console.log(`  ${colors.green}✅ Passou: ${results.passed}${colors.reset}`);
        console.log(`  ${colors.red}❌ Falhou: ${results.failed}${colors.reset}`);
        
        if (results.failed === 0) {
            console.log(`\n${colors.green}🎉 Todos os testes básicos passaram!${colors.reset}`);
            console.log(`\nPara testes mais completos, execute:`);
            console.log(`  node scripts/run-tests.js`);
        } else {
            console.log(`\n${colors.red}⚠️  Alguns testes falharam${colors.reset}`);
            process.exit(1);
        }
        
    } catch (error) {
        console.log(`${colors.red}❌ Erro: ${error.message}${colors.reset}`);
        console.log(`\n${colors.yellow}💡 Verifique se o servidor está rodando:${colors.reset}`);
        console.log(`   npm run dev`);
        console.log(`   ou`);
        console.log(`   node servers/working-server.js`);
        process.exit(1);
    }
}

// Adicionar fetch global se não existir
if (!global.fetch) {
    global.fetch = require('node-fetch');
}

// Executar
main().catch(console.error);
