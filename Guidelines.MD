# Guidelines for AI-Driven Development v1.0
**Document ID**: Guidelines.md  
**Last Updated**: 08/17/2025  
**Status**: ACTIVE  

This document provides universal guidelines for AI-assisted software development, ensuring minimal rework, system stability, and scalability. It is designed for any AI agent (e.g., Grok, Claude) and applies to any project. All modifiChecklist de aceitação por módulo:
- Validador do Design System: 100% (sem "Módulo <x> migrado: Container não encontrado").
- Console sem erros; estados loading/empty/error cobertos.
- Botões com `.btn-form` variantes corretas e foco acessível; ações primárias visíveis.
- API usando `shared/api-client`; respostas normalizadas; sem dados hardcoded.

### Módulos Padronizados (Referência para Futuros)

#### ✅ Activities Module (Atividades)
**Localização**: `public/js/mod  - Exposição mínima ao `window.*` apenas para handlers de clique necessários.
- UI/Estados
  - Layout full-screen responsivo; grid Guidelines; tabelas com `.module-isolated-table` quando aplicável.

## 🏗️ **Templates de Implementação Universal**

### **📋 Template Dual-Screen (Lista + Editor)**

#### **JavaScript Structure**
```javascript
/**
 * [ModuleName] Module - Guidelines.MD Compliant
 * Following MVC architecture with dual-screen pattern
 */
(function() {
    'use strict';
    
    console.log('[ÍCONE] [ModuleName] Module - Initializing with MVC controllers...');
    
    // ==============================================
    // API CLIENT INTEGRATION (Guidelines.MD)
    // ==============================================
    
    let moduleAPI = null;
    
    async function initializeAPI() {
        if (!moduleAPI && window.createModuleAPI) {
            moduleAPI = window.createModuleAPI('[ModuleName]');
            console.log('🌐 [ModuleName] API helper initialized');
        }
    }
    
    // Module state
    let listController = null;
    let editorController = null;
    let isInitialized = false;
    
    // ==============================================
    // LIST CONTROLLER TEMPLATE
    // ==============================================
    
    class [ModuleName]ListController {
        constructor() {
            this.container = null;
            this.currentData = [];
            this.filteredData = [];
            this.pagination = { page: 1, limit: 12, total: 0 };
            this.filters = {};
        }
        
        async init(container) {
            this.container = container;
            await this.render();
            this.bindEvents();
            await this.loadData();
        }
        
        async render() {
            // Inject CSS
            this.injectCSS();
            
            this.container.innerHTML = `
                <div class="module-isolated-container" data-module="[module-name]">
                    ${this.renderHeader()}
                    ${this.renderStats()}
                    ${this.renderFilters()}
                    ${this.renderViewSwitcher()}
                    ${this.renderContent()}
                    ${this.renderPagination()}
                    ${this.renderEmptyState()}
                </div>
            `;
        }
        
        renderHeader() {
            return `
                <div class="module-header-premium">
                    <div class="header-content">
                        <div class="header-left">
                            <div class="breadcrumb-enhanced">
                                <span class="breadcrumb-home">🏠 Home</span>
                                <i class="fas fa-chevron-right"></i>
                                <span class="breadcrumb-current">[ÍCONE] [NOME_MÓDULO]</span>
                            </div>
                            <h1 class="module-title-enhanced">
                                <span class="title-icon animated">[ÍCONE]</span>
                                Gestão de [Entidades]
                                <span class="title-badge">Premium</span>
                            </h1>
                            <p class="module-subtitle-enhanced">
                                Gerencie todos os [entidades] da academia
                                <span class="help-tooltip" title="Tutorial disponível">❓</span>
                            </p>
                        </div>
                        <div class="header-actions-enhanced">
                            <div class="quick-actions">
                                <button type="button" class="btn-form btn-info-form btn-small">
                                    <i class="fas fa-upload"></i>
                                    Importar
                                </button>
                                <button type="button" class="btn-form btn-secondary-form btn-small">
                                    <i class="fas fa-download"></i>
                                    Exportar
                                </button>
                            </div>
                            <button type="button" class="btn-form btn-primary-form btn-large" onclick="open[ModuleName]Editor()">
                                <i class="fas fa-plus-circle"></i>
                                Criar [Entidade]
                                <span class="btn-shortcut">Ctrl+N</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // ... demais métodos seguindo padrão lesson-plans
    }
    
    // ==============================================
    // EDITOR CONTROLLER TEMPLATE
    // ==============================================
    
    class [ModuleName]EditorController {
        constructor() {
            this.container = null;
            this.itemId = null;
            this.itemData = null;
            this.isDirty = false;
            this.isReadOnly = false;
            this.validationRules = {};
        }
        
        async init(container, itemId = null, isReadOnly = false) {
            this.container = container;
            this.itemId = itemId;
            this.isReadOnly = isReadOnly;
            
            await this.render();
            this.bindEvents();
            
            // Load dependencies first
            await this.loadDependencies();
            
            if (itemId) {
                await this.loadItemData();
            } else {
                this.initializeNewItem();
            }
        }
        
        // ... implementação completa seguindo padrão wizard
    }
    
    // ==============================================
    // MODULE INITIALIZATION
    // ==============================================
    
    async function init[ModuleName]() {
        if (isInitialized) return;
        
        await initializeAPI();
        
        // Expose global functions for navigation
        window.open[ModuleName]Editor = open[ModuleName]Editor;
        window.view[ModuleName] = view[ModuleName];
        window.delete[ModuleName] = delete[ModuleName];
        
        isInitialized = true;
        console.log('✅ [ModuleName] Module initialized successfully');
    }
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init[ModuleName]);
    } else {
        init[ModuleName]();
    }
    
})();
```

#### **CSS Structure Template**
```css
/* ==============================================
   [MODULE-NAME] PREMIUM STYLES
   ============================================== */

/* Base Module Container */
[data-module="[module-name]"] {
    --module-primary: var(--color-primary);
    --module-secondary: var(--color-secondary);
    --module-accent: var(--color-accent);
}

/* Header Premium */
.module-header-premium {
    background: linear-gradient(135deg, var(--color-surface) 0%, var(--color-background) 100%);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    padding: var(--spacing-lg);
    margin-bottom: var(--spacing-lg);
    position: relative;
    overflow: hidden;
}

.module-header-premium::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: var(--gradient-primary);
}

/* Statistics Cards Premium */
.module-stats-premium {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
}

.stat-card-enhanced {
    background: linear-gradient(135deg, var(--color-surface) 0%, var(--color-background) 100%);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    padding: var(--spacing-lg);
    position: relative;
    overflow: hidden;
    transition: var(--transition-bounce);
}

.stat-card-enhanced:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-medium);
}

.stat-card-enhanced::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: var(--stat-gradient, var(--gradient-primary));
}

.stat-card-enhanced.primary { --stat-gradient: var(--gradient-primary); }
.stat-card-enhanced.secondary { --stat-gradient: var(--gradient-secondary); }
.stat-card-enhanced.success { --stat-gradient: var(--gradient-success); }
.stat-card-enhanced.warning { --stat-gradient: var(--gradient-warning); }

/* Cards Premium */
.data-card-premium {
    background: linear-gradient(135deg, var(--color-surface) 0%, var(--color-background) 100%);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    padding: 0;
    transition: var(--transition-bounce);
    position: relative;
    overflow: hidden;
    box-shadow: var(--shadow-card);
}

.data-card-premium:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-large);
    border-color: var(--color-primary);
}

/* Filters Premium */
.module-filters-premium {
    background: linear-gradient(135deg, var(--color-background) 0%, var(--color-border) 100%);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    padding: var(--spacing-lg);
    margin-bottom: var(--spacing-lg);
}

.search-input-premium {
    width: 100%;
    padding: var(--spacing-md) var(--spacing-md) var(--spacing-md) var(--spacing-xxl);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-lg);
    font-size: var(--font-size-base);
    transition: var(--transition-normal);
    background: var(--color-surface);
}

.search-input-premium:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    outline: none;
}

/* Responsive Design */
@media (max-width: 768px) {
    .module-header-premium .header-content {
        flex-direction: column;
        gap: var(--spacing-md);
    }
    
    .module-stats-premium {
        grid-template-columns: 1fr;
    }
    
    .data-grid-premium {
        grid-template-columns: 1fr;
    }
}

/* Form Wizard Premium */
.form-wizard-premium {
    background: var(--color-surface);
    border-radius: var(--radius-xl);
    overflow: hidden;
    box-shadow: var(--shadow-card);
}

.form-progress-premium {
    background: linear-gradient(135deg, var(--color-background) 0%, var(--color-border) 100%);
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-lg);
}

.wizard-step {
    padding: var(--spacing-lg);
    display: none;
    animation: fadeInSlide 0.5s ease;
}

.wizard-step.active {
    display: block;
}

@keyframes fadeInSlide {
    from {
        opacity: 0;
        transform: translateX(20px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
    [data-module="[module-name]"] {
        --color-surface: var(--color-surface-dark);
        --color-border: var(--color-border-dark);
        --color-text-primary: var(--color-text-inverse);
    }
}
```

### **🎯 Padrão de Nomenclatura Universal**

#### **Entidades e Contextos**
```markdown
## PADRÕES DE NOMENCLATURA:

### Entidades (sempre plural para módulos):
- students (alunos)
- lesson-plans (planos-de-aula) 
- activities (atividades)
- courses (cursos)
- instructors (instrutores)
- payments (pagamentos)

### IDs e Classes CSS:
- Container: [module-name] (kebab-case)
- Controllers: [ModuleName]ListController, [ModuleName]EditorController (PascalCase)
- API: createModuleAPI('[ModuleName]') (PascalCase)
- Functions: open[ModuleName]Editor() (camelCase)
- CSS Classes: .[module-name]-[component] (kebab-case)

### Ícones Padrão por Módulo:
- 👥 Alunos/Students
- 📚 Planos de Aula/Lesson Plans  
- 🏃 Atividades/Activities
- 🎓 Cursos/Courses
- 👨‍🏫 Instrutores/Instructors
- 💰 Pagamentos/Payments
- 📊 Relatórios/Reports
- ⚙️ Configurações/Settings
```

Checklist de aceitação por módulo:
- Validador do Design System: 100% (sem "Módulo <x> migrado: Container não encontrado").
- Console sem erros; estados loading/empty/error cobertos.
- Botões com `.btn-form` variantes corretas e foco acessível; ações primárias visíveis.
- API usando `shared/api-client`; respostas normalizadas; sem dados hardcoded.
- **Cores Unificadas**: Paleta #667eea, #764ba2 (não #3b82f6, #f8fafc hardcoded).
- **Classes Premium**: .module-header-premium, .stat-card-enhanced (não .module-header simples).
- **Textos Padronizados**: "Gerencie todos os [entidades] da academia" + help tooltips.
- **Breadcrumb Enhanced**: Home / Módulo com navegação contextual.

Como solicitar (curto e direto):
- **Para módulo MVP → Premium**: "Migrar módulo [nome] para padrão premium Guidelines.MD mantendo funcionalidades atuais."
- **Para módulo novo**: "Implementar módulo [nome] seguindo template premium Guidelines.MD completo."
- **Para auditoria**: "Auditar módulo [nome] contra Guidelines.MD e corrigir inconsistências identificadas."

## 🚀 **Exemplos Práticos de Implementação Premium**

### **📝 Como Solicitar Módulo Premium Completo**

#### **Prompt Ideal para AI:**
```
"Implementar módulo [NOME] seguindo template premium Guidelines.MD:

ESTRUTURA:
- Dual-screen: Lista premium + Editor wizard
- MVC: [Nome]ListController + [Nome]EditorController  
- API: createModuleAPI('[Nome]') com fetchWithStates
- CSS: Modules isolados com design system unificado

FUNCIONALIDADES:
- Header enhanced com breadcrumb e ações
- Stats dashboard com 4 cards premium
- Filtros avançados: busca + [filtro1] + [filtro2] + [filtro3]
- Cards premium com badges, meta-info e ações
- Editor wizard 4-steps: Info Básicas → [Step2] → [Step3] → [Step4]  
- Form validation em tempo real
- Estados empty/loading/error informativos
- Responsividade mobile-first completa"
```

### **🔍 Validação de Consistência Visual**

#### **Checklist Visual Universal:**
```markdown
## CORES E GRADIENTES:
□ Paleta unificada: #667eea, #764ba2, #f093fb
□ Gradientes consistentes: primary, secondary, success, warning, danger
□ Dark mode: variáveis CSS adaptáveis
□ Contraste WCAG 2.1 AA: mínimo 4.5:1

## COMPONENTES:
□ Headers: mesmo padrão de breadcrumb, título, subtitle, ações
□ Stats cards: mesmo layout, gradientes, hover effects
□ Filters: mesmo estilo de input, select, buttons
□ Cards: mesma estrutura header/content/footer
□ Forms: mesmo padrão de labels, inputs, validation
□ Buttons: .btn-form variants consistentes
□ Empty states: mesmo layout ilustração/texto/ações

## RESPONSIVIDADE:
□ Breakpoints: 768px (tablet), 1024px (desktop), 1440px (large)
□ Grid: mobile(1col), tablet(2col), desktop(3-4col)
□ Touch targets: mínimo 44px no mobile
```

### **🎯 Prompts Especializados por Contexto**

#### **Para Novo Módulo Completo:**
```
"Criar módulo [NOME] completo seguindo Guidelines.MD template premium: dual-screen MVC, stats dashboard, filtros avançados, cards premium, editor wizard, validação tempo real, estados informativos, responsivo mobile-first."
```

#### **Para Melhorar Módulo Existente:**
```
"Migrar módulo [NOME] para padrão premium Guidelines.MD: manter funcionalidade atual, aplicar design system unificado, adicionar stats cards, melhorar filtros, converter para cards premium, adicionar validação visual."
```

#### **Para Correção de Inconsistências:**
```
"Auditar módulo [NOME] contra Guidelines.MD: verificar cores/tipografia/espaçamentos, corrigir componentes não-padrão, unificar com design system, garantir responsividade, validar acessibilidade."
```es/`
**Estrutura**: MVC completo com controllers isolados
**Características**:
- Controller de lista: `ActivitiesListController` com pesquisa, filtros, paginação
- Controller de editor: `ActivityEditorController` com validação em tempo real
- API client integrado com `createModuleAPI('Activities')`
- CSS isolado em `public/css/modules/activities.css` com padrão `module-isolated-container`
- Form validation avançada com feedback visual
- Estados de loading, empty e error implementados

#### ✅ Lesson Plans Module (Planos de Aula)
**Localização**: `public/js/modules/lesson-plans.js` (arquivo único com dual controllers)
**Estrutura**: MVC avançado com embedded controllers para compatibilidade SPA
**Características Implementadas**:
- **Dual Controllers Embedded**: `LessonPlansListController` e `LessonPlanEditorController` no mesmo arquivo
- **Lista Funcional**: Busca em tempo real, filtros (curso/nível), paginação com 10 itens por página
- **Editor Básico**: Estrutura preparada para wizard, validação async, course loading sequence
- **API Integration**: `createModuleAPI('LessonPlans')` implementado com fetchWithStates
- **CSS Dual**: `lesson-plans.css` (lista) + `lesson-plans-editor.css` (editor) com injeção automática
- **Statistics Real**: 3 cards (Total Planos, Cursos Ativos, Duração Média) com cálculos dinâmicos
- **Table View**: Estrutura tabular com actions (visualizar, editar, excluir)
- **Empty State**: Tratamento de estado vazio com mensagem contextual
- **Responsive Base**: Estrutura responsiva com mobile-first approach

**Características Pendentes (vs Template Premium)**:
- ❌ Header premium com breadcrumb enhanced
- ❌ Quick actions (Importar/Exportar)
- ❌ Cards premium (ainda usando tabela simples)
- ❌ Filtros avançados (falta dificuldade/duração)
- ❌ Editor wizard completo (estrutura básica apenas)
- ❌ Form validation visual (.field-valid/.field-invalid)
- ❌ Dark mode variables (usando cores hardcoded)

**Status Atual**: ✅ **MVP Funcional** - Lista e estrutura básica implementada, pronto para migração premium

**Próximos Passos**:
1. Migrar para template premium Guidelines.MD
2. Implementar header enhanced com breadcrumb
3. Converter tabela para cards premium
4. Completar editor wizard 4-steps
5. Aplicar design system unificado (cores #667eea vs #3b82f6)

**Padrões Estabelecidos**:
- Arquitetura MVC consistente entre módulos
- API client pattern padronizado
- CSS module isolation com `data-module` attributes
- Form validation pattern reutilizável
- Loading states e error handling consistentes
- btn-form system compliance
- Design System tokens usage

### **🔄 Migração Lesson Plans para Premium**

#### **Status Atual vs Template Premium**
```markdown
IMPLEMENTADO (MVP):
✅ Dual controllers embedded
✅ API integration com createModuleAPI
✅ Busca e filtros básicos (curso, nível)
✅ Paginação funcional
✅ Statistics dashboard (3 cards)
✅ Table view com actions
✅ CSS modules separados
✅ Empty states tratados
✅ Async loading sequence (courses)

PENDENTE (Premium):
❌ Header enhanced (breadcrumb, quick actions, shortcuts)
❌ Cards premium (vs table atual)
❌ Filtros avançados (dificuldade, duração)
❌ Editor wizard 4-steps
❌ Form validation visual
❌ Design system unificado (#667eea vs #3b82f6)
❌ Dark mode support
❌ Micro-interações e animações
```

#### **Prompt para Migração Completa**
```
"Migrar módulo Lesson Plans para padrão premium Guidelines.MD:

MANTER FUNCIONALIDADE:
- Dual controllers embedded atuais
- API integration funcionando
- Busca e filtros existentes
- Paginação e statistics

APLICAR TEMPLATE PREMIUM:
- Header enhanced: breadcrumb + quick actions (Importar/Exportar) + shortcut Ctrl+N
- Converter tabela para cards premium com badges e meta-info
- Adicionar filtros: dificuldade (★) e duração (⚡🕐⏰)
- Editor wizard 4-steps: Info Básicas → Conteúdo → Estrutura → Recursos
- Form validation visual (.field-valid/.field-invalid + shake animation)
- Design system: #667eea, gradientes, CSS variables
- View switcher: Cards / Table / Timeline
- Micro-interações: hover effects, transitions

MANTER COMPATIBILIDADE:
- Embedded controllers (não separar arquivos)
- CSS injection automática  
- Endpoints atuais /api/lesson-plans
- Navigation functions (openLessonPlanEditor, etc.)"
```

#### **🔍 Inconsistências Identificadas**

##### **1. Cores Não-Padronizadas**
```css
/* ATUAL (lesson-plans.css) */
color: #3b82f6;  /* Azul padrão Tailwind */
color: #f8fafc;  /* Background claro */

/* GUIDELINES.MD */
--color-primary: #667eea;  /* Primary unificada */
--color-surface: #ffffff;  /* Background consistente */
```

##### **2. Classes CSS Antigas**
```html
<!-- ATUAL -->
<div class="module-header">
<div class="module-stats">
<div class="stat-card">

<!-- GUIDELINES.MD PREMIUM -->
<div class="module-header-premium">
<div class="module-stats-premium">  
<div class="stat-card-enhanced">
```

##### **3. Textos Não-Padronizados**
```html
<!-- ATUAL -->
<p class="module-subtitle">Gerencie os planos de aula dos cursos</p>

<!-- GUIDELINES.MD PADRÃO -->
<p class="module-subtitle-enhanced">
    Gerencie todos os planos de aula da academia
    <span class="help-tooltip" title="Tutorial disponível">❓</span>
</p>
```

##### **4. Estrutura Não-Premium**
```markdown
FALTANDO:
- Breadcrumb: 🏠 Home / 📚 Planos de Aula
- Quick actions: Importar/Exportar buttons
- Shortcuts: Ctrl+N no botão principal
- Help tooltips: Explicações contextuais
- Status badges: Premium, Draft, etc.
- Trend indicators: +3 esta semana, ↗️ crescente
```

Como solicitar (curto e direto): must follow this workflow, reading CurrentArchitecture.md and ProposedArchitecture.md (if exists) before changes. Best practices are drawn from Anthropic (https://www.anthropic.com/engineering/claude-code-best-practices), ForgeCode (https://forgecode.dev/blog/ai-agent-best-practices/), and ClaudeLog (https://claudelog.com/).
📜 Overview

Purpose: Guide AI-driven development to maintain modularity, security, and consistency.
Scope: Applicable to any software project, with or without existing architecture.
Key Principles:
Modularity: Isolated components to prevent regressions.
API-First: Data sourced from APIs, no hardcoded values.
Full-Screen UI: Dedicated pages for CRUD operations, no modals.
Verification: Check existing functionality before coding.


Architecture Files:
CurrentArchitecture.md: Documents the active system architecture.
ProposedArchitecture.md: Outlines proposed changes (if applicable).
Rule: If ProposedArchitecture.md is accepted, merge into CurrentArchitecture.md and delete ProposedArchitecture.md.



⚙️ Environment Setup

Generic Setup:
Initialize project: npm install or equivalent.
Start server: npm run dev or project-specific command.
Check documentation: Look for docs/, README.md, or API specs (e.g., Swagger).


AI Configuration:
Set API keys in .ai/settings.json or equivalent.
Configure allowlist: Edit, Bash(git commit:*) by default.


AI Prompt: "Initialize environment for [project]; list setup commands and verify documentation."

🛠️ Common Commands

Build: npm run build or equivalent.
Test: npm run test
Lint: npm run lint
Typecheck: npm run typecheck (if TypeScript).
Version Control:version-tool create "[description]"
version-tool check
version-tool list
version-tool rollback [VERSION_ID]


Search Existing:file_search: **/*module-name*
grep_search: "functionality keywords"


Health Check: curl http://localhost:[port]/health or equivalent.
AI Commands:
/fix-issue $ARGUMENTS: Analyze and resolve issues.
/clear: Reset AI context to avoid token bloat.


AI Prompt: "List common commands for [project]; verify version control and health check."

📝 Code Style Guidelines

Language: Prefer modern standards (e.g., TypeScript, ES modules).
Naming:
Functions: Descriptive, purpose-specific (e.g., getUserData).
CSS: Isolated prefixes (e.g., .module-isolated-*).
IDs/Tabs: Context-aligned (e.g., data-tab="user-profile").


Structure:
Modules: In src/modules/ or equivalent.
CSS: In styles/modules/ or equivalent.
No core file modifications unless explicitly allowed.


API-First:
Fetch data from APIs (e.g., /api/users/[id]).
Forbidden: Hardcoded data (e.g., "John Doe", "$100").
Handle: Loading, empty, and error states.

📡 API Client Standards (REQUIRED)

All modules MUST use the centralized API Client pattern:

```javascript
// 1. Initialize API helper for your module
let moduleAPI = null;

async function initializeAPI() {
    await waitForAPIClient();
    moduleAPI = window.createModuleAPI('ModuleName');
    console.log('🌐 ModuleName API helper initialized');
}

// 2. Use fetchWithStates for automatic UI states
async function loadData() {
    if (!moduleAPI) await initializeAPI();
    
    const result = await moduleAPI.fetchWithStates('/api/endpoint', {
        loadingElement: document.getElementById('tableBody'),
        onSuccess: (data) => {
            // Handle successful data
            renderData(data);
        },
        onEmpty: () => {
            // Handle empty state
            showEmptyMessage();
        },
        onError: (error) => {
            // Handle error state
            showErrorMessage(error);
        }
    });
}

// 3. Use saveWithFeedback for CRUD operations
async function saveData(data) {
    const result = await moduleAPI.saveWithFeedback('/api/endpoint', data, {
        method: 'POST',
        onSuccess: (result) => console.log('✅ Data saved'),
        onError: (error) => console.error('❌ Save failed:', error)
    });
}
```

Response Format (Guidelines.MD compliance):
```javascript
{
    success: boolean,
    data: any,
    message: string,
    pagination?: object,
    meta?: object
}
```

Modularity:
Use a module loader (e.g., ModuleLoader.loadModule()) or equivalent.
Fallback to original functions if module fails.


Context Consistency:
Use business-relevant terminology.
Avoid duplicate icons or unclear labels.


AI Prompt: "Apply code style for [feature]: use modular structure, API-first, and consistent naming."

🚀 AI-Driven Development Workflow
AI agents must follow this workflow to prevent errors and ensure consistency:
1. Pre-Development Verification

Goal: Avoid duplicating or breaking existing functionality.
Actions:
Read: CurrentArchitecture.md and ProposedArchitecture.md (if exists).
Search:file_search: **/*module-name*
grep_search: "functionality keywords"


Check: Module, core, and view directories.
Rule: Use existing code if available; fix if broken; create only if absent.


AI Prompt: "Read CurrentArchitecture.md and ProposedArchitecture.md; verify existing functionality for [feature]. List matches or confirm absence."

2. Analysis & Planning

Goal: Plan changes to align with architecture.
Output:
Impact Analysis: Affected files, modules, APIs.
Blueprint: File structure for new modules/CSS/UI.
Risk Assessment: Conflicts with protected files or systems.
API Contract: Endpoints, methods, schemas.


AI Prompt: "Generate analysis for [feature]: impact, blueprint, risks, API contract per Guidelines.md."

3. Implementation Plan

Goal: Detail execution steps.
Output:
Files to create/modify.
Version control commands.
Code snippets (JS/CSS/UI) adhering to standards.


AI Prompt: "Create implementation plan for [feature]: list files, commands, snippets."

4. Coding

Goal: Implement feature with modularity and API-first principles.
Actions:
Create: Modules in src/modules/, CSS in styles/modules/.
Fetch: Data via API, handle loading/empty/error states.
UI: Full-screen pages, no modals, keep navigation visible.
Integrate: Use module loader or equivalent.


AI Prompt: "Write code for [feature] in [module].js/[module].css, fetching from [API], with full-screen UI and error handling."

5. Validation

Goal: Ensure no regressions.
Actions:
Run:version-tool check
curl http://localhost:[port]/health
npm run test
npm run lint
npm run typecheck


Browser: No JS errors (F12 console).
UI: Verify full-screen layout, responsive design, navigation visibility.


AI Prompt: "Validate [feature]: run integrity, health, tests, lint, typecheck; check browser console and UI standards."

6. Version Control

Pre-Commit:version-tool create "Starting [feature]"


Post-Commit:version-tool create "[Feature] implemented and tested"


AI Prompt: "Commit [feature] with version-tool, creating pre/post save points."

7. Rollback (If Needed)

Trigger: Console errors, failed checks, broken UI.
Actions:
List:version-tool list


Revert:version-tool rollback [VERSION_ID]




AI Prompt: "If [feature] fails, list versions, rollback to last stable, and analyze error."

8. Architecture Management

If No Software Exists:
Create CurrentArchitecture.md with initial structure.


If Software Exists:
Read CurrentArchitecture.md and ProposedArchitecture.md before changes.
Propose changes in ProposedArchitecture.md.
On acceptance, merge ProposedArchitecture.md into CurrentArchitecture.md and delete ProposedArchitecture.md.


AI Prompt: "Read CurrentArchitecture.md and ProposedArchitecture.md; propose architecture changes for [feature] in ProposedArchitecture.md."

🎨 **UI/UX Standards Premium - Template Universal**

## 🎨 **Design System Unificado**

### **Paleta de Cores Padrão**
```css
:root {
    /* === CORES PRIMÁRIAS === */
    --color-primary: #667eea;
    --color-primary-dark: #5a67d8;
    --color-primary-light: #7c3aed;
    --color-secondary: #764ba2;
    --color-accent: #f093fb;
    
    /* === GRADIENTES PADRÃO === */
    --gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    --gradient-secondary: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    --gradient-success: linear-gradient(135deg, #10b981 0%, #059669 100%);
    --gradient-warning: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    --gradient-danger: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    
    /* === CORES SEMÂNTICAS === */
    --color-success: #10b981;
    --color-warning: #f59e0b;
    --color-danger: #ef4444;
    --color-info: #3b82f6;
    
    /* === CORES DE FUNDO === */
    --color-background: #f8fafc;
    --color-background-dark: #1e293b;
    --color-surface: #ffffff;
    --color-surface-dark: #334155;
    --color-border: #e2e8f0;
    --color-border-dark: #475569;
    
    /* === CORES DE TEXTO === */
    --color-text-primary: #1e293b;
    --color-text-secondary: #64748b;
    --color-text-muted: #94a3b8;
    --color-text-inverse: #ffffff;
    
    /* === SOMBRAS PADRÃO === */
    --shadow-small: 0 1px 3px rgba(0, 0, 0, 0.1);
    --shadow-medium: 0 4px 12px rgba(0, 0, 0, 0.15);
    --shadow-large: 0 8px 25px rgba(0, 0, 0, 0.15);
    --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
    
    /* === ESPAÇAMENTOS PADRÃO === */
    --spacing-xs: 4px;
    --spacing-sm: 8px;
    --spacing-md: 16px;
    --spacing-lg: 24px;
    --spacing-xl: 32px;
    --spacing-xxl: 48px;
    
    /* === BORDER RADIUS === */
    --radius-sm: 6px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --radius-xl: 16px;
    --radius-full: 9999px;
    
    /* === TIPOGRAFIA === */
    --font-size-xs: 12px;
    --font-size-sm: 14px;
    --font-size-base: 16px;
    --font-size-lg: 18px;
    --font-size-xl: 20px;
    --font-size-2xl: 24px;
    --font-size-3xl: 30px;
    
    --font-weight-normal: 400;
    --font-weight-medium: 500;
    --font-weight-semibold: 600;
    --font-weight-bold: 700;
    
    /* === TRANSIÇÕES === */
    --transition-fast: 0.2s ease;
    --transition-normal: 0.3s ease;
    --transition-slow: 0.5s ease;
    --transition-bounce: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### **Sistema de Componentes Padronizado**

#### **1. Headers de Módulo**
```html
<!-- TEMPLATE UNIVERSAL DE HEADER -->
<div class="module-header-premium">
    <div class="header-content">
        <div class="header-left">
            <div class="breadcrumb-enhanced">
                <span class="breadcrumb-home">🏠 Home</span>
                <i class="fas fa-chevron-right"></i>
                <span class="breadcrumb-current">[ÍCONE] [NOME_MÓDULO]</span>
            </div>
            <h1 class="module-title-enhanced">
                <span class="title-icon animated">[ÍCONE]</span>
                [TÍTULO_PRINCIPAL]
                <span class="title-badge">[STATUS/TAG]</span>
            </h1>
            <p class="module-subtitle-enhanced">
                [DESCRIÇÃO_CONTEXTUAL]
                <span class="help-tooltip" title="[HELP_TEXT]">❓</span>
            </p>
        </div>
        <div class="header-actions-enhanced">
            <div class="quick-actions">
                <!-- Ações secundárias -->
                <button type="button" class="btn-form btn-info-form btn-small">
                    <i class="fas fa-[ÍCONE]"></i>
                    [AÇÃO]
                </button>
            </div>
            <!-- Ação primária -->
            <button type="button" class="btn-form btn-primary-form btn-large">
                <i class="fas fa-plus-circle"></i>
                [AÇÃO_PRINCIPAL]
                <span class="btn-shortcut">Ctrl+N</span>
            </button>
        </div>
    </div>
</div>
```

#### **2. Dashboard de Estatísticas**
```html
<!-- CARDS DE ESTATÍSTICA PREMIUM -->
<div class="module-stats-premium">
    <div class="stat-card-enhanced primary">
        <div class="stat-icon">[ÍCONE]</div>
        <div class="stat-content">
            <div class="stat-value" id="[id]Count">[VALOR]</div>
            <div class="stat-label">[LABEL]</div>
            <div class="stat-trend positive">
                <i class="fas fa-arrow-up"></i> [TENDÊNCIA]
            </div>
        </div>
    </div>
    <!-- Repetir para cada métrica -->
</div>
```

#### **3. Sistema de Filtros Avançado**
```html
<!-- FILTROS PREMIUM UNIVERSAL -->
<div class="module-filters-premium">
    <div class="filter-section-primary">
        <div class="search-enhanced">
            <div class="search-input-wrapper">
                <i class="fas fa-search search-icon"></i>
                <input type="text" class="search-input-premium" 
                       placeholder="Buscar por [CAMPOS]..." 
                       id="searchInput">
                <button class="search-clear" title="Limpar busca">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    </div>
    
    <div class="filter-section-secondary">
        <!-- Filtros específicos do módulo -->
        <div class="filter-group-enhanced">
            <label class="filter-label-premium">
                <i class="fas fa-[ÍCONE]"></i>
                [LABEL]
            </label>
            <select class="filter-select-premium" id="[filterId]">
                <option value="">[OPÇÃO_PADRÃO]</option>
                <!-- Opções dinâmicas -->
            </select>
        </div>
        
        <div class="filter-actions">
            <button type="button" class="btn-form btn-outline-form btn-small" id="clearFilters">
                <i class="fas fa-eraser"></i>
                Limpar Filtros
            </button>
        </div>
    </div>
</div>
```

#### **4. Cards Premium para Listagem**
```html
<!-- CARD UNIVERSAL PREMIUM -->
<div class="data-card-premium" data-item-id="[id]">
    <div class="card-header-premium">
        <div class="card-badges">
            <span class="badge-[tipo] [variante]">[BADGE_PRINCIPAL]</span>
            <span class="badge-level level-[n]">[BADGE_NÍVEL]</span>
        </div>
        <div class="card-actions-quick">
            <button class="quick-action-btn" title="[AÇÃO]">
                <i class="[ÍCONE]"></i>
            </button>
        </div>
    </div>
    
    <div class="card-content-premium">
        <h3 class="card-title">
            [TÍTULO_PRINCIPAL]
            <span class="card-number">#[NÚMERO]</span>
        </h3>
        
        <p class="card-description">
            [DESCRIÇÃO_RESUMIDA]
        </p>
        
        <div class="card-meta-info">
            <div class="meta-item">
                <i class="fas fa-[ÍCONE]"></i>
                <span>[METADADO]</span>
            </div>
        </div>
        
        <div class="card-tags">
            <span class="tag">[TAG1]</span>
            <span class="tag">[TAG2]</span>
            <span class="tag primary">+N mais</span>
        </div>
    </div>
    
    <div class="card-footer-premium">
        <div class="card-stats">
            <div class="stat-mini">
                <i class="fas fa-[ÍCONE]"></i>
                <span>[VALOR]</span>
            </div>
        </div>
        
        <div class="card-actions-main">
            <button class="btn-form btn-outline-form btn-small">
                <i class="fas fa-eye"></i>
                Ver
            </button>
            <button class="btn-form btn-secondary-form btn-small">
                <i class="fas fa-edit"></i>
                Editar
            </button>
        </div>
    </div>
</div>
```

#### **5. Formulários com Wizard**
```html
<!-- WIZARD STEP TEMPLATE -->
<div class="form-wizard-premium">
    <!-- Progress Indicator -->
    <div class="form-progress-premium">
        <div class="progress-steps">
            <div class="step active completed">
                <div class="step-number">1</div>
                <div class="step-label">[STEP_LABEL]</div>
            </div>
        </div>
        <div class="overall-progress">
            <div class="progress-bar">
                <div class="progress-fill" style="width: [%]%"></div>
            </div>
            <span class="progress-text">[%]% completo</span>
        </div>
    </div>
    
    <!-- Step Content -->
    <div class="wizard-step active" data-step="1">
        <div class="step-header">
            <h2 class="step-title">
                <i class="fas fa-[ÍCONE]"></i>
                [TÍTULO_STEP]
            </h2>
            <p class="step-description">[DESCRIÇÃO_STEP]</p>
        </div>
        
        <div class="form-grid-premium">
            <div class="form-section-card">
                <h3 class="card-title">
                    <i class="fas fa-[ÍCONE]"></i>
                    [SEÇÃO_TÍTULO]
                </h3>
                
                <div class="form-group-premium">
                    <label class="form-label-premium required">
                        <i class="fas fa-[ÍCONE]"></i>
                        [LABEL]
                        <span class="label-tooltip" title="[HELP]">?</span>
                    </label>
                    <input type="text" class="form-input-premium" 
                           placeholder="[PLACEHOLDER]"
                           maxlength="[MAX]" id="[fieldId]">
                    <div class="form-help-premium">
                        <span class="char-counter">0/[MAX] caracteres</span>
                    </div>
                    <div class="form-validation-premium">
                        <!-- Feedback de validação -->
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
```

#### **6. Estados Vazios Informativos**
```html
<!-- EMPTY STATE PREMIUM -->
<div class="empty-state-premium">
    <div class="empty-illustration">
        <div class="empty-icon-large">[ÍCONE_GRANDE]</div>
        <div class="empty-animation">
            <div class="floating-elements">
                <span class="element">[ÍCONE1]</span>
                <span class="element">[ÍCONE2]</span>
                <span class="element">[ÍCONE3]</span>
            </div>
        </div>
    </div>
    
    <div class="empty-content">
        <h3 class="empty-title">[TÍTULO_EMPTY]</h3>
        <p class="empty-description">
            [DESCRIÇÃO_CONTEXTUAL]
        </p>
        
        <div class="empty-suggestions">
            <h4>Sugestões:</h4>
            <ul>
                <li>[SUGESTÃO_1]</li>
                <li>[SUGESTÃO_2]</li>
                <li>[SUGESTÃO_3]</li>
            </ul>
        </div>
        
        <div class="empty-actions">
            <button class="btn-form btn-primary-form">
                <i class="fas fa-plus-circle"></i>
                [AÇÃO_PRINCIPAL]
            </button>
            <button class="btn-form btn-outline-form">
                <i class="fas fa-filter"></i>
                [AÇÃO_SECUNDÁRIA]
            </button>
        </div>
    </div>
</div>
```

### **Padrões de Texto e Mensagens**

#### **Títulos e Descrições Padrão**
```markdown
## FÓRMULAS DE TÍTULOS:
- Lista: "Gestão de [Entidade_Plural]"
- Editor: "Criar/Editar [Entidade]" 
- Subtitle: "Gerencie/Configure/Organize [contexto_específico]"

## PLACEHOLDERS PADRÃO:
- Busca: "Buscar por [campo1], [campo2]..."
- Input: "Ex: [exemplo_prático]"
- Select: "Selecione [opção]..." / "Todos os [tipos]"

## EMPTY STATES:
- Título: "Nenhum [entidade] encontrado"
- Descrição: "Parece que não há [entidades] que correspondem aos seus critérios"
- CTA: "Criar Primeiro [Entidade]"

## LOADING STATES:
- "Carregando [entidades]..."
- "Salvando [entidade]..."
- "Processando dados..."

## SUCCESS MESSAGES:
- "[Entidade] salvo com sucesso!"
- "[Entidade] criado com sucesso!"
- "[Entidade] excluído com sucesso!"

## ERROR MESSAGES:
- "Erro ao carregar [entidades]"
- "Erro ao salvar [entidade]"
- "Verifique os dados e tente novamente"
```

### **Responsividade Padrão**

#### **Breakpoints Unificados**
```css
/* Mobile First Design */
.module-container {
    padding: var(--spacing-md);
}

/* Tablet (768px+) */
@media (min-width: 768px) {
    .module-container {
        padding: var(--spacing-lg);
    }
    .module-filters-premium .filter-section-secondary {
        flex-direction: row;
        gap: var(--spacing-md);
    }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
    .data-grid-premium {
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    }
    .form-grid-premium {
        grid-template-columns: repeat(2, 1fr);
    }
}

/* Large Desktop (1440px+) */
@media (min-width: 1440px) {
    .data-grid-premium {
        grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    }
    .form-grid-premium {
        grid-template-columns: repeat(3, 1fr);
    }
}
```

### **Animações e Micro-interações**

#### **Animações Padrão**
```css
/* Hover Effects */
.card-premium:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-large);
    transition: var(--transition-bounce);
}

/* Loading Animation */
@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

/* Validation Animations */
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-4px); }
    75% { transform: translateX(4px); }
}

.field-invalid {
    animation: shake 0.5s ease;
    border-color: var(--color-danger) !important;
}

/* Success Animation */
@keyframes checkmark {
    0% { transform: scale(0); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
}

.field-valid::after {
    content: '✓';
    animation: checkmark 0.3s ease;
}
```

AI Prompt: "Implementar tela premium para [módulo] seguindo template universal Guidelines.MD: header enhanced, stats dashboard, filtros avançados, cards premium, formulário wizard, estados informativos."

🔒 Security & Permissions

API-First: Verify API endpoints before UI implementation.
Protected Files: Extend via public APIs only (e.g., no direct edits to core files).
Allowlist: Edit, Bash(git commit:*) by default; configure in .ai/settings.json.
Headless Mode: --allowedTools "Edit" for CI pipelines.
AI Prompt: "Check permissions for [task]; extend protected files via public API only."

📋 API Endpoints

Rule: Verify endpoints before coding; document in CurrentArchitecture.md.
AI Prompt: "List API endpoints for [feature] and verify usage."

🚨 Error Prevention

Prevention:
Verify existing functionality before coding.
Use module loader for integration.
Validate with tests, lint, and browser checks.


AI Prompt: "Analyze past incidents for [feature]; propose prevention steps."

🔍 AI Best Practices

Precision: Use specific prompts (e.g., "Fetch /api/users/[id], display in .module-isolated-table").
Context Management: Clear with /clear to avoid token bloat.
Thinking Mode: Use "think hard" for complex tasks.
Team Sharing: Commit Guidelines.md and architecture files to git.
AI Prompt: "Optimize [task] prompt for precision, clearing context if needed."

📋 Quality Checklist
Before submitting code:

 Read CurrentArchitecture.md and ProposedArchitecture.md.
 Verified existing functionality (file_search, grep_search).
 Created analysis and implementation plan.
 Used isolated modules/CSS with proper prefixes.
 Fetched data via API with loading/empty/error states.
 Implemented full-screen UI with navigation visibility.
 Ran validation (tests, lint, typecheck, health check).
 Created version save points pre/post-commit.

Final Note: Always read Guidelines.md, CurrentArchitecture.md, and ProposedArchitecture.md before modifications. If proposing changes, update ProposedArchitecture.md. On acceptance, merge into CurrentArchitecture.md. Strict adherence ensures stability and minimal rework.

## 🔁 Padronização de Módulos (Referência: Students)

Objetivo: padronizar funcionamento e estilo dos demais módulos seguindo o módulo de Alunos (Students) já estabilizado.

Módulos-alvo prioritários:
- ✅ Activities (Atividades) - Padronizado com MVC completo, API client, validação de formulários
- 🚧 Lesson Plans (Planos de Aula) - MVP funcional implementado, aguardando migração premium
- Plans (Planos), Courses (Cursos), Documents (Documentos), History/Attendances (Histórico/Presenças), Finance screens relacionadas, e demais módulos do SPA.

Padrões obrigatórios (seguir Students):
- Estrutura SPA
  - Container: `.module-isolated-container` com `data-module` e markup isolado por módulo.
  - Padrão de ciclo de vida: `init()`, `render(container)`, `bindEvents(container)`, `loadData()`, `update*()`, `destroy()` (removendo handlers globais via `delete window.*`).
  - Tabs/Panes quando aplicável, com apenas um pane visível por vez.
- API-First (Guidelines.MD compliance)
  - Usar `public/js/shared/api-client.js` (instância global `window.apiClient` e `createModuleAPI`).
  - Estados de UI automáticos com `ModuleAPIHelper.fetchWithStates` (loading/empty/error) e `saveWithFeedback` para CRUD.
  - Respostas normalizadas `{ success, data, message, pagination, meta }`.
- Design System e Acessibilidade
  - Botões: classes `.btn-form` com variantes `.btn-primary-form`, `.btn-secondary-form`, `.btn-danger-form` (como no Students). Ações primárias alinhadas à direita no cabeçalho/ seção.
  - Badges/status: usar `status-badge` e mapeamentos de status consistentes.
  - Acessibilidade: `aria-label` em ações; foco visível; contraste adequado.
  - CSS escopado por módulo em `public/css/modules/<module>.css`, evitando sobrescrever global. Usar tokens do DS (ex.: `--primary-color` atual `#4f46e5`; aceitar também `#667eea` quando aplicável).
- Robustez no DOM
  - Consultas defensivas; aguardar criação/render antes de query (pequeno delay/reflow quando necessário) para evitar `null` (lição aprendida em Plans).
- Feedback ao usuário
  - Banner reutilizável `showBanner(message, type)` e estados de loading por ação `setLoading(isLoading, text)`.
- Backend/Rotas
  - Alinhar endpoints ao padrão em Students (ex.: alias de cancelamento por `studentId` quando fizer sentido). Evitar validações excessivamente rígidas que causem 400 em fluxos idempotentes.

Template de implementação por módulo:
- Arquitetura JS
  - Classe `XxxModule` (ou `XxxTab`) com métodos: `constructor()`, `init()`, `render()`, `bindEvents()`, `loadData()`, `updateSection()`, `getData()`, `validate()`, `destroy()`.
  - Exposição mínima ao `window.*` apenas para handlers de clique necessários.
- UI/Estados
  - Layout full-screen responsivo; grid Guidelines; tabelas com `.module-isolated-table` quando aplicável.

Checklist de aceitação por módulo:
- Validador do Design System: 100% (sem “Módulo <x> migrado: Container não encontrado”).
- Console sem erros; estados loading/empty/error cobertos.
- Botões com `.btn-form` variantes corretas e foco acessível; ações primárias visíveis.
- API usando `shared/api-client`; respostas normalizadas; sem dados hardcoded.

Como solicitar (curto e direto):
- “Padronizar módulo <nome> seguindo o módulo de Alunos (funcionamento e estilo).”
- Opcional: listar endpoints principais do módulo e telas/ações críticas.