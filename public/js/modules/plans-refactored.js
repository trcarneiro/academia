(function() {
    'use strict';
    
    // ==============================================
    // PLANS MODULE - REFACTORED CLEAN VERSION
    // ==============================================
    
    let plansData = [];
    let isInitialized = false;
    
    // ==============================================
    // CORE FUNCTIONS
    // ==============================================
    
    async function initPlansModule() {
        if (isInitialized) {
            console.log('📊 Plans Module already initialized');
            return;
        }
        
        console.log('🏗️ Initializing Plans Module (Clean Version)...');
        
        try {
            // Aguardar um pouco para garantir que o DOM está pronto
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Verificar se o container existe
            const container = findPlansContainer();
            if (!container) {
                console.log('❌ Plans container not found, creating fallback');
                createFallbackContainer();
            }
            
            // Inicializar API
            await loadPlansData();
            
            isInitialized = true;
            console.log('✅ Plans Module initialized successfully');
            
        } catch (error) {
            console.error('❌ Plans Module initialization failed:', error);
        }
    }
    
    function findPlansContainer() {
        const selectors = [
            '#plansContainer',
            '.plans-isolated',
            '.module-container',
            '#plansModule',
            '.plans-module',
            '[data-module="plans"]'
        ];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                console.log(`✅ Found plans container: ${selector}`);
                return element;
            }
        }
        
        console.log('⚠️ No plans container found');
        return null;
    }
    
    function createFallbackContainer() {
        console.log('🏗️ Creating fallback plans container...');
        
        // Procurar onde inserir o container
        let targetElement = document.querySelector('#app') || 
                           document.querySelector('.spa-content') || 
                           document.querySelector('main') || 
                           document.body;
        
        // Criar container principal
        const container = document.createElement('div');
        container.id = 'plansContainer';
        container.className = 'plans-isolated module-container';
        container.innerHTML = createPlansHTML();
        
        // Limpar conteúdo existente se necessário
        if (targetElement.children.length > 0) {
            targetElement.innerHTML = '';
        }
        
        targetElement.appendChild(container);
        console.log('✅ Fallback container created');
    }
    
    function createPlansHTML() {
        return `
            <div class="module-header">
                <h2>📋 Gestão de Planos</h2>
                <p>Gerencie planos de treinamento, categorias e vinculações com alunos</p>
            </div>
            
            <div class="module-actions">
                <button onclick="createNewPlan()" class="btn-primary">
                    ➕ Novo Plano
                </button>
                <div class="search-container">
                    <input type="text" id="plansSearch" placeholder="Buscar planos..." 
                           onkeyup="filterPlans()">
                </div>
            </div>
            
            <div class="module-stats" id="plansStats">
                <div class="stat-card">
                    <div class="stat-number" id="totalPlansCount">0</div>
                    <div class="stat-label">Planos Cadastrados</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="activePlansCount">0</div>
                    <div class="stat-label">Planos Ativos</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="studentsEnrolled">0</div>
                    <div class="stat-label">Alunos Vinculados</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="monthlyRevenue">R$ 0</div>
                    <div class="stat-label">Receita Estimada</div>
                </div>
            </div>
            
            <div class="module-content">
                <div id="plansLoadingState" class="loading-state">
                    <div class="spinner"></div>
                    <p>Carregando planos...</p>
                </div>
                
                <div id="plansTableContainer" class="table-container" style="display: none;">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Nome do Plano</th>
                                <th>Categoria</th>
                                <th>Valor Mensal</th>
                                <th>Tipo de Cobrança</th>
                                <th>Aulas/Semana</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody id="plansTableBody">
                            <!-- Planos serão inseridos aqui -->
                        </tbody>
                    </table>
                </div>
                
                <div id="plansEmptyState" class="empty-state" style="display: none;">
                    <div class="empty-icon">📋</div>
                    <h3>Nenhum plano encontrado</h3>
                    <p>Clique em "Novo Plano" para criar o primeiro plano.</p>
                    <button onclick="createNewPlan()" class="btn-primary">Criar Primeiro Plano</button>
                </div>
                
                <div id="plansErrorState" class="error-state" style="display: none;">
                    <div class="error-icon">❌</div>
                    <h3>Erro ao carregar planos</h3>
                    <p id="errorMessage">Ocorreu um erro ao carregar os dados.</p>
                    <button onclick="retryLoadPlans()" class="btn-secondary">Tentar Novamente</button>
                </div>
            </div>
        `;
    }
    
    // ==============================================
    // DATA LOADING
    // ==============================================
    
    async function loadPlansData() {
        console.log('📊 Loading plans data...');
        
        showLoadingState();
        
        try {
            // Verificar se API Client está disponível
            if (typeof window.APIClient === 'undefined') {
                throw new Error('API Client not available');
            }
            
            const response = await window.fetchWithOrganization('/api/billing-plans');
            const result = await response.json();
            
            if (result.success && result.data) {
                plansData = result.data;
                console.log('✅ Plans data loaded:', plansData.length, 'plans');
                showSuccessState();
                renderPlansTable();
                updateStats();
            } else {
                throw new Error(result.message || 'Failed to load plans');
            }
            
        } catch (error) {
            console.error('❌ Error loading plans:', error);
            showErrorState(error.message);
        }
    }
    
    // ==============================================
    // UI STATE MANAGEMENT
    // ==============================================
    
    function showLoadingState() {
        hideAllStates();
        const loadingState = document.getElementById('plansLoadingState');
        if (loadingState) loadingState.style.display = 'block';
    }
    
    function showSuccessState() {
        hideAllStates();
        const tableContainer = document.getElementById('plansTableContainer');
        if (tableContainer) tableContainer.style.display = 'block';
    }
    
    function showEmptyState() {
        hideAllStates();
        const emptyState = document.getElementById('plansEmptyState');
        if (emptyState) emptyState.style.display = 'block';
    }
    
    function showErrorState(message) {
        hideAllStates();
        const errorState = document.getElementById('plansErrorState');
        const errorMessage = document.getElementById('errorMessage');
        if (errorState) errorState.style.display = 'block';
        if (errorMessage) errorMessage.textContent = message;
    }
    
    function hideAllStates() {
        const states = [
            'plansLoadingState',
            'plansTableContainer', 
            'plansEmptyState',
            'plansErrorState'
        ];
        
        states.forEach(stateId => {
            const element = document.getElementById(stateId);
            if (element) element.style.display = 'none';
        });
    }
    
    // ==============================================
    // RENDERING
    // ==============================================
    
    function renderPlansTable() {
        const tableBody = document.getElementById('plansTableBody');
        if (!tableBody) {
            console.error('❌ Table body not found');
            return;
        }
        
        if (plansData.length === 0) {
            showEmptyState();
            return;
        }
        
        console.log('🎨 Rendering', plansData.length, 'plans...');
        
        const rows = plansData.map(plan => createPlanRow(plan)).join('');
        tableBody.innerHTML = rows;
        
        console.log('✅ Plans table rendered successfully');
    }
    
    function createPlanRow(plan) {
        const statusClass = plan.isActive ? 'status-active' : 'status-inactive';
        const statusText = plan.isActive ? 'Ativo' : 'Inativo';
        const billingTypeText = getBillingTypeText(plan.billingType);
        const categoryText = getCategoryText(plan.category);
        
        return `
            <tr data-plan-id="${plan.id}" class="plan-row">
                <td class="plan-name">
                    <strong>${plan.name || 'Plano sem nome'}</strong>
                </td>
                <td class="plan-category">
                    <span class="category-badge">${categoryText}</span>
                </td>
                <td class="plan-price">
                    <span class="price-value">R$ ${formatPrice(plan.price)}</span>
                </td>
                <td class="billing-type">
                    ${billingTypeText}
                </td>
                <td class="classes-per-week">
                    ${plan.classesPerWeek || 0}x
                </td>
                <td class="plan-status">
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </td>
                <td class="plan-actions">
                    <button onclick="editPlan('${plan.id}')" class="btn-edit" title="Editar">
                        ✏️
                    </button>
                    <button onclick="togglePlanStatus('${plan.id}')" class="btn-toggle" title="Ativar/Desativar">
                        ${plan.isActive ? '⏸️' : '▶️'}
                    </button>
                    <button onclick="deletePlan('${plan.id}')" class="btn-delete" title="Excluir">
                        🗑️
                    </button>
                </td>
            </tr>
        `;
    }
    
    function updateStats() {
        const totalPlans = plansData.length;
        const activePlans = plansData.filter(plan => plan.isActive).length;
        const totalRevenue = plansData
            .filter(plan => plan.isActive)
            .reduce((sum, plan) => sum + (plan.price || 0), 0);
        
        // Atualizar elementos de estatísticas
        updateStatElement('totalPlansCount', totalPlans);
        updateStatElement('activePlansCount', activePlans);
        updateStatElement('studentsEnrolled', 0); // Placeholder
        updateStatElement('monthlyRevenue', `R$ ${formatPrice(totalRevenue)}`);
        
        console.log('📊 Stats updated:', { totalPlans, activePlans, totalRevenue });
    }
    
    function updateStatElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }
    
    // ==============================================
    // UTILITY FUNCTIONS
    // ==============================================
    
    function formatPrice(price) {
        if (!price) return '0,00';
        return parseFloat(price).toFixed(2).replace('.', ',');
    }
    
    function getBillingTypeText(billingType) {
        const types = {
            'MONTHLY': 'Mensal',
            'QUARTERLY': 'Trimestral',
            'YEARLY': 'Anual',
            'WEEKLY': 'Semanal',
            'LIFETIME': 'Vitalício'
        };
        return types[billingType] || billingType || 'Mensal';
    }
    
    function getCategoryText(category) {
        const categories = {
            'ADULT': 'Adulto',
            'FEMALE': 'Feminino',
            'SENIOR': 'Senior',
            'CHILD': 'Infantil',
            'INICIANTE1': 'Iniciante 1',
            'INICIANTE2': 'Iniciante 2',
            'INICIANTE3': 'Iniciante 3'
        };
        return categories[category] || category || 'Geral';
    }
    
    // ==============================================
    // ACTION FUNCTIONS
    // ==============================================
    
    function createNewPlan() {
        console.log('➕ Creating new plan...');
        alert('Funcionalidade em desenvolvimento: Criar novo plano');
    }
    
    function editPlan(planId) {
        console.log('✏️ Editing plan:', planId);
        alert(`Funcionalidade em desenvolvimento: Editar plano ${planId}`);
    }
    
    function togglePlanStatus(planId) {
        console.log('🔄 Toggling plan status:', planId);
        const plan = plansData.find(p => p.id === planId);
        if (plan) {
            plan.isActive = !plan.isActive;
            renderPlansTable();
            updateStats();
            console.log('✅ Plan status toggled');
        }
    }
    
    function deletePlan(planId) {
        console.log('🗑️ Deleting plan:', planId);
        if (confirm('Tem certeza que deseja excluir este plano?')) {
            plansData = plansData.filter(p => p.id !== planId);
            renderPlansTable();
            updateStats();
            console.log('✅ Plan deleted');
        }
    }
    
    function filterPlans() {
        const searchTerm = document.getElementById('plansSearch')?.value.toLowerCase() || '';
        console.log('🔍 Filtering plans by:', searchTerm);
        
        // Implementar filtro se necessário
        renderPlansTable();
    }
    
    function retryLoadPlans() {
        console.log('🔄 Retrying to load plans...');
        loadPlansData();
    }
    
    // ==============================================
    // GLOBAL EXPOSURE
    // ==============================================
    
    // Expor funções globalmente
    window.createNewPlan = createNewPlan;
    window.editPlan = editPlan;
    window.togglePlanStatus = togglePlanStatus;
    window.deletePlan = deletePlan;
    window.filterPlans = filterPlans;
    window.retryLoadPlans = retryLoadPlans;
    
    // Expor módulo
    window.PlansModuleRefactored = {
        init: initPlansModule,
        loadData: loadPlansData,
        isInitialized: () => isInitialized,
        getData: () => plansData
    };
    
    // Auto-inicializar quando carregado
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPlansModule);
    } else {
        // Se o DOM já está pronto, aguardar um pouco e inicializar
        setTimeout(initPlansModule, 100);
    }
    
    console.log('📊 Plans Module Refactored script loaded');
    
})();
