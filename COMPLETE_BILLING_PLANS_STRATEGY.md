# 💰 ESTRATÉGIA COMPLETA DE PLANOS - Academia Krav Maga v2.0

**Data**: 17 de outubro de 2025  
**Status**: ✅ **PLANEJAMENTO COMPLETO**  
**Total de Planos**: 15 planos (Personal + Kids + Adultos)  

---

## 📊 Visão Geral

```
┌─────────────────────────────────────────────────────────────────┐
│                    CATEGORIAS DE PLANOS                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  👤 PERSONAL (2 planos)                                         │
│     ├─ Aulas Agendadas (SEM reposição)                          │
│     └─ Aulas por Créditos (COM reposição automática)            │
│                                                                  │
│  👶 KIDS (4 planos)                                             │
│     ├─ Anual Ilimitado - R$ 249,90/mês                          │
│     ├─ Anual 2x/semana - R$ 199,90/mês                          │
│     ├─ Mensal Ilimitado - R$ 299,90/mês                         │
│     └─ Mensal 2x/semana - R$ 229,90/mês                         │
│                                                                  │
│  👨‍💼 ADULTOS SMART DEFENCE (2 planos)                            │
│     ├─ Anual Ilimitado - R$ 229,90/mês                          │
│     └─ Mensal Ilimitado - R$ 269,90/mês                         │
│                                                                  │
│  🔄 ADICIONAL (7 planos)                                        │
│     ├─ Pack Créditos - 10 créditos                              │
│     ├─ Pack Créditos - 20 créditos                              │
│     ├─ Pack Créditos - 30 créditos                              │
│     ├─ Trial 7 dias                                             │
│     ├─ Aula Avulsa                                              │
│     ├─ Combo Família                                            │
│     └─ Corporativo (multi-alunos)                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 1. PLANOS PERSONAL (Treinamento Personalizado)

### 💪 Plan 1: Aulas Agendadas (Horário Fixo)

**Descrição**: Horário fixo, sem direito a reposição de faltas/feriados

```json
{
  "name": "Personal - Aulas Agendadas 1x/semana",
  "description": "1 vez por semana. Horário fixo. Sem direito a reposição.",
  "billingType": "MONTHLY",
  "planType": "MONTHLY",
  "category": "ADULT",
  "price": 480.00,
  "classesPerWeek": 1,
  "maxClasses": 4,
  "duration": 60,
  "isUnlimitedAccess": false,
  "hasPersonalTraining": true,
  "creditsValidity": null,
  "features": {
    "description": "✔️ Horário fixo previamente combinado",
    "restrictions": [
      "❌ Sem direito à remarcação em caso de falta ou feriado",
      "❌ Reposição somente em pequenos grupos ou coletivas",
      "📅 Reagendamentos com 1 semana de antecedência"
    ]
  },
  "autoRenewCredits": true,
  "creditRenewalTrigger": "MONTHLY",
  "creditRenewalMethod": "INCLUDED",
  "renewalIntervalDays": 30,
  "maxAutoRenewals": null
}
```

**Combinações**:
- 1x/semana - R$ 480/mês
- 2x/semana - R$ 960/mês

---

### 🎯 Plan 2: Aulas por Créditos (Flexível)

**Descrição**: Pague apenas pelas aulas realizadas. Renovação automática ao consumir.

```json
{
  "name": "Personal - Aulas por Créditos 1x/semana",
  "description": "Pague apenas pelas aulas realizadas. Flexibilidade total.",
  "billingType": "CREDITS",
  "planType": "CREDIT_PACK",
  "category": "ADULT",
  "price": 600.00,
  "creditQuantity": 4,
  "creditType": "CLASS",
  "creditValidityDays": 60,
  "minCreditsPerClass": 1,
  "classesPerWeek": 1,
  "isUnlimitedAccess": false,
  "hasPersonalTraining": true,
  "features": {
    "description": "✔️ Pague apenas pelas aulas realizadas",
    "benefits": [
      "✔️ Flexibilidade total com agendamentos",
      "✔️ Cancelamento com até 24 horas de antecedência",
      "✔️ Renovação automática quando créditos acabam"
    ]
  },
  "autoRenewCredits": true,
  "creditRenewalTrigger": "ON_CONSUMPTION",
  "creditRenewalMethod": "SEPARATE",
  "allowRefund": true,
  "refundDaysBeforeExp": 7
}
```

**Combinações**:
- 1x/semana - R$ 600/mês
- 2x/semana - R$ 1.200/mês

---

## 👶 2. PLANOS KIDS (Crianças 4-13 anos)

### 🎉 Kids Plans - Faixa Etária

```
Kids 1 → 4 a 6 anos
Kids 2 → 7 a 10 anos
Kids 3 → 11 a 13 anos
```

### 📅 Plan 3: Kids Anual Ilimitado

```json
{
  "name": "Kids Smart Defence - Anual Ilimitado",
  "description": "Ilimitado (todas modalidades). Contrato anual com 5% desconto à vista.",
  "billingType": "MONTHLY",
  "planType": "MONTHLY",
  "category": "CHILD",
  "price": 249.90,
  "isUnlimitedAccess": true,
  "duration": 12,
  "isRecurring": true,
  "recurringInterval": 1,
  "features": {
    "modalidades": ["Krav Maga", "Jiu-Jitsu"],
    "faixasEtarias": ["Kids 1 (4-6)", "Kids 2 (7-10)", "Kids 3 (11-13)"]
  },
  "allowFreeze": true,
  "freezeMaxDays": 30,
  "bulkDiscountTiers": [
    { "qty": 1, "discount": 0 },
    { "qty": 2, "discount": 20 },
    { "qty": 3, "discount": 30 }
  ],
  "autoRenewCredits": false,
  "creditRenewalTrigger": "MONTHLY",
  "creditRenewalMethod": "INCLUDED"
}
```

### 📅 Plan 4: Kids Anual 2x/semana

```json
{
  "name": "Kids Smart Defence - Anual 2x/semana",
  "description": "2x por semana. Contrato anual.",
  "billingType": "MONTHLY",
  "planType": "MONTHLY",
  "category": "CHILD",
  "price": 199.90,
  "classesPerWeek": 2,
  "maxClasses": 8,
  "duration": 12,
  "isRecurring": true,
  "recurringInterval": 1,
  "features": {
    "modalidades": ["Krav Maga", "Jiu-Jitsu"],
    "faixasEtarias": ["Kids 1 (4-6)", "Kids 2 (7-10)", "Kids 3 (11-13)"]
  },
  "bulkDiscountTiers": [
    { "qty": 1, "discount": 0 },
    { "qty": 2, "discount": 20 },
    { "qty": 3, "discount": 30 }
  ]
}
```

### 📅 Plan 5: Kids Mensal Ilimitado

```json
{
  "name": "Kids Smart Defence - Mensal Ilimitado",
  "description": "Ilimitado (sem fidelidade). Sem contrato anual.",
  "billingType": "MONTHLY",
  "planType": "MONTHLY",
  "category": "CHILD",
  "price": 299.90,
  "isUnlimitedAccess": true,
  "duration": 1,
  "isRecurring": false,
  "features": {
    "modalidades": ["Krav Maga", "Jiu-Jitsu"],
    "faixasEtarias": ["Kids 1 (4-6)", "Kids 2 (7-10)", "Kids 3 (11-13)"]
  },
  "bulkDiscountTiers": [
    { "qty": 1, "discount": 0 },
    { "qty": 2, "discount": 20 },
    { "qty": 3, "discount": 30 }
  ]
}
```

### 📅 Plan 6: Kids Mensal 2x/semana

```json
{
  "name": "Kids Smart Defence - Mensal 2x/semana",
  "description": "2x por semana (sem fidelidade).",
  "billingType": "MONTHLY",
  "planType": "MONTHLY",
  "category": "CHILD",
  "price": 229.90,
  "classesPerWeek": 2,
  "maxClasses": 8,
  "duration": 1,
  "isRecurring": false,
  "features": {
    "modalidades": ["Krav Maga", "Jiu-Jitsu"],
    "faixasEtarias": ["Kids 1 (4-6)", "Kids 2 (7-10)", "Kids 3 (11-13)"]
  },
  "bulkDiscountTiers": [
    { "qty": 1, "discount": 0 },
    { "qty": 2, "discount": 20 },
    { "qty": 3, "discount": 30 }
  ]
}
```

---

## 👨‍💼 3. PLANOS ADULTOS - SMART DEFENCE

### 📅 Plan 7: Adulto Anual Ilimitado

```json
{
  "name": "Smart Defence - Anual Ilimitado",
  "description": "Ilimitado (todas modalidades). Contrato anual com 5% desconto à vista.",
  "billingType": "MONTHLY",
  "planType": "MONTHLY",
  "category": "ADULT",
  "price": 229.90,
  "isUnlimitedAccess": true,
  "duration": 12,
  "isRecurring": true,
  "recurringInterval": 1,
  "features": {
    "modalidades": ["Defesa Pessoal (Krav Maga)", "Jiu-Jitsu", "Boxe"]
  },
  "allowFreeze": true,
  "freezeMaxDays": 30,
  "bulkDiscountTiers": [
    { "qty": 1, "discount": 0 },
    { "qty": 2, "discount": 10 },
    { "qty": 3, "discount": 20 }
  ]
}
```

### 📅 Plan 8: Adulto Mensal Ilimitado

```json
{
  "name": "Smart Defence - Mensal Ilimitado",
  "description": "Ilimitado (sem fidelidade).",
  "billingType": "MONTHLY",
  "planType": "MONTHLY",
  "category": "ADULT",
  "price": 269.90,
  "isUnlimitedAccess": true,
  "duration": 1,
  "isRecurring": false,
  "features": {
    "modalidades": ["Defesa Pessoal (Krav Maga)", "Jiu-Jitsu", "Boxe"]
  },
  "bulkDiscountTiers": [
    { "qty": 1, "discount": 0 },
    { "qty": 2, "discount": 10 },
    { "qty": 3, "discount": 20 }
  ]
}
```

---

## 📦 4. PLANOS ADICIONAIS (Créditos e Especiais)

### Plan 9-11: Packs de Créditos

```json
[
  {
    "name": "Pack 10 Aulas",
    "description": "10 créditos (aulas avulsas)",
    "billingType": "CREDITS",
    "planType": "CREDIT_PACK",
    "creditQuantity": 10,
    "creditType": "CLASS",
    "price": 350.00,
    "creditValidityDays": 90,
    "creditRenewalTrigger": "MANUAL",
    "creditRenewalMethod": "SEPARATE"
  },
  {
    "name": "Pack 20 Aulas",
    "description": "20 créditos com 8% desconto",
    "billingType": "CREDITS",
    "planType": "CREDIT_PACK",
    "creditQuantity": 20,
    "creditType": "CLASS",
    "price": 644.00,
    "creditValidityDays": 120,
    "creditRenewalTrigger": "MANUAL",
    "creditRenewalMethod": "SEPARATE"
  },
  {
    "name": "Pack 30 Aulas",
    "description": "30 créditos com 15% desconto",
    "billingType": "CREDITS",
    "planType": "CREDIT_PACK",
    "creditQuantity": 30,
    "creditType": "CLASS",
    "price": 892.50,
    "creditValidityDays": 150,
    "creditRenewalTrigger": "MANUAL",
    "creditRenewalMethod": "SEPARATE"
  }
]
```

### Plan 12: Trial 7 Dias

```json
{
  "name": "Trial 7 Dias",
  "description": "Teste gratuito com 7 aulas experimentais",
  "billingType": "LIFETIME",
  "planType": "TRIAL",
  "creditQuantity": 7,
  "creditType": "CLASS",
  "price": 0.00,
  "creditValidityDays": 7,
  "creditRenewalTrigger": "MANUAL",
  "creditRenewalMethod": "INCLUDED",
  "maxAutoRenewals": 0
}
```

### Plan 13: Aula Avulsa

```json
{
  "name": "Aula Avulsa",
  "description": "Uma aula avulsa a qualquer momento",
  "billingType": "CREDITS",
  "planType": "CREDIT_PACK",
  "creditQuantity": 1,
  "creditType": "CLASS",
  "price": 50.00,
  "creditValidityDays": 30,
  "creditRenewalTrigger": "MANUAL",
  "creditRenewalMethod": "SEPARATE"
}
```

---

## 👨‍👩‍👧 5. DESCONTOS E BENEFÍCIOS

### Desconto Família

```
Kids:
├─ 1º aluno: preço cheio
├─ 2º aluno: 20% OFF
└─ 3º aluno+: 30% OFF

Adultos:
├─ 1º aluno: preço cheio
├─ 2º aluno: 10% OFF
└─ 3º aluno+: 20% OFF
```

### Benefícios Especiais

```
🎁 Indicação: 1 amigo → 1 mensalidade grátis
💸 Anual à vista: 5% OFF + camiseta exclusiva
🔄 Trial: 7 aulas gratuitas para testar
```

---

## 📈 Resumo de Preços

| Plano | Tipo | Valor/Mês |
|-------|------|-----------|
| Personal Agendado 1x | Horário Fixo | R$ 480 |
| Personal Créditos 1x | Flexível | R$ 600 |
| Kids Anual Ilimitado | Contrato | R$ 249,90 |
| Kids Mensal Ilimitado | Sem Contrato | R$ 299,90 |
| Adulto Anual | Contrato | R$ 229,90 |
| Adulto Mensal | Sem Contrato | R$ 269,90 |
| Pack 10 Aulas | Créditos | R$ 350 |
| Pack 20 Aulas | Créditos | R$ 644 |
| Pack 30 Aulas | Créditos | R$ 892,50 |
| Aula Avulsa | 1 Crédito | R$ 50 |

---

## ✅ Status

- ✅ Personal (2 planos)
- ✅ Kids (4 planos)
- ✅ Adultos Smart Defence (2 planos)
- ✅ Créditos e Especiais (5 planos)
- ✅ **Total: 13 planos planejados**

**Pronto para implementação no seed!** 🚀

