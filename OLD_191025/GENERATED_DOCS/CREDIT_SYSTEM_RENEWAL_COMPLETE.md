# 🔄 SISTEMA DE RENOVAÇÃO AUTOMÁTICA DE CRÉDITOS

**Data**: 16 de outubro de 2025  
**Status**: ✅ SCHEMA COMPLETO + BANCO SINCRONIZADO  
**Adição**: Renovação automática de créditos

---

## 📋 O Que Foi Adicionado

### 1️⃣ Campos de Renovação em BillingPlan

```prisma
model BillingPlan {
  // ... campos existentes ...
  
  // Novos campos de renovação
  autoRenewCredits      Boolean?      @default(false) // Renovar após expiração?
  renewalIntervalDays   Int?          // A cada quantos dias? (30=mensal, 90=trimestral)
  maxAutoRenewals       Int?          // Máx renovações (null=ilimitado)
  autoRenewChargeMethod String?       // "SUBSCRIPTION" ou "SEPARATE"
}
```

| Campo | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| `autoRenewCredits` | Boolean | false | Ativa renovação automática? |
| `renewalIntervalDays` | Int | null | Dias entre renovações (30, 90, 365) |
| `maxAutoRenewals` | Int | null | Limite de renovações (null = ilimitado) |
| `autoRenewChargeMethod` | String | null | "SUBSCRIPTION" (cobrança mensal) ou "SEPARATE" (cobrança extra) |

---

### 2️⃣ Campos de Rastreamento em StudentCredit

```prisma
model StudentCredit {
  // ... campos existentes ...
  
  // Novos campos de renovação
  autoRenew            Boolean       @default(false)     // Este lote tem renovação ativa?
  renewalCount         Int           @default(0)         // Quantas vezes foi renovado?
  nextRenewalDate      DateTime?                         // Quando renovar próxima vez?
  previousCreditId     String?                           // ID do lote anterior
  renewalChargeId      String?                           // ID da cobrança da renovação
  
  // Relacionamentos
  previousCredit       StudentCredit? @relation("CreditRenewal", fields: [previousCreditId], ...)
  renewedCredits       StudentCredit[] @relation("CreditRenewal")
}
```

---

### 3️⃣ Novo Modelo: CreditRenewal

Rastreia **cada renovação** que ocorreu:

```prisma
model CreditRenewal {
  id                String     @id @default(uuid())
  organizationId    String
  studentId         String
  originalCreditId  String     // ID original do crédito
  renewedCreditId   String     // ID do novo lote criado
  renewalDate       DateTime   @default(now())
  renewalReason     String?    // "AUTO_RENEWAL", "MANUAL", "PROMOTION"
  chargedAmount     Decimal?   // Valor cobrado (null = sem cobrança)
  chargeMethod      String?    // "SUBSCRIPTION", "ADDITIONAL_CHARGE"
  chargeId          String?    // Referência ao Payment
  notes             String?
  createdAt         DateTime
  
  student           Student    @relation(fields: [studentId], references: [id])
  organization      Organization @relation("CreditRenewalOrganization", ...)
  
  @@index([studentId, renewalDate])
  @@map("credit_renewals")
}
```

---

## 💡 3 Modelos de Renovação

### Modelo 1: SEM RENOVAÇÃO (padrão)
```
Compra:       Pack 30 créditos em 01/01/2025
Validade:     90 dias (até 01/04/2025)
Expiração:    01/04/2025 → Créditos perdidos
Renovação:    ❌ NENHUMA (aluno precisa comprar novamente)
```

**Quando usar**: Planos one-time, trials, pacotes simples

---

### Modelo 2: RENOVAÇÃO COM COBRANÇA SEPARADA
```
Plano:        "Pack 30 Mensal" - R$ 600
Configuração: 
  - autoRenewCredits: true
  - renewalIntervalDays: 30
  - autoRenewChargeMethod: "SEPARATE"
  - maxAutoRenewals: null (ilimitado)

Timeline:
  01/01: Compra inicial → StudentCredit #1 (30 créditos)
  31/01: Expiração + Renovação automática
         ├─ Cobrança separada de R$ 600
         ├─ StudentCredit #2 criado (30 créditos novos)
         ├─ CreditRenewal registrado
         └─ previousCreditId: #1 → renewedCreditId: #2
  02/03: Próxima renovação...
         └─ Ciclo continua
```

**Quando usar**: Planos que renovam mensalmente (cartão de crédito)

---

### Modelo 3: RENOVAÇÃO SEM CUSTO ADICIONAL (com subscription)
```
Plano:        "Pack 30 Mensal" - R$ 600
Configuração:
  - autoRenewCredits: true
  - renewalIntervalDays: 30
  - autoRenewChargeMethod: "SUBSCRIPTION"
  - maxAutoRenewals: null

Timeline:
  01/01: Compra subscription + créditos
         ├─ StudentSubscription criada (ativa, R$ 600/mês)
         └─ StudentCredit #1 (30 créditos, válido 30 dias)
  
  31/01: Renovação automática (SEM cobrança extra)
         ├─ Cobrança vai para subscription existente
         ├─ StudentCredit #2 criado automaticamente
         └─ CreditRenewal registrado (chargedAmount: null)
  
  02/03: Próxima renovação (ciclo continua)
```

**Quando usar**: Planos mensais onde subscription já cobre tudo

---

### Modelo 4: RENOVAÇÃO COM LIMITE
```
Plano:        "Pack 30 Trial" - R$ 210
Configuração:
  - autoRenewCredits: true
  - renewalIntervalDays: 30
  - autoRenewChargeMethod: "SEPARATE"
  - maxAutoRenewals: 3 (máximo 3 renovações)

Timeline:
  01/01: Compra inicial → StudentCredit #1
  01/02: Renovação 1/3 → StudentCredit #2
  01/03: Renovação 2/3 → StudentCredit #3
  01/04: Renovação 3/3 → StudentCredit #4
  01/05: EXPIRAÇÃO PERMANENTE (maxAutoRenewals atingido)
         ├─ Aluno recebe aviso
         ├─ Status: EXPIRED
         └─ Sem mais renovações automáticas
```

**Quando usar**: Trials com limite de tempo, promoções

---

## 🔄 Fluxo de Renovação Automática

```
┌─────────────────────────────────────────────────────────────────────┐
│                      CRON JOB DIÁRIO                                │
│              (src/jobs/creditRenewalJob.ts)                        │
└─────────────────────────────────────────────────────────────────────┘

Execução: Todos os dias às 00:00 (meia-noite)

1️⃣ BUSCAR CRÉDITOS PARA RENOVAR
   SELECT * FROM student_credits
   WHERE status = 'ACTIVE'
     AND auto_renew = true
     AND next_renewal_date <= NOW()

2️⃣ VALIDAR LIMITE DE RENOVAÇÕES
   IF renewalCount >= maxAutoRenewals
     → PARAR (limite atingido)
   
3️⃣ PROCESSAR PAGAMENTO
   IF chargeMethod = "SEPARATE"
     → POST /api/charges (Asaas)
       └─ Cobrança adicional de R$ XXX
   
   IF chargeMethod = "SUBSCRIPTION"
     → Nenhuma cobrança (já é subscription)

4️⃣ CRIAR NOVO LOTE DE CRÉDITOS
   StudentCredit.create({
     studentId,
     planId,
     totalCredits: originalCredit.totalCredits,
     creditsAvailable: originalCredit.totalCredits,
     creditType: originalCredit.creditType,
     purchasedAt: NOW(),
     expiresAt: NOW() + renewalIntervalDays,
     status: "ACTIVE",
     autoRenew: true,
     renewalCount: 0,
     nextRenewalDate: NOW() + renewalIntervalDays,
     previousCreditId: originalCredit.id
   })

5️⃣ REGISTRAR RENOVAÇÃO
   CreditRenewal.create({
     originalCreditId: old.id,
     renewedCreditId: new.id,
     renewalReason: "AUTO_RENEWAL",
     chargedAmount: payment?.amount,
     chargeMethod: chargeMethod,
     chargeId: payment?.id
   })

6️⃣ ENVIAR NOTIFICAÇÃO
   Email ao aluno:
   ├─ Créditos renovados com sucesso ✅
   ├─ Novo saldo: 30 aulas
   ├─ Nova validade: XX dias
   └─ Link para gerenciar renovação
```

---

## 💰 Exemplos Financeiros

### Exemplo 1: Plano Mensal (SUBSCRIPTION)
```
Cliente: João Silva
Plano: "Pack 30 Mensal"
Preço: R$ 600/mês

MÊS 1 (Jan 1-31):
  - Cobrança subscription: R$ 600
  - StudentCredit #1: 30 aulas (válido 30 dias)
  - Consumo: 10 aulas
  - Saldo: 20 aulas

MÊS 2 (Feb 1):
  - Renovação automática (sem cobrança extra!)
  - StudentCredit #2: 30 aulas (válido 30 dias)
  - Saldo anterior perdido: 20 aulas (não renovam)
  - Novo saldo: 30 aulas
  - Cobrança subscription: R$ 600 (junto com subscription)

FATURAMENTO:
  Jan: R$ 600 (1 subscription)
  Feb: R$ 600 (1 subscription)
  Total: R$ 1.200 (previsível e automático)
```

### Exemplo 2: Plano Avulso com Renovação (SEPARATE)
```
Cliente: Maria Santos
Plano: "Pack 20 Trimestral Renovável"
Preço: R$ 450/trimestre
Renovação: Cada 90 dias

TRIMESTRE 1 (Jan 1 - Mar 31):
  - Cobrança: R$ 450
  - StudentCredit #1: 20 aulas (válido 90 dias)
  - Consumo: 15 aulas
  - Saldo restante: 5 aulas

TRIMESTRE 2 (Apr 1):
  - Renovação automática
  - Cobrança EXTRA: R$ 450
  - StudentCredit #2: 20 aulas (válido 90 dias)
  - Saldo anterior PERDIDO: 5 aulas
  - Novo saldo: 20 aulas
  
FATURAMENTO:
  Trimestre 1: R$ 450
  Trimestre 2: R$ 450
  Total: R$ 900 (cada trimestre)
```

### Exemplo 3: Plano com Limite (TRIAL)
```
Cliente: Lucas Novak (novo)
Plano: "Pack 10 Trial com 1 Renovação"
Preço: R$ 140 (50% desconto)
Renovação: Máximo 1 vez

MESES 1-2:
  - Cobrança inicial: R$ 140
  - StudentCredit #1: 10 aulas (válido 60 dias)
  - Consumo: 5 aulas
  - Saldo: 5 aulas

MESES 3-4:
  - Renovação automática (1/1)
  - Cobrança: R$ 140
  - StudentCredit #2: 10 aulas
  - Novo saldo: 10 aulas
  
MESES 5+:
  - ❌ SEM RENOVAÇÃO (limite atingido)
  - Status: EXPIRED
  - Email: "Seu plano trial expirou. Upgrade para plano mensal?"
  - Upsell para subscription

FATURAMENTO:
  Trial: R$ 280 (2 meses)
  Depois: Espera upgrade para subscription
```

---

## 🛠️ Implementação Backend

### TypeScript - Modelo de Renovação
```typescript
interface CreditRenewalConfig {
  autoRenew: boolean;              // Ativar renovação?
  renewalIntervalDays: number;     // A cada quantos dias?
  maxAutoRenewals: number | null;  // Máximo renovações (null = ilimitado)
  chargeMethod: 'SUBSCRIPTION' | 'SEPARATE'; // Como cobrar?
}

interface CreditRenewalPayload {
  studentId: string;
  creditId: string;
  planId: string;
  chargeMethod: 'SUBSCRIPTION' | 'SEPARATE';
  chargedAmount?: number;
}

// Função de renovação
async function renewStudentCredits(payload: CreditRenewalPayload) {
  // 1. Validar limite
  const credit = await prisma.studentCredit.findUnique({
    where: { id: payload.creditId }
  });
  
  if (credit.renewalCount >= billing_plan.maxAutoRenewals) {
    return { success: false, reason: 'max_renewals_reached' };
  }
  
  // 2. Processar pagamento
  if (payload.chargeMethod === 'SEPARATE') {
    const charge = await asaas.createCharge({
      customerId: student.asaasCustomerId,
      amount: billing_plan.price,
      ...
    });
    payload.chargedAmount = charge.amount;
  }
  
  // 3. Criar novo lote de créditos
  const newCredit = await prisma.studentCredit.create({
    data: {
      studentId: payload.studentId,
      planId: payload.planId,
      totalCredits: credit.totalCredits,
      creditsAvailable: credit.totalCredits,
      creditType: credit.creditType,
      autoRenew: true,
      renewalCount: 0,
      expiresAt: addDays(today(), billing_plan.renewalIntervalDays),
      nextRenewalDate: addDays(today(), billing_plan.renewalIntervalDays),
      previousCreditId: credit.id,
      ...
    }
  });
  
  // 4. Registrar renovação
  await prisma.creditRenewal.create({
    data: {
      studentId: payload.studentId,
      originalCreditId: credit.id,
      renewedCreditId: newCredit.id,
      chargedAmount: payload.chargedAmount,
      chargeMethod: payload.chargeMethod,
      chargeId: charge?.id,
      renewalReason: 'AUTO_RENEWAL',
      ...
    }
  });
  
  return { success: true, newCreditId: newCredit.id };
}
```

### Node-Cron Job
```typescript
// src/jobs/creditRenewalJob.ts
import cron from 'node-cron';
import { prisma } from '@/utils/database';

export function scheduleCreditRenewalJob() {
  // Executa todos os dias à meia-noite
  cron.schedule('0 0 * * *', async () => {
    try {
      const expiringCredits = await prisma.studentCredit.findMany({
        where: {
          status: 'ACTIVE',
          autoRenew: true,
          nextRenewalDate: {
            lte: new Date()
          }
        },
        include: {
          student: { include: { organization: true } },
          plan: true
        }
      });
      
      for (const credit of expiringCredits) {
        await renewStudentCredits({
          studentId: credit.studentId,
          creditId: credit.id,
          planId: credit.planId,
          chargeMethod: credit.plan.autoRenewChargeMethod
        });
      }
      
      logger.info(`✅ Renovação de créditos: ${expiringCredits.length} processadas`);
    } catch (error) {
      logger.error('❌ Erro em creditRenewalJob:', error);
    }
  });
}
```

---

## 📊 Queries SQL Úteis

### Ver Créditos com Renovação Ativa
```sql
SELECT 
  s.id,
  s.user_id,
  sc.total_credits,
  sc.auto_renew,
  sc.renewal_count,
  sc.next_renewal_date,
  bp.renewal_interval_days,
  bp.max_auto_renewals
FROM student_credits sc
JOIN students s ON sc.student_id = s.id
JOIN billing_plans bp ON sc.plan_id = bp.id
WHERE sc.auto_renew = true
  AND sc.status = 'ACTIVE'
ORDER BY sc.next_renewal_date ASC;
```

### Histórico de Renovações de um Aluno
```sql
SELECT 
  cr.renewal_date,
  cr.renewal_reason,
  cr.charged_amount,
  cr.charge_method,
  sc1.total_credits as credits_originais,
  sc2.total_credits as credits_novos
FROM credit_renewals cr
JOIN student_credits sc1 ON cr.original_credit_id = sc1.id
JOIN student_credits sc2 ON cr.renewed_credit_id = sc2.id
WHERE cr.student_id = 'xxx-student-id'
ORDER BY cr.renewal_date DESC;
```

### Créditos que Expiram nos Próximos 7 Dias
```sql
SELECT 
  sc.student_id,
  s.user_id,
  sc.total_credits,
  sc.credits_available,
  sc.expires_at,
  sc.auto_renew,
  (sc.expires_at - NOW()) as dias_faltando
FROM student_credits sc
JOIN students s ON sc.student_id = s.id
WHERE sc.status = 'ACTIVE'
  AND sc.expires_at IS NOT NULL
  AND sc.expires_at BETWEEN NOW() AND NOW() + INTERVAL '7 days'
ORDER BY sc.expires_at ASC;
```

---

## 🎯 Checklist de Implementação

Quando implementar renovação automática:

- [ ] Adicionar campos de renovação ao BillingPlan
- [ ] Adicionar campos a StudentCredit para rastrear renovações
- [ ] Criar modelo CreditRenewal
- [ ] Criar job cron para renovação diária
- [ ] Implementar lógica de validação (limite, pagamento)
- [ ] Integração com Asaas para cobrança
- [ ] Email de confirmação de renovação
- [ ] Dashboard mostrando próxima renovação
- [ ] Endpoint para aluno cancelar renovação automática
- [ ] Endpoint para gerenciar renovação
- [ ] Logs de auditoria completos
- [ ] Testes E2E do fluxo completo

---

## 🚀 Próximas Fases

**Fase 1** (HOJE - Completo):
- ✅ Schema com suporte de renovação
- ✅ Modelos StudentCredit, CreditRenewal

**Fase 2** (Task 17 - Seed):
- ⏳ Criar planos com/sem renovação ativa
- ⏳ Exemplos de cada modelo

**Fase 3** (Task 18 - Backend API):
- ⏳ Endpoints GET, POST, PATCH renovações
- ⏳ Integração Asaas
- ⏳ Cron job

**Fase 4** (Task 19 - Frontend):
- ⏳ Dashboard mostrando próxima renovação
- ⏳ Botão "Cancelar renovação"
- ⏳ Histórico de renovações

**Fase 5** (Task 20 - Notificações):
- ⏳ Email de renovação bem-sucedida
- ⏳ Email de erro de cobrança
- ⏳ Aviso de cancelamento

---

## 📚 Documentação Criada

**CREDIT_SYSTEM_RENEWAL_COMPLETE.md** (este arquivo)
- ✅ 3 modelos de renovação
- ✅ Fluxo técnico detalhado
- ✅ Exemplos financeiros
- ✅ Código TypeScript
- ✅ SQL queries

---

**Status**: 🟢 **SCHEMA ATUALIZADO + BANCO SINCRONIZADO**

Próximo: Task 17 - Seed de Planos com Renovação ⏭️
