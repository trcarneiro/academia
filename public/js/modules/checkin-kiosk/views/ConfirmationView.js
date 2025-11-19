/**
 * ConfirmationView.js v2.0
 * Renders student confirmation screen with sales-focused enhancements
 * Features: Course progress, class availability, upsell recommendations, gamification
 */

class ConfirmationView {
    constructor(container, callbacks = {}) {
        this.container = container;
        this.onConfirm = callbacks.onConfirm || (() => {});
        this.onReject = callbacks.onReject || (() => {});
        
        // Initialize API client for new features
        this.courseProgressAPI = null;
        this.turmasAPI = null;
        this.initializeAPIs();
    }

    /**
     * Initialize API clients
     */
    async initializeAPIs() {
        // Wait for API client to be available
        await this.waitForAPIClient();
        this.courseProgressAPI = window.createModuleAPI('CheckinProgress');
        this.turmasAPI = window.createModuleAPI('CheckinTurmas');
    }

    /**
     * Wait for API client to load
     */
    async waitForAPIClient() {
        let attempts = 0;
        while (!window.createModuleAPI && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        if (!window.createModuleAPI) {
            console.error('❌ API Client não carregou');
        }
    }

    /**
     * Render confirmation view - V2.0 SALES DASHBOARD
     */
    async render(student, courses) {
        // CRITICAL: Validate active plan (business rule)
        const hasActivePlan = student.subscriptions?.some(s => s.status === 'ACTIVE');
        
        if (!hasActivePlan) {
            this.renderReactivationScreen(student);
            return;
        }

        // Show loading state while fetching data
        this.showLoadingState(student);

        try {
            // Fetch enhanced data from new APIs
            const [progressData, turmasData] = await Promise.all([
                this.fetchCourseProgress(student.id),
                this.fetchAvailableTurmas(student.organizationId, student.id)
            ]);

            // Render full dashboard
            this.renderFullDashboard(student, progressData, turmasData);
        } catch (error) {
            console.error('❌ Error fetching enhanced data:', error);
            // Fallback to basic view if APIs fail
            this.renderBasicView(student, courses);
        }
    }

    /**
     * Fetch course progress from API
     */
    async fetchCourseProgress(studentId) {
        try {
            const response = await fetch(`/api/students/${studentId}/course-progress`);
            const data = await response.json();
            return data.success ? data.data : null;
        } catch (error) {
            console.error('❌ Error fetching course progress:', error);
            return null;
        }
    }

    /**
     * Fetch available turmas from API
     */
    async fetchAvailableTurmas(organizationId, studentId) {
        try {
            console.log('🔍 [ConfirmationView] Fetching turmas:', { organizationId, studentId });
            const response = await fetch(`/api/turmas/available-now?organizationId=${organizationId}&studentId=${studentId}`);
            const data = await response.json();
            console.log('📦 [ConfirmationView] Turmas response:', data);
            console.log('📊 [ConfirmationView] Data structure:', {
                success: data.success,
                hasData: !!data.data,
                openNow: data.data?.openNow?.length || 0,
                upcoming: data.data?.upcoming?.length || 0
            });
            return data.success ? data.data : null;
        } catch (error) {
            console.error('❌ Error fetching turmas:', error);
            return null;
        }
    }

    /**
     * Show loading state
     */
    showLoadingState(student) {
        this.container.innerHTML = `
            <div class="checkin-dashboard loading">
                <div class="dashboard-header">
                    <div class="student-photo-large">
                        ${student.user?.avatarUrl 
                            ? `<img src="${student.user.avatarUrl}" alt="${student.user.firstName}" />` 
                            : `<div class="avatar-placeholder">${(student.user?.firstName || '?')[0]}</div>`
                        }
                    </div>
                    <div class="student-info-large">
                        <h1 class="student-name-huge">${student.user?.firstName || ''} ${student.user?.lastName || ''}</h1>
                        <div class="student-meta-row">
                            <span class="student-id-badge">📋 ${student.registrationNumber || student.id.substring(0, 8)}</span>
                        </div>
                    </div>
                </div>
                <div class="loading-content">
                    <div class="spinner-large"></div>
                    <p>Carregando informações...</p>
                </div>
            </div>
        `;
    }

    /**
     * Render reactivation screen for inactive students
     */
    renderReactivationScreen(student) {
        this.container.innerHTML = `
            <div class="reactivation-screen">
                <div class="reactivation-header">
                    <div class="student-photo-large">
                        ${student.user?.avatarUrl 
                            ? `<img src="${student.user.avatarUrl}" alt="${student.user.firstName}" />` 
                            : `<div class="avatar-placeholder">${(student.user?.firstName || '?')[0]}</div>`
                        }
                    </div>
                    <h2>⚠️ Plano Inativo</h2>
                </div>
                
                <div class="reactivation-content">
                    <p class="reactivation-message">
                        Olá <strong>${student.user?.firstName}</strong>, seu plano está inativo.
                    </p>
                    <p class="reactivation-submessage">
                        Reative agora e continue sua evolução no Krav Maga!
                    </p>
                    
                    <div class="reactivation-benefits">
                        <h3>✨ Benefícios de Reativar:</h3>
                        <ul>
                            <li>✅ Acesso ilimitado às aulas</li>
                            <li>✅ Acompanhamento do seu progresso</li>
                            <li>✅ Participação em eventos exclusivos</li>
                            <li>✅ Suporte da equipe de instrutores</li>
                        </ul>
                    </div>
                    
                    <div class="reactivation-actions">
                        <button class="btn-reactivate">
                            <span class="icon">💳</span>
                            <span class="text">Reativar Meu Plano</span>
                        </button>
                        <button id="reject-btn" class="btn-back">
                            <span class="icon">←</span>
                            <span class="text">Voltar</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Setup events
        this.container.querySelector('.btn-reactivate')?.addEventListener('click', () => {
            alert('Funcionalidade de reativação será implementada. Procure a recepção.');
        });
        
        this.container.querySelector('#reject-btn')?.addEventListener('click', () => {
            this.onReject();
        });
    }

    /**
     * Render full dashboard with all enhanced features
     */
    renderFullDashboard(student, progressData, turmasData) {
        const planStatus = student.subscriptions?.[0];
        const validUntil = planStatus?.endDate 
            ? new Date(planStatus.endDate).toLocaleDateString('pt-BR')
            : 'Sem prazo';
        
        const planName = planStatus?.plan?.name || 'Sem plano ativo';
        
        // Calculate days remaining
        let daysRemaining = 0;
        let isExpiring = false;
        if (planStatus?.endDate) {
            const endDate = new Date(planStatus.endDate);
            const today = new Date();
            daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
            isExpiring = daysRemaining > 0 && daysRemaining <= 7;
        }

        this.container.innerHTML = `
            <div class="checkin-dashboard-v2">
                <!-- Header with Student Info + Matricula -->
                <div class="dashboard-header">
                    <div class="student-photo-large">
                        ${student.user?.avatarUrl 
                            ? `<img src="${student.user.avatarUrl}" alt="${student.user.firstName}" />` 
                            : `<div class="avatar-placeholder">${(student.user?.firstName || '?')[0]}</div>`
                        }
                    </div>
                    <div class="student-info-large">
                        <h1 class="student-name-huge">${student.user?.firstName || ''} ${student.user?.lastName || ''}</h1>
                        <div class="student-meta-row">
                            <span class="student-id-badge">📋 ${student.registrationNumber ? `Matrícula: ${student.registrationNumber}` : `ID: ${student.id.substring(0, 8)}`}</span>
                            ${student.user?.phone ? `<span class="student-phone">📞 ${student.user.phone}</span>` : ''}
                        </div>
                    </div>
                    <button id="reject-btn" class="btn-cancel-top">
                        <span class="icon">✖</span>
                        <span class="text">Cancelar</span>
                    </button>
                </div>

                <!-- Stats Cards Row (Enhanced with Gamification) -->
                <div class="stats-row">
                    <div class="stat-card ${planStatus?.status === 'ACTIVE' ? 'stat-success' : 'stat-danger'}">
                        <div class="stat-icon">${planStatus?.status === 'ACTIVE' ? '✅' : '❌'}</div>
                        <div class="stat-content">
                            <div class="stat-label">Status do Plano</div>
                            <div class="stat-value">${planStatus?.status === 'ACTIVE' ? 'ATIVO' : 'INATIVO'}</div>
                        </div>
                    </div>

                    <div class="stat-card ${isExpiring ? 'stat-warning' : 'stat-info'}">
                        <div class="stat-icon">📅</div>
                        <div class="stat-content">
                            <div class="stat-label">Validade</div>
                            <div class="stat-value-small">${validUntil}</div>
                            ${daysRemaining > 0 && daysRemaining <= 30 
                                ? `<div class="stat-hint ${isExpiring ? 'hint-urgent' : ''}">${daysRemaining} dias restantes</div>` 
                                : ''
                            }
                        </div>
                    </div>

                    <div class="stat-card stat-primary">
                        <div class="stat-icon">🎯</div>
                        <div class="stat-content">
                            <div class="stat-label">Check-ins</div>
                            <div class="stat-value">${student.stats?.totalAttendances || 0}</div>
                            <div class="stat-hint">Total realizados</div>
                        </div>
                    </div>

                    <div class="stat-card stat-info">
                        <div class="stat-icon">🔥</div>
                        <div class="stat-content">
                            <div class="stat-label">Sequência</div>
                            <div class="stat-value">${student.stats?.currentStreak || 0}</div>
                            <div class="stat-hint">dias consecutivos</div>
                        </div>
                    </div>
                </div>

                <!-- Course Progress Section (NEW) -->
                ${progressData && progressData.hasCourse ? `
                    <div class="course-progress-section">
                        <h2 class="section-title">
                            <span class="title-icon">📊</span>
                            Progresso no Curso
                        </h2>
                        <div class="progress-content">
                            <div class="progress-info">
                                <h3 class="course-name">${progressData.course.name}</h3>
                                <p class="progress-stats">
                                    ${progressData.completedActivities}/${progressData.totalActivities} atividades 
                                    • Média: ${progressData.averageRating.toFixed(1)}/10
                                </p>
                            </div>
                            <div class="progress-bar-container">
                                <div class="progress-bar" style="width: ${progressData.percentage}%">
                                    <span class="progress-label">${progressData.percentage}%</span>
                                </div>
                            </div>
                            
                            ${progressData.isEligibleForGraduation ? `
                                <div class="graduation-badge success">
                                    ✅ Pronto para Exame de Graduação!
                                </div>
                            ` : `
                                <div class="graduation-badge warning">
                                    ${progressData.eligibilityStatus === 'NEEDS_MORE_ACTIVITIES' 
                                        ? `⏳ Faltam ${progressData.remainingActivities} atividades` 
                                        : '📈 Continue melhorando suas notas (média ≥7.0)'}
                                </div>
                            `}
                        </div>
                    </div>
                ` : ''}

                <!-- Available Classes Section (NEW - replaces course selection) -->
                <div class="classes-section">
                    <h2 class="section-title">
                        <span class="title-icon">🥋</span>
                        Turmas Disponíveis
                        <span class="title-hint">Selecione uma turma para fazer check-in</span>
                    </h2>
                    
                    ${turmasData && turmasData.openNow && turmasData.openNow.length > 0 ? `
                        <div class="classes-open-now">
                            <h3 class="classes-subtitle">🟢 Check-in Aberto AGORA</h3>
                            <div class="classes-grid">
                                ${turmasData.openNow.map(turma => `
                                    <div class="class-card active" data-turma-id="${turma.id}" data-lesson-id="${turma.lessonId}" data-course-id="${turma.courseId}">
                                        <div class="class-header">
                                            <div class="class-time">${turma.startTime} - ${turma.endTime}</div>
                                            <div class="class-status-badge open">Aberto</div>
                                        </div>
                                        <div class="class-name">${turma.name}</div>
                                        <div class="class-details">
                                            <div class="class-instructor">👨‍🏫 ${turma.instructor}</div>
                                            <div class="class-room">📍 ${turma.room}</div>
                                            <div class="class-slots">👥 ${turma.availableSlots}/${turma.maxStudents} vagas</div>
                                        </div>
                                        <button class="btn-checkin-turma" data-turma-id="${turma.id}" data-lesson-id="${turma.lessonId}" data-course-id="${turma.courseId}">
                                            <span class="icon">✅</span>
                                            <span class="text">FAZER CHECK-IN</span>
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : `
                        <div class="empty-state">
                            <div class="empty-icon">😕</div>
                            <div class="empty-text">Nenhuma turma disponível para check-in agora</div>
                            <div class="empty-hint">Check-in abre 30 minutos antes da aula</div>
                        </div>
                    `}
                    
                    ${turmasData && turmasData.upcoming && turmasData.upcoming.length > 0 ? `
                        <div class="classes-upcoming">
                            <h3 class="classes-subtitle">⏰ Próximas Turmas</h3>
                            <div class="upcoming-grid">
                                ${turmasData.upcoming.slice(0, 3).map(turma => `
                                    <div class="upcoming-card">
                                        <div class="upcoming-time">${turma.startTime} - ${turma.endTime}</div>
                                        <div class="upcoming-name">${turma.name}</div>
                                        <div class="upcoming-countdown">Abre em ${turma.opensIn}</div>
                                        <div class="upcoming-instructor">👨‍🏫 ${turma.instructor}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        this.setupEventsV2();
    }

    /**
     * Render basic view (fallback if APIs fail)
     */
    renderBasicView(student, courses) {
        // Format plan validity
        const planStatus = student.subscriptions && student.subscriptions.length > 0
            ? student.subscriptions[0]
            : null;
        
        const validUntil = planStatus?.endDate 
            ? new Date(planStatus.endDate).toLocaleDateString('pt-BR')
            : 'Sem prazo';
        
        const planName = planStatus?.plan?.name || 'Sem plano ativo';
        const planPrice = planStatus?.currentPrice 
            ? `R$ ${parseFloat(planStatus.currentPrice).toFixed(2).replace('.', ',')}`
            : '--';

        // Calculate days remaining
        let daysRemaining = 0;
        let isExpiring = false;
        if (planStatus?.endDate) {
            const endDate = new Date(planStatus.endDate);
            const today = new Date();
            daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
            isExpiring = daysRemaining > 0 && daysRemaining <= 7;
        }

        // Course cards - NÚMEROS GRANDES PARA CLICAR
        const coursesHTML = courses
            .map((c, index) => {
                const courseNumber = index + 1;
                return `
                <div class="course-card-large" data-course-id="${c.id}">
                    <div class="course-number">${courseNumber}</div>
                    <div class="course-info">
                        <div class="course-name-large">${c.name}</div>
                        <div class="course-meta">
                            <span class="course-time">🕐 ${c.time || 'Horário não definido'}</span>
                            <span class="course-instructor">👨‍🏫 ${c.instructor || 'Instrutor não definido'}</span>
                        </div>
                    </div>
                    <div class="course-check">✓</div>
                </div>
            `;
            })
            .join('');

        this.container.innerHTML = `
            <div class="checkin-dashboard">
                <!-- Header with Student Info -->
                <div class="dashboard-header">
                    <div class="student-photo-large">
                        ${student.user?.avatarUrl 
                            ? `<img src="${student.user.avatarUrl}" alt="${student.user.firstName}" />` 
                            : `<div class="avatar-placeholder">${(student.user?.firstName || '?')[0]}</div>`
                        }
                    </div>
                    <div class="student-info-large">
                        <h1 class="student-name-huge">${student.user?.firstName || ''} ${student.user?.lastName || ''}</h1>
                        <div class="student-meta-row">
                            <span class="student-id-badge">📋 ${student.id.substring(0, 8)}</span>
                            ${student.user?.phone ? `<span class="student-phone">� ${student.user.phone}</span>` : ''}
                        </div>
                    </div>
                    <button id="reject-btn" class="btn-cancel-top">
                        <span class="icon">✖</span>
                        <span class="text">Cancelar</span>
                    </button>
                </div>

                <!-- Stats Cards Row -->
                <div class="stats-row">
                    <div class="stat-card ${planStatus?.status === 'ACTIVE' ? 'stat-success' : 'stat-danger'}">
                        <div class="stat-icon">${planStatus?.status === 'ACTIVE' ? '✅' : '❌'}</div>
                        <div class="stat-content">
                            <div class="stat-label">Status do Plano</div>
                            <div class="stat-value">${planStatus?.status === 'ACTIVE' ? 'ATIVO' : 'INATIVO'}</div>
                        </div>
                    </div>

                    <div class="stat-card ${isExpiring ? 'stat-warning' : 'stat-info'}">
                        <div class="stat-icon">📅</div>
                        <div class="stat-content">
                            <div class="stat-label">Validade</div>
                            <div class="stat-value">${validUntil}</div>
                            ${daysRemaining > 0 && daysRemaining <= 30 
                                ? `<div class="stat-hint ${isExpiring ? 'hint-urgent' : ''}">${daysRemaining} dias restantes</div>` 
                                : ''
                            }
                        </div>
                    </div>

                    <div class="stat-card stat-info">
                        <div class="stat-icon">💰</div>
                        <div class="stat-content">
                            <div class="stat-label">Plano Atual</div>
                            <div class="stat-value-small">${planName.substring(0, 30)}...</div>
                            <div class="stat-hint">${planPrice}/mês</div>
                        </div>
                    </div>

                    <div class="stat-card stat-primary">
                        <div class="stat-icon">🎯</div>
                        <div class="stat-content">
                            <div class="stat-label">Check-ins</div>
                            <div class="stat-value">${student.stats?.totalAttendances || 0}</div>
                            <div class="stat-hint">Total realizados</div>
                        </div>
                    </div>

                    <div class="stat-card stat-info">
                        <div class="stat-icon">🔥</div>
                        <div class="stat-content">
                            <div class="stat-label">Sequência</div>
                            <div class="stat-value">${student.stats?.currentStreak || 0}</div>
                            <div class="stat-hint">dias consecutivos</div>
                        </div>
                    </div>
                </div>

                <!-- Course Selection -->
                <div class="course-selection">
                    <h2 class="section-title">
                        <span class="title-icon">📚</span>
                        Selecione o Curso
                        <span class="title-hint">Clique no número para selecionar</span>
                    </h2>
                    <div class="courses-grid">${coursesHTML}</div>
                </div>

                <!-- Confirm Button -->
                <div class="dashboard-footer">
                    <button id="confirm-btn" class="btn-confirm-huge" disabled>
                        <span class="icon">✅</span>
                        <span class="text">CONFIRMAR CHECK-IN</span>
                    </button>
                </div>
            </div>
        `;

        this.setupEvents();
    }

    /**
     * Render basic view (fallback if APIs fail)
     */
    renderBasicView(student, courses) {
        const coursesHtml = courses.map(course => {
            const isCompleted = student.attendances?.some(att => att.courseId === course.id);
            
            return `
                <div class="course-card ${isCompleted ? 'completed' : ''}">
                    <h4>${course.name}</h4>
                    <p>${course.description || ''}</p>
                    <div class="course-progress">
                        <div class="progress-label">${course.level}</div>
                    </div>
                    <div class="course-check">✓</div>
                </div>
            `;
        }).join('');

        this.container.innerHTML = `
            <div class="checkin-dashboard">
                <div class="dashboard-header">
                    <div class="student-photo-large">
                        ${student.user?.avatarUrl 
                            ? `<img src="${student.user.avatarUrl}" alt="${student.user.firstName}" />` 
                            : `<div class="avatar-placeholder">${(student.user?.firstName || '?')[0]}</div>`
                        }
                    </div>
                    <div class="student-info-large">
                        <h1 class="student-name-huge">${student.user?.firstName || ''} ${student.user?.lastName || ''}</h1>
                        <div class="student-meta-row">
                            <span class="student-id-badge">📋 ${student.registrationNumber ? `Matrícula: ${student.registrationNumber}` : `ID: ${student.id.substring(0, 8)}`}</span>
                            ${student.user?.phone ? `<span class="student-phone">📞 ${student.user.phone}</span>` : ''}
                        </div>
                    </div>
                    <button id="reject-btn" class="btn-cancel-top">
                        <span class="icon">✖</span>
                        <span class="text">Cancelar</span>
                    </button>
                </div>

                <div class="course-selection-dashboard">
                    <h2 class="section-title">
                        <span class="title-icon">📚</span>
                        SELECIONE SUA AULA
                    </h2>
                    
                    ${courses && courses.length > 0 
                        ? `<div class="courses-grid-large">${coursesHtml}</div>`
                        : `<div class="empty-state-large">
                            <div class="empty-icon">😕</div>
                            <div class="empty-text">Nenhuma aula disponível hoje</div>
                        </div>`
                    }
                </div>

                <div class="dashboard-footer">
                    <button id="confirm-btn" class="btn-confirm-huge" disabled>
                        <span class="icon">✅</span>
                        <span class="text">CONFIRMAR CHECK-IN</span>
                    </button>
                </div>
            </div>
        `;

        this.setupEvents(courses);
    }

    /**
     * Setup event listeners - V2.0 with turma selection
     */
    setupEventsV2() {
        // Direct check-in buttons on each turma card
        const checkinButtons = this.container.querySelectorAll('.btn-checkin-turma');
        checkinButtons.forEach((button) => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                
                const turmaId = button.dataset.turmaId;
                const lessonId = button.dataset.lessonId;
                const courseId = button.dataset.courseId;

                console.log('✅ Check-in direto na turma:', { turmaId, lessonId, courseId });

                if (courseId && lessonId) {
                    // Direct confirmation with turma info
                    this.onConfirm(courseId, { turmaId: turmaId, lessonId: lessonId });
                } else {
                    console.warn('⚠️ Turma sem courseId ou lessonId associado', { courseId, lessonId });
                }
            });
        });

        // Reject/Cancel button (if exists in other views)
        this.container.querySelector('#reject-btn')?.addEventListener('click', () => {
            this.onReject();
        });
    }

    /**
     * Setup event listeners (simplified for basic view)
     */
    setupEvents(courses) {
        let selectedCourseId = null;

        // Course card selection
        const courseCards = this.container.querySelectorAll('.course-card');
        courseCards.forEach((card) => {
            card.addEventListener('click', () => {
                // Deselect all
                courseCards.forEach((c) => c.classList.remove('selected'));

                // Select current
                card.classList.add('selected');
                selectedCourseId = courses.find(c => c.name === card.querySelector('h4')?.textContent)?.id;

                // Enable confirm button
                const confirmBtn = this.container.querySelector('#confirm-btn');
                if (confirmBtn) {
                    confirmBtn.disabled = false;
                    confirmBtn.classList.add('enabled');
                }
            });
        });

        // Confirm button
        this.container.querySelector('#confirm-btn')?.addEventListener('click', () => {
            if (selectedCourseId) {
                this.onConfirm(selectedCourseId);
            }
        });

        // Reject/Cancel button
        this.container.querySelector('#reject-btn')?.addEventListener('click', () => {
            this.onReject();
        });
    }

    /**
     * Show loading state on confirm button
     */
    showConfirmLoading() {
        const btn = this.container.querySelector('#confirm-btn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<div class="spinner-small"></div><span>Registrando...</span>';
        }
    }

    /**
     * Disable all buttons
     */
    disable() {
        this.container.querySelectorAll('button').forEach((btn) => {
            btn.disabled = true;
        });
        this.container.querySelectorAll('.course-option').forEach((el) => {
            el.style.pointerEvents = 'none';
            el.style.opacity = '0.5';
        });
    }

    /**
     * Enable all buttons
     */
    enable() {
        this.container.querySelectorAll('button').forEach((btn) => {
            btn.disabled = false;
        });
        this.container.querySelectorAll('.course-option').forEach((el) => {
            el.style.pointerEvents = 'auto';
            el.style.opacity = '1';
        });
    }
}

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConfirmationView;
}

// Export to global scope for browser
if (typeof window !== 'undefined') {
    window.ConfirmationView = ConfirmationView;
}
