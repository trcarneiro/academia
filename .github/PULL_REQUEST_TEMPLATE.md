## Overview

Describe the change and why it’s needed. Link any issues.

## Checklist (Quality Gates)

- [ ] Read and followed AGENTS.md (master). Conflicts resolved in favor of AGENTS.md.
- [ ] Module integrates with AcademyApp via ModuleLoader. No core file edits.
- [ ] API-first: uses window.createModuleAPI and fetchWithStates (loading/empty/error handled).
- [ ] No modals. Full-screen views with breadcrumb/back and sidebar visible.
- [ ] Premium UI classes: .module-header-premium, .stat-card-enhanced, .data-card-premium.
- [ ] Design tokens (#667eea, #764ba2, gradients) and dark mode variables respected.
- [ ] Responsive at 768/1024/1440 breakpoints.
- [ ] Errors handled via window.app.handleError(error, context).
- [ ] Tests updated/added and passing locally.
- [ ] Lint/Typecheck clean locally.
- [ ] Docs updated (module README links to AGENTS.md + /dev; API docs if needed).

## How to test

Brief steps to validate the change (include data states: loading/empty/error).

## Screenshots / Recordings (optional)

Attach visuals for list/detail/editor views and responsive checks.

## Notes

Mention any follow-ups or constraints.
