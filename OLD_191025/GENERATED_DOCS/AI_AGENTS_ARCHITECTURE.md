# 🤖 Sistema de Agentes IA - Arquitetura v1.0
**Academia Krav Maga - AI Agents & RAG Platform**

---

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Tipos de Agentes](#tipos-de-agentes)
4. [Camadas do Sistema](#camadas-do-sistema)
5. [Fluxo de Dados](#fluxo-de-dados)
6. [Tecnologias](#tecnologias)
7. [Schemas de Dados](#schemas-de-dados)
8. [APIs e Endpoints](#apis-e-endpoints)
9. [Frontend - Interface de Agentes](#frontend---interface-de-agentes)
10. [Segurança e Permissões](#segurança-e-permissões)
11. [Roadmap de Implementação](#roadmap-de-implementação)

---

## 🎯 Visão Geral

### Objetivo
Criar um **sistema modular de agentes IA** que:
- ✅ Permite cadastro e gerenciamento de agentes especializados
- ✅ Integra Gemini AI + RAG contextual
- ✅ Acessa TODAS as APIs do sistema via MCP (Model Context Protocol)
- ✅ **NÃO escreve código** nas respostas (apenas orienta, sugere, analisa)
- ✅ Suporta extensão via ferramentas externas (MCP tools)

### Princípios
1. **Modularidade**: Cada agente é independente e especializado
2. **RAG-First**: Todo conhecimento vem do contexto (documentos + dados reais)
3. **No-Code Output**: Agentes orientam, não escrevem código
4. **Tool-Augmented**: Podem chamar ferramentas do sistema (MCP)
5. **Multi-Tenant**: Cada organização tem seus agentes

---

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (UI)                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Agent       │  │  Chat        │  │  RAG         │     │
│  │  Manager     │  │  Interface   │  │  Browser     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND APIs                               │
│  /api/agents  |  /api/chat  |  /api/rag  |  /api/mcp       │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                 AGENT ORCHESTRATOR                           │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │ Agent      │  │ Context    │  │ Tool       │           │
│  │ Executor   │  │ Manager    │  │ Dispatcher │           │
│  └────────────┘  └────────────┘  └────────────┘           │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    AI LAYER                                  │
│  ┌────────────────────┐  ┌──────────────────────┐          │
│  │  Gemini Service    │  │  RAG Service         │          │
│  │  - Flash/Pro       │  │  - Embeddings        │          │
│  │  - System Prompts  │  │  - Vector Search     │          │
│  │  - No-Code Rules   │  │  - Context Assembly  │          │
│  └────────────────────┘  └──────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                 KNOWLEDGE BASE                               │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐              │
│  │ Documents │  │ Courses   │  │ Students  │              │
│  │ RAG       │  │ Lessons   │  │ Analytics │              │
│  └───────────┘  └───────────┘  └───────────┘              │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    MCP TOOLS                                 │
│  API Access | Database Query | File System | External APIs  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🤖 Tipos de Agentes

### 1. **Agente Pedagógico** 🎓
- **Especialização**: Criação de conteúdo educacional
- **Acesso**: Courses, Lessons, Techniques, Evaluations
- **Ferramentas MCP**: 
  - `getCourseData`
  - `getLessonPlan`
  - `getTechniqueDetails`
  - `generateEvaluationCriteria`
- **Prompts Base**:
  - "Analise a progressão do curso Faixa Branca e sugira melhorias"
  - "Quais técnicas estão faltando na aula 8?"
  - "Como adaptar este plano de aula para alunos Master?"

**Exemplo de Resposta (NO-CODE)**:
```
📊 ANÁLISE DO CURSO FAIXA BRANCA

Progressão Identificada:
- Aulas 1-4: Fundamentos (Stance, Bloqueios)
- Aulas 5-8: Combinações (360° Defense + Counter)
- Aulas 9-12: Aplicação Prática

Sugestões de Melhoria:
1. Adicionar revisão de Stance na aula 6 (reforço)
2. Incluir drill de cardio entre aulas 7-8 (condicionamento)
3. Criar checkpoint de avaliação na aula 10

Próximos Passos Recomendados:
→ Revisar ordem das técnicas nas aulas 5-6
→ Adicionar 15min de sparring controlado na aula 9
→ Criar critérios de avaliação para certificação
```

### 2. **Agente Analítico** 📊
- **Especialização**: Análise de dados e métricas
- **Acesso**: Attendance, Progress, Assessments, Analytics
- **Ferramentas MCP**:
  - `getStudentData`
  - `getAttendanceStats`
  - `executeQuery` (SQL analítico)
  - `getSystemAnalytics`
- **Prompts Base**:
  - "Quais alunos estão em risco de evasão?"
  - "Qual a taxa de aprovação por faixa?"
  - "Identifique padrões de frequência dos alunos Master"

### 3. **Agente de Suporte** 💬
- **Especialização**: Atendimento e orientação
- **Acesso**: Students, Subscriptions, Classes, Instructors
- **Ferramentas MCP**:
  - `getStudentProfile`
  - `getClassSchedule`
  - `getInstructorAvailability`
- **Prompts Base**:
  - "Como renovar minha assinatura?"
  - "Quais aulas posso participar com minha faixa?"
  - "Quem é o instrutor da turma de terça 19h?"

### 4. **Agente de Progressão** 🎯
- **Especialização**: Planejamento de evolução
- **Acesso**: Student Progress, Evaluations, Techniques
- **Ferramentas MCP**:
  - `getStudentProgress`
  - `getNextBelt`
  - `getTechniqueMastery`
  - `generateTrainingPlan`
- **Prompts Base**:
  - "O que João precisa melhorar para Faixa Amarela?"
  - "Monte um plano de 3 meses para Master 2"
  - "Quais técnicas ainda não domino para avaliação?"

### 5. **Agente Comercial** 💰
- **Especialização**: Vendas e retenção
- **Acesso**: Subscriptions, Billing, Leads, CRM
- **Ferramentas MCP**:
  - `getActiveSubscriptions`
  - `getExpiringPlans`
  - `getLeadConversionRate`
  - `calculateLTV`
- **Prompts Base**:
  - "Quais alunos têm plano expirando em 7 dias?"
  - "Qual o melhor plano para um aluno iniciante?"
  - "Como está a taxa de conversão deste mês?"

---

## 📚 Camadas do Sistema

### Layer 1: Database (Prisma)
```prisma
model AIAgent {
  id              String   @id @default(cuid())
  organizationId  String
  name            String
  description     String?
  specialization  String   // 'pedagogical', 'analytical', 'support', etc.
  model           String   @default("gemini-1.5-flash")
  systemPrompt    String   @db.Text
  temperature     Float    @default(0.7)
  maxTokens       Int      @default(2000)
  ragEnabled      Boolean  @default(true)
  ragSources      String[] // ['courses', 'techniques', 'students']
  mcpTools        String[] // ['getCourseData', 'getStudentData']
  isActive        Boolean  @default(true)
  isPublic        Boolean  @default(false) // Compartilhável entre orgs
  
  // Controle de uso
  totalInteractions Int    @default(0)
  lastUsedAt       DateTime?
  averageRating    Float?
  
  // Configurações avançadas
  noCodeMode       Boolean  @default(true) // Nunca retorna código
  maxContextDocs   Int      @default(5)
  contextWindow    Int      @default(8000)
  
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  
  organization     Organization @relation(fields: [organizationId], references: [id])
  conversations    AgentConversation[]
  
  @@index([organizationId, specialization])
  @@map("ai_agents")
}

model AgentConversation {
  id              String   @id @default(cuid())
  agentId         String
  userId          String?
  organizationId  String
  sessionId       String   @default(cuid())
  
  // Mensagens
  messages        Json[]   // [{role: 'user'|'agent', content: string, timestamp: Date}]
  
  // Contexto usado
  ragDocuments    Json[]   // Documentos recuperados do RAG
  mcpToolsCalled  String[] // Ferramentas MCP chamadas
  tokensUsed      Int      @default(0)
  
  // Feedback
  userRating      Int?     // 1-5 estrelas
  userFeedback    String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  agent           AIAgent  @relation(fields: [agentId], references: [id])
  
  @@index([agentId, createdAt])
  @@index([organizationId, sessionId])
  @@map("agent_conversations")
}

model RAGDocument {
  id              String   @id @default(cuid())
  organizationId  String
  name            String
  category        String   // 'course', 'technique', 'manual', 'faq'
  contentType     String   // 'json', 'pdf', 'markdown'
  content         String   @db.Text
  
  // Metadata
  tags            String[]
  fileSize        Int?
  uploadedBy      String?
  
  // Embedding (futuro - vector DB)
  hasEmbedding    Boolean  @default(false)
  embeddingModel  String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  organization    Organization @relation(fields: [organizationId], references: [id])
  
  @@index([organizationId, category])
  @@map("rag_documents")
}
```

### Layer 2: Backend Services

#### `AgentService.ts`
**Responsabilidades**:
- CRUD de agentes
- Validação de especializações
- Configuração de system prompts
- Gestão de ferramentas MCP permitidas

**Métodos Principais**:
```typescript
class AgentService {
  createAgent(data: CreateAgentDTO): Promise<AIAgent>
  updateAgent(id: string, data: UpdateAgentDTO): Promise<AIAgent>
  deleteAgent(id: string): Promise<void>
  listAgents(organizationId: string, filters?: AgentFilters): Promise<AIAgent[]>
  getAgentById(id: string): Promise<AIAgent | null>
  toggleAgent(id: string, isActive: boolean): Promise<AIAgent>
  cloneAgent(id: string, newName: string): Promise<AIAgent>
}
```

#### `AgentExecutorService.ts`
**Responsabilidades**:
- Executar conversas com agentes
- Montar contexto RAG
- Chamar ferramentas MCP
- Aplicar regras no-code

**Fluxo de Execução**:
```
1. Receber mensagem do usuário
2. Buscar configuração do agente (systemPrompt, temperature, tools)
3. Recuperar documentos relevantes do RAG (baseado em ragSources)
4. Montar prompt completo:
   - System Prompt do Agente
   - Regra NO-CODE (nunca retornar código)
   - Contexto RAG (top 5 documentos)
   - Histórico da conversa
   - Mensagem atual
5. Chamar Gemini API
6. Processar resposta:
   - Se agente sugeriu usar MCP tool → executar tool → re-processar
   - Se resposta contém código → filtrar e reescrever em texto
7. Salvar conversa no histórico
8. Retornar resposta ao usuário
```

**Métodos Principais**:
```typescript
class AgentExecutorService {
  chat(agentId: string, message: string, sessionId?: string, context?: ChatContext): Promise<AgentChatResponse>
  buildSystemPrompt(agent: AIAgent): string
  retrieveRAGContext(agent: AIAgent, query: string): Promise<RAGDocument[]>
  callMCPTool(toolName: string, params: any): Promise<any>
  enforceNoCodeRule(response: string): string
  saveConversation(agentId: string, messages: Message[], metadata: ConversationMetadata): Promise<void>
}
```

#### `RAGManagerService.ts`
**Responsabilidades**:
- Upload e indexação de documentos
- Busca semântica (futuro: embeddings)
- Gestão de categorias e tags
- Sincronização com dados do sistema (courses, techniques)

**Métodos Principais**:
```typescript
class RAGManagerService {
  uploadDocument(file: File, category: string, tags: string[]): Promise<RAGDocument>
  syncSystemData(dataType: 'courses' | 'techniques' | 'lessons'): Promise<void>
  searchDocuments(query: string, filters?: RAGFilters): Promise<RAGDocument[]>
  deleteDocument(id: string): Promise<void>
  updateDocumentTags(id: string, tags: string[]): Promise<RAGDocument>
}
```

### Layer 3: API Routes

#### `/api/agents` (CRUD Agentes)
```
GET    /api/agents                    → Listar todos os agentes
POST   /api/agents                    → Criar novo agente
GET    /api/agents/:id                → Buscar agente específico
PATCH  /api/agents/:id                → Atualizar agente
DELETE /api/agents/:id                → Deletar agente
POST   /api/agents/:id/clone          → Clonar agente
PATCH  /api/agents/:id/toggle         → Ativar/Desativar
```

#### `/api/chat` (Interação com Agentes)
```
POST   /api/chat                      → Enviar mensagem para agente
GET    /api/chat/sessions/:sessionId  → Buscar histórico de sessão
DELETE /api/chat/sessions/:sessionId  → Limpar sessão
POST   /api/chat/feedback             → Enviar feedback (rating)
```

#### `/api/rag` (Gerenciamento RAG)
```
GET    /api/rag/documents             → Listar documentos
POST   /api/rag/upload                → Upload de documento
DELETE /api/rag/documents/:id         → Deletar documento
POST   /api/rag/sync                  → Sincronizar dados do sistema
GET    /api/rag/search                → Busca semântica
```

#### `/api/mcp` (Model Context Protocol - JÁ EXISTE)
```
POST   /api/mcp/getStudentData        → Dados de aluno
POST   /api/mcp/getCourseData         → Dados de curso
POST   /api/mcp/executeQuery          → Query SQL customizada
POST   /api/mcp/getSystemAnalytics    → Analytics do sistema
```

---

## 🔄 Fluxo de Dados Completo

### Cenário: "Como João pode melhorar para a próxima faixa?"

```
1. USUÁRIO → Frontend Chat Interface
   Input: "Como o aluno João Silva pode melhorar para a próxima faixa?"

2. FRONTEND → POST /api/chat
   Body: {
     agentId: "agent_progressao_123",
     message: "Como o aluno João Silva pode melhorar para a próxima faixa?",
     sessionId: "session_xyz"
   }

3. BACKEND → AgentExecutorService.chat()
   a) Buscar agente "Progressão" no DB
   b) Montar System Prompt:
      "Você é um especialista em progressão de alunos de Krav Maga.
       Analise dados e sugira planos de evolução.
       REGRA: NUNCA retorne código. Apenas análises, sugestões e próximos passos."
   
   c) RAG: Buscar documentos relevantes
      Query: "progressão faixa amarela requisitos João Silva"
      Resultados:
      - Documento: "Critérios de Avaliação Faixa Amarela"
      - Documento: "Progressão Curricular Krav Maga"
      - Documento: "Histórico de Avaliações - João Silva"
   
   d) MCP: Chamar ferramentas
      → POST /api/mcp/getStudentData
        Params: { studentId: "joao_silva_id" }
        Response: {
          name: "João Silva",
          currentBelt: "Faixa Branca",
          nextBelt: "Faixa Amarela",
          attendanceRate: 0.85,
          evaluations: [
            { technique: "Straight Punch", score: 8 },
            { technique: "360 Defense", score: 6 },
            { technique: "Front Kick", score: 7 }
          ],
          weakPoints: ["360 Defense", "Choke from Behind"]
        }
   
   e) Montar Prompt Final:
      """
      SYSTEM: [System Prompt do Agente]
      
      CONTEXTO RAG:
      - Critérios Faixa Amarela: Dominar 12 técnicas fundamentais...
      - Progressão: Mínimo 3 meses, 80% frequência, avaliação prática...
      
      DADOS DO ALUNO (via MCP):
      - Nome: João Silva
      - Faixa Atual: Branca
      - Frequência: 85%
      - Pontos Fracos: 360 Defense (6/10), Choke from Behind
      
      PERGUNTA DO USUÁRIO:
      Como o aluno João Silva pode melhorar para a próxima faixa?
      
      RESPOSTA (apenas orientação, SEM código):
      """
   
   f) Gemini API Call
      Model: gemini-1.5-flash
      Temperature: 0.7
      Response: [Análise em texto natural]

4. GEMINI → Resposta Gerada
   """
   📊 ANÁLISE DE PROGRESSÃO - JOÃO SILVA
   
   Situação Atual:
   - Faixa: Branca
   - Próximo Objetivo: Faixa Amarela
   - Frequência: 85% (EXCELENTE ✓)
   - Técnicas Dominadas: 8/12
   
   Pontos Fortes:
   ✓ Straight Punch (8/10)
   ✓ Front Kick (7/10)
   ✓ Frequência acima da média
   
   Áreas para Melhoria:
   ⚠️ 360 Defense (6/10) - CRÍTICO para Faixa Amarela
   ⚠️ Choke from Behind - Técnica obrigatória
   
   Plano de Ação (próximos 2 meses):
   
   SEMANAS 1-2: Foco em 360 Defense
   - Praticar rotação de quadril 15min/dia
   - Drill com parceiro: 30 repetições por treino
   - Revisar vídeo-aula da técnica
   
   SEMANAS 3-4: Choke from Behind
   - Memorizar sequência: Tuck chin → Drop weight → Turn
   - Praticar timing de escape
   
   SEMANAS 5-8: Revisão Geral + Simulado
   - Revisar todas as 12 técnicas obrigatórias
   - Simulado de avaliação na semana 7
   - Ajustes finais baseados no feedback
   
   Próximos Passos:
   1. Conversar com instrutor sobre plano personalizado
   2. Agendar aulas extras de 360 Defense
   3. Marcar data de avaliação provisória (semana 7)
   
   Expectativa de Certificação: 8-10 semanas
   """

5. BACKEND → Salvar Conversa
   AgentConversation.create({
     agentId: "agent_progressao_123",
     sessionId: "session_xyz",
     messages: [
       { role: "user", content: "Como João pode melhorar...", timestamp: "..." },
       { role: "agent", content: "📊 ANÁLISE...", timestamp: "..." }
     ],
     ragDocuments: ["doc_1", "doc_2", "doc_3"],
     mcpToolsCalled: ["getStudentData"],
     tokensUsed: 1850
   })

6. BACKEND → Response API
   {
     success: true,
     data: {
       message: "📊 ANÁLISE DE PROGRESSÃO - JOÃO SILVA...",
       sessionId: "session_xyz",
       ragSources: [
         { title: "Critérios Faixa Amarela", relevance: 0.95 },
         { title: "Progressão Curricular", relevance: 0.88 }
       ],
       toolsUsed: ["getStudentData"],
       timestamp: "2025-01-13T10:00:00Z"
     }
   }

7. FRONTEND → Renderiza Resposta
   Chat UI exibe:
   - Mensagem formatada do agente
   - Indicadores visuais (✓ ⚠️ 📊)
   - Fontes consultadas (RAG sources)
   - Botão de feedback (1-5 estrelas)
```

---

## 🛠️ Tecnologias

### Backend
- **Framework**: Fastify (já em uso)
- **ORM**: Prisma (já em uso)
- **AI**: Google Gemini 1.5 Flash/Pro (já integrado)
- **RAG**: Serviço customizado (expandir atual)
- **MCP**: Servidor já implementado (`src/mcp_server.ts`)

### Frontend
- **UI**: Vanilla JS modular (padrão do projeto)
- **Componentes**:
  - `AgentManager` - CRUD de agentes
  - `ChatInterface` - Interface de conversa
  - `RAGBrowser` - Navegador de documentos
  - `AgentConfig` - Configuração de prompts/tools

### Storage
- **PostgreSQL**: Agentes, conversas, documentos
- **Futuro**: Vector DB para embeddings (Pinecone/Weaviate)

---

## 🎨 Frontend - Interface de Agentes

### 1. Página de Gerenciamento (`/agents`)
```
┌─────────────────────────────────────────────────────────┐
│ 🤖 Agentes IA                                   [+ Novo]│
├─────────────────────────────────────────────────────────┤
│                                                          │
│ 📋 Meus Agentes                    🔍 [Buscar agente...] │
│                                                          │
│ ┌──────────────────────────────────────────────────────┐│
│ │ 🎓 Agente Pedagógico              [▶️] [✏️] [⚙️]     ││
│ │ Especialista em criação de conteúdo educacional       ││
│ │ 📊 142 interações | ⭐ 4.8 | Última: há 2h           ││
│ │ Ferramentas: getCourseData, getLessonPlan            ││
│ └──────────────────────────────────────────────────────┘│
│                                                          │
│ ┌──────────────────────────────────────────────────────┐│
│ │ 📊 Agente Analítico               [▶️] [✏️] [⚙️]     ││
│ │ Análise de dados e métricas de performance            ││
│ │ 📊 89 interações | ⭐ 4.6 | Última: há 5h            ││
│ │ Ferramentas: getStudentData, executeQuery            ││
│ └──────────────────────────────────────────────────────┘│
│                                                          │
│ ┌──────────────────────────────────────────────────────┐│
│ │ 🎯 Agente de Progressão           [▶️] [✏️] [⚙️]     ││
│ │ Planejamento de evolução de alunos                    ││
│ │ 📊 203 interações | ⭐ 4.9 | Última: há 1h           ││
│ │ Ferramentas: getStudentProgress, getTechniqueMastery ││
│ └──────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### 2. Formulário de Criação/Edição
```
┌─────────────────────────────────────────────────────────┐
│ ➕ Criar Novo Agente                         [Cancelar] │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Nome do Agente *                                         │
│ ┌──────────────────────────────────────────────────────┐│
│ │ Agente de Suporte ao Aluno                           ││
│ └──────────────────────────────────────────────────────┘│
│                                                          │
│ Especialização *                                         │
│ ┌──────────────────────────────────────────────────────┐│
│ │ [🎓 Pedagógico ▼]                                    ││
│ │   🎓 Pedagógico                                       ││
│ │   📊 Analítico                                        ││
│ │   💬 Suporte                                          ││
│ │   🎯 Progressão                                       ││
│ │   💰 Comercial                                        ││
│ └──────────────────────────────────────────────────────┘│
│                                                          │
│ Modelo IA *                                              │
│ ┌──────────────────────────────────────────────────────┐│
│ │ [Gemini 1.5 Flash ▼]                                 ││
│ │   Gemini 1.5 Flash (Rápido)                          ││
│ │   Gemini 1.5 Pro (Avançado)                          ││
│ └──────────────────────────────────────────────────────┘│
│                                                          │
│ System Prompt *                                          │
│ ┌──────────────────────────────────────────────────────┐│
│ │ Você é um assistente especializado em suporte a      ││
│ │ alunos de Krav Maga. Responda dúvidas sobre:         ││
│ │ - Horários de aulas                                   ││
│ │ - Informações sobre instrutores                       ││
│ │ - Renovação de planos                                 ││
│ │ - Dúvidas sobre técnicas                              ││
│ │                                                       ││
│ │ REGRA IMPORTANTE:                                     ││
│ │ - Nunca retorne código de programação                 ││
│ │ - Seja claro e objetivo                               ││
│ │ - Use emojis para facilitar leitura                   ││
│ └──────────────────────────────────────────────────────┘│
│                                                          │
│ Fontes de Conhecimento (RAG)                             │
│ ☑️ Cursos e Planos de Aula                               │
│ ☑️ Técnicas e Movimentos                                 │
│ ☑️ FAQ e Documentação                                    │
│ ☐ Histórico de Avaliações                                │
│ ☐ Dados Financeiros                                      │
│                                                          │
│ Ferramentas MCP Permitidas                               │
│ ☑️ getStudentProfile                                     │
│ ☑️ getClassSchedule                                      │
│ ☑️ getInstructorAvailability                             │
│ ☐ executeQuery (SQL)                                     │
│ ☐ getSystemAnalytics                                     │
│                                                          │
│ Configurações Avançadas                                  │
│ Temperature: [0.7    ] ●───────────                      │
│ Max Tokens:  [2000   ]                                   │
│ Documentos RAG por resposta: [5]                         │
│                                                          │
│ ☑️ Modo No-Code (nunca retornar código)                  │
│ ☑️ Agente ativo                                          │
│ ☐ Agente público (compartilhável)                        │
│                                                          │
│                          [💾 Salvar Agente]              │
└─────────────────────────────────────────────────────────┘
```

### 3. Interface de Chat
```
┌─────────────────────────────────────────────────────────┐
│ 💬 Chat com Agente: Progressão        [📋 Histórico]    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ ┌──────────────────────────────────────────────────────┐│
│ │ 👤 VOCÊ (10:30)                                      ││
│ │ Como o aluno João Silva pode melhorar para a          ││
│ │ próxima faixa?                                        ││
│ └──────────────────────────────────────────────────────┘│
│                                                          │
│ ┌──────────────────────────────────────────────────────┐│
│ │ 🤖 AGENTE (10:30)                   🔧 2 ferramentas ││
│ │                                                       ││
│ │ 📊 ANÁLISE DE PROGRESSÃO - JOÃO SILVA                 ││
│ │                                                       ││
│ │ Situação Atual:                                       ││
│ │ - Faixa: Branca                                       ││
│ │ - Próximo Objetivo: Faixa Amarela                     ││
│ │ - Frequência: 85% (EXCELENTE ✓)                       ││
│ │                                                       ││
│ │ [... resto da resposta ...]                           ││
│ │                                                       ││
│ │ ─────────────────────────────────                     ││
│ │ 📚 Fontes Consultadas:                                ││
│ │ • Critérios Faixa Amarela (95% relevância)            ││
│ │ • Histórico João Silva (88% relevância)               ││
│ │                                                       ││
│ │ 🛠️ Ferramentas Usadas:                                ││
│ │ • getStudentData (João Silva)                         ││
│ │ • getProgressionCriteria (Faixa Amarela)              ││
│ │                                                       ││
│ │                          [👍] [👎] [⭐ Avaliar]       ││
│ └──────────────────────────────────────────────────────┘│
│                                                          │
│ ┌──────────────────────────────────────────────────────┐│
│ │ 💬 Digite sua mensagem...                 [📎] [🎙️] ││
│ └──────────────────────────────────────────────────────┘│
│                                      [Enviar →]          │
└─────────────────────────────────────────────────────────┘
```

### 4. Navegador RAG
```
┌─────────────────────────────────────────────────────────┐
│ 📚 Base de Conhecimento                  [⬆️ Upload]    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ 🔍 [Buscar documentos...]        📁 Categoria: [Todas ▼]│
│                                                          │
│ ┌──────────────────────────────────────────────────────┐│
│ │ 📄 Critérios de Avaliação Faixa Amarela       [🗑️]  ││
│ │ Categoria: Cursos | Tags: avaliacao, faixa-amarela   ││
│ │ Última atualização: há 3 dias | 12 KB                ││
│ └──────────────────────────────────────────────────────┘│
│                                                          │
│ ┌──────────────────────────────────────────────────────┐│
│ │ 📄 Progressão Curricular Krav Maga            [🗑️]  ││
│ │ Categoria: Técnicas | Tags: progressao, curriculo    ││
│ │ Última atualização: há 1 semana | 45 KB              ││
│ └──────────────────────────────────────────────────────┘│
│                                                          │
│ ┌──────────────────────────────────────────────────────┐│
│ │ 📊 Curso Faixa Branca Completo (auto-sync)   [🔄]  ││
│ │ Categoria: Cursos | Tags: faixa-branca, auto         ││
│ │ Sincronizado do sistema | 128 KB                     ││
│ └──────────────────────────────────────────────────────┘│
│                                                          │
│                    [🔄 Sincronizar Sistema]              │
└─────────────────────────────────────────────────────────┘
```

---

## 🔒 Segurança e Permissões

### Níveis de Acesso
1. **ADMIN**: Criar/editar/deletar qualquer agente, acesso total MCP
2. **STAFF**: Usar agentes, criar agentes próprios, acesso MCP limitado
3. **STUDENT**: Apenas usar agentes públicos, sem acesso MCP

### Validações
- ✅ Agentes só podem acessar dados da própria organização
- ✅ System Prompt é sanitizado (sem SQL injection)
- ✅ Ferramentas MCP têm whitelist por agente
- ✅ Limite de tokens por conversa (evitar abuso)
- ✅ Rate limiting: 10 mensagens/minuto por usuário

### Auditoria
- Todas as conversas são salvas
- Ferramentas MCP chamadas são logadas
- Documentos RAG acessados ficam registrados

---

## 📅 Roadmap de Implementação

### **FASE 1: Fundação (Semana 1-2)** 🏗️
**Objetivo**: Estrutura base funcional

1. ✅ **Database Schema**
   - Criar models Prisma: `AIAgent`, `AgentConversation`, `RAGDocument`
   - Rodar migration
   - Seed com 3 agentes exemplo

2. ✅ **Backend Core Services**
   - `AgentService.ts` - CRUD de agentes
   - `AgentExecutorService.ts` - Lógica de execução
   - `RAGManagerService.ts` - Gestão de documentos

3. ✅ **API Routes**
   - `/api/agents` - CRUD completo
   - `/api/chat` - Interação básica
   - `/api/rag` - Upload e listagem

4. ✅ **Frontend Base**
   - Módulo `ai-agents` estilo single-file (seguindo padrão Instructors)
   - Listagem de agentes
   - Formulário de criação simples

**Entregável**: CRUD de agentes funcional + 1 agente exemplo respondendo via Gemini

---

### **FASE 2: RAG Integration (Semana 3)** 📚
**Objetivo**: Agentes com contexto real

1. ✅ **Sincronização de Dados**
   - Script para importar courses.json → RAGDocument
   - Script para importar techniques.json → RAGDocument
   - Auto-sync diário

2. ✅ **Busca Semântica Básica**
   - Implementar busca por palavra-chave
   - Ranking de relevância (TF-IDF simples)
   - Top-K retrieval (5 documentos)

3. ✅ **Integração com Executor**
   - `AgentExecutorService` busca RAG antes de chamar Gemini
   - Monta contexto no prompt
   - Retorna fontes consultadas

**Entregável**: Agente Pedagógico respondendo com base em cursos reais

---

### **FASE 3: MCP Tools (Semana 4)** 🛠️
**Objetivo**: Agentes com acesso a ferramentas

1. ✅ **Expansão MCP Server**
   - Adicionar tools específicos:
     - `getStudentProgress`
     - `getTechniqueMastery`
     - `getClassSchedule`
     - `getNextBeltRequirements`

2. ✅ **Tool Calling no Executor**
   - Detectar quando agente sugere usar tool
   - Executar tool via MCP
   - Re-processar resposta com dados do tool

3. ✅ **Whitelist de Ferramentas**
   - Validar agente tem permissão para tool
   - Log de uso de ferramentas

**Entregável**: Agente de Progressão buscando dados reais de alunos via MCP

---

### **FASE 4: No-Code Enforcement (Semana 5)** 🚫
**Objetivo**: Garantir que agentes NUNCA retornam código

1. ✅ **Regras no System Prompt**
   - Template de prompt com regra explícita
   - Exemplos de boas/más respostas

2. ✅ **Post-Processing**
   - Regex para detectar blocos de código
   - Filtro para remover syntax highlighting
   - Re-escrita automática em texto natural

3. ✅ **Validação de Resposta**
   - Se código detectado → rejeitar e pedir reformulação
   - Máximo 2 tentativas
   - Fallback: "Desculpe, não posso fornecer essa informação em formato de código"

**Entregável**: 100% das respostas sem código, apenas orientações

---

### **FASE 5: Chat Interface (Semana 6)** 💬
**Objetivo**: UX profissional de conversa

1. ✅ **Chat UI**
   - Interface estilo messaging app
   - Histórico de conversas
   - Indicadores de digitação

2. ✅ **Features Avançadas**
   - Upload de arquivos (futuro RAG)
   - Exportar conversa como PDF
   - Compartilhar link de conversa

3. ✅ **Feedback Loop**
   - Rating de respostas (1-5 estrelas)
   - Comentários do usuário
   - Analytics de satisfação

**Entregável**: Interface de chat completa e funcional

---

### **FASE 6: Analytics & Otimização (Semana 7-8)** 📊
**Objetivo**: Melhorar performance e insights

1. ✅ **Dashboard de Agentes**
   - Total de interações
   - Taxa de sucesso
   - Ferramentas mais usadas
   - Documentos RAG mais acessados

2. ✅ **Otimizações**
   - Cache de respostas comuns
   - Pré-carregamento de RAG context
   - Compressão de prompts

3. ✅ **A/B Testing**
   - Testar diferentes system prompts
   - Medir impacto de temperature
   - Ajustar max_tokens

**Entregável**: Sistema 30% mais rápido + dashboard de insights

---

### **FASE 7: Vector Embeddings (Futuro)** 🔮
**Objetivo**: RAG semântico real

1. ⏳ **Integração Vector DB**
   - Setup Pinecone/Weaviate
   - Gerar embeddings para documentos
   - Migração de RAGDocument

2. ⏳ **Busca Vetorial**
   - Substituir keyword search por similarity search
   - K-NN retrieval
   - Hybrid search (keyword + semantic)

**Entregável**: Precisão de RAG 2x melhor

---

## 📖 Exemplos de Uso

### Exemplo 1: Agente Pedagógico
**Prompt**: "Crie um plano de aula de 60min para Faixa Branca focado em defesas"

**Resposta (NO-CODE)**:
```
📋 PLANO DE AULA - DEFESAS FAIXA BRANCA (60 MIN)

🎯 OBJETIVO DA AULA
Desenvolver fundamentos de defesa contra ataques frontais e laterais

📊 ESTRUTURA SUGERIDA

00:00-10:00 | AQUECIMENTO
- 5min: Corrida leve + mobilidade articular
- 5min: Shadowboxing com foco em guard position

10:00-25:00 | TÉCNICAS PRINCIPAIS
- 360° Defense (8min)
  → Explicar mecânica de rotação
  → Drill slow-motion (30 reps)
  → Drill velocidade moderada (20 reps)
  
- Inside Defense (7min)
  → Demonstrar timing de bloqueio
  → Praticar com parceiro (alternando)

25:00-40:00 | COMBINAÇÕES
- 360° Defense + Counter Punch
- Inside Defense + Front Kick
- Drill em sequência: 3 rounds de 3min

40:00-55:00 | SPARRING CONTROLADO
- 2 rounds de 5min (defesa apenas)
- 1 round de 5min (defesa + contra-ataque)

55:00-60:00 | COOLDOWN
- Alongamento
- Feedback do instrutor

💡 DICAS DE EXECUÇÃO
- Corrigir postura antes de aumentar velocidade
- Usar proteção (luvas leves) no sparring
- Filmar alunos para mostrar erros comuns

📚 TÉCNICAS DA BASE DE CONHECIMENTO
- 360° Defense (Curso Faixa Branca - Aula 5)
- Inside Defense (Curso Faixa Branca - Aula 6)
```

### Exemplo 2: Agente Analítico
**Prompt**: "Quais alunos estão em risco de evasão este mês?"

**Resposta (via MCP + RAG)**:
```
⚠️ ALERTA DE EVASÃO - SETEMBRO 2025

📊 ALUNOS EM RISCO (5 identificados)

CRÍTICO (2 alunos - ausentes 3+ aulas seguidas)
┌────────────────────────────────────────┐
│ 👤 Maria Santos (Faixa Branca)         │
│ Última presença: 15/08/2025 (26 dias)  │
│ Padrão: 4 ausências consecutivas       │
│ Plano: Mensal (vence em 5 dias)        │
│                                        │
│ AÇÕES SUGERIDAS:                       │
│ → Contato imediato do instrutor        │
│ → Oferecer reposição gratuita          │
│ → Verificar motivo da ausência         │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ 👤 Pedro Oliveira (Faixa Amarela)      │
│ Última presença: 20/08/2025 (21 dias)  │
│ Padrão: Frequência caiu de 90% → 40%   │
│ Plano: Trimestral (renovação em 30d)   │
│                                        │
│ AÇÕES SUGERIDAS:                       │
│ → WhatsApp personalizado do coordenador │
│ → Oferecer aula particular gratuita    │
│ → Desconto na renovação (10%)          │
└────────────────────────────────────────┘

ATENÇÃO (3 alunos - frequência < 50%)
• João Silva - 45% (era 85%)
• Ana Costa - 48% (era 75%)
• Lucas Mendes - 42% (era 80%)

📈 RECOMENDAÇÕES GERAIS
1. Criar campanha de engajamento
2. Pesquisar motivos de ausência
3. Revisar horários das turmas
4. Oferecer aulas de reposição

📚 Análise baseada em:
- Dados de frequência (últimos 90 dias)
- Padrão histórico de evasão
- Renovações próximas do vencimento
```

---

## 🎓 Conclusão

Este sistema de **Agentes IA com RAG + MCP** permite:

✅ **Cadastro modular** de agentes especializados  
✅ **Contexto completo** via RAG (documentos + dados reais)  
✅ **Acesso total** às APIs do sistema via MCP  
✅ **Respostas úteis** SEM código (apenas orientações)  
✅ **Extensibilidade** via ferramentas externas  

**Próximo Passo**: Implementar **Fase 1** (Database + Backend Core + Frontend Base)

---

**Versão**: 1.0  
**Data**: 09/01/2025  
**Autor**: Sistema Academia Krav Maga  
**Status**: 📋 DESIGN APROVADO - AGUARDANDO IMPLEMENTAÇÃO
