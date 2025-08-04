#!/usr/bin/env node

/**
 * Teste Final - Estudantes e Planos
 * Validação completa de frontend e backend
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

// Contadores
let testsPassed = 0;
let testsFailed = 0;

// Função auxiliar para testes
async function runTest(description, testFn) {
  try {
    console.log(`🧪 ${description}`);
    await testFn();
    console.log(`✅ ${description}`);
    testsPassed++;
  } catch (err) {
    console.log(`❌ ${description}: ${err.message}`);
    testsFailed++;
  }
}

// Funções de teste
async function testHealthCheck() {
  const response = await axios.get(`${BASE_URL}/health`);
  if (response.data.status !== 'OK') {
    throw new Error('Health check failed');
  }
}

async function testStudentsList() {
  const response = await axios.get(`${API_BASE}/students`);
  if (!Array.isArray(response.data)) {
    throw new Error('Students list is not an array');
  }
  if (response.data.length === 0) {
    throw new Error('No students found');
  }
}

async function testPlansList() {
  const response = await axios.get(`${API_BASE}/billing-plans`);
  if (!Array.isArray(response.data)) {
    throw new Error('Plans list is not an array');
  }
  if (response.data.length === 0) {
    throw new Error('No plans found');
  }
}

async function testCreateStudent() {
  const studentData = {
    firstName: 'Test',
    lastName: 'Student',
    email: `test-${Date.now()}@example.com`,
    phone: '11999999999',
    birthDate: '1990-01-01',
    category: 'ADULT',
    status: 'ACTIVE'
  };
  
  const response = await axios.post(`${API_BASE}/students`, studentData);
  if (!response.data.id) {
    throw new Error('Student not created');
  }
  return response.data.id;
}

async function testCreatePlan() {
  const planData = {
    name: `Test Plan ${Date.now()}`,
    price: 100.00,
    billingCycle: 'MONTHLY',
    description: 'Test plan description',
    features: ['Feature 1', 'Feature 2']
  };
  
  const response = await axios.post(`${API_BASE}/billing-plans`, planData);
  if (!response.data.id) {
    throw new Error('Plan not created');
  }
  return response.data.id;
}

async function testStudentPlanAssociation(studentId, planId) {
  const subscriptionData = {
    studentId,
    planId,
    startDate: new Date().toISOString(),
    status: 'ACTIVE'
  };
  
  const response = await axios.post(`${API_BASE}/subscriptions`, subscriptionData);
  if (!response.data.id) {
    throw new Error('Subscription not created');
  }
}

async function testFrontendModules() {
  const modules = [
    'public/js/modules/students.js',
    'public/js/modules/plans.js',
    'public/js/modules/student-editor.js',
    'public/js/modules/plan-editor.js'
  ];
  
  for (const module of modules) {
    if (!fs.existsSync(path.join(__dirname, '..', module))) {
      throw new Error(`Module file not found: ${module}`);
    }
  }
}

async function testViews() {
  const views = [
    'public/views/students.html',
    'public/views/plans.html',
    'public/views/student-editor.html',
    'public/views/plan-editor.html'
  ];
  
  for (const view of views) {
    if (!fs.existsSync(path.join(__dirname, '..', view))) {
      throw new Error(`View file not found: ${view}`);
    }
  }
}

// Função principal
async function runAllTests() {
  console.log('🎯 Iniciando Testes Finais - Estudantes e Planos');
  console.log('===============================================\n');

  // Verificar se servidor está rodando
  try {
    await axios.get(`${BASE_URL}/health`);
  } catch (err) {
    console.log('❌ Servidor não está rodando na porta 3000');
    console.log('💡 Execute: node servers/working-server.js');
    process.exit(1);
  }

  // Executar testes
  await runTest('Health Check', testHealthCheck);
  await runTest('Students List API', testStudentsList);
  await runTest('Plans List API', testPlansList);
  
  let studentId, planId;
  
  await runTest('Create Student', async () => {
    studentId = await testCreateStudent();
  });
  
  await runTest('Create Plan', async () => {
    planId = await testCreatePlan();
  });
  
  await runTest('Student-Plan Association', async () => {
    await testStudentPlanAssociation(studentId, planId);
  });
  
  await runTest('Frontend Modules', testFrontendModules);
  await runTest('Views Files', testViews);

  // Resumo
  console.log('\n📊 Resumo dos Testes');
  console.log('====================');
  console.log(`✅ Passou: ${testsPassed}`);
  console.log(`❌ Falhou: ${testsFailed}`);
  console.log(`📈 Total: ${testsPassed + testsFailed}`);

  if (testsFailed === 0) {
    console.log('\n🎉 Todos os testes passaram!');
    console.log('💡 O sistema de estudantes e planos está funcionando corretamente.');
  } else {
    console.log('\n⚠️  Alguns testes falharam.');
    console.log('💡 Verifique os logs acima para mais detalhes.');
  }

  // Testes adicionais
  console.log('\n🔗 Testes Adicionais');
  console.log('===================');
  console.log('📱 Frontend: http://localhost:3000');
  console.log('📊 Dashboard: http://localhost:3000');
  console.log('👥 Students: http://localhost:3000/#students');
  console.log('📋 Plans: http://localhost:3000/#plans');
  console.log('🧪 Test Runner: http://localhost:3000/test/modules/test-runner.html');
}

// Executar se chamado diretamente
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests };
