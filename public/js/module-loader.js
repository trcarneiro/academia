/**
 * 🔌 CARREGADOR DE MÓDULOS ISOLADOS
 * Carrega módulos de forma segura sem quebrar o sistema principal
 */

window.ModuleLoader = (function() {
    'use strict';
    
    const loadedModules = new Map();
    const loadingPromises = new Map();
    
    return {
        // Carregar módulo de forma segura
        async loadModule(moduleName, moduleUrl) {
            // Se já está carregado, retorna
            if (loadedModules.has(moduleName)) {
                return loadedModules.get(moduleName);
            }
            
            // Se está carregando, aguarda
            if (loadingPromises.has(moduleName)) {
                return await loadingPromises.get(moduleName);
            }
            
            // Inicia carregamento
            const promise = this._loadModuleScript(moduleName, moduleUrl);
            loadingPromises.set(moduleName, promise);
            
            try {
                const module = await promise;
                loadedModules.set(moduleName, module);
                loadingPromises.delete(moduleName);
                return module;
            } catch (error) {
                loadingPromises.delete(moduleName);
                throw error;
            }
        },
        
        // Carregar CSS de módulo
        loadModuleCSS(moduleUrl) {
            return new Promise((resolve, reject) => {
                // Verifica se já foi carregado
                const existingLink = document.querySelector(`link[href="${moduleUrl}"]`);
                if (existingLink) {
                    resolve();
                    return;
                }
                
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = moduleUrl;
                link.onload = () => resolve();
                link.onerror = () => reject(new Error(`Erro ao carregar CSS: ${moduleUrl}`));
                
                document.head.appendChild(link);
            });
        },
        
        // Carregar script de módulo
        _loadModuleScript(moduleName, moduleUrl) {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = moduleUrl;
                script.onload = () => {
                    // Verifica se o módulo foi carregado corretamente
                    const module = this._getModuleFromWindow(moduleName);
                    if (module) {
                        console.log(`✅ Módulo ${moduleName} carregado com sucesso`);
                        resolve(module);
                    } else {
                        reject(new Error(`Módulo ${moduleName} não encontrado após carregamento`));
                    }
                };
                script.onerror = () => reject(new Error(`Erro ao carregar script: ${moduleUrl}`));
                
                document.head.appendChild(script);
            });
        },
        
        // Buscar módulo na window
        _getModuleFromWindow(moduleName) {
            return window[moduleName] || null;
        },
        
        // Listar módulos carregados
        getLoadedModules() {
            return Array.from(loadedModules.keys());
        },
        
        // Verificar se módulo está carregado
        isModuleLoaded(moduleName) {
            return loadedModules.has(moduleName);
        }
    };
})();

// 🚀 Auto-inicialização para módulos essenciais
document.addEventListener('DOMContentLoaded', async function() {
    try {
        console.log('🔌 Iniciando carregamento de módulos isolados...');
        
        // Carregar CSS do módulo de planos
        await ModuleLoader.loadModuleCSS('/css/modules/plans-styles.css');
        
        // Carregar módulo de planos
        await ModuleLoader.loadModule('PlansManager', '/js/modules/plans-manager.js');
        
        console.log('✅ Todos os módulos carregados com sucesso');
        
        // Notificar sistema principal
        if (window.showToast) {
            window.showToast('📦 Módulos isolados carregados', 'success');
        }
        
    } catch (error) {
        console.error('❌ Erro ao carregar módulos:', error);
        if (window.showToast) {
            window.showToast('⚠️ Alguns módulos falharam ao carregar', 'warning');
        }
    }
});