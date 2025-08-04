# Classes Module - Technical Documentation

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [API Reference](#api-reference)
4. [Frontend Components](#frontend-components)
5. [State Management](#state-management)
6. [Business Logic](#business-logic)
7. [Integration Points](#integration-points)
8. [UI/UX Patterns](#uiux-patterns)
9. [Calendar and Scheduling](#calendar-and-scheduling)
10. [Error Handling](#error-handling)
11. [Performance Considerations](#performance-considerations)
12. [Modification Guidelines](#modification-guidelines)

---

## Architecture Overview

The Classes module follows the project's **isolated modular architecture** as defined in `CLAUDE.md`. It manages the core scheduling and execution of martial arts classes within the academy system.

### Core Concepts

- **Multi-Belt Classes**: A single class can accommodate students from multiple belt levels (courses) simultaneously
- **Full-Screen UI**: All interactions use dedicated full-screen pages, no modals or popups
- **API-First**: All data operations go through backend APIs with localStorage fallback
- **Isolated CSS**: All styles use the `classes-isolated-` prefix to prevent conflicts

### Module Structure

```
public/
├── views/
│   ├── classes.html          # Main classes list view
│   └── class-editor.html     # Create/edit class form
├── js/modules/
│   └── classes.js           # Isolated JavaScript module
└── css/modules/
    └── classes.css          # Isolated CSS styles
```

---

## Database Schema

### Primary Models

#### Class Model
```typescript
model Class {
  id                String             @id @default(uuid())
  organizationId    String
  unitId            String?            // Physical location
  matId             String?            // Specific mat/area
  scheduleId        String?            // Recurring schedule template
  instructorId      String             // Primary instructor
  courseId          String             // Associated course
  lessonPlanId      String?            // Specific lesson plan
  date              DateTime           // Class date
  startTime         DateTime           // Start time
  endTime           DateTime           // End time
  title             String?            // Custom title
  description       String?            // Class description
  status            ClassStatus        // SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
  actualStudents    Int                // Current enrollment
  maxStudents       Int                // Capacity limit
  agenda            Json?              // Detailed class agenda
  notes             String?            // Instructor notes
  qrCode            String?            // QR code for check-in
  qrCodeExpiry      DateTime?          // QR code expiration
  createdAt         DateTime
  updatedAt         DateTime
}
```

#### ClassSchedule Model (Recurring Templates)
```typescript
model ClassSchedule {
  id          String   @id @default(uuid())
  dayOfWeek   Int      // 0-6 (Sunday to Saturday)
  startTime   DateTime // Time component used
  endTime     DateTime // Time component used  
  maxStudents Int      @default(20)
  isActive    Boolean  @default(true)
  classes     Class[]  // Generated classes
}
```

### Related Models

- **Course**: Defines curriculum and belt progression
- **Instructor**: Manages class instruction
- **Unit/Mat**: Physical location and space management
- **Attendance**: Tracks student participation
- **LessonPlan**: Structured class content

---

## API Reference

### Current Implementation Status

⚠️ **API Endpoints Missing**: The Classes module currently implements frontend-only functionality. Backend API endpoints need to be implemented in `server-complete.js`.

### Required API Endpoints

#### GET /api/classes
```typescript
// List all classes with filtering
Query Parameters:
- limit?: number = 50
- offset?: number = 0
- status?: 'active' | 'finished' | 'paused' | 'all'
- martialArt?: string
- instructorId?: string
- unitId?: string
- dateFrom?: string (ISO date)
- dateTo?: string (ISO date)

Response:
{
  success: boolean
  data: Class[]
  pagination: {
    total: number
    limit: number
    offset: number
    pages: number
  }
}
```

#### GET /api/classes/:id
```typescript
// Get specific class details
Response:
{
  success: boolean
  data: Class & {
    instructor: Instructor
    course: Course
    unit?: Unit
    mat?: Mat
    enrolledStudents: Student[]
    lessonPlan?: LessonPlan
  }
}
```

#### POST /api/classes
```typescript
// Create new class
Request Body:
{
  name: string
  martialArt: string
  capacity: number
  instructor: string
  schedule: {
    days: string[]           // ['monday', 'wednesday']
    startTime: string        // '18:00'
    endTime: string         // '19:00'
    startDate: string       // '2025-06-01'
    duration: number        // weeks
  }
  includedCourses: string[] // ['branca', 'amarela']
}

Response:
{
  success: boolean
  data: Class
}
```

#### PUT /api/classes/:id
```typescript
// Update existing class
Request Body: Same as POST
Response: Same as POST
```

#### DELETE /api/classes/:id
```typescript
// Delete class
Response:
{
  success: boolean
  message: string
}
```

#### GET /api/classes/schedule
```typescript
// Get class schedule overview
Query Parameters:
- date?: string (ISO date, defaults to today)
- range?: 'day' | 'week' | 'month'

Response:
{
  success: boolean
  data: {
    date: string
    classes: Array<{
      id: string
      title: string
      startTime: string
      endTime: string
      instructor: string
      enrolledStudents: number
      maxStudents: number
      courses: string[]
    }>
  }
}
```

---

## Frontend Components

### Main Classes View (`classes.html`)

**Purpose**: Display all classes in a searchable, filterable table format

**Key Features**:
- Real-time statistics (active classes, total students, attendance rate)
- Filterable class list (status, martial art)
- Quick action buttons (view, edit, schedule management)
- Today's schedule preview
- Weekly statistics dashboard

**Data Flow**:
1. `initClassesModule()` → Initialize module
2. `fetchClasses()` → Load data from API
3. `updateClassesDisplay()` → Render table
4. `updateClassesStats()` → Update statistics

### Class Editor (`class-editor.html`)

**Purpose**: Create new classes or edit existing ones

**Key Features**:
- Multi-step form (basic info, schedule, included courses)
- Day of week selection
- Time range picker
- Multi-course selection (multi-belt concept)
- Validation and error handling

**Form Sections**:
1. **Basic Information**: Name, martial art, capacity, instructor
2. **Schedule Configuration**: Days, times, duration, start date
3. **Courses/Belts**: Multi-selection of belt levels

### JavaScript Module (`classes.js`)

**Core Functions**:

```javascript
// Initialization
initClassesModule()           // Module setup
loadClassesData()            // Initial data load
setupEventListeners()        // Event binding

// Data Management  
fetchClasses()               // API data fetch
saveClassToAPI(classData)    // Create/update class
deleteClassFromAPI(classId)  // Delete class

// UI Updates
updateClassesDisplay()       // Render class table
updateClassesStats()         // Update statistics
populateForm(classData)      // Fill edit form

// Actions
createNewClass()             // Navigate to editor
editClass(classId)           // Edit existing class
viewClassDetails(classId)    // View details (planned)
manageClassSchedule(classId) // Schedule management (planned)

// Utilities
filterClasses(classes)       // Apply filters
formatSchedule(schedule)     // Format display
collectFormData()           // Extract form data
```

---

## State Management

### Global State Object

```javascript
let classesState = {
    classes: [],              // All loaded classes
    filters: {
        status: 'all',        // Filter by status
        martialArt: 'all'     // Filter by martial art
    },
    loading: false,           // Loading indicator
    editingClass: null        // Currently editing class
};
```

### Caching Strategy

1. **Primary**: API calls for real-time data
2. **Fallback**: localStorage cache for offline functionality
3. **Cache Update**: On successful API operations

```javascript
// Cache implementation example
localStorage.setItem('classes_cache', JSON.stringify(classesState.classes));
```

---

## Business Logic

### Multi-Belt Class Concept

The Classes module implements a unique **multi-belt training system**:

- **Single Class, Multiple Belts**: One class can have students from different belt levels
- **Parallel Progression**: Each belt follows its own curriculum within the shared class time
- **Instructor Management**: One instructor manages multiple progression tracks simultaneously

### Class Scheduling Rules

1. **Capacity Management**: `enrolledStudents <= maxStudents`
2. **Schedule Conflicts**: No overlapping classes for same instructor/mat
3. **Course Prerequisites**: Students must meet course requirements
4. **Attendance Tracking**: Integration with attendance module

### Status Lifecycle

```
SCHEDULED → IN_PROGRESS → COMPLETED
     ↓           ↓            ↓
  CANCELLED  CANCELLED   (archived)
     ↓           ↓
  POSTPONED  POSTPONED
```

### Belt Progression Integration

```javascript
// Example: Class supports multiple belt levels
const classData = {
  name: "Turma 1",
  martialArt: "KRAV_MAGA", 
  includedCourses: ['branca', 'amarela', 'laranja'],
  schedule: {
    days: ['tuesday', 'thursday'],
    startTime: '18:00',
    endTime: '19:00'
  }
};
```

---

## Integration Points

### Students Module Integration

- **Enrollment**: Students enroll in classes through Plans module
- **Attendance**: Real-time attendance tracking
- **Progress**: Class participation affects student progression

### Attendance Module Integration

```javascript
// Class provides context for attendance
const attendanceContext = {
  classId: class.id,
  courseLevel: student.currentCourse,
  lessonNumber: lessonPlan.lessonNumber
};
```

### Instructor Management

- **Assignment**: Instructors are assigned to classes
- **Availability**: Check instructor schedule conflicts
- **Specialization**: Match instructor skills to class requirements

### Course Progression

- **Lesson Plans**: Classes follow structured lesson plans
- **Technique Tracking**: Student technique progress per class
- **Evaluations**: Periodic assessments within classes

### Calendar Systems

- **Schedule Generation**: Create recurring class instances
- **Conflict Detection**: Prevent overlapping schedules
- **Holiday Management**: Handle schedule breaks

---

## UI/UX Patterns

### Full-Screen Navigation

Following `CLAUDE.md` guidelines:

```javascript
// Navigation examples
createNewClass() → class-editor.html?mode=create
editClass(id) → class-editor.html?mode=edit&id=${id}
viewClassDetails(id) → class-details.html?id=${id} (planned)
```

### Table Interactions

- **Double-click**: Navigate to edit screen
- **Action buttons**: Quick access to common operations
- **Filters**: Real-time table filtering
- **Empty states**: Helpful messaging when no data

### Form Patterns

- **Progressive disclosure**: Multi-section forms
- **Validation**: Real-time field validation
- **Confirmation**: Save/cancel confirmations
- **Error handling**: Clear error messaging

### Visual Indicators

```css
/* Status badges */
.classes-isolated-status-active { color: #059669; }
.classes-isolated-status-paused { color: #F59E0B; }
.classes-isolated-status-finished { color: #DC2626; }

/* Belt level indicators */
.classes-isolated-belt-white { background: #FFFFFF; }
.classes-isolated-belt-yellow { background: #FDE047; }
.classes-isolated-belt-orange { background: #FB923C; }
```

---

## Calendar and Scheduling Systems

### Schedule Templates

Classes can be created from recurring schedule templates:

```javascript
const scheduleTemplate = {
  dayOfWeek: 2,              // Tuesday (0=Sunday)
  startTime: '18:00',
  endTime: '19:00',
  maxStudents: 20,
  isActive: true
};
```

### Class Generation

Automated class creation based on:
- Schedule templates
- Date ranges
- Holiday exceptions
- Instructor availability

### Conflict Detection

```javascript
// Example conflict detection logic
function hasScheduleConflict(newClass, existingClasses) {
  return existingClasses.some(existing => 
    existing.instructorId === newClass.instructorId &&
    existing.date === newClass.date &&
    timeOverlaps(existing.startTime, existing.endTime, 
                newClass.startTime, newClass.endTime)
  );
}
```

### Calendar Views

Planned calendar implementations:
- **Day View**: Today's classes with details
- **Week View**: Weekly schedule overview  
- **Month View**: Monthly class calendar
- **Instructor View**: Per-instructor schedules

---

## Error Handling

### API Error Handling

```javascript
try {
  const response = await fetch('/api/classes');
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return data;
} catch (error) {
  console.error('Error fetching classes:', error);
  showNotification('Erro ao carregar turmas', 'error');
  
  // Fallback to cached data
  const cachedData = localStorage.getItem('classes_cache');
  return cachedData ? JSON.parse(cachedData) : [];
}
```

### Form Validation

```javascript
function validateClassForm() {
  const errors = [];
  
  if (!document.getElementById('className').value) {
    errors.push('Nome da turma é obrigatório');
  }
  
  if (!document.getElementById('classMartialArt').value) {
    errors.push('Arte marcial é obrigatória');
  }
  
  const selectedDays = getSelectedDays();
  if (selectedDays.length === 0) {
    errors.push('Selecione pelo menos um dia da semana');
  }
  
  return errors;
}
```

### User Feedback

```javascript
function showNotification(message, type = 'info') {
  // Current: Simple alerts
  // Planned: Toast notifications
  if (type === 'error') {
    alert(`❌ ${message}`);
  } else if (type === 'success') {
    alert(`✅ ${message}`);
  } else {
    alert(`ℹ️ ${message}`);
  }
}
```

---

## Performance Considerations

### Data Loading

- **Lazy Loading**: Load classes on-demand
- **Pagination**: Server-side pagination for large datasets
- **Caching**: localStorage fallback for offline access

### DOM Updates

```javascript
// Efficient table updates
function updateClassesDisplay() {
  const tbody = document.getElementById('classesTableBody');
  const fragment = document.createDocumentFragment();
  
  filteredClasses.forEach(classItem => {
    const row = createClassRow(classItem);
    fragment.appendChild(row);
  });
  
  tbody.innerHTML = '';
  tbody.appendChild(fragment);
}
```

### Memory Management

- **State cleanup**: Clear old data when not needed
- **Event listeners**: Proper cleanup on navigation
- **Image loading**: Lazy load instructor/class images

---

## Modification Guidelines

### Adding New Features

1. **Follow Isolation**: Use `classes-isolated-` prefix for new CSS classes
2. **API-First**: Implement backend endpoints before frontend features
3. **Full-Screen**: Create new pages instead of modals
4. **State Management**: Update `classesState` object appropriately

### Database Changes

```typescript
// Example: Adding new class field
model Class {
  // ... existing fields
  difficulty: Int @default(1)  // New field
  tags: String[]               // New array field
}
```

### API Extensions

```javascript
// Example: Adding class statistics endpoint
app.get('/api/classes/:id/stats', async (req, res) => {
  const { id } = req.params;
  const stats = await calculateClassStats(id);
  res.json({ success: true, data: stats });
});
```

### UI Enhancements

```css
/* New component following isolation pattern */
.classes-isolated-difficulty-indicator {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
}

.classes-isolated-difficulty-beginner {
  background: #D1FAE5;
  color: #059669;
}
```

### Testing Considerations

- **Unit Tests**: Test core functions in isolation
- **Integration Tests**: Test API endpoints
- **E2E Tests**: Test complete user workflows
- **Performance Tests**: Monitor load times and memory usage

---

## Future Enhancements

### Planned Features

1. **Advanced Calendar Views**
   - Drag-and-drop schedule management
   - Recurring class templates
   - Holiday and break management

2. **Class Analytics**
   - Attendance patterns
   - Performance metrics
   - Instructor effectiveness

3. **Smart Scheduling**
   - AI-powered schedule optimization
   - Conflict prevention
   - Capacity management

4. **Mobile Optimization**
   - Responsive design improvements
   - Touch-friendly interactions
   - Offline functionality

5. **Integration Enhancements**
   - Real-time notifications
   - Payment integration
   - Equipment management

### Migration Path

When implementing backend APIs:
1. Create API endpoints in `server-complete.js`
2. Update frontend to use real endpoints
3. Implement proper error handling
4. Add comprehensive validation
5. Update documentation

---

## Conclusion

The Classes module provides a solid foundation for martial arts class management with its multi-belt concept and isolated architecture. The current frontend implementation demonstrates the intended user experience, while the backend API implementation is the next critical step for full functionality.

Key strengths:
- ✅ Follows project architecture guidelines
- ✅ Implements multi-belt class concept
- ✅ Full-screen UI pattern compliance
- ✅ Isolated CSS and JavaScript
- ✅ Comprehensive form handling

Areas requiring implementation:
- 🔄 Backend API endpoints
- 🔄 Database integration
- 🔄 Real-time updates
- 🔄 Advanced calendar features
- 🔄 Performance optimizations

This documentation should be updated as new features are implemented and the module evolves.