# Copilot Instructions for Academia Krav Maga v2.0

## Project Overview
Multi-tenant Krav Maga academy management system with TypeScript/Fastify backend + modular vanilla JavaScript frontend. Emphasizes API-first design, isolated modules, and full-screen UI patterns.

**Documentation Hierarchy**: `AGENTS.md` (master) → `/dev` specs → this file. On conflicts, AGENTS.md wins.

## Critical Architecture Patterns

### 1. Core App Integration (NON-NEGOTIABLE)
Every module MUST integrate with `AcademyApp` in `/public/js/core/app.js`:
```javascript
// 1. Register in loadModules() array
const moduleList = ['students', 'instructors', 'activities', ...];

// 2. Expose globally for onclick handlers
window.myModuleName = myModule;

// 3. Dispatch module events
window.app.dispatchEvent('module:loaded', { name: 'myModule' });

// 4. Use centralized error handling
window.app.handleError(error, { module: 'myModule', context: 'action-name' });
```

### 2. Module Architecture (CHOOSE WISELY)
**ALL functionality** lives in `/public/js/modules/[module]/`. Never modify core files.

**🔥 Single-file (RECOMMENDED for 80% of modules)**:
- CRUD operations, simple forms, list views
- 400-600 lines total
- **Template**: `/public/js/modules/instructors/index.js` (745 lines, 86% less code than old approach)
- **Performance**: 80% faster load, instant UI updates

**📁 Multi-file (ONLY for complex features)**:
- Multiple views, complex workflows, 600+ lines logic
- **Template**: `/public/js/modules/activities/` (MVC pattern with controllers/services/views)
- **Gold Standard**: `/public/js/modules/students/` (1470 lines, advanced multi-tab interface)


### 3. API Client Pattern (NON-NEGOTIABLE)
Every module MUST use centralized API client from `/public/js/shared/api-client.js`:

```javascript
// 1. Initialize at module level
let moduleAPI = null;
async function initializeAPI() {
    await waitForAPIClient(); // Wait for api-client.js to load
    moduleAPI = window.createModuleAPI('ModuleName');
}

// 2. Use fetchWithStates for automatic UI state management
await moduleAPI.fetchWithStates('/api/students', {
    loadingElement: document.getElementById('student-list'),
    onSuccess: (data) => renderStudents(data.data),
    onEmpty: () => showEmptyState('No students found'),
    onError: (error) => showErrorState(error)
});

// 3. Manual requests when needed
const response = await moduleAPI.request('/api/students', {
    method: 'POST',
    body: JSON.stringify(studentData)
});
```

**Why this matters**: API client normalizes responses to `{ success: boolean, data: any, message: string }`, handles retries, caching, and error normalization automatically.

### 4. Premium UI Standards
Design system lives in `/public/css/design-system/tokens.css` + `dev/DESIGN_SYSTEM.md`.

**Required CSS classes**:
```css
.module-header-premium     /* Headers with subtle gradient */
.stat-card-enhanced        /* Stats with hover + gradient background */
.data-card-premium         /* Content cards with premium styling */
.module-filters-premium    /* Filter sections */
```

**Color palette** (NEVER use other colors):
```css
--primary-color: #667eea;        /* Blue - trust */
--secondary-color: #764ba2;      /* Purple - premium */
--gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

**Breakpoints** (test ALL three):
- Mobile: 768px
- Tablet: 1024px  
- Desktop: 1440px

### 5. UI Patterns (STRICTLY ENFORCED)
- **No modals**: Full-screen pages only. Guard enforced via `npm run guard:no-modals`
- **Double-click navigation**: Table rows → full-screen edit pages
- **Three UI states**: loading (spinner), empty (helpful message), error (actionable)
- **Breadcrumb navigation**: Always show location in app hierarchy
- **Sidebar visible**: Navigation never hidden, users always know where they are

## Development Workflow

### Before Starting ANY Work
1. Read `AGENTS.md` (current: v2.1, updated 30/09/2025)
2. Check **Module Compliance** in `AUDIT_REPORT.md` (19 modules audited, 26% fully compliant)
3. Choose template:
   - Simple CRUD? → Copy `/public/js/modules/instructors/index.js`
   - Complex feature? → Copy `/public/js/modules/activities/` structure
4. Verify API endpoint exists in `src/routes/[entity].ts` or create it
5. Check Swagger docs at http://localhost:3000/docs for endpoint contracts

### Essential Commands
```bash
npm run dev              # Start dev server (Fastify + Prisma + PostgreSQL)
npm run test             # Run Vitest unit tests
npm run lint             # ESLint checks
npm run ci               # Full pipeline (type-check + lint + test + guard)
npm run build            # TypeScript compilation
npm run db:studio        # Prisma Studio GUI (database browser)
npm run guard:no-modals  # Enforce full-screen UI pattern
```

**RAG Server** (for AI features): Use VS Code task "Start RAG Server"


## Backend Architecture (TypeScript + Fastify)

### Stack & Tools
- **Framework**: Fastify (high-performance HTTP server)
- **ORM**: Prisma (type-safe database access)
- **Database**: PostgreSQL (production data with 27+ real students)
- **Validation**: Zod schemas
- **Path aliases**: `@/` imports (configured in tsconfig.json)

### File Structure Patterns
```
src/
├── routes/[entity].ts        # Fastify route handlers
├── controllers/[entity]Controller.ts  # Business logic
├── services/[entity]Service.ts        # Complex operations
├── middlewares/              # Auth, error handling, logging
├── utils/                    # Helpers (database, logger, ResponseHelper)
└── config/                   # App configuration
```

### Route Pattern (FOLLOW THIS)
```typescript
// src/routes/students.ts
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';

export default async function studentsRoutes(fastify: FastifyInstance) {
  // GET /api/students
  fastify.get('/', async (_request, reply: FastifyReply) => {
    try {
      const students = await prisma.student.findMany({
        include: { user: true, _count: { select: { attendances: true } } },
        orderBy: { createdAt: 'desc' }
      });
      
      return reply.send({
        success: true,
        data: students,
        total: students.length
      });
    } catch (error) {
      logger.error('Error fetching students:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to fetch students'
      });
    }
  });
  
  // Always document in Swagger (automatic via Fastify)
}
```

### Critical Backend Rules
1. **Response format**: Always `{ success: boolean, data?: any, message?: string }`
2. **Error handling**: Use try-catch + logger + proper HTTP codes (400, 404, 500)
3. **Prisma includes**: Think about what frontend needs - avoid N+1 queries
4. **Path aliases**: `@/utils/database` not `../../utils/database`
5. **Validation**: Use Zod schemas before database operations

## Frontend Architecture (Vanilla JS + Modules)

### Module Anatomy: Single-file Template
Best for: CRUD operations, simple forms, lists (80% of use cases)

```javascript
// /public/js/modules/[module]/index.js

// Prevent re-declaration
if (typeof window.MyModule !== 'undefined') {
    console.log('Module already loaded');
} else {

const MyModule = {
    container: null,
    data: [],
    moduleAPI: null,
    
    // 1. Initialize
    async init() {
        await this.initializeAPI();
        await this.loadData();
        this.render();
        this.setupEvents();
        
        // Register globally
        window.myModule = this;
        window.app?.dispatchEvent('module:loaded', { name: 'myModule' });
    },
    
    // 2. Setup API client
    async initializeAPI() {
        await waitForAPIClient();
        this.moduleAPI = window.createModuleAPI('MyModule');
    },
    
    // 3. Load data with states
    async loadData() {
        await this.moduleAPI.fetchWithStates('/api/myresource', {
            loadingElement: this.container,
            onSuccess: (data) => { this.data = data.data; },
            onEmpty: () => this.showEmpty(),
            onError: (error) => this.showError(error)
        });
    },
    
    // 4. Render UI with premium classes
    render() {
        this.container.innerHTML = `
            <div class="module-header-premium">
                <h1>My Module</h1>
                <nav class="breadcrumb">Home > My Module</nav>
            </div>
            <div class="data-card-premium">
                ${this.renderList()}
            </div>
        `;
    },
    
    // 5. Event handlers
    setupEvents() {
        this.container.addEventListener('dblclick', (e) => {
            if (e.target.closest('.data-row')) {
                const id = e.target.dataset.id;
                this.navigateToEdit(id);
            }
        });
    }
};

window.myModule = MyModule;
} // end if
```

### Module Anatomy: Multi-file Template
Best for: Complex workflows, multiple views, 600+ lines (20% of use cases)

```
/public/js/modules/[module]/
├── index.js                  # Entry point + initialization
├── controllers/
│   └── MainController.js     # Orchestrates views + services
├── services/
│   └── DataService.js        # API calls + business logic
├── views/
│   ├── ListView.js           # List rendering
│   └── EditorView.js         # Form rendering
└── components/
    └── StatsCard.js          # Reusable UI components
```

### CSS Isolation (MANDATORY)
```css
/* /public/css/modules/[module].css */

/* ✅ CORRECT: Module-specific prefix */
.module-isolated-mymodule-header { }
.module-isolated-mymodule-card { }

/* ❌ WRONG: Generic classes that conflict */
.header { }
.card { }
```


## Integration Points & External Services

### Payment Gateway
- **Provider**: Asaas (Brazilian market)
- **Import**: `scripts/asaas-import.js` for customer sync
- **Routes**: `src/routes/asaas-simple.ts`
- **Note**: Real production data - handle with care

### AI Services
- **Claude (Anthropic)**: Primary AI for analytics + recommendations
- **OpenAI**: Fallback + specific features
- **Google Gemini**: Additional capabilities
- **Service**: `src/services/aiService.ts`
- **Routes**: `src/routes/ai.ts`, `src/routes/rag.ts`
- **RAG Server**: Start via VS Code task for document Q&A

### Authentication
- **Strategy**: JWT tokens via Fastify JWT
- **Routes**: `src/routes/auth.ts`
- **Frontend**: `public/js/modules/auth/` (no API client needed - direct auth)

## Common Pitfalls & Anti-Patterns

### ❌ DON'T DO THIS
```javascript
// 1. Hardcoded data
const students = ['João Silva', 'Maria Santos']; // NEVER

// 2. Modifying core files
// Editing /public/js/core/app.js directly

// 3. Using modals
<div class="modal">...</div> // Forbidden by design

// 4. Generic CSS classes
.header { } // Will conflict with other modules

// 5. Direct fetch without API client
fetch('/api/students') // Missing error handling + states

// 6. Wrong color scheme
background: #ff0000; // Use design tokens only
```

### ✅ DO THIS INSTEAD
```javascript
// 1. API-first
await moduleAPI.fetchWithStates('/api/students', { ... });

// 2. Module isolation
// Create /public/js/modules/newfeature/

// 3. Full-screen pages
navigateToEditPage(studentId);

// 4. Scoped CSS
.module-isolated-students-header { }

// 5. API client pattern
this.moduleAPI.request('/api/students', { method: 'POST', body: ... });

// 6. Design tokens
background: var(--gradient-primary);
```

## Quality Assurance Checklist

### Before ANY Commit
- [ ] `npm run build` passes (no TypeScript errors)
- [ ] `npm run lint` passes (no blocking ESLint errors)
- [ ] `npm run test` passes (at least 1 happy path + 1 edge case)
- [ ] `npm run ci` passes (full pipeline)
- [ ] Browser console has ZERO errors
- [ ] All three UI states work (loading → success/empty → error recovery)
- [ ] Responsive at 768px, 1024px, 1440px breakpoints
- [ ] Module registered in `AcademyApp.loadModules()` array
- [ ] No hardcoded data (`"João Silva"`, `"R$ 149,90"` etc.)
- [ ] Uses `.module-header-premium`, `.stat-card-enhanced` classes
- [ ] Double-click navigation works on list items
- [ ] Breadcrumb shows current location

### Module Compliance Audit
Check `AUDIT_REPORT.md` for current compliance status:
- **26% fully compliant**: Students, Instructors, Activities, Packages, Turmas
- **47% partially compliant**: Organizations, Units, Agenda, Courses, etc.
- **26% legacy**: Frequency, Import, AI, Course Editor, Techniques

**Reference modules** (copy these):
1. **Single-file**: `/public/js/modules/instructors/` (745 lines, CRUD template)
2. **Multi-file**: `/public/js/modules/activities/` (MVC template)
3. **Advanced**: `/public/js/modules/students/` (1470 lines, multi-tab interface)

## Key Documentation Files

### Must Read (in order)
1. **AGENTS.md** - Master guide (v2.1, Sept 30 2025) - SINGLE SOURCE OF TRUTH
2. **AUDIT_REPORT.md** - Module compliance metrics + refactoring priorities
3. **dev/MODULE_STANDARDS.md** - Single-file vs Multi-file decision guide
4. **dev/WORKFLOW.md** - Step-by-step SOPs for common tasks
5. **dev/DESIGN_SYSTEM.md** - CSS tokens + UI patterns
6. **.github/copilot-instructions.md** - This file (quick reference)

### When You Need To...
- **Create new module**: Read `dev/MODULE_STANDARDS.md` → choose template → copy structure
- **Fix bugs**: Check `dev/FALLBACK_RULES.md` for common issues
- **Style UI**: Reference `dev/DESIGN_SYSTEM.md` + `public/css/design-system/tokens.css`
- **Write tests**: See `tests/README.md` + existing test files
- **Deploy**: Check `dev/DOCUMENTATION.md` deployment section

## Quick Start Commands

```bash
# First time setup
npm install
npx prisma generate
npx prisma db push

# Daily development
npm run dev                    # http://localhost:3000
npm run db:studio             # Database GUI

# Testing
npm run test                  # Run tests
npm run test:watch            # Watch mode
npm run test:ui               # Visual test UI

# Quality checks
npm run lint                  # ESLint
npm run lint:fix              # Auto-fix issues
npm run type-check            # TypeScript validation
npm run ci                    # Full pipeline

# Database operations
npm run db:seed               # Seed demo data
npm run seed:quick            # Quick demo data
npm run clean:demo            # Clean demo safely
npm run reset:demo            # Full reset + reseed
```

## Performance & Best Practices

### Why Single-file Modules Win
- **86% less files**: 1 file vs 7+ files (Instructors case study)
- **73% less code**: 745 lines vs multi-file equivalent
- **80% faster load**: No multiple script parsing
- **Instant navigation**: No controller → service → view jumps
- **Easier debugging**: Everything in one place

### When Multi-file Makes Sense
- **Complex workflows**: 600+ lines of domain logic
- **Multiple integrations**: External APIs, complex state
- **Team collaboration**: Different devs work on different views
- **Reusable components**: Shared across multiple features

### API Response Caching
API client automatically caches GET requests (5min TTL). Clear cache:
```javascript
moduleAPI.clearCache(); // Clear all module cache
```

### Database Query Optimization
```typescript
// ✅ Good: Single query with includes
const students = await prisma.student.findMany({
  include: { 
    user: true, 
    _count: { select: { attendances: true } }
  }
});

// ❌ Bad: N+1 query problem
const students = await prisma.student.findMany();
for (const student of students) {
  const user = await prisma.user.findUnique({ where: { id: student.userId } });
}
```

## Debugging & Troubleshooting

### Frontend Issues
- **Module not loading**: Check browser console for errors
- **API calls failing**: Open Network tab, check response format
- **Styles not applying**: Verify class names, check CSS isolation
- **Events not firing**: Check `setupEvents()`, verify element exists

### Backend Issues
- **Route not found**: Verify route registration in `src/server.ts`
- **Prisma errors**: Check schema, run `npx prisma generate`
- **TypeScript errors**: Check path aliases in `tsconfig.json`
- **Port conflicts**: Change port in `.env` file

### Common Error Messages
```
"Container not set before initialization" 
→ Set module.container before calling init()

"Module already loaded, skipping"
→ Normal behavior, module reuse protection

"Failed to fetch students"
→ Check API endpoint, verify database connection

"Cannot find module '@/utils/database'"
→ Run npm install, ensure tsconfig paths configured
```

## Final Notes

### Design Philosophy
- **API-first**: UI is a thin client over APIs
- **Modularity**: Isolated modules that don't leak
- **Premium UX**: Consistent, beautiful, responsive
- **Performance**: Fast loads, instant feedback
- **Maintainability**: Clear patterns, easy to change

### Non-Negotiables
1. NEVER modify core files (`/public/js/core/`)
2. ALWAYS use API client (`createModuleAPI`)
3. ALWAYS handle loading/empty/error states
4. ALWAYS use design system colors (#667eea, #764ba2)
5. ALWAYS test responsive breakpoints
6. NO modals (enforced by `npm run guard:no-modals`)
7. ALWAYS register in `AcademyApp.loadModules()`

### Getting Help
- Read `AGENTS.md` first (90% of questions answered)
- Check `AUDIT_REPORT.md` for module examples
- Look at reference modules (Instructors, Activities, Students)
- Search codebase for similar functionality
- Review Swagger docs at http://localhost:3000/docs

**Remember**: This system values stability over innovation. Follow existing patterns, don't invent new ones.
