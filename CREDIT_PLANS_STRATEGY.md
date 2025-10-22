# 💳 Estratégia de Planos de Crédito - Academia Krav Maga

**Objetivo**: Diversificar receita com planos de crédito flexíveis e com validade controlada.

---

## 📊 ESTRUTURA ATUAL DO BANCO DE DADOS

### Campo Existente: `creditsValidity` (Int)
```sql
ALTER TABLE billing_plans ADD COLUMN creditsValidity INT; -- Dias até expiração
```

**Exemplo**:
- `creditsValidity: 90` = Créditos expiram em 90 dias
- `creditsValidity: NULL` = Créditos nunca expiram
- `creditsValidity: 180` = Válidos por 6 meses

---

## 🎯 NOVOS CAMPOS RECOMENDADOS

Para melhor controle, adicionar ao schema:

```prisma
model BillingPlan {
  // ... campos existentes ...
  
  // NOVO: Tipo de Plano
  planType              PlanType            @default(MONTHLY)  // MONTHLY | CREDIT_PACK | ONE_TIME
  
  // NOVO: Quantidade de Créditos
  creditQuantity        Int?                                    // Ex: 10 aulas = 10 créditos
  creditType            CreditType          @default(CLASS)    // CLASS | HOUR | PERSONAL_HOUR
  
  // NOVO: Validade em dias
  creditValidityDays    Int                 @default(90)       // 30=mensal, 90=trimestral, 365=anual
  
  // NOVO: Regras de utilização
  minCreditsPerClass    Int                 @default(1)        // Mínimo de créditos por aula
  allowPartialCredit    Boolean             @default(false)    // Usar 0.5 créditos?
  
  // NOVO: Transferência
  allowTransfer         Boolean             @default(false)    // Aluno pode transferir para outro?
  transferFeePercent    Decimal?            @db.Decimal(5, 2)  // Taxa de transferência
  
  // NOVO: Reembolso
  allowRefund           Boolean             @default(false)    // Dinheiro de volta?
  refundDaysBeforeExp   Int?                                    // Reembolsar X dias antes de expirar?
  
  // NOVO: Desconto por Volume
  bulkDiscountTiers     Json?               // Desconto progressivo: 10 aulas: 5%, 20 aulas: 10%
}

enum PlanType {
  MONTHLY           // Renovação automática (tradicional)
  CREDIT_PACK       // Pacote de créditos com validade
  ONE_TIME          // Uso único, não renovável
  TRIAL             // Período de teste
}

enum CreditType {
  CLASS             // 1 crédito = 1 aula
  HOUR              // 1 crédito = 1 hora
  PERSONAL_HOUR     // 1 crédito = 1 hora de treino pessoal
}

model CreditUsage {
  id                String      @id @default(uuid())
  organizationId    String
  studentId         String
  subscriptionId    String      // Qual plano usou
  creditsUsed       Decimal     @db.Decimal(5, 2)
  creditsRemaining  Decimal     @db.Decimal(5, 2)
  attendanceId      String?     // Qual aula usou
  usedAt            DateTime    @default(now())
  expiresAt         DateTime    // Quando este crédito expira
  notes             String?     // "Treino pessoal", "Aula experimental", etc
  
  @@map("credit_usage")
}

model CreditExpiration {
  id                String      @id @default(uuid())
  organizationId    String
  studentId         String
  subscriptionId    String      // Qual plano vai expirar
  creditsExpiring   Decimal     @db.Decimal(5, 2)
  expiresAt         DateTime
  notificationSent  Boolean     @default(false)
  notificationDate  DateTime?   // Quando avisamos
  
  @@map("credit_expiration")
}
```

---

## 💰 SUGESTÕES DE PLANOS DE CRÉDITO

### **1️⃣ PLANO: Pack 10 Aulas**
- **Nome**: "10 Aulas - Válidas por 90 dias"
- **Preço**: R$ 250,00 (R$ 25/aula)
- **Créditos**: 10
- **Validade**: 90 dias
- **Tipo**: CREDIT_PACK
- **Regras**:
  - Não renovável automaticamente
  - Pode usar em qualquer turma
  - ⚠️ Aviso 7 dias antes de expirar
  - Permite transferência (com taxa de 5%)

### **2️⃣ PLANO: Pack 20 Aulas**
- **Nome**: "20 Aulas - Válidas por 6 meses"
- **Preço**: R$ 450,00 (R$ 22,50/aula)
- **Créditos**: 20
- **Validade**: 180 dias
- **Desconto**: 10% vs Pack 10
- **Regras**:
  - Pode usar 2 aulas/semana ou concentrar
  - Reembolso de 50% se não usar em 180 dias
  - Transferência permitida (3% taxa)

### **3️⃣ PLANO: Pack 30 Aulas**
- **Nome**: "30 Aulas - Sem Vencimento"
- **Preço**: R$ 600,00 (R$ 20/aula)
- **Créditos**: 30
- **Validade**: 365 dias (1 ano)
- **Desconto**: 20% vs Pack 10
- **Regras**:
  - Máxima economia
  - Vale a pena para alunos comprometidos

### **4️⃣ PLANO: Aulas Soltas**
- **Nome**: "Aula Avulsa"
- **Preço**: R$ 40,00 (sem desconto)
- **Créditos**: 1
- **Validade**: 30 dias
- **Tipo**: ONE_TIME
- **Regras**:
  - Sem renovação
  - Não transferível
  - Cancelamento até 24h antes = reembolso integral

### **5️⃣ PLANO: Experimental**
- **Nome**: "Primeiro Mês - 30% OFF"
- **Preço**: R$ 210,00 (R$ 250 - 30%)
- **Créditos**: 12 aulas
- **Validade**: 30 dias
- **Tipo**: TRIAL
- **Regras**:
  - 1x por email (verificar se é novo)
  - Converte para Pack 10 automaticamente?
  - Ou expira após 30 dias

### **6️⃣ PLANO: Treino Pessoal - 5 Sessões**
- **Nome**: "5 Sessões Personal (60min)"
- **Preço**: R$ 900,00 (R$ 180/sessão)
- **Créditos**: 5 horas
- **Tipo**: PERSONAL_HOUR
- **Validade**: 90 dias
- **Regras**:
  - Agendamento antecipado obrigatório
  - Cancelamento até 48h = sem penalidade
  - Cancelamento < 48h = perde crédito

### **7️⃣ PLANO: Combo - Aulas + Personal**
- **Nome**: "10 Aulas + 2 Personal (90 dias)"
- **Preço**: R$ 550,00
- **Créditos**: 
  - 10 aulas regulares
  - 2 horas personal
- **Validade**: 90 dias
- **Regras**:
  - Combina duas modalidades
  - Renda cruzada

### **8️⃣ PLANO: Corporativo**
- **Nome**: "Plano Empresa - 50 Aulas/Mês"
- **Preço**: R$ 2.500,00/mês
- **Créditos**: 50 aulas
- **Validade**: Mensal renovável
- **Regras**:
  - Compartilhado por até 10 funcionários
  - Créditos não utilizados viram desconto próximo mês (50%)
  - Relatório mensal de uso

---

## 📋 REGRAS DE NEGÓCIO RECOMENDADAS

### **Regra 1: Notificação de Expiração**
```javascript
// Gerar alertas automáticos
- 30 dias antes: Email suave "Lembre seus créditos expiram em 30 dias"
- 7 dias antes: Email em destaque "Urgente: 7 dias para usar seus créditos!"
- 1 dia antes: SMS + notificação in-app
- Data expiração: Desativar créditos automaticamente
```

### **Regra 2: Crédito Reembolsável**
```javascript
Exemplo: Pack 20 Aulas (180 dias)
- 120 dias em: 0% reembolso
- 150 dias em: 20% reembolso se não usar
- 170 dias em: 50% reembolso se não usar
- 180 dias in: Créditos expiram (opção de prorrogação -20%?)
```

### **Regra 3: Conversão Automática**
```
Plano: Aluno com 5 créditos sobrando + Pack novo 10 aulas
Opção A: Manter separado (5 antigos + 10 novos)
Opção B: Mesclar para 15 créditos com nova validade?
         (Pode gerar confusão - não recomendado)
```

### **Regra 4: Transferência Entre Alunos**
```
Cenário: Aluno A tem 5 créditos, quer transferir para Aluno B
Taxa: 5% de taxa administrativa (ex: perde 1 crédito, transfere 4)
Restrições:
  - Apenas créditos válidos (não expirados)
  - Máximo 1 transferência por crédito
  - Não permitir se houver débito financeiro
```

### **Regra 5: Aulas Canceladas**
```
Se instrutor cancelou aula:
  - Aluno que já marcou presença: Crédito devolvido
  - Vale para uso em até 7 dias (validade especial)
  
Se aluno cancelou aula:
  - Até 24h antes: Crédito devolvido
  - Menos de 24h: Crédito consumido (ou vira 0.5 desconto)
```

### **Regra 6: Congelamento de Créditos**
```
Se aluno quer congelar plano por 30 dias (férias):
  - Validade ESTENDE automaticamente em 30 dias
  - Créditos não consumidos = congelados
  - Máximo 1 congelamento por ano
```

---

## 🎁 ESTRATÉGIAS DE UPSELL

### **Cross-Sell: Combos**
- Aluno tem 8 créditos sobrando → Ofereça "Complemente para 10 = só mais R$ 50"
- Aluno com 6+ meses de adesão → "Teste 1 sessão pessoal = R$ 180"

### **Upsell: Upgrades**
- Pack 10 (90d) → "Upgrade para 20 aulas com +2 meses validade = +R$ 200"
- Aluno frequente (40+ aulas/ano) → "Plano anual 365d = R$ 50/mês (economia 40%)"

### **Retention: Retention Offers**
- Créditos expiram em 7 dias e não usou → "Apenas R$ 50 para estender 30 dias"
- Cancelamento pendente → "Desconto de 20% para próximas 5 aulas"

---

## 📱 DASHBOARD: O QUE EXIBIR

### **Para Aluno**
```
┌─────────────────────────────────┐
│ Meus Créditos: 8 de 10          │
│ ████████░░░░░░░░░░░ 80%         │
│                                 │
│ Expiram em: 25 dias             │
│ ⚠️ AVISO: Use antes de...       │
│                                 │
│ [+ Comprar mais] [Ver histórico]│
└─────────────────────────────────┘
```

### **Para Instrutor**
```
- Visualizar quantos créditos aluno tem
- Marcar consumo de crédito ao fazer frequência
- Ver alunos com créditos a vencer
```

### **Para Admin**
```
- Relatório: % créditos não utilizados (oportunidade de upsell)
- Alunos com créditos expirando (campanhas de reengajamento)
- ROI por tipo de plano
- Taxa de conversão: Aula avulsa → Pack
```

---

## 🔧 IMPLEMENTAÇÃO: FASES

### **Fase 1: Básico** (Semana 1-2)
- ✅ Adicionar campos ao Prisma
- ✅ Criar CRUD básico de planos de crédito
- ✅ Mostrar saldo de créditos na interface
- ✅ Descontar crédito ao fazer check-in

### **Fase 2: Notificações** (Semana 3)
- 📧 Email automático 7 dias antes de expirar
- 📱 Notificação in-app quando créditos expiram
- 📊 Dashboard simples mostrando saldo

### **Fase 3: Regras Avançadas** (Semana 4-5)
- 🔄 Transferência entre alunos com taxa
- 💰 Reembolsos automáticos
- 🔐 Congelamento de créditos
- 📉 Histórico de consumo (CreditUsage table)

### **Fase 4: Analytics** (Semana 6)
- 📈 Relatórios de utilização
- 💡 Sugestões de upsell automáticas
- 🎯 Campanhas de reengajamento

---

## 📊 EXEMPLOS DE SQL / QUERIES

### **Query 1: Créditos Prestes a Expirar**
```sql
SELECT 
  s.id as subscription_id,
  st.id as student_id,
  st.user.firstName,
  bp.name,
  DATEDIFF(DATE_ADD(s.createdAt, INTERVAL bp.creditsValidity DAY), NOW()) as days_until_expiry
FROM student_subscriptions s
JOIN billing_plans bp ON s.planId = bp.id
JOIN students st ON s.studentId = st.id
WHERE bp.creditsValidity IS NOT NULL
  AND DATE_ADD(s.createdAt, INTERVAL bp.creditsValidity DAY) BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)
  AND s.isActive = true
ORDER BY days_until_expiry ASC;
```

### **Query 2: Total de Créditos por Aluno**
```sql
SELECT 
  st.id,
  st.user.firstName,
  SUM(bp.creditQuantity) as total_credits,
  SUM(COALESCE(cu.creditsUsed, 0)) as credits_used,
  SUM(bp.creditQuantity) - SUM(COALESCE(cu.creditsUsed, 0)) as credits_remaining
FROM students st
JOIN student_subscriptions s ON st.id = s.studentId
JOIN billing_plans bp ON s.planId = bp.id
LEFT JOIN credit_usage cu ON s.id = cu.subscriptionId
WHERE s.isActive = true
GROUP BY st.id
ORDER BY credits_remaining DESC;
```

### **Query 3: Previsão de Receita**
```sql
SELECT 
  bp.name,
  COUNT(*) as active_subscriptions,
  AVG(bp.price) as avg_price,
  SUM(bp.price) as monthly_revenue
FROM student_subscriptions s
JOIN billing_plans bp ON s.planId = bp.id
WHERE s.isActive = true
GROUP BY bp.id, bp.name
ORDER BY monthly_revenue DESC;
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Backend
- [ ] Adicionar campos ao Prisma schema
- [ ] Rodar `npx prisma migrate dev`
- [ ] Criar endpoints: GET, POST, PATCH, DELETE para planos
- [ ] Implementar lógica de desconto de créditos
- [ ] Criar job automático de notificação (cron)
- [ ] Implementar reembolsos automáticos
- [ ] Testes: happy path + edge cases

### Frontend
- [ ] Exibir saldo de créditos no dashboard
- [ ] Mostrar validade em progess bar
- [ ] Botão "Comprar mais créditos"
- [ ] Histórico de consumo
- [ ] Modal de transferência (se permitido)
- [ ] Aviso de expiração (toast/banner)

### Admin
- [ ] Criar/editar planos no painel
- [ ] Relatórios de utilização
- [ ] Ajustes manuais de créditos (suporte)
- [ ] Campanhas de reengajamento

---

## 💡 DICAS EXTRAS

1. **Gamificação**: "Complete 10 aulas e ganhe 2 créditos bônus"
2. **Referência**: "Indique um amigo e ganhe 5 créditos"
3. **Fidelidade**: "Aluno há +1 ano = +20% créditos bonus"
4. **Sazonalidade**: Black Friday = "Packs com 50% OFF"
5. **Combo Analytics**: Ofereça treino pessoal quando aluno tem muitos créditos

---

**Versão**: 1.0  
**Data**: 16/10/2025  
**Status**: 📋 Pronto para implementação
