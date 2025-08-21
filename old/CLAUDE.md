]]# Contribution Guidelines v2.0
Last Updated: 07/12/2025
**Goal:** To ensure all code is secure, modular, and consistent. Adherence to these guidelines is essential for project stability. The full technical manual, `agents.md`, is the single source of truth for architecture and workflows.

## Development Process

### [STEP 1] 🔬 Analysis & Planning
Before implementing any new feature or refactoring, a thorough analysis is mandatory. This planning phase should produce the following:

*   **Impact Analysis:** Identify which existing files, modules, and APIs will be affected by the changes.
*   **Architectural Blueprint:** Propose a file and directory structure for any new modules, ensuring it is consistent with the guidelines in `agents.md`.
*   **Risk Assessment:** Identify potential conflicts, side-effects, or challenges, especially concerning protected modules like `PlansManager` and `ModuleLoader`.
*   **API-First Contract:** Define the necessary API endpoints, including routes, methods, and the expected request/response schemas.

### [STEP 2] 📝 Implementation Plan
Based on the analysis, create a detailed, step-by-step implementation plan. The plan must include:

*   A list of all files to be created or modified.
*   The specific `version-manager.js` commands to be run.
*   Code snippets for new modules that follow established patterns.
*   Isolated CSS class names and their corresponding file paths.

## 🚨 Core Development Principles 🚨
Violating these rules will require an immediate rollback and fix. There are no exceptions.

### 1. UI Standard: Full-Screen Only (Com Exceções)
A abordagem de "modal" ou "popup" é desencorajada neste projeto. Ações que requerem formulários complexos (ex: edição detalhada) devem usar telas dedicadas, porém **o menu lateral deve permanecer visível** em módulos onde o contexto global é essencial, como no módulo de Atividades.

*   ✅ **Regra Revisada:** Ação Complexa = Tela Dedicada com Menu Visível
*   ✅ **Table Interaction:** A double-click on any table row must navigate to a full-screen edit page.
*   ✅ **Navegação:** Telas dedicadas devem incluir botão "Voltar" mas manter o menu lateral ativo
*   ✅ **Reference Implementation:** The Students and Plans modules are the perfect examples. Replicate their behavior and structure.

### 2. Architecture: Modular & Isolated
The primary architectural goal is to protect the core system.

*   New functionality must **always** be created within isolated modules (`/js/modules/`).
*   Core files must **never** be modified directly.
*   Integration must use the `ModuleLoader`, with fallbacks to original functions.
*   CSS must be isolated in its own file with a unique prefix (e.g., `.module-name-isolated`).
*   **Reference:** The complete secure workflow is detailed in `agents.md`. Follow it precisely.

### 3. Data Integrity: API-First
Hardcoded data is considered a critical system vulnerability and is not allowed.

*   Data must **always** be fetched from an API.
*   Mock data, test arrays, or hardcoded strings must **never** be written into the application logic.
*   The UI must gracefully handle empty states (e.g., displaying a "No data found" message). The API will return `{ success: true, data: [] }` in this case.
*   `localStorage` is for temporary fallback only, as specified in `agents.md`.

**🚨 MANDATORY API-FIRST IMPLEMENTATION:**
*   **ALWAYS** verify existing APIs before creating any interface
*   **NEVER** use placeholder data like "R$ 149,90", "Prof. Marcus Silva", "Turma 1", etc.
*   **ALWAYS** implement loading states while fetching real data
*   **ALWAYS** handle API errors gracefully with user-friendly messages
*   **Example violation**: Using fixed values in student editor tabs (subscription, courses, classes)
*   **Correct approach**: Fetch `/api/students/${id}/subscription`, `/api/students/${id}/courses`, etc.

### 4. Contexto e Consistência: Detalhes Importam
Durante o desenvolvimento, sempre identifique e comunique melhorias de contexto necessárias.

#### 🎯 **Critérios de Análise de Contexto:**
* **Terminologia Consistente:** IDs, nomes de funções e labels devem refletir o contexto real do negócio
* **Ícones Diferenciados:** Evitar ícones duplicados em menus próximos (ex: 💳 para "Planos" e "Assinatura")
* **Funções com Propósito Claro:** Nome da função deve corresponder exatamente ao que ela faz
* **Dados Apropriados:** Mostrar informações relevantes para o contexto específico do usuário

#### 📋 **Protocolo de Sugestões de Melhoria:**
**Sempre que identificar inconsistências ou melhorias de contexto, comunique claramente:**

```
⚠️ SUGESTÃO DE MELHORIA DE CONTEXTO:
1. [Problema]: Descrição da inconsistência encontrada
2. [Impacto]: Como isso afeta a experiência do usuário
3. [Solução]: Proposta específica de correção
4. [Prioridade]: Alta/Média/Baixa
```

#### ✅ **Exemplos de Melhorias Aplicadas:**
* **IDs Inconsistentes:** `data-tab="courses"` mas mostra "Assinatura" → Renomear para `data-tab="subscription"`
* **Ícones Duplicados:** "📋 Planos" e "💳 Assinatura" em abas próximas → Diferenciação visual clara
* **Funções Desalinhadas:** `getCurrentStudentCourses()` para mostrar assinatura → Criar `getCurrentStudentSubscriptionDetails()`
* **Dados Inadequados:** Mostrar "cursos" nahttps://www.asaas.com/payment/list?filterDate=dueDate&dueDateStart=01%2F07%2F2025&dueDateFinish=31%2F07%2F2025&chargeType=&status%5BnotIn%5D=REFUNDED&status%5BnotIn%5D=REFUND_REQUESTED&status%5BnotIn%5D=CHARGEBACK aba individual → Mostrar "assinatura pessoal + status de pagamento"

**Final Check:** Before submitting any code, re-read these guidelines. The quality of our project is measured by our ability to follow them perfectly. For all other details, consult `agents.md`.

# Current Work Session Focus
**Active Module:** Students Module
**Last Updated:** 20/07/2025

## 🚨 SERVIDOR ARQUITETURA
**IMPORTANTE**: Sempre usar servidor principal TypeScript com dados reais.
- **Comando**: `npm run dev` 
- **Documentação**: `docs/SERVER_ARCHITECTURE.md`
- **APIs**: PostgreSQL + Prisma (27 alunos reais)
- **Swagger**: `http://localhost:3000/docs`

## Files Currently Being Worked On

### 🎯 Primary Working Files
- **`public/js/modules/students.js`** - Módulo principal isolado (455 linhas, referência CLAUDE.md)
- **`public/css/modules/students.css`** - CSS isolado com prefixo `.students-isolated`
- **`public/views/student-editor.html`** - Editor full-screen (implementa "Uma Ação = Uma Tela")
- **`public/views/students.html`** - Página principal de listagem

### 🔧 Supporting Files
- **`public/js/students-management.js`** - Sistema de associações hierárquicas
- **`src/routes/students.ts`** - Rotas FastifyJS da API

### 📋 Development Context
- **Focus:** Trabalhar SOMENTE com estes arquivos do módulo Students
- **Architecture:** Modular isolado em `/js/modules/` seguindo diretrizes CLAUDE.md
- **UI Pattern:** Full-screen navigation, sem modais
- **Data:** API-first, sem dados hardcoded

### 🚨 Important Notes
- **Arquivo legado** `public/js/students.js` (3.125 linhas) **NÃO está sendo usado** - foi substituído pelo módulo
- **Razão:** Violava diretrizes (modais, monolítico, core file modification)
- **Referência:** Módulo atual é implementação de referência das diretrizes CLAUDE.md

## 🚨 CRITICAL API-FIRST ENFORCEMENT

**BEFORE implementing ANY interface component:**
1. **FIRST**: Check what APIs exist for that data
2. **SECOND**: Implement data fetching with loading states
3. **THIRD**: Handle empty states and errors
4. **NEVER**: Use hardcoded placeholder data
5. **ALWAYS**: Follow the pattern: fetch → populate → handle errors

**Examples of FORBIDDEN hardcoded data:**
- Fixed prices: "R$ 149,90"
- Names: "Prof. Marcus Silva", "João Silva"
- Dates: "01/06/2025"
- Progress: "31% concluído"
- Any mock content that should come from database

**MANDATORY for ALL implementations:**
- Loading spinners while fetching data
- Empty state messages when no data exists
- Error handling with user-friendly messages
- API-first approach with real database integration

## 🔍 CRITICAL: Always Check Existing Functionality

### Pre-Implementation Verification Protocol
**BEFORE creating ANY new module or recreating functionality:**

1. **🔍 FIRST**: Search for existing implementations
   ```bash
   # Check for existing files
   file_search: **/*module-name*
   grep_search: "functionality keywords"
   ```

2. **📂 VERIFY**: Check all relevant directories
   - `/public/js/modules/` - Isolated modules 
   - `/public/js/` - Legacy implementations
   - `/backups/` - Backup files
   - `/public/views/` - HTML templates

3. **⚠️ CRITICAL RULE**: Never recreate existing functionality
   - If functionality exists and works → Use it
   - If functionality exists but broken → Fix it
   - If functionality doesn't exist → Create it

### 🚨 Case Study: Student-Editor Incident (August 2025)
**What Happened**: During course module development, student-editor functionality was accidentally recreated instead of using existing working implementation.

**Root Cause**: Failed to verify that `public/js/modules/student-editor.js` already existed and was functional.

**Impact**: Temporary loss of working navigation between students list and student editor.

**Prevention**: Always run verification protocol before any new implementation.

**Lesson**: The cardinal rule is **"Check first, implement second"** - existing working code is infinitely more valuable than new code.

# 🎨 UI/UX Design Standards - Classes Module Reference

## Design Philosophy: Modern Full-Width Layouts
The Classes module (`classes.html` + `classes.css`) establishes our **official UI standard** for all modules. Every new module must follow these exact patterns for visual consistency.

### 🏗️ Core Layout Architecture

#### 1. Container Structure (Mandatory Pattern)
```html
<!-- Main container extending beyond left menu -->
<div class="classes-isolated-container">
    <!-- Page header with gradient background -->
    <div class="classes-isolated-page-header">
        <div class="classes-isolated-header-content">
            <h1>Module Title</h1>
            <p class="classes-isolated-header-subtitle">Module description</p>
        </div>
    </div>
    
    <!-- Statistics grid section -->
    <div class="classes-isolated-stats-grid">
        <!-- Stat cards here -->
    </div>
    
    <!-- Main content area -->
    <div class="classes-isolated-content">
        <!-- Data tables, forms, etc. -->
    </div>
</div>
```

#### 2. CSS Isolation Standard (Follow Exactly)
**Pattern**: `.module-name-isolated-element`
- **Classes Module**: `.classes-isolated-*`
- **Students Module**: `.students-isolated-*` 
- **Courses Module**: `.courses-isolated-*`

### 🎨 Visual Standards Reference

#### Header Design (Gradient Background)
```css
.module-isolated-page-header {
    background: linear-gradient(135deg, 
        var(--primary-gradient-start) 0%, 
        var(--primary-gradient-end) 100%);
    padding: 2rem;
    color: white;
    margin: -2rem -2rem 2rem -2rem;
}
```

#### Statistics Grid (4-Column Responsive)
```css
.module-isolated-stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}
```

#### Data Tables (Modern Styling)
```css
.module-isolated-data-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    background: var(--card-background);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: var(--table-shadow);
}
```

### 🔧 Component Standards

#### 1. Action Buttons (Primary Style)
```html
<button class="module-isolated-btn module-isolated-btn-primary" 
        data-action="create">
    <i class="fas fa-plus"></i>
    Create New
</button>
```

#### 2. Status Badges (Color System)
```html
<span class="module-isolated-status-badge module-isolated-status-active">
    Active
</span>
```

#### 3. Stat Cards (Information Display)
```html
<div class="module-isolated-stat-card">
    <div class="module-isolated-stat-icon">
        <i class="fas fa-icon"></i>
    </div>
    <div class="module-isolated-stat-info">
        <span class="module-isolated-stat-number">42</span>
        <span class="module-isolated-stat-label">Total Items</span>
    </div>
</div>
```

### 📱 Responsive Design Requirements

#### Mobile-First Approach (Follow Exactly)
```css
/* Mobile (< 768px) */
.module-isolated-stats-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
}

/* Tablet (768px - 1024px) */
@media (min-width: 768px) {
    .module-isolated-stats-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

/* Desktop (> 1024px) */
@media (min-width: 1024px) {
    .module-isolated-stats-grid {
        grid-template-columns: repeat(4, 1fr);
    }
}
```

### 🎯 CSS Custom Properties (Standard Variables)
```css
:root {
    /* Colors */
    --primary-gradient-start: #667eea;
    --primary-gradient-end: #764ba2;
    --card-background: rgba(255, 255, 255, 0.95);
    --text-primary: #2d3748;
    --text-secondary: #718096;
    
    /* Effects */
    --backdrop-filter: blur(10px) saturate(180%);
    --table-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    --card-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    
    /* Spacing */
    --container-padding: 2rem;
    --section-spacing: 2rem;
    --card-padding: 1.5rem;
}
```

### 🚨 Implementation Rules

#### Mandatory Requirements
1. **Full-Width Layout**: Container must extend beyond left navigation menu
2. **Gradient Header**: Every module page requires gradient header section
3. **Stats Grid**: 4-column responsive statistics section (even if empty)
4. **CSS Isolation**: Use unique prefix for all CSS classes
5. **Mobile-First**: Responsive design starting from mobile (320px+)

#### Layout Extension Pattern
```css
.module-isolated-container {
    margin-left: -240px; /* Extend beyond sidebar */
    padding-left: 260px;  /* Account for sidebar + spacing */
    min-height: 100vh;
}

/* Mobile adjustment */
@media (max-width: 768px) {
    .module-isolated-container {
        margin-left: 0;
        padding-left: var(--container-padding);
    }
}
```

### 📋 Quality Checklist

Before submitting any new module interface, verify:
- [ ] Container extends beyond left menu (desktop)
- [ ] Gradient header with title and subtitle
- [ ] Responsive stats grid (4 columns desktop, 2 tablet, 1 mobile)
- [ ] CSS isolation with module prefix
- [ ] Custom properties for consistent styling
- [ ] Mobile-first responsive breakpoints
- [ ] Action buttons with data-action attributes
- [ ] Status badges with consistent color system
- [ ] Data tables with modern styling

### 🎨 Reference Files
- **HTML Structure**: `public/views/classes.html`
- **CSS Standards**: `public/css/modules/classes.css`
- **JavaScript Pattern**: `public/js/modules/classes.js`

**Final Rule**: When in doubt about any UI decision, reference the Classes module. It is the single source of truth for our visual standards.