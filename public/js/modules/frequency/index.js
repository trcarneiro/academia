/**
 * Frequency Module v1.0
 * Módulo de Frequência - Registro e monitoramento de presença
 * 
 * Seguindo: GUIDELINES2.md (v2.0)
 * Alinhado com: Modular system, API-first, Premium UI
 */

import { FrequencyService } from './services/frequencyService.js';
import { ValidationService } from './services/validationService.js';
import { FrequencyController } from './controllers/frequencyController.js';

console.log('👥 [NETWORK] Inicializando módulo de Frequência...');

class FrequencyModule {
    constructor() {
        this.initialized = false;
        this.service = null;
        this.validationService = null;
        this.controller = null;
        this.offlineQueue = [];
    }

    /**
     * Inicializar módulo com dependências
     */
    async initialize() {
        if (this.initialized) {
            console.log('👥 [CACHE] Módulo Frequency já inicializado');
            return;
        }

        try {
            console.log('🔧 Initializing Frequency Module...');

            // Aguardar API Client
            await this.waitForAPIClient();

            // Verificar se createModuleAPI está disponível
            if (!window.createModuleAPI) {
                throw new Error('createModuleAPI não está disponível. Verifique se api-client.js foi carregado.');
            }

            // Criar Module API
            this.moduleAPI = window.createModuleAPI('Frequency');
            console.log('🌐 Module API criado:', this.moduleAPI);

            // Inicializar serviços
            this.validationService = new ValidationService();
            this.service = new FrequencyService(this.validationService);
            this.controller = new FrequencyController(this.service);

            // Configurar event listeners globais
            this.setupEventListeners();

            // Processar fila offline se existir
            await this.processOfflineQueue();

            this.initialized = true;
            console.log('✅ Frequency Module initialized successfully');

            // Disparar evento de inicialização
            window.app?.dispatchEvent('module:loaded', { name: 'frequency' });

        } catch (error) {
            console.error('❌ Erro ao inicializar Frequency Module:', error);
            window.app?.handleError(error, { scope: 'frequency', action: 'initialize' });
            throw error;
        }
    }

    /**
     * Aguardar API Client estar disponível
     */
    async waitForAPIClient() {
        return new Promise((resolve) => {
            if (window.apiClient) {
                resolve();
            } else {
                const checkInterval = setInterval(() => {
                    if (window.apiClient) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
            }
        });
    }

    /**
     * Configurar event listeners do módulo
     */
    setupEventListeners() {
        // Listener para offline/online
        window.addEventListener('online', () => {
            console.log('🌐 Connection restored, processing offline queue...');
            this.processOfflineQueue();
        });

        // Listener customizado para check-ins
        window.addEventListener('FREQUENCY:CHECKIN_RECORDED', (event) => {
            console.log('✅ Check-in recorded:', event.detail);
            this.updateUIAfterCheckin(event.detail);
        });

        // Listener para erros bloqueados
        window.addEventListener('FREQUENCY:CHECKIN_BLOCKED', (event) => {
            console.warn('🚫 Check-in blocked:', event.detail);
            this.handleBlockedCheckin(event.detail);
        });
    }

    /**
     * Processar fila offline
     */
    async processOfflineQueue() {
        if (!navigator.onLine || this.offlineQueue.length === 0) {
            return;
        }

        console.log(`📤 Processing ${this.offlineQueue.length} offline check-ins...`);

        const queue = [...this.offlineQueue];
        this.offlineQueue = [];

        for (const queuedCheckin of queue) {
            try {
                await this.service.checkin(queuedCheckin);
                console.log('✅ Offline check-in processed:', queuedCheckin);
            } catch (error) {
                console.error('❌ Failed to process offline check-in:', error);
                // Re-adicionar à fila se falhou
                this.offlineQueue.push(queuedCheckin);
            }
        }

        // Salvar fila atualizada
        this.saveOfflineQueue();
    }

    /**
     * Adicionar check-in à fila offline
     */
    addToOfflineQueue(checkinData) {
        const queueItem = {
            ...checkinData,
            queuedAt: new Date().toISOString(),
            retryCount: 0
        };

        this.offlineQueue.push(queueItem);
        this.saveOfflineQueue();

        console.log('📥 Added check-in to offline queue:', queueItem);
    }

    /**
     * Salvar fila offline no localStorage
     */
    saveOfflineQueue() {
        try {
            localStorage.setItem('frequency_offline_queue', JSON.stringify(this.offlineQueue));
        } catch (error) {
            console.error('Failed to save offline queue:', error);
        }
    }

    /**
     * Carregar fila offline do localStorage
     */
    loadOfflineQueue() {
        try {
            const saved = localStorage.getItem('frequency_offline_queue');
            if (saved) {
                this.offlineQueue = JSON.parse(saved);
                console.log(`📥 Loaded ${this.offlineQueue.length} items from offline queue`);
            }
        } catch (error) {
            console.error('Failed to load offline queue:', error);
            this.offlineQueue = [];
        }
    }

    /**
     * Atualizar UI após check-in bem-sucedido
     */
    updateUIAfterCheckin(detail) {
        // Atualizar contadores, listas, etc.
        if (this.controller) {
            this.controller.handleCheckinSuccess(detail);
        }
    }

    /**
     * Lidar com check-in bloqueado
     */
    handleBlockedCheckin(detail) {
        if (this.controller) {
            this.controller.handleCheckinBlocked(detail);
        }
    }

    /**
     * API pública do módulo
     */
    getAPI() {
        return {
            // Métodos principais
            checkin: (data) => this.service?.checkin(data),
            getStudentAttendance: (studentId) => this.service?.getStudentAttendance(studentId),
            getActiveSessions: () => this.service?.getActiveSessions(),
            
            // Métodos de controle
            validateCheckin: (data) => this.validationService?.validate(data),
            
            // Métodos de UI
            renderCheckinForm: (container) => this.controller?.renderCheckinForm(container),
            renderAttendanceHistory: (container, studentId) => this.controller?.renderAttendanceHistory(container, studentId),
            
            // Estado do módulo
            isInitialized: () => this.initialized,
            getOfflineQueueSize: () => this.offlineQueue.length
        };
    }

    /**
     * Navegação para views do módulo
     */
    navigateTo(view, params = {}) {
        if (!this.controller) {
            console.error('Controller not initialized');
            return;
        }

        switch (view) {
            case 'checkin':
                this.controller.showCheckinView(params);
                break;
            case 'history':
                this.controller.showHistoryView(params);
                break;
            case 'summary':
                this.controller.showSummaryView(params);
                break;
            default:
                console.warn('Unknown frequency view:', view);
        }
    }
}

// Instanciar módulo
const frequencyModule = new FrequencyModule();

// Carregar fila offline no boot
frequencyModule.loadOfflineQueue();

// Auto-inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        frequencyModule.initialize().catch(console.error);
    });
} else {
    frequencyModule.initialize().catch(console.error);
}

// Exposição global seguindo padrões do projeto
window.frequencyModule = frequencyModule;

// Função global para inicialização via router
window.initFrequencyModule = async (container) => {
    console.log('🚀 Initializing Frequency Module for SPA router...');
    
    try {
        // Garantir que o módulo está inicializado
        if (!frequencyModule.initialized) {
            await frequencyModule.initialize();
        }
        
        // Criar container específico para o módulo
        container.innerHTML = `
            <div id="frequency-container" class="frequency-module-container">
                <div class="frequency-loading">
                    <div class="loading-spinner"></div>
                    <p>Carregando módulo de frequência...</p>
                </div>
            </div>
        `;
        
        // Inicializar o controller com container
        const frequencyContainer = container.querySelector('#frequency-container');
        
        // Garantir que moduleAPI existe
        const api = frequencyModule.moduleAPI || window.moduleAPI || window.createModuleAPI?.('Frequency');
        console.log('📊 [FrequencyModule] Passing API to controller:', api);
        
        if (frequencyModule.controller && frequencyContainer) {
            await frequencyModule.controller.initialize(frequencyContainer, api);
        } else {
            console.error('❌ Controller or container not available');
        }
        
        console.log('✅ Frequency Module initialized for SPA');
        
    } catch (error) {
        console.error('❌ Error initializing frequency module:', error);
        container.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <h3>Erro de inicialização</h3>
                <p>${error.message}</p>
                <button onclick="location.reload()" class="btn btn-primary">
                    Recarregar
                </button>
            </div>
        `;
    }
};

// Export para uso como módulo ES6
export default frequencyModule;

// Expor globalmente para compatibilidade com AcademyApp (AGENTS.md v2.1)
window.frequency = window.frequencyModule = frequencyModule;

// Função global para navegação para execução de atividades
window.viewLessonExecution = (turmaLessonId) => {
    console.log('🎯 Navegando para execução de atividades da aula:', turmaLessonId);
    
    // Usar router do AcademyApp se disponível
    if (window.app && window.app.navigate) {
        window.app.navigate(`lesson-execution/${turmaLessonId}`);
    } else {
        // Fallback para hash navigation
        window.location.hash = `#lesson-execution/${turmaLessonId}`;
    }
};

console.log('👥 Frequency Module - Loaded and registered globally');
