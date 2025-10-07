/**
 * RAG View - Handles UI rendering for RAG module
 * Manages DOM manipulation and user interactions
 */

class RAGView {
    constructor(app) {
        this.app = app;
        this.container = null;
        this.currentView = null;
        this.isDarkMode = false;
        
        this.init();
    }

    init() {
        console.log('RAG View initialized');
        this.createContainer();
        this.setupEventListeners();
        this.applyTheme();
    }

    /**
     * Create main container for RAG module
     */
    createContainer() {
        // Create main container
        this.container = document.createElement('div');
        this.container.id = 'rag-container';
        this.container.className = 'rag-container';
        this.container.innerHTML = `
            <div class="rag-header">
                <div class="rag-header-content">
                    <h1 class="rag-title">
                        <i class="fas fa-brain"></i>
                        RAG Student Data Agent
                    </h1>
                    <div class="rag-header-actions">
                        <button class="btn btn-secondary" id="rag-refresh-btn">
                            <i class="fas fa-sync-alt"></i> Atualizar
                        </button>
                        <button class="btn btn-secondary" id="rag-export-btn">
                            <i class="fas fa-download"></i> Exportar
                        </button>
                        <button class="btn btn-secondary" id="rag-connection-btn">
                            <i class="fas fa-plug"></i> Testar Conexão
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="rag-main-content">
                <div class="rag-sidebar">
                    <div class="rag-search-section">
                        <h3>Buscar Aluno</h3>
                        <div class="rag-search-form">
                            <input type="text" 
                                   id="rag-student-id" 
                                   class="rag-student-id-input" 
                                   placeholder="ID do Aluno (ex: 1)" 
                                   value="1">
                            <button class="btn btn-primary" id="rag-search-btn">
                                <i class="fas fa-search"></i> Buscar
                            </button>
                        </div>
                    </div>
                    
                    <div class="rag-tools-section">
                        <h3>Ferramentas RAG</h3>
                        <div class="rag-tools-list">
                            <button class="rag-tool-btn" data-tool="analyze_student">
                                <i class="fas fa-user-check"></i> Analisar Aluno
                            </button>
                            <button class="rag-tool-btn" data-tool="recommend_courses">
                                <i class="fas fa-graduation-cap"></i> Recomendar Cursos
                            </button>
                            <button class="rag-tool-btn" data-tool="analyze_attendance">
                                <i class="fas fa-chart-line"></i> Analisar Frequência
                            </button>
                        </div>
                    </div>
                    
                    <div class="rag-analytics-section">
                        <h3>Métricas do Sistema</h3>
                        <div class="rag-analytics-grid" id="rag-analytics-grid">
                            <!-- Analytics will be populated here -->
                        </div>
                    </div>
                </div>
                
                <div class="rag-content">
                    <div class="rag-tabs">
                        <button class="rag-tab-btn active" data-tab="overview">
                            <i class="fas fa-info-circle"></i> Visão Geral
                        </button>
                        <button class="rag-tab-btn" data-tab="courses">
                            <i class="fas fa-book"></i> Cursos
                        </button>
                        <button class="rag-tab-btn" data-tab="attendance">
                            <i class="fas fa-calendar-check"></i> Frequência
                        </button>
                        <button class="rag-tab-btn" data-tab="insights">
                            <i class="fas fa-lightbulb"></i> Insights RAG
                        </button>
                    </div>
                    
                    <div class="rag-tab-content">
                        <div class="rag-tab-pane active" id="rag-overview">
                            <div class="rag-overview-grid">
                                <div class="rag-card">
                                    <div class="rag-card-header">
                                        <h3>Informações do Aluno</h3>
                                    </div>
                                    <div class="rag-card-body" id="rag-student-info">
                                        <!-- Student info will be populated here -->
                                    </div>
                                </div>
                                
                                <div class="rag-card">
                                    <div class="rag-card-header">
                                        <h3>Progresso Geral</h3>
                                    </div>
                                    <div class="rag-card-body" id="rag-progress-overview">
                                        <!-- Progress overview will be populated here -->
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="rag-tab-pane" id="rag-courses">
                            <div class="rag-courses-list" id="rag-courses-list">
                                <!-- Courses will be populated here -->
                            </div>
                        </div>
                        
                        <div class="rag-tab-pane" id="rag-attendance">
                            <div class="rag-attendance-list" id="rag-attendance-list">
                                <!-- Attendance will be populated here -->
                            </div>
                        </div>
                        
                        <div class="rag-tab-pane" id="rag-insights">
                            <div class="rag-insights-container">
                                <div class="rag-insights-header">
                                    <h3>Insights RAG</h3>
                                    <button class="btn btn-primary" id="rag-generate-insights">
                                        <i class="fas fa-magic"></i> Gerar Insights
                                    </button>
                                </div>
                                <div class="rag-insights-content" id="rag-insights-content">
                                    <!-- Insights will be populated here -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="rag-loading" id="rag-loading" style="display: none;">
                <div class="rag-loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
                <div class="rag-loading-text">Carregando...</div>
            </div>
            
            <div class="rag-notification" id="rag-notification"></div>
        `;
        
        document.body.appendChild(this.container);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('rag-student-id');
        const searchBtn = document.getElementById('rag-search-btn');
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch();
            }
        });
        
        searchBtn.addEventListener('click', () => {
            this.handleSearch();
        });

        // Tab navigation
        document.querySelectorAll('.rag-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Tool buttons
        document.querySelectorAll('.rag-tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.executeTool(e.target.dataset.tool);
            });
        });

        // Action buttons
        document.getElementById('rag-refresh-btn').addEventListener('click', () => {
            this.emitEvent('rag-refresh-data');
        });

        document.getElementById('rag-export-btn').addEventListener('click', () => {
            this.showExportOptions();
        });

        document.getElementById('rag-connection-btn').addEventListener('click', () => {
            this.emitEvent('rag-test-connection');
        });

        document.getElementById('rag-generate-insights').addEventListener('click', () => {
            this.emitEvent('rag-generate-insights');
        });
    }

    /**
     * Handle search
     */
    handleSearch() {
        const studentId = document.getElementById('rag-student-id').value.trim();
        if (studentId) {
            this.emitEvent('rag-student-id-change', { studentId });
        }
    }

    /**
     * Switch between tabs
     * @param {string} tabName - Tab name to switch to
     */
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.rag-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab content
        document.querySelectorAll('.rag-tab-pane').forEach(pane => {
            pane.classList.toggle('active', pane.id === `rag-${tabName}`);
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
        const studentInfo = document.getElementById('rag-student-info');
        studentInfo.innerHTML = `
            <div class="rag-info-row">
                <label><i class="fas fa-id-card"></i> ID:</label>
                <span>${student.id}</span>
            </div>
            <div class="rag-info-row">
                <label><i class="fas fa-user"></i> Nome:</label>
                <span>${student.fullName}</span>
            </div>
            <div class="rag-info-row">
                <label><i class="fas fa-envelope"></i> Email:</label>
                <span>${student.email || 'Não informado'}</span>
            </div>
            <div class="rag-info-row">
                <label><i class="fas fa-phone"></i> Telefone:</label>
                <span>${student.phone || 'Não informado'}</span>
            </div>
            <div class="rag-info-row">
                <label><i class="fas fa-birthday-cake"></i> Data de Nascimento:</label>
                <span>${student.formattedBirthDate || 'Não informada'}</span>
            </div>
            <div class="rag-info-row">
                <label><i class="fas fa-tag"></i> Categoria:</label>
                <span>${student.category}</span>
            </div>
            <div class="rag-info-row">
                <label><i class="fas fa-check-circle"></i> Status:</label>
                <span class="rag-status ${student.isActive ? 'active' : 'inactive'}">
                    ${student.isActive}
                </span>
            </div>
        `;

        // Update progress overview
        const progressOverview = document.getElementById('rag-progress-overview');
        progressOverview.innerHTML = `
            <div class="rag-progress-item">
                <div class="rag-progress-label">
                    <i class="fas fa-clipboard-list"></i> Assinaturas Ativas
                </div>
                <div class="rag-progress-value">${student.subscriptionsCount}</div>
            </div>
            <div class="rag-progress-item">
                <div class="rag-progress-label">
                    <i class="fas fa-graduation-cap"></i> Cursos Inscritos
                </div>
                <div class="rag-progress-value">${student.totalCourses}</div>
            </div>
            <div class="rag-progress-item">
                <div class="rag-progress-label">
                    <i class="fas fa-chart-line"></i> Progresso Médio
                </div>
                <div class="rag-progress-value">${student.averageProgress}%</div>
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
        const coursesList = document.getElementById('rag-courses-list');
        
        if (!courses || courses.length === 0) {
            coursesList.innerHTML = `
                <div class="rag-empty-state">
                    <i class="fas fa-book-open"></i>
                    <p>Nenhum curso encontrado</p>
                </div>
            `;
            return;
        }

        coursesList.innerHTML = courses.map(course => `
            <div class="rag-course-card">
                <div class="rag-course-header">
                    <h4>${course.name}</h4>
                    <span class="rag-course-level">${course.level}</span>
                </div>
                <div class="rag-course-body">
                    <div class="rag-course-info">
                        <div class="rag-course-stat">
                            <i class="fas fa-clock"></i>
                            <span>${course.formattedDuration}</span>
                        </div>
                        <div class="rag-course-stat">
                            <i class="fas fa-users"></i>
                            <span>${course.enrolledStudentsCount} alunos</span>
                        </div>
                        <div class="rag-course-stat">
                            <i class="fas fa-calendar-alt"></i>
                            <span>${course.upcomingClassesCount} próximas</span>
                        </div>
                    </div>
                    ${course.description ? `
                        <div class="rag-course-description">
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
        const attendanceList = document.getElementById('rag-attendance-list');
        
        if (!attendance || attendance.length === 0) {
            attendanceList.innerHTML = `
                <div class="rag-empty-state">
                    <i class="fas fa-calendar-check"></i>
                    <p>Nenhum registro de frequência encontrado</p>
                </div>
            `;
            return;
        }

        attendanceList.innerHTML = attendance.slice(0, 10).map(record => `
            <div class="rag-attendance-item">
                <div class="rag-attendance-date">
                    ${new Date(record.createdAt).toLocaleDateString('pt-BR')}
                </div>
                <div class="rag-attendance-class">
                    ${record.class?.title || 'Aula não identificada'}
                </div>
                <div class="rag-attendance-status">
                    <span class="rag-status ${record.status.toLowerCase()}">
                        ${record.status}
                    </span>
                </div>
                <div class="rag-attendance-time">
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
        const analyticsGrid = document.getElementById('rag-analytics-grid');
        
        if (!analytics) {
            analyticsGrid.innerHTML = `
                <div class="rag-empty-state">
                    <i class="fas fa-chart-bar"></i>
                    <p>Nenhuma métrica disponível</p>
                </div>
            `;
            return;
        }

        analyticsGrid.innerHTML = `
            <div class="rag-analytics-item">
                <div class="rag-analytics-icon">
                    <i class="fas fa-users"></i>
                </div>
                <div class="rag-analytics-content">
                    <div class="rag-analytics-value">
                        ${analytics.students?.total || 0}
                    </div>
                    <div class="rag-analytics-label">Total de Alunos</div>
                </div>
            </div>
            <div class="rag-analytics-item">
                <div class="rag-analytics-icon">
                    <i class="fas fa-user-check"></i>
                </div>
                <div class="rag-analytics-content">
                    <div class="rag-analytics-value">
                        ${analytics.students?.active || 0}
                    </div>
                    <div class="rag-analytics-label">Alunos Ativos</div>
                </div>
            </div>
            <div class="rag-analytics-item">
                <div class="rag-analytics-icon">
                    <i class="fas fa-book"></i>
                </div>
                <div class="rag-analytics-content">
                    <div class="rag-analytics-value">
                        ${analytics.courses?.total || 0}
                    </div>
                    <div class="rag-analytics-label">Cursos Disponíveis</div>
                </div>
            </div>
            <div class="rag-analytics-item">
                <div class="rag-analytics-icon">
                    <i class="fas fa-calendar-check"></i>
                </div>
                <div class="rag-analytics-content">
                    <div class="rag-analytics-value">
                        ${analytics.attendance?.last30Days || 0}
                    </div>
                    <div class="rag-analytics-label">Frequência (30 dias)</div>
                </div>
            </div>
        `;
    }

    /**
     * Display RAG insights
     * @param {Object} insights - Insights data
     */
    displayRAGInsights(insights) {
        const insightsContent = document.getElementById('rag-insights-content');
        
        if (!insights) {
            insightsContent.innerHTML = `
                <div class="rag-empty-state">
                    <i class="fas fa-lightbulb"></i>
                    <p>Nenhum insight disponível</p>
                </div>
            `;
            return;
        }

        insightsContent.innerHTML = `
            <div class="rag-insights-section">
                <h4>Resumo</h4>
                <div class="rag-insights-summary">
                    ${insights.summary || 'Nenhum resumo disponível'}
                </div>
            </div>
            
            ${insights.recommendations && insights.recommendations.length > 0 ? `
                <div class="rag-insights-section">
                    <h4>Recomendações</h4>
                    <div class="rag-insights-list">
                        ${insights.recommendations.map(rec => `
                            <div class="rag-insight-item">
                                <i class="fas fa-check-circle"></i>
                                ${rec}
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${insights.insights && insights.insights.length > 0 ? `
                <div class="rag-insights-section">
                    <h4>Insights</h4>
                    <div class="rag-insights-list">
                        ${insights.insights.map(insight => `
                            <div class="rag-insight-item">
                                <i class="fas fa-info-circle"></i>
                                ${insight}
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <div class="rag-insights-meta">
                <small>Processado em: ${new Date(insights.processedAt).toLocaleString('pt-BR')}</small>
            </div>
        `;
    }

    /**
     * Execute tool
     * @param {string} tool - Tool to execute
     */
    executeTool(tool) {
        this.emitEvent('rag-execute-tool', { tool });
    }

    /**
     * Show loading state
     * @param {string} message - Loading message
     */
    showLoading(message = 'Carregando...') {
        const loading = document.getElementById('rag-loading');
        const loadingText = loading.querySelector('.rag-loading-text');
        
        loadingText.textContent = message;
        loading.style.display = 'flex';
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        const loading = document.getElementById('rag-loading');
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
        const notification = document.getElementById('rag-notification');
        
        notification.className = `rag-notification rag-notification-${type}`;
        notification.innerHTML = `
            <div class="rag-notification-content">
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
        exportMenu.className = 'rag-export-menu';
        exportMenu.innerHTML = `
            <div class="rag-export-title">Exportar Dados</div>
            ${options.map(option => `
                <button class="rag-export-option" data-format="${option.value}">
                    <i class="fas fa-file-export"></i> ${option.label}
                </button>
            `).join('')}
        `;
        
        document.body.appendChild(exportMenu);
        
        // Handle option selection
        exportMenu.querySelectorAll('.rag-export-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.emitEvent('rag-export-data', { format: e.target.dataset.format });
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
        document.getElementById('rag-student-info').innerHTML = '';
        document.getElementById('rag-courses-list').innerHTML = '';
        document.getElementById('rag-attendance-list').innerHTML = '';
        document.getElementById('rag-insights-content').innerHTML = '';
        document.getElementById('rag-analytics-grid').innerHTML = '';
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
            this.container.classList.add('rag-dark-mode');
        } else {
            this.container.classList.remove('rag-dark-mode');
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

export { RAGView };
export default RAGView;
