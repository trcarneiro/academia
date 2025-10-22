/**
 * Debug Script - Executar no Console (F12) para diagnosticar problema de renderização
 * 
 * Copie TODO o código abaixo e cole no console do navegador (F12 > Console > colar aqui > Enter)
 */

console.log('🔍 INICIANDO DIAGNÓSTICO DE DADOS NAO RENDERIZANDO...\n');

// TESTE 1: Verificar se API Client está carregado
console.log('📌 TESTE 1: API Client carregado?');
if (window.createModuleAPI) {
    console.log('✅ API Client encontrado:', typeof window.createModuleAPI);
} else {
    console.error('❌ API Client NÃO encontrado - arquivo api-client.js não carregou');
}

// TESTE 2: Verificar se módulo Students está registrado
console.log('\n📌 TESTE 2: Módulo Students registrado?');
if (window.students) {
    console.log('✅ window.students encontrado:', window.students);
} else {
    console.error('❌ window.students NÃO encontrado - módulo não inicializou');
}

// TESTE 3: Verificar se AcademyApp existe
console.log('\n📌 TESTE 3: AcademyApp carregado?');
if (window.AcademyApp) {
    console.log('✅ AcademyApp encontrado');
    console.log('   - Módulos registrados:', window.AcademyApp.modules.size);
} else {
    console.error('❌ AcademyApp NÃO encontrado');
}

// TESTE 4: Fazer fetch direto da API
console.log('\n📌 TESTE 4: Fazendo fetch de /api/students...');
fetch('/api/students')
    .then(r => {
        console.log(`   - Status HTTP: ${r.status}`);
        return r.json();
    })
    .then(data => {
        console.log('✅ Resposta recebida:');
        console.log(`   - success: ${data.success}`);
        console.log(`   - Total de alunos: ${data.data ? data.data.length : 0}`);
        console.log(`   - Primeiro aluno: ${data.data?.[0]?.firstName || 'N/A'}`);
    })
    .catch(e => {
        console.error('❌ Erro ao buscar dados:', e.message);
    });

// TESTE 5: Verificar DOM - onde devem aparecer os dados
console.log('\n📌 TESTE 5: Procurando elementos no DOM...');
const container = document.querySelector('[data-module="students"]');
console.log('   - Container students:', container ? '✅ Encontrado' : '❌ Não encontrado');

const tableBody = document.querySelector('#students-table-body');
console.log('   - Table body:', tableBody ? '✅ Encontrado' : '❌ Não encontrado');

const appContainer = document.querySelector('#module-container');
console.log('   - Module container:', appContainer ? '✅ Encontrado' : '❌ Não encontrado');

// TESTE 6: Procurar erros específicos
console.log('\n📌 TESTE 6: Procurando erros em console...');
console.log('   👉 Procure na lista acima por mensagens ❌ em vermelho');

// TESTE 7: Testar API Client manualmente
console.log('\n📌 TESTE 7: Testando API Client manualmente...');
try {
    const api = window.createModuleAPI?.('DebugTest');
    if (api) {
        console.log('✅ API Client criado com sucesso');
        console.log('   - Métodos disponíveis:', Object.keys(api));
    } else {
        console.error('❌ Falha ao criar API Client');
    }
} catch (e) {
    console.error('❌ Erro ao criar API Client:', e.message);
}

// TESTE 8: Procurar por erros de import
console.log('\n📌 TESTE 8: Verific​ando erros de import (ES6)...');
// Ver se há qualquer elemento de script com erro
const scripts = document.querySelectorAll('script[type="module"]');
console.log(`   - Scripts com type="module": ${scripts.length}`);
scripts.forEach((script, i) => {
    console.log(`     ${i + 1}. ${script.src || 'inline'}`);
});

// TESTE 9: Status geral
console.log('\n\n📊 RESUMO DO DIAGNÓSTICO:');
const status = {
    'API Client carregado': !!window.createModuleAPI,
    'Módulo Students registrado': !!window.students,
    'AcademyApp ativo': !!window.AcademyApp,
    'DOM pronto': !!document.querySelector('#module-container'),
};

Object.entries(status).forEach(([key, value]) => {
    console.log(`   ${value ? '✅' : '❌'} ${key}`);
});

console.log('\n\n💡 PRÓXIMAS AÇÕES:');
console.log('   1. Se todos estão ✅: O problema pode estar em renderização (DOM atualizar)');
console.log('   2. Se API Client ❌: Carregar console.log(document.querySelector(\'[src*="api-client"]\'))');
console.log('   3. Se Students ❌: Carregar console.log(document.querySelector(\'[src*="students"]\'))');
console.log('   4. Abrir aba Network (F12 > Network) e procurar erros 404 ou 500');
