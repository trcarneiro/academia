/**
 * @fileoverview Exemplo de uso do State Manager
 * @description Como integrar e usar o State Manager em módulos
 */

// ==============================================
// EXEMPLO DE USO DO STATE MANAGER
// ==============================================

class ExemploModule {
    constructor() {
        this.stateManager = null;
        this.dados = [];
        
        this.init();
    }

    async init() {
        // 1. Conectar ao State Manager global
        this.connectStateManager();
        
        // 2. Carregar dados com cache
        await this.loadData();
        
        // 3. Configurar subscriptions
        this.setupSubscriptions();
    }

    connectStateManager() {
        if (window.stateManager) {
            this.stateManager = window.stateManager;
            console.log('✅ State Manager conectado');
        } else {
            console.warn('⚠️ State Manager não encontrado');
        }
    }

    // ==============================================
    // MÉTODOS DE CACHE
    // ==============================================

    async loadData() {
        const cacheKey = 'exemplo_dados';
        
        // Tentar carregar do cache primeiro
        if (this.stateManager && this.stateManager.has(cacheKey)) {
            this.dados = this.stateManager.get(cacheKey);
            console.log('📋 Dados carregados do cache');
            this.renderData();
            return;
        }
        
        try {
            // Simular carregamento da API
            const response = await fetch('/api/exemplo');
            const dados = await response.json();
            
            // Salvar no cache
            if (this.stateManager) {
                this.stateManager.set(cacheKey, dados, { 
                    ttl: 300000 // 5 minutos
                });
                console.log('💾 Dados salvos no cache');
            }
            
            this.dados = dados;
            this.renderData();
            
        } catch (error) {
            console.error('❌ Erro ao carregar dados:', error);
        }
    }

    // ==============================================
    // MÉTODOS DE ESTADO PERSISTENTE
    // ==============================================

    saveUserPreference(key, value) {
        if (this.stateManager) {
            this.stateManager.set(`user_pref_${key}`, value, { 
                persistent: true 
            });
            console.log('💾 Preferência salva:', key);
        }
    }

    getUserPreference(key, defaultValue = null) {
        if (this.stateManager) {
            return this.stateManager.get(`user_pref_${key}`, defaultValue);
        }
        return defaultValue;
    }

    // Salvar estado temporário do formulário
    saveFormDraft(formData) {
        if (this.stateManager) {
            this.stateManager.set('exemplo_form_draft', formData, {
                persistent: true,
                ttl: 86400000 // 24 horas
            });
            console.log('💾 Rascunho salvo');
        }
    }

    loadFormDraft() {
        if (this.stateManager) {
            return this.stateManager.get('exemplo_form_draft', null);
        }
        return null;
    }

    // ==============================================
    // MÉTODOS DE SUBSCRIPTION
    // ==============================================

    setupSubscriptions() {
        if (!this.stateManager) return;

        // Reagir a mudanças em dados específicos
        this.stateManager.subscribe('exemplo_dados', (change) => {
            console.log('📢 Dados alterados:', change);
            this.dados = change.value;
            this.renderData();
        });

        // Reagir a mudanças em preferências
        this.stateManager.subscribe('user_pref_theme', (change) => {
            console.log('🎨 Tema alterado:', change.value);
            this.applyTheme(change.value);
        });
    }

    // ==============================================
    // MÉTODOS UTILITÁRIOS
    // ==============================================

    invalidateCache(pattern = null) {
        if (!this.stateManager) return;

        if (pattern) {
            // Invalidar chaves que correspondem ao padrão
            const keys = this.stateManager.keys();
            const matchingKeys = keys.filter(key => key.includes(pattern));
            matchingKeys.forEach(key => {
                this.stateManager.delete(key);
            });
            console.log(`🗑️ Cache invalidado para padrão: ${pattern}`);
        } else {
            // Invalidar cache específico
            this.stateManager.delete('exemplo_dados');
            console.log('🗑️ Cache invalidado');
        }
    }

    // Cache inteligente com factory function
    async getCachedData(cacheKey, fetchFunction, ttl = 300000) {
        if (!this.stateManager) {
            return await fetchFunction();
        }

        return await this.stateManager.getOrSet(cacheKey, fetchFunction, { ttl });
    }

    // Exemplo de uso do cache inteligente
    async loadUserData(userId) {
        const cacheKey = `user_data_${userId}`;
        
        return await this.getCachedData(cacheKey, async () => {
            const response = await fetch(`/api/users/${userId}`);
            return await response.json();
        });
    }

    // ==============================================
    // MÉTODOS DE DEBUG
    // ==============================================

    debugState() {
        if (this.stateManager) {
            console.group('🔍 Estado do Módulo');
            console.log('Estatísticas:', this.stateManager.getStats());
            console.log('Chaves:', this.stateManager.keys());
            console.log('Dados atuais:', this.dados);
            console.groupEnd();
        }
    }

    // ==============================================
    // MÉTODOS MOCK PARA EXEMPLO
    // ==============================================

    renderData() {
        console.log('🎨 Renderizando dados:', this.dados.length, 'itens');
        // Implementar renderização real aqui
    }

    applyTheme(theme) {
        console.log('🎨 Aplicando tema:', theme);
        document.body.className = `theme-${theme}`;
    }
}

// ==============================================
// EXEMPLOS DE USO AVANÇADO
// ==============================================

class ExemploAvancado {
    constructor() {
        this.stateManager = window.stateManager;
        this.setupAdvancedUsage();
    }

    setupAdvancedUsage() {
        if (!this.stateManager) return;

        // 1. Cache com invalidação automática
        this.setupSmartCache();
        
        // 2. Estados compartilhados entre módulos
        this.setupSharedState();
        
        // 3. Persistence patterns
        this.setupPersistence();
    }

    setupSmartCache() {
        // Cache que se invalida quando dados relacionados mudam
        this.stateManager.subscribe('student_updated', (change) => {
            const studentId = change.value.id;
            this.stateManager.delete(`student_data_${studentId}`);
            this.stateManager.delete(`student_grades_${studentId}`);
            console.log('🗑️ Cache de estudante invalidado:', studentId);
        });
    }

    setupSharedState() {
        // Estado compartilhado entre módulos
        this.stateManager.set('global_theme', 'dark', { persistent: true });
        
        // Múltiplos módulos podem reagir a esta mudança
        this.stateManager.subscribe('global_theme', (change) => {
            console.log('🌍 Tema global alterado:', change.value);
            this.notifyAllModules('theme-changed', change.value);
        });
    }

    setupPersistence() {
        // Diferentes estratégias de persistência
        
        // Persistir preferências do usuário (never expires)
        this.stateManager.set('user_preferences', {
            language: 'pt-BR',
            timezone: 'America/Sao_Paulo'
        }, { persistent: true });

        // Persistir dados temporários (expires in 1 hour)
        this.stateManager.set('temp_work', {
            unsaved_changes: true,
            draft_content: '...'
        }, { 
            persistent: true, 
            ttl: 3600000 // 1 hora
        });

        // Cache volátil (não persiste, expires in 5 minutes)
        this.stateManager.set('api_cache', {
            data: '...'
        }, { ttl: 300000 });
    }

    notifyAllModules(event, data) {
        // Implementar sistema de notificação entre módulos
        window.dispatchEvent(new CustomEvent(event, { detail: data }));
    }
}

// ==============================================
// PADRÕES RECOMENDADOS
// ==============================================

/* 

1. NOMENCLATURA DE CHAVES:
   - Prefixe com nome do módulo: 'students_list', 'courses_cache'
   - Use underscores para separar palavras
   - Seja específico: 'user_pref_theme' ao invés de 'theme'

2. TTL (TIME TO LIVE):
   - Dados da API: 5-10 minutos (300000ms)
   - Preferências do usuário: Sem TTL (persistente)
   - Cache temporário: 1-5 minutos (60000-300000ms)
   - Rascunhos: 24 horas (86400000ms)

3. PERSISTENCE:
   - Preferências: { persistent: true }
   - Cache: { persistent: false } ou não especificar
   - Estados temporários: { persistent: true, ttl: ... }

4. INVALIDAÇÃO:
   - Invalide cache quando dados são modificados
   - Use patterns para invalidar múltiplas chaves relacionadas
   - Subscribe para invalidação reativa

5. ERROR HANDLING:
   - Sempre verifique se State Manager está disponível
   - Implemente fallbacks para quando cache não funciona
   - Use try-catch ao acessar localStorage

*/

// ==============================================
// EXPORTS
// ==============================================

window.ExemploModule = ExemploModule;
window.ExemploAvancado = ExemploAvancado;

console.log('📚 Exemplos de State Manager carregados');
