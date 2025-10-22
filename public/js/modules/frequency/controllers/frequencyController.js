/**
 * FrequencyController - GUIDELINES2.md Compliant
 * Manages frequency module UI and user interactions
 */

import { FrequencyService } from '../services/frequencyService.js';
import { ValidationService } from '../services/validationService.js';
import { DashboardView } from '../views/dashboardView.js';
import { HistoryView } from '../views/historyView.js';

export class FrequencyController {
    constructor() {
        this.container = null;
        this.frequencyService = new FrequencyService();
        this.validationService = new ValidationService();
        this.currentView = 'checkin';
        this.api = null;
        this.dashboardView = null; // 🆕 Dashboard View instance
        this.historyView = null; // 🆕 History View instance (Fase 3)
    }

    /**
     * Initialize controller with container
     */
    async initialize(container, api) {
        console.log('📊 [FrequencyController] Initializing...');
        
        this.container = container;
        this.api = api;
        
        try {
            await this.setupMainStructure();
            await this.setupNavigation();
            await this.loadDashboardView(); // 🆕 Dashboard como view padrão
            
            console.log('✅ [FrequencyController] Initialized successfully');
        } catch (error) {
            console.error('❌ [FrequencyController] Initialization failed:', error);
            throw error;
        }
    }

    /**
     * Setup main module structure
     */
    async setupMainStructure() {
        this.container.innerHTML = `
            <!-- Frequency Module - Guidelines.MD Compliant -->
            <div class="frequency-module module-isolated-frequency">
                <!-- Module Header Premium -->
                <header class="module-header-premium">
                    <div class="header-content">
                        <div class="header-left">
                            <h1 class="module-title">
                                <i class="icon">📊</i>
                                <span>Gestão de Frequência</span>
                            </h1>
                            <nav class="breadcrumb">
                                <span class="breadcrumb-item">Dashboard</span>
                                <span class="breadcrumb-separator">></span>
                                <span class="breadcrumb-item active">Frequência</span>
                            </nav>
                        </div>
                        <div class="header-actions">
                            <button class="btn-primary" id="export-frequency">
                                <i>📊</i> Exportar Relatório
                            </button>
                        </div>
                    </div>
                </header>

                <!-- Navigation Tabs -->
                <nav class="module-navigation">
                    <div class="nav-tabs">
                        <button class="nav-tab active" data-view="dashboard">
                            <i>📊</i> Dashboard
                        </button>
                        <button class="nav-tab" data-view="checkin">
                            <i>✅</i> Check-in
                        </button>
                        <button class="nav-tab" data-view="history">
                            <i>📋</i> Histórico
                        </button>
                        <button class="nav-tab" data-view="reports">
                            <i>�</i> Relatórios
                        </button>
                    </div>
                </nav>

                <!-- Content Area -->
                <main class="module-content-area" id="frequency-content">
                    <!-- Dynamic content will be loaded here -->
                </main>
            </div>
        `;
    }

    /**
     * Setup navigation event listeners
     */
    setupNavigation() {
        const tabs = this.container.querySelectorAll('.nav-tab');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const view = e.target.closest('.nav-tab').dataset.view;
                this.switchView(view);
            });
        });
    }

    /**
     * Switch between views
     */
    async switchView(viewName) {
        console.log(`📊 [FrequencyController] Switching to view: ${viewName}`);
        
        // Update active tab
        const tabs = this.container.querySelectorAll('.nav-tab');
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.view === viewName);
        });

        // Load appropriate view
        this.currentView = viewName;
        
        switch (viewName) {
            case 'dashboard':
                await this.loadDashboardView();
                break;
            case 'checkin':
                await this.loadCheckinView();
                break;
            case 'history':
                await this.loadHistoryView();
                break;
            case 'reports':
                await this.loadReportsView();
                break;
            default:
                console.warn(`Unknown view: ${viewName}`);
        }
    }

    /**
     * Load dashboard view (🆕 Fase 2B)
     */
    async loadDashboardView() {
        console.log('📊 [FrequencyController] Loading Dashboard View...');
        
        const contentArea = this.container.querySelector('#frequency-content');
        
        // Destruir dashboard anterior se existir
        if (this.dashboardView) {
            this.dashboardView.destroy();
            this.dashboardView = null;
        }
        
        // Criar nova instância
        this.dashboardView = new DashboardView(this.api);
        
        // Renderizar dashboard
        await this.dashboardView.render(contentArea);
        
        console.log('✅ [FrequencyController] Dashboard View loaded');
    }

    /**
     * Load checkin view
     */
    async loadCheckinView() {
        const contentArea = this.container.querySelector('#frequency-content');
        
        contentArea.innerHTML = `
            <div class="checkin-view">
                <!-- Stats Cards -->
                <div class="stats-grid">
                    <div class="stat-card-enhanced">
                        <div class="stat-icon">👥</div>
                        <div class="stat-content">
                            <div class="stat-value" id="today-checkins">0</div>
                            <div class="stat-label">Check-ins Hoje</div>
                        </div>
                    </div>
                    <div class="stat-card-enhanced">
                        <div class="stat-icon">⏰</div>
                        <div class="stat-content">
                            <div class="stat-value" id="active-sessions">0</div>
                            <div class="stat-label">Sessões Ativas</div>
                        </div>
                    </div>
                    <div class="stat-card-enhanced">
                        <div class="stat-icon">📈</div>
                        <div class="stat-content">
                            <div class="stat-value" id="attendance-rate">0%</div>
                            <div class="stat-label">Taxa de Presença</div>
                        </div>
                    </div>
                </div>

                <!-- Checkin Form -->
                <div class="data-card-premium">
                    <div class="card-header">
                        <h3>Registrar Presença</h3>
                    </div>
                    <div class="card-content">
                        <form id="checkin-form" class="checkin-form">
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="student-search">Aluno</label>
                                    <div class="search-container">
                                        <input 
                                            type="text" 
                                            id="student-search" 
                                            class="form-control" 
                                            placeholder="Digite nome, matrícula ou telefone..."
                                            autocomplete="off"
                                        >
                                        <div class="search-results" id="student-results"></div>
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="session-select">Sessão/Aula</label>
                                    <select id="session-select" class="form-control" disabled>
                                        <option value="">Selecione um aluno primeiro</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="form-actions">
                                <button type="submit" class="btn-primary" disabled>
                                    <i>✅</i> Registrar Presença
                                </button>
                                <button type="button" class="btn-secondary" id="clear-form">
                                    <i>🔄</i> Limpar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- Recent Check-ins -->
                <div class="data-card-premium">
                    <div class="card-header">
                        <h3>Check-ins Recentes</h3>
                        <button class="btn-link" id="refresh-recent">
                            <i>🔄</i> Atualizar
                        </button>
                    </div>
                    <div class="card-content">
                        <div class="recent-checkins" id="recent-checkins">
                            <!-- Dynamic content -->
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Setup form interactions
        this.setupCheckinForm();
        
        // Load initial data
        await this.loadCheckinData();
    }

    /**
     * Setup checkin form interactions
     */
    setupCheckinForm() {
        const form = this.container.querySelector('#checkin-form');
        const studentSearch = this.container.querySelector('#student-search');
        const sessionSelect = this.container.querySelector('#session-select');
        const submitButton = form.querySelector('button[type="submit"]');
        const clearButton = this.container.querySelector('#clear-form');

        // Student search
        studentSearch.addEventListener('input', async (e) => {
            const query = e.target.value.trim();
            if (query.length >= 2) {
                await this.searchStudents(query);
            } else {
                this.clearSearchResults();
            }
        });

        // Clear form
        clearButton.addEventListener('click', () => {
            form.reset();
            this.clearSearchResults();
            sessionSelect.disabled = true;
            submitButton.disabled = true;
        });

        // Form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleCheckinSubmit();
        });
    }

    /**
     * Search students
     */
    async searchStudents(query) {
        try {
            // Buscar alunos via API
            const response = await window.moduleAPI.request('/api/attendance/students/all', {
                method: 'GET'
            });

            if (!response.success) {
                throw new Error(response.message || 'Erro ao buscar alunos');
            }

            const students = response.data || [];
            
            // Filtrar por query
            const filteredStudents = students.filter(student => {
                const searchStr = student.searchString || 
                    `${student.registrationNumber} ${student.name} ${student.email}`.toLowerCase();
                return searchStr.toLowerCase().includes(query.toLowerCase());
            }).map(student => ({
                id: student.id,
                name: student.name,
                registration: student.registrationNumber || 'N/A',
                phone: student.email // Usar email como fallback
            }));

            this.renderSearchResults(filteredStudents);
        } catch (error) {
            console.error('Error searching students:', error);
            window.app?.handleError(error, { module: 'frequency', action: 'searchStudents' });
        }
    }

    /**
     * Render search results
     */
    renderSearchResults(students) {
        const resultsContainer = this.container.querySelector('#student-results');
        
        if (students.length === 0) {
            resultsContainer.innerHTML = '<div class="search-result-item">Nenhum aluno encontrado</div>';
            return;
        }

        const resultsHTML = students.map(student => `
            <div class="search-result-item" data-student-id="${student.id}">
                <div class="student-info">
                    <div class="student-name">${student.name}</div>
                    <div class="student-details">Mat: ${student.registration} | ${student.phone}</div>
                </div>
            </div>
        `).join('');

        resultsContainer.innerHTML = resultsHTML;

        // Add click handlers
        resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                this.selectStudent(item.dataset.studentId, students);
            });
        });
    }

    /**
     * Select student and load sessions
     */
    async selectStudent(studentId, students) {
        const student = students.find(s => s.id === studentId);
        if (!student) return;

        // Update search input
        const studentSearch = this.container.querySelector('#student-search');
        studentSearch.value = student.name;
        
        // Clear results
        this.clearSearchResults();
        
        // Load sessions for student
        await this.loadStudentSessions(studentId);
    }

    /**
     * Load sessions for selected student
     */
    async loadStudentSessions(studentId) {
        try {
            const sessionSelect = this.container.querySelector('#session-select');
            
            // Buscar aulas disponíveis para o aluno via API
            const response = await window.moduleAPI.request(`/api/attendance/classes/available?studentId=${studentId}`, {
                method: 'GET'
            });

            if (!response.success) {
                throw new Error(response.message || 'Erro ao buscar aulas');
            }

            const sessions = response.data || [];

            sessionSelect.innerHTML = '<option value="">Selecione uma aula</option>';
            
            sessions.forEach(session => {
                const option = document.createElement('option');
                option.value = session.id;
                
                // Formatar nome da aula com horário
                const startTime = new Date(session.startTime).toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                const endTime = new Date(session.endTime).toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                
                option.textContent = `${session.name} (${startTime}-${endTime})`;
                option.disabled = !session.canCheckIn;
                
                sessionSelect.appendChild(option);
            });

            sessionSelect.disabled = false;
            
            // Enable submit when session is selected
            sessionSelect.addEventListener('change', () => {
                const submitButton = this.container.querySelector('#checkin-form button[type="submit"]');
                submitButton.disabled = !sessionSelect.value;
            });

        } catch (error) {
            console.error('Error loading sessions:', error);
            window.app?.handleError(error, { module: 'frequency', action: 'loadStudentSessions' });
        }
    }

    /**
     * Clear search results
     */
    clearSearchResults() {
        const resultsContainer = this.container.querySelector('#student-results');
        resultsContainer.innerHTML = '';
    }

    /**
     * Handle checkin form submission
     */
    async handleCheckinSubmit() {
        try {
            const studentSearch = this.container.querySelector('#student-search');
            const sessionSelect = this.container.querySelector('#session-select');
            
            const checkinData = {
                studentName: studentSearch.value,
                sessionId: sessionSelect.value,
                timestamp: new Date().toISOString()
            };

            console.log('📊 Processing checkin:', checkinData);
            
            // Show success message
            this.showToast('✅ Presença registrada com sucesso!', 'success');
            
            // Reset form
            this.container.querySelector('#checkin-form').reset();
            this.clearSearchResults();
            sessionSelect.disabled = true;
            
            // Refresh data
            await this.loadCheckinData();
            
        } catch (error) {
            console.error('Error submitting checkin:', error);
            this.showToast('❌ Erro ao registrar presença', 'error');
        }
    }

    /**
     * Load checkin view data
     */
    async loadCheckinData() {
        try {
            // Load stats
            await this.loadTodayStats();
            
            // Load recent checkins
            await this.loadRecentCheckins();
            
        } catch (error) {
            console.error('Error loading checkin data:', error);
        }
    }

    /**
     * Load today statistics
     */
    async loadTodayStats() {
        try {
            // Buscar estatísticas do dia via API
            const response = await window.moduleAPI.request('/api/frequency/dashboard-stats', {
                method: 'GET'
            });

            if (!response.success) {
                throw new Error(response.message || 'Erro ao buscar estatísticas');
            }

            const stats = response.data || {
                todayCheckins: 0,
                activeSessions: 0,
                attendanceRate: 0
            };

            const todayElement = this.container.querySelector('#today-checkins');
            const activeElement = this.container.querySelector('#active-sessions');
            const rateElement = this.container.querySelector('#attendance-rate');

            if (todayElement) todayElement.textContent = stats.todayCheckins || stats.checkInsToday || 0;
            if (activeElement) activeElement.textContent = stats.activeSessions || stats.activeClasses || 0;
            if (rateElement) rateElement.textContent = `${stats.attendanceRate || stats.averageAttendance || 0}%`;
        } catch (error) {
            console.error('Error loading today stats:', error);
            window.app?.handleError(error, { module: 'frequency', action: 'loadTodayStats' });
        }
    }

    /**
     * Load recent checkins
     */
    async loadRecentCheckins() {
        const container = this.container.querySelector('#recent-checkins');
        if (!container) return;
        
        try {
            // Buscar check-ins recentes via API
            const response = await window.moduleAPI.request('/api/attendance/history?limit=10&sortBy=checkInTime&sortOrder=desc', {
                method: 'GET'
            });

            if (!response.success) {
                throw new Error(response.message || 'Erro ao buscar check-ins');
            }

            const recentCheckins = (response.data || []).map(checkin => ({
                id: checkin.id,
                studentName: checkin.student?.user 
                    ? `${checkin.student.user.firstName} ${checkin.student.user.lastName}`.trim()
                    : checkin.student?.name || 'Aluno Desconhecido',
                sessionName: checkin.lesson?.name || checkin.turmaLesson?.title || 'Aula não especificada',
                time: new Date(checkin.checkInTime).toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                }),
                status: checkin.status || 'present'
            }));

            if (recentCheckins.length === 0) {
                container.innerHTML = '<div class="empty-state">Nenhum check-in registrado hoje</div>';
                return;
            }

            const checkinsHTML = recentCheckins.map(checkin => `
                <div class="checkin-item">
                    <div class="checkin-student">${checkin.studentName}</div>
                    <div class="checkin-session">${checkin.sessionName}</div>
                    <div class="checkin-time">${checkin.time}</div>
                </div>
            `).join('');

            container.innerHTML = checkinsHTML;
        } catch (error) {
            console.error('Error loading recent checkins:', error);
            container.innerHTML = '<div class="empty-state">Erro ao carregar check-ins recentes</div>';
            window.app?.handleError(error, { module: 'frequency', action: 'loadRecentCheckins' });
        }
    }

    /**
     * Load history view (🆕 Fase 3)
     */
    async loadHistoryView() {
        console.log('📋 [FrequencyController] Loading History View...');
        
        const contentArea = this.container.querySelector('#frequency-content');
        
        // Destruir history anterior se existir
        if (this.historyView) {
            this.historyView.destroy();
            this.historyView = null;
        }
        
        // Criar nova instância
        this.historyView = new HistoryView(this.api);
        
        // Renderizar history
        await this.historyView.render(contentArea);
        
        console.log('✅ [FrequencyController] History View loaded');
    }

    /**
     * Load reports view (placeholder)
     */
    async loadReportsView() {
        const contentArea = this.container.querySelector('#frequency-content');
        contentArea.innerHTML = `
            <div class="reports-view">
                <div class="data-card-premium">
                    <div class="card-header">
                        <h3>Relatórios de Frequência</h3>
                    </div>
                    <div class="card-content">
                        <p>View de relatórios em desenvolvimento...</p>
                        <p>Aqui serão exibidos gráficos, estatísticas e análises de frequência.</p>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        if (window.app && window.app.showToast) {
            window.app.showToast(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
}
