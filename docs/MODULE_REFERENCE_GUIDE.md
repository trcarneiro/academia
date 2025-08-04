# 📖 Guia de Referência Rápida - Módulos Isolados

**Guia Prático para Desenvolvedores**  
**Data:** 19/07/2025

## 🚀 Início Rápido

### 📂 **Estrutura de Pastas**
```
/public/js/modules/     → Módulos JavaScript (18 arquivos)
/public/css/modules/    → CSS Isolado (17 arquivos)  
/public/views/          → Views Full-Screen (16+ arquivos)
```

### 🔍 **Encontrar um Módulo**
| Funcionalidade | Arquivo JS | CSS | View |
|----------------|------------|-----|------|
| **Alunos** | `students.js` | `students.css` | `students.html` |
| **Planos** | `plans.js` | `plans-styles.css` | `plans.html` |
| **Turmas** | `classes.js` | `classes.css` | `classes.html` |
| **Cursos** | `courses.js` | `courses.css` | `courses.html` |
| **Financeiro** | `financial.js` | `financial.css` | - |
| **Instrutores** | `instructors.js` | `instructors.css` | `instructors.html` |
| **Unidades** | `units.js` | `units.css` | `units.html` |
| **Tatames** | `mats.js` | `mats.css` | `mats.html` |
| **Desafios** | `challenges.js` | `challenges.css` | `challenges.html` |
| **Frequência** | `attendance.js` | `attendance.css` | `attendance.html` |

---

## ⚡ Comandos Rápidos

### 🔧 **Criar Novo Módulo**
```bash
# 1. JavaScript
touch /public/js/modules/meu-modulo.js

# 2. CSS  
touch /public/css/modules/meu-modulo.css

# 3. View
touch /public/views/meu-modulo.html
```

### 🔍 **Encontrar Função**
```bash
# Buscar função específica
grep -r "function loadStudents" /public/js/modules/

# Buscar por módulo
grep -r "Students Module" /public/js/modules/

# Buscar CSS específico
grep -r ".students-isolated" /public/css/modules/
```

### 📊 **Verificar Módulos**
```bash
# Contar módulos JS
ls /public/js/modules/*.js | wc -l

# Contar CSS
ls /public/css/modules/*.css | wc -l

# Contar Views  
ls /public/views/*.html | wc -l
```

---

## 🎯 Templates Rápidos

### 📄 **Template JavaScript**
```javascript
(function() {
    'use strict';
    
    // Estado do módulo
    let dadosModulo = [];
    let filtroAtual = 'all';
    
    // Inicializar no carregamento
    document.addEventListener('DOMContentLoaded', function() {
        inicializarModulo();
    });
    
    function inicializarModulo() {
        console.log('🎯 Inicializando Módulo...');
        
        try {
            configurarEventListeners();
            carregarDados();
            exportarFuncoesGlobais();
        } catch (error) {
            console.error('❌ Erro:', error);
        }
    }
    
    function exportarFuncoesGlobais() {
        window.carregarModulo = carregarModulo;
        window.renderizarModulo = renderizarModulo;
    }
    
    console.log('✅ Módulo carregado');
})();
```

### 🎨 **Template CSS**
```css
/* Módulo Isolado */
.meu-modulo-isolated {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
}

.meu-modulo-isolated .header {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 2rem;
    margin-bottom: 2rem;
}

.meu-modulo-isolated .btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
}

/* Responsivo */
@media (max-width: 768px) {
    .meu-modulo-isolated {
        padding: 0.5rem;
    }
}
```

### 📱 **Template HTML**
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>🎯 Meu Módulo - Krav Academy</title>
    <link rel="stylesheet" href="/css/dashboard.css">
    <link rel="stylesheet" href="/css/modules/meu-modulo.css">
</head>
<body>
    <div class="meu-modulo-isolated">
        <div id="meu-modulo-content">
            <!-- Loading -->
            <div class="loading-skeleton" style="height: 120px; margin: 2rem 0;"></div>
        </div>
    </div>

    <script src="/js/modules/meu-modulo.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            if (typeof carregarModulo === 'function') {
                carregarModulo();
            }
        });
    </script>
</body>
</html>
```

---

## 🔧 Funções Principais por Módulo

### 👥 **Students Module**
```javascript
// Principais funções exportadas
window.loadStudents()           // Carregar lista
window.addStudent()             // Adicionar novo
window.editStudent(id)          // Editar existente  
window.viewStudent(id)          // Visualizar detalhes
window.exportStudents()         // Exportar CSV
```

### 📚 **Courses Module**  
```javascript
window.loadCourses()            // Carregar cursos
window.createCourse()           // Criar novo
window.editCourse(id)           // Editar curso
window.viewCourse(id)           // Ver detalhes
window.manageLessons(id)        // Gerenciar aulas
```

### 💰 **Financial Module**
```javascript
window.loadFinancial()          // Carregar dados
window.switchFinancialTab(tab)  // Trocar aba
window.addRevenue()             // Nova receita
window.addExpense()             // Nova despesa
window.exportFinancial()        // Exportar relatório
```

### 🥋 **Instructors Module**
```javascript
window.loadInstructors()        // Carregar lista
window.addInstructor()          // Adicionar novo
window.viewInstructor(id)       // Ver perfil
window.manageClasses(id)        // Gerenciar aulas
window.toggleStatus(id)         // Ativar/Pausar
```

---

## 🚨 Regras Importantes

### ✅ **SEMPRE FAZER:**
- Usar prefixo CSS `.modulo-isolated`
- Implementar fallback data
- Exportar funções para window
- Seguir padrão IIFE
- Tratar erros com try/catch
- Implementar loading states

### ❌ **NUNCA FAZER:**
- Modificar arquivos core
- Criar modais/popups  
- Hardcode de dados
- CSS sem prefixo isolado
- Funções globais sem exportação
- Dependências entre módulos

### 🔄 **APIs Padrão:**
```javascript
// Buscar dados
fetch('/api/estudantes')
fetch('/api/cursos') 
fetch('/api/planos')
fetch('/api/instrutores')
fetch('/api/financeiro')

// Padrão de resposta
{
    success: true,
    data: [...],
    message: "Success"
}
```

---

## 🎨 Classes CSS Padronizadas

### 📋 **Botões**
```css
.btn                    /* Botão base */
.btn-primary           /* Azul principal */
.btn-secondary         /* Cinza secundário */
.btn-success           /* Verde sucesso */
.btn-warning           /* Laranja aviso */
.btn-danger            /* Vermelho perigo */
.btn-sm                /* Tamanho pequeno */
```

### 📊 **Cards e Containers**
```css
.stat-card             /* Card de estatística */
.module-header         /* Cabeçalho do módulo */
.module-filters        /* Área de filtros */
.module-grid           /* Grid de itens */
.module-empty-state    /* Estado vazio */
.module-error-state    /* Estado de erro */
```

### 🎯 **Estados**
```css
.active                /* Ativo */
.inactive              /* Inativo */
.pending               /* Pendente */
.completed             /* Completo */
.loading-skeleton      /* Loading animado */
```

---

## 📱 Navegação Entre Módulos

### 🔗 **Links Principais**
```html
<!-- Dashboard -->
<a href="/">Dashboard</a>

<!-- Módulos -->
<a href="/views/students.html">Alunos</a>
<a href="/views/courses.html">Cursos</a>
<a href="/views/plans.html">Planos</a>
<a href="/views/instructors.html">Instrutores</a>
<a href="/views/financial-responsibles.html">Responsáveis</a>

<!-- Editores -->
<a href="/views/student-editor.html">Editor de Aluno</a>
<a href="/views/course-editor.html">Editor de Curso</a>
```

### ↩️ **Botão Voltar Padrão**
```html
<button class="btn btn-secondary" onclick="window.history.back()">
    ← Voltar
</button>
```

---

## 🔍 Debug e Troubleshooting

### 🐛 **Problemas Comuns**

1. **Módulo não carrega:**
   ```javascript
   // Verificar se está exportado
   console.log(window.loadStudents); // deve retornar function
   ```

2. **CSS não aplica:**
   ```css
   /* Verificar prefixo isolado */
   .students-isolated .btn { /* ✅ Correto */ }
   .btn { /* ❌ Incorreto - sem prefixo */ }
   ```

3. **API não funciona:**
   ```javascript
   // Verificar fallback
   catch (error) {
       renderStudents(fallbackData); // ✅ Sempre ter fallback
   }
   ```

### 📊 **Console Debug**
```javascript
// Listar módulos carregados
console.log('Módulos:', Object.keys(window).filter(k => k.startsWith('load')));

// Verificar dados
console.log('Dados:', window.studentsData);

// Testar função
window.loadStudents();
```

---

**📅 Criado:** 19/07/2025  
**🔄 Atualizado:** Sempre que necessário  
**📋 Use este guia** para desenvolvimento rápido e consistente!