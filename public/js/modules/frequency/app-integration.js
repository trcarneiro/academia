/**
 * Frequency Module Integration
 * Integração do módulo de frequência com o AcademyApp
 */

// Aguardar o AcademyApp estar disponível
function waitForAcademyApp() {
    return new Promise((resolve) => {
        if (window.app) {
            resolve();
        } else {
            const checkInterval = setInterval(() => {
                if (window.app) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
        }
    });
}

// Registrar o módulo quando a página carregar
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Aguardar AcademyApp
        await waitForAcademyApp();
        
        // Importar módulo de frequência
        const { FrequencyModule } = await import('./index.js');
        
        // Criar instância
        const frequencyModule = new FrequencyModule();
        
        // Expor globalmente
        window.frequencyModule = frequencyModule;
        
        // Registrar no AcademyApp
        if (window.app && typeof window.app.registerModule === 'function') {
            window.app.registerModule('frequency', frequencyModule);
        }
        
        console.log('✅ Frequency Module registered with AcademyApp');
        
    } catch (error) {
        console.error('❌ Error registering Frequency Module:', error);
        
        if (window.app && typeof window.app.handleError === 'function') {
            window.app.handleError(error, { scope: 'frequency', action: 'registration' });
        }
    }
});

// Exportar para uso em outros módulos
export { default as FrequencyModule } from './index.js';
