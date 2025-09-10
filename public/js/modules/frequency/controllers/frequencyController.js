/**
 * FrequencyController - GUIDELINES2.md Compliant
 * Manages frequency module UI and user interactions
 */

import { FrequencyService } from '../services/frequencyService.js';
import { ValidationService } from '../services/validationService.js';

export class FrequencyController {
    constructor() {
        this.container = null;
        this.frequencyService = new FrequencyService();
        this.validationService = new ValidationService();
        this.currentView = 'checkin';
        this.api = null;
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
            await this.loadCheckinView();
            
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
                        <button class="nav-tab active" data-view="checkin">
                            <i>✅</i> Check-in
                        </button>
                        <button class="nav-tab" data-view="history">
                            <i>📋</i> Histórico
                        </button>
                        <button class="nav-tab" data-view="reports">
                            <i>📊</i> Relatórios
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
            // Mock data for now - replace with actual API call
            const mockStudents = [
                { id: '1', name: 'João Silva', registration: '001', phone: '(11) 99999-9999' },
                { id: '2', name: 'Maria Santos', registration: '002', phone: '(11) 88888-8888' },
                { id: '3', name: 'Pedro Costa', registration: '003', phone: '(11) 77777-7777' }
            ];

            const filteredStudents = mockStudents.filter(student => 
                student.name.toLowerCase().includes(query.toLowerCase()) ||
                student.registration.includes(query) ||
                student.phone.includes(query)
            );

            this.renderSearchResults(filteredStudents);
        } catch (error) {
            console.error('Error searching students:', error);
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
            
            // Mock sessions - replace with actual API call
            const mockSessions = [
                { id: '1', name: 'Krav Maga - Iniciante (19:00-20:00)', time: '19:00', available: true },
                { id: '2', name: 'Krav Maga - Avançado (20:00-21:00)', time: '20:00', available: true },
                { id: '3', name: 'Defesa Pessoal - Básico (18:00-19:00)', time: '18:00', available: true }
            ];

            sessionSelect.innerHTML = '<option value="">Selecione uma sessão</option>';
            
            mockSessions.forEach(session => {
                const option = document.createElement('option');
                option.value = session.id;
                option.textContent = session.name;
                option.disabled = !session.available;
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
        // Mock data - replace with actual API calls
        const stats = {
            todayCheckins: 24,
            activeSessions: 3,
            attendanceRate: 85
        };

        const todayElement = this.container.querySelector('#today-checkins');
        const activeElement = this.container.querySelector('#active-sessions');
        const rateElement = this.container.querySelector('#attendance-rate');

        if (todayElement) todayElement.textContent = stats.todayCheckins;
        if (activeElement) activeElement.textContent = stats.activeSessions;
        if (rateElement) rateElement.textContent = `${stats.attendanceRate}%`;
    }

    /**
     * Load recent checkins
     */
    async loadRecentCheckins() {
        const container = this.container.querySelector('#recent-checkins');
        if (!container) return;
        
        // Mock data - replace with actual API calls
        const recentCheckins = [
            { id: '1', studentName: 'João Silva', sessionName: 'Krav Maga Iniciante', time: '19:05', status: 'present' },
            { id: '2', studentName: 'Maria Santos', sessionName: 'Krav Maga Avançado', time: '19:03', status: 'present' },
            { id: '3', studentName: 'Pedro Costa', sessionName: 'Defesa Pessoal', time: '19:01', status: 'present' }
        ];

        if (recentCheckins.length === 0) {
            container.innerHTML = '<div class="empty-state">Nenhum check-in registrado hoje</div>';
            return;
        }

        const checkinsHTML = recentCheckins.map(checkin => `
            <div class="checkin-item">
                <div class="checkin-student">${checkin.studentName}</div>
                <div class="checkin-session">${checkin.sessionName}</div>
                <div class="checkin-time">${checkin.time}</div>
                <div class="checkin-status status-${checkin.status}">
                    <i>✅</i> Presente
                </div>
            </div>
        `).join('');

        container.innerHTML = checkinsHTML;
    }

    /**
     * Load history view (placeholder)
     */
    async loadHistoryView() {
        const contentArea = this.container.querySelector('#frequency-content');
        contentArea.innerHTML = `
            <div class="history-view">
                <div class="data-card-premium">
                    <div class="card-header">
                        <h3>Histórico de Frequência</h3>
                    </div>
                    <div class="card-content">
                        <p>View de histórico em desenvolvimento...</p>
                        <p>Aqui serão exibidos filtros avançados e listagem completa de presenças.</p>
                    </div>
                </div>
            </div>
        `;
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
