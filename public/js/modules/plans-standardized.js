/**
 * PLANS MODULE - Padronizado
 * Sistema modular seguindo CLAUDE.md
 */

(function() {
    'use strict';

    // Module state
    let currentPlans = [];
    let isLoading = false;
    let stats = {
        active: 0,
        totalRevenue: 0,
        avgValue: 0,
        modalities: 0
    };

    // Initialize module
    async function initializePlans() {
        console.log('🔧 Initializing Plans module...');
        
        try {
            // Setup event listeners
            setupEventListeners();
            
            // Load initial data
            await loadPlansData();
            
            console.log('✅ Plans module initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing plans module:', error);
            showError('Erro ao inicializar módulo de planos: ' + error.message);
        }
    }

    // Load plans data from API
    async function loadPlansData() {
        try {
            setLoading(true);
            
            const response = await fetch('/api/billing-plans');
            const result = await response.json();
            
            if (result.success) {
                currentPlans = result.data || [];
                
                // Update statistics
                updateStats(currentPlans);
                
                // Render table
                renderPlansTable(currentPlans);
                
                console.log('📊 Loaded', currentPlans.length, 'plans');
            } else {
                throw new Error(result.message || 'Failed to load plans data');
            }
        } catch (error) {
            console.error('❌ Error loading plans data:', error);
            showError('Erro ao carregar dados dos planos: ' + error.message);
            
            // Show empty state on error
            showEmptyState('Erro ao carregar planos');
        } finally {
            setLoading(false);
        }
    }

    // Update statistics display
    function updateStats(plans) {
        const activePlans = plans.filter(p => p.isActive !== false);
        
        stats.active = activePlans.length;
        stats.totalRevenue = activePlans.reduce((sum, plan) => sum + (plan.price || 0), 0);
        stats.avgValue = activePlans.length > 0 ? stats.totalRevenue / activePlans.length : 0;
        stats.modalities = new Set(activePlans.map(p => p.category).filter(Boolean)).size;
        
        // Update DOM
        updateElement('activePlansCount', stats.active);
        updateElement('totalRevenue', formatCurrency(stats.totalRevenue));
        updateElement('avgPlanValue', formatCurrency(stats.avgValue));
        updateElement('modalitiesCount', stats.modalities);
        
        console.log('📈 Stats updated:', stats);
    }

    // Render plans table
    function renderPlansTable(plans) {
        const tbody = document.getElementById('plansTableBody');
        if (!tbody) return;
        
        if (plans.length === 0) {
            showEmptyState();
            return;
        }
        
        tbody.innerHTML = plans.map(plan => `
            <tr>
                <td>
                    <div class="plans-isolated-plan-info">
                        <div class="plan-identification-letter">
                            ${getPlanLetter(plan.name)}
                        </div>
                        <div class="plan-name">${escapeHtml(plan.name)}</div>
                    </div>
                </td>
                <td>${getPlanModalities(plan)}</td>
                <td>${getBillingSchedule(plan.billingType)}</td>
                <td class="plan-price">${formatCurrency(plan.price)}</td>
                <td>
                    <span class="module-isolated-badge ${getPlanStatusBadge(plan)}">
                        ${getPlanStatus(plan)}
                    </span>
                </td>
                <td>
                    <button class="module-isolated-btn module-isolated-btn-primary module-isolated-btn-sm" 
                            onclick="editPlan('${plan.id}')">
                        Editar
                    </button>
                    <button class="module-isolated-btn module-isolated-btn-secondary module-isolated-btn-sm" 
                            onclick="duplicatePlan('${plan.id}')">
                        Duplicar
                    </button>
                </td>
            </tr>
        `).join('');
        
        console.log('🗃️ Table rendered with', plans.length, 'plans');
    }

    // Setup event listeners
    function setupEventListeners() {
        // New plan button
        const newPlanBtn = document.querySelector('[data-action="openNewPlanForm"]');
        if (newPlanBtn) {
            newPlanBtn.addEventListener('click', openNewPlanForm);
        }
        
        // Filter button
        const filterBtn = document.querySelector('[data-action="openFilters"]') || 
                          document.querySelector('button:contains("🔍")');
        if (filterBtn) {
            filterBtn.addEventListener('click', openFilters);
        }
        
        // Report button
        const reportBtn = document.querySelector('[data-action="openReport"]') || 
                          document.querySelector('button:contains("📊")');
        if (reportBtn) {
            reportBtn.addEventListener('click', openReport);
        }
        
        console.log('🎯 Event listeners setup completed');
    }

    // Utility functions
    function setLoading(loading) {
        isLoading = loading;
        
        const tbody = document.getElementById('plansTableBody');
        if (tbody) {
            if (loading) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="module-isolated-loading">
                            <div>⏳ Carregando planos...</div>
                        </td>
                    </tr>
                `;
            }
        }
    }

    function showEmptyState(message = 'Nenhum plano encontrado') {
        const tbody = document.getElementById('plansTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6">
                        <div class="module-isolated-empty-state">
                            <div class="empty-state-icon">💰</div>
                            <div>${message}</div>
                            <button class="module-isolated-btn module-isolated-btn-primary" 
                                    onclick="openNewPlanForm()" 
                                    style="margin-top: 1rem;">
                                Criar Primeiro Plano
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }
    }

    function updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    // Helper functions
    function getPlanLetter(name) {
        return name ? name.charAt(0).toUpperCase() : 'P';
    }

    function getPlanModalities(plan) {
        if (plan.modalities && plan.modalities.length > 0) {
            return plan.modalities.join(', ');
        }
        return plan.category || 'Geral';
    }

    function getBillingSchedule(billingType) {
        const schedules = {
            'monthly': 'Mensal',
            'quarterly': 'Trimestral',
            'semiannual': 'Semestral',
            'annual': 'Anual'
        };
        return schedules[billingType] || 'Mensal';
    }

    function getPlanStatus(plan) {
        if (plan.isActive === false) return 'Inativo';
        return 'Ativo';
    }

    function getPlanStatusBadge(plan) {
        if (plan.isActive === false) return 'module-isolated-badge-danger';
        return 'module-isolated-badge-success';
    }

    function formatCurrency(value) {
        if (typeof value !== 'number') return 'R$ 0,00';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function showError(message) {
        console.error('❌ Plans Error:', message);
        // You can integrate with your toast system here
        if (typeof showToast === 'function') {
            showToast(message, 'error');
        } else {
            alert('Erro: ' + message);
        }
    }

    function showSuccess(message) {
        console.log('✅ Plans Success:', message);
        if (typeof showToast === 'function') {
            showToast(message, 'success');
        } else {
            alert('Sucesso: ' + message);
        }
    }

    // Action functions
    function openNewPlanForm() {
        console.log('➕ Opening new plan form');
        if (typeof window.navigateToModule === 'function') {
            window.navigateToModule('plan-editor');
        } else {
            window.location.href = '/views/plan-editor.html';
        }
    }

    function openFilters() {
        console.log('🔍 Opening filters');
        // Implement filters functionality
        showSuccess('Filtros em desenvolvimento');
    }

    function openReport() {
        console.log('📊 Opening reports');
        // Implement reports functionality
        showSuccess('Relatórios em desenvolvimento');
    }

    // Global action functions
    window.editPlan = function(planId) {
        console.log('✏️ Editing plan:', planId);
        if (window.EditingSession && window.EditingSession.setEditingPlanId) window.EditingSession.setEditingPlanId(planId);
        if (typeof window.navigateToModule === 'function') {
            window.navigateToModule('plan-editor');
        } else {
            window.location.href = `/views/plan-editor.html?id=${planId}`;
        }
    };

    window.duplicatePlan = function(planId) {
        console.log('📋 Duplicating plan:', planId);
        // Implement duplication logic
        showSuccess('Duplicação em desenvolvimento');
    };

    window.deletePlan = function(planId) {
        console.log('🗑️ Deleting plan:', planId);
        if (confirm('Tem certeza que deseja excluir este plano?')) {
            // Implement deletion logic
            showSuccess('Exclusão em desenvolvimento');
        }
    };

    // Refresh function for external calls
    window.refreshPlans = function() {
        console.log('🔄 Refreshing plans data');
        loadPlansData();
    };

    // Export initialization function
    window.initializePlans = initializePlans;

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializePlans);
    } else {
        initializePlans();
    }

    console.log('📝 Plans module script loaded (standardized)');

})();
