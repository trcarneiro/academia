# 🤖 Agente de Gestão de Matrículas e Planos

**Data de Criação**: 27/10/2025  
**Status**: ✅ ATIVO  
**ID**: `ecb685a1-d50a-4fe2-a3e2-7ec6efb5693a`

---

## 📋 Visão Geral

Agente pedagógico especializado em monitorar e gerenciar **matrículas de alunos**, **planos ativos**, **renovações** e **validação de cadastros**. Seu objetivo é otimizar a ocupação de turmas e evitar desistências através de análises automáticas e sugestões acionáveis.

---

## 🎯 Responsabilidades

1. **Monitoramento de Matrículas**
   - Identificar alunos com plano ativo mas sem matrícula em curso
   - Sugerir matrículas em cursos compatíveis com o nível do aluno
   - Alertar sobre vagas ociosas em turmas

2. **Gestão de Planos**
   - Alertar sobre planos próximos do vencimento (< 7 dias)
   - Sugerir renovações para planos vencidos recentemente (1-7 dias)
   - Identificar padrões de desistência (plano vencido + sem renovação)

3. **Validação de Cadastros**
   - Verificar completude de dados (CPF, email, telefone)
   - Validar existência de responsável financeiro
   - Alertar sobre dados obrigatórios faltantes

4. **Relatórios de Ocupação**
   - Gerar relatórios diários de ocupação de turmas
   - Identificar turmas com baixa ocupação (< 50%)
   - Sugerir ações para otimizar vagas disponíveis

---

## 🛠️ Ferramentas MCP Disponíveis

### 1. **Database Tool** (Consultas ao Banco)
- **Queries Pré-aprovadas**:
  - `active_students_without_course`: Alunos com plano ativo mas sem matrícula
  - `expiring_plans`: Planos que vencem em 7 dias
  - `expired_plans`: Planos vencidos nos últimos 7 dias
  - `incomplete_registrations`: Cadastros sem CPF, email ou telefone
  - `class_occupation`: Ocupação de turmas (ativas/vagas disponíveis)

### 2. **Notifications Tool** (Alertas)
- Enviar notificações para administradores sobre:
  - Planos expirando (HIGH priority)
  - Alunos sem matrícula (MEDIUM priority)
  - Cadastros incompletos (LOW priority)
- **Requer Permissão**: Sim (aprovação no dashboard)

### 3. **Reports Tool** (Relatórios)
- Gerar relatórios em PDF/CSV sobre:
  - Ocupação de turmas
  - Taxa de renovação de planos
  - Cadastros pendentes de validação
- **Requer Permissão**: Não (apenas leitura)

---

## 🤖 Fontes de Conhecimento (RAG)

O agente tem acesso aos seguintes contextos através do sistema RAG:

1. **Students**: Dados de alunos (nome, CPF, email, telefone, status)
2. **Courses**: Cursos disponíveis (nível, vagas, turmas)
3. **Subscriptions**: Planos ativos, validade, tipo, preço
4. **Lesson Plans**: Planos de aula e progressão (para sugerir curso adequado)

---

## ⏰ Análises Automáticas (Agendadas)

| Horário | Análise | Prioridade | Ação |
|---------|---------|------------|------|
| **08:00** | Planos vencendo em 7 dias | HIGH | Criar permissão para enviar notificação de renovação |
| **10:00** | Alunos com plano mas sem matrícula | MEDIUM | Sugerir matrícula em curso adequado |
| **14:00** | Cadastros incompletos | LOW | Listar alunos para contato e completar dados |
| **18:00** | Relatório de ocupação | INFO | Gerar relatório diário de vagas/ocupação |

---

## 📊 Formato de Sugestão

Quando o agente identifica uma ação necessária, ele cria uma **permissão pendente** com o seguinte formato:

```json
{
  "action": "enroll_student",
  "student": {
    "id": "a1b2c3d4-...",
    "name": "João Silva"
  },
  "course": {
    "id": "e5f6g7h8-...",
    "name": "Krav Maga - Faixa Branca"
  },
  "reason": "Aluno tem plano ativo (Mensal - R$ 149,90) válido até 05/11/2025 mas não está matriculado em nenhum curso. Sugiro matrícula em Faixa Branca pois é iniciante.",
  "priority": "MEDIUM",
  "expected_impact": "Garantir que aluno utilize o plano pago e não desista por falta de acompanhamento."
}
```

---

## 🔒 Sistema de Permissões

### Operações Livres (Sem Aprovação)
- Consultas SELECT em qualquer tabela (Student, Course, StudentCourse, Subscription)
- Gerar relatórios em PDF/CSV
- Análises e estatísticas

### Operações que Requerem Aprovação
- **Matricular aluno em curso** (INSERT StudentCourse)
- **Enviar notificações** (SMS, Email, Push)
- **Modificar dados** (UPDATE Student, Subscription)
- **Deletar registros** (qualquer DELETE)

Todas as operações que requerem aprovação criam uma **permissão pendente** que aparece no **Dashboard Widget** para o administrador aprovar ou recusar.

---

## 🎯 Métricas de Sucesso

O agente será considerado bem-sucedido se:

1. **Taxa de Renovação**: Aumentar renovações de planos em 15%
2. **Ocupação de Turmas**: Reduzir vagas ociosas em 20%
3. **Completude de Cadastros**: 95% dos alunos com dados completos
4. **Tempo de Resposta**: Alertas enviados < 24h após vencimento

---

## 🚀 Como Usar

### 1. Visualizar no Dashboard
- Acesse: http://localhost:3000/#agents
- Procure por **"Agente de Matrículas e Planos"** na seção "Seus Agentes"

### 2. Executar Análise Manual
- Clique no botão **"Executar"** no card do agente
- O agente fará uma análise completa e criará permissões pendentes
- Veja as permissões no **Dashboard Widget** (badge com contador)

### 3. Aprovar/Recusar Permissões
- No Dashboard, veja o widget **"Permissões Pendentes"**
- Clique em **"Aprovar ✅"** para executar ação
- Clique em **"Recusar ❌"** para ignorar sugestão
- O agente aprende com suas decisões

### 4. Configurar Análises Automáticas (Futuro)
- Implementar cron scheduling (node-cron)
- Executar agente automaticamente nos horários definidos
- Receber notificações de permissões pendentes via email/push

---

## 📚 Documentação Relacionada

- **Sistema MCP Completo**: `AGENTS_MCP_SYSTEM_COMPLETE.md`
- **Schema Prisma**: `prisma/schema.prisma` (linhas 2168-2195)
- **Serviço Orchestrator**: `src/services/agentOrchestratorService.ts`
- **Database Tool**: `src/services/mcp/databaseTool.ts`

---

## 🐛 Troubleshooting

### Agente não aparece na interface
```bash
# Verificar se foi criado no banco
npx prisma studio
# Navegar para tabela ai_agents
# Procurar por "Agente de Matrículas e Planos"
```

### Permissões não aparecem no Dashboard
- Verifique se o Dashboard Widget está carregado (`dashboard-widget.js`)
- Verifique console do navegador por erros
- Endpoint: GET `/api/agents/orchestrator/interactions`

### Erro ao executar agente
- Verifique logs do servidor backend
- Verifique se organizationId está correto (`452c0b35-1822-4890-851e-922356c812fb`)
- Verifique se Gemini API key está configurada (`.env`)

---

## 🔄 Próximas Melhorias

1. **WhatsApp Integration** - Enviar alertas via WhatsApp Business API
2. **Cron Scheduling** - Executar análises automáticas nos horários definidos
3. **Machine Learning** - Prever desistências baseado em padrões históricos
4. **Dashboard Analytics** - Visualizar métricas de sucesso do agente
5. **Multi-Agent Collaboration** - Integrar com agente financeiro (inadimplência)

---

## 📝 Changelog

### v1.0 (27/10/2025)
- ✅ Agente criado com especialização pedagógica
- ✅ MCP Tools: database, notifications, reports
- ✅ RAG Sources: students, courses, subscriptions, lesson_plans
- ✅ System prompt com regras e formato de sugestão
- ✅ Análises automáticas definidas (4 horários)
- ⏸️ Cron scheduling pendente (implementação futura)
- ⏸️ WhatsApp integration pendente (implementação futura)

---

**Autor**: Thiago Carneiro  
**Organização**: Academia Krav Maga v2.0  
**Contato**: trcampos@gmail.com
