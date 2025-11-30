/**
 * SuccessView.js
 * Renders success screen after check-in completion
 */

class SuccessView {
    constructor(container, callbacks = {}) {
        this.container = container;
        this.onReset = callbacks.onReset || (() => {});
    }

    /**
     * Render success view
     */
    render(checkinData, autoResetSeconds = 5) {
        const timestamp = new Date(checkinData.timestamp);
        const formattedTime = timestamp.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
        const formattedDate = timestamp.toLocaleDateString('pt-BR');

        this.container.innerHTML = `
            <div class="module-header-premium">
                <h1>🎉 CHECK-IN REGISTRADO COM SUCESSO!</h1>
            </div>

            <div class="success-container fade-in" role="status" aria-live="polite">
                <div class="success-card">
                    <div class="success-icon" aria-hidden="true">
                        <div class="icon-checkmark">✅</div>
                    </div>

                    <div class="success-details">
                        <h2 class="student-name">${checkinData.studentName}</h2>
                        <p class="course-name">📅 ${checkinData.courseName}</p>
                        <p class="timestamp">
                            🕐 ${formattedDate} às ${formattedTime}
                        </p>
                    </div>

                    <div class="success-action">
                        <p class="reset-message" aria-live="off">
                            ⏱️ Voltando ao repouso em <span id="countdown">${autoResetSeconds}</span>s
                        </p>
                        <button id="reset-btn" class="btn-primary" aria-label="Start new check-in">
                            Iniciar Novo Check-in
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.setupEvents(autoResetSeconds);
    }

    /**
     * Setup event listeners and auto-reset
     */
    setupEvents(autoResetSeconds) {
        const resetBtn = this.container.querySelector('#reset-btn');
        const countdownEl = this.container.querySelector('#countdown');

        // Manual reset
        resetBtn?.addEventListener('click', () => {
            this.onReset();
        });

        // Auto reset countdown
        let remaining = autoResetSeconds;
        const interval = setInterval(() => {
            remaining--;

            if (countdownEl) {
                countdownEl.textContent = remaining;
            }

            if (remaining <= 0) {
                clearInterval(interval);
                this.onReset();
            }
        }, 1000);
    }

    /**
     * Show error message instead of success
     */
    showError(errorData) {
        this.container.innerHTML = `
            <div class="module-header-premium">
                <h1>❌ ERRO AO REGISTRAR CHECK-IN</h1>
            </div>

            <div class="error-container" role="alert" aria-live="assertive">
                <div class="error-card">
                    <div class="error-icon" aria-hidden="true">❌</div>
                    <p class="error-message">${errorData.message || 'Ocorreu um erro inesperado'}</p>
                    <button id="retry-btn" class="btn-primary" aria-label="Try again">
                        Tentar Novamente
                    </button>
                </div>
            </div>
        `;

        this.container.querySelector('#retry-btn')?.addEventListener('click', () => {
            this.onReset();
        });
    }
}

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SuccessView;
}
