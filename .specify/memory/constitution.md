<!--
Sync Impact Report
==================
Version change: 0.0.0 → 1.0.0
Modified principles: N/A (initial creation)
Added sections: Core Principles (7), Technology Stack, Development Workflow, Governance
Removed sections: N/A
Templates requiring updates:
  ✅ plan-template.md - Constitution Check table with all 7 principles
  ✅ spec-template.md - Constitution Compliance Check section added
  ✅ tasks-template.md - Constitution Compliance Checklist added
  ✅ checklist-template.md - Constitution Compliance table added
Follow-up TODOs: None
-->

# Academia de Artes Marciais Constitution

Sistema multi-tenant de gestão para academias de artes marciais com foco em qualidade, modularidade e experiência premium do usuário.

## Core Principles

### I. API-First Design (NON-NEGOTIABLE)

Todo desenvolvimento MUST começar pela API antes da interface do usuário.

- **Backend defines contracts**: Endpoints Fastify + Prisma são a fonte da verdade
- **Response format**: Toda resposta MUST seguir `{ success: boolean, data?: any, message?: string }`
- **Swagger documentation**: Todo endpoint MUST ser documentado em `/docs`
- **Frontend is a thin client**: UI apenas consome e renderiza dados da API
- **No hardcoded data**: Dados MUST vir de APIs, nunca codificados no frontend

**Rationale**: APIs bem definidas garantem testabilidade, reutilização e separação de responsabilidades.

### II. Module Isolation (NON-NEGOTIABLE)

Cada funcionalidade MUST residir em módulo isolado que não vaza para outros.

- **Location**: `/public/js/modules/[module-name]/`
- **No core modifications**: NUNCA modificar arquivos em `/public/js/core/`
- **CSS scoping**: Classes MUST usar prefixo `.module-isolated-[module]-*`
- **Global registration**: Módulos MUST registrar-se em `AcademyApp.loadModules()`
- **Event-driven**: Usar `window.app.dispatchEvent()` para comunicação inter-módulo

**Exceptions**:
- **Standalone Apps**: Aplicações independentes (como Portal do Aluno) PODEM residir em `/public/[app-name]/`, desde que mantenham isolamento total do Admin e sigam os princípios de API Client.

**Architecture choice**:
- **Single-file** (80% dos casos): CRUD simples, 400-600 linhas. Template: `/public/js/modules/instructors/`
- **Multi-file** (20% dos casos): Workflows complexos, 600+ linhas. Template: `/public/js/modules/activities/`

**Rationale**: Isolamento previne regressões e permite desenvolvimento paralelo.

### III. API Client Pattern (NON-NEGOTIABLE)

Todo módulo frontend MUST usar o API client centralizado.

- **Initialization**: `await waitForAPIClient(); moduleAPI = window.createModuleAPI('ModuleName');`
- **State management**: Usar `fetchWithStates()` para loading/empty/error automático
- **Response normalization**: API client normaliza respostas e trata erros automaticamente
- **Caching**: GET requests são cacheados por 5 minutos automaticamente
- **Retry logic**: Falhas temporárias são retriadas automaticamente

```javascript
// MUST pattern
await moduleAPI.fetchWithStates('/api/resource', {
    loadingElement: container,
    onSuccess: (data) => render(data.data),
    onEmpty: () => showEmpty(),
    onError: (error) => showError(error)
});
```

**Rationale**: Centralização garante comportamento consistente e reduz código duplicado.

### IV. Full-Screen UI Only (NO MODALS)

Interface MUST usar páginas full-screen, NUNCA modals ou popups.

- **Guard enforced**: `npm run guard:no-modals` MUST passar em todo commit
- **Navigation pattern**: Double-click em linhas → página de edição full-screen
- **Breadcrumb required**: Sempre mostrar localização na hierarquia do app
- **Sidebar always visible**: Navegação NUNCA escondida
- **Three UI states**: Todo container MUST ter estados loading, empty, error

**Rationale**: Full-screen patterns são mais acessíveis, testáveis e mobile-friendly.

### V. Premium UI Standards

Design MUST seguir o sistema visual definido em `/public/css/design-system/tokens.css`.

- **Required classes**: `.module-header-premium`, `.stat-card-enhanced`, `.data-card-premium`
- **Color palette** (ONLY these):
  - Primary: `#667eea` (Blue - trust)
  - Secondary: `#764ba2` (Purple - premium)
  - Gradient: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- **Responsive breakpoints** (MUST test all):
  - Mobile: 768px
  - Tablet: 1024px
  - Desktop: 1440px

**Rationale**: Consistência visual premium aumenta confiança e profissionalismo percebido.

### VI. Multi-Tenant Isolation

Todo dado MUST ser isolado por `organizationId`.

- **Query filter**: Toda query Prisma MUST incluir `where: { organizationId }`
- **Create includes org**: Todo `create()` MUST incluir `organizationId`
- **No cross-tenant leaks**: Usuário NEVER pode ver dados de outra organização
- **Audit logging**: Ações sensíveis MUST ser logadas com organizationId

**Rationale**: Isolamento é requisito legal e de segurança para sistema multi-tenant.

### VII. Simplicity & YAGNI

Começar simples, adicionar complexidade apenas quando comprovadamente necessária.

- **Single-file first**: Criar módulo multi-file ONLY quando single-file ultrapassar 600 linhas
- **No premature abstraction**: Abstrações ONLY após 3+ usos do mesmo padrão
- **Copy existing patterns**: Copiar de módulos reference (instructors, activities, students)
- **Minimal dependencies**: Adicionar dependência ONLY com justificativa documentada

**Rationale**: Complexidade desnecessária é a maior fonte de bugs e dívida técnica.

## Technology Stack

### Backend (TypeScript + Fastify)

- **Runtime**: Node.js 18+
- **Framework**: Fastify (high-performance HTTP)
- **ORM**: Prisma (type-safe database access)
- **Database**: PostgreSQL (production data)
- **Validation**: Zod schemas
- **Path aliases**: `@/` imports configurados em tsconfig.json

### Frontend (Vanilla JavaScript)

- **No frameworks**: Vanilla JS puro, sem React/Vue/Angular
- **Module pattern**: ES modules com padrão revealing module
- **Shared utilities**: `/public/js/shared/` (api-client, date-utils, etc.)
- **CSS organization**: `/public/css/design-system/` + `/public/css/modules/`

### Integrations

- **Payments**: Asaas (mercado brasileiro)
- **AI Services**: Claude (Anthropic), OpenAI, Google Gemini
- **Authentication**: JWT via Fastify JWT

## Development Workflow

### Before Starting ANY Work

1. Read `AGENTS.md` (master reference, current v2.2.2)
2. Check `AUDIT_REPORT.md` for module compliance status
3. Choose template: single-file (instructors) or multi-file (activities)
4. Verify API endpoint exists or create it first
5. Check Swagger docs at http://localhost:3000/docs

### Quality Gates (ALL MUST PASS)

```bash
npm run build          # TypeScript compilation
npm run lint           # ESLint checks
npm run test           # Vitest unit tests
npm run ci             # Full pipeline
npm run guard:no-modals # UI pattern enforcement
```

### Commit Checklist

- [ ] `npm run ci` passes
- [ ] Browser console has ZERO errors
- [ ] All three UI states work (loading → success/empty → error)
- [ ] Responsive at 768px, 1024px, 1440px
- [ ] Module registered in `AcademyApp.loadModules()`
- [ ] No hardcoded data
- [ ] Uses premium CSS classes

## Governance

Esta constituição supersede todas as outras práticas de desenvolvimento.

- **Amendments**: Alterações requerem documentação em AGENTS.md + atualização de version
- **Compliance verification**: Todo PR/review MUST verificar conformidade com princípios
- **Violations**: Desvios MUST ser justificados e documentados em Complexity Tracking
- **Runtime guidance**: Usar `AGENTS.md` e `.github/copilot-instructions.md` para orientação diária

**Documentation hierarchy**: `AGENTS.md` (master) → `/dev` specs → `copilot-instructions.md`. Em conflitos, AGENTS.md prevalece.

**Version**: 1.0.0 | **Ratified**: 2025-11-28 | **Last Amended**: 2025-11-28
