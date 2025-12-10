# Research: UX Standardization & Courses Module Refactor

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
- **CSS**: Both `courses.css` and `courses-premium.css` exist.
- **Issue**: User reports it looks "terrible" and inconsistent. Likely due to:
    - Mixed CSS files.
    - Old HTML structure in controllers.
    - Not fully adopting the "Premium" classes.

## 2. Standardization Plan

### Documentation
- Create `UX_STANDARDIZATION_PLAN.md` detailing:
    - The "Premium Standard" (Colors, Layouts, Components).
    - List of compliant vs non-compliant modules.
    - Step-by-step refactoring guide.

### Implementation (Courses)
- **Strategy**: Refactor `courses` to a clean structure (Single-file recommended for consistency with Instructors, or clean Multi-file if complex).
- **Steps**:
    1.  Analyze `coursesController.js` rendering logic.
    2.  Rewrite rendering to use `.module-header-premium`, `.data-card-premium`.
    3.  Ensure `courses-premium.css` is used or merged into `courses.css` with isolation.
    4.  Verify API integration.

## 3. Unknowns & Clarifications
- **Complexity**: Is `courses` too complex for single-file? (Need to check `coursesController.js` size).
- **Editor**: The course editor seems to have a "Premium" version (`courseEditorPremiumController.js`). Is it used?

## 4. Decision
- **Approach**: Create the documentation first, then refactor `courses` module to match `instructors` visual style.
