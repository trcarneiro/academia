# System Architecture & Workflow v2.0
Document ID: agents.md
Last Updated: 07/12/2025
System Status: STABLE & PROTECTED

This document outlines the development workflow and architectural principles for this project. Its purpose is to ensure all development extends system capabilities while ensuring zero downtime and zero regressions. Adherence to these protocols is mandatory.

## 🏗️ Project Structure (Current Implementation)
This is the **official** directory structure that must be followed for all development:

```
academia/
├── public/                          # Frontend assets
│   ├── index.html                   # Main dashboard (clean, minimal)
│   ├── views/                       # Full-screen pages (following Pillar III)
│   │   ├── students.html            # ✅ Student management (COMPLETE)
│   │   ├── student-editor.html      # ✅ Student CRUD operations
│   │   ├── classes.html             # ✅ Class management
│   │   ├── class-editor.html        # ✅ Class CRUD operations
│   │   ├── plans.html               # ✅ Plan management
│   │   └── plan-editor.html         # ✅ Plan CRUD operations
│   ├── css/                         # Modular CSS (following Pillar I)
│   │   ├── dashboard.css            # Main dashboard styles
│   │   ├── students.css             # Student module styles
│   │   ├── classes.css              # Classes module styles
│   │   ├── plans.css                # Plans module styles
│   │   ├── components/              # Reusable UI components
│   │   │   ├── buttons.css
│   │   │   ├── forms.css
│   │   │   ├── tables.css
│   │   │   └── toast.css
│   │   ├── core/                    # Core system styles
│   │   │   ├── reset.css
│   │   │   ├── variables.css
│   │   │   └── layout.css
│   │   └── modules/                 # Module-specific isolated styles
│   │       ├── students.css
│   │       ├── classes.css
│   │       ├── financial.css
│   │       └── attendance.css
│   ├── js/                          # JavaScript modules
│   │   ├── module-loader.js         # ✅ PROTECTED - Module loading system
│   │   ├── dashboard.js             # Main dashboard logic
│   │   ├── api.js                   # API communication layer
│   │   ├── ui.js                    # UI utilities and helpers
│   │   ├── core/                    # Core system modules
│   │   │   ├── navigation-simple.js
│   │   │   ├── api-client-simple.js
│   │   │   └── app-simple.js
│   │   └── modules/                 # Feature modules (following Pillar I)
│   │       ├── students.js          # ✅ Student module
│   │       ├── classes.js           # ✅ Classes module
│   │       └── plans-manager.js     # ✅ PROTECTED - Plans management
│   └── checkpoint.html              # ✅ Standalone check-in system
├── servers/                         # Backend services
│   ├── server-complete.js           # ✅ Main API server
│   └── server-extensions.js         # Server utilities
├── prisma/                          # Database layer
│   ├── schema.prisma                # Database schema
│   └── seed.ts                      # Database seeding
├── docs/                            # Documentation
│   ├── agents.md                    # This file - Development guidelines
│   └── CLAUDE.md                    # Contribution guidelines
├── version.json                     # Version control tracking
├── version-manager.js               # Version management utility
└── package.json                     # Dependencies and scripts
```

### 🎯 **Key Architecture Principles:**

1. **Dashboard-First Navigation**: `index.html` serves as a clean dashboard that opens full-screen views
2. **Full-Screen Views**: All CRUD operations happen in dedicated `/views/*.html` pages
3. **Modular CSS**: Each module has isolated CSS with proper prefixes
4. **API-First**: All data comes from `/api/*` endpoints via `servers/server-complete.js`
5. **Protected Modules**: `plans-manager.js` and `module-loader.js` are LOCKED

### 📋 **Navigation Flow:**
```
index.html (Enhanced Dashboard)
    ↓ (same tab navigation)
views/students.html (Enhanced with tabs) → student-editor.html
views/classes.html → class-editor.html  
views/plans.html → plan-editor.html
checkpoint.html (standalone)
```

### 🔒 **File Status:**
- ✅ **ENHANCED**: `index.html` (UX-optimized dashboard), `students.html` (tabbed interface)
- ✅ **COMPLETE**: `classes.html`, `plans.html`, `checkpoint.html`
- ✅ **PROTECTED**: `plans-manager.js`, `module-loader.js`
- ✅ **STABLE**: `server-complete.js`
- 🔄 **ACTIVE**: `navigation-simple.js`, `dashboard-enhanced.css`

## 🚨 The Three Pillars of Development 🚨
These are the non-negotiable, foundational rules for our architecture. Every line of code must conform to these three pillars.

### Pillar I: Isolated Modularity
You must not modify the core system. All new functionality must be encapsulated in isolated modules. This is the primary method for protecting system stability.

*   **Path:** `/public/js/modules/`
*   **CSS:** Isolated in `/css/modules/` with unique prefixes (e.g., `.module-name-isolated`).
*   **Integration:** Use `window.ModuleLoader` with a fallback to the original function.

### Pillar II: API-First Data
The system's state is managed via APIs. Direct manipulation of client-side storage for permanent data is strictly forbidden.

*   **Primary Storage:** API endpoints are the single source of truth.
*   **Hardcoded Data:** Absolutely forbidden. APIs return `{ success: true, data: [] }` for empty sets. The UI must handle this state.
*   **localStorage:** Permitted only as a temporary fallback for offline capability, with an automatic synchronization mechanism.

### Pillar III: Full-Screen UI
User experience must be consistent and predictable. The use of modals or popups for editing or creating data is forbidden.

*   **Rule:** Every user form (create, edit, view details) must be on a dedicated, full-screen page.
*   **Interaction:** Double-clicking a table row must navigate the user to the corresponding full-screen edit page.

## 🔒 Development Workflow Protocol (Mandatory)
Follow this sequence for every change. No steps may be skipped.

### 1. Create a Save Point (Pre-Commit)
Before starting work, create a stable version point.
```bash
# Describe the upcoming change
node version-manager.js create "Starting implementation of Feature X"
```

### 2. Implement Changes
*   Create your isolated module (`.js` and `.css`).
*   Write the code according to the Three Pillars.
*   Integrate using the `ModuleLoader`.

### 3. Verify Your Work
*   **Integrity Check:**
    ```bash
    node version-manager.js check
    ```
*   **Health Check:**
    ```bash
    curl http://localhost:3000/health
    ```
*   **Browser Test:** Open the developer console (F12). It must be free of JavaScript errors.

### 4. Finalize Your Work (Post-Commit)
After implementation and verification, create the final version point.
```bash
# Describe the completed work
node version-manager.js create "Feature X implemented and tested"
```

## 🆘 Emergency & Rollback Procedure
If you introduce an error (console error, failed check, broken UI), you must **immediately** initiate a rollback.

1.  **List available stable versions:**
    ```bash
    node version-manager.js list
    ```
2.  **Revert to the last known stable version ID:**
    ```bash
    node version-manager.js rollback [VERSION_ID]
    ```
Stop all new development until the error is understood and resolved.

## 📦 Core System Assets (Do Not Modify)
*   **Protected Module: PlansManager v1.0.0**
    *   **Status:** ✅ LOCKED & STABLE
    *   **Function:** Manages billing plans.
    *   **Location:** `/js/modules/plans-manager.js`
    *   **To Extend:** Add new methods to its public API. Never modify its internal code.
*   **Protected Module: ModuleLoader v1.0.0**
    *   **Status:** ✅ LOCKED & STABLE
    *   **Function:** Securely loads isolated modules.
    *   **Location:** `/js/module-loader.js`
*   **Protected Module: Core System**
    *   **Status:** ✅ LOCKED & STABLE
    *   **Function:** Main application entrypoint and fallbacks.
    *   **Location:** `/public/index.html`

## 🌐 API Endpoint Definitions (Auto-Generated from src/server.ts)
This section lists the base API endpoints registered in the main server. Each prefix may contain multiple specific routes (e.g., GET /, POST /, GET /:id).

*   `/health`
*   `/api/auth`
*   `/api/attendance`
*   `/api/classes`
*   `/api/analytics`
*   `/api/pedagogical`
*   `/api/courses-management`
*   `/api` (for progress routes)
*   `/api/financial-responsible`
*   `/api/financial`
*   `/api/students`
*   `/api/organizations`
*   `/api/activities`
*   `/api/asaas`
*   (No prefix) `/api/billing-plans`
*   (No prefix) `/api/techniques`
*   (No prefix) `/api/diagnostic`

**Note:** This list was last updated on 2025-07-16. If the `src/server.ts` file is modified to add or remove routes, this list must be updated.

## 🛠️ Toolchain & Reference Implementations
*   **Version Manager (`version-manager.js`):** Your primary tool for creating secure save points and rollbacks.
*   **Module Loader (`module-loader.js`):** Use `ModuleLoader.loadModule()` to safely integrate your code.
*   **Example Module (`plans-manager.js`):** This is your golden standard for how a module should be structured, implemented, and documented.
*   **Example CSS (`plans-styles.css`):** Your reference for creating properly isolated CSS.
---

### 🚨 **Critical Refactoring Plan (Project Phoenix)**

**Diagnosis:** The project has significant technical debt due to a monolithic structure (`index.html`) that violates our modularity and maintainability guidelines.

**Objective:** Refactor the project into a modular, robust, and scalable architecture aligned with our development standards.

**Critical Issues to Address:**
1.  **Monolithic Structure:** All HTML, CSS, and JS currently reside in a single file.
2.  **Global Scope Pollution:** Globally declared functions and variables are causing conflicts.
3.  **Lack of Formal Tests:** The absence of unit and integration tests makes the system fragile.
4.  **Disorganized Code:** Logic is duplicated and difficult to maintain.

**Action Plan (To-Do):**
-   [x] **1. Create Folder Structure:** Organize code into `public/css/` and `public/js/`.
-   [ ] **2. Externalize CSS:** Move all styles to `public/css/style.css`.
-   [ ] **3. Modularize JavaScript:**
    -   [x] Create `public/js/api.js` for all `fetch` calls.
    -   [x] Create `public/js/ui.js` for DOM manipulation and navigation.
    -   [x] Create `public/js/main.js` as the entry point to initialize modules.
    -   [x] Create modules by feature (e.g., `public/js/students.js`, `public/js/plans.js`).
-   [ ] **4. Clean `index.html`:** Reduce it to a minimal skeleton that loads the CSS and JS files.
-   [ ] **5. Implement Unit Tests:** Set up a testing framework (e.g., Jest) and write initial tests for API functions.
-   [ ] **6. Adopt ES6 Modules:** Use `import`/`export` to manage dependencies between JS files.
