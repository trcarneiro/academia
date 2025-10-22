# 📚 Tipos de Renovação de Créditos - Visual Guide

## 🎯 Quick Reference

### **3 Formas de Renovar Créditos**

```
┌─────────────────────────────────────────────────────────────┐
│                    QUANDO RENOVAR?                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1️⃣  MONTHLY                                                │
│      └─ Autorenovação mensal (todo dia 1º ou data fixa)    │
│      └─ Melhor para: Assinatura mensal                     │
│                                                              │
│  2️⃣  ON_CONSUMPTION                                         │
│      └─ Renovação ao consumir todos os créditos (= 0)      │
│      └─ Melhor para: Pack "pay as you go"                  │
│                                                              │
│  3️⃣  MANUAL                                                 │
│      └─ Renovação manual (aluno clica "comprar")           │
│      └─ Melhor para: Aula avulsa                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    COMO COBRAR?                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  💳 INCLUDED                                                │
│      └─ Sem cobrança extra (incluso na assinatura)         │
│      └─ Aluno já paga, créditos são "brinde"              │
│                                                              │
│  💰 SEPARATE                                                │
│      └─ Cobrança separada cada renovação                   │
│      └─ Tipo: Asaas cobra R$ 49,90 por pack               │
│                                                              │
│  🔄 SUBSCRIPTION                                            │
│      └─ Usa a assinatura existente como pagamento          │
│      └─ Tipo: Se tem assinatura ativa, renova de graça     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📈 Exemplos Reais

### **Exemplo 1: Plano Premium (Mensal + Grátis)**
```
Tipo: MONTHLY + INCLUDED
├─ Preço: R$ 199,90/mês
├─ Créditos: 30 por mês
├─ Renovação: Dia 1º de cada mês (automática)
├─ Cobrança: Uma única cobrança mensal
└─ Fluxo:
    Dia 1: Aluno paga R$ 199,90 → recebe 30 créditos
    Dia 31: Renovação automática → 30 créditos novos
    Cobrança mensal contínua
```

### **Exemplo 2: Pack Consumível (Pay-as-you-go)**
```
Tipo: ON_CONSUMPTION + SEPARATE
├─ Preço: R$ 49,90 por pack
├─ Créditos: 10 por pack
├─ Renovação: Quando chegar a 0 créditos
├─ Cobrança: Cada vez que renovar
└─ Fluxo:
    Aluno compra 1º pack: R$ 49,90 → 10 créditos
    Usa 10 créditos (5 aulas de 2 créditos)
    Créditos = 0 → DISPARA RENOVAÇÃO
    Aluno recebe notificação
    Asaas cobra automaticamente R$ 49,90 novamente
    → Novos 10 créditos
```

### **Exemplo 3: Aula Avulsa (Manual)**
```
Tipo: MANUAL + SEPARATE
├─ Preço: R$ 35,00 por aula
├─ Créditos: 1 por aula
├─ Renovação: Manual (aluno clica "comprar")
├─ Cobrança: Sob demanda
└─ Fluxo:
    Aluno acessa: "Comprar Aula" → Paga R$ 35,00
    Recebe 1 crédito
    Faz a aula e usa 1 crédito
    Se quer mais → Clica "comprar" novamente
```

---

## 🔧 Como Usar no Seed (Próximo)

```typescript
// scripts/seed-credit-plans.ts

const creditPlans = [
  // Plan 1: Mensal com créditos (INCLUDED)
  {
    name: "Plano Premium",
    creditQuantity: 30,
    price: 199.90,
    creditRenewalTrigger: "MONTHLY",    // ← QUANDO
    creditRenewalMethod: "INCLUDED",    // ← COMO
    renewalIntervalDays: 30,
  },

  // Plan 2: Pack consumível (SEPARATE)
  {
    name: "10 Aulas Avulsas",
    creditQuantity: 10,
    price: 49.90,
    creditRenewalTrigger: "ON_CONSUMPTION",  // ← QUANDO
    creditRenewalMethod: "SEPARATE",        // ← COMO
  },

  // Plan 3: Aula por aula (MANUAL)
  {
    name: "Aula Individual",
    creditQuantity: 1,
    price: 35.00,
    creditRenewalTrigger: "MANUAL",         // ← QUANDO
    creditRenewalMethod: "SEPARATE",        // ← COMO
  },
];
```

---

## ✅ Verificação

Schema atualizado ✅
- [x] Enum `CreditRenewalTrigger` (MONTHLY, ON_CONSUMPTION, MANUAL)
- [x] Enum `CreditRenewalMethod` (INCLUDED, SEPARATE, SUBSCRIPTION)
- [x] Campos adicionados a BillingPlan
- [x] Database sincronizada
- [x] TypeScript compilando

Pronto para criar o seed! 🚀

