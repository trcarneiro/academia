# Workflow AI-Driven Development

## 🤖 Processo para AI Agents

### 1. Análise (SEMPRE primeiro)
```bash
# Verificar arquitetura existente
search: **/CurrentArchitecture.md
search: **/public/js/modules/students/**

# Verificar endpoints
search: **/src/routes/**[module]**

# Verificar app integration
search: **/public/js/core/app.js
```

### 2. Implementação
```javascript
// Padrão obrigatório - API Client
let moduleAPI = null;
async function initializeAPI() {
    await waitForAPIClient();
    moduleAPI = window.createModuleAPI('ModuleName');
}

// Estados obrigatórios
await moduleAPI.fetchWithStates('/api/endpoint', {
    loadingElement: document.getElementById('container'),
    onSuccess: (data) => renderData(data),
    onEmpty: () => showEmptyState(),
    onError: (error) => showErrorState(error)
});

// Registro no AcademyApp
window.myModuleName = myModule;
window.app.dispatchEvent('module:loaded', { name: 'myModule' });
```

### 3. Validação
```bash
# Checklist antes de commit
npm run test
npm run lint
npm run typecheck
# Browser console sem erros
# Estados loading/empty/error testados
# Responsividade verificada
```

## ✅ Checklist Obrigatório

### Frontend
- [ ] Módulo registrado em `AcademyApp.loadModules()`
- [ ] CSS isolado com `.module-isolated-*`
- [ ] Design tokens aplicados (--primary-color, --gradient-primary)
- [ ] Estados API cobertos (loading/empty/error/success)
- [ ] Responsividade 768px/1024px/1440px
- [ ] Classes premium aplicadas (.module-header-premium, .stat-card-enhanced)
- [ ] BEM naming convention seguida
- [ ] Error handling via app.handleError()

### Backend
- [ ] Endpoint documentado no Swagger
- [ ] ResponseHelper utilizado
- [ ] Validação de schema Prisma
- [ ] Error handling consistente
- [ ] Path aliases (@/) utilizados

## 🎯 Prompt Padrão para IA

```
Criar módulo [NOME] seguindo dev/GUIDELINES2:
- API-First: usar /api/[endpoint] 
- CSS: tokens do DESIGN_SYSTEM.md
- Naming: BEM + .module-isolated-*
- Estados: loading/empty/error implementados
- **Template**: Instructors (single-file) OU Activities (multi-file)
- Premium: .stat-card-enhanced, .module-header-premium
- Validar: responsividade + acessibilidade
- Registrar: AcademyApp.loadModules() + window exposure
```

## 🔄 Ciclo de Feedback

1. **Implementar** seguindo workflow
2. **Testar** estados e responsividade  
3. **Documentar** mudanças em docs/
4. **Validar** com checklist acima
5. **Iterar** baseado em feedback
6. **Registrar** no sistema central

## 🚨 Estados Obrigatórios

### Loading State
```javascript
function showLoadingState(container) {
    container.innerHTML = `
        <div class="module-isolated-loading">
            <div class="loading-spinner"></div>
            <p>Carregando dados...</p>
        </div>
    `;
}
```

### Empty State
```javascript
function showEmptyState(container, config = {}) {
    const { icon = 'inbox', title = 'Nenhum item', action = null } = config;
    container.innerHTML = `
        <div class="module-isolated-empty">
            <i class="icon-${icon}"></i>
            <h3>${title}</h3>
            ${action ? `<button onclick="${action}">Adicionar</button>` : ''}
        </div>
    `;
}
```

### Error State
```javascript
function showErrorState(container, error) {
    container.innerHTML = `
        <div class="module-isolated-error">
            <i class="icon-alert-circle"></i>
            <h3>Erro ao carregar</h3>
            <p>${error.message}</p>
            <button onclick="location.reload()">Tentar Novamente</button>
        </div>
    `;
}
```

## 🎮 Toolsets Integration

### Recomendação por Tarefa:
- **Novo módulo**: `academiaModuleDev`
- **MVP → Premium**: `academiaPremiumMigration`
- **Correção específica**: `academiaStudentsEditor`
- **Teste de API**: `academiaAPITesting`
- **Validação conformidade**: `academiaGuidelinesCompliance`
- **Análise arquitetura**: `academiaArchitectureAnalysis`

### Como usar toolsets:
1. Selecione o toolset apropriado no VS Code
2. O Copilot terá acesso às ferramentas certas
3. Prompts serão otimizados para o contexto
4. Validação automática será aplicada

---

**Foco**: Automação, consistência e qualidade através de AI-driven development
