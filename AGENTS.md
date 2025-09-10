# v2.0 - Guia Operacional para Agentes e Devs

Uma visão prática e acionável para aumentar produtividade e assertividade nas entregas.

## Índice
- Princípios Fundamentais
- Quick Start por Perfil
- Integração com AcademyApp (Core)
- Estrutura de Módulos (Frontend)
- Contratos de Ferramentas (APIs internas)
- SOPs Essenciais (Passo a passo)
- Quality Gates (Build/Lint/Test/Smoke)
- Definition of Ready / Done
- RAG e Prompts (AI)
- Observabilidade e Erros
- Referências e Fontes de Verdade

## Princípios Fundamentais
- API-First: sempre consumir APIs; não hardcode dados.
- Modularidade: isolamento via classes `.module-isolated-*` e ModuleLoader; não editar core.
- Design System: tokens oficiais (#667eea, #764ba2) e variações em `public/css/design-system/tokens.css`.
- UI Premium: `.module-header-premium`, `.stat-card-enhanced`, `.data-card-premium` e gradientes.
- Estados de UI: loading, empty, error em TODAS as telas de dados.
- Acessibilidade e Responsividade: WCAG 2.1; 768/1024/1440.

## Quick Start por Perfil
- AI Agents: consulte WORKFLOW.md + FALLBACK_RULES.md (na pasta /dev ou raiz). Siga os SOPs abaixo.
- Frontend: leia DESIGN_SYSTEM.md + CSS_NAMING.md; use fetchWithStates e ModuleAPI.
- Backend: siga padrões Fastify + Prisma; documente endpoints no Swagger.

## Integração com AcademyApp (Core)
Todo módulo deve:
- Registrar em `AcademyApp.loadModules()`.
- Expor global: `window.myModule = module;` (para ações onclick simples).
- Disparar eventos: `window.app.dispatchEvent('module:loaded', { name: 'module' })`.
- Usar `window.app.handleError(error, context)` para erros.

## Estrutura de Módulos (Frontend)
```
/public/js/modules/[module]/
├── index.js           # Entry point
├── controllers/       # MVC controllers
├── services/          # Business logic
├── views/             # HTML templates
└── components/        # Reusable UI components
```
Padrões obrigatórios:
- API client central: `window.createModuleAPI('ModuleName')` e `fetchWithStates`.
- Sem modais: páginas full-screen com navegação e breadcrumb.
- Navegação por duplo clique em listagens para páginas de edição.

## Contratos de Ferramentas
Module API
- createModuleAPI(name): retorna helper com `request(url, options)` e `fetchWithStates(url, { targetElement, onLoading, onSuccess, onEmpty, onError, ... })`.
- Estados: onLoading (spinner), onEmpty (estado vazio), onError (tratamento padrão + app.handleError), onSuccess (renderização).
AcademyApp
- Eventos: `module:loaded`, `module:error` (opcional); erros via `handleError(error, context)`.

## SOPs Essenciais
1) Criar novo módulo
- Criar pasta em `/public/js/modules/[module]/` seguindo estrutura.
- No `index.js`: integrar API (`createModuleAPI`), render principal (template premium), navegação, estados de UI, handlers.
- CSS isolado em `/public/css/modules/[module].css` com prefixos `.module-isolated-*`.
- Registrar módulo no AcademyApp.

2) Migrar modal → full-screen (proibido modais)
- Substituir show/hide modal por uma view `editor` em página dedicada.
- Breadcrumb com back; sem bloquear UI global.
- Salvar via API helper; após sucesso, voltar para listagem e recarregar dados.

3) Adicionar endpoint backend
- Criar rota em `src/routes/[entity].ts`, controller em `src/controllers/` e tipos em `prisma/schema.prisma` se necessário.
- Documentar no Swagger; cobrir happy path + erro.

## Quality Gates
- Build: sem erros TypeScript/JS.
- Lint: sem erros bloqueantes.
- Test: executar Vitest com pelo menos 1 happy path + 1 edge.
- Smoke: navegar até a tela, ver loading → conteúdo/empty → nenhuma exception.
Relate no PR: PASS/FAIL por gate e breve “requirements coverage”.

## Definition of Ready / Done
DoR
- Endpoint mapeado no Swagger; contrato acordado.
- Design tokens e classes premium definidos.
- Estado de UI (loading/empty/error) pensado.
DoD
- Implementação com API helper e estados.
- Testes mínimos cobrindo sucesso e 1 erro comum.
- Responsivo em 768/1024/1440.
- Erros tratados via `window.app.handleError`.

## RAG e Prompts (AI)
- Servidor RAG: iniciar via task “Start RAG Server” quando necessário.
- Documentos e ingestão: manter metadados e tags consistentes; atualizar índices após mudanças.
- Prompts: seguir `.github/prompts/` e serviços em `src/services/aiService.ts`.

## Observabilidade e Erros
- Frontend: sempre capturar e reportar erros com `window.app.handleError(error, context)`.
- Backend: logs legíveis, erros com mensagem útil e status code corretos.
- UI: mensagens de erro claras; ações de retry quando possível.

## Referências e Fontes de Verdade
- Arquivo mestre desta versão: `AGENTS.md` (este arquivo).
- Configurações detalhadas do software: pasta `/dev` (WORKFLOW, FALLBACK_RULES, DESIGN_SYSTEM, CSS_NAMING, DOCUMENTATION, EXAMPLES).
- Padrões críticos de integração/UI/estados: `.github/copilot-instructions.md`.
- Documentação de API: Swagger em http://localhost:3000/docs.

—
Versão: 2.0 • Data: 03/09/2025 • Status: Ativo
