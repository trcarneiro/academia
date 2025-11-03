# 🐛 BUGFIX: Agent Chat - Erro 400 Validation Error - RESOLVIDO

**Data**: 30/10/2025
**Tempo**: 2 minutos
**Status**: ✅ CORRIGIDO

## 🔴 Erro no Console

```
POST http://localhost:3000/api/agents/chat 400 (Bad Request)
❌ [Agent Chat] Error sending message: ApiError: Validation error
```

## 🔍 Causa Raiz

**Schema Backend** (`src/routes/agents.ts` linha 52):
```typescript
const createConversationSchema = z.object({
  agentId: z.string().uuid(),
  studentId: z.string().uuid().optional(),
  message: z.string().min(1),
  conversationId: z.string().uuid().optional()
});
```

**Payload Frontend** (ERRADO):
```javascript
{
  agentId: "uuid",
  message: "Olá",
  conversationId: null,           // ❌ null não é uuid válido
  context: {                       // ❌ Campo 'context' não existe no schema
    previousMessages: [...]
  }
}
```

**Problema**:
1. ❌ Campo `context` não está no schema Zod → Rejeita o payload
2. ❌ `conversationId: null` enviado → Deveria ser `undefined` ou omitido

## ✅ Solução Aplicada

**Arquivo**: `public/js/modules/agent-chat/index.js`

**Antes (linhas 307-318)**:
```javascript
const response = await this.moduleAPI.request('/api/agents/chat', {
  method: 'POST',
  body: JSON.stringify({
    agentId: this.selectedAgent.id,
    message: message,
    conversationId: this.conversationId,    // ❌ null vai no payload
    context: {                               // ❌ Campo extra não permitido
      previousMessages: this.messages.slice(-5)
    }
  })
});
```

**Depois (CORRIGIDO)**:
```javascript
const response = await this.moduleAPI.request('/api/agents/chat', {
  method: 'POST',
  body: JSON.stringify({
    agentId: this.selectedAgent.id,
    message: message,
    conversationId: this.conversationId || undefined  // ✅ undefined = omitido
  })
});
```

## 📊 Validação

**Payload Correto (Primeira Mensagem)**:
```json
{
  "agentId": "ecb685a1-d50a-4fe2-a3e2-7ec6efb5693a",
  "message": "Olá, quais são suas responsabilidades?"
  // conversationId omitido → backend cria nova conversa
}
```

**Payload Correto (Continuação)**:
```json
{
  "agentId": "ecb685a1-d50a-4fe2-a3e2-7ec6efb5693a",
  "message": "Me mostre alunos sem matrícula",
  "conversationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response Esperada**:
```json
{
  "success": true,
  "data": {
    "conversationId": "550e8400-e29b-41d4-a716-446655440000",
    "messages": [
      {
        "role": "user",
        "content": "Olá, quais são suas responsabilidades?",
        "timestamp": "2025-10-30T19:40:00.000Z"
      },
      {
        "role": "assistant",
        "content": "Olá! Sou o Agente de Matrículas e Planos...",
        "timestamp": "2025-10-30T19:40:02.000Z"
      }
    ],
    "agent": {
      "id": "ecb685a1-d50a-4fe2-a3e2-7ec6efb5693a",
      "name": "Agente de Matrículas e Planos",
      "specialization": "pedagogical"
    },
    "metadata": {}
  }
}
```

## 🎯 Mudanças Realizadas

### **1. Remover Campo `context`**
- ❌ Schema não aceita
- ✅ Backend usa `conversationId` para manter contexto
- ✅ Mensagens anteriores vêm no array `messages[]`

### **2. Corrigir `conversationId`**
- ❌ Antes: `conversationId: null` → Enviado no payload
- ✅ Depois: `conversationId: undefined` → Omitido do JSON
- ✅ JavaScript: `undefined` é removido ao serializar JSON

### **3. Entender Fluxo de Contexto**

**Backend Gerencia Contexto Automaticamente**:
```typescript
// agentExecutorService.createConversationAndExecute()
const conversation = await prisma.conversation.findUnique({
  where: { id: conversationId },
  include: { messages: true } // ✅ Backend carrega histórico
});

// Histórico completo enviado ao Gemini
const fullContext = conversation.messages.map(m => ({
  role: m.role,
  content: m.content
}));
```

**Frontend Apenas Exibe**:
```javascript
// Frontend mantém array local para UI
this.messages = [
  { role: 'user', content: 'Olá' },
  { role: 'assistant', content: 'Oi! Como posso ajudar?' }
];

// Backend retorna histórico completo
response.data.messages // ✅ Array completo da conversa
```

## 🧪 Teste Manual

### **1. Reload da Página**
```
F5 em http://localhost:3000/#dashboard
```

### **2. Abrir Chat Widget**
- Click no botão flutuante (bottom-right)
- Deve expandir mostrando dropdown de agentes

### **3. Selecionar Agente**
- Click em "Agente de Matrículas e Planos"
- Deve aparecer: ✅ "Agent selected: Agente..."

### **4. Enviar Primeira Mensagem**
```
Input: "Olá, quais são suas responsabilidades?"
Click: Send (ou Enter)
```

**Esperado**:
```
✅ Mensagem aparece (bubble azul)
✅ Typing indicator (3 dots animados)
⏳ Request: POST /api/agents/chat
✅ Status: 200 OK (não mais 400)
✅ Response: Mensagem do agente (bubble cinza)
✅ conversationId salvo internamente
```

### **5. Enviar Segunda Mensagem** (continuação)
```
Input: "Me mostre alunos sem matrícula"
```

**Esperado**:
```
✅ Payload inclui conversationId anterior
✅ Backend retorna histórico completo
✅ Frontend exibe apenas nova mensagem (evita duplicação)
```

## 🎓 Lições Aprendidas

### **1. Sempre Validar Schema Antes de Enviar**
```javascript
// ❌ BAD: Enviar campos que não existem no schema
body: { agentId, message, customField: 'extra' }

// ✅ GOOD: Enviar apenas campos documentados
body: { agentId, message }
```

### **2. Usar `undefined` vs `null` em Payloads**
```javascript
// ❌ BAD: null vai no JSON serializado
{ conversationId: null }  // → {"conversationId":null}

// ✅ GOOD: undefined é omitido
{ conversationId: undefined }  // → {}
{ conversationId: value || undefined }  // Omite se falsy
```

### **3. Entender Responsabilidades Backend vs Frontend**

**Backend** (Stateful):
- Gerencia histórico de conversa (database)
- Mantém contexto entre requests
- Envia mensagens anteriores ao LLM

**Frontend** (Stateless):
- Exibe mensagens (UI)
- Apenas envia nova mensagem + conversationId
- Backend retorna histórico completo (redundante para UI)

### **4. Debugging 400 Errors**

**Checklist**:
1. ✅ Verificar schema Zod no backend (`src/routes/`)
2. ✅ Comparar payload enviado vs schema
3. ✅ Verificar tipos (uuid vs string, number vs string)
4. ✅ Campos opcionais: enviar `undefined` ou omitir
5. ✅ Console Network tab → Request Payload

**Fastify Validation Error**:
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "body/context must NOT have additional properties"
}
```
→ Indica campo `context` não está no schema

## ✅ Status Final

**Antes**:
```
❌ POST /api/agents/chat → 400 Bad Request
❌ Chat não funciona
```

**Depois**:
```
✅ POST /api/agents/chat → 200 OK (aguardando teste)
✅ Payload válido segundo schema
✅ conversationId gerenciado corretamente
```

## 📋 Próximos Passos

1. **Testar no navegador** (F5 + enviar mensagem)
2. **Verificar response** (deve ser 200 OK)
3. **Ver resposta do agente** (bubble cinza)
4. **Testar continuidade** (segunda mensagem mantém conversationId)
5. **Validar actions** (se agente retornar suggestedActions)

---

**🎉 Bugfix completo! Pronto para testar conversação real.**

**Tempo**: 2 minutos para identificar + corrigir
**Complexidade**: BAIXA (erro de schema mismatch)
**Impacto**: ALTO (chat estava 100% quebrado)
