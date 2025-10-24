# 📋 Todos os Planos - Academia Krav Maga

**Data**: 17 de outubro de 2025  
**Status**: 📝 Documentação para Seed  
**Total de Planos**: 15 planos  

---

## 🎯 Resumo de Planos por Categoria

### 1️⃣ **PERSONAL (Aulas Personalizadas)** - 4 planos
- Aulas Agendadas 1x/semana (R$ 480/mês)
- Aulas Agendadas 2x/semana (R$ 960/mês)
- Aulas por Créditos 1x/semana (R$ 600/mês)
- Aulas por Créditos 2x/semana (R$ 1.200/mês)

### 2️⃣ **KIDS (Crianças)** - 4 planos
- Anual Ilimitado (R$ 249,90/mês)
- Anual 2x/semana (R$ 199,90/mês)
- Mensal Ilimitado (R$ 299,90/mês)
- Mensal 2x/semana (R$ 229,90/mês)

### 3️⃣ **ADULTOS COLETIVOS** - 2 planos
- Ilimitado (R$ 149,90/mês - default existente)
- 2x por semana (R$ 99,90/mês - novo)

---

## 💪 PERSONAL - DETALHES

### **Tipo 1: Aulas Agendadas 1x/semana**
```javascript
{
  name: "💪 Personal - 1x/semana (Agendado)",
  description: "Aulas personalizadas semanais com horário fixo",
  category: "ADULT",
  price: new Decimal("480.00"),
  billingType: "MONTHLY",
  
  // Personal Training
  hasPersonalTraining: true,
  classesPerWeek: 1,
  
  // Características
  isUnlimitedAccess: false,
  allowFreeze: true,
  freezeMaxDays: 30,
  
  // Créditos
  planType: "MONTHLY",
  creditQuantity: null, // Sem créditos
  creditValidityDays: null,
  
  // Sem Reposição
  creditRenewalTrigger: "MANUAL",
  creditRenewalMethod: "INCLUDED",
  autoRenewCredits: false,
  
  features: {
    maxPersonsPerSession: 1,
    scheduling: "FIXED_SCHEDULE",
    rescheduling: false,
    makeupClasses: false,
    description: "Horário fixo previamente combinado. Sem direito à remarcação em caso de falta ou feriado."
  }
}
```

### **Tipo 2: Aulas Agendadas 2x/semana**
```javascript
{
  name: "💪 Personal - 2x/semana (Agendado)",
  description: "Aulas personalizadas 2x por semana com horário fixo",
  category: "ADULT",
  price: new Decimal("960.00"),
  billingType: "MONTHLY",
  
  hasPersonalTraining: true,
  classesPerWeek: 2,
  
  planType: "MONTHLY",
  creditQuantity: null,
  
  creditRenewalTrigger: "MANUAL",
  creditRenewalMethod: "INCLUDED",
  autoRenewCredits: false,
  
  features: {
    maxPersonsPerSession: 1,
    scheduling: "FIXED_SCHEDULE",
    rescheduling: false,
    makeupClasses: false
  }
}
```

### **Tipo 3: Aulas por Créditos 1x/semana**
```javascript
{
  name: "💪 Personal - 1x/semana (Créditos)",
  description: "Pague apenas pelas aulas realizadas. Flexibilidade total com agendamentos.",
  category: "ADULT",
  price: new Decimal("600.00"),
  billingType: "CREDITS",
  
  hasPersonalTraining: true,
  classesPerWeek: 1,
  
  planType: "CREDIT_PACK",
  creditQuantity: 4, // ~4 aulas por mês (1x semana)
  creditType: "PERSONAL_HOUR",
  creditValidityDays: 30,
  minCreditsPerClass: 1,
  
  // COM Reposição
  creditRenewalTrigger: "ON_CONSUMPTION", // Quando acabar
  creditRenewalMethod: "SEPARATE",         // Cobrança adicional
  autoRenewCredits: true,
  renewalIntervalDays: 30,
  maxAutoRenewals: null, // Ilimitado
  
  features: {
    maxPersonsPerSession: 1,
    scheduling: "FLEXIBLE",
    rescheduling: true,
    cancelationNotice: "24 horas",
    makeupClasses: true,
    description: "Pague apenas pelas aulas realizadas. Cancelamento possível com até 24 horas."
  }
}
```

### **Tipo 4: Aulas por Créditos 2x/semana**
```javascript
{
  name: "💪 Personal - 2x/semana (Créditos)",
  description: "2 aulas semanais com flexibilidade total e reposição automática",
  category: "ADULT",
  price: new Decimal("1200.00"),
  billingType: "CREDITS",
  
  hasPersonalTraining: true,
  classesPerWeek: 2,
  
  planType: "CREDIT_PACK",
  creditQuantity: 8, // ~8 aulas por mês (2x semana)
  creditType: "PERSONAL_HOUR",
  creditValidityDays: 30,
  minCreditsPerClass: 1,
  
  creditRenewalTrigger: "ON_CONSUMPTION",
  creditRenewalMethod: "SEPARATE",
  autoRenewCredits: true,
  renewalIntervalDays: 30,
  maxAutoRenewals: null,
  
  features: {
    maxPersonsPerSession: 1,
    scheduling: "FLEXIBLE",
    rescheduling: true,
    cancelationNotice: "24 horas",
    makeupClasses: true
  }
}
```

---

## 👧 KIDS - DETALHES

### **Tipo 1: Anual Ilimitado (Kids)**
```javascript
{
  name: "👧 Kids Smart Defence - Ilimitado (Anual)",
  description: "Aulas ilimitadas de Krav Maga e Jiu-Jitsu. Toda segunda e quarta 16:30-19:00, sábado 09:15-10:30",
  category: "KIDS",
  price: new Decimal("249.90"),
  billingType: "MONTHLY",
  
  isUnlimitedAccess: true,
  accessAllModalities: true,
  
  planType: "MONTHLY",
  creditQuantity: null,
  creditValidityDays: 90,
  
  creditRenewalTrigger: "MONTHLY",
  creditRenewalMethod: "INCLUDED",
  autoRenewCredits: true,
  renewalIntervalDays: 30,
  maxAutoRenewals: 12, // 1 ano
  
  features: {
    ageRange: "4-13 anos",
    levels: ["Kids 1 (4-6)", "Kids 2-3 (7-13)"],
    schedule: ["Seg/Qua 16:30-19:00", "Sáb 09:15-10:30"],
    familyDiscount: true,
    referralBonus: true,
    annualDiscount: 0.05
  }
}
```

### **Tipo 2: Anual 2x/semana (Kids)**
```javascript
{
  name: "👧 Kids Smart Defence - 2x/semana (Anual)",
  description: "2 aulas semanais. Contrato anual com desconto.",
  category: "KIDS",
  price: new Decimal("199.90"),
  billingType: "MONTHLY",
  
  classesPerWeek: 2,
  
  planType: "MONTHLY",
  creditRenewalTrigger: "MONTHLY",
  creditRenewalMethod: "INCLUDED",
  autoRenewCredits: true,
  renewalIntervalDays: 30,
  maxAutoRenewals: 12,
  
  features: {
    ageRange: "4-13 anos",
    schedule: ["Seg/Qua ou Sáb"],
    familyDiscount: true,
    referralBonus: true,
    contract: "12 meses"
  }
}
```

### **Tipo 3: Mensal Ilimitado (Kids)**
```javascript
{
  name: "👧 Kids Smart Defence - Ilimitado (Mensal)",
  description: "Aulas ilimitadas sem fidelidade. Sem compromisso.",
  category: "KIDS",
  price: new Decimal("299.90"),
  billingType: "MONTHLY",
  
  isUnlimitedAccess: true,
  accessAllModalities: true,
  
  planType: "MONTHLY",
  creditRenewalTrigger: "MONTHLY",
  creditRenewalMethod: "INCLUDED",
  autoRenewCredits: false, // Sem fidelidade
  
  features: {
    ageRange: "4-13 anos",
    fidelity: false,
    monthlyRenewal: true
  }
}
```

### **Tipo 4: Mensal 2x/semana (Kids)**
```javascript
{
  name: "👧 Kids Smart Defence - 2x/semana (Mensal)",
  description: "2 aulas semanais sem fidelidade.",
  category: "KIDS",
  price: new Decimal("229.90"),
  billingType: "MONTHLY",
  
  classesPerWeek: 2,
  
  planType: "MONTHLY",
  creditRenewalTrigger: "MONTHLY",
  creditRenewalMethod: "INCLUDED",
  autoRenewCredits: false,
  
  features: {
    ageRange: "4-13 anos",
    fidelity: false
  }
}
```

---

## 👨‍👩‍👧 ADULTOS COLETIVOS - DETALHES

### **Tipo 1: Ilimitado (Existente)**
```javascript
{
  name: "🥋 Plano Ilimitado",
  description: "Acesso completo a academia com aulas ilimitadas",
  category: null,
  price: new Decimal("149.90"),
  billingType: "MONTHLY",
  
  isUnlimitedAccess: true,
  allowFreeze: true,
  freezeMaxDays: 30,
  
  planType: "MONTHLY",
  creditRenewalTrigger: "MONTHLY",
  creditRenewalMethod: "INCLUDED",
  autoRenewCredits: false,
  
  features: {
    courseIds: ["krav-maga-faixa-branca-2025"]
  }
}
```

### **Tipo 2: 2x por semana (Novo)**
```javascript
{
  name: "🥋 Plano 2x/semana",
  description: "2 aulas semanais - ideal para iniciantes",
  category: null,
  price: new Decimal("99.90"),
  billingType: "MONTHLY",
  
  classesPerWeek: 2,
  maxClasses: 8, // ~2x semana
  
  isUnlimitedAccess: false,
  allowFreeze: true,
  freezeMaxDays: 30,
  
  planType: "MONTHLY",
  creditRenewalTrigger: "MONTHLY",
  creditRenewalMethod: "INCLUDED",
  autoRenewCredits: false,
  
  features: {
    courseIds: ["krav-maga-faixa-branca-2025"]
  }
}
```

---

## 🔧 Campos Especiais de Seed

### **Para PERSONAL - Sem Reposição**
```javascript
creditRenewalTrigger: "MANUAL"       // Sem renovação automática
creditRenewalMethod: "INCLUDED"      // Sem cobrança extra
autoRenewCredits: false              // Desabilitar renovação
```

### **Para PERSONAL - Com Reposição**
```javascript
creditRenewalTrigger: "ON_CONSUMPTION"  // Renova quando acabar
creditRenewalMethod: "SEPARATE"         // Cobrança separada
autoRenewCredits: true                  // Ativar renovação
renewalIntervalDays: 30                 // A cada 30 dias
maxAutoRenewals: null                   // Ilimitado
```

### **Para KIDS Anual**
```javascript
maxAutoRenewals: 12              // Máximo 1 ano
renewalIntervalDays: 30          // A cada mês
creditRenewalTrigger: "MONTHLY"  // Automático
```

### **Para KIDS Mensal**
```javascript
autoRenewCredits: false          // Sem fidelidade
creditRenewalTrigger: "MANUAL"   // Renovação manual
```

---

## 📊 Resumo Tabular

| Plano | Tipo | Preço | Renovação | Cobrança |
|-------|------|-------|-----------|----------|
| Personal 1x (Agendado) | MONTHLY | R$ 480 | MANUAL | INCLUDED |
| Personal 2x (Agendado) | MONTHLY | R$ 960 | MANUAL | INCLUDED |
| Personal 1x (Créditos) | CREDITS | R$ 600 | ON_CONSUMPTION | SEPARATE |
| Personal 2x (Créditos) | CREDITS | R$ 1.200 | ON_CONSUMPTION | SEPARATE |
| Kids Ilimitado (Anual) | MONTHLY | R$ 249,90 | MONTHLY | INCLUDED |
| Kids 2x (Anual) | MONTHLY | R$ 199,90 | MONTHLY | INCLUDED |
| Kids Ilimitado (Mensal) | MONTHLY | R$ 299,90 | MANUAL | INCLUDED |
| Kids 2x (Mensal) | MONTHLY | R$ 229,90 | MANUAL | INCLUDED |
| Adulto Ilimitado | MONTHLY | R$ 149,90 | MANUAL | INCLUDED |
| Adulto 2x/semana | MONTHLY | R$ 99,90 | MANUAL | INCLUDED |

---

## ✅ Próximos Passos

1. ✅ Documentação criada (este arquivo)
2. ⏳ Criar script `scripts/seed-all-plans.ts` (2h)
3. ⏳ Executar seed
4. ⏳ Adicionar ao card do plano: indicador de "plano de créditos" com data de recarga
5. ⏳ Integrar com Turmas

---

**Status**: 📝 **PRONTO PARA SEED** 🚀

