# 📚 Módulo de Alunos - Documentação Técnica Completa

## 🏗️ **Arquitetura Geral**

### **Componentes Principais**
```
/public/js/modules/students.js     # Módulo isolado principal
/public/views/students.html        # Lista de alunos (full-screen)
/public/views/student-editor.html  # Editor de aluno (full-screen)
/public/css/modules/students.css   # Estilos isolados
/src/routes/students.ts           # API routes (TypeScript)
```

### **Princípios de Design**
- **Modular**: Isolado com CSS prefixado `.students-isolated`
- **Full-Screen**: Sem modals - uma ação = uma tela completa
- **API-First**: Todos os dados vêm de endpoints REST
- **Responsivo**: Design mobile-first

## 🗄️ **Schema de Dados**

### **Modelo Student (Prisma)**
```typescript
model Student {
  id              String    @id @default(cuid())
  matricula       String    @unique
  userId          String    @unique
  organizationId  String
  category        StudentCategory
  birthDate       DateTime?
  phone           String?
  emergencyContact String?
  address         String?
  medicalInfo     String?
  notes           String?
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Relacionamentos
  user            User      @relation(fields: [userId], references: [id])
  organization    Organization @relation(fields: [organizationId], references: [id])
  attendances     Attendance[]
  enrollments     Enrollment[]
  progress        Progress[]
  payments        Payment[]
  financialResponsible FinancialResponsible[]
}

enum StudentCategory {
  CHILD
  TEEN
  ADULT
  SENIOR
}
```

## 🔗 **API Reference**

### **Endpoints Principais**

#### **GET /api/students**
```typescript
// Query Parameters
interface StudentsQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: StudentCategory;
  isActive?: boolean;
  organizationId?: string;
}

// Response
interface StudentsResponse {
  success: boolean;
  data: {
    students: Student[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}
```

#### **POST /api/students**
```typescript
// Request Body
interface CreateStudentRequest {
  firstName: string;
  lastName: string;
  email: string;
  category: StudentCategory;
  birthDate?: string;
  phone?: string;
  emergencyContact?: string;
  address?: string;
  medicalInfo?: string;
  notes?: string;
}

// Response
interface CreateStudentResponse {
  success: boolean;
  data: {
    student: Student;
    matricula: string;
  };
  message: string;
}
```

#### **PUT /api/students/:id**
```typescript
// Request Body (partial update)
interface UpdateStudentRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  category?: StudentCategory;
  birthDate?: string;
  phone?: string;
  emergencyContact?: string;
  address?: string;
  medicalInfo?: string;
  notes?: string;
  isActive?: boolean;
}
```

#### **DELETE /api/students/:id**
```typescript
// Response
interface DeleteStudentResponse {
  success: boolean;
  message: string;
}
```

### **Endpoints de Integração Financeira**

#### **GET /api/students/:id/subscription**
```typescript
// Response
interface StudentSubscriptionResponse {
  success: boolean;
  data: {
    subscription: {
      id: string;
      planId: string;
      status: 'ACTIVE' | 'CANCELLED' | 'SUSPENDED';
      startDate: string;
      endDate: string;
      amount: number;
    };
    payments: Payment[];
  };
}
```

#### **POST /api/students/:id/enroll**
```typescript
// Request Body
interface EnrollStudentRequest {
  planId: string;
  startDate: string;
  paymentMethod: 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX' | 'BOLETO';
}
```

## 🎨 **Arquitetura Frontend**

### **Estrutura do Módulo**
```javascript
// /public/js/modules/students.js
const StudentsModule = {
  // Estado
  allStudents: [],
  filteredStudents: [],
  currentPage: 1,
  totalPages: 1,
  
  // Inicialização
  init() {
    this.loadStudents();
    this.bindEvents();
    this.initializeFilters();
  },
  
  // Carregamento de dados
  async loadStudents() {
    // Implementação com retry e cache
  },
  
  // Renderização
  renderStudentsTable() {
    // Renderização otimizada com virtual scrolling
  },
  
  // Navegação
  openStudentEditor(studentId) {
    // Navegação full-screen
  }
};
```

### **Padrões de Estado**
- **allStudents**: Array com todos os alunos carregados
- **filteredStudents**: Array filtrado baseado em pesquisa/filtros
- **currentPage/totalPages**: Paginação
- **loadingState**: Estados de carregamento (idle, loading, error)

### **Gerenciamento de Eventos**
```javascript
// Event Binding
bindEvents() {
  // Pesquisa com debounce
  document.getElementById('studentsSearch')?.addEventListener('input', 
    debounce(this.handleSearch.bind(this), 300)
  );
  
  // Double-click para edição
  document.addEventListener('dblclick', (e) => {
    if (e.target.closest('.students-table-row')) {
      this.openStudentEditor(e.target.dataset.studentId);
    }
  });
  
  // Filtros
  document.querySelectorAll('.students-filter').forEach(filter => {
    filter.addEventListener('change', this.applyFilters.bind(this));
  });
}
```

## 🎯 **Navegação e UI**

### **Padrão Full-Screen**
```javascript
// Abertura de páginas
openStudentEditor(studentId = null) {
  const url = studentId 
    ? `/views/student-editor.html?id=${studentId}`
    : '/views/student-editor.html';
  window.location.href = url;
}

// Voltar para lista
goBackToStudents() {
  window.location.href = '/views/students.html';
}
```

### **Interações de Tabela**
```javascript
// Double-click para editar
document.addEventListener('dblclick', (e) => {
  if (e.target.closest('.students-table-row')) {
    const studentId = e.target.closest('.students-table-row').dataset.studentId;
    this.openStudentEditor(studentId);
  }
});
```

## 🔧 **Integração com Outros Módulos**

### **ModuleLoader Integration**
```javascript
// Carregamento automático
if (typeof ModuleLoader !== 'undefined') {
  ModuleLoader.registerModule('students', StudentsModule);
} else {
  // Fallback para inicialização direta
  document.addEventListener('DOMContentLoaded', () => {
    StudentsModule.init();
  });
}
```

### **Dependências de Módulos**
- **API Client**: Comunicação com servidor
- **Toast System**: Notificações de usuário
- **Navigation**: Roteamento between pages
- **Financial Module**: Integração de assinaturas

## 🔒 **Segurança e Validação**

### **Validação Frontend**
```javascript
validateStudentData(studentData) {
  const errors = [];
  
  if (!studentData.firstName?.trim()) {
    errors.push('Nome é obrigatório');
  }
  
  if (!studentData.email?.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    errors.push('Email inválido');
  }
  
  if (!studentData.category) {
    errors.push('Categoria é obrigatória');
  }
  
  return errors;
}
```

### **Sanitização de Dados**
```javascript
sanitizeStudentData(studentData) {
  return {
    ...studentData,
    firstName: studentData.firstName?.trim(),
    lastName: studentData.lastName?.trim(),
    email: studentData.email?.toLowerCase().trim(),
    phone: studentData.phone?.replace(/\D/g, ''),
    // Remover scripts e HTML
    notes: studentData.notes?.replace(/<script.*?<\/script>/gi, '')
  };
}
```

## ⚡ **Performance e Otimizações**

### **Carregamento Lazy**
```javascript
// Carregamento sob demanda
async loadStudentsPage(page = 1) {
  if (this.loadingState === 'loading') return;
  
  this.loadingState = 'loading';
  
  try {
    const response = await fetch(`/api/students?page=${page}&limit=20`);
    const data = await response.json();
    
    if (page === 1) {
      this.allStudents = data.data.students;
    } else {
      this.allStudents.push(...data.data.students);
    }
    
    this.renderStudentsTable();
    this.loadingState = 'idle';
  } catch (error) {
    this.loadingState = 'error';
    this.showError('Erro ao carregar alunos');
  }
}
```

### **Pesquisa Debounced**
```javascript
// Evitar requests excessivos
const debouncedSearch = debounce(async (searchTerm) => {
  if (searchTerm.length < 2) {
    this.filteredStudents = this.allStudents;
    this.renderStudentsTable();
    return;
  }
  
  try {
    const response = await fetch(`/api/students?search=${encodeURIComponent(searchTerm)}`);
    const data = await response.json();
    this.filteredStudents = data.data.students;
    this.renderStudentsTable();
  } catch (error) {
    this.showError('Erro na pesquisa');
  }
}, 300);
```

### **Virtual Scrolling (para grandes datasets)**
```javascript
renderVirtualizedTable() {
  const container = document.getElementById('studentsTableContainer');
  const rowHeight = 50;
  const visibleRows = Math.ceil(container.clientHeight / rowHeight);
  const startIndex = Math.floor(container.scrollTop / rowHeight);
  const endIndex = Math.min(startIndex + visibleRows, this.filteredStudents.length);
  
  // Renderizar apenas linhas visíveis
  const tbody = document.querySelector('.students-table tbody');
  tbody.innerHTML = '';
  
  for (let i = startIndex; i < endIndex; i++) {
    const student = this.filteredStudents[i];
    const row = this.createStudentRow(student);
    tbody.appendChild(row);
  }
}
```

## 🧪 **Estratégias de Teste**

### **Testes Unitários**
```javascript
// Exemplo de teste para validação
describe('StudentsModule', () => {
  test('validateStudentData should return errors for invalid data', () => {
    const invalidData = {
      firstName: '',
      email: 'invalid-email',
      category: null
    };
    
    const errors = StudentsModule.validateStudentData(invalidData);
    
    expect(errors).toContain('Nome é obrigatório');
    expect(errors).toContain('Email inválido');
    expect(errors).toContain('Categoria é obrigatória');
  });
});
```

### **Testes de Integração**
```javascript
// Teste de API
describe('Students API', () => {
  test('GET /api/students should return paginated students', async () => {
    const response = await fetch('/api/students?page=1&limit=10');
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(data.data.students).toHaveLength(10);
    expect(data.data.pagination.page).toBe(1);
  });
});
```

## 📊 **Monitoring e Debugging**

### **Logging**
```javascript
// Sistema de logs
const logger = {
  info: (message, data) => {
    console.log(`[StudentsModule] ${message}`, data);
  },
  
  error: (message, error) => {
    console.error(`[StudentsModule] ${message}`, error);
    // Enviar para sistema de monitoramento
  }
};
```

### **Métricas de Performance**
```javascript
// Medição de performance
const performanceMonitor = {
  startTimer: (operation) => {
    performance.mark(`${operation}-start`);
  },
  
  endTimer: (operation) => {
    performance.mark(`${operation}-end`);
    performance.measure(operation, `${operation}-start`, `${operation}-end`);
    
    const measure = performance.getEntriesByName(operation)[0];
    console.log(`${operation}: ${measure.duration}ms`);
  }
};
```

## 🚀 **Deployment e Configuração**

### **Variáveis de Ambiente**
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/academia"

# API Configuration
API_BASE_URL="https://api.academia.com"
API_TIMEOUT=30000

# Features
ENABLE_VIRTUAL_SCROLLING=true
ENABLE_OFFLINE_MODE=false
```

### **Configuração de Build**
```javascript
// webpack.config.js
module.exports = {
  entry: {
    students: './public/js/modules/students.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js'
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
        }
      }
    }
  }
};
```

## 🛡️ **Diretrizes de Modificação Segura**

### **Pontos Seguros para Modificação**
1. **Adição de campos**: Adicionar novos campos ao formulário
2. **Novos filtros**: Implementar filtros adicionais
3. **Validações**: Adicionar regras de validação
4. **Otimizações**: Melhorar performance sem quebrar API

### **Áreas Críticas (Cuidado)**
1. **Schema de database**: Mudanças podem afetar outros módulos
2. **API endpoints**: Mudanças podem quebrar integrações
3. **Integração financeira**: Crítico para funcionamento do negócio
4. **Sistema de matrícula**: Usado em toda a aplicação

### **Processo de Modificação**
1. **Backup**: Usar `version-manager.js` antes de modificar
2. **Testes**: Executar testes antes e após modificação
3. **Validação**: Verificar integração com outros módulos
4. **Rollback**: Ter plano de rollback preparado

Esta documentação serve como guia completo para desenvolvimento, manutenção e extensão do módulo de alunos, garantindo consistência e segurança nas modificações.