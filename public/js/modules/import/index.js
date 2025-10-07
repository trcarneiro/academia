/**
 * Import Module - Main Entry Point
 * Sistema de importação de cursos com Progress Bar Enhanced
 * 
 * @version 2.0.0
 * @author AI Assistant
 * @follows AGENTS.md
 */

// Dinamicamente importar o controller enhanced se disponível, caso contrário usa o original
const ImportController = window.ImportControllerEnhanced || (await import('./controllers/importController.js')).default;

class ImportModule {
    constructor() {
        this.controller = null;
        this.initialized = false;
        this.container = null;
    }

    /**
     * Inicializa o módulo de importação
     * @param {HTMLElement} container - Container onde o módulo será renderizado
     */
    async init(container) {
        try {
            console.log('🚀 Inicializando ImportModule (Enhanced Version)...');
            
            if (!container) {
                throw new Error('Container não fornecido para o módulo de importação');
            }

            this.container = container;
            
            // Instanciar o controller principal
            this.controller = new ImportController(container);
            
            // Inicializar o controller
            await this.controller.init();
            
            // Integração com AcademyApp
            this.integrateWithApp();
            
            this.initialized = true;
            
            console.log('✅ ImportModule inicializado com sucesso');
            
            // Emitir evento para o app principal
            if (window.app) {
                window.app.dispatchEvent('module:loaded', { name: 'import' });
            }
            
        } catch (error) {
            console.error('❌ Erro ao inicializar ImportModule:', error);
            
            // Mostrar erro no container
            if (container) {
                container.innerHTML = `
                    <div class="module-isolated-import">
                        <div class="import-header-premium">
                            <h1>⚠️ Erro na Inicialização</h1>
                            <div class="breadcrumb">Módulo / Importação / Erro</div>
                        </div>
                        <div class="error-state">
                            <div class="error-icon">❌</div>
                            <h3>Falha ao carregar módulo</h3>
                            <p>${error.message}</p>
                            <button onclick="location.reload()" class="btn-import-primary">
                                Recarregar Página
                            </button>
                        </div>
                    </div>
                `;
            }
            
            // Reportar erro para o app principal
            if (window.app && window.app.handleError) {
                window.app.handleError(error, 'ImportModule.init');
            }
            
            throw error;
        }
    }

    /**
     * Integração com AcademyApp
     */
    integrateWithApp() {
        try {
            // Registrar módulo globalmente
            window.importModule = this;
            
            // Verificar se o app principal existe
            if (window.app) {
                console.log('🔗 Integrando com AcademyApp...');
                
                // Registrar no mapa de módulos do app
                if (window.app.modules && typeof window.app.modules.set === 'function') {
                    window.app.modules.set('import', this);
                }
                
                // Configurar manipulação de erros
                this.setupErrorHandling();
                
                console.log('✅ Integração com AcademyApp concluída');
            } else {
                console.warn('⚠️ AcademyApp não encontrado - módulo funcionará de forma independente');
            }
            
        } catch (error) {
            console.error('❌ Erro na integração com AcademyApp:', error);
        }
    }

    /**
     * Configurar manipulação de erros
     */
    setupErrorHandling() {
        // Interceptar erros do controller
        if (this.controller) {
            this.controller.onError = (error, context) => {
                console.error(`❌ Erro no controller de importação [${context}]:`, error);
                
                if (window.app && window.app.handleError) {
                    window.app.handleError(error, `ImportModule.${context}`);
                }
            };
        }
    }

    /**
     * Limpar recursos do módulo
     */
    cleanup() {
        try {
            console.log('🧹 Limpando recursos do ImportModule...');
            
            if (this.controller && typeof this.controller.cleanup === 'function') {
                this.controller.cleanup();
            }
            
            // Remover referências globais
            if (window.importModule === this) {
                delete window.importModule;
            }
            
            // Remover do mapa de módulos do app
            if (window.app && window.app.modules) {
                window.app.modules.delete('import');
            }
            
            this.initialized = false;
            this.controller = null;
            this.container = null;
            
            console.log('✅ Recursos do ImportModule limpos');
            
        } catch (error) {
            console.error('❌ Erro ao limpar recursos do ImportModule:', error);
        }
    }

    /**
     * Recarregar o módulo
     */
    async reload() {
        try {
            console.log('🔄 Recarregando ImportModule...');
            
            const container = this.container;
            this.cleanup();
            await this.init(container);
            
            console.log('✅ ImportModule recarregado com sucesso');
            
        } catch (error) {
            console.error('❌ Erro ao recarregar ImportModule:', error);
            throw error;
        }
    }

    /**
     * Obter status do módulo
     */
    getStatus() {
        return {
            initialized: this.initialized,
            hasController: !!this.controller,
            hasContainer: !!this.container,
            timestamp: new Date().toISOString()
        };
    }
}

// Função global de inicialização (compatibilidade com SPA Router)
window.initImportModule = async (container) => {
    try {
        // Cleanup do módulo anterior se existir
        if (window.importModule && typeof window.importModule.cleanup === 'function') {
            window.importModule.cleanup();
        }
        
        // Criar nova instância
        const importModule = new ImportModule();
        await importModule.init(container);
        
        return importModule;
        
    } catch (error) {
        console.error('❌ Erro na função global initImportModule:', error);
        throw error;
    }
};

// Auto-inicialização se o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('📦 ImportModule carregado e pronto');
    });
} else {
    console.log('📦 ImportModule carregado e pronto');
}

// Export para compatibilidade com módulos ES6
export default ImportModule;
