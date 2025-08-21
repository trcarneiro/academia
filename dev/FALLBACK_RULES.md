# Estratégias de Auto-Recuperação para IA

## 🎯 Objetivo: IA que se Corrige Automaticamente

### Quando a IA Encontra Problemas
1. **Endpoint não existe** → Tenta fallback ou sugere criação
2. **Arquivo não encontrado** → Busca similar ou cria scaffolding  
3. **Módulo quebrado** → Tenta reparar ou recria a partir do template
4. **Dependência faltando** → Instala automaticamente ou sugere alternativa

## 🔧 Fallback Strategies

### 1. API Endpoints - Degradação Elegante
```javascript
/**
 * Estratégia de fallback para endpoints não encontrados
 * @param {string} endpoint - Endpoint original tentado
 * @param {Object} options - Opções da requisição
 * @returns {Promise} Resposta usando fallback ou mock
 */
async function apiWithFallback(endpoint, options = {}) {
    try {
        // Tenta endpoint principal
        return await fetch(endpoint, options);
    } catch (error) {
        if (error.status === 404) {
            // Fallback 1: Busca endpoint similar
            const similar = findSimilarEndpoint(endpoint);
            if (similar) {
                console.warn(`Endpoint ${endpoint} não encontrado. Usando ${similar}`);
                return await fetch(similar, options);
            }
            
            // Fallback 2: Usa dados mockados
            console.warn(`Endpoint ${endpoint} não encontrado. Usando dados mock`);
            return getMockData(endpoint);
        }
        
        // Fallback 3: Graceful degradation
        return {
            success: false,
            data: [],
            message: `Serviço temporariamente indisponível: ${error.message}`,
            fallback: true
        };
    }
}

/**
 * Encontra endpoint similar baseado em padrões conhecidos
 */
function findSimilarEndpoint(endpoint) {
    const patterns = {
        '/api/students': ['/api/users', '/api/members'],
        '/api/classes': ['/api/lessons', '/api/sessions'],
        '/api/activities': ['/api/exercises', '/api/tasks'],
        '/api/instructors': ['/api/teachers', '/api/staff'],
        '/api/payments': ['/api/billing', '/api/transactions']
    };
    
    return patterns[endpoint]?.[0];
}

/**
 * Dados mock para desenvolvimento/fallback
 */
function getMockData(endpoint) {
    const mocks = {
        '/api/students': {
            success: true,
            data: [
                {
                    id: 'mock-1',
                    name: 'João Silva (Mock)',
                    email: 'joao.mock@example.com',
                    status: 'active',
                    createdAt: new Date().toISOString()
                }
            ],
            total: 1,
            isMock: true
        },
        '/api/classes': {
            success: true,
            data: [
                {
                    id: 'mock-class-1',
                    title: 'Krav Maga Básico (Mock)',
                    instructor: 'Prof. Mock',
                    schedule: new Date().toISOString(),
                    duration: 60
                }
            ],
            total: 1,
            isMock: true
        }
    };
    
    return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mocks[endpoint] || { success: true, data: [], isMock: true })
    });
}
```

### 2. Módulo Auto-Scaffolding
```javascript
/**
 * Cria estrutura básica de módulo quando não encontrado
 * @param {string} moduleName - Nome do módulo a ser criado
 * @returns {Promise<Object>} Módulo básico scaffolded
 */
async function scaffoldModule(moduleName) {
    console.warn(`Módulo ${moduleName} não encontrado. Criando scaffolding...`);
    
    const moduleScaffold = {
        name: moduleName,
        version: '1.0.0',
        status: 'scaffolded',
        
        // Controller básico
        controller: createBasicController(moduleName),
        
        // View básica
        view: createBasicView(moduleName),
        
        // Service básico
        service: createBasicService(moduleName),
        
        // Inicialização
        async init() {
            console.log(`Inicializando módulo scaffolded: ${moduleName}`);
            
            // Registra no core app
            if (window.app) {
                window.app.registerModule(moduleName, this);
                window.app.dispatchEvent('module:scaffolded', { name: moduleName });
            }
            
            return this;
        },
        
        // Auto-reparo
        async selfRepair() {
            console.log(`Tentando auto-reparo do módulo ${moduleName}...`);
            
            // Verifica dependências
            await this.checkDependencies();
            
            // Restaura funcionalidades básicas
            await this.restoreBasicFunctionality();
            
            return this;
        },
        
        async checkDependencies() {
            const required = ['window.app', 'window.createModuleAPI'];
            const missing = required.filter(dep => !eval(`typeof ${dep} !== 'undefined'`));
            
            if (missing.length > 0) {
                console.error(`Dependências faltando para ${moduleName}:`, missing);
                await this.loadMissingDependencies(missing);
            }
        },
        
        async loadMissingDependencies(missing) {
            for (const dep of missing) {
                await this.loadDependency(dep);
            }
        },
        
        async loadDependency(dep) {
            const loaders = {
                'window.app': () => loadScript('/js/core/app.js'),
                'window.createModuleAPI': () => loadScript('/js/shared/api-client.js')
            };
            
            const loader = loaders[dep];
            if (loader) {
                await loader();
                console.log(`Dependência ${dep} carregada com sucesso`);
            }
        },
        
        async restoreBasicFunctionality() {
            // Implementa funcionalidades mínimas do módulo
            this.basicUI = this.createBasicUI();
            this.basicAPI = this.createBasicAPI();
            
            // Adiciona ao DOM se container existe
            const container = document.getElementById(`${moduleName}-container`);
            if (container) {
                container.innerHTML = this.basicUI;
                this.attachBasicEvents(container);
            }
        },
        
        createBasicUI() {
            return `
                <div class="module-isolated-${moduleName}">
                    <div class="module-header-premium">
                        <h1>📋 ${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}</h1>
                        <p class="text-muted">Módulo em modo de recuperação - funcionalidade básica disponível</p>
                    </div>
                    
                    <div class="module-content">
                        <div class="alert alert-warning">
                            ⚠️ Este módulo está em modo de auto-recuperação. 
                            Algumas funcionalidades podem estar limitadas.
                        </div>
                        
                        <div id="${moduleName}-content">
                            <div class="loading-state">
                                <div class="spinner"></div>
                                <p>Carregando ${moduleName}...</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        },
        
        createBasicAPI() {
            return {
                async list() {
                    return await apiWithFallback(`/api/${moduleName}`);
                },
                
                async get(id) {
                    return await apiWithFallback(`/api/${moduleName}/${id}`);
                },
                
                async create(data) {
                    return await apiWithFallback(`/api/${moduleName}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                }
            };
        },
        
        attachBasicEvents(container) {
            // Event listeners básicos para funcionalidade mínima
            const refreshBtn = container.querySelector('.refresh-btn');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', () => this.refresh());
            }
        },
        
        async refresh() {
            console.log(`Atualizando módulo ${moduleName}...`);
            
            try {
                const data = await this.basicAPI.list();
                this.renderBasicList(data);
            } catch (error) {
                console.error(`Erro ao atualizar ${moduleName}:`, error);
                this.showError(error);
            }
        },
        
        renderBasicList(data) {
            const content = document.getElementById(`${moduleName}-content`);
            if (!content) return;
            
            if (data.isMock) {
                content.innerHTML = `
                    <div class="alert alert-info">
                        📊 Dados de demonstração (modo offline)
                    </div>
                    ${this.renderItems(data.data)}
                `;
            } else {
                content.innerHTML = this.renderItems(data.data);
            }
        },
        
        renderItems(items) {
            if (!items || items.length === 0) {
                return `
                    <div class="empty-state">
                        <div class="empty-icon">📄</div>
                        <h3>Nenhum item encontrado</h3>
                        <p>Não há registros de ${moduleName} no momento.</p>
                    </div>
                `;
            }
            
            return `
                <div class="module-isolated-${moduleName}__list">
                    ${items.map(item => `
                        <div class="module-isolated-${moduleName}__list__item">
                            <h4>${item.name || item.title || item.id}</h4>
                            <p class="text-muted">${item.email || item.description || 'Item básico'}</p>
                        </div>
                    `).join('')}
                </div>
            `;
        },
        
        showError(error) {
            const content = document.getElementById(`${moduleName}-content`);
            if (content) {
                content.innerHTML = `
                    <div class="error-state">
                        <div class="error-icon">⚠️</div>
                        <h3>Erro no módulo ${moduleName}</h3>
                        <p>${error.message}</p>
                        <button class="btn btn-primary" onclick="location.reload()">
                            Tentar Novamente
                        </button>
                    </div>
                `;
            }
        }
    };
    
    return moduleScaffold;
}

/**
 * Utilitário para carregar scripts dinamicamente
 */
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}
```

### 3. Arquivo Template Generator
```javascript
/**
 * Templates para criação automática de arquivos quando não encontrados
 */
const FILE_TEMPLATES = {
    // Módulo principal
    'module-index': (moduleName) => `
/**
 * @fileoverview ${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)} Module - Auto-generated
 * @module ${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}Module
 * @version 1.0.0
 * @auto-generated ${new Date().toISOString()}
 */

// Aguarda dependências
await waitForAPIClient();

// API do módulo
let ${moduleName}API = null;

/**
 * Inicializa módulo ${moduleName}
 */
async function initialize${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}Module() {
    try {
        // Setup API
        ${moduleName}API = window.createModuleAPI('${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}');
        
        // Carrega UI
        await load${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}UI();
        
        // Registra no app
        if (window.app) {
            window.app.registerModule('${moduleName}', ${moduleName}Module);
            window.app.dispatchEvent('module:loaded', { name: '${moduleName}' });
        }
        
        console.log('Módulo ${moduleName} inicializado com sucesso');
        return ${moduleName}Module;
    } catch (error) {
        console.error('Erro ao inicializar módulo ${moduleName}:', error);
        window.app?.handleError(error, 'initialize${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}Module');
        throw error;
    }
}

/**
 * Carrega interface do módulo
 */
async function load${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}UI() {
    const container = document.getElementById('${moduleName}-container');
    if (!container) {
        throw new Error('Container #${moduleName}-container não encontrado');
    }
    
    // Carrega dados
    await ${moduleName}API.fetchWithStates('/api/${moduleName}', {
        loadingElement: container,
        onSuccess: (data) => render${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}List(data),
        onEmpty: () => showEmpty${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}State(),
        onError: (error) => showError${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}State(error)
    });
}

/**
 * Renderiza lista de ${moduleName}
 */
function render${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}List(data) {
    const container = document.getElementById('${moduleName}-container');
    container.innerHTML = \`
        <div class="module-isolated-${moduleName}">
            <div class="module-header-premium">
                <h1>📋 ${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}</h1>
                <div class="module-actions">
                    <button class="btn btn-primary" onclick="create${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}()">
                        Novo ${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}
                    </button>
                </div>
            </div>
            
            <div class="module-content">
                <div class="module-isolated-${moduleName}__list">
                    \${data.map(item => \`
                        <div class="module-isolated-${moduleName}__list__item" onclick="edit${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}('\${item.id}')">
                            <h4>\${item.name || item.title}</h4>
                            <p class="text-muted">\${item.email || item.description}</p>
                        </div>
                    \`).join('')}
                </div>
            </div>
        </div>
    \`;
}

/**
 * Estado vazio
 */
function showEmpty${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}State() {
    const container = document.getElementById('${moduleName}-container');
    container.innerHTML = \`
        <div class="module-isolated-${moduleName}">
            <div class="module-header-premium">
                <h1>📋 ${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}</h1>
            </div>
            
            <div class="empty-state">
                <div class="empty-icon">📄</div>
                <h3>Nenhum ${moduleName} encontrado</h3>
                <p>Comece criando seu primeiro ${moduleName}.</p>
                <button class="btn btn-primary" onclick="create${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}()">
                    Criar ${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}
                </button>
            </div>
        </div>
    \`;
}

/**
 * Estado de erro
 */
function showError${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}State(error) {
    const container = document.getElementById('${moduleName}-container');
    container.innerHTML = \`
        <div class="module-isolated-${moduleName}">
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <h3>Erro ao carregar ${moduleName}</h3>
                <p>\${error.message}</p>
                <button class="btn btn-primary" onclick="location.reload()">
                    Tentar Novamente
                </button>
            </div>
        </div>
    \`;
}

/**
 * Ações básicas
 */
function create${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}() {
    // TODO: Implementar criação
    console.log('Criar ${moduleName} - implementar');
}

function edit${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}(id) {
    // TODO: Implementar edição
    console.log('Editar ${moduleName}:', id);
}

// Módulo principal
const ${moduleName}Module = {
    name: '${moduleName}',
    version: '1.0.0',
    init: initialize${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}Module,
    api: () => ${moduleName}API
};

// Exporta para uso global
window.${moduleName}Module = ${moduleName}Module;

// Auto-inicializa se app está disponível
if (window.app && window.app.isReady) {
    initialize${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}Module();
}
`,

    // CSS básico
    'module-css': (moduleName) => `
/* ==============================================
   ${moduleName.toUpperCase()} MODULE - AUTO-GENERATED
   Generated: ${new Date().toISOString()}
   ============================================== */

/* Base Module Container */
[data-module="${moduleName}"] {
    --module-primary: var(--primary-color);
    --module-accent: var(--secondary-color);
}

/* Header Premium */
.module-isolated-${moduleName} .module-header-premium {
    background: var(--gradient-primary);
    padding: var(--spacing-lg);
    border-radius: var(--radius-md);
    margin-bottom: var(--spacing-lg);
}

/* List Styles */
.module-isolated-${moduleName}__list {
    background: var(--color-surface);
    border-radius: var(--radius-md);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
}

.module-isolated-${moduleName}__list__item {
    padding: var(--spacing-md);
    border-bottom: 1px solid var(--color-border);
    cursor: pointer;
    transition: var(--transition-base);
}

.module-isolated-${moduleName}__list__item:hover {
    background: var(--color-background);
}

.module-isolated-${moduleName}__list__item:last-child {
    border-bottom: none;
}

/* States */
.module-isolated-${moduleName} .empty-state,
.module-isolated-${moduleName} .error-state {
    text-align: center;
    padding: var(--spacing-3xl);
    color: var(--color-text-muted);
}

.module-isolated-${moduleName} .empty-icon,
.module-isolated-${moduleName} .error-icon {
    font-size: 4rem;
    margin-bottom: var(--spacing-lg);
    opacity: 0.5;
}

/* Responsive */
@media (max-width: 768px) {
    .module-isolated-${moduleName} .module-header-premium {
        padding: var(--spacing-md);
    }
    
    .module-isolated-${moduleName}__list__item {
        padding: var(--spacing-sm);
    }
}
`,

    // Backend Controller
    'backend-controller': (moduleName) => `
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ResponseHelper } from '@/utils/responseHelper';
import { ${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}Service } from '@/services/${moduleName}Service';

/**
 * ${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)} Controller - Auto-generated
 * Generated: ${new Date().toISOString()}
 */
export class ${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}Controller {
    private ${moduleName}Service: ${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}Service;

    constructor() {
        this.${moduleName}Service = new ${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}Service();
    }

    /**
     * Get all ${moduleName}
     */
    async list(request: FastifyRequest, reply: FastifyReply) {
        try {
            const ${moduleName} = await this.${moduleName}Service.findAll();
            return ResponseHelper.success(reply, ${moduleName});
        } catch (error) {
            return ResponseHelper.error(reply, error);
        }
    }

    /**
     * Get ${moduleName} by ID
     */
    async getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        try {
            const { id } = request.params;
            const ${moduleName.slice(0, -1)} = await this.${moduleName}Service.findById(id);
            
            if (!${moduleName.slice(0, -1)}) {
                return ResponseHelper.notFound(reply, '${moduleName.charAt(0).toUpperCase() + moduleName.slice(1, -1)} not found');
            }
            
            return ResponseHelper.success(reply, ${moduleName.slice(0, -1)});
        } catch (error) {
            return ResponseHelper.error(reply, error);
        }
    }

    /**
     * Create new ${moduleName.slice(0, -1)}
     */
    async create(request: FastifyRequest, reply: FastifyReply) {
        try {
            const ${moduleName.slice(0, -1)} = await this.${moduleName}Service.create(request.body);
            return ResponseHelper.created(reply, ${moduleName.slice(0, -1)});
        } catch (error) {
            return ResponseHelper.error(reply, error);
        }
    }

    /**
     * Update ${moduleName.slice(0, -1)}
     */
    async update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        try {
            const { id } = request.params;
            const ${moduleName.slice(0, -1)} = await this.${moduleName}Service.update(id, request.body);
            return ResponseHelper.success(reply, ${moduleName.slice(0, -1)});
        } catch (error) {
            return ResponseHelper.error(reply, error);
        }
    }

    /**
     * Delete ${moduleName.slice(0, -1)}
     */
    async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        try {
            const { id } = request.params;
            await this.${moduleName}Service.delete(id);
            return ResponseHelper.success(reply, { message: '${moduleName.charAt(0).toUpperCase() + moduleName.slice(1, -1)} deleted successfully' });
        } catch (error) {
            return ResponseHelper.error(reply, error);
        }
    }
}
`
};

/**
 * Gera arquivo a partir de template
 */
function generateFromTemplate(templateName, moduleName, customParams = {}) {
    const template = FILE_TEMPLATES[templateName];
    if (!template) {
        throw new Error(\`Template \${templateName} não encontrado\`);
    }
    
    return template(moduleName, customParams);
}
```

## 🚨 Estratégias de Emergência

### 1. Modo Offline Completo
```javascript
/**
 * Ativa modo offline quando API está indisponível
 */
function activateOfflineMode() {
    console.warn('🔴 Ativando modo offline - API indisponível');
    
    // Notifica usuário
    showOfflineNotification();
    
    // Usa dados em cache
    const cachedData = loadFromCache();
    
    // Habilita sync quando voltar online
    setupOnlineDetection();
    
    return cachedData;
}

function showOfflineNotification() {
    const notification = document.createElement('div');
    notification.className = 'offline-notification';
    notification.innerHTML = `
        <div class="offline-banner">
            📡 Modo Offline - Dados podem estar desatualizados
            <button onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    document.body.prepend(notification);
}
```

### 2. Auto-Reparo de Módulos
```javascript
/**
 * Verifica integridade do módulo e repara se necessário
 */
async function healthCheck(moduleName) {
    const checks = [
        () => checkAPIEndpoints(moduleName),
        () => checkDOMElements(moduleName),
        () => checkEventListeners(moduleName),
        () => checkDependencies(moduleName)
    ];
    
    const results = await Promise.allSettled(checks.map(check => check()));
    const failures = results.filter(r => r.status === 'rejected');
    
    if (failures.length > 0) {
        console.warn(\`Módulo \${moduleName} precisa de reparo:\`, failures);
        await repairModule(moduleName, failures);
    }
    
    return { healthy: failures.length === 0, repairs: failures.length };
}
```

---

**Regra de Ouro**: IA deve sempre tentar se recuperar antes de falhar completamente.
