# Copilot Instructions for Academia Krav Maga v2.0

## Project Overview
This is a multi-tenant Krav Maga academy management system built with TypeScript/Fastify backend and modular vanilla JavaScript frontend. The architecture emphasizes API-first design, modular isolation, and full-screen UI patterns.

## Critical Architecture Patterns

### 1. Modular System (MANDATORY)
- **ALL new functionality** must be created in `/public/js/modules/[module]/` 
- Use the `ModuleLoader` for safe integration - never modify core files directly
- CSS must be isolated with `.module-isolated-*` prefixes in `/public/css/modules/`
- Follow the Students module (`/public/js/modules/students/`) as the reference implementation

### 2. API Client Pattern (REQUIRED)
Every module MUST use the centralized API client:
```javascript
// Initialize API helper
let moduleAPI = null;
async function initializeAPI() {
    await waitForAPIClient();
    moduleAPI = window.createModuleAPI('ModuleName');
}

// Use fetchWithStates for automatic UI states
await moduleAPI.fetchWithStates('/api/endpoint', {
    loadingElement: document.getElementById('container'),
    onSuccess: (data) => renderData(data),
    onEmpty: () => showEmptyState(),
    onError: (error) => showErrorState(error)
});
```

### 3. UI Standards
- **Full-screen only**: No modals, use dedicated pages with navigation sidebar visible
- **Double-click navigation**: Table rows navigate to full-screen edit pages
- **Loading/Empty/Error states**: Always handle all three states with proper UX
- **Back buttons**: Include on dedicated pages but maintain sidebar navigation

## Development Workflow

### Before Starting ANY Work:
1. Read `Guidelines.MD` and `docs/CurrentArchitecture.md` 
2. Search existing code: use `file_search` for similar functionality
3. Verify API endpoints in `src/routes/` before implementing UI
4. Check `CLAUDE.md` for project-specific conventions

### Key Commands:
- **Development**: `npm run dev` (TypeScript server with PostgreSQL + Prisma)
- **API Documentation**: http://localhost:3000/docs (Swagger)
- **Testing**: `npm run test` (Vitest)
- **Database**: `npm run db:studio` (Prisma Studio)

## Critical Files & Patterns

### Backend (TypeScript/Fastify)
- **Routes**: `src/routes/[entity].ts` - Follow FastifyJS patterns
- **Controllers**: `src/controllers/[entity]Controller.ts` - Use ResponseHelper
- **Database**: Prisma ORM with PostgreSQL, schema in `prisma/schema.prisma`
- **Path aliases**: Use `@/` imports (configured in tsconfig.json)

### Frontend (Modular JavaScript)
- **API Client**: `public/js/shared/api-client.js` - Centralized API access
- **Module Entry**: Each module has `index.js` and follows MVC pattern
- **CSS Isolation**: Module-specific CSS with unique prefixes
- **State Management**: Use `public/js/shared/state-manager.js` for caching

### Module Structure Example:
```
/public/js/modules/[module]/
├── index.js           # Main entry point
├── controllers/       # MVC controllers
├── services/         # Business logic
├── views/            # HTML templates
└── components/       # Reusable UI components
```

## Data & Integration Rules

### API-First Enforcement:
- **NEVER** use hardcoded data (`"João Silva"`, `"R$ 149,90"`, `"Prof. Marcus"`)
- **ALWAYS** fetch from API endpoints
- Handle empty states gracefully with `{ success: true, data: [] }`
- Use loading spinners and error messages consistently

### External Integrations:
- **Payment**: Asaas gateway (Brazilian market)
- **AI Services**: Anthropic Claude, OpenAI, Google Gemini
- **Database**: PostgreSQL with 27 real students
- **Authentication**: JWT with Fastify JWT

## Common Pitfalls to Avoid

1. **Don't modify core files** - Use ModuleLoader integration pattern
2. **Don't use modals** - Full-screen pages only (see Students/Plans modules)
3. **Don't hardcode data** - Always fetch from API
4. **Don't skip loading states** - Users need feedback during API calls
5. **Don't ignore Guidelines.MD** - It's the single source of truth

## Testing & Validation

Before submitting code:
- Run `npm run test` and `npm run lint`
- Check browser console for errors
- Verify all loading/empty/error states work
- Test API endpoints in Swagger docs
- Ensure responsive design works

## AI-Specific Context

This codebase has extensive AI integration with prompt management in `.github/prompts/`. The system uses:
- AI-powered student analytics and dropout risk analysis
- Intelligent recommendation systems  
- Automated lesson planning assistance
- Real-time attendance pattern analysis

When implementing AI features, follow the patterns in `src/services/aiService.ts` and maintain API-first principles.

## Getting Started Quickly

1. Start the dev server: `npm run dev`
2. Open http://localhost:3000 to see the running application
3. Check existing modules in `/public/js/modules/` for patterns
4. Use Students module as your reference implementation
5. Follow the API client pattern religiously - it's not optional

Remember: This system prioritizes stability and modularity. Always isolate new functionality and follow established patterns rather than creating new approaches.
