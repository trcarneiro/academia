# 🎯 Credit Renewal System - Tipos de Renovação

**Data**: 16 de outubro de 2025  
**Status**: ✅ **COMPLETO**  
**Adição**: Enums `CreditRenewalTrigger` e `CreditRenewalMethod` ao schema Prisma  

---

## 📋 Resumo

Adicionado sistema completo de **COMO** renovar créditos de um plano:

### ✅ Novas Opções

1. **Gatilho (When)** - `CreditRenewalTrigger`
   - `MONTHLY` - Renova automaticamente toda semana/mês
   - `ON_CONSUMPTION` - Renova quando créditos acabam (vão para zero)
   - `MANUAL` - Apenas instrutor renova manualmente

2. **Método de Cobrança (How)** - `CreditRenewalMethod`
   - `INCLUDED` - Sem cobrança extra (incluído na assinatura)
   - `SEPARATE` - Cobrança adicional por renovação
   - `SUBSCRIPTION` - Usa assinatura existente

---

## 🔄 Fluxos de Renovação Suportados

### **Cenário 1: Renovação Mensal Automática (INCLUDED)**
```
Plan: "Pack Mensal com Créditos"
├─ creditRenewalTrigger: MONTHLY
├─ creditRenewalMethod: INCLUDED
├─ renewalIntervalDays: 30
└─ maxAutoRenewals: null (ilimitado)

Fluxo:
  Dia 1: Aluno recebe 10 créditos (R$ 0 - incluído na assinatura)
  Dia 31: Renovação automática → 10 créditos novos
  Dia 61: Renovação automática → 10 créditos novos
  ... (contínuo enquanto assinatura ativa)

Cobrança: Única cobrança mensal (R$ 149,90)
```

### **Cenário 2: Renovação por Consumo (SEPARATE)**
```
Plan: "Pack de Créditos - Pague por Uso"
├─ creditRenewalTrigger: ON_CONSUMPTION
├─ creditRenewalMethod: SEPARATE
├─ creditQuantity: 10
└─ price: 49,90

Fluxo:
  Compra 1: Paga R$ 49,90 → 10 créditos
  Usa 10 créditos em 5 aulas (2 por aula)
  Créditos zerados → DISPARA RENOVAÇÃO
  Compra 2: Aluno recebe notificação + cobrança automática Asaas
  Paga R$ 49,90 novamente → 10 créditos novos

Cobrança: R$ 49,90 por cada pack consumido
```

### **Cenário 3: Renovação Manual (MANUAL)**
```
Plan: "Aula Avulsa"
├─ creditRenewalTrigger: MANUAL
├─ creditRenewalMethod: SEPARATE
├─ creditQuantity: 1
└─ price: 35,00

Fluxo:
  Aluno quer fazer uma aula → Clica "Comprar 1 Aula"
  Paga R$ 35,00 → 1 crédito
  Faz a aula e consome 1 crédito
  Se quer fazer outra → Compra novamente (manual)

Cobrança: R$ 35,00 por aula (on-demand)
```

### **Cenário 4: Renovação Trimestral (INCLUDED)**
```
Plan: "Plano Trimestral + 30 Créditos"
├─ creditRenewalTrigger: MONTHLY
├─ creditRenewalMethod: INCLUDED
├─ renewalIntervalDays: 90
├─ maxAutoRenewals: 4 (máx 1 ano)
└─ price: 289,90

Fluxo:
  Trimestre 1: Paga R$ 289,90 → 30 créditos + aulas ilimitadas
  Trimestre 2: Renovação automática → 30 créditos novos
  Trimestre 3: Renovação automática → 30 créditos novos
  Trimestre 4: Renovação automática → 30 créditos novos
  Trimestre 5: Atinge maxAutoRenewals=4 → PARA de renovar
             → Aluno precisa comprar novo plano

Cobrança: R$ 289,90 a cada 90 dias (máximo 4x)
```

---

## 📊 Tabela de Combinações

| Trigger | Method | Melhor Para | Exemplo |
|---------|--------|------------|---------|
| `MONTHLY` | `INCLUDED` | Assinatura com créditos grátis | Plano Premium mensal |
| `MONTHLY` | `SEPARATE` | ❌ Não recomendado (confuso) | - |
| `ON_CONSUMPTION` | `INCLUDED` | ❌ Não faz sentido | - |
| `ON_CONSUMPTION` | `SEPARATE` | Pack consumível com recarga automática | Pay-as-you-go |
| `MANUAL` | `INCLUDED` | ❌ Não faz sentido | - |
| `MANUAL` | `SEPARATE` | Aula avulsa manual | Aula individual |

---

## 💾 Schema Prisma Atualizado

```prisma
model BillingPlan {
  // ... campos existentes ...
  
  // Renovação de créditos
  autoRenewCredits        Boolean?              @default(false)
  renewalIntervalDays     Int?
  maxAutoRenewals         Int?
  creditRenewalTrigger    CreditRenewalTrigger? @default(MONTHLY)
  creditRenewalMethod     CreditRenewalMethod?  @default(INCLUDED)
  autoRenewChargeMethod   String? // Legacy
}

enum CreditRenewalTrigger {
  MONTHLY          // Renova automaticamente a cada mês
  ON_CONSUMPTION   // Renova quando créditos = 0
  MANUAL           // Renovação manual apenas
}

enum CreditRenewalMethod {
  INCLUDED         // Incluso na assinatura (sem $ extra)
  SEPARATE         // Cobrança separada/adicional
  SUBSCRIPTION     // Usa assinatura existente
}
```

---

## 🛠️ Exemplo de Seed (Próximo Passo)

```javascript
// scripts/seed-credit-plans.ts

const plans = [
  {
    name: "Pack Mensal",
    creditQuantity: 20,
    creditRenewalTrigger: "MONTHLY",      // Cada mês
    creditRenewalMethod: "INCLUDED",      // Sem cobrança extra
    renewalIntervalDays: 30,
    price: 149.90,
  },
  {
    name: "Aula Avulsa",
    creditQuantity: 1,
    creditRenewalTrigger: "MANUAL",       // Manual só
    creditRenewalMethod: "SEPARATE",      // Cobrança por aula
    price: 35.00,
  },
  {
    name: "Pack Consumível",
    creditQuantity: 10,
    creditRenewalTrigger: "ON_CONSUMPTION", // Quando acabar
    creditRenewalMethod: "SEPARATE",        // Cobra cada pack
    price: 49.90,
  },
];
```

---

## ✅ Verificação de Implementação

- ✅ Enum `CreditRenewalTrigger` adicionado com 3 valores
- ✅ Enum `CreditRenewalMethod` adicionado com 3 valores
- ✅ Campos adicionados ao modelo `BillingPlan`
- ✅ Banco de dados sincronizado (`Done in 7.46s`)
- ✅ TypeScript compilando sem erros
- ✅ Prisma Client regenerado

---

## 🚀 Próximos Passos

1. **Criar seed de planos** (Task 18) com estas opções
2. **Frontend** - Adicionar dropdowns para escolher:
   - Gatilho de renovação (MONTHLY / ON_CONSUMPTION / MANUAL)
   - Método de cobrança (INCLUDED / SEPARATE / SUBSCRIPTION)
3. **Backend Logic** - Implementar renovação automática mensal via cron job
4. **Backend Logic** - Implementar renovação ao consumir via triggers

---

## 📝 Arquivos Modificados

**`prisma/schema.prisma`**:
- Linhas ~2010-2018: Novo enum `CreditRenewalTrigger`
- Linhas ~2020-2026: Novo enum `CreditRenewalMethod`
- Linhas ~1127-1133: Novos campos em `BillingPlan`

---

**Status**: ✅ **PRONTO PARA SEED** 🎉

