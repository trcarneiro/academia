# Módulo de Alunos (Students)

Este módulo gerencia alunos e segue os padrões do app Academia Krav Maga v2.0.

Referências obrigatórias:
- AGENTS.md (fonte da verdade/master): padrões de UI premium, integração com AcademyApp, API-first (createModuleAPI + fetchWithStates), sem modais.
- /dev (detalhes): design tokens, classes premium, exemplos de estados de carregamento/vazio/erro.

Checklist rápido:
- Integração via ModuleLoader e eventos do app.
- Views full-screen com breadcrumb/back, sem modais.
- Estados loading/empty/error cobertos.
- Erros via window.app.handleError.

Como rodar: veja AGENTS.md e /dev/README.md.
