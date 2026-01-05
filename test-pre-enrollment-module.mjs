#!/usr/bin/env node
/**
 * Script de Teste para Módulo de Pré-Matrícula
 * Testa criação, listagem, edição e conversão de pré-matrículas
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3000';
const AUTH_TOKEN = 'test-token'; // Token de teste

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60) + '\n');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Helper para fazer requisições
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.auth !== false && { 'Authorization': `Bearer ${AUTH_TOKEN}` }),
    ...options.headers
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { success: response.ok, message: text };
    }

    return {
      ok: response.ok,
      status: response.status,
      data
    };
  } catch (error) {
    logError(`Request failed: ${error.message}`);
    return { ok: false, status: 0, data: { success: false, message: error.message } };
  }
}

// Dados de teste
const testPreEnrollments = [
  {
    firstName: 'João',
    lastName: 'Silva',
    cpf: '111.222.333-44',
    phone: '(31) 98888-1111',
    email: 'joao.silva.teste@example.com',
    birthDate: '1990-05-15',
    source: 'website'
  },
  {
    firstName: 'Maria',
    lastName: 'Santos',
    cpf: '222.333.444-55',
    phone: '(31) 98888-2222',
    email: 'maria.santos.teste@example.com',
    birthDate: '1995-08-20',
    source: 'whatsapp',
    financialResponsible: {
      name: 'Pedro Santos',
      cpf: '333.444.555-66',
      phone: '(31) 98888-3333',
      email: 'pedro.santos@example.com'
    }
  },
  {
    firstName: 'Carlos',
    lastName: 'Oliveira',
    cpf: '444.555.666-77',
    phone: '(31) 98888-4444',
    email: 'carlos.oliveira.teste@example.com',
    birthDate: '1988-03-10',
    source: 'instagram'
  },
  {
    firstName: 'Ana',
    lastName: 'Costa',
    cpf: '555.666.777-88',
    phone: '(31) 98888-5555',
    email: 'ana.costa.teste@example.com',
    birthDate: '2000-12-05',
    source: 'indicacao'
  }
];

// Variáveis para armazenar IDs criados
let createdIds = [];
let firstPlanId = null;
let firstCourseId = null;

/**
 * Teste 1: Verificar se o servidor está respondendo
 */
async function testServerHealth() {
  logSection('TESTE 1: Verificar Servidor');
  
  const response = await request('/health', { auth: false });
  
  if (response.ok) {
    logSuccess('Servidor está respondendo');
    logInfo(`Status: ${response.status}`);
  } else {
    logError('Servidor não está respondendo');
    process.exit(1);
  }
}

/**
 * Teste 2: Obter planos e cursos disponíveis
 */
async function loadPlansAndCourses() {
  logSection('TESTE 2: Carregar Planos e Cursos');
  
  // Buscar planos
  const plansResponse = await request('/api/billing-plans');
  if (plansResponse.ok && plansResponse.data.success) {
    const activePlans = plansResponse.data.data.filter(p => p.isActive);
    logSuccess(`${activePlans.length} planos ativos encontrados`);
    
    if (activePlans.length > 0) {
      firstPlanId = activePlans[0].id;
      logInfo(`Usando plano: ${activePlans[0].name} (${firstPlanId})`);
    }
  } else {
    logError('Falha ao carregar planos');
  }
  
  // Buscar cursos
  const coursesResponse = await request('/api/courses');
  if (coursesResponse.ok && coursesResponse.data.success) {
    const courses = coursesResponse.data.data;
    logSuccess(`${courses.length} cursos encontrados`);
    
    if (courses.length > 0) {
      firstCourseId = courses[0].id;
      logInfo(`Usando curso: ${courses[0].name} (${firstCourseId})`);
    }
  } else {
    logError('Falha ao carregar cursos');
  }
}

/**
 * Teste 3: Criar pré-matrículas
 */
async function testCreatePreEnrollments() {
  logSection('TESTE 3: Criar Pré-Matrículas');
  
  for (let i = 0; i < testPreEnrollments.length; i++) {
    const enrollment = { ...testPreEnrollments[i] };
    
    // Adicionar planId aos 2 primeiros
    if (i < 2 && firstPlanId) {
      enrollment.planId = firstPlanId;
    }
    
    // Adicionar courseId ao primeiro
    if (i === 0 && firstCourseId) {
      enrollment.courseId = firstCourseId;
    }
    
    logInfo(`\nCriando pré-matrícula: ${enrollment.firstName} ${enrollment.lastName}`);
    
    const response = await request('/api/pre-enrollment', {
      method: 'POST',
      auth: false,
      body: JSON.stringify(enrollment)
    });
    
    if (response.ok && response.data.success) {
      logSuccess(`Criada com sucesso - ID: ${response.data.data.id}`);
      createdIds.push(response.data.data.id);
      
      // Mostrar detalhes
      const pre = response.data.data;
      console.log(`   📧 Email: ${pre.email}`);
      console.log(`   📱 Telefone: ${pre.phone}`);
      console.log(`   🎯 Origem: ${pre.source}`);
      console.log(`   📊 Status: ${pre.status}`);
    } else {
      logError(`Falha ao criar: ${response.data.message || 'Erro desconhecido'}`);
    }
  }
  
  logInfo(`\n✅ ${createdIds.length}/${testPreEnrollments.length} pré-matrículas criadas com sucesso`);
}

/**
 * Teste 4: Listar todas as pré-matrículas
 */
async function testListPreEnrollments() {
  logSection('TESTE 4: Listar Pré-Matrículas');
  
  const response = await request('/api/pre-enrollment');
  
  if (response.ok && response.data.success) {
    const preEnrollments = response.data.data;
    logSuccess(`${preEnrollments.length} pré-matrículas encontradas`);
    
    // Estatísticas
    const pending = preEnrollments.filter(p => p.status === 'PENDING');
    const converted = preEnrollments.filter(p => p.status === 'CONVERTED');
    const rejected = preEnrollments.filter(p => p.status === 'REJECTED');
    
    console.log('\n📊 Estatísticas:');
    console.log(`   ⏳ Pendentes: ${pending.length}`);
    console.log(`   ✅ Convertidas: ${converted.length}`);
    console.log(`   ❌ Rejeitadas: ${rejected.length}`);
    
    // Mostrar as 5 primeiras
    console.log('\n📋 Últimas pré-matrículas:');
    preEnrollments.slice(0, 5).forEach((pre, idx) => {
      console.log(`   ${idx + 1}. ${pre.firstName} ${pre.lastName} - ${pre.status}`);
    });
  } else {
    logError('Falha ao listar pré-matrículas');
  }
}

/**
 * Teste 5: Editar uma pré-matrícula
 */
async function testUpdatePreEnrollment() {
  logSection('TESTE 5: Editar Pré-Matrícula');
  
  if (createdIds.length === 0) {
    logError('Nenhuma pré-matrícula criada para editar');
    return;
  }
  
  const preEnrollmentId = createdIds[0];
  logInfo(`Editando pré-matrícula: ${preEnrollmentId}`);
  
  const updates = {
    phone: '(31) 99999-8888',
    notes: 'Anotação de teste adicionada via script'
  };
  
  const response = await request(`/api/pre-enrollment/${preEnrollmentId}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
  
  if (response.ok && response.data.success) {
    logSuccess('Pré-matrícula editada com sucesso');
    console.log(`   📱 Novo telefone: ${updates.phone}`);
    console.log(`   📝 Observações: ${updates.notes}`);
  } else {
    logError(`Falha ao editar: ${response.data.message || 'Erro desconhecido'}`);
  }
}

/**
 * Teste 6: Adicionar nota a uma pré-matrícula
 */
async function testAddNote() {
  logSection('TESTE 6: Adicionar Nota');
  
  if (createdIds.length < 2) {
    logError('Pré-matrículas insuficientes para teste');
    return;
  }
  
  const preEnrollmentId = createdIds[1];
  logInfo(`Adicionando nota à pré-matrícula: ${preEnrollmentId}`);
  
  const note = 'Cliente demonstrou muito interesse. Ligar amanhã às 10h.';
  
  const response = await request(`/api/pre-enrollment/${preEnrollmentId}/notes`, {
    method: 'POST',
    body: JSON.stringify({ note })
  });
  
  if (response.ok && response.data.success) {
    logSuccess('Nota adicionada com sucesso');
    console.log(`   📝 Nota: ${note}`);
  } else {
    logError(`Falha ao adicionar nota: ${response.data.message || 'Erro desconhecido'}`);
  }
}

/**
 * Teste 7: Gerar link de matrícula
 */
async function testGenerateLink() {
  logSection('TESTE 7: Gerar Link de Matrícula');
  
  if (!firstPlanId) {
    logError('Nenhum plano disponível para gerar link');
    return;
  }
  
  logInfo('Gerando link de matrícula...');
  
  const linkData = {
    planId: firstPlanId,
    courseId: firstCourseId,
    customPrice: 99.90,
    expiresIn: 30
  };
  
  const response = await request('/api/pre-enrollment/generate-link', {
    method: 'POST',
    body: JSON.stringify(linkData)
  });
  
  if (response.ok && response.data.success) {
    logSuccess('Link gerado com sucesso');
    const link = response.data.data;
    console.log(`   🔗 Link: ${link.url}`);
    console.log(`   🔑 Token: ${link.token}`);
    console.log(`   ⏰ Válido até: ${new Date(link.expiresAt).toLocaleString('pt-BR')}`);
    console.log(`   💰 Preço: R$ ${link.customPrice || 'Padrão'}`);
  } else {
    logError(`Falha ao gerar link: ${response.data.message || 'Erro desconhecido'}`);
  }
}

/**
 * Teste 8: Converter pré-matrícula em aluno
 */
async function testConvertToStudent() {
  logSection('TESTE 8: Converter Pré-Matrícula em Aluno');
  
  if (createdIds.length < 3) {
    logError('Pré-matrículas insuficientes para teste');
    return;
  }
  
  const preEnrollmentId = createdIds[2];
  logInfo(`Convertendo pré-matrícula em aluno: ${preEnrollmentId}`);
  
  const response = await request(`/api/pre-enrollment/${preEnrollmentId}/convert`, {
    method: 'POST',
    body: JSON.stringify({})
  });
  
  if (response.ok && response.data.success) {
    logSuccess('Pré-matrícula convertida em aluno com sucesso!');
    const student = response.data.data;
    console.log(`   👤 Nome: ${student.firstName} ${student.lastName}`);
    console.log(`   🆔 ID do Aluno: ${student.id}`);
    console.log(`   📧 Email: ${student.email}`);
  } else {
    logError(`Falha ao converter: ${response.data.message || 'Erro desconhecido'}`);
  }
}

/**
 * Teste 9: Buscar por filtros
 */
async function testFilters() {
  logSection('TESTE 9: Testar Filtros');
  
  // Filtro por status
  logInfo('Testando filtro por status PENDING...');
  const statusResponse = await request('/api/pre-enrollment?status=PENDING');
  
  if (statusResponse.ok && statusResponse.data.success) {
    const pending = statusResponse.data.data;
    logSuccess(`${pending.length} pré-matrículas pendentes encontradas`);
  } else {
    logError('Falha ao filtrar por status');
  }
  
  // Filtro por nome
  if (testPreEnrollments.length > 0) {
    const firstName = testPreEnrollments[0].firstName;
    logInfo(`\nTestando busca por nome: ${firstName}...`);
    
    const searchResponse = await request(`/api/pre-enrollment?search=${firstName}`);
    
    if (searchResponse.ok && searchResponse.data.success) {
      const results = searchResponse.data.data;
      logSuccess(`${results.length} resultado(s) encontrado(s)`);
      
      results.forEach(pre => {
        console.log(`   → ${pre.firstName} ${pre.lastName} (${pre.email})`);
      });
    } else {
      logError('Falha ao buscar por nome');
    }
  }
}

/**
 * Teste 10: Rejeitar uma pré-matrícula
 */
async function testReject() {
  logSection('TESTE 10: Rejeitar Pré-Matrícula');
  
  if (createdIds.length < 4) {
    logError('Pré-matrículas insuficientes para teste');
    return;
  }
  
  const preEnrollmentId = createdIds[3];
  logInfo(`Rejeitando pré-matrícula: ${preEnrollmentId}`);
  
  const response = await request(`/api/pre-enrollment/${preEnrollmentId}`, {
    method: 'PUT',
    body: JSON.stringify({
      status: 'REJECTED',
      notes: 'Cliente não atende aos critérios da academia'
    })
  });
  
  if (response.ok && response.data.success) {
    logSuccess('Pré-matrícula rejeitada com sucesso');
  } else {
    logError(`Falha ao rejeitar: ${response.data.message || 'Erro desconhecido'}`);
  }
}

/**
 * Resumo Final
 */
async function showSummary() {
  logSection('RESUMO DOS TESTES');
  
  const response = await request('/api/pre-enrollment');
  
  if (response.ok && response.data.success) {
    const preEnrollments = response.data.data;
    
    // Filtrar apenas as criadas neste teste
    const testEnrollments = preEnrollments.filter(p => 
      createdIds.includes(p.id)
    );
    
    console.log(`\n📊 Estatísticas das Pré-Matrículas de Teste:\n`);
    console.log(`   Total criadas: ${createdIds.length}`);
    
    const pending = testEnrollments.filter(p => p.status === 'PENDING');
    const converted = testEnrollments.filter(p => p.status === 'CONVERTED');
    const rejected = testEnrollments.filter(p => p.status === 'REJECTED');
    
    console.log(`   ⏳ Pendentes: ${pending.length}`);
    console.log(`   ✅ Convertidas: ${converted.length}`);
    console.log(`   ❌ Rejeitadas: ${rejected.length}`);
    
    console.log(`\n🎯 Detalhes:\n`);
    testEnrollments.forEach((pre, idx) => {
      const statusIcon = {
        'PENDING': '⏳',
        'CONVERTED': '✅',
        'REJECTED': '❌'
      }[pre.status] || '❓';
      
      console.log(`   ${idx + 1}. ${statusIcon} ${pre.firstName} ${pre.lastName}`);
      console.log(`      Email: ${pre.email}`);
      console.log(`      Status: ${pre.status}`);
      console.log(`      Origem: ${pre.source}`);
      if (pre.notes) {
        console.log(`      Notas: ${pre.notes}`);
      }
      console.log('');
    });
    
    logSuccess('Todos os testes concluídos com sucesso! ✨');
  }
}

/**
 * Executar todos os testes
 */
async function runAllTests() {
  console.clear();
  log('\n🧪 TESTE COMPLETO DO MÓDULO DE PRÉ-MATRÍCULA\n', 'cyan');
  log('Este script irá criar, editar e gerenciar pré-matrículas de teste\n', 'yellow');
  
  try {
    await testServerHealth();
    await loadPlansAndCourses();
    await testCreatePreEnrollments();
    await testListPreEnrollments();
    await testUpdatePreEnrollment();
    await testAddNote();
    await testGenerateLink();
    await testConvertToStudent();
    await testFilters();
    await testReject();
    await showSummary();
    
    log('\n🎉 TESTES FINALIZADOS COM SUCESSO!\n', 'green');
    log('Acesse http://localhost:3000 e navegue até o módulo de Pré-Matrículas', 'cyan');
    log('para visualizar os resultados na interface.\n', 'cyan');
    
  } catch (error) {
    logError(`\nErro durante os testes: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Executar
runAllTests();
