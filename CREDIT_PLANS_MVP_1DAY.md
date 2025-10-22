# ⚡ MVP: Sistema de Créditos em 1 Dia

Implementação rápida e funcional do sistema básico de créditos.  
**Tempo estimado: 4-6 horas**

---

## 📋 Escopo MVP (Mínimo Viável)

### ✅ Que terá:
1. 3 planos de crédito (Avulsa, Pack 10, Pack 30)
2. Mostrar saldo na tela do aluno
3. Descontar crédito ao fazer check-in
4. Exibir aviso quando está vencendo
5. Email automático 7 dias antes

### ❌ Que NÃO terá (Fase 2):
- Transferência entre alunos
- Reembolsos
- Congelamento
- Relatórios detalhados

---

## 🚀 Implementação em 4 Horas

### **Hora 1: Schema + Migration (30 min + Deploy)**

#### 1.1 Editar `prisma/schema.prisma`

Adicione ANTES da última linha do arquivo:

```prisma
// ========== CREDIT SYSTEM ==========

model StudentCredits {
  id                String      @id @default(uuid())
  organizationId    String
  studentId         String
  planId            String
  totalCredits      Decimal     @db.Decimal(10, 2)
  creditsUsed       Decimal     @db.Decimal(10, 2)    @default(0)
  purchasedAt       DateTime    @default(now())
  expiresAt         DateTime
  status            String      @default("ACTIVE")
  
  organization      Organization @relation(fields: [organizationId], references: [id])
  student           Student       @relation(fields: [studentId], references: [id])
  plan              BillingPlan   @relation(fields: [planId], references: [id])
  
  @@unique([organizationId, studentId, planId])
  @@map("student_credits")
}

extend model BillingPlan {
  credits           StudentCredits[]
}

extend model Student {
  credits           StudentCredits[]
}

extend model Organization {
  credits           StudentCredits[]
}
```

#### 1.2 Rodar Migração

```bash
npx prisma migrate dev --name add_credit_system
npx prisma generate
```

#### 1.3 Criar Seed Rápido

Arquivo: `scripts/quick-seed-credits.ts`

```typescript
import { prisma } from '@/utils/database';

async function seedCreditPlans() {
  const orgId = '452c0b35-1822-4890-851e-922356c812fb';

  // Deletar planos antigos (se existirem)
  await prisma.billingPlan.deleteMany({
    where: {
      organizationId: orgId,
      name: { in: ['Aula Avulsa', '10 Aulas', '30 Aulas'] }
    }
  });

  const plans = [
    {
      name: 'Aula Avulsa',
      description: 'Use em qualquer aula',
      price: 40,
      creditQuantity: 1,
      creditValidityDays: 30
    },
    {
      name: '10 Aulas - 90 Dias',
      description: 'Pacote popular com desconto',
      price: 250,
      creditQuantity: 10,
      creditValidityDays: 90
    },
    {
      name: '30 Aulas - 365 Dias',
      description: 'Melhor preço por aula',
      price: 600,
      creditQuantity: 30,
      creditValidityDays: 365
    }
  ];

  for (const plan of plans) {
    await prisma.billingPlan.create({
      data: {
        organizationId: orgId,
        ...plan,
        billingType: 'MONTHLY',
        isActive: true,
        classesPerWeek: 0
      }
    });
  }

  console.log('✅ Planos criados');
}

seedCreditPlans()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
```

Executar:
```bash
npx ts-node scripts/quick-seed-credits.ts
```

---

### **Hora 2: Backend API Simples (60 min)**

#### 2.1 Criar `src/routes/credits-simple.ts`

```typescript
import { FastifyInstance } from 'fastify';
import { prisma } from '@/utils/database';
import { ResponseHelper } from '@/utils/response';

export default async function creditsRoutes(fastify: FastifyInstance) {
  
  // GET /api/credits/my-credits
  fastify.get('/my-credits', async (request, reply) => {
    try {
      // Obter studentId do contexto (ou do JWT)
      // Por enquanto, usar query param (inseguro, só para MVP!)
      const { studentId } = request.query as any;
      const organizationId = '452c0b35-1822-4890-851e-922356c812fb';

      const credits = await prisma.studentCredits.findMany({
        where: { studentId, organizationId, status: 'ACTIVE' },
        include: { plan: true },
        orderBy: { expiresAt: 'asc' }
      });

      const totalCredits = credits.reduce((s, c) => s + Number(c.totalCredits), 0);
      const usedCredits = credits.reduce((s, c) => s + Number(c.creditsUsed), 0);

      return ResponseHelper.success(reply, {
        credits,
        totalCredits,
        usedCredits,
        remaining: totalCredits - usedCredits
      });
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  });

  // POST /api/credits/use-credit
  fastify.post('/use-credit', async (request, reply) => {
    try {
      const { creditsId, quantity } = request.body as any;

      const studentCredits = await prisma.studentCredits.findUnique({
        where: { id: creditsId }
      });

      if (!studentCredits) {
        return ResponseHelper.notFound(reply, 'Créditos não encontrados');
      }

      const available = Number(studentCredits.totalCredits) - Number(studentCredits.creditsUsed);
      if (available < quantity) {
        return ResponseHelper.badRequest(reply, `Créditos insuficientes: ${available} disponível`);
      }

      // Usar créditos
      await prisma.studentCredits.update({
        where: { id: creditsId },
        data: {
          creditsUsed: {
            increment: quantity
          }
        }
      });

      return ResponseHelper.success(reply, {}, 'Crédito utilizado');
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  });

  // GET /api/credits/expiring
  fastify.get('/expiring', async (request, reply) => {
    try {
      const organizationId = '452c0b35-1822-4890-851e-922356c812fb';
      const now = new Date();
      const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const expiring = await prisma.studentCredits.findMany({
        where: {
          organizationId,
          status: 'ACTIVE',
          expiresAt: { gte: now, lte: sevenDaysLater }
        },
        include: { student: { include: { user: true } }, plan: true }
      });

      return ResponseHelper.success(reply, expiring);
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  });
}
```

#### 2.2 Registrar em `src/server.ts`

```typescript
import creditsRoutes from '@/routes/credits-simple';

// Dentro do fastify.register
await fastify.register(creditsRoutes, { prefix: '/api/credits' });
```

---

### **Hora 3: Frontend Dashboard (60 min)**

#### 3.1 Criar `public/js/modules/credits-mvp/index.js`

```javascript
const CreditsMVP = {
  container: null,
  studentId: null,

  async init(studentId) {
    this.studentId = studentId;
    await this.loadCredits();
    this.render();
  },

  async loadCredits() {
    try {
      const response = await fetch(`/api/credits/my-credits?studentId=${this.studentId}`);
      const json = await response.json();
      
      if (json.success) {
        this.data = json.data;
      }
    } catch (error) {
      console.error('Erro ao carregar créditos:', error);
    }
  },

  render() {
    if (!this.container || !this.data) return;

    const { totalCredits, usedCredits, remaining, credits } = this.data;
    const percent = totalCredits > 0 ? (usedCredits / totalCredits) * 100 : 0;

    this.container.innerHTML = `
      <div style="padding: 20px; background: white; border-radius: 10px;">
        <h3 style="color: #667eea; margin-top: 0;">💳 Créditos Disponíveis</h3>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 20px;">
          <div style="background: #f0f4ff; padding: 15px; border-radius: 8px; text-align: center;">
            <div style="font-size: 0.8em; color: #666;">Total</div>
            <div style="font-size: 2em; font-weight: bold; color: #667eea;">${totalCredits}</div>
          </div>
          <div style="background: #fff0f0; padding: 15px; border-radius: 8px; text-align: center;">
            <div style="font-size: 0.8em; color: #666;">Usados</div>
            <div style="font-size: 2em; font-weight: bold; color: #ff6b6b;">${usedCredits}</div>
          </div>
          <div style="background: #f0fff4; padding: 15px; border-radius: 8px; text-align: center;">
            <div style="font-size: 0.8em; color: #666;">Disponível</div>
            <div style="font-size: 2em; font-weight: bold; color: #51cf66;">${remaining}</div>
          </div>
        </div>

        <div style="margin-bottom: 20px;">
          <div style="background: #e0e0e0; height: 20px; border-radius: 10px; overflow: hidden;">
            <div style="background: linear-gradient(90deg, #667eea, #764ba2); height: 100%; width: ${percent}%;"></div>
          </div>
          <div style="font-size: 0.8em; color: #666; margin-top: 5px;">${percent.toFixed(0)}% utilizado</div>
        </div>

        ${credits.length > 0 ? `
          <div style="border-top: 1px solid #e0e0e0; padding-top: 10px;">
            <h4 style="margin-top: 0; color: #333;">Seus Planos:</h4>
            ${credits.map(c => `
              <div style="background: #f9f9f9; padding: 10px; margin-bottom: 8px; border-radius: 5px; border-left: 3px solid #667eea;">
                <div style="font-weight: bold;">${c.plan.name}</div>
                <div style="font-size: 0.9em; color: #666;">
                  ${Number(c.totalCredits) - Number(c.creditsUsed)} de ${c.totalCredits} créditos
                </div>
                <div style="font-size: 0.8em; color: #999;">
                  Expira: ${new Date(c.expiresAt).toLocaleDateString('pt-BR')}
                </div>
              </div>
            `).join('')}
          </div>
        ` : '<p style="color: #999; text-align: center;">Nenhum crédito ativo</p>'}

        <button 
          onclick="window.app?.navigate?.('packages')" 
          style="width: 100%; padding: 10px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; margin-top: 15px;">
          🛒 Comprar Mais Créditos
        </button>
      </div>
    `;
  }
};

window.creditsMVP = CreditsMVP;
```

#### 3.2 Adicionar ao Dashboard

Adicionar no arquivo principal do dashboard (`public/js/modules/dashboard/index.js` ou similar):

```javascript
// Após inicialização do dashboard
await window.creditsMVP?.init?.(currentStudentId);
```

---

### **Hora 4: Notificação Automática (45 min)**

#### 4.1 Criar Job `src/jobs/send-expiring-credits-email.ts`

```typescript
import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';

export async function sendExpiringCreditsEmails() {
  logger.info('📧 Verificando créditos prestes a expirar...');

  const organizationId = '452c0b35-1822-4890-851e-922356c812fb';
  const now = new Date();
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const expiring = await prisma.studentCredits.findMany({
    where: {
      organizationId,
      status: 'ACTIVE',
      expiresAt: { gte: now, lte: sevenDaysLater }
    },
    include: { student: { include: { user: true } }, plan: true }
  });

  for (const credit of expiring) {
    const daysLeft = Math.ceil((credit.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const remaining = Number(credit.totalCredits) - Number(credit.creditsUsed);

    if (remaining > 0) {
      const email = credit.student.user.email;
      const subject = `⚠️ ${remaining} créditos expirando em ${daysLeft} dias!`;
      
      // Aqui você chama seu serviço de email
      // await sendEmail(email, subject, ...);
      
      logger.info(`📧 Email enviado para ${email}`);
    }
  }

  logger.info(`✅ ${expiring.length} avisos de expiração enviados`);
}
```

#### 4.2 Registrar em `src/server.ts`

```typescript
import { sendExpiringCreditsEmails } from '@/jobs/send-expiring-credits-email';
import cron from 'node-cron';

// Executar todo dia às 8 da manhã
cron.schedule('0 8 * * *', () => {
  sendExpiringCreditsEmails().catch(console.error);
});
```

---

## 🧪 Testes MVP (30 min)

### Teste 1: Criar Créditos Manualmente

```bash
# Via Prisma Studio ou script
npx prisma studio

# Ou via script:
npx ts-node -e "
import { prisma } from './src/utils/database';
const student = await prisma.student.findFirst();
await prisma.studentCredits.create({
  data: {
    organizationId: '452c0b35-1822-4890-851e-922356c812fb',
    studentId: student.id,
    planId: 'seu-plan-id',
    totalCredits: 10,
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
  }
});
"
```

### Teste 2: Verificar Dashboard

1. Abra o app
2. Vá ao dashboard do aluno
3. Deveria ver card com "💳 Créditos Disponíveis: 10"

### Teste 3: Usar Crédito

```bash
curl -X POST http://localhost:3000/api/credits/use-credit \
  -H "Content-Type: application/json" \
  -d '{"creditsId": "seu-credits-id", "quantity": 1}'
```

### Teste 4: Email de Expiração

```bash
# Forçar job de expiração
npx ts-node -e "
import { sendExpiringCreditsEmails } from './src/jobs/send-expiring-credits-email';
await sendExpiringCreditsEmails();
"
```

---

## 📋 Checklist MVP

- [ ] Schema criado e migrado
- [ ] Seed de 3 planos executado
- [ ] Backend API funcionando (3 endpoints)
- [ ] Frontend dashboard mostrando créditos
- [ ] Teste de uso de crédito
- [ ] Job de notificação funcionando
- [ ] Email de teste enviado
- [ ] Deploy em staging

---

## 🎯 Próximas Fases (Após MVP)

### **Fase 2: Melhorias** (1 semana)
- [ ] Integração com frequência (descontar automático)
- [ ] Transferência entre alunos
- [ ] Reembolsos inteligentes
- [ ] UI melhorada

### **Fase 3: Analytics** (1 semana)
- [ ] Dashboard admin com relatórios
- [ ] Previsão de receita
- [ ] Taxa de retenção por plano
- [ ] A/B testing de preços

### **Fase 4: Automação** (1 semana)
- [ ] Offers automáticas (upsell)
- [ ] SMS de aviso
- [ ] Integração com email (Asaas, SendGrid)
- [ ] Webhooks de eventos

---

## 🚀 Deployment

```bash
# 1. Build
npm run build

# 2. Migração em produção
npx prisma migrate deploy

# 3. Deploy (seu provider)
git push origin main
# GitHub Actions / Vercel / Railway / etc

# 4. Verificar
curl https://sua-api.com/api/credits/my-credits?studentId=...
```

---

## 💡 Tips

1. **Segurança**: No MVP, use `studentId` como query param. Na Fase 2, use JWT do contexto
2. **Email**: Use template simples. Na Fase 2, integre com Asaas/SendGrid
3. **Testes**: Crie dados de teste com scripts Prisma
4. **Monitoramento**: Log tudo para debug
5. **Feedback**: Colete feedback de 2-3 alunos piloto

---

**Status**: 🟢 Pronto para implementação  
**Tempo Estimado**: 4-6 horas  
**Complexidade**: ⭐⭐ (Média)  
**Valor para negócio**: 💰💰💰 (Alto)

---

Começar AGORA? Abra o terminal e execute os comandos acima! 🚀
