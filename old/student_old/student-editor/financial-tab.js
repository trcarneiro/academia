/**
 * Student Editor - Financial Tab Component
 * Gerencia todas as funcionalidades financeiras e de assinaturas
 */

export class FinancialTab {
    constructor(mainController) {
        this.main = mainController;
        this.subscriptionData = null;
        this.availablePlans = [];
        this.financialHistory = [];
        
        this.init();
    }

    init() {
        console.log('💳 Inicializando aba Financeira...');
        this.setupElements();
        this.setupEvents();
        // Carregar planos e dados do aluno (se já houver ID)
        this.loadAvailablePlans();
        if (this.main.currentStudentId) {
            this.refreshStudentFinancialData();
        }
    }

    setupElements() {
        // Elementos da assinatura atual
        this.elements = {
            currentPlanStatus: document.querySelector('.status-badge'),
            planName: document.getElementById('current-plan-name'),
            planPrice: document.getElementById('current-plan-price'),
            nextDueDate: document.getElementById('current-plan-due'),
            paymentStatus: document.getElementById('current-payment-status'),
            noSubscriptionState: document.getElementById('noSubscriptionState'),
            plansGrid: document.getElementById('available-plans-grid'),
            historyTableBody: document.querySelector('#payment-history-table tbody')
        };
    }

    setupEvents() {
        // Eventos globais da aba financeira
        window.editCurrentSubscription = () => this.editSubscription();
        window.changeSubscriptionPlan = () => this.changePlan();
        window.cancelSubscription = () => this.cancelSubscription();
        window.createNewSubscription = () => this.createNewSubscription();
        window.selectPlan = (planId) => this.selectPlan(planId);
        
        // Configurar eventos dos botões
        this.setupButtonEvents();
    }

    setupButtonEvents() {
        // Botão de editar assinatura
        const editBtn = document.getElementById('edit-subscription-btn');
        if (editBtn) {
            editBtn.onclick = () => this.editSubscription();
        }
        
        // Botão de cancelar assinatura
        const cancelBtn = document.getElementById('cancel-subscription-btn');
        if (cancelBtn) {
            cancelBtn.onclick = () => this.cancelSubscription();
        }
    }

    async loadAvailablePlans() {
        try {
            console.log('📋 Carregando planos disponíveis...');
            // Usar API real
            const resp = await fetch('/api/billing-plans');
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const payload = await resp.json();
            const plans = payload && payload.data ? payload.data : payload;

            // Normalizar campos esperados pelo render
            this.availablePlans = (plans || []).filter(p => p.isActive !== false).map(p => ({
                id: p.id,
                name: p.name,
                price: typeof p.price === 'number' ? p.price : (p.price?.toNumber ? p.price.toNumber() : Number(p.price) || 0),
                description: p.description || '',
                features: Array.isArray(p.features) ? p.features : [],
            }));
            
            this.renderAvailablePlans();
            console.log('✅ Planos carregados:', this.availablePlans.length);
            
        } catch (error) {
            console.error('❌ Erro ao carregar planos:', error);
            // Fallback: manter grid vazio, sem mock
            this.availablePlans = [];
            this.renderAvailablePlans();
        }
    }

    async refreshStudentFinancialData() {
        const studentId = this.main.currentStudentId;
        if (!studentId) return;
        try {
            // Carregar assinatura atual
            const subResp = await fetch(`/api/students/${studentId}/subscription`);
            const subPayload = subResp.ok ? await subResp.json() : null;
            const subscription = subPayload && subPayload.data !== undefined ? subPayload.data : (subPayload || null);

            // Carregar resumo financeiro
            const finResp = await fetch(`/api/students/${studentId}/financial-summary`);
            const finPayload = finResp.ok ? await finResp.json() : null;
            const summary = finPayload && finPayload.data !== undefined ? finPayload.data : (finPayload || {});

            // Normalizar e armazenar
            this.subscriptionData = subscription ? this.normalizeSubscription(subscription) : null;
            this.financialHistory = Array.isArray(summary?.payments) ? summary.payments : [];

            // Atualizar UI
            if (this.subscriptionData) {
                this.hideNoSubscriptionState();
                this.renderCurrentSubscription();
            } else {
                this.showNoSubscriptionState();
            }
            this.renderAvailablePlans();
            this.renderPaymentHistory();
        } catch (err) {
            console.error('❌ Erro ao carregar dados financeiros do aluno:', err);
        }
    }

    normalizeSubscription(sub) {
        // Backend students.ts returns { plan: {...}, status, nextBillingDate, currentPrice, ... }
        const planPrice = sub.currentPrice ?? sub.plan?.price ?? 0;
        const priceNum = typeof planPrice === 'number' ? planPrice : (planPrice?.toNumber ? planPrice.toNumber() : Number(planPrice) || 0);
        const nextDue = sub.nextBillingDate || sub.nextDueDate || null;
        const status = (sub.status || '').toString().toLowerCase();

        return {
            id: sub.id,
            planId: sub.planId || sub.plan?.id,
            planName: sub.plan?.name || sub.planName,
            monthlyPrice: priceNum,
            status,
            paymentStatus: (sub.paymentStatus || 'unknown').toString().toLowerCase(),
            nextDueDate: nextDue ? new Date(nextDue) : null,
            createdAt: sub.startDate || sub.createdAt || null
        };
    }

    renderAvailablePlans() {
        const plansGrid = this.elements.plansGrid || document.getElementById('available-plans-grid');
        if (!plansGrid) {
            console.error('❌ Elemento plans-grid não encontrado');
            return;
        }

        plansGrid.innerHTML = '';

        this.availablePlans.forEach(plan => {
            const planCard = document.createElement('div');
            planCard.className = 'plan-card';
            planCard.innerHTML = `
                <div class="plan-header">
                    <h6>${plan.name}</h6>
                    <span class="plan-price">R$ ${plan.price.toFixed(2).replace('.', ',')}</span>
                </div>
                <p class="plan-description">${plan.description}</p>
                <div class="plan-features" style="margin: 1rem 0; font-size: 0.75rem; color: #94A3B8;">
                    ${plan.features.map(feature => `• ${feature}`).join('<br>')}
                </div>
                <button onclick="selectPlan('${plan.id}')" class="plan-select-btn">
                    ${this.subscriptionData && this.subscriptionData.planId === plan.id ? '✅ Atual' : 'Selecionar'}
                </button>
            `;
            plansGrid.appendChild(planCard);
        });
    }

    onDataLoaded(studentData) {
        console.log('📥 Carregando dados financeiros para:', studentData);
        // Quando os dados completos do aluno chegam do main, atualizamos usando as APIs também
        this.refreshStudentFinancialData();
    }

    renderCurrentSubscription() {
        console.log('🔄 Renderizando assinatura atual...', this.subscriptionData);
        
        if (!this.subscriptionData) {
            console.log('⚠️ Nenhuma assinatura para renderizar');
            return;
        }
        
        // Verificar se os elementos existem
        if (!this.elements.planName || !this.elements.planPrice) {
            console.error('❌ Elementos da assinatura não encontrados, tentando re-configurar...');
            this.setupElements();
        }

        const plan = this.availablePlans.find(p => p.id === this.subscriptionData.planId);
        
        // Atualizar elementos com verificação de existência
        if (this.elements.planName) {
            this.elements.planName.textContent = plan ? plan.name : (this.subscriptionData.planName || 'Plano não encontrado');
        }
        
        if (this.elements.planPrice) {
            this.elements.planPrice.textContent = `R$ ${(this.subscriptionData.monthlyPrice || 0).toFixed(2).replace('.', ',')}`;
        }
        
        // Calcular próximo vencimento
        if (this.elements.nextDueDate) {
            if (this.subscriptionData.nextDueDate) {
                const dueDate = new Date(this.subscriptionData.nextDueDate);
                this.elements.nextDueDate.textContent = dueDate.toLocaleDateString('pt-BR');
            } else {
                this.elements.nextDueDate.textContent = '--/--/----';
            }
        }
        
        // Status do pagamento
        this.updatePaymentStatus();
        
        // Status da assinatura
        this.updateSubscriptionStatus();
        
        console.log('✅ Assinatura renderizada com sucesso');
    }

    updatePaymentStatus() {
        if (!this.subscriptionData || !this.elements.paymentStatus) return;

        const status = this.subscriptionData.paymentStatus || 'unknown';
        const statusMap = {
            'paid': { text: 'Em dia', color: '#10B981' },
            'pending': { text: 'Pendente', color: '#F59E0B' },
            'overdue': { text: 'Atrasado', color: '#EF4444' },
            'unknown': { text: 'Indefinido', color: '#6B7280' }
        };

        const statusInfo = statusMap[status] || statusMap['unknown'];
        this.elements.paymentStatus.textContent = statusInfo.text;
        this.elements.paymentStatus.style.color = statusInfo.color;
    }

    updateSubscriptionStatus() {
        if (!this.subscriptionData || !this.elements.currentPlanStatus) return;

        const isActive = this.subscriptionData.status === 'active' || this.subscriptionData.status === 'ACTIVE';
        
        this.elements.currentPlanStatus.textContent = isActive ? 'ATIVO' : 'INATIVO';
        this.elements.currentPlanStatus.className = `status-badge ${isActive ? 'status-active' : 'status-inactive'}`;
        
        if (!isActive) {
            this.elements.currentPlanStatus.style.background = '#EF4444';
        }
    }

    showNoSubscriptionState() {
        console.log('📭 Mostrando estado de "nenhuma assinatura"');
        
        const noSubscriptionState = this.elements.noSubscriptionState || document.getElementById('noSubscriptionState');
        if (noSubscriptionState) {
            noSubscriptionState.style.display = 'block';
        }
        
        // Ocultar card de assinatura atual
        const subscriptionCard = document.querySelector('.subscription-card');
        if (subscriptionCard) {
            subscriptionCard.style.display = 'none';
        }
    }

    hideNoSubscriptionState() {
        console.log('💳 Ocultando estado de "nenhuma assinatura"');
        
        const noSubscriptionState = this.elements.noSubscriptionState || document.getElementById('noSubscriptionState');
        if (noSubscriptionState) {
            noSubscriptionState.style.display = 'none';
        }
        
        // Mostrar card de assinatura atual
        const subscriptionCard = document.querySelector('.subscription-card');
        if (subscriptionCard) {
            subscriptionCard.style.display = 'block';
        }
    }

    onTabActivated() {
        console.log('💳 Aba financeira ativada');
        
        // Garantir que os elementos estão disponíveis
        this.setupElements();
        
        // Atualizar dados mais recentes
        this.refreshStudentFinancialData();
        
        // Re-renderizar planos para mostrar o atual
        console.log('📋 Re-renderizando planos disponíveis...');
        this.renderAvailablePlans();
        
        // Re-configurar eventos dos botões se necessário
        this.setupButtonEvents();
    }

    async collectData() {
        console.log('📊 Coletando dados financeiros...');
        
        // Para novos estudantes, não enviamos dados financeiros na criação inicial
        if (this.main.mode === 'create') {
            console.log('ℹ️ Modo CREATE: Não enviando dados financeiros para criação inicial');
            return {}; // Retorna objeto vazio para novos estudantes
        }
        
        return {
            subscription: this.subscriptionData,
            financialHistory: this.financialHistory
        };
    }

    // Métodos de ação
    editSubscription() {
        console.log('✏️ Editando assinatura...');
        
        if (!this.subscriptionData) {
            alert('Nenhuma assinatura ativa para editar');
            return;
        }

        const newPrice = prompt(
            `Novo valor mensal para a assinatura atual (R$ ${this.subscriptionData.monthlyPrice.toFixed(2).replace('.', ',')}):`
        );
        
        if (newPrice && !isNaN(parseFloat(newPrice))) {
            this.updateSubscriptionPrice(parseFloat(newPrice));
        }
    }

    changePlan() {
        console.log('🔄 Trocando plano...');
        alert('Selecione um plano abaixo para trocar.');
    }

    async cancelSubscription() {
        console.log('❌ Cancelando assinatura...');
        
        if (!this.subscriptionData) {
            alert('Nenhuma assinatura ativa para cancelar');
            return;
        }

        const confirmed = confirm(
            `Tem certeza que deseja cancelar a assinatura "${this.subscriptionData.planName}"?\n\nEsta ação não pode ser desfeita.`
        );
        
        if (confirmed) {
            try {
                this.main.showLoading('Cancelando assinatura...');
                // Preferir rota financeira genérica
                const resp = await fetch(`/api/financial/subscriptions/${this.subscriptionData.id}`, { method: 'DELETE' });
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                this.subscriptionData = null;
                this.showNoSubscriptionState();
                this.renderAvailablePlans();
                this.main.hideLoading();
                alert('Assinatura cancelada com sucesso!');
            } catch (error) {
                console.error('❌ Erro ao cancelar assinatura:', error);
                this.main.hideLoading();
                alert('Erro ao cancelar assinatura. Tente novamente.');
            }
        }
    }

    createNewSubscription() {
        console.log('➕ Criando nova assinatura...');
        alert('Selecione um plano abaixo para criar uma nova assinatura.');
    }

    async selectPlan(planId) {
        console.log(`🎯 Selecionando plano: ${planId}`);
        
        const plan = this.availablePlans.find(p => p.id === planId);
        if (!plan) {
            alert('Plano não encontrado');
            return;
        }

        const confirmed = confirm(
            `Confirmar seleção do plano:\n\n` +
            `${plan.name}\n` +
            `R$ ${plan.price.toFixed(2).replace('.', ',')}/mês\n` +
            `${plan.description}\n\n` +
            `${(plan.features || []).join('\n')}`
        );
        
        if (confirmed) {
            try {
                this.main.showLoading('Processando nova assinatura...');

                // Se já existe assinatura, vamos apenas informar que será trocada (backend deve encerrar a anterior)
                const studentId = this.main.currentStudentId;
                const body = { studentId, planId };
                const resp = await fetch('/api/financial/subscriptions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                const payload = await resp.json();
                const sub = payload && payload.data ? payload.data : payload;

                this.subscriptionData = this.normalizeSubscription(sub);
                this.hideNoSubscriptionState();
                this.renderCurrentSubscription();
                this.renderAvailablePlans();
                
                this.main.hideLoading();
                alert(`Assinatura do ${plan.name} criada/atualizada com sucesso!`);
                
            } catch (error) {
                console.error('❌ Erro ao criar assinatura:', error);
                this.main.hideLoading();
                alert('Erro ao criar assinatura. Tente novamente.');
            }
        }
    }

    updateSubscriptionPrice(newPrice) {
        if (!this.subscriptionData) return;

        this.subscriptionData.monthlyPrice = newPrice;
        this.renderCurrentSubscription();
        
        console.log(`💰 Preço da assinatura atualizado para: R$ ${newPrice.toFixed(2)}`);
        alert(`Preço da assinatura atualizado para R$ ${newPrice.toFixed(2).replace('.', ',')}`);
    }

    renderPaymentHistory() {
        const tbody = this.elements.historyTableBody;
        if (!tbody) return;
        tbody.innerHTML = '';

        const rows = (this.financialHistory || []).map(p => {
            const date = p.paidDate || p.dueDate || p.createdAt;
            const amountRaw = p.amount;
            const amount = typeof amountRaw === 'number' ? amountRaw : (amountRaw?.toNumber ? amountRaw.toNumber() : Number(amountRaw) || 0);
            const status = (p.status || '').toString().toUpperCase();
            const method = (p.paymentMethod || '').toString().toUpperCase() || '-';
            return `
                <tr>
                    <td>${date ? new Date(date).toLocaleDateString('pt-BR') : '-'}</td>
                    <td>R$ ${amount.toFixed(2).replace('.', ',')}</td>
                    <td>${status}</td>
                    <td>${method}</td>
                    <td>
                        ${status === 'PENDING' || status === 'OVERDUE' ? `<button class="btn btn-sm" onclick="alert('Acionar cobrança manual em breve')">Cobrar</button>` : ''}
                    </td>
                </tr>
            `;
        }).join('');

        tbody.innerHTML = rows || '<tr><td colspan="5" style="text-align:center;color:#94A3B8;">Sem pagamentos recentes</td></tr>';
    }

    // Métodos utilitários
    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }

    formatDate(date) {
        return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
    }

    calculateDaysUntilDue() {
        if (!this.subscriptionData || !this.subscriptionData.nextDueDate) return null;
        
        const dueDate = new Date(this.subscriptionData.nextDueDate);
        const today = new Date();
        const timeDiff = dueDate.getTime() - today.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        return daysDiff;
    }

    isPaymentOverdue() {
        const daysUntilDue = this.calculateDaysUntilDue();
        return daysUntilDue !== null && daysUntilDue < 0;
    }
}
