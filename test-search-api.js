// Teste das APIs de busca de alunos
// Execute no console do navegador ou Node.js

const API_BASE = 'http://localhost:3000';

// Função para testar busca por matrícula
async function testSearchByRegistration(registration) {
    try {
        const response = await fetch(`${API_BASE}/api/attendance/student/${registration}`);
        const data = await response.json();
        
        console.log(`🔍 Busca por matrícula "${registration}":`, data);
        return data;
    } catch (error) {
        console.error('Erro na busca por matrícula:', error);
    }
}

// Função para testar busca por nome
async function testSearchByName(name) {
    try {
        const response = await fetch(`${API_BASE}/api/attendance/students/search/${encodeURIComponent(name)}`);
        const data = await response.json();
        
        console.log(`🔍 Busca por nome "${name}":`, data);
        return data;
    } catch (error) {
        console.error('Erro na busca por nome:', error);
    }
}

// Testes automáticos
async function runTests() {
    console.log('🧪 Iniciando testes de busca...');
    
    // Teste 1: Busca por matrícula
    await testSearchByRegistration('12345');
    
    // Teste 2: Busca por nome parcial
    await testSearchByName('João');
    
    // Teste 3: Busca por nome completo
    await testSearchByName('João Silva');
    
    // Teste 4: Busca por email parcial
    await testSearchByName('joao');
    
    // Teste 5: Busca inexistente
    await testSearchByName('NomeInexistente');
    
    console.log('✅ Testes concluídos!');
}

// Executar testes
if (typeof window !== 'undefined') {
    // Browser environment
    window.testSearchAPI = { testSearchByRegistration, testSearchByName, runTests };
    console.log('🔧 Funções de teste disponíveis: testSearchByRegistration(), testSearchByName(), runTests()');
} else {
    // Node.js environment
    runTests();
}
