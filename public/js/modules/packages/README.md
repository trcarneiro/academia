# Módulo de Planos (Packages)

Fluxo migrado para editor em tela cheia (sem modais). Lista com navegação por duplo clique para editar.

Siga as referências:
- AGENTS.md (fonte da verdade)
- /dev (detalhamento de tokens, classes premium e exemplos)

Boas práticas:
- Integração via ModuleLoader e eventos do app.
- API-first (window.createModuleAPI + fetchWithStates) com estados loading/empty/error.
- UI premium (module-header-premium, stat-card-enhanced, data-card-premium) e dark mode.
- Erros com window.app.handleError.

Ver testes e passos em AGENTS.md.
