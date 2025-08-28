#!/usr/bin/env node

const { spawn } = require('child_process');
const http = require('http');

console.log('🚀 Iniciando servidor em background...');

// Iniciar servidor
const server = spawn('npx', ['tsx', 'src/server.ts'], {
    cwd: process.cwd(),
    env: { 
        ...process.env, 
        NODE_OPTIONS: '-r tsconfig-paths/register',
        PORT: '3000',
        HOST: '0.0.0.0'
    },
    stdio: ['ignore', 'pipe', 'pipe']
});

let serverOutput = '';
let serverError = '';

server.stdout.on('data', (data) => {
    const output = data.toString();
    serverOutput += output;
    console.log('📝 Server:', output.trim());
});

server.stderr.on('data', (data) => {
    const error = data.toString();
    serverError += error;
    console.log('⚠️ Error:', error.trim());
});

// Aguardar servidor iniciar e testar endpoints
let attempts = 0;
const maxAttempts = 10;

const testEndpoints = () => {
    attempts++;
    console.log(`🧪 Tentativa ${attempts}/${maxAttempts} - Testando endpoints...`);
    
    const testEndpoint = (path) => {
        return new Promise((resolve) => {
            const req = http.request({
                hostname: 'localhost',
                port: 3000,
                path: path,
                method: 'GET',
                timeout: 2000
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    console.log(`✅ ${path}: Status ${res.statusCode}`);
                    if (res.statusCode === 200) {
                        console.log(`   Response: ${data.substring(0, 100)}...`);
                    }
                    resolve({ status: res.statusCode, data });
                });
            });
            
            req.on('error', (err) => {
                console.log(`❌ ${path}: ${err.message}`);
                resolve({ error: err.message });
            });
            
            req.on('timeout', () => {
                console.log(`⏰ ${path}: Timeout`);
                req.destroy();
                resolve({ error: 'timeout' });
            });
            
            req.end();
        });
    };
    
    Promise.all([
        testEndpoint('/health'),
        testEndpoint('/api/rag/health'),
        testEndpoint('/api/rag/stats'),
        testEndpoint('/api/rag/documents')
    ]).then(results => {
        const anySuccess = results.some(r => r.status === 200);
        
        if (anySuccess) {
            console.log('\n🎉 Servidor funcionando! Endpoints RAG acessíveis.');
            server.kill();
            process.exit(0);
        } else if (attempts < maxAttempts) {
            console.log(`🔄 Aguardando servidor... (${attempts}/${maxAttempts})`);
            setTimeout(testEndpoints, 2000);
        } else {
            console.log('\n❌ Servidor não respondeu após várias tentativas.');
            console.log('\n📋 Saída do servidor:');
            console.log(serverOutput);
            if (serverError) {
                console.log('\n🚨 Erros do servidor:');
                console.log(serverError);
            }
            server.kill();
            process.exit(1);
        }
    });
};

// Iniciar testes após 3 segundos
setTimeout(testEndpoints, 3000);
