(function() {
    'use strict';
    
    // ==============================================
    // PLANS MODULE - FOLLOWING CLAUDE.MD STANDARDS
    // ==============================================
    
    // Module state
    let allPlans = [];
    let filteredPlans = [];
    let currentView = 'grid';
    let currentEditingPlanId = null;
    // Prevent double-initialization when index and module both auto-init
    let isInitialized = false;
    let isInitializing = false;
    
    // Module constants
    const BILLING_TYPES = {
        MONTHLY: { icon: '💳', label: 'Mensal' },
        QUARTERLY: { icon: '📊', label: 'Trimestral' },
        YEARLY: { icon: '🗓️', label: 'Anual' },
        WEEKLY: { icon: '📅', label: 'Semanal' },
        LIFETIME: { icon: '♾️', label: 'Vitalício' }
    };
    
    const CATEGORIES = {
        ADULT: { icon: '👨', label: 'Adulto' },
        FEMALE: { icon: '👩', label: 'Feminino' },
        SENIOR: { icon: '👴', label: 'Senior' },
        CHILD: { icon: '🧒', label: 'Infantil' },
        INICIANTE1: { icon: '🥉', label: 'Iniciante 1' },
        INICIANTE2: { icon: '🥉', label: 'Iniciante 2' },
        INICIANTE3: { icon: '🥉', label: 'Iniciante 3' },
        HEROI1: { icon: '🥈', label: 'Herói 1' },
        HEROI2: { icon: '🥈', label: 'Herói 2' },
        HEROI3: { icon: '🥈', label: 'Herói 3' },
        MASTER_1: { icon: '🥇', label: 'Master 1' },
        MASTER_2: { icon: '🥇', label: 'Master 2' },
        MASTER_3: { icon: '🥇', label: 'Master 3' }
    };
    
    // ==============================================
    // GLOBAL FUNCTIONS (CLAUDE.MD REQUIREMENT)
    // ==============================================
    
    window.openNewPlanForm = function() {
        console.log('🆕 Opening new plan form...');
        if (typeof window.navigateToModule === 'function') {
            if (window.EditingSession && window.EditingSession.clearEditingPlanId) {
                window.EditingSession.clearEditingPlanId();
            } else {
                try { sessionStorage.removeItem('editingPlanId'); } catch(e){}
            }
            window.navigateToModule('plan-editor');
        } else {
            window.location.href = '/views/plan-editor.html';
        }
    };
    
    window.refreshPlans = function() {
        console.log('🔄 Refreshing plans...');
        if (typeof loadPlansData === 'function') {
            loadPlansData();
        }
    };
    
    window.editPlan = function(planId) {
        console.log('✏️ Editing plan:', planId);
        if (window.EditingSession && window.EditingSession.setEditingPlanId) {
            window.EditingSession.setEditingPlanId(planId);
        } else {
            try { sessionStorage.setItem('editingPlanId', planId); } catch(e) {}
        }
        if (typeof window.navigateToModule === 'function') {
            window.navigateToModule('plan-editor');
        } else {
            window.location.href = `/views/plan-editor.html?id=${planId}`;
        }
    };
    
    // ==============================================
    // HELPER FUNCTIONS
    // ==============================================
    
    function findModuleElement(selector, useId = false) {
        let element = useId ? document.getElementById(selector) : document.querySelector(selector);
        
        if (!element) {
            const moduleContent = document.querySelector('.module-content');
            if (moduleContent) {
                element = useId ? moduleContent.querySelector(`#${selector}`) : moduleContent.querySelector(selector);
            }
        }
        
        if (!element) {
            const plansContainer = document.querySelector('.plans-isolated');
            if (plansContainer) {
                element = useId ? plansContainer.querySelector(`#${selector}`) : plansContainer.querySelector(selector);
            }
        }
        
        return element;
    }
    
    function formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value || 0);
    }
    
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
        clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // ==============================================
    // MAIN INITIALIZATION
    // ==============================================
    
    async function initializePlansModule() {
        // Guard against double init (index + module auto-init)
        if (isInitialized || isInitializing) {
            console.log('↩️ Plans Module already initialized or initializing. Skipping.');
            return;
        }
        isInitializing = true;
        console.log('🏗️ Initializing Plans Module...');
        
        try {
            // Wait for DOM and more time for SPA router to inject HTML
            await waitForDOM();
            await new Promise(resolve => setTimeout(resolve, 500)); // Increased timeout for SPA
            
            // Wait specifically for the plans table to be injected
            let plansTableBody = null;
            let attempts = 0;
            const maxAttempts = 10;
            
            while (!plansTableBody && attempts < maxAttempts) {
                plansTableBody = document.getElementById('plansTableBody');
                console.log(`🔍 Attempt ${attempts + 1}: Looking for plansTableBody:`, plansTableBody);
                
                if (!plansTableBody) {
                    console.log('⏳ Waiting for SPA router to inject Plans HTML...');
                    await new Promise(resolve => setTimeout(resolve, 200));
                    attempts++;
                }
            }
            
            if (!plansTableBody) {
                console.log('❌ Plans table body not found after multiple attempts. Trying to find any container...');
                
                // Try to find any suitable container
                const containers = [
                    '#plansContainer',
                    '.module-isolated-container',
                    '.plans-isolated',
                    '#module-container',
                    '.module-content'
                ];
                
                let foundContainer = null;
                for (const selector of containers) {
                    foundContainer = document.querySelector(selector);
                    console.log(`🔍 Trying container ${selector}:`, foundContainer);
                    if (foundContainer) break;
                }
                
                if (!foundContainer) {
                    console.log('❌ No suitable container found. Module initialization failed.');
                    isInitializing = false;
                    return;
                }
            }
            
            console.log('✅ Plans container/table found, proceeding with initialization');
            
            // Inicializar API primeiro
            await initializeAPI();
            
            // Setup event listeners
            setupEventListeners();
            
            // Load initial data with standardized API
            await loadPlansData();
            
            isInitialized = true;
            isInitializing = false;
            console.log('✅ Plans Module initialized successfully');
            
        } catch (error) {
            isInitializing = false;
            console.error('❌ Plans Module initialization failed:', error);
            showError('Falha ao inicializar módulo de planos. Tente recarregar a página.');
        }
    }
    
    function waitForDOM() {
        return new Promise(resolve => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    }
    
    // ==============================================
    // EVENT LISTENERS SETUP
    // ==============================================
    
    function setupEventListeners() {
        console.log('🔧 Setting up event listeners...');
        
        // Search input
        const searchInput = findModuleElement('planSearch', true);
        if (searchInput) {
            searchInput.addEventListener('keyup', debounce(filterPlans, 300));
        }
        
        // Filter dropdowns
        const categoryFilter = findModuleElement('categoryFilter', true);
        const billingTypeFilter = findModuleElement('billingTypeFilter', true);
        const statusFilter = findModuleElement('statusFilter', true);
        
        if (categoryFilter) categoryFilter.addEventListener('change', filterPlans);
        if (billingTypeFilter) billingTypeFilter.addEventListener('change', filterPlans);
        if (statusFilter) statusFilter.addEventListener('change', filterPlans);
        
        // Clear filters button
        const clearFiltersBtn = findModuleElement('clearFiltersBtn', true);
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', clearFilters);
        }
        
        // View toggle buttons
        const gridViewBtn = findModuleElement('gridViewBtn', true);
        const tableViewBtn = findModuleElement('tableViewBtn', true);
        
        if (gridViewBtn) {
            gridViewBtn.addEventListener('click', () => switchView('grid'));
        }
        
        if (tableViewBtn) {
            tableViewBtn.addEventListener('click', () => switchView('table'));
        }
        
        console.log('✅ Event listeners setup completed');
    }
    
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
    let plansAPI = null;
    
    async function initializeAPI() {
        await waitForAPIClient();
        plansAPI = window.createModuleAPI('Plans');
        console.log('🌐 Plans API helper inicializado com Guidelines.MD compliance');
    }
    
    // ==============================================
    // DATA LOADING - NOVO PADRÃO API CLIENT
    // ==============================================
    
    async function loadPlansData() {
        console.log('📊 Loading plans data with standardized API Client...');
        
        try {
            // Garantir que API Client está disponível
            if (!plansAPI) {
                await initializeAPI();
            }
            
            const result = await plansAPI.fetchWithStates('/api/billing-plans', {
                loadingElement: document.getElementById('plansTableBody'),
                onSuccess: (data) => {
                    allPlans = data || [];
                    filteredPlans = [...allPlans];
                    
                    console.log('✅ Plans loaded via API Client:', allPlans.length);
                    console.log('📊 Plans data:', allPlans);
                    
                    updateStats();
                    renderPlans();
                },
                onEmpty: () => {
                    console.log('� No plans found');
                    allPlans = [];
                    filteredPlans = [];
                    updateStats();
                    showEmptyState();
                },
                onError: (error) => {
                    console.error('❌ Error loading plans:', error);
                    showErrorState();
                }
            });
            
            console.log('✅ Plans data loading completed with Guidelines.MD compliance');
            
        } catch (error) {
            console.error('❌ Failed to load plans with standardized API Client:', error);
            showErrorState();
        }
    }

    function showLoadingState() {
        const tableBody = document.getElementById('plansTableBody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="plans-isolated-loading-state">
                        <div class="spinner"></div>
                        Carregando planos...
                    </td>
                </tr>
            `;
        }
    }

    function hideLoadingState() {
        const tableBody = document.getElementById('plansTableBody');
        if (tableBody && tableBody.innerHTML.includes('Carregando planos...')) {
            tableBody.innerHTML = '';
        }
    }

    function showErrorState() {
        const tableBody = document.getElementById('plansTableBody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="plans-isolated-error-state">
                        ❌ Falha ao carregar planos. <button onclick="window.refreshPlans()">Tentar novamente</button>
                    </td>
                </tr>
            `;
        }
    }

    function showEmptyState() {
        const tableBody = document.getElementById('plansTableBody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="plans-isolated-empty-state">
                        <div class="empty-icon">💰</div>
                        <h3>Nenhum plano encontrado</h3>
                        <p>Clique em "Novo Plano" para criar o primeiro plano.</p>
                    </td>
                </tr>
            `;
        }
    }
    
    // ==============================================
    // CRUD OPERATIONS (API Client)
    // ==============================================
    
    async function savePlan(planData) {
        try {
            if (planData.id) {
                // Update existing
                return await plansAPI.update(endpoints.single(planData.id), planData);
            } else {
                // Create new
                return await plansAPI.create(endpoints.list(), planData);
            }
        } catch (error) {
            console.error('❌ Error saving plan:', error);
            throw error;
        }
    }
    
    async function deletePlan(planId) {
        try {
            return await plansAPI.delete(endpoints.single(planId));
        } catch (error) {
            console.error('❌ Error deleting plan:', error);
            throw error;
        }
    }
    
    // ==============================================
    // STATS UPDATE
    // ==============================================
    
    function updateStats() {
        const totalPlans = allPlans.length;
        const activePlans = allPlans.filter(plan => plan.isActive).length;
        const totalSubscribers = allPlans.reduce((sum, plan) => sum + (plan.subscriberCount || 0), 0);
        const monthlyRevenue = allPlans
            .filter(plan => plan.isActive && plan.billingType === 'MONTHLY')
            .reduce((sum, plan) => sum + (plan.price * (plan.subscriberCount || 0)), 0);
        
        updateStatValue('totalPlans', totalPlans);
        updateStatValue('activePlans', activePlans);
        updateStatValue('totalSubscribers', totalSubscribers);
        updateStatValue('revenueTotal', formatCurrency(monthlyRevenue));
    }
    
    // Alias para compatibilidade
    const updateStatsCards = updateStats;
    
    function updateStatValue(id, value) {
        const element = findModuleElement(id, true);
        if (element) {
            element.textContent = value;
        }
    }
    
    // ==============================================
    // FILTERING AND SEARCH
    // ==============================================
    
    function filterPlans() {
        const searchTerm = getInputValue('planSearch').toLowerCase();
        const categoryFilter = getInputValue('categoryFilter');
        const billingTypeFilter = getInputValue('billingTypeFilter');
        const statusFilter = getInputValue('statusFilter');
        
        filteredPlans = allPlans.filter(plan => {
            const matchesSearch = !searchTerm || 
                (plan.name && plan.name.toLowerCase().includes(searchTerm)) ||
                (plan.description && plan.description.toLowerCase().includes(searchTerm)) ||
                (plan.price && plan.price.toString().includes(searchTerm));
            
            const matchesCategory = !categoryFilter || plan.category === categoryFilter;
            const matchesBillingType = !billingTypeFilter || plan.billingType === billingTypeFilter;
            const matchesStatus = !statusFilter || plan.isActive.toString() === statusFilter;
            
            return matchesSearch && matchesCategory && matchesBillingType && matchesStatus;
        });
        
        console.log('🔍 Filtered plans:', filteredPlans.length, 'of', allPlans.length);
        renderPlans();
    }
    
    function clearFilters() {
        const searchInput = findModuleElement('planSearch', true);
        const categoryFilter = findModuleElement('categoryFilter', true);
        const billingTypeFilter = findModuleElement('billingTypeFilter', true);
        const statusFilter = findModuleElement('statusFilter', true);
        
        if (searchInput) searchInput.value = '';
        if (categoryFilter) categoryFilter.value = '';
        if (billingTypeFilter) billingTypeFilter.value = '';
        if (statusFilter) statusFilter.value = '';
        
        filteredPlans = [...allPlans];
        renderPlans();
    }
    
    function getInputValue(id) {
        const element = findModuleElement(id, true);
        return element ? element.value : '';
    }
    
    // ==============================================
    // VIEW SWITCHING
    // ==============================================
    
    function switchView(viewType) {
        currentView = viewType;
        
        const gridBtn = findModuleElement('gridViewBtn', true);
        const tableBtn = findModuleElement('tableViewBtn', true);
        
        if (gridBtn && tableBtn) {
            gridBtn.classList.toggle('active', viewType === 'grid');
            tableBtn.classList.toggle('active', viewType === 'table');
        }
        
        renderPlans();
    }
    
    // ==============================================
    // RENDERING
    // ==============================================
    
    function renderPlans() {
        // Always render table view to match turmas layout
        renderTableView();
    }
    
    function renderTableView() {
        console.log('🎨 Starting renderTableView...');
        console.log('📊 filteredPlans length:', filteredPlans.length);
        console.log('📊 allPlans length:', allPlans.length);
        
        // Buscar elemento diretamente primeiro
        let tableBody = document.getElementById('plansTableBody');
        console.log('📋 Table body element (direct):', tableBody);
        
        // Se não encontrar, tentar buscar em containers
        if (!tableBody) {
            tableBody = document.querySelector('#plansTableBody');
            console.log('� Table body element (querySelector):', tableBody);
        }
        
        // Se ainda não encontrar, buscar qualquer tbody
        if (!tableBody) {
            const allTbodies = document.querySelectorAll('tbody');
            console.log('� All tbody elements found:', allTbodies.length);
            tableBody = allTbodies[0]; // Usar o primeiro tbody encontrado
            console.log('📋 Using first tbody:', tableBody);
        }
        
        if (!tableBody) {
            console.log('❌ NO TABLE BODY FOUND AT ALL!');
            // Criar tabela se não existir
            const container = document.querySelector('.plans-isolated') || document.querySelector('.module-content');
            if (container) {
                container.innerHTML = `
                    <table class="module-isolated-table">
                        <thead>
                            <tr>
                                <th>Nome do Plano</th>
                                <th>Categoria</th>
                                <th>Valor Mensal</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody id="plansTableBody">
                        </tbody>
                    </table>
                `;
                tableBody = document.getElementById('plansTableBody');
                console.log('📋 Created new table body:', tableBody);
            } else {
                console.log('❌ No container found to create table!');
                return;
            }
        }
        
        console.log('📊 Calling updateStatsCards...');
        updateStatsCards();
        
        if (filteredPlans.length === 0) {
            console.log('📭 No filtered plans, showing empty state');
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="plans-isolated-empty-state">
                        <div class="empty-icon">💰</div>
                        <h3>Nenhum plano encontrado</h3>
                        <p>Clique em "Novo Plano" para criar o primeiro plano.</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Renderizar dados dos planos
        console.log('🎨 Rendering plans data...');
        let tableHTML = '';
        
        filteredPlans.forEach(plan => {
            tableHTML += `
                <tr class="plan-row" data-plan-id="${plan.id}">
                    <td class="plan-name">
                        <div class="plan-name-content">
                            <span class="plan-title">${plan.name || 'Plano sem nome'}</span>
                        </div>
                    </td>
                    <td class="plan-category">
                        <span class="category-badge">${plan.category || 'N/A'}</span>
                    </td>
                    <td class="plan-value">
                        <span class="value-amount">R$ ${plan.price || '0,00'}</span>
                        <span class="billing-type">${plan.billingType || 'MONTHLY'}</span>
                    </td>
                    <td class="plan-status">
                        <span class="status-badge ${plan.isActive ? 'status-active' : 'status-inactive'}">
                            ${plan.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                    </td>
                    <td class="plan-actions">
                        <button class="module-isolated-btn module-isolated-btn-sm module-isolated-btn-secondary" 
                                onclick="window.editPlan('${plan.id}')">
                            ✏️ Editar
                        </button>
                    </td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = tableHTML;
        console.log('✅ Table rendered successfully with', filteredPlans.length, 'plans');
    }
    
    function getCategoryClass(category) {
        const categoryClasses = {
            'ADULT': 'premium',
            'FEMALE': 'vip',
            'SENIOR': 'basic',
            'CHILD': 'premium'
        };
        return categoryClasses[category] || 'basic';
    }
    
    function getBillingSchedule(billingType) {
        const schedules = {
            'MONTHLY': 'Seg/Qua - 18:00h início 01/06/2025',
            'QUARTERLY': 'Ter/Qui - 19:00h início 01/06/2025',
            'YEARLY': 'Sex/Sáb - 20:00h início 01/06/2025',
            'WEEKLY': 'Ter/Sex - 17:00h início 01/06/2025'
        };
        return schedules[billingType] || 'Horário a definir';
    }
    
    // ==============================================
    // UI STATES
    // ==============================================
    
    function showLoadingState() {
        const tableBody = findModuleElement('plansTableBody', true);
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="loading-state">
                        <div class="spinner"></div>
                        Carregando planos...
                    </td>
                </tr>
            `;
        }
    }
    
    function showEmptyState() {
        const tableBody = findModuleElement('plansTableBody', true);
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7">
                        <div class="plans-empty-state">
                            <div class="plans-empty-state-icon">�</div>
                            <h3 class="plans-empty-state-title">Nenhum plano encontrado</h3>
                            <p class="plans-empty-state-description">
                                Clique em "Novo Plano" para criar o primeiro plano de treinamento.
                            </p>
                            <button class="module-isolated-btn-primary" onclick="window.openNewPlanForm()">
                                ➕ Criar Primeiro Plano
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }
    }
    
    function showError(message) {
        console.error('❌ Error:', message);
        alert('Erro: ' + message);
    }
    
    // ==============================================
    // GLOBAL EXPOSURE (CLAUDE.MD REQUIREMENT)
    // ==============================================
    
    // Export individual functions for backward compatibility
    window.initializePlansModule = initializePlansModule;
    
    // Export module object following Guidelines.MD pattern
    window.PlansModule = {
        init: initializePlansModule,
        loadData: loadPlansData,
        render: renderPlans,
        filter: filterPlans,
        isInitialized: () => isInitialized,
        getAllPlans: () => allPlans,
        getFilteredPlans: () => filteredPlans
    };
    
    console.log('📊 Plans Module script loaded successfully');
    
})();