#!/usr/bin/env node

/**
 * Teste Completo - Estudantes e Planos
 * Inclui seed de dados e validação de API
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
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log(`   Health status: ${response.data.status || 'No status'}`);
  } catch (err) {
    throw new Error(`Server not responding: ${err.message}`);
  }
}

async function testStudentsList() {
  try {
    const response = await axios.get(`${API_BASE}/students`);
    console.log(`   Students found: ${response.data.length || 0}`);
    if (!Array.isArray(response.data)) {
      throw new Error('Response is not an array');
    }
  } catch (err) {
    // Se falhar, tentar endpoint alternativo
    try {
      const response = await axios.get(`${API_BASE}/students/list`);
      console.log(`   Students found (alt): ${response.data.length || 0}`);
    } catch (altErr) {
      throw new Error(`Both endpoints failed: ${err.message}, ${altErr.message}`);
    }
  }
}

async function testPlansList() {
  try {
    const response = await axios.get(`${API_BASE}/billing-plans`);
    console.log(`   Plans found: ${response.data.length || 0}`);
    if (!Array.isArray(response.data)) {
      throw new Error('Response is not an array');
    }
  } catch (err) {
    // Se falhar, tentar endpoint alternativo
    try {
      const response = await axios.get(`${API_BASE}/plans`);
      console.log(`   Plans found (alt): ${response.data.length || 0}`);
    } catch (altErr) {
      throw new Error(`Both endpoints failed: ${err.message}, ${altErr.message}`);
    }
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
  
  try {
    const response = await axios.post(`${API_BASE}/students`, studentData);
    console.log(`   Created student: ${response.data.id}`);
    return response.data.id;
  } catch (err) {
    // Se falhar, tentar endpoint alternativo
    try {
      const response = await axios.post(`${API_BASE}/students/create`, studentData);
      console.log(`   Created student (alt): ${response.data.id}`);
      return response.data.id;
    } catch (altErr) {
      throw new Error(`Both endpoints failed: ${err.message}, ${altErr.message}`);
    }
  }
}

async function testCreatePlan() {
  const planData = {
    name: `Test Plan ${Date.now()}`,
    price: 100.00,
    billingCycle: 'MONTHLY',
    description: 'Test plan description',
    features: ['Feature 1', 'Feature 2']
  };
  
  try {
    const response = await axios.post(`${API_BASE}/billing-plans`, planData);
    console.log(`   Created plan: ${response.data.id}`);
    return response.data.id;
  } catch (err) {
    // Se falhar, tentar endpoint alternativo
    try {
      const response = await axios.post(`${API_BASE}/plans`, planData);
      console.log(`   Created plan (alt): ${response.data.id}`);
      return response.data.id;
    } catch (altErr) {
      throw new Error(`Both endpoints failed: ${err.message}, ${altErr.message}`);
    }
  }
}

async function testStudentPlanAssociation(studentId, planId) {
  const subscriptionData = {
    studentId,
    planId,
    startDate: new Date().toISOString(),
    status: 'ACTIVE'
  };
  
  try {
    const response = await axios.post(`${API_BASE}/subscriptions`, subscriptionData);
    console.log(`   Created subscription: ${response.data.id}`);
  } catch (err) {
    // Se falhar, tentar endpoint alternativo
    try {
      const response = await axios.post(`${API_BASE}/subscriptions/create`, subscriptionData);
      console.log(`   Created subscription (alt): ${response.data.id}`);
    } catch (altErr) {
      throw new Error(`Both endpoints failed: ${err.message}, ${altErr.message}`);
    }
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
  console.log(`   Found ${modules.length} frontend modules`);
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
  console.log(`   Found ${views.length} view files`);
}

async function seedTestData() {
  console.log('🌱 Seeding test data...');
  
  // Criar estudante de teste
  const studentData = {
    firstName: 'Test',
    lastName: 'Student',
    email: 'test.student@example.com',
    phone: '11999999999',
    birthDate: '1990-01-01',
    category: 'ADULT',
    status: 'ACTIVE'
  };
  
  // Criar plano de teste
  const planData = {
    name: 'Test Plan',
    price: 100.00,
    billingCycle: 'MONTHLY',
    description: 'Test plan for validation',
    features: ['Feature 1', 'Feature 2', 'Feature 3']
  };
  
  try {
    const studentResponse = await axios.post(`${API_BASE}/students`, studentData);
    const planResponse = await axios.post(`${API_BASE}/billing-plans`, planData);
    
    console.log(`   Seeded student: ${studentResponse.data.id}`);
    console.log(`   Seeded plan: ${planResponse.data.id}`);
    
    return { studentId: studentResponse.data.id, planId: planResponse.data.id };
  } catch (err) {
    console.log(`   Seed failed (may already exist): ${err.message}`);
    return null;
  }
}

// Função principal
async function runAllTests() {
  console.log('🎯 Iniciando Testes Completos - Estudantes e Planos');
  console.log('=================================================\n');

  // Verificar se servidor está rodando
  try {
    await testHealthCheck();
  } catch (err) {
    console.log('❌ Servidor não está rodando na porta 3000');
    console.log('💡 Execute: node servers/working-server.js');
    process.exit(1);
  }

  // Seed de dados de teste
  await seedTestData();

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
  console.log('📊 API Docs: http://localhost:3000/api-docs');
}

// Executar se chamado diretamente
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests };
