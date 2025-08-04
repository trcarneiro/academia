# 📊 Módulo de Attendance - Documentação Técnica Completa

## 🏗️ **Arquitetura Geral**

### **Componentes Principais**
```
/public/js/attendance.js              # Funcionalidade básica
/public/js/attendance-inline.js       # Integração com dashboard
/public/js/checkpoint.js              # Sistema avançado de check-in
/public/checkpoint.html               # Interface standalone de check-in
/public/css/checkpoint.css            # Estilos do checkpoint
/public/css/modules/attendance.css    # Estilos do módulo
/src/routes/attendance.ts             # API routes (TypeScript)
```

### **Arquitetura em Três Camadas**
```
📱 Presentation Layer
├── checkpoint.html          # Interface kiosk independente
├── attendance widgets       # Widgets integrados ao dashboard
└── inline forms            # Formulários inline para instrutores

⚙️ Business Layer
├── checkpoint.js           # Lógica de check-in avançado
├── attendance.js           # Operações básicas
└── attendance-inline.js    # Integração com outros módulos

🗄️ Data Layer
├── attendance.ts           # Rotas API TypeScript
├── Prisma models          # Modelos de dados
└── Cache layer            # Cache para performance
```

## 🗄️ **Schema de Dados**

### **Modelo Attendance (Principal)**
```typescript
model Attendance {
  id              String           @id @default(cuid())
  studentId       String
  classId         String?
  organizationId  String
  checkInTime     DateTime         @default(now())
  checkOutTime    DateTime?
  status          AttendanceStatus @default(PRESENT)
  method          CheckInMethod    @default(MANUAL)
  location        String?
  notes           String?
  instructorId    String?
  ipAddress       String?
  userAgent       String?
  confidence      Float?           // Para reconhecimento visual
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  
  // Relacionamentos
  student         Student          @relation(fields: [studentId], references: [id])
  class           Class?           @relation(fields: [classId], references: [id])
  organization    Organization     @relation(fields: [organizationId], references: [id])
  instructor      Instructor?      @relation(fields: [instructorId], references: [id])
}

enum AttendanceStatus {
  PRESENT
  LATE
  ABSENT
  EXCUSED
}

enum CheckInMethod {
  MANUAL
  QR_CODE
  VISUAL_RECOGNITION
  GEOLOCATION
  BIOMETRIC
}
```

### **Modelo AttendancePattern (Analytics)**
```typescript
model AttendancePattern {
  id              String    @id @default(cuid())
  studentId       String
  weeklyAverage   Float
  monthlyAverage  Float
  preferredTimes  String[]  // Horários preferenciais
  attendance      Float     // Porcentagem de presença
  punctuality     Float     // Porcentagem de pontualidade
  lastAnalysis    DateTime  @default(now())
  
  // Relacionamentos
  student         Student   @relation(fields: [studentId], references: [id])
}
```

## 🔗 **API Reference**

### **Endpoints Principais**

#### **POST /api/attendance/checkin**
```typescript
// Request Body
interface CheckInRequest {
  classId?: string;
  studentId?: string;
  matricula?: string;          // Alternative to studentId
  method: CheckInMethod;
  location?: string;
  notes?: string;
  confidence?: number;         // Para reconhecimento visual
  biometricData?: {
    faceVector?: number[];
    confidence: number;
  };
}

// Response
interface CheckInResponse {
  success: boolean;
  data: {
    attendance: {
      id: string;
      studentId: string;
      student: {
        matricula: string;
        user: {
          firstName: string;
          lastName: string;
        };
      };
      checkInTime: string;
      status: AttendanceStatus;
      method: CheckInMethod;
      confidence?: number;
    };
  };
  message: string;
}
```

#### **GET /api/attendance**
```typescript
// Query Parameters
interface AttendanceQuery {
  date?: string;              // YYYY-MM-DD
  startDate?: string;
  endDate?: string;
  studentId?: string;
  classId?: string;
  status?: AttendanceStatus;
  method?: CheckInMethod;
  page?: number;
  limit?: number;
}

// Response
interface AttendanceResponse {
  success: boolean;
  data: {
    attendances: Attendance[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    summary: {
      totalCheckins: number;
      byStatus: Record<AttendanceStatus, number>;
      byMethod: Record<CheckInMethod, number>;
    };
  };
}
```

#### **PUT /api/attendance/:id**
```typescript
// Request Body
interface UpdateAttendanceRequest {
  status?: AttendanceStatus;
  checkOutTime?: string;
  notes?: string;
  instructorId?: string;
}

// Response
interface UpdateAttendanceResponse {
  success: boolean;
  data: {
    attendance: Attendance;
  };
  message: string;
}
```

#### **GET /api/attendance/stats**
```typescript
// Query Parameters
interface StatsQuery {
  period?: 'day' | 'week' | 'month' | 'year';
  startDate?: string;
  endDate?: string;
  studentId?: string;
  classId?: string;
}

// Response
interface StatsResponse {
  success: boolean;
  data: {
    totalAttendances: number;
    attendanceRate: number;
    averageCheckInTime: string;
    punctualityRate: number;
    mostActiveHours: Array<{
      hour: number;
      count: number;
    }>;
    trendData: Array<{
      date: string;
      checkins: number;
      rate: number;
    }>;
  };
}
```

## 📸 **Sistema de Reconhecimento Visual**

### **Inicialização da Câmera**
```javascript
// /public/js/checkpoint.js
const CameraManager = {
  video: null,
  stream: null,
  canvas: null,
  isActive: false,
  
  async initCamera() {
    try {
      this.video = document.getElementById('cameraVideo');
      this.canvas = document.getElementById('captureCanvas');
      
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      };
      
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.video.srcObject = this.stream;
      
      this.isActive = true;
      this.updateCameraStatus('🟢 Câmera ativa');
      
      // Iniciar detecção facial
      this.startFaceDetection();
      
    } catch (error) {
      console.error('Erro ao inicializar câmera:', error);
      this.updateCameraStatus('🔴 Erro na câmera');
    }
  },
  
  async captureFrame() {
    if (!this.isActive) return null;
    
    const context = this.canvas.getContext('2d');
    context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
    
    return this.canvas.toDataURL('image/jpeg', 0.8);
  }
};
```

### **Detecção e Reconhecimento Facial**
```javascript
// Sistema de reconhecimento facial
const FaceRecognition = {
  model: null,
  isLoaded: false,
  
  async loadModel() {
    try {
      // Carregar modelo de reconhecimento facial
      this.model = await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
      await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
      await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
      
      this.isLoaded = true;
      console.log('Modelo de reconhecimento facial carregado');
    } catch (error) {
      console.error('Erro ao carregar modelo:', error);
    }
  },
  
  async detectFace(imageData) {
    if (!this.isLoaded) return null;
    
    try {
      const img = new Image();
      img.src = imageData;
      
      const detections = await faceapi
        .detectAllFaces(img)
        .withFaceLandmarks()
        .withFaceDescriptors();
      
      return detections;
    } catch (error) {
      console.error('Erro na detecção facial:', error);
      return null;
    }
  },
  
  async recognizeStudent(faceDescriptor) {
    try {
      const response = await fetch('/api/attendance/recognize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          faceDescriptor: Array.from(faceDescriptor),
          threshold: 0.6
        })
      });
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Erro no reconhecimento:', error);
      return null;
    }
  }
};
```

### **Fluxo de Reconhecimento**
```javascript
// Processo completo de reconhecimento
const VisualCheckIn = {
  async processFrame() {
    // Capturar frame da câmera
    const imageData = await CameraManager.captureFrame();
    if (!imageData) return;
    
    // Detectar face
    const detections = await FaceRecognition.detectFace(imageData);
    if (!detections || detections.length === 0) {
      this.updateStatus('🔍 Procurando rosto...');
      return;
    }
    
    // Reconhecer aluno
    const recognition = await FaceRecognition.recognizeStudent(detections[0].descriptor);
    if (!recognition || !recognition.success) {
      this.updateStatus('❓ Aluno não reconhecido');
      return;
    }
    
    // Exibir informações do aluno
    this.showStudentInfo(recognition.data);
  },
  
  showStudentInfo(studentData) {
    const panel = document.getElementById('identificationPanel');
    panel.style.display = 'block';
    
    // Preencher dados do aluno
    document.getElementById('identifiedName').textContent = 
      `${studentData.user.firstName} ${studentData.user.lastName}`;
    document.getElementById('identifiedMatricula').textContent = 
      studentData.matricula;
    document.getElementById('confidenceValue').textContent = 
      `${(studentData.confidence * 100).toFixed(1)}%`;
    
    // Configurar botões
    document.getElementById('confirmCheckinBtn').onclick = () => {
      this.confirmCheckIn(studentData);
    };
  }
};
```

## 🖥️ **Sistema Checkpoint**

### **Interface Standalone**
```javascript
// /public/js/checkpoint.js
const CheckpointSystem = {
  currentStudents: [],
  metrics: {
    totalStudents: 0,
    activeStudents: 0,
    checkinsToday: 0
  },
  
  async init() {
    await this.loadMetrics();
    await this.initializeCamera();
    this.bindEvents();
    this.startAutoRefresh();
  },
  
  async loadMetrics() {
    try {
      const response = await fetch('/api/attendance/metrics');
      const data = await response.json();
      
      if (data.success) {
        this.metrics = data.data;
        this.updateMetricsDisplay();
      }
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
    }
  },
  
  updateMetricsDisplay() {
    document.getElementById('total-students-checkin').textContent = 
      this.metrics.totalStudents;
    document.getElementById('active-students-checkin').textContent = 
      this.metrics.activeStudents;
    document.getElementById('checkins-today').textContent = 
      this.metrics.checkinsToday;
  }
};
```

### **Busca Inteligente**
```javascript
// Sistema de busca avançada
const SmartSearch = {
  searchTimeout: null,
  
  handleSearch(query) {
    // Debounce para evitar requests excessivos
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.performSearch(query);
    }, 300);
  },
  
  async performSearch(query) {
    if (query.length < 2) {
      this.clearResults();
      return;
    }
    
    try {
      const response = await fetch(`/api/students/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (data.success) {
        this.displayResults(data.data);
      }
    } catch (error) {
      console.error('Erro na busca:', error);
    }
  },
  
  displayResults(students) {
    const tbody = document.getElementById('checkinTableBody');
    tbody.innerHTML = '';
    
    if (students.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan=\"4\" class=\"empty-message\">
            Nenhum aluno encontrado
          </td>
        </tr>
      `;
      return;
    }
    
    students.forEach(student => {
      const row = this.createStudentRow(student);
      tbody.appendChild(row);
    });
    
    // Atualizar contador
    document.getElementById('checkinResultsCount').textContent = students.length;
  },
  
  createStudentRow(student) {
    const row = document.createElement('tr');
    row.className = 'student-row';
    
    row.innerHTML = `
      <td>${student.matricula}</td>
      <td>${student.user.firstName} ${student.user.lastName}</td>
      <td>${student.user.cpf || '-'}</td>
      <td>
        <button class=\"btn btn-success\" onclick=\"CheckpointSystem.performCheckIn('${student.id}')\">
          ✅ Check-in
        </button>
      </td>
    `;
    
    return row;
  }
};
```

## 🔧 **Integração com Outros Módulos**

### **Integração com Dashboard**
```javascript
// /public/js/attendance-inline.js
const AttendanceWidget = {
  async loadTodayAttendance() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/attendance?date=${today}`);
      const data = await response.json();
      
      if (data.success) {
        this.renderAttendanceWidget(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar attendance:', error);
    }
  },
  
  renderAttendanceWidget(attendanceData) {
    const widget = document.getElementById('attendanceWidget');
    if (!widget) return;
    
    widget.innerHTML = `
      <div class=\"attendance-summary\">
        <h3>📊 Presenças Hoje</h3>
        <div class=\"attendance-stats\">
          <div class=\"stat-item\">
            <span class=\"stat-value\">${attendanceData.summary.totalCheckins}</span>
            <span class=\"stat-label\">Total</span>
          </div>
          <div class=\"stat-item\">
            <span class=\"stat-value\">${attendanceData.summary.byStatus.PRESENT || 0}</span>
            <span class=\"stat-label\">Presentes</span>
          </div>
          <div class=\"stat-item\">
            <span class=\"stat-value\">${attendanceData.summary.byStatus.LATE || 0}</span>
            <span class=\"stat-label\">Atrasados</span>
          </div>
        </div>
      </div>
    `;
  }
};
```

### **Integração com Classes**
```javascript
// Check-in baseado em classe
const ClassAttendance = {
  async startClassCheckIn(classId) {
    try {
      const response = await fetch(`/api/classes/${classId}/start-attendance`, {
        method: 'POST'
      });
      
      if (response.ok) {
        this.openClassCheckIn(classId);
      }
    } catch (error) {
      console.error('Erro ao iniciar attendance da classe:', error);
    }
  },
  
  openClassCheckIn(classId) {
    // Abrir interface de check-in específica para classe
    window.location.href = `/checkpoint.html?classId=${classId}`;
  }
};
```

## ⚡ **Recursos Real-time**

### **Auto-refresh de Métricas**
```javascript
// Atualização automática
const RealTimeUpdates = {
  intervalId: null,
  
  startAutoRefresh() {
    this.intervalId = setInterval(() => {
      this.refreshMetrics();
    }, 30000); // 30 segundos
  },
  
  async refreshMetrics() {
    try {
      const response = await fetch('/api/attendance/metrics');
      const data = await response.json();
      
      if (data.success) {
        this.updateMetricsAnimated(data.data);
      }
    } catch (error) {
      console.error('Erro ao atualizar métricas:', error);
    }
  },
  
  updateMetricsAnimated(newMetrics) {
    const elements = [
      { id: 'total-students-checkin', value: newMetrics.totalStudents },
      { id: 'active-students-checkin', value: newMetrics.activeStudents },
      { id: 'checkins-today', value: newMetrics.checkinsToday }
    ];
    
    elements.forEach(({ id, value }) => {
      const element = document.getElementById(id);
      if (element && element.textContent !== value.toString()) {
        element.classList.add('metric-updated');
        element.textContent = value;
        
        setTimeout(() => {
          element.classList.remove('metric-updated');
        }, 1000);
      }
    });
  }
};
```

### **WebSocket Integration**
```javascript
// Conexão WebSocket para updates em tempo real
const WebSocketManager = {
  socket: null,
  
  connect() {
    this.socket = new WebSocket('ws://localhost:3000/attendance');
    
    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleMessage(data);
    };
    
    this.socket.onclose = () => {
      // Tentar reconectar após 5 segundos
      setTimeout(() => this.connect(), 5000);
    };
  },
  
  handleMessage(data) {
    switch (data.type) {
      case 'NEW_CHECKIN':
        this.handleNewCheckIn(data.payload);
        break;
      case 'METRICS_UPDATE':
        this.handleMetricsUpdate(data.payload);
        break;
    }
  },
  
  handleNewCheckIn(checkinData) {
    // Atualizar UI com novo check-in
    this.showCheckInNotification(checkinData);
    this.updateMetrics();
  }
};
```

## 🔒 **Segurança e Privacidade**

### **Proteção de Dados Biométricos**
```javascript
// Gestão segura de dados biométricos
const BiometricSecurity = {
  async processBiometricData(faceData) {
    // Criptografar dados biométricos
    const encrypted = await this.encryptBiometricData(faceData);
    
    // Enviar apenas hash para servidor
    const hash = await this.generateBiometricHash(encrypted);
    
    return {
      hash,
      confidence: faceData.confidence,
      timestamp: Date.now()
    };
  },
  
  async encryptBiometricData(data) {
    // Implementar criptografia AES-256
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
    
    const encoded = new TextEncoder().encode(JSON.stringify(data));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: new Uint8Array(12) },
      key,
      encoded
    );
    
    return encrypted;
  },
  
  // Limpar dados biométricos após uso
  clearBiometricData() {
    // Limpar canvas
    const canvas = document.getElementById('captureCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Limpar variáveis em memória
    if (this.lastFaceData) {
      this.lastFaceData = null;
    }
  }
};
```

### **Auditoria e Logging**
```javascript
// Sistema de auditoria
const AuditLogger = {
  async logCheckIn(attendanceData) {
    try {
      await fetch('/api/audit/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CHECKIN',
          studentId: attendanceData.studentId,
          method: attendanceData.method,
          timestamp: new Date().toISOString(),
          ipAddress: await this.getClientIP(),
          userAgent: navigator.userAgent
        })
      });
    } catch (error) {
      console.error('Erro ao registrar auditoria:', error);
    }
  },
  
  async getClientIP() {
    try {
      const response = await fetch('/api/client-ip');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'unknown';
    }
  }
};
```

## 📊 **Performance e Otimização**

### **Cache Multi-nível**
```javascript
// Sistema de cache otimizado
const AttendanceCache = {
  // Cache em memória
  memoryCache: new Map(),
  
  // Cache localStorage
  localStorageCache: {
    set(key, data, ttl = 5 * 60 * 1000) {
      const item = {
        data,
        timestamp: Date.now(),
        ttl
      };
      localStorage.setItem(`attendance_${key}`, JSON.stringify(item));
    },
    
    get(key) {
      const item = localStorage.getItem(`attendance_${key}`);
      if (!item) return null;
      
      const parsed = JSON.parse(item);
      if (Date.now() - parsed.timestamp > parsed.ttl) {
        localStorage.removeItem(`attendance_${key}`);
        return null;
      }
      
      return parsed.data;
    }
  },
  
  // Cache de API com invalidação
  async getCachedData(key, fetchFunction, ttl = 60000) {
    // Verificar cache em memória
    let data = this.memoryCache.get(key);
    if (data && Date.now() - data.timestamp < ttl) {
      return data.value;
    }
    
    // Verificar localStorage
    data = this.localStorageCache.get(key);
    if (data) {
      this.memoryCache.set(key, { value: data, timestamp: Date.now() });
      return data;
    }
    
    // Buscar dados frescos
    const freshData = await fetchFunction();
    
    // Salvar nos dois caches
    this.memoryCache.set(key, { value: freshData, timestamp: Date.now() });
    this.localStorageCache.set(key, freshData, ttl);
    
    return freshData;
  }
};
```

### **Otimização de Reconhecimento Facial**
```javascript
// Worker para processamento facial
const FaceProcessingWorker = {
  worker: null,
  
  init() {
    this.worker = new Worker('/js/workers/face-processing.js');
    this.worker.onmessage = this.handleWorkerMessage.bind(this);
  },
  
  async processFrame(imageData) {
    return new Promise((resolve) => {
      const id = Date.now().toString();
      
      this.worker.postMessage({
        id,
        type: 'PROCESS_FRAME',
        imageData
      });
      
      const handler = (event) => {
        if (event.data.id === id) {
          this.worker.removeEventListener('message', handler);
          resolve(event.data.result);
        }
      };
      
      this.worker.addEventListener('message', handler);
    });
  }
};
```

## 🧪 **Testes e Validação**

### **Testes de Reconhecimento**
```javascript
// Testes de precisão do reconhecimento
describe('Face Recognition System', () => {
  test('should recognize known student with high confidence', async () => {
    const mockFaceData = {
      descriptor: new Float32Array([...]),
      confidence: 0.95
    };
    
    const result = await FaceRecognition.recognizeStudent(mockFaceData.descriptor);
    
    expect(result.success).toBe(true);
    expect(result.confidence).toBeGreaterThan(0.8);
    expect(result.student).toBeDefined();
  });
  
  test('should reject unknown faces', async () => {
    const unknownFaceData = {
      descriptor: new Float32Array([...]), // Dados diferentes
      confidence: 0.3
    };
    
    const result = await FaceRecognition.recognizeStudent(unknownFaceData.descriptor);
    
    expect(result.success).toBe(false);
    expect(result.confidence).toBeLessThan(0.6);
  });
});
```

### **Testes de Performance**
```javascript
// Testes de carga
describe('Attendance Performance', () => {
  test('should handle multiple simultaneous check-ins', async () => {
    const promises = Array(100).fill().map((_, i) => 
      CheckpointSystem.performCheckIn(`student-${i}`)
    );
    
    const results = await Promise.all(promises);
    const successCount = results.filter(r => r.success).length;
    
    expect(successCount).toBeGreaterThan(90); // 90% success rate
  });
  
  test('should maintain sub-second response times', async () => {
    const start = Date.now();
    await CheckpointSystem.loadMetrics();
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(1000); // Menos de 1 segundo
  });
});
```

## 🚀 **Deployment e Configuração**

### **Variáveis de Ambiente**
```env
# Attendance Configuration
ATTENDANCE_CACHE_TTL=300000
VISUAL_RECOGNITION_ENABLED=true
VISUAL_RECOGNITION_THRESHOLD=0.6
BIOMETRIC_DATA_RETENTION=30d

# Camera Settings
CAMERA_RESOLUTION_WIDTH=1280
CAMERA_RESOLUTION_HEIGHT=720
CAMERA_FPS=30

# Performance
ATTENDANCE_BATCH_SIZE=50
REAL_TIME_UPDATES_INTERVAL=30000
```

### **Configuração de Reconhecimento**
```javascript
// Configuração do sistema de reconhecimento
const recognitionConfig = {
  confidence: {
    minimum: 0.6,
    good: 0.8,
    excellent: 0.9
  },
  
  camera: {
    width: 1280,
    height: 720,
    fps: 30,
    facingMode: 'user'
  },
  
  performance: {
    maxFrameRate: 10,
    processingInterval: 100,
    cacheSize: 1000
  }
};
```

## 🛡️ **Diretrizes de Modificação Segura**

### **Modificações Permitidas**
1. **UI/UX**: Melhorias de interface
2. **Métricas**: Novas visualizações
3. **Filtros**: Critérios de busca
4. **Notificações**: Alertas e feedback
5. **Relatórios**: Análises adicionais

### **Modificações Restritas**
1. **Reconhecimento Facial**: Algoritmos de IA
2. **Dados Biométricos**: Processamento e armazenamento
3. **Segurança**: Criptografia e autenticação
4. **Performance**: Otimizações core

### **Modificações Críticas** (Requer Expertise)
1. **Privacidade**: Conformidade GDPR
2. **Auditoria**: Logs de segurança
3. **Integração**: Pontos de integração
4. **API**: Endpoints de attendance

Esta documentação fornece uma base sólida para entender, manter e estender o módulo de Attendance, garantindo que todas as modificações sejam feitas de forma segura e eficiente.