# Fix: window.turmasController Export Issue

**Data**: 30/10/2025  
**Sessão**: 4 Phase 2 - UX Refactor  
**Status**: ✅ COMPLETO

## Problema

Após refatoração UX do módulo Turmas, os botões de ação estavam lançando erro:

```
Uncaught TypeError: window.turmasController.showEdit is not a function
```

### Causa Raiz

O arquivo `public/js/modules/turmas/index.js` estava exportando o **módulo inteiro** como `window.turmasController`:

```javascript
// ❌ ERRADO: Exportava TurmasModule em vez do controller interno
window.turmasController = turmasModule;
```

Mas os onclick handlers esperavam acesso aos **métodos do controller interno**:

```javascript
// HTML esperava:
onclick="window.turmasController.showEdit('${turma.id}')"

// Mas showEdit() estava em:
turmasModule.controller.showEdit()  // ❌ Não acessível via window.turmasController
```

## Solução Implementada

### 1. Exportar Controller Interno no Init

**Arquivo**: `public/js/modules/turmas/index.js`  
**Linhas**: ~45-50

```javascript
this.service = new TurmasService(turmasAPI);
this.controller = new TurmasController(this.service);

// ✅ CORRETO: Expor controller interno globalmente
window.turmasController = this.controller;

// Garantir CSS de edição inline carregado
this.loadModuleCSS();
```

### 2. Atualizar Comentário de Exportação

**Arquivo**: `public/js/modules/turmas/index.js`  
**Linhas**: ~203-206

```javascript
// Exposição global para integração
window.turmasModule = turmasModule;
window.turmas = turmasModule;
// window.turmasController é definido no init() após criar o controller interno

export default turmasModule;
```

## Métodos Agora Disponíveis

Com `window.turmasController` corretamente apontando para `TurmasController`, os onclick handlers têm acesso a:

- ✅ `window.turmasController.showEdit(turmaId)` - Abre editor
- ✅ `window.turmasController.showStudents(turmaId)` - Abre lista de alunos
- ✅ `window.turmasController.showSchedule(turmaId)` - Abre cronograma
- ✅ `window.turmasController.showList()` - Volta para lista
- ✅ Todos os outros métodos públicos de TurmasController

## Arquivos Modificados

1. **public/js/modules/turmas/index.js** (+3 linhas, ~2 alterações)
   - Adicionado `window.turmasController = this.controller;` no método `init()`
   - Removido export incorreto `window.turmasController = turmasModule;`
   - Atualizado comentário explicativo

## Testes Recomendados

1. ✅ Atualizar navegador (F5)
2. ✅ Clicar em botão ✏️ (Visualizar) → Deve abrir editor
3. ✅ Clicar em botão 👥 (Alunos) → Deve abrir lista de alunos
4. ✅ Clicar em botão 📅 (Cronograma) → Deve abrir cronograma
5. ✅ Duplo-clique na linha → Deve abrir editor
6. ✅ Verificar console → Sem erros JavaScript

## Impacto

- **Severidade**: Crítica (bloqueava 100% das interações)
- **Escopo**: Módulo Turmas apenas
- **Retrocompatibilidade**: ✅ Mantida (window.turmasModule ainda existe)
- **Performance**: Sem impacto

## Lições Aprendidas

1. **Global Exports**: Quando expor objetos globalmente para onclick handlers, sempre expor o objeto que contém os métodos públicos, não o wrapper
2. **Async Initialization**: Em módulos que inicializam assincronamente (dynamic imports), expor globals **após** criar as instâncias internas
3. **Testing Pattern**: Sempre testar onclick handlers após mudanças em exports globais
4. **Documentation**: Comentar quando exports globais são definidos fora do escopo principal

## Padrão Recomendado

Para módulos similares, seguir este padrão:

```javascript
class MyModule {
    constructor() {
        this.controller = null;
    }
    
    async init() {
        const { MyController } = await import('./controllers/MyController.js');
        this.controller = new MyController();
        
        // ✅ Expor controller interno para onclick handlers
        window.myController = this.controller;
        
        this.isInitialized = true;
    }
}

const myModule = new MyModule();
window.myModule = myModule;
// window.myController definido no init()

export default myModule;
```

## Referências

- Arquivo: `public/js/modules/turmas/index.js`
- Controller: `public/js/modules/turmas/controllers/TurmasController.js`
- View: `public/js/modules/turmas/views/TurmasListView.js`
- Issue relacionada: Refatoração UX Session 4 Phase 2
