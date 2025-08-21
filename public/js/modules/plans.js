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
            // Wait for DOM
            await waitForDOM();
            
            // Validate container exists
            const plansContainer = findModuleElement('.plans-isolated');
            if (!plansContainer) {
                console.log('⚠️ Plans container not found');
                isInitializing = false;
                return;
            }
            
            console.log('✅ Plans container found');
            
            // Setup event listeners
            setupEventListeners();
            
            // Load initial data
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
    // DATA LOADING
    // ==============================================
    
    async function loadPlansData() {
        console.log('📊 Loading plans data...');
        showLoadingState();
        
        try {
            const response = await fetch('/api/billing-plans');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            
            if (result.success && result.data) {
                allPlans = result.data;
                filteredPlans = [...allPlans];
                
                console.log('✅ Plans loaded:', allPlans.length);
                
                if (allPlans.length === 0) {
                    showEmptyState();
                } else {
                    updateStats();
                    renderPlans();
                }
                
            } else {
                throw new Error(result.message || 'Erro ao carregar planos');
            }
            
        } catch (error) {
            console.error('❌ Error loading plans:', error);
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
        updateStatValue('monthlyRevenue', formatCurrency(monthlyRevenue));
    }
    
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
        const tableBody = findModuleElement('plansTableBody', true);
        if (!tableBody) {
            console.log('⚠️ Plans table body not found');
            return;
        }
        
        if (filteredPlans.length === 0) {
            showEmptyState();
            return;
        }
        
        const html = filteredPlans.map(plan => `
            <tr onclick="editPlan('${plan.id}')" style="cursor: pointer;" title="Clique para editar">
                <td>
                    <div class="plan-id-cell">
                        <div class="plan-id-badge">P${String(filteredPlans.indexOf(plan) + 1)}</div>
                        <span class="plan-name">${plan.name || 'Plano sem nome'}</span>
                    </div>
                </td>
                <td>
                    <span class="plan-badge ${getCategoryClass(plan.category)}">
                        ${CATEGORIES[plan.category]?.icon || '💰'} ${CATEGORIES[plan.category]?.label || plan.category}
                    </span>
                </td>
                <td>
                    <span>${getBillingSchedule(plan.billingType)}</span>
                </td>
                <td>
                    <span class="plan-badge basic">
                        ${BILLING_TYPES[plan.billingType]?.icon || '💳'} ${BILLING_TYPES[plan.billingType]?.label || plan.billingType}
                    </span>
                </td>
                <td>
                    <span class="plan-badge premium">${plan.subscriberCount || 0}</span> alunos
                </td>
                <td>
                    <span class="status-badge ${plan.isActive ? 'active' : 'inactive'}">
                        ${plan.isActive ? '✅ Ativa' : '⏸️ Inativa'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="plans-isolated-btn plans-isolated-btn-small plans-isolated-btn-secondary" onclick="event.stopPropagation(); editPlan('${plan.id}')">
                            👁️ Ver
                        </button>
                        <button class="plans-isolated-btn plans-isolated-btn-small plans-isolated-btn-primary" onclick="event.stopPropagation(); editPlan('${plan.id}')">
                            📝 Agenda
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        tableBody.innerHTML = html;
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
                    <td colspan="7" class="empty-state">
                        <div class="empty-icon">💰</div>
                        <h3>Nenhum plano encontrado</h3>
                        <p>Clique em "Novo Plano" para criar o primeiro plano.</p>
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
    
    window.initializePlansModule = initializePlansModule;
    
    // Auto-initialize if DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (document.querySelector('.plans-isolated')) {
                initializePlansModule();
            }
        });
    } else if (document.querySelector('.plans-isolated')) {
        initializePlansModule();
    }
    
    console.log('📊 Plans Module script loaded successfully');
    
})();