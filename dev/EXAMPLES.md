# Exemplos Práticos - Copy & Paste Ready

## 🚀 Templates Completos para Módulos

### 1. Módulo Completo - Template Base
```javascript
/**
 * @fileoverview Template Completo para Novo Módulo
 * @usage Copie este template e substitua "NewModule" pelo nome do seu módulo
 */

// ==================== CONFIGURAÇÃO INICIAL ====================
const MODULE_NAME = 'newmodule'; // lowercase
const MODULE_DISPLAY = 'NewModule'; // PascalCase
const MODULE_ICON = '📋'; // Emoji do módulo

// Aguarda dependências
await waitForAPIClient();

// API do módulo
let newmoduleAPI = null;

// ==================== INICIALIZAÇÃO ====================
async function initializeNewModuleModule() {
    try {
        // Setup API
        newmoduleAPI = window.createModuleAPI('NewModule');
        
        // Carrega UI
        await loadNewModuleUI();
        
        // Registra no app
        if (window.app) {
            window.app.registerModule('newmodule', newModuleModule);
            window.app.dispatchEvent('module:loaded', { name: 'newmodule' });
        }
        
        console.log('✅ Módulo NewModule inicializado com sucesso');
        return newModuleModule;
    } catch (error) {
        console.error('❌ Erro ao inicializar módulo NewModule:', error);
        window.app?.handleError(error, 'initializeNewModuleModule');
        throw error;
    }
}

// ==================== UI LOADING ====================
async function loadNewModuleUI() {
    const container = document.getElementById('newmodule-container');
    if (!container) {
        throw new Error('Container #newmodule-container não encontrado');
    }
    
    // Renderiza header sempre primeiro
    renderNewModuleHeader(container);
    
    // Carrega dados com estados
    await newmoduleAPI.fetchWithStates('/api/newmodule', {
        loadingElement: container.querySelector('.module-content'),
        onSuccess: (data) => renderNewModuleContent(data),
        onEmpty: () => showEmptyNewModuleState(),
        onError: (error) => showErrorNewModuleState(error)
    });
}

// ==================== RENDER FUNCTIONS ====================
function renderNewModuleHeader(container) {
    const headerHTML = `
        <div class="module-isolated-newmodule">
            <div class="module-header-premium">
                <div class="module-isolated-newmodule__breadcrumb">
                    <a href="#dashboard" class="module-isolated-newmodule__breadcrumb__item">Dashboard</a>
                    <span class="module-isolated-newmodule__breadcrumb__separator">></span>
                    <span class="module-isolated-newmodule__breadcrumb__item">${MODULE_ICON} ${MODULE_DISPLAY}</span>
                </div>
                
                <div class="module-header-content">
                    <h1>${MODULE_ICON} ${MODULE_DISPLAY}</h1>
                    <p class="module-description">Gestão completa de ${MODULE_DISPLAY.toLowerCase()}</p>
                </div>
                
                <div class="module-actions">
                    <button class="btn btn-primary" onclick="createNewModule()">
                        <i class="icon-plus"></i> Novo ${MODULE_DISPLAY}
                    </button>
                    <button class="btn btn-secondary" onclick="refreshNewModule()">
                        <i class="icon-refresh"></i> Atualizar
                    </button>
                </div>
            </div>
            
            <!-- Stats Cards -->
            <div class="module-isolated-newmodule__stats" id="newmodule-stats">
                <!-- Stats serão carregadas dinamicamente -->
            </div>
            
            <!-- Filtros -->
            <div class="module-isolated-newmodule__filters module-filters-premium">
                <div class="search-container">
                    <input type="text" 
                           class="module-isolated-newmodule__search search-input-premium" 
                           placeholder="Buscar ${MODULE_DISPLAY.toLowerCase()}..."
                           onkeyup="searchNewModule(this.value)">
                </div>
                
                <div class="filter-buttons">
                    <button class="module-isolated-newmodule__filter-button module-isolated-newmodule__filter-button--active" 
                            data-filter="all" onclick="filterNewModule('all')">
                        Todos
                    </button>
                    <button class="module-isolated-newmodule__filter-button" 
                            data-filter="active" onclick="filterNewModule('active')">
                        Ativos
                    </button>
                    <button class="module-isolated-newmodule__filter-button" 
                            data-filter="inactive" onclick="filterNewModule('inactive')">
                        Inativos
                    </button>
                </div>
            </div>
            
            <!-- Conteúdo Principal -->
            <div class="module-content" id="newmodule-content">
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Carregando ${MODULE_DISPLAY.toLowerCase()}...</p>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = headerHTML;
}

function renderNewModuleContent(data) {
    // Renderiza stats
    renderNewModuleStats(data.stats || calculateStats(data));
    
    // Renderiza lista
    renderNewModuleList(data.items || data);
}

function renderNewModuleStats(stats) {
    const statsContainer = document.getElementById('newmodule-stats');
    if (!statsContainer) return;
    
    const statsHTML = `
        <div class="module-isolated-newmodule__stat-card module-isolated-newmodule__stat-card--total stat-card-enhanced">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
                <div class="stat-number">${stats.total || 0}</div>
                <div class="stat-label">Total</div>
            </div>
        </div>
        
        <div class="module-isolated-newmodule__stat-card module-isolated-newmodule__stat-card--active stat-card-enhanced">
            <div class="stat-icon">✅</div>
            <div class="stat-content">
                <div class="stat-number">${stats.active || 0}</div>
                <div class="stat-label">Ativos</div>
            </div>
        </div>
        
        <div class="module-isolated-newmodule__stat-card module-isolated-newmodule__stat-card--new stat-card-enhanced">
            <div class="stat-icon">🆕</div>
            <div class="stat-content">
                <div class="stat-number">${stats.recent || 0}</div>
                <div class="stat-label">Recentes</div>
            </div>
        </div>
        
        <div class="module-isolated-newmodule__stat-card module-isolated-newmodule__stat-card--pending stat-card-enhanced">
            <div class="stat-icon">⏳</div>
            <div class="stat-content">
                <div class="stat-number">${stats.pending || 0}</div>
                <div class="stat-label">Pendentes</div>
            </div>
        </div>
    `;
    
    statsContainer.innerHTML = statsHTML;
}

function renderNewModuleList(items) {
    const contentContainer = document.getElementById('newmodule-content');
    if (!contentContainer) return;
    
    if (!items || items.length === 0) {
        showEmptyNewModuleState();
        return;
    }
    
    const listHTML = `
        <div class="module-isolated-newmodule__list">
            ${items.map(item => renderNewModuleItem(item)).join('')}
        </div>
    `;
    
    contentContainer.innerHTML = listHTML;
}

function renderNewModuleItem(item) {
    return `
        <div class="module-isolated-newmodule__list__item" 
             onclick="editNewModule('${item.id}')"
             data-id="${item.id}">
            
            <div class="module-isolated-newmodule__avatar">
                <img src="${item.avatar || '/images/default-avatar.png'}" 
                     alt="${item.name}" 
                     class="module-isolated-newmodule__avatar__image">
            </div>
            
            <div class="module-isolated-newmodule__info">
                <h4 class="module-isolated-newmodule__name">${item.name || item.title}</h4>
                <p class="module-isolated-newmodule__email">${item.email || item.description || ''}</p>
            </div>
            
            <div class="module-isolated-newmodule__status module-isolated-newmodule__status--${item.status || 'active'}">
                ${(item.status || 'active').toUpperCase()}
            </div>
            
            <div class="module-isolated-newmodule__actions" onclick="event.stopPropagation()">
                <button class="btn btn-sm btn-secondary" onclick="viewNewModule('${item.id}')">
                    Ver
                </button>
                <button class="btn btn-sm btn-primary" onclick="editNewModule('${item.id}')">
                    Editar
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteNewModule('${item.id}')">
                    Excluir
                </button>
            </div>
        </div>
    `;
}

// ==================== ESTADO VAZIO ====================
function showEmptyNewModuleState() {
    const contentContainer = document.getElementById('newmodule-content');
    if (!contentContainer) return;
    
    contentContainer.innerHTML = `
        <div class="module-isolated-newmodule__empty-state">
            <div class="module-isolated-newmodule__empty-state__icon">${MODULE_ICON}</div>
            <h3 class="module-isolated-newmodule__empty-state__title">
                Nenhum ${MODULE_DISPLAY.toLowerCase()} encontrado
            </h3>
            <p class="module-isolated-newmodule__empty-state__description">
                Comece criando seu primeiro ${MODULE_DISPLAY.toLowerCase()}.
            </p>
            <button class="btn btn-primary" onclick="createNewModule()">
                Criar ${MODULE_DISPLAY}
            </button>
        </div>
    `;
}

// ==================== ESTADO DE ERRO ====================
function showErrorNewModuleState(error) {
    const contentContainer = document.getElementById('newmodule-content');
    if (!contentContainer) return;
    
    contentContainer.innerHTML = `
        <div class="module-isolated-newmodule__error-state">
            <div class="module-isolated-newmodule__error-state__icon">⚠️</div>
            <h3 class="module-isolated-newmodule__error-state__title">
                Erro ao carregar ${MODULE_DISPLAY.toLowerCase()}
            </h3>
            <p class="module-isolated-newmodule__error-state__description">
                ${error.message || 'Ocorreu um erro inesperado. Tente novamente.'}
            </p>
            <button class="btn btn-primary" onclick="refreshNewModule()">
                Tentar Novamente
            </button>
        </div>
    `;
}

// ==================== AÇÕES DO USUÁRIO ====================
function createNewModule() {
    console.log('Criar novo', MODULE_DISPLAY);
    // TODO: Implementar navegação para página de criação
    // window.location.hash = `#${MODULE_NAME}/new`;
}

function viewNewModule(id) {
    console.log('Ver', MODULE_DISPLAY, ':', id);
    // TODO: Implementar navegação para página de visualização
    // window.location.hash = `#${MODULE_NAME}/${id}`;
}

function editNewModule(id) {
    console.log('Editar', MODULE_DISPLAY, ':', id);
    // TODO: Implementar navegação para página de edição
    // window.location.hash = `#${MODULE_NAME}/${id}/edit`;
}

async function deleteNewModule(id) {
    if (!confirm(`Tem certeza que deseja excluir este ${MODULE_DISPLAY.toLowerCase()}?`)) {
        return;
    }
    
    try {
        await newmoduleAPI.fetchWithStates(`/api/newmodule/${id}`, {
            method: 'DELETE',
            onSuccess: () => {
                // Remove item da UI
                const item = document.querySelector(`[data-id="${id}"]`);
                if (item) {
                    item.remove();
                }
                
                // Mostra notificação
                window.app?.showNotification('success', `${MODULE_DISPLAY} excluído com sucesso`);
                
                // Atualiza stats
                refreshNewModule();
            },
            onError: (error) => {
                window.app?.showNotification('error', `Erro ao excluir: ${error.message}`);
            }
        });
    } catch (error) {
        console.error('Erro ao excluir:', error);
        window.app?.handleError(error, 'deleteNewModule');
    }
}

async function refreshNewModule() {
    console.log('Atualizando', MODULE_DISPLAY);
    await loadNewModuleUI();
}

// ==================== FILTROS E BUSCA ====================
function searchNewModule(term) {
    const items = document.querySelectorAll('.module-isolated-newmodule__list__item');
    
    items.forEach(item => {
        const name = item.querySelector('.module-isolated-newmodule__name')?.textContent || '';
        const email = item.querySelector('.module-isolated-newmodule__email')?.textContent || '';
        
        const matches = name.toLowerCase().includes(term.toLowerCase()) || 
                       email.toLowerCase().includes(term.toLowerCase());
        
        item.style.display = matches ? 'flex' : 'none';
    });
}

function filterNewModule(status) {
    // Atualiza botões ativos
    document.querySelectorAll('.module-isolated-newmodule__filter-button').forEach(btn => {
        btn.classList.remove('module-isolated-newmodule__filter-button--active');
    });
    document.querySelector(`[data-filter="${status}"]`)?.classList.add('module-isolated-newmodule__filter-button--active');
    
    // Filtra items
    const items = document.querySelectorAll('.module-isolated-newmodule__list__item');
    
    items.forEach(item => {
        const itemStatus = item.querySelector('.module-isolated-newmodule__status')?.textContent.toLowerCase() || 'active';
        
        if (status === 'all' || itemStatus === status) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// ==================== UTILITÁRIOS ====================
function calculateStats(data) {
    if (!Array.isArray(data)) return { total: 0, active: 0, recent: 0, pending: 0 };
    
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    return {
        total: data.length,
        active: data.filter(item => item.status === 'active').length,
        recent: data.filter(item => new Date(item.createdAt) > lastWeek).length,
        pending: data.filter(item => item.status === 'pending').length
    };
}

// ==================== EXPORT DO MÓDULO ====================
const newModuleModule = {
    name: MODULE_NAME,
    displayName: MODULE_DISPLAY,
    icon: MODULE_ICON,
    version: '1.0.0',
    init: initializeNewModuleModule,
    api: () => newmoduleAPI,
    
    // Métodos públicos
    refresh: refreshNewModule,
    create: createNewModule,
    search: searchNewModule,
    filter: filterNewModule
};

// Disponibiliza globalmente
window.newModuleModule = newModuleModule;

// Auto-inicializa se app está pronto
if (window.app && window.app.isReady) {
    initializeNewModuleModule();
}
```

### 2. CSS Completo do Módulo
```css
/* ==============================================
   NEWMODULE MODULE - COMPLETE STYLES
   ============================================== */

/* Base Module Container */
[data-module="newmodule"] {
    --module-primary: var(--primary-color);
    --module-accent: var(--secondary-color);
}

.module-isolated-newmodule {
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--spacing-lg);
}

/* ==============================================
   HEADER PREMIUM - COPY PASTE READY
   ============================================== */
.module-isolated-newmodule .module-header-premium {
    background: linear-gradient(135deg, var(--color-surface) 0%, var(--color-background) 100%);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--spacing-xl);
    margin-bottom: var(--spacing-lg);
    box-shadow: var(--shadow-sm);
}

.module-isolated-newmodule__breadcrumb {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-md);
    font-size: var(--font-size-sm);
}

.module-isolated-newmodule__breadcrumb__item {
    color: var(--color-text-muted);
    text-decoration: none;
    transition: var(--transition-base);
}

.module-isolated-newmodule__breadcrumb__item:hover {
    color: var(--primary-color);
}

.module-isolated-newmodule__breadcrumb__separator {
    color: var(--color-border);
}

.module-header-content h1 {
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text);
    margin: 0 0 var(--spacing-sm) 0;
}

.module-description {
    color: var(--color-text-muted);
    font-size: var(--font-size-lg);
    margin: 0 0 var(--spacing-lg) 0;
}

.module-actions {
    display: flex;
    gap: var(--spacing-md);
    flex-wrap: wrap;
}

/* ==============================================
   STATS CARDS - COPY PASTE READY
   ============================================== */
.module-isolated-newmodule__stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
}

.module-isolated-newmodule__stat-card {
    background: var(--gradient-primary);
    border-radius: var(--radius-md);
    padding: var(--spacing-lg);
    color: white;
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    transition: var(--transition-bounce);
    box-shadow: var(--shadow-sm);
}

.module-isolated-newmodule__stat-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
}

.module-isolated-newmodule__stat-card--total {
    background: var(--gradient-primary);
}

.module-isolated-newmodule__stat-card--active {
    background: linear-gradient(135deg, #10B981 0%, #34D399 100%);
}

.module-isolated-newmodule__stat-card--new {
    background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
}

.module-isolated-newmodule__stat-card--pending {
    background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%);
}

.stat-icon {
    font-size: 2.5rem;
    opacity: 0.9;
}

.stat-content {
    flex: 1;
}

.stat-number {
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    line-height: 1;
    margin-bottom: var(--spacing-xs);
}

.stat-label {
    font-size: var(--font-size-sm);
    opacity: 0.9;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

/* ==============================================
   FILTERS PREMIUM - COPY PASTE READY
   ============================================== */
.module-isolated-newmodule__filters {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--spacing-lg);
    margin-bottom: var(--spacing-lg);
    display: grid;
    grid-template-columns: 1fr auto;
    gap: var(--spacing-lg);
    align-items: center;
}

.search-container {
    position: relative;
}

.module-isolated-newmodule__search {
    width: 100%;
    padding: var(--spacing-md) var(--spacing-lg);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: var(--font-size-md);
    background: var(--color-background);
    transition: var(--transition-base);
}

.module-isolated-newmodule__search:focus {
    border-color: var(--primary-color);
    outline: none;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.filter-buttons {
    display: flex;
    gap: var(--spacing-sm);
}

.module-isolated-newmodule__filter-button {
    background: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    cursor: pointer;
    transition: var(--transition-base);
    white-space: nowrap;
}

.module-isolated-newmodule__filter-button:hover {
    border-color: var(--primary-color);
    background: rgba(102, 126, 234, 0.05);
}

.module-isolated-newmodule__filter-button--active {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
}

/* ==============================================
   DATA LIST - COPY PASTE READY
   ============================================== */
.module-isolated-newmodule__list {
    background: var(--color-surface);
    border-radius: var(--radius-md);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--color-border);
}

.module-isolated-newmodule__list__item {
    padding: var(--spacing-lg);
    border-bottom: 1px solid var(--color-border);
    transition: var(--transition-base);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
}

.module-isolated-newmodule__list__item:last-child {
    border-bottom: none;
}

.module-isolated-newmodule__list__item:hover {
    background: var(--color-background);
}

.module-isolated-newmodule__avatar {
    width: 64px;
    height: 64px;
    border-radius: var(--radius-lg);
    overflow: hidden;
    flex-shrink: 0;
    background: var(--color-border);
}

.module-isolated-newmodule__avatar__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.module-isolated-newmodule__info {
    flex: 1;
    min-width: 0;
}

.module-isolated-newmodule__name {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text);
    margin: 0 0 var(--spacing-xs) 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.module-isolated-newmodule__email {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.module-isolated-newmodule__status {
    display: inline-flex;
    align-items: center;
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    text-transform: uppercase;
    letter-spacing: 0.025em;
    margin-right: var(--spacing-md);
}

.module-isolated-newmodule__status--active {
    background: rgba(16, 185, 129, 0.1);
    color: #059669;
}

.module-isolated-newmodule__status--inactive {
    background: rgba(239, 68, 68, 0.1);
    color: #DC2626;
}

.module-isolated-newmodule__status--pending {
    background: rgba(245, 158, 11, 0.1);
    color: #D97706;
}

.module-isolated-newmodule__actions {
    display: flex;
    gap: var(--spacing-sm);
    flex-shrink: 0;
}

/* ==============================================
   STATES - COPY PASTE READY
   ============================================== */
.module-isolated-newmodule__empty-state,
.module-isolated-newmodule__error-state {
    text-align: center;
    padding: var(--spacing-3xl) var(--spacing-lg);
    color: var(--color-text-muted);
}

.module-isolated-newmodule__empty-state__icon,
.module-isolated-newmodule__error-state__icon {
    font-size: 5rem;
    margin-bottom: var(--spacing-lg);
    opacity: 0.5;
}

.module-isolated-newmodule__empty-state__title,
.module-isolated-newmodule__error-state__title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text);
    margin-bottom: var(--spacing-md);
}

.module-isolated-newmodule__empty-state__description,
.module-isolated-newmodule__error-state__description {
    font-size: var(--font-size-md);
    margin-bottom: var(--spacing-xl);
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
}

/* ==============================================
   RESPONSIVE - COPY PASTE READY
   ============================================== */
@media (max-width: 768px) {
    .module-isolated-newmodule {
        padding: var(--spacing-md);
    }
    
    .module-isolated-newmodule .module-header-premium {
        padding: var(--spacing-lg);
    }
    
    .module-actions {
        justify-content: stretch;
    }
    
    .module-actions .btn {
        flex: 1;
        text-align: center;
    }
    
    .module-isolated-newmodule__stats {
        grid-template-columns: 1fr;
    }
    
    .module-isolated-newmodule__filters {
        grid-template-columns: 1fr;
        gap: var(--spacing-md);
    }
    
    .filter-buttons {
        justify-content: stretch;
    }
    
    .module-isolated-newmodule__filter-button {
        flex: 1;
        text-align: center;
    }
    
    .module-isolated-newmodule__list__item {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--spacing-md);
    }
    
    .module-isolated-newmodule__info {
        width: 100%;
    }
    
    .module-isolated-newmodule__actions {
        width: 100%;
        justify-content: stretch;
    }
    
    .module-isolated-newmodule__actions .btn {
        flex: 1;
    }
}

@media (min-width: 768px) and (max-width: 1024px) {
    .module-isolated-newmodule__stats {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (min-width: 1024px) {
    .module-isolated-newmodule__stats {
        grid-template-columns: repeat(4, 1fr);
    }
}

/* ==============================================
   LOADING STATE - COPY PASTE READY
   ============================================== */
.loading-state {
    text-align: center;
    padding: var(--spacing-3xl);
    color: var(--color-text-muted);
}

.spinner {
    width: 40px;
    height: 40px;
    margin: 0 auto var(--spacing-lg);
    border: 4px solid var(--color-border);
    border-top: 4px solid var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* ==============================================
   DARK MODE SUPPORT - COPY PASTE READY
   ============================================== */
[data-theme="dark"] .module-isolated-newmodule__stat-card {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

[data-theme="dark"] .module-isolated-newmodule__list {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

[data-theme="dark"] .module-isolated-newmodule__search:focus {
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
}
```

### 3. Backend Controller Template
```typescript
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ResponseHelper } from '@/utils/responseHelper';
import { NewModuleService } from '@/services/newModuleService';
import { validateNewModule, validateNewModuleUpdate } from '@/validators/newModuleValidator';

/**
 * NewModule Controller - Complete CRUD with validation
 */
export class NewModuleController {
    private newModuleService: NewModuleService;

    constructor() {
        this.newModuleService = new NewModuleService();
    }

    /**
     * List all with pagination and filters
     */
    async list(request: FastifyRequest<{
        Querystring: {
            page?: number;
            limit?: number;
            search?: string;
            status?: string;
            sortBy?: string;
            sortOrder?: 'asc' | 'desc';
        }
    }>, reply: FastifyReply) {
        try {
            const {
                page = 1,
                limit = 20,
                search,
                status,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = request.query;

            const result = await this.newModuleService.findAll({
                page: Number(page),
                limit: Number(limit),
                search,
                status,
                sortBy,
                sortOrder
            });

            return ResponseHelper.success(reply, result);
        } catch (error) {
            return ResponseHelper.error(reply, error);
        }
    }

    /**
     * Get by ID with relations
     */
    async getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        try {
            const { id } = request.params;
            const item = await this.newModuleService.findById(id);
            
            if (!item) {
                return ResponseHelper.notFound(reply, 'NewModule not found');
            }
            
            return ResponseHelper.success(reply, item);
        } catch (error) {
            return ResponseHelper.error(reply, error);
        }
    }

    /**
     * Create with validation
     */
    async create(request: FastifyRequest, reply: FastifyReply) {
        try {
            // Validate input
            const validationResult = validateNewModule(request.body);
            if (!validationResult.success) {
                return ResponseHelper.badRequest(reply, 'Validation failed', validationResult.errors);
            }

            const item = await this.newModuleService.create(validationResult.data);
            return ResponseHelper.created(reply, item);
        } catch (error) {
            if (error.code === 'P2002') {
                return ResponseHelper.conflict(reply, 'NewModule already exists');
            }
            return ResponseHelper.error(reply, error);
        }
    }

    /**
     * Update with validation
     */
    async update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        try {
            const { id } = request.params;
            
            // Check if exists
            const existing = await this.newModuleService.findById(id);
            if (!existing) {
                return ResponseHelper.notFound(reply, 'NewModule not found');
            }

            // Validate input
            const validationResult = validateNewModuleUpdate(request.body);
            if (!validationResult.success) {
                return ResponseHelper.badRequest(reply, 'Validation failed', validationResult.errors);
            }

            const item = await this.newModuleService.update(id, validationResult.data);
            return ResponseHelper.success(reply, item);
        } catch (error) {
            return ResponseHelper.error(reply, error);
        }
    }

    /**
     * Delete with cascade check
     */
    async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        try {
            const { id } = request.params;
            
            // Check if exists
            const existing = await this.newModuleService.findById(id);
            if (!existing) {
                return ResponseHelper.notFound(reply, 'NewModule not found');
            }

            // Check for dependencies (optional)
            const hasDependencies = await this.newModuleService.hasDependencies(id);
            if (hasDependencies) {
                return ResponseHelper.badRequest(reply, 'Cannot delete: item has dependencies');
            }

            await this.newModuleService.delete(id);
            return ResponseHelper.success(reply, { message: 'NewModule deleted successfully' });
        } catch (error) {
            return ResponseHelper.error(reply, error);
        }
    }

    /**
     * Bulk operations
     */
    async bulkDelete(request: FastifyRequest<{ Body: { ids: string[] } }>, reply: FastifyReply) {
        try {
            const { ids } = request.body;
            
            if (!Array.isArray(ids) || ids.length === 0) {
                return ResponseHelper.badRequest(reply, 'IDs array is required');
            }

            const result = await this.newModuleService.bulkDelete(ids);
            return ResponseHelper.success(reply, result);
        } catch (error) {
            return ResponseHelper.error(reply, error);
        }
    }

    /**
     * Statistics endpoint
     */
    async stats(request: FastifyRequest, reply: FastifyReply) {
        try {
            const stats = await this.newModuleService.getStats();
            return ResponseHelper.success(reply, stats);
        } catch (error) {
            return ResponseHelper.error(reply, error);
        }
    }
}
```

### 4. Prompt para IA - Copy Paste
```markdown
Você precisa criar um novo módulo chamado "NOME_DO_MODULO" para o sistema Academia Krav Maga v2.0.

## Requisitos Obrigatórios:

1. **Use este template exato**: Copie o template completo de `EXAMPLES.md` e substitua:
   - `newmodule` → `NOME_DO_MODULO` (lowercase)
   - `NewModule` → `NOME_DO_MODULO` (PascalCase)
   - `📋` → `EMOJI_DO_MODULO`

2. **Estrutura de arquivos**:
   ```
   public/js/modules/NOME_DO_MODULO/
   ├── index.js           # Template completo
   └── components/
   
   public/css/modules/NOME_DO_MODULO/
   └── NOME_DO_MODULO.css # CSS completo
   
   src/controllers/
   └── NOME_DO_MODULOController.ts # Backend
   ```

3. **Integração obrigatória**:
   - Registrar em `AcademyApp.loadModules()` array
   - Usar `window.createModuleAPI('NOME_DO_MODULO')`
   - Implementar estados: loading/empty/error
   - CSS isolation: `.module-isolated-NOME_DO_MODULO__*`

4. **Design System**:
   - Header: `.module-header-premium`
   - Stats: `.stat-card-enhanced`
   - Filtros: `.module-filters-premium`
   - Cores: `--primary-color: #667eea`, `--secondary-color: #764ba2`

5. **API Endpoints**:
   ```
   GET    /api/NOME_DO_MODULO
   POST   /api/NOME_DO_MODULO
   GET    /api/NOME_DO_MODULO/:id
   PUT    /api/NOME_DO_MODULO/:id
   DELETE /api/NOME_DO_MODULO/:id
   ```

## Não invente nada - use exatamente o template fornecido!
```

---

**Regra de Ouro**: Templates são para copiar, não para recriar. Use copy-paste e apenas substitua nomes/ícones.
