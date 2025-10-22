/**
 * AI View - Handles UI rendering for AI Dashboard
 * Manages DOM manipulation and user interactions
 */

class AIView {
    constructor(app) {
        this.app = app;
        this.container = null;
        this.currentView = null;
        this.isDarkMode = false;
        
        this.init();
    }

    init() {
        console.log('AI View initialized');
        this.createContainer();
        this.setupEventListeners();
        this.applyTheme();
    }

    /**
     * Render the view into a target container
     * @param {HTMLElement} targetContainer - Optional target container
     */
    render(targetContainer = null) {
        const target = targetContainer || this.container?.parentNode || document.getElementById('module-container');
        
        if (!target) {
            console.error('❌ AI View: No target container found for rendering');
            return;
        }
        
        // Clear target and append AI dashboard
        target.innerHTML = '';
        target.appendChild(this.container);
        
        console.log('✅ AI View rendered successfully');
    }

    /**
     * Create main container for AI Dashboard
     */
    createContainer() {
        // Create main container
        this.container = document.createElement('div');
        this.container.id = 'ai-dashboard-container';
        this.container.className = 'ai-dashboard-container';
        this.container.innerHTML = `
            <div class="ai-dashboard-header">
                <div class="ai-dashboard-header-content">
                    <h1 class="ai-dashboard-title">
                        <i class="fas fa-brain"></i>
                        AI Student Data Agent
                    </h1>
                    <div class="ai-dashboard-header-actions">
                        <button class="btn btn-secondary" id="ai-dashboard-refresh-btn">
                            <i class="fas fa-sync-alt"></i> Atualizar
                        </button>
                        <button class="btn btn-secondary" id="ai-dashboard-export-btn">
                            <i class="fas fa-download"></i> Exportar
                        </button>
                        <button class="btn btn-secondary" id="ai-dashboard-connection-btn">
                            <i class="fas fa-plug"></i> Testar Conexão
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="ai-dashboard-main-content">
                <div class="ai-dashboard-sidebar">
                    <div class="ai-dashboard-search-section">
                        <h3>Buscar Aluno</h3>
                        <div class="ai-dashboard-search-form">
                            <input type="text" 
                                   id="ai-dashboard-student-id" 
                                   class="ai-dashboard-student-id-input" 
                                   placeholder="ID do Aluno (ex: 1)" 
                                   value="1">
                            <button class="btn btn-primary" id="ai-dashboard-search-btn">
                                <i class="fas fa-search"></i> Buscar
                            </button>
                        </div>
                    </div>
                    
                    <div class="ai-dashboard-tools-section">
                        <h3>Ferramentas AI</h3>
                        <div class="ai-dashboard-tools-list">
                            <button class="ai-dashboard-tool-btn" data-tool="analyze_student">
                                <i class="fas fa-user-check"></i> Analisar Aluno
                            </button>
                            <button class="ai-dashboard-tool-btn" data-tool="recommend_courses">
                                <i class="fas fa-graduation-cap"></i> Recomendar Cursos
                            </button>
                            <button class="ai-dashboard-tool-btn" data-tool="analyze_attendance">
                                <i class="fas fa-chart-line"></i> Analisar Frequência
                            </button>
                        </div>
                    </div>
                    
                    <div class="ai-dashboard-analytics-section">
                        <h3>Métricas do Sistema</h3>
                        <div class="ai-dashboard-analytics-grid" id="ai-dashboard-analytics-grid">
                            <!-- Analytics will be populated here -->
                        </div>
                    </div>
                </div>
                
                <div class="ai-dashboard-content">
                    <div class="ai-dashboard-tabs">
                        <button class="ai-dashboard-tab-btn active" data-tab="overview">
                            <i class="fas fa-info-circle"></i> Visão Geral
                        </button>
                        <button class="ai-dashboard-tab-btn" data-tab="courses">
                            <i class="fas fa-book"></i> Cursos
                        </button>
                        <button class="ai-dashboard-tab-btn" data-tab="attendance">
                            <i class="fas fa-calendar-check"></i> Frequência
                        </button>
                        <button class="ai-dashboard-tab-btn" data-tab="insights">
                            <i class="fas fa-lightbulb"></i> Insights AI
                        </button>
                        <button class="ai-dashboard-tab-btn" data-tab="agents">
                            <i class="fas fa-robot"></i> Agentes IA
                        </button>
                    </div>
                    
                    <div class="ai-dashboard-tab-content">
                        <div class="ai-dashboard-tab-pane active" id="ai-dashboard-overview">
                            <div class="ai-dashboard-overview-grid">
                                <div class="ai-dashboard-card">
                                    <div class="ai-dashboard-card-header">
                                        <h3>Informações do Aluno</h3>
                                    </div>
                                    <div class="ai-dashboard-card-body" id="ai-dashboard-student-info">
                                        <!-- Student info will be populated here -->
                                    </div>
                                </div>
                                
                                <div class="ai-dashboard-card">
                                    <div class="ai-dashboard-card-header">
                                        <h3>Progresso Geral</h3>
                                    </div>
                                    <div class="ai-dashboard-card-body" id="ai-dashboard-progress-overview">
                                        <!-- Progress overview will be populated here -->
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="ai-dashboard-tab-pane" id="ai-dashboard-courses">
                            <div class="ai-dashboard-courses-list" id="ai-dashboard-courses-list">
                                <!-- Courses will be populated here -->
                            </div>
                        </div>
                        
                        <div class="ai-dashboard-tab-pane" id="ai-dashboard-attendance">
                            <div class="ai-dashboard-attendance-list" id="ai-dashboard-attendance-list">
                                <!-- Attendance will be populated here -->
                            </div>
                        </div>
                        
                        <div class="ai-dashboard-tab-pane" id="ai-dashboard-insights">
                            <div class="ai-dashboard-insights-container">
                                <div class="ai-dashboard-insights-header">
                                    <h3>Insights AI</h3>
                                    <button class="btn btn-primary" id="ai-dashboard-generate-insights">
                                        <i class="fas fa-magic"></i> Gerar Insights
                                    </button>
                                </div>
                                <div class="ai-dashboard-insights-content" id="ai-dashboard-insights-content">
                                    <!-- Insights will be populated here -->
                                </div>
                            </div>
                        </div>
                        
                        <div class="ai-dashboard-tab-pane" id="ai-dashboard-agents">
                            <div class="agents-container">
                                <div class="agents-header">
                                    <div class="agents-header-content">
                                        <h2>🤖 Agentes IA</h2>
                                        <p>Configure agentes especializados com acesso a RAG e ferramentas do sistema</p>
                                    </div>
                                    <div class="agents-header-actions">
                                        <button class="btn btn-primary" id="ai-create-agent-btn">
                                            <i class="fas fa-plus"></i> Novo Agente
                                        </button>
                                    </div>
                                </div>
                                
                                <div class="agents-filters">
                                    <select id="agents-filter-specialization" class="filter-select">
                                        <option value="all">Todas as especializações</option>
                                        <option value="pedagogical">🎓 Pedagógico</option>
                                        <option value="analytical">📊 Analítico</option>
                                        <option value="support">💬 Suporte</option>
                                        <option value="progression">🎯 Progressão</option>
                                        <option value="commercial">💰 Comercial</option>
                                    </select>
                                    
                                    <select id="agents-filter-status" class="filter-select">
                                        <option value="all">Todos os status</option>
                                        <option value="active">Ativos</option>
                                        <option value="inactive">Inativos</option>
                                    </select>
                                </div>
                                
                                <div class="agents-list" id="ai-agents-list">
                                    <!-- Agents will be populated here -->
                                    <div class="empty-state">
                                        <div class="empty-icon">🤖</div>
                                        <h3>Nenhum agente cadastrado</h3>
                                        <p>Crie seu primeiro agente IA para começar</p>
                                        <button class="btn btn-primary" onclick="document.getElementById('ai-create-agent-btn').click()">
                                            <i class="fas fa-plus"></i> Criar Primeiro Agente
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="ai-dashboard-loading" id="ai-dashboard-loading" style="display: none;">
                <div class="ai-dashboard-loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
                <div class="ai-dashboard-loading-text">Carregando...</div>
            </div>
            
            <div class="ai-dashboard-notification" id="ai-dashboard-notification"></div>
        `;
        
        document.body.appendChild(this.container);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('ai-dashboard-student-id');
        const searchBtn = document.getElementById('ai-dashboard-search-btn');
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch();
            }
        });
        
        searchBtn.addEventListener('click', () => {
            this.handleSearch();
        });

        // Tab navigation
        document.querySelectorAll('.ai-dashboard-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Tool buttons
        document.querySelectorAll('.ai-dashboard-tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.executeTool(e.target.dataset.tool);
            });
        });

        // Action buttons
        document.getElementById('ai-dashboard-refresh-btn').addEventListener('click', () => {
            this.emitEvent('ai-dashboard-refresh-data');
        });

        document.getElementById('ai-dashboard-export-btn').addEventListener('click', () => {
            this.showExportOptions();
        });

        document.getElementById('ai-dashboard-connection-btn').addEventListener('click', () => {
            this.emitEvent('ai-dashboard-test-connection');
        });

        document.getElementById('ai-dashboard-generate-insights').addEventListener('click', () => {
            this.emitEvent('ai-dashboard-generate-insights');
        });

        // Agents tab event listeners
        const createAgentBtn = document.getElementById('ai-create-agent-btn');
        if (createAgentBtn) {
            createAgentBtn.addEventListener('click', () => {
                this.showAgentForm();
            });
        }

        const agentSpecializationFilter = document.getElementById('agents-filter-specialization');
        if (agentSpecializationFilter) {
            agentSpecializationFilter.addEventListener('change', (e) => {
                this.filterAgents(e.target.value, null);
            });
        }

        const agentStatusFilter = document.getElementById('agents-filter-status');
        if (agentStatusFilter) {
            agentStatusFilter.addEventListener('change', (e) => {
                this.filterAgents(null, e.target.value);
            });
        }
    }

    /**
     * Handle search
     */
    handleSearch() {
        const studentId = document.getElementById('ai-dashboard-student-id').value.trim();
        if (studentId) {
            this.emitEvent('ai-student-id-change', { studentId });
        }
    }

    /**
     * Switch between tabs
     * @param {string} tabName - Tab name to switch to
     */
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.ai-dashboard-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab content
        document.querySelectorAll('.ai-dashboard-tab-pane').forEach(pane => {
            pane.classList.toggle('active', pane.id === `ai-dashboard-${tabName}`);
        });

        this.currentView = tabName;

        // Load agents when switching to agents tab
        if (tabName === 'agents') {
            this.loadAgents();
        }
    }

    /**
     * Update student data in the view
     * @param {Object} data - Student data
     */
    updateStudentData(data) {
        if (!data || !data.student) {
            return;
        }

        const student = data.student;
        
        // Update student info
        const studentInfo = document.getElementById('ai-dashboard-student-info');
        studentInfo.innerHTML = `
            <div class="ai-dashboard-info-row">
                <label><i class="fas fa-id-card"></i> ID:</label>
                <span>${student.id}</span>
            </div>
            <div class="ai-dashboard-info-row">
                <label><i class="fas fa-user"></i> Nome:</label>
                <span>${student.fullName}</span>
            </div>
            <div class="ai-dashboard-info-row">
                <label><i class="fas fa-envelope"></i> Email:</label>
                <span>${student.email || 'Não informado'}</span>
            </div>
            <div class="ai-dashboard-info-row">
                <label><i class="fas fa-phone"></i> Telefone:</label>
                <span>${student.phone || 'Não informado'}</span>
            </div>
            <div class="ai-dashboard-info-row">
                <label><i class="fas fa-birthday-cake"></i> Data de Nascimento:</label>
                <span>${student.formattedBirthDate || 'Não informada'}</span>
            </div>
            <div class="ai-dashboard-info-row">
                <label><i class="fas fa-tag"></i> Categoria:</label>
                <span>${student.category}</span>
            </div>
            <div class="ai-dashboard-info-row">
                <label><i class="fas fa-check-circle"></i> Status:</label>
                <span class="ai-dashboard-status ${student.isActive ? 'active' : 'inactive'}">
                    ${student.isActive}
                </span>
            </div>
        `;

        // Update progress overview
        const progressOverview = document.getElementById('ai-dashboard-progress-overview');
        progressOverview.innerHTML = `
            <div class="ai-dashboard-progress-item">
                <div class="ai-dashboard-progress-label">
                    <i class="fas fa-clipboard-list"></i> Assinaturas Ativas
                </div>
                <div class="ai-dashboard-progress-value">${student.subscriptionsCount}</div>
            </div>
            <div class="ai-dashboard-progress-item">
                <div class="ai-dashboard-progress-label">
                    <i class="fas fa-graduation-cap"></i> Cursos Inscritos
                </div>
                <div class="ai-dashboard-progress-value">${student.totalCourses}</div>
            </div>
            <div class="ai-dashboard-progress-item">
                <div class="ai-dashboard-progress-label">
                    <i class="fas fa-chart-line"></i> Progresso Médio
                </div>
                <div class="ai-dashboard-progress-value">${student.averageProgress}%</div>
            </div>
        `;

        // Update courses tab
        this.updateCoursesTab(data.courses);
        
        // Update attendance tab
        this.updateAttendanceTab(student.recentAttendance);
    }

    /**
     * Update courses tab
     * @param {Array} courses - Courses data
     */
    updateCoursesTab(courses) {
        const coursesList = document.getElementById('ai-dashboard-courses-list');
        
        if (!courses || courses.length === 0) {
            coursesList.innerHTML = `
                <div class="ai-dashboard-empty-state">
                    <i class="fas fa-book-open"></i>
                    <p>Nenhum curso encontrado</p>
                </div>
            `;
            return;
        }

        coursesList.innerHTML = courses.map(course => `
            <div class="ai-dashboard-course-card">
                <div class="ai-dashboard-course-header">
                    <h4>${course.name}</h4>
                    <span class="ai-dashboard-course-level">${course.level}</span>
                </div>
                <div class="ai-dashboard-course-body">
                    <div class="ai-dashboard-course-info">
                        <div class="ai-dashboard-course-stat">
                            <i class="fas fa-clock"></i>
                            <span>${course.formattedDuration}</span>
                        </div>
                        <div class="ai-dashboard-course-stat">
                            <i class="fas fa-users"></i>
                            <span>${course.enrolledStudentsCount} alunos</span>
                        </div>
                        <div class="ai-dashboard-course-stat">
                            <i class="fas fa-calendar-alt"></i>
                            <span>${course.upcomingClassesCount} próximas</span>
                        </div>
                    </div>
                    ${course.description ? `
                        <div class="ai-dashboard-course-description">
                            ${course.description}
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    /**
     * Update attendance tab
     * @param {Array} attendance - Attendance data
     */
    updateAttendanceTab(attendance) {
        const attendanceList = document.getElementById('ai-dashboard-attendance-list');
        
        if (!attendance || attendance.length === 0) {
            attendanceList.innerHTML = `
                <div class="ai-dashboard-empty-state">
                    <i class="fas fa-calendar-check"></i>
                    <p>Nenhum registro de frequência encontrado</p>
                </div>
            `;
            return;
        }

        attendanceList.innerHTML = attendance.slice(0, 10).map(record => `
            <div class="ai-dashboard-attendance-item">
                <div class="ai-dashboard-attendance-date">
                    ${new Date(record.createdAt).toLocaleDateString('pt-BR')}
                </div>
                <div class="ai-dashboard-attendance-class">
                    ${record.class?.title || 'Aula não identificada'}
                </div>
                <div class="ai-dashboard-attendance-status">
                    <span class="ai-dashboard-status ${record.status.toLowerCase()}">
                        ${record.status}
                    </span>
                </div>
                <div class="ai-dashboard-attendance-time">
                    ${record.checkInTime ? 
                        new Date(record.checkInTime).toLocaleTimeString('pt-BR') : 
                        'Não registrado'
                    }
                </div>
            </div>
        `).join('');
    }

    /**
     * Update analytics display
     * @param {Object} analytics - Analytics data
     */
    updateAnalytics(analytics) {
        const analyticsGrid = document.getElementById('ai-dashboard-analytics-grid');
        
        if (!analytics) {
            analyticsGrid.innerHTML = `
                <div class="ai-dashboard-empty-state">
                    <i class="fas fa-chart-bar"></i>
                    <p>Nenhuma métrica disponível</p>
                </div>
            `;
            return;
        }

        analyticsGrid.innerHTML = `
            <div class="ai-dashboard-analytics-item">
                <div class="ai-dashboard-analytics-icon">
                    <i class="fas fa-users"></i>
                </div>
                <div class="ai-dashboard-analytics-content">
                    <div class="ai-dashboard-analytics-value">
                        ${analytics.students?.total || 0}
                    </div>
                    <div class="ai-dashboard-analytics-label">Total de Alunos</div>
                </div>
            </div>
            <div class="ai-dashboard-analytics-item">
                <div class="ai-dashboard-analytics-icon">
                    <i class="fas fa-user-check"></i>
                </div>
                <div class="ai-dashboard-analytics-content">
                    <div class="ai-dashboard-analytics-value">
                        ${analytics.students?.active || 0}
                    </div>
                    <div class="ai-dashboard-analytics-label">Alunos Ativos</div>
                </div>
            </div>
            <div class="ai-dashboard-analytics-item">
                <div class="ai-dashboard-analytics-icon">
                    <i class="fas fa-book"></i>
                </div>
                <div class="ai-dashboard-analytics-content">
                    <div class="ai-dashboard-analytics-value">
                        ${analytics.courses?.total || 0}
                    </div>
                    <div class="ai-dashboard-analytics-label">Cursos Disponíveis</div>
                </div>
            </div>
            <div class="ai-dashboard-analytics-item">
                <div class="ai-dashboard-analytics-icon">
                    <i class="fas fa-calendar-check"></i>
                </div>
                <div class="ai-dashboard-analytics-content">
                    <div class="ai-dashboard-analytics-value">
                        ${analytics.attendance?.last30Days || 0}
                    </div>
                    <div class="ai-dashboard-analytics-label">Frequência (30 dias)</div>
                </div>
            </div>
        `;
    }

    /**
     * Display AI insights
     * @param {Object} insights - Insights data
     */
    displayAIInsights(insights) {
        const insightsContent = document.getElementById('ai-dashboard-insights-content');
        
        if (!insights) {
            insightsContent.innerHTML = `
                <div class="ai-dashboard-empty-state">
                    <i class="fas fa-lightbulb"></i>
                    <p>Nenhum insight disponível</p>
                </div>
            `;
            return;
        }

        insightsContent.innerHTML = `
            <div class="ai-dashboard-insights-section">
                <h4>Resumo</h4>
                <div class="ai-dashboard-insights-summary">
                    ${insights.summary || 'Nenhum resumo disponível'}
                </div>
            </div>
            
            ${insights.recommendations && insights.recommendations.length > 0 ? `
                <div class="ai-dashboard-insights-section">
                    <h4>Recomendações</h4>
                    <div class="ai-dashboard-insights-list">
                        ${insights.recommendations.map(rec => `
                            <div class="ai-dashboard-insight-item">
                                <i class="fas fa-check-circle"></i>
                                ${rec}
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${insights.insights && insights.insights.length > 0 ? `
                <div class="ai-dashboard-insights-section">
                    <h4>Insights</h4>
                    <div class="ai-dashboard-insights-list">
                        ${insights.insights.map(insight => `
                            <div class="ai-dashboard-insight-item">
                                <i class="fas fa-info-circle"></i>
                                ${insight}
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <div class="ai-dashboard-insights-meta">
                <small>Processado em: ${new Date(insights.processedAt).toLocaleString('pt-BR')}</small>
            </div>
        `;
    }

    /**
     * Execute tool
     * @param {string} tool - Tool to execute
     */
    executeTool(tool) {
        this.emitEvent('ai-execute-tool', { tool });
    }

    /**
     * Show loading state
     * @param {string} message - Loading message
     */
    showLoading(message = 'Carregando...') {
        const loading = document.getElementById('ai-dashboard-loading');
        const loadingText = loading.querySelector('.ai-dashboard-loading-text');
        
        loadingText.textContent = message;
        loading.style.display = 'flex';
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        const loading = document.getElementById('ai-dashboard-loading');
        loading.style.display = 'none';
    }

    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        this.showNotification(message, 'error');
    }

    /**
     * Show notification
     * @param {string} message - Message to show
     * @param {string} type - Notification type
     */
    showNotification(message, type = 'info') {
        const notification = document.getElementById('ai-dashboard-notification');
        
        notification.className = `ai-dashboard-notification ai-dashboard-notification-${type}`;
        notification.innerHTML = `
            <div class="ai-dashboard-notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        notification.style.display = 'block';
        
        setTimeout(() => {
            notification.style.display = 'none';
        }, 5000);
    }

    /**
     * Show export options
     */
    showExportOptions() {
        const options = [
            { value: 'json', label: 'JSON' },
            { value: 'csv', label: 'CSV' }
        ];
        
        const exportMenu = document.createElement('div');
        exportMenu.className = 'ai-dashboard-export-menu';
        exportMenu.innerHTML = `
            <div class="ai-dashboard-export-title">Exportar Dados</div>
            ${options.map(option => `
                <button class="ai-dashboard-export-option" data-format="${option.value}">
                    <i class="fas fa-file-export"></i> ${option.label}
                </button>
            `).join('')}
        `;
        
        document.body.appendChild(exportMenu);
        
        // Handle option selection
        exportMenu.querySelectorAll('.ai-dashboard-export-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.emitEvent('ai-dashboard-export-data', { format: e.target.dataset.format });
                document.body.removeChild(exportMenu);
            });
        });
        
        // Close on outside click
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!exportMenu.contains(e.target)) {
                    document.body.removeChild(exportMenu);
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 100);
    }

    /**
     * Clear data display
     */
    clearData() {
        document.getElementById('ai-dashboard-student-info').innerHTML = '';
        document.getElementById('ai-dashboard-courses-list').innerHTML = '';
        document.getElementById('ai-dashboard-attendance-list').innerHTML = '';
        document.getElementById('ai-dashboard-insights-content').innerHTML = '';
        document.getElementById('ai-dashboard-analytics-grid').innerHTML = '';
    }

    /**
     * Apply theme
     * @param {string} theme - Theme to apply
     */
    applyTheme(theme) {
        if (theme) {
            this.isDarkMode = theme === 'dark';
        } else {
            this.isDarkMode = document.body.classList.contains('dark-theme');
        }
        
        if (this.isDarkMode) {
            this.container.classList.add('ai-dashboard-dark-mode');
        } else {
            this.container.classList.remove('ai-dashboard-dark-mode');
        }
    }

    /**
     * Emit custom event
     * @param {string} eventName - Event name
     * @param {Object} detail - Event detail
     */
    emitEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, { detail });
        document.dispatchEvent(event);
    }

    // ========================================
    // AGENTS TAB METHODS
    // ========================================

    /**
     * Render agents list
     * @param {Array} agents - List of AI agents
     */
    renderAgentsList(agents = []) {
        const container = document.getElementById('ai-agents-list');
        if (!container) return;

        if (!agents || agents.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 60px 20px;">
                    <i class="fas fa-robot" style="font-size: 64px; color: var(--primary-color); opacity: 0.3; margin-bottom: 20px;"></i>
                    <h3 style="color: var(--text-color); margin-bottom: 10px;">Nenhum agente cadastrado</h3>
                    <p style="color: var(--text-muted); margin-bottom: 30px;">
                        Crie seu primeiro agente de IA para começar a automatizar processos
                    </p>
                    <button class="btn-primary" onclick="window.ai?.view?.showAgentForm()">
                        <i class="fas fa-plus"></i> Criar Primeiro Agente
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="agents-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px;">
                ${agents.map(agent => this.renderAgentCard(agent)).join('')}
            </div>
        `;
    }

    /**
     * Render individual agent card
     * @param {Object} agent - Agent object
     * @returns {string} HTML string
     */
    renderAgentCard(agent) {
        const icons = {
            pedagogical: '🎓',
            analytical: '📊',
            support: '💬',
            progression: '🎯',
            commercial: '💰'
        };

        const icon = icons[agent.specialization] || '🤖';
        const statusClass = agent.isActive ? 'active' : 'inactive';
        const statusText = agent.isActive ? 'Ativo' : 'Inativo';
        const interactionCount = agent._count?.conversations || 0;
        const avgRating = agent.averageRating ? agent.averageRating.toFixed(1) : 'N/A';

        return `
            <div class="agent-card module-isolated-ai-agent-card" data-agent-id="${agent.id}" style="
                background: var(--card-background);
                border: 1px solid var(--border-color);
                border-radius: 12px;
                padding: 24px;
                transition: all 0.3s ease;
                cursor: pointer;
            ">
                <div class="agent-card-header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="font-size: 32px;">${icon}</span>
                        <div>
                            <h3 style="margin: 0; font-size: 18px; color: var(--text-color);">${agent.name}</h3>
                            <span class="agent-status status-${statusClass}" style="
                                display: inline-block;
                                padding: 4px 12px;
                                border-radius: 12px;
                                font-size: 12px;
                                font-weight: 600;
                                background: ${agent.isActive ? 'var(--success-color)' : 'var(--warning-color)'};
                                color: white;
                                margin-top: 4px;
                            ">${statusText}</span>
                        </div>
                    </div>
                </div>

                <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 16px; line-height: 1.6;">
                    ${agent.description || 'Sem descrição'}
                </p>

                <div class="agent-stats" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px;">
                    <div style="text-align: center; padding: 12px; background: var(--background-secondary); border-radius: 8px;">
                        <div style="font-size: 20px; font-weight: 600; color: var(--primary-color);">${interactionCount}</div>
                        <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Interações</div>
                    </div>
                    <div style="text-align: center; padding: 12px; background: var(--background-secondary); border-radius: 8px;">
                        <div style="font-size: 20px; font-weight: 600; color: var(--primary-color);">
                            ${avgRating} <i class="fas fa-star" style="font-size: 14px; color: #FFC107;"></i>
                        </div>
                        <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Avaliação</div>
                    </div>
                    <div style="text-align: center; padding: 12px; background: var(--background-secondary); border-radius: 8px;">
                        <div style="font-size: 20px; font-weight: 600; color: var(--primary-color);">${agent.model === 'gemini-1.5-pro' ? 'Pro' : 'Flash'}</div>
                        <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Modelo</div>
                    </div>
                </div>

                <div class="agent-actions" style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <button class="btn-secondary btn-sm" onclick="window.ai?.view?.chatWithAgent('${agent.id}'); event.stopPropagation();" style="
                        flex: 1;
                        padding: 8px 12px;
                        border-radius: 6px;
                        border: 1px solid var(--primary-color);
                        background: transparent;
                        color: var(--primary-color);
                        font-size: 13px;
                        cursor: pointer;
                    ">
                        <i class="fas fa-comments"></i> Chat
                    </button>
                    <button class="btn-secondary btn-sm" onclick="window.ai?.view?.showAgentForm('${agent.id}'); event.stopPropagation();" style="
                        flex: 1;
                        padding: 8px 12px;
                        border-radius: 6px;
                        border: 1px solid var(--border-color);
                        background: transparent;
                        color: var(--text-color);
                        font-size: 13px;
                        cursor: pointer;
                    ">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn-secondary btn-sm" onclick="window.ai?.view?.toggleAgent('${agent.id}'); event.stopPropagation();" style="
                        padding: 8px 12px;
                        border-radius: 6px;
                        border: 1px solid var(--border-color);
                        background: transparent;
                        color: var(--text-color);
                        font-size: 13px;
                        cursor: pointer;
                    ">
                        <i class="fas fa-power-off"></i>
                    </button>
                    <button class="btn-secondary btn-sm btn-danger" onclick="window.ai?.view?.deleteAgent('${agent.id}'); event.stopPropagation();" style="
                        padding: 8px 12px;
                        border-radius: 6px;
                        border: 1px solid var(--danger-color);
                        background: transparent;
                        color: var(--danger-color);
                        font-size: 13px;
                        cursor: pointer;
                    ">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Show agent creation/edit form
     * @param {string|null} agentId - Agent ID for editing, null for creating
     */
    async showAgentForm(agentId = null) {
        const isEdit = !!agentId;
        let agent = null;

        if (isEdit) {
            // TODO: Fetch agent data from API
            // agent = await fetch(`/api/agents/${agentId}`).then(r => r.json());
            this.showNotification('Função de edição em desenvolvimento', 'info');
            return;
        }

        const formHtml = `
            <div class="modal-overlay" id="agent-form-modal" style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                padding: 20px;
            ">
                <div class="modal-content" style="
                    background: var(--card-background);
                    border-radius: 16px;
                    max-width: 800px;
                    width: 100%;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                ">
                    <div class="modal-header" style="
                        padding: 24px;
                        border-bottom: 1px solid var(--border-color);
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                    ">
                        <h2 style="margin: 0; color: var(--text-color);">
                            <i class="fas fa-robot"></i> ${isEdit ? 'Editar Agente' : 'Novo Agente'}
                        </h2>
                        <button onclick="document.getElementById('agent-form-modal').remove();" style="
                            background: none;
                            border: none;
                            font-size: 24px;
                            color: var(--text-muted);
                            cursor: pointer;
                        ">×</button>
                    </div>

                    <form id="agent-form" style="padding: 24px;">
                        <!-- Basic Info -->
                        <div class="form-section" style="margin-bottom: 24px;">
                            <h3 style="font-size: 16px; color: var(--text-color); margin-bottom: 16px;">
                                <i class="fas fa-info-circle"></i> Informações Básicas
                            </h3>
                            
                            <div class="form-group" style="margin-bottom: 16px;">
                                <label style="display: block; margin-bottom: 8px; color: var(--text-color); font-weight: 500;">
                                    Nome do Agente <span style="color: var(--danger-color);">*</span>
                                </label>
                                <input type="text" name="name" required 
                                    placeholder="Ex: Assistente Pedagógico" 
                                    value="${agent?.name || ''}"
                                    style="width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--background-secondary);">
                            </div>

                            <div class="form-group" style="margin-bottom: 16px;">
                                <label style="display: block; margin-bottom: 8px; color: var(--text-color); font-weight: 500;">
                                    Descrição
                                </label>
                                <textarea name="description" rows="3" 
                                    placeholder="Descreva o propósito deste agente..."
                                    style="width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--background-secondary); resize: vertical;"
                                >${agent?.description || ''}</textarea>
                            </div>

                            <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                                <div class="form-group">
                                    <label style="display: block; margin-bottom: 8px; color: var(--text-color); font-weight: 500;">
                                        Especialização <span style="color: var(--danger-color);">*</span>
                                    </label>
                                    <select name="specialization" required style="width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--background-secondary);">
                                        <option value="pedagogical">🎓 Pedagógico</option>
                                        <option value="analytical">📊 Analítico</option>
                                        <option value="support">💬 Suporte</option>
                                        <option value="progression">🎯 Progressão</option>
                                        <option value="commercial">💰 Comercial</option>
                                    </select>
                                </div>

                                <div class="form-group">
                                    <label style="display: block; margin-bottom: 8px; color: var(--text-color); font-weight: 500;">
                                        Modelo IA <span style="color: var(--danger-color);">*</span>
                                    </label>
                                    <select name="model" required style="width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--background-secondary);">
                                        <option value="gemini-1.5-flash">Gemini 1.5 Flash (Rápido)</option>
                                        <option value="gemini-1.5-pro">Gemini 1.5 Pro (Avançado)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <!-- System Prompt -->
                        <div class="form-section" style="margin-bottom: 24px;">
                            <h3 style="font-size: 16px; color: var(--text-color); margin-bottom: 16px;">
                                <i class="fas fa-code"></i> Prompt do Sistema
                            </h3>
                            <div class="form-group">
                                <label style="display: block; margin-bottom: 8px; color: var(--text-color); font-weight: 500;">
                                    Instruções para o Agente <span style="color: var(--danger-color);">*</span>
                                </label>
                                <textarea name="systemPrompt" rows="6" required
                                    placeholder="Você é um assistente especializado em... Suas responsabilidades incluem..."
                                    style="width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--background-secondary); font-family: 'Courier New', monospace; font-size: 13px; resize: vertical;"
                                >${agent?.systemPrompt || ''}</textarea>
                                <small style="color: var(--text-muted); display: block; margin-top: 4px;">
                                    Define o comportamento e personalidade do agente. Seja específico e claro.
                                </small>
                            </div>
                        </div>

                        <!-- RAG Sources -->
                        <div class="form-section" style="margin-bottom: 24px;">
                            <h3 style="font-size: 16px; color: var(--text-color); margin-bottom: 16px;">
                                <i class="fas fa-database"></i> Fontes de Conhecimento (RAG)
                            </h3>
                            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
                                <label style="display: flex; align-items: center; gap: 8px; padding: 12px; border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; transition: all 0.2s;">
                                    <input type="checkbox" name="ragSources" value="courses">
                                    <span style="color: var(--text-color);">📚 Cursos e Programas</span>
                                </label>
                                <label style="display: flex; align-items: center; gap: 8px; padding: 12px; border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer;">
                                    <input type="checkbox" name="ragSources" value="techniques">
                                    <span style="color: var(--text-color);">🥋 Técnicas e Golpes</span>
                                </label>
                                <label style="display: flex; align-items: center; gap: 8px; padding: 12px; border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer;">
                                    <input type="checkbox" name="ragSources" value="faqs">
                                    <span style="color: var(--text-color);">❓ FAQs e Documentação</span>
                                </label>
                                <label style="display: flex; align-items: center; gap: 8px; padding: 12px; border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer;">
                                    <input type="checkbox" name="ragSources" value="evaluations">
                                    <span style="color: var(--text-color);">📊 Avaliações e Feedbacks</span>
                                </label>
                            </div>
                        </div>

                        <!-- MCP Tools -->
                        <div class="form-section" style="margin-bottom: 24px;">
                            <h3 style="font-size: 16px; color: var(--text-color); margin-bottom: 16px;">
                                <i class="fas fa-tools"></i> Ferramentas MCP (Ações)
                            </h3>
                            <div style="display: grid; grid-template-columns: 1fr; gap: 12px;">
                                <label style="display: flex; align-items: center; gap: 8px; padding: 12px; border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer;">
                                    <input type="checkbox" name="mcpTools" value="getStudentData">
                                    <div>
                                        <div style="color: var(--text-color); font-weight: 500;">getStudentData</div>
                                        <small style="color: var(--text-muted);">Buscar dados completos de alunos</small>
                                    </div>
                                </label>
                                <label style="display: flex; align-items: center; gap: 8px; padding: 12px; border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer;">
                                    <input type="checkbox" name="mcpTools" value="getCourseData">
                                    <div>
                                        <div style="color: var(--text-color); font-weight: 500;">getCourseData</div>
                                        <small style="color: var(--text-muted);">Buscar informações de cursos e turmas</small>
                                    </div>
                                </label>
                                <label style="display: flex; align-items: center; gap: 8px; padding: 12px; border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer;">
                                    <input type="checkbox" name="mcpTools" value="executeQuery">
                                    <div>
                                        <div style="color: var(--text-color); font-weight: 500;">executeQuery</div>
                                        <small style="color: var(--text-muted);">Executar consultas personalizadas no banco</small>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <!-- Advanced Settings -->
                        <div class="form-section" style="margin-bottom: 24px;">
                            <h3 style="font-size: 16px; color: var(--text-color); margin-bottom: 16px;">
                                <i class="fas fa-sliders-h"></i> Configurações Avançadas
                            </h3>
                            <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                                <div class="form-group">
                                    <label style="display: block; margin-bottom: 8px; color: var(--text-color); font-weight: 500;">
                                        Temperatura (Criatividade)
                                    </label>
                                    <input type="range" name="temperature" min="0" max="1" step="0.1" value="0.7"
                                        oninput="this.nextElementSibling.textContent = this.value"
                                        style="width: 100%;">
                                    <span style="color: var(--text-muted); font-size: 14px;">0.7</span>
                                </div>
                                <div class="form-group">
                                    <label style="display: block; margin-bottom: 8px; color: var(--text-color); font-weight: 500;">
                                        Max Tokens
                                    </label>
                                    <input type="number" name="maxTokens" value="2048" min="256" max="8192" step="256"
                                        style="width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--background-secondary);">
                                </div>
                            </div>
                            <div class="form-group" style="margin-top: 16px;">
                                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                    <input type="checkbox" name="isActive" checked>
                                    <span style="color: var(--text-color);">Agente ativo (disponível para uso)</span>
                                </label>
                            </div>
                        </div>

                        <!-- Form Actions -->
                        <div style="display: flex; gap: 12px; justify-content: flex-end; padding-top: 24px; border-top: 1px solid var(--border-color);">
                            <button type="button" onclick="document.getElementById('agent-form-modal').remove();" style="
                                padding: 12px 24px;
                                border-radius: 8px;
                                border: 1px solid var(--border-color);
                                background: transparent;
                                color: var(--text-color);
                                cursor: pointer;
                                font-weight: 500;
                            ">Cancelar</button>
                            <button type="submit" style="
                                padding: 12px 24px;
                                border-radius: 8px;
                                border: none;
                                background: var(--primary-color);
                                color: white;
                                cursor: pointer;
                                font-weight: 500;
                            ">
                                <i class="fas fa-save"></i> ${isEdit ? 'Salvar Alterações' : 'Criar Agente'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', formHtml);

        // Form submission handler
        document.getElementById('agent-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveAgent(new FormData(e.target));
        });
    }

    /**
     * Save agent (create or update)
     * @param {FormData} formData - Form data
     */
    async saveAgent(formData) {
        const agentData = {
            name: formData.get('name'),
            description: formData.get('description'),
            specialization: formData.get('specialization'),
            model: formData.get('model'),
            systemPrompt: formData.get('systemPrompt'),
            ragSources: formData.getAll('ragSources'),
            mcpTools: formData.getAll('mcpTools'),
            temperature: parseFloat(formData.get('temperature')),
            maxTokens: parseInt(formData.get('maxTokens')),
            isActive: formData.get('isActive') === 'on',
            noCodeMode: true, // Always enforce no-code mode
            organizationId: localStorage.getItem('activeOrganizationId') || 'a55ad715-2eb0-493c-996c-bb0f60bacec9'
        };

        try {
            // TODO: Replace with actual API call
            console.log('Creating agent:', agentData);
            
            // Simulated API call
            // const response = await fetch('/api/agents', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(agentData)
            // });
            
            this.showNotification('Agente criado com sucesso! (Backend em desenvolvimento)', 'success');
            document.getElementById('agent-form-modal')?.remove();
            
            // Refresh agents list
            // await this.loadAgents();
        } catch (error) {
            console.error('Error saving agent:', error);
            this.showNotification('Erro ao salvar agente: ' + error.message, 'error');
        }
    }

    /**
     * Toggle agent active status
     * @param {string} agentId - Agent ID
     */
    async toggleAgent(agentId) {
        try {
            // TODO: Implement API call
            console.log('Toggling agent:', agentId);
            this.showNotification('Função em desenvolvimento', 'info');
        } catch (error) {
            console.error('Error toggling agent:', error);
            this.showNotification('Erro ao alterar status do agente', 'error');
        }
    }

    /**
     * Delete agent
     * @param {string} agentId - Agent ID
     */
    async deleteAgent(agentId) {
        if (!confirm('Tem certeza que deseja excluir este agente? Esta ação não pode ser desfeita.')) {
            return;
        }

        try {
            // TODO: Implement API call
            console.log('Deleting agent:', agentId);
            this.showNotification('Função em desenvolvimento', 'info');
        } catch (error) {
            console.error('Error deleting agent:', error);
            this.showNotification('Erro ao excluir agente', 'error');
        }
    }

    /**
     * Open chat interface with agent
     * @param {string} agentId - Agent ID
     */
    async chatWithAgent(agentId) {
        // TODO: Implement chat interface
        console.log('Opening chat with agent:', agentId);
        this.showNotification('Interface de chat em desenvolvimento', 'info');
    }

    /**
     * Load agents from API
     */
    async loadAgents() {
        try {
            // TODO: Replace with actual API call
            // const response = await fetch('/api/agents');
            // const agents = await response.json();
            
            // For now, render empty state
            this.renderAgentsList([]);
        } catch (error) {
            console.error('Error loading agents:', error);
            this.showNotification('Erro ao carregar agentes', 'error');
        }
    }

    /**
     * Filter agents by specialization and status
     * @param {string|null} specialization - Specialization filter
     * @param {string|null} status - Status filter (active/inactive)
     */
    async filterAgents(specialization, status) {
        try {
            // TODO: Implement filtering logic
            // This will filter the agents array based on selected filters
            console.log('Filtering agents:', { specialization, status });
            
            // For now, just reload all agents
            await this.loadAgents();
        } catch (error) {
            console.error('Error filtering agents:', error);
        }
    }

    /**
     * Remove container
     */
    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}

export { AIView };
export default AIView;
