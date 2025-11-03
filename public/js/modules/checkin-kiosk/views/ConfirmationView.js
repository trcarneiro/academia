/**
 * ConfirmationView.js
 * Renders student confirmation screen after successful face match
 */

class ConfirmationView {
    constructor(container, callbacks = {}) {
        this.container = container;
        this.onConfirm = callbacks.onConfirm || (() => {});
        this.onReject = callbacks.onReject || (() => {});
    }

    /**
     * Render confirmation view - NOVO UX DASHBOARD
     */
    render(student, courses) {
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
                </div>

                <!-- Course Selection Section -->
                <div class="course-selection-dashboard">
                    <h2 class="section-title">
                        <span class="title-icon">📚</span>
                        SELECIONE SUA AULA
                        <span class="title-hint">Clique no número da aula desejada</span>
                    </h2>
                    
                    ${courses && courses.length > 0 
                        ? `<div class="courses-grid-large">${coursesHTML}</div>`
                        : `
                        <div class="empty-state-large">
                            <div class="empty-icon">😕</div>
                            <div class="empty-text">Nenhuma aula disponível hoje</div>
                            <div class="empty-hint">Entre em contato com a recepção</div>
                        </div>
                    `}
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

        this.setupEvents(courses);
    }

    /**
     * Setup event listeners - NOVO SISTEMA DE CARDS
     */
    setupEvents(courses) {
        let selectedCourseId = null;

        // Course card selection - NÚMEROS GRANDES
        const courseCards = this.container.querySelectorAll('.course-card-large');
        courseCards.forEach((card) => {
            card.addEventListener('click', () => {
                // Deselect all
                courseCards.forEach((c) => c.classList.remove('selected'));

                // Select current
                card.classList.add('selected');
                selectedCourseId = card.dataset.courseId;

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
