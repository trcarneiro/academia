# Plano Arquitetural: Portal do Aluno

**Versão**: 1.0  
**Data**: 30/11/2025  
**Status**: 🟢 APROVADO  
**Base**: `spec.md` v1.2

---

## 📐 ARQUITETURA GERAL

### Visão de Alto Nível

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTES                                │
├─────────────┬─────────────┬─────────────┬─────────────┬────────┤
│   Mobile    │   Desktop   │   Totem     │  WhatsApp   │  Bot   │
│   (90%)     │   (10%)     │   (QR)      │  (Links)    │ (Futuro)│
└──────┬──────┴──────┬──────┴──────┬──────┴──────┬──────┴────────┘
       │             │             │             │
       ▼             ▼             ▼             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (SPA)                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  public/portal/                                           │  │
│  │  • Vanilla JS + Módulos                                   │  │
│  │  • PWA (offline-first)                                    │  │
│  │  • Mobile-first CSS                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (API)                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  src/routes/portal/                                       │  │
│  │  • Fastify + TypeScript                                   │  │
│  │  • JWT Auth (studentId)                                   │  │
│  │  • Rate Limiting                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
       ┌───────────────────┼───────────────────┐
       ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  PostgreSQL │    │   Asaas     │    │  WhatsApp   │
│  (Supabase) │    │ (Pagamentos)│    │  (Z-API)    │
└─────────────┘    └─────────────┘    └─────────────┘
```

---

## 🏗️ STACK TECNOLÓGICO

### Frontend
| Componente | Tecnologia | Justificativa |
|------------|------------|---------------|
| Framework | Vanilla JS (SPA) | Consistência com admin, bundle pequeno |
| Estilo | CSS + Design System | Tokens existentes |
| PWA | Workbox | Offline-first para mobile |
| Roteamento | Hash Router | Simples, sem server-side |

### Backend
| Componente | Tecnologia | Justificativa |
|------------|------------|---------------|
| Server | Fastify | Já em uso no projeto |
| ORM | Prisma | Já em uso no projeto |
| Auth | JWT + Magic Link | Mobile-friendly, sem senha |
| Validação | Zod | Já em uso no projeto |

### Integrações
| Serviço | Função | Status |
|---------|--------|--------|
| Asaas | Pagamentos (PIX, Boleto, Cartão) | ✅ Validado |
| Z-API/Twilio | WhatsApp (notificações) | 🔴 A configurar |
| Web Push | Notificações browser | 🟡 Fase 5 |

---

## 📁 ESTRUTURA DE DIRETÓRIOS

### Frontend

```
public/
├── portal/                          # Entrada do Portal
│   ├── index.html                   # SPA shell
│   ├── manifest.json                # PWA config
│   └── sw.js                        # Service Worker
│
├── js/
│   └── portal/
│       ├── app.js                   # Inicialização
│       ├── router.js                # Hash router
│       ├── api.js                   # API client (MUST follow Core Principle III: normalization, caching)
│       ├── auth.js                  # JWT + Magic Link
│       │
│       ├── pages/
│       │   ├── landing.js           # Fase 0: Página de vendas
│       │   ├── register.js          # Fase 0: Cadastro
│       │   ├── checkout.js          # Fase 0: Pagamento
│       │   ├── success.js           # Fase 0: Confirmação
│       │   ├── login.js             # Fase 1
│       │   ├── dashboard.js         # Fase 1
│       │   ├── profile.js           # Fase 1
│       │   ├── payments.js          # Fase 2
│       │   ├── schedule.js          # Fase 2
│       │   ├── courses.js           # Fase 3
│       │   └── chat.js              # Fase 4
│       │
│       └── components/
│           ├── header.js
│           ├── nav-bottom.js        # Mobile bottom nav
│           ├── loading.js
│           ├── empty-state.js
│           └── toast.js
│
└── css/
    └── portal/
        ├── base.css                 # Reset + tokens
        ├── layout.css               # Grid mobile-first
        ├── components.css           # Botões, cards, forms
        └── pages/                   # Estilos específicos
```

### Backend

```
src/
├── routes/
│   └── portal/
│       ├── index.ts                 # Router principal
│       ├── auth.ts                  # Login, register, magic-link
│       ├── profile.ts               # CRUD perfil
│       ├── payments.ts              # Faturas, PIX, Boleto
│       ├── schedule.ts              # Turmas, agendamento
│       ├── courses.ts               # Jornada, técnicas
│       ├── chat.ts                  # Assistente IA
│       └── notifications.ts         # Notificações
│
├── services/
│   └── portal/
│       ├── authService.ts           # JWT, magic-link
│       ├── paymentService.ts        # Integração Asaas
│       ├── scheduleService.ts       # Lógica de agenda
│       ├── courseService.ts         # Progresso aluno
│       └── chatService.ts           # IA + ações
│
└── middlewares/
    └── portalAuth.ts                # Validação JWT aluno
```

---

## 🗄️ MODELO DE DADOS (Prisma)

### Novas Tabelas

```prisma
// Sessões do Portal (Magic Link)
model StudentSession {
  id          String    @id @default(uuid())
  studentId   String
  token       String    @unique
  magicCode   String?   // Código 6 dígitos
  codeExpires DateTime?
  userAgent   String?
  ipAddress   String?
  expiresAt   DateTime
  createdAt   DateTime  @default(now())
  
  student     Student   @relation(fields: [studentId], references: [id], onDelete: Cascade)
  
  @@index([studentId])
  @@index([token])
  @@index([magicCode])
  @@map("student_sessions")
}

// Notificações do Aluno
model StudentNotification {
  id          String    @id @default(uuid())
  studentId   String
  
  type        String    // PAYMENT, CLASS, ACHIEVEMENT, SYSTEM
  title       String
  message     String
  link        String?
  read        Boolean   @default(false)
  
  createdAt   DateTime  @default(now())
  readAt      DateTime?
  
  student     Student   @relation(fields: [studentId], references: [id], onDelete: Cascade)
  
  @@index([studentId, read])
  @@map("student_notifications")
}

// Progresso em Técnicas
model StudentTechniqueProgress {
  id          String    @id @default(uuid())
  studentId   String
  techniqueId String
  
  completed   Boolean   @default(false)
  rating      Int?      // 1-5 auto-avaliação
  completedAt DateTime?
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  student     Student   @relation(fields: [studentId], references: [id], onDelete: Cascade)
  technique   Technique @relation(fields: [techniqueId], references: [id], onDelete: Cascade)
  
  @@unique([studentId, techniqueId])
  @@map("student_technique_progress")
}
```

### Alterações em Tabelas Existentes

```prisma
// Student - adicionar campos
model Student {
  // ... campos existentes ...
  
  // Auth Portal
  passwordHash    String?           // Para login tradicional
  emailVerified   Boolean @default(false)
  
  // Asaas
  asaasCustomerId String? @unique
  
  // Relacionamentos novos
  sessions        StudentSession[]
  notifications   StudentNotification[]
  techniqueProgress StudentTechniqueProgress[]
}

// Payment - adicionar campos Asaas
model Payment {
  // ... campos existentes ...
  
  // Asaas IDs
  asaasChargeId   String? @unique
  asaasInvoiceUrl String?
  asaasPixCode    String?
  asaasPixQrCode  String?           // Base64 do QR
  asaasBoletoUrl  String?
  asaasBoletoCode String?
  
  // Método usado
  paymentMethod   String?   // PIX, BOLETO, CREDIT_CARD
  paidAt          DateTime?
}
```

---

## 💰 MODELO DE PREÇOS

### Estratégia de Precificação

Os preços são dinâmicos e carregados da tabela `BillingPlan`. NÃO devem ser hardcoded no frontend.

```typescript
// API retorna planos disponíveis
GET /api/portal/plans
Response: {
  success: true,
  data: [
    { id: 'uuid', name: 'Ilimitado Anual', price: 229.90, interval: 'MONTHLY', duration: 12 },
    { id: 'uuid', name: 'Ilimitado Mensal', price: 269.90, interval: 'MONTHLY', duration: 1 }
  ]
}
```

### Regras de Negócio

- Planos são cadastrados via Admin (não pelo portal)
- Aluno escolhe plano na landing page
- Preço é confirmado no checkout via API (nunca do frontend)
- Valores de mockup nos specs são ILUSTRATIVOS

---

## 🎬 ESTRATÉGIA DE VÍDEOS (Cursos)

### Hospedagem Recomendada

| Opção | Prós | Contras | Custo |
|-------|------|---------|-------|
| **Cloudflare R2 + Stream** | CDN global, baixo custo, integração fácil | Requer setup inicial | ~$0.015/GB |
| YouTube Unlisted | Gratuito, player pronto | Menos controle, ads | Grátis |
| Bunny.net | Streaming otimizado | Custo por view | ~$0.005/GB |

**Decisão**: Cloudflare R2 para armazenamento + Stream para delivery (ou YouTube unlisted para MVP).

### Modelo de Dados

```prisma
model Technique {
  id          String  @id @default(uuid())
  // ...
  videoUrl    String? // URL do vídeo (CDN ou YouTube)
  videoType   String? // 'cloudflare' | 'youtube' | 'bunny'
  thumbnailUrl String?
}
```

### Implementação Faseada

1. **MVP (Fase 3)**: Links YouTube unlisted - sem custo
2. **V2**: Migrar para Cloudflare R2 quando volume justificar

---

## 🔐 AUTENTICAÇÃO

### Fluxo Magic Link (Preferido)

```
1. Aluno informa telefone
2. Backend gera código 6 dígitos, salva em StudentSession
3. Envia código via WhatsApp (Z-API)
4. Aluno digita código
5. Backend valida, gera JWT
6. Aluno logado!
```

### Fluxo Tradicional (Fallback)

```
1. Aluno informa email + senha
2. Backend valida hash bcrypt
3. Gera JWT
4. Aluno logado!
```

### JWT Payload

```typescript
interface PortalJwtPayload {
  sub: string;           // studentId
  email: string;
  name: string;
  orgId: string;         // organizationId
  type: 'portal';        // Diferencia de admin
  iat: number;
  exp: number;
}
```

### Middleware de Autenticação

```typescript
// src/middlewares/portalAuth.ts
export async function portalAuthMiddleware(request, reply) {
  const token = request.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return reply.code(401).send({ error: 'Token required' });
  }
  
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    
    if (payload.type !== 'portal') {
      return reply.code(403).send({ error: 'Invalid token type' });
    }
    
    request.studentId = payload.sub;
    request.organizationId = payload.orgId;
  } catch (e) {
    return reply.code(401).send({ error: 'Invalid token' });
  }
}
```

---

## 💳 INTEGRAÇÃO ASAAS

### Fluxo de Pagamento

```
1. Aluno clica "Pagar" na fatura
2. Frontend chama POST /api/portal/payments/:id/pix
3. Backend:
   a. Verifica se já existe cobrança Asaas
   b. Se não, cria via asaasService.createPayment()
   c. Salva IDs no Payment local
   d. Retorna pixCode + qrCode
4. Frontend exibe QR Code
5. Aluno paga no app do banco
6. Asaas envia webhook para /api/financial/webhooks/asaas
7. Backend atualiza status do Payment
8. Frontend atualiza via polling ou WebSocket (futuro)
```

### Criação de Cobrança

```typescript
// src/services/portal/paymentService.ts
async function createAsaasCharge(paymentId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { student: true }
  });
  
  // Verificar/criar customer no Asaas
  let customerId = payment.student.asaasCustomerId;
  if (!customerId) {
    const customer = await asaasService.createCustomer({
      name: payment.student.name,
      cpfCnpj: payment.student.cpf,
      email: payment.student.email,
      phone: payment.student.phone
    });
    customerId = customer.id;
    await prisma.student.update({
      where: { id: payment.studentId },
      data: { asaasCustomerId: customerId }
    });
  }
  
  // Criar cobrança
  const charge = await asaasService.createPayment({
    customer: customerId,
    billingType: 'PIX',
    value: payment.finalAmount,
    dueDate: payment.dueDate.toISOString().split('T')[0],
    description: `Mensalidade ${payment.referenceMonth}/${payment.referenceYear}`,
    externalReference: payment.id
  });
  
  // Obter QR Code PIX
  const pix = await asaasService.getPixQrCode(charge.id);
  
  // Salvar no banco local
  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      asaasChargeId: charge.id,
      asaasPixCode: pix.payload,
      asaasPixQrCode: pix.encodedImage,
      asaasInvoiceUrl: charge.invoiceUrl
    }
  });
  
  return { pixCode: pix.payload, qrCode: pix.encodedImage };
}
```

---

## 📱 PWA CONFIGURATION

### manifest.json

```json
{
  "name": "Portal do Aluno - Krav Maga",
  "short_name": "Krav Maga",
  "description": "Seu portal de aluno da academia",
  "start_url": "/portal/",
  "display": "standalone",
  "background_color": "#667eea",
  "theme_color": "#667eea",
  "icons": [
    {
      "src": "/img/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/img/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Service Worker (Básico)

```javascript
// sw.js
const CACHE_NAME = 'portal-v1';
const STATIC_ASSETS = [
  '/portal/',
  '/portal/index.html',
  '/js/portal/app.js',
  '/css/portal/base.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  // Network-first para API, cache-first para assets
  if (event.request.url.includes('/api/')) {
    event.respondWith(fetch(event.request));
  } else {
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
  }
});
```

---

## 🚀 FASES DE IMPLEMENTAÇÃO

### Fase 0: MVP de Venda (5 dias)

**Dia 1-2: Backend**
- [ ] `POST /api/portal/register` - Cadastro mínimo
- [ ] `POST /api/portal/payments/create` - Criar cobrança PIX
- [ ] `GET /api/portal/payments/:id/status` - Verificar pagamento
- [ ] Webhook Asaas funcionando

**Dia 3-4: Frontend**
- [ ] Landing page (`landing.js`)
- [ ] Formulário cadastro (`register.js`)
- [ ] Tela pagamento PIX (`checkout.js`)
- [ ] Tela sucesso (`success.js`)

**Dia 5: Integração**
- [ ] Fluxo completo testado
- [ ] WhatsApp de confirmação (manual ou Z-API)
- [ ] Deploy em subdomínio

### Fase 1: Dashboard + Login (5 dias)

**Backend**
- [ ] `POST /api/portal/login` - Login email/senha
- [ ] `POST /api/portal/magic-link` - Gerar código
- [ ] `POST /api/portal/verify-code` - Validar código
- [ ] `GET /api/portal/dashboard` - Dados resumidos

**Frontend**
- [ ] Login page
- [ ] Magic Link flow
- [ ] Dashboard básico
- [ ] Perfil visualizar/editar

### Fase 2: Pagamentos + Agenda (10 dias)

**Backend**
- [ ] Listar faturas
- [ ] Gerar PIX/Boleto
- [ ] Listar turmas do aluno
- [ ] Agendar reposição
- [ ] Histórico de frequência

**Frontend**
- [ ] Página de faturas
- [ ] Tela de pagamento (Full-screen)
- [ ] Calendário de aulas
- [ ] Agendamento de reposição

### Fase 3: Cursos + Gamificação (10 dias)

**Backend**
- [ ] Jornada do aluno (faixa, progresso)
- [ ] Módulos e técnicas
- [ ] Marcar técnica como aprendida
- [ ] Badges e conquistas

**Frontend**
- [ ] Página de jornada
- [ ] Lista de técnicas com vídeos
- [ ] Progresso visual
- [ ] Conquistas

### Fase 4: Assistente IA (5 dias)

**Backend**
- [ ] Chat endpoint com Gemini
- [ ] Ações automáticas (reagendar, etc)
- [ ] Histórico de conversas

**Frontend**
- [ ] Interface de chat
- [ ] Botões de ação rápida
- [ ] Sugestões contextuais

### Fase 5: Polish (5 dias)

- [ ] PWA completo
- [ ] Push notifications
- [ ] QR Code no totem
- [ ] Testes e ajustes finais

---

## 📊 ENDPOINTS API (Resumo)

### Fase 0
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/portal/register` | Cadastro novo aluno |
| POST | `/api/portal/payments/create` | Criar cobrança Asaas |
| GET | `/api/portal/payments/:id/pix` | Obter QR Code PIX |
| GET | `/api/portal/payments/:id/status` | Status do pagamento |

### Fase 1
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/portal/login` | Login email/senha |
| POST | `/api/portal/magic-link` | Solicitar código |
| POST | `/api/portal/verify-code` | Validar código |
| GET | `/api/portal/dashboard` | Dados do dashboard |
| GET | `/api/portal/profile` | Dados do perfil |
| PUT | `/api/portal/profile` | Atualizar perfil |

### Fase 2
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/portal/payments` | Listar faturas |
| GET | `/api/portal/payments/:id` | Detalhes fatura |
| GET | `/api/portal/enrollments` | Minhas turmas |
| GET | `/api/portal/schedule` | Calendário |
| POST | `/api/portal/bookings` | Agendar aula |
| DELETE | `/api/portal/bookings/:id` | Cancelar |

### Fase 3-4
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/portal/journey` | Jornada/faixa |
| GET | `/api/portal/techniques` | Técnicas |
| POST | `/api/portal/techniques/:id/complete` | Marcar aprendida |
| POST | `/api/portal/chat` | Chat IA |
| GET | `/api/portal/notifications` | Notificações |

---

## ✅ CRITÉRIOS DE ACEITE

### Fase 0 - MVP de Venda
- [ ] Link de cadastro acessível via mobile
- [ ] Cadastro em menos de 2 minutos
- [ ] QR Code PIX exibido corretamente
- [ ] Pagamento refletido em menos de 5 minutos
- [ ] Aluno recebe confirmação (tela + WhatsApp)

### Performance
- [ ] First Contentful Paint < 1.5s (mobile 3G)
- [ ] Time to Interactive < 3s
- [ ] Lighthouse PWA score > 90

### Segurança
- [ ] HTTPS obrigatório
- [ ] JWT com expiração
- [ ] Rate limiting em endpoints sensíveis
- [ ] Dados sensíveis mascarados

---

## 🔗 DEPENDÊNCIAS EXTERNAS

| Serviço | Função | Prioridade | Status |
|---------|--------|------------|--------|
| Asaas | Pagamentos | CRÍTICA | ✅ Validado |
| Z-API/Twilio | WhatsApp | ALTA | 🔴 Configurar |
| Supabase | Banco de dados | CRÍTICA | ✅ Em uso |
| Vercel/Render | Hosting | ALTA | ✅ Em uso |

---

**Autor**: GitHub Copilot  
**Data**: 30/11/2025  
**Próximo passo**: Gerar `tasks.md`
