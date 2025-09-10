# Module Contribution Guide

This project is API-first, modular, and full-screen only. Read AGENTS.md first. If anything conflicts, AGENTS.md wins. For detailed specs and design tokens, see /dev.

Key rules (must):
- Integrate via `public/js/core/app.js` (AcademyApp) and ModuleLoader; do not modify core directly.
- Register your module and dispatch `module:loaded`; expose as `window.<moduleName>`.
- Use the centralized API client: `await waitForAPIClient(); const api = window.createModuleAPI('your-module')`.
- Use `fetchWithStates` with proper loading/empty/error states.
- Premium UI only: `.module-header-premium`, `.stat-card-enhanced`, `.data-card-premium`; palette #667eea/#764ba2; responsive.
- Full-screen only: no modals. Use dedicated pages. Breadcrumbs + back buttons required.
- CSS isolation: prefix with `.module-isolated-*` and place under `public/css/modules/`.
- Handle errors via `window.app.handleError(error, context)`.

Quality gates before PR:
- Build/typecheck/lint/tests all pass.
- No modal patterns in code (guarded in CI).
- API-first (no hardcoded data); loading/empty/error handled.

Starter skeleton:
- public/js/modules/<module>/index.js (entry + app integration)
- controllers/, services/, views/, components/ per MVC
- public/css/modules/<module>.css with isolated classes

Need examples? See `public/js/modules/students/` and instructions in `.github/copilot-instructions.md`.
