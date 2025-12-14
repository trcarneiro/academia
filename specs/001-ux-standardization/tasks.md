# Tasks: UX Standardization and Courses Refactor

**Spec**: [Research & Plan](plan.md)
**Status**: In Progress

## Phase 1: Setup & Foundation
- [x] T001 [P] Create consolidated CSS file `public/css/modules/courses-v2.css` merging existing styles with Premium tokens
- [x] T002 Create `public/js/modules/courses/services/courses-service.js` using `createModuleAPI`
- [x] T003 Update `public/js/modules/courses/index.js` to implement the Router pattern (switching between List and Editor)

## Phase 2: List View Implementation (US1)
- [x] T004 Create `public/js/modules/courses/views/list-view.js` implementing the Premium List UI (Full-screen, Cards, Gradient Header)
- [x] T005 Integrate `list-view.js` into `index.js` router
- [x] T006 Verify List View rendering, filtering, and navigation

## Phase 3: Editor View Implementation (US2 & US3)
- [x] T007 Create `public/js/modules/courses/views/editor-view.js` implementing the Premium Editor UI (Tabs, Form, Techniques)
- [x] T008 Integrate `editor-view.js` into `index.js` router
- [x] T009 Implement "Techniques" tab management in `editor-view.js` (US3)
- [ ] T014 Implement "Lesson Plans" tab management in `editor-view.js` (FR-006)
- [x] T010 Verify Editor View saving, loading, and tab switching

## Phase 4: Cleanup & Polish
- [x] T011 Remove legacy controller files (`coursesController.js`, `courseEditorPremiumController.js`, etc.)
- [x] T012 Remove legacy CSS files and rename `courses-v2.css` to `courses.css`
- [x] T013 Final verification of all flows (List -> Edit -> Save -> List)
