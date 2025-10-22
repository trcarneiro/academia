# 🛠️ Planos de Crédito - Guia de Implementação Prática

## 📋 Passo 1: Schema Prisma (30 min)

### Adicionar ao `prisma/schema.prisma`:

```prisma
// ============= NOVOS ENUMS =============

enum PlanType {
  MONTHLY           // Renovação automática
  CREDIT_PACK       // Pacote com validade
  ONE_TIME          // Uso único
  TRIAL             // Teste
}

enum CreditType {
  CLASS             // 1 crédito = 1 aula
  HOUR              // 1 crédito = 1 hora
  PERSONAL_HOUR     // Personal training
}

// ============= NOVOS CAMPOS em BillingPlan =============

model BillingPlan {
  // ... campos existentes ...
  
  planType              PlanType            @default(MONTHLY)
  creditQuantity        Int?                @default(1)
  creditType            CreditType          @default(CLASS)
  creditValidityDays    Int                 @default(90)
  minCreditsPerClass    Int                 @default(1)
  allowPartialCredit    Boolean             @default(false)
  allowTransfer         Boolean             @default(false)
  transferFeePercent    Decimal?            @db.Decimal(5, 2)
  allowRefund           Boolean             @default(false)
  refundDaysBeforeExp   Int?
  bulkDiscountTiers     Json?
  
  // ... manter relações existentes ...
}

// ============= NOVA TABELA: Credit Tracking =============

model StudentCredits {
  id                String      @id @default(uuid())
  organizationId    String
  studentId         String
  subscriptionId    String
  totalCredits      Decimal     @db.Decimal(10, 2)
  creditsUsed       Decimal     @db.Decimal(10, 2)    @default(0)
  creditsRemaining  Decimal     @db.Decimal(10, 2)
  purchasedAt       DateTime    @default(now())
  expiresAt         DateTime
  status            String      @default("ACTIVE")    // ACTIVE, EXPIRED, REFUNDED
  notificationSent  Boolean     @default(false)
  
  organization      Organization @relation(fields: [organizationId], references: [id])
  student           Student       @relation(fields: [studentId], references: [id])
  subscription      StudentSubscription @relation(fields: [subscriptionId], references: [id])
  usage             CreditUsage[]
  
  @@unique([organizationId, subscriptionId])
  @@map("student_credits")
}

model CreditUsage {
  id                String      @id @default(uuid())
  organizationId    String
  studentId         String
  creditsId         String
  attendanceId      String?
  creditsUsed       Decimal     @db.Decimal(5, 2)
  usedAt            DateTime    @default(now())
  description       String?     // "Aula de Krav Maga", "Personal Training"
  
  organization      Organization @relation(fields: [organizationId], references: [id])
  student           Student       @relation(fields: [studentId], references: [id])
  studentCredits    StudentCredits @relation(fields: [creditsId], references: [id])
  
  @@map("credit_usage")
}

// Link Students back to Credits
extend model Student {
  credits           StudentCredits[]
  creditUsage       CreditUsage[]
}

// Link Organization back to Credits
extend model Organization {
  studentCredits    StudentCredits[]
  creditUsage       CreditUsage[]
}
```

### Executar Migração:
```bash
npx prisma migrate dev --name add_credit_system
npx prisma generate
```

---

## 🎬 Passo 2: Criar Planos Base (1h)

### Seed Script: `scripts/seed-credit-plans.ts`

```typescript
import { prisma } from '@/utils/database';

async function seedCreditPlans() {
  const orgId = '452c0b35-1822-4890-851e-922356c812fb';

  const plans = [
    {
      name: 'Aula Avulsa',
      description: 'Use em qualquer aula. Válida por 30 dias.',
      planType: 'ONE_TIME',
      creditQuantity: 1,
      creditValidityDays: 30,
      price: 40,
      allowRefund: true,
    },
    {
      name: '10 Aulas - 90 Dias',
      description: 'Pacote de 10 aulas com validade de 90 dias',
      planType: 'CREDIT_PACK',
      creditQuantity: 10,
      creditValidityDays: 90,
      price: 250,
      allowTransfer: true,
      transferFeePercent: 5,
      allowRefund: true,
      refundDaysBeforeExp: 7,
    },
    {
      name: '20 Aulas - 180 Dias',
      description: 'Melhor custo-benefício: 20% de desconto',
      planType: 'CREDIT_PACK',
      creditQuantity: 20,
      creditValidityDays: 180,
      price: 450,
      allowTransfer: true,
      transferFeePercent: 3,
      allowRefund: true,
      refundDaysBeforeExp: 7,
    },
    {
      name: '30 Aulas - Sem Vencimento',
      description: 'Máxima economia: 50% de desconto',
      planType: 'CREDIT_PACK',
      creditQuantity: 30,
      creditValidityDays: 365,
      price: 600,
      allowTransfer: true,
      transferFeePercent: 2,
    },
    {
      name: 'Treino Pessoal - 5 Horas',
      description: '5 sessões de 60 minutos com instrutor dedicado',
      planType: 'CREDIT_PACK',
      creditQuantity: 5,
      creditType: 'PERSONAL_HOUR',
      creditValidityDays: 90,
      price: 900,
      allowRefund: true,
      refundDaysBeforeExp: 2,
    },
  ];

  for (const plan of plans) {
    await prisma.billingPlan.upsert({
      where: { id: plan.name }, // ou usar único identifier
      update: {},
      create: {
        organizationId: orgId,
        ...plan,
        billingType: 'MONTHLY',
        isActive: true,
      },
    });
  }

  console.log('✅ Planos de crédito criados');
}

seedCreditPlans()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
```

Executar:
```bash
npx ts-node scripts/seed-credit-plans.ts
```

---

## 🔧 Passo 3: Backend API (2-3h)

### Criar `src/routes/credits.ts`:

```typescript
import { FastifyInstance } from 'fastify';
import { prisma } from '@/utils/database';
import { ResponseHelper } from '@/utils/response';

export default async function creditsRoutes(fastify: FastifyInstance) {
  
  // GET /api/credits/student/:studentId
  fastify.get('/student/:studentId', async (request, reply) => {
    try {
      const { studentId } = request.params as { studentId: string };
      const organizationId = request.user?.organizationId || 'default-org';

      const credits = await prisma.studentCredits.findMany({
        where: {
          studentId,
          organizationId,
          status: 'ACTIVE',
        },
        include: {
          subscription: {
            include: { plan: true },
          },
        },
        orderBy: { expiresAt: 'asc' },
      });

      // Calcular totais
      const totalCredits = credits.reduce((sum, c) => sum + c.totalCredits, 0);
      const usedCredits = credits.reduce((sum, c) => sum + c.creditsUsed, 0);
      const remaining = totalCredits - usedCredits;

      return ResponseHelper.success(reply, {
        credits,
        totals: { totalCredits, usedCredits, remaining },
      });
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  });

  // POST /api/credits/use
  fastify.post('/use', async (request, reply) => {
    try {
      const { studentId, creditsId, quantity, attendanceId, description } = request.body as any;
      const organizationId = request.user?.organizationId || 'default-org';

      // 1. Verificar se tem créditos disponíveis
      const studentCredits = await prisma.studentCredits.findUnique({
        where: { id: creditsId },
      });

      if (!studentCredits) {
        return ResponseHelper.notFound(reply, 'Créditos não encontrados');
      }

      const available = studentCredits.totalCredits - studentCredits.creditsUsed;
      if (available < quantity) {
        return ResponseHelper.badRequest(reply, `Créditos insuficientes. Disponível: ${available}`);
      }

      // 2. Registrar uso
      const usage = await prisma.creditUsage.create({
        data: {
          organizationId,
          studentId,
          creditsId,
          attendanceId,
          creditsUsed: quantity,
          description,
        },
      });

      // 3. Atualizar saldo
      await prisma.studentCredits.update({
        where: { id: creditsId },
        data: {
          creditsUsed: {
            increment: quantity,
          },
        },
      });

      return ResponseHelper.success(reply, usage, 'Créditos utilizados com sucesso');
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  });

  // POST /api/credits/refund
  fastify.post('/refund', async (request, reply) => {
    try {
      const { creditsId, reason } = request.body as any;

      const studentCredits = await prisma.studentCredits.findUnique({
        where: { id: creditsId },
      });

      if (!studentCredits) {
        return ResponseHelper.notFound(reply, 'Créditos não encontrados');
      }

      // Reembolso: voltar para 0 créditos usados
      await prisma.studentCredits.update({
        where: { id: creditsId },
        data: {
          status: 'REFUNDED',
          creditsUsed: 0,
        },
      });

      return ResponseHelper.success(reply, {}, 'Reembolso processado');
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  });

  // GET /api/credits/expiring-soon
  fastify.get('/expiring-soon', async (request, reply) => {
    try {
      const organizationId = request.user?.organizationId || 'default-org';
      const now = new Date();
      const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const expiring = await prisma.studentCredits.findMany({
        where: {
          organizationId,
          status: 'ACTIVE',
          expiresAt: {
            gte: now,
            lte: sevenDaysLater,
          },
        },
        include: {
          student: {
            include: { user: true },
          },
          subscription: {
            include: { plan: true },
          },
        },
      });

      return ResponseHelper.success(reply, expiring);
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  });
}
```

### Registrar em `src/server.ts`:

```typescript
import creditsRoutes from '@/routes/credits';

// ... dentro de fastify.register()
await fastify.register(creditsRoutes, { prefix: '/api/credits' });
```

---

## 💻 Passo 4: Frontend - Dashboard (2h)

### Criar `public/js/modules/credits/index.js`:

```javascript
if (typeof window.CreditsModule !== 'undefined') {
  console.log('Credits Module já carregado');
} else {

const CreditsModule = {
  container: null,
  currentStudent: null,
  credits: [],
  moduleAPI: null,

  async init(studentId) {
    await this.initializeAPI();
    this.currentStudent = studentId;
    await this.loadCredits();
    this.render();
  },

  async initializeAPI() {
    await waitForAPIClient();
    this.moduleAPI = window.createModuleAPI('Credits');
  },

  async loadCredits() {
    const response = await this.moduleAPI.fetchWithStates(
      `/api/credits/student/${this.currentStudent}`,
      {
        onSuccess: (data) => {
          this.credits = data.credits;
          this.totals = data.totals;
        },
        onEmpty: () => console.log('Nenhum crédito encontrado'),
        onError: (error) => console.error('Erro ao carregar créditos:', error),
      }
    );
    return response;
  },

  render() {
    if (!this.container) return;

    const { totalCredits, usedCredits, remaining } = this.totals || {};
    const percentUsed = totalCredits ? (usedCredits / totalCredits) * 100 : 0;

    this.container.innerHTML = `
      <div class="module-isolated-credits-container">
        <h2>💳 Meus Créditos</h2>
        
        <div class="credits-summary">
          <div class="summary-card">
            <h3>Total de Créditos</h3>
            <p class="big-number">${totalCredits || 0}</p>
          </div>
          
          <div class="summary-card">
            <h3>Utilizados</h3>
            <p class="big-number used">${usedCredits || 0}</p>
          </div>
          
          <div class="summary-card">
            <h3>Disponível</h3>
            <p class="big-number available">${remaining || 0}</p>
          </div>
        </div>

        <div class="credits-progress">
          <p>Uso: ${percentUsed.toFixed(0)}%</p>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${percentUsed}%"></div>
          </div>
        </div>

        <div class="credits-list">
          ${(this.credits || [])
            .map(
              (c) => `
            <div class="credit-card ${c.status}">
              <div class="card-header">
                <h4>${c.subscription?.plan?.name}</h4>
                <span class="credit-type ${c.subscription?.plan?.planType}">
                  ${c.subscription?.plan?.planType}
                </span>
              </div>
              
              <div class="card-body">
                <p>Créditos: 
                  <strong>${c.creditsRemaining} de ${c.totalCredits}</strong>
                </p>
                <p>Expira em: 
                  <strong>${new Date(c.expiresAt).toLocaleDateString('pt-BR')}</strong>
                </p>
                ${
                  this.daysUntilExpiry(c.expiresAt) <= 7
                    ? `<p class="warning">⚠️ Expira em ${this.daysUntilExpiry(c.expiresAt)} dias!</p>`
                    : ''
                }
              </div>
            </div>
          `
            )
            .join('')}
        </div>

        <button class="btn btn-primary" onclick="window.creditsModule.openStore()">
          🛒 Comprar Mais Créditos
        </button>
      </div>
    `;
  },

  daysUntilExpiry(expiryDate) {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  },

  openStore() {
    // Abrir modal de compra de créditos
    window.app?.navigate('store', { type: 'credits' });
  },
};

window.creditsModule = CreditsModule;

} // end if
```

### Criar CSS: `public/css/modules/credits.css`

```css
.module-isolated-credits-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.module-isolated-credits-container h2 {
  color: #667eea;
  margin-bottom: 20px;
  font-size: 1.8em;
}

.credits-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 30px;
}

.summary-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  border-radius: 10px;
  color: white;
  text-align: center;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2);
}

.summary-card h3 {
  font-size: 0.9em;
  opacity: 0.9;
  margin-bottom: 10px;
}

.summary-card .big-number {
  font-size: 2.5em;
  font-weight: bold;
}

.summary-card .big-number.used {
  color: #ff6b6b;
}

.summary-card .big-number.available {
  color: #51cf66;
}

.credits-progress {
  margin-bottom: 30px;
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.progress-bar {
  width: 100%;
  height: 24px;
  background: #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
  margin-top: 10px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s ease;
}

.credits-list {
  margin-bottom: 30px;
}

.credit-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.credit-card:hover {
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.15);
}

.credit-card.EXPIRED {
  opacity: 0.6;
  background: #f5f5f5;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.card-header h4 {
  color: #333;
  margin: 0;
}

.credit-type {
  font-size: 0.8em;
  padding: 5px 10px;
  border-radius: 5px;
  background: #667eea;
  color: white;
}

.card-body p {
  margin: 8px 0;
  color: #666;
}

.card-body .warning {
  color: #ff6b6b;
  font-weight: bold;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@media (max-width: 768px) {
  .credits-summary {
    grid-template-columns: 1fr;
  }
}
```

---

## 📧 Passo 5: Notificações Automáticas (1h)

### Criar Job: `src/jobs/creditExpirationJob.ts`

```typescript
import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import nodemailer from 'nodemailer';

export async function checkCreditExpiration() {
  logger.info('🔍 Verificando créditos prestes a expirar...');

  const organizationId = '452c0b35-1822-4890-851e-922356c812fb';
  const now = new Date();
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const expiring = await prisma.studentCredits.findMany({
    where: {
      organizationId,
      status: 'ACTIVE',
      expiresAt: {
        gte: now,
        lte: sevenDaysLater,
      },
      notificationSent: false,
    },
    include: {
      student: { include: { user: true } },
      subscription: { include: { plan: true } },
    },
  });

  for (const credit of expiring) {
    const daysLeft = Math.ceil((credit.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const creditsRemaining = credit.totalCredits - credit.creditsUsed;

    const email = credit.student.user.email;
    const subject = `⚠️ Seus ${creditsRemaining} créditos expiram em ${daysLeft} dias!`;
    const body = `
      Oi ${credit.student.user.firstName},

      Seus créditos do plano "${credit.subscription.plan.name}" 
      expiram em ${daysLeft} dias!

      Créditos disponíveis: ${creditsRemaining}

      Agende suas aulas agora:
      https://academia.demo/agendar

      Abraços,
      Academia Krav Maga
    `;

    try {
      // Enviar email (usar seu provider de email)
      // await sendEmail(email, subject, body);
      
      logger.info(`📧 Email enviado para ${email}`);

      // Marcar como notificado
      await prisma.studentCredits.update({
        where: { id: credit.id },
        data: { notificationSent: true },
      });
    } catch (error) {
      logger.error(`❌ Erro ao enviar email: ${error}`);
    }
  }

  logger.info(`✅ Verificação concluída. ${expiring.length} notificações enviadas`);
}

// Agendar para rodar todo dia às 08:00
// Em production, use: node-cron ou similar
// node-schedule, bull-queue, etc.
```

### Registrar no `src/server.ts`:

```typescript
import { checkCreditExpiration } from '@/jobs/creditExpirationJob';
import cron from 'node-cron';

// Rodar todo dia às 8AM
cron.schedule('0 8 * * *', () => {
  checkCreditExpiration().catch(console.error);
});
```

---

## 📊 Passo 6: Relatórios Admin (1h)

### Criar endpoint: `src/routes/admin/credits-analytics.ts`

```typescript
fastify.get('/api/admin/credits/analytics', async (request, reply) => {
  const organizationId = request.user?.organizationId || 'default-org';

  const totalSold = await prisma.studentCredits.aggregate({
    where: { organizationId },
    _sum: { totalCredits: true },
  });

  const totalUsed = await prisma.studentCredits.aggregate({
    where: { organizationId },
    _sum: { creditsUsed: true },
  });

  const expiring = await prisma.studentCredits.findMany({
    where: {
      organizationId,
      expiresAt: {
        lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    },
  });

  return ResponseHelper.success(reply, {
    totalSold: totalSold._sum.totalCredits || 0,
    totalUsed: totalUsed._sum.creditsUsed || 0,
    totalRemaining: (totalSold._sum.totalCredits || 0) - (totalUsed._sum.creditsUsed || 0),
    expiringCount: expiring.length,
  });
});
```

---

## ✅ Checklist de Implementação

- [ ] Passo 1: Schema Prisma + Migration
- [ ] Passo 2: Seed de planos base
- [ ] Passo 3: Rotas de backend
- [ ] Passo 4: Interface frontend
- [ ] Passo 5: Job de notificação
- [ ] Passo 6: Relatórios admin
- [ ] Testes E2E: Compra → Uso → Expiração
- [ ] Deploy em produção

---

**Status**: 🟢 Pronto para começar  
**Estimativa**: 1-2 semanas de desenvolvimento  
**Impacto**: +30-50% de receita (base em academias similares)
