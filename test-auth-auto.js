#!/usr/bin/env node

/**
 * Script de Teste - Auth Supabase
 * Executa testes completos de autenticação
 * 
 * Uso: node test-auth-auto.js <email> <senha>
 */

const https = require('https');
const http = require('http');

const SUPABASE_URL = 'https://yawfuymgwukericlhgxh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhd2Z1eW1nd3VrZXJpY2xoZ3hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA5NTYsImV4cCI6MjA2NjUzNjk1Nn0.sqm8ZAVJoS_tUGSGFuQapJYFTjfdAa7dkLs437A5bUs';
const BACKEND_URL = 'http://localhost:3000';

let testResults = [];
let authToken = null;
let organizationId = null;

function log(message, type = 'info') {
    const colors = {
        info: '\x1b[36m',    // cyan
        success: '\x1b[32m',  // green
        error: '\x1b[31m',    // red
        warning: '\x1b[33m',  // yellow
        reset: '\x1b[0m'
    };
    
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    const color = colors[type] || colors.info;
    console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function makeRequest(method, url, body = null) {
    return new Promise((resolve, reject) => {
        const isHttps = url.startsWith('https://');
        const client = isHttps ? https : http;
        
        const urlObj = new URL(url);
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            }
        };

        if (authToken && !isHttps) {
            options.headers['Authorization'] = `Bearer ${authToken}`;
        }

        const req = client.request(url, options, (res) => {
            let data = '';
            
            res.on('data', chunk => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, data: parsed, headers: res.headers });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data, headers: res.headers });
                }
            });
        });

        req.on('error', reject);
        
        if (body) {
            req.write(JSON.stringify(body));
        }
        
        req.end();
    });
}

async function test1_CheckSupabaseConnection() {
    log('📋 Teste 1: Verificando conexão com Supabase...', 'info');
    
    try {
        const response = await makeRequest('GET', `${SUPABASE_URL}/rest/v1/`);
        
        if (response.status === 401 || response.status === 200) {
            log('✅ Supabase acessível', 'success');
            log(`   Status: ${response.status}`, 'info');
            log(`   URL: ${SUPABASE_URL}`, 'info');
            testResults.push({ test: 1, status: 'PASS', message: 'Supabase acessível' });
            return true;
        } else {
            throw new Error(`Unexpected status: ${response.status}`);
        }
    } catch (error) {
        log(`❌ Erro: ${error.message}`, 'error');
        testResults.push({ test: 1, status: 'FAIL', message: error.message });
        return false;
    }
}

async function test2_LoginWithCredentials(email, password) {
    log('📋 Teste 2: Fazendo login com email/senha...', 'info');
    
    try {
        const loginUrl = `${SUPABASE_URL}/auth/v1/token?grant_type=password`;
        const body = {
            email: email,
            password: password
        };
        
        log(`   Email: ${email}`, 'info');
        log(`   Tentando autenticação...`, 'info');
        
        // Fazer request com header apikey
        const urlObj = new URL(loginUrl);
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'apikey': SUPABASE_ANON_KEY
            }
        };

        const response = await new Promise((resolve, reject) => {
            const req = https.request(loginUrl, options, (res) => {
                let data = '';
                res.on('data', chunk => { data += chunk; });
                res.on('end', () => {
                    try {
                        resolve({ status: res.statusCode, data: JSON.parse(data) });
                    } catch (e) {
                        resolve({ status: res.statusCode, data });
                    }
                });
            });
            req.on('error', reject);
            req.write(JSON.stringify(body));
            req.end();
        });
        
        if (response.status !== 200) {
            throw new Error(`Login failed: ${response.status} - ${JSON.stringify(response.data)}`);
        }
        
        if (!response.data.access_token) {
            throw new Error('No access token in response');
        }
        
        authToken = response.data.access_token;
        log('✅ Login bem-sucedido!', 'success');
        log(`   User ID: ${response.data.user?.id}`, 'info');
        log(`   Token: ${authToken.substring(0, 20)}...`, 'info');
        testResults.push({ test: 2, status: 'PASS', message: 'Login realizado' });
        return true;
    } catch (error) {
        log(`❌ Erro: ${error.message}`, 'error');
        testResults.push({ test: 2, status: 'FAIL', message: error.message });
        return false;
    }
}

async function test3_FetchOrganizationFromBackend(email) {
    log('📋 Teste 3: Buscando OrganizationId no backend...', 'info');
    
    try {
        const url = `${BACKEND_URL}/api/auth/users/by-email?email=${encodeURIComponent(email)}`;
        log(`   URL: ${url}`, 'info');
        
        const response = await makeRequest('GET', url);
        
        if (response.status !== 200) {
            throw new Error(`Backend returned: ${response.status}`);
        }
        
        if (!response.data.success) {
            throw new Error(`Backend error: ${response.data.message}`);
        }
        
        organizationId = response.data.data.organizationId;
        log('✅ OrganizationId obtido com sucesso!', 'success');
        log(`   OrganizationId: ${organizationId}`, 'info');
        log(`   Role: ${response.data.data.role}`, 'info');
        testResults.push({ test: 3, status: 'PASS', message: `OrganizationId: ${organizationId}` });
        return true;
    } catch (error) {
        log(`❌ Erro: ${error.message}`, 'error');
        testResults.push({ test: 3, status: 'FAIL', message: error.message });
        return false;
    }
}

async function test4_ValidateOrganizationId() {
    log('📋 Teste 4: Validando formato do OrganizationId...', 'info');
    
    try {
        if (!organizationId) {
            throw new Error('OrganizationId não definido');
        }
        
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(organizationId)) {
            throw new Error(`OrganizationId não é um UUID válido: ${organizationId}`);
        }
        
        log('✅ OrganizationId é um UUID válido!', 'success');
        log(`   Formato: UUID v4`, 'info');
        log(`   Valor: ${organizationId}`, 'info');
        testResults.push({ test: 4, status: 'PASS', message: 'UUID válido' });
        return true;
    } catch (error) {
        log(`❌ Erro: ${error.message}`, 'error');
        testResults.push({ test: 4, status: 'FAIL', message: error.message });
        return false;
    }
}

async function test5_CheckBackendEndpointHeaders() {
    log('📋 Teste 5: Verificando headers do endpoint...', 'info');
    
    try {
        const url = `${BACKEND_URL}/api/auth/users/by-email?email=test@example.com`;
        const response = await makeRequest('GET', url);
        
        log(`   Status: ${response.status}`, 'info');
        log(`   Content-Type: ${response.headers['content-type']}`, 'info');
        
        if (!response.headers['content-type']?.includes('application/json')) {
            throw new Error('Response não é JSON');
        }
        
        log('✅ Endpoint respondendo corretamente!', 'success');
        testResults.push({ test: 5, status: 'PASS', message: 'Endpoint OK' });
        return true;
    } catch (error) {
        log(`❌ Erro: ${error.message}`, 'error');
        testResults.push({ test: 5, status: 'FAIL', message: error.message });
        return false;
    }
}

async function runAllTests(email, password) {
    console.log('\n' + '='.repeat(60));
    log('🚀 INICIANDO BATERIA DE TESTES - AUTH SUPABASE', 'warning');
    console.log('='.repeat(60) + '\n');
    
    const results = [];
    
    // Teste 1
    results.push(await test1_CheckSupabaseConnection());
    await sleep(500);
    
    // Teste 2
    results.push(await test2_LoginWithCredentials(email, password));
    await sleep(500);
    
    // Teste 3
    results.push(await test3_FetchOrganizationFromBackend(email));
    await sleep(500);
    
    // Teste 4
    results.push(await test4_ValidateOrganizationId());
    await sleep(500);
    
    // Teste 5
    results.push(await test5_CheckBackendEndpointHeaders());
    
    console.log('\n' + '='.repeat(60));
    log('📊 RESUMO DOS TESTES', 'warning');
    console.log('='.repeat(60) + '\n');
    
    testResults.forEach((result, idx) => {
        const icon = result.status === 'PASS' ? '✅' : '❌';
        const color = result.status === 'PASS' ? 'success' : 'error';
        log(`${icon} Teste ${result.test}: ${result.message}`, color);
    });
    
    const passed = testResults.filter(r => r.status === 'PASS').length;
    const total = testResults.length;
    
    console.log('\n' + '-'.repeat(60));
    if (passed === total) {
        log(`✅ TODOS OS ${total} TESTES APROVADOS!`, 'success');
        process.exit(0);
    } else {
        log(`❌ ${passed}/${total} testes aprovados`, 'error');
        process.exit(1);
    }
}

// Get credentials from command line or environment
const email = process.argv[2] || process.env.TEST_EMAIL || 'trcampos@gmail.com';
const password = process.argv[3] || process.env.TEST_PASSWORD;

if (!password) {
    log('❌ Erro: Senha não fornecida', 'error');
    log('Uso: node test-auth-auto.js <email> <senha>', 'info');
    log('Ou defina: $env:TEST_EMAIL e $env:TEST_PASSWORD', 'info');
    process.exit(1);
}

runAllTests(email, password).catch(error => {
    log(`❌ Erro fatal: ${error.message}`, 'error');
    process.exit(1);
});
