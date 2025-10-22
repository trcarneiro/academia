# 🚀 CREDIT SYSTEM - ROADMAP VISUAL

**Data**: 16 de outubro de 2025  
**Status Geral**: 🟢 **25% COMPLETO** (1 de 5 passos)

---

## 📊 Progresso por Fase

```
┌─────────────────────────────────────────────────────────────────────┐
│ IMPLEMENTAÇÃO DO SISTEMA DE CRÉDITOS - ACADEMIA KRAV MAGA           │
└─────────────────────────────────────────────────────────────────────┘

🟢 PASSO 1: SCHEMA PRISMA ████████████████████░░░░░░░░░░░░░░░░░░░░░░ 100%
   ✅ Enums criados (PlanType, CreditType)
   ✅ Campos BillingPlan adicionados (+11 campos)
   ✅ StudentCredit model criado
   ✅ CreditUsage model criado
   ✅ Banco sincronizado (db push)
   ⏳ Prisma Client (aguardando regeneração)
   
   Tempo: 30 min | Documentação: CREDIT_SYSTEM_STEP1_COMPLETE.md

🟡 PASSO 2: SEED DE PLANOS ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%
   ⏳ Script seed-credit-plans.ts
   ⏳ 8 planos principais
   ⏳ Validações
   
   Tempo EST: 1 hora | Início: APÓS Task 16

🟡 PASSO 3: BACKEND API ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%
   ⏳ GET /api/credits/student/:id
   ⏳ POST /api/credits/use
   ⏳ POST /api/credits/refund
   ⏳ GET /api/credits/expiring-soon
   ⏳ Documentação Swagger
   
   Tempo EST: 2-3 horas | Início: APÓS Task 17

🟡 PASSO 4: FRONTEND DASHBOARD ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%
   ⏳ Módulo créditos (vanilla JS)
   ⏳ Card de saldo com progresso
   ⏳ Lista de créditos
   ⏳ Botão "Comprar Mais"
   
   Tempo EST: 2 horas | Início: APÓS Task 18

🟡 PASSO 5: NOTIFICAÇÕES ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%
   ⏳ Cron job de expiração
   ⏳ Alertas -30, -7, -1 dias
   ⏳ Emails automáticos
   
   Tempo EST: 1 hora | Início: APÓS Task 19

───────────────────────────────────────────────────────────────────────
TOTAL: ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 20% completo
TEMPO TOTAL ESTIMADO: 6-8 horas (1 dia de trabalho concentrado)
```

---

## 🎯 Os 8 Planos em Detalhes

| # | Plano | Preço | Créditos | Validade | Desconto | Uso |
|---|-------|-------|----------|----------|----------|-----|
| 1 | 🎫 Aula Avulsa | R$ 40 | 1 | 30d | - | Flex |
| 2 | 📦 Pack 10 | R$ 250 | 10 | 90d | 37% | Popular |
| 3 | 📦 Pack 20 | R$ 450 | 20 | 180d | 44% | Popular |
| 4 | 📦 Pack 30 | R$ 600 | 30 | 365d | 50% | Fidelidade |
| 5 | 🎁 Trial 30% | R$ 210 | 12 | 30d | 30% | Novos |
| 6 | 💪 Personal 5h | R$ 900 | 5h | 90d | - | Upsell |
| 7 | 🎯 Combo | R$ 550 | 10+2h | 90d | 35% | Cross-sell |
| 8 | 🏢 Corporativo | R$ 2.500 | 50 | 30d ♻️ | - | Empresas |

---

## 💡 Arquitetura do Sistema

```
┌────────────────────────────────────────────────────────────────────┐
│                      STUDENT/ALUNO                                 │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ├─→ StudentSubscription (Plano atual)
                              │   └─→ BillingPlan (Qual plano contratou)
                              │
                              ├─→ StudentCredit[] (Créditos disponíveis)
                              │   ├─ totalCredits: 30
                              │   ├─ creditsUsed: 5
                              │   ├─ creditsAvailable: 25
                              │   ├─ expiresAt: 2025-01-16 (90 dias)
                              │   └─ status: ACTIVE
                              │
                              └─→ CreditUsage[] (Histórico de consumo)
                                  ├─ used_at: 2025-01-01 (aula 1)
                                  ├─ used_at: 2025-01-05 (aula 2)
                                  └─ used_at: 2025-01-10 (aula 3)

┌────────────────────────────────────────────────────────────────────┐
│                    ATTENDANCE/FREQUÊNCIA                           │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ├─→ status: PRESENT
                              ├─→ checkInTime: 2025-01-15 18:30
                              │
                              └─→ creditUsages[] (Créditos usados nesta aula)
                                  └─ Referência para audit trail completo

┌────────────────────────────────────────────────────────────────────┐
│                    BILLING PLAN/PLANO                              │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ├─ planType: CREDIT_PACK
                              ├─ creditQuantity: 30
                              ├─ creditValidityDays: 180
                              ├─ price: 600.00
                              │
                              ├─ allowTransfer: true (podem transferir)
                              ├─ transferFeePercent: 3.0 (taxa 3%)
                              │
                              ├─ allowRefund: true (permitem reembolso)
                              ├─ refundDaysBeforeExp: 7 (até 7 dias antes)
                              │
                              └─ bulkDiscountTiers: [{qty: 20, discount: 5}]
                                 (Descontos progressivos na compra)
```

---

## 📈 Fluxo de Uso de Créditos

```
SEQUÊNCIA TEMPORAL
──────────────────────────────────────────────────────────────────────

[2025-01-01] COMPRA
   Aluno compra "Pack 30" (R$ 600, 30 aulas, 180 dias)
   ├─ StudentCredit criado
   │  └─ totalCredits: 30
   │     creditsUsed: 0
   │     expiresAt: 2025-07-01 (180 dias)
   └─ status: ACTIVE

[2025-01-10] PRIMEIRA AULA
   Check-in na aula
   ├─ Attendance criado (status: PRESENT)
   └─ CreditUsage criado
      └─ creditsUsed: 1
         description: "Aula do dia 2025-01-10"

[2025-01-15] SALDO ATUAL
   StudentCredit atualizado
   ├─ totalCredits: 30 (imutável)
   ├─ creditsUsed: 2
   ├─ creditsAvailable: 28
   ├─ expiresAt: 2025-07-01
   └─ remainingDays: 167

[2025-06-24] ALERTA -7 DIAS
   Cron job detecta expiração próxima
   ├─ Email enviado: "Seus créditos expiram em 7 dias!"
   ├─ Sugestão de compra
   └─ Saldo atual mostrado

[2025-06-30] ALERTA -1 DIA
   Último alerta antes de expiração
   └─ Email: "ÚLTIMA CHANCE! Seus créditos expiram amanhã!"

[2025-07-01] EXPIRAÇÃO
   ├─ StudentCredit status: EXPIRED
   ├─ creditsAvailable: 0
   ├─ Email: "Seus créditos expiraram"
   └─ Dashboard mostra aviso vermelho

[2025-07-05] REEMBOLSO
   Aluno pede reembolso com sucesso (até 7 dias após expiração)
   ├─ StudentCredit status: REFUNDED
   ├─ refundAmount: R$ 200 (67% × creditsAvailable)
   └─ Payment criado com refund
```

---

## 🔄 Ciclo de Vida de um Crédito

```
    ┌──────────────────┐
    │  DISPONÍVEL      │  (Crédito ativo, pronto para usar)
    │ ACTIVE/AVAILABLE │
    └────────┬─────────┘
             │
             ├─ [Usar em aula]
             │      ↓
             │  ┌──────────────────┐
             │  │ EM CONSUMO       │  (Crédito sendo gasto)
             │  │ BEING_USED       │
             │  └────────┬─────────┘
             │           │
             │           ├─ [Check-in bem-sucedido]
             │           │      ↓
             │           │  ┌──────────────────┐
             │           │  │ CONSUMIDO        │  (Crédito já usado)
             │           │  │ CONSUMED         │
             │           │  └──────────────────┘
             │           │
             │           └─ [Erro/Cancelamento]
             │                  ↓
             │              [Retorna para AVAILABLE]
             │
             ├─ [Transferir para outro aluno]
             │      ↓
             │  ┌──────────────────┐
             │  │ TRANSFERIDO      │  (Novo StudentCredit criado)
             │  │ TRANSFERRED      │  (Original marcado TRANSFERRED)
             │  └──────────────────┘
             │
             └─ [Expirar por data]
                    ↓
                ┌──────────────────┐
                │ EXPIRADO         │  (Depois de expiresAt)
                │ EXPIRED          │
                └────────┬─────────┘
                         │
                         ├─ [Solicitar reembolso no prazo]
                         │      ↓
                         │  ┌──────────────────┐
                         │  │ REEMBOLSADO      │  (Refund processado)
                         │  │ REFUNDED         │
                         │  └──────────────────┘
                         │
                         └─ [Fora do prazo]
                                ↓
                            [Perdido/Finalizado]
```

---

## 🛠️ Stack Técnico

| Camada | Tecnologia | Arquivos |
|--------|-----------|----------|
| **Database** | PostgreSQL + Prisma | `prisma/schema.prisma` |
| **Backend** | Fastify + TypeScript | `src/routes/credits.ts` |
| **Frontend** | Vanilla JS + CSS | `public/js/modules/credits/` |
| **Jobs** | node-cron | `src/jobs/creditExpirationJob.ts` |
| **Email** | NodeMailer | `src/services/emailService.ts` |

---

## 💰 Impacto Financeiro Esperado

### Mês 1: Estrutura Básica
- 3-5 planos ativos
- +5% de receita (alunos testando)
- ~2-3 compras de créditos adicionais

### Mês 2: Crescimento
- 8 planos ativos
- +15% de receita
- ~10-15 compras adicionais
- Redução de churn por trial conversão

### Mês 3: Maturação
- Sistema otimizado
- +30-50% de receita
- 40% dos alunos com crédito adicional
- ROI positivo em 2.5 meses

### Ano 1: Full Impact
- +94% de receita total
- Modelo híbrido consolidado
- Planos corporativos gerando receita recorrente

---

## 🎯 Próximas Ações

### ✅ HOJE (Completado)
```
[✓] Passo 1: Schema Prisma
    └─ 30 minutos
    └─ 2 novos enums, 11 campos, 2 modelos
```

### 🔄 PRÓXIMAS 24 HORAS
```
[ ] Passo 2: Seed de Planos
    └─ 1 hora
    └─ 8 planos principais na demo org
    
[ ] Passo 3: Backend API
    └─ 2-3 horas
    └─ 5 endpoints principais
    
[ ] Passo 4: Frontend
    └─ 2 horas
    └─ Dashboard + compra de créditos
    
[ ] Passo 5: Jobs & Notificações
    └─ 1 hora
    └─ Cron de expiração + emails
```

### 📅 SEMANA 2
```
[ ] Testes unitários (backend)
[ ] Testes E2E (fluxo completo)
[ ] Performance & optimization
[ ] Documentação de usuário
[ ] Deploy staging
```

### 🚀 SEMANA 3
```
[ ] Feedback de usuários
[ ] Ajustes baseado em feedback
[ ] Treinamento da equipe
[ ] Deploy produção
[ ] Monitoramento inicial
```

---

## 📊 Checklist de Conclusão

- [x] Documentação de arquitetura
- [x] Schema Prisma criado
- [x] Banco sincronizado
- [x] Roadmap visual
- [ ] Seed de dados
- [ ] Backend API
- [ ] Frontend dashboard
- [ ] Jobs automáticos
- [ ] Testes unitários
- [ ] Documentação completa
- [ ] Deploy produção

---

## 🎯 KPIs para Acompanhar

| KPI | Meta Mês 1 | Meta Mês 3 |
|-----|-----------|-----------|
| Planos ativos | 3-5 | 8 |
| Créditos vendidos | 50-100 | 500+ |
| Receita adicional | +5% | +50% |
| Taxa de conversão | 10% | 40% |
| Churn reduzido | 5% | 20% |
| Ticket médio | +R$ 100 | +R$ 500 |

---

**Status**: 🟢 **1/5 PASSOS COMPLETOS - PRONTO PARA TASK 17**

Próximo comando: Iniciar Task 2 (Seed de Planos) ⏭️
