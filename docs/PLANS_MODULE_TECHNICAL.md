# 💳 Módulo de Planos - Documentação Técnica Completa

## 🏗️ **Arquitetura Geral**

### **Componentes Principais**
```
/public/js/modules/plans.js           # Módulo principal (777 linhas)
/public/js/modules/plans-manager.js   # Módulo PROTEGIDO (163 linhas)
/public/views/plans.html              # Lista de planos (full-screen)
/public/views/plan-editor.html        # Editor de planos (full-screen)
/public/css/modules/plans-styles.css  # Estilos isolados
/public/css/plans.css                 # Estilos gerais
```

### **Sistema de Dois Níveis**
1. **Planos Educacionais**: Conteúdo do curso, progressão, estrutura acadêmica
2. **Planos de Cobrança**: Pricing, ciclos de pagamento, gestão financeira

## 🔒 **PlansManager (PROTEGIDO) - Análise Crítica**

### **Por que é Protegido**
- **Lógica de Negócio Crítica**: Cálculos de receita e cobrança
- **Gestão de Assinaturas**: Controle de ciclos de pagamento
- **Integração com Gateway**: Processamento de pagamentos Asaas
- **Impacto Financeiro Direto**: Modificações afetam faturamento

### **Arquitetura Interna**
```javascript
const PlansManager = {
  // Estado privado protegido
  _state: {
    allPlans: [],
    selectedPlan: null,
    loadingState: 'idle'
  },
  
  // API com fallback
  _apiEndpoints: {
    primary: '/api/billing-plans',
    fallback: '/api/financial/plans'
  },
  
  // Métodos públicos seguros
  async loadPlans() {
    return this._loadWithFallback();
  },
  
  // Métodos privados protegidos
  _calculatePricing(plan) {
    // Lógica de cálculo protegida
  }
};
```

### **Funcionalidades Principais**
- **Carregamento Seguro**: Sistema de fallback para APIs
- **Validação de Dados**: Validação rigorosa de planos
- **Gestão de Estado**: Estado isolado e protegido
- **Integração Financeira**: Ponte com sistema de pagamentos

## 🗄️ **Schema de Dados**

### **Modelo BillingPlan**
```typescript
interface BillingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingCycle: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  category: 'BASIC' | 'PREMIUM' | 'VIP';
  features: string[];
  isActive: boolean;
  maxStudents?: number;
  trialDays?: number;
  setupFee?: number;
  createdAt: string;
  updatedAt: string;
  
  // Relacionamentos
  courses: Course[];
  subscriptions: Subscription[];
  organizationId: string;
}
```

### **Modelo EducationalPlan**
```typescript
interface EducationalPlan {
  id: string;
  name: string;
  description: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  duration: number; // em meses
  objectives: string[];
  prerequisites: string[];
  
  // Relacionamentos
  billingPlanId: string;
  courses: Course[];
  techniques: Technique[];
  evaluations: Evaluation[];
}
```

## 🔗 **API Reference**

### **Endpoints Principais**

#### **GET /api/billing-plans**
```typescript
// Query Parameters
interface PlansQuery {
  page?: number;
  limit?: number;
  category?: 'BASIC' | 'PREMIUM' | 'VIP';
  isActive?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

// Response
interface PlansResponse {
  success: boolean;
  data: {
    plans: BillingPlan[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}
```

#### **POST /api/billing-plans**
```typescript
// Request Body
interface CreatePlanRequest {
  name: string;
  description: string;
  price: number;
  billingCycle: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  category: 'BASIC' | 'PREMIUM' | 'VIP';
  features: string[];
  maxStudents?: number;
  trialDays?: number;
  setupFee?: number;
}

// Response
interface CreatePlanResponse {
  success: boolean;
  data: {
    plan: BillingPlan;
    id: string;
  };
  message: string;
}
```

#### **PUT /api/billing-plans/:id**
```typescript
// Request Body (partial update)
interface UpdatePlanRequest {
  name?: string;
  description?: string;
  price?: number;
  billingCycle?: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  category?: 'BASIC' | 'PREMIUM' | 'VIP';
  features?: string[];
  isActive?: boolean;
  maxStudents?: number;
  trialDays?: number;
  setupFee?: number;
}
```

#### **DELETE /api/billing-plans/:id**
```typescript
// Response
interface DeletePlanResponse {
  success: boolean;
  message: string;
  affectedSubscriptions?: number;
}
```

### **Sistema de Fallback**
```javascript
// Implementação do fallback
async _loadWithFallback() {
  try {
    // Tentar endpoint principal
    const response = await fetch('/api/billing-plans');
    if (response.ok) {
      return await response.json();
    }
    
    // Fallback para endpoint alternativo
    const fallbackResponse = await fetch('/api/financial/plans');
    if (fallbackResponse.ok) {
      return await fallbackResponse.json();
    }
    
    // Estado vazio como último recurso
    return { success: true, data: [] };
  } catch (error) {
    console.error('Erro ao carregar planos:', error);
    return { success: false, error: error.message };
  }
}
```

## 🎨 **Arquitetura Frontend**

### **Estrutura do Módulo Principal**
```javascript
// /public/js/modules/plans.js
const PlansModule = {
  // Estado público
  allPlans: [],
  filteredPlans: [],
  allCourses: [],
  currentPage: 1,
  
  // Inicialização
  init() {
    this.loadPlans();
    this.loadCourses();
    this.bindEvents();
    this.initializeFilters();
  },
  
  // Carregamento de dados
  async loadPlans() {
    // Usar PlansManager para carregamento seguro
    const result = await PlansManager.loadPlans();
    this.allPlans = result.data || [];
    this.filteredPlans = [...this.allPlans];
    this.renderPlansTable();
  },
  
  // Renderização
  renderPlansTable() {
    // Renderização otimizada
  },
  
  // Navegação
  openPlanEditor(planId) {
    // Navegação full-screen
  }
};
```

### **Editor Multi-Tab**
```javascript
// Sistema de abas do editor
const PLAN_TABS = {
  BASIC: 'basic',
  COURSES: 'courses',
  ADVANCED: 'advanced',
  PREVIEW: 'preview'
};

// Navegação entre abas
switchTab(targetTab) {
  // Salvar estado atual
  this.saveCurrentTabState();
  
  // Trocar aba
  this.currentTab = targetTab;
  this.renderCurrentTab();
  
  // Atualizar UI
  this.updateTabNavigation();
}
```

## 🔧 **Integração com Outros Módulos**

### **Integração com Students Module**
```javascript
// Seleção de plano pelo aluno
async enrollStudentInPlan(studentId, planId) {
  try {
    const response = await fetch('/api/students/enroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId,
        planId,
        startDate: new Date().toISOString()
      })
    });
    
    if (response.ok) {
      this.showSuccess('Aluno inscrito com sucesso!');
      this.refreshStudentData();
    }
  } catch (error) {
    this.showError('Erro ao inscrever aluno');
  }
}
```

### **Integração com Financial Module**
```javascript
// Cálculos financeiros
async calculatePlanRevenue(planId, period) {
  const result = await PlansManager.calculateRevenue(planId, period);
  return result;
}

// Processamento de pagamentos
async processPayment(planId, studentId, paymentData) {
  const result = await PlansManager.processPayment({
    planId,
    studentId,
    ...paymentData
  });
  return result;
}
```

## 🔒 **Segurança e Validação**

### **Validação de Planos**
```javascript
// Validação no PlansManager (protegida)
_validatePlanData(planData) {
  const errors = [];
  
  // Validações obrigatórias
  if (!planData.name?.trim()) {
    errors.push('Nome do plano é obrigatório');
  }
  
  if (!planData.price || planData.price <= 0) {
    errors.push('Preço deve ser maior que zero');
  }
  
  if (!planData.billingCycle) {
    errors.push('Ciclo de cobrança é obrigatório');
  }
  
  // Validações de negócio
  if (planData.price > 10000) {
    errors.push('Preço muito alto para validação automática');
  }
  
  if (planData.trialDays && planData.trialDays > 90) {
    errors.push('Período de teste não pode exceder 90 dias');
  }
  
  return errors;
}
```

### **Sanitização de Dados**
```javascript
// Sanitização segura
_sanitizePlanData(planData) {
  return {
    ...planData,
    name: planData.name?.trim().substring(0, 100),
    description: planData.description?.trim().substring(0, 500),
    price: Math.max(0, parseFloat(planData.price) || 0),
    features: planData.features?.map(f => f.trim()).filter(f => f.length > 0),
    // Remover scripts e HTML
    description: planData.description?.replace(/<script.*?<\/script>/gi, '')
  };
}
```

## ⚡ **Performance e Otimizações**

### **Caching Inteligente**
```javascript
// Cache de planos com TTL
const PlansCache = {
  _cache: new Map(),
  _ttl: 5 * 60 * 1000, // 5 minutos
  
  get(key) {
    const item = this._cache.get(key);
    if (item && Date.now() - item.timestamp < this._ttl) {
      return item.data;
    }
    return null;
  },
  
  set(key, data) {
    this._cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
};
```

### **Lazy Loading de Cursos**
```javascript
// Carregamento sob demanda
async loadCoursesForPlan(planId) {
  const cacheKey = `plan-courses-${planId}`;
  let courses = PlansCache.get(cacheKey);
  
  if (!courses) {
    const response = await fetch(`/api/billing-plans/${planId}/courses`);
    courses = await response.json();
    PlansCache.set(cacheKey, courses);
  }
  
  return courses;
}
```

## 🧪 **Estratégias de Teste**

### **Testes de Integração Financeira**
```javascript
// Teste de processamento de pagamento
describe('Plans Payment Integration', () => {
  test('should process subscription payment correctly', async () => {
    const planId = 'plan-123';
    const studentId = 'student-456';
    
    const paymentData = {
      amount: 99.90,
      method: 'CREDIT_CARD',
      card: {
        number: '4111111111111111',
        cvv: '123',
        expiry: '12/25'
      }
    };
    
    const result = await PlansManager.processPayment(planId, studentId, paymentData);
    
    expect(result.success).toBe(true);
    expect(result.transactionId).toBeDefined();
    expect(result.subscriptionId).toBeDefined();
  });
});
```

### **Testes de Validação**
```javascript
// Teste de validação de planos
describe('Plan Validation', () => {
  test('should validate plan data correctly', () => {
    const invalidPlan = {
      name: '',
      price: -10,
      billingCycle: null
    };
    
    const errors = PlansManager._validatePlanData(invalidPlan);
    
    expect(errors).toContain('Nome do plano é obrigatório');
    expect(errors).toContain('Preço deve ser maior que zero');
    expect(errors).toContain('Ciclo de cobrança é obrigatório');
  });
});
```

## 📊 **Monitoring e Métricas**

### **Métricas de Negócio**
```javascript
// Monitoramento de conversão
const PlansMetrics = {
  trackPlanView(planId) {
    analytics.track('plan_viewed', {
      planId,
      timestamp: Date.now(),
      userType: 'prospect'
    });
  },
  
  trackSubscription(planId, studentId, revenue) {
    analytics.track('subscription_created', {
      planId,
      studentId,
      revenue,
      timestamp: Date.now()
    });
  },
  
  trackChurn(planId, reason) {
    analytics.track('subscription_cancelled', {
      planId,
      reason,
      timestamp: Date.now()
    });
  }
};
```

### **Health Checks**
```javascript
// Monitoramento de saúde do sistema
const PlansHealthCheck = {
  async checkPlanAvailability() {
    try {
      const response = await fetch('/api/billing-plans/health');
      return response.ok;
    } catch (error) {
      return false;
    }
  },
  
  async checkPaymentGateway() {
    try {
      const response = await fetch('/api/payments/health');
      return response.ok;
    } catch (error) {
      return false;
    }
  }
};
```

## 🚀 **Deployment e Configuração**

### **Variáveis de Ambiente**
```env
# Planos e Cobrança
PLANS_CACHE_TTL=300000
PAYMENT_GATEWAY_URL="https://api.asaas.com"
PAYMENT_GATEWAY_TOKEN="your_token_here"

# Configurações de Negócio
MAX_PLAN_PRICE=10000
DEFAULT_TRIAL_DAYS=7
MIN_SUBSCRIPTION_DURATION=1
```

### **Configuração de Pagamentos**
```javascript
// Configuração do gateway Asaas
const paymentConfig = {
  asaas: {
    baseUrl: process.env.PAYMENT_GATEWAY_URL,
    token: process.env.PAYMENT_GATEWAY_TOKEN,
    timeout: 30000,
    retryAttempts: 3
  },
  
  webhooks: {
    paymentConfirmed: '/api/webhooks/payment-confirmed',
    paymentFailed: '/api/webhooks/payment-failed',
    subscriptionExpired: '/api/webhooks/subscription-expired'
  }
};
```

## 🛡️ **Diretrizes de Modificação Segura**

### **Modificações Permitidas**
1. **UI/UX**: Melhorias de interface e experiência
2. **Validações**: Adicionar novas regras de validação
3. **Categorias**: Adicionar novas categorias de planos
4. **Métricas**: Adicionar tracking e analytics
5. **Estilos**: Modificar CSS isolado

### **Modificações Restritas** (Requer Cuidado)
1. **Cálculos de Preço**: Impactam receita
2. **Integração de Pagamento**: Crítico para negócio
3. **Validações de Negócio**: Podem afetar vendas
4. **API Endpoints**: Podem quebrar integrações

### **Modificações Proibidas**
1. **PlansManager Internals**: Lógica protegida
2. **Estado Privado**: Variáveis com prefixo `_`
3. **Métodos de Pagamento**: Lógica financeira crítica
4. **Validações de Segurança**: Podem criar vulnerabilidades

### **Processo de Modificação**
1. **Análise de Impacto**: Verificar dependências
2. **Backup**: Usar `version-manager.js`
3. **Testes**: Executar testes de pagamento
4. **Validação**: Verificar com dados reais
5. **Rollback**: Preparar plano de rollback

## ⚠️ **Sugestões de Melhoria de Contexto**

### **Problema Identificado**
- **Terminologia Inconsistente**: `/api/billing-plans` vs `/api/financial/plans`
- **Impacto**: Confusão na manutenção, duplicação de lógica
- **Solução**: Padronizar para `/api/plans` com tipos diferenciados
- **Prioridade**: Média

### **Estrutura Proposta**
```
/api/plans/
├── billing/          # Planos de cobrança
├── educational/      # Planos educacionais
├── integration/      # Integração entre tipos
└── analytics/        # Métricas e relatórios
```

Esta documentação serve como guia completo para desenvolvimento seguro e manutenção do módulo de planos, considerando o impacto crítico no negócio e a necessidade de proteção da lógica financeira.