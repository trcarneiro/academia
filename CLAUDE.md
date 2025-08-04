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

### 1. UI Standard: Full-Screen Only
The "modal" or "popup" concept is forbidden in this project. Every action that requires a form (e.g., create, edit, view details) must have its own dedicated, full-screen page.

*   ✅ **Golden Rule:** One Action = One Full Screen.
*   ✅ **Table Interaction:** A double-click on any table row must navigate to a full-screen edit page.
*   ✅ **Navigation:** Every full-screen page must have a "Back" button to return to the previous view.
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