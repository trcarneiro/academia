# ✅ FASE 2 - WebSocket Real-Time System (ENTREGA COMPLETA)

## 🎯 Objetivo
Implementar sistema de notificações em tempo real via WebSocket para substituir polling de 30s e fornecer feedback instantâneo das execuções de agentes.

---

## ✅ O QUE FOI ENTREGUE (1 hora)

### **1. WebSocketService (Backend)** ✅
- **Arquivo**: `src/services/websocketService.ts` (300+ linhas)
- **Funcionalidades**:
  - ✅ WebSocket Server integrado com Fastify HTTP server
  - ✅ Multi-tenancy: Isolamento por `organizationId`
  - ✅ Keep-alive: Ping/pong a cada 30s para detectar conexões mortas
  - ✅ Broadcast: Enviar eventos para TODOS os clientes de uma organização
  - ✅ Send to User: Enviar eventos para usuário específico
  - ✅ Stats: Estatísticas de conexões (total clients, orgs connected)
  - ✅ Graceful shutdown: Fechar todas as conexões limpa

**Eventos Suportados**:
```javascript
'agent:execution:start'      // Agente iniciou execução
'agent:execution:complete'   // Agente completou execução
'agent:execution:error'      // Agente encontrou erro
'task:created'              // Nova task criada
'task:approved'             // Task aprovada
'task:executed'             // Task executada
'permission:pending'        // Permissão pendente de aprovação
'connected'                 // Cliente conectado (welcome message)
'disconnected'              // Cliente desconectado
```

**Métodos Principais**:
```typescript
// Inicializar (chamado no server.ts)
websocketService.initialize(server.server);

// Broadcast para todos os clientes da organização
websocketService.broadcast(organizationId, 'agent:execution:complete', {
  agentId: 'uuid',
  taskId: 'uuid',
  duration: 1234,
  result: { insights: [...] }
});

// Enviar para usuário específico
websocketService.sendToUser(organizationId, userId, 'permission:pending', {
  permissionId: 'uuid',
  action: 'send_whatsapp'
});

// Estatísticas
const stats = websocketService.getStats();
// { totalClients: 5, organizationsConnected: 2, clientsByOrg: {...} }

// Shutdown graceful
websocketService.shutdown();
```

**Validação de Conexão**:
- ✅ Requer `organizationId` na query string (HTTP 400 se ausente)
- ✅ Aceita `userId` opcional para envio direcionado
- ✅ Endpoint: `ws://localhost:3000/ws/agents?organizationId=uuid&userId=uuid`

### **2. Integração com Fastify Server** ✅
- **Arquivo**: `src/server.ts`
- **Modificações** (+20 linhas):

**Inicialização** (após `server.listen`):
```typescript
// Inicializar WebSocket Service (real-time notifications)
try {
  const { websocketService } = await import('@/services/websocketService');
  websocketService.initialize(server.server);
  logger.info('✅ WebSocket Service initialized on ws://localhost:' + appConfig.server.port + '/ws/agents');
} catch (error) {
  logger.error('❌ Failed to initialize WebSocket Service:', error);
}
```

**Graceful Shutdown** (SIGINT/SIGTERM):
```typescript
// 🆕 Shutdown WebSocket Service
const { websocketService } = await import('@/services/websocketService');
websocketService.shutdown();

// 🆕 Shutdown TaskScheduler
const { taskSchedulerService } = await import('@/services/taskSchedulerService');
taskSchedulerService.shutdown();
```

### **3. WebSocket Client (Frontend)** ✅
- **Arquivo**: `public/js/shared/websocket-client.js` (280 linhas)
- **Funcionalidades**:
  - ✅ Conexão com query params (organizationId, userId)
  - ✅ **Reconexão automática** com backoff exponencial (max 10 tentativas)
  - ✅ **Keep-alive**: Envia ping a cada 25s
  - ✅ **Event handlers**: Sistema de pub/sub para eventos
  - ✅ **Manual disconnect**: Desconectar sem reconexão automática
  - ✅ **State management**: Verificar estado da conexão

**API do Cliente**:
```javascript
// Criar instância
const wsClient = new WebSocketClient();

// Conectar
wsClient.connect(organizationId, userId);

// Registrar handler para evento
wsClient.on('agent:execution:complete', (data) => {
  console.log('Agent completed:', data);
  // Atualizar UI em tempo real
  updateAgentStatus(data.agentId, 'completed');
  showNotification(`Agente ${data.agentId} completou execução em ${data.duration}ms`);
});

wsClient.on('permission:pending', (data) => {
  console.log('Permission pending:', data);
  // Mostrar badge no dashboard widget
  showPendingPermissionBadge(data.permissionId);
});

// Remover handler
wsClient.off('agent:execution:complete', handler);

// Enviar mensagem (opcional)
wsClient.send('ping', {});

// Verificar estado
wsClient.isConnected(); // true/false
wsClient.getState(); // 'OPEN', 'CONNECTING', 'CLOSED', etc.

// Desconectar manualmente
wsClient.disconnect();
```

**Reconexão Automática**:
- 1ª tentativa: 3s delay
- 2ª tentativa: 4.5s delay
- 3ª tentativa: 6.75s delay
- ... (exponencial até 10 tentativas)
- Emite evento `reconnect:failed` se todas as tentativas falharem

**Eventos do Cliente**:
```javascript
wsClient.on('connected', (data) => {
  console.log('Connected to WebSocket:', data);
});

wsClient.on('disconnected', (data) => {
  console.log('Disconnected:', data.code, data.reason);
});

wsClient.on('error', (data) => {
  console.error('WebSocket error:', data.error);
});

wsClient.on('reconnect:failed', (data) => {
  console.error('Failed to reconnect after', data.attempts, 'attempts');
});
```

### **4. HTML Integration** ✅
- **Arquivo**: `public/index.html`
- **Modificação**: Adicionado script do WebSocket client
```html
<script src="js/shared/api-client.js"></script>
<script src="js/shared/websocket-client.js"></script>
```

---

## 🏗️ Arquitetura

### **Flow Completo**:
```
┌─────────────────┐
│  AgentService   │ (backend)
└────────┬────────┘
         │ execução completa
         ▼
┌─────────────────────────┐
│ websocketService        │
│ .broadcast(orgId, type, │
│   'agent:execution:    │
│   complete', data)      │
└────────┬────────────────┘
         │ WebSocket message
         ▼
┌─────────────────────────┐
│ wsClient (frontend)     │
│ .on('agent:execution:   │
│   complete', handler)   │
└────────┬────────────────┘
         │ handler callback
         ▼
┌─────────────────────────┐
│ UI Update               │
│ - Status badge          │
│ - Notification toast    │
│ - Dashboard refresh     │
└─────────────────────────┘
```

### **Multi-Tenant Isolation**:
```typescript
// Backend: Clientes armazenados por organizationId
private clients: Map<string, Set<WebSocketClient>> = new Map();
// "org-123" -> [client1, client2, client3]
// "org-456" -> [client4]

// Broadcast apenas para clientes da mesma org
websocketService.broadcast("org-123", "event", data);
// Apenas client1, client2, client3 recebem
```

---

## 🧪 Como Testar

### **1. Iniciar Servidor**
```bash
npm run dev
```

Verificar logs:
```
✅ WebSocket Service initialized on ws://localhost:3000/ws/agents
```

### **2. Conectar via Browser Console**
Abrir console do browser em `http://localhost:3000`:

```javascript
// Criar cliente WebSocket
const wsClient = new WebSocketClient();

// Conectar (substitua pelo seu organizationId)
wsClient.connect('452c0b35-1822-4890-851e-922356c812fb');

// Registrar handlers
wsClient.on('connected', (data) => {
  console.log('✅ Connected:', data);
});

wsClient.on('agent:execution:complete', (data) => {
  console.log('🎉 Agent completed:', data);
});

wsClient.on('permission:pending', (data) => {
  console.log('⚠️ Permission pending:', data);
});
```

### **3. Simular Evento do Backend**
No servidor, adicionar teste temporário em qualquer service:

```typescript
// Em src/services/agentOrchestratorService.ts
const { websocketService } = await import('./websocketService');

websocketService.broadcast(organizationId, 'agent:execution:complete', {
  agentId: 'test-agent-123',
  taskId: 'test-task-456',
  duration: 1234,
  result: { insights: ['Test insight'] }
});
```

### **4. Testar Reconexão Automática**
```javascript
// No browser console
wsClient.disconnect(); // Desconecta manualmente

// Espere 3 segundos - deve reconectar automaticamente
// Logs no console:
// [WebSocket] Reconnecting in 3.0s (attempt 1/10)
// [WebSocket] ✅ Connected successfully
```

### **5. Testar Keep-Alive**
Deixar conexão aberta por 60 segundos. Verificar logs do servidor:
```
[WebSocket] Ping sent to client org-123
[WebSocket] Pong received from client org-123
```

Se cliente não responder pong em 30s, conexão é terminada:
```
[WebSocket] Terminating dead connection - orgId: org-123
```

### **6. Testar Multi-Tenant Isolation**
Abrir 2 abas do browser:

**Aba 1** (Organização A):
```javascript
const ws1 = new WebSocketClient();
ws1.connect('org-aaa');
ws1.on('agent:execution:complete', () => console.log('Aba 1 recebeu'));
```

**Aba 2** (Organização B):
```javascript
const ws2 = new WebSocketClient();
ws2.connect('org-bbb');
ws2.on('agent:execution:complete', () => console.log('Aba 2 recebeu'));
```

**Backend**:
```typescript
websocketService.broadcast('org-aaa', 'agent:execution:complete', { test: 1 });
// Apenas Aba 1 deve receber
```

### **7. Testar Stats**
```javascript
// No backend (adicionar endpoint temporário)
GET /api/websocket/stats

// Retorna:
{
  totalClients: 5,
  organizationsConnected: 2,
  clientsByOrg: {
    "org-aaa": 3,
    "org-bbb": 2
  }
}
```

---

## 📊 Métricas

- **Tempo estimado**: 6-8 horas
- **Tempo real**: 1 hora
- **Economia**: 5-7 horas (75%)
- **Motivo**: Arquitetura clara, sem blockers

- **Arquivos criados**: 2
  - `src/services/websocketService.ts` (300+ linhas)
  - `public/js/shared/websocket-client.js` (280 linhas)

- **Arquivos modificados**: 2
  - `src/server.ts` (+20 linhas)
  - `public/index.html` (+1 linha)

- **TypeScript Errors**: 
  - ✅ 0 erros nos arquivos novos
  - ⚠️ Erros pré-existentes do projeto não afetam WebSocket

---

## 🚀 Próximos Passos (FASE 2 Continuação)

### **4. Integrar WebSocket no Módulo Agents** (2-3 horas)
- [ ] Atualizar `public/js/modules/agents/index.js`
- [ ] Substituir `setInterval(refreshData, 30000)` por WebSocket events
- [ ] Conectar ao WebSocket no `init()` do módulo
- [ ] Handlers:
  ```javascript
  wsClient.on('agent:execution:start', (data) => {
    updateAgentStatus(data.agentId, 'running');
    showSpinner(data.agentId);
  });
  
  wsClient.on('agent:execution:complete', (data) => {
    updateAgentStatus(data.agentId, 'completed');
    hideSpinner(data.agentId);
    refreshAgentDetails(data.agentId);
  });
  
  wsClient.on('permission:pending', (data) => {
    showPendingBadge();
    refreshPermissions();
  });
  ```
- [ ] Remover polling timer
- [ ] Adicionar indicador de conexão WebSocket (online/offline)
- [ ] Testar com execução real de agentes

### **5. Integrar WebSocket no Dashboard Widget** (1 hora)
- [ ] Atualizar `public/js/modules/dashboard/widgets/task-approval-widget.js`
- [ ] Substituir auto-refresh 30s por eventos WebSocket
- [ ] Handlers:
  ```javascript
  wsClient.on('task:created', () => refreshWidget());
  wsClient.on('task:approved', () => refreshWidget());
  wsClient.on('permission:pending', () => {
    showPulseBadge();
    refreshWidget();
  });
  ```

### **6. Backend Event Emission** (2 horas)
- [ ] Atualizar `src/services/agentOrchestratorService.ts`
  ```typescript
  import { websocketService } from './websocketService';
  
  // Após executar agente
  websocketService.broadcast(organizationId, 'agent:execution:complete', {
    agentId,
    taskId,
    duration,
    result
  });
  ```
- [ ] Atualizar `src/services/agentTaskService.ts`
  ```typescript
  // Após criar task
  websocketService.broadcast(organizationId, 'task:created', { taskId });
  
  // Após aprovar task
  websocketService.broadcast(organizationId, 'task:approved', { taskId });
  ```
- [ ] Adicionar eventos em outros services conforme necessário

### **7. Execution History Dashboard** (4-5 horas)
- [ ] Criar `public/js/modules/agents/history.js` (~300 linhas)
- [ ] Adicionar route `#agent-execution-history`
- [ ] Componentes UI:
  - Filtros: date range, agent, status, method
  - Tabela: executions com duration, tools, result
  - Metrics cards: success rate, avg duration, total executions
  - Chart: executions over time (last 30 days)
- [ ] Backend: `GET /api/agent-tasks/execution-history` endpoint
- [ ] Controller method para fetch TaskExecution table

### **8. E2E Testing** (2 horas)
- [ ] Test 1: Conectar WebSocket → verificar welcome message
- [ ] Test 2: Executar agente → verificar evento `agent:execution:complete` em tempo real
- [ ] Test 3: Aprovar task → verificar evento `task:approved`
- [ ] Test 4: Desconectar servidor → verificar reconexão automática
- [ ] Test 5: Múltiplas organizações → verificar isolamento
- [ ] Test 6: Stress test → 50 clientes simultâneos

---

## 🎯 Definition of Done (FASE 2 WebSocket)

### **✅ COMPLETO - WebSocket Core**
- [x] WebSocketService implementado (300+ linhas)
- [x] Integrado com Fastify HTTP server
- [x] Keep-alive ping/pong funcionando
- [x] Broadcast por organizationId
- [x] Graceful shutdown implementado
- [x] Cliente WebSocket criado (280 linhas)
- [x] Reconexão automática com backoff exponencial
- [x] Event handler system (pub/sub)
- [x] Script adicionado no index.html
- [x] 0 erros TypeScript
- [x] Documentação de entrega criada

### **⏳ PENDENTE - Integration & Testing**
- [ ] WebSocket integrado no módulo agents
- [ ] WebSocket integrado no dashboard widget
- [ ] Backend emitindo eventos (orchestrator, task service)
- [ ] Execution history page criada
- [ ] E2E tests completos
- [ ] Performance test (50+ conexões simultâneas)

---

## 📚 Referências

### **WebSocket Server API**
```typescript
// Broadcast para organização
websocketService.broadcast(organizationId, eventType, data);

// Enviar para usuário específico
websocketService.sendToUser(organizationId, userId, eventType, data);

// Estatísticas
websocketService.getStats();

// Shutdown
websocketService.shutdown();
```

### **WebSocket Client API**
```javascript
// Conexão
wsClient.connect(organizationId, userId);

// Event handlers
wsClient.on(eventType, handler);
wsClient.off(eventType, handler);

// Estado
wsClient.isConnected();
wsClient.getState();

// Enviar mensagem
wsClient.send(type, data);

// Desconectar
wsClient.disconnect();
```

### **Eventos Padrão**
| Evento | Direção | Descrição |
|--------|---------|-----------|
| `connected` | Server → Client | Bem-vindo após conexão |
| `disconnected` | Internal | Conexão fechada |
| `agent:execution:start` | Server → Client | Agente iniciou execução |
| `agent:execution:complete` | Server → Client | Agente completou |
| `agent:execution:error` | Server → Client | Agente teve erro |
| `task:created` | Server → Client | Nova task criada |
| `task:approved` | Server → Client | Task aprovada |
| `task:executed` | Server → Client | Task executada |
| `permission:pending` | Server → Client | Permissão pendente |
| `ping` | Client → Server | Keep-alive |
| `pong` | Server → Client | Keep-alive response |

---

## ✨ Status Final

**FASE 2 - WebSocket Real-Time**: ✅ **50% COMPLETO**
- ✅ WebSocket Service: ENTREGUE
- ✅ WebSocket Client: ENTREGUE
- ⏳ Integration (agents module): PENDENTE
- ⏳ Backend event emission: PENDENTE
- ⏳ Execution history: PENDENTE

**Prioridade Próxima**: Integrar WebSocket no módulo agents (2-3 horas)

**Bloqueios**: Nenhum - Sistema pronto para integração
