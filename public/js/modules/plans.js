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
            sessionStorage.removeItem('editingPlanId');
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
        if (typeof window.navigateToModule === 'function') {
            sessionStorage.setItem('editingPlanId', planId);
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
        
        try {
            showLoadingState();
            
            const response = await fetch('/api/billing-plans');
            const result = await response.json();
            
            if (result.success && result.data) {
                allPlans = result.data;
                filteredPlans = [...allPlans];
                
                console.log('✅ Plans loaded:', allPlans.length);
                
                updateStats();
                renderPlans();
                
            } else {
                throw new Error(result.message || 'Erro ao carregar planos');
            }
            
        } catch (error) {
            console.error('❌ Error loading plans:', error);
            showError('Erro ao carregar planos. Tente novamente.');
            showEmptyState();
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
        const container = findModuleElement('plansContainer', true);
        if (!container) {
            // Container not present (likely navigated away). Silently skip.
            return;
        }
        
        if (filteredPlans.length === 0) {
            showEmptyState();
            return;
        }
        
        if (currentView === 'grid') {
            renderGridView(container);
        } else {
            renderTableView(container);
        }
    }
    
    function renderGridView(container) {
        const html = `
            <div class="plans-grid">
                ${filteredPlans.map(plan => `
                    <div class="plan-card" onclick="editPlan('${plan.id}')" title="Clique para editar">
                        <div class="plan-header">
                            <div class="plan-title">
                                <span class="plan-icon">${CATEGORIES[plan.category]?.icon || '💰'}</span>
                                <h3>${plan.name || 'Plano sem nome'}</h3>
                            </div>
                            <div class="plan-status ${plan.isActive ? 'active' : 'inactive'}">
                                ${plan.isActive ? '✅' : '⏸️'}
                            </div>
                        </div>
                        <div class="plan-info">
                            <div class="plan-price">
                                ${formatCurrency(plan.price)}
                                <span class="billing-type">
                                    ${BILLING_TYPES[plan.billingType]?.icon || '💳'} 
                                    ${BILLING_TYPES[plan.billingType]?.label || plan.billingType}
                                </span>
                            </div>
                            <div class="plan-details">
                                <div class="detail-item">
                                    <span class="detail-label">Categoria:</span>
                                    <span class="detail-value">
                                        ${CATEGORIES[plan.category]?.icon || ''} 
                                        ${CATEGORIES[plan.category]?.label || plan.category}
                                    </span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Aulas/Semana:</span>
                                    <span class="detail-value">${plan.classesPerWeek || 0}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Assinantes:</span>
                                    <span class="detail-value">${plan.subscriberCount || 0}</span>
                                </div>
                            </div>
                            ${plan.description ? `
                                <div class="plan-description">
                                    ${plan.description}
                                </div>
                            ` : ''}
                            ${plan.informacoes_gerais ? `
                                <div class="plan-extra">
                                    <strong>Informações Gerais:</strong><br>
                                    <span><b>Título:</b> ${plan.informacoes_gerais.titulo || ''}</span><br>
                                    <span><b>Público-alvo:</b> ${plan.informacoes_gerais.publico_alvo || ''}</span><br>
                                    <span><b>Duração:</b> ${plan.informacoes_gerais.duracao || ''}</span><br>
                                    <span><b>Missão:</b> ${plan.informacoes_gerais.missao || ''}</span><br>
                                    <span><b>Visão:</b> ${plan.informacoes_gerais.visao || ''}</span>
                                </div>
                            ` : ''}
                            ${plan.objetivos ? `
                                <div class="plan-extra">
                                    <strong>Objetivos:</strong><br>
                                    <span><b>Geral:</b> ${plan.objetivos.geral || ''}</span><br>
                                    <span><b>Específicos:</b> ${(plan.objetivos.especificos || []).join('<br>')}</span>
                                </div>
                            ` : ''}
                            ${plan.estrutura_do_curso ? `
                                <div class="plan-extra">
                                    <strong>Estrutura do Curso:</strong><br>
                                    <span><b>Unidades:</b> ${(plan.estrutura_do_curso.unidades || []).join(', ')}</span><br>
                                    <span><b>Número de Técnicas:</b> ${plan.estrutura_do_curso.numero_de_tecnicas || ''}</span><br>
                                    <span><b>Níveis:</b> ${Object.values(plan.estrutura_do_curso.niveis || {}).join('<br>')}</span><br>
                                    <span><b>Blocos:</b> ${plan.estrutura_do_curso.blocos || ''}</span><br>
                                    <span><b>Categorias:</b> ${(plan.estrutura_do_curso.categorias || []).join(', ')}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        container.innerHTML = html;
    }
    
    function renderTableView(container) {
        const html = `
            <div class="plans-table-container">
                <table class="plans-table">
                    <thead>
                        <tr>
                            <th>Plano</th>
                            <th>Categoria</th>
                            <th>Valor</th>
                            <th>Tipo</th>
                            <th>Aulas/Sem</th>
                            <th>Assinantes</th>
                            <th>Status</th>
                            <th>Extras</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredPlans.map(plan => `
                            <tr onclick="editPlan('${plan.id}')" style="cursor: pointer;" title="Clique para editar">
                                <td>
                                    <div class="plan-name-cell">
                                        <span class="plan-icon">${CATEGORIES[plan.category]?.icon || '💰'}</span>
                                        <div>
                                            <strong>${plan.name || 'Plano sem nome'}</strong>
                                            ${plan.description ? `<br><small>${plan.description}</small>` : ''}
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span class="category-badge">
                                        ${CATEGORIES[plan.category]?.icon || ''} 
                                        ${CATEGORIES[plan.category]?.label || plan.category}
                                    </span>
                                </td>
                                <td class="price-cell">${formatCurrency(plan.price)}</td>
                                <td>
                                    <span class="billing-badge">
                                        ${BILLING_TYPES[plan.billingType]?.icon || '💳'} 
                                        ${BILLING_TYPES[plan.billingType]?.label || plan.billingType}
                                    </span>
                                </td>
                                <td class="center">${plan.classesPerWeek || 0}</td>
                                <td class="center">${plan.subscriberCount || 0}</td>
                                <td>
                                    <span class="status-badge ${plan.isActive ? 'active' : 'inactive'}">
                                        ${plan.isActive ? '✅ Ativo' : '⏸️ Inativo'}
                                    </span>
                                </td>
                                <td>
                                    ${plan.informacoes_gerais ? `<span><b>Informações Gerais:</b> ${plan.informacoes_gerais.titulo || ''}, ${plan.informacoes_gerais.publico_alvo || ''}</span><br>` : ''}
                                    ${plan.objetivos ? `<span><b>Objetivos:</b> ${plan.objetivos.geral || ''}</span><br>` : ''}
                                    ${plan.estrutura_do_curso ? `<span><b>Estrutura:</b> ${plan.estrutura_do_curso.unidades ? plan.estrutura_do_curso.unidades.join(', ') : ''}</span>` : ''}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        container.innerHTML = html;
    }
    
    // ==============================================
    // UI STATES
    // ==============================================
    
    function showLoadingState() {
        const container = findModuleElement('plansContainer', true);
        if (container) {
            container.innerHTML = `
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Carregando planos...</p>
                </div>
            `;
        }
    }
    
    function showEmptyState() {
        const container = findModuleElement('plansContainer', true);
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">💰</div>
                    <h3>Nenhum plano encontrado</h3>
                    <p>Clique em "Novo Plano" para criar o primeiro plano ou ajuste os filtros.</p>
                    <button class="btn btn-primary" onclick="openNewPlanForm()">
                        ➕ Criar Primeiro Plano
                    </button>
                </div>
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