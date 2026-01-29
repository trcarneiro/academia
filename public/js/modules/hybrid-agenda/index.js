/**
 * Hybrid Agenda Module - AGENTS.md Compliant
 * Multi-file structure following Activities template
 * 
 * Features:
 * - Unified modal system for create/edit
 * - Premium UI components
 * - AcademyApp integration
 * - API-first design
 * - Loading/Empty/Error states
 */
// Module state (global variables removed - using instance properties)
class HybridAgendaModule {
    constructor() {
        this.name = 'hybrid-agenda';
        this.version = '2.0.0';
        this.controllers = {};
        this.services = {};
        this.views = {};
        this.isInitialized = false;
        this.currentDate = new Date(); // Initialize with current date
        this.agendaData = [];
        this.filteredData = [];
        this.currentView = 'week'; // Default view - week is most common
        this.selectedFilters = {}; // Initialize selectedFilters
        this.stats = {}; // Initialize stats
    }
    async initialize(container, route) {
        try {
            // Prevent multiple initializations
            if (this.isInitialized) {
                console.log('⚠️ Hybrid Agenda Module already initialized, skipping...');
                return this;
            }

            console.log('🏳️‍⚖️ Initializing Hybrid Agenda Module (AGENTS.md compliant)...', this.name);
            console.log('🛠️ Container received:', container);
            console.log('🛠️ Route received:', route);
            if (!container) {
                throw new Error('Container element is required');
            }
            // Keep reference to root container for scoped event listeners
            this.rootContainer = container;
            // Initialize API client following AGENTS.md patterns
            await this.initializeAPI();
            // Handle different routes (SPA integration from simple.js)
            const routeParts = route ? route.split('/') : [];
            if (routeParts.length > 2) {
                const action = routeParts[2]; // edit, details
                const itemId = routeParts[3];
                switch (action) {
                    case 'edit':
                        return await this.renderEditPage(container, itemId);
                    case 'details':
                        return await this.renderDetailsPage(container, itemId);
                    default:
                        break;
                }
            }
            // Render main interface with Premium UI
            await this.renderMainInterface(container);
            // Setup event listeners (scoped to module container)
            this.setupEventListeners();
            // Load initial data
            await this.loadInitialData();
            // AcademyApp integration
            this.registerWithAcademyApp();
            this.isInitialized = true;
            console.log('… Hybrid Agenda Module initialized successfully');
            // Dispatch module loaded event (from simple.js)
            if (window.app) {
                window.app.dispatchEvent('module:loaded', { name: 'hybrid-agenda' });
            }
            return this;
        } catch (error) {
            console.error('❌ Failed to initialize Hybrid Agenda Module:', error);
            window.app?.handleError(error, 'hybrid-agenda-init');
            throw error;
        }
    }
    async initializeAPI() {
        console.log('🛠️ Initializing API...');
        // Check for API client (AGENTS.md requirement)
        console.log('🛠️ Checking for API client...');
        console.log('🛠️ window.createModuleAPI:', typeof window.createModuleAPI);
        if (typeof window.createModuleAPI !== 'function') {
            console.log('⏳ Waiting for API client...');
            await this.waitForAPIClient();
        }
        console.log('… Creating module API...');
        this.api = window.createModuleAPI('HybridAgenda');
        console.log('… Module API created:', this.api.constructor.name);
        console.log('… API initialized successfully');
    }
    registerWithAcademyApp() {
        // AGENTS.md compliant integration with AcademyApp
        if (window.app && typeof window.app.dispatchEvent === 'function') {
            window.app.dispatchEvent('module:loaded', {
                name: this.name,
                version: this.version
            });
        }
        // Export module globally for window access (AGENTS.md pattern)
        if (typeof window !== 'undefined') {
            window.hybridAgendaModule = this;
            window.hybridAgenda = this; // Also export as hybridAgenda for backwards compatibility
        }
        console.log('… Hybrid Agenda module registered with AcademyApp');
    }
    async waitForAPIClient() {
        return new Promise((resolve) => {
            const checkAPI = () => {
                if (typeof window.createModuleAPI === 'function') {
                    resolve();
                } else {
                    setTimeout(checkAPI, 100);
                }
            };
            checkAPI();
        });
    }
    async renderMainInterface(container) {
        console.log('🛠️ Rendering main interface with Premium UI...');
        container.innerHTML = this.getMainHTML();
        console.log('… Main interface rendered');
    }
    getMainHTML() {
        return `
            <div class="module-isolated-hybrid-agenda">
                <div class="module-header-premium">
                    <div class="header-content">
                        <div class="header-title">
                            <h2>📅 Agenda Híbrida</h2>
                                <p>Gestão unificada de turmas e personal training</p>
                        </div>
                        <div class="header-actions">
                            <button class="btn-primary create-agenda-btn" onclick="hybridAgenda.showUnifiedModal()">
                                • Criar Agendamento
                            </button>
                        </div>
                    </div>
                    <div class="breadcrumb-nav">
                        <span class="breadcrumb-item active">📅 Agenda</span>
                    </div>
                </div>
                <div class="stats-container">
                    <div class="stat-card-enhanced" data-stat="turmas">
                        <div class="stat-icon">🥋</div>
                        <div class="stat-content">
                            <div class="stat-number" id="stat-turmas">0</div>
                            <div class="stat-label">Turmas</div>
                        </div>
                    </div>
                    <div class="stat-card-enhanced" data-stat="personal">
                        <div class="stat-icon">🧍</div>
                        <div class="stat-content">
                            <div class="stat-number" id="stat-personal">0</div>
                            <div class="stat-label">Personal Training</div>
                        </div>
                    </div>
                    <div class="stat-card-enhanced" data-stat="instructors">
                        <div class="stat-icon">👨‍🏫</div>
                        <div class="stat-content">
                            <div class="stat-number" id="stat-instructors">0</div>
                            <div class="stat-label">Instrutores</div>
                        </div>
                    </div>
                </div>
                <div class="view-switcher">
                    <button class="view-switcher-btn active" data-view="calendar" onclick="hybridAgenda.switchView('calendar')">
                        📆 Calendário
                    </button>
                    <button class="view-switcher-btn" data-view="list" onclick="hybridAgenda.switchView('list')">
                        📋 Lista
                    </button>
                </div>
                <div id="agenda-loading" class="loading-state" style="display: none;">
                    <div class="loading-spinner"></div>
                    <p>Carregando agenda...</p>
                </div>
                <div id="agenda-empty" class="empty-state" style="display: none;">
                    <div class="empty-icon">📅</div>
                    <h3>Nenhum agendamento encontrado</h3>
                    <p>Crie o primeiro agendamento para começar</p>
                    <button class="btn-primary" onclick="hybridAgenda.showUnifiedModal()">
                        • Criar Agendamento
                    </button>
                </div>
                <div id="agenda-error" class="error-state" style="display: none;">
                    <div class="error-icon">⚠️</div>
                    <h3>Erro ao carregar agenda</h3>
                    <p id="error-message">Ocorreu um erro inesperado</p>
                    <button class="btn-secondary" onclick="hybridAgenda.reload()">
                        🔁 Tentar Novamente
                    </button>
                </div>
                <div id="agenda-content" class="agenda-content">
                </div>
            </div>
        `;
    }
    setupEventListeners() {
        console.log('🛠️ Setting up event listeners...');
        // Prevent multiple bindings if initialize is called again
        if (this._listenersBound) {
            console.log('⚠️ Event listeners already bound; skipping rebind');
            return;
        }
        this._listenersBound = true;

        const scope = this.rootContainer || document;
        // Click delegation for agenda items and navigation
        scope.addEventListener('click', (event) => {
            // Handle agenda item clicks
            const agendaItem = event.target.closest('.agenda-item');
            if (agendaItem) {
                const itemId = agendaItem.dataset.id;
                const itemType = agendaItem.dataset.type;
                this.handleAgendaItemClick(itemId, itemType);
                return;
            }
            // Handle view switcher clicks
            const viewBtn = event.target.closest('.view-switcher-btn');
            if (viewBtn) {
                this.switchView(viewBtn.dataset.view);
                return;
            }
            // Handle navigation clicks
            const navBtn = event.target.closest('.nav-btn');
            if (navBtn) {
                if (navBtn.classList.contains('nav-prev')) {
                    this.navigatePrevious();
                } else if (navBtn.classList.contains('nav-next')) {
                    this.navigateNext();
                } else if (navBtn.classList.contains('nav-today')) {
                    this.goToToday();
                }
                return;
            }
            // Handle month cell clicks
            const monthCell = event.target.closest('.month-cell');
            if (monthCell && monthCell.dataset.date) {
                this.selectDate(monthCell.dataset.date);
                return;
            }
            // Handle create agenda button clicks
            const createBtn = event.target.closest('.create-agenda-btn');
            if (createBtn) {
                this.showUnifiedModal();
                return;
            }
        });
        // Handle double-click on time slots for quick scheduling
        scope.addEventListener('dblclick', (event) => {
            const timeSlot = event.target.closest('.week-column, .timeline-events');
            if (timeSlot) {
                const rect = timeSlot.getBoundingClientRect();
                const y = event.clientY - rect.top;
                const hourHeight = this.currentView === 'day' ? 60 : 50;
                const hour = Math.floor(y / hourHeight) + 6;
                const minute = Math.floor((y % hourHeight) / (hourHeight / 4)) * 15;
                const date = timeSlot.dataset.date || this.currentDate.toISOString().split('T')[0];
                const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                this.showSchedulingOptions(date, time);
            }
        });
        console.log('… Event listeners set up');
    }
    async loadInitialData() {
        console.log('🛠️ Loading initial data...');
        try {
            // Show loading state
            this.showLoadingState();
            // Load agenda data and stats in parallel
            await Promise.all([
                this.loadAgendaData(),
                this.loadStats()
            ]);
            // Hide loading and show content
            this.hideLoadingState();
            this.renderCurrentView();
        } catch (error) {
            console.error('❌ Failed to load initial data:', error);
            this.showErrorState(error);
            window.app?.handleError(error, 'hybrid-agenda-load');
        }
    }
    async loadAgendaData() {
        try {
            const response = await this.api.fetchWithStates('/api/hybrid-agenda', {
                onSuccess: (response) => {
                    console.log('… Agenda data loaded:', response);
                    if (response && response.items && Array.isArray(response.items)) {
                        this.agendaData = response.items;
                        // Log data for debugging
                        console.log('📅 Events loaded:', this.agendaData.map(item => ({
                            id: item.id,
                            title: item.title,
                            startTime: item.startTime,
                            date: new Date(item.startTime).toDateString()
                        })));
                        // Check for empty state
                        if (this.agendaData.length === 0) {
                            this.showEmptyState();
                            return;
                        }
                    } else {
                        console.warn('⚠️ Unexpected API response format:', response);
                        this.agendaData = [];
                        this.showEmptyState();
                        return;
                    }
                },
                onError: (error) => {
                    console.error('❌ Failed to load agenda data:', error);
                    throw error;
                }
            });
        } catch (error) {
            console.error('Error loading agenda data:', error);
            throw error;
        }
    }
    async loadStats() {
        try {
            const response = await this.api.fetchWithStates('/api/hybrid-agenda', {
                onSuccess: (response) => {
                    console.log('… Stats loaded:', response);
                    if (response && response.summary) {
                        const summary = response.summary;
                        stats = {
                            turmas: { total: summary.totalTurmas || 0 },
                            personalSessions: { total: summary.totalPersonalSessions || 0 },
                            instructors: { active: summary.totalInstructors || 0 }
                        };
                        this.updateStatsDisplay();
                    }
                },
                onError: (error) => {
                    console.error('❌ Failed to load stats:', error);
                }
            });
        } catch (error) {
            console.error('Error loading stats:', error);
            // Stats failure is not critical
        }
    }
    updateStatsDisplay() {
        const turmasEl = document.getElementById('stat-turmas');
        const personalEl = document.getElementById('stat-personal');
        const instructorsEl = document.getElementById('stat-instructors');
        if (turmasEl) turmasEl.textContent = stats.turmas?.total || 0;
        if (personalEl) personalEl.textContent = stats.personalSessions?.total || 0;
        if (instructorsEl) instructorsEl.textContent = stats.instructors?.active || 0;
    }
    async loadInitialData() {
        try {
            // Load agenda data first
            await this.loadAgendaData();
            // Then try to load stats (with graceful fallback)
            await this.loadStats();
            this.renderCurrentView();
        } catch (error) {
            console.error('❌ Error loading initial data:', error);
            window.app?.handleError(error, 'hybrid-agenda-initial-data');
            this.showErrorState(error);
        }
    }
    async loadAgendaData() {
        try {
            // Ensure currentDate is valid
            if (!this.currentDate || isNaN(this.currentDate.getTime())) {
                console.warn('⚠️ Invalid currentDate detected, resetting to today');
                this.currentDate = new Date();
            }
            const startDate = this.getWeekStart(this.currentDate);
            const endDate = this.getWeekEnd(this.currentDate);
            // Validate dates before converting to ISO string
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                throw new Error('Invalid date range calculated');
            }
            const params = {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                tzOffsetMinutes: new Date().getTimezoneOffset(),
                ...this.selectedFilters
            };
            // Enable all-records mode for audit if hash includes 'agendaAll' or 'all=1'
            const hash = window.location.hash || '';
            if (/#.*(agendaAll|all=1)/i.test(hash)) {
                params.all = '1';
            }
            const query = new URLSearchParams(params).toString();
            await this.api.fetchWithStates(`/api/hybrid-agenda?${query}`, {
                method: 'GET',
                loadingElement: document.getElementById('agenda-container'),
                onSuccess: (data) => {
                    this.agendaData = data.items || [];
                    // Debug: summarize items per day for quick visual verification
                    if (typeof window !== 'undefined' && (/#.*debugAgenda/i.test(hash))) {
                        const byDay = this.agendaData.reduce((acc, it) => {
                            const d = new Date(it.startTime);
                            const key = d.toISOString().split('T')[0];
                            acc[key] = (acc[key] || 0) + 1;
                            return acc;
                        }, {});
                        console.log('🧭 Agenda summary by day:', byDay);
                    }
                    this.renderCurrentView();
                },
                onEmpty: () => {
                    this.showEmptyState();
                },
                onError: (error) => {
                    this.showErrorState(error);
                }
            });
        } catch (error) {
            console.error('❌ Error loading agenda data:', error);
            window.app?.handleError(error, 'hybrid-agenda-load-data');
            this.showErrorState(error);
        }
    }
    async loadStats() {
        try {
            // Calculate stats directly from loaded agenda data (endpoint doesn't exist)
            console.log('📊 Calculating stats from agenda data...');
            this.calculateStatsFromData();
        } catch (error) {
            console.error('📊 Error calculating stats:', error);
            // Set default stats if calculation fails
            this.stats = {
                totalItems: 0,
                totalTurmas: 0,
                totalPersonalSessions: 0,
                totalScheduled: 0,
                totalConfirmed: 0
            };
            this.renderStats();
        }
    }
    calculateStatsFromData() {
        // Calculate stats from this.agendaData if available
        const data = Array.isArray(this.agendaData) ? this.agendaData : (this.agendaData?.items || []);
        const turmas = data.filter(item => item.type === 'TURMA');
        const personalSessions = data.filter(item => item.type === 'PERSONAL_SESSION');
        const instructors = [...new Set(data.map(item => item.instructor?.name).filter(Boolean))];
        this.stats = {
            turmas: { total: turmas.length },
            personalSessions: { total: personalSessions.length },
            instructors: { active: instructors.length }
        };
        this.renderStats();
    }
    renderCurrentView() {
        const container = document.getElementById('agenda-container');
        if (!container) return;
        switch (this.currentView) {
            case 'day':
                this.renderDayView(container);
                break;
            case 'week':
                this.renderWeekView(container);
                break;
            case 'month':
                this.renderMonthView(container);
                break;
            case 'list':
                this.renderListView(container);
                break;
            default:
                this.renderWeekView(container);
        }
        // Setup navigation event listeners after rendering
        this.setupNavigationEvents();
    }
    renderDayView(container) {
        const dayHtml = `
            <div class="module-isolated-hybrid-agenda">
                ${this.renderHeader()}
                ${this.renderFilters()}
                ${this.renderStats()}
                <div class="calendar-navigation">
                    <button class="nav-btn nav-prev" data-direction="prev">‹</button>
                    <h3 class="current-period">${this.formatDayTitle()}</h3>
                    <button class="nav-btn nav-next" data-direction="next">›</button>
                    <button class="nav-btn nav-today">Hoje</button>
                </div>
                <div class="day-view">
                    <div class="day-timeline">
                        <div class="timeline-hours">
                            ${this.renderTimelineHours()}
                        </div>
                        <div class="timeline-events">
                            ${this.renderDayEvents()}
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML = dayHtml;
    }
    renderWeekView(container) {
        const weekHtml = `
            <div class="module-isolated-hybrid-agenda">
                ${this.renderHeader()}
                ${this.renderFilters()}
                ${this.renderStats()}
                <div class="calendar-navigation">
                    <button class="nav-btn nav-prev" data-direction="prev">‹</button>
                    <h3 class="current-period">${this.formatWeekRange()}</h3>
                    <button class="nav-btn nav-next" data-direction="next">›</button>
                    <button class="nav-btn nav-today">Hoje</button>
                </div>
                <div class="week-view">
                    <div class="week-header">
                        ${this.renderWeekHeaders()}
                    </div>
                    <div class="week-content">
                        <div class="week-times">
                            ${this.renderTimelineHours()}
                        </div>
                        <div class="week-days">
                            ${this.renderWeekColumns()}
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML = weekHtml;
    }
    renderMonthView(container) {
        const monthHtml = `
            <div class="module-isolated-hybrid-agenda">
                ${this.renderHeader()}
                ${this.renderFilters()}
                ${this.renderStats()}
                <div class="calendar-navigation">
                    <button class="nav-btn nav-prev" data-direction="prev">‹</button>
                    <h3 class="current-period">${this.formatMonthTitle()}</h3>
                    <button class="nav-btn nav-next" data-direction="next">›</button>
                    <button class="nav-btn nav-today">Hoje</button>
                </div>
                <div class="month-view">
                    <div class="month-header">
                        ${this.renderMonthHeaders()}
                    </div>
                    <div class="month-grid">
                        ${this.renderMonthCells()}
                    </div>
                </div>
            </div>
        `;
        container.innerHTML = monthHtml;
    }
    renderCalendarView(container) {
        const calendarHtml = `
            <div class="module-isolated-hybrid-agenda">
                ${this.renderHeader()}
                ${this.renderFilters()}
                ${this.renderStats()}
                <div class="calendar-view">
                    <div class="calendar-header">
                        <button class="date-nav-btn" data-direction="prev">‹</button>
                        <h3 class="current-week">${this.formatWeekRange()}</h3>
                        <button class="date-nav-btn" data-direction="next">›</button>
                    </div>
                    <div class="calendar-grid">
                        ${this.renderWeekDays()}
                    </div>
                </div>
            </div>
        `;
        container.innerHTML = calendarHtml;
    }
    renderListView(container) {
        const listHtml = `
            <div class="module-isolated-hybrid-agenda">
                ${this.renderHeader()}
                ${this.renderFilters()}
                ${this.renderStats()}
                <div class="list-view">
                    <div class="agenda-list">
                        ${this.agendaData.map(item => this.renderAgendaItem(item)).join('')}
                    </div>
                </div>
            </div>
        `;
        container.innerHTML = listHtml;
    }
    renderTimelineView(container) {
        const timelineHtml = `
            <div class="module-isolated-hybrid-agenda">
                ${this.renderHeader()}
                ${this.renderFilters()}
                ${this.renderStats()}
                <div class="timeline-view">
                    <div class="timeline-header">
                        <div class="timeline-hours">
                            ${this.renderTimelineHours()}
                        </div>
                    </div>
                    <div class="timeline-content">
                        ${this.renderTimelineItems()}
                    </div>
                </div>
            </div>
        `;
        container.innerHTML = timelineHtml;
    }
    renderHeader() {
        return `
            <div class="module-header-premium">
                <div class="module-header-content">
                    <div class="module-title-section">
                        <h1>📅 Agenda Híbrida</h1>
                        <p class="module-subtitle">Gestão unificada de turmas e personal training</p>
                    </div>
                    <div class="module-actions">
                        <div class="view-switcher">
                            <button class="view-switcher-btn ${this.currentView === 'day' ? 'active' : ''}" data-view="day">
                                🗓️ Dia
                            </button>
                            <button class="view-switcher-btn ${this.currentView === 'week' ? 'active' : ''}" data-view="week">
                                📅 Semana
                            </button>
                            <button class="view-switcher-btn ${this.currentView === 'month' ? 'active' : ''}" data-view="month">
                                📆 Mês
                            </button>
                            <button class="view-switcher-btn ${this.currentView === 'list' ? 'active' : ''}" data-view="list">
                                📋 Lista
                            </button>
                        </div>
                        <button class="btn-primary create-agenda-btn">
                            • Criar Agendamento
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    renderFilters() {
        return `
            <div class="module-filters-premium">
                <div class="filter-group">
                    <label>Tipo:</label>
                    <select class="filter-select" data-filter="type">
                        <option value="">Todos</option>
                        <option value="TURMA" ${this.selectedFilters.type === 'TURMA' ? 'selected' : ''}>Turmas</option>
                        <option value="PERSONAL_SESSION" ${this.selectedFilters.type === 'PERSONAL_SESSION' ? 'selected' : ''}>Personal Training</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Status:</label>
                    <select class="filter-select" data-filter="status">
                        <option value="">Todos</option>
                        <option value="SCHEDULED" ${this.selectedFilters.status === 'SCHEDULED' ? 'selected' : ''}>Agendado</option>
                        <option value="CONFIRMED" ${this.selectedFilters.status === 'CONFIRMED' ? 'selected' : ''}>Confirmado</option>
                        <option value="IN_PROGRESS" ${this.selectedFilters.status === 'IN_PROGRESS' ? 'selected' : ''}>Em Andamento</option>
                        <option value="COMPLETED" ${this.selectedFilters.status === 'COMPLETED' ? 'selected' : ''}>Concluído</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Data:</label>
                    <input type="date" id="agenda-date-picker" class="filter-input" 
                           value="${this.currentDate.toISOString().split('T')[0]}">
                </div>
            </div>
        `;
    }
    renderStats() {
        if (!this.stats || Object.keys(this.stats).length === 0) {
            return '';
        }
        return `
            <div class="stats-container">
                <div class="stat-card-enhanced turmas-stat">
                    <div class="stat-icon">🥋</div>
                    <div class="stat-content">
                        <div class="stat-number">${this.stats.turmas?.total || 0}</div>
                        <div class="stat-label">Turmas</div>
                    </div>
                </div>
                <div class="stat-card-enhanced personal-stat">
                    <div class="stat-icon">🧍</div>
                    <div class="stat-content">
                        <div class="stat-number">${this.stats.personalSessions?.total || 0}</div>
                        <div class="stat-label">Personal Training</div>
                    </div>
                </div>
                <div class="stat-card-enhanced instructors-stat">
                    <div class="stat-icon">👨‍🏫</div>
                    <div class="stat-content">
                        <div class="stat-number">${this.stats.instructors?.active || 0}</div>
                        <div class="stat-label">Instrutores Ativos</div>
                    </div>
                </div>
                <div class="stat-card-enhanced utilization-stat">
                    <div class="stat-icon">📊</div>
                    <div class="stat-content">
                        <div class="stat-number">${this.stats.facilities?.utilizationRate || 0}%</div>
                        <div class="stat-label">Taxa de Utilização</div>
                    </div>
                </div>
            </div>
        `;
    }
    renderWeekDays() {
        const weekStart = this.getWeekStart(this.currentDate);
        const days = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(weekStart);
            day.setDate(weekStart.getDate() + i);
            const dayItems = this.agendaData.filter(item => {
                return this.isSameDate(item.startTime, day);
            });
            days.push(`
                <div class="calendar-day">
                    <div class="day-header">
                        <div class="day-name">${this.getDayName(day)}</div>
                        <div class="day-number">${day.getDate()}</div>
                    </div>
                    <div class="day-items">
                        ${dayItems.map(item => this.renderDayItem(item)).join('')}
                    </div>
                </div>
            `);
        }
        return days.join('');
    }
    renderDayItem(item) {
        const startTime = this.convertUTCToLocal(item.startTime);
        const typeClass = item.type === 'TURMA' ? 'turma-item' : 'personal-item';
        return `
            <div class="day-item ${typeClass} agenda-item" data-id="${item.id}" data-type="${item.type}">
                <div class="item-time">${startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                <div class="item-title">${item.title}</div>
                <div class="item-instructor">${item.instructor?.name || 'N/A'}</div>
                <div class="item-status status-${item.status.toLowerCase()}">${this.getStatusLabel(item.status)}</div>
            </div>
        `;
    }
    renderAgendaItem(item) {
        const startTime = this.convertUTCToLocal(item.startTime);
        const endTime = this.convertUTCToLocal(item.endTime);
        const typeClass = item.type === 'TURMA' ? 'turma-item' : 'personal-item';
        const typeIcon = item.type === 'TURMA' ? '🥋' : '🧍';
        return `
            <div class="data-card-premium agenda-item ${typeClass}" data-id="${item.id}" data-type="${item.type}">
                <div class="agenda-item-header">
                    <div class="agenda-item-type">
                        <span class="type-icon">${typeIcon}</span>
                        <span class="type-label">${item.type === 'TURMA' ? 'Turma' : 'Personal Training'}</span>
                    </div>
                    <div class="agenda-item-status status-${item.status.toLowerCase()}">
                        ${this.getStatusLabel(item.status)}
                    </div>
                </div>
                <div class="agenda-item-content">
                    <h3 class="agenda-item-title">${item.title}</h3>
                    <p class="agenda-item-description">${item.description || ''}</p>
                    <div class="agenda-item-details">
                        <div class="detail-group">
                            <span class="detail-icon">🕐</span>
                            <span class="detail-text">
                                ${startTime.toLocaleString('pt-BR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        })} - ${endTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        <div class="detail-group">
                            <span class="detail-icon">👨‍🏫</span>
                            <span class="detail-text">${item.instructor?.name || 'N/A'}</span>
                        </div>
                        <div class="detail-group">
                            <span class="detail-icon">📍</span>
                            <span class="detail-text">${item.trainingArea?.name || 'N/A'}</span>
                        </div>
                        <div class="detail-group">
                            <span class="detail-icon">👥</span>
                            <span class="detail-text">${item.actualStudents}/${item.maxStudents} alunos</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    // Day View Methods
    formatDayTitle() {
        return this.currentDate.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }
    renderDayEvents() {
        const dayEvents = this.agendaData.filter(item => this.isSameDate(item.startTime, this.currentDate));
        // Determinar o menor e maior horário do dia; fallback 06–22
        let minHour = 6, maxHour = 22;
        if (dayEvents.length) {
            const hours = dayEvents.flatMap(item => {
                const s = this.convertUTCToLocal(item.startTime);
                const e = this.convertUTCToLocal(item.endTime);
                return [s.getHours(), e.getHours() + (e.getMinutes() > 0 ? 1 : 0)];
            });
            minHour = Math.min(minHour, Math.max(0, Math.min(...hours)));
            maxHour = Math.max(maxHour, Math.min(23, Math.max(...hours)));
        }
        const hourOffset = minHour; // topo da grade
        this._dayHourOffset = hourOffset; // guardar para labels
        return dayEvents.map(item => {
            const startTime = this.convertUTCToLocal(item.startTime);
            const endTime = this.convertUTCToLocal(item.endTime);
            const startHour = startTime.getHours();
            const startMinute = startTime.getMinutes();
            const duration = (endTime - startTime) / (1000 * 60); // minutos
            const top = ((startHour - hourOffset) * 60 + startMinute);
            const height = Math.max(duration, 20);
            const typeClass = item.type === 'TURMA' ? 'turma-event' : 'personal-event';
            return `
                <div class="day-event ${typeClass} agenda-item" 
                     data-id="${item.id}" 
                     data-type="${item.type}"
                     style="top: ${top}px; height: ${height}px;">
                    <div class="event-content">
                        <div class="event-time">
                            ${startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div class="event-title">${item.title}</div>
                        <div class="event-instructor">${item.instructor?.name || 'N/A'}</div>
                        <div class="event-area">${item.trainingArea?.name || 'N/A'}</div>
                    </div>
                </div>
            `;
        }).join('');
    }
    // Week View Methods
    renderWeekHeaders() {
        const weekStart = this.getWeekStart(this.currentDate);
        const headers = [''];
        for (let i = 0; i < 7; i++) {
            const day = new Date(weekStart);
            day.setDate(weekStart.getDate() + i);
            const isToday = day.toDateString() === new Date().toDateString();
            const dayClass = isToday ? 'week-header-day today' : 'week-header-day';
            headers.push(`
                <div class="${dayClass}">
                    <div class="day-name">${this.getDayName(day)}</div>
                    <div class="day-number">${day.getDate()}</div>
                </div>
            `);
        }
        return headers.join('');
    }
    renderWeekColumns() {
        const weekStart = this.getWeekStart(this.currentDate);
        const columns = [];
        // Analisar todos os eventos da semana para ajustar janela
        const weekEvents = this.agendaData.filter(item => {
            const d = this.convertUTCToLocal(item.startTime);
            const start = new Date(weekStart);
            const end = new Date(weekStart);
            end.setDate(start.getDate() + 6);
            end.setHours(23, 59, 59, 999);
            return d >= start && d <= end;
        });
        let minHour = 6, maxHour = 22;
        if (weekEvents.length) {
            const hours = weekEvents.flatMap(item => {
                const s = this.convertUTCToLocal(item.startTime);
                const e = this.convertUTCToLocal(item.endTime);
                return [s.getHours(), e.getHours() + (e.getMinutes() > 0 ? 1 : 0)];
            });
            minHour = Math.min(minHour, Math.max(0, Math.min(...hours)));
            maxHour = Math.max(maxHour, Math.min(23, Math.max(...hours)));
        }
        const hourOffset = minHour;
        const hoursVisible = Math.max(1, maxHour - minHour);
        this._weekHourOffset = hourOffset;
        for (let i = 0; i < 7; i++) {
            const day = new Date(weekStart);
            day.setDate(weekStart.getDate() + i);
            const dayDateString = day.toISOString().split('T')[0];
            const dayEvents = this.agendaData.filter(item => {
                return this.isSameDate(item.startTime, day);
            });
            columns.push(`
                <div class="week-column" data-date="${dayDateString}" style="min-height:${hoursVisible * 60}px">
                    ${dayEvents.map(item => this.renderWeekEvent(item, hourOffset)).join('')}
                </div>
            `);
        }
        return columns.join('');
    }
    renderWeekEvent(item, hourOffset = 6) {
        const startTime = this.convertUTCToLocal(item.startTime);
        const endTime = this.convertUTCToLocal(item.endTime);
        const startHour = startTime.getHours();
        const startMinute = startTime.getMinutes();
        const duration = (endTime - startTime) / (1000 * 60);
        const top = ((startHour - hourOffset) * 60 + startMinute);
        const height = Math.max(duration, 20);
        const typeClass = item.type === 'TURMA' ? 'turma-event' : 'personal-event';

        // Debug log para posicionamento
        console.log(`📅 Event positioning for "${item.title}":`, {
            originalStartTime: item.startTime,
            originalEndTime: item.endTime,
            convertedStartTime: startTime.toISOString(),
            convertedEndTime: endTime.toISOString(),
            startHour,
            startMinute,
            hourOffset,
            top: `${top}px`,
            height: `${height}px`,
            duration: `${duration} minutes`
        });

        return `
            <div class="week-event ${typeClass} agenda-item" 
                 data-id="${item.id}" 
                 data-type="${item.type}"
                 style="top: ${top}px; height: ${height}px;">
                <div class="event-content">
                    <div class="event-time">
                        ${startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div class="event-title">${item.title}</div>
                </div>
            </div>
        `;
    }
    // Month View Methods
    formatMonthTitle() {
        return this.currentDate.toLocaleDateString('pt-BR', {
            month: 'long',
            year: 'numeric'
        });
    }
    renderMonthHeaders() {
        const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        return dayNames.map(day => `<div class="month-header-day">${day}</div>`).join('');
    }
    renderMonthCells() {
        const monthStart = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const monthEnd = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
        const calendarStart = this.getWeekStart(monthStart);
        const calendarEnd = this.getWeekEnd(monthEnd);
        const cells = [];
        const currentDate = new Date(calendarStart);
        while (currentDate <= calendarEnd) {
            const isCurrentMonth = currentDate.getMonth() === this.currentDate.getMonth();
            const isToday = currentDate.toDateString() === new Date().toDateString();
            const isSelected = currentDate.toDateString() === this.currentDate.toDateString();
            const currentDateString = currentDate.toISOString().split('T')[0];
            const dayEvents = this.agendaData.filter(item => {
                return this.isSameDate(item.startTime, currentDate);
            });
            let cellClass = 'month-cell';
            if (!isCurrentMonth) cellClass += ' other-month';
            if (isToday) cellClass += ' today';
            if (isSelected) cellClass += ' selected';
            cells.push(`
                <div class="${cellClass}" 
                     data-date="${currentDateString}">
                    <div class="cell-header">
                        <span class="cell-number">${currentDate.getDate()}</span>
                        ${dayEvents.length > 0 ? `<span class="event-count">${dayEvents.length}</span>` : ''}
                    </div>
                    <div class="cell-events">
                        ${dayEvents.slice(0, 3).map(item => this.renderMonthEvent(item)).join('')}
                        ${dayEvents.length > 3 ? `<div class="more-events">+${dayEvents.length - 3} mais</div>` : ''}
                    </div>
                </div>
            `);
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return cells.join('');
    }
    renderMonthEvent(item) {
        const startTime = this.convertUTCToLocal(item.startTime);
        const typeClass = item.type === 'TURMA' ? 'turma-event' : 'personal-event';
        return `
            <div class="month-event ${typeClass} agenda-item" 
                 data-id="${item.id}" 
                 data-type="${item.type}">
                <span class="event-time">${startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                <span class="event-title">${item.title.length > 15 ? item.title.substring(0, 15) + '...' : item.title}</span>
            </div>
        `;
    }
    renderTimelineHours() {
        const base = this.currentView === 'day' ? (this._dayHourOffset ?? 6) : (this._weekHourOffset ?? 6);
        const limit = 23; // mostrar até 23:00 se necessário
        const hours = [];
        for (let hour = base; hour <= limit; hour++) {
            hours.push(`
                <div class="timeline-hour">
                    ${hour.toString().padStart(2, '0')}:00
                </div>
            `);
        }
        return hours.join('');
    }
    // Navigation and utility methods
    setupNavigationEvents() {
        // View switcher events are handled in setupEventListeners
        // Navigation button events are handled in setupEventListeners
    }
    switchView(view) {
        this.currentView = view;
        this.renderCurrentView();
        // Update active button
        document.querySelectorAll('.view-switcher-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
    }
    navigatePrevious() {
        switch (this.currentView) {
            case 'day':
                this.currentDate.setDate(this.currentDate.getDate() - 1);
                break;
            case 'week':
                this.currentDate.setDate(this.currentDate.getDate() - 7);
                break;
            case 'month':
                this.currentDate.setMonth(this.currentDate.getMonth() - 1);
                break;
        }
        this.loadAgendaData();
    }
    navigateNext() {
        switch (this.currentView) {
            case 'day':
                this.currentDate.setDate(this.currentDate.getDate() + 1);
                break;
            case 'week':
                this.currentDate.setDate(this.currentDate.getDate() + 7);
                break;
            case 'month':
                this.currentDate.setMonth(this.currentDate.getMonth() + 1);
                break;
        }
        this.loadAgendaData();
    }
    goToToday() {
        this.currentDate = new Date();
        this.loadAgendaData();
    }
    selectDate(dateString) {
        this.currentDate = new Date(dateString);
        // Switch to day view when selecting a date in month view
        if (this.currentView === 'month') {
            this.switchView('day');
        } else {
            this.renderCurrentView();
        }
    }
    // Semana começa na segunda-feira (ISO):
    // getWeekStart/getWeekEnd/formatWeekRange/getDayName padronizados
    formatWeekRange() {
        const start = this.getWeekStart(this.currentDate);
        const end = this.getWeekEnd(this.currentDate);
        return `${start.toLocaleDateString('pt-BR')} - ${end.toLocaleDateString('pt-BR')}`;
    }
    getWeekStart(date) {
        const d = new Date(date); // cópia
        d.setHours(0, 0, 0, 0);
        const day = d.getDay();
        // Ajuste: domingo (0) vira 7 para facilitar cálculo ISO (segunda=1)
        const isoDay = day === 0 ? 7 : day;
        d.setDate(d.getDate() - (isoDay - 1));
        return d;
    }
    getWeekEnd(date) {
        const start = this.getWeekStart(date);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        return end;
    }
    getDayName(date) {
        const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
        const day = date.getDay();
        // Mapear getDay() (0..6) para ordem começando na segunda
        // 1..6 => 0..5; 0 (Domingo) => 6
        const idx = day === 0 ? 6 : day - 1;
        return days[idx];
    }
    // Utility method for consistent date comparison (LOCAL Y/M/D)
    isSameDate(date1, date2) {
        const d1 = this.convertUTCToLocal(date1 instanceof Date ? date1 : new Date(date1));
        const d2 = this.convertUTCToLocal(date2 instanceof Date ? date2 : new Date(date2));
        return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
    }
    // Converte data UTC (ISO com 'Z') para objeto Date local sem aplicar offset duas vezes
    convertUTCToLocal(utcDateString) {
        if (!utcDateString) return new Date();
        // Se já é um objeto Date, retorna-o (Date já representa o instante corretamente)
        if (utcDateString instanceof Date) return utcDateString;
        // Quando passamos uma string ISO com 'Z' para new Date(), o objeto já representa
        // o mesmo instante em horário local. Não aplicar offset novamente.
        return new Date(utcDateString);
    }
    showSchedulingOptions(date, time) {
        // Quick scheduling modal
        const timeString = `${date} ${time}`;
        console.log('🗓️ Quick scheduling for:', timeString);
        // Pre-fill form with selected date/time and show modal
        this.showUnifiedModal(null, {
            date: date,
            startTime: time
        });
    }
    renderTimelineItems() {
        const todayItems = this.agendaData.filter(item => this.isSameDate(item.startTime, this.currentDate));
        return todayItems.map(item => {
            const startTime = this.convertUTCToLocal(item.startTime);
            const endTime = this.convertUTCToLocal(item.endTime);
            const startHour = startTime.getHours();
            const startMinute = startTime.getMinutes();
            const duration = (endTime - startTime) / (1000 * 60); // em minutos
            const top = ((startHour - 6) * 60 + startMinute) * 1; // 1px por minuto
            const height = Math.max(duration * 1, 20); // mínima de 20px
            const typeClass = item.type === 'TURMA' ? 'turma-timeline' : 'personal-timeline';
            return `
                <div class="timeline-item ${typeClass} agenda-item" 
                     data-id="${item.id}" 
                     data-type="${item.type}"
                     style="top: ${top}px; height: ${height}px;">
                    <div class="timeline-item-content">
                        <div class="timeline-item-title">${item.title}</div>
                        <div class="timeline-item-time">
                            ${startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - 
                            ${endTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div class="timeline-item-instructor">${item.instructor?.name || 'N/A'}</div>
                    </div>
                </div>
            `;
        }).join('');
    }
    // Event Handlers
    handleViewSwitch(view) {
        this.currentView = view;
        this.renderCurrentView();
        // Update active button
        document.querySelectorAll('.view-switcher-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
    }
    handleFilterToggle(filterElement) {
        const filterType = filterElement.dataset.filter;
        const filterValue = filterElement.value;
        this.selectedFilters[filterType] = filterValue;
        this.loadAgendaData();
    }
    async handleAgendaItemClick(itemId, itemType) {
        console.log('🎯 Agenda item clicked:', itemId, itemType);
        // Simple debounce to avoid rapid repeated clicks
        const now = Date.now();
        if (this._lastClick && now - this._lastClick < 600) {
            return;
        }
        this._lastClick = now;

        // Redirect both TURMA and PERSONAL to the consolidated editor
        if (itemType === 'TURMA') {
            // Open consolidated Turma editor route (spa-router expects '#turma-editor/<id>')
            window.location.hash = `#turma-editor/${itemId}`;
            return;
        } else if (itemType === 'PERSONAL') {
            // Open consolidated Turma editor with personal tab active
            window.location.hash = `#turma-editor/personal/${itemId}`;
            return;
        }

        // Fallback for other types - load details and show modal
        try {
            await this.api.fetchWithStates(`/api/hybrid-agenda/${itemId}`, {
                method: 'GET',
                onSuccess: (data) => {
                    this.showUnifiedModal(data);
                },
                onError: (error) => {
                    console.error('❌ Error loading item for edit:', error);
                    window.app?.handleError(error, 'hybrid-agenda-item-load');
                }
            });
        } catch (error) {
            console.error('❌ Error loading item for edit:', error);
            window.app?.handleError(error, 'hybrid-agenda-item-load');
        }
    }
    handleCreateAgenda() {
        this.showCreateAgendaModal();
    }
    handleDateNavigation(direction) {
        if (direction === 'prev') {
            this.currentDate.setDate(this.currentDate.getDate() - 7);
        } else if (direction === 'next') {
            this.currentDate.setDate(this.currentDate.getDate() + 7);
        }
        this.loadAgendaData();
        this.loadStats();
    }
    handleDateChange(dateValue) {
        this.currentDate = new Date(dateValue);
        this.loadAgendaData();
        this.loadStats();
    }
    // Navigation methods (AGENTS.md: Full-screen pages, no modals)
    navigateToTurmaDetails(turmaId) {
        console.log('🧭 Navigating to turma details:', turmaId);
        this.showTurmaDetailsPage(turmaId);
    }
    navigateToPersonalSessionDetails(sessionId) {
        console.log('🧭 Navigating to personal session details:', sessionId);
        this.showPersonalSessionDetailsPage(sessionId);
    }
    async showTurmaDetailsPage(turmaId) {
        const container = document.getElementById('agenda-container');
        if (!container) return;
        try {
            // Show loading state
            container.innerHTML = this.getLoadingStateHTML('Carregando detalhes da turma...');
            // Fetch turma details using fetchWithStates
            await this.api.fetchWithStates(`/api/turmas/${turmaId}`, {
                method: 'GET',
                onSuccess: (data) => {
                    container.innerHTML = this.getTurmaDetailsPageHTML(data);
                    this.setupTurmaDetailsEvents(turmaId);
                },
                onError: (error) => {
                    throw new Error('Turma não encontrada');
                }
            });
        } catch (error) {
            console.error('❌ Error loading turma details:', error);
            container.innerHTML = this.getErrorStateHTML('Erro ao carregar detalhes da turma', error.message);
            window.app?.handleError(error, 'turma-details-load');
        }
    }
    async showPersonalSessionDetailsPage(sessionId) {
        const container = document.getElementById('agenda-container');
        if (!container) return;
        try {
            // Show loading state
            container.innerHTML = this.getLoadingStateHTML('Carregando detalhes da sessão...');
            // Fetch session details using fetchWithStates
            await this.api.fetchWithStates(`/api/personal-sessions/${sessionId}`, {
                method: 'GET',
                onSuccess: (data) => {
                    container.innerHTML = this.getPersonalSessionDetailsPageHTML(data);
                    this.setupPersonalSessionDetailsEvents(sessionId);
                },
                onError: (error) => {
                    throw new Error('Sessão não encontrada');
                }
            });
        } catch (error) {
            console.error('❌ Error loading session details:', error);
            container.innerHTML = this.getErrorStateHTML('Erro ao carregar detalhes da sessão', error.message);
            window.app?.handleError(error, 'session-details-load');
        }
    }
    getTurmaDetailsPageHTML(turma) {
        return `
            <div class="module-isolated-hybrid-agenda">
                <div class="module-header-premium">
                    <div class="breadcrumb-nav">
                        <span class="breadcrumb-item" onclick="hybridAgenda.backToMain()">📅 Agenda Híbrida</span>
                        <span class="breadcrumb-separator">›</span>
                        <span class="breadcrumb-item active">Turma: ${turma.title}</span>
                    </div>
                    <div class="header-content">
                        <div class="header-title">
                            <h2>👥 ${turma.title}</h2>
                            <p>Detalhes da aula coletiva</p>
                        </div>
                        <div class="header-actions">
                            <button class="btn-secondary" onclick="hybridAgenda.backToMain()">
                                â† Voltar
                            </button>
                            <button class="btn-primary" onclick="hybridAgenda.editTurma('${turma.id}')">
                                ï¸ Editar
                            </button>
                        </div>
                    </div>
                </div>
                <div class="details-full-screen">
                    <div class="details-card-premium">
                        <div class="details-header" style="background: var(--gradient-primary);">
                            <div class="details-title">
                                <div class="details-icon">👥</div>
                                <div>
                                    <h2>${turma.title}</h2>
                                    <p>${turma.description || 'Aula coletiva de Krav Maga'}</p>
                                </div>
                            </div>
                            <div class="status-badge status-${turma.status.toLowerCase()}">
                                ${this.getStatusLabel(turma.status)}
                            </div>
                        </div>
                        <div class="details-content">
                            <div class="details-grid">
                                <div class="detail-item">
                                    <span class="detail-label">📅 Data</span>
                                    <span class="detail-value">${this.formatDateForDisplay(turma.date)}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">🕐 Horário</span>
                                    <span class="detail-value">${turma.startTime} - ${turma.endTime}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">⏱️ Duração</span>
                                    <span class="detail-value">${turma.duration} minutos</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">👨‍🏫 Instrutor</span>
                                    <span class="detail-value">${turma.instructor?.name || 'Não definido'}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">👥 Alunos</span>
                                    <span class="detail-value">${turma.currentStudents || 0}/${turma.maxStudents || 0}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">📍 Local</span>
                                    <span class="detail-value">${turma.trainingArea?.name || 'Não definido'}</span>
                                </div>
                            </div>
                            ${turma.description ? `
                                <div class="detail-description">
                                    <h3>Descrição</h3>
                                    <p>${turma.description}</p>
                                </div>
                            ` : ''}
                            <div class="details-actions">
                                <button class="btn-secondary" onclick="hybridAgenda.backToMain()">
                                    â† Voltar é  Agenda
                                </button>
                                <button class="btn-primary" onclick="hybridAgenda.editTurma('${turma.id}')">
                                    ï¸ Editar Turma
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    getPersonalSessionDetailsPageHTML(session) {
        return `
            <div class="module-isolated-hybrid-agenda">
                <div class="module-header-premium">
                    <div class="breadcrumb-nav">
                        <span class="breadcrumb-item" onclick="hybridAgenda.backToMain()">📅 Agenda Híbrida</span>
                        <span class="breadcrumb-separator">â†’</span>
                        <span class="breadcrumb-item active">Personal: ${session.title}</span>
                    </div>
                    <div class="header-content">
                        <div class="header-title">
                            <h2>🏃‍♂️ ${session.title}</h2>
                            <p>Detalhes da sessão personal</p>
                        </div>
                        <div class="header-actions">
                            <button class="btn-secondary" onclick="hybridAgenda.backToMain()">
                                â† Voltar
                            </button>
                            <button class="btn-primary" onclick="hybridAgenda.editPersonalSession('${session.id}')">
                                ï¸ Editar
                            </button>
                        </div>
                    </div>
                </div>
                <div class="details-full-screen">
                    <div class="details-card-premium">
                        <div class="details-header" style="background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);">
                            <div class="details-title">
                                <div class="details-icon">🏃‍♂️</div>
                                <div>
                                    <h2>${session.title}</h2>
                                    <p>${session.description || 'Sessão personal de Krav Maga'}</p>
                                </div>
                            </div>
                            <div class="status-badge status-${session.status.toLowerCase()}">
                                ${this.getStatusLabel(session.status)}
                            </div>
                        </div>
                        <div class="details-content">
                            <div class="details-grid">
                                <div class="detail-item">
                                    <span class="detail-label">📅 Data</span>
                                    <span class="detail-value">${this.formatDateForDisplay(session.date)}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">🕐 Horário</span>
                                    <span class="detail-value">${session.startTime} - ${session.endTime}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">⏱️ Duração</span>
                                    <span class="detail-value">${session.duration} minutos</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">👨‍🏫 Instrutor</span>
                                    <span class="detail-value">${session.instructor?.name || 'Não definido'}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">🧍 Aluno</span>
                                    <span class="detail-value">${session.student?.name || 'Não definido'}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">📍 Local</span>
                                    <span class="detail-value">${session.trainingArea?.name || 'Não definido'}</span>
                                </div>
                            </div>
                            ${session.description ? `
                                <div class="detail-description">
                                    <h3>Descrição</h3>
                                    <p>${session.description}</p>
                                </div>
                            ` : ''}
                            <div class="details-actions">
                                <button class="btn-secondary" onclick="hybridAgenda.backToMain()">
                                    â† Voltar é  Agenda
                                </button>
                                <button class="btn-primary" onclick="hybridAgenda.editPersonalSession('${session.id}')">
                                    ✏️ Editar Sessão
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    setupTurmaDetailsEvents(turmaId) {
        // Setup any specific event handlers for turma details page
        console.log('🛠️ Setting up turma details events for:', turmaId);
    }
    setupPersonalSessionDetailsEvents(sessionId) {
        // Setup any specific event handlers for personal session details page
        console.log('🛠️ Setting up personal session details events for:', sessionId);
    }
    editTurma(turmaId) {
        console.log('🛠️ Editing turma:', turmaId);
        // TODO: Implement turma editing page (full-screen)
        this.showUnifiedModal(); // For now, use unified modal
    }
    editPersonalSession(sessionId) {
        console.log('🛠️ Editing personal session:', sessionId);
        // TODO: Implement personal session editing page (full-screen)
        this.showUnifiedModal(); // For now, use unified modal
    }
    getLoadingStateHTML(message = 'Carregando...') {
        return `
            <div class="module-isolated-hybrid-agenda">
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <h3>${message}</h3>
                </div>
            </div>
        `;
    }
    getErrorStateHTML(title, message) {
        return `
            <div class="module-isolated-hybrid-agenda">
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <h3>${title}</h3>
                    <p>${message}</p>
                    <button class="btn-secondary" onclick="hybridAgenda.backToMain()">
                        â† Voltar é  Agenda
                    </button>
                </div>
            </div>
        `;
    }
    showCreateAgendaModal() {
        this.showSchedulingOptions(new Date(), '09:00');
    }
    // Agenda Scheduler Integration
    showSchedulingOptions(date, time) {
        const schedulingMenu = this.createSchedulingMenu(date, time);
        // Posicionar menu no centro da tela
        schedulingMenu.style.position = 'fixed';
        schedulingMenu.style.top = '50%';
        schedulingMenu.style.left = '50%';
        schedulingMenu.style.transform = 'translate(-50%, -50%)';
        schedulingMenu.style.zIndex = '2000';
        document.body.appendChild(schedulingMenu);
        // Remover menu ao clicar fora
        setTimeout(() => {
            document.addEventListener('click', (e) => {
                if (!schedulingMenu.contains(e.target)) {
                    schedulingMenu.remove();
                }
            }, { once: true });
        }, 100);
    }
    createSchedulingMenu(date, time) {
        const menu = document.createElement('div');
        menu.className = 'scheduling-menu module-isolated-hybrid-agenda';
        const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
        menu.innerHTML = `
            <div class="scheduling-menu-content">
                <div class="scheduling-menu-header">
                    <h4>🗓️ Agendar para ${this.formatDateForDisplay(dateStr)} às ${time}</h4>
                </div>
                <div class="scheduling-options">
                    <button class="scheduling-option personal-training" 
                            data-type="personal" data-date="${dateStr}" data-time="${time}">
                        <div class="option-icon">🧍</div>
                        <div class="option-content">
                            <div class="option-title">Personal Training</div>
                            <div class="option-description">Sessão individual com aluno específico</div>
                        </div>
                    </button>
                    <button class="scheduling-option collective-class" 
                            data-type="collective" data-date="${dateStr}" data-time="${time}">
                        <div class="option-icon">🥋</div>
                        <div class="option-content">
                            <div class="option-title">Aula Coletiva</div>
                            <div class="option-description">Turma com méºltiplos alunos</div>
                        </div>
                    </button>
                    <button class="scheduling-option event-workshop" 
                            data-type="event" data-date="${dateStr}" data-time="${time}">
                        <div class="option-icon">🎯</div>
                        <div class="option-content">
                            <div class="option-title">Evento/Workshop</div>
                            <div class="option-description">Atividade especial ou treinamento</div>
                        </div>
                    </button>
                </div>
                <div class="scheduling-menu-footer">
                    <button class="btn-secondary close-menu-btn">Cancelar</button>
                </div>
            </div>
        `;
        // Event listeners para as opções
        menu.querySelectorAll('.scheduling-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const type = option.dataset.type;
                const optionDate = option.dataset.date;
                const optionTime = option.dataset.time;
                this.startSchedulingFlow(type, optionDate, optionTime);
                menu.remove();
            });
        });
        // Event listener para botão de cancelar
        menu.querySelector('.close-menu-btn').addEventListener('click', () => {
            menu.remove();
        });
        return menu;
    }
    async startSchedulingFlow(type, date, time) {
        try {
            switch (type) {
                case 'personal':
                    await this.schedulePersonalTraining(date, time);
                    break;
                case 'collective':
                    await this.scheduleCollectiveClass(date, time);
                    break;
                case 'event':
                    await this.scheduleEvent(date, time);
                    break;
                default:
                    throw new Error(`Tipo de agendamento não reconhecido: ${type}`);
            }
        } catch (error) {
            console.error('❌ Error starting scheduling flow:', error);
            if (window.app) {
                window.app.handleError(error, 'HybridAgenda.startSchedulingFlow');
            }
        }
    }
    async schedulePersonalTraining(date, time) {
        const formData = await this.showPersonalTrainingForm(date, time);
        if (formData) {
            await this.createPersonalSession(formData);
        }
    }
    async scheduleCollectiveClass(date, time) {
        const formData = await this.showCollectiveClassForm(date, time);
        if (formData) {
            await this.createCollectiveClass(formData);
        }
    }
    async scheduleEvent(date, time) {
        alert('Funcionalidade de eventos será implementada em breve!');
    }
    async showPersonalTrainingForm(date, time) {
        return new Promise((resolve) => {
            const formContainer = this.createFormContainer('Personal Training', date, time);
            formContainer.innerHTML = `
                <form class="scheduling-form personal-training-form">
                    <div class="form-grid">
                        <div class="form-group">
                            <label>👥 Aluno *</label>
                            <select name="studentId" required>
                                <option value="">Selecione o aluno...</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>👨‍🏫 Instrutor *</label>
                            <select name="instructorId" required>
                                <option value="">Selecione o instrutor...</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>🎓 Curso</label>
                            <select name="courseId">
                                <option value="">Selecione o curso...</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>📍 Local</label>
                            <select name="trainingAreaId">
                                <option value="">Selecione o local...</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>⏱️ Duração (minutos)</label>
                            <input type="number" name="duration" value="60" min="30" max="180" step="15">
                        </div>
                        <div class="form-group full-width">
                            <label>📝 Observações</label>
                            <textarea name="notes" placeholder="Observações sobre a sessão..."></textarea>
                        </div>
                        <input type="hidden" name="date" value="${date}">
                        <input type="hidden" name="time" value="${time}">
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-secondary cancel-btn">Cancelar</button>
                        <button type="submit" class="btn-primary">📅 Agendar Personal</button>
                    </div>
                </form>
            `;
            this.setupFormHandlers(formContainer, resolve);
            this.loadFormDependencies(formContainer);
        });
    }
    async showCollectiveClassForm(date, time) {
        return new Promise((resolve) => {
            const formContainer = this.createFormContainer('Aula Coletiva', date, time);
            formContainer.innerHTML = `
                <form class="scheduling-form collective-class-form">
                    <div class="form-grid">
                        <div class="form-group">
                            <label>🏋️‍♂️ Nome da Turma *</label>
                            <input type="text" name="turmaName" required 
                                   placeholder="Ex: Krav Maga Iniciante - Terça 19h">
                        </div>
                        <div class="form-group">
                            <label>👨‍🏫 Instrutor *</label>
                            <select name="instructorId" required>
                                <option value="">Selecione o instrutor...</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>🎓 Curso *</label>
                            <select name="courseId" required>
                                <option value="">Selecione o curso...</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>📍 Local</label>
                            <select name="trainingAreaId">
                                <option value="">Selecione o local...</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>👥 Capacidade Máxima</label>
                            <input type="number" name="maxStudents" value="20" min="1" max="50">
                        </div>
                        <div class="form-group">
                            <label>⏱️ Duração (minutos)</label>
                            <input type="number" name="duration" value="60" min="30" max="180" step="15">
                        </div>
                        <div class="form-group full-width">
                            <label>📝 Descrição</label>
                            <textarea name="description" placeholder="Descrição da turma..."></textarea>
                        </div>
                        <input type="hidden" name="date" value="${date}">
                        <input type="hidden" name="time" value="${time}">
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-secondary cancel-btn">Cancelar</button>
                        <button type="submit" class="btn-primary">🥋 Criar Turma</button>
                    </div>
                </form>
            `;
            this.setupFormHandlers(formContainer, resolve);
            this.loadFormDependencies(formContainer);
        });
    }
    createFormContainer(title, date, time) {
        // Remove formulário existente se houver
        const existingForm = document.querySelector('.scheduling-form-overlay');
        if (existingForm) {
            existingForm.remove();
        }
        const overlay = document.createElement('div');
        overlay.className = 'scheduling-form-overlay module-isolated-hybrid-agenda';
        const displayDate = this.formatDateForDisplay(date);
        overlay.innerHTML = `
            <div class="scheduling-form-container">
                <div class="form-header">
                    <h3>📅 ${title}</h3>
                    <p class="form-subtitle">${displayDate} às ${time}</p>
                    <button class="close-btn" type="button" aria-label="Fechar">&times;</button>
                </div>
                <div class="form-content">
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        // Event listener para fechar
        overlay.querySelector('.close-btn').addEventListener('click', () => {
            overlay.remove();
        });
        return overlay.querySelector('.form-content');
    }
    setupFormHandlers(formContainer, resolve) {
        const form = formContainer.querySelector('form');
        const cancelBtn = formContainer.querySelector('.cancel-btn');
        const overlay = formContainer.closest('.scheduling-form-overlay');
        // Cancel button
        cancelBtn?.addEventListener('click', () => {
            overlay.remove();
            resolve(null);
        });
        // Form submission
        form?.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            overlay.remove();
            resolve(data);
        });
    }
    async loadFormDependencies(formContainer) {
        try {
            // Mock data para desenvolvimento - na implementação real, faria requests para as APIs
            const mockStudents = [
                { id: 'student-1', name: 'Lorraine C S M Barbosa Claudio' },
                { id: 'student-2', name: 'João Silva' },
                { id: 'student-3', name: 'Maria Santos' }
            ];
            const mockInstructors = [
                { id: 'instructor-1', name: 'Prof. Marcus Silva' },
                { id: 'instructor-2', name: 'Prof. Amanda Santos' },
                { id: 'instructor-3', name: 'Prof. Carlos Lima' }
            ];
            const mockCourses = [
                { id: 'course-1', name: 'Krav Maga Iniciante' },
                { id: 'course-2', name: 'Krav Maga Intermediário' },
                { id: 'course-3', name: 'Krav Maga Avançado' }
            ];
            const mockTrainingAreas = [
                { id: 'area-1', name: 'Tatame Principal' },
                { id: 'area-2', name: 'Sala Personal' },
                { id: 'area-3', name: 'Área Externa' }
            ];
            // Popular select de alunos
            const studentSelect = formContainer.querySelector('select[name="studentId"]');
            if (studentSelect) {
                mockStudents.forEach(student => {
                    const option = document.createElement('option');
                    option.value = student.id;
                    option.textContent = student.name;
                    studentSelect.appendChild(option);
                });
            }
            // Popular select de instrutores
            const instructorSelect = formContainer.querySelector('select[name="instructorId"]');
            if (instructorSelect) {
                mockInstructors.forEach(instructor => {
                    const option = document.createElement('option');
                    option.value = instructor.id;
                    option.textContent = instructor.name;
                    instructorSelect.appendChild(option);
                });
            }
            // Popular select de cursos
            const courseSelect = formContainer.querySelector('select[name="courseId"]');
            if (courseSelect) {
                mockCourses.forEach(course => {
                    const option = document.createElement('option');
                    option.value = course.id;
                    option.textContent = course.name;
                    courseSelect.appendChild(option);
                });
            }
            // Popular select de áreas de treinamento
            const areaSelect = formContainer.querySelector('select[name="trainingAreaId"]');
            if (areaSelect) {
                mockTrainingAreas.forEach(area => {
                    const option = document.createElement('option');
                    option.value = area.id;
                    option.textContent = area.name;
                    areaSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('❌ Error loading form dependencies:', error);
            if (window.app) {
                window.app.handleError(error, 'HybridAgenda.loadFormDependencies');
            }
        }
    }
    async createPersonalSession(formData) {
        try {
            const sessionData = {
                studentId: formData.studentId,
                instructorId: formData.instructorId,
                courseId: formData.courseId || null,
                trainingAreaId: formData.trainingAreaId || null,
                scheduledDate: `${formData.date}T${formData.time}:00.000Z`,
                duration: parseInt(formData.duration) || 60,
                notes: formData.notes || '',
                status: 'SCHEDULED',
                type: 'PERSONAL'
            };
            // Mock success - na implementação real faria request para API
            console.log('Creating personal session:', sessionData);
            this.showSuccessMessage('Personal Training agendado com sucesso!');
            // Simular adição no calendário
            this.addMockSessionToCalendar(sessionData, 'PERSONAL_SESSION');
        } catch (error) {
            console.error('❌ Error creating personal session:', error);
            if (window.app) {
                window.app.handleError(error, 'HybridAgenda.createPersonalSession');
            }
        }
    }
    async createCollectiveClass(formData) {
        try {
            const classData = {
                title: formData.turmaName,
                courseId: formData.courseId,
                instructorId: formData.instructorId,
                trainingAreaId: formData.trainingAreaId,
                scheduledDate: `${formData.date}T${formData.time}:00.000Z`,
                duration: parseInt(formData.duration) || 60,
                maxStudents: parseInt(formData.maxStudents) || 20,
                description: formData.description || '',
                type: 'COLLECTIVE',
                status: 'SCHEDULED'
            };
            // Mock success - na implementação real faria request para API
            console.log('Creating collective class:', classData);
            this.showSuccessMessage('Aula coletiva agendada com sucesso!');
            // Simular adição no calendário
            this.addMockSessionToCalendar(classData, 'TURMA');
        } catch (error) {
            console.error('❌ Error creating collective class:', error);
            if (window.app) {
                window.app.handleError(error, 'HybridAgenda.createCollectiveClass');
            }
        }
    }
    addMockSessionToCalendar(sessionData, type) {
        // Adiciona sessão mockup aos dados do calendário
        const mockItem = {
            id: `mock-${Date.now()}`,
            type: type,
            referenceId: `ref-${Date.now()}`,
            title: sessionData.title || `${type === 'PERSONAL_SESSION' ? 'Personal Training' : 'Aula Coletiva'}`,
            description: sessionData.notes || sessionData.description || '',
            startTime: sessionData.scheduledDate,
            endTime: new Date(new Date(sessionData.scheduledDate).getTime() + (sessionData.duration * 60000)).toISOString(),
            instructor: { name: 'Instrutor Selecionado' },
            unit: { name: 'Unidade Centro' },
            trainingArea: { name: 'Local Selecionado' },
            status: 'SCHEDULED',
            maxStudents: type === 'PERSONAL_SESSION' ? 1 : (sessionData.maxStudents || 20),
            actualStudents: 0,
            isRecurring: false,
            color: type === 'PERSONAL_SESSION' ? '#764ba2' : '#667eea'
        };
        // Adicionar aos dados existentes
        this.agendaData.push(mockItem);
        // Re-renderizar vista atual
        this.renderCurrentView();
    }
    showSuccessMessage(message) {
        // Criar toast de sucesso
        const toast = document.createElement('div');
        toast.className = 'success-toast module-isolated-hybrid-agenda';
        toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-icon">…</div>
                <div class="toast-message">${message}</div>
            </div>
        `;
        document.body.appendChild(toast);
        // Remover apé³s 3 segundos
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    formatDateForDisplay(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }
    // Utility methods (removidas duplicatas acima)
    getStatusLabel(status) {
        const statusLabels = {
            'SCHEDULED': 'Agendado',
            'CONFIRMED': 'Confirmado',
            'IN_PROGRESS': 'Em Andamento',
            'COMPLETED': 'Concluído',
            'CANCELLED': 'Cancelado',
            'POSTPONED': 'Adiado'
        };
        return statusLabels[status] || status;
    }
    showEmptyState() {
        const container = document.getElementById('agenda-container');
        if (container) {
            container.innerHTML = `
                <div class="module-isolated-hybrid-agenda">
                    ${this.renderHeader()}
                    ${this.renderFilters()}
                    <div class="empty-state">
                        <div class="empty-state-icon">📅</div>
                        <h3>Nenhum agendamento encontrado</h3>
                        <p>Não há turmas ou sessões de personal training agendadas para este período.</p>
                        <button class="btn-primary create-agenda-btn">
                            • Criar Primeiro Agendamento
                        </button>
                    </div>
                </div>
            `;
        }
    }
    showErrorState(error) {
        const container = document.getElementById('agenda-container');
        if (container) {
            container.innerHTML = `
                <div class="module-isolated-hybrid-agenda">
                    ${this.renderHeader()}
                    <div class="error-state">
                        <div class="error-state-icon">⚠️</div>
                        <h3>Erro ao carregar agenda</h3>
                        <p>Ocorreu um erro ao carregar os dados da agenda.</p>
                        <button class="btn-secondary" onclick="location.reload()">
                            🔁 Tentar Novamente
                        </button>
                    </div>
                </div>
            `;
        }
        if (window.app) {
            window.app.handleError(error, 'hybrid-agenda-load');
        }
    }
    // ==================== UNIFIED MODAL (FULL-SCREEN PAGE) ====================
    // Following AGENTS.md: No modals, use full-screen pages instead
    // Supports both create and edit modes (consolidated from simple.js)
    showUnifiedModal(editData = null) {
        const isEditMode = !!editData;
        const modeText = isEditMode ? 'Editar' : 'Criar';
        const modeIcon = isEditMode ? '✏️' : '•';
        console.log(`🛠️ Showing unified ${isEditMode ? 'edit' : 'create'} page (full-screen)...`);
        const container = document.getElementById('agenda-container');
        if (!container) {
            console.error('❌ Container not found');
            return;
        }
        container.innerHTML = this.getUnifiedCreatePageHTML(editData, isEditMode, modeText, modeIcon);
        this.setupUnifiedFormEvents(editData, isEditMode);
        this.loadUnifiedFormData(editData);
    }
    getUnifiedCreatePageHTML(editData = null, isEditMode = false, modeText = 'Criar', modeIcon = '•') {
        const formTitle = isEditMode ? `${modeIcon} ${modeText} Agendamento` : `${modeIcon} ${modeText} Novo Agendamento`;
        const formSubtitle = isEditMode ? 'Edite os dados do agendamento' : 'Agende uma sessão personal ou aula coletiva';
        const hiddenIdField = isEditMode ? `<input type="hidden" name="id" value="${editData.id}">` : '';
        // Set default values for edit mode
        const defaultType = editData ? editData.type : 'PERSONAL_SESSION';
        const defaultTitle = editData ? editData.title : '';
        const defaultDescription = editData ? editData.description || '' : '';
        const defaultDate = editData ? new Date(editData.startTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        const defaultTime = editData ? new Date(editData.startTime).toTimeString().slice(0, 5) : '';
        const defaultDuration = editData ? Math.round((new Date(editData.endTime) - new Date(editData.startTime)) / (1000 * 60)) : 60;
        // Parse recurrence data if editing
        let defaultRecurring = 'false';
        let defaultDaysOfWeek = [];
        let defaultEndRecurrence = '';
        if (editData) {
            if (editData.isRecurring) {
                // default to weekly if recurring, then refine
                defaultRecurring = 'weekly';
                if (editData.recurrenceRule) {
                    try {
                        console.log('🛠️ Processing recurrence rule:', editData.recurrenceRule);
                        // Accept JSON string or plain string (e.g., 'WEEKLY')
                        let recurrenceData = null;
                        if (typeof editData.recurrenceRule === 'string' && editData.recurrenceRule.trim().startsWith('{')) {
                            recurrenceData = JSON.parse(editData.recurrenceRule);
                        }
                        if (recurrenceData) {
                            defaultRecurring = recurrenceData.type === 'WEEKLY' ? 'weekly' :
                                recurrenceData.type === 'MONTHLY' ? 'monthly' : 'weekly';
                            defaultDaysOfWeek = Array.isArray(recurrenceData.daysOfWeek) ? recurrenceData.daysOfWeek : [];
                            defaultEndRecurrence = recurrenceData.endDate ?
                                new Date(recurrenceData.endDate).toISOString().split('T')[0] : '';
                        } else if (typeof editData.recurrenceRule === 'string') {
                            const upper = editData.recurrenceRule.toUpperCase();
                            if (upper.includes('MONTH')) defaultRecurring = 'monthly';
                            else if (upper.includes('WEEK')) defaultRecurring = 'weekly';
                        }
                    } catch (e) {
                        console.warn('Could not parse recurrence rule:', editData.recurrenceRule);
                    }
                }
                // If days are empty, default to the event's weekday
                if (defaultDaysOfWeek.length === 0 && editData.startTime) {
                    const startLocal = new Date(editData.startTime);
                    defaultDaysOfWeek = [startLocal.getDay()];
                }
            } else {
                defaultRecurring = 'false';
            }
        }
        console.log('🛠️ Creating form with recurrence defaults:', {
            defaultRecurring,
            defaultDaysOfWeek,
            defaultEndRecurrence,
            isRecurring: editData?.isRecurring
        });
        return `
            <div class="module-isolated-hybrid-agenda">
                <div class="module-header-premium">
                    <div class="breadcrumb-nav">
                        <span class="breadcrumb-item" onclick="hybridAgenda.backToMain()">📅 Agenda Híbrida</span>
                        <span class="breadcrumb-separator">›</span>
                        <span class="breadcrumb-item active">${formTitle}</span>
                    </div>
                    <div class="header-content">
                        <div class="header-title">
                            <h2>📝 ${formTitle}</h2>
                            <p>${formSubtitle}</p>
                        </div>
                        <div class="header-actions">
                            <button class="btn-secondary" onclick="hybridAgenda.backToMain()">
                                ← Voltar
                            </button>
                            ${isEditMode ? `
                                <button class="btn-danger" onclick="hybridAgenda.deleteAgendaItem('${editData.id}')">
                                    🗑️ Excluir
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
                <div class="unified-form-container">
                    <form id="unified-agenda-form" class="unified-form" novalidate>
                        ${hiddenIdField}
                        <div class="form-section">
                            <h3>📋 Tipo de Agendamento</h3>
                            <div class="type-selector">
                                <label class="type-option data-card-premium">
                                    <input type="radio" name="type" value="PERSONAL_SESSION" 
                                           ${defaultType === 'PERSONAL_SESSION' ? 'checked' : ''} 
                                           ${isEditMode ? 'disabled' : ''} 
                                           onchange="hybridAgenda.toggleFormFields()">
                                    <span class="type-card">
                                        <div class="type-icon">🏃‍♂️</div>
                                        <strong>Personal Training</strong>
                                        <small>Sessão individual com instrutor</small>
                                    </span>
                                </label>
                                <label class="type-option data-card-premium">
                                    <input type="radio" name="type" value="TURMA" 
                                           ${defaultType === 'TURMA' ? 'checked' : ''} 
                                           ${isEditMode ? 'disabled' : ''} 
                                           onchange="hybridAgenda.toggleFormFields()">
                                    <span class="type-card">
                                        <div class="type-icon">👥</div>
                                        <strong>Aula Coletiva</strong>
                                        <small>Turma com múltiplos alunos</small>
                                    </span>
                                </label>
                            </div>
                            ${isEditMode ? `<input type="hidden" name="type" value="${defaultType}">` : ''}
                        </div>
                        <div id="personal-fields" class="form-section" style="display: none;">
                            <h3>👤 Seleção do Aluno</h3>
                            <div class="form-grid">
                                <div class="form-group full-width">
                                    <label for="studentId">Aluno *</label>
                                    <select id="studentId" name="studentId" class="form-select">
                                        <option value="">Carregando alunos...</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div class="form-section">
                            <h3>📝 Informações Básicas</h3>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="title">Título *</label>
                                    <input type="text" id="title" name="title" required class="form-input" value="${defaultTitle}">
                                </div>
                                <div class="form-group full-width">
                                    <label for="description">Descrição</label>
                                    <textarea id="description" name="description" rows="3" class="form-textarea">${defaultDescription}</textarea>
                                </div>
                            </div>
                        </div>
                        <div class="form-section">
                            <h3>📅 Data e Horário</h3>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="date">Data *</label>
                                    <input type="date" id="date" name="date" required class="form-input" value="${defaultDate}">
                                </div>
                                <div class="form-group">
                                    <label for="startTime">Horário *</label>
                                    <input type="time" id="startTime" name="startTime" required class="form-input" value="${defaultTime}">
                                </div>
                                <div class="form-group">
                                    <label for="duration">Duração *</label>
                                    <select id="duration" name="duration" required class="form-select">
                                        <option value="30" ${defaultDuration === 30 ? 'selected' : ''}>30 min</option>
                                        <option value="45" ${defaultDuration === 45 ? 'selected' : ''}>45 min</option>
                                        <option value="60" ${defaultDuration === 60 ? 'selected' : ''}>60 min</option>
                                        <option value="90" ${defaultDuration === 90 ? 'selected' : ''}>90 min</option>
                                        <option value="120" ${defaultDuration === 120 ? 'selected' : ''}>120 min</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div class="form-section">
                            <h3>🗓️ Recorrência e Dias da Semana</h3>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="recurring">Recorrência</label>
                                    <select id="recurring" name="recurring" class="form-select" onchange="hybridAgenda.toggleRecurrenceFields()">
                                        <option value="false" ${defaultRecurring === 'false' ? 'selected' : ''}>Agendamento único</option>
                                        <option value="weekly" ${defaultRecurring === 'weekly' ? 'selected' : ''}>Semanal</option>
                                        <option value="monthly" ${defaultRecurring === 'monthly' ? 'selected' : ''}>Mensal</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="endRecurrence">Data Final da Recorrência</label>
                                    <input type="date" id="endRecurrence" name="endRecurrence" class="form-input" 
                                           value="${defaultEndRecurrence}" 
                                           style="display: ${defaultRecurring !== 'false' ? 'block' : 'none'};">
                                </div>
                            </div>
                            <div id="daysOfWeek" class="form-group full-width" style="display: ${defaultRecurring !== 'false' ? 'block' : 'none'};">
                                <label>Dias da Semana</label>
                                <div class="days-selector">
                                    <label class="day-option">
                                        <input type="checkbox" name="daysOfWeek" value="0" ${defaultDaysOfWeek.includes(0) ? 'checked' : ''}>
                                        <span class="day-label">Dom</span>
                                    </label>
                                    <label class="day-option">
                                        <input type="checkbox" name="daysOfWeek" value="1" ${defaultDaysOfWeek.includes(1) ? 'checked' : ''}>
                                        <span class="day-label">Seg</span>
                                    </label>
                                    <label class="day-option">
                                        <input type="checkbox" name="daysOfWeek" value="2" ${defaultDaysOfWeek.includes(2) ? 'checked' : ''}>
                                        <span class="day-label">Ter</span>
                                    </label>
                                    <label class="day-option">
                                        <input type="checkbox" name="daysOfWeek" value="3" ${defaultDaysOfWeek.includes(3) ? 'checked' : ''}>
                                        <span class="day-label">Qua</span>
                                    </label>
                                    <label class="day-option">
                                        <input type="checkbox" name="daysOfWeek" value="4" ${defaultDaysOfWeek.includes(4) ? 'checked' : ''}>
                                        <span class="day-label">Qui</span>
                                    </label>
                                    <label class="day-option">
                                        <input type="checkbox" name="daysOfWeek" value="5" ${defaultDaysOfWeek.includes(5) ? 'checked' : ''}>
                                        <span class="day-label">Sex</span>
                                    </label>
                                    <label class="day-option">
                                        <input type="checkbox" name="daysOfWeek" value="6" ${defaultDaysOfWeek.includes(6) ? 'checked' : ''}>
                                        <span class="day-label">Sáb</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div class="form-section">
                            <h3>👨‍🏫 Atribuição</h3>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="instructorId">Instrutor *</label>
                                    <select id="instructorId" name="instructorId" required class="form-select">
                                        <option value="">Carregando...</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="unitId">Unidade</label>
                                    <select id="unitId" name="unitId" class="form-select">
                                        <option value="">Carregando...</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="trainingAreaId">Área de Treino</label>
                                    <select id="trainingAreaId" name="trainingAreaId" class="form-select">
                                        <option value="">Carregando...</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div class="form-section">
                            <h3>📊 Status e Configurações</h3>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="status">Status</label>
                                    <select id="status" name="status" class="form-select">
                                        <option value="SCHEDULED" selected>Agendado</option>
                                        <option value="CONFIRMED">Confirmado</option>
                                        <option value="CANCELLED">Cancelado</option>
                                        <option value="COMPLETED">Concluído</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div id="turma-fields" class="form-section" style="display: none;">
                            <h3>👥 Configurações da Turma</h3>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="maxStudents">Máximo de Alunos *</label>
                                    <input type="number" id="maxStudents" name="maxStudents" min="1" max="50" value="10" class="form-input">
                                </div>
                            </div>
                        </div>
                        <div class="form-actions">
                            <button type="button" onclick="hybridAgenda.backToMain()" class="btn-secondary">
                                ← Cancelar
                            </button>
                            <button type="submit" class="btn-primary">
                                … ${isEditMode ? 'Salvar Alterações' : 'Criar Agendamento'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }
    setupUnifiedFormEvents(editData = null, isEditMode = false) {
        const form = document.getElementById('unified-agenda-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleUnifiedFormSubmit(e, editData, isEditMode));
        }
    }
    async loadUnifiedFormData(editData = null) {
        console.log('🛠️ Loading unified form data...', editData ? 'with edit data' : 'for creation');
        try {
            // Load instructors, units, and training areas in parallel
            await Promise.all([
                this.loadInstructors(editData),
                this.loadUnits(editData),
                this.loadTrainingAreas(editData),
                this.loadStudents(editData)
            ]);
            // If in edit mode, set additional form values after data is loaded
            if (editData) {
                this.setEditFormValues(editData);
            }
        } catch (error) {
            console.error('❌ Error loading form data:', error);
            window.app?.handleError(error, 'hybrid-agenda-form-load');
        }
    }
    setEditFormValues(editData) {
        // Set instructor selection
        const instructorSelect = document.getElementById('instructorId');
        if (instructorSelect && editData.instructorId) {
            instructorSelect.value = editData.instructorId;
        }
        // Set unit selection
        const unitSelect = document.getElementById('unitId');
        if (unitSelect && editData.unitId) {
            unitSelect.value = editData.unitId;
        }
        // Set training area selection
        const areaSelect = document.getElementById('trainingAreaId');
        if (areaSelect && editData.trainingAreaId) {
            areaSelect.value = editData.trainingAreaId;
        }
        // Set status selection
        const statusSelect = document.getElementById('status');
        if (statusSelect && editData.status) {
            statusSelect.value = editData.status;
        }
        // Set max students for TURMA
        if (editData.type === 'TURMA') {
            const maxStudentsInput = document.getElementById('maxStudents');
            if (maxStudentsInput && editData.maxStudents) {
                maxStudentsInput.value = editData.maxStudents;
            }
        }
        // Trigger form field toggle based on type
        this.toggleFormFields();
        // Initialize recurrence fields visibility
        this.toggleRecurrenceFields();
    }
    async loadInstructors(editData = null) {
        try {
            await this.api.fetchWithStates('/api/instructors', {
                method: 'GET',
                onSuccess: (data) => {
                    const select = document.getElementById('instructorId');
                    if (select && data) {
                        select.innerHTML = '<option value="">Selecione um instrutor</option>';
                        data.forEach(instructor => {
                            const isSelected = editData && editData.instructorId === instructor.userId;
                            select.innerHTML += `<option value="${instructor.userId}" ${isSelected ? 'selected' : ''}>${instructor.name}</option>`;
                        });
                    }
                },
                onError: (error) => {
                    console.error('Error loading instructors:', error);
                }
            });
        } catch (error) {
            console.error('Error loading instructors:', error);
        }
    }
    async loadUnits(editData = null) {
        try {
            await this.api.fetchWithStates('/api/units', {
                method: 'GET',
                onSuccess: (data) => {
                    const select = document.getElementById('unitId');
                    if (select && data) {
                        select.innerHTML = '<option value="">Selecione uma unidade</option>';
                        data.forEach(unit => {
                            const isSelected = editData && editData.unitId === unit.id;
                            select.innerHTML += `<option value="${unit.id}" ${isSelected ? 'selected' : ''}>${unit.name}</option>`;
                        });
                    }
                },
                onError: (error) => {
                    console.error('Error loading units:', error);
                }
            });
        } catch (error) {
            console.error('Error loading units:', error);
        }
    }
    async loadTrainingAreas(editData = null) {
        try {
            await this.api.fetchWithStates('/api/training-areas', {
                method: 'GET',
                onSuccess: (data) => {
                    const select = document.getElementById('trainingAreaId');
                    if (select && data) {
                        select.innerHTML = '<option value="">Selecione uma área</option>';
                        data.forEach(area => {
                            const isSelected = editData && editData.trainingAreaId === area.id;
                            select.innerHTML += `<option value="${area.id}" ${isSelected ? 'selected' : ''}>${area.name}</option>`;
                        });
                    }
                },
                onError: (error) => {
                    console.error('Error loading training areas:', error);
                }
            });
        } catch (error) {
            console.error('Error loading training areas:', error);
        }
    }
    async loadStudents(editData = null) {
        try {
            await this.api.fetchWithStates('/api/students', {
                method: 'GET',
                onSuccess: (data) => {
                    const select = document.getElementById('studentId');
                    if (select && data) {
                        select.innerHTML = '<option value="">Selecione um aluno</option>';
                        data.forEach(student => {
                            const isSelected = editData && editData.studentId === student.id;
                            select.innerHTML += `<option value="${student.id}" ${isSelected ? 'selected' : ''}>${student.name}</option>`;
                        });
                    }
                },
                onError: (error) => {
                    console.error('Error loading students:', error);
                }
            });
        } catch (error) {
            console.error('Error loading students:', error);
        }
    }
    toggleFormFields() {
        const typeRadios = document.querySelectorAll('input[name="type"]');
        const selectedType = Array.from(typeRadios).find(radio => radio.checked)?.value;
        const turmaFields = document.getElementById('turma-fields');
        const turmaFields = document.getElementById('turma-fields');
        const personalFields = document.getElementById('personal-fields');

        if (turmaFields) {
            turmaFields.style.display = selectedType === 'TURMA' ? 'block' : 'none';
        }
        if (personalFields) {
            personalFields.style.display = selectedType === 'PERSONAL_SESSION' ? 'block' : 'none';
            // Add required attribute dynamically to prevent validation errors on hidden fields
            const studentSelect = document.getElementById('studentId');
            if (studentSelect) {
                if (selectedType === 'PERSONAL_SESSION') {
                    studentSelect.setAttribute('required', 'required');
                } else {
                    studentSelect.removeAttribute('required');
                }
            }
        }
    }
    toggleRecurrenceFields() {
        const recurringSelect = document.getElementById('recurring');
        const daysOfWeekDiv = document.getElementById('daysOfWeek');
        const endRecurrenceInput = document.getElementById('endRecurrence');
        if (recurringSelect && daysOfWeekDiv && endRecurrenceInput) {
            const isRecurring = recurringSelect.value !== 'false';
            daysOfWeekDiv.style.display = isRecurring ? 'block' : 'none';
            endRecurrenceInput.style.display = isRecurring ? 'block' : 'none';
            // Avoid native required to prevent browser blocking/scrolling; use JS validation instead
        }
    }
    async handleUnifiedFormSubmit(e, editData = null, isEditMode = false) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        // Validate recurrence fields
        // JS validation for recurrence (no native required to avoid scroll)
        let fallbackSelectedDays = [];
        if (data.recurring !== 'false') {
            const selectedDays = document.querySelectorAll('input[name="daysOfWeek"]:checked');
            if (selectedDays.length === 0) {
                // Sensible default: use the weekday of the selected date
                const startDateFallback = new Date(`${data.date}T${data.startTime || '00:00'}:00`);
                fallbackSelectedDays = [startDateFallback.getDay()];
            }
        }
        try {
            // CREATE DATE IN LOCAL TIMEZONE (TIMEZONE FIX)
            const startDate = new Date(`${data.date}T${data.startTime}:00`);
            const endDate = new Date(startDate.getTime() + parseInt(data.duration) * 60000);
            const startDateTime = startDate.toISOString();
            const endDateTime = endDate.toISOString();
            // Get selected days of week for recurring events
            const selectedDays = [];
            const dayCheckboxes = document.querySelectorAll('input[name="daysOfWeek"]:checked');
            dayCheckboxes.forEach(checkbox => {
                selectedDays.push(parseInt(checkbox.value));
            });
            if (selectedDays.length === 0 && fallbackSelectedDays.length > 0) {
                selectedDays.push(...fallbackSelectedDays);
            }
            // Convert to proper format
            const agendaData = {
                type: data.type,
                title: data.title,
                description: data.description,
                startTime: startDateTime, // Use proper ISO format with timezone
                endTime: endDateTime, // Use proper ISO format with timezone
                instructorId: data.instructorId,
                unitId: data.unitId || null,
                trainingAreaId: data.trainingAreaId || null,
                status: data.status || 'SCHEDULED',
                isRecurring: data.recurring !== 'false',
                // Store recurrenceRule as JSON string for backend persistence (API-first)
                recurrenceRule: data.recurring !== 'false' ? JSON.stringify({
                    type: data.recurring === 'monthly' ? 'MONTHLY' : 'WEEKLY',
                    daysOfWeek: selectedDays.length > 0 ? selectedDays : [],
                    endDate: data.endRecurrence || null
                }) : null
            };
            // Add type-specific fields
            if (data.type === 'TURMA') {
                agendaData.maxStudents = parseInt(data.maxStudents) || 10;
            } else if (data.type === 'PERSONAL_SESSION') {
                agendaData.studentId = data.studentId;
            }

            console.log(`🛠️ Submitting agenda data (${isEditMode ? 'UPDATE' : 'CREATE'}) with timezone fix:`, agendaData);

            // HANDLE RECURRENCE LOOP FOR PERSONAL SESSIONS
            if (!isEditMode && agendaData.type === 'PERSONAL_SESSION' && agendaData.isRecurring && selectedDays.length > 0) {
                // Calculate all dates
                const datesToSchedule = [];
                const endDateRecurrence = data.endRecurrence ? new Date(data.endRecurrence) : null;
                const maxOccurrences = 52; // Safety limit

                // Start from next occurrence logic or simple loop
                // Simple loop: iterate from start date until end date
                let currentDateIter = new Date(startDate);
                let occurrences = 0;

                // If end date is not specified, default to 1 month
                const effectiveEndDate = endDateRecurrence || new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

                while (currentDateIter <= effectiveEndDate && occurrences < maxOccurrences) {
                    // Check if current day is in selected days
                    if (selectedDays.includes(currentDateIter.getDay())) {
                        // Clone data
                        const sessionDate = new Date(currentDateIter);
                        // Set time
                        sessionDate.setHours(startDate.getHours(), startDate.getMinutes(), 0, 0);

                        const sessionEndDate = new Date(sessionDate.getTime() + parseInt(data.duration) * 60000);

                        // Create payload
                        const singleSessionPayload = { ...agendaData };
                        singleSessionPayload.isRecurring = false; // We are creating individual instances
                        singleSessionPayload.recurrenceRule = null;
                        singleSessionPayload.startTime = sessionDate.toISOString();
                        singleSessionPayload.endTime = sessionEndDate.toISOString();

                        datesToSchedule.push(singleSessionPayload);
                    }
                    // Next day
                    currentDateIter.setDate(currentDateIter.getDate() + 1);
                }

                console.log(`Generaring ${datesToSchedule.length} sessions for recurrence.`);

                // Execute sequentially
                let successCount = 0;
                for (const payload of datesToSchedule) {
                    await this.api.saveWithFeedback('/api/hybrid-agenda', payload, {
                        method: 'POST',
                        onSuccess: () => successCount++,
                        onError: (e) => console.error('Error creating recurrent session', e)
                    });
                }

                this.showSuccessMessage(`${successCount} sessões de Personal Training criadas!`);
                this.backToMain();
                return; // Stop standard flow
            }

            // Create or Update via API (use saveWithFeedback to respect method and body)
            const url = isEditMode ? `/api/hybrid-agenda/${data.id}` : '/api/hybrid-agenda';
            const method = isEditMode ? 'PUT' : 'POST';
            await this.api.saveWithFeedback(url, agendaData, {
                method,
                onSuccess: () => {
                    const successMessage = isEditMode ? 'Agendamento atualizado com sucesso!' : 'Agendamento criado com sucesso!';
                    this.showSuccessMessage(successMessage);
                    this.backToMain();
                },
                onError: (error) => {
                    // Check for Auto-Billing Payment Link
                    if (error.status === 402 && error.data && error.data.payment) {
                        const payment = error.data.payment;
                        this.showErrorMessage(`
                            <strong>Saldo Insuficiente!</strong><br>
                            Uma cobrança foi gerada automaticamente.<br><br>
                            <a href="${payment.invoiceUrl}" target="_blank" class="btn-primary" style="color: white; text-decoration: none; display: inline-block; margin-top: 5px;">
                                💸 Pagar Agora (R$ ${payment.value})
                            </a>
                            ${payment.pixCode ? `<br><br><small>Ou use o PIX Copia e Cola:</small><br><input type="text" value="${payment.pixCode}" readonly onclick="this.select()" style="width:100%; margin-top:5px;">` : ''}
                        `);
                        return;
                    }

                    const errorMessage = isEditMode ? 'Erro ao atualizar agendamento' : 'Erro ao criar agendamento';
                    throw new Error(error?.message || errorMessage);
                }
            });
        } catch (error) {
            const context = isEditMode ? 'hybrid-agenda-update' : 'hybrid-agenda-create';
            console.error(`❌ Error ${isEditMode ? 'updating' : 'creating'} agenda:`, error);
            window.app?.handleError(error, context);
        }
    }
    // SPA Routing methods migrated from simple.js
    async renderDetailsPage(container, itemId) {
        // Get item data from session storage or API
        const itemData = sessionStorage.getItem('agenda-item-details');
        let item = null;
        if (itemData) {
            item = JSON.parse(itemData);
        } else {
            // Fallback: find item in current data
            item = agendaData.find(data => data.id === itemId);
            // If not found and agendaData is empty, try to load data first
            if (!item && agendaData.length === 0) {
                container.innerHTML = `
                    <div class="loading-state">
                        <div class="spinner"></div>
                        <p>Carregando detalhes do agendamento...</p>
                    </div>
                `;
                try {
                    await this.loadAgendaData();
                    item = agendaData.find(data => data.id === itemId);
                } catch (error) {
                    console.error('Error loading agenda data for details:', error);
                }
            }
        }
        if (!item) {
            container.innerHTML = `
                <div class="error-state">
                    <h2>Item não encontrado</h2>
                    <p>O agendamento solicitado não foi encontrado.</p>
                    <button class="btn-primary" onclick="window.location.hash = '#/hybrid-agenda'">â† Voltar para Agenda</button>
                </div>
            `;
            return;
        }
        // Render details page with Premium UI
        const typeInfo = item.type === 'PERSONAL_SESSION'
            ? { icon: '🧍', name: 'Personal Training', color: '#764ba2' }
            : { icon: '🥋', name: 'Aula Coletiva', color: '#667eea' };
        container.innerHTML = `
            <div class="module-header-premium">
                <div class="breadcrumb">
                    <a href="#/hybrid-agenda" class="breadcrumb-link">📅 Agenda Híbrida</a>
                    <span class="breadcrumb-separator">›</span>
                    <span class="breadcrumb-current">${typeInfo.icon} Detalhes</span>
                </div>
                <div class="header-actions">
                    <button class="btn-secondary" onclick="window.location.hash = '#/hybrid-agenda'">â† Voltar</button>
                    <button class="btn-primary" onclick="window.location.hash = '#/hybrid-agenda/edit/${item.id}'">ï¸ Editar</button>
                </div>
            </div>
            <div class="data-card-premium">
                <div class="card-header">
                    <h2>${typeInfo.icon} ${item.title}</h2>
                    <span class="status-badge status-${item.status?.toLowerCase()}">${item.status}</span>
                </div>
                <div class="card-content">
                    <div class="detail-grid">
                        <div class="detail-item">
                            <strong>Tipo:</strong>
                            <span style="color: ${typeInfo.color}">${typeInfo.name}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Instrutor:</strong>
                            <span>${item.instructor?.name || 'Não informado'}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Data/Hora:</strong>
                            <span>${new Date(item.startTime).toLocaleString('pt-BR')}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Duração:</strong>
                            <span>${Math.round((new Date(item.endTime) - new Date(item.startTime)) / (1000 * 60))} minutos</span>
                        </div>
                        ${item.unit ? `
                            <div class="detail-item">
                                <strong>Unidade:</strong>
                                <span>${item.unit.name}</span>
                            </div>
                        ` : ''}
                        ${item.trainingArea ? `
                            <div class="detail-item">
                                <strong>Área de Treino:</strong>
                                <span>${item.trainingArea.name}</span>
                            </div>
                        ` : ''}
                        ${item.maxStudents ? `
                            <div class="detail-item">
                                <strong>Máximo de Alunos:</strong>
                                <span>${item.maxStudents}</span>
                            </div>
                        ` : ''}
                        ${item.description ? `
                            <div class="detail-item full-width">
                                <strong>Descrição:</strong>
                                <p>${item.description}</p>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }
    async renderEditPage(container, itemId) {
        console.log(`🛠️ Rendering edit page for item: ${itemId}`);
        // Buscar dados do item
        let itemData = this.agendaData?.find(item => item.id === itemId);
        // If we already know it's a TURMA from the local list, redirect immediately
        if (itemData && itemData.type === 'TURMA') {
            // Use SPA router's turma editor route without leading slash
            window.location.hash = `#turma-editor/${itemData.id}`;
            return;
        }
        if (!itemData) {
            try {
                await this.api.fetchWithStates(`/api/hybrid-agenda/${itemId}`, {
                    method: 'GET',
                    onSuccess: (data) => {
                        itemData = data;
                    },
                    onError: (error) => {
                        throw error;
                    }
                });
            } catch (error) {
                console.error('Error loading item for edit:', error);
                container.innerHTML = `
                    <div class="module-header-premium">
                        <div class="breadcrumb">
                            <a href="#/hybrid-agenda" class="breadcrumb-link">📅 Agenda Híbrida</a>
                            <span class="breadcrumb-separator">›</span>
                            <span class="breadcrumb-current">❌ Erro ao Carregar</span>
                        </div>
                    </div>
                    <div class="error-container">
                        <h3>Erro ao carregar item para edição</h3>
                        <p>${error.message}</p>
                        <button onclick="window.location.hash = '#/hybrid-agenda'" class="btn-secondary">
                            â† Voltar para Agenda
                        </button>
                    </div>
                `;
                return;
            }
        }
        const isPersonalTraining = itemData.type === 'PERSONAL_SESSION';
        // If it's a Turma, redirect to the Turmas edit screen to reuse the same editor
        if (!isPersonalTraining) {
            window.location.hash = `#turma-editor/${itemData.id}`;
            return;
        }
        // Otherwise keep using the unified agenda editor for Personal Sessions
        this.showUnifiedModal(itemData);
    }
    backToMain() {
        console.log('🛠️ Returning to main agenda view...');
        this.initialize(document.getElementById('agenda-container'));
    }
    // Delete agenda item (consolidated from simple.js)
    async deleteAgendaItem(itemId) {
        if (!confirm('Tem certeza que deseja excluir este agendamento?')) {
            return;
        }
        try {
            await this.api.fetchWithStates(`/api/hybrid-agenda/${itemId}`, {
                method: 'DELETE',
                onSuccess: () => {
                    this.showSuccessMessage('Agendamento excluído com sucesso!');
                    this.backToMain();
                },
                onError: (error) => {
                    throw new Error(error.message || 'Erro ao excluir agendamento');
                }
            });
        } catch (error) {
            console.error('❌ Error deleting agenda item:', error);
            window.app?.handleError(error, 'hybrid-agenda-delete');
        }
    }
    // Success message helper
    showSuccessMessage(message) {
        if (window.app && window.app.showMessage) {
            window.app.showMessage(message, 'success');
        } else {
            alert(message);
        }
    }
    // Error message helper
    showErrorMessage(message) {
        if (window.app && window.app.showMessage) {
            window.app.showMessage(message, 'error');
        } else {
            alert(message);
        }
    }
}
// Initialize module for SPA integration (consolidated from simple.js)
window.initHybridAgendaModule = async function initHybridAgendaModule(container, route) {
    try {
        if (!container) {
            throw new Error('Container element is required');
        }
        // Create agenda container if it doesn't exist
        if (!container.querySelector('#agenda-container')) {
            container.innerHTML = '<div id="agenda-container"></div>';
        }
        const agendaContainer = container.querySelector('#agenda-container');
        const hybridAgendaModule = new HybridAgendaModule();
        // Initialize with route support (SPA integration)
        await hybridAgendaModule.initialize(agendaContainer, route);
        // Expose for other modules
        window.hybridAgenda = hybridAgendaModule;
        window.hybridAgendaModule = hybridAgendaModule;
        return hybridAgendaModule;
    } catch (error) {
        console.error('❌ Failed to initialize Hybrid Agenda module:', error);
        if (window.app) {
            window.app.handleError(error, 'hybrid-agenda:init');
        }
        container.innerHTML = `
            <div class="error-state">
                <h3>❌ Erro ao carregar Agenda Híbrida</h3>
                <p>Não foi possível inicializar o módulo. Verifique a conexão e tente novamente.</p>
            </div>
        `;
        throw error;
    }
};
// Export for global access (consolidated from simple.js)
window.hybridAgenda = HybridAgendaModule;
// Global functions for onclick compatibility (from removed simple.js)
window.showCreateModal = function () {
    if (window.hybridAgenda) {
        window.hybridAgenda.showUnifiedModal();
    }
};
window.closeCreateModal = function () {
    if (window.hybridAgenda) {
        window.hybridAgenda.backToMain();
    }
};
window.handleAgendaItemClick = function (itemId, itemType) {
    if (window.hybridAgenda) {
        window.hybridAgenda.handleAgendaItemClick(itemId, itemType);
    }
};
window.deleteAgendaItem = function (itemId) {
    if (window.hybridAgenda) {
        window.hybridAgenda.deleteAgendaItem(itemId);
    }
};
// Additional legacy functions from simple.js for compatibility
window.showCreateMenu = function (date, time) {
    console.log('🛠️ showCreateMenu called - redirecting to unified modal');
    if (window.hybridAgenda) {
        window.hybridAgenda.showUnifiedModal();
    }
};
window.closeCreateMenu = function () {
    console.log('🛠️ closeCreateMenu called - no action needed (full-screen mode)');
};
window.showSchedulingForm = function (type, date, time) {
    console.log('🛠️ showSchedulingForm called - redirecting to unified modal');
    if (window.hybridAgenda) {
        window.hybridAgenda.showUnifiedModal();
    }
};
window.closeSchedulingForm = function () {
    console.log('🛠️ closeSchedulingForm called - returning to main view');
    if (window.hybridAgenda) {
        window.hybridAgenda.backToMain();
    }
};
// Register module
window['hybrid-agenda'] = window.initHybridAgendaModule;
console.log('… Hybrid Agenda module loaded (AGENTS.md compliant)');

