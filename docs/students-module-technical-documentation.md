# Students Module - Technical Documentation

## Overview

The Students module is a comprehensive system for managing student data, academic progress, attendance, and financial integrations within the Krav Maga Academy platform. It follows a modular architecture with isolated components, full-screen navigation patterns, and API-first data management.

## Architecture Overview

### Core Components

```
Students Module
├── Frontend Components
│   ├── /public/js/modules/students.js     # Main module logic
│   ├── /public/views/students.html        # Students list view
│   ├── /public/views/student-editor.html  # Student editor view
│   ├── /public/css/modules/students.css   # Module-specific styles
│   └── /public/css/students.css          # Isolated styles
├── Backend Components
│   ├── /src/routes/students.ts            # API routes
│   ├── /src/services/financialService.ts  # Financial integration
│   └── prisma/schema.prisma              # Database schema
└── Integration Layer
    ├── Module Loader                     # Safe module loading
    ├── Financial Service                 # Subscription management
    └── Attendance Service               # Attendance tracking
```

### Design Principles

1. **Modular Architecture**: Isolated components with clear boundaries
2. **Full-Screen Navigation**: No modals - each action has its own page
3. **API-First**: All data operations through REST endpoints
4. **Graceful Degradation**: Fallbacks for missing dependencies
5. **Security**: Protected routes and data validation

## Database Schema

### Student Model

```prisma
model Student {
  id                     String                @id @default(uuid())
  organizationId         String
  userId                 String                @unique
  emergencyContact       String?
  medicalConditions      String?
  category               StudentCategory       @default(ADULT)
  gender                 Gender?               @default(MASCULINO)
  age                    Int?
  physicalCondition      PhysicalCondition?    @default(INICIANTE)
  specialNeeds           SpecialNeed[]
  totalXP                Int                   @default(0)
  globalLevel            Int                   @default(1)
  currentStreak          Int                   @default(0)
  longestStreak          Int                   @default(0)
  lastCheckinDate        DateTime?
  preferredDays          String[]
  preferredTimes         String[]
  notifications          Boolean               @default(true)
  enrollmentDate         DateTime              @default(now())
  isActive               Boolean               @default(true)
  createdAt              DateTime              @default(now())
  updatedAt              DateTime              @updatedAt
  financialResponsibleId String?
  
  // Relations
  user                   User                  @relation(fields: [userId], references: [id])
  organization           Organization          @relation(fields: [organizationId], references: [id])
  financialResponsible   FinancialResponsible? @relation(fields: [financialResponsibleId], references: [id])
  attendances            Attendance[]
  subscriptions          StudentSubscription[]
  enrollments            CourseEnrollment[]
  progressions           StudentProgression[]
  evaluations            Evaluation[]
  payments               Payment[]
  achievements           StudentAchievement[]
  attendanceRecords      AttendanceRecord[]
  progressRecords        Progress[]
  
  @@map("students")
}
```

### Key Enums

```prisma
enum StudentCategory {
  ADULT
  INICIANTE1
  INICIANTE2
  MASTER1
  MASTER2
  MASTER3
  HEROI1
  HEROI2
  HEROI3
}

enum Gender {
  MASCULINO
  FEMININO
  OUTRO
}

enum PhysicalCondition {
  INICIANTE
  BASICO
  INTERMEDIARIO
  AVANCADO
}

enum SpecialNeed {
  TEA
  TDAH
  MobilidadeReduzida
  DeficienciaVisual
  DeficienciaAuditiva
}
```

## API Reference

### Base URL
```
/api/students
```

### Endpoints

#### GET /api/students
**Description**: List all students with pagination and filters

**Query Parameters**:
- `limit` (number): Maximum number of results (default: 50)
- `offset` (number): Number of results to skip (default: 0)
- `category` (string): Filter by student category
- `isActive` (boolean): Filter by active status

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "organizationId": "uuid",
      "userId": "uuid",
      "category": "ADULT",
      "gender": "MASCULINO",
      "age": 25,
      "physicalCondition": "INTERMEDIARIO",
      "totalXP": 1250,
      "globalLevel": 5,
      "currentStreak": 7,
      "enrollmentDate": "2025-01-01T00:00:00Z",
      "isActive": true,
      "user": {
        "firstName": "João",
        "lastName": "Silva",
        "email": "joao@example.com",
        "phone": "+5511999999999",
        "isActive": true
      },
      "financialResponsible": {
        "name": "Maria Silva",
        "email": "maria@example.com",
        "phone": "+5511888888888"
      },
      "_count": {
        "attendances": 45,
        "evaluations": 3,
        "progressions": 2
      }
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "pages": 3
  }
}
```

#### GET /api/students/:id
**Description**: Get detailed student information

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "organizationId": "uuid",
    "userId": "uuid",
    "emergencyContact": "Maria Silva - (11) 88888-8888",
    "medicalConditions": "Nenhuma condição médica relevante",
    "category": "ADULT",
    "gender": "MASCULINO",
    "age": 25,
    "physicalCondition": "INTERMEDIARIO",
    "specialNeeds": ["TEA"],
    "totalXP": 1250,
    "globalLevel": 5,
    "currentStreak": 7,
    "longestStreak": 15,
    "lastCheckinDate": "2025-07-15T18:30:00Z",
    "preferredDays": ["MONDAY", "WEDNESDAY", "FRIDAY"],
    "preferredTimes": ["18:00", "19:00"],
    "notifications": true,
    "enrollmentDate": "2025-01-01T00:00:00Z",
    "isActive": true,
    "user": {
      "firstName": "João",
      "lastName": "Silva",
      "email": "joao@example.com",
      "phone": "+5511999999999",
      "avatarUrl": "https://example.com/avatar.jpg"
    },
    "attendances": [
      {
        "id": "uuid",
        "date": "2025-07-15T18:30:00Z",
        "present": true,
        "notes": "Excelente participação"
      }
    ],
    "evaluations": [
      {
        "id": "uuid",
        "date": "2025-07-01T00:00:00Z",
        "score": 85,
        "grade": "B+"
      }
    ],
    "progressions": [
      {
        "id": "uuid",
        "currentLevel": 5,
        "currentGrade": "Green Belt",
        "progressToNextGrade": 75.5
      }
    ]
  }
}
```

#### POST /api/students
**Description**: Create a new student

**Request Body**:
```json
{
  "firstName": "João",
  "lastName": "Silva",
  "email": "joao@example.com",
  "phone": "+5511999999999",
  "category": "ADULT",
  "gender": "MASCULINO",
  "age": 25,
  "emergencyContact": "Maria Silva - (11) 88888-8888",
  "medicalConditions": "Nenhuma condição médica relevante",
  "financialResponsibleId": "uuid"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "organizationId": "uuid",
    "userId": "uuid",
    "category": "ADULT",
    "gender": "MASCULINO",
    "age": 25,
    "user": {
      "firstName": "João",
      "lastName": "Silva",
      "email": "joao@example.com",
      "phone": "+5511999999999"
    }
  },
  "message": "Student created successfully"
}
```

#### PUT /api/students/:id
**Description**: Update student information

**Request Body**:
```json
{
  "firstName": "João Carlos",
  "lastName": "Silva",
  "email": "joao.carlos@example.com",
  "category": "MASTER1",
  "emergencyContact": "Maria Silva - (11) 88888-8888",
  "isActive": true
}
```

#### Financial Integration Endpoints

#### GET /api/students/:id/subscription
**Description**: Get student's active subscription

#### POST /api/students/:id/subscription
**Description**: Create subscription for student

**Request Body**:
```json
{
  "planId": "uuid",
  "startDate": "2025-07-01T00:00:00Z",
  "customPrice": 150.00
}
```

#### GET /api/students/:id/enrollments
**Description**: Get student's course enrollments

#### POST /api/students/:id/apply-auto-enrollments
**Description**: Apply automatic course enrollments retroactively

## Frontend Architecture

### Main Module Structure

```javascript
// /public/js/modules/students.js
(function() {
    'use strict';
    
    // Module state
    let allStudents = [];
    let filteredStudents = [];
    let currentView = 'table';
    
    // Public API
    window.loadStudentsList = loadStudentsList;
    window.filterStudents = filterStudents;
    window.switchView = switchView;
    window.openAddStudentPage = openAddStudentPage;
    window.viewStudent = viewStudent;
    window.editStudent = editStudent;
    
    // Private functions
    async function initializeStudentsModule() { /* ... */ }
    async function loadStudentsList() { /* ... */ }
    function filterStudents() { /* ... */ }
    function updateStudentsDisplay() { /* ... */ }
    function updateStudentsTable() { /* ... */ }
    function updateStudentsGrid() { /* ... */ }
    function updateStudentsStats() { /* ... */ }
})();
```

### State Management

The Students module uses a simple state management pattern:

```javascript
// Module state
let allStudents = [];          // Complete dataset from API
let filteredStudents = [];     // Filtered view of data
let currentView = 'table';     // Current display mode

// State updates
function updateState(newStudents) {
    allStudents = newStudents;
    filteredStudents = [...allStudents];
    updateStudentsDisplay();
    updateStudentsStats();
}
```

### Navigation Pattern

The module follows the full-screen navigation pattern:

```javascript
// Navigation functions
window.openAddStudentPage = function() {
    window.location.href = '/views/student-editor.html';
};

window.viewStudent = function(studentId) {
    window.location.href = `/views/student-editor.html?id=${studentId}&mode=view`;
};

window.editStudent = function(studentId) {
    window.location.href = `/views/student-editor.html?id=${studentId}&mode=edit`;
};
```

### Data Loading and Caching

```javascript
async function loadStudentsList() {
    try {
        showLoadingState();
        
        const response = await fetch('/api/students');
        const result = await response.json();
        
        if (result.success) {
            allStudents = result.data || [];
            filteredStudents = [...allStudents];
            updateStudentsDisplay();
            updateStudentsStats();
            
            if (allStudents.length === 0) {
                showEmptyState();
            }
        } else {
            throw new Error(result.message || 'Failed to load students');
        }
    } catch (error) {
        console.error('❌ Error loading students:', error);
        showError('Erro ao carregar alunos: ' + error.message);
    } finally {
        hideLoadingState();
    }
}
```

## Student Editor Architecture

### Multi-Tab Interface

The student editor uses a tabbed interface for different aspects:

1. **Edit Tab**: Form for editing student data
2. **Overview Tab**: Read-only summary
3. **Academic Tab**: Academic progress and courses
4. **Financial Tab**: Subscription and payment history
5. **Progress Tab**: XP, levels, and achievements
6. **Activity Tab**: Recent attendance and activity

### Form Structure

```html
<form id="editStudentForm" onchange="updateFormProgress()">
    <!-- Step 1: Personal Information -->
    <div class="form-section-enhanced">
        <div class="step-indicator">
            <div class="step-number">1</div>
            <h3>👤 Dados Pessoais</h3>
        </div>
        <!-- Form fields -->
    </div>
    
    <!-- Step 2: Academy Information -->
    <div class="form-section-enhanced">
        <div class="step-indicator">
            <div class="step-number">2</div>
            <h3>🥋 Academia</h3>
        </div>
        <!-- Form fields -->
    </div>
    
    <!-- Step 3: Medical Information -->
    <div class="form-section-enhanced">
        <div class="step-indicator">
            <div class="step-number">3</div>
            <h3>🏥 Saúde & Emergência</h3>
        </div>
        <!-- Form fields -->
    </div>
    
    <!-- Step 4: Statistics (Read-only) -->
    <div class="form-section-enhanced">
        <div class="step-indicator">
            <div class="step-number">4</div>
            <h3>📊 Estatísticas</h3>
        </div>
        <!-- Read-only fields -->
    </div>
</form>
```

### Progress Tracking

```javascript
function updateFormProgress() {
    const form = document.getElementById('editStudentForm');
    const inputs = form.querySelectorAll('input[required], select[required]');
    let filled = 0;
    
    inputs.forEach(input => {
        if (input.value && input.value.trim() !== '') {
            filled++;
        }
    });
    
    const progress = (filled / inputs.length) * 100;
    document.getElementById('editFormProgress').style.width = `${progress}%`;
}
```

## CSS Architecture

### Isolated Styling

The module uses CSS isolation to prevent conflicts:

```css
/* /public/css/modules/students.css */
.students-isolated {
    /* All module styles are scoped within this class */
}

.students-isolated .student-card {
    background: rgba(30, 41, 59, 0.8);
    border: 1px solid rgba(148, 163, 184, 0.1);
    border-radius: 16px;
    padding: 1.5rem;
    transition: all 0.2s ease;
}

.students-isolated .student-card:hover {
    background: rgba(30, 41, 59, 0.9);
    border-color: #10B981;
    transform: translateY(-2px);
}
```

### Component Styling

```css
/* Student table styles */
.students-isolated .students-table {
    width: 100%;
    border-collapse: collapse;
}

.students-isolated .students-table th {
    padding: 1rem;
    text-align: left;
    color: #F8FAFC;
    font-weight: 600;
    background: #1E293B;
    border-bottom: 1px solid #374151;
}

.students-isolated .students-table td {
    padding: 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    color: #E2E8F0;
}

.students-isolated .students-table tbody tr:hover {
    background-color: rgba(16, 185, 129, 0.05);
}
```

## Integration Points

### Module Loader Integration

```javascript
// Module is loaded through the ModuleLoader
window.ModuleLoader.loadModule('StudentsModule', '/js/modules/students.js');
```

### Financial Service Integration

```javascript
// Financial operations are handled through the FinancialService
const financialService = new FinancialService(organizationId);

// Create subscription
const subscription = await financialService.createSubscription({
    studentId: 'uuid',
    planId: 'uuid',
    startDate: new Date(),
    customPrice: 150.00
});

// Update subscription
const updatedSubscription = await financialService.updateSubscriptionPlan(
    subscriptionId,
    newPlanId,
    customPrice
);
```

### Attendance Service Integration

```javascript
// Attendance tracking integration
const attendanceService = new AttendanceService(organizationId);

// Record attendance
const attendance = await attendanceService.recordAttendance({
    studentId: 'uuid',
    classId: 'uuid',
    present: true,
    notes: 'Excelente participação'
});
```

## Error Handling

### API Error Handling

```javascript
async function loadStudentsList() {
    try {
        const response = await fetch('/api/students');
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Failed to load students');
        }
        
        // Process successful response
        processStudentsData(result.data);
        
    } catch (error) {
        console.error('❌ Error loading students:', error);
        showError('Erro ao carregar alunos: ' + error.message);
    }
}
```

### Frontend Error States

```javascript
function showError(message) {
    const container = document.getElementById('studentsContainer');
    container.innerHTML = `
        <div class="error-state">
            <div class="error-state-icon">❌</div>
            <div class="error-state-title">Erro ao carregar</div>
            <div class="error-state-description">${message}</div>
            <button class="btn btn-primary" onclick="loadStudentsList()">
                🔄 Tentar novamente
            </button>
        </div>
    `;
}
```

## Security Considerations

### Data Validation

```javascript
// Input validation
function validateStudentData(data) {
    const errors = [];
    
    if (!data.firstName || data.firstName.trim().length < 2) {
        errors.push('Nome deve ter pelo menos 2 caracteres');
    }
    
    if (!data.email || !isValidEmail(data.email)) {
        errors.push('Email inválido');
    }
    
    if (!data.category || !isValidCategory(data.category)) {
        errors.push('Categoria inválida');
    }
    
    return errors;
}
```

### API Security

```typescript
// Backend validation
fastify.post('/', {
    schema: {
        body: {
            type: 'object',
            required: ['firstName', 'lastName', 'email', 'category'],
            properties: {
                firstName: { type: 'string', minLength: 2 },
                lastName: { type: 'string', minLength: 2 },
                email: { type: 'string', format: 'email' },
                category: { type: 'string', enum: ['ADULT', 'INICIANTE1', ...] }
            }
        }
    }
}, async (request, reply) => {
    // Handler implementation
});
```

## Performance Optimizations

### Lazy Loading

```javascript
// Load students data only when needed
let studentsCache = null;
let cacheExpiry = null;

async function getStudentsData() {
    const now = Date.now();
    
    if (studentsCache && cacheExpiry && now < cacheExpiry) {
        return studentsCache;
    }
    
    const response = await fetch('/api/students');
    const result = await response.json();
    
    studentsCache = result.data;
    cacheExpiry = now + (5 * 60 * 1000); // 5 minutes
    
    return studentsCache;
}
```

### Debounced Search

```javascript
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Apply debounce to search
const searchInput = document.getElementById('studentSearch');
searchInput.addEventListener('input', debounce(filterStudents, 300));
```

### Virtual Scrolling (for large datasets)

```javascript
function updateStudentsTable() {
    const visibleStart = Math.floor(scrollTop / rowHeight);
    const visibleEnd = Math.min(visibleStart + visibleCount, filteredStudents.length);
    
    const visibleStudents = filteredStudents.slice(visibleStart, visibleEnd);
    
    tableBody.innerHTML = visibleStudents.map(student => {
        return createStudentRow(student);
    }).join('');
}
```

## Testing Strategy

### Unit Tests

```javascript
// Example unit test for filterStudents function
describe('filterStudents', () => {
    beforeEach(() => {
        allStudents = [
            { id: '1', user: { firstName: 'João', lastName: 'Silva' } },
            { id: '2', user: { firstName: 'Maria', lastName: 'Santos' } }
        ];
    });
    
    it('should filter students by name', () => {
        document.getElementById('studentSearch').value = 'João';
        filterStudents();
        
        expect(filteredStudents.length).toBe(1);
        expect(filteredStudents[0].id).toBe('1');
    });
    
    it('should filter students by status', () => {
        document.getElementById('statusFilter').value = 'ACTIVE';
        filterStudents();
        
        expect(filteredStudents.every(s => s.status === 'ACTIVE')).toBe(true);
    });
});
```

### Integration Tests

```javascript
// Test API integration
describe('Students API', () => {
    it('should load students list', async () => {
        const response = await fetch('/api/students');
        const result = await response.json();
        
        expect(result.success).toBe(true);
        expect(Array.isArray(result.data)).toBe(true);
    });
    
    it('should create new student', async () => {
        const studentData = {
            firstName: 'Test',
            lastName: 'Student',
            email: 'test@example.com',
            category: 'ADULT'
        };
        
        const response = await fetch('/api/students', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(studentData)
        });
        
        const result = await response.json();
        
        expect(result.success).toBe(true);
        expect(result.data.user.firstName).toBe('Test');
    });
});
```

## Deployment Considerations

### Environment Variables

```env
# Required environment variables
DATABASE_URL=postgresql://user:password@localhost:5432/academia
ASAAS_API_KEY=your_asaas_api_key
ASAAS_SANDBOX=true
```

### Database Migrations

```sql
-- Migration for students table
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    user_id UUID NOT NULL UNIQUE,
    emergency_contact TEXT,
    medical_conditions TEXT,
    category VARCHAR(20) DEFAULT 'ADULT',
    gender VARCHAR(10) DEFAULT 'MASCULINO',
    age INTEGER,
    physical_condition VARCHAR(20) DEFAULT 'INICIANTE',
    special_needs TEXT[],
    total_xp INTEGER DEFAULT 0,
    global_level INTEGER DEFAULT 1,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_checkin_date TIMESTAMP,
    preferred_days TEXT[],
    preferred_times TEXT[],
    notifications BOOLEAN DEFAULT true,
    enrollment_date TIMESTAMP DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    financial_responsible_id UUID,
    
    FOREIGN KEY (organization_id) REFERENCES organizations(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (financial_responsible_id) REFERENCES financial_responsibles(id)
);
```

## Monitoring and Logging

### Performance Metrics

```javascript
// Track module performance
const performanceMetrics = {
    moduleLoadTime: 0,
    dataLoadTime: 0,
    renderTime: 0,
    
    trackModuleLoad(startTime) {
        this.moduleLoadTime = Date.now() - startTime;
        console.log(`📊 Module loaded in ${this.moduleLoadTime}ms`);
    },
    
    trackDataLoad(startTime) {
        this.dataLoadTime = Date.now() - startTime;
        console.log(`📊 Data loaded in ${this.dataLoadTime}ms`);
    },
    
    trackRender(startTime) {
        this.renderTime = Date.now() - startTime;
        console.log(`📊 Rendered in ${this.renderTime}ms`);
    }
};
```

### Error Logging

```javascript
// Centralized error logging
function logError(error, context) {
    const errorData = {
        message: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
    };
    
    // Send to monitoring service
    fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData)
    });
    
    console.error('❌ Error logged:', errorData);
}
```

## Future Enhancements

### Planned Features

1. **Real-time Updates**: WebSocket integration for live data updates
2. **Advanced Filtering**: More sophisticated search and filter options
3. **Bulk Operations**: Mass actions for multiple students
4. **Mobile App**: React Native mobile application
5. **Analytics Dashboard**: Advanced reporting and analytics
6. **AI Integration**: Smart recommendations and insights

### Technical Improvements

1. **GraphQL Migration**: Replace REST with GraphQL for better performance
2. **Micro-frontend Architecture**: Split into smaller, independent modules
3. **Progressive Web App**: Offline capabilities and app-like experience
4. **Advanced Caching**: Redis caching for better performance
5. **Event-Driven Architecture**: Implement event sourcing for audit trails

## Conclusion

The Students module represents a comprehensive, scalable, and maintainable solution for managing student data within the Krav Maga Academy platform. Its modular architecture, security-first approach, and integration capabilities make it a robust foundation for future development.

The module successfully balances functionality with usability, providing powerful features while maintaining a clean and intuitive user interface. The full-screen navigation pattern and API-first architecture ensure consistency with the broader platform while enabling independent development and testing.

For questions or contributions to this documentation, please refer to the project's contribution guidelines in the main README.md file.