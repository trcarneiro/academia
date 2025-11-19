# 🎯 Requisitos para Tela de Check-in com Foco em Vendas

## 📊 Informações Estratégicas a Exibir

### 1. **Status Financeiro** (Prioridade Alta)
- ✅ Plano Ativo / ❌ Plano Inativo
- 📅 Validade do plano (data + dias restantes)
- 💰 Valor do plano atual
- ⚠️ Alertas de vencimento (7 dias antes = urgente)
- 📋 Matrícula (se existir)

### 2. **Turmas Disponíveis** (Prioridade Alta)
**Turmas AGORA (check-in aberto)**:
- Horário da aula
- Instrutor
- Local/Sala
- Vagas disponíveis
- Status: "Check-in aberto"

**Próximas turmas (não abertas)**:
- Horário futuro
- Instrutor
- Status: "Abre em X minutos"
- Botão: "Agendar"

### 3. **Progresso Acadêmico** (Engajamento)
- 📚 Curso atual
- 📈 Percentual completado (ex: 65%)
- 🎓 Elegibilidade para graduação:
  - ✅ "Pronto para exame!" (verde)
  - ⏳ "Faltam X atividades" (amarelo)
  - ❌ "Precisa completar curso" (vermelho)

### 4. **Oportunidades de Upsell** (Geração de Renda)
**Se plano vencido ou inativo**:
- 🔄 "Reativar plano anterior" (R$ XXX/mês)
- 💎 "Upgrade para Ilimitado" (+ R$ YYY/mês)
- 🎁 "Promoção: 20% OFF nos 3 primeiros meses"

**Se plano ativo mas básico**:
- ⭐ "Upgrade para Black" (mais benefícios)
- 🥋 "Adicionar Personal Training" (+R$ 150/mês)
- 🍎 "Incluir Nutrição" (+R$ 80/mês)

**Produtos/Serviços**:
- 👕 "Compre seu Gi oficial" (R$ 299)
- 🥤 "Shake pós-treino" (R$ 15/unidade)
- 📦 "Pacote de equipamentos" (R$ 450)

### 5. **Gamificação/Motivação**
- 🔥 Streak atual (dias consecutivos)
- 🏆 Total de check-ins
- 🎯 Ranking mensal (posição)
- ⭐ XP acumulado
- 🎖️ Badges conquistadas

---

## 🎨 Layout Proposto

```
┌─────────────────────────────────────────────────────────┐
│  👤 Pedro Teste                           [X Cancelar]  │
│  📋 Matrícula: 2024001  📞 (31) 99999-9999              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  💳 PLANO: Ilimitado                  ✅ ATIVO         │
│  📅 Válido até: 12/12/2025 (25 dias)  💰 R$ 269/mês   │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  📚 CURSO ATUAL: Krav Maga Faixa Branca                │
│  ████████████░░░░░░░ 65% completo (26/40 aulas)       │
│  🎓 STATUS: ⏳ Faltam 5 atividades para exame          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🏋️ TURMAS DISPONÍVEIS AGORA - FAÇA CHECK-IN:         │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  1️⃣  Krav Maga - Faixa Branca              [✓] │  │
│  │      🕐 18:00 - 19:30                            │  │
│  │      👨‍🏫 João Silva                              │  │
│  │      🏢 Sala 1 • 15 vagas disponíveis            │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ⏰ PRÓXIMAS TURMAS (não abertas para check-in):      │
│                                                         │
│  • Qui 20:00 - Combate Avançado (Abre em 2h)         │
│  • Sex 19:00 - Defesa Pessoal (Abre em 26h)          │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🔥 ESTATÍSTICAS                                       │
│  🏆 25 check-ins este mês  🔥 Streak: 5 dias          │
│  🎯 Ranking: #12 de 92     ⭐ 1.250 XP                │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│     [✅ CONFIRMAR CHECK-IN - TURMA 1]                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Próximos Passos de Implementação

### Fase 1: Dados Básicos (30 min)
- [x] Carregar aluno com plano
- [x] Carregar turmas disponíveis
- [ ] Carregar progresso do curso
- [ ] Calcular elegibilidade para graduação

### Fase 2: UI Completa (1h)
- [ ] Layout com todas as seções
- [ ] Status financeiro visível
- [ ] Turmas com horários e status
- [ ] Progresso visual do curso
- [ ] Stats de gamificação

### Fase 3: Lógica de Negócio (1h)
- [ ] Filtrar turmas por horário (abertas vs próximas)
- [ ] Calcular % de completude do curso
- [ ] Verificar critérios de graduação
- [ ] Gerar recomendações de upsell

### Fase 4: Upsell Inteligente (1h)
- [ ] Detectar plano inativo → sugerir reativação
- [ ] Plano básico → sugerir upgrade
- [ ] Próximo da graduação → sugerir exame
- [ ] Modal de vendas ao clicar em upgrade

---

## 📝 APIs Necessárias

```typescript
// 1. Dados do aluno completos (já existe)
GET /api/students/:id
// Retorna: student, user, subscriptions, attendances

// 2. Progresso no curso (precisa criar)
GET /api/students/:id/course-progress/:courseId
Response: {
  totalActivities: 40,
  completedActivities: 26,
  percentage: 65,
  isEligibleForGraduation: false,
  remainingActivities: 14,
  averageRating: 8.5
}

// 3. Turmas disponíveis (precisa modificar)
GET /api/turmas/available-now?organizationId=xxx
Response: {
  openNow: [
    {
      id: 'uuid',
      name: 'Krav Maga - Faixa Branca',
      startTime: '18:00',
      endTime: '19:30',
      instructor: 'João Silva',
      room: 'Sala 1',
      availableSlots: 15,
      checkInOpens: '17:30',
      checkInCloses: '18:15'
    }
  ],
  upcoming: [
    {
      id: 'uuid',
      name: 'Combate Avançado',
      startTime: '20:00',
      dayOfWeek: 'Quinta',
      opensIn: '2h 15min'
    }
  ]
}

// 4. Recomendações de upsell (precisa criar)
GET /api/students/:id/upsell-recommendations
Response: {
  planUpgrade: {
    current: 'Básico',
    recommended: 'Ilimitado',
    benefits: [...],
    priceIncrease: 100
  },
  addOns: [
    { type: 'PERSONAL_TRAINING', price: 150 },
    { type: 'NUTRITION', price: 80 }
  ],
  products: [
    { name: 'Gi Oficial', price: 299 },
    { name: 'Luvas de Treino', price: 120 }
  ]
}
```

---

## 💡 Insights de Negócio

### Momentos de Conversão
1. **Plano vencido**: Tela de check-in = momento perfeito para reativar
2. **Próximo da graduação**: Vender exame + novo Gi + curso seguinte
3. **Plano básico**: Mostrar benefícios do ilimitado na hora do check-in
4. **Baixa frequência**: Notificar na tela de check-in incentivos

### Métricas a Acompanhar
- Taxa de conversão de upsell na tela de check-in
- Tempo médio de permanência na tela
- Cliques em recomendações de produto
- Reativações realizadas via check-in

---

**Prioridade**: ALTA  
**Impacto Esperado**: +15-25% em receita mensal  
**Tempo Estimado**: 3-4 horas de desenvolvimento  
