# Módulo de Planos de Aula (Lesson Plans)

Siga as referências oficiais:
- AGENTS.md (master): padrões de UI premium, integração com AcademyApp, API-first, Quality Gates.
- /dev: especificações detalhadas, tokens e exemplos de estados (loading/empty/error).

Boas práticas:
- Integração via ModuleLoader e eventos; sem alterar core.
- Full-screen (sem modais), breadcrumb/back, dark mode.
- Use window.createModuleAPI + fetchWithStates.
- Trate erros com window.app.handleError.
