/**
 * Financial Tab Component
 * Handles student subscription and financial information
 * Enhanced with bundle data consumption and cache management
 */

export class FinancialTab {
    constructor(editorController) {
        this.editor = editorController;
        this.subscriptionData = null;
        this.availablePlans = [];
        this.financialHistory = [];
        this.bundleData = null; // Store bundle data
        
        this.init();
    }

    init() {
        console.log('💰 Inicializando aba Financeira...');
    }

    // ==============================================
    // BUNDLE DATA CONSUMPTION
    // ==============================================

    /**
     * Load data from bundle (preferred method)
     * This method consumes pre-fetched data from StudentDataService
     */
    loadBundleData(bundle) {
        console.log('💰 [CACHE] Carregando dados financeiros do bundle...');
        
        this.bundleData = bundle;
        this.subscriptionData = bundle.subscription || null;
        
        // Normalize billing plans - ensure each plan has features as array
        this.availablePlans = Array.isArray(bundle.billingPlans) ? 
            bundle.billingPlans.map(plan => ({
                ...plan,
                features: Array.isArray(plan.features) ? plan.features : []
            })) : [];
            
        this.financialHistory = bundle.financial || []; // Ensure it's always an array
        
        // Ensure financialHistory is an array
        if (!Array.isArray(this.financialHistory)) {
            console.warn('💰 financialHistory não é array, convertendo:', this.financialHistory);
            this.financialHistory = [];
        }
        
        // Re-render if already visible
        if (this.isVisible()) {
            this.refreshDisplay();
        }
    }

    /**
     * Legacy data loading method (fallback)
     * Used when bundle data is not available
     */
    loadData(studentData) {
        console.log('💰 [FALLBACK] Carregando dados financeiros via API individual...');
        
        // This will trigger individual API calls (old behavior)
        this.loadFinancialDataLegacy(studentData);
    }

    /**
     * Legacy method for individual API calls
     */
    async loadFinancialDataLegacy(studentData) {
        try {
            const dataService = this.editor.getDataService();
            
            // Use individual cached methods
            this.subscriptionData = await dataService.getSubscription(studentData.id);
            this.availablePlans = await dataService.getBillingPlans();
            this.financialHistory = await dataService.getFinancialSummary(studentData.id);
            
            if (this.isVisible()) {
                this.refreshDisplay();
            }
            
        } catch (error) {
            console.error('❌ Erro ao carregar dados financeiros:', error);
            try { window.app?.handleError?.(error, 'Students:financialModern:load'); } catch (_) {}
        }
    }

    /**
     * Handle refreshed data from selective updates
     */
    updateWithRefreshedData(refreshedData) {
        console.log('💰 [REFRESH] Atualizando dados financeiros...');
        
        if (refreshedData.subscription) {
            this.subscriptionData = refreshedData.subscription;
        }
        
        if (refreshedData.financial) {
            this.financialHistory = refreshedData.financial;
        }
        
        // Re-render if visible
        if (this.isVisible()) {
            this.refreshDisplay();
        }
    }

    // ==============================================
    // UI MANAGEMENT
    // ==============================================

    /**
     * Check if tab is currently visible
     */
    isVisible() {
        const container = document.querySelector('#financial-content');
        if (!container) return false;
        // Consider visible when it's the active tab-pane
        return container.classList.contains('active');
    }

    /**
     * Refresh the display with current data
     */
    refreshDisplay() {
        const container = document.querySelector('#financial-content');
        if (!container) return;
        this.render(container);
    }

    /**
     * Trigger selective refresh of financial data
     */
    async refreshFinancialData() {
        try {
            await this.editor.refreshStudentData(['subscription', 'financial']);
        } catch (error) {
            console.error('❌ Erro ao atualizar dados financeiros:', error);
            this.showBanner('Erro ao atualizar dados financeiros', 'error');
            try { window.app?.handleError?.(error, 'Students:financialModern:refresh'); } catch (_) {}
        }
    }

    /**
     * Render financial tab content
     */
    render(container) {
        const html = `
            <div class="financial-tab-content">
                <!-- Current Subscription Section -->
                <div class="form-section">
                    <h3 class="section-title">
                        <span class="section-icon">💳</span>
                        Assinatura Atual
                    </h3>
                    
                    <div id="current-subscription-container">
                        ${this.renderCurrentSubscription()}
                    </div>
                </div>

                <!-- Available Plans Section -->
                <div class="form-section">
                    <h3 class="section-title">
                        <span class="section-icon">📋</span>
                        Planos Disponíveis
                    </h3>
                    
                    <div class="plans-filter">
                        <select id="plans-filter" class="form-control">
                            <option value="all">Todos os planos</option>
                            <option value="MONTHLY">Mensais</option>
                            <option value="QUARTERLY">Trimestrais</option>
                            <option value="YEARLY">Anuais</option>
                        </select>
                    </div>
                    
                    <div id="available-plans-container" class="plans-grid">
                        ${this.renderAvailablePlans()}
                    </div>
                </div>

                <!-- Payment History Section -->
                <div class="form-section">
                    <h3 class="section-title">
                        <span class="section-icon">📊</span>
                        Histórico de Pagamentos
                    </h3>
                    
                    <div class="history-filters">
                        <select id="history-period" class="form-control">
                            <option value="all">Todos os períodos</option>
                            <option value="last-month">Último mês</option>
                            <option value="last-3-months">Últimos 3 meses</option>
                            <option value="last-year">Último ano</option>
                        </select>
                        
                        <select id="history-status" class="form-control">
                            <option value="all">Todos os status</option>
                            <option value="PAID">Pagos</option>
                            <option value="PENDING">Pendentes</option>
                            <option value="OVERDUE">Vencidos</option>
                            <option value="CANCELLED">Cancelados</option>
                        </select>
                    </div>
                    
                    <div id="payment-history-container">
                        ${this.renderPaymentHistory()}
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
        this.bindEvents(container);
        // Load data only if not available from bundle yet
        if (!this.subscriptionData && this.editor?.studentId) {
            this.loadFinancialData();
        }
    }

    /**
     * Render current subscription
     */
    renderCurrentSubscription() {
        if (!this.subscriptionData) {
            return `
                <div class="no-subscription">
                    <div class="no-subscription-icon">💳</div>
                    <h4>Nenhuma assinatura ativa</h4>
                    <p>Este estudante não possui uma assinatura ativa no momento.</p>
                    <button onclick="window.createNewSubscription()" class="btn-form btn-primary-form" aria-label="Criar nova assinatura">
                        <span class="btn-icon">➕</span><span class="btn-label">Criar Nova Assinatura</span>
                    </button>
                </div>
            `;
        }

        const plan = this.subscriptionData.plan || {};
        const status = this.subscriptionData.status || 'UNKNOWN';
        const statusClass = this.getStatusClass(status);
        const nextDueDate = this.subscriptionData.nextDueDate ? 
            new Date(this.subscriptionData.nextDueDate).toLocaleDateString('pt-BR') : 
            'Não definido';

        return `
            <div class="current-subscription">
                <div class="subscription-header">
                    <div class="subscription-info">
                        <h4 class="plan-name">${plan.name || 'Plano Desconhecido'}</h4>
                        <div class="plan-details">
                            <span class="plan-price">R$ ${plan.price || '0,00'}</span>
                            <span class="plan-period">/${this.getBillingPeriodLabel(plan.billingType)}</span>
                        </div>
                    </div>
                    <div class="subscription-status">
                        <span class="status-badge ${statusClass}">${this.getStatusLabel(status)}</span>
                    </div>
                </div>
                
                <div class="subscription-details">
                    <div class="detail-item">
                        <span class="detail-label">Próximo vencimento:</span>
                        <span class="detail-value">${nextDueDate}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Data de início:</span>
                        <span class="detail-value">${this.subscriptionData.startDate ? 
                            new Date(this.subscriptionData.startDate).toLocaleDateString('pt-BR') : 
                            'Não definido'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Status do pagamento:</span>
                        <span class="detail-value payment-status ${this.getPaymentStatusClass(this.subscriptionData.paymentStatus)}">
                            ${this.getPaymentStatusLabel(this.subscriptionData.paymentStatus)}
                        </span>
                    </div>
                </div>
                
                <div class="subscription-actions">
                    <button onclick="window.editSubscription()" class="btn-form btn-secondary-form" aria-label="Editar assinatura">
                        <span class="btn-icon">✏️</span><span class="btn-label">Editar</span>
                    </button>
                    <button onclick="window.changeSubscriptionPlan()" class="btn-form btn-primary-form" aria-label="Alterar plano">
                        <span class="btn-icon">🔄</span><span class="btn-label">Alterar Plano</span>
                    </button>
                    <button onclick="window.cancelSubscription()" class="btn-form btn-danger-form" aria-label="Cancelar assinatura">
                        <span class="btn-icon">❌</span><span class="btn-label">Cancelar</span>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render available plans
     */
    renderAvailablePlans() {
        // Ensure availablePlans is always an array
        const plans = Array.isArray(this.availablePlans) ? this.availablePlans : [];
        
        if (!plans || plans.length === 0) {
            return `
                <div class="no-plans">
                    <div class="no-plans-icon">📋</div>
                    <p>Nenhum plano disponível no momento.</p>
                </div>
            `;
        }

        return plans.map(plan => `
            <div class="plan-card ${this.isCurrentPlan(plan.id) ? 'current-plan' : ''}"
                 data-plan-id="${plan.id}">
                <div class="plan-header">
                    <h4 class="plan-name">${plan.name}</h4>
                    <div class="plan-price">
                        <span class="price-value">R$ ${plan.price}</span>
                        <span class="price-period">/${this.getBillingPeriodLabel(plan.billingType)}</span>
                    </div>
                </div>
                
                <div class="plan-features">
                    ${(plan.features && Array.isArray(plan.features)) ? plan.features.map(feature => `
                        <div class="feature-item">
                            <span class="feature-icon">✓</span>
                            <span class="feature-text">${feature}</span>
                        </div>
                    `).join('') : ''}
                </div>
                
                <div class="plan-actions">
                    ${this.isCurrentPlan(plan.id) ? 
                        `<span class="current-plan-badge">Plano Atual</span>` :
                        `<button onclick=\"window.selectPlan('${plan.id}')\" class=\"btn-form btn-primary-form\" style=\"width:100%\" aria-label=\"Selecionar plano\">\n                            <span class=\"btn-icon\">✔️</span><span class=\"btn-label\">Selecionar Plano</span>\n                        </button>`
                    }
                </div>
            </div>
        `).join('');
    }

    /**
     * Render payment history
     */
    renderPaymentHistory() {
        // Ensure financialHistory is always an array
        const history = Array.isArray(this.financialHistory) ? this.financialHistory : [];
        
        if (!history || history.length === 0) {
            return `
                <div class="no-history">
                    <div class="no-history-icon">📊</div>
                    <p>Nenhum histórico de pagamentos encontrado.</p>
                </div>
            `;
        }

        return `
            <div class="history-table-container">
                <table class="history-table">
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Descrição</th>
                            <th>Valor</th>
                            <th>Status</th>
                            <th>Método</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${history.map(payment => {
                            const date = payment.dueDate || payment.createdAt || payment.date;
                            const displayDate = date ? new Date(date).toLocaleDateString('pt-BR') : '-';
                            const amount = (typeof payment.amount === 'number') ? payment.amount : Number(payment.amount?.value || payment.amount) || 0;
                            return `
                            <tr>
                                <td>${displayDate}</td>
                                <td>${payment.description || 'Pagamento de mensalidade'}</td>
                                <td class="amount">R$ ${amount}</td>
                                <td>
                                    <span class="status-badge ${this.getPaymentStatusClass(String(payment.status).toUpperCase())}">
                                        ${this.getPaymentStatusLabel(String(payment.status).toUpperCase())}
                                    </span>
                                </td>
                                <td>${payment.paymentMethod || 'N/A'}</td>
                                <td>
                                    <button onclick="window.viewPaymentDetails('${payment.id}')" 
                                            class="btn btn-sm btn-secondary"
                                            title="Ver detalhes">
                                        👁️
                                    </button>
                                </td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * Load financial data
     */
    async loadFinancialData() {
        if (!this.editor.studentId) return;

        try {
            // Load subscription data
            this.subscriptionData = await this.editor.service.getStudentSubscription(this.editor.studentId);
            
            // Load available plans
            this.availablePlans = await this.editor.service.getAvailablePlans();
            
            // Load financial history
            this.financialHistory = await this.editor.service.getStudentFinancialHistory(this.editor.studentId);
            
            // Re-render sections
            this.updateCurrentSubscription();
            this.updateAvailablePlans();
            this.updatePaymentHistory();
            
        } catch (error) {
            console.error('❌ Erro ao carregar dados financeiros:', error);
        }
    }

    /**
     * Load data from editor
     */
    loadData(studentData) {
        this.studentData = studentData;
        this.subscriptionData = studentData.subscriptions?.find(s => s.status === 'ACTIVE') || null;
        this.loadFinancialData();
    }

    /**
     * Update current subscription display
     */
    updateCurrentSubscription() {
        const container = document.getElementById('current-subscription-container');
        if (container) {
            container.innerHTML = this.renderCurrentSubscription();
        }
    }

    /**
     * Update available plans display
     */
    updateAvailablePlans() {
        const container = document.getElementById('available-plans-container');
        if (container) {
            container.innerHTML = this.renderAvailablePlans();
        }
    }

    /**
     * Update payment history display
     */
    updatePaymentHistory() {
        const container = document.getElementById('payment-history-container');
        if (container) {
            container.innerHTML = this.renderPaymentHistory();
        }
    }

    /**
     * Helper methods
     */
    isCurrentPlan(planId) {
        return this.subscriptionData?.plan?.id === planId;
    }

    getStatusClass(status) {
        const statusClasses = {
            'ACTIVE': 'status-active',
            'INACTIVE': 'status-inactive',
            'CANCELLED': 'status-cancelled',
            'EXPIRED': 'status-expired'
        };
        return statusClasses[status] || 'status-unknown';
    }

    getStatusLabel(status) {
        const statusLabels = {
            'ACTIVE': 'Ativo',
            'INACTIVE': 'Inativo',
            'CANCELLED': 'Cancelado',
            'EXPIRED': 'Expirado'
        };
        return statusLabels[status] || 'Desconhecido';
    }

    getPaymentStatusClass(status) {
        const statusClasses = {
            'PAID': 'payment-paid',
            'PENDING': 'payment-pending',
            'OVERDUE': 'payment-overdue',
            'CANCELLED': 'payment-cancelled'
        };
        return statusClasses[status] || 'payment-unknown';
    }

    getPaymentStatusLabel(status) {
        const statusLabels = {
            'PAID': 'Pago',
            'PENDING': 'Pendente',
            'OVERDUE': 'Vencido',
            'CANCELLED': 'Cancelado'
        };
        return statusLabels[status] || 'Desconhecido';
    }

    getBillingPeriodLabel(billingType) {
        const periodLabels = {
            'MONTHLY': 'mês',
            'QUARTERLY': 'trimestre',
            'YEARLY': 'ano'
        };
        return periodLabels[billingType] || 'período';
    }

    /**
     * Bind events
     */
    bindEvents(container) {
        // Make functions available globally
        window.createNewSubscription = () => this.createNewSubscription();
        window.editSubscription = () => this.editSubscription();
        window.changeSubscriptionPlan = () => this.changeSubscriptionPlan();
        window.cancelSubscription = () => this.cancelSubscription();
        window.selectPlan = (planId) => this.selectPlan(planId);
        window.viewPaymentDetails = (paymentId) => this.viewPaymentDetails(paymentId);

        // Filter events
        const plansFilter = container.querySelector('#plans-filter');
        if (plansFilter) {
            plansFilter.addEventListener('change', (e) => {
                this.filterPlans(e.target.value);
            });
        }

        const historyPeriod = container.querySelector('#history-period');
        const historyStatus = container.querySelector('#history-status');
        
        if (historyPeriod) {
            historyPeriod.addEventListener('change', () => this.filterHistory());
        }
        
        if (historyStatus) {
            historyStatus.addEventListener('change', () => this.filterHistory());
        }
    }

    /**
     * Action handlers
     */
    async createNewSubscription() {
        console.log('➕ Criando nova assinatura...');
        // Implementation for creating new subscription
    }

    async editSubscription() {
        console.log('✏️ Editando assinatura...');
        
        if (!this.subscriptionData?.id) {
            alert('Nenhuma assinatura ativa encontrada para editar.');
            return;
        }

        try {
            const confirmed = confirm('Deseja editar a assinatura atual?');
            if (confirmed) {
                console.log('✅ Editando assinatura:', this.subscriptionData.id);
                alert('Funcionalidade de edição será implementada em breve.');
            }
        } catch (error) {
            console.error('❌ Erro ao editar assinatura:', error);
            alert('Erro ao editar assinatura. Tente novamente.');
            try { window.app?.handleError?.(error, 'Students:financialModern:edit'); } catch (_) {}
        }
    }

    async cancelSubscription() {
        if (!this.subscriptionData?.id) {
            this.showBanner('Nenhuma assinatura ativa encontrada para cancelar.', 'warning');
            return;
        }

        const confirmed = confirm('Tem certeza que deseja cancelar a assinatura? Esta ação não pode ser desfeita.');
        if (!confirmed) return;

        this.setLoading(true, 'Cancelando assinatura...');
        let success = false;
        let errorMsg = '';
        try {
            const subId = String(this.subscriptionData.id).trim();
            // 1) Tentar atualização (PUT) para CANCELLED — evita validações severas do DELETE
            await this.editor.service.api.put(`/api/financial/subscriptions/${encodeURIComponent(subId)}`, {
                status: 'CANCELLED',
                endDate: new Date().toISOString()
            });
            success = true;
        } catch (putErr) {
            console.error('❌ Erro ao atualizar assinatura para CANCELLED:', putErr);
            try { window.app?.handleError?.(putErr, 'Students:financialModern:cancel:put'); } catch (_) {}
            // 2) Fallback: tentar DELETE direto por ID
            try {
                const subId = String(this.subscriptionData.id).trim();
                await this.editor.service.api.delete(`/api/financial/subscriptions/${encodeURIComponent(subId)}`);
                success = true;
            } catch (delErr) {
                console.error('❌ Erro ao cancelar por ID:', delErr);
                try { window.app?.handleError?.(delErr, 'Students:financialModern:cancel:delete'); } catch (_) {}
                // 3) Fallback final: cancelar por studentId (alias backend)
                try {
                    await this.editor.service.api.delete(`/api/students/${this.editor.studentId}/subscription`);
                    success = true;
                } catch (aliasErr) {
                    console.error('❌ Fallback de cancelamento por studentId falhou:', aliasErr);
                    try { window.app?.handleError?.(aliasErr, 'Students:financialModern:cancel:alias'); } catch (_) {}
                    const status = aliasErr?.status || delErr?.status || putErr?.status;
                    if (status === 404) errorMsg = 'Assinatura não encontrada.';
                    else if (status === 400) errorMsg = 'Dados inválidos (400). Verifique o ID e tente novamente.';
                    else errorMsg = 'Erro ao cancelar assinatura. Tente novamente.';
                }
            }
        }

        try {
            if (success) {
                await this.loadFinancialData();
                this.showBanner('Assinatura cancelada com sucesso.', 'success');
            } else {
                this.showBanner(errorMsg || 'Erro ao cancelar assinatura. Tente novamente.', 'error');
            }
        } finally {
            this.setLoading(false);
        }
    }

    async changeSubscriptionPlan() {
        console.log('🔄 Alterando plano...');
        
        if (!this.subscriptionData?.id) {
            alert('Nenhuma assinatura ativa encontrada para alterar o plano.');
            return;
        }

        try {
            const confirmed = confirm('Deseja alterar o plano da assinatura atual?');
            if (confirmed) {
                console.log('✅ Alterando plano da assinatura:', this.subscriptionData.id);
                alert('Funcionalidade de alteração de plano será implementada em breve.');
            }
        } catch (error) {
            console.error('❌ Erro ao alterar plano:', error);
            alert('Erro ao alterar plano. Tente novamente.');
        }
    }

    async selectPlan(planId) {
        console.log('📋 Selecionando plano:', planId);
        
        try {
            const confirmed = confirm('Deseja selecionar este plano?');
            if (confirmed) {
                // Criar nova assinatura para o aluno
                await this.editor.service.api.post('/api/financial/subscriptions', {
                    studentId: this.editor.studentId,
                    planId
                });
                await this.loadFinancialData();
                alert('Plano selecionado e assinatura criada com sucesso.');
            }
        } catch (error) {
            console.error('❌ Erro ao selecionar plano:', error);
            alert('Erro ao selecionar plano. Tente novamente.');
            try { window.app?.handleError?.(error, 'Students:financialModern:selectPlan'); } catch (_) {}
        }
    }

    viewPaymentDetails(paymentId) {
        console.log('👁️ Visualizando detalhes do pagamento:', paymentId);
        // Implementation for viewing payment details
    }

    /**
     * Filter methods
     */
    filterPlans(billingType) {
        const planCards = document.querySelectorAll('.plan-card');
        planCards.forEach(card => {
            const planId = card.dataset.planId;
            const plan = this.availablePlans.find(p => p.id === planId);
            
            if (billingType === 'all' || plan?.billingType === billingType) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    filterHistory() {
        const periodFilter = document.getElementById('history-period')?.value;
        const statusFilter = document.getElementById('history-status')?.value;
        
        // Apply filters and re-render history
        console.log('Filtering history:', { periodFilter, statusFilter });
        this.updatePaymentHistory();
    }

    /**
     * Get tab data
     */
    getData() {
        return {
            subscriptionData: this.subscriptionData,
            financialHistory: this.financialHistory
        };
    }

    /**
     * Validate tab
     */
    async validate() {
        // Financial tab typically doesn't need validation
        // unless there are editable fields
        return [];
    }

    /**
     * Cleanup
     */
    destroy() {
        // Remove global handlers
        delete window.createNewSubscription;
        delete window.editSubscription;
        delete window.changeSubscriptionPlan;
        delete window.cancelSubscription;
        delete window.selectPlan;
        delete window.viewPaymentDetails;
        
        console.log('🧹 Financial Tab destruído');
    }

    /**
     * Exibe banner de feedback para o usuário
     */
    showBanner(message, type = 'info') {
        let banner = document.getElementById('financial-feedback-banner');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'financial-feedback-banner';
            banner.className = 'feedback-banner';
            document.body.appendChild(banner);
        }
        banner.textContent = message;
        banner.className = `feedback-banner ${type}`;
        banner.style.display = 'block';
        setTimeout(() => { banner.style.display = 'none'; }, 4000);
    }

    /**
     * Exibe spinner/estado de loading nos botões
     */
    setLoading(isLoading, text = '') {
        const cancelBtn = document.querySelector('.subscription-actions .btn-danger, .subscription-actions .btn-danger-form');
        if (cancelBtn) {
            cancelBtn.disabled = isLoading;
            cancelBtn.textContent = isLoading ? `⏳ ${text}` : '❌ Cancelar';
        }
    }
}
