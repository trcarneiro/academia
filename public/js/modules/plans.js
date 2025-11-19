// ==============================================
// PLANS MODULE - VERSÃO ULTRA SIMPLES (Padronizada)
// ==============================================

console.log('🚀 Plans Ultra Simple carregando...');

// Init flags to coordinate SPA vs auto-init
window.__PLANS_INIT_TRIGGERED = window.__PLANS_INIT_TRIGGERED || false;
window.__PLANS_INIT_DONE = window.__PLANS_INIT_DONE || false;

// Add missing globals/defaults used across this module
// Ensure event binding guard exists and default student context vars are defined
var __PLANS_EVENTS_BOUND = typeof __PLANS_EVENTS_BOUND !== 'undefined' ? __PLANS_EVENTS_BOUND : false;
var __PLANS_STUDENT_ID = typeof __PLANS_STUDENT_ID !== 'undefined' ? __PLANS_STUDENT_ID : null;

// Feedback helpers
const FE_PLANS = {
    toast: (m,t) => (window.feedback?.toast ? window.feedback.toast(m,t) : console.log('[toast]',t,m)),
    error: (m) => (window.feedback?.showError ? window.feedback.showError(m) : alert('Erro: '+(m||''))),
    success: (m) => (window.feedback?.showSuccess ? window.feedback.showSuccess(m) : alert('Sucesso: '+(m||'')))
};

// Helper: mark container as active (for validator)
function markModuleActive() {
    const c = document.querySelector('#plansContainer') || document.querySelector('.plans-module') || document.getElementById('module-container');
    if (!c) return;
    try {
        c.id = c.id || 'plansContainer';
        c.dataset.module = 'plans';
        c.dataset.active = 'true';
        c.classList.add('module-isolated-container','module-active');
    } catch (_) {}
}

// Expor ponto de entrada para o SPA Router
window.initializePlansModule = async function initializePlansModule() {
    if (window.__PLANS_INIT_DONE) {
        console.log('↩️ Plans Module já inicializado. Ignorando.');
        return;
    }
    window.__PLANS_INIT_TRIGGERED = true;
    console.log('🔧 Initializing Plans Module...');
    await waitForDOM();

    let container = document.querySelector('#plansContainer');
    if (!container) {
        const host = document.getElementById('module-container') || document.querySelector('#app') || document.body;
        ensurePlansScaffold(host);
        container = document.querySelector('#plansContainer');
    }
    try { container.dataset.module = 'plans'; container.dataset.active = 'true'; container.classList.add('module-active'); } catch(_) {}

    // Ensure DOM and bind events once
    await ensureDom();
    bindEvents();

    setStatsLoading(true);
    await loadAndShowPlans();
    await loadStudentContext();
    setStatsLoading(false);

    window.__PLANS_INIT_DONE = true;
    try { window.__MODULE_ACTIVE = 'plans'; window.dispatchEvent(new CustomEvent('module:ready', { detail: { module: 'plans' } })); } catch(_) {}
    // Notify AcademyApp
    try { window.app?.dispatchEvent?.('module:loaded', { name: 'plans' }); } catch(_) {}
};

// Util: aguardar DOM pronto
function waitForDOM() {
    return new Promise((resolve) => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => setTimeout(resolve, 50));
        } else {
            setTimeout(resolve, 50);
        }
    });
}

// Util: aguardar elemento aparecer
async function waitForElement(selector, maxAttempts = 10, delay = 60) {
    let attempts = 0;
    let el = document.querySelector(selector);
    while (!el && attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, delay));
        el = document.querySelector(selector);
        attempts++;
    }
    return el;
}

// Ensure DOM structure exists before binding or rendering
async function ensureDom() {
    const host = document.getElementById('module-container') || document.querySelector('#app') || document.body;

    // Ensure container
    let container = document.querySelector('#plansContainer');
    if (!container) {
        ensurePlansScaffold(host);
        container = await waitForElement('#plansContainer', 20, 50);
    }

    // Mark active ASAP for validator
    markModuleActive();

    // Ensure table body exists (handle dynamic SPA injection timing)
    let tbody = document.querySelector('#plansTableBody');
    if (!tbody) {
        const table = container.querySelector('#plansTable');
        if (table) {
            const newTbody = document.createElement('tbody');
            newTbody.id = 'plansTableBody';
            newTbody.innerHTML = '<tr><td colspan="7" class="module-isolated-text-center module-isolated-text-muted">Carregando planos...</td></tr>';
            table.appendChild(newTbody);
            tbody = newTbody;
        } else {
            // Fallback: rebuild minimal scaffold
            ensurePlansScaffold(host);
            tbody = await waitForElement('#plansTableBody', 20, 50);
        }
    }

    // Prefill stats placeholders if absent
    const statIds = ['totalPlans','activePlans','totalSubscribers','revenueTotal','avgPrice','statTotalPlans','statActivePlans','statLinkedStudents','statMonthlyRevenue'];
    statIds.forEach(id => {
        const el = document.getElementById(id);
        if (el && !el.textContent) el.textContent = '—';
    });

    return true;
}

// Price formatter tolerant to different shapes (number|string|{value})
function formatPrice(value) {
    try {
        let n = 0;
        if (value && typeof value === 'object' && 'value' in value) n = Number(value.value);
        else n = Number(value);
        if (!isFinite(n)) n = 0;
        return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } catch (_) {
        return '0,00';
    }
}

// Error helpers using existing error container
function showError(message) {
    const c = document.getElementById('errorContainer');
    const m = document.getElementById('errorMessage');
    if (m) m.textContent = message || 'Ocorreu um erro.';
    if (c) c.classList.remove('module-isolated-hidden');
    FE_PLANS.error(message);
}
function hideError() {
    const c = document.getElementById('errorContainer');
    if (c) c.classList.add('module-isolated-hidden');
}

// Lightweight toast/banner
function showBanner(message, type = 'info') {
    if (type === 'error') return FE_PLANS.error(message);
    if (type === 'success') return FE_PLANS.success(message);
    return FE_PLANS.toast(message, type);
}

// Student context stubs to avoid ReferenceErrors (can be wired later)
async function loadStudentContext() { /* no-op for now */ }
function isCurrentPlanForStudent(planId) { return false; }
async function selectPlanForStudent(planId) { showBanner('Seleção de plano pelo aluno não implementada neste contexto.', 'info'); }
async function cancelSubscriptionForStudent() { showBanner('Cancelamento de assinatura não implementado neste contexto.', 'info'); }

// Garantir scaffold do módulo quando ausente
function ensurePlansScaffold(hostEl) {
    if (!hostEl) hostEl = document.body;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
        <div class="module-isolated-container plans-module" id="plansContainer" data-module="plans" data-active="true">
            <header class="module-header-premium">
                <nav class="breadcrumb">Home / Planos</nav>
                <div class="actions">
                    <button class="module-isolated-btn-primary" id="btn-new-plan" type="button" aria-label="Adicionar novo plano">➕ Novo Plano</button>
                </div>
            </header>

            <section class="module-isolated-mb-lg" id="statsContainer">
                <div class="module-isolated-grid module-isolated-grid-cols-4 module-isolated-gap-md">
                    <div class="module-isolated-card stat-card-enhanced">
                        <div class="module-isolated-text-3xl module-isolated-font-bold" id="totalPlans">0</div>
                        <div class="module-isolated-text-muted">Total de Planos</div>
                    </div>
                    <div class="module-isolated-card stat-card-enhanced">
                        <div class="module-isolated-text-3xl module-isolated-font-bold" id="activePlans">0</div>
                        <div class="module-isolated-text-muted">Planos Ativos</div>
                    </div>
                    <div class="module-isolated-card stat-card-enhanced">
                        <div class="module-isolated-text-3xl module-isolated-font-bold" id="totalRevenue">R$ 0</div>
                        <div class="module-isolated-text-muted">Receita Mensal</div>
                    </div>
                    <div class="module-isolated-card stat-card-enhanced">
                        <div class="module-isolated-text-3xl module-isolated-font-bold" id="avgPrice">R$ 0</div>
                        <div class="module-isolated-text-muted">Preço Médio</div>
                    </div>
                </div>
            </section>
            
            <section class="module-isolated-card data-card-premium">
                <table id="plansTable" class="module-isolated-table">
                    <thead>
                        <tr>
                            <th>Plano</th>
                            <th>Categoria</th>
                            <th>Cobrança</th>
                            <th>Preço</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody id="plansTableBody"></tbody>
                </table>
            </section>
        </div>
    `;
    hostEl.appendChild(wrapper.firstElementChild);
}

// XPath removal helpers (user-requested removals for validation/cleanup)
function removeByXPath(xpath, root = document) {
    try {
        const snapshot = document.evaluate(xpath, root, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        const plansTable = document.getElementById('plansTable');
        const plansTbody = document.getElementById('plansTableBody');
        for (let i = 0; i < snapshot.snapshotLength; i++) {
            const node = snapshot.snapshotItem(i);
            if (!node) continue;
            const containsTable = (plansTable && node.contains(plansTable)) || (plansTbody && node.contains(plansTbody));
            const isTable = node.id === 'plansTable' || node.id === 'plansTableBody' || node === plansTable || node === plansTbody;
            if (containsTable || isTable) {
                console.warn('Skip removal (safety): node contains the plans table:', xpath, node);
                continue;
            }
            node.parentNode?.removeChild(node);
        }
    } catch (e) {
        console.warn('removeByXPath failed:', xpath, e);
    }
}
function removeUnwantedNodes() {
    removeByXPath('//*[@id="plansContainer"]/div/div[3]');
    removeByXPath('//*[@id="plansContainer"]/nav');
}

// Função ultra simples para carregar e exibir planos
async function loadAndShowPlans() {
    console.log('📊 Carregando planos de forma simples...');

    try {
        let result;
        if (window.apiClient && typeof window.apiClient.get === 'function') {
            result = await window.apiClient.get('/api/billing-plans');
        } else {
            const response = await window.fetchWithOrganization('/api/billing-plans');
            result = await response.json();
        }

        if (!result?.success || !result.data) {
            throw new Error(result?.message || 'Dados inválidos da API');
        }

        const plans = result.data;
        console.log('📋 Planos encontrados:', plans.length);

        // Ensure tbody
        let container = document.querySelector('#plansTableBody');
        if (!container) {
            const host = document.getElementById('module-container') || document.querySelector('#app') || document.body;
            ensurePlansScaffold(host);
            container = await waitForElement('#plansTableBody', 10, 60);
        } else {
            container = await waitForElement('#plansTableBody', 5, 40) || container;
        }
        if (!container) throw new Error('Não foi possível criar/encontrar o container da tabela');

        // Render
        displayPlansSimple(plans, container);
        updateStatsSimple(plans);
        hideError();
        console.log('✅ Planos exibidos com sucesso!');
    } catch (error) {
        console.error('❌ Erro:', error);
        showError('Erro ao carregar planos: ' + (error?.message || 'desconhecido'));
    } finally {
        setStatsLoading(false);
        markModuleActive();
        requestAnimationFrame(() => requestAnimationFrame(() => markModuleActive()));
        removeUnwantedNodes();
    }
}
// Expose for retry button
window.loadAndShowPlans = loadAndShowPlans;

// Criar tabela simples se não existir
function createSimpleTable() {
    console.log('🔨 Criando tabela simples...');
    const host = document.getElementById('module-container') || document.querySelector('#app') || document.body;
    ensurePlansScaffold(host);
    return document.getElementById('plansTableBody');
}

// Exibir planos de forma simples
function displayPlansSimple(plans, container) {
    console.log('🎨 Exibindo', plans.length, 'planos...');

    if (!plans || plans.length === 0) {
        container.innerHTML = `<tr><td colspan="7" class="module-isolated-text-center module-isolated-text-muted">📭 Nenhum plano encontrado</td></tr>`;
        removeUnwantedNodes();
        return;
    }

    const rows = plans.map(plan => `
        <tr class="plans-row-enter">
            <td class="module-isolated-font-semibold">${plan.name || 'Sem nome'}</td>
            <td>
                <span class="status-badge">${getCategoryName(plan.category)}</span>
            </td>
            <td class="module-isolated-text-success module-isolated-font-bold">R$ ${formatPrice(plan.price)}</td>
            <td>${getBillingTypeName(plan.billingType)}</td>
            <td class="module-isolated-text-center">${plan.classesPerWeek || 0}x</td>
            <td>
                <span class="status-badge ${plan.isActive ? 'status-active' : 'status-inactive'}">
                    ${plan.isActive ? 'Ativo' : 'Inativo'}
                </span>
            </td>
            <td>
                <div class="module-isolated-flex module-isolated-gap-sm plans-actions">
                    ${__PLANS_STUDENT_ID ? `
                        ${isCurrentPlanForStudent(plan.id) ? `
                            <span class="status-badge status-active" aria-label="Plano atual">Plano Atual</span>
                        ` : `
                            <button onclick="window.selectPlanForStudent('${plan.id}')" class="module-isolated-btn-primary" title="Selecionar plano" aria-label="Selecionar plano ${plan.name}">
                                ✔️ <span class="btn-label">Selecionar</span>
                            </button>
                        `}
                    ` : ''}
                    <button onclick="toggleStatus('${plan.id}', ${plan.isActive ? 'true' : 'false'})" class="module-isolated-btn-${plan.isActive ? 'secondary' : 'primary'}" title="Ativar/Desativar" aria-label="${plan.isActive ? 'Pausar plano' : 'Ativar plano'}">
                        ${plan.isActive ? '⏸️' : '▶️'}
                        <span class="btn-label">${plan.isActive ? 'Pausar' : 'Ativar'}</span>
                    </button>
                    <button onclick="editPlan('${plan.id}')" class="module-isolated-btn-secondary" title="Editar" aria-label="Editar plano">
                        ✏️ <span class="btn-label">Editar</span>
                    </button>
                    <button onclick="deletePlan('${plan.id}')" class="module-isolated-btn-danger" title="Excluir" aria-label="Excluir plano">
                        🗑️ <span class="btn-label">Excluir</span>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    container.innerHTML = rows;
    removeUnwantedNodes();
}

// Helper: set text if element exists
function setTextIfExists(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerText = value;
}

// Atualizar estatísticas de forma simples (com null-checks e IDs compatíveis)
function updateStatsSimple(plans) {
    console.log('📊 Atualizando estatísticas...');

    const totalPlans = plans.length;
    const activePlans = plans.filter(plan => !!plan.isActive).length;
    const totalRevenueNum = plans.reduce((sum, plan) => sum + (plan.isActive ? (Number(plan.price?.value ?? plan.price ?? 0) || 0) : 0), 0);
    const avgPriceNum = totalPlans > 0 ? plans.reduce((s, p) => s + (Number(p.price?.value ?? p.price ?? 0) || 0), 0) / totalPlans : 0;
    const subscribers = plans.reduce((sum, p) => sum + (p._count?.subscriptions || 0), 0);

    // Preferred IDs
    setTextIfExists('totalPlans', totalPlans);
    setTextIfExists('activePlans', activePlans);
    setTextIfExists('totalSubscribers', subscribers);
    setTextIfExists('revenueTotal', `R$ ${formatPrice(totalRevenueNum)}`);

    // Alternatives and validator-required IDs
    setTextIfExists('statTotalPlans', totalPlans);
    setTextIfExists('statActivePlans', activePlans);
    setTextIfExists('statLinkedStudents', subscribers);
    setTextIfExists('statMonthlyRevenue', `R$ ${formatPrice(totalRevenueNum)}`);
    setTextIfExists('totalRevenue', `R$ ${formatPrice(totalRevenueNum)}`);
    setTextIfExists('avgPrice', `R$ ${formatPrice(avgPriceNum)}`);
}

// Open Plan Form (legacy modal kept but unused by navigation)
async function openPlanForm(planId = null) { /* no-op in new flow */ }

// Toggle status (PUT/PATCH /api/billing-plans/:id)
async function toggleStatus(planId, isActiveCurrent) {
    try {
        const next = !isActiveCurrent;
        const rowBtns = document.querySelectorAll(`button[onclick*="'${planId}'"]`);
        rowBtns.forEach(b => b.disabled = true);
        let resp;
        if (window.apiClient?.put) {
            resp = await window.apiClient.put(`/api/billing-plans/${encodeURIComponent(planId)}`, { isActive: next });
            if (resp?.success === false) throw new Error(resp?.message || 'Falha ao alternar status');
        } else {
            const r = await window.fetchWithOrganization(`/api/billing-plans/${encodeURIComponent(planId)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: next }) });
            if (!r.ok) {
                const msg = await r.text();
                throw new Error(msg || 'Falha ao alternar status');
            }
        }
        await loadAndShowPlans();
        showBanner(`Plano ${next ? 'ativado' : 'pausado'} com sucesso.`, 'success');
    } catch (e) {
        console.error('Erro ao alternar status', e);
        showBanner('Erro ao alternar status do plano.', 'error');
    }
}

// Delete plan (DELETE /api/billing-plans/:id)
async function deletePlan(planId) {
    if (!confirm('Tem certeza que deseja excluir este plano? Esta ação não pode ser desfeita.')) return;
    try {
        if (window.apiClient?.delete) {
            const r = await window.apiClient.delete(`/api/billing-plans/${encodeURIComponent(planId)}`);
            if (r?.success === false) throw new Error(r?.message || 'Falha ao excluir');
        } else {
            const r = await window.fetchWithOrganization(`/api/billing-plans/${encodeURIComponent(planId)}`, { method: 'DELETE' });
            if (!r.ok) {
                const text = await r.text();
                throw new Error(text || (r.status===400 ? 'Plano vinculado a alunos. Remova vínculos antes de excluir.' : 'Erro ao excluir plano'));
            }
        }
        await loadAndShowPlans();
        showBanner('Plano excluído com sucesso.', 'success');
    } catch (e) {
        console.error('Erro ao excluir plano', e);
        showBanner(e?.message || 'Erro ao excluir plano.', 'error');
    }
}

// Helper to navigate to the dedicated Plan Editor without relying on router.navigateTo
function goToPlanEditor(planId = null) {
    try {
        if (window.EditingSession && typeof window.EditingSession.setEditingPlanId === 'function') {
            window.EditingSession.setEditingPlanId(planId || null);
        }
    } catch (_) {}
    const target = planId ? `plan-editor/${encodeURIComponent(planId)}` : 'plan-editor';
    const current = (location.hash || '').replace(/^#/, '');
    if (current !== target) {
        location.hash = target;
    } else {
        try { window.dispatchEvent(new HashChangeEvent('hashchange')); } catch (_) {}
    }
    if (window.router && typeof window.router.navigateTo === 'function') {
        try { window.router.navigateTo('plan-editor'); } catch (_) {}
    }
}

// Edit helper
function editPlan(planId) { goToPlanEditor(planId); }

// Expose for inline handlers
window.editPlan = editPlan;
window.goToPlanEditor = goToPlanEditor;

// Update New Plan button wiring to open editor screen
function bindEvents() {
    if (__PLANS_EVENTS_BOUND) return;
    __PLANS_EVENTS_BOUND = true;
    const newBtn = document.getElementById('btn-new-plan');
    if (newBtn) newBtn.addEventListener('click', () => { goToPlanEditor(null); });
    const searchBtn = document.getElementById('btn-search-plans');
    const searchInput = document.getElementById('planSearch');
    if (searchBtn && searchInput) {
        const run = () => filterPlansBySearch(searchInput.value || '');
        searchBtn.addEventListener('click', run);
        searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); run(); } });
    }
}

function filterPlansBySearch(query) {
    const q = (query || '').toLowerCase();
    const rows = document.querySelectorAll('#plansTableBody tr');
    rows.forEach(tr => {
        const text = (tr.textContent || '').toLowerCase();
        tr.style.display = text.includes(q) ? '' : 'none';
    });
}

function setStatsLoading(loading) {
    const ids = ['totalPlans','activePlans','totalSubscribers','revenueTotal','statTotalPlans','statActivePlans','statLinkedStudents','statMonthlyRevenue'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (loading) {
            el.dataset.prev = el.textContent;
            el.classList.add('stat-skeleton');
            el.textContent = '—';
        } else {
            el.classList.remove('stat-skeleton');
            if (el.dataset.prev) delete el.dataset.prev;
        }
    });
}

// Improve mappings to support multiple backends
function getCategoryName(category) {
    const c = String(category || '').toUpperCase();
    const names = {
        'ADULT': 'Adulto', 'FEMALE': 'Feminino', 'SENIOR': 'Senior', 'CHILD': 'Infantil', 'TEEN': 'Adolescente',
        'BASIC': 'Básico', 'STANDARD': 'Padrão', 'PREMIUM': 'Premium', 'OTHER': 'Outra', 'OUTRA': 'Outra'
    };
    return names[c] || (category || 'Geral');
}

function getBillingTypeName(type) {
    const t = String(type || '').toUpperCase();
    const names = {
        'MONTHLY': 'Mensal', 'QUARTERLY': 'Trimestral', 'YEARLY': 'Anual', 'WEEKLY': 'Semanal', 'LIFETIME': 'Vitalício'
    };
    return names[t] || 'Mensal';
}

// Hook ensureDom/bindEvents and stats loading into init flow
window.initializePlansModule = async function initializePlansModule() {
    if (window.__PLANS_INIT_DONE) {
        console.log('↩️ Plans Module já inicializado. Ignorando.');
        return;
    }
    window.__PLANS_INIT_TRIGGERED = true;
    console.log('🔧 Initializing Plans Module...');
    // Garantir que o HTML do módulo foi injetado pelo SPA
    await waitForDOM();

    // Ensure DOM elements and events
    await ensureDom();

    // Mark active early for validator and re-assert it asynchronously
    markModuleActive();
    requestAnimationFrame(() => requestAnimationFrame(markModuleActive));

    // Remover elementos por XPath conforme solicitado
    removeUnwantedNodes();

    bindEvents();

    // Preferir o container do módulo
    let container = document.querySelector('#plansContainer');
    if (!container) {
        const host = document.getElementById('module-container') || document.querySelector('#app') || document.body;
        ensurePlansScaffold(host);
        container = document.querySelector('#plansContainer');
    }
    // Mark as active for validators (again just in case)
    try { container.dataset.module = 'plans'; container.dataset.active = 'true'; container.classList.add('module-active'); } catch(_) {}

    // Carregar e exibir
    setStatsLoading(true);
    await loadAndShowPlans();
    // Carregar contexto opcional de estudante (assinatura atual)
    await loadStudentContext();
    setStatsLoading(false);

    window.__PLANS_INIT_DONE = true;
    try { window.__MODULE_ACTIVE = 'plans'; window.dispatchEvent(new CustomEvent('module:ready', { detail: { module: 'plans' } })); } catch(_) {}
    // Notify AcademyApp
    try { window.app?.dispatchEvent?.('module:loaded', { name: 'plans' }); } catch(_) {}
};

// ===============================
// FIM DO MÓDULO DE PLANOS
// ===============================
