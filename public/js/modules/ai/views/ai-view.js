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
