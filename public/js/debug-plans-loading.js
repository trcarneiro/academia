// Test script para debug do carregamento de planos
console.log('🧪 Starting Plans debug...');

// Teste 1: Verificar se API Client está disponível
setTimeout(() => {
    console.log('1️⃣ API Client available:', !!window.createModuleAPI);
    console.log('2️⃣ Plans API helper:', window.createModuleAPI ? 'Can create' : 'Not available');
    
    // Teste 2: Fazer requisição direta
    if (window.createModuleAPI) {
        const testAPI = window.createModuleAPI('Test');
        
        testAPI.api.get('/api/billing-plans')
            .then(response => {
                console.log('3️⃣ Direct API call result:', response);
                console.log('4️⃣ Data length:', response.data?.length || 'No data');
            })
            .catch(error => {
                console.error('3️⃣ Direct API call failed:', error);
            });
    }
    
    // Teste 3: Verificar elementos DOM
    const tableBody = document.getElementById('plansTableBody');
    console.log('5️⃣ Table body element:', tableBody);
    console.log('6️⃣ Table body content:', tableBody?.innerHTML.substring(0, 100) + '...');
    
}, 2000);

// Função para reload manual
window.debugPlansReload = function() {
    console.log('🔄 Manual reload triggered...');
    if (window.loadPlansData) {
        window.loadPlansData();
    } else if (window.initializePlansModule) {
        window.initializePlansModule();
    } else {
        console.log('❌ No plans functions found');
    }
};

console.log('✅ Debug script loaded. Call debugPlansReload() to test manually.');
