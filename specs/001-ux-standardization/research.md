# Research: UX Standardization & Courses Refactor

## 1. Current State Analysis

### Design System
- **Tokens**: Defined in `public/css/design-system/tokens.css`.
- **Colors**: Primary `#667eea`, Secondary `#764ba2`.
- **Classes**: `.module-header-premium`, `.stat-card-enhanced`, `.data-card-premium`.

### Reference Module (Instructors)
- **Structure**: Single-file (`public/js/modules/instructors/index.js`).
- **UI**: Uses template literals with premium classes.
- **Data**: Fetches from API with `organizationId`.

### Problematic Module (Courses)
- **Structure**: Multi-file (`public/js/modules/courses/`).
- **Controllers**: `coursesController.js`, `courseEditorPremiumController.js`.
- **CSS**: Fragmented across `courses.css`, `course-details.css`, `course-editor-premium.css`, `view-course.css`.
- **Issue**: Inconsistent UI, multiple CSS files, potential legacy code.

## 2. Standardization Plan

### Documentation
- Create `UX_STANDARDIZATION_PLAN.md` detailing:
    - The "Premium Standard" (Colors, Layouts, Components).
    - List of compliant vs non-compliant modules.
    - Step-by-step refactoring guide.

### Implementation (Courses)
- **Strategy**: Refactor `courses` to a clean structure. Given the complexity (Editor, Techniques, Lesson Plans), a **Multi-file** structure (MVC) is appropriate, but simplified.
- **Steps**:
    1.  **Consolidate CSS**: Merge `courses.css`, `course-details.css`, `course-editor-premium.css` into a single `courses.css` (or `courses-v2.css` temporarily) using the new design tokens.
    2.  **Refactor List View**: Create `views/list-view.js` using Premium UI patterns.
    3.  **Refactor Editor**: Create `views/editor-view.js` replacing `courseEditorPremiumController.js` and `course-editor-premium.css`.
    4.  **Router**: Update `index.js` to handle routing between List and Editor views without page reloads.

## 3. Unknowns & Clarifications
- **Complexity**: The editor handles Techniques and Lesson Plans. These sub-features need to be preserved and styled.
- **API**: `src/routes/courses.ts` is the backend. We assume it supports standard CRUD.

## 4. Decision
- **Approach**: Refactor `courses` module to match `instructors` visual style but keep MVC structure due to complexity. Consolidate CSS.
