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
     * Render confirmation view
     */
    render(student, courses) {
        const coursesHTML = courses
            .map(
                (c) => `
            <div class="course-option" data-course-id="${c.id}">
                <div class="course-time">${c.time}</div>
                <div class="course-details">
                    <div class="course-name">${c.name}</div>
                    <div class="course-instructor">Prof. ${c.instructor || 'N/A'}</div>
                </div>
                <div class="course-select-icon">→</div>
            </div>
        `
            )
            .join('');

        this.container.innerHTML = `
            <div class="module-header-premium">
                <h1>✅ IDENTIDADE CONFIRMADA</h1>
                <p>Confirme seus dados e selecione uma aula</p>
            </div>

            <div class="confirmation-container">
                <div class="student-card">
                    <div class="student-photo-container">
                        ${student.photoUrl ? `<img src="${student.photoUrl}" alt="${student.name}" class="student-photo" />` : '<div class="student-photo-placeholder">👤</div>'}
                        <div class="confidence-badge">${student.similarity}% de confiança</div>
                    </div>

                    <div class="student-details">
                        <h2 class="student-name">${student.name}</h2>
                        <p class="student-id">📋 Matrícula: ${student.studentId}</p>
                        
                        <div class="status-container">
                            ${
                                student.isActive
                                    ? `<div class="status-badge active">✅ Ativo (${student.daysRemaining} dias)</div>`
                                    : '<div class="status-badge inactive">❌ Inativo</div>'
                            }
                        </div>

                        ${
                            student.plans && student.plans.length > 0
                                ? `
                            <div class="plans-section">
                                <h3>Planos Ativos:</h3>
                                <div class="plans-list">
                                    ${student.plans.map((p) => `<div class="plan-item">✅ ${p}</div>`).join('')}
                                </div>
                            </div>
                        `
                                : ''
                        }
                    </div>
                </div>

                <div class="course-selection-section">
                    <h3>📅 Qual aula você participará?</h3>
                    
                    ${
                        courses && courses.length > 0
                            ? `
                        <div class="courses-list">
                            ${coursesHTML}
                        </div>
                    `
                            : `
                        <div class="empty-state">
                            <p>Nenhuma aula disponível hoje</p>
                        </div>
                    `
                    }
                </div>

                <div class="confirmation-actions">
                    <button id="confirm-btn" class="btn-success btn-lg" disabled>
                        <span class="icon">✅</span>
                        <span class="text">Confirmar Check-in</span>
                    </button>
                    <button id="reject-btn" class="btn-secondary btn-lg">
                        <span class="icon">❌</span>
                        <span class="text">Não sou eu</span>
                    </button>
                </div>
            </div>
        `;

        this.setupEvents(courses);
    }

    /**
     * Setup event listeners
     */
    setupEvents(courses) {
        let selectedCourseId = null;

        // Course selection
        courses.forEach((c) => {
            const courseEl = this.container.querySelector(`[data-course-id="${c.id}"]`);
            courseEl?.addEventListener('click', () => {
                // Deselect previous
                this.container.querySelectorAll('.course-option').forEach((el) => {
                    el.classList.remove('selected');
                });

                // Select current
                courseEl.classList.add('selected');
                selectedCourseId = c.id;

                // Enable confirm button
                const confirmBtn = this.container.querySelector('#confirm-btn');
                if (confirmBtn) confirmBtn.disabled = false;
            });
        });

        // Confirm button
        this.container.querySelector('#confirm-btn')?.addEventListener('click', () => {
            if (selectedCourseId) {
                this.onConfirm(selectedCourseId);
            }
        });

        // Reject button
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
