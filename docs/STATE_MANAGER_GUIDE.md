# 📊 State Manager - Guia de Uso

## 🚀 Inicialização

O State Manager é inicializado automaticamente no `index.html` e está disponível globalmente como `window.stateManager`.

```javascript
// Conectar ao State Manager em qualquer módulo
if (window.stateManager) {
    this.stateManager = window.stateManager;
    console.log('✅ State Manager conectado');
}
```

## 📝 Operações Básicas

### Salvar Dados
```javascript
// Simples
stateManager.set('chave', valor);

// Com opções
stateManager.set('chave', valor, {
    ttl: 300000,        // 5 minutos
    persistent: true    // Salvar no localStorage
});
```

### Carregar Dados
```javascript
// Simples
const valor = stateManager.get('chave');

// Com valor padrão
const valor = stateManager.get('chave', 'padrão');

// Verificar existência
if (stateManager.has('chave')) {
    // Chave existe e não expirou
}
```

### Cache Inteligente
```javascript
// Carregar ou criar se não existir
const dados = await stateManager.getOrSet('api_data', async () => {
    const response = await fetch('/api/data');
    return await response.json();
}, { ttl: 300000 });
```

## 🔄 Cache de API

### Padrão Recomendado para APIs
```javascript
async loadData() {
    const cacheKey = 'module_data';
    
    // Tentar cache primeiro
    if (this.stateManager && this.stateManager.has(cacheKey)) {
        this.data = this.stateManager.get(cacheKey);
        this.renderData();
        return;
    }
    
    try {
        // Carregar da API
        const response = await fetch('/api/data');
        const data = await response.json();
        
        // Salvar no cache
        if (this.stateManager) {
            this.stateManager.set(cacheKey, data, { ttl: 300000 });
        }
        
        this.data = data;
        this.renderData();
    } catch (error) {
        console.error('Erro:', error);
    }
}
```

### Invalidar Cache
```javascript
// Invalidar quando dados são modificados
async saveData(data) {
    const response = await fetch('/api/data', {
        method: 'POST',
        body: JSON.stringify(data)
    });
    
    if (response.ok) {
        // Invalidar cache para recarregar dados atualizados
        this.stateManager.delete('module_data');
        await this.loadData();
    }
}
```

## 💾 Persistência

### Preferências do Usuário
```javascript
// Salvar preferência (persiste entre sessões)
stateManager.set('user_pref_theme', 'dark', { persistent: true });

// Carregar preferência
const theme = stateManager.get('user_pref_theme', 'light');
```

### Rascunhos
```javascript
// Salvar rascunho com expiração
stateManager.set('form_draft', formData, {
    persistent: true,
    ttl: 86400000 // 24 horas
});

// Carregar rascunho
const draft = stateManager.get('form_draft');
if (draft) {
    this.populateForm(draft);
}
```

## 📡 Subscriptions (Reatividade)

### Reagir a Mudanças
```javascript
// Escutar mudanças em uma chave
const unsubscribe = stateManager.subscribe('user_theme', (change) => {
    console.log('Tema alterado:', change.value);
    this.applyTheme(change.value);
});

// Parar de escutar
unsubscribe();
```

### Múltiplas Chaves
```javascript
// Escutar múltiplas chaves
const unsubscribe = stateManager.subscribeMultiple(
    ['theme', 'language', 'timezone'], 
    (change) => {
        console.log('Configuração alterada:', change);
        this.updateUI();
    }
);
```

## 🎯 Padrões por Módulo

### Student Editor
```javascript
class StudentEditor {
    connectStateManager() {
        this.stateManager = window.stateManager;
    }
    
    async loadStudentData(studentId) {
        const cacheKey = `student_data_${studentId}`;
        
        if (this.stateManager?.has(cacheKey)) {
            return this.stateManager.get(cacheKey);
        }
        
        const response = await fetch(`/api/students/${studentId}`);
        const data = await response.json();
        
        this.stateManager?.set(cacheKey, data, { ttl: 300000 });
        return data;
    }
    
    saveFormDraft(formData) {
        this.stateManager?.set(
            `student_draft_${this.studentId}`, 
            formData, 
            { persistent: true }
        );
    }
}
```

### Organizations Module
```javascript
class OrganizationsModule {
    async loadOrganizations() {
        const cacheKey = 'organizations_list';
        
        // Cache primeiro
        if (this.stateManager?.has(cacheKey)) {
            this.organizations = this.stateManager.get(cacheKey);
            this.renderOrganizations();
            return;
        }
        
        // API
        const response = await fetch('/api/organizations');
        const data = await response.json();
        
        this.organizations = data.data;
        this.stateManager?.set(cacheKey, this.organizations, { ttl: 180000 });
        this.renderOrganizations();
    }
    
    saveFilters() {
        this.stateManager?.set('org_filters', this.filters, { persistent: true });
    }
}
```

## 🛠️ Utilitários

### Debug
```javascript
// Ver estatísticas
console.log(stateManager.getStats());

// Ver todas as chaves
console.log(stateManager.keys());

// Debug completo
stateManager.debug();
```

### Limpeza
```javascript
// Limpar chave específica
stateManager.delete('chave');

// Limpar tudo
stateManager.clear();

// Limpar expirados
stateManager.cleanup();
```

## ⚡ Configuração

### TTL Recomendados
- **Dados da API**: 300000ms (5 minutos)
- **Preferências**: Sem TTL (persistente)
- **Cache temporário**: 60000ms (1 minuto)
- **Rascunhos**: 86400000ms (24 horas)
- **Sessão**: 1800000ms (30 minutos)

### Nomenclatura
- **Módulo**: `students_list`, `courses_data`
- **Usuário**: `user_pref_theme`, `user_settings`
- **Cache**: `api_cache_endpoint`, `cache_organizations`
- **Rascunho**: `draft_student_form`, `temp_work`

### Configuração Personalizada
```javascript
// Ao inicializar (no index.html)
const stateManager = new StateManager({
    defaultTTL: 600000,     // 10 minutos
    maxCacheSize: 500,      // 500 itens max
    persistenceKey: 'app_state'
});
```

## 🔍 Debugging

### Verificar Estado
```javascript
// Stats completas
const stats = stateManager.getStats();
console.table(stats);

// Verificar chave específica
console.log('Existe?', stateManager.has('minha_chave'));
console.log('Valor:', stateManager.get('minha_chave'));

// Listar todas as chaves
console.log('Chaves:', stateManager.keys());
```

### Monitoramento
```javascript
// Log todas as mudanças
stateManager.subscribe('*', (change) => {
    console.log('Estado alterado:', change);
});
```
