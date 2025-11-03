# 🧪 Exemplos Práticos de Uso - Sistema de Métodos de Execução

**Data**: 11/01/2025  
**Versão**: 1.0

---

## 📋 Cenários Reais de Uso

### Cenário 1: Enviar WhatsApp para Alunos Inativos
**Contexto**: 5 alunos não fizeram check-in há 30+ dias

#### Resposta do Agente
```json
{
  "summary": "Detectados 5 alunos inativos que requerem follow-up",
  "insights": [
    "5 alunos sem check-in há 30+ dias",
    "Taxa de inatividade: 18.5% (acima da meta de 10%)",
    "3 alunos têm plano ativo (risco de cancelamento)"
  ],
  "actions": [
    {
      "description": "Enviar WhatsApp para 5 alunos inativos oferecendo aula experimental gratuita",
      "executionMethod": "MCP_IMMEDIATE",
      "executionDetails": "Executarei via MCP Tools (database para buscar alunos + whatsapp para enviar mensagem personalizada) em aproximadamente 5-8 segundos",
      "requiresApproval": true,
      "schedule": null
    }
  ],
  "priority": "HIGH"
}
```

#### UI Renderizada
```
┌─────────────────────────────────────────────────────┐
│ 🔔 NOTIFICAÇÃO DE AGENTE                            │
│                                                     │
│ 📊 Detectados 5 alunos inativos que requerem...   │
│                                                     │
│ 💡 Insights:                                        │
│   • 5 alunos sem check-in há 30+ dias              │
│   • Taxa de inatividade: 18.5%                     │
│   • 3 alunos têm plano ativo                       │
│                                                     │
│ 🎯 Ações Sugeridas:                                 │
│   ⚡ Enviar WhatsApp para 5 alunos inativos...     │
│                                                     │
│   [⚡ Executar Agora] [✅ Marcar Lido] [🔕 Silenciar]│
└─────────────────────────────────────────────────────┘
```

#### Fluxo de Execução
1. **Usuário clica**: `⚡ Executar Agora`
2. **Toast**: "⏳ Preparando execução..."
3. **Backend**: Cria task + aprova automaticamente
4. **Backend**: Executa via MCP Tools
   - DatabaseTool: `SELECT * FROM Student WHERE lastCheckIn < NOW() - INTERVAL '30 days'`
   - WhatsAppTool: Envia mensagem personalizada para cada aluno
5. **Toast**: "✅ Ação executada via MCP!"
6. **Modal**: Resultado com detalhes

#### Modal de Resultado
```
┌─────────────────────────────────────────────────────┐
│ ⚡ Execução via MCP Concluída                       │
│                                                     │
│ ✅ Sucesso! Task executada via MCP                  │
│                                                     │
│ 🤖 Resposta do Agente                               │
│ Enviei WhatsApp para 5 alunos inativos:            │
│ - João Silva (30 dias inativo)                     │
│ - Maria Santos (45 dias inativa)                   │
│ - Pedro Oliveira (35 dias inativo)                 │
│ - Ana Costa (60 dias inativa)                      │
│ - Carlos Souza (32 dias inativo)                   │
│                                                     │
│ 🛠️ Ferramentas Utilizadas                          │
│ [database] [whatsapp]                              │
│                                                     │
│ 💡 Raciocínio                                        │
│ Busquei alunos inativos no banco e enviei          │
│ mensagem personalizada via WhatsApp oferecendo      │
│ aula experimental gratuita para reengajamento      │
│                                                     │
│ 📊 Resultado                                         │
│ {                                                   │
│   "sent": 5,                                        │
│   "failed": 0,                                      │
│   "students": ["João Silva", "Maria Santos", ...]  │
│ }                                                   │
│                                                     │
│ ⏱️ Executado em 6842ms                              │
│                                                     │
│                                    [Fechar]         │
└─────────────────────────────────────────────────────┘
```

---

### Cenário 2: Monitorar Frequência Diariamente
**Contexto**: Administrador quer relatório diário de frequência às 08h

#### Resposta do Agente
```json
{
  "summary": "Configuração de monitoramento diário de frequência",
  "insights": [
    "Frequência média atual: 78% (meta: 85%)",
    "Horários de pico: 18h-20h (65% das presenças)",
    "Segunda-feira tem menor frequência (62%)"
  ],
  "actions": [
    {
      "description": "Monitorar frequência diária e enviar relatório às 08h",
      "executionMethod": "TASK_SCHEDULED",
      "executionDetails": "Criarei uma task agendada que rodará automaticamente todo dia às 08h. A task buscará dados de frequência do dia anterior e enviará relatório por email",
      "requiresApproval": false,
      "schedule": "daily 08:00"
    }
  ],
  "priority": "MEDIUM"
}
```

#### UI Renderizada
```
┌─────────────────────────────────────────────────────┐
│ 🔔 NOTIFICAÇÃO DE AGENTE                            │
│                                                     │
│ 📊 Configuração de monitoramento diário...         │
│                                                     │
│ 💡 Insights:                                        │
│   • Frequência média: 78% (meta: 85%)              │
│   • Horários de pico: 18h-20h                      │
│                                                     │
│ 🎯 Ações Sugeridas:                                 │
│   📅 Monitorar frequência diária às 08h            │
│                                                     │
│   [📅 Agendar Task] [✅ Marcar Lido]               │
└─────────────────────────────────────────────────────┘
```

#### Fluxo de Execução
1. **Usuário clica**: `📅 Agendar Task`
2. **Prompt aparece**: "Agendamento (ex: daily 08:00, weekly monday 10:00):"
3. **Usuário confirma**: "daily 08:00" (já pré-preenchido)
4. **Toast**: "📅 Criando task agendada..."
5. **Backend**: Cria task com `actionPayload.schedule = "daily 08:00"`
6. **Toast**: "✅ Task agendada criada!"
7. **Redirect**: Dashboard (onde task aparece na lista)

#### Task Criada (Visível no Dashboard)
```
┌─────────────────────────────────────────────────────┐
│ 📅 TASK AGENDADA                                    │
│                                                     │
│ Título: Task Agendada: Monitorar frequência...     │
│ Status: PENDING                                     │
│ Prioridade: LOW                                     │
│ Criado: 11/01/2025 14:30                           │
│                                                     │
│ 📋 Descrição:                                       │
│ Monitorar frequência diária e enviar relatório     │
│ às 08h                                              │
│                                                     │
│ ⏰ Agendamento:                                      │
│ Executará todo dia às 08:00                        │
│                                                     │
│ [✅ Aprovar] [❌ Recusar] [🗑️ Deletar]             │
└─────────────────────────────────────────────────────┘
```

---

### Cenário 3: Revisar Currículo do Curso
**Contexto**: Agente identifica que curso precisa de revisão humana

#### Resposta do Agente
```json
{
  "summary": "Curso Faixa Branca necessita revisão curricular",
  "insights": [
    "35 alunos matriculados (capacidade: 40)",
    "Aulas 15-20 têm feedback negativo (rating médio: 3.2/5)",
    "Técnicas de defesa contra faca pouco praticadas"
  ],
  "actions": [
    {
      "description": "Revisar currículo do curso Faixa Branca (aulas 15-20) e ajustar técnicas de defesa",
      "executionMethod": "USER_INTERVENTION",
      "executionDetails": "Esta ação requer análise pedagógica profunda e decisões sobre modificações curriculares. Não pode ser automatizada. Requer reunião com instrutores seniores",
      "requiresApproval": false,
      "schedule": null
    }
  ],
  "priority": "MEDIUM"
}
```

#### UI Renderizada
```
┌─────────────────────────────────────────────────────┐
│ 🔔 NOTIFICAÇÃO DE AGENTE                            │
│                                                     │
│ 📊 Curso Faixa Branca necessita revisão...         │
│                                                     │
│ 💡 Insights:                                        │
│   • 35 alunos matriculados (capacidade: 40)        │
│   • Aulas 15-20: rating 3.2/5                      │
│   • Defesa contra faca pouco praticada             │
│                                                     │
│ 🎯 Ações Sugeridas:                                 │
│   👤 Revisar currículo (aulas 15-20)               │
│                                                     │
│   [👤 Requer Ação] [✅ Marcar Lido]                │
└─────────────────────────────────────────────────────┘
```

#### Fluxo de Execução
1. **Usuário clica**: `👤 Requer Ação`
2. **Toast**: "👤 Esta ação requer intervenção manual"
3. **Alert aparece**:
```
⚠️ AÇÃO REQUER INTERVENÇÃO HUMANA

Revisar currículo do curso Faixa Branca (aulas 15-20) 
e ajustar técnicas de defesa

Esta ação requer análise pedagógica profunda e decisões 
sobre modificações curriculares. Não pode ser automatizada. 
Requer reunião com instrutores seniores.

Por favor, execute manualmente no sistema.

[OK]
```

---

### Cenário 4: Executar Task Aprovada
**Contexto**: Task de envio de relatório foi aprovada, aguardando execução

#### Task Aprovada (Dashboard)
```
┌─────────────────────────────────────────────────────┐
│ ✅ TASK APROVADA                                    │
│                                                     │
│ Título: Gerar relatório mensal de inadimplência    │
│ Status: APPROVED                                    │
│ Prioridade: MEDIUM                                  │
│ Aprovado por: trcampos@gmail.com                   │
│ Aprovado em: 11/01/2025 14:45                      │
│                                                     │
│ 📋 Descrição:                                       │
│ Gerar relatório completo de inadimplência com       │
│ alunos atrasados > 15 dias e enviar por email      │
│                                                     │
│ 💡 Raciocínio:                                       │
│ Insights:                                           │
│ - 12 alunos atrasados > 15 dias                    │
│ - R$ 3.850 em mensalidades pendentes               │
│                                                     │
│ [⚡ Executar Task] [🗑️ Deletar]                    │
└─────────────────────────────────────────────────────┘
```

#### Fluxo de Execução
1. **Usuário clica**: `⚡ Executar Task`
2. **Confirm dialog**: "⚡ Executar esta task agora via MCP?"
3. **Usuário confirma**: OK
4. **Toast**: "🤖 Executando task via MCP..."
5. **Backend**: Executa via POST `/api/agent-tasks/:id/execute-mcp`
   - DatabaseTool: Busca alunos atrasados
   - ReportTool: Gera PDF
   - EmailTool: Envia relatório
6. **Toast**: "✅ Task executada com sucesso!"
7. **Modal**: Resultado detalhado

#### Modal de Resultado
```
┌─────────────────────────────────────────────────────┐
│ ⚡ Execução via MCP Concluída                       │
│                                                     │
│ ✅ Sucesso! Task executada via MCP                  │
│                                                     │
│ 🤖 Resposta do Agente                               │
│ Relatório de inadimplência gerado com sucesso!     │
│ - 12 alunos identificados                          │
│ - R$ 3.850 em pendências                           │
│ - PDF gerado: relatorio-inadimplencia-jan2025.pdf  │
│ - Email enviado para: admin@academia.com           │
│                                                     │
│ 🛠️ Ferramentas Utilizadas                          │
│ [database] [report] [email]                        │
│                                                     │
│ 💡 Raciocínio                                        │
│ Busquei alunos com pagamentos atrasados > 15 dias  │
│ no banco de dados, gerei relatório detalhado em    │
│ PDF e enviei por email para administração          │
│                                                     │
│ 📊 Resultado                                         │
│ {                                                   │
│   "studentsFound": 12,                             │
│   "totalAmount": 3850.00,                          │
│   "reportGenerated": true,                         │
│   "emailSent": true,                               │
│   "recipients": ["admin@academia.com"]             │
│ }                                                   │
│                                                     │
│ ⏱️ Executado em 8234ms                              │
│                                                     │
│                                    [Fechar]         │
└─────────────────────────────────────────────────────┘
```

---

## 🎨 Comparação Visual: Antes vs Depois

### ANTES (Sem Métodos de Execução) ❌
```
┌─────────────────────────────────────────────────────┐
│ 🔔 NOTIFICAÇÃO DE AGENTE                            │
│                                                     │
│ 📊 Detectados 5 alunos inativos                    │
│                                                     │
│ 💡 Insights:                                        │
│   • 5 alunos sem check-in há 30+ dias              │
│                                                     │
│ 🎯 Ações Sugeridas:                                 │
│   • Enviar WhatsApp para 5 alunos                  │
│   • Monitorar frequência diária                    │
│                                                     │
│   [✅ Marcar Lido] [🔕 Silenciar]                  │
│                                                     │
│ ⚠️ PROBLEMA: Usuário não sabe COMO executar        │
└─────────────────────────────────────────────────────┘

Usuário precisa:
1. Ler ação
2. Navegar para módulo Tasks
3. Criar task manualmente
4. Aprovar task
5. Executar task
6. Voltar para dashboard

❌ 6 passos | ❌ 3+ minutos | ❌ Sem clareza
```

### DEPOIS (Com Métodos de Execução) ✅
```
┌─────────────────────────────────────────────────────┐
│ 🔔 NOTIFICAÇÃO DE AGENTE                            │
│                                                     │
│ 📊 Detectados 5 alunos inativos                    │
│                                                     │
│ 💡 Insights:                                        │
│   • 5 alunos sem check-in há 30+ dias              │
│                                                     │
│ 🎯 Ações Sugeridas:                                 │
│   ⚡ Enviar WhatsApp para 5 alunos                 │
│   [⚡ Executar Agora] ← MCP_IMMEDIATE (5-10s)      │
│                                                     │
│   📅 Monitorar frequência diária                   │
│   [📅 Agendar Task] ← TASK_SCHEDULED (daily 08h)  │
│                                                     │
│   [✅ Marcar Lido] [🔕 Silenciar]                  │
│                                                     │
│ ✅ SOLUÇÃO: Botões claros + execução 1 clique      │
└─────────────────────────────────────────────────────┘

Usuário precisa:
1. Ler ação
2. Clicar botão apropriado (⚡ ou 📅)
3. Aguardar resultado (5-10s)

✅ 3 passos | ✅ < 30 segundos | ✅ 100% clareza
```

---

## 💡 Dicas de Uso

### Para Administradores
1. **Priorize MCP_IMMEDIATE**: Ações pontuais (enviar mensagem, gerar relatório) são rápidas e eficientes
2. **Use TASK_SCHEDULED**: Para monitoramentos recorrentes (frequência diária, relatórios semanais)
3. **USER_INTERVENTION**: Apenas para decisões complexas que REALMENTE precisam de humano

### Para Desenvolvedores
1. **Sempre especifique `executionDetails`**: Explique EXATAMENTE como será feito
2. **Use `requiresApproval: true`**: Para ações críticas (enviar mensagens, alterar banco)
3. **Forneça `schedule` claro**: "daily 08:00", não "todo dia de manhã"
4. **JSON estruturado**: Sempre retorne formato completo (não strings simples)

### Para IAs (Agentes)
1. **Escolha método correto**:
   - Pode executar agora? → `MCP_IMMEDIATE`
   - Precisa repetir? → `TASK_SCHEDULED`
   - Decisão complexa? → `USER_INTERVENTION`
2. **Seja específico em `executionDetails`**:
   - ✅ "Executarei via MCP Tools (database + whatsapp) em ~8 segundos"
   - ❌ "Farei isso rapidamente"
3. **Forneça `schedule` real**:
   - ✅ "daily 08:00"
   - ❌ "todo dia de manhã"

---

## 📚 Exemplos de JSON Completos

### Exemplo 1: Notificação de Planos Vencendo
```json
{
  "summary": "7 alunos com plano vencendo nos próximos 7 dias",
  "insights": [
    "7 planos vencendo entre 11/01 e 18/01",
    "R$ 1.890 em renovações potenciais",
    "3 alunos não renovaram no mês passado (risco alto)"
  ],
  "actions": [
    {
      "description": "Enviar WhatsApp para 7 alunos oferecendo renovação com desconto de 10%",
      "executionMethod": "MCP_IMMEDIATE",
      "executionDetails": "Executarei via MCP Tools: (1) Database para buscar alunos com plano vencendo em 7 dias, (2) WhatsApp para enviar mensagem personalizada com link de renovação. Tempo estimado: 6-8 segundos",
      "requiresApproval": true,
      "schedule": null
    }
  ],
  "priority": "HIGH"
}
```

### Exemplo 2: Relatório Semanal de Ocupação
```json
{
  "summary": "Configuração de relatório semanal de ocupação de turmas",
  "insights": [
    "Ocupação média: 68% (meta: 80%)",
    "Turma Segunda 18h: apenas 45% ocupada",
    "Turma Quinta 19h: 95% ocupada (quase cheia)"
  ],
  "actions": [
    {
      "description": "Gerar relatório semanal de ocupação de turmas e enviar todo segunda às 10h",
      "executionMethod": "TASK_SCHEDULED",
      "executionDetails": "Criarei task agendada que executará toda segunda-feira às 10h. A task buscará dados de ocupação da semana anterior (check-ins por turma), gerará relatório em PDF e enviará por email para coordenação pedagógica",
      "requiresApproval": false,
      "schedule": "weekly monday 10:00"
    }
  ],
  "priority": "MEDIUM"
}
```

### Exemplo 3: Análise de Feedback Negativo
```json
{
  "summary": "Aula 23 (Defesa contra Gravata) recebeu 8 feedbacks negativos",
  "insights": [
    "8 de 12 alunos (67%) avaliaram aula como 'difícil demais'",
    "Técnica requer mais tempo de prática (15min vs 5min atual)",
    "Instrutor Junior tem dificuldade em explicar movimento"
  ],
  "actions": [
    {
      "description": "Revisar plano de aula 23 e considerar: (1) aumentar tempo de prática, (2) adicionar vídeo demonstrativo, (3) treinar instrutor Junior",
      "executionMethod": "USER_INTERVENTION",
      "executionDetails": "Esta ação requer análise pedagógica detalhada e decisões sobre modificações no plano de aula. Não pode ser automatizada. Requer reunião com coordenador pedagógico e instrutor sênior para discutir ajustes",
      "requiresApproval": false,
      "schedule": null
    }
  ],
  "priority": "HIGH"
}
```

---

## ✅ Resultado Final

Este sistema transforma **sugestões vagas** em **ações executáveis** com transparência total para o usuário.

**Próximo teste**: Execute um agente real e veja os métodos em ação! 🚀
