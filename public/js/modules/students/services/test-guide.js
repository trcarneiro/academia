/**
 * GUIA COMPLETO DE TESTES
 * Sistema Anti-Duplicação para Editor de Estudantes
 * 
 * Execute estes testes no console do browser (F12) para validar:
 * 1. Eliminação de chamadas duplicadas
 * 2. Cache in-memory funcionando
 * 3. Bundle loading com Promise.all
 * 4. Performance melhorada
 */

console.log(`
🎓 ACADEMIA KRAV MAGA - TESTES DE ANTI-DUPLICAÇÃO
================================================

📋 PREPARAÇÃO:
1. Abra http://localhost:3000
2. Abra DevTools (F12)
3. Vá para a aba Network
4. Cole os comandos abaixo no Console

⚠️  IMPORTANTE: Execute os testes na ordem indicada!
`);

// ==============================================
// TESTE 1: VERIFICAR ESTADO INICIAL
// ==============================================

window.teste1_verificarEstadoInicial = function() {
    console.log('\n📋 TESTE 1: Verificando Estado Inicial');
    console.log('=====================================');
    
    // Verificar se o DataService está disponível
    if (typeof window.createModuleAPI === 'function') {
        console.log('✅ API Client disponível');
    } else {
        console.log('❌ API Client não encontrado');
        return false;
    }
    
    // Verificar se a aplicação carregou
    if (document.querySelector('.module-header')) {
        console.log('✅ Interface da aplicação carregada');
    } else {
        console.log('❌ Interface não encontrada');
        return false;
    }
    
    console.log('✅ Estado inicial OK - Pronto para testes!');
    return true;
};

// ==============================================
// TESTE 2: NAVEGAÇÃO PARA ESTUDANTES (ANTI-DUPLICAÇÃO SPA)
// ==============================================

window.teste2_navegacaoEstudantes = function() {
    console.log('\n📋 TESTE 2: Navegação para Estudantes');
    console.log('=====================================');
    console.log('👀 OBSERVE o console e a aba Network!');
    console.log('🎯 Deve aparecer [CACHE] ou [NETWORK] nos logs');
    
    // Limpar console para visualização clara
    console.clear();
    
    // Navegar para estudantes (deve usar sistema anti-duplicação)
    if (window.router && typeof window.router.navigateTo === 'function') {
        window.router.navigateTo('students');
        console.log('🚀 Navegação iniciada - observe os logs...');
    } else {
        console.log('❌ Router não encontrado');
    }
};

// ==============================================
// TESTE 3: ABRIR EDITOR DE ESTUDANTE (TESTE PRINCIPAL)
// ==============================================

window.teste3_abrirEditorEstudante = function() {
    console.log('\n📋 TESTE 3: Abrir Editor de Estudante');
    console.log('=====================================');
    console.log('🎯 ESTE É O TESTE PRINCIPAL!');
    console.log('👀 OBSERVE a aba Network - deve ver apenas 1 requisição por endpoint');
    
    // Student ID para teste (ajuste se necessário)
    const studentId = 'c0acbc5e-0e12-44f6-87ba-7a7dc0d6f8fa';
    
    console.log(`📂 Abrindo editor para estudante: ${studentId}`);
    console.log('⏱️  Tempo de carregamento será medido...');
    
    const startTime = performance.now();
    
    // Navegar para o editor
    window.location.hash = `student-editor/${studentId}`;
    
    // Monitorar carregamento
    setTimeout(() => {
        const endTime = performance.now();
        const loadTime = endTime - startTime;
        
        console.log(`⚡ Tempo total de carregamento: ${loadTime.toFixed(2)}ms`);
        console.log('✅ Verifique se houve apenas 1 chamada por endpoint na aba Network!');
    }, 3000);
};

// ==============================================
// TESTE 4: NAVEGAÇÕES MÚLTIPLAS (TESTE DE CACHE)
// ==============================================

window.teste4_navegacoesMultiplas = function() {
    console.log('\n📋 TESTE 4: Navegações Múltiplas');
    console.log('================================');
    console.log('🎯 Teste de cache entre navegações');
    
    const studentId = 'c0acbc5e-0e12-44f6-87ba-7a7dc0d6f8fa';
    
    console.log('🔄 Navegação 1 - deve carregar da rede...');
    window.location.hash = `student-editor/${studentId}`;
    
    setTimeout(() => {
        console.log('🔄 Navegação 2 - deve usar cache...');
        window.location.hash = 'students'; // Voltar para lista
        
        setTimeout(() => {
            console.log('🔄 Navegação 3 - deve usar cache...');
            window.location.hash = `student-editor/${studentId}`;
            
            setTimeout(() => {
                console.log('✅ Navegações múltiplas concluídas');
                console.log('👀 Verifique se apenas a primeira navegação fez chamadas à API');
            }, 1000);
        }, 1000);
    }, 2000);
};

// ==============================================
// TESTE 5: PERFORMANCE COMPARISON
// ==============================================

window.teste5_comparacaoPerformance = async function() {
    console.log('\n📋 TESTE 5: Comparação de Performance');
    console.log('====================================');
    
    // Criar instância do DataService para teste
    const apiClient = window.createModuleAPI('Students');
    const { createStudentDataService } = await import('/js/modules/students/services/student-data-service.js');
    const dataService = createStudentDataService(apiClient);
    
    const studentId = 'c0acbc5e-0e12-44f6-87ba-7a7dc0d6f8fa';
    
    console.log('⚡ Testando abordagem OLD (chamadas individuais)...');
    dataService.clearCache();
    
    const oldStart = performance.now();
    await Promise.all([
        dataService.getStudent(studentId),
        dataService.getSubscription(studentId),
        dataService.getAttendances(studentId),
        dataService.getFinancialSummary(studentId),
        dataService.getBillingPlans()
    ]);
    const oldTime = performance.now() - oldStart;
    
    console.log('📦 Testando abordagem NEW (bundle loading)...');
    dataService.clearCache();
    
    const newStart = performance.now();
    await dataService.prefetchStudent(studentId);
    const newTime = performance.now() - newStart;
    
    const improvement = ((oldTime - newTime) / oldTime) * 100;
    
    console.log('\n📊 RESULTADOS DA COMPARAÇÃO:');
    console.log('============================');
    console.table({
        'Abordagem Antiga': `${oldTime.toFixed(2)}ms`,
        'Abordagem Nova': `${newTime.toFixed(2)}ms`,
        'Melhoria': `${improvement.toFixed(2)}%`
    });
    
    return { oldTime, newTime, improvement };
};

// ==============================================
// TESTE 6: CACHE STATISTICS
// ==============================================

window.teste6_estatisticasCache = async function() {
    console.log('\n📋 TESTE 6: Estatísticas de Cache');
    console.log('=================================');
    
    try {
        // Importar e criar DataService
        const apiClient = window.createModuleAPI('Students');
        const { createStudentDataService } = await import('/js/modules/students/services/student-data-service.js');
        const dataService = createStudentDataService(apiClient);
        
        // Fazer algumas operações para gerar estatísticas
        const studentId = 'c0acbc5e-0e12-44f6-87ba-7a7dc0d6f8fa';
        
        // Cache miss (primeira chamada)
        await dataService.getStudent(studentId);
        
        // Cache hit (segunda chamada)
        await dataService.getStudent(studentId);
        
        // Bundle load
        await dataService.prefetchStudent(studentId);
        
        // Refresh
        await dataService.refreshStudent(studentId, ['subscription']);
        
        // Mostrar estatísticas
        const stats = dataService.getStats();
        
        console.log('📊 ESTATÍSTICAS DE CACHE:');
        console.log('=========================');
        console.table(stats);
        
        return stats;
    } catch (error) {
        console.error('❌ Erro ao obter estatísticas:', error);
    }
};

// ==============================================
// TESTE COMPLETO: EXECUTAR TODOS OS TESTES
// ==============================================

window.executarTodosOsTestes = async function() {
    console.log('\n🚀 EXECUTANDO TODOS OS TESTES');
    console.log('============================');
    
    try {
        // Teste 1: Estado inicial
        if (!teste1_verificarEstadoInicial()) {
            console.log('❌ Teste 1 falhou - abortando');
            return;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Teste 2: Navegação
        teste2_navegacaoEstudantes();
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Teste 3: Editor (principal)
        teste3_abrirEditorEstudante();
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Teste 4: Múltiplas navegações
        teste4_navegacoesMultiplas();
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        // Teste 5: Performance
        await teste5_comparacaoPerformance();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Teste 6: Estatísticas
        await teste6_estatisticasCache();
        
        console.log('\n🎉 TODOS OS TESTES CONCLUÍDOS!');
        console.log('=============================');
        console.log('📊 Resultados disponíveis no console acima');
        
    } catch (error) {
        console.error('❌ Erro durante execução dos testes:', error);
    }
};

// ==============================================
// INSTRUÇÕES PARA O USUÁRIO
// ==============================================

console.log(`
🎯 COMANDOS DISPONÍVEIS:
======================

TESTES INDIVIDUAIS:
• teste1_verificarEstadoInicial()
• teste2_navegacaoEstudantes()
• teste3_abrirEditorEstudante()      ← TESTE PRINCIPAL
• teste4_navegacoesMultiplas()
• teste5_comparacaoPerformance()
• teste6_estatisticasCache()

EXECUTAR TODOS:
• executarTodosOsTestes()            ← RECOMENDADO

EXEMPLO DE USO:
> teste3_abrirEditorEstudante()
> executarTodosOsTestes()

📋 WHAT TO OBSERVE:
1. Network tab: Apenas 1 requisição por endpoint
2. Console logs: [CACHE] vs [NETWORK] indicators
3. Performance: Tempo de carregamento reduzido
4. No duplicate API calls to same endpoints

🚀 READY TO TEST!
`);

// ==============================================
// MONITORAMENTO AUTOMÁTICO
// ==============================================

/**
 * Sistema de monitoramento automático para detectar duplicatas
 */
function iniciarMonitoramentoAutomatico() {
    console.log('\n👀 INICIANDO MONITORAMENTO AUTOMÁTICO');
    console.log('=====================================');
    
    let contadorChamadas = {};
    let duplicatasDetectadas = [];
    
    // Interceptar XMLHttpRequest
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
        if (url.includes('/api/students/')) {
            const endpoint = url.replace(/^https?:\/\/[^\/]+/, '');
            contadorChamadas[endpoint] = (contadorChamadas[endpoint] || 0) + 1;
            
            if (contadorChamadas[endpoint] > 1) {
                duplicatasDetectadas.push({
                    endpoint,
                    count: contadorChamadas[endpoint],
                    timestamp: new Date().toISOString()
                });
                console.warn(`🔴 DUPLICATA DETECTADA: ${endpoint} (${contadorChamadas[endpoint]}x)`);
            } else {
                console.log(`✅ Primeira chamada: ${endpoint}`);
            }
        }
        return originalOpen.call(this, method, url, ...args);
    };
    
    // Função para obter relatório
    window.obterRelatorioMonitoramento = () => {
        console.log('\n📊 RELATÓRIO DE MONITORAMENTO');
        console.log('=====================================');
        console.log('Contador de chamadas:', contadorChamadas);
        console.log('Duplicatas detectadas:', duplicatasDetectadas);
        
        const totalChamadas = Object.values(contadorChamadas).reduce((a, b) => a + b, 0);
        const endpointsUnicos = Object.keys(contadorChamadas).length;
        const duplicatas = duplicatasDetectadas.length;
        
        return {
            totalChamadas,
            endpointsUnicos,
            duplicatas,
            detalhes: contadorChamadas,
            duplicatasDetectadas
        };
    };
    
    console.log('✅ Monitoramento ativo. Use obterRelatorioMonitoramento() para ver resultados.');
}

// Iniciar monitoramento automaticamente
window.iniciarMonitoramentoAutomatico = iniciarMonitoramentoAutomatico;

// ==============================================
// TESTES ESPECÍFICOS PARA CORREÇÃO
// ==============================================

/**
 * Teste específico para verificar se a correção do API client funcionou
 */
async function testeCorrecaoAPIClient() {
    console.log('\n🔧 TESTE: Correção do API Client');
    console.log('=====================================');
    
    try {
        // Navegar para estudantes
        if (typeof window.initStudentsModule === 'function') {
            const container = document.getElementById('module-container');
            await window.initStudentsModule(container);
            console.log('✅ Módulo de estudantes inicializado');
        }
        
        // Tentar abrir editor
        const studentId = 'c0acbc5e-0e12-44f6-87ba-7a7dc0d6f8fa';
        if (typeof window.openStudentEditor === 'function') {
            const container = document.getElementById('module-container');
            await window.openStudentEditor(studentId, container);
            console.log('✅ Editor de estudante aberto sem erros');
            return true;
        }
        
    } catch (error) {
        console.error('❌ Erro na correção:', error);
        return false;
    }
}

window.testeCorrecaoAPIClient = testeCorrecaoAPIClient;

console.log(`
🔧 COMANDOS ADICIONAIS DISPONÍVEIS:
- iniciarMonitoramentoAutomatico()
- obterRelatorioMonitoramento()
- testeCorrecaoAPIClient()
`);

// Função principal de execução de todos os testes (para export)
const executarTodosOsTestes = window.executarTodosOsTestes;

// Exportar funções para uso externo
export {
    executarTodosOsTestes
};
