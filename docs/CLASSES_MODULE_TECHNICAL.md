# 🥋 Módulo de Classes - Documentação Técnica Completa

## 🏗️ **Arquitetura Geral**

### **Componentes Principais**
```
/public/js/modules/classes.js         # Módulo principal (completo)
/public/views/classes.html            # Lista de classes (full-screen)
/public/views/class-editor.html       # Editor de classes (full-screen)
/public/css/modules/classes.css       # Estilos isolados
/public/css/classes.css               # Estilos gerais
/src/routes/class.ts                  # API routes (implementadas)
```

### **Status de Implementação**
- ✅ **Frontend**: Completamente implementado com UI isolada
- ✅ **Database Schema**: Modelos Prisma abrangentes
- ✅ **Arquitetura**: Segue diretrizes CLAUDE.md perfeitamente
- ❌ **Backend APIs**: Endpoints precisam ser implementados no servidor

### **Conceito Inovador: Sistema Multi-Faixa**
Sistema revolucionário onde uma classe acomoda alunos de múltiplas faixas simultaneamente, com um instrutor gerenciando progressões paralelas.

## 🗄️ **Schema de Dados**

### **Modelo Class (Principal)**
```typescript
model Class {
  id              String         @id @default(cuid())
  name            String
  description     String?
  instructorId    String
  unitId          String
  matId           String?
  courseId        String
  startTime       DateTime
  endTime         DateTime
  capacity        Int            @default(20)
  status          ClassStatus    @default(SCHEDULED)
  level           ClassLevel     @default(BEGINNER)
  type            ClassType      @default(REGULAR)
  notes           String?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  
  // Relacionamentos
  instructor      Instructor     @relation(fields: [instructorId], references: [id])
  unit            Unit           @relation(fields: [unitId], references: [id])
  mat             Mat?           @relation(fields: [matId], references: [id])
  course          Course         @relation(fields: [courseId], references: [id])
  attendances     Attendance[]
  enrollments     Enrollment[]
  schedule        ClassSchedule?
}

enum ClassStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum ClassLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
  MIXED
}

enum ClassType {
  REGULAR
  WORKSHOP
  SEMINAR
  PRIVATE
  ASSESSMENT
}
```

### **Modelo ClassSchedule (Agendamento)**
```typescript
model ClassSchedule {
  id              String            @id @default(cuid())
  classId         String            @unique
  recurrenceRule  String            // RRULE RFC 5545
  startDate       DateTime
  endDate         DateTime?
  daysOfWeek      Int[]             // 0=Dom, 1=Seg, etc.
  frequency       ScheduleFrequency
  interval        Int               @default(1)
  isActive        Boolean           @default(true)
  
  // Relacionamentos
  class           Class             @relation(fields: [classId], references: [id])
  exceptions      ScheduleException[]
}

enum ScheduleFrequency {
  DAILY
  WEEKLY
  MONTHLY
  YEARLY
}
```

### **Modelo de Recursos**
```typescript
model Unit {
  id          String   @id @default(cuid())
  name        String
  address     String
  capacity    Int
  isActive    Boolean  @default(true)
  classes     Class[]
  mats        Mat[]
}

model Mat {
  id        String   @id @default(cuid())
  name      String
  unitId    String
  isActive  Boolean  @default(true)
  unit      Unit     @relation(fields: [unitId], references: [id])
  classes   Class[]
}

model Instructor {
  id          String   @id @default(cuid())
  userId      String   @unique
  belt        String
  specialties String[]
  isActive    Boolean  @default(true)
  user        User     @relation(fields: [userId], references: [id])
  classes     Class[]
}
```

## 🔗 **API Reference**

### **Endpoints Necessários (A Implementar)**

#### **GET /api/classes**
```typescript
// Query Parameters
interface ClassesQuery {
  page?: number;
  limit?: number;
  date?: string;           // YYYY-MM-DD
  instructorId?: string;
  unitId?: string;
  status?: ClassStatus;
  level?: ClassLevel;
  type?: ClassType;
}

// Response
interface ClassesResponse {
  success: boolean;
  data: {
    classes: Class[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}
```

#### **POST /api/classes**
```typescript
// Request Body
interface CreateClassRequest {
  name: string;
  description?: string;
  instructorId: string;
  unitId: string;
  matId?: string;
  courseId: string;
  startTime: string;       // ISO 8601
  endTime: string;         // ISO 8601
  capacity: number;
  level: ClassLevel;
  type: ClassType;
  notes?: string;
  
  // Agendamento recorrente
  schedule?: {
    recurrenceRule: string;
    startDate: string;
    endDate?: string;
    daysOfWeek: number[];
    frequency: ScheduleFrequency;
    interval: number;
  };
}

// Response
interface CreateClassResponse {
  success: boolean;
  data: {
    class: Class;
    schedule?: ClassSchedule;
  };
  message: string;
}
```

#### **PUT /api/classes/:id**
```typescript
// Request Body (partial update)
interface UpdateClassRequest {
  name?: string;
  description?: string;
  instructorId?: string;
  unitId?: string;
  matId?: string;
  startTime?: string;
  endTime?: string;
  capacity?: number;
  status?: ClassStatus;
  level?: ClassLevel;
  type?: ClassType;
  notes?: string;
}
```

#### **DELETE /api/classes/:id**
```typescript
// Response
interface DeleteClassResponse {
  success: boolean;
  message: string;
  affectedEnrollments?: number;
}
```

#### **GET /api/classes/:id/enrollments**
```typescript
// Response
interface ClassEnrollmentsResponse {
  success: boolean;
  data: {
    enrollments: {
      id: string;
      studentId: string;
      student: {
        matricula: string;
        user: {
          firstName: string;
          lastName: string;
        };
      };
      enrolledAt: string;
      status: 'ENROLLED' | 'CANCELLED';
    }[];
    capacity: number;
    enrolled: number;
    available: number;
  };
}
```

#### **POST /api/classes/:id/enroll**
```typescript
// Request Body
interface EnrollStudentRequest {
  studentId: string;
  notes?: string;
}

// Response
interface EnrollStudentResponse {
  success: boolean;
  data: {
    enrollment: Enrollment;
  };
  message: string;
}
```

## 🎨 **Arquitetura Frontend**

### **Estrutura do Módulo**
```javascript
// /public/js/modules/classes.js
const ClassesModule = {
  // Estado
  allClasses: [],
  filteredClasses: [],
  allInstructors: [],
  allUnits: [],
  allCourses: [],
  currentView: 'table', // 'table', 'calendar', 'schedule'
  
  // Inicialização
  init() {
    this.loadClasses();
    this.loadInstructors();
    this.loadUnits();
    this.loadCourses();
    this.bindEvents();
    this.initializeFilters();
    this.initializeCalendar();
  },
  
  // Carregamento de dados
  async loadClasses() {
    // Implementação com retry e cache
  },
  
  // Renderização
  renderClassesTable() {
    // Renderização otimizada
  },
  
  renderCalendarView() {
    // Vista de calendário
  },
  
  // Navegação
  openClassEditor(classId) {
    // Navegação full-screen
  }
};
```

### **Sistema de Visualizações**
```javascript
// Alternância entre visualizações
switchView(viewType) {
  this.currentView = viewType;
  
  switch (viewType) {
    case 'table':
      this.renderClassesTable();
      break;
    case 'calendar':
      this.renderCalendarView();
      break;
    case 'schedule':
      this.renderScheduleView();
      break;
  }
  
  this.updateViewButtons();
}
```

### **Gestão de Conflitos**
```javascript
// Detecção de conflitos de agendamento
checkScheduleConflicts(classData) {
  const conflicts = [];
  
  // Verificar conflitos de instrutor
  const instructorConflicts = this.allClasses.filter(cls => 
    cls.instructorId === classData.instructorId &&
    this.timeOverlaps(cls.startTime, cls.endTime, classData.startTime, classData.endTime)
  );
  
  // Verificar conflitos de mat
  if (classData.matId) {
    const matConflicts = this.allClasses.filter(cls => 
      cls.matId === classData.matId &&
      this.timeOverlaps(cls.startTime, cls.endTime, classData.startTime, classData.endTime)
    );
  }
  
  return conflicts;
}
```

## 🔧 **Integração com Outros Módulos**

### **Integração com Students Module**
```javascript
// Inscrição de aluno em classe
async enrollStudentInClass(studentId, classId) {
  try {
    const response = await fetch(`/api/classes/${classId}/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId })
    });
    
    if (response.ok) {
      this.showSuccess('Aluno inscrito com sucesso!');
      this.refreshClassData();
    }
  } catch (error) {
    this.showError('Erro ao inscrever aluno');
  }
}
```

### **Integração com Attendance Module**
```javascript
// Iniciar check-in para classe
async startClassCheckin(classId) {
  try {
    const response = await fetch(`/api/classes/${classId}/start-checkin`, {
      method: 'POST'
    });
    
    if (response.ok) {
      this.showSuccess('Check-in iniciado!');
      this.updateClassStatus(classId, 'IN_PROGRESS');
      this.openCheckInInterface(classId);
    }
  } catch (error) {
    this.showError('Erro ao iniciar check-in');
  }
}
```

## 🗓️ **Sistema de Calendário**

### **Inicialização do Calendário**
```javascript
// Configuração do calendário
initializeCalendar() {
  this.calendar = new Calendar({
    container: document.getElementById('classesCalendar'),
    view: 'week',
    events: this.formatClassesForCalendar(),
    onEventClick: this.handleCalendarEventClick.bind(this),
    onTimeSlotClick: this.handleTimeSlotClick.bind(this),
    onEventDrop: this.handleEventDrop.bind(this)
  });
}

// Formatação de classes para eventos do calendário
formatClassesForCalendar() {
  return this.allClasses.map(cls => ({
    id: cls.id,
    title: cls.name,
    start: cls.startTime,
    end: cls.endTime,
    instructor: cls.instructor?.name,
    capacity: cls.capacity,
    enrolled: cls.enrollments?.length || 0,
    status: cls.status,
    color: this.getStatusColor(cls.status)
  }));
}
```

### **Agendamento Recorrente**
```javascript
// Criação de classes recorrentes
async createRecurringClass(classData, scheduleData) {
  try {
    const response = await fetch('/api/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...classData,
        schedule: {
          recurrenceRule: this.generateRRule(scheduleData),
          startDate: scheduleData.startDate,
          endDate: scheduleData.endDate,
          daysOfWeek: scheduleData.daysOfWeek,
          frequency: scheduleData.frequency,
          interval: scheduleData.interval
        }
      })
    });
    
    if (response.ok) {
      this.showSuccess('Classes recorrentes criadas!');
      this.loadClasses();
    }
  } catch (error) {
    this.showError('Erro ao criar classes recorrentes');
  }
}
```

## 🔒 **Validações e Regras de Negócio**

### **Validação de Capacidade**
```javascript
// Verificação de capacidade
validateClassCapacity(classId, newEnrollments = 0) {
  const cls = this.allClasses.find(c => c.id === classId);
  if (!cls) return false;
  
  const currentEnrollments = cls.enrollments?.length || 0;
  const totalAfterEnrollment = currentEnrollments + newEnrollments;
  
  return totalAfterEnrollment <= cls.capacity;
}
```

### **Validação de Horário**
```javascript
// Validação de conflitos de horário
validateClassTime(classData) {
  const errors = [];
  
  // Verificar se horário de início é anterior ao fim
  if (new Date(classData.startTime) >= new Date(classData.endTime)) {
    errors.push('Horário de início deve ser anterior ao fim');
  }
  
  // Verificar duração mínima
  const duration = new Date(classData.endTime) - new Date(classData.startTime);
  if (duration < 30 * 60 * 1000) { // 30 minutos
    errors.push('Duração mínima da classe é 30 minutos');
  }
  
  // Verificar horário comercial
  const startHour = new Date(classData.startTime).getHours();
  if (startHour < 6 || startHour > 22) {
    errors.push('Classes devem ser entre 6h e 22h');
  }
  
  return errors;
}
```

### **Validação de Instrutor**
```javascript
// Verificação de disponibilidade do instrutor
async checkInstructorAvailability(instructorId, startTime, endTime) {
  try {
    const response = await fetch(`/api/instructors/${instructorId}/availability`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startTime, endTime })
    });
    
    const result = await response.json();
    return result.available;
  } catch (error) {
    console.error('Erro ao verificar disponibilidade:', error);
    return false;
  }
}
```

## ⚡ **Performance e Otimizações**

### **Carregamento Inteligente**
```javascript
// Carregamento baseado em data
async loadClassesForDateRange(startDate, endDate) {
  const cacheKey = `classes-${startDate}-${endDate}`;
  let classes = this.getFromCache(cacheKey);
  
  if (!classes) {
    const response = await fetch(`/api/classes?start=${startDate}&end=${endDate}`);
    classes = await response.json();
    this.setCache(cacheKey, classes, 5 * 60 * 1000); // 5 minutos
  }
  
  return classes;
}
```

### **Otimização de Calendário**
```javascript
// Virtual scrolling para calendário
optimizeCalendarRendering() {
  const visibleEvents = this.calendar.getVisibleEvents();
  const bufferSize = 10;
  
  // Renderizar apenas eventos visíveis + buffer
  const eventsToRender = visibleEvents.slice(-bufferSize, visibleEvents.length + bufferSize);
  
  this.calendar.renderEvents(eventsToRender);
}
```

## 🧪 **Estratégias de Teste**

### **Testes de Validação**
```javascript
// Teste de capacidade
describe('Class Capacity Validation', () => {
  test('should prevent over-enrollment', () => {
    const classData = {
      id: 'class-123',
      capacity: 10,
      enrollments: new Array(10).fill({})
    };
    
    const result = ClassesModule.validateClassCapacity('class-123', 1);
    expect(result).toBe(false);
  });
});
```

### **Testes de Conflito**
```javascript
// Teste de conflitos de agendamento
describe('Schedule Conflict Detection', () => {
  test('should detect instructor conflicts', () => {
    const existingClass = {
      instructorId: 'instructor-1',
      startTime: '2025-01-15T10:00:00Z',
      endTime: '2025-01-15T11:00:00Z'
    };
    
    const newClass = {
      instructorId: 'instructor-1',
      startTime: '2025-01-15T10:30:00Z',
      endTime: '2025-01-15T11:30:00Z'
    };
    
    ClassesModule.allClasses = [existingClass];
    const conflicts = ClassesModule.checkScheduleConflicts(newClass);
    
    expect(conflicts).toHaveLength(1);
  });
});
```

## 📊 **Monitoramento e Métricas**

### **Métricas de Utilização**
```javascript
// Tracking de ocupação
const ClassesMetrics = {
  trackClassOccupancy(classId, capacity, enrolled) {
    const occupancyRate = (enrolled / capacity) * 100;
    
    analytics.track('class_occupancy', {
      classId,
      capacity,
      enrolled,
      occupancyRate,
      timestamp: Date.now()
    });
  },
  
  trackInstructorUtilization(instructorId, hoursPerWeek) {
    analytics.track('instructor_utilization', {
      instructorId,
      hoursPerWeek,
      timestamp: Date.now()
    });
  }
};
```

### **Alertas de Sistema**
```javascript
// Sistema de alertas
const ClassesAlerts = {
  checkLowOccupancy() {
    const lowOccupancyClasses = this.allClasses.filter(cls => {
      const occupancy = (cls.enrollments?.length || 0) / cls.capacity;
      return occupancy < 0.3; // Menos de 30%
    });
    
    if (lowOccupancyClasses.length > 0) {
      this.sendAlert('low_occupancy', {
        classes: lowOccupancyClasses.map(c => c.id),
        count: lowOccupancyClasses.length
      });
    }
  }
};
```

## 🚀 **Implementação Prioritária**

### **Fase 1: APIs Básicas**
```javascript
// Endpoints críticos a implementar
const REQUIRED_ENDPOINTS = [
  'GET /api/classes',
  'POST /api/classes',
  'PUT /api/classes/:id',
  'DELETE /api/classes/:id',
  'GET /api/classes/:id/enrollments',
  'POST /api/classes/:id/enroll'
];
```

### **Fase 2: Funcionalidades Avançadas**
```javascript
// Recursos adicionais
const ADVANCED_FEATURES = [
  'Agendamento recorrente',
  'Detecção de conflitos',
  'Integração com calendário',
  'Notificações automáticas',
  'Relatórios de ocupação'
];
```

## 🛡️ **Diretrizes de Modificação Segura**

### **Modificações Permitidas**
1. **UI/UX**: Melhorias de interface
2. **Validações**: Novas regras de negócio
3. **Filtros**: Novos critérios de busca
4. **Visualizações**: Novos tipos de exibição
5. **Métricas**: Tracking e analytics

### **Modificações Restritas**
1. **Capacidade**: Lógica de ocupação
2. **Agendamento**: Algoritmos de conflito
3. **Integração**: Pontos de integração críticos
4. **Estado**: Gestão de estado do módulo

### **Implementação Necessária**
1. **Backend APIs**: Implementar endpoints no servidor
2. **Integração Real**: Conectar com outros módulos
3. **Testes**: Criar suite de testes abrangente
4. **Monitoramento**: Implementar métricas de uso

## ⚠️ **Sugestões de Melhoria de Contexto**

### **Problema Principal**
- **Issue**: Frontend completo mas APIs backend não implementadas
- **Impacto**: Módulo não funcional apesar de código pronto
- **Solução**: Implementar endpoints no `server-complete.js`
- **Prioridade**: Alta - Funcionalidade core

### **Estrutura Sugerida**
```javascript
// Implementação no servidor
app.get('/api/classes', async (req, res) => {
  // Implementar lógica de listagem
});

app.post('/api/classes', async (req, res) => {
  // Implementar criação de classe
});

// ... outros endpoints
```

Esta documentação fornece o roadmap completo para finalizar o módulo de classes, que está arquiteturalmente sólido mas precisa de implementação backend para funcionar completamente.