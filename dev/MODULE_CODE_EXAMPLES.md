# 📝 Exemplos de Código - Migração de Módulos AGENTS.md v2.1

## 🎯 Objetivo
Fornecer código copiável e acionável para agilizar migrações de módulos seguindo AGENTS.md v2.1.

---

## 📦 Template Single-file Completo

```javascript
/**
 * [Module Name] Module - Single-file Implementation
 * Based on Instructors module pattern (AGENTS.md v2.1)
 * @module [moduleName]
 */

// ==================== 1. IMPORTS & CONFIG ====================
import { formatDate, formatCurrency } from '../shared/utils.js';

const MODULE_NAME = '[ModuleName]';
const API_BASE = '/api/[endpoint]';

// ==================== 2. STATE & CACHE ====================
let moduleAPI = null;
let currentView = 'list'; // 'list' | 'editor'
let currentItemId = null;
let cachedData = null;

// ==================== 3. API CLIENT INITIALIZATION ====================
/**
 * Initialize API client when available
 */
async function initializeAPI() {
    await waitForAPIClient();
    moduleAPI = window.createModuleAPI(MODULE_NAME);
}

/**
 * Wait for API client to be available
 */
function waitForAPIClient() {
    return new Promise((resolve) => {
        if (window.createModuleAPI) return resolve();
        
        const checkInterval = setInterval(() => {
            if (window.createModuleAPI) {
                clearInterval(checkInterval);
                resolve();
            }
        }, 100);
        
        // Timeout após 10 segundos
        setTimeout(() => {
            clearInterval(checkInterval);
            console.error(`${MODULE_NAME}: API Client não disponível após 10s`);
            resolve();
        }, 10000);
    });
}

// ==================== 4. MAIN RENDER ====================
/**
 * Render main module view
 */
async function render() {
    const contentArea = document.getElementById('content-area');
    if (!contentArea) {
        console.error(`${MODULE_NAME}: content-area não encontrado`);
        return;
    }

    contentArea.innerHTML = `
        <div class="module-isolated-${MODULE_NAME.toLowerCase()}-container">
            <div id="${MODULE_NAME.toLowerCase()}-content">
                <!-- Conteúdo será carregado aqui -->
            </div>
        </div>
    `;

    // Renderizar view inicial
    if (currentView === 'list') {
        await renderList();
    } else if (currentView === 'editor') {
        await renderEditor(currentItemId);
    }
}

// ==================== 5. LIST VIEW ====================
/**
 * Render list view with loading/empty/error states
 */
async function renderList() {
    const container = document.getElementById(`${MODULE_NAME.toLowerCase()}-content`);
    if (!container) return;

    try {
        // Usar fetchWithStates para gerenciar estados automaticamente
        await moduleAPI.fetchWithStates(API_BASE, {
            loadingElement: container,
            onLoading: () => {
                container.innerHTML = `
                    <div class="loading-state">
                        <div class="spinner"></div>
                        <p class="loading-message">Carregando ${MODULE_NAME.toLowerCase()}...</p>
                    </div>
                `;
            },
            onSuccess: (data) => {
                cachedData = data;
                renderListContent(container, data);
            },
            onEmpty: () => {
                renderEmptyState(container);
            },
            onError: (error) => {
                renderErrorState(container, error);
            }
        });
    } catch (error) {
        console.error(`${MODULE_NAME} List Error:`, error);
        window.app?.handleError?.(error, `${MODULE_NAME}:renderList`);
        renderErrorState(container, error);
    }
}

/**
 * Render list content
 */
function renderListContent(container, data) {
    container.innerHTML = `
        <!-- Header Premium -->
        <div class="module-header-premium">
            <div class="module-header-top">
                <div class="breadcrumb-nav">
                    <span class="breadcrumb-item">Home</span>
                    <span class="breadcrumb-separator">›</span>
                    <span class="breadcrumb-item active">${MODULE_NAME}</span>
                </div>
            </div>
            <div class="module-title-section">
                <h1 class="module-title">📋 ${MODULE_NAME}</h1>
                <button class="btn-primary" onclick="window.${MODULE_NAME.toLowerCase()}.navigateToEditor('new')">
                    + Adicionar ${MODULE_NAME}
                </button>
            </div>
        </div>

        <!-- Stats Cards -->
        <div class="stats-container">
            ${renderStatsCards(data)}
        </div>

        <!-- Filters (opcional) -->
        <div class="module-filters-premium">
            <input 
                type="search" 
                class="filter-search" 
                placeholder="Buscar ${MODULE_NAME.toLowerCase()}..."
                oninput="window.${MODULE_NAME.toLowerCase()}.filterItems(this.value)">
        </div>

        <!-- Data Grid -->
        <div class="data-grid" id="data-grid">
            ${renderDataCards(data)}
        </div>
    `;
}

/**
 * Render stats cards
 */
function renderStatsCards(data) {
    const total = data.length;
    const active = data.filter(item => item.status === 'active').length;
    const inactive = total - active;

    return `
        <div class="stat-card-enhanced" data-stat-type="total">
            <div class="stat-content">
                <div class="stat-icon">📊</div>
                <div class="stat-details">
                    <p class="stat-value">${total}</p>
                    <p class="stat-label">Total</p>
                </div>
            </div>
        </div>
        <div class="stat-card-enhanced" data-stat-type="active">
            <div class="stat-content">
                <div class="stat-icon">✅</div>
                <div class="stat-details">
                    <p class="stat-value">${active}</p>
                    <p class="stat-label">Ativos</p>
                </div>
            </div>
        </div>
        <div class="stat-card-enhanced" data-stat-type="inactive">
            <div class="stat-content">
                <div class="stat-icon">⏸️</div>
                <div class="stat-details">
                    <p class="stat-value">${inactive}</p>
                    <p class="stat-label">Inativos</p>
                </div>
            </div>
        </div>
    `;
}

/**
 * Render data cards
 */
function renderDataCards(data) {
    return data.map(item => `
        <div 
            class="data-card-premium" 
            data-id="${item.id}"
            ondblclick="window.${MODULE_NAME.toLowerCase()}.navigateToEditor('${item.id}')">
            <div class="card-header">
                <h3 class="card-title">${item.name || 'Sem nome'}</h3>
                <span class="card-badge ${item.status === 'active' ? 'badge-success' : 'badge-inactive'}">
                    ${item.status === 'active' ? 'Ativo' : 'Inativo'}
                </span>
            </div>
            <div class="card-body">
                <p class="card-info">
                    <span class="info-label">Criado em:</span>
                    <span class="info-value">${formatDate(item.createdAt)}</span>
                </p>
                <!-- Adicionar mais campos relevantes -->
            </div>
            <div class="card-footer">
                <button 
                    class="btn-secondary btn-sm"
                    onclick="event.stopPropagation(); window.${MODULE_NAME.toLowerCase()}.navigateToEditor('${item.id}')">
                    Editar
                </button>
                <button 
                    class="btn-danger btn-sm"
                    onclick="event.stopPropagation(); window.${MODULE_NAME.toLowerCase()}.deleteItem('${item.id}')">
                    Excluir
                </button>
            </div>
        </div>
    `).join('');
}

/**
 * Render empty state
 */
function renderEmptyState(container) {
    container.innerHTML = `
        <div class="module-header-premium">
            <div class="module-title-section">
                <h1 class="module-title">📋 ${MODULE_NAME}</h1>
            </div>
        </div>
        
        <div class="empty-state">
            <div class="empty-icon">📭</div>
            <h3 class="empty-title">Nenhum ${MODULE_NAME.toLowerCase()} encontrado</h3>
            <p class="empty-message">
                Comece adicionando um novo ${MODULE_NAME.toLowerCase()} ao sistema.
            </p>
            <button 
                class="btn-primary" 
                onclick="window.${MODULE_NAME.toLowerCase()}.navigateToEditor('new')">
                + Adicionar Primeiro ${MODULE_NAME}
            </button>
        </div>
    `;
}

/**
 * Render error state
 */
function renderErrorState(container, error) {
    container.innerHTML = `
        <div class="module-header-premium">
            <div class="module-title-section">
                <h1 class="module-title">📋 ${MODULE_NAME}</h1>
            </div>
        </div>
        
        <div class="error-state">
            <div class="error-icon">⚠️</div>
            <h3 class="error-title">Erro ao carregar ${MODULE_NAME.toLowerCase()}</h3>
            <p class="error-message">
                ${error.message || 'Erro desconhecido ao carregar os dados.'}
            </p>
            <button 
                class="btn-secondary" 
                onclick="window.${MODULE_NAME.toLowerCase()}.renderList()">
                🔄 Tentar Novamente
            </button>
        </div>
    `;
}

// ==================== 6. EDITOR VIEW ====================
/**
 * Render editor view (create/edit)
 */
async function renderEditor(id) {
    const container = document.getElementById(`${MODULE_NAME.toLowerCase()}-content`);
    if (!container) return;

    const isNew = id === 'new' || !id;
    let itemData = null;

    try {
        if (!isNew) {
            // Carregar dados do item para edição
            container.innerHTML = `
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p class="loading-message">Carregando dados...</p>
                </div>
            `;

            itemData = await moduleAPI.request(`${API_BASE}/${id}`);
        }

        renderEditorForm(container, itemData, isNew);
    } catch (error) {
        console.error(`${MODULE_NAME} Editor Error:`, error);
        window.app?.handleError?.(error, `${MODULE_NAME}:renderEditor`);
        renderErrorState(container, error);
    }
}

/**
 * Render editor form
 */
function renderEditorForm(container, data, isNew) {
    container.innerHTML = `
        <!-- Header Premium -->
        <div class="module-header-premium">
            <div class="module-header-top">
                <div class="breadcrumb-nav">
                    <span class="breadcrumb-item" onclick="window.${MODULE_NAME.toLowerCase()}.navigateToList()" style="cursor: pointer;">
                        ${MODULE_NAME}
                    </span>
                    <span class="breadcrumb-separator">›</span>
                    <span class="breadcrumb-item active">
                        ${isNew ? 'Novo' : 'Editar'}
                    </span>
                </div>
            </div>
            <div class="module-title-section">
                <h1 class="module-title">
                    ${isNew ? '➕ Novo' : '✏️ Editar'} ${MODULE_NAME}
                </h1>
                <button class="btn-back" onclick="window.${MODULE_NAME.toLowerCase()}.navigateToList()">
                    ← Voltar
                </button>
            </div>
        </div>

        <!-- Editor Form -->
        <div class="editor-container">
            <form id="${MODULE_NAME.toLowerCase()}-form" class="editor-form">
                <div class="form-section">
                    <h3 class="section-title">Informações Básicas</h3>
                    
                    <div class="form-group">
                        <label for="name" class="form-label">Nome *</label>
                        <input 
                            type="text" 
                            id="name" 
                            name="name"
                            class="form-control"
                            value="${data?.name || ''}"
                            required>
                    </div>

                    <div class="form-group">
                        <label for="description" class="form-label">Descrição</label>
                        <textarea 
                            id="description" 
                            name="description"
                            class="form-control"
                            rows="4">${data?.description || ''}</textarea>
                    </div>

                    <div class="form-group">
                        <label for="status" class="form-label">Status</label>
                        <select id="status" name="status" class="form-control">
                            <option value="active" ${data?.status === 'active' ? 'selected' : ''}>
                                Ativo
                            </option>
                            <option value="inactive" ${data?.status === 'inactive' ? 'selected' : ''}>
                                Inativo
                            </option>
                        </select>
                    </div>

                    <!-- Adicionar mais campos conforme necessário -->
                </div>

                <div class="form-actions">
                    <button 
                        type="button" 
                        class="btn-secondary"
                        onclick="window.${MODULE_NAME.toLowerCase()}.navigateToList()">
                        Cancelar
                    </button>
                    <button 
                        type="submit" 
                        class="btn-primary">
                        ${isNew ? 'Criar' : 'Salvar'} ${MODULE_NAME}
                    </button>
                </div>
            </form>
        </div>
    `;

    // Adicionar event listener ao formulário
    const form = document.getElementById(`${MODULE_NAME.toLowerCase()}-form`);
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveItem(data?.id, isNew);
    });
}

// ==================== 7. CRUD OPERATIONS ====================
/**
 * Save item (create or update)
 */
async function saveItem(id, isNew) {
    const form = document.getElementById(`${MODULE_NAME.toLowerCase()}-form`);
    const formData = new FormData(form);
    
    const payload = {
        name: formData.get('name'),
        description: formData.get('description'),
        status: formData.get('status'),
        // Adicionar mais campos conforme necessário
    };

    try {
        // Desabilitar botão de submit
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Salvando...';

        let response;
        if (isNew) {
            response = await moduleAPI.request(API_BASE, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            console.log(`${MODULE_NAME} criado:`, response);
        } else {
            response = await moduleAPI.request(`${API_BASE}/${id}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
            console.log(`${MODULE_NAME} atualizado:`, response);
        }

        // Feedback de sucesso
        showSuccessMessage(isNew ? 'criado' : 'atualizado');
        
        // Voltar para lista
        setTimeout(() => navigateToList(), 1500);
    } catch (error) {
        console.error(`${MODULE_NAME} Save Error:`, error);
        window.app?.handleError?.(error, `${MODULE_NAME}:saveItem`);
        showErrorMessage(error.message || 'Erro ao salvar');
        
        // Reabilitar botão
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = isNew ? `Criar ${MODULE_NAME}` : `Salvar ${MODULE_NAME}`;
    }
}

/**
 * Delete item
 */
async function deleteItem(id) {
    if (!confirm(`Tem certeza que deseja excluir este ${MODULE_NAME.toLowerCase()}?`)) {
        return;
    }

    try {
        await moduleAPI.request(`${API_BASE}/${id}`, {
            method: 'DELETE'
        });

        console.log(`${MODULE_NAME} deletado:`, id);
        showSuccessMessage('excluído');
        
        // Recarregar lista
        await renderList();
    } catch (error) {
        console.error(`${MODULE_NAME} Delete Error:`, error);
        window.app?.handleError?.(error, `${MODULE_NAME}:deleteItem`);
        showErrorMessage(error.message || 'Erro ao excluir');
    }
}

// ==================== 8. UTILITY FUNCTIONS ====================
/**
 * Filter items by search term
 */
function filterItems(searchTerm) {
    if (!cachedData) return;

    const filtered = cachedData.filter(item => 
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const dataGrid = document.getElementById('data-grid');
    if (dataGrid) {
        dataGrid.innerHTML = renderDataCards(filtered);
    }
}

/**
 * Show success message
 */
function showSuccessMessage(action) {
    // Implementar toast/notification
    console.log(`${MODULE_NAME} ${action} com sucesso!`);
    alert(`${MODULE_NAME} ${action} com sucesso!`);
}

/**
 * Show error message
 */
function showErrorMessage(message) {
    // Implementar toast/notification
    console.error(`Erro: ${message}`);
    alert(`Erro: ${message}`);
}

// ==================== 9. NAVIGATION ====================
/**
 * Navigate to list view
 */
function navigateToList() {
    currentView = 'list';
    currentItemId = null;
    renderList();
}

/**
 * Navigate to editor view
 */
function navigateToEditor(id) {
    currentView = 'editor';
    currentItemId = id;
    renderEditor(id);
}

// ==================== 10. INITIALIZATION ====================
/**
 * Initialize module
 */
async function initialize() {
    console.log(`${MODULE_NAME} Module: Initializing...`);
    
    try {
        await initializeAPI();
        await render();
        
        // Disparar evento de carregamento
        window.app?.dispatchEvent('module:loaded', { 
            name: MODULE_NAME.toLowerCase() 
        });
        
        console.log(`${MODULE_NAME} Module: Initialized successfully`);
    } catch (error) {
        console.error(`${MODULE_NAME} Module: Initialization failed`, error);
        window.app?.handleError?.(error, `${MODULE_NAME}:initialize`);
    }
}

// ==================== 11. EXPORTS ====================
const [moduleName]Module = {
    initialize,
    render,
    renderList,
    renderEditor,
    navigateToList,
    navigateToEditor,
    saveItem,
    deleteItem,
    filterItems
};

// Expor globalmente para compatibilidade
window.[moduleName] = window.[moduleName]Module = [moduleName]Module;

export default [moduleName]Module;
```

---

## 🎨 CSS Template Completo

```css
/**
 * [Module Name] Module Styles
 * Isolated styles following AGENTS.md v2.1 design system
 * Prefix: .module-isolated-[modulename]-
 */

/* ==================== CONTAINER ==================== */
.module-isolated-[modulename]-container {
    padding: var(--spacing-large);
    background: var(--color-background);
    min-height: 100vh;
}

/* ==================== STATS CONTAINER ==================== */
.stats-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--spacing-medium);
    margin-bottom: var(--spacing-large);
}

/* ==================== DATA GRID ==================== */
.data-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: var(--spacing-medium);
    margin-top: var(--spacing-large);
}

/* ==================== EDITOR CONTAINER ==================== */
.editor-container {
    max-width: 800px;
    margin: 0 auto;
    padding: var(--spacing-large);
}

.editor-form {
    background: var(--color-surface);
    border-radius: var(--radius-large);
    padding: var(--spacing-large);
    box-shadow: var(--shadow-medium);
}

.form-section {
    margin-bottom: var(--spacing-large);
}

.section-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: var(--spacing-medium);
    padding-bottom: var(--spacing-small);
    border-bottom: 2px solid var(--color-border);
}

.form-group {
    margin-bottom: var(--spacing-medium);
}

.form-label {
    display: block;
    font-weight: 500;
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-small);
}

.form-control {
    width: 100%;
    padding: var(--spacing-small);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-medium);
    font-size: 1rem;
    transition: var(--transition-normal);
    background: var(--color-background);
    color: var(--color-text-primary);
}

.form-control:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-actions {
    display: flex;
    gap: var(--spacing-medium);
    justify-content: flex-end;
    margin-top: var(--spacing-large);
    padding-top: var(--spacing-medium);
    border-top: 1px solid var(--color-border);
}

/* ==================== RESPONSIVE DESIGN ==================== */
@media (max-width: 768px) {
    .module-isolated-[modulename]-container {
        padding: var(--spacing-medium);
    }

    .stats-container {
        grid-template-columns: 1fr;
    }

    .data-grid {
        grid-template-columns: 1fr;
    }

    .editor-container {
        padding: var(--spacing-medium);
    }

    .form-actions {
        flex-direction: column;
    }

    .form-actions button {
        width: 100%;
    }
}

@media (min-width: 1024px) {
    .stats-container {
        grid-template-columns: repeat(3, 1fr);
    }
}

@media (min-width: 1440px) {
    .data-grid {
        grid-template-columns: repeat(4, 1fr);
    }
}

/* ==================== DARK MODE SUPPORT ==================== */
@media (prefers-color-scheme: dark) {
    .module-isolated-[modulename]-container {
        background: var(--color-background-dark);
    }

    .editor-form {
        background: var(--color-surface-dark);
    }

    .form-control {
        background: var(--color-background-dark);
        border-color: var(--color-border-dark);
        color: var(--color-text-primary-dark);
    }
}
```

---

## 🔌 Integração AcademyApp

### Adicionar no `public/js/core/app.js`:

```javascript
async loadModules() {
    const modules = [
        'students',
        'instructors',
        'activities',
        'packages',
        'turmas',
        '[seu-modulo]',  // ← ADICIONAR AQUI
        // ... outros módulos
    ];

    for (const moduleName of modules) {
        try {
            const module = await import(`../modules/${moduleName}/index.js`);
            if (module.default?.initialize) {
                await module.default.initialize();
            }
        } catch (error) {
            console.error(`Failed to load module ${moduleName}:`, error);
            this.handleError(error, `AcademyApp:loadModules:${moduleName}`);
        }
    }
}
```

---

## 📊 Exemplo de Teste Unitário

```javascript
/**
 * Unit tests for [Module] Module
 * @vitest
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import [moduleName]Module from '../public/js/modules/[modulename]/index.js';

describe('[ModuleName] Module', () => {
    beforeEach(() => {
        // Mock API Client
        global.window = {
            createModuleAPI: vi.fn(() => ({
                request: vi.fn(),
                fetchWithStates: vi.fn()
            })),
            app: {
                dispatchEvent: vi.fn(),
                handleError: vi.fn()
            }
        };

        // Mock DOM
        document.body.innerHTML = '<div id="content-area"></div>';
    });

    it('should initialize successfully', async () => {
        await [moduleName]Module.initialize();
        
        expect(window.app.dispatchEvent).toHaveBeenCalledWith(
            'module:loaded',
            { name: '[modulename]' }
        );
    });

    it('should render list view', async () => {
        const mockData = [
            { id: '1', name: 'Test 1', status: 'active' },
            { id: '2', name: 'Test 2', status: 'inactive' }
        ];

        window.createModuleAPI().fetchWithStates.mockImplementation(
            async (url, { onSuccess }) => {
                onSuccess(mockData);
            }
        );

        await [moduleName]Module.renderList();

        const contentArea = document.getElementById('content-area');
        expect(contentArea.textContent).toContain('Test 1');
        expect(contentArea.textContent).toContain('Test 2');
    });

    it('should handle empty state', async () => {
        window.createModuleAPI().fetchWithStates.mockImplementation(
            async (url, { onEmpty }) => {
                onEmpty();
            }
        );

        await [moduleName]Module.renderList();

        const contentArea = document.getElementById('content-area');
        expect(contentArea.textContent).toContain('Nenhum');
    });

    it('should handle error state', async () => {
        const mockError = new Error('Network error');

        window.createModuleAPI().fetchWithStates.mockImplementation(
            async (url, { onError }) => {
                onError(mockError);
            }
        );

        await [moduleName]Module.renderList();

        const contentArea = document.getElementById('content-area');
        expect(contentArea.textContent).toContain('Erro');
        expect(window.app.handleError).toHaveBeenCalled();
    });

    it('should save new item', async () => {
        const mockResponse = { id: '123', name: 'New Item' };

        window.createModuleAPI().request.mockResolvedValue(mockResponse);

        // Mock form
        document.body.innerHTML = `
            <form id="[modulename]-form">
                <input name="name" value="New Item" />
                <input name="status" value="active" />
            </form>
        `;

        await [moduleName]Module.saveItem(null, true);

        expect(window.createModuleAPI().request).toHaveBeenCalledWith(
            '/api/[endpoint]',
            expect.objectContaining({
                method: 'POST'
            })
        );
    });
});
```

---

## 📝 Exemplo de Documentação JSDoc

```javascript
/**
 * [Module Name] Module
 * 
 * @module [moduleName]
 * @version 1.0.0
 * @author Sistema Krav Maga Academy
 * 
 * @description
 * Gerenciamento completo de [entidade] com operações CRUD,
 * estados de UI (loading/empty/error) e integração com AcademyApp.
 * 
 * @architecture Single-file
 * @template Instructors (AGENTS.md v2.1)
 * 
 * @example
 * // Inicializar módulo
 * await [moduleName]Module.initialize();
 * 
 * // Navegar para lista
 * [moduleName]Module.navigateToList();
 * 
 * // Navegar para editor
 * [moduleName]Module.navigateToEditor('item-id');
 * 
 * @exports [moduleName]Module
 * @exports initialize
 * @exports render
 * @exports renderList
 * @exports renderEditor
 * @exports navigateToList
 * @exports navigateToEditor
 * @exports saveItem
 * @exports deleteItem
 * @exports filterItems
 */
```

---

## 🔗 Recursos Adicionais

- **AGENTS.md**: Guia operacional master
- **AUDIT_REPORT.md**: Relatório de auditoria completo
- **MODULE_MIGRATION_CHECKLIST.md**: Checklist de migração passo a passo
- **Templates de Referência**:
  - Single-file: `/public/js/modules/instructors/index.js` (745 linhas)
  - Multi-file: `/public/js/modules/activities/` (estrutura MVC)
  - Gold Standard: `/public/js/modules/students/` (1470 linhas)

---

**Versão**: 1.0  
**Data**: 30/09/2025  
**Status**: Ativo
