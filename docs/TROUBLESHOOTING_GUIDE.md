# 🔧 Guia de Troubleshooting - Módulos Isolados

**Soluções Rápidas para Problemas Comuns**  
**Data:** 19/07/2025

## 🚨 Problemas Mais Comuns

### 1. 🔴 **Módulo Não Carrega**

**Sintomas:**
- Console: "loadStudents is not a function"
- Página em branco ou loading infinito
- JavaScript errors

**Diagnóstico:**
```javascript
// Verificar se módulo foi carregado
console.log(typeof window.loadStudents); // deve ser 'function'

// Verificar script no HTML
document.querySelector('script[src*="students.js"]'); // deve existir

// Verificar erros no console
console.error; // verificar se há erros de sintaxe
```

**Soluções:**
```html
<!-- ✅ Verificar ordem dos scripts -->
<script src="/js/utils.js"></script>  <!-- Dependências primeiro -->
<script src="/js/modules/students.js"></script>  <!-- Módulo depois -->

<!-- ✅ Verificar paths corretos -->
<script src="/js/modules/students.js"></script>  <!-- Correto -->
<script src="js/modules/students.js"></script>   <!-- ❌ Faltando / -->
```

---

### 2. 🎨 **CSS Não Aplica**

**Sintomas:**
- Estilos não aparecem
- Layout quebrado
- Conflitos visuais

**Diagnóstico:**
```css
/* Verificar prefixo isolado */
.students-isolated { } /* ✅ Correto */
.student-card { }      /* ❌ Sem prefixo - conflito */

/* Verificar especificidade */
.students-isolated .btn { }           /* ✅ Específico */
.btn { }                             /* ❌ Muito genérico */
```

**Soluções:**
```css
/* ✅ SEMPRE usar prefixo isolado */
.meu-modulo-isolated .header {
    background: rgba(255, 255, 255, 0.05);
}

.meu-modulo-isolated .btn {
    padding: 0.5rem 1rem;
}

/* ✅ Verificar importação no HTML */
<link rel="stylesheet" href="/css/modules/meu-modulo.css">
```

---

### 3. 📡 **API Não Responde**

**Sintomas:**
- Dados não carregam
- Loading infinito
- Error states

**Diagnóstico:**
```javascript
// Verificar endpoint
fetch('/api/students')
    .then(response => console.log('Status:', response.status))
    .catch(error => console.log('Erro:', error));

// Verificar servidor
// Status 404: Endpoint não existe
// Status 500: Erro no servidor  
// CORS error: Problema de domínio
```

**Soluções:**
```javascript
// ✅ SEMPRE implementar fallback
async function fetchStudentsData() {
    try {
        const response = await fetch('/api/students');
        if (response.ok) {
            const data = await response.json();
            renderStudents(data.data);
        } else {
            console.error('API failed:', response.status);
            showErrorState();
        }
    } catch (error) {
        console.error('Network error:', error);
        
        // ✅ Fallback para desenvolvimento
        const fallbackData = [
            { id: 1, name: 'João Silva', email: 'joao@email.com' }
        ];
        renderStudents(fallbackData);
    }
}
```

---

### 4. 🔗 **Navegação Quebrada**

**Sintomas:**
- Links não funcionam
- Botão "Voltar" não funciona
- 404 errors

**Soluções:**
```html
<!-- ✅ Caminhos absolutos -->
<a href="/views/students.html">Alunos</a>          <!-- Correto -->
<a href="views/students.html">Alunos</a>           <!-- ❌ Relativo -->

<!-- ✅ Botão voltar padrão -->
<button onclick="window.history.back()">← Voltar</button>

<!-- ✅ Navegação programática -->
<script>
function navigateToStudents() {
    window.location.href = '/views/students.html';
}
</script>
```

---

### 5. 📱 **Responsive Quebrado**

**Sintomas:**
- Layout não adapta no mobile
- Elementos sobrepostos
- Scroll horizontal

**Soluções:**
```css
/* ✅ Breakpoints padrão */
@media (max-width: 768px) {
    .meu-modulo-isolated {
        padding: 0.5rem;
    }
    
    .meu-modulo-isolated .grid {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 480px) {
    .meu-modulo-isolated .header {
        flex-direction: column;
        gap: 1rem;
    }
}

/* ✅ Container responsivo */
.meu-modulo-isolated {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
}
```

---

## 🔍 Ferramentas de Debug

### 📊 **Console Commands**

```javascript
// 1. Listar módulos carregados
Object.keys(window).filter(key => key.startsWith('load'));

// 2. Verificar dados de módulo específico
window.studentsData || 'Não carregado';

// 3. Testar função de módulo
window.loadStudents();

// 4. Verificar DOM do módulo
document.querySelector('.students-isolated');

// 5. Verificar CSS aplicado
getComputedStyle(document.querySelector('.students-isolated'));
```

### 🕵️ **Network Tab**

```javascript
// Verificar requests
// F12 → Network → Reload
// Procurar por:
// - students.js (200 OK)
// - students.css (200 OK)
// - /api/students (200 OK ou erro)
```

### 📝 **Element Inspector**

```html
<!-- Verificar classes aplicadas -->
<div class="students-isolated">  <!-- ✅ Classe correta -->
    <div class="students-header"> <!-- ✅ Filhos com prefixo -->
```

---

## ⚡ Soluções Rápidas

### 🔄 **Reset Completo do Módulo**

```javascript
// 1. Limpar dados
window.studentsData = [];

// 2. Limpar DOM
const container = document.querySelector('.students-isolated');
if (container) container.innerHTML = '';

// 3. Recarregar módulo
window.loadStudents();
```

### 🧹 **Limpar Cache**

```javascript
// Forçar reload sem cache
location.reload(true);

// Ou via code
window.location.href = window.location.href + '?t=' + Date.now();
```

### 🔧 **Reinstalar Módulo**

```bash
# 1. Verificar arquivos existem
ls /public/js/modules/students.js
ls /public/css/modules/students.css
ls /public/views/students.html

# 2. Verificar conteúdo
head -5 /public/js/modules/students.js  # Deve mostrar IIFE

# 3. Verificar no HTML
grep -n "students.js" /public/index.html
```

---

## 🚨 Emergency Checklist

### ✅ **Verificações Obrigatórias**

1. **Arquivos existem:**
   - [ ] `/public/js/modules/[modulo].js`
   - [ ] `/public/css/modules/[modulo].css`  
   - [ ] `/public/views/[modulo].html`

2. **HTML correto:**
   - [ ] Script importado: `<script src="/js/modules/[modulo].js"></script>`
   - [ ] CSS importado: `<link rel="stylesheet" href="/css/modules/[modulo].css">`
   - [ ] Container: `<div class="[modulo]-isolated">`

3. **JavaScript funcional:**
   - [ ] IIFE pattern: `(function() { ... })()`
   - [ ] DOMContentLoaded: `document.addEventListener('DOMContentLoaded', ...)`
   - [ ] Export functions: `window.loadModulo = loadModulo`
   - [ ] Console log: `console.log('✅ Modulo loaded')`

4. **CSS isolado:**
   - [ ] Prefixo único: `.modulo-isolated`
   - [ ] Todos filhos com prefixo
   - [ ] Responsive design

5. **API handling:**
   - [ ] Try/catch implementado
   - [ ] Fallback data existe
   - [ ] Error states definidos

---

## 📞 Quando Buscar Ajuda

### 🔴 **Problemas Críticos:**
- Módulo quebra página inteira
- Conflitos CSS globais
- Memory leaks
- Performance severa

### 🟡 **Problemas Médios:**
- Dados não carregam (com fallback funcionando)
- Layout específico quebrado
- Funcionalidade secundária não funciona

### 🟢 **Problemas Menores:**
- Estilo específico não aplica
- Loading state não aparece
- Console warnings

---

## 📋 Template de Bug Report

```markdown
## 🐛 Bug Report

**Módulo:** [students/courses/financial/etc]

**Problema:** 
Descreva o que deveria acontecer vs o que acontece

**Passos para reproduzir:**
1. Abrir [URL]
2. Clicar em [botão]
3. Observar [problema]

**Console Errors:**
```
[Cole os erros do console aqui]
```

**Environment:**
- Browser: [Chrome/Firefox/Safari]
- Device: [Desktop/Mobile/Tablet]
- Screen: [1920x1080/etc]

**Files verificados:**
- [ ] /public/js/modules/[modulo].js existe
- [ ] /public/css/modules/[modulo].css existe  
- [ ] Console mostra "✅ [Modulo] loaded"
- [ ] Container .[modulo]-isolated existe no DOM
```

---

**🆘 Em caso de emergência:** Use os fallback data e documente o problema para correção posterior.

**📅 Última atualização:** 19/07/2025