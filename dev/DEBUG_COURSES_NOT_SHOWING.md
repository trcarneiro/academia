# 🐛 DEBUG: Cursos não aparecem na tela
**Data**: 02 de Outubro de 2025  
**Status**: 🔍 INVESTIGANDO

---

## 🐛 PROBLEMA RELATADO

### ❌ Sintomas:
1. **Lista de cursos não aparece** na tela principal
2. **Cronograma do curso não carrega** no editor
3. Console mostra que dados foram carregados mas UI não atualiza

### 📊 Console Logs (Evidências):
```javascript
coursesController.js:127 📚 Courses data received: [{…}]
coursesController.js:130 📚 Courses array: 1 courses
coursesController.js:179 📦 Rendering grid view
coursesController.js:207 ✅ Grid view rendered
// ✅ Dados carregados, renderização chamada, mas NADA aparece
```

```javascript
courseEditorController.js:209 📝 Populating form with course data: {...}
// ✅ Form population chamado mas campos não preenchem
```

---

## 🔍 ANÁLISE TÉCNICA

### 1️⃣ **API Funcionando** ✅
```javascript
api-client.js:209 ✅ GET /api/courses completed successfully
// Resposta: {"success":true,"data":[{...}]}
```

**Conclusão**: Backend OK, dados chegam ao frontend.

### 2️⃣ **Renderização Chamada** ✅
```javascript
coursesController.js:179 📦 Rendering grid view
coursesController.js:207 ✅ Grid view rendered
```

**Conclusão**: Função de render executou sem erros.

### 3️⃣ **Possíveis Causas** 🔍

#### **A) CSS Oculta Elementos**
```css
/* global-premium-colors.css pode estar escondendo */
.coursesGrid { display: none; } /* ? */
.data-card-premium { opacity: 0; } /* ? */
```

#### **B) IDs Incorretos**
```html
<!-- HTML espera: -->
<div id="coursesGrid"></div>

<!-- JS busca: -->
document.getElementById('coursesGrid')
```

#### **C) Z-index Issues**
```css
/* Outros elementos sobrepondo */
.sidebar { z-index: 9999; }
.module-header { position: relative; z-index: 1000; }
```

#### **D) Form Elements não Existem**
```javascript
// Course editor busca:
document.getElementById('courseName') // null?
document.getElementById('courseLevel') // null?
```

---

## ✅ CORREÇÕES IMPLEMENTADAS

### 1️⃣ **Course Editor - Debug Melhorado**

#### ❌ ANTES:
```javascript
if (document.getElementById('courseName')) {
    document.getElementById('courseName').value = course.name || '';
}
```

#### ✅ DEPOIS:
```javascript
const courseNameEl = document.getElementById('courseName');
console.log('📝 courseName element:', courseNameEl);
if (courseNameEl) {
    courseNameEl.value = course.name || '';
    console.log('📝 courseName set to:', course.name);
}
```

**Benefício**: Logs detalhados para identificar se elemento existe.

### 2️⃣ **Populate Objectives** (NOVO)

```javascript
// Populate general objectives
if (course.generalObjectives && course.generalObjectives.length > 0) {
    const generalObjectivesContainer = document.getElementById('generalObjectives');
    if (generalObjectivesContainer) {
        generalObjectivesContainer.innerHTML = '';
        course.generalObjectives.forEach(obj => {
            const div = document.createElement('div');
            div.className = 'objective-item';
            div.innerHTML = `
                <textarea placeholder="Descreva um objetivo geral do curso...">${obj}</textarea>
                <button type="button" class="remove-btn" data-action="removeObjective" data-args='["this","general"]'>🗑️</button>
            `;
            generalObjectivesContainer.appendChild(div);
        });
    }
}

// Populate specific objectives
if (course.specificObjectives && course.specificObjectives.length > 0) {
    const specificObjectivesContainer = document.getElementById('specificObjectives');
    if (specificObjectivesContainer) {
        specificObjectivesContainer.innerHTML = '';
        course.specificObjectives.forEach(obj => {
            const div = document.createElement('div');
            div.className = 'objective-item';
            div.innerHTML = `
                <textarea placeholder="Descreva um objetivo específico do curso...">${obj}</textarea>
                <button type="button" class="remove-btn" data-action="removeObjective" data-args='["this","specific"]'>🗑️</button>
            `;
            specificObjectivesContainer.appendChild(div);
        });
    }
}
```

**Benefício**: Objetivos agora populam na tela.

### 3️⃣ **Grid Container Debug**

#### ❌ ANTES:
```javascript
const gridContainer = document.getElementById('coursesGrid');
if (gridContainer) {
    console.log('📦 Rendering grid view');
```

#### ✅ DEPOIS:
```javascript
const gridContainer = document.getElementById('coursesGrid');
console.log('📦 gridContainer:', gridContainer);
console.log('📦 gridContainer display:', gridContainer?.style?.display);
console.log('📦 gridContainer offsetHeight:', gridContainer?.offsetHeight);

if (gridContainer) {
    console.log('📦 Rendering grid view');
```

**Benefício**: Logs detalhados de visibilidade do container.

---

## 🧪 TESTE DIAGNÓSTICO

### 1️⃣ **Abrir DevTools Console**
```bash
F12 → Console
```

### 2️⃣ **Verificar Elementos**
```javascript
// Copie e cole no console:
console.log('Grid Container:', document.getElementById('coursesGrid'));
console.log('Grid Display:', document.getElementById('coursesGrid')?.style.display);
console.log('Grid Height:', document.getElementById('coursesGrid')?.offsetHeight);
console.log('Grid Children:', document.getElementById('coursesGrid')?.children.length);

// Course Editor:
console.log('CourseName:', document.getElementById('courseName'));
console.log('CourseLevel:', document.getElementById('courseLevel'));
console.log('CourseDescription:', document.getElementById('courseDescription'));
```

### 3️⃣ **Verificar CSS**
```javascript
// Ver computed styles:
const grid = document.getElementById('coursesGrid');
const styles = window.getComputedStyle(grid);
console.log('Display:', styles.display);
console.log('Visibility:', styles.visibility);
console.log('Opacity:', styles.opacity);
console.log('Z-index:', styles.zIndex);
```

### 4️⃣ **Forçar Visibilidade**
```javascript
// Se grid existe mas não aparece:
const grid = document.getElementById('coursesGrid');
if (grid) {
    grid.style.display = 'grid';
    grid.style.visibility = 'visible';
    grid.style.opacity = '1';
    grid.style.zIndex = '1';
    console.log('Grid forçado a aparecer');
}
```

---

## 🎯 PRÓXIMOS PASSOS

### ✅ IMEDIATO (5min):
1. **Recarregar página**: `Ctrl+Shift+R`
2. **Verificar console**: Procurar novos logs:
   - `📦 gridContainer: <div>` (deve aparecer)
   - `📦 gridContainer display: ''` (vazio = default)
   - `📦 gridContainer offsetHeight: 123` (número > 0)
   - `📝 courseName element: <input>` (deve aparecer)

### 🔍 SE GRID CONTAINER NULL:
- **HTML não carregou**: Verificar se `courses.html` existe
- **ID errado**: Procurar ID correto no HTML
- **Módulo não inicializou**: Verificar `courses/index.js`

### 🔍 SE GRID CONTAINER EXISTE MAS HEIGHT = 0:
- **CSS display:none**: Verificar `courses.css` e `global-premium-colors.css`
- **Children vazios**: Verificar se `courses.map()` está gerando HTML
- **Parent oculto**: Verificar `.module-container` visibility

### 🔍 SE ELEMENTS NULL (Course Editor):
- **HTML não carregou**: Verificar se `course-editor.html` existe
- **IDs errados**: Comparar IDs no HTML vs JS
- **Tab inativa**: Verificar se tab "Informações" está ativa

---

## 📁 ARQUIVOS MODIFICADOS

### ✅ courseEditorController.js
- ✅ Logs detalhados em `populateCourseForm()`
- ✅ Populate objectives implementado
- ✅ Fix targetAudience/target mapping
- ✅ Fix duration/durationTotalWeeks mapping

### ✅ coursesController.js
- ✅ Logs detalhados em `renderCourses()`
- ✅ Grid container debug info

---

## 🔧 COMANDOS ÚTEIS

### Inspecionar Elemento:
```bash
# 1. Recarregar
Ctrl+Shift+R

# 2. Abrir DevTools
F12

# 3. Tab "Elements"
Ctrl+Shift+C (inspect mode)

# 4. Procurar por:
#coursesGrid
.data-card-premium
#courseName
```

### Ver CSS Aplicado:
```bash
# 1. Selecionar elemento
Right-click > Inspect

# 2. Ver "Computed" tab
Mostra CSS final aplicado

# 3. Procurar por:
display: none
visibility: hidden
opacity: 0
height: 0
```

---

## ⚠️ HIPÓTESE PRINCIPAL

**CSS `global-premium-colors.css` pode estar interferindo** porque:
1. Foi adicionado **DEPOIS** dos módulos CSS
2. Usa seletores genéricos (`.card`, `.data-card`)
3. Pode ter `display: none` ou `opacity: 0` acidental

**Solução**: Verificar ordem de carregamento no `index.html`:

```html
<!-- ❌ ERRADO (pode causar conflito) -->
<link rel="stylesheet" href="css/global-premium-colors.css">
<link rel="stylesheet" href="css/modules/courses.css">

<!-- ✅ CORRETO (módulos têm prioridade) -->
<link rel="stylesheet" href="css/modules/courses.css">
<link rel="stylesheet" href="css/global-premium-colors.css">
```

---

## 📊 CHECKLIST DE DIAGNÓSTICO

- [ ] Grid container existe? (`document.getElementById('coursesGrid')`)
- [ ] Grid tem filhos? (`.children.length > 0`)
- [ ] Grid tem altura? (`.offsetHeight > 0`)
- [ ] Grid está visível? (`display !== 'none'`)
- [ ] Cards foram renderizados? (ver HTML no DevTools)
- [ ] CSS não está ocultando? (`opacity`, `visibility`, `z-index`)
- [ ] Course editor elements existem? (`#courseName`, `#courseLevel`)
- [ ] Tab "Informações" está ativa? (`.tab-content.active`)
- [ ] Console mostra logs de população? (`📝 courseName set to:`)

---

## 🎉 RESULTADO ESPERADO

Após recarregar, você deve ver:

### Console Logs (NOVOS):
```javascript
📦 gridContainer: <div id="coursesGrid" class="courses-grid">...</div>
📦 gridContainer display: 
📦 gridContainer offsetHeight: 456
📦 Rendering grid view
✅ Grid view rendered

📝 courseName element: <input type="text" id="courseName" ...>
📝 courseName set to: Krav Maga - Faixa Branca
📝 courseLevel element: <select id="courseLevel" ...>
📝 courseLevel set to: BEGINNER
✅ Form populated successfully
```

### Tela:
- ✅ **Lista de cursos**: 1 card visível com "Krav Maga - Faixa Branca"
- ✅ **Course editor**: Campos preenchidos com dados do curso
- ✅ **Objetivos**: Lista de 4 objetivos gerais visível
- ✅ **Cronograma**: Tab "Cronograma" mostra estrutura

---

**Aguardando logs do console para diagnóstico final!** 🔍

Recarregue com `Ctrl+Shift+R` e me envie os logs que aparecem para:
1. `📦 gridContainer:`
2. `📦 gridContainer display:`
3. `📦 gridContainer offsetHeight:`
4. `📝 courseName element:`
5. `📝 courseName set to:`

Se nenhum log aparecer, significa que o JS não está carregando corretamente! 🚨
