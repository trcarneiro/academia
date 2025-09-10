# Módulo de Cursos (Courses)

Este módulo gerencia cursos e segue os padrões do app Academia Krav Maga v2.0.

Referências obrigatórias:
- AGENTS.md (master): padrões, UI premium, integração com AcademyApp, API-first.
- /dev: tokens de design, classes premium, exemplos de estados.

Checklist rápido:
- Sem modais; páginas full-screen com breadcrumb/back.
- Uso de window.createModuleAPI + fetchWithStates.
- Loading/Empty/Error sempre implementados.
- Erros via window.app.handleError.

Mais detalhes: AGENTS.md e /dev/README.md.
