// Debug script para testar validação do Design System
// Execute no console do browser: debugValidator()

window.debugValidator = function() {
    console.log('🔍 DEBUG: Iniciando diagnóstico do validator...');
    
    // 1. Testar variáveis CSS
    console.log('\n1. VARIÁVEIS CSS:');
    const root = document.documentElement;
    const primaryColor = getComputedStyle(root).getPropertyValue('--primary-color');
    const cardBackground = getComputedStyle(root).getPropertyValue('--card-background');
    console.log('--primary-color:', primaryColor);
    console.log('--card-background:', cardBackground);
    
    // 2. Testar containers
    console.log('\n2. CONTAINERS DOS MÓDULOS:');
    const plansContainer = document.querySelector('#plansContainer');
    const studentsContainer = document.querySelector('#studentsContainer');
    console.log('plansContainer:', plansContainer);
    console.log('studentsContainer:', studentsContainer);
    
    // 3. Testar elementos ativos
    console.log('\n3. ELEMENTOS ATIVOS:');
    const activeView = document.querySelector('.view-content > div:not([style*="display: none"])');
    console.log('activeView:', activeView);
    if (activeView) {
        const moduleContainer = activeView.querySelector('.module-isolated-container');
        console.log('moduleContainer no activeView:', moduleContainer);
    }
    
    // 4. Testar componentes
    console.log('\n4. COMPONENTES:');
    const testBtn = document.createElement('button');
    testBtn.className = 'module-isolated-btn-primary';
    document.body.appendChild(testBtn);
    const btnStyles = getComputedStyle(testBtn);
    console.log('btn-primary background:', btnStyles.backgroundColor);
    document.body.removeChild(testBtn);
    
    // 5. Executar validator oficial
    console.log('\n5. EXECUTANDO VALIDATOR OFICIAL:');
    if (window.validateDesignSystem) {
        window.validateDesignSystem();
    } else {
        console.log('❌ Validator não encontrado');
    }
}

console.log('🚀 Debug validator carregado. Execute: debugValidator()');
