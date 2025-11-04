# GUIDELINES2 — Índice (detalhes de configuração)

Aviso: o arquivo mestre de configuração é `AGENTS.md` na raiz. Este documento serve como índice técnico e detalhes de configuração. Em caso de conflito, priorize `AGENTS.md`.

## Sumário
- Visão Arquitetural
- Padrões Críticos (Core/Frontend)
- Estados de UI e Acessibilidade
- Checklists Rápidos
- Quality Gates e DoR/DoD
- Documentos Relacionados

## Visão Arquitetural
- Backend: TypeScript + Fastify + Prisma (PostgreSQL). Rotas em `src/routes`, controllers em `src/controllers`, schema em `prisma/schema.prisma`.
- Frontend: Módulos JS isolados em `/public/js/modules/[module]/` com integração ao AcademyApp.
- API-First: sem dados hardcoded; sempre consumir endpoints; documentar no Swagger.

## Padrões Críticos
AcademyApp (Core)
- Registrar módulos em `AcademyApp.loadModules()`.
- Expor global: `window.myModule = module;`.
- Eventos: `window.app.dispatchEvent('module:loaded', { name: 'myModule' })`.
- Erros: `window.app.handleError(error, context)`.

Frontend (Módulos)
- Estrutura padrão:
```
/public/js/modules/[module]/
├── index.js
├── controllers/
├── services/
├── views/
└── components/
```
- API client centralizado: `window.createModuleAPI('Module')` e `fetchWithStates` com onLoading/onEmpty/onError/onSuccess.
- UI Premium: `.module-header-premium`, `.stat-card-enhanced`, `.data-card-premium`, tokens: #667eea e #764ba2.
- Proibido modais: usar páginas full-screen com breadcrumb e back. Duplo clique em linhas abre editor de página.
- CSS isolado: prefixos `.module-isolated-*` em `public/css/modules/`.

Backend (Rotas)
- Padrão Fastify; usar helpers de resposta; validar inputs; cobrir erros comuns (400/404/409/500).
- Expor no Swagger em `http://localhost:3000/docs`.

## Estados de UI e Acessibilidade
- Toda chamada de rede deve apresentar: loading, empty, error, success.
- Acessibilidade: alvos de toque ≥ 44px; roles/aria onde necessário; navegação por teclado.
- Responsividade: 768/1024/1440.

## Checklists Rápidos
Novo módulo (frontend)
- [ ] Pasta criada e isolada (JS/CSS). 
- [ ] `createModuleAPI` integrado; `fetchWithStates` nos fluxos com dados.
- [ ] Template premium + breadcrumb; sem modais.
- [ ] Estados de UI completos; erros via `window.app.handleError`.
- [ ] Registro no AcademyApp + `window.module = ...` + evento `module:loaded`.

Novo endpoint (backend)
- [ ] Rota + controller + tipos; validação básica.
- [ ] Documentado no Swagger; exemplos de resposta.
- [ ] Teste mínimo (happy path + 1 erro).

## Quality Gates e DoR/DoD
Quality Gates (todo PR)
- Build: sem erros de compilação.
- Lint: sem erros bloqueantes.
- Test: pelo menos 1 happy path + 1 edge (Vitest).
- Smoke: página carrega; loading → conteúdo ou empty; sem exceptions.

Definition of Ready
- Contrato de API claro; tokens/estilos definidos; estados de UI pensados.

Definition of Done
- Implementado com API helper; estados de UI; responsivo; erros tratados; testes mínimos.

## Documentos Relacionados
- Mestre: `../AGENTS.md`.
- Padrões e instruções AI/Copilot: `../.github/copilot-instructions.md`.
- Design System e CSS: `DESIGN_SYSTEM.md`, `CSS_NAMING.md`.
- Workflow e Fallbacks de IA: `WORKFLOW.md`, `FALLBACK_RULES.md`.
- Exemplos: `EXAMPLES.md`.

—
Status: Ativo • Atualizado: 03/09/2025
