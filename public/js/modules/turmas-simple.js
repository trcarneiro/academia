(function() {
    'use strict';
    
    console.log('👥 Turmas Module - Starting...');
    
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
    
    // Export turma management functions
    window.viewTurma = function(turmaId) {
        console.log('[Turmas] Viewing turma:', turmaId);
        // For now, redirect to edit
        window.editTurma(turmaId);
    };
    
    window.editTurma = function(turmaId) {
        console.log('[Turmas] Editing turma:', turmaId);
        window.navigateToModule('turma-editor', { turmaId });
    };
    
    // Module initialization
    async function initializeTurmasModule() {
        console.log('[Turmas] initializeTurmasModule called');
        if (isInitialized) {
            console.log('ℹ️ Turmas module already initialized, skipping...');
            return;
        }
        
        console.log('🔧 Initializing Turmas Module...');
        
        try {
            // Load CSS if not already loaded
            if (!document.querySelector('link[href*="turmas-simple.css"]')) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = '/css/modules/turmas-simple.css';
                document.head.appendChild(link);
                console.log('✅ Turmas CSS loaded');
            }
            
            // Wait for container to be available
            const container = await waitForElement('#turmasContainer', 3000);
            console.log('[Turmas] Container found:', !!container);
            
            // Initialize API first
            await initializeAPI();
            if (!turmasAPI) {
                throw new Error('Failed to initialize API');
            }
            
            // Create simple controller
            turmasController = {
                showList: () => {
                    container.innerHTML = `
                        <div class="module-isolated-turmas">
                            <div class="module-header-premium">
                                <div class="module-header-content">
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
                                <div class="empty-state">
                                    <div class="empty-icon">👥</div>
                                    <h3>Módulo em Desenvolvimento</h3>
                                    <p>O módulo de Turmas está sendo finalizado. Funcionalidades completas estarão disponíveis em breve.</p>
                                    <div class="feature-list">
                                        <div class="feature-item">✅ Gestão de Turmas</div>
                                        <div class="feature-item">✅ Cronogramas de Aulas</div>
                                        <div class="feature-item">✅ Controle de Frequência</div>
                                        <div class="feature-item">✅ Relatórios de Desempenho</div>
                                        <div class="feature-item">🔄 Integração com Pagamentos</div>
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
    
    // Create sample turma
    async function createSampleTurma() {
        try {
            showNotification('Criando turma de exemplo...', 'info');
            
            // Get courses first
            const coursesResponse = await fetch('/api/courses');
            const coursesData = await coursesResponse.json();
            
            if (!coursesData.success || !coursesData.data.length) {
                showNotification('Nenhum curso encontrado. Crie um curso primeiro.', 'warning');
                return;
            }
            
            const course = coursesData.data[0];
            
            // Create sample turma with correct schema
            const turmaData = {
                name: `Turma ${course.name} - ${new Date().toLocaleDateString('pt-BR')}`,
                courseId: course.id,
                type: 'COLLECTIVE', // Changed to match Prisma enum
                startDate: new Date().toISOString(),
                endDate: new Date(Date.now() + (60 * 24 * 60 * 60 * 1000)).toISOString(),
                maxStudents: 20,
                instructorId: 'ba8a4a0b-4445-4d17-8808-4d1cfcfee6ce', // Use real organization ID
                organizationId: 'ba8a4a0b-4445-4d17-8808-4d1cfcfee6ce', // Use real organization ID
                unitId: 'ba8a4a0b-4445-4d17-8808-4d1cfcfee6ce', // Use real organization ID as fallback
                schedule: {
                    daysOfWeek: [1, 3, 5], // Monday, Wednesday, Friday
                    time: '19:00',
                    duration: 90
                }
            };
            
            console.log('[Turmas] Creating turma with data:', turmaData);
            
            const response = await fetch('/api/turmas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(turmaData)
            });
            
            const result = await response.json();
            console.log('[Turmas] Create response:', result);
            
            if (result.success) {
                showNotification('✅ Turma criada com sucesso!', 'success');
                // Reload data
                setTimeout(() => loadTurmasData(), 500);
            } else {
                showNotification('❌ Erro ao criar turma: ' + (result.error || 'Erro desconhecido'), 'error');
                console.error('[Turmas] Error details:', result);
            }
            
        } catch (error) {
            console.error('❌ Error creating sample turma:', error);
            showNotification('❌ Erro ao criar turma: ' + error.message, 'error');
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
            }
        } catch (error) {
            console.error('❌ Error loading turmas:', error);
        }
    }
    
    // Update statistics
    function updateStats(turmas) {
        const totalElement = document.querySelector('.stat-card-enhanced:nth-child(1) .stat-number');
        const activeElement = document.querySelector('.stat-card-enhanced:nth-child(2) .stat-number');
        
        if (totalElement) totalElement.textContent = turmas.length;
        if (activeElement) {
            const active = turmas.filter(t => t.status === 'active').length;
            activeElement.textContent = active;
        }
    }
    
    // Render turmas list
    function renderTurmasList(turmas) {
        const container = document.querySelector('.empty-state');
        if (!container || turmas.length === 0) return;
        
        container.innerHTML = `
            <div class="turmas-list">
                <h3>Suas Turmas</h3>
                <div class="turmas-grid">
                    ${turmas.map(turma => `
                        <div class="turma-card">
                            <div class="turma-header">
                                <h4>${turma.course?.name || 'Curso'}</h4>
                                <span class="status-badge status-${turma.status}">${getStatusText(turma.status)}</span>
                            </div>
                            <div class="turma-info">
                                <p><strong>Instrutor:</strong> ${turma.instructor?.name || 'Não definido'}</p>
                                <p><strong>Alunos:</strong> ${turma.students?.length || 0}</p>
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
        if (window.router && typeof window.router.navigateTo === 'function') {
            window.router.navigateTo(`turma-editor/${turmaId}`);
        } else {
            window.location.hash = `turma-editor/${turmaId}`;
        }
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
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
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
        return statusMap[status] || status;
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
    
    // Utility functions
    function waitForElement(selector, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }
            
            const observer = new MutationObserver(() => {
                const element = document.querySelector(selector);
                if (element) {
                    observer.disconnect();
                    resolve(element);
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            
            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Element ${selector} not found within ${timeout}ms`));
            }, timeout);
        });
    }
    
    function getStatusText(status) {
        switch (status) {
            case 'active': return 'Ativa';
            case 'inactive': return 'Inativa';
            case 'completed': return 'Concluída';
            case 'cancelled': return 'Cancelada';
            default: return 'Indefinido';
        }
    }
    
    function formatDate(date) {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('pt-BR');
    }
    
    function showNotification(message, type = 'info') {
        if (window.app && window.app.showNotification) {
            window.app.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
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
    
    console.log('👥 Turmas Module - Loaded');
})();
