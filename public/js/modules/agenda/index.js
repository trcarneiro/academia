/**
 * Agenda Module - MVP Version
 * Sistema de agenda integrado com turmas e check-in
 */

// Dependencies will be loaded via script tags
// import { CalendarController } from './controllers/calendarController.js';
// import { AgendaService } from './services/agendaService.js';

class AgendaModule {
    constructor() {
        this.moduleAPI = null;
        this.calendarController = null;
        this.agendaService = null;
        this.isInitialized = false;
        console.log('📅 Agenda Module created');
    }

    async initialize() {
        if (this.isInitialized) return;
        
        try {
            console.log('📅 Initializing Agenda module...');
            
            // Wait for API client
            await this.waitForAPIClient();
            this.moduleAPI = window.createModuleAPI('Agenda');
            
            // Wait for dependencies to be loaded
            await this.waitForDependencies();
            
            // Initialize services
            this.agendaService = new window.AgendaService(this.moduleAPI);
            this.calendarController = new window.CalendarController(this.agendaService);
            
            // Register with core app (guard against early init race)
            if (window.app && typeof window.app.registerModule === 'function') {
                window.app.registerModule('agenda', this);
                window.app.dispatchEvent('module:loaded', { name: 'agenda' });
            } else {
                console.warn('⚠️ app.registerModule not ready; deferring agenda registration');
                setTimeout(() => {
                    if (window.app && typeof window.app.registerModule === 'function') {
                        window.app.registerModule('agenda', this);
                        window.app.dispatchEvent('module:loaded', { name: 'agenda' });
                        console.log('📦 Agenda registered after defer');
                    }
                }, 300);
            }
            
            this.isInitialized = true;
            console.log('✅ Agenda module initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing Agenda module:', error);
            if (window.app) {
                window.app.handleError(error, 'agenda-initialization');
            }
        }
    }

    async waitForAPIClient() {
        return new Promise((resolve) => {
            if (window.createModuleAPI) {
                resolve();
            } else {
                const interval = setInterval(() => {
                    if (window.createModuleAPI) {
                        clearInterval(interval);
                        resolve();
                    }
                }, 100);
            }
        });
    }

    async waitForDependencies() {
        return new Promise((resolve) => {
            const checkDependencies = () => {
                if (window.AgendaService && window.CalendarController) {
                    resolve();
                } else {
                    setTimeout(checkDependencies, 100);
                }
            };
            checkDependencies();
        });
    }

    async render() {
        console.log('📅 Rendering Agenda module');
        
        if (!this.isInitialized) {
            await this.initialize();
        }

        // Try both possible container IDs
        const container = document.getElementById('module-container') || document.getElementById('contentContainer');
        if (!container) {
            console.error('❌ Container not found for agenda module');
            return;
        }

        container.innerHTML = this.getAgendaHTML();
        console.log('📅 HTML content set');
        
        // Initialize calendar controller
        try {
            await this.calendarController.initialize();
            console.log('📅 Calendar controller initialized');
        } catch (error) {
            console.error('❌ Error initializing calendar controller:', error);
        }
        
        console.log('✅ Agenda module rendered');
    }

    getAgendaHTML() {
        return `
            <div class="module-isolated-agenda">
                <!-- Header Section -->
                <div class="module-header-premium">
                    <div class="header-content">
                        <div class="header-main">
                            <h1>📅 Agenda da Academia</h1>
                            <p class="header-subtitle">Gerencie aulas, turmas e horários</p>
                        </div>
                        <div class="header-actions">
                            <button id="todayBtn" class="btn-header active">
                                <span class="btn-icon">📍</span>
                                <span class="btn-text">Hoje</span>
                            </button>
                            <button id="weekBtn" class="btn-header">
                                <span class="btn-icon">📅</span>
                                <span class="btn-text">Semana</span>
                            </button>
                            <button id="monthBtn" class="btn-header">
                                <span class="btn-icon">📆</span>
                                <span class="btn-text">Mês</span>
                            </button>
                        </div>
                    </div>
                    <div class="breadcrumb-nav">
                        <span class="breadcrumb-item">Academia</span>
                        <span class="breadcrumb-separator">›</span>
                        <span class="breadcrumb-item active">Agenda</span>
                    </div>
                </div>

                <!-- Quick Stats -->
                <div class="stats-grid">
                    <div class="stat-card-enhanced">
                        <div class="stat-icon">📊</div>
                        <div class="stat-content">
                            <div class="stat-value" id="totalClassesToday">0</div>
                            <div class="stat-label">Aulas Hoje</div>
                        </div>
                    </div>
                    <div class="stat-card-enhanced">
                        <div class="stat-icon">👥</div>
                        <div class="stat-content">
                            <div class="stat-value" id="totalStudentsToday">0</div>
                            <div class="stat-label">Alunos Esperados</div>
                        </div>
                    </div>
                    <div class="stat-card-enhanced">
                        <div class="stat-icon">👨‍🏫</div>
                        <div class="stat-content">
                            <div class="stat-value" id="activeInstructors">0</div>
                            <div class="stat-label">Instrutores Ativos</div>
                        </div>
                    </div>
                    <div class="stat-card-enhanced">
                        <div class="stat-icon">🏃</div>
                        <div class="stat-content">
                            <div class="stat-value" id="checkedInToday">0</div>
                            <div class="stat-label">Check-ins Hoje</div>
                        </div>
                    </div>
                </div>

                <!-- Filter Bar -->
                <div class="module-filters-premium">
                    <div class="filters-left">
                        <div class="filter-group">
                            <label for="typeFilter">Tipo:</label>
                            <select id="typeFilter" class="filter-select">
                                <option value="">Todos</option>
                                <option value="CLASS">Aulas</option>
                                <option value="TURMA">Turmas</option>
                                <option value="PERSONAL_SESSION">Personal</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label for="instructorFilter">Instrutor:</label>
                            <select id="instructorFilter" class="filter-select">
                                <option value="">Todos os Instrutores</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label for="courseFilter">Curso:</label>
                            <select id="courseFilter" class="filter-select">
                                <option value="">Todos os Cursos</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label for="statusFilter">Status:</label>
                            <select id="statusFilter" class="filter-select">
                                <option value="">Todos</option>
                                <option value="SCHEDULED">Agendadas</option>
                                <option value="IN_PROGRESS">Em Andamento</option>
                                <option value="COMPLETED">Finalizadas</option>
                            </select>
                        </div>
                    </div>
                    <div class="filters-right">
                        <button id="refreshBtn" class="btn-filter">
                            <span class="btn-icon">🔄</span>
                            <span class="btn-text">Atualizar</span>
                        </button>
                    </div>
                </div>

                <!-- Main Calendar Container -->
                <div class="calendar-container data-card-premium">
                    <div class="calendar-header">
                        <div class="calendar-navigation">
                            <button id="prevBtn" class="nav-btn">
                                <span class="nav-icon">‹</span>
                            </button>
                            <div class="calendar-title">
                                <h2 id="calendarTitle">Carregando...</h2>
                                <p id="calendarSubtitle" class="calendar-subtitle"></p>
                            </div>
                            <button id="nextBtn" class="nav-btn">
                                <span class="nav-icon">›</span>
                            </button>
                        </div>
                    </div>
                    
                    <div id="calendarContent" class="calendar-content">
                        <!-- Calendar will be rendered here -->
                    </div>
                </div>

                <!-- Loading State -->
                <div id="agendaLoading" class="loading-overlay" style="display: none;">
                    <div class="loading-content">
                        <div class="loading-spinner"></div>
                        <div class="loading-text">Carregando agenda...</div>
                    </div>
                </div>
            </div>
        `;
    }

    // Module lifecycle methods
    onShow() {
        this.render();
    }

    onHide() {
        // Cleanup if needed
    }

    cleanup() {
        this.isInitialized = false;
        this.calendarController = null;
        this.agendaService = null;
    }

    // Expose methods for external calls
    openCheckinModal(classId) {
        if (this.calendarController) {
            this.calendarController.openCheckinModal(classId);
        }
    }

    viewClassDetails(classId) {
        if (this.calendarController) {
            this.calendarController.viewClassDetails(classId);
        }
    }

    viewItemDetails(id, type) {
        if (this.calendarController) {
            this.calendarController.viewItemDetails(id, type);
        }
    }

    showDayClasses(dateStr) {
        if (this.calendarController) {
            this.calendarController.showDayClasses(dateStr);
        }
    }
}

// Initialize and expose module globally
const agendaModule = new AgendaModule();
window.agendaModule = agendaModule;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => agendaModule.initialize());
} else {
    agendaModule.initialize();
}
