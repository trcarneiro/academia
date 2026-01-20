/**
 * ConfirmationView.js v2.0
 * Renders student confirmation screen with sales-focused enhancements
 * Features: Course progress, class availability, upsell recommendations, gamification
 */

class ConfirmationView {
    constructor(container, moduleAPI, callbacks = {}) {
        this.container = container;
        this.moduleAPI = moduleAPI;

        // Wrap callbacks to handle timeout cleanup
        this.onConfirm = (...args) => {
            this.stopTimeout();
            if (callbacks.onConfirm) callbacks.onConfirm(...args);
        };
        this.onReject = (...args) => {
            this.stopTimeout();
            if (callbacks.onReject) callbacks.onReject(...args);
        };

        // Timeout configuration
        this.timeoutTimer = null;
        this.TIMEOUT_MS = 30000; // 30s auto-close
    }

    /**
     * Render confirmation view - V2.0 SALES DASHBOARD
     * AUTO CHECK-IN: Se só tem 1 turma disponível, faz check-in automático
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

            // ============================================================
            // AUTO CHECK-IN: Se só tem 1 turma aberta agora, faz automático
            // ============================================================
            const openNowTurmas = turmasData?.openNow || [];

            if (openNowTurmas.length === 1) {
                const turma = openNowTurmas[0];
                console.log('🚀 AUTO CHECK-IN: Apenas 1 turma disponível -', turma.name);

                // Mostrar confirmação rápida antes de fazer check-in
                this.showAutoCheckinConfirmation(student, turma, progressData);
                return;
            }

            // Se 0 ou 2+ turmas, mostrar dashboard completo para seleção
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
            const response = await this.moduleAPI.request(`/api/students/${studentId}/course-progress`, {
                method: 'GET'
            });
            return response.success ? response.data : null;
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
            const response = await this.moduleAPI.request(`/api/turmas/available-now?organizationId=${organizationId}&studentId=${studentId}`, {
                method: 'GET'
            });

            console.log('📦 [ConfirmationView] Turmas response:', response);
            console.log('📊 [ConfirmationView] Data structure:', {
                success: response.success,
                hasData: !!response.data,
                openNow: response.data?.openNow?.length || 0,
                upcoming: response.data?.upcoming?.length || 0
            });
            return response.success ? response.data : null;
        } catch (error) {
            console.error('❌ Error fetching turmas:', error);
            return null;
        }
    }

    /**
     * Show auto check-in confirmation (when only 1 turma is available)
     * Mostra confirmação rápida com countdown de 5 segundos
     */
    showAutoCheckinConfirmation(student, turma, progressData) {
        const AUTO_CHECKIN_DELAY = 5; // segundos
        let countdown = AUTO_CHECKIN_DELAY;

        this.container.innerHTML = `
            <div class="auto-checkin-screen fade-in">
                <!-- Header com foto do aluno -->
                <div class="auto-checkin-header">
                    <div class="student-photo-large">
                        ${student.user?.avatarUrl
                ? `<img src="${student.user.avatarUrl}" alt="${student.user.firstName}" />`
                : `<div class="avatar-placeholder">${(student.user?.firstName || '?')[0]}</div>`
            }
                    </div>
                    <div class="student-greeting">
                        <h1>Olá, ${student.user?.firstName || 'Aluno'}! 👋</h1>
                        <p class="student-id">📋 ${student.registrationNumber || student.id.substring(0, 8)}</p>
                    </div>
                </div>

                <!-- Turma única disponível -->
                <div class="single-turma-card">
                    <div class="turma-badge">🥋 Única turma disponível agora</div>
                    <h2 class="turma-name">${turma.name}</h2>
                    <div class="turma-details">
                        <span class="turma-time">🕐 ${turma.startTime} - ${turma.endTime}</span>
                        <span class="turma-instructor">👨‍🏫 ${turma.instructor}</span>
                        <span class="turma-room">📍 ${turma.room || 'Sala principal'}</span>
                    </div>
                </div>

                <!-- Countdown e ações -->
                <div class="auto-checkin-actions">
                    <div class="countdown-section">
                        <p class="countdown-text">Check-in automático em</p>
                        <div class="countdown-number" id="auto-countdown">${countdown}</div>
                        <p class="countdown-hint">segundos</p>
                    </div>
                    
                    <div class="action-buttons">
                        <button id="btn-confirm-now" class="btn-confirm-large">
                            <i class="fas fa-check"></i>
                            Confirmar Agora
                        </button>
                        <button id="btn-cancel-auto" class="btn-cancel-secondary">
                            <i class="fas fa-times"></i>
                            Cancelar
                        </button>
                    </div>
                </div>

                <!-- Progress bar animada -->
                <div class="auto-progress-bar">
                    <div class="auto-progress-fill" style="animation: shrink ${AUTO_CHECKIN_DELAY}s linear forwards;"></div>
                </div>
            </div>
        `;

        // Store turma data for later
        this.autoCheckinTurma = turma;
        this.autoCheckinStudent = student;

        // Setup countdown timer
        const countdownEl = this.container.querySelector('#auto-countdown');
        this.autoCheckinTimer = setInterval(() => {
            countdown--;
            if (countdownEl) {
                countdownEl.textContent = countdown;
            }

            if (countdown <= 0) {
                this.executeAutoCheckin(turma);
            }
        }, 1000);

        // Setup button events
        this.container.querySelector('#btn-confirm-now')?.addEventListener('click', () => {
            this.stopAutoCheckinTimer();
            this.executeAutoCheckin(turma);
        });

        this.container.querySelector('#btn-cancel-auto')?.addEventListener('click', () => {
            this.stopAutoCheckinTimer();
            this.onReject();
        });
    }

    /**
     * Stop auto check-in timer
     */
    stopAutoCheckinTimer() {
        if (this.autoCheckinTimer) {
            clearInterval(this.autoCheckinTimer);
            this.autoCheckinTimer = null;
        }
    }

    /**
     * Execute the auto check-in
     */
    executeAutoCheckin(turma) {
        this.stopAutoCheckinTimer();
        console.log('✅ Executing auto check-in for turma:', turma.name);

        // Call the onConfirm callback with turma data
        if (turma.courseId && turma.lessonId) {
            this.onConfirm(turma.courseId, {
                turmaId: turma.id,
                lessonId: turma.lessonId
            });
        } else {
            console.warn('⚠️ Turma missing courseId or lessonId, using fallback');
            this.onConfirm(turma.courseId || turma.id, { turmaId: turma.id });
        }
    }

    /**
     * Show loading state
     */
    showLoadingState(student) {
        this.container.innerHTML = `
            <div class="checkin-dashboard loading fade-in">
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
        // Store student for later use
        this.currentStudent = student;
        this.reactivationState = 'initial'; // initial, selecting, payment, success

        this.container.innerHTML = `
            <div class="reactivation-screen fade-in">
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
                        <button class="btn-reactivate" id="btn-show-plans">
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
        this.container.querySelector('#btn-show-plans')?.addEventListener('click', () => {
            this.showPlanSelection(student);
        });

        this.container.querySelector('#reject-btn')?.addEventListener('click', () => {
            this.onReject();
        });

        this.startTimeout();
    }

    /**
     * Show plan selection screen
     */
    async showPlanSelection(student) {
        this.stopTimeout(); // Pausar timeout durante seleção
        this.reactivationState = 'selecting';

        // Show loading
        const content = this.container.querySelector('.reactivation-content');
        if (content) {
            content.innerHTML = `
                <div class="loading-plans">
                    <div class="spinner-large"></div>
                    <p>Carregando planos disponíveis...</p>
                </div>
            `;
        }

        try {
            // Fetch available plans using moduleAPI (includes proper headers)
            const response = await this.moduleAPI.request('/api/billing-plans', {
                method: 'GET'
            });

            const plans = (response.data || response || []).filter(p => p.isActive !== false);

            if (plans.length === 0) {
                this.showNoPlansFallback();
                return;
            }

            this.renderPlanCards(student, plans);
        } catch (error) {
            console.error('❌ Erro ao carregar planos:', error);
            this.showNoPlansFallback();
        }
    }

    /**
     * Render plan selection cards
     */
    renderPlanCards(student, plans) {
        const formatPrice = (price) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
        const getBillingLabel = (type) => {
            const labels = { 'MONTHLY': '/mês', 'QUARTERLY': '/trimestre', 'SEMIANNUALLY': '/semestre', 'YEARLY': '/ano', 'LIFETIME': ' único' };
            return labels[type] || '';
        };

        const content = this.container.querySelector('.reactivation-content');
        if (!content) return;

        content.innerHTML = `
            <h3 class="plans-title">📋 Escolha seu plano:</h3>
            <div class="plans-grid">
                ${plans.map((plan, idx) => `
                    <div class="plan-card ${idx === 0 ? 'plan-recommended' : ''}" data-plan-id="${plan.id}">
                        ${idx === 0 ? '<span class="plan-badge">⭐ Recomendado</span>' : ''}
                        <h4 class="plan-name">${plan.name}</h4>
                        <div class="plan-price">
                            <span class="price-value">${formatPrice(Number(plan.price))}</span>
                            <span class="price-period">${getBillingLabel(plan.billingType)}</span>
                        </div>
                        ${plan.description ? `<p class="plan-description">${plan.description}</p>` : ''}
                        ${plan.classesPerWeek ? `<p class="plan-classes">📚 ${plan.classesPerWeek}x por semana</p>` : ''}
                        <button class="btn-select-plan" data-plan-id="${plan.id}">
                            Selecionar
                        </button>
                    </div>
                `).join('')}
            </div>
            <div class="plans-actions">
                <button id="btn-back-initial" class="btn-back">
                    <span class="icon">←</span>
                    <span class="text">Voltar</span>
                </button>
            </div>
        `;

        // Setup plan selection events
        content.querySelectorAll('.btn-select-plan').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const planId = e.target.dataset.planId;
                const plan = plans.find(p => p.id === planId);
                this.processReactivation(student, plan);
            });
        });

        // Back button
        content.querySelector('#btn-back-initial')?.addEventListener('click', () => {
            this.renderReactivationScreen(student);
        });
    }

    /**
     * Process reactivation and show payment
     */
    async processReactivation(student, plan) {
        this.reactivationState = 'payment';

        const content = this.container.querySelector('.reactivation-content');
        if (!content) return;

        // Show processing
        content.innerHTML = `
            <div class="processing-payment">
                <div class="spinner-large"></div>
                <h3>Gerando pagamento PIX...</h3>
                <p>Aguarde um momento</p>
            </div>
        `;

        try {
            // Use moduleAPI to include organization context
            const response = await this.moduleAPI.request('/api/subscriptions/reactivate', {
                method: 'POST',
                body: JSON.stringify({
                    studentId: student.id,
                    planId: plan.id
                })
            });

            const data = response.data || response;

            // Check if PIX was generated
            if (data.pix?.qrCode || data.pix?.copyPaste) {
                this.showPixPayment(student, plan, data);
            } else if (data.invoiceUrl) {
                this.showInvoiceLink(student, plan, data);
            } else {
                this.showLocalPayment(student, plan, data);
            }
        } catch (error) {
            console.error('❌ Erro ao processar reativação:', error);
            this.showPaymentError(student, error.message);
        }
    }

    /**
     * Show PIX QR Code payment screen
     */
    showPixPayment(student, plan, paymentData) {
        const formatPrice = (price) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

        const content = this.container.querySelector('.reactivation-content');
        if (!content) return;

        content.innerHTML = `
            <div class="pix-payment-screen">
                <h3 class="pix-title">💳 Pagamento via PIX</h3>
                <p class="pix-plan">Plano: <strong>${plan.name}</strong> - ${formatPrice(Number(plan.price))}</p>
                
                <div class="pix-qr-container">
                    ${paymentData.pix.qrCode
                ? `<img src="data:image/png;base64,${paymentData.pix.qrCode}" alt="QR Code PIX" class="pix-qr-image" />`
                : '<div class="pix-no-qr">QR Code não disponível</div>'
            }
                </div>
                
                ${paymentData.pix.copyPaste ? `
                    <div class="pix-copypaste">
                        <p class="pix-label">Ou copie o código:</p>
                        <div class="pix-code-container">
                            <input type="text" readonly value="${paymentData.pix.copyPaste}" class="pix-code-input" id="pix-code" />
                            <button class="btn-copy-pix" id="btn-copy-pix">📋 Copiar</button>
                        </div>
                    </div>
                ` : ''}
                
                <div class="pix-status">
                    <div class="status-indicator waiting">
                        <span class="spinner-small"></span>
                        <span>Aguardando pagamento...</span>
                    </div>
                </div>
                
                <div class="pix-actions">
                    <button id="btn-back-plans" class="btn-back">
                        <span class="icon">←</span>
                        <span class="text">Escolher outro plano</span>
                    </button>
                    <button id="btn-cancel-payment" class="btn-cancel">
                        <span class="icon">✖</span>
                        <span class="text">Cancelar</span>
                    </button>
                </div>
                
                <p class="pix-help">Escaneie o QR Code com o app do seu banco ou copie o código PIX</p>
            </div>
        `;

        // Copy PIX code
        content.querySelector('#btn-copy-pix')?.addEventListener('click', () => {
            const input = content.querySelector('#pix-code');
            if (input) {
                input.select();
                document.execCommand('copy');
                const btn = content.querySelector('#btn-copy-pix');
                if (btn) {
                    btn.textContent = '✅ Copiado!';
                    setTimeout(() => btn.textContent = '📋 Copiar', 2000);
                }
            }
        });

        // Back to plans
        content.querySelector('#btn-back-plans')?.addEventListener('click', () => {
            this.stopPaymentPolling();
            this.showPlanSelection(student);
        });

        // Cancel
        content.querySelector('#btn-cancel-payment')?.addEventListener('click', () => {
            this.stopPaymentPolling();
            this.onReject();
        });

        // Start polling for payment confirmation
        if (paymentData.subscriptionId) {
            this.startPaymentPolling(paymentData.subscriptionId, student);
        }
    }

    /**
     * Show invoice link (when PIX QR not available)
     */
    showInvoiceLink(student, plan, paymentData) {
        const formatPrice = (price) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

        const content = this.container.querySelector('.reactivation-content');
        if (!content) return;

        content.innerHTML = `
            <div class="invoice-payment-screen">
                <h3>📄 Link de Pagamento</h3>
                <p>Plano: <strong>${plan.name}</strong> - ${formatPrice(Number(plan.price))}</p>
                
                <div class="invoice-link-container">
                    <p>Acesse o link abaixo para realizar o pagamento:</p>
                    <a href="${paymentData.invoiceUrl}" target="_blank" class="btn-invoice-link">
                        🔗 Abrir página de pagamento
                    </a>
                </div>
                
                <div class="pix-actions">
                    <button id="btn-back-plans" class="btn-back">
                        <span class="icon">←</span>
                        <span class="text">Escolher outro plano</span>
                    </button>
                    <button id="btn-cancel-payment" class="btn-cancel">
                        <span class="icon">✖</span>
                        <span class="text">Cancelar</span>
                    </button>
                </div>
            </div>
        `;

        // Events
        content.querySelector('#btn-back-plans')?.addEventListener('click', () => {
            this.showPlanSelection(student);
        });

        content.querySelector('#btn-cancel-payment')?.addEventListener('click', () => {
            this.onReject();
        });
    }

    /**
     * Show local payment message (when Asaas not configured)
     */
    showLocalPayment(student, plan, paymentData) {
        const formatPrice = (price) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

        const content = this.container.querySelector('.reactivation-content');
        if (!content) return;

        content.innerHTML = `
            <div class="local-payment-screen">
                <div class="success-icon">✅</div>
                <h3>Solicitação Registrada!</h3>
                <p>Plano: <strong>${plan.name}</strong> - ${formatPrice(Number(plan.price))}</p>
                
                <div class="local-payment-info">
                    <p>📍 Dirija-se à recepção para efetuar o pagamento</p>
                    <p class="payment-id">Protocolo: ${paymentData.subscriptionId?.substring(0, 8) || 'N/A'}</p>
                </div>
                
                <div class="local-actions">
                    <button id="btn-done" class="btn-confirm">
                        <span class="icon">✓</span>
                        <span class="text">Entendido</span>
                    </button>
                </div>
            </div>
        `;

        content.querySelector('#btn-done')?.addEventListener('click', () => {
            this.onReject();
        });

        // Auto close after 10 seconds
        setTimeout(() => this.onReject(), 10000);
    }

    /**
     * Show payment error
     */
    showPaymentError(student, errorMessage) {
        const content = this.container.querySelector('.reactivation-content');
        if (!content) return;

        content.innerHTML = `
            <div class="payment-error-screen">
                <div class="error-icon">❌</div>
                <h3>Ops! Algo deu errado</h3>
                <p class="error-message">${errorMessage}</p>
                
                <div class="error-actions">
                    <button id="btn-retry" class="btn-reactivate">
                        <span class="icon">🔄</span>
                        <span class="text">Tentar Novamente</span>
                    </button>
                    <button id="btn-cancel" class="btn-back">
                        <span class="icon">←</span>
                        <span class="text">Voltar</span>
                    </button>
                </div>
                
                <p class="error-help">Se o problema persistir, procure a recepção</p>
            </div>
        `;

        content.querySelector('#btn-retry')?.addEventListener('click', () => {
            this.showPlanSelection(student);
        });

        content.querySelector('#btn-cancel')?.addEventListener('click', () => {
            this.onReject();
        });
    }

    /**
     * Show fallback when no plans available
     */
    showNoPlansFallback() {
        const content = this.container.querySelector('.reactivation-content');
        if (!content) return;

        content.innerHTML = `
            <div class="no-plans-screen">
                <div class="info-icon">ℹ️</div>
                <h3>Nenhum plano disponível</h3>
                <p>Por favor, procure a recepção para reativar seu plano.</p>
                
                <div class="fallback-actions">
                    <button id="btn-back" class="btn-back">
                        <span class="icon">←</span>
                        <span class="text">Voltar</span>
                    </button>
                </div>
            </div>
        `;

        content.querySelector('#btn-back')?.addEventListener('click', () => {
            this.onReject();
        });
    }

    /**
     * Start polling to check payment status
     */
    startPaymentPolling(subscriptionId, student) {
        const startTime = Date.now();
        const maxTime = 5 * 60 * 1000; // 5 minutos

        this.paymentPollingInterval = setInterval(async () => {
            try {
                const response = await fetch(`/api/subscriptions/${subscriptionId}`);
                if (!response.ok) return;

                const result = await response.json();
                const subscription = result.data || result;

                if (subscription.status === 'ACTIVE') {
                    this.stopPaymentPolling();
                    this.showPaymentSuccess(student);
                    return;
                }

                // Timeout check
                if (Date.now() - startTime > maxTime) {
                    this.stopPaymentPolling();
                    this.showPaymentTimeout();
                }
            } catch (error) {
                console.warn('⚠️ Erro no polling:', error);
            }
        }, 5000); // Check every 5 seconds
    }

    /**
     * Stop payment polling
     */
    stopPaymentPolling() {
        if (this.paymentPollingInterval) {
            clearInterval(this.paymentPollingInterval);
            this.paymentPollingInterval = null;
        }
    }

    /**
     * Show payment success screen
     */
    showPaymentSuccess(student) {
        const content = this.container.querySelector('.reactivation-content');
        if (!content) return;

        content.innerHTML = `
            <div class="payment-success-screen">
                <div class="success-animation">
                    <div class="success-checkmark">✅</div>
                </div>
                <h3>Pagamento Confirmado!</h3>
                <p>Seu plano foi reativado com sucesso!</p>
                <p class="success-message">Bem-vindo de volta, <strong>${student.user?.firstName}</strong>! 🥋</p>
                
                <div class="success-actions">
                    <button id="btn-checkin-now" class="btn-confirm">
                        <span class="icon">✓</span>
                        <span class="text">Fazer Check-in Agora</span>
                    </button>
                </div>
            </div>
        `;

        content.querySelector('#btn-checkin-now')?.addEventListener('click', () => {
            // Re-render with updated subscription status
            student.subscriptions = [{ status: 'ACTIVE' }];
            this.render(student, []);
        });

        // Auto-proceed after 5 seconds
        setTimeout(() => {
            student.subscriptions = [{ status: 'ACTIVE' }];
            this.render(student, []);
        }, 5000);
    }

    /**
     * Show payment timeout screen
     */
    showPaymentTimeout() {
        const content = this.container.querySelector('.reactivation-content');
        if (!content) return;

        content.innerHTML = `
            <div class="payment-timeout-screen">
                <div class="timeout-icon">⏰</div>
                <h3>Tempo Esgotado</h3>
                <p>Não detectamos o pagamento ainda.</p>
                <p class="timeout-help">Se você já pagou, aguarde alguns minutos e tente novamente.</p>
                
                <div class="timeout-actions">
                    <button id="btn-retry" class="btn-reactivate">
                        <span class="icon">🔄</span>
                        <span class="text">Verificar Novamente</span>
                    </button>
                    <button id="btn-cancel" class="btn-back">
                        <span class="icon">←</span>
                        <span class="text">Voltar</span>
                    </button>
                </div>
            </div>
        `;

        content.querySelector('#btn-retry')?.addEventListener('click', () => {
            if (this.currentStudent) {
                this.showPlanSelection(this.currentStudent);
            }
        });

        content.querySelector('#btn-cancel')?.addEventListener('click', () => {
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
            <div class="checkin-dashboard-v2 fade-in">
                <!-- Header with Student Info + Matricula -->
                <div class="dashboard-header">
                    <div class="student-photo-large">
                        ${student.user?.avatarUrl
                ? `<img src="${student.user.avatarUrl}" alt="${student.user.firstName}" />`
                : `<div class="avatar-placeholder" aria-hidden="true">${(student.user?.firstName || '?')[0]}</div>`
            }
                    </div>
                    <div class="student-info-large">
                        <h1 class="student-name-huge">${student.user?.firstName || ''} ${student.user?.lastName || ''}</h1>
                        <div class="student-meta-row">
                            <span class="student-id-badge" aria-label="Student ID">📋 ${student.registrationNumber ? `Matrícula: ${student.registrationNumber}` : `ID: ${student.id.substring(0, 8)}`}</span>
                            ${student.user?.phone ? `<span class="student-phone" aria-label="Phone number">📞 ${student.user.phone}</span>` : ''}
                        </div>
                    </div>
                    <button id="reject-btn" class="btn-cancel-top" aria-label="Cancel check-in">
                        <span class="icon" aria-hidden="true">✖</span>
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
                                <div class="progress-bar" style="width: ${progressData.percentage}%" role="progressbar" aria-valuenow="${progressData.percentage}" aria-valuemin="0" aria-valuemax="100" aria-label="Course progress">
                                    <span class="progress-label" aria-hidden="true">${progressData.percentage}%</span>
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
                            <div class="classes-grid" style="display: flex; flex-direction: column; gap: 1rem; max-width: 600px; margin: 0 auto;">
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
                                        <button class="btn-checkin-turma" data-turma-id="${turma.id}" data-lesson-id="${turma.lessonId}" data-course-id="${turma.courseId}" aria-label="Check-in to ${turma.name}">
                                            <span class="icon" aria-hidden="true">✅</span>
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
                                ${turmasData.upcoming.slice(0, 10).map(turma => `
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
        this.startTimeout();
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
            <div class="checkin-dashboard fade-in">
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
        this.startTimeout();
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

    /**
     * Start auto-close timer
     */
    startTimeout() {
        this.stopTimeout();

        // Add visual progress bar if dashboard exists
        const dashboard = this.container.querySelector('.checkin-dashboard-v2, .checkin-dashboard');
        if (dashboard) {
            // Remove existing if any
            const existing = dashboard.querySelector('.timeout-progress-bar');
            if (existing) existing.remove();

            const progressBar = document.createElement('div');
            progressBar.className = 'timeout-progress-bar';
            progressBar.innerHTML = '<div class="timeout-progress-fill"></div>';
            dashboard.appendChild(progressBar);

            // Animate width
            setTimeout(() => {
                const fill = progressBar.querySelector('.timeout-progress-fill');
                if (fill) {
                    fill.style.transition = `width ${this.TIMEOUT_MS}ms linear`;
                    fill.style.width = '0%';
                }
            }, 100);
        }

        this.timeoutTimer = setTimeout(() => {
            console.log('⏱️ [ConfirmationView] Timeout - auto rejecting');
            this.onReject();
        }, this.TIMEOUT_MS);
    }

    /**
     * Stop auto-close timer
     */
    stopTimeout() {
        if (this.timeoutTimer) {
            clearTimeout(this.timeoutTimer);
            this.timeoutTimer = null;
        }
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
