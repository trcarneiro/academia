# 🤖 Como Acessar o Módulo de IA e Agentes

## 📍 Localização na Interface

### **Opção 1: Menu Lateral "RAG System"**
1. No menu lateral esquerdo, procure o item **"🧠 RAG System"**
2. Clique nele
3. Você será redirecionado automaticamente para o módulo de IA

### **Opção 2: URL Direta**
Acesse diretamente pela URL:
```
http://localhost:3000/#ai
```

## 🎯 O Que Você Verá

Ao abrir o módulo de IA, você verá um dashboard com **5 abas**:

### 1. **📊 Visão Geral** (Overview)
- Informações do aluno selecionado
- Busca por ID do aluno
- Ferramentas de análise

### 2. **📚 Cursos** (Courses)
- Cursos matriculados
- Progresso por curso

### 3. **📅 Frequência** (Attendance)
- Histórico de presença
- Análise de frequência

### 4. **💡 Insights AI** (Insights)
- Recomendações geradas por IA
- Análises preditivas

### 5. **🤖 Agentes IA** (NOVA - Implementada hoje!) ⭐
- **Esta é a aba que acabamos de criar!**
- Configuração e gerenciamento de agentes de IA
- CRUD completo (criar, editar, deletar, ativar/desativar)
- 5 tipos de agentes: Pedagógico, Analítico, Suporte, Progressão, Comercial

## 🎨 Como Acessar a Aba de Agentes

1. **Abra o módulo IA** (qualquer uma das opções acima)
2. **Procure pelas abas** na parte superior do dashboard
3. **Clique na aba "🤖 Agentes IA"** (última aba à direita)
4. Você verá:
   - **Estado vazio** (primeira vez)
   - Botão **"Criar Primeiro Agente"**
   - Filtros por especialização e status

## 🛠️ Funcionalidades da Aba Agentes

### **Criar Novo Agente**
Clique no botão **"+ Novo Agente"** e preencha:

**Seção 1: Informações Básicas**
- Nome do agente (ex: "Assistente Pedagógico")
- Descrição do propósito
- Especialização (5 opções)
- Modelo IA (Gemini Flash ou Pro)

**Seção 2: System Prompt**
- Instruções detalhadas para o agente
- Define comportamento e personalidade
- Apenas linguagem natural (sem código)

**Seção 3: Fontes de Conhecimento (RAG)**
- ✅ Cursos e Programas
- ✅ Técnicas e Golpes
- ✅ FAQs e Documentação
- ✅ Avaliações e Feedbacks

**Seção 4: Ferramentas MCP**
- ✅ getStudentData - Buscar dados de alunos
- ✅ getCourseData - Informações de cursos
- ✅ executeQuery - Consultas customizadas

**Seção 5: Configurações Avançadas**
- Temperature (criatividade) - 0 a 1
- Max Tokens - 256 a 8192
- Status ativo/inativo

### **Gerenciar Agentes Existentes**
Cada agente exibe:
- **Estatísticas**: Interações, avaliação (⭐), modelo
- **4 Botões de Ação**:
  - 💬 **Chat** - Conversar com o agente
  - ✏️ **Editar** - Modificar configurações
  - ⚡ **Toggle** - Ativar/desativar
  - 🗑️ **Delete** - Excluir (com confirmação)

### **Filtrar Agentes**
Use os filtros no topo:
- **Por Especialização**: Pedagógico, Analítico, Suporte, Progressão, Comercial
- **Por Status**: Ativos, Inativos

## 🧪 Status Atual (Importante!)

### ✅ **Frontend 100% Completo**
- Interface visual funcionando
- Formulários prontos
- Eventos configurados
- Design premium aplicado

### ⏳ **Backend em Desenvolvimento**
**O que está funcionando:**
- Módulo carrega corretamente
- Navegação entre abas
- Formulário abre e valida
- Console logs mostram dados (debugging)

**O que ainda não funciona:**
- ❌ Salvar agentes no banco de dados
- ❌ Listar agentes salvos
- ❌ Editar agentes existentes
- ❌ Deletar agentes
- ❌ Chat com agentes

**Motivo**: Aguardando implementação dos endpoints da API:
- `POST /api/agents` - Criar agente
- `GET /api/agents` - Listar agentes
- `PATCH /api/agents/:id` - Atualizar agente
- `DELETE /api/agents/:id` - Deletar agente

## 🔍 Como Testar Agora (Frontend Only)

1. **Abra o console do navegador** (F12 → Console)
2. **Navegue até a aba "Agentes IA"**
3. **Clique em "Criar Primeiro Agente"**
4. **Preencha o formulário**
5. **Clique em "Criar Agente"**
6. **Veja os dados logados no console**:
   ```javascript
   Creating agent: {
     name: "Assistente Pedagógico",
     description: "...",
     specialization: "pedagogical",
     model: "gemini-1.5-flash",
     systemPrompt: "...",
     ragSources: ["courses", "techniques"],
     mcpTools: ["getStudentData"],
     temperature: 0.7,
     maxTokens: 2048,
     isActive: true,
     noCodeMode: true,
     organizationId: "..."
   }
   ```

## 📊 Logs do Console para Validação

Ao acessar o módulo IA, você deve ver:
```
🤖 Initializing AI Module...
AI View initialized
✅ AI View rendered successfully
✅ AI Module initialized successfully
```

Ao clicar na aba "Agentes IA":
```
(Sem logs - comportamento normal)
```

Ao criar um agente:
```
Creating agent: { ... dados completos ... }
✅ Agente criado com sucesso! (Backend em desenvolvimento)
```

## 🐛 Troubleshooting

### **Aba "Agentes IA" não aparece**
**Causa**: View não renderizada corretamente  
**Solução**:
1. Recarregue a página (F5)
2. Verifique console por erros
3. Confirme que `ai-view.js` foi carregado

### **Formulário não abre**
**Causa**: Event listener não registrado  
**Solução**:
1. Abra console e digite: `window.ai?.view?.showAgentForm()`
2. Verifique se há erros de JavaScript

### **Módulo IA não carrega**
**Causa**: SPA router não encontra função de inicialização  
**Solução**:
1. Verifique console: "Timeout na inicialização"
2. Confirme que `index.js` tem `window.initializeAIModule`
3. Force reload: Ctrl+Shift+R

## 📁 Arquivos Relevantes

### **Frontend (Completo)**
- `public/js/modules/ai/index.js` - Módulo principal + função de inicialização
- `public/js/modules/ai/views/ai-view.js` - UI da aba Agentes (470+ linhas adicionadas)
- `public/js/modules/ai/controllers/ai-controller.js` - Lógica de controle
- `public/js/modules/ai/services/ai-service.js` - Serviço MCP

### **Roteamento**
- `public/js/dashboard/spa-router.js` - Linha 1120: Route 'ai'
- `public/js/dashboard/spa-router.js` - Linha 1212: Route 'rag' → redirect to 'ai'

### **Menu Lateral**
- `public/index.html` - Linha 104: Menu item "RAG System"

### **Backend (Pendente)**
- `prisma/schema.prisma` - Adicionar models AIAgent, AgentConversation
- `src/services/AgentService.ts` - CRUD + validação (a criar)
- `src/routes/agents.ts` - Endpoints API (a criar)

## 🚀 Próximos Passos

### **Para Desenvolvedores**
1. Implementar backend (veja `AI_AGENTS_FRONTEND_IMPLEMENTATION.md`)
2. Conectar frontend aos endpoints reais
3. Testar criação/edição/deleção
4. Implementar chat interface

### **Para Usuários**
1. Explore a interface atual
2. Teste o formulário de criação
3. Familiarize-se com os tipos de agentes
4. Aguarde implementação do backend para uso completo

## 📚 Documentação Adicional

- **`AI_AGENTS_ARCHITECTURE.md`** - Design completo do sistema (79KB)
- **`AI_AGENTS_FRONTEND_IMPLEMENTATION.md`** - Detalhes da implementação
- **`ai-agents-interface-preview.html`** - Preview visual standalone
- **`AGENTS.md`** - Guia de desenvolvimento v2.1

---

**Última Atualização**: 09/10/2025  
**Status**: Frontend completo, aguardando backend  
**Tempo Estimado para Backend**: 8-12 horas  
**Prioridade**: ALTA (feature crítica para automação)
