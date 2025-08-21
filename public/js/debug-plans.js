// Debug script para verificar o módulo de planos
window.debugPlans = function() {
    console.log('🔍 DEBUG PLANS MODULE');
    console.log('===================');
    
    // Verificar se o container existe
    const plansContainer = document.querySelector('#plansContainer');
    console.log('📦 Plans Container:', plansContainer);
    
    if (plansContainer) {
        console.log('✅ Container encontrado');
        console.log('📏 Container dimensions:', {
            width: plansContainer.offsetWidth,
            height: plansContainer.offsetHeight,
            display: getComputedStyle(plansContainer).display
        });
    } else {
        console.log('❌ Container não encontrado');
        
        // Procurar outros containers relacionados
        const allContainers = document.querySelectorAll('[id*="plans"], [class*="plans"]');
        console.log('🔍 Containers relacionados encontrados:', allContainers.length);
        allContainers.forEach((el, i) => {
            console.log(`${i+1}. ${el.tagName}#${el.id}.${el.className}`);
        });
    }
    
    // Verificar se a função de inicialização existe
    console.log('🔧 initializePlansModule function:', typeof window.initializePlansModule);
    
    // Verificar dados carregados
    console.log('📊 Module state:');
    if (window.initializePlansModule) {
        try {
            // Tentar chamar a inicialização manualmente
            console.log('🚀 Tentando inicializar módulo...');
            window.initializePlansModule();
        } catch (error) {
            console.error('❌ Erro na inicialização:', error);
        }
    }
    
    // Testar API diretamente
    console.log('🌐 Testando API...');
    fetch('/api/billing-plans')
        .then(response => {
            console.log('📡 API Response status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('📊 API Data:', data);
        })
        .catch(error => {
            console.error('❌ API Error:', error);
        });
};

console.log('🚀 Debug plans carregado. Execute: debugPlans()');
