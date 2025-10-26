# 🐛 Debug: AI Module onclick não funciona

**Data**: 25/10/2025  
**Problema**: Botões com `onclick="window.aiModule.method()"` não funcionam  
**Sintoma**: Clique nos botões não gera resposta

---

## 🔍 Diagnóstico

### Logs do Console
```
ai.js:4639 🤖 AI Module - Loaded and exposed globally
```

### Arquitetura do Módulo
- **Tipo**: `<script type="module">` (ES6 module com escopo isolado)
- **Export**: `window.AIModule` e `window.aiModule`
- **Botões**: Usam `onclick="window.aiModule.openCourseAnalysis()"`

### Problema Identificado
ES6 modules criam **escopo isolado**. Variáveis exportadas para `window` dentro do módulo podem não estar disponíveis para `onclick` inline devido a timing de carregamento.

---

## ✅ Soluções Possíveis

### Solução 1: Trocar onclick por addEventListener (RECOMENDADO)
**Vantagem**: Padrão moderno, melhor controle  
**Desvantagem**: Requer mudar HTML + JS

```javascript
// Em setupEvents()
const featureButtons = this.container.querySelectorAll('.feature-card button');
featureButtons.forEach(btn => {
    const feature = btn.closest('.feature-card').dataset.feature;
    btn.addEventListener('click', () => {
        switch(feature) {
            case 'course-analysis': this.openCourseAnalysis(); break;
            case 'lesson-generation': this.openLessonGenerator(); break;
            case 'technique-suggestions': this.openTechniqueGenerator(); break;
            case 'rag-qa': this.openRAGChat(); break;
            case 'custom-chat': this.openCustomChat(); break;
            case 'analytics': this.openAnalytics(); break;
        }
    });
});
```

### Solução 2: Remover type="module" do script
**Vantagem**: onclick funciona imediatamente  
**Desvantagem**: Sem imports ES6, escopo global poluído

```html
<!-- public/index.html - linha 166 -->
<script src="js/modules/ai/index.js"></script> <!-- SEM type="module" -->
```

### Solução 3: Garantir export antes do render
**Status**: JÁ IMPLEMENTADO
```javascript
// Linha ~720
window.AIModule = AIModule;
window.aiModule = AIModule;
console.log('🌐 [AI Module] Exported to global scope');
```

---

## 🧪 Teste Manual

Abra Console do Navegador (F12) e execute:

```javascript
// 1. Verificar se módulo existe
console.log('window.aiModule:', window.aiModule);

// 2. Listar métodos disponíveis
console.log('Methods:', Object.keys(window.aiModule || {}));

// 3. Testar método diretamente
window.aiModule?.openCourseAnalysis();

// 4. Se não existir, verificar AIModule (uppercase)
console.log('window.AIModule:', window.AIModule);
```

**Resultado Esperado**:
- `window.aiModule` deve ser um objeto com métodos
- `openCourseAnalysis()` deve preencher o chat input

**Se falhar**: O módulo não está exportando corretamente.

---

## 🎯 Implementação da Solução 1 (RECOMENDADA)

### Passo 1: Atualizar setupEvents()
Adicionar captura de cliques nos botões de features.

### Passo 2: Remover onclick do HTML
Trocar `onclick="..."` por `data-action="..."` ou usar dataset existente.

### Passo 3: Validar
Verificar se todos os 6 botões funcionam.

---

## 📊 Estado Atual

| Item | Status |
|------|--------|
| Módulo carrega | ✅ OK |
| Export global | ✅ window.AIModule e window.aiModule |
| Métodos definidos | ✅ openCourseAnalysis, openLessonGenerator, etc. |
| onclick funciona | ❌ FALHA (timing/escopo) |

---

## 🔧 Próximos Passos

1. **IMEDIATO**: Implementar Solução 1 (addEventListener)
2. **TESTE**: Verificar cada botão individualmente
3. **VALIDAR**: Prompts aparecem no chat input
4. **DOCUMENTAR**: Atualizar AGENTS.md com padrão de eventos

---

**Arquivo**: `AI_MODULE_ONCLICK_DEBUG.md`
