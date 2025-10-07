# Padrões de Módulos - Academia Krav Maga

## 🎯 Dois Modelos de Referência

### **1. Activities (Multi-file) - Funcionalidades Complexas**
O módulo **Activities** (`/public/js/modules/activities/`) é a referência para módulos com funcionalidades complexas e múltiplas integrações.

### **2. Instructors (Single-file) - CRUD Simplificado** 🆕
O módulo **Instructors** (`/public/js/modules/instructors/index.js`) é a referência para módulos de CRUD básico com performance otimizada.

## 📊 Comparação dos Modelos

| Aspecto | Activities (Multi-file) | Instructors (Single-file) |
|---------|------------------------|---------------------------|
| **Linhas de código** | ~800-1200 | ~400-600 |
| **Arquivos** | 7+ arquivos | 1 arquivo principal |
| **Performance** | Boa | Excelente (80% mais rápido) |
| **Manutenibilidade** | Boa para complexidade alta | Excelente para CRUD |
| **Casos de uso** | Integrações, workflows | CRUD, listagens, forms |

## 🚀 Quando Usar Cada Modelo?

### **Single-file (Instructors) - RECOMENDADO para:**
- ✅ Módulos de CRUD básico
- ✅ Listagens simples com edição
- ✅ Performance crítica
- ✅ Módulos com <600 linhas de lógica
- ✅ Funcionalidades diretas (sem workflows complexos)

### **Multi-file (Activities) - RECOMENDADO para:**
- ✅ Funcionalidades muito complexas (>600 linhas)
- ✅ Múltiplas integrações externas
- ✅ Workflows elaborados
- ✅ Muitos componentes reutilizáveis
- ✅ Lógica de negócio especializada

## 📋 Implementação: Modelo Single-file

## 📋 Implementação: Modelo Single-file

### ✅ Estrutura Simplificada
```
/public/js/modules/[module]/
├── index.js                    # TUDO EM UM ARQUIVO (400-600 linhas)
├── controllers/
│   └── [Module]Controller.js   # Stub de compatibilidade (opcional)
└── [outros arquivos removidos]
```

### ✅ Anatomia do index.js (Single-file)
```javascript
// 1. Prevenção de re-declaração
if (typeof window.ModuleName !== 'undefined') {
    console.log('Module already loaded, skipping...');
} else {

// 2. Objeto principal do módulo
const ModuleName = {
    container: null,
    data: [],
    initialized: false,

    // 3. Inicialização
    async init() { /* ... */ },
    
    // 4. Carregamento de dados + API
    async loadData() { /* fetch + error handling */ },
    
    // 5. Renderização principal
    render() { /* HTML + UI premium */ },
    
    // 6. Editor inline
    async renderEditor(id = null) { /* form + validation */ },
    
    // 7. Event handlers
    setupEvents() { /* clicks + forms */ },
    
    // 8. Estados UI
    showSuccess/showError/showNotification() { /* ... */ },
    
    // 9. Utilities
    formatData() { /* ... */ }
};

// 10. Registro global e eventos
window.moduleName = ModuleName;
window.app?.dispatchEvent('module:loaded', { name: 'module' });

} // fim do if
```

## 📋 Implementação: Modelo Multi-file

### ✅ Estrutura Tradicional
```
/public/js/modules/[module]/
├── index.js                    # Entry point principal
├── controllers/
│   └── [Module]Controller.js   # Controller principal
├── services/
│   └── [Module]Service.js      # Lógica de negócio
├── views/
│   ├── [module]-list.html      # Template de listagem
│   └── [module]-editor.html    # Template de edição
└── components/
    └── [Module]Card.js         # Componentes reutilizáveis
```

### ✅ Classes CSS Obrigatórias (Ambos Modelos)
```css
/* Headers */
.module-header-premium
.module-title-premium
.breadcrumb-premium

/* Cards e Estatísticas */
.stat-card-enhanced
.data-card-premium
.metric-card-premium

/* Estados */
.loading-premium
.empty-state-premium
.error-state-premium
```

## 🎯 Decision Tree: Qual Modelo Escolher?

```
Novo módulo/funcionalidade?
├─ É CRUD básico? ────────────────► Single-file (Instructors)
├─ Tem <600 linhas de lógica? ───► Single-file (Instructors)
├─ Performance é crítica? ───────► Single-file (Instructors)
├─ Múltiplas integrações? ───────► Multi-file (Activities)
├─ Workflows complexos? ─────────► Multi-file (Activities)
└─ >600 linhas de lógica? ───────► Multi-file (Activities)
```

## 📈 Métricas de Sucesso Comprovadas

### **Instructors (Single-file)**
- **Performance**: 80% mais rápido que versão multi-file
- **Arquivos**: 86% redução (7 → 1)
- **Linhas**: 73% redução (1500+ → 400)
- **Funcionalidades**: 100% mantidas
- **Manutenibilidade**: Significativamente melhorada

### **Activities (Multi-file)**
- **Flexibilidade**: 100% para funcionalidades complexas
- **Reutilização**: Componentes isolados
- **Testabilidade**: Fácil mock de services
- **Escalabilidade**: Suporta crescimento orgânico

/* Estados */
.loading-premium
.empty-state-premium
.error-state-premium

/* Formulários */
.form-premium
.form-actions-premium
```

### ✅ Padrões de API
```javascript
// 1. Inicialização da API
let moduleAPI = null;
async function initializeAPI() {
    await waitForAPIClient();
    moduleAPI = window.createModuleAPI('ModuleName');
}

// 2. Uso do fetchWithStates
await moduleAPI.fetchWithStates('/api/endpoint', {
    loadingElement: document.getElementById('loading'),
    onSuccess: (data) => renderData(data),
    onEmpty: () => showEmptyState(),
    onError: (error) => showErrorState(error)
});

// 3. Integração com AcademyApp
window.app.dispatchEvent('module:loaded', { name: 'module' });
window.myModule = module;
```

### ✅ Estados de UI Obrigatórios

Todos os módulos DEVEM implementar:

1. **Loading State**: Spinner durante carregamento
2. **Empty State**: Quando não há dados
3. **Error State**: Para falhas de API
4. **Success State**: Para confirmações

### ✅ Navegação Padrão

1. **Listagem**: Página principal com tabela/cards
2. **Edição**: Página full-screen (não modal)
3. **Breadcrumb**: Navegação clara
4. **Double-click**: Na listagem vai para edição
5. **Botões de ação**: Seguir padrão Activities

## 🔄 Processo de Migração

Para atualizar um módulo existente para o padrão Activities:

### 1. Análise do Módulo Activities
```bash
# Copie a estrutura completa
cp -r /public/js/modules/activities/ /public/js/modules/[novo-modulo]/
```

### 2. Adaptação
- Renomeie arquivos e classes
- Ajuste endpoints da API
- Mantenha a estrutura CSS
- Preserve os padrões de navegação

### 3. Testes
- Verificar loading/empty/error states
- Testar navegação duplo-clique
- Validar responsividade
- Confirmar integração com AcademyApp

## 📖 Exemplos Práticos

### Estrutura do Controller (Baseado em Activities)
```javascript
class ModuleController {
    constructor() {
        this.moduleAPI = null;
        this.container = null;
        this.initialized = false;
    }

    async initialize() {
        // Inicializar API
        await this.initializeAPI();
        
        // Encontrar elementos DOM
        this.findElements();
        
        // Carregar dados
        await this.loadData();
        
        // Setup eventos
        this.setupEventListeners();
    }

    async loadData() {
        await this.moduleAPI.fetchWithStates('/api/endpoint', {
            loadingElement: this.loadingElement,
            onSuccess: (data) => this.renderData(data),
            onEmpty: () => this.showEmptyState(),
            onError: (error) => this.showErrorState(error)
        });
    }
}
```

### Template HTML (Baseado em Activities)
```html
<!-- Header Premium -->
<div class="module-header-premium">
    <div class="breadcrumb-premium">
        <span class="breadcrumb-item">Home</span>
        <span class="breadcrumb-separator">/</span>
        <span class="breadcrumb-item active">Módulo</span>
    </div>
    <h1 class="module-title-premium">Gestão de Módulo</h1>
</div>

<!-- Stats Cards -->
<div class="stats-grid-premium">
    <div class="stat-card-enhanced">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
            <span class="stat-value">0</span>
            <span class="stat-label">Total</span>
        </div>
    </div>
</div>

<!-- Loading/Empty/Error States -->
<div id="loading-state" class="loading-premium"></div>
<div id="empty-state" class="empty-state-premium"></div>
<div id="error-state" class="error-state-premium"></div>

<!-- Content -->
<div id="content-container" class="data-card-premium">
    <!-- Conteúdo principal -->
</div>
```

## 🚨 Regras Importantes

### ❌ Não Faça
- Não crie padrões diferentes do Activities
- Não use modais (apenas full-screen)
- Não hardcode dados
- Não ignore loading/empty/error states
- Não modifique arquivos core

### ✅ Sempre Faça
- Copie a estrutura do Activities
- Use as classes premium
- Implemente todos os estados de UI
- Teste a responsividade
- Integre com AcademyApp

## 📞 Suporte

Se tiver dúvidas sobre implementação:
1. **Primeiro**: Consulte o módulo Activities
2. **Segundo**: Leia este documento
3. **Terceiro**: Verifique AGENTS.md

---

**Lembre-se**: O módulo Activities é a fonte da verdade. Se funciona lá, deve funcionar em todos os outros módulos da mesma forma.