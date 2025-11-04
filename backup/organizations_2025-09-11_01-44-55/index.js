// Organizations Module - Entry Point
console.log('🏫 Organizations Module Loading...');

let organizationsAPI = null;
let isInitializing = false;
let isInitialized = false;

async function resolveContainer(container) {
    // Prefer provided container; otherwise try common app containers, waiting briefly
    if (container instanceof HTMLElement) return container;
    const selectors = ['#main-content', '.main-content', '#content', '#app-content'];
    let attempts = 0;
    while (attempts < 30) { // up to ~3s
        for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (el) return el;
        }
        await new Promise(r => setTimeout(r, 100));
        attempts++;
    }
    return null;
}

async function initializeOrganizations(container) {
    // Prevent multiple simultaneous initializations
    if (isInitialized) {
        console.log('[Organizations] Already initialized, skipping...');
        return;
    }
    
    if (isInitializing) {
        console.log('[Organizations] Initialization in progress, waiting...');
        let attempts = 0;
        while (isInitializing && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        if (attempts >= 50) {
            console.warn('[Organizations] Initialization timeout, forcing new initialization...');
            isInitializing = false;
        } else if (isInitialized) {
            return;
        }
    }
    
    isInitializing = true;
    
    try {
        // Wait for API client
        while (!window.createModuleAPI) {
            console.log('[Organizations] Waiting for API client...');
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        organizationsAPI = window.createModuleAPI('Organizations');
        console.log('[Organizations] API initialized');

        // Resolve target container (router may mount late)
        const target = await resolveContainer(container);
        console.log('[Organizations] Container resolved:', !!target);

        // Load CSS
        if (!document.querySelector('link[href*="organizations.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = '/css/modules/organizations/organizations.css';
            document.head.appendChild(link);
        }

        // Load organizations data
        await loadOrganizations(target);

        // Integrate with app
        if (window.app) {
            window.app.dispatchEvent('module:loaded', { name: 'organizations' });
        }
        
        isInitialized = true;
        isInitializing = false;
        window.organizationsModuleInitialized = true;

    } catch (error) {
        isInitializing = false;
        console.error('[Organizations] Initialization error:', error);
        if (window.app) {
            window.app.handleError(error, 'Organizations:initialization');
        }
    }
}

async function loadOrganizations(container) {
    // Use provided container or fallback to main-content
    const targetContainer = container || document.getElementById('main-content') || document.querySelector('.main-content') || document.getElementById('content');
    if (!targetContainer) {
        console.error('[Organizations] Container not found');
        return;
    }

    try {
        await organizationsAPI.fetchWithStates('/api/organizations', {
            loadingElement: targetContainer,
            targetElement: targetContainer,
            onSuccess: (organizations) => {
                const list = Array.isArray(organizations) ? organizations : [];
                targetContainer.innerHTML = renderOrganizationsList(list);
                setupEventListeners();
            },
            onEmpty: () => {
                targetContainer.innerHTML = renderOrganizationsList([]) + renderEmptyState();
                setupEventListeners();
            },
            onError: (error) => {
                console.error('[Organizations] Error loading:', error);
                targetContainer.innerHTML = renderErrorState(error?.message || 'Falha ao carregar');
                if (window.app) {
                    window.app.handleError(error, 'Organizations:load');
                }
            }
        });

    } catch (error) {
        console.error('[Organizations] Error loading:', error);
        targetContainer.innerHTML = renderErrorState(error.message);
        if (window.app) {
            window.app.handleError(error, 'Organizations:load');
        }
    }
}

function renderOrganizationsList(organizations) {
    const stats = calculateStats(organizations);
    
    return `
        <div class="module-isolated-organizations">
            <div class="module-header-premium">
                <div class="header-content">
                    <nav class="breadcrumb-premium">
                        <span class="breadcrumb-item">🏠 Academia</span>
                        <span class="breadcrumb-separator">›</span>
                        <span class="breadcrumb-item active">🏫 Organizações</span>
                    </nav>
                    <div class="title-section">
                        <h1>🏫 Organizações</h1>
                        <p class="subtitle">Gerenciamento de organizações/academias</p>
                    </div>
                    <div class="header-actions">
                        <button class="btn-primary-premium" data-action="create-organization">
                            ➕ Nova Organização
                        </button>
                    </div>
                </div>
            </div>

            <div class="module-stats-premium">
                <div class="stat-card-enhanced">
                    <div class="stat-icon">🏫</div>
                    <div class="stat-content">
                        <div class="stat-number">${stats.total}</div>
                        <div class="stat-label">Total Organizações</div>
                    </div>
                </div>
                <div class="stat-card-enhanced">
                    <div class="stat-icon">✅</div>
                    <div class="stat-content">
                        <div class="stat-number">${stats.active}</div>
                        <div class="stat-label">Organizações Ativas</div>
                    </div>
                </div>
                <div class="stat-card-enhanced">
                    <div class="stat-icon">🏢</div>
                    <div class="stat-content">
                        <div class="stat-number">${stats.totalUnits}</div>
                        <div class="stat-label">Total de Unidades</div>
                    </div>
                </div>
                <div class="stat-card-enhanced">
                    <div class="stat-icon">🌆</div>
                    <div class="stat-content">
                        <div class="stat-number">${stats.cities}</div>
                        <div class="stat-label">Cidades</div>
                    </div>
                </div>
            </div>

            <div class="data-card-premium">
                <div class="table-container">
                    <table class="data-table-premium">
                        <thead>
                            <tr>
                                <th>🏫 Nome</th>
                                <th>🌐 Slug</th>
                                <th>🌆 Localização</th>
                                <th>🏢 Unidades</th>
                                <th>📊 Status</th>
                                <th>⚙️ Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${renderOrganizationsRows(organizations)}
                        </tbody>
                    </table>
                </div>
            </div>

            ${organizations.length === 0 ? renderEmptyState() : ''}
        </div>
    `;
}

function renderOrganizationsRows(organizations) {
    if (!organizations || organizations.length === 0) {
        return '<tr><td colspan="6" class="text-center">Nenhuma organização encontrada</td></tr>';
    }

    return organizations.map(org => `
    <tr class="table-row-interactive" data-action="view-organization" data-id="${org.id}">
            <td>
                <div class="organization-info">
                    <strong>${org.name}</strong>
                    ${org.description ? `<small>${org.description}</small>` : ''}
                </div>
            </td>
            <td>
                <code class="slug-code">${org.slug}</code>
            </td>
            <td>
                <div class="location-info">
                    ${org.city ? `${org.city}` : 'Não informado'}
                    ${org.state ? `/${org.state}` : ''}
                </div>
            </td>
            <td>
                <span class="count-badge">${org._count?.units || 0} unidades</span>
            </td>
            <td>
                <span class="status ${org.isActive ? 'status-active' : 'status-inactive'}">
                    ${org.isActive ? '✅ Ativa' : '❌ Inativa'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
            <button class="btn-icon" data-action="edit-organization" data-id="${org.id}" title="Editar">
                        ✏️
                    </button>
            <button class="btn-icon" data-action="view-units" data-id="${org.id}" title="Ver Unidades">
                        🏢
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function calculateStats(organizations) {
    return {
        total: organizations.length,
        active: organizations.filter(org => org.isActive).length,
        totalUnits: organizations.reduce((sum, org) => sum + (org._count?.units || 0), 0),
        cities: new Set(organizations.map(org => org.city).filter(Boolean)).size
    };
}

function renderLoadingState() {
    return `
        <div class="loading-state-premium">
            <div class="loading-spinner"></div>
            <p>Carregando organizações...</p>
        </div>
    `;
}

function renderErrorState(message) {
    return `
        <div class="error-state-premium">
            <div class="error-icon">❌</div>
            <h3>Erro ao carregar organizações</h3>
            <p>${message}</p>
            <button class="btn-action-primary" data-action="reload-organizations">
                🔄 Tentar novamente
            </button>
        </div>
    `;
}

function renderEmptyState() {
    return `
        <div class="empty-state-premium">
            <div class="empty-state-icon">🏫</div>
            <h3>Nenhuma organização cadastrada</h3>
            <p>Comece criando a primeira organização para gerenciar suas academias</p>
            <button class="btn-action-primary" data-action="create-organization">
                ➕ Criar primeira organização
            </button>
        </div>
    `;
}

function setupEventListeners() {
    const root = document.querySelector('.module-isolated-organizations');
    if (!root) return;

    // Delegated click handling
    root.addEventListener('click', (e) => {
        const actionEl = e.target.closest('[data-action]');
        if (!actionEl) return;
        const action = actionEl.dataset.action;
        const id = actionEl.dataset.id || actionEl.closest('tr')?.dataset.id;

        switch (action) {
            case 'create-organization':
                createNewOrganization();
                break;
            case 'edit-organization':
                if (id) editOrganization(id);
                break;
            case 'view-organization':
                if (id) viewOrganization(id);
                break;
            case 'view-units':
                if (id) viewUnits(id);
                break;
            case 'reload-organizations':
                loadOrganizations(root.closest('#main-content, .main-content, #content') || document.body);
                break;
        }
    });

    // Optional: double-click row to edit
    root.addEventListener('dblclick', (e) => {
        const row = e.target.closest('tr[data-id]');
        if (!row) return;
        const id = row.dataset.id;
        if (id) editOrganization(id);
    });
}

// Action functions
function createNewOrganization() {
    console.log('[Organizations] Creating new organization...');
    const target = document.querySelector('#main-content, .main-content, #content, #module-container') || document.body;
    openOrganizationEditor(null, target);
}

function editOrganization(id) {
    console.log('[Organizations] Editing organization:', id);
    const target = document.querySelector('#main-content, .main-content, #content, #module-container') || document.body;
    openOrganizationEditor(id, target);
}

function viewOrganization(id) {
    console.log('[Organizations] Viewing organization:', id);
    // Implementar visualização
}

function viewUnits(organizationId) {
    console.log('[Organizations] Viewing units for organization:', organizationId);
    // Navegar para units filtrado por organização
    if (window.router && typeof window.router.navigateTo === 'function') {
        window.router.navigateTo(`#/units?organization=${organizationId}`);
    } else {
        window.location.hash = `#/units?organization=${organizationId}`;
    }
}

// Expose action functions globally for inline onclick compatibility
window.createNewOrganization = createNewOrganization;
window.editOrganization = editOrganization;
window.viewOrganization = viewOrganization;
window.viewUnits = viewUnits;

// ---------- Editor (full-screen) ----------
function openOrganizationEditor(id = null, container) {
    const target = container || document.getElementById('main-content') || document.querySelector('.main-content') || document.getElementById('content');
    if (!target) {
        console.error('[Organizations] Editor container not found');
        return;
    }

    target.innerHTML = renderOrganizationEditorSkeleton(id);
    bindEditorEvents(target, id);

    if (id) {
        // Load data for edit
        const content = target.querySelector('#org-editor-content');
        organizationsAPI.fetchWithStates(`/api/organizations/${id}`, {
            loadingElement: content,
            targetElement: content,
            onSuccess: (org) => populateEditorForm(target, org),
            onError: (err) => {
                content.innerHTML = renderErrorState(err?.message || 'Falha ao carregar organização');
                if (window.app) window.app.handleError(err, 'Organizations:editor:load');
            },
            onEmpty: () => {
                content.innerHTML = renderErrorState('Organização não encontrada');
            }
        });
    } else {
        // New organization: prepare defaults
        populateEditorForm(target, { isActive: true, country: 'Brazil', maxStudents: 100, maxStaff: 10 });
    }
}

function renderOrganizationEditorSkeleton(id) {
    const isEdit = !!id;
    return `
        <div class="module-isolated-organizations">
            <div class="module-header-premium">
                <div class="header-content">
                    <nav class="breadcrumb-premium">
                        <span class="breadcrumb-item">🏠 Academia</span>
                        <span class="breadcrumb-separator">›</span>
                        <span class="breadcrumb-item">🏫 Organizações</span>
                        <span class="breadcrumb-separator">›</span>
                        <span class="breadcrumb-item active">${isEdit ? '✏️ Editar' : '➕ Nova'}</span>
                    </nav>
                    <div class="title-section">
                        <h1>${isEdit ? '✏️ Editar Organização' : '➕ Nova Organização'}</h1>
                        <p class="subtitle">Preencha os dados e salve</p>
                    </div>
                    <div class="header-actions">
                        <button class="btn-primary-premium" data-action="back-to-organizations">← Voltar</button>
                    </div>
                </div>
            </div>

            <div class="data-card-premium">
                <div id="org-editor-content">
                    ${renderLoadingState()}
                </div>
            </div>
        </div>
    `;
}

function populateEditorForm(root, org) {
    const content = root.querySelector('#org-editor-content');
    const isEdit = !!org?.id;
    content.innerHTML = `
        <form id="org-editor-form" class="form-premium">
            <div class="form-row">
                <div class="form-group">
                    <label>Nome *</label>
                    <input type="text" name="name" id="org-name" required value="${org?.name || ''}" />
                </div>
                <div class="form-group">
                    <label>Slug *</label>
                    <input type="text" name="slug" id="org-slug" required value="${org?.slug || ''}" />
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" name="email" value="${org?.email || ''}" />
                </div>
                <div class="form-group">
                    <label>Telefone</label>
                    <input type="tel" name="phone" value="${org?.phone || ''}" />
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Website</label>
                    <input type="url" name="website" value="${org?.website || ''}" />
                </div>
                <div class="form-group">
                    <label>País</label>
                    <input type="text" name="country" value="${org?.country || 'Brazil'}" />
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Endereço</label>
                    <input type="text" name="address" value="${org?.address || ''}" />
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Cidade</label>
                    <input type="text" name="city" value="${org?.city || ''}" />
                </div>
                <div class="form-group">
                    <label>Estado</label>
                    <input type="text" name="state" value="${org?.state || ''}" />
                </div>
                <div class="form-group">
                    <label>CEP</label>
                    <input type="text" name="zipCode" value="${org?.zipCode || ''}" />
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Máx. Alunos</label>
                    <input type="number" name="maxStudents" min="1" value="${org?.maxStudents ?? 100}" />
                </div>
                <div class="form-group">
                    <label>Máx. Staff</label>
                    <input type="number" name="maxStaff" min="1" value="${org?.maxStaff ?? 10}" />
                </div>
                <div class="form-group" style="align-items:center;">
                    <label>&nbsp;</label>
                    <label style="display:flex; gap:.5rem; align-items:center;">
                        <input type="checkbox" name="isActive" ${org?.isActive !== false ? 'checked' : ''} /> Ativa
                    </label>
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-secondary-premium" data-action="back-to-organizations">Cancelar</button>
                <button type="submit" class="btn-primary-premium">Salvar</button>
            </div>
        </form>
    `;
}

function bindEditorEvents(root, id) {
    root.addEventListener('click', (e) => {
        const back = e.target.closest('[data-action="back-to-organizations"]');
        if (back) {
            loadOrganizations(root);
        }
    });

    const form = root.querySelector('#org-editor-form');
    // form may not exist yet until populateEditorForm runs
    const attachSubmit = () => {
        const f = root.querySelector('#org-editor-form');
        if (!f) return;
        f.addEventListener('submit', async (ev) => {
            ev.preventDefault();
            try {
                const fd = new FormData(f);
                const payload = sanitizeOrganizationPayload(fd);
                const method = id ? 'put' : 'post';
                const url = id ? `/api/organizations/${id}` : '/api/organizations';
                await organizationsAPI.api[method](url, payload);
                if (window.app) window.app.dispatchEvent('organizations:updated', { id });
                loadOrganizations(root);
            } catch (err) {
                console.error('[Organizations] Save error:', err);
                if (window.app) window.app.handleError(err, 'Organizations:editor:save');
                const content = root.querySelector('#org-editor-content');
                if (content) content.insertAdjacentHTML('beforeend', `<div class="error-state-premium"><div class="error-icon">❌</div><p>${err?.message || 'Erro ao salvar'}</p></div>`);
            }
        });
    };

    // Attach submit after form render
    setTimeout(attachSubmit, 0);
}

function sanitizeOrganizationPayload(fd) {
    const num = (v, d) => {
        const n = Number(v);
        return Number.isFinite(n) && n > 0 ? n : d;
    };
    return {
        name: (fd.get('name') || '').toString().trim(),
        slug: (fd.get('slug') || '').toString().trim(),
        description: nullIfEmpty(fd.get('description')),
        email: nullIfEmpty(fd.get('email')),
        phone: nullIfEmpty(fd.get('phone')),
        website: nullIfEmpty(fd.get('website')),
        address: nullIfEmpty(fd.get('address')),
        city: nullIfEmpty(fd.get('city')),
        state: nullIfEmpty(fd.get('state')),
        zipCode: nullIfEmpty(fd.get('zipCode')),
        country: (fd.get('country') || 'Brazil').toString().trim(),
        maxStudents: num(fd.get('maxStudents'), 100),
        maxStaff: num(fd.get('maxStaff'), 10),
        isActive: fd.get('isActive') !== null
    };
}

function nullIfEmpty(v) {
    if (v === undefined || v === null) return null;
    const s = String(v).trim();
    return s === '' ? null : s;
}

// Expose globally
window.organizationsModule = {
    initialize: initializeOrganizations,
    loadOrganizations
};

// Also expose the init function for router compatibility
window.initOrganizationsModule = initializeOrganizations;

// Auto-initialize carefully: only if hash matches and a container exists,
// otherwise let the router drive initialization to avoid races.
function maybeAutoInit() {
    if (window.organizationsModuleInitialized || isInitialized || isInitializing) return;
    const hash = String(window.location.hash || '');
    const matchesRoute = hash.includes('organizations');
    const hasRouter = !!window.router;
    if (!matchesRoute) return; // avoid loading on unrelated pages
    // If router exists and is navigating, skip auto-init
    if (hasRouter && (window.router.isNavigating || window.router._navigating)) return;
    // Try to resolve container and initialize
    resolveContainer().then((target) => {
        if (target) initializeOrganizations(target);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', maybeAutoInit);
} else {
    setTimeout(maybeAutoInit, 0);
}

console.log('✅ Organizations Module Loaded');

// Register with ModuleLoader for core integration
if (window.ModuleLoader && window.organizationsModule) {
    try {
        window.ModuleLoader.register('organizations', window.organizationsModule);
    } catch (e) {
        console.warn('[Organizations] ModuleLoader registration failed:', e?.message || e);
    }
}
