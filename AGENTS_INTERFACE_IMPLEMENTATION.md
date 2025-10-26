# 🤖 Interface de Criação de Agentes - Implementação

**Data**: 25/10/2025  
**Contexto**: Backend de Agent Orchestrator completo, interface faltando  
**Objetivo**: Criar UI para gerenciar agentes autônomos (ORCHESTRATOR, MARKETING, COMERCIAL, etc.)

---

## 📍 Onde Adicionar a Interface

### Opção 1: Nova Seção no Módulo AI (RECOMENDADO)
**Localização**: `public/js/modules/ai/index.js`  
**Vantagem**: Coesão temática, agentes são recursos de IA  
**Implementação**: Adicionar aba "Agentes" ou seção "Criar Agente"

### Opção 2: Novo Módulo Separado
**Localização**: `public/js/modules/agents/index.js` (novo)  
**Vantagem**: Separação de responsabilidades  
**Implementação**: Módulo single-file seguindo padrão AGENTS.md

---

## 🎯 Funcionalidades Necessárias

### 1. **Sugerir Agentes** (Endpoint: POST /api/agents/orchestrator/suggest)
**Input**: Análise automática do sistema  
**Output**: Lista de agentes recomendados pela IA

```javascript
async suggestAgents() {
    const response = await this.moduleAPI.request('/api/agents/orchestrator/suggest', {
        method: 'POST',
        body: JSON.stringify({
            businessContext: {
                organizationId: localStorage.getItem('organizationId'),
                industryType: 'martial-arts-academy',
                goals: ['automation', 'customer-engagement', 'analytics']
            }
        })
    });
    
    // response.data = [
    //   { type: 'MARKETING', name: 'Agent de WhatsApp', description: '...', confidence: 0.95 },
    //   { type: 'PEDAGOGICO', name: 'Gestor de Currículos', description: '...', confidence: 0.88 }
    // ]
}
```

### 2. **Criar Agente** (Endpoint: POST /api/agents/orchestrator/create)
**Input**: Configuração do agente (tipo, nome, system prompt, tools, permissions)  
**Output**: Agente criado com ID

```javascript
async createAgent(config) {
    const response = await this.moduleAPI.request('/api/agents/orchestrator/create', {
        method: 'POST',
        body: JSON.stringify({
            name: config.name,
            type: config.type, // ORCHESTRATOR, MARKETING, COMERCIAL, etc.
            description: config.description,
            systemPrompt: config.systemPrompt || `Você é um agente ${config.type}...`,
            tools: config.tools || [],
            automationRules: config.automationRules || {},
            permissions: config.permissions || {} // RBAC rules
        })
    });
}
```

### 3. **Listar Agentes** (Endpoint: GET /api/agents/orchestrator/list)
**Output**: Array de agentes existentes

```javascript
async listAgents() {
    const response = await this.moduleAPI.request('/api/agents/orchestrator/list');
    // response.data = [ { id, name, type, isActive, createdAt }, ... ]
}
```

### 4. **Executar Agente** (Endpoint: POST /api/agents/orchestrator/execute/:agentId)
**Input**: Task description  
**Output**: Result com logs de execução

```javascript
async executeAgent(agentId, task) {
    const response = await this.moduleAPI.request(`/api/agents/orchestrator/execute/${agentId}`, {
        method: 'POST',
        body: JSON.stringify({
            task: 'Analise as vendas do último mês e envie relatório',
            context: { /* dados adicionais */ }
        })
    });
}
```

### 5. **Monitorar Execuções** (Endpoint: GET /api/agents/orchestrator/monitor)
**Output**: Estatísticas de execuções (sucessos, falhas, tempo médio)

---

## 🎨 Mockup da Interface

```
┌──────────────────────────────────────────────────────────────┐
│  🤖 AGENTES INTELIGENTES                                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [✨ Sugerir Agentes]   [➕ Criar Novo]   [📊 Monitoramento] │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  AGENTES ATIVOS (3)                                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  📧 WhatsApp Marketing Agent                   [▶] [✏️] [🗑️] │
│  Tipo: MARKETING | Criado: 20/10/2025 | Status: ✅ Ativo    │
│  Ferramentas: WhatsApp API, CRM Database                    │
│  Última execução: Há 2 horas (✅ Sucesso)                   │
│  ────────────────────────────────────────────────────────   │
│                                                              │
│  💰 Gestor Financeiro                          [▶] [✏️] [🗑️] │
│  Tipo: FINANCEIRO | Criado: 18/10/2025 | Status: ✅ Ativo   │
│  Ferramentas: Billing Database, Asaas API                   │
│  Última execução: Há 5 horas (✅ Sucesso)                   │
│  ────────────────────────────────────────────────────────   │
│                                                              │
│  📚 Curador de Currículo                       [▶] [✏️] [🗑️] │
│  Tipo: PEDAGOGICO | Criado: 15/10/2025 | Status: ✅ Ativo   │
│  Ferramentas: Courses Database, LessonPlans Database        │
│  Última execução: Há 1 dia (✅ Sucesso)                     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔧 Implementação Rápida (Opção 1 - Dentro do Módulo AI)

### Passo 1: Adicionar Seção de Agentes ao Render
```javascript
// Em render(), após RAG Documents Section
<div class="module-isolated-ai-agents data-card-premium">
    ${this.renderAgentsSection()}
</div>
```

### Passo 2: Criar renderAgentsSection()
```javascript
renderAgentsSection() {
    return `
        <h3 class="section-title">
            <i class="fas fa-robot"></i>
            Agentes Autônomos
        </h3>
        
        <div class="agents-actions">
            <button class="btn-form btn-primary-form" data-action="suggest-agents">
                ✨ Sugerir Agentes
            </button>
            <button class="btn-form btn-success-form" data-action="create-agent">
                ➕ Criar Novo Agente
            </button>
            <button class="btn-form btn-info-form" data-action="monitor-agents">
                📊 Monitoramento
            </button>
        </div>
        
        <div id="agents-list" class="agents-grid">
            ${this.renderAgentsList()}
        </div>
    `;
}
```

### Passo 3: Adicionar Event Listeners
```javascript
// Em setupEvents()
const agentButtons = this.container.querySelectorAll('[data-action^="suggest-"], [data-action^="create-"], [data-action^="monitor-"]');
agentButtons.forEach(btn => {
    const action = btn.dataset.action;
    btn.addEventListener('click', () => {
        switch(action) {
            case 'suggest-agents': this.suggestAgents(); break;
            case 'create-agent': this.openAgentCreator(); break;
            case 'monitor-agents': this.openAgentMonitor(); break;
        }
    });
});
```

### Passo 4: Implementar Métodos
Ver seção "Funcionalidades Necessárias" acima.

---

## 📝 Templates de Agentes (GET /api/agents/orchestrator/templates)

Backend já fornece templates prontos. UI deve mostrar:

```
📧 WhatsApp Marketing
   Envia campanhas e responde leads automaticamente
   
💰 Financial Manager
   Monitora inadimplências e envia cobranças
   
📚 Course Curator
   Atualiza currículos baseado em performance
   
📊 Analytics Reporter
   Gera relatórios semanais automaticamente
   
🎓 Graduation Manager
   Avalia alunos e sugere progressões
```

---

## 🚀 Próximos Passos

1. **IMEDIATO**: Adicionar seção de Agentes no módulo AI
2. **TESTE**: Endpoint GET /api/agents/orchestrator/list
3. **UI MÍNIMA**: Listar agentes + botão "Criar Novo"
4. **FORM**: Modal/página de criação com campos:
   - Nome
   - Tipo (select: ORCHESTRATOR, MARKETING, etc.)
   - System Prompt (textarea)
   - Tools (multi-select)
   - Automation Rules (JSON editor ou checkboxes)
5. **VALIDAÇÃO**: Criar agente de teste, executar task simples
6. **MONITORAMENTO**: Dashboard com estatísticas de execuções

---

## 🎯 Decisão Necessária

**Usuário, escolha**:
- [ ] **Opção 1**: Adicionar seção de Agentes DENTRO do módulo AI (rápido, 30 min)
- [ ] **Opção 2**: Criar módulo `agents` separado (completo, 2 horas)

Qual preferência?

---

**Arquivo**: `AGENTS_INTERFACE_IMPLEMENTATION.md`
