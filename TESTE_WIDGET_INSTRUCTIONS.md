## 🧪 TESTE RÁPIDO - Widget de Tasks Pendentes

### ✅ SISTEMA CONFIRMADO FUNCIONANDO
- ✅ Servidor rodando (console mostra routes carregadas)
- ✅ Dashboard carregado com sucesso
- ✅ Agente de Matrículas executou com sucesso (25s)
- ✅ Task de teste criada no banco (ID: da75dde4-bb11-4511-b808-6fc46183fb76)

### 🔍 PRÓXIMO PASSO: Visualizar Widget

**1. Navegue até Dashboard:**
```
http://localhost:3000/#dashboard
```

**2. Procure pelo Widget:**
O widget "**Tarefas Pendentes**" deve aparecer:
- **Localização**: Após as métricas principais (estatísticas de alunos/cursos)
- **Aparência**: 
  - Header roxo com gradiente (#667eea → #764ba2)
  - Badge pulsante com "**1 pendente**"
  - Card com:
    - 🟢 Categoria: WHATSAPP_MESSAGE (verde)
    - 🟡 Prioridade: MEDIUM (amarelo)
    - 👤 Agente: "Agente de Matrículas e Planos"
    - Botões: ✅ Aprovar | ❌ Rejeitar | 👁️ Detalhes

**3. Se NÃO visualizar o widget:**

Execute no console do navegador (F12):
```javascript
// Verificar se widget existe
console.log('TaskApprovalWidget:', window.TaskApprovalWidget);

// Verificar container
console.log('Container:', document.getElementById('task-approval-widget'));

// Forçar inicialização
if (window.TaskApprovalWidget && document.getElementById('task-approval-widget')) {
    window.TaskApprovalWidget.init(document.getElementById('task-approval-widget'));
}
```

**4. Testar API diretamente (via Console F12):**
```javascript
// Verificar tasks pendentes via API
fetch('http://localhost:3000/api/agent-tasks/pending/count', {
    headers: {
        'x-organization-id': '452c0b35-1822-4890-851e-922356c812fb'
    }
})
.then(r => r.json())
.then(data => console.log('📊 Tasks pendentes:', data));

// Listar tasks pendentes
fetch('http://localhost:3000/api/agent-tasks?approvalStatus=PENDING&limit=5', {
    headers: {
        'x-organization-id': '452c0b35-1822-4890-851e-922356c812fb'
    }
})
.then(r => r.json())
.then(data => console.log('📋 Tasks:', data));
```

### ⚠️ ERRO NO MODAL (500 Internal Server Error)

O erro ao criar agente via sugestão é **separado** do sistema de tasks. 

**Para investigar:**
1. Verifique logs do servidor no terminal
2. Erro provavelmente em `POST /api/agents/orchestrator/create`

**Workaround:** 
- Criar agentes manualmente via formulário (não via sugestão)
- O agente "Agente de Matrículas e Planos" já existe e está funcionando

---

## ✅ CONFIRMAÇÃO VISUAL

**O que você DEVE ver no Dashboard:**

```
╔══════════════════════════════════════════════════════════╗
║  📊 MÉTRICAS (Alunos, Cursos, Frequência...)            ║
╚══════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════╗
║  ⚡ TAREFAS PENDENTES              [ 1 pendente 🔴 ]    ║
╠══════════════════════════════════════════════════════════╣
║  🟢 WHATSAPP_MESSAGE    🟡 MEDIUM                       ║
║  Teste: Notificar aluno com plano vencendo              ║
║  👤 Agente de Matrículas e Planos                       ║
║  ⏰ há 5 minutos                                         ║
║                                                          ║
║  [✅ Aprovar]  [❌ Rejeitar]  [👁️ Detalhes]             ║
╚══════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════╗
║  🚀 QUICK ACTIONS (Criar Aluno, Curso...)               ║
╚══════════════════════════════════════════════════════════╝
```

---

## 🐛 SE WIDGET NÃO APARECER

**Possível causa:** Widget não inicializou automaticamente.

**Solução:**
1. Abra Console (F12)
2. Execute:
```javascript
// Verificar se scripts carregaram
console.log('Widget JS:', !!window.TaskApprovalWidget);
console.log('Dashboard JS:', !!window.DashboardModule);

// Forçar inicialização do widget
async function initWidget() {
    const container = document.getElementById('task-approval-widget');
    if (!container) {
        console.error('❌ Container task-approval-widget não encontrado!');
        return;
    }
    
    if (!window.TaskApprovalWidget) {
        console.error('❌ TaskApprovalWidget.js não carregado!');
        return;
    }
    
    await window.TaskApprovalWidget.init(container);
    console.log('✅ Widget inicializado manualmente');
}

initWidget();
```

---

## 📸 TIRE SCREENSHOT

**Para ajudar no diagnóstico, tire screenshot de:**
1. **Dashboard completo** (scroll até ver todas as seções)
2. **Console do navegador** (F12 → Console)
3. **Network tab** (F12 → Network → filtrar "/api/agent-tasks")

---

## 🎯 PRÓXIMA AÇÃO

**Você está vendo o widget de tasks no dashboard?**
- ✅ SIM → Teste os botões Aprovar/Rejeitar
- ❌ NÃO → Execute comandos de diagnóstico acima

**Aguardando seu feedback para prosseguir!** 🚀
