# Comprehensive API and Integration Documentation
**Krav Maga Academy Management System**  
Version: 2.0.0  
Last Updated: 2025-07-16  

---

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [API Routes and Endpoints](#api-routes-and-endpoints)
4. [External Integrations](#external-integrations)
5. [Internal API Architecture](#internal-api-architecture)
6. [Inter-module Communications](#inter-module-communications)
7. [Database Integration](#database-integration)
8. [Real-time Features](#real-time-features)
9. [API Security](#api-security)
10. [Error Handling](#error-handling)
11. [Testing Strategies](#testing-strategies)
12. [Deployment Considerations](#deployment-considerations)

---

## Overview

The Krav Maga Academy Management System is a comprehensive, multi-tenant platform built with modern technologies to manage martial arts academies. The system features AI-powered analytics, payment gateway integrations, real-time attendance tracking, and advanced student progression monitoring.

### Technology Stack
- **Backend**: TypeScript, Fastify, Prisma ORM
- **Database**: PostgreSQL
- **Frontend**: Vanilla JavaScript (Modular Architecture)
- **AI Services**: Anthropic Claude, OpenAI, Google Gemini, OpenRouter
- **Payment Gateway**: Asaas (Brazilian market)
- **Authentication**: JWT with Fastify JWT
- **Documentation**: Swagger/OpenAPI
- **Monitoring**: Custom logging with Pino
- **Caching**: Redis (configurable)
- **File Storage**: AWS S3 (configurable)

---

## Architecture

### System Architecture Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Server    │    │   Database      │
│  (Dashboard)    │◄──►│   (Fastify)     │◄──►│  (PostgreSQL)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐              │
         │              │  External APIs  │              │
         │              │  - Asaas        │              │
         │              │  - AI Services  │              │
         │              │  - SendGrid     │              │
         │              │  - Twilio       │              │
         │              └─────────────────┘              │
         │                                                │
         ▼                                                ▼
┌─────────────────┐                              ┌─────────────────┐
│  Module System  │                              │   File Storage  │
│  - Students     │                              │   - AWS S3      │
│  - Classes      │                              │   - Videos      │
│  - Attendance   │                              │   - Documents   │
│  - Financial    │                              └─────────────────┘
│  - Analytics    │
└─────────────────┘
```

### Multi-Tenant Architecture
The system supports multiple organizations (academies) through a robust multi-tenant architecture:

- **Organization Isolation**: Each academy has its own data space
- **Shared Infrastructure**: Common services and AI capabilities
- **Configurable Features**: Per-organization settings and AI providers
- **Scalable Design**: Supports unlimited organizations

---

## API Routes and Endpoints

### Base URL Structure
```
Production: https://your-domain.com/api
Development: http://localhost:3000/api
```

### Authentication Endpoints
**Base Path**: `/api/auth`

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| POST | `/register` | Register new user | None |
| POST | `/login` | User login | None |
| GET | `/profile` | Get user profile | Required |
| PUT | `/password` | Update password | Required |
| POST | `/refresh` | Refresh JWT token | Required |

#### Request/Response Examples

**POST /api/auth/login**
```json
// Request
{
  "email": "user@academy.com",
  "password": "password123"
}

// Response
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@academy.com",
      "role": "STUDENT",
      "firstName": "John",
      "lastName": "Doe"
    },
    "token": "jwt_token_here"
  },
  "message": "Login successful",
  "timestamp": "2025-07-16T10:00:00Z"
}
```

### Student Management Endpoints
**Base Path**: `/api/students`

| Method | Endpoint | Description | Authentication | Authorization |
|--------|----------|-------------|----------------|---------------|
| GET | `/` | List all students | Required | All Roles |
| GET | `/:id` | Get student details | Required | All Roles |
| POST | `/` | Create new student | Required | Admin/Instructor |
| PUT | `/:id` | Update student | Required | Admin/Instructor |
| DELETE | `/:id` | Delete student | Required | Admin Only |
| GET | `/:id/progress` | Get student progress | Required | All Roles |
| PUT | `/:id/progress` | Update progress | Required | Instructor/Admin |

#### Query Parameters
- `limit`: Number of records (default: 50)
- `offset`: Pagination offset (default: 0)
- `category`: Filter by student category
- `isActive`: Filter by active status

### Attendance Endpoints
**Base Path**: `/api/attendance`

| Method | Endpoint | Description | Authentication | Special Features |
|--------|----------|-------------|----------------|------------------|
| POST | `/checkin` | Check into class | Required | QR Code Support |
| GET | `/history` | Attendance history | Required | Pagination |
| GET | `/stats` | Attendance statistics | Required | Analytics |
| PUT | `/:id` | Update attendance record | Required | Instructor Only |
| GET | `/patterns/:studentId` | Attendance patterns | Required | AI Analysis |

#### QR Code Check-in
```json
// POST /api/attendance/checkin
{
  "classId": "uuid",
  "method": "QR_CODE",
  "location": "Mat 1",
  "notes": "On time"
}
```

### Class Management Endpoints
**Base Path**: `/api/classes`

| Method | Endpoint | Description | Features |
|--------|----------|-------------|----------|
| GET | `/` | List all classes | Filtering, Pagination |
| GET | `/:id` | Get class details | Include attendance |
| POST | `/` | Create new class | QR Code generation |
| PUT | `/:id` | Update class | Status management |
| DELETE | `/:id` | Delete class | Cascade handling |

### Financial Endpoints
**Base Path**: `/api/financial`

| Method | Endpoint | Description | Integration |
|--------|----------|-------------|-------------|
| GET | `/plans` | List billing plans | None |
| POST | `/plans` | Create billing plan | None |
| GET | `/subscriptions` | List subscriptions | Asaas |
| POST | `/subscriptions` | Create subscription | Asaas |
| GET | `/payments` | List payments | Asaas |
| POST | `/webhook` | Payment webhook | Asaas |

### Analytics Endpoints
**Base Path**: `/api/analytics`

| Method | Endpoint | Description | AI Features |
|--------|----------|-------------|-------------|
| GET | `/dashboard` | Dashboard metrics | Real-time |
| GET | `/students/:id/risk` | Dropout risk analysis | AI Powered |
| GET | `/attendance/patterns` | Attendance patterns | AI Analysis |
| GET | `/recommendations/:studentId` | Student recommendations | Multi-AI |

### Diagnostic Endpoints
**Base Path**: `/diagnostic`

| Method | Endpoint | Description | Purpose |
|--------|----------|-------------|---------|
| GET | `/` | System health check | Monitoring |
| GET | `/status` | Detailed system status | Debug |
| GET | `/api/courses` | Course diagnostic | Testing |
| GET | `/api/financial-responsibles` | Financial diagnostic | Testing |

---

## External Integrations

### 1. Asaas Payment Gateway Integration

#### Configuration
```typescript
interface AsaasConfig {
  apiKey: string;
  baseUrl: string; // sandbox vs production
  isSandbox: boolean;
  webhookUrl: string;
  webhookToken: string;
}
```

#### Key Features
- **Customer Management**: Create and sync customers
- **Payment Processing**: Multiple payment methods (PIX, Credit Card, Boleto)
- **Subscription Management**: Recurring payments
- **Webhook Integration**: Real-time payment status updates
- **Multi-installment Support**: Credit card installments

#### API Methods
```typescript
class AsaasService {
  // Customer Management
  async createCustomer(customerData: AsaasCustomerData): Promise<AsaasCustomerResponse>
  async getCustomer(customerId: string): Promise<AsaasCustomerResponse>
  async updateCustomer(customerId: string, data: Partial<AsaasCustomerData>): Promise<AsaasCustomerResponse>
  async listCustomers(params?: FilterParams): Promise<CustomerList>

  // Payment Management
  async createPayment(paymentData: AsaasPaymentData): Promise<AsaasPaymentResponse>
  async getPayment(paymentId: string): Promise<AsaasPaymentResponse>
  async listPayments(params?: PaymentFilters): Promise<PaymentList>
  async cancelPayment(paymentId: string): Promise<AsaasPaymentResponse>

  // Subscription Management
  async createSubscription(subscriptionData: SubscriptionData): Promise<Subscription>
  async getSubscription(subscriptionId: string): Promise<Subscription>
  async listSubscriptions(params?: SubscriptionFilters): Promise<SubscriptionList>
}
```

#### Webhook Handling
```typescript
// POST /api/financial/webhook
{
  "event": "PAYMENT_RECEIVED",
  "payment": {
    "id": "pay_123",
    "status": "RECEIVED",
    "value": 100.00,
    "customer": "cus_123"
  }
}
```

### 2. AI Services Integration

#### Multi-AI Provider Support
The system supports multiple AI providers with fallback mechanisms:

1. **Anthropic Claude** (Primary)
2. **OpenAI GPT** (Secondary)
3. **Google Gemini** (Alternative)
4. **OpenRouter** (Cost-effective)

#### AI Service Configuration
```typescript
interface AIConfig {
  provider: AIProvider;
  anthropicApiKey: string;
  openaiApiKey: string;
  geminiApiKey: string;
  openRouterApiKey: string;
}
```

#### AI Analysis Types
```typescript
interface AIAnalysisRequest {
  type: 'dropout_risk' | 'progress_analysis' | 'recommendations' | 'technique_feedback' | 'video_analysis';
  studentId: string;
  data: any;
  context?: TenantContext;
}
```

#### AI Capabilities

**1. Dropout Risk Analysis**
- Analyzes student attendance patterns
- Predicts likelihood of student leaving
- Provides intervention recommendations
- Risk categories: LOW, MEDIUM, HIGH, CRITICAL

**2. Progress Analysis**
- Evaluates technical skill development
- Identifies strengths and improvement areas
- Estimates time to next belt level
- Suggests focused training areas

**3. Class Recommendations**
- Analyzes student preferences and patterns
- Recommends optimal class schedules
- Considers instructor compatibility
- Factors in class capacity and availability

**4. Technique Analysis**
- Evaluates technique execution
- Provides detailed feedback
- Tracks mastery progression
- Video analysis capabilities (with vision models)

#### Example AI Usage
```typescript
// Analyze dropout risk
const riskAnalysis = await MultiAIService.executeAnalysis({
  type: 'dropout_risk',
  studentId: 'student-uuid',
  data: {
    attendanceHistory: [...],
    lastCheckIn: '2025-07-01',
    paymentStatus: 'CURRENT',
    classPreferences: [...]
  }
});
```

### 3. Communication Services

#### Email Integration (SendGrid)
```typescript
interface EmailConfig {
  sendgridApiKey: string;
  fromEmail: string;
  templateIds: {
    welcome: string;
    paymentReminder: string;
    classReminder: string;
    achievement: string;
  };
}
```

#### SMS Integration (Twilio)
```typescript
interface SMSConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}
```

#### Notification Types
- Payment reminders
- Class reminders
- Achievement notifications
- Progress updates
- Attendance alerts

### 4. File Storage (AWS S3)
```typescript
interface StorageConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
}
```

#### Supported File Types
- Student profile photos
- Technique demonstration videos
- Progress evaluation videos
- Documents and certificates
- QR codes for classes

---

## Internal API Architecture

### Request/Response Patterns

#### Standardized Response Format
```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
  organizationId?: string;
}
```

#### Pagination Response
```typescript
interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

### Error Handling Strategy

#### Error Types and Codes
```typescript
enum ErrorTypes {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR'
}
```

#### Prisma Error Handling
- `P2002`: Unique constraint violation
- `P2025`: Record not found
- `P2003`: Foreign key constraint violation

#### Custom Error Handler
```typescript
export const errorHandler = (
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
): void => {
  // Log error with context
  logger.error({ error, request }, 'Request error');
  
  // Handle specific error types
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Handle Prisma errors
  }
  
  // Handle JWT errors
  if (error.code === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID') {
    // Handle auth errors
  }
  
  // Default error response
  return ResponseHelper.error(reply, message, statusCode);
}
```

### Data Validation and Sanitization

#### Zod Schema Validation
```typescript
// Example: Student creation schema
const createStudentSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().email(),
  phone: z.string().regex(/^\d{10,11}$/),
  birthDate: z.string().datetime(),
  category: z.nativeEnum(StudentCategory),
  emergencyContact: z.string().optional(),
  medicalConditions: z.string().optional()
});
```

#### Input Sanitization
- SQL injection prevention (Prisma ORM)
- XSS protection (input validation)
- File upload validation
- Size and type restrictions

### Rate Limiting and Security

#### Rate Limiting Configuration
```typescript
const rateLimitConfig = {
  max: 100,           // 100 requests
  timeWindow: 60000,  // per minute
  keyGenerator: (request) => {
    return request.ip + request.user?.id;
  }
}
```

#### Security Headers (Helmet)
- Content Security Policy
- HSTS
- X-Frame-Options
- X-Content-Type-Options
- Referrer Policy

### Caching Strategies

#### Redis Caching (Optional)
```typescript
interface CacheConfig {
  url: string;
  ttl: number;
  maxMemory: string;
}

// Cache frequently accessed data
const cacheKeys = {
  student: (id: string) => `student:${id}`,
  classes: (date: string) => `classes:${date}`,
  attendance: (studentId: string, date: string) => `attendance:${studentId}:${date}`
};
```

---

## Inter-module Communications

### Module System Architecture

#### Core Modules
1. **Students Module** (`/js/modules/students.js`)
2. **Plans Module** (`/js/modules/plans.js`)
3. **Classes Module** (`/js/modules/classes.js`)
4. **Attendance Module** (`/js/attendance.js`)

#### Module Loader Pattern
```javascript
class ModuleLoader {
  constructor() {
    this.modules = new Map();
    this.fallbacks = new Map();
  }

  async loadModule(moduleName, fallbackFunction) {
    try {
      const module = await import(`/js/modules/${moduleName}.js`);
      this.modules.set(moduleName, module);
      return module;
    } catch (error) {
      console.warn(`Failed to load ${moduleName} module:`, error);
      if (fallbackFunction) {
        this.fallbacks.set(moduleName, fallbackFunction);
        return { default: fallbackFunction };
      }
      throw error;
    }
  }

  async executeFunction(moduleName, functionName, ...args) {
    const module = this.modules.get(moduleName);
    if (module && module[functionName]) {
      return await module[functionName](...args);
    }

    const fallback = this.fallbacks.get(moduleName);
    if (fallback) {
      return await fallback(...args);
    }

    throw new Error(`Function ${functionName} not found in module ${moduleName}`);
  }
}
```

#### Event System
```javascript
class EventBus {
  constructor() {
    this.events = new Map();
  }

  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push(callback);
  }

  emit(event, data) {
    const callbacks = this.events.get(event) || [];
    callbacks.forEach(callback => callback(data));
  }
}

// Usage
const eventBus = new EventBus();

// Student module events
eventBus.on('student:created', (studentData) => {
  // Update UI
  // Send notification
  // Log analytics
});

eventBus.on('attendance:checked-in', (attendanceData) => {
  // Update student progress
  // Trigger gamification
  // Update dashboard
});
```

#### API Client Communication
```javascript
class APIClient {
  async request(endpoint, options = {}) {
    // Centralized API communication
    // Error handling
    // Loading states
    // Retry logic
  }

  // Module-specific methods
  async getStudents() { return this.get('/api/students'); }
  async createStudent(data) { return this.post('/api/students', data); }
  async recordAttendance(data) { return this.post('/api/attendance', data); }
}
```

### Data Sharing Patterns

#### LocalStorage Fallback
```javascript
class DataStore {
  constructor() {
    this.memory = new Map();
    this.persistentKeys = ['user', 'settings', 'lastSync'];
  }

  set(key, value, persistent = false) {
    this.memory.set(key, value);
    
    if (persistent || this.persistentKeys.includes(key)) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.warn('Failed to persist data:', error);
      }
    }
  }

  get(key) {
    if (this.memory.has(key)) {
      return this.memory.get(key);
    }

    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const value = JSON.parse(stored);
        this.memory.set(key, value);
        return value;
      }
    } catch (error) {
      console.warn('Failed to retrieve stored data:', error);
    }

    return null;
  }
}
```

### API Fallback Mechanisms

#### Graceful Degradation
```javascript
class APIService {
  async withFallback(primaryFn, fallbackFn, context = '') {
    try {
      return await primaryFn();
    } catch (error) {
      console.warn(`${context} primary method failed, using fallback:`, error);
      
      if (fallbackFn) {
        try {
          return await fallbackFn();
        } catch (fallbackError) {
          console.error(`${context} fallback also failed:`, fallbackError);
          throw fallbackError;
        }
      }
      
      throw error;
    }
  }

  async getStudents() {
    return this.withFallback(
      () => this.apiClient.getStudents(),
      () => this.getCachedStudents(),
      'getStudents'
    );
  }
}
```

---

## Database Integration

### Prisma ORM Configuration

#### Database Schema Overview
The system uses a comprehensive PostgreSQL schema with 25+ tables covering:

- **Organization Management**: Multi-tenant support
- **User Management**: Authentication and authorization
- **Academic Management**: Students, courses, classes
- **Attendance Tracking**: Check-ins, patterns, analytics
- **Financial Management**: Plans, subscriptions, payments
- **Gamification**: Achievements, challenges, progress
- **AI Analytics**: Risk analysis, recommendations

#### Key Models and Relationships

```typescript
// Core organization model
model Organization {
  id                    String                 @id @default(uuid())
  name                  String
  slug                  String                 @unique
  subscriptionPlan      SubscriptionPlan       @default(BASIC)
  maxStudents           Int                    @default(100)
  // ... other fields
  
  // Relationships
  students              Student[]
  courses               Course[]
  classes               Class[]
  attendances           Attendance[]
  payments              Payment[]
  // ... other relationships
}

// Student with comprehensive tracking
model Student {
  id                     String                @id @default(uuid())
  organizationId         String
  userId                 String                @unique
  category               StudentCategory       @default(ADULT)
  totalXP                Int                   @default(0)
  globalLevel            Int                   @default(1)
  currentStreak          Int                   @default(0)
  // ... other fields
  
  // Relationships
  user                   User                  @relation(...)
  organization           Organization          @relation(...)
  attendances            Attendance[]
  progressions           StudentProgression[]
  subscriptions          StudentSubscription[]
  // ... other relationships
}
```

#### Database Connection Management

```typescript
// Database utility with connection pooling
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['query', 'error', 'warn'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
```

### Migration Strategies

#### Schema Migrations
```bash
# Generate migration
npx prisma migrate dev --name add_ai_analysis_tables

# Apply migrations
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset --force
```

#### Data Seeding
```typescript
// prisma/seed.ts
async function main() {
  // Create default organization
  const organization = await prisma.organization.create({
    data: {
      name: 'Academia Krav Maga',
      slug: 'krav-maga-academy',
      subscriptionPlan: 'PREMIUM',
    },
  });

  // Create martial art
  const kravMaga = await prisma.martialArt.create({
    data: {
      organizationId: organization.id,
      name: 'Krav Maga',
      description: 'Israeli martial art',
      hasGrading: true,
      gradingSystem: 'BELT',
    },
  });

  // Create courses, techniques, etc.
}
```

### Query Optimization

#### Efficient Queries with Includes
```typescript
// Optimized student query with relationships
const student = await prisma.student.findUnique({
  where: { id: studentId },
  include: {
    user: {
      select: {
        firstName: true,
        lastName: true,
        email: true,
      },
    },
    attendances: {
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      include: {
        class: {
          select: {
            date: true,
            course: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    },
    progressions: {
      include: {
        martialArt: {
          select: {
            name: true,
          },
        },
      },
    },
    _count: {
      select: {
        attendances: true,
        achievements: true,
      },
    },
  },
});
```

#### Database Performance
- **Indexing**: Strategic indexes on frequently queried fields
- **Connection Pooling**: Prisma connection pool configuration
- **Query Optimization**: N+1 query prevention
- **Pagination**: Cursor-based pagination for large datasets

---

## Real-time Features

### WebSocket Implementation (Future Enhancement)

While the current system primarily uses HTTP APIs, real-time features are planned:

#### Real-time Attendance Updates
```typescript
// Future WebSocket implementation
interface WebSocketEvents {
  'attendance:checkin': AttendanceData;
  'class:update': ClassData;
  'achievement:unlocked': AchievementData;
  'payment:received': PaymentData;
}

class WebSocketService {
  constructor(server: FastifyInstance) {
    this.io = new SocketIO(server.server);
  }

  broadcastToOrganization(organizationId: string, event: string, data: any) {
    this.io.to(`org:${organizationId}`).emit(event, data);
  }

  notifyUser(userId: string, event: string, data: any) {
    this.io.to(`user:${userId}`).emit(event, data);
  }
}
```

#### Live Data Synchronization

```typescript
// Real-time dashboard updates
class DashboardSync {
  async broadcastAttendanceUpdate(attendance: Attendance) {
    const organizationId = attendance.organizationId;
    
    // Update live attendance count
    this.webSocket.broadcastToOrganization(organizationId, 'attendance:update', {
      classId: attendance.classId,
      count: await this.getClassAttendanceCount(attendance.classId),
    });

    // Update student streak
    this.webSocket.notifyUser(attendance.student.userId, 'streak:update', {
      currentStreak: attendance.student.currentStreak,
    });
  }
}
```

### Push Notifications (Planned)

```typescript
interface PushNotificationService {
  sendToUser(userId: string, notification: NotificationPayload): Promise<void>;
  sendToOrganization(orgId: string, notification: NotificationPayload): Promise<void>;
  scheduleReminder(userId: string, classId: string, reminderTime: Date): Promise<void>;
}
```

---

## API Security

### Authentication and Authorization

#### JWT Token Structure
```typescript
interface JWTPayload {
  sub: string;           // User ID
  email: string;         // User email
  role: UserRole;        // STUDENT, INSTRUCTOR, ADMIN
  organizationId: string; // Multi-tenant support
  iat: number;           // Issued at
  exp: number;           // Expires at
}
```

#### Role-Based Access Control
```typescript
export const authorizeRoles = (allowedRoles: UserRole[]) => {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.user) {
      return ResponseHelper.error(reply, 'Usuário não autenticado', 401);
    }

    if (!allowedRoles.includes(request.user.role)) {
      logger.warn(
        { userId: request.user.id, role: request.user.role, allowedRoles },
        'Insufficient permissions'
      );
      return ResponseHelper.error(reply, 'Permissões insuficientes', 403);
    }
  };
};

// Usage in routes
fastify.get('/admin-only', {
  preHandler: [authenticateToken, adminOnly],
  handler: AdminController.getData,
});
```

#### Multi-Tenant Security
```typescript
// Ensure data isolation between organizations
const tenantGuard = async (request: FastifyRequest, reply: FastifyReply) => {
  const { organizationId } = request.user;
  const requestedOrgId = request.params.organizationId || request.body?.organizationId;
  
  if (requestedOrgId && requestedOrgId !== organizationId) {
    return ResponseHelper.error(reply, 'Acesso negado à organização', 403);
  }
  
  // Add organization filter to queries
  request.organizationFilter = { organizationId };
};
```

### Data Protection Measures

#### Input Validation
```typescript
// Comprehensive validation with Zod
const studentSchema = z.object({
  firstName: z.string().min(2).max(50).regex(/^[a-zA-ZÀ-ÿ\s]+$/),
  lastName: z.string().min(2).max(50).regex(/^[a-zA-ZÀ-ÿ\s]+$/),
  email: z.string().email().toLowerCase(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/).optional(),
});
```

#### Data Sanitization
```typescript
const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
    .replace(/[<>]/g, ''); // Remove HTML tags
};
```

#### SQL Injection Prevention
- Prisma ORM with parameterized queries
- Input validation at API layer
- Type-safe database operations

#### Sensitive Data Handling
```typescript
// Password hashing
import bcrypt from 'bcryptjs';

const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

// PII data encryption (for sensitive fields)
const encryptSensitiveData = (data: string): string => {
  // Implementation depends on chosen encryption method
  return encrypt(data, process.env.ENCRYPTION_KEY);
};
```

### Rate Limiting and Abuse Prevention

#### Rate Limiting Configuration
```typescript
await server.register(rateLimit, {
  max: 100,              // 100 requests
  timeWindow: '1 minute', // per minute
  keyGenerator: (request) => {
    // Rate limit by IP + User ID for authenticated requests
    return request.ip + (request.user?.id || '');
  },
  errorResponseBuilder: (request, context) => {
    return {
      code: 429,
      error: 'Rate limit exceeded',
      message: `Too many requests, retry after ${context.ttl} seconds`,
    };
  },
});
```

#### API Abuse Detection
```typescript
class AbuseDetection {
  private suspiciousPatterns = new Map<string, number>();

  detectSuspiciousActivity(request: FastifyRequest): boolean {
    const key = request.ip + request.user?.id;
    const pattern = this.analyzeRequestPattern(request);
    
    if (this.isSuspicious(pattern)) {
      const count = this.suspiciousPatterns.get(key) || 0;
      this.suspiciousPatterns.set(key, count + 1);
      
      if (count > 5) {
        this.blockIP(request.ip);
        return true;
      }
    }
    
    return false;
  }
}
```

---

## Error Handling

### Error Classification

#### Error Types
```typescript
enum ErrorCategory {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
  EXTERNAL_API = 'EXTERNAL_API',
  DATABASE = 'DATABASE',
  INTERNAL = 'INTERNAL',
}

interface CustomError extends Error {
  category: ErrorCategory;
  statusCode: number;
  details?: any;
  recoverable: boolean;
}
```

#### Centralized Error Handler
```typescript
export const errorHandler = (
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
): void => {
  // Log error with full context
  logger.error({
    error: {
      message: error.message,
      stack: error.stack,
      code: error.code,
    },
    request: {
      method: request.method,
      url: request.url,
      headers: request.headers,
      user: request.user?.id,
    },
  }, 'Request error occurred');

  // Handle specific error types
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(error, reply);
  }

  if (error.code?.startsWith('FST_JWT_')) {
    return handleJWTError(error, reply);
  }

  if (error.statusCode === 429) {
    return ResponseHelper.error(reply, 'Too many requests', 429);
  }

  // Default error response
  const statusCode = error.statusCode || 500;
  const message = statusCode === 500 ? 'Internal server error' : error.message;
  
  return ResponseHelper.error(reply, message, statusCode);
};
```

### Error Recovery Strategies

#### Graceful Degradation
```typescript
class ServiceWithFallback {
  async getStudentProgress(studentId: string) {
    try {
      // Try AI-powered analysis
      return await this.aiService.analyzeProgress(studentId);
    } catch (aiError) {
      logger.warn({ studentId, error: aiError }, 'AI analysis failed, using basic calculation');
      
      try {
        // Fallback to basic calculation
        return await this.calculateBasicProgress(studentId);
      } catch (basicError) {
        logger.error({ studentId, error: basicError }, 'All progress calculation methods failed');
        
        // Return minimal safe response
        return {
          success: true,
          data: { message: 'Progress calculation temporarily unavailable' },
        };
      }
    }
  }
}
```

#### Circuit Breaker Pattern
```typescript
class CircuitBreaker {
  private failureCount = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private lastFailureTime = 0;

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
}
```

### User-Friendly Error Messages

#### Error Message Mapping
```typescript
const errorMessages = {
  'P2002': 'Este registro já existe no sistema',
  'P2025': 'Registro não encontrado',
  'P2003': 'Não é possível excluir este registro pois está sendo usado',
  'FST_JWT_NO_AUTHORIZATION_IN_HEADER': 'Token de acesso não fornecido',
  'FST_JWT_AUTHORIZATION_TOKEN_INVALID': 'Token de acesso inválido',
  'PAYMENT_GATEWAY_ERROR': 'Erro no processamento do pagamento',
  'AI_SERVICE_UNAVAILABLE': 'Análise inteligente temporariamente indisponível',
};
```

---

## Testing Strategies

### API Testing Infrastructure

#### Test Scripts Organization
The system includes comprehensive testing scripts in `/scripts/` directory:

- `test-api-endpoints.js` - Core API endpoint testing
- `test-production-apis.js` - Production environment testing
- `test-diagnostic-endpoints.js` - System health testing
- `test-connection.js` - Database connectivity testing
- `test-asaas-import.ts` - Payment gateway integration testing

#### Example Test Implementation
```javascript
// test-api-endpoints.js
class APITester {
  constructor(baseURL = '') {
    this.baseURL = baseURL;
    this.results = [];
  }

  async testEndpoint(name, method, endpoint, expectedStatus = 200, body = null) {
    try {
      console.log(`\n🔍 Testing ${name}: ${method} ${endpoint}`);
      
      const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
      };
      
      if (body) options.body = JSON.stringify(body);
      
      const response = await fetch(`${this.baseURL}${endpoint}`, options);
      const data = await response.json();
      
      const success = response.status === expectedStatus;
      
      this.results.push({
        name,
        method,
        endpoint,
        status: response.status,
        expectedStatus,
        success,
        responseTime: Date.now() - startTime,
        data
      });
      
      console.log(success ? '✅ PASS' : '❌ FAIL');
      return { success, data, status: response.status };
    } catch (error) {
      console.log('❌ ERROR:', error.message);
      this.results.push({
        name,
        method,
        endpoint,
        success: false,
        error: error.message
      });
      return { success: false, error };
    }
  }

  async runFullSuite() {
    console.log('🚀 Starting API Test Suite...\n');
    
    // Health check
    await this.testEndpoint('Health Check', 'GET', '/health');
    
    // Students API
    await this.testEndpoint('List Students', 'GET', '/api/students');
    await this.testEndpoint('Get Student by ID', 'GET', '/api/students/test-id');
    
    // Financial API
    await this.testEndpoint('List Billing Plans', 'GET', '/api/billing-plans');
    
    // Diagnostic endpoints
    await this.testEndpoint('System Diagnostic', 'GET', '/diagnostic');
    
    this.generateReport();
  }

  generateReport() {
    const total = this.results.length;
    const passed = this.results.filter(r => r.success).length;
    const failed = total - passed;
    
    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('========================');
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
  }
}
```

### Integration Testing

#### Database Testing
```typescript
// tests/integration/database.test.ts
describe('Database Integration', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Student Operations', () => {
    it('should create a student with valid data', async () => {
      const studentData = {
        organizationId: testOrgId,
        firstName: 'Test',
        lastName: 'Student',
        email: 'test@example.com',
        category: 'ADULT',
      };

      const student = await studentService.create(studentData);
      expect(student.id).toBeDefined();
      expect(student.email).toBe(studentData.email);
    });

    it('should enforce unique email constraint', async () => {
      const duplicateEmail = 'duplicate@example.com';
      
      await expect(async () => {
        await studentService.create({ ...validStudentData, email: duplicateEmail });
        await studentService.create({ ...validStudentData, email: duplicateEmail });
      }).rejects.toThrow('Email already exists');
    });
  });
});
```

#### External API Testing
```typescript
// tests/integration/asaas.test.ts
describe('Asaas Integration', () => {
  let asaasService: AsaasService;

  beforeAll(() => {
    asaasService = new AsaasService(
      process.env.ASAAS_TEST_API_KEY!,
      true // sandbox mode
    );
  });

  describe('Customer Management', () => {
    it('should create a customer in Asaas', async () => {
      const customerData = {
        name: 'Test Customer',
        cpfCnpj: '12345678901',
        email: 'test@example.com',
      };

      const customer = await asaasService.createCustomer(customerData);
      expect(customer.id).toBeDefined();
      expect(customer.cpfCnpj).toBe(customerData.cpfCnpj);
    });

    it('should handle API errors gracefully', async () => {
      const invalidData = {
        name: '', // Invalid: empty name
        cpfCnpj: 'invalid',
      };

      await expect(
        asaasService.createCustomer(invalidData)
      ).rejects.toThrow(/Asaas API Error/);
    });
  });
});
```

### Unit Testing

#### Service Layer Testing
```typescript
// tests/unit/studentService.test.ts
describe('StudentService', () => {
  let studentService: StudentService;
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    mockPrisma = {
      student: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    } as any;

    studentService = new StudentService(mockPrisma);
  });

  describe('createStudent', () => {
    it('should create a student with valid data', async () => {
      const studentData = { /* valid data */ };
      const expectedStudent = { id: 'uuid', ...studentData };

      mockPrisma.student.create.mockResolvedValue(expectedStudent);

      const result = await studentService.create(studentData);

      expect(mockPrisma.student.create).toHaveBeenCalledWith({
        data: expect.objectContaining(studentData),
      });
      expect(result).toEqual(expectedStudent);
    });

    it('should validate required fields', async () => {
      const invalidData = { /* missing required fields */ };

      await expect(
        studentService.create(invalidData)
      ).rejects.toThrow('Validation error');
    });
  });
});
```

### Performance Testing

#### Load Testing Setup
```javascript
// tests/performance/load-test.js
const autocannon = require('autocannon');

async function runLoadTest() {
  const result = await autocannon({
    url: 'http://localhost:3000',
    connections: 100,
    duration: 30,
    requests: [
      {
        method: 'GET',
        path: '/api/students',
        headers: {
          'Authorization': 'Bearer test-token',
        },
      },
      {
        method: 'POST',
        path: '/api/attendance/checkin',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          classId: 'test-class-id',
          method: 'MANUAL',
        }),
      },
    ],
  });

  console.log('Load Test Results:');
  console.log(`Requests per second: ${result.requests.average}`);
  console.log(`Latency (avg): ${result.latency.average}ms`);
  console.log(`Throughput: ${result.throughput.average} bytes/sec`);
}
```

---

## Deployment Considerations

### Environment Configuration

#### Production Environment Variables
```bash
# Server Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/krav_academy"
DIRECT_URL="postgresql://user:password@localhost:5432/krav_academy"

# Authentication
JWT_SECRET="super-secure-jwt-secret"
JWT_EXPIRES_IN="7d"

# AI Services
AI_PROVIDER="CLAUDE"
ANTHROPIC_API_KEY="sk-ant-..."
OPENAI_API_KEY="sk-..."
GEMINI_API_KEY="AI..."
OPENROUTER_API_KEY="sk-or-..."

# Payment Gateway
ASAAS_API_KEY="$aact_..."
ASAAS_BASE_URL="https://www.asaas.com/api/v3"
ASAAS_IS_SANDBOX="false"

# External Services
SENDGRID_API_KEY="SG..."
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."

# File Storage
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="us-east-1"
AWS_S3_BUCKET="krav-academy-files"

# Monitoring
LOG_LEVEL="info"
POSTHOG_API_KEY="..."
POSTHOG_HOST="https://app.posthog.com"

# Security
CORS_ORIGIN="https://yourdomain.com"
RATE_LIMIT_MAX="1000"
RATE_LIMIT_WINDOW="60000"
```

### Docker Configuration

#### Production Dockerfile
```dockerfile
# Multi-stage build for optimization
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production && npm cache clean --force
RUN npx prisma generate

FROM node:18-alpine AS runner

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY . .

RUN npm run build

USER nextjs

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["npm", "start"]
```

#### Docker Compose for Production
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/krav_academy
    depends_on:
      - db
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: krav_academy
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
```

### Monitoring and Observability

#### Health Check Endpoints
```typescript
// Health check with comprehensive system status
fastify.get('/health', async () => {
  const checks = await Promise.allSettled([
    // Database connectivity
    prisma.$queryRaw`SELECT 1`,
    
    // External API availability
    fetch(process.env.ASAAS_BASE_URL + '/customers?limit=1'),
    
    // Redis connectivity (if configured)
    redis?.ping(),
  ]);

  const dbStatus = checks[0].status === 'fulfilled' ? 'healthy' : 'unhealthy';
  const apiStatus = checks[1].status === 'fulfilled' ? 'healthy' : 'unhealthy';
  const redisStatus = checks[2]?.status === 'fulfilled' ? 'healthy' : 'not_configured';

  const overallStatus = dbStatus === 'healthy' && apiStatus === 'healthy' ? 'healthy' : 'degraded';

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    checks: {
      database: dbStatus,
      externalAPI: apiStatus,
      redis: redisStatus,
    },
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
  };
});
```

#### Application Monitoring
```typescript
// Metrics collection
class MetricsCollector {
  private metrics = new Map();

  recordAPICall(endpoint: string, method: string, statusCode: number, duration: number) {
    const key = `${method}_${endpoint}_${statusCode}`;
    const current = this.metrics.get(key) || { count: 0, totalDuration: 0 };
    
    this.metrics.set(key, {
      count: current.count + 1,
      totalDuration: current.totalDuration + duration,
      avgDuration: (current.totalDuration + duration) / (current.count + 1),
    });
  }

  getMetrics() {
    return Object.fromEntries(this.metrics);
  }
}
```

### Backup and Recovery

#### Database Backup Strategy
```bash
#!/bin/bash
# backup.sh - Automated database backup

BACKUP_DIR="/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/krav_academy_$TIMESTAMP.sql"

# Create backup
pg_dump $DATABASE_URL > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Upload to S3 (optional)
aws s3 cp $BACKUP_FILE.gz s3://krav-academy-backups/

# Clean old backups (keep last 30 days)
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

#### Disaster Recovery Plan
1. **Database Recovery**: Restore from latest backup
2. **File Storage Recovery**: S3 automatic replication
3. **Application Recovery**: Container orchestration restart
4. **External Service Fallbacks**: Circuit breaker patterns

### Scaling Considerations

#### Horizontal Scaling
- **Load Balancing**: Nginx reverse proxy
- **Database Clustering**: PostgreSQL read replicas
- **Stateless Design**: JWT tokens, no server sessions
- **Microservices Ready**: Modular architecture

#### Performance Optimization
- **Database Indexing**: Strategic query optimization
- **Caching**: Redis for frequently accessed data
- **CDN**: Static asset distribution
- **Connection Pooling**: Database connection management

---

## Conclusion

This comprehensive documentation covers the complete API and integration architecture of the Krav Maga Academy Management System. The system demonstrates:

### Key Strengths
1. **Modern Architecture**: TypeScript, Fastify, Prisma ORM
2. **Multi-Tenant Support**: Scalable organization management
3. **AI Integration**: Multiple AI providers with fallback mechanisms
4. **Payment Integration**: Comprehensive Asaas gateway integration
5. **Security**: JWT authentication, role-based access, data validation
6. **Testing**: Comprehensive test suites and monitoring
7. **Scalability**: Docker containerization and horizontal scaling ready

### Integration Ecosystem
- **Payment Processing**: Asaas for Brazilian market
- **AI Analytics**: Claude, OpenAI, Gemini for intelligent insights
- **Communication**: SendGrid (email) and Twilio (SMS)
- **File Storage**: AWS S3 integration
- **Monitoring**: Health checks and metrics collection

### Development Best Practices
- **Error Handling**: Comprehensive error management with user-friendly messages
- **API Design**: RESTful endpoints with OpenAPI documentation
- **Security**: Multiple layers of protection and validation
- **Testing**: Unit, integration, and performance testing strategies
- **Deployment**: Production-ready containerization and monitoring

This system represents a production-ready, enterprise-grade solution for martial arts academy management with modern development practices and comprehensive feature set.

---

**Note**: This documentation should be updated regularly as the system evolves. For the most current API specifications, refer to the Swagger documentation available at `/docs` when the server is running.