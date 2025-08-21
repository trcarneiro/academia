// Plans Module Patch - Direct DOM injection fix
(function() {
    'use strict';
    
    console.log('🔧 Plans Module Patch loading...');
    
    // Wait for Plans module to load
    function waitForPlansModule() {
        return new Promise((resolve) => {
            const checkModule = () => {
                if (window.PlansModule) {
                    resolve();
                } else {
                    setTimeout(checkModule, 100);
                }
            };
            checkModule();
        });
    }
    
    // Wait for element to exist
    function waitForElement(selector, maxAttempts = 20) {
        return new Promise((resolve) => {
            let attempts = 0;
            const checkElement = () => {
                const element = document.querySelector(selector);
                if (element) {
                    resolve(element);
                } else if (attempts < maxAttempts) {
                    attempts++;
                    setTimeout(checkElement, 250);
                } else {
                    resolve(null);
                }
            };
            checkElement();
        });
    }
    
    // Force plans data render
    async function forceRenderPlans() {
        console.log('🚀 Force rendering plans...');
        
        try {
            // Wait for table body
            const tableBody = await waitForElement('#plansTableBody');
            if (!tableBody) {
                console.log('❌ Table body still not found, creating manually...');
                await createPlansTable();
                return;
            }
            
            console.log('✅ Table body found, fetching data...');
            
            // Fetch data directly
            const response = await fetch('/api/billing-plans');
            const result = await response.json();
            
            if (result.success && result.data) {
                console.log('📊 Got plans data:', result.data.length);
                renderPlansDirectly(tableBody, result.data);
                updateStatsDirectly(result.data);
            }
            
        } catch (error) {
            console.error('❌ Force render error:', error);
        }
    }
    
    // Create plans table manually
    async function createPlansTable() {
        const container = document.querySelector('#plansContainer') || 
                         document.querySelector('.module-isolated-container') ||
                         document.querySelector('#module-container');
        
        if (!container) {
            console.log('❌ No container found for manual table creation');
            return;
        }
        
        container.innerHTML = `
            <header class="module-isolated-header">
                <h1 class="module-isolated-text-2xl module-isolated-font-bold module-isolated-text-primary module-isolated-mb-sm">
                    Gestão de Planos
                </h1>
                <p class="module-isolated-text-secondary">
                    Gerencie planos de treinamento, categorias e vinculações com alunos
                </p>
            </header>

            <div class="module-isolated-content">
                <div class="module-isolated-toolbar module-isolated-mb-lg">
                    <button class="module-isolated-btn-primary">
                        ➕ Novo Plano
                    </button>
                </div>

                <div class="module-isolated-grid module-isolated-mb-lg">
                    <div class="module-isolated-stat-card">
                        <div class="module-isolated-stat-number" id="totalPlans">0</div>
                        <div class="module-isolated-stat-label">Planos Cadastrados</div>
                    </div>
                    <div class="module-isolated-stat-card">
                        <div class="module-isolated-stat-number" id="activePlans">0</div>
                        <div class="module-isolated-stat-label">Planos Ativos</div>
                    </div>
                    <div class="module-isolated-stat-card">
                        <div class="module-isolated-stat-number" id="totalSubscribers">0</div>
                        <div class="module-isolated-stat-label">Alunos Vinculados</div>
                    </div>
                    <div class="module-isolated-stat-card">
                        <div class="module-isolated-stat-number" id="revenueTotal">R$ 0</div>
                        <div class="module-isolated-stat-label">Receita Estimada</div>
                    </div>
                </div>

                <div class="module-isolated-card">
                    <table class="module-isolated-table">
                        <thead>
                            <tr>
                                <th>Nome do Plano</th>
                                <th>Categoria</th>
                                <th>Agenda/Horários</th>
                                <th>Valor Mensal</th>
                                <th>Alunos</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody id="plansTableBody">
                            <tr>
                                <td colspan="7" style="text-align: center; padding: 20px;">
                                    Carregando planos...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        // Now force render
        setTimeout(forceRenderPlans, 500);
    }
    
    // Render plans directly to table
    function renderPlansDirectly(tableBody, plans) {
        console.log('🎨 Rendering plans directly...');
        
        if (!plans || plans.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 20px;">
                        Nenhum plano encontrado
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        plans.forEach(plan => {
            html += `
                <tr>
                    <td>
                        <div class="module-isolated-flex module-isolated-items-center module-isolated-gap-sm">
                            <span class="module-isolated-font-medium">${plan.name || 'Plano sem nome'}</span>
                        </div>
                    </td>
                    <td>
                        <span class="plans-status">${plan.category || 'ADULT'}</span>
                    </td>
                    <td>
                        <span class="module-isolated-text-sm module-isolated-text-secondary">
                            ${plan.classesPerWeek || 0} aulas/semana
                        </span>
                    </td>
                    <td>
                        <span class="plans-price">R$ ${parseFloat(plan.price || 0).toFixed(2)}</span>
                        <div class="module-isolated-text-xs module-isolated-text-muted">
                            ${plan.billingType || 'MONTHLY'}
                        </div>
                    </td>
                    <td>
                        <span class="plans-student-count">0</span>
                        <span class="module-isolated-text-sm module-isolated-text-muted">alunos</span>
                    </td>
                    <td>
                        <span class="module-isolated-status-${plan.isActive ? 'active' : 'inactive'}">
                            ${plan.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                    </td>
                    <td>
                        <div class="plans-actions">
                            <button class="plans-action-btn edit" title="Editar plano">✏️</button>
                            <button class="plans-action-btn" title="Ver detalhes">👁️</button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = html;
        console.log('✅ Plans rendered successfully');
    }
    
    // Update stats directly
    function updateStatsDirectly(plans) {
        const totalPlans = plans.length;
        const activePlans = plans.filter(p => p.isActive).length;
        const totalRevenue = plans.reduce((sum, p) => sum + (p.price || 0), 0);
        
        const totalElement = document.getElementById('totalPlans');
        const activeElement = document.getElementById('activePlans');
        const revenueElement = document.getElementById('revenueTotal');
        
        if (totalElement) totalElement.textContent = totalPlans;
        if (activeElement) activeElement.textContent = activePlans;
        if (revenueElement) revenueElement.textContent = `R$ ${totalRevenue.toFixed(2)}`;
        
        console.log('📊 Stats updated:', { totalPlans, activePlans, totalRevenue });
    }
    
    // Watch for navigation to plans
    function watchPlansNavigation() {
        // Watch for URL changes
        const currentPath = window.location.pathname || window.location.hash;
        if (currentPath.includes('plans') || currentPath.includes('planos')) {
            console.log('🎯 Detected navigation to Plans module');
            setTimeout(forceRenderPlans, 1000);
        }
        
        // Watch for navigation clicks
        document.addEventListener('click', function(e) {
            const link = e.target.closest('a[href*="plans"], [onclick*="plans"], [data-route*="plans"]');
            if (link) {
                console.log('🎯 Detected click on Plans navigation');
                setTimeout(forceRenderPlans, 1000);
            }
        });
    }
    
    // Initialize patch
    async function initPatch() {
        console.log('🔧 Initializing Plans Module Patch...');
        
        // Wait for Plans module
        await waitForPlansModule();
        console.log('✅ Plans module detected');
        
        // Watch for navigation
        watchPlansNavigation();
        
        // Try immediate render if we're already on plans page
        const currentPath = window.location.pathname || window.location.hash;
        if (currentPath.includes('plans') || currentPath.includes('planos')) {
            setTimeout(forceRenderPlans, 1500);
        }
        
        console.log('✅ Plans Module Patch initialized');
    }
    
    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPatch);
    } else {
        initPatch();
    }
    
    // Global access for manual testing
    window.debugPlansRender = forceRenderPlans;
    
})();
