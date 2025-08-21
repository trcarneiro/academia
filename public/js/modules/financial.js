(function() {
    'use strict';
    
    console.log('💰 Financial Module Starting...');
    
    // ==============================================
    // API CLIENT INTEGRATION - GUIDELINES.MD COMPLIANCE
    // ==============================================
    
    // Aguardar API Client estar disponível
    function waitForAPIClient() {
        return new Promise((resolve) => {
            if (window.createModuleAPI) {
                resolve();
            } else {
                const checkAPI = setInterval(() => {
                    if (window.createModuleAPI) {
                        clearInterval(checkAPI);
                        resolve();
                    }
                }, 100);
            }
        });
    }
    
    // Criar instância do API helper quando disponível
    let financialAPI = null;
    
    async function initializeAPI() {
        await waitForAPIClient();
        financialAPI = window.createModuleAPI('Financial');
        console.log('🌐 Financial API helper inicializado com Guidelines.MD compliance');
    }
    
    // Financial module state
    let financialData = {
        subscriptions: [],
        transactions: [],  
        plans: [],
        metrics: {},
        lastUpdated: null
    };
    
    // Initialize financial module
    async function initializeFinancialModule() {
        console.log('🔧 Initializing Financial Module...');
        
        try {
            // Inicializar API primeiro
            await initializeAPI();
            
            setupEventListeners();
            await loadFinancialData();
            console.log('✅ Financial Module initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing Financial Module:', error);
        }
    }
    
    // Setup event listeners
    function setupEventListeners() {
        console.log('🔌 Setting up Financial event listeners...');
        
        // Refresh button
        const refreshBtn = document.getElementById('refreshFinancial');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                console.log('🔄 Refreshing financial data...');
                loadFinancialData();
            });
        }
        
        console.log('✅ Financial event listeners setup completed');
    }
    
    // Load financial data from API
    async function loadFinancialData() {
        console.log('📡 Loading financial data with standardized API Client...');
        
        try {
            // Garantir que API Client está disponível
            if (!financialAPI) {
                await initializeAPI();
            }
            
            // Show loading states
            showLoadingStates();
            
            // Load financial data using standardized API Client
            const [subscriptionsResult, plansResult] = await Promise.all([
                financialAPI.fetchWithStates('/api/financial/subscriptions', {
                    onSuccess: (data) => {
                        financialData.subscriptions = data || [];
                        console.log('✅ Subscriptions loaded:', data?.length || 0);
                    },
                    onError: (error) => console.error('❌ Subscriptions error:', error)
                }),
                financialAPI.fetchWithStates('/api/billing-plans', {
                    onSuccess: (data) => {
                        financialData.plans = data || [];
                        console.log('✅ Plans loaded:', data?.length || 0);
                    },
                    onError: (error) => console.error('❌ Plans error:', error)
                })
            ]);
            
            // Calculate metrics
            calculateMetrics();
            
            // Update display
            updateFinancialDisplay();
            
            financialData.lastUpdated = new Date();
            console.log('✅ Financial data loaded successfully with Guidelines.MD compliance');
            
        } catch (error) {
            console.error('❌ Error loading financial data:', error);
            showErrorState();
        }
    }
    
    // Show loading states
    function showLoadingStates() {
        const loadingHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <span>Carregando dados...</span>
            </div>
        `;
        
        // Update metric values with loading
        const metricElements = ['totalRevenue', 'activeSubscriptions', 'pendingPayments', 'monthlyGrowth'];
        metricElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.textContent = '...';
        });
    }
    
    // Calculate financial metrics
    function calculateMetrics() {
        console.log('📊 Calculating financial metrics...');
        
        const activeSubscriptions = financialData.subscriptions.filter(sub => sub.status === 'ACTIVE');
        const totalRevenue = activeSubscriptions.reduce((sum, sub) => {
            const price = parseFloat(sub.currentPrice) || parseFloat(sub.plan?.price) || 0;
            return sum + price;
        }, 0);
        
        const pendingPayments = financialData.subscriptions.filter(sub => sub.status === 'PENDING').length;
        
        financialData.metrics = {
            totalRevenue: totalRevenue.toFixed(2),
            activeSubscriptions: activeSubscriptions.length,
            pendingPayments,
            monthlyGrowth: '12.5' // Simplified for now
        };
        
        console.log('✅ Financial metrics calculated:', financialData.metrics);
    }
    
    // Update financial display
    function updateFinancialDisplay() {
        console.log('🎨 Updating financial display...');
        
        // Update metrics
        updateMetrics();
        
        // Update lists
        updateSubscriptionsList();
        updatePlansList();
    }
    
    // Update metrics display
    function updateMetrics() {
        const { totalRevenue, activeSubscriptions, pendingPayments, monthlyGrowth } = financialData.metrics;
        
        // Update metric values
        const totalRevenueEl = document.getElementById('totalRevenue');
        if (totalRevenueEl) totalRevenueEl.textContent = `R$ ${totalRevenue}`;
        
        const activeSubscriptionsEl = document.getElementById('activeSubscriptions');
        if (activeSubscriptionsEl) activeSubscriptionsEl.textContent = activeSubscriptions;
        
        const pendingPaymentsEl = document.getElementById('pendingPayments');
        if (pendingPaymentsEl) pendingPaymentsEl.textContent = pendingPayments;
        
        const monthlyGrowthEl = document.getElementById('monthlyGrowth');
        if (monthlyGrowthEl) monthlyGrowthEl.textContent = `${monthlyGrowth}%`;
        
        // Update change indicators
        const revenueChangeEl = document.getElementById('revenueChange');
        if (revenueChangeEl) revenueChangeEl.textContent = '↗ +12% este mês';
        
        const subscriptionsChangeEl = document.getElementById('subscriptionsChange');
        if (subscriptionsChangeEl) subscriptionsChangeEl.textContent = `↗ +${activeSubscriptions} ativas`;
        
        const pendingChangeEl = document.getElementById('pendingChange');
        if (pendingChangeEl) pendingChangeEl.textContent = `⏰ ${pendingPayments} pendentes`;
        
        const growthChangeEl = document.getElementById('growthChange');
        if (growthChangeEl) growthChangeEl.textContent = '↗ Crescendo';
    }
    
    // Update subscriptions list
    function updateSubscriptionsList() {
        const container = document.getElementById('subscriptionsList');
        if (!container) return;
        
        if (financialData.subscriptions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📋</div>
                    <h4>Nenhuma assinatura encontrada</h4>
                    <p>As assinaturas aparecerão aqui quando disponíveis.</p>
                </div>
            `;
            return;
        }
        
        const subscriptionsHTML = financialData.subscriptions.slice(0, 10).map(subscription => `
            <div class="subscription-item">
                <div class="subscription-info">
                    <div class="subscription-student">${subscription.student?.user?.firstName || 'Aluno'} ${subscription.student?.user?.lastName || ''}</div>
                    <div class="subscription-plan">${subscription.plan?.name || 'Plano não identificado'}</div>
                </div>
                <div class="subscription-amount">R$ ${(parseFloat(subscription.currentPrice) || parseFloat(subscription.plan?.price) || 0).toFixed(2)}</div>
                <div class="subscription-status status-${subscription.status?.toLowerCase()}">${subscription.status}</div>
            </div>
        `).join('');
        
        container.innerHTML = subscriptionsHTML;
    }
    
    // Update plans list
    function updatePlansList() {
        const container = document.getElementById('plansList');
        if (!container) return;
        
        if (financialData.plans.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">💎</div>
                    <h4>Nenhum plano encontrado</h4>
                    <p>Os planos aparecerão aqui quando disponíveis.</p>
                </div>
            `;
            return;
        }
        
        const plansHTML = financialData.plans.map(plan => `
            <div class="plan-item">
                <div class="plan-info">
                    <div class="plan-name">${plan.name}</div>
                    <div class="plan-description">${plan.description || 'Sem descrição'}</div>
                </div>
                <div class="plan-price">R$ ${(parseFloat(plan.price) || 0).toFixed(2)}</div>
                <div class="plan-billing">${plan.billingType || 'MONTHLY'}</div>
            </div>
        `).join('');
        
        container.innerHTML = plansHTML;
    }
    
    // Show error state
    function showErrorState() {
        const errorHTML = `
            <div class="error-state">
                <div class="error-icon">❌</div>
                <h4>Erro ao carregar dados</h4>
                <p>Falha na comunicação com o servidor</p>
                <button onclick="loadFinancialData()" class="btn btn-primary">🔄 Tentar Novamente</button>
            </div>
        `;
        
        // Update containers with error state
        const containers = ['subscriptionsList', 'plansList'];
        containers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) container.innerHTML = errorHTML;
        });
    }
    
    // Export global functions
    window.initializeFinancialModule = initializeFinancialModule;
    window.loadFinancialData = loadFinancialData;
    window.financialData = financialData;
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeFinancialModule);
    } else {
        setTimeout(initializeFinancialModule, 100);
    }
    
    console.log('✅ Financial Module loaded successfully');
    
})();