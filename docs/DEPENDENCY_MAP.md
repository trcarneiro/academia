# 🗺️ Mapa de Dependências - Sistema Academia

## 📋 Visão Geral

Este documento apresenta o mapa completo de dependências entre os módulos do sistema Academia, incluindo fluxos de dados, integrações de API e relacionamentos entre componentes.

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐ │
│  │   Core Files    │    │   Modules       │    │   Utilities     │ │
│  │                 │    │                 │    │                 │ │
│  │ • main.js       │    │ • students.js   │    │ • api.js        │ │
│  │ • navigation.js │    │ • plans.js      │    │ • ui.js         │ │
│  │ • dashboard.js  │    │ • classes.js    │    │ • store.js      │ │
│  │ • module-loader │    │ • attendance.js │    │ • utils.js      │ │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                   Module Loader                             │   │
│  │  ┌─────────────────┐    ┌─────────────────┐                │   │
│  │  │ plans-manager.js│    │ Other Modules   │                │   │
│  │  │ (Protected)     │    │ (Future)        │                │   │
│  │  └─────────────────┘    └─────────────────┘                │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Fluxo de Dependências

### 1. Core Dependencies (Nível 1)

```
main.js (Entry Point)
├── ui.js (UI utilities)
├── store.js (State management)
├── api.js (API client)
├── navigation.js (Route handling)
└── module-loader.js (Module loading)
```

### 2. Module Dependencies (Nível 2)

```
Feature Modules
├── students.js
│   ├── api.js
│   ├── ui.js
│   ├── store.js
│   └── module-loader.js → plans-manager.js
│
├── classes.js
│   ├── api.js
│   ├── ui.js
│   └── students.js (search functionality)
│
├── plans.js
│   ├── api.js
│   ├── ui.js
│   └── financial.js (billing integration)
│
├── attendance.js
│   ├── api.js
│   ├── ui.js
│   ├── students.js (student data)
│   └── checkpoint.js (visual recognition)
│
├── financial.js
│   ├── api.js
│   ├── ui.js
│   └── plans.js (billing plans)
│
└── courses.js
    ├── api.js
    ├── ui.js
    ├── students.js (enrollment)
    └── classes.js (class management)
```

### 3. Isolated Modules (Nível 3)

```
Module Loader System
├── plans-manager.js (Protected Module)
│   ├── Isolated from main codebase
│   ├── API fallback mechanism
│   └── Secure state management
│
└── Future Modules
    ├── Planned isolation pattern
    └── ModuleLoader integration
```

## 🛡️ Módulos Protegidos

### PlansManager (Isolado)
- **Localização**: `/js/modules/plans-manager.js`
- **Carregamento**: Via ModuleLoader
- **Proteções**:
  - Estado privado encapsulado
  - APIs com fallback
  - Versionamento estável (v1.0.0)
  - Não modificar sem backup

## 📡 Mapa de APIs

### Students API
```javascript
// Primary endpoints
GET    /api/students              → List all students
GET    /api/students/:id          → Get student by ID
POST   /api/students              → Create new student
PUT    /api/students/:id          → Update student
DELETE /api/students/:id          → Delete student

// Extended endpoints
GET    /api/students/search       → Search students
GET    /api/students/:id/subscription → Get student subscription
GET    /api/students/:id/enrollments → Get student enrollments
GET    /api/students/:id/classes  → Get student classes
```

### Classes API
```javascript
// Primary endpoints
GET    /api/classes               → List all classes
GET    /api/classes/:id           → Get class by ID
POST   /api/classes               → Create new class
PUT    /api/classes/:id           → Update class
DELETE /api/classes/:id           → Delete class

// Extended endpoints
GET    /api/classes/:id/students  → Get class students
POST   /api/classes/:id/students  → Add student to class
```

### Plans API
```javascript
// Primary endpoints
GET    /api/billing-plans         → List all billing plans
GET    /api/billing-plans/:id     → Get plan by ID
POST   /api/billing-plans         → Create new plan
PUT    /api/billing-plans/:id     → Update plan
DELETE /api/billing-plans/:id     → Delete plan

// Alternative endpoints (fallback)
GET    /api/financial/plans       → Alternative plans endpoint
```

### Attendance API
```javascript
// Primary endpoints
GET    /api/attendance            → List attendance records
POST   /api/attendance            → Create attendance record
GET    /api/attendance/student/:id → Get student attendance
GET    /api/attendance/class/:id  → Get class attendance

// Extended endpoints
POST   /api/ai/face-recognition   → Face recognition AI
POST   /api/classes/:id/lessons/:lesson/attendance/bulk → Bulk attendance
```

### Courses API
```javascript
// Primary endpoints
GET    /api/courses               → List all courses
GET    /api/courses/:id           → Get course by ID
POST   /api/courses               → Create new course
PUT    /api/courses/:id           → Update course
DELETE /api/courses/:id           → Delete course

// Extended endpoints
GET    /api/courses/:id/modules   → Get course modules
GET    /api/courses/:id/students  → Get course students
GET    /api/courses/:id/classes   → Get course classes
GET    /api/courses/:id/progress  → Get course progress
```

### Financial API
```javascript
// Primary endpoints
GET    /api/financial-responsibles → List financial responsibles
POST   /api/financial-responsibles → Create financial responsible
PUT    /api/financial-responsibles/:id → Update financial responsible

// Subscription endpoints
GET    /api/students/:id/subscription → Get student subscription
POST   /api/students/:id/subscription → Create subscription
POST   /api/students/:id/subscription/deactivate → Deactivate subscription
```

## 🔗 Integrações Entre Módulos

### 1. Students ↔ Plans Integration
```javascript
// In students.js
import { ModuleLoader } from './module-loader.js';

// Load isolated plans manager
const PlansManager = await ModuleLoader.loadModule('PlansManager', '/js/modules/plans-manager.js');

// Use protected API
const plans = await PlansManager.loadPlansData();
```

### 2. Classes ↔ Students Integration
```javascript
// In classes.js
import { searchStudents } from './students.js';

// Search students for class enrollment
const students = await searchStudents(searchTerm);
```

### 3. Attendance ↔ Students Integration
```javascript
// In attendance.js
import { getAllStudents } from './students.js';

// Load student data for attendance
const students = await getAllStudents();
```

### 4. Financial ↔ Plans Integration
```javascript
// In financial.js
import { getBillingPlans } from './plans.js';

// Load billing plans for subscription
const plans = await getBillingPlans();
```

## 🗃️ Gerenciamento de Estado

### Global State (store.js)
```javascript
// Shared state management
let currentEditingStudentId = null;
let allStudents = [];
let currentUser = null;

// State getters/setters
export const getCurrentEditingStudentId = () => currentEditingStudentId;
export const setCurrentEditingStudentId = (id) => { currentEditingStudentId = id; };
export const getAllStudents = () => allStudents;
export const setAllStudents = (students) => { allStudents = students; };
```

### Module State (Isolated)
```javascript
// In plans-manager.js
let _availablePlans = [];
let _currentPlan = null;
let _currentEditingStudentId = null;

// Private state - cannot be accessed externally
```

## 🔧 Utilitários e Helpers

### API Client (api.js)
```javascript
// Centralized API client
const API_BASE_URL = '';

async function fetchAPI(endpoint, options = {}) {
    // Standardized error handling
    // Response formatting
    // Error recovery
}
```

### UI Utilities (ui.js)
```javascript
// Shared UI functions
export const showToast = (message, type) => { /* ... */ };
export const toggleSidebar = () => { /* ... */ };
export const showSection = (sectionId) => { /* ... */ };
```

### Utils (utils.js)
```javascript
// Common utility functions
export const formatDate = (date) => { /* ... */ };
export const validateEmail = (email) => { /* ... */ };
export const generateId = () => { /* ... */ };
```

## 🚀 Fluxo de Inicialização

### 1. Application Startup
```javascript
// main.js initialization sequence
1. Load UI utilities
2. Initialize store
3. Load navigation
4. Load dashboard
5. Setup event listeners
6. Load initial data
```

### 2. Module Loading
```javascript
// Dynamic module loading
1. Check if module is already loaded
2. Load module CSS
3. Load module JavaScript
4. Initialize module
5. Cache module instance
```

### 3. Page Navigation
```javascript
// Page loading sequence
1. Clear previous content
2. Update active navigation
3. Load page-specific modules
4. Render page content
5. Initialize page events
```

## 🔄 Padrões de Comunicação

### 1. Import/Export Pattern
```javascript
// ES6 modules for core files
import { function } from './module.js';
export const function = () => { /* ... */ };
```

### 2. Global Window Objects
```javascript
// For backwards compatibility
window.ModuleLoader = { /* ... */ };
window.PlansManager = { /* ... */ };
```

### 3. Event-Driven Communication
```javascript
// Custom events for module communication
document.dispatchEvent(new CustomEvent('studentUpdated', { detail: student }));
document.addEventListener('studentUpdated', handleStudentUpdate);
```

## 🛡️ Segurança e Isolamento

### 1. Protected Modules
- Isolated state management
- Private variables with closures
- Controlled API access
- Version stability

### 2. API Security
- Standardized error handling
- Request validation
- Response sanitization
- Timeout handling

### 3. State Protection
- Encapsulated state
- Controlled mutations
- Validation layers
- Rollback mechanisms

## 📊 Métricas e Monitoramento

### 1. Module Loading Performance
```javascript
// Performance tracking
const startTime = performance.now();
await ModuleLoader.loadModule('ModuleName', '/path/to/module.js');
const loadTime = performance.now() - startTime;
```

### 2. API Response Times
```javascript
// API performance monitoring
const apiStartTime = performance.now();
const response = await fetchAPI('/api/endpoint');
const apiTime = performance.now() - apiStartTime;
```

### 3. Memory Usage
```javascript
// Memory tracking
const memoryUsage = performance.memory;
console.log('Used JSHeapSize:', memoryUsage.usedJSHeapSize);
```

## 🔮 Expansibilidade

### 1. New Module Integration
```javascript
// Pattern for new modules
1. Create isolated module in /js/modules/
2. Implement ModuleLoader integration
3. Add CSS isolation
4. Define API contracts
5. Document dependencies
```

### 2. API Extension
```javascript
// Pattern for new APIs
1. Define endpoint structure
2. Add error handling
3. Implement caching
4. Add validation
5. Document usage
```

### 3. Feature Addition
```javascript
// Pattern for new features
1. Analyze impact on existing modules
2. Define integration points
3. Implement with isolation
4. Add comprehensive tests
5. Update documentation
```

## 🎯 Recomendações

### 1. Desenvolvimento
- Sempre usar ModuleLoader para novos módulos
- Manter isolamento entre módulos
- Implementar fallbacks para APIs
- Documentar dependências

### 2. Manutenção
- Não modificar módulos protegidos sem backup
- Testar integrações após mudanças
- Monitorar performance
- Manter documentação atualizada

### 3. Debugging
- Usar console.log com prefixos de módulo
- Implementar modo debug
- Rastrear fluxo de dados
- Monitorar carregamento de módulos

---

*Última atualização: 16/07/2025*
*Versão: 1.0.0*
*Mantido por: Academia Development Team*