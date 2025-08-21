# Proposed Architecture v1.1
**Based on**: CurrentArchitecture.md  
**Status**: PROPOSED  

## Mudanças Propostas
### 1. Isolamento de Módulos
- **CSS**:
  - Prefixo único para cada módulo: 
    - `.students-isolated-*` para alunos
    - `.plans-isolated-*` para planos
    - `.techniques-isolated-*` para técnicas
  - Remover estilos globais que afetam múltiplos módulos

### 2. Implementação API-First
- **Frontend**:
  - Remover todos os dados hardcoded
  - Implementar estados de carregamento:
    ```html
    <div class="loading-state">
      <div class="spinner"></div>
      Carregando dados...
    </div>
    ```
  - Tratamento de erros:
    ```html
    <div class="error-state">
      ❌ Falha ao carregar dados. <button onclick="retryLoad()">Tentar novamente</button>
    </div>
    ```

### 3. Navegação Full-Screen
- **Padronização**:
  - Cada operação CRUD em página dedicada (ex: `/alunos/editar/:id`)
  - Manter menu lateral visível durante edições
  - Navegação via SPA sem recarregamento total

### 4. Contratos de API
| Endpoint        | Método | Descrição                  |
|-----------------|--------|----------------------------|
| /api/students   | GET    | Lista paginada de alunos   |
| /api/plans      | GET    | Lista completa de planos   |
| /api/techniques | GET    | Lista hierárquica de técnicas |

## Plano de Migração
1. **Fase 1** (1 dia):
   - Refatorar CSS com prefixos isolados
   - Atualizar seletores em arquivos HTML/JS

2. **Fase 2** (2 dias):
   - Implementar loading/error states
   - Remover dados mockados

3. **Fase 3** (1 dia):
   - Validar navegação full-screen
   - Atualizar documentação

## Riscos
1. **Compatibilidade**:
   - Módulos legados podem quebrar durante transição
   - Solução: Manter versão anterior até validação completa

2. **Performance**:
   - Múltiplas requisições simultâneas
   - Solução: Implementar cache de API