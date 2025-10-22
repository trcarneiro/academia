# 🤖 Guia de Uso - Interface de Gerenciamento de Agentes IA

## ✅ Implementação Completa (10/10/2025)

Sistema web para criar, editar e gerenciar agentes de IA especializados, incluindo o **Professor Virtual de Artes Marciais** (Curriculum Agent).

---

## 🎯 Funcionalidades Implementadas

### 1️⃣ **Criação de Agentes**
- ✅ Formulário completo com validação
- ✅ 6 especializações disponíveis (incluindo "curriculum")
- ✅ Modelos Gemini 1.5 Pro e Flash
- ✅ System Prompt customizável (mínimo 50 caracteres)
- ✅ Configurações avançadas (temperatura, maxTokens)

### 2️⃣ **Listagem de Agentes**
- ✅ Grid responsivo com cards visuais
- ✅ Status ativo/inativo com indicador visual
- ✅ Ícones por especialização
- ✅ Informações de modelo e descrição

### 3️⃣ **Edição de Agentes** 🆕
- ✅ Modal completo com todos os campos
- ✅ Edição de system prompt
- ✅ Alteração de modelo e parâmetros
- ✅ Toggle de status (ativo/inativo)
- ✅ Validação em tempo real

### 4️⃣ **Exclusão de Agentes**
- ✅ Confirmação antes de deletar
- ✅ Integração com backend
- ✅ Atualização automática da lista

---

## 🚀 Como Usar

### **Acessar a Interface**
1. Inicie o servidor: `npm run dev`
2. Abra: `http://localhost:3000`
3. No menu lateral, clique em **"IA & Agentes"**

### **Criar Novo Agente**

1. **Preencha o formulário** "Criar Novo Agente":
   - **Nome**: Ex: "Analista de Performance"
   - **Especialização**: Escolha entre:
     - 🎓 Pedagógico
     - 📚 **Curricular (Planos de Curso/Aula)** ← Curriculum Agent
     - 📊 Análise de Dados
     - 👥 Suporte ao Aluno
     - ⚡ Progressão e Performance
     - 💰 Comercial e Financeiro
   - **Modelo IA**: 
     - 🧠 Gemini 1.5 Pro (mais inteligente)
     - ⚡ Gemini 1.5 Flash (mais rápido) ← Padrão
   - **Instruções do Sistema**: Prompt de pelo menos 50 caracteres

2. **Clique em** "🤖 Criar Agente"

3. **Resultado**: Agente aparecerá na lista "Agentes Cadastrados"

### **Editar Agente Existente**

1. **Localize o agente** na lista "Agentes Cadastrados"
2. **Clique em** "⚙️ Configurar"
3. **Modal de edição abrirá** com campos:
   - Nome
   - Especialização
   - Modelo IA
   - Temperatura (0-1)
   - Max Tokens (256-8192)
   - Status (Ativo/Inativo)
   - System Prompt (editável)
   - Descrição (opcional)
4. **Faça as alterações** desejadas
5. **Clique em** "💾 Salvar Alterações"

### **Excluir Agente**

1. **Localize o agente** na lista
2. **Clique em** "🗑️ Excluir"
3. **Confirme** a exclusão no alerta
4. **Agente será removido** permanentemente

---

## 📚 Editar o Curriculum Agent

### **Professor Virtual de Artes Marciais**

Se você executou o seed script (`npm run seed:curriculum-agent`), o agent já está criado com:

- **Nome**: Professor Virtual de Artes Marciais
- **Especialização**: `curriculum`
- **Modelo**: `gemini-1.5-pro`
- **System Prompt**: Prompt especializado em Krav Maga, Jiu Jitsu, pedagogia esportiva

### **Para Editar:**

1. Na lista de agentes, **localize** "Professor Virtual de Artes Marciais"
2. **Clique em** "⚙️ Configurar"
3. **Modifique** qualquer campo:
   - Alterar nome
   - Mudar de `gemini-1.5-pro` → `gemini-1.5-flash` (mais rápido)
   - Ajustar temperatura (0.7 = balanceado)
   - Editar system prompt (expertise, instruções)
   - Adicionar descrição
4. **Salve** as alterações

---

## 🎨 Interface Visual

### **Cards de Agentes**
```
┌─────────────────────────────────────┐
│ 📚  Professor Virtual               │
│     de Artes Marciais               │
│     🟢 Ativo                        │
│                                     │
│ 📱 gemini-1.5-pro                   │
│ Sistema especializado em...         │
│                                     │
│ [💬 Conversar] [⚙️ Configurar]    │
│ [🗑️ Excluir]                       │
└─────────────────────────────────────┘
```

### **Modal de Edição**
```
┌───────────────────────────────────────────┐
│ ⚙️ Configurar Agente: Professor Virtual │
│                                      [✕]  │
├───────────────────────────────────────────┤
│ Nome: [Professor Virtual...]              │
│ Especialização: [📚 Curricular]          │
│ Modelo: [🧠 Gemini 1.5 Pro]              │
│ Temperatura: [━━●━━━━] 0.7               │
│ Max Tokens: [2048]                        │
│ Status: [🟢 Ativo]                       │
│                                           │
│ System Prompt:                            │
│ [Você é um educador físico...]           │
│                                           │
│ Descrição (opcional):                     │
│ [Agent especializado em...]               │
├───────────────────────────────────────────┤
│           [Cancelar]  [💾 Salvar]        │
└───────────────────────────────────────────┘
```

---

## 🔧 Arquivos Modificados

### **Frontend**
- ✅ `public/js/modules/ai.js` (+150 linhas)
  - Atualizado formulário de criação
  - Implementado `editAgent()` e `saveAgentEdit()`
  - Atualizado `deleteAgent()` com confirmação
  - Corrigidos ícones de especialização
  - Ajustado `renderAgentsGrid()` para usar `isActive`

- ✅ `public/css/modules/ai.css` (+300 linhas)
  - Estilos de modal overlay
  - Modal content responsivo
  - Agent cards premium
  - Botões e animações

### **Backend** (já existente)
- ✅ `src/routes/agents.ts` - Endpoints CRUD completos
- ✅ `src/services/AgentService.ts` - Lógica de negócio
- ✅ `prisma/schema.prisma` - Modelo AIAgent

---

## 📊 Schema Prisma (Referência)

```prisma
model AIAgent {
  id              String              @id @default(uuid())
  organizationId  String
  name            String              // Nome do agente
  description     String?             // Descrição opcional
  specialization  AgentSpecialization // pedagogical, curriculum, etc
  model           String              // gemini-1.5-pro, gemini-1.5-flash
  systemPrompt    String              @db.Text
  temperature     Float               @default(0.7)
  maxTokens       Int                 @default(2048)
  ragSources      String[]            // Fontes de dados RAG
  mcpTools        String[]            // Ferramentas MCP disponíveis
  isActive        Boolean             @default(true)
  isPublic        Boolean             @default(false)
  noCodeMode      Boolean             @default(true)
  
  // ... relações
}

enum AgentSpecialization {
  pedagogical  // 🎓 Pedagógico
  curriculum   // 📚 Curricular (Planos de Curso/Aula)
  analytical   // 📊 Análise de Dados
  support      // 👥 Suporte ao Aluno
  progression  // ⚡ Progressão e Performance
  commercial   // 💰 Comercial e Financeiro
}
```

---

## 🧪 Testes de Validação

### **1. Criar Agent**
```bash
# Via interface web:
1. Preencher formulário
2. Clicar "🤖 Criar Agente"
3. ✅ Verificar: Agent aparece na lista
4. ✅ Verificar: Alert "Agente criado com sucesso!"
```

### **2. Editar Agent**
```bash
# Via interface web:
1. Clicar "⚙️ Configurar" em um agent
2. ✅ Modal abre com dados preenchidos
3. Alterar "Temperatura" para 0.5
4. Clicar "💾 Salvar Alterações"
5. ✅ Modal fecha
6. ✅ Lista atualiza automaticamente
```

### **3. Deletar Agent**
```bash
# Via interface web:
1. Clicar "🗑️ Excluir" em um agent
2. ✅ Confirmação aparece
3. Confirmar exclusão
4. ✅ Agent desaparece da lista
```

### **4. Validação Backend**
```bash
# Via Prisma Studio:
npx prisma studio

# Verificar tabela AIAgent:
✅ Professor Virtual de Artes Marciais existe
✅ specialization = "curriculum"
✅ model = "gemini-1.5-pro"
✅ systemPrompt tem ~1000+ caracteres
```

---

## 🐛 Troubleshooting

### **Agent não aparece na lista**
```bash
# Verificar no console do navegador:
F12 → Console

# Deve aparecer:
✅ Enhanced AI Module initialized successfully
✅ API helper loaded

# Se não aparecer, verificar:
1. Servidor rodando: npm run dev
2. URL correta: http://localhost:3000
3. Erros no console
```

### **Erro ao salvar edição**
```bash
# Verificar campos obrigatórios:
✅ Nome preenchido
✅ System Prompt > 50 caracteres

# Verificar console (F12):
- Erro 400: Validação falhou (campo inválido)
- Erro 404: Agent não encontrado
- Erro 500: Problema no servidor
```

### **Modal não fecha**
```bash
# Usar botão "✕" no canto superior direito
# Ou clicar em "Cancelar"
# Ou clicar fora do modal (overlay)
```

---

## 🎯 Próximos Passos (Opcional)

### **1. Integrar Chat com Agente**
- Implementar funcionalidade de "💬 Conversar"
- Interface de chat em tempo real
- Histórico de conversas

### **2. Estatísticas Avançadas**
- Dashboards de uso por agente
- Métricas de performance
- Relatórios de tarefas executadas

### **3. Compartilhamento de Agentes**
- Toggle `isPublic` na interface
- Marketplace de agentes
- Templates pré-configurados

---

## 📝 Checklist de Validação

- [x] Formulário de criação funcional
- [x] Especialização "curriculum" disponível
- [x] Modelos Gemini Pro e Flash disponíveis
- [x] Listagem de agents com cards visuais
- [x] Modal de edição completo
- [x] Validação de campos obrigatórios
- [x] Integração com backend (CRUD completo)
- [x] Exclusão com confirmação
- [x] Atualização automática da lista
- [x] Estilos premium aplicados
- [x] Responsivo em mobile/tablet/desktop
- [x] Zero erros no console
- [x] Professor Virtual de Artes Marciais editável

---

## 🎉 Conclusão

Sistema **100% funcional** para gerenciar agentes de IA, incluindo o **Curriculum Agent** (Professor Virtual de Artes Marciais).

**Você pode agora**:
- ✅ Criar novos agentes especializados
- ✅ Editar o Curriculum Agent via interface
- ✅ Ajustar parâmetros (temperatura, tokens)
- ✅ Modificar system prompts
- ✅ Ativar/desativar agents conforme necessário

**Teste agora**: Acesse `http://localhost:3000/#ai` e clique em "⚙️ Configurar" no agent "Professor Virtual de Artes Marciais"! 🚀
