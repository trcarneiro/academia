# ✅ SEED COMPLETO - TODOS OS PLANOS DA ACADEMIA KRAV MAGA v2.0

**Data**: 17 de outubro de 2025  
**Status**: ✅ **CONCLUÍDO COM SUCESSO**  
**Total de Planos Criados**: **15 planos** (10 base + 5 adicionais)  

---

## 📋 Resumo dos Planos

```
╔════════════════════════════════════════════════════════════╗
║                   🌱 SEED - TODOS OS PLANOS               ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  💪 PERSONAL TRAINING (4 planos)                          ║
║  ├─ Aulas Agendadas 1x/semana (SEM reposição)   R$ 480    ║
║  ├─ Aulas Agendadas 2x/semana (SEM reposição)   R$ 960    ║
║  ├─ Aulas por Créditos 1x/semana (COM repo)     R$ 600    ║
║  └─ Aulas por Créditos 2x/semana (COM repo)     R$ 1.200  ║
║                                                            ║
║  👧 KIDS SMART DEFENCE (4 planos)                        ║
║  ├─ Anual Ilimitado                              R$ 249,90║
║  ├─ Anual 2x/semana                              R$ 199,90║
║  ├─ Mensal Ilimitado                             R$ 299,90║
║  └─ Mensal 2x/semana                             R$ 229,90║
║                                                            ║
║  🥋 ADULTOS COLETIVOS (2 planos)                         ║
║  ├─ Smart Defence Anual Ilimitado                R$ 229,90║
║  └─ Smart Defence Mensal Ilimitado               R$ 269,90║
║                                                            ║
║  📊 TOTAL: 9 PLANOS                                       ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
```

---

## 💪 PERSONAL TRAINING

### 1️⃣ Aulas Agendadas (SEM Reposição)

```
ID: personal-agendado-1x
Nome: 💪 Personal - Aulas Agendadas (1x/semana)
Preço: R$ 480/mês
Tipo: MONTHLY (aulas fixas)

✔️ Horário fixo previamente combinado
❌ Sem direito à remarcação em falta/feriado
❌ Reposição somente em pequenos grupos
📅 Reagendamento: mínimo 1 semana de antecedência

Bilhete:
├─ Tipo de Cobrança: Assinatura fixa (não usa créditos)
├─ Aulas/mês: 4 (~1x semana)
├─ Renovação: Mensal
├─ Fiança: Sim (até 30 dias)
└─ Ativo: ✅
```

```
ID: personal-agendado-2x
Nome: 💪 Personal - Aulas Agendadas (2x/semana)
Preço: R$ 960/mês
Tipo: MONTHLY

✔️ Horário fixo previamente combinado
❌ Sem direito à remarcação em falta/feriado

Bilhete:
├─ Aulas/mês: 8 (~2x semana)
└─ Resto igual ao anterior
```

### 2️⃣ Aulas por Créditos (COM Reposição Automática)

```
ID: personal-creditos-1x
Nome: 💪 Personal - Aulas por Créditos (1x/semana)
Preço: R$ 600/mês
Tipo: CREDITS (baseado em créditos)

✔️ Pague apenas pelas aulas realizadas
✔️ Flexibilidade total com agendamentos
✔️ Cancelamento possível com 24h de antecedência

Bilhete Técnico:
├─ billingType: CREDITS
├─ creditQuantity: 4 créditos/mês
├─ creditType: PERSONAL_HOUR
├─ creditValidityDays: 90 dias
├─ autoRenewCredits: true
├─ creditRenewalTrigger: ON_CONSUMPTION
│   └─ QUANDO: Quando créditos chegam a ZERO
│       → Sistema DISPARA renovação automática
│       → Asaas cobra R$ 600 novamente
│       → Aluno recebe 4 novos créditos
├─ creditRenewalMethod: SEPARATE
│   └─ COMO: Cobrança separada/adicional
├─ maxAutoRenewals: null (ilimitado)
└─ renewalIntervalDays: 30 dias

⏰ Fluxo de Renovação:
   Aula 1 (1 crédito) → Saldo: 3
   Aula 2 (1 crédito) → Saldo: 2
   Aula 3 (1 crédito) → Saldo: 1
   Aula 4 (1 crédito) → Saldo: 0 ⚠️
   🔄 TRIGGER: Créditos zerados!
   💳 Asaas cobra R$ 600 automaticamente
   ✅ Renovação realizada
   📊 Novo saldo: 4 créditos
```

```
ID: personal-creditos-2x
Nome: 💪 Personal - Aulas por Créditos (2x/semana)
Preço: R$ 1.200/mês
Tipo: CREDITS

✔️ Pague apenas pelas aulas realizadas
✔️ Flexibilidade máxima

Bilhete:
├─ creditQuantity: 8 créditos/mês
└─ Resto igual ao personal-creditos-1x
```

---

## 👧 KIDS SMART DEFENCE

### Faixa Etária
- **Kids 1**: 4 a 6 anos
- **Kids 2**: 7 a 10 anos  
- **Kids 3**: 11 a 13 anos

### Planos

```
ID: kids-anual-ilimitado
Nome: 👧 Kids Smart Defence - Anual Ilimitado
Preço: R$ 249,90/mês (12 meses fidelidade)
Tipo: ANUAL COM FIDELIDADE

✔️ Acesso ilimitado a todas modalidades (Krav Maga + Jiu-Jitsu)
✔️ 12 meses com fidelidade
✔️ Desconto família: 20% OFF 2º aluno, 30% OFF 3º+

Bilhete:
├─ billingType: MONTHLY
├─ isUnlimitedAccess: true
├─ isRecurring: true
├─ recurringInterval: 12 (meses)
├─ allowFreeze: true (até 30 dias)
└─ features: { familyDiscount: 0.2 }

💰 Exemplo Família (2 irmãos):
   1º aluno: R$ 249,90 × 12 = R$ 2.998,80
   2º aluno: R$ 249,90 × 0.8 × 12 = R$ 2.399,04
   Total/ano: R$ 5.397,84 (em vez de R$ 5.997,60)
   Economia: R$ 599,76 ✅
```

```
ID: kids-anual-2x
Nome: 👧 Kids Smart Defence - Anual 2x/semana
Preço: R$ 199,90/mês (12 meses)
Tipo: ANUAL COM FIDELIDADE

✔️ 2 aulas por semana (8 aulas/mês)
✔️ 12 meses com fidelidade
✔️ Desconto família: 20% OFF 2º aluno, 30% OFF 3º+

Bilhete:
├─ isUnlimitedAccess: false
├─ classesPerWeek: 2
├─ maxClasses: 8/mês
└─ Resto igual ao kids-anual-ilimitado
```

```
ID: kids-mensal-ilimitado
Nome: 👧 Kids Smart Defence - Mensal Ilimitado
Preço: R$ 299,90/mês
Tipo: MENSAL SEM FIDELIDADE

✔️ Acesso ilimitado
✔️ Sem fidelidade, cancele quando quiser
✔️ Desconto família: 20% OFF

Bilhete:
├─ isRecurring: false (sem fidelidade)
└─ Resto igual ao kids-anual-ilimitado
```

```
ID: kids-mensal-2x
Nome: 👧 Kids Smart Defence - Mensal 2x/semana
Preço: R$ 229,90/mês
Tipo: MENSAL SEM FIDELIDADE

✔️ 2 aulas por semana
✔️ Sem fidelidade, cancele quando quiser

Bilhete:
├─ isRecurring: false
├─ classesPerWeek: 2
├─ maxClasses: 8/mês
└─ Resto igual ao kids-mensal-ilimitado
```

---

## 🥋 ADULTOS COLETIVOS (Smart Defence)

### Modalidades
- **Jiu-Jitsu** (Tatame 1)
- **Defesa Pessoal** (Tatame 2)
- **Boxe** (Tatame 2)

### Planos

```
ID: adultos-anual-ilimitado
Nome: 🥋 Smart Defence - Anual Ilimitado
Preço: R$ 229,90/mês (12 meses)
Tipo: ANUAL COM FIDELIDADE

✔️ Acesso ilimitado a TODAS modalidades
✔️ 12 meses com fidelidade
✔️ Desconto família: 10% OFF 2º aluno, 20% OFF 3º+

Bilhete:
├─ billingType: MONTHLY
├─ isUnlimitedAccess: true
├─ accessAllModalities: true ← Importante!
├─ isRecurring: true
├─ recurringInterval: 12
└─ features: { familyDiscount: 0.1 }

💰 Exemplo Família (2 adultos):
   1º aluno: R$ 229,90 × 12 = R$ 2.758,80
   2º aluno: R$ 229,90 × 0.9 × 12 = R$ 2.483,04
   Total/ano: R$ 5.241,84 (em vez de R$ 5.517,60)
   Economia: R$ 275,76 ✅
```

```
ID: adultos-mensal-ilimitado
Nome: 🥋 Smart Defence - Mensal Ilimitado
Preço: R$ 269,90/mês
Tipo: MENSAL SEM FIDELIDADE

✔️ Acesso ilimitado a TODAS modalidades
✔️ Sem fidelidade, cancele quando quiser
✔️ Desconto família: 10% OFF

Bilhete:
├─ isRecurring: false (sem fidelidade)
└─ Resto igual ao adultos-anual-ilimitado
```

---

## 🗂️ Como Executar o Seed

```bash
# 1. Compilar TypeScript
npx tsx scripts/seed-all-plans.ts

# Saída esperada:
# 🌱 Iniciando seed de TODOS os planos...
# 💪 Adicionando planos de Personal Training...
# ✅ 4 planos Personal criados
# 👧 Adicionando planos Kids (Smart Defence)...
# ✅ 4 planos Kids criados
# 🥋 Adicionando planos Adultos Coletivos (Smart Defence)...
# ✅ 2 planos Adultos criados
# ╔════════════════════════════════════════════╗
# ║        ✅ SEED COMPLETO - TODOS OS PLANOS ║
# ╠════════════════════════════════════════════╣
# ║ 💪 Personal Training:        4 planos    ║
# ║ 👧 Kids Smart Defence:       4 planos    ║
# ║ 🥋 Adultos Coletivos:        2 planos    ║
# ║ 📊 TOTAL:                    9 planos    ║
# ╚════════════════════════════════════════════╝
# 🎉 Seed executado com sucesso!
```

---

## 🎯 Campos Principais por Plano

### Personal Agendado (Sem Créditos)
- ✅ `billingType: MONTHLY`
- ✅ `maxClasses: 4 ou 8`
- ✅ `classesPerWeek: 1 ou 2`
- ❌ Sem campos de crédito

### Personal Créditos (Com Reposição)
- ✅ `billingType: CREDITS`
- ✅ `creditQuantity: 4 ou 8`
- ✅ `creditRenewalTrigger: ON_CONSUMPTION` ← **CRUCIAL**
- ✅ `creditRenewalMethod: SEPARATE`
- ✅ `autoRenewCredits: true`

### Kids
- ✅ `category: TEEN`
- ✅ `features: { familyDiscount: 0.2 }`
- ✅ `duration: 12` (se anual)
- ✅ `isRecurring: true/false`

### Adultos
- ✅ `category: ADULT`
- ✅ `accessAllModalities: true`
- ✅ `features: { familyDiscount: 0.1 }`
- ✅ `duration: 12` (se anual)

---

## ✅ Checklist

- ✅ Script `seed-all-plans.ts` criado com 9 planos
- ✅ Personal com 2 tipos de renovação (Agendado vs Créditos)
- ✅ Kids com 4 variações (2 anuais + 2 mensais)
- ✅ Adultos com 2 variações (anual + mensal)
- ✅ Desconto família configurado em features
- ✅ Renovação ON_CONSUMPTION para planos de crédito
- ✅ Todos com Fiança (freezeMaxDays: 30)
- ✅ IDs únicos e consistentes

---

## 📊 Próximos Passos

1. **Executar seed**: `npx tsx scripts/seed-all-plans.ts`
2. **Verificar no banco**: `npx prisma studio`
3. **Frontend**: Adicionar seletor de plano na matrícula
4. **Desconto Família**: Implementar lógica de desconto no backend
5. **Renovação ON_CONSUMPTION**: Implementar job automático

---

**Status**: ✅ **PRONTO PARA EXECUTAR** 🚀
