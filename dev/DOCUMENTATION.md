# Documentação Viva - Padrões e Manutenção

## 🎯 Filosofia: Documentação que se Atualiza

### Documentação Ativa
- **Auto-documenta**: Código que explica a si mesmo
- **JSDoc obrigatório**: Toda função pública deve ter documentação
- **ADR (Architecture Decision Records)**: Decisões importantes registradas
- **Changelog automático**: Git hooks atualizam versões

## 📝 JSDoc - Padrões Obrigatórios

### 1. Funções de Módulo
```javascript
/**
 * @fileoverview Students Module - Complete CRUD management for academy students
 * @module StudentsModule
 * @version 2.0.0
 * @author Academia Krav Maga System
 * @requires APIClient
 * @requires ModuleLoader
 * @integrates AcademyApp
 * @lastModified 2025-01-15
 */

/**
 * Initialize Students Module with all required dependencies
 * @async
 * @function initializeStudentsModule
 * @description Sets up API client, loads UI components, and registers with AcademyApp
 * @returns {Promise<StudentsModule>} Initialized module instance
 * @throws {ModuleInitError} When API client fails or dependencies missing
 * @example
 * // In app.js module loading
 * const studentsModule = await initializeStudentsModule();
 * 
 * @see {@link AcademyApp#loadModules} For module registration
 * @see {@link APIClient#createModuleAPI} For API setup
 * @since 1.0.0
 */
async function initializeStudentsModule() {
    await waitForAPIClient();
    studentsAPI = window.createModuleAPI('Students');
    
    // Setup module components
    await loadStudentsUI();
    
    // Register with core app
    window.app.registerModule('students', studentsModule);
    window.app.dispatchEvent('module:loaded', { name: 'students' });
    
    return studentsModule;
}
```

### 2. Classes e Construtores
```javascript
/**
 * @class StudentsController
 * @description Handles all CRUD operations for student management
 * @implements {BaseController}
 * @integrates {APIClient}
 * 
 * @property {APIHelper} api - Module-specific API helper
 * @property {HTMLElement} container - Main module container
 * @property {StudentValidator} validator - Form validation handler
 * @property {Map<string, Student>} cache - In-memory student cache
 * 
 * @example
 * const controller = new StudentsController(containerElement);
 * await controller.loadStudents();
 * 
 * @since 2.0.0
 */
class StudentsController {
    /**
     * @constructor
     * @param {HTMLElement} container - Container element for the module
     * @param {Object} options - Configuration options
     * @param {boolean} options.enableCache - Enable in-memory caching
     * @param {number} options.pageSize - Items per page for pagination
     * @throws {Error} When container is null or invalid
     */
    constructor(container, options = {}) {
        if (!container || !(container instanceof HTMLElement)) {
            throw new Error('StudentsController requires valid HTMLElement container');
        }
        
        this.container = container;
        this.options = { enableCache: true, pageSize: 20, ...options };
        this.cache = new Map();
        
        this.init();
    }
}
```

### 3. Funções de API
```javascript
/**
 * @async
 * @function fetchStudents
 * @description Fetch paginated list of students with optional filtering
 * @param {Object} params - Query parameters
 * @param {number} [params.page=1] - Page number (1-based)
 * @param {number} [params.limit=20] - Items per page
 * @param {string} [params.search] - Search term for name/email
 * @param {string} [params.status] - Filter by status (active|inactive|pending)
 * @param {string} [params.sortBy=createdAt] - Sort field
 * @param {string} [params.sortOrder=desc] - Sort direction (asc|desc)
 * @returns {Promise<PaginatedResponse<Student>>} Paginated students data
 * @throws {APIError} When request fails or validation errors
 * @throws {NetworkError} When network is unavailable
 * 
 * @example
 * // Fetch active students with search
 * const result = await fetchStudents({
 *     page: 1,
 *     limit: 10,
 *     search: 'João',
 *     status: 'active'
 * });
 * console.log(`Found ${result.total} students`);
 * 
 * @example
 * // Handle with fetchWithStates for automatic UI
 * await studentsAPI.fetchWithStates('/api/students', {
 *     loadingElement: document.getElementById('students-container'),
 *     onSuccess: (data) => renderStudents(data.items),
 *     onEmpty: () => showEmptyState(),
 *     onError: (error) => showErrorMessage(error.message)
 * });
 * 
 * @apiEndpoint GET /api/students
 * @apiResponse {Object} response
 * @apiResponse {Student[]} response.items - Array of student objects
 * @apiResponse {number} response.total - Total number of students
 * @apiResponse {number} response.page - Current page number
 * @apiResponse {number} response.totalPages - Total number of pages
 * @apiResponse {boolean} response.hasNext - Whether there are more pages
 * 
 * @since 1.0.0
 * @updated 2.0.0 - Added sorting and improved error handling
 */
async function fetchStudents(params = {}) {
    const queryParams = {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        ...params
    };
    
    return await studentsAPI.fetchWithStates('/api/students', {
        method: 'GET',
        query: queryParams,
        loadingElement: this.container.querySelector('.students-list'),
        onSuccess: (data) => {
            this.updateCache(data.items);
            return data;
        },
        onError: (error) => {
            window.app.handleError(error, 'fetchStudents');
            throw error;
        }
    });
}
```

### 4. Tipos TypeScript (JSDoc)
```javascript
/**
 * @typedef {Object} Student
 * @description Complete student record with all metadata
 * @property {string} id - Unique student identifier (UUID)
 * @property {string} name - Full student name
 * @property {string} email - Student email address
 * @property {string} phone - Contact phone number
 * @property {Date} birthDate - Date of birth
 * @property {StudentStatus} status - Current enrollment status
 * @property {Address} address - Physical address object
 * @property {EmergencyContact} emergencyContact - Emergency contact info
 * @property {StudentMetadata} metadata - Additional student data
 * @property {Date} createdAt - Registration timestamp
 * @property {Date} updatedAt - Last modification timestamp
 * @property {string} createdBy - User ID who created the record
 * 
 * @example
 * const student = {
 *     id: '123e4567-e89b-12d3-a456-426614174000',
 *     name: 'João Silva',
 *     email: 'joao@email.com',
 *     phone: '+55 11 99999-9999',
 *     birthDate: new Date('1990-05-15'),
 *     status: 'active',
 *     address: {
 *         street: 'Rua das Flores, 123',
 *         city: 'São Paulo',
 *         state: 'SP',
 *         zipCode: '01234-567'
 *     },
 *     emergencyContact: {
 *         name: 'Maria Silva',
 *         phone: '+55 11 88888-8888',
 *         relationship: 'mãe'
 *     },
 *     metadata: {
 *         belt: 'white',
 *         joinDate: new Date('2024-01-15'),
 *         lastAttendance: new Date('2025-01-14')
 *     },
 *     createdAt: new Date('2024-01-15T10:30:00Z'),
 *     updatedAt: new Date('2025-01-14T15:45:00Z'),
 *     createdBy: 'admin-user-id'
 * };
 */

/**
 * @typedef {'active'|'inactive'|'pending'|'suspended'} StudentStatus
 * @description Possible student enrollment status values
 */

/**
 * @typedef {Object} PaginatedResponse
 * @template T
 * @description Generic paginated API response structure
 * @property {T[]} items - Array of items for current page
 * @property {number} total - Total number of items across all pages
 * @property {number} page - Current page number (1-based)
 * @property {number} totalPages - Total number of pages available
 * @property {boolean} hasNext - Whether there are more pages available
 * @property {boolean} hasPrev - Whether there are previous pages available
 */
```

## 📋 ADR (Architecture Decision Records)

### Template ADR
```markdown
# ADR-001: Migrate from Modals to Full-Screen Pages

## Status
**ACEITO** - 2025-01-15

## Context
Students module was using modal dialogs for creating/editing records, causing:
- Poor mobile experience due to limited screen space
- Complex state management with overlapping modal layers
- Inconsistent navigation patterns across modules
- Accessibility issues with focus management

## Decision
Switch to dedicated full-screen pages for all CRUD operations:
- Create: `/students/new` - Full-screen student creation form
- Edit: `/students/:id/edit` - Full-screen student editor
- View: `/students/:id` - Full-screen student profile

Navigation maintained through:
- Consistent sidebar navigation (always visible)
- Breadcrumb navigation in page headers
- Back buttons for user convenience

## Consequences

### ✅ Positive
- Better mobile user experience
- Simplified state management
- Consistent navigation patterns
- Improved accessibility
- More screen real estate for complex forms
- Easier to implement responsive design

### ❌ Negative
- Slight increase in page load times
- Need to update all existing modal-based workflows
- Training required for users accustomed to modal flow

### 🔧 Mitigation
- Implement module preloading to reduce page load impact
- Gradual migration strategy starting with Students module
- User training materials and transition period

## Implementation
- Students module converted: 2025-01-15 ✅
- Classes module: Pending
- Activities module: Pending
- Payments module: Pending

## References
- Issue #45: "Mobile UX improvements"
- User feedback: "Modals too small on tablets"
- Accessibility audit findings

---
**Next Review**: 2025-02-15
**Impact**: All modules
**Priority**: High
```

### Lista de ADRs Ativas
```markdown
# Architecture Decision Records - Academia Krav Maga

## 📋 Índice de Decisões

### Core Architecture
- [ADR-001: Full-Screen Pages over Modals](./adrs/ADR-001-fullscreen-pages.md) - ACEITO
- [ADR-002: Modular Frontend Architecture](./adrs/ADR-002-modular-frontend.md) - ACEITO
- [ADR-003: API-First Development](./adrs/ADR-003-api-first.md) - ACEITO

### Frontend Patterns
- [ADR-004: Premium UI Component System](./adrs/ADR-004-premium-ui.md) - ACEITO
- [ADR-005: CSS Isolation with BEM](./adrs/ADR-005-css-isolation.md) - ACEITO
- [ADR-006: Vanilla JS over Framework](./adrs/ADR-006-vanilla-js.md) - ACEITO

### State Management
- [ADR-007: Centralized API Client](./adrs/ADR-007-centralized-api.md) - ACEITO
- [ADR-008: Module-Level State Caching](./adrs/ADR-008-module-caching.md) - EM AVALIAÇÃO

### DevOps & Tooling
- [ADR-009: TypeScript Backend](./adrs/ADR-009-typescript-backend.md) - ACEITO
- [ADR-010: Prisma ORM](./adrs/ADR-010-prisma-orm.md) - ACEITO
- [ADR-011: VS Code Toolsets](./adrs/ADR-011-vscode-toolsets.md) - ACEITO

### AI Integration
- [ADR-012: Multi-Provider AI Strategy](./adrs/ADR-012-multi-ai.md) - PROPOSTO
- [ADR-013: Copilot Instructions Standard](./adrs/ADR-013-copilot-standard.md) - ACEITO

## 📊 Status Legend
- **PROPOSTO**: Under discussion
- **EM AVALIAÇÃO**: Approved for testing
- **ACEITO**: Implemented and adopted
- **DEPRECIADO**: Replaced by newer decision
- **REJEITADO**: Decided against implementation
```

## 📖 README.md Estrutura

```markdown
# Academia Krav Maga v2.0 🥋

> Sistema completo de gestão para academia com arquitetura modular e API-first

## 🚀 Quick Start

```bash
# Clone e instale dependências
git clone <repo>
cd academia
npm install

# Configure ambiente
cp .env.example .env
npm run db:migrate

# Inicie desenvolvimento
npm run dev
```

## 📁 Estrutura do Projeto

```
academia/
├── 🔧 Backend (TypeScript + Fastify)
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── controllers/     # Business logic
│   │   └── services/        # External integrations
│   └── prisma/              # Database schema
├── 🎨 Frontend (Modular Vanilla JS)
│   ├── public/js/modules/   # Feature modules
│   ├── public/css/modules/  # Isolated stylesheets
│   └── public/js/core/      # Core app system
└── 📚 Documentation
    ├── dev/                 # Developer guidelines
    ├── docs/                # Technical documentation
    └── .github/             # AI agent instructions
```

## 🏗️ Arquitetura Core

### Módulos Disponíveis
- 👥 **Students** - Gestão completa de alunos
- 📚 **Lesson Plans** - Planejamento de aulas
- 🏃 **Activities** - Atividades e exercícios
- 🎓 **Courses** - Estrutura de cursos
- 👨‍🏫 **Instructors** - Gestão de instrutores
- 💰 **Payments** - Sistema financeiro

### Design System
```css
/* Tokens principais */
--primary-color: #667eea;
--secondary-color: #764ba2;
--gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Classes premium */
.module-header-premium      /* Headers com gradiente */
.stat-card-enhanced        /* Cards estatísticos */
.module-filters-premium    /* Filtros avançados */
```

## 🔌 API Endpoints

### Students
```http
GET    /api/students              # Lista paginada
POST   /api/students              # Criar aluno
GET    /api/students/:id          # Detalhes do aluno
PUT    /api/students/:id          # Atualizar aluno
DELETE /api/students/:id          # Remover aluno
```

### Classes
```http
GET    /api/classes               # Lista de aulas
POST   /api/classes               # Criar aula
GET    /api/classes/:id/attendance # Presença da aula
```

[📖 **Documentação completa da API**](http://localhost:3000/docs)

## 🛠️ Desenvolvimento

### Comandos Principais
```bash
npm run dev          # Servidor desenvolvimento
npm run test         # Executar testes
npm run lint         # Validar código
npm run db:studio    # Interface do banco
npm run build        # Build produção
```

### VS Code Setup
- Instale extensão `Copilot`
- Use toolsets pré-configurados
- Consulte `.github/copilot-instructions.md`

### Padrões de Código
```javascript
// 1. Sempre use API client centralizado
await moduleAPI.fetchWithStates('/api/endpoint', {
    loadingElement: container,
    onSuccess: (data) => renderData(data),
    onEmpty: () => showEmptyState(),
    onError: (error) => showErrorState(error)
});

// 2. Registre módulos no core app
window.app.registerModule('myModule', moduleInstance);

// 3. Use isolamento CSS
.module-isolated-mymodule__component { }
```

## 🎯 Features

### ✅ Implementado
- [x] Sistema modular completo
- [x] API RESTful com Swagger
- [x] Interface premium responsiva
- [x] Gestão de estudantes
- [x] Planejamento de aulas
- [x] Sistema de autenticação
- [x] Integração com gateway de pagamento

### 🔄 Em Desenvolvimento
- [ ] Sistema de presença
- [ ] Relatórios avançados
- [ ] App mobile
- [ ] Integração WhatsApp

### 💡 Roadmap
- [ ] Gamificação
- [ ] IA para análise de performance
- [ ] Multi-tenancy
- [ ] PWA support

## 📊 Performance

- **Backend**: ~200ms response time
- **Frontend**: <2s initial load
- **Database**: PostgreSQL otimizado
- **Caching**: Redis + in-memory

## 🤝 Contribuindo

1. Clone o projeto
2. Crie branch: `git checkout -b feature/nova-funcionalidade`
3. Siga padrões em `/dev/GUIDELINES2.md`
4. Execute testes: `npm run test`
5. Abra Pull Request

### Guidelines
- [📋 Workflow de desenvolvimento](./dev/WORKFLOW.md)
- [🎨 Sistema de design](./dev/DESIGN_SYSTEM.md)
- [🏗️ Convenções CSS](./dev/CSS_NAMING.md)
- [📚 Padrões de documentação](./dev/DOCUMENTATION.md)

## 📞 Suporte

- **Issues**: Use GitHub Issues
- **Documentação**: `/docs` folder
- **API**: http://localhost:3000/docs
- **Email**: academia@example.com

## 📜 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.

---

**Academia Krav Maga v2.0** - Sistema modular, escalável e moderno para gestão de academias 🥋
```

## 🔄 Manutenção Automática

### Git Hooks para Documentação
```bash
#!/bin/sh
# .git/hooks/pre-commit

# Atualizar JSDoc automaticamente
npm run docs:generate

# Validar ADRs
npm run validate:adrs

# Atualizar changelog
npm run changelog:update

# Verificar links na documentação
npm run docs:check-links
```

### Scripts Package.json
```json
{
  "scripts": {
    "docs:generate": "jsdoc -c jsdoc.conf.json",
    "docs:check-links": "markdown-link-check README.md docs/**/*.md",
    "validate:adrs": "node scripts/validate-adrs.js",
    "changelog:update": "standard-version",
    "docs:serve": "docsify serve docs",
    "docs:build": "docsify build docs"
  }
}
```

---

**Regra de Ouro**: Documentação que não se atualiza automaticamente vira documentação morta.
