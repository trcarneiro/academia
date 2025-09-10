/**
 * Turmas Module - Premium Edition
 * Following GUIDELINES2.md standards
 * API-First, Modular, AcademyApp Integration
 */

(function() {
    'use strict';
    
    console.log('👥 Turmas Module Premium - Starting...');
    
    // Aguardar a disponibilidade dos recursos necessários
    async function waitForDependencies() {
        while (!window.createModuleAPI) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    // API helper
    let turmasAPI = null;
    
    // Initialize API
    async function initializeAPI() {
        console.log('[Turmas] Initializing API...');
        await waitForDependencies();
        turmasAPI = window.createModuleAPI('Turmas');
        console.log('[Turmas] API initialized:', !!turmasAPI);
        console.log('[Turmas] API methods:', Object.keys(turmasAPI || {}));
    }
    
    // Module state
    let isInitialized = false;
    let turmasController = null;
    
    // Turmas Module Definition following GUIDELINES2.md
    const TurmasModule = {
        name: 'turmas',
        version: '2.0.0',
        initialized: false,
        
        async init() {
            if (this.initialized) {
                console.log('[Turmas] Module already initialized');
                return;
            }
            
            try {
                await initializeAPI();
                await initializeTurmasModule();
                this.initialized = true;
                
                // Dispatch module loaded event
                if (window.app && window.app.dispatchEvent) {
                    window.app.dispatchEvent('module:loaded', { name: 'turmas' });
                }
                
                console.log('✅ Turmas Module initialized and registered');
            } catch (error) {
                console.error('❌ Error initializing Turmas Module:', error);
                
                // Handle error via app if available
                if (window.app && window.app.handleError) {
                    window.app.handleError(error, 'TurmasModule:init');
                }
                throw error;
            }
        },
        
        getController() {
            return turmasController;
        }
    };
    
    // Export turmas module globally for AcademyApp integration
    window.turmas = TurmasModule;
    
    // Export initialization function for SPA compatibility (legacy)
    window.initializeTurmasModule = initializeTurmasModule;
    
    // Export navigation helper for turma editor
    window.navigateToModule = function(module, params = {}) {
        console.log('[Navigation] Navigating to module:', module, 'with params:', params);
        
        if (window.router && typeof window.router.navigateTo === 'function') {
            let route = module;
            
            // Add parameters to route if needed
            if (params.turmaId) {
                route = `${module}/${params.turmaId}`;
            }
            
            window.router.navigateTo(route);
        } else {
            // Fallback navigation
            let hash = module;
            if (params.turmaId) {
                hash = `${module}/${params.turmaId}`;
            }
            window.location.hash = hash;
        }
    };
    
    // Main initialization function
    async function initializeTurmasModule() {
        console.log('[Turmas] initializeTurmasModule called');
        
        if (isInitialized) {
            console.log('ℹ️ Turmas module already initialized, skipping...');
            return;
        }
        
        try {
            console.log('🔧 Initializing Turmas Module...');
            
            // Load and apply CSS
            await loadTurmasCSS();
            console.log('✅ Turmas CSS loaded');
            
            // Initialize module container - try multiple selectors
            const container = document.getElementById('turmasContainer') || 
                             document.getElementById('module-container') ||
                             document.querySelector('.turmas-container') ||
                             document.querySelector('#main-content');
            
            console.log('[Turmas] Container found:', !!container);
            console.log('[Turmas] Container ID:', container?.id);
            
            if (!container) {
                console.error('[Turmas] No suitable container found');
                return;
            }
            
            // Initialize API
            await initializeAPI();
            
            // Create controller
            turmasController = {
                showList: () => {
                    container.innerHTML = `
                        <div class="module-isolated-turmas">
                            <div class="module-header-premium">
                                <div class="module-header-content">
                                    <div class="breadcrumb-nav">
                                        <span class="breadcrumb-item active">👥 Turmas</span>
                                    </div>
                                    <h1>👥 Gestão de Turmas</h1>
                                    <p>Sistema de execução de cronogramas de cursos</p>
                                </div>
                            </div>
                            
                            <div class="stats-grid-premium">
                                <div class="stat-card-enhanced">
                                    <div class="stat-card-content">
                                        <div class="stat-number">0</div>
                                        <div class="stat-label">Total de Turmas</div>
                                    </div>
                                    <div class="stat-card-icon">👥</div>
                                </div>
                                <div class="stat-card-enhanced">
                                    <div class="stat-card-content">
                                        <div class="stat-number">0</div>
                                        <div class="stat-label">Turmas Ativas</div>
                                    </div>
                                    <div class="stat-card-icon">✅</div>
                                </div>
                                <div class="stat-card-enhanced">
                                    <div class="stat-card-content">
                                        <div class="stat-number">0</div>
                                        <div class="stat-label">Alunos Matriculados</div>
                                    </div>
                                    <div class="stat-card-icon">🎓</div>
                                </div>
                                <div class="stat-card-enhanced">
                                    <div class="stat-card-content">
                                        <div class="stat-number">0</div>
                                        <div class="stat-label">Aulas Programadas</div>
                                    </div>
                                    <div class="stat-card-icon">📚</div>
                                </div>
                            </div>
                            
                            <div class="module-actions">
                                <button class="btn-action-premium" onclick="turmasController.showCreate()">
                                    <span>➕</span>
                                    <span>Nova Turma</span>
                                </button>
                                <button class="btn-action-secondary" onclick="turmasController.importData()">
                                    <span>📥</span>
                                    <span>Importar</span>
                                </button>
                                <button class="btn-action-secondary" onclick="turmasController.exportData()">
                                    <span>📤</span>
                                    <span>Exportar</span>
                                </button>
                            </div>
                            
                            <div class="data-card-premium">
                                <div class="turmas-content" id="turmas-content">
                                    <div class="loading-state">
                                        <div class="loading-icon">⏳</div>
                                        <p>Carregando turmas...</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                    
                    // Load data from API
                    loadTurmasData();
                },
                
                showCreate: () => {
                    console.log('[Turmas] Navigating to turma editor...');
                    // Navigate to turma editor
                    if (window.router && typeof window.router.navigateTo === 'function') {
                        window.router.navigateTo('turma-editor');
                    } else {
                        // Fallback navigation
                        window.location.hash = 'turma-editor';
                    }
                },
                
                importData: () => {
                    showNotification('Importação em desenvolvimento', 'info');
                },
                
                exportData: () => {
                    showNotification('Exportação em desenvolvimento', 'info');
                }
            };
            
            // Make controller globally available
            window.turmasController = turmasController;
            
            isInitialized = true;
            console.log('✅ Turmas Module initialized successfully');
            
            // Show list by default
            turmasController.showList();
            
        } catch (error) {
            console.error('❌ Error initializing turmas module:', error);
            showError('Erro ao inicializar módulo de turmas: ' + error.message);
        }
    }
    
    // Load turmas data
    async function loadTurmasData() {
        console.log('[Turmas] Loading turmas data...');
        
        try {
            console.log('[Turmas] Making API request with fetch...');
            const response = await fetch('/api/turmas');
            const data = await response.json();
            console.log('[Turmas] API Response:', data);
            
            if (data.success && data.data) {
                updateStats(data.data);
                renderTurmasList(data.data);
            } else if (data.success && data.data.length === 0) {
                console.log('[Turmas] No turmas found, showing empty state');
                updateStats([]);
                showEmptyState();
            }
        } catch (error) {
            console.error('❌ Error loading turmas:', error);
            showErrorState(error);
        }
    }
    
    // Update statistics
    function updateStats(turmas) {
        const totalElement = document.querySelector('.stat-card-enhanced:nth-child(1) .stat-number');
        const activeElement = document.querySelector('.stat-card-enhanced:nth-child(2) .stat-number');
        const studentsElement = document.querySelector('.stat-card-enhanced:nth-child(3) .stat-number');
        const lessonsElement = document.querySelector('.stat-card-enhanced:nth-child(4) .stat-number');
        
        if (totalElement) totalElement.textContent = turmas.length;
        
        if (activeElement) {
            const active = turmas.filter(t => t.status === 'ACTIVE').length;
            activeElement.textContent = active;
        }
        
        if (studentsElement) {
            const totalStudents = turmas.reduce((sum, turma) => sum + (turma.students?.length || 0), 0);
            studentsElement.textContent = totalStudents;
        }
        
        if (lessonsElement) {
            const totalLessons = turmas.reduce((sum, turma) => sum + (turma.lessons?.length || 0), 0);
            lessonsElement.textContent = totalLessons;
        }
    }
    
    // Render turmas list
    function renderTurmasList(turmas) {
        const container = document.querySelector('#turmas-content');
        if (!container || turmas.length === 0) {
            showEmptyState();
            return;
        }
        
        container.innerHTML = `
            <div class="turmas-list">
                <h3>Suas Turmas</h3>
                <div class="turmas-grid">
                    ${turmas.map(turma => `
                        <div class="turma-card">
                            <div class="turma-header">
                                <h4>${turma.name || 'Turma sem nome'}</h4>
                                <span class="status-badge status-${turma.status?.toLowerCase() || 'unknown'}">${getStatusText(turma.status)}</span>
                            </div>
                            <div class="turma-info">
                                <p><strong>Curso:</strong> ${turma.course?.name || 'Não definido'}</p>
                                <p><strong>Instrutor:</strong> ${turma.instructor?.name || 'Não definido'}</p>
                                <p><strong>Alunos:</strong> ${turma.students?.length || 0} / ${turma.maxStudents || 'Ilimitado'}</p>
                                <p><strong>Período:</strong> ${formatDate(turma.startDate)} - ${formatDate(turma.endDate)}</p>
                            </div>
                            <div class="turma-actions">
                                <button onclick="viewTurma('${turma.id}')" class="btn-action-small btn-view">
                                    <span>👁️</span>
                                    <span>Ver</span>
                                </button>
                                <button onclick="editTurma('${turma.id}')" class="btn-action-small btn-edit">
                                    <span>✏️</span>
                                    <span>Editar</span>
                                </button>
                                <button onclick="deleteTurma('${turma.id}')" class="btn-action-small btn-danger">
                                    <span>🗑️</span>
                                    <span>Excluir</span>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // Show empty state
    function showEmptyState() {
        const container = document.querySelector('#turmas-content');
        if (!container) return;
        
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">👥</div>
                <h3>Nenhuma turma encontrada</h3>
                <p>Crie sua primeira turma para começar a gerenciar cronogramas de aulas.</p>
                <button class="btn-action-premium" onclick="turmasController.showCreate()">
                    <span>➕</span>
                    <span>Criar Primeira Turma</span>
                </button>
            </div>
        `;
    }
    
    // Show error state
    function showErrorState(error) {
        const container = document.querySelector('#turmas-content');
        if (!container) return;
        
        container.innerHTML = `
            <div class="error-state">
                <div class="error-icon">❌</div>
                <h3>Erro ao carregar turmas</h3>
                <p>Ocorreu um erro ao carregar os dados das turmas.</p>
                <p class="error-details">${error.message}</p>
                <button class="btn-action-secondary" onclick="loadTurmasData()">
                    <span>🔄</span>
                    <span>Tentar Novamente</span>
                </button>
            </div>
        `;
    }
    
    // Global action functions for turma cards
    window.viewTurma = function(turmaId) {
        console.log('[Turmas] Viewing turma:', turmaId);
        if (window.router && typeof window.router.navigateTo === 'function') {
            window.router.navigateTo(`turma-details/${turmaId}`);
        } else {
            window.location.hash = `turma-details/${turmaId}`;
        }
    };
    
    window.editTurma = function(turmaId) {
        console.log('[Turmas] Editing turma:', turmaId);
        
        // For now, show an alert with the turma ID
        // TODO: Implement proper turma editor
        alert(`Editor de turma ${turmaId} ainda não implementado.\n\nEsta funcionalidade está em desenvolvimento.`);
        
        /* 
        // Future implementation:
        if (window.router && typeof window.router.navigateTo === 'function') {
            window.router.navigateTo(`turma-editor/${turmaId}`);
        } else {
            window.location.hash = `turma-editor/${turmaId}`;
        }
        */
    };
    
    window.deleteTurma = async function(turmaId) {
        console.log('[Turmas] Deleting turma:', turmaId);
        
        // Confirm deletion
        const confirmed = confirm('Tem certeza que deseja excluir esta turma? Esta ação não pode ser desfeita.');
        if (!confirmed) return;
        
        try {
            // Show loading state
            const deleteBtn = document.querySelector(`button[onclick="deleteTurma('${turmaId}')"]`);
            if (deleteBtn) {
                deleteBtn.disabled = true;
                deleteBtn.innerHTML = '<span>⏳</span><span>Excluindo...</span>';
            }
            
            const response = await fetch(`/api/turmas/${turmaId}`, {
                method: 'DELETE'
                // Don't set Content-Type for DELETE without body
            });
            
            const result = await response.json();
            
            if (result.success) {
                showNotification('✅ Turma excluída com sucesso!', 'success');
                // Reload data
                setTimeout(() => loadTurmasData(), 500);
            } else {
                showNotification('❌ Erro ao excluir turma: ' + (result.error || 'Erro desconhecido'), 'error');
            }
            
        } catch (error) {
            console.error('❌ Error deleting turma:', error);
            showNotification('❌ Erro ao excluir turma: ' + error.message, 'error');
            
            // Handle error via app if available
            if (window.app && window.app.handleError) {
                window.app.handleError(error, 'Turmas:delete');
            }
        } finally {
            // Restore button state
            const deleteBtn = document.querySelector(`button[onclick="deleteTurma('${turmaId}')"]`);
            if (deleteBtn) {
                deleteBtn.disabled = false;
                deleteBtn.innerHTML = '<span>🗑️</span><span>Excluir</span>';
            }
        }
    };

    // Utility functions for turma display
    function getStatusText(status) {
        const statusMap = {
            'SCHEDULED': 'Agendada',
            'ACTIVE': 'Ativa',
            'COMPLETED': 'Concluída',
            'CANCELLED': 'Cancelada',
            'RESCHEDULED': 'Reagendada'
        };
        return statusMap[status] || 'Indefinido';
    }
    
    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('pt-BR');
        } catch (error) {
            return 'Data inválida';
        }
    }
    
    // Load CSS for the module
    async function loadTurmasCSS() {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/css/modules/turmas-simple.css';
        document.head.appendChild(link);
        
        return new Promise((resolve) => {
            link.onload = resolve;
            link.onerror = resolve; // Continue even if CSS fails to load
        });
    }
    
    // Show notification helper
    function showNotification(message, type = 'info') {
        if (window.app && window.app.showNotification) {
            window.app.showNotification(message, type);
        } else if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }
    
    function showError(message) {
        if (window.app && window.app.showNotification) {
            window.app.showNotification(message, 'error');
        } else {
            console.error('❌', message);
        }
    }
    
    console.log('👥 Turmas Module Premium - Loaded');
})();
