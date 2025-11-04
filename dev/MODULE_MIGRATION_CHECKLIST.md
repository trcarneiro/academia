# ✅ Checklist de Migração de Módulos - AGENTS.md v2.1

## 🎯 Objetivo
Padronizar módulos legados para conformidade com AGENTS.md v2.1 usando templates de referência (Students, Instructors, Activities).

---

## 📋 Pré-Migração

### 1. Análise Inicial
- [ ] Módulo identificado no `AUDIT_REPORT.md`?
- [ ] Prioridade definida (CRÍTICO/ALTA/MÉDIA/BAIXA)?
- [ ] Funcionalidade documentada?
- [ ] Dependências mapeadas?
- [ ] Endpoints da API validados no Swagger?

### 2. Escolha da Estrutura
**Decisão**: Single-file ou Multi-file?

#### Use **Single-file** se:
- [ ] CRUD básico (Create, Read, Update, Delete)
- [ ] Menos de 600 linhas de lógica
- [ ] Sem múltiplas views/telas complexas
- [ ] Performance crítica
- [ ] **Template**: `/public/js/modules/instructors/index.js`

#### Use **Multi-file** se:
- [ ] Múltiplas views/telas (abas, wizards)
- [ ] Lógica de negócio complexa (500+ linhas)
- [ ] Integrações externas múltiplas
- [ ] Separação de responsabilidades necessária
- [ ] **Template**: `/public/js/modules/activities/` ou `/public/js/modules/students/`

---

## 🔧 Implementação

### 3. Setup Estrutural

#### Para Single-file:
- [ ] Criar `/public/js/modules/[module]/index.js`
- [ ] Copiar estrutura do Instructors:
  ```javascript
  // 1. Imports e configuração
  // 2. Estado e cache
  // 3. API Client initialization
  // 4. Renderização principal
  // 5. CRUD functions
  // 6. Event handlers
  // 7. Initialization
  // 8. Export
  ```
- [ ] Criar CSS isolado em `/public/css/modules/[module].css`
- [ ] Prefixo `.module-isolated-[module]-` em todas as classes

#### Para Multi-file:
- [ ] Criar estrutura de diretórios:
  ```
  /public/js/modules/[module]/
  ├── index.js              # Entry point
  ├── controllers/          # MVC controllers
  │   ├── list-controller.js
  │   └── editor-controller.js
  ├── services/             # Business logic
  │   └── [module]-service.js
  ├── views/                # HTML templates
  │   ├── list-view.js
  │   └── editor-view.js
  └── components/           # Reusable UI
      └── [component].js
  ```
- [ ] Criar CSS isolado em `/public/css/modules/[module].css`
- [ ] Prefixo `.module-isolated-[module]-` em todas as classes

### 4. API Client Integration (OBRIGATÓRIO)

- [ ] Adicionar no início do módulo:
  ```javascript
  let moduleAPI = null;
  
  async function initializeAPI() {
      await waitForAPIClient();
      moduleAPI = window.createModuleAPI('ModuleName');
  }
  
  function waitForAPIClient() {
      return new Promise((resolve) => {
          if (window.createModuleAPI) return resolve();
          const checkInterval = setInterval(() => {
              if (window.createModuleAPI) {
                  clearInterval(checkInterval);
                  resolve();
              }
          }, 100);
      });
  }
  ```

- [ ] Substituir TODOS os `fetch()` por `moduleAPI.request()`:
  ```javascript
  // ❌ ANTIGO
  const response = await fetch('/api/endpoint');
  const data = await response.json();
  
  // ✅ NOVO
  const data = await moduleAPI.request('/api/endpoint');
  ```

- [ ] Usar `fetchWithStates` para listagens:
  ```javascript
  await moduleAPI.fetchWithStates('/api/[endpoint]', {
      loadingElement: container,
      onSuccess: (data) => render[Data](data),
      onEmpty: () => show[Empty]State(),
      onError: (error) => show[Error]State(error)
  });
  ```

### 5. AcademyApp Integration (OBRIGATÓRIO)

- [ ] Registrar módulo no `public/js/core/app.js`:
  ```javascript
  async loadModules() {
      const modules = [
          'students',
          'instructors',
          'activities',
          '[seu-modulo]',  // ← ADICIONAR AQUI
          // ...
      ];
  ```

- [ ] Expor globalmente no final do módulo:
  ```javascript
  window.[moduleName] = window.[moduleName]Module = [moduleName]Module;
  ```

- [ ] Disparar evento de carregamento:
  ```javascript
  async function initialize() {
      await initializeAPI();
      // ... outras inicializações
      window.app?.dispatchEvent('module:loaded', { name: '[moduleName]' });
  }
  ```

- [ ] Usar error handling global:
  ```javascript
  try {
      // ... código
  } catch (error) {
      console.error('[ModuleName] Error:', error);
      window.app?.handleError?.(error, '[ModuleName]');
      show[Error]State(error);
  }
  ```

### 6. UI Premium Implementation (OBRIGATÓRIO)

#### Header Premium
- [ ] Substituir `.module-header` por `.module-header-premium`:
  ```html
  <div class="module-header-premium">
      <div class="module-header-top">
          <div class="breadcrumb-nav">
              <span class="breadcrumb-item">Home</span>
              <span class="breadcrumb-separator">›</span>
              <span class="breadcrumb-item active">[Module]</span>
          </div>
      </div>
      <div class="module-title-section">
          <h1 class="module-title">[Ícone] [Título]</h1>
      </div>
  </div>
  ```

#### Stats Cards Enhanced
- [ ] Substituir `.stat-card` por `.stat-card-enhanced`:
  ```html
  <div class="stat-card-enhanced" data-stat-type="[tipo]">
      <div class="stat-content">
          <div class="stat-icon">[Ícone]</div>
          <div class="stat-details">
              <p class="stat-value">${value}</p>
              <p class="stat-label">${label}</p>
          </div>
      </div>
  </div>
  ```

#### Data Cards Premium
- [ ] Substituir `.data-card` por `.data-card-premium`:
  ```html
  <div class="data-card-premium" data-id="${id}" onclick="${action}">
      <div class="card-header">
          <h3 class="card-title">${title}</h3>
          <span class="card-badge">${badge}</span>
      </div>
      <div class="card-body">
          ${content}
      </div>
  </div>
  ```

#### Design Tokens
- [ ] Usar variáveis CSS oficiais:
  ```css
  /* Em /public/css/modules/[module].css */
  .module-isolated-[module]-container {
      background: var(--color-background);
      color: var(--color-text-primary);
  }
  
  .module-isolated-[module]-button-primary {
      background: var(--gradient-primary);
      transition: var(--transition-bounce);
  }
  
  .module-isolated-[module]-card {
      background: linear-gradient(135deg, var(--color-surface) 0%, var(--color-background) 100%);
      box-shadow: var(--shadow-large);
  }
  ```

### 7. Estados de UI (OBRIGATÓRIO)

#### Loading State
- [ ] Implementar spinner durante carregamento:
  ```javascript
  function showLoadingState(container) {
      container.innerHTML = `
          <div class="loading-state">
              <div class="spinner"></div>
              <p class="loading-message">Carregando [dados]...</p>
          </div>
      `;
  }
  ```

#### Empty State
- [ ] Implementar mensagem quando sem dados:
  ```javascript
  function showEmptyState(container) {
      container.innerHTML = `
          <div class="empty-state">
              <div class="empty-icon">[Ícone]</div>
              <h3 class="empty-title">Nenhum [item] encontrado</h3>
              <p class="empty-message">
                  Comece adicionando um novo [item].
              </p>
              <button 
                  class="btn-primary" 
                  onclick="${addFunction}">
                  Adicionar [Item]
              </button>
          </div>
      `;
  }
  ```

#### Error State
- [ ] Implementar mensagem de erro amigável:
  ```javascript
  function showErrorState(container, error) {
      container.innerHTML = `
          <div class="error-state">
              <div class="error-icon">⚠️</div>
              <h3 class="error-title">Erro ao carregar [dados]</h3>
              <p class="error-message">${error.message || 'Erro desconhecido'}</p>
              <button 
                  class="btn-secondary" 
                  onclick="${retryFunction}">
                  Tentar Novamente
              </button>
          </div>
      `;
  }
  ```

### 8. Navegação e UX

#### Full-screen Navigation (NO MODALS)
- [ ] Usar páginas dedicadas para edição:
  ```javascript
  function navigateToEditor(id) {
      const contentArea = document.getElementById('content-area');
      contentArea.innerHTML = render[Editor]View(id);
  }
  ```

- [ ] Adicionar botão de volta:
  ```html
  <button class="btn-back" onclick="${backFunction}">
      ← Voltar
  </button>
  ```

#### Double-click Navigation
- [ ] Implementar duplo-clique em tabelas:
  ```javascript
  row.addEventListener('dblclick', () => {
      navigateTo[Editor](item.id);
  });
  ```

### 9. Responsividade (OBRIGATÓRIO)

- [ ] Testar breakpoints:
  - [ ] Mobile: 768px
  - [ ] Tablet: 1024px
  - [ ] Desktop: 1440px

- [ ] CSS responsivo:
  ```css
  /* Mobile First */
  .module-isolated-[module]-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1rem;
  }
  
  @media (min-width: 768px) {
      .module-isolated-[module]-grid {
          grid-template-columns: repeat(2, 1fr);
      }
  }
  
  @media (min-width: 1024px) {
      .module-isolated-[module]-grid {
          grid-template-columns: repeat(3, 1fr);
      }
  }
  
  @media (min-width: 1440px) {
      .module-isolated-[module]-grid {
          grid-template-columns: repeat(4, 1fr);
      }
  }
  ```

---

## ✅ Validação

### 10. Quality Gates

#### Build
- [ ] `npm run build` - sem erros TypeScript/JS

#### Lint
- [ ] `npm run lint` - sem erros bloqueantes

#### Test
- [ ] Teste happy path: criação → listagem → edição → deleção
- [ ] Teste edge case: dados inválidos, erro de rede, timeout
- [ ] `npm run test` - todos os testes passando

#### Smoke Test
- [ ] Navegar até o módulo
- [ ] Verificar loading state aparece
- [ ] Verificar lista carrega ou empty state aparece
- [ ] Duplo-clique navega para edição
- [ ] Botão "Voltar" funciona
- [ ] Estados de erro funcionam (simular erro de API)
- [ ] Nenhuma exception no console

### 11. Validação Manual

- [ ] Estados visuais:
  - [ ] Loading: spinner + mensagem
  - [ ] Empty: ícone + mensagem + call-to-action
  - [ ] Error: ícone de erro + mensagem + botão retry
  - [ ] Success: dados renderizados corretamente

- [ ] UI Premium:
  - [ ] Header com breadcrumb funcional
  - [ ] Stats cards com hover effects
  - [ ] Data cards com gradientes
  - [ ] Botões com transições suaves

- [ ] Integração:
  - [ ] Módulo registrado no AcademyApp
  - [ ] Evento `module:loaded` disparado
  - [ ] Erros reportados via `window.app.handleError`
  - [ ] API Client funcionando em todos os endpoints

- [ ] Responsividade:
  - [ ] Layout funciona em 768px
  - [ ] Layout funciona em 1024px
  - [ ] Layout funciona em 1440px
  - [ ] Touch targets adequados (mínimo 44px)

---

## 📚 Pós-Migração

### 12. Documentação

- [ ] Atualizar `AUDIT_REPORT.md` com novo status do módulo
- [ ] Adicionar comentários JSDoc nas funções principais
- [ ] Documentar endpoints da API no Swagger (se novos)
- [ ] Criar PR com descrição detalhada das mudanças

### 13. Cleanup

- [ ] Remover código legacy comentado
- [ ] Remover arquivos não utilizados
- [ ] Consolidar CSS duplicado
- [ ] Otimizar imports

### 14. Comunicação

- [ ] Notificar equipe sobre migração concluída
- [ ] Compartilhar métricas (redução de arquivos, linhas de código)
- [ ] Destacar melhorias de UX
- [ ] Coletar feedback inicial

---

## 🎯 Exemplos de Uso

### Exemplo 1: Migração CRUD Simples (Single-file)
**Módulo**: Organizations  
**Template**: Instructors  
**Tempo estimado**: 2-3 horas  
**Checklist resumido**:
1. Copiar estrutura Instructors
2. Adaptar endpoints API
3. Adicionar API Client
4. Implementar UI Premium
5. Testar estados
6. Validar Quality Gates

### Exemplo 2: Migração Complexa (Multi-file)
**Módulo**: Frequency  
**Template**: Activities ou Students  
**Tempo estimado**: 1-2 dias  
**Checklist resumido**:
1. Copiar estrutura Activities
2. Separar lógica em controllers/services/views
3. Implementar API Client em todos os controllers
4. Padronizar UI Premium em todas as views
5. Testar navegação entre telas
6. Validar estados em cada view
7. Testes completos

### Exemplo 3: Refatoração de Arquivo Standalone
**Módulo**: Course Editor  
**Ação**: Integrar ao módulo Courses  
**Tempo estimado**: 4-6 horas  
**Checklist resumido**:
1. Mapear funcionalidades do standalone
2. Identificar sobreposições com Courses
3. Mesclar código eliminando duplicação
4. Migrar para estrutura Multi-file
5. Implementar navegação integrada
6. Testar todos os fluxos
7. Remover arquivo standalone

---

## 📊 Métricas de Sucesso

### KPIs de Migração
- [ ] **Redução de arquivos**: > 30% (para Single-file)
- [ ] **Redução de código**: > 20%
- [ ] **Conformidade AGENTS.md**: 100%
- [ ] **Cobertura de estados**: 100%
- [ ] **UI Premium**: 100%
- [ ] **Quality Gates**: 4/4 PASS

### Antes vs Depois
| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| Arquivos | X | Y | Z% |
| Linhas de código | X | Y | Z% |
| Estados implementados | X/3 | 3/3 | 100% |
| UI Premium | X% | 100% | Z% |
| Bugs reportados | X | 0 | 100% |
| Tempo de carregamento | Xms | <300ms | Z% |

---

## 🔗 Recursos

- **AGENTS.md**: Guia operacional master
- **AUDIT_REPORT.md**: Relatório completo de auditoria
- **MODULE_STANDARDS.md**: Padrões detalhados
- **Templates de Referência**:
  - Single-file: `/public/js/modules/instructors/index.js`
  - Multi-file: `/public/js/modules/activities/`
  - Gold Standard: `/public/js/modules/students/`

---

**Versão**: 1.0  
**Data**: 30/09/2025  
**Status**: Ativo  
**Próxima revisão**: 30/10/2025
