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
     * Get API client with robust fallback - Padrão de Excelência
     */
    getAPI() {
        if (this.api) return this.api;
        if (window.moduleAPI) return window.moduleAPI;
        if (typeof window.createModuleAPI === 'function') {
            this.api = window.createModuleAPI('Frequency');
            return this.api;
        }
        console.error('❌ API Client critical failure');
        throw new Error('API client não disponível');
    }

    /**
     * Initialize controller with container
     */
    async initialize(container, api) {
        console.log('📊 [FrequencyController] Initializing...');
        
        this.container = container;
        
        // Garantir API client com fallback robusto
        this.api = api || window.moduleAPI || (typeof window.createModuleAPI === 'function' ? window.createModuleAPI('Frequency') : null);
        console.log('[FrequencyController] API client:', this.api ? 'Disponivel' : 'Ausente');
        
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
        const today = new Date().toISOString().split('T')[0];
        
        contentArea.innerHTML = `
            <div class="checkin-view-extended">
                <!-- Daily Classes (Full Width) -->
                <div class="data-card-premium full-width-card">
                    <div class="card-header-row">
                        <div class="header-title">
                            <h3>📅 Aulas do Dia</h3>
                            <span class="badge-today">Hoje</span>
                        </div>
                        <div class="header-controls">
                            <input type="date" id="class-date-selector" class="form-control date-input" value="${today}">
                        </div>
                    </div>
                    
                    <div class="table-responsive">
                        <table class="premium-table" id="today-classes-table">
                            <thead>
                                <tr>
                                    <th>Horário</th>
                                    <th>Turma</th>
                                    <th>Instrutor</th>
                                    <th>Status</th>
                                    <th class="text-right">Ação</th>
                                </tr>
                            </thead>
                            <tbody id="today-classes-list">
                                <tr><td colspan="5" class="text-center"><div class="loading-skeleton">Carregando aulas...</div></td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="secondary-grid">
                    <!-- Recent Classes -->
                    <div class="data-card-premium">
                        <div class="card-header">
                            <h3>⏮️ Histórico Recente</h3>
                        </div>
                        <div class="card-content" id="recent-classes-list">
                            <div class="loading-skeleton">Carregando histórico...</div>
                        </div>
                    </div>

                    <!-- Individual Check-in -->
                    <div class="data-card-premium">
                        <div class="card-header">
                            <h3>👤 Check-in Individual</h3>
                        </div>
                        <div class="card-content">
                            <form id="checkin-form" class="checkin-form">
                                <div class="form-group">
                                    <label>Buscar Aluno</label>
                                    <div class="search-container">
                                        <input type="text" id="student-search" class="form-control" placeholder="Nome ou matrícula...">
                                        <div class="search-results" id="student-results"></div>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <select id="session-select" class="form-control" disabled>
                                        <option value="">Selecione aluno...</option>
                                    </select>
                                </div>
                                <div class="form-actions">
                                    <button type="submit" class="btn-primary full-width" disabled>Registrar Presença</button>
                                    <button type="button" id="clear-form" class="btn-secondary full-width" style="margin-top: 8px;">Limpar</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Setup form interactions
        this.setupCheckinForm();
        
        // Setup date selector
        const dateSelector = this.container.querySelector('#class-date-selector');
        if (dateSelector) {
            dateSelector.addEventListener('change', (e) => {
                this.loadClassesForDate(e.target.value);
            });
        }
        
        // Load data
        this.loadClassesForDate(new Date().toISOString().split('T')[0]);
        this.loadRecentClasses();
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
            const api = this.getAPI();

            const response = await api.request('/api/attendance/students/all', {
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
            
            const api = this.getAPI();

            const response = await api.request(`/api/attendance/classes/available?studentId=${studentId}`, {
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
            const api = this.getAPI();

            const response = await api.request('/api/frequency/dashboard-stats', {
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
            const api = this.getAPI();

            const response = await api.request('/api/attendance/history?limit=10&sortBy=checkInTime&sortOrder=desc', {
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

    /**
     * Load classes for specific date
     */
    async loadClassesForDate(dateString) {
        const container = this.container.querySelector('#today-classes-list');
        if (!container) return;

        try {
            const api = this.getAPI();
            const response = await api.request('/api/turmas');
            
            if (!response.success) throw new Error('Erro ao carregar turmas');

            // Calculate day of week for selected date
            const [year, month, day] = dateString.split('-').map(Number);
            const dateObj = new Date(year, month - 1, day);
            const dayIndex = dateObj.getDay(); // 0-6

            const classes = response.data.filter(t => this.isClassScheduledForDay(t, dayIndex));

            if (classes.length === 0) {
                container.innerHTML = '<tr><td colspan="5" class="text-center empty-state">Nenhuma aula neste dia</td></tr>';
                return;
            }

            container.innerHTML = classes.map(c => this.renderClassRow(c)).join('');
            
            // Add event listeners
            container.querySelectorAll('.btn-checkin').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const turmaId = e.target.closest('.btn-checkin').dataset.id;
                    this.openClassCheckin(turmaId);
                });
            });

        } catch (error) {
            console.error('Error loading classes:', error);
            container.innerHTML = '<tr><td colspan="5" class="text-center error-state">Erro ao carregar aulas</td></tr>';
        }
    }

    /**
     * Render class table row
     */
    renderClassRow(turma) {
        const time = this.formatClassTime(turma);
        const instructorName = turma.instructor?.user?.firstName || turma.instructor?.name || 'Instrutor';
        
        return `
            <tr>
                <td>
                    <div class="time-badge">
                        <i class="fas fa-clock"></i> ${time}
                    </div>
                </td>
                <td>
                    <div class="class-name-cell">
                        <strong>${turma.name}</strong>
                        <span class="class-type">${turma.modality || 'Krav Maga'}</span>
                    </div>
                </td>
                <td>
                    <div class="instructor-cell">
                        <div class="avatar-mini">${instructorName[0]}</div>
                        <span>${instructorName}</span>
                    </div>
                </td>
                <td><span class="status-badge active">Agendada</span></td>
                <td class="text-right">
                    <button class="btn-primary btn-sm btn-checkin" data-id="${turma.id}">
                        <i class="fas fa-clipboard-check"></i> Chamada
                    </button>
                </td>
            </tr>
        `;
    }

    /**
     * Load recent classes (yesterday)
     */
    async loadRecentClasses() {
        const container = this.container.querySelector('#recent-classes-list');
        if (!container) return;

        try {
            const api = this.getAPI();
            const response = await api.request('/api/turmas');
            
            if (!response.success) throw new Error('Erro ao carregar turmas');

            const today = new Date().getDay();
            const yesterday = (today + 6) % 7;
            const classes = response.data.filter(t => this.isClassScheduledForDay(t, yesterday));

            if (classes.length === 0) {
                container.innerHTML = '<div class="empty-state">Nenhuma aula ontem</div>';
                return;
            }

            container.innerHTML = classes.map(c => this.renderClassCard(c, 'recent')).join('');
            
             // Add event listeners
            container.querySelectorAll('.btn-checkin').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const turmaId = e.target.closest('.btn-checkin').dataset.id;
                    this.openClassCheckin(turmaId);
                });
            });

        } catch (error) {
            console.error('Error loading recent classes:', error);
            container.innerHTML = '<div class="error-state">Erro ao carregar histórico</div>';
        }
    }

    /**
     * Check if class is scheduled for specific day
     */
    isClassScheduledForDay(turma, dayIndex) {
        if (!turma.schedule) return false;
        
        // Handle array of days (legacy/mixed format)
        if (turma.schedule.daysOfWeek && Array.isArray(turma.schedule.daysOfWeek)) {
            return turma.schedule.daysOfWeek.includes(dayIndex);
        }
        
        // Handle string days (e.g. ["monday", "wednesday"])
        if (turma.schedule.days && Array.isArray(turma.schedule.days)) {
            const dayMap = {
                'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
                'thursday': 4, 'friday': 5, 'saturday': 6
            };
            return turma.schedule.days.some(d => dayMap[d.toLowerCase()] === dayIndex);
        }

        return false;
    }

    /**
     * Render class card HTML
     */
    renderClassCard(turma, type) {
        const time = this.formatClassTime(turma);
        const btnText = type === 'today' ? 'Realizar Chamada' : 'Ver/Editar';
        const btnClass = type === 'today' ? 'btn-primary' : 'btn-secondary';
        const instructorName = turma.instructor?.user?.firstName || turma.instructor?.name || 'Instrutor';
        
        return `
            <div class="class-card">
                <div class="class-info">
                    <h4>${turma.name}</h4>
                    <div class="class-meta">
                        <span>⏰ ${time}</span>
                        <span>🥋 ${instructorName}</span>
                    </div>
                </div>
                <button class="btn ${btnClass} btn-sm btn-checkin" data-id="${turma.id}">
                    ${btnText}
                </button>
            </div>
        `;
    }

    /**
     * Format class time
     */
    formatClassTime(turma) {
        if (!turma.schedule) return 'Horário n/d';
        
        const startTime = turma.schedule.time || turma.startTime || '00:00';
        const duration = turma.schedule.duration || 60;
        
        // Calculate end time
        const [hours, minutes] = startTime.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes);
        date.setMinutes(date.getMinutes() + duration);
        
        const endTime = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        return `${startTime} - ${endTime}`;
    }

    /**
     * Open class checkin
     */
    async openClassCheckin(turmaId) {
        console.log(`Opening checkin for class ${turmaId}`);
        
        const contentArea = this.container.querySelector('#frequency-content');
        
        contentArea.innerHTML = `
            <div class="class-attendance-view full-screen-mode">
                <div class="module-header-premium compact">
                    <div class="header-content">
                        <h1>📋 Chamada de Turma</h1>
                    </div>
                    <div class="header-actions">
                        <button class="btn-secondary" id="btn-back-checkin">
                            <i>⬅️</i> Voltar
                        </button>
                    </div>
                </div>

                <div class="data-card-premium expanded">
                    <div class="loading-skeleton">Carregando alunos da turma...</div>
                </div>
            </div>
        `;

        // Add back button listener
        this.container.querySelector('#btn-back-checkin').addEventListener('click', () => {
            this.loadCheckinView();
        });

        // Load class data
        await this.loadClassStudents(turmaId);
    }

    /**
     * Load students for class attendance
     */
    async loadClassStudents(turmaId) {
        try {
            const api = this.getAPI();
            const classResponse = await api.request(`/api/turmas/${turmaId}`);
            
            if (!classResponse.success) throw new Error('Erro ao carregar turma');
            const turma = classResponse.data;

            this.renderClassAttendanceList(turma, turma.enrollments || []);

        } catch (error) {
            console.error('Error loading class students:', error);
            this.showToast('Erro ao carregar alunos da turma', 'error');
            
            const contentArea = this.container.querySelector('.class-attendance-view .data-card-premium');
            if (contentArea) {
                contentArea.innerHTML = '<div class="error-state">Erro ao carregar dados da turma</div>';
            }
        }
    }

    /**
     * Render attendance list
     */
    renderClassAttendanceList(turma, enrollments) {
        const contentArea = this.container.querySelector('.class-attendance-view .data-card-premium');
        
        // Prepare initial list
        const studentListHtml = enrollments.map(enrollment => this.renderStudentRow(enrollment.student)).join('');

        contentArea.innerHTML = `
            <div class="card-header-actions">
                <div class="header-info">
                    <h3>${turma.name}</h3>
                    <span class="badge-date">${new Date().toLocaleDateString('pt-BR')}</span>
                    <span class="badge-count" id="student-count">${enrollments.length} alunos</span>
                </div>
                
                <div class="add-student-container">
                    <div class="search-wrapper">
                        <input type="text" id="add-student-input" placeholder="🔍 Adicionar aluno avulso..." class="form-control">
                        <div id="add-student-results" class="search-results-dropdown"></div>
                    </div>
                </div>
            </div>

            <div class="student-list-container" id="attendance-list">
                ${studentListHtml || '<div class="empty-state-message">Nenhum aluno matriculado.</div>'}
            </div>
            
            <div class="card-footer sticky-footer">
                <button class="btn-primary btn-lg" id="btn-confirm-attendance">
                    ✅ Confirmar Presença
                </button>
            </div>
        `;
        
        // Setup search
        this.setupAddStudentSearch(turma.id);

        // Add confirm listener
        this.container.querySelector('#btn-confirm-attendance').addEventListener('click', () => {
            this.submitClassAttendance(turma.id);
        });
    }

    /**
     * Render single student row
     */
    renderStudentRow(student, isExtra = false) {
        const user = student.user || {};
        const initials = user.firstName ? user.firstName[0] : '?';
        const extraClass = isExtra ? 'student-extra' : '';
        
        // Badges Logic
        let badgesHtml = '';
        
        if (isExtra) {
            badgesHtml += '<span class="badge-status badge-extra">Avulso</span>';
        }

        // Subscription Status
        const subscription = student.subscriptions && student.subscriptions.length > 0 ? student.subscriptions[0] : null;
        
        if (subscription) {
            if (subscription.status === 'ACTIVE') {
                badgesHtml += '<span class="badge-status badge-active">Ativo</span>';
            } else {
                badgesHtml += `<span class="badge-status badge-inactive">${subscription.status}</span>`;
            }
        } else {
             // If not extra, warn about no plan
             if (!isExtra) {
                badgesHtml += '<span class="badge-status badge-warning">Sem Plano</span>';
             }
        }
        
        return `
            <div class="student-attendance-row ${extraClass}" data-student-id="${student.id}">
                <div class="student-info">
                    <div class="student-avatar">${initials}</div>
                    <div class="student-details">
                        <div class="student-name-row">
                            <h4>${user.firstName} ${user.lastName || ''}</h4>
                            <div class="student-badges">${badgesHtml}</div>
                        </div>
                        <span>${student.graduationLevel || 'Sem graduação'}</span>
                    </div>
                </div>
                <div class="attendance-actions">
                    <label class="toggle-switch">
                        <input type="checkbox" class="attendance-check" checked>
                        <span class="slider round"></span>
                    </label>
                </div>
            </div>
        `;
    }

    /**
     * Setup add student search
     */
    setupAddStudentSearch(turmaId) {
        const input = this.container.querySelector('#add-student-input');
        const resultsContainer = this.container.querySelector('#add-student-results');
        let debounceTimer;

        input.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            const query = e.target.value.trim();
            
            if (query.length < 2) {
                resultsContainer.style.display = 'none';
                return;
            }

            debounceTimer = setTimeout(async () => {
                await this.searchStudentsForAttendance(query, resultsContainer);
            }, 300);
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.add-student-container')) {
                resultsContainer.style.display = 'none';
            }
        });
    }

    /**
     * Search students for attendance
     */
    async searchStudentsForAttendance(query, container) {
        try {
            const api = this.getAPI();
            // Reusing the endpoint that returns all students
            const response = await api.request('/api/attendance/students/all');
            
            if (!response.success) return;

            const students = response.data.filter(s => 
                (s.name.toLowerCase().includes(query.toLowerCase()) || 
                 s.registrationNumber?.includes(query)) &&
                s.hasActivePlan // Only eligible students (Active Plan)
            );

            if (students.length === 0) {
                container.innerHTML = '<div class="search-item">Nenhum aluno habilitado encontrado</div>';
            } else {
                container.innerHTML = students.slice(0, 5).map(s => `
                    <div class="search-item" data-id="${s.id}" data-json='${JSON.stringify(s).replace(/'/g, "&#39;")}'>
                        <div class="name">${s.name}</div>
                        <div class="meta">${s.activePlanName || s.graduationLevel || 'Plano Ativo'}</div>
                    </div>
                `).join('');
            }

            container.style.display = 'block';

            // Add click listeners
            container.querySelectorAll('.search-item').forEach(item => {
                item.addEventListener('click', () => {
                    const studentData = JSON.parse(item.dataset.json);
                    // Map to expected format
                    const student = {
                        id: studentData.id,
                        user: { firstName: studentData.name.split(' ')[0], lastName: studentData.name.split(' ').slice(1).join(' ') },
                        graduationLevel: studentData.graduationLevel
                    };
                    this.addStudentToAttendanceList(student);
                    container.style.display = 'none';
                    this.container.querySelector('#add-student-input').value = '';
                });
            });

        } catch (error) {
            console.error('Search error:', error);
        }
    }

    /**
     * Add student to attendance list
     */
    addStudentToAttendanceList(student) {
        const list = this.container.querySelector('#attendance-list');
        
        // Check duplicates
        if (list.querySelector(`[data-student-id="${student.id}"]`)) {
            this.showToast('Aluno já está na lista', 'warning');
            return;
        }

        // Remove empty message if exists
        const emptyMsg = list.querySelector('.empty-state-message');
        if (emptyMsg) emptyMsg.remove();

        // Add row
        const rowHtml = this.renderStudentRow(student, true);
        list.insertAdjacentHTML('afterbegin', rowHtml);
        
        // Update count
        const countBadge = this.container.querySelector('#student-count');
        const currentCount = parseInt(countBadge.textContent) || 0;
        countBadge.textContent = `${currentCount + 1} alunos`;

        this.showToast('Aluno adicionado à chamada', 'success');
    }

    /**
     * Submit class attendance
     */
    async submitClassAttendance(turmaId) {
        const checks = this.container.querySelectorAll('.attendance-check');
        const presentStudentIds = [];
        
        checks.forEach(check => {
            if (check.checked) {
                const row = check.closest('.student-attendance-row');
                presentStudentIds.push(row.dataset.studentId);
            }
        });

        this.showToast(`Registrando presença para ${presentStudentIds.length} alunos...`, 'info');
        
        try {
            const api = this.getAPI();
            
            const promises = presentStudentIds.map(studentId => {
                return api.request('/api/frequency/checkin', {
                    method: 'POST',
                    body: {
                        studentId,
                        turmaId,
                        type: 'CLASS',
                        timestamp: new Date().toISOString()
                    }
                });
            });

            await Promise.all(promises);
            
            this.showToast('Chamada realizada com sucesso!', 'success');
            // Manter na tela para permitir adicionar mais alunos
            // this.loadCheckinView();

        } catch (error) {
            console.error('Error submitting attendance:', error);
            this.showToast('Erro ao registrar chamada', 'error');
        }
    }
}

// TEST WRITE