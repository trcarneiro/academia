/**
 * Generic Module Manager
 * Sistema genérico para prevenção de inicializações duplicadas
 * 
 * Pode ser usado por qualquer módulo do sistema para implementar:
 * - Anti-duplicação
 * - Cache de instâncias
 * - Controle de concorrência
 * - Error handling
 */

class ModuleManager {
    constructor(moduleName) {
        this.moduleName = moduleName;
        this.isInitialized = false;
        this.initializationPromise = null;
        this.instance = null;
        this.initCount = 0;
        this.lastError = null;
    }

    /**
     * Safe initialization with anti-duplication protection
     * @param {Function} initializerFn - Function that performs the actual initialization
     * @param {HTMLElement} targetContainer - Container where module should render
     * @returns {Promise} Initialization result
     */
    async safeInit(initializerFn, targetContainer) {
        // 1. Check if already initialized
        if (this.isInitialized && this.instance) {
            console.log(`🎯 [CACHE] Módulo ${this.moduleName} já inicializado, reutilizando...`);
            
            // Re-render with cached instance if needed
            if (typeof this.instance.render === 'function') {
                await this.instance.render(targetContainer);
            }
            
            return {
                ...this.instance,
                fromCache: true,
                initCount: this.initCount
            };
        }
        
        // 2. Check if currently initializing
        if (this.initializationPromise) {
            console.log(`🎯 [CACHE] Módulo ${this.moduleName} já está carregando, aguardando...`);
            return this.initializationPromise;
        }
        
        // 3. Start new initialization
        console.log(`🎯 [NETWORK] Inicializando módulo ${this.moduleName}...`);
        this.initCount++;
        
        this.initializationPromise = this._performInitialization(initializerFn, targetContainer)
            .then(result => {
                this.isInitialized = true;
                this.instance = result;
                this.lastError = null;
                this.initializationPromise = null;
                
                return {
                    ...result,
                    fromCache: false,
                    initCount: this.initCount
                };
            })
            .catch(error => {
                this.lastError = error;
                this.initializationPromise = null;
                
                console.error(`❌ Erro ao inicializar módulo ${this.moduleName}:`, error);
                this._showErrorState(targetContainer, error.message);
                
                throw error;
            });
        
        return this.initializationPromise;
    }

    /**
     * Internal initialization wrapper
     */
    async _performInitialization(initializerFn, targetContainer) {
        try {
            const result = await initializerFn(targetContainer);
            console.log(`✅ Módulo ${this.moduleName} inicializado com sucesso`);
            return result;
        } catch (error) {
            console.error(`❌ Falha na inicialização do módulo ${this.moduleName}:`, error);
            throw error;
        }
    }

    /**
     * Show error state in container
     */
    _showErrorState(container, message) {
        if (!container) return;
        
        container.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <h3>Erro no Módulo ${this.moduleName}</h3>
                <p>${message}</p>
                <button onclick="window.resetModule_${this.moduleName}()" class="btn btn-primary">
                    Tentar Novamente
                </button>
            </div>
        `;
    }

    /**
     * Reset module state (for retry scenarios)
     */
    reset() {
        console.log(`🔄 Resetando estado do módulo ${this.moduleName}...`);
        this.isInitialized = false;
        this.initializationPromise = null;
        this.instance = null;
        this.lastError = null;
        // Keep initCount for debugging
    }

    /**
     * Get current module state (for debugging)
     */
    getState() {
        return {
            moduleName: this.moduleName,
            isInitialized: this.isInitialized,
            hasPromise: !!this.initializationPromise,
            hasInstance: !!this.instance,
            initCount: this.initCount,
            lastError: this.lastError
        };
    }

    /**
     * Force re-initialization (useful for hot reload scenarios)
     */
    async forceReinit(initializerFn, targetContainer) {
        this.reset();
        return this.safeInit(initializerFn, targetContainer);
    }
}

/**
 * Factory function to create module managers
 */
function createModuleManager(moduleName) {
    return new ModuleManager(moduleName);
}

/**
 * Global registry for all module managers
 * Allows cross-module state inspection and management
 */
class GlobalModuleRegistry {
    constructor() {
        this.modules = new Map();
    }

    getOrCreate(moduleName) {
        if (!this.modules.has(moduleName)) {
            this.modules.set(moduleName, createModuleManager(moduleName));
        }
        return this.modules.get(moduleName);
    }

    getState(moduleName) {
        const manager = this.modules.get(moduleName);
        return manager ? manager.getState() : null;
    }

    getAllStates() {
        const states = {};
        for (const [name, manager] of this.modules) {
            states[name] = manager.getState();
        }
        return states;
    }

    reset(moduleName) {
        const manager = this.modules.get(moduleName);
        if (manager) {
            manager.reset();
        }
    }

    resetAll() {
        for (const manager of this.modules.values()) {
            manager.reset();
        }
    }
}

// Global instance
const moduleRegistry = new GlobalModuleRegistry();

// Make available globally for debugging
window.moduleRegistry = moduleRegistry;
window.createModuleManager = createModuleManager;

export {
    ModuleManager,
    createModuleManager,
    moduleRegistry
};
