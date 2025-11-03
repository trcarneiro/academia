# 🎮 Exemplos Práticos - Sistema de Chat com Agentes

Este arquivo contém exemplos práticos de uso do sistema de chat com agentes, incluindo comandos PowerShell, cURL, e exemplos de integração frontend.

---

## 📋 Índice
1. [Testes Rápidos via PowerShell](#testes-rápidos-via-powershell)
2. [Testes via cURL](#testes-via-curl)
3. [Integração Frontend JavaScript](#integração-frontend-javascript)
4. [Cenários de Uso Real](#cenários-de-uso-real)
5. [Troubleshooting](#troubleshooting)

---

## 1. Testes Rápidos via PowerShell

### **Teste 1: Mensagem Simples**
```powershell
# Configuração
$orgId = "452c0b35-1822-4890-851e-922356c812fb"
$agentId = "ecb685a1-d50a-4fe2-a3e2-7ec6efb5693a"

# Request
$body = @{
    agentId = $agentId
    message = "Quantos alunos temos matriculados atualmente?"
} | ConvertTo-Json

$response = Invoke-RestMethod `
    -Uri "http://localhost:3000/api/agents/chat" `
    -Method POST `
    -Headers @{
        "Content-Type" = "application/json; charset=utf-8"
        "x-organization-id" = $orgId
    } `
    -Body $body

# Ver resposta do agente
$agentMessage = $response.data.messages | Where-Object { $_.role -eq "assistant" } | Select-Object -Last 1
Write-Host $agentMessage.content

# Ver métricas
Write-Host "`nTokens: $($agentMessage.tokensUsed)"
Write-Host "Tempo: $($agentMessage.executionTime)ms"
Write-Host "RAG: $($agentMessage.ragSourcesUsed -join ', ')"
Write-Host "ConversationId: $($response.data.conversationId)"
```

**Output Esperado:**
```
Para responder à sua pergunta, preciso executar algumas consultas no banco de dados...

Tokens: 905
Tempo: 3798ms
RAG: students, courses, subscriptions, lesson_plans
ConversationId: b6d5d5ab-3346-4e85-92eb-42511fdbe578
```

---

### **Teste 2: Conversação Contínua (2 mensagens)**
```powershell
# Primeira mensagem
$body1 = @{
    agentId = $agentId
    message = "Quantos alunos temos?"
} | ConvertTo-Json

$response1 = Invoke-RestMethod `
    -Uri "http://localhost:3000/api/agents/chat" `
    -Method POST `
    -Headers @{"Content-Type" = "application/json; charset=utf-8"; "x-organization-id" = $orgId} `
    -Body $body1

$conversationId = $response1.data.conversationId
Write-Host "ConversationId: $conversationId"

Start-Sleep -Seconds 2

# Segunda mensagem (com conversationId)
$body2 = @{
    agentId = $agentId
    message = "E quantos estão com plano vencido?"
    conversationId = $conversationId
} | ConvertTo-Json

$response2 = Invoke-RestMethod `
    -Uri "http://localhost:3000/api/agents/chat" `
    -Method POST `
    -Headers @{"Content-Type" = "application/json; charset=utf-8"; "x-organization-id" = $orgId} `
    -Body $body2

# Ver ambas as respostas
Write-Host "`n=== MENSAGEM 1 ==="
$msg1 = $response2.data.messages | Where-Object { $_.role -eq "assistant" } | Select-Object -First 1
Write-Host $msg1.content

Write-Host "`n=== MENSAGEM 2 ==="
$msg2 = $response2.data.messages | Where-Object { $_.role -eq "assistant" } | Select-Object -Last 1
Write-Host $msg2.content
```

---

### **Teste 3: Script Completo com 4 Cenários**
```powershell
# Executar script de testes automatizados
.\test-agent-conversation.ps1

# Output: 4 testes sequenciais com validações automáticas
```

---

## 2. Testes via cURL

### **Teste 1: Mensagem Simples (Linux/Mac/Git Bash)**
```bash
curl -X POST http://localhost:3000/api/agents/chat \
  -H "Content-Type: application/json; charset=utf-8" \
  -H "x-organization-id: 452c0b35-1822-4890-851e-922356c812fb" \
  -d '{
    "agentId": "ecb685a1-d50a-4fe2-a3e2-7ec6efb5693a",
    "message": "Quantos alunos temos matriculados?"
  }' | jq '.data.messages[-1].content'
```

### **Teste 2: Com ConversationId**
```bash
# Primeira mensagem (salvar conversationId)
conversationId=$(curl -X POST http://localhost:3000/api/agents/chat \
  -H "Content-Type: application/json; charset=utf-8" \
  -H "x-organization-id: 452c0b35-1822-4890-851e-922356c812fb" \
  -d '{
    "agentId": "ecb685a1-d50a-4fe2-a3e2-7ec6efb5693a",
    "message": "Quantos alunos temos?"
  }' | jq -r '.data.conversationId')

echo "ConversationId: $conversationId"

# Segunda mensagem (usar conversationId)
curl -X POST http://localhost:3000/api/agents/chat \
  -H "Content-Type: application/json; charset=utf-8" \
  -H "x-organization-id: 452c0b35-1822-4890-851e-922356c812fb" \
  -d '{
    "agentId": "ecb685a1-d50a-4fe2-a3e2-7ec6efb5693a",
    "message": "E quantos estão com plano vencido?",
    "conversationId": "'$conversationId'"
  }' | jq '.data.messages[-1].content'
```

---

## 3. Integração Frontend JavaScript

### **Exemplo 1: Módulo Chat Básico**
```javascript
// public/js/modules/agent-chat/index.js

const AgentChat = {
    currentConversationId: null,
    agentId: 'ecb685a1-d50a-4fe2-a3e2-7ec6efb5693a',
    
    async sendMessage(message) {
        const body = {
            agentId: this.agentId,
            message: message
        };
        
        // Adicionar conversationId se existir
        if (this.currentConversationId) {
            body.conversationId = this.currentConversationId;
        }
        
        try {
            const response = await fetch('/api/agents/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'x-organization-id': localStorage.getItem('organizationId')
                },
                body: JSON.stringify(body)
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Armazenar conversationId
                this.currentConversationId = data.data.conversationId;
                
                // Extrair resposta do agente
                const agentMessage = data.data.messages.filter(m => m.role === 'assistant').pop();
                
                return {
                    content: agentMessage.content,
                    tokens: agentMessage.tokensUsed,
                    time: agentMessage.executionTime,
                    ragSources: agentMessage.ragSourcesUsed,
                    conversationId: data.data.conversationId
                };
            } else {
                throw new Error(data.message || 'Failed to send message');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    },
    
    resetConversation() {
        this.currentConversationId = null;
    }
};

// Uso:
const response = await AgentChat.sendMessage("Quantos alunos temos?");
console.log(response.content);
console.log(`Tokens: ${response.tokens}, Tempo: ${response.time}ms`);
```

---

### **Exemplo 2: UI Chat Component**
```javascript
// public/js/modules/agent-chat/chat-ui.js

class ChatUI {
    constructor(containerId, agentId) {
        this.container = document.getElementById(containerId);
        this.agentId = agentId;
        this.conversationId = null;
        this.render();
        this.attachEvents();
    }
    
    render() {
        this.container.innerHTML = `
            <div class="agent-chat-container">
                <div class="chat-header">
                    <h3>🤖 Agente de Matrículas</h3>
                    <button id="reset-chat">Nova Conversa</button>
                </div>
                <div class="chat-messages" id="chat-messages"></div>
                <div class="chat-input">
                    <textarea id="message-input" placeholder="Digite sua mensagem..."></textarea>
                    <button id="send-message">Enviar</button>
                </div>
            </div>
        `;
    }
    
    attachEvents() {
        const sendBtn = document.getElementById('send-message');
        const input = document.getElementById('message-input');
        const resetBtn = document.getElementById('reset-chat');
        
        sendBtn.addEventListener('click', () => this.sendMessage());
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        resetBtn.addEventListener('click', () => this.resetConversation());
    }
    
    async sendMessage() {
        const input = document.getElementById('message-input');
        const message = input.value.trim();
        
        if (!message) return;
        
        // Adicionar mensagem do usuário na UI
        this.addMessage('user', message);
        input.value = '';
        
        // Mostrar loading
        this.showLoading();
        
        try {
            const body = {
                agentId: this.agentId,
                message: message
            };
            
            if (this.conversationId) {
                body.conversationId = this.conversationId;
            }
            
            const response = await fetch('/api/agents/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'x-organization-id': localStorage.getItem('organizationId')
                },
                body: JSON.stringify(body)
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.conversationId = data.data.conversationId;
                const agentMessage = data.data.messages.filter(m => m.role === 'assistant').pop();
                
                // Remover loading e adicionar resposta do agente
                this.removeLoading();
                this.addMessage('assistant', agentMessage.content, {
                    tokens: agentMessage.tokensUsed,
                    time: agentMessage.executionTime,
                    ragSources: agentMessage.ragSourcesUsed
                });
            } else {
                throw new Error(data.message || 'Failed to send message');
            }
        } catch (error) {
            console.error('Error:', error);
            this.removeLoading();
            this.addMessage('error', 'Erro ao enviar mensagem. Tente novamente.');
        }
    }
    
    addMessage(role, content, metadata = null) {
        const messagesDiv = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message chat-message-${role}`;
        
        let html = `<div class="message-content">${content}</div>`;
        
        if (metadata) {
            html += `
                <div class="message-metadata">
                    <span>⚡ ${metadata.tokens} tokens</span>
                    <span>⏱️ ${(metadata.time / 1000).toFixed(1)}s</span>
                    ${metadata.ragSources ? `<span>📚 ${metadata.ragSources.length} fontes</span>` : ''}
                </div>
            `;
        }
        
        messageDiv.innerHTML = html;
        messagesDiv.appendChild(messageDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
    
    showLoading() {
        const messagesDiv = document.getElementById('chat-messages');
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'chat-message chat-loading';
        loadingDiv.id = 'chat-loading';
        loadingDiv.innerHTML = '<div class="loading-dots">●●●</div>';
        messagesDiv.appendChild(loadingDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
    
    removeLoading() {
        const loadingDiv = document.getElementById('chat-loading');
        if (loadingDiv) loadingDiv.remove();
    }
    
    resetConversation() {
        this.conversationId = null;
        document.getElementById('chat-messages').innerHTML = '';
        this.addMessage('system', 'Nova conversa iniciada');
    }
}

// Uso:
const chat = new ChatUI('chat-container', 'ecb685a1-d50a-4fe2-a3e2-7ec6efb5693a');
```

---

### **Exemplo 3: CSS para Chat UI**
```css
/* public/css/modules/agent-chat.css */

.agent-chat-container {
    display: flex;
    flex-direction: column;
    height: 600px;
    border: 1px solid var(--border-color);
    border-radius: 12px;
    overflow: hidden;
    background: white;
}

.chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.chat-header h3 {
    margin: 0;
    font-size: 1.1rem;
}

.chat-header button {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.2s;
}

.chat-header button:hover {
    background: rgba(255, 255, 255, 0.3);
}

.chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    background: #f8f9fa;
}

.chat-message {
    margin-bottom: 1rem;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    max-width: 80%;
    animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

.chat-message-user {
    background: #667eea;
    color: white;
    margin-left: auto;
}

.chat-message-assistant {
    background: white;
    border: 1px solid #e0e0e0;
}

.chat-message-error {
    background: #ffebee;
    border: 1px solid #ef5350;
    color: #c62828;
}

.chat-message-system {
    background: #e3f2fd;
    border: 1px solid #64b5f6;
    color: #1976d2;
    text-align: center;
    margin: 0 auto;
}

.message-content {
    white-space: pre-wrap;
    word-wrap: break-word;
}

.message-metadata {
    display: flex;
    gap: 1rem;
    margin-top: 0.5rem;
    font-size: 0.75rem;
    color: #666;
}

.chat-loading {
    text-align: center;
    padding: 1rem;
}

.loading-dots {
    display: inline-block;
    font-size: 1.5rem;
    animation: pulse 1s infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 1; }
}

.chat-input {
    display: flex;
    gap: 0.5rem;
    padding: 1rem;
    background: white;
    border-top: 1px solid #e0e0e0;
}

.chat-input textarea {
    flex: 1;
    padding: 0.75rem;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    resize: none;
    font-family: inherit;
    font-size: 0.95rem;
}

.chat-input button {
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    transition: transform 0.2s, box-shadow 0.2s;
}

.chat-input button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}
```

---

## 4. Cenários de Uso Real

### **Cenário 1: Dashboard de Administração**
```javascript
// Adicionar widget de chat no dashboard
// public/js/modules/dashboard.js

async init() {
    // ... existing code ...
    
    // Adicionar chat widget
    this.initAgentChat();
}

initAgentChat() {
    const chatWidget = document.createElement('div');
    chatWidget.innerHTML = `
        <div class="dashboard-widget agent-chat-widget">
            <h3>💬 Assistente Inteligente</h3>
            <div id="dashboard-agent-chat"></div>
        </div>
    `;
    
    document.querySelector('.dashboard-widgets').appendChild(chatWidget);
    
    // Inicializar chat
    new ChatUI('dashboard-agent-chat', 'ecb685a1-d50a-4fe2-a3e2-7ec6efb5693a');
}
```

---

### **Cenário 2: Módulo de Alunos (Quick Ask)**
```javascript
// public/js/modules/students/controllers/editor-controller.js

addQuickAskButton() {
    const button = document.createElement('button');
    button.className = 'btn-quick-ask';
    button.innerHTML = '💬 Perguntar ao Agente';
    button.onclick = () => this.showQuickAsk();
    
    document.querySelector('.student-header').appendChild(button);
}

async showQuickAsk() {
    const studentId = this.currentStudent.id;
    const studentName = this.currentStudent.name;
    
    // Perguntar ao agente sobre este aluno específico
    const message = `Informações sobre o aluno ${studentName}`;
    
    const response = await AgentChat.sendMessage(message);
    
    // Mostrar resposta em modal ou sidebar
    this.showAgentResponse(response.content);
}
```

---

### **Cenário 3: Análise Automática Diária**
```javascript
// Backend: src/services/scheduledTasks.ts

import { agentExecutorService } from './agentExecutorService';

export async function dailyAnalysis() {
    const agentId = 'ecb685a1-d50a-4fe2-a3e2-7ec6efb5693a';
    
    const tasks = [
        "Quantos alunos estão com plano vencido?",
        "Existem alunos com plano ativo mas sem matrícula?",
        "Quais são as 3 ações mais urgentes para hoje?"
    ];
    
    const results = [];
    
    for (const task of tasks) {
        const conversation = await agentExecutorService.createConversationAndExecute(
            agentId,
            task,
            { userId: 'system', metadata: { source: 'scheduled_task' } }
        );
        
        const agentMessage = conversation.messages.find(m => m.role === 'assistant');
        results.push({
            task,
            response: agentMessage.content,
            tokens: agentMessage.tokensUsed
        });
    }
    
    // Enviar relatório por email ou notificação
    await sendDailyReport(results);
}

// Agendar com node-cron
import cron from 'node-cron';

// Todo dia às 8:00
cron.schedule('0 8 * * *', () => {
    console.log('Running daily agent analysis...');
    dailyAnalysis();
});
```

---

## 5. Troubleshooting

### **Problema 1: Caracteres Corrompidos (Mojibake)**
**Sintoma:** Respostas com "Ã§", "Ã£o", "Ã©" em vez de "ç", "ão", "é"

**Solução:**
```powershell
# Adicionar charset=utf-8 no Content-Type
-Headers @{
    "Content-Type" = "application/json; charset=utf-8"
    "x-organization-id" = $orgId
}
```

---

### **Problema 2: ConversationId Não Mantido**
**Sintoma:** Cada mensagem cria um novo conversationId

**Solução:**
```javascript
// Armazenar conversationId da primeira resposta
const response1 = await fetch('/api/agents/chat', { ... });
const conversationId = response1.data.conversationId;

// Usar em mensagens subsequentes
const body = {
    agentId: agentId,
    message: message,
    conversationId: conversationId  // ✅ Adicionar este campo
};
```

---

### **Problema 3: Timeout (60s)**
**Sintoma:** Request demora mais de 60s e retorna erro

**Solução:**
```powershell
# Aumentar timeout no request
Invoke-RestMethod `
    -Uri "..." `
    -Method POST `
    -TimeoutSec 120  # ✅ Aumentar de 60 para 120 segundos
```

---

### **Problema 4: Resposta Vazia**
**Sintoma:** `$response.data.messages` está vazio

**Diagnóstico:**
```powershell
# Ver resposta completa
$response | ConvertTo-Json -Depth 10

# Verificar estrutura
Write-Host "Success: $($response.success)"
Write-Host "Message count: $($response.data.messages.Count)"
Write-Host "ConversationId: $($response.data.conversationId)"
```

**Solução:** Ver logs do servidor para identificar erro interno

---

### **Problema 5: Erro 404 (Agent Not Found)**
**Sintoma:** `{"success": false, "message": "Agent not found"}`

**Solução:**
```powershell
# Verificar se agentId existe no banco
# Query SQL:
SELECT id, name, is_active FROM agents WHERE id = 'ecb685a1-d50a-4fe2-a3e2-7ec6efb5693a';

# Se não existir, criar agente:
npx ts-node scripts/create-enrollment-agent.ts
```

---

## 📚 Referências

- **Relatório Completo:** `AGENT_CONVERSATION_FINAL_REPORT.md`
- **Sumário Executivo:** `AGENT_CHAT_DELIVERY_SUMMARY.md`
- **Plano de Testes:** `AGENT_CONVERSATION_TEST_REPORT.md`
- **Script de Testes:** `test-agent-conversation.ps1`
- **Backend Routes:** `src/routes/agents.ts`
- **Agent Service:** `src/services/agentOrchestratorService.ts`

---

**Desenvolvido por:** GitHub Copilot  
**Data:** 11/01/2025  
**Versão:** 1.0.0
