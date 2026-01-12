/**
 * Instructor Dashboard Module - "Minha Aula"
 * Shows the instructor's current/next class and lesson plan
 * 
 * Following AGENTS.md guidelines:
 * - API-first with window.createModuleAPI
 * - Full-screen UI (no modals)
 * - Loading/empty/error states
 */

// Load module-specific styles
const moduleStyles = document.createElement('link');
moduleStyles.rel = 'stylesheet';
moduleStyles.href = '/css/modules/instructor-dashboard.css';
document.head.appendChild(moduleStyles);

let moduleAPI = null;

async function initializeAPI() {
    if (!window.createModuleAPI) {
        throw new Error('API client not loaded');
    }
    moduleAPI = window.createModuleAPI('InstructorDashboard');
}

/**
 * Initialize the Instructor Dashboard module
 */
window.initInstructorDashboard = async function (container) {
    console.log('🎓 [InstructorDashboard] Initializing...');

    try {
        await initializeAPI();
        await renderDashboard(container);
        window.app?.dispatchEvent?.('module:loaded', { name: 'instructor-dashboard' });
    } catch (err) {
        console.error('InstructorDashboard init error:', err);
        window.app?.handleError?.(err, 'instructor-dashboard:init');
        container.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Erro ao carregar Painel do Instrutor</h3>
                <p>${err.message}</p>
                <button onclick="location.reload()" class="btn-form btn-primary-form">Tentar Novamente</button>
            </div>
        `;
    }
};

async function renderDashboard(container) {
    container.innerHTML = `
        <div class="module-isolated-container instructor-dashboard" data-module="instructor-dashboard">
            <!-- Header -->
            <div class="module-header-premium instructor-header-gradient">
                <div class="header-content">
                    <div class="header-left">
                        <h1 class="page-title">
                            <i class="fas fa-chalkboard-teacher"></i>
                            Painel do Instrutor
                        </h1>
                        <nav class="breadcrumb">
                            <a href="#/dashboard"><i class="fas fa-home"></i></a>
                            <i class="fas fa-chevron-right"></i>
                            <span>Minha Aula</span>
                        </nav>
                    </div>
                    <div class="header-actions">
                        <button id="refresh-dashboard" class="btn-form btn-secondary-form">
                            <i class="fas fa-sync-alt"></i>
                            Atualizar
                        </button>
                    </div>
                </div>
            </div>

            <!-- Current Class Section -->
            <div class="current-class-section" id="current-class-container">
                <div class="loading-state">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span>Carregando sua aula...</span>
                </div>
            </div>

            <!-- Lesson Plan Section -->
            <div class="lesson-plan-section" id="lesson-plan-container" style="display: none;">
                <!-- Will be populated when there's a current class -->
            </div>

            <!-- Next Classes Section -->
            <div class="next-classes-section" id="next-classes-container">
                <div class="loading-state">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span>Carregando próximas aulas...</span>
                </div>
            </div>
        </div>
    `;

    // Bind refresh button
    container.querySelector('#refresh-dashboard')?.addEventListener('click', () => {
        loadDashboardData(container);
    });

    // Load data
    await loadDashboardData(container);
}

async function loadDashboardData(container) {
    try {
        const response = await moduleAPI.fetchWithStates('/api/instructor/my-classes', {
            onError: (err) => console.error('Load error:', err)
        });

        const data = response?.data || response || {};

        renderCurrentClass(container, data.currentClass);
        renderLessonPlan(container, data.currentClass?.lessonPlan);
        renderNextClasses(container, data.nextClasses || []);

    } catch (err) {
        console.error('Error loading dashboard data:', err);
        container.querySelector('#current-class-container').innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Erro ao carregar dados: ${err.message}</p>
            </div>
        `;
    }
}

function renderCurrentClass(container, currentClass) {
    const section = container.querySelector('#current-class-container');

    if (!currentClass) {
        section.innerHTML = `
            <div class="data-card-premium empty-class-card">
                <div class="empty-state">
                    <i class="fas fa-coffee"></i>
                    <h3>Nenhuma aula em andamento</h3>
                    <p>Você não tem aula agora. Veja suas próximas aulas abaixo.</p>
                </div>
            </div>
        `;
        return;
    }

    const startTime = new Date(currentClass.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const endTime = new Date(currentClass.endTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const studentCount = currentClass.students?.length || 0;
    const isActive = currentClass.status === 'IN_PROGRESS';

    section.innerHTML = `
        <div class="data-card-premium current-class-card ${isActive ? 'class-active' : 'class-scheduled'}">
            <div class="class-status-badge">
                ${isActive ? '<span class="badge-active pulse">🟢 EM ANDAMENTO</span>' : '<span class="badge-scheduled">📅 AGENDADA</span>'}
            </div>
            
            <div class="class-header">
                <h2 class="class-title">${currentClass.title || currentClass.course?.name || 'Aula'}</h2>
                <div class="class-meta">
                    <span class="class-time">
                        <i class="fas fa-clock"></i>
                        ${startTime} - ${endTime}
                    </span>
                    <span class="class-location">
                        <i class="fas fa-map-marker-alt"></i>
                        ${currentClass.room || currentClass.unit?.name || 'Sala Principal'}
                    </span>
                    <span class="class-students">
                        <i class="fas fa-users"></i>
                        ${studentCount} aluno${studentCount !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>

            <div class="class-actions">
                ${!isActive ? `
                    <button class="btn-form btn-success-form btn-lg" onclick="window.instructorDashboard.startClass('${currentClass.id}')">
                        <i class="fas fa-play"></i>
                        Iniciar Aula
                    </button>
                ` : `
                    <button class="btn-form btn-warning-form btn-lg" onclick="window.instructorDashboard.finishClass('${currentClass.id}')">
                        <i class="fas fa-stop"></i>
                        Finalizar Aula
                    </button>
                `}
                <button class="btn-form btn-info-form" onclick="window.instructorDashboard.toggleLessonPlan()">
                    <i class="fas fa-clipboard-list"></i>
                    ${currentClass.lessonPlan ? 'Ver Plano de Aula' : 'Sem Plano'}
                </button>
                <button class="btn-form btn-secondary-form" onclick="window.instructorDashboard.showStudentsList('${currentClass.id}')">
                    <i class="fas fa-user-check"></i>
                    Lista de Presença
                </button>
            </div>
        </div>
    `;
}

function renderLessonPlan(container, lessonPlan) {
    const section = container.querySelector('#lesson-plan-container');

    if (!lessonPlan) {
        section.style.display = 'none';
        return;
    }

    const activities = lessonPlan.activities || lessonPlan.sections || [];

    section.innerHTML = `
        <div class="data-card-premium lesson-plan-card">
            <div class="card-header">
                <h3>
                    <i class="fas fa-clipboard-list"></i>
                    Plano de Aula: ${lessonPlan.name || lessonPlan.title}
                </h3>
                <button class="btn-collapse" onclick="this.closest('.lesson-plan-card').classList.toggle('collapsed')">
                    <i class="fas fa-chevron-up"></i>
                </button>
            </div>
            
            <div class="lesson-plan-content">
                ${activities.length === 0 ? `
                    <div class="empty-activities">
                        <i class="fas fa-info-circle"></i>
                        <p>Nenhuma atividade definida no plano</p>
                    </div>
                ` : `
                    <div class="activities-timeline">
                        ${activities.map((activity, index) => `
                            <div class="activity-item" data-index="${index}">
                                <div class="activity-number">${index + 1}</div>
                                <div class="activity-content">
                                    <h4 class="activity-title">${activity.name || activity.title}</h4>
                                    <div class="activity-meta">
                                        <span class="activity-duration">
                                            <i class="fas fa-hourglass-half"></i>
                                            ${activity.duration || activity.durationMinutes || '?'} min
                                        </span>
                                        ${activity.type ? `
                                            <span class="activity-type">${activity.type}</span>
                                        ` : ''}
                                    </div>
                                    ${activity.description ? `
                                        <p class="activity-description">${activity.description}</p>
                                    ` : ''}
                                    ${activity.techniques?.length ? `
                                        <div class="activity-techniques">
                                            <strong>Técnicas:</strong>
                                            ${activity.techniques.map(t => `<span class="technique-tag">${t.name || t}</span>`).join('')}
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        </div>
    `;

    section.style.display = 'block';
}

function renderNextClasses(container, nextClasses) {
    const section = container.querySelector('#next-classes-container');

    if (!nextClasses || nextClasses.length === 0) {
        section.innerHTML = `
            <div class="data-card-premium">
                <h3><i class="fas fa-calendar-alt"></i> Próximas Aulas</h3>
                <div class="empty-state small">
                    <i class="fas fa-calendar-check"></i>
                    <p>Nenhuma aula agendada</p>
                </div>
            </div>
        `;
        return;
    }

    section.innerHTML = `
        <div class="data-card-premium next-classes-card">
            <h3><i class="fas fa-calendar-alt"></i> Próximas Aulas</h3>
            <div class="next-classes-list">
                ${nextClasses.slice(0, 5).map(cls => {
        const date = new Date(cls.startTime);
        const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' });
        const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        return `
                        <div class="next-class-item">
                            <div class="next-class-date">
                                <span class="day">${dayName}</span>
                                <span class="time">${time}</span>
                            </div>
                            <div class="next-class-info">
                                <h4>${cls.title || cls.course?.name || 'Aula'}</h4>
                                <span class="students-count">
                                    <i class="fas fa-users"></i>
                                    ${cls.students?.length || 0} alunos
                                </span>
                            </div>
                            <div class="next-class-actions">
                                ${cls.lessonPlan ? `
                                    <span class="has-plan-badge" title="Plano de aula definido">
                                        <i class="fas fa-clipboard-check"></i>
                                    </span>
                                ` : `
                                    <span class="no-plan-badge" title="Sem plano de aula">
                                        <i class="fas fa-clipboard"></i>
                                    </span>
                                `}
                            </div>
                        </div>
                    `;
    }).join('')}
            </div>
        </div>
    `;
}

// Global API for onclick handlers
window.instructorDashboard = {
    async startClass(classId) {
        if (!confirm('Iniciar esta aula agora?')) return;

        try {
            await moduleAPI.saveWithFeedback(`/api/instructor/class/${classId}/start`, {}, {
                method: 'POST',
                successMessage: 'Aula iniciada com sucesso!'
            });
            // Reload dashboard
            const container = document.querySelector('[data-module="instructor-dashboard"]')?.parentElement;
            if (container) await loadDashboardData(container);
        } catch (err) {
            alert('Erro ao iniciar aula: ' + err.message);
        }
    },

    async finishClass(classId) {
        if (!confirm('Finalizar esta aula?')) return;

        try {
            await moduleAPI.saveWithFeedback(`/api/instructor/class/${classId}/finish`, {}, {
                method: 'POST',
                successMessage: 'Aula finalizada com sucesso!'
            });
            const container = document.querySelector('[data-module="instructor-dashboard"]')?.parentElement;
            if (container) await loadDashboardData(container);
        } catch (err) {
            alert('Erro ao finalizar aula: ' + err.message);
        }
    },

    toggleLessonPlan() {
        const section = document.querySelector('#lesson-plan-container');
        if (section) {
            section.style.display = section.style.display === 'none' ? 'block' : 'none';
        }
    },

    showStudentsList(classId) {
        // Navigate to attendance/check-in view
        if (window.router) {
            window.router.navigateTo('frequency', { classId });
        } else {
            window.location.hash = `#frequency?classId=${classId}`;
        }
    }
};

// Export for SPA router
window.instructorDashboardModule = {
    init: window.initInstructorDashboard
};

console.log('✅ Instructor Dashboard module loaded');
