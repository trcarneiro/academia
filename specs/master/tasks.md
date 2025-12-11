# Tasks: UX Standardization & Courses Refactor

**Spec**: [Research & Plan](/specs/master/research.md)
**Status**: In Progress

## Phase 1: Setup & Documentation
- [ ] T001 Create standardization plan in `specs/master/UX_STANDARDIZATION_PLAN.md`
- [ ] T002 [P] Create consolidated CSS file `public/css/modules/courses-v2.css` (merging existing styles)

## Phase 2: Foundational
- [ ] T003 Update `public/js/modules/courses/index.js` to support new module structure (View routing)

## Phase 3: Refactor Courses List View (US1)
**Goal**: Convert the courses list to use the Premium UI standard and simplified Object pattern.
- [ ] T004 [US1] Create `public/js/modules/courses/views/list-view.js` implementing the Premium List UI
- [ ] T005 [US1] Update `public/js/modules/courses/index.js` to route to `list-view.js`
- [ ] T006 [US1] Verify list rendering, filtering, and sorting with new UI

## Phase 4: Refactor Course Editor (US2)
**Goal**: Ensure the course editor uses the Premium UI standard and is integrated correctly.
- [ ] T007 [US2] Create `public/js/modules/courses/views/editor-view.js` (refactoring `courseEditorPremiumController.js`)
- [ ] T008 [US2] Update `public/js/modules/courses/index.js` to route to `editor-view.js`
- [ ] T009 [US2] Verify editor functionality (tabs, saving, techniques)

## Phase 5: Cleanup & Polish
- [ ] T010 Remove legacy controller files (`coursesController.js`, `courseEditorPremiumController.js`, etc.)
- [ ] T011 Remove legacy CSS files (`courses.css`, `courses-premium.css`) and rename `courses-v2.css` to `courses.css`
- [ ] T012 Verify full module functionality (List -> Edit -> Save -> List)

## Dependencies
- US1 and US2 can be developed in parallel after Phase 2.
- Phase 5 requires US1 and US2 completion.

## Implementation Strategy
- **MVP**: Get the List View (US1) working first as it's the entry point.
- **Incremental**: Keep old files until new ones are verified (Phase 5).
