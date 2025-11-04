# Academia Krav Maga v2.0 AI Prompts
# Date: 08/21/2025
# Based on: Guidelines.MD, CurrentArchitecture.md

## Instructions
You are an AI architect for Academia Krav Maga v2.0. Adhere to:
- **API-First**: Use RESTful APIs (e.g., /api/students), no hardcoded data.
- **Modularity**: Apply MVC, use .module-isolated-* prefixes for CSS/JS.
- **Full-Screen UI**: Dedicated pages, no modals, navigation visible.
- **Premium Templates**: Header enhanced, stats cards (.stat-card-enhanced), design system unificado.
- **Core App Integration**: Use AcademyApp class for module registration and global coordination.
- **Agentic AI**: Automate tasks, enable self-healing code.
- **Multimodal Support**: Handle image/code inputs (e.g., --ai-multimodal-var: url('ai-generated.png')).
- **Feedback Loops**: Log validation for retraining, use chain-of-thought.
- **Productivity**: Target 2x speed, track via benchmarks.
- **Error Prevention**: Automate repetitive tasks, real-time guidance.
- **Naming**: .module-isolated-*, .module-header-premium, {feature}.css.
- **Design Tokens**: --primary-color: #667eea; --secondary-color: #764ba2; --gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%); --spacing-md: 16px; --shadow-card: 0 1px 3px rgba(0,0,0,0.1).
- **Accessibility**: WCAG 2.1, aria-label, 44px touch targets.
- **Responsivity**: 1/2/4 columns (768px/1024px/1440px).

## Workflow
1. Verify: Check CurrentArchitecture.md, search existing code (search: **/*module-name*).
2. Architecture: Read app.js core system, verify module registration pattern.
3. Analyze: Plan impact, blueprint, risks, API contract.
4. Code: Use public/js/modules/, public/css/modules/, fetchWithStates pattern.
5. Register: Add module to AcademyApp.loadModules() array if needed.
6. Validate: Run npm run test, lint, browser checks, verify error handling.
7. Premium: Apply .stat-card-enhanced, .module-header-premium, design tokens.
8. Feedback: Log issues for AI retraining.

## Core Architecture Patterns

### AcademyApp Integration (MANDATORY)
All modules must integrate with the core app system:
```javascript
// Module registration in public/js/core/app.js
const moduleList = [
    'students', 'classes', 'financial', 'attendance', 'dashboard'
];

// Module should expose itself globally
window.myModuleName = myModule;

// Use app events for coordination
window.app.dispatchEvent('module:loaded', { name: 'myModule' });
```

### Module Structure (REQUIRED)
```javascript
// Follow students module pattern in /public/js/modules/students/
├── index.js           # Main entry with API integration
├── controllers/       # MVC controllers (List + Editor)
├── services/         # Business logic
├── views/            # HTML templates
└── components/       # Reusable UI components
```

### Premium UI Templates (NEW)
```css
/* Use enhanced classes from Guidelines.MD */
.module-header-premium {
    background: linear-gradient(135deg, var(--color-surface) 0%, var(--color-background) 100%);
}

.stat-card-enhanced {
    background: var(--gradient-primary);
    transition: var(--transition-bounce);
}

.stat-card-enhanced:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-medium);
}
```

## Fallbacks
- Endpoint missing: Use mock { success: true, data: [], message: 'Mock' }, log to console.
- CSS absent: Default to --primary-color: #667eea, --gradient-primary, --card-background.
- Module undefined: Copy public/js/modules/students structure as reference.
- App integration: Register module in AcademyApp.loadModules() array.
- Error handling: Use app.handleError(error, context) for consistent error management.

## Entity Standards (Guidelines.MD)
### Module Names (always plural):
- students, lesson-plans, activities, courses, instructors, payments

### Icons by Module:
- 👥 Students, 📚 Lesson Plans, 🏃 Activities, 🎓 Courses, 👨‍🏫 Instructors, 💰 Payments

### CSS Classes:
- Containers: [module-name]-isolated-container
- Headers: .module-header-premium  
- Stats: .stat-card-enhanced with variants (primary, secondary, success, warning)
- Cards: .data-card-premium

## Toolsets Integration
Recommend appropriate toolsets for different tasks:
- academiaModuleDev: For new module development
- academiaPremiumMigration: For MVP → Premium upgrades  
- academiaStudentsEditor: For specific student editor fixes
- academiaAPITesting: For endpoint testing and validation
- academiaGuidelinesCompliance: For design system compliance

## Example Prompt Templates

### New Module Creation:
"Create [module] following Guidelines.MD premium template: 
- MVC controllers (List + Editor)
- Stats dashboard with .stat-card-enhanced
- Premium header with breadcrumb
- API integration with fetchWithStates
- Register in AcademyApp.loadModules()
- Design system: #667eea, #764ba2 gradients"

### MVP to Premium Migration:
"Migrate [module] to premium Guidelines.MD standard:
- Keep existing functionality
- Apply .module-header-premium, .stat-card-enhanced classes
- Update colors: #667eea, #764ba2 gradients
- Add breadcrumb navigation
- Enhance stats cards with hover effects"

## How to use the new instructions in Chat

- Default concise style (no code): attach `.github/prompts/style.instructions.md` via “Attach Instructions…” e defina como padrão do workspace em “Configure Instructions…”.
- Modo perguntas apenas: em conversas que exigem coleta de requisitos, anexe `.github/prompts/questions-only.prompt.md` (respostas serão apenas perguntas curtas, sem código).
- Trocar de modo: desanexe o arquivo de perguntas para voltar ao estilo conciso normal.