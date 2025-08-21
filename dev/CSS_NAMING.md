# Convenções CSS - BEM + Isolamento

## 🎯 Padrão Obrigatório

### 1. Prefixo de Isolamento
```css
/* SEMPRE usar prefixo .module-isolated-* */
.module-isolated-students { /* Container principal */ }
.module-isolated-students-list { /* Lista de estudantes */ }
.module-isolated-students-editor { /* Editor de estudante */ }
```

### 2. BEM (Block Element Modifier)
```css
/* Block */
.card { }

/* Element */
.card__header { }
.card__body { }
.card__footer { }

/* Modifier */
.card--highlighted { }
.card__header--collapsed { }
```

### 3. Combinação BEM + Isolamento
```css
/* Estrutura: .module-isolated-[module]__[block]__[element]--[modifier] */
.module-isolated-students__card { }
.module-isolated-students__card__header { }
.module-isolated-students__card__header--active { }
.module-isolated-students__list__item { }
.module-isolated-students__list__item--selected { }
```

## 📁 Estrutura de Arquivos CSS

```
public/css/modules/
├── students/
│   ├── students.css           # Lista principal
│   ├── students-editor.css    # Editor full-screen
│   └── students-components.css # Componentes reutilizáveis
├── classes/
│   ├── classes.css
│   └── classes-editor.css
├── activities/
│   ├── activities.css
│   └── activities-editor.css
└── shared/
    ├── forms.css              # Formulários globais
    ├── tables.css             # Tabelas globais
    └── states.css             # Loading/Empty/Error states
```

## 🎨 Template CSS por Módulo

```css
/* ==============================================
   STUDENTS MODULE - PREMIUM STYLES
   ============================================== */

/* Base Module Container */
[data-module="students"] {
    --module-primary: var(--primary-color);
    --module-accent: var(--secondary-color);
}

/* ==============================================
   HEADER PREMIUM
   ============================================== */
.module-isolated-students__header {
    @extend .module-header-premium;
}

.module-isolated-students__breadcrumb {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    color: var(--primary-color);
    font-size: var(--font-size-sm);
    margin-bottom: var(--spacing-md);
}

.module-isolated-students__breadcrumb__item {
    color: var(--color-text-muted);
    text-decoration: none;
    transition: var(--transition-base);
}

.module-isolated-students__breadcrumb__item:hover {
    color: var(--primary-color);
}

.module-isolated-students__breadcrumb__separator {
    color: var(--color-border);
    margin: 0 var(--spacing-xs);
}

/* ==============================================
   STATS CARDS
   ============================================== */
.module-isolated-students__stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
}

.module-isolated-students__stat-card {
    @extend .stat-card-enhanced;
}

.module-isolated-students__stat-card--total {
    --stat-gradient: var(--gradient-primary);
}

.module-isolated-students__stat-card--active {
    --stat-gradient: linear-gradient(135deg, #10B981 0%, #34D399 100%);
}

.module-isolated-students__stat-card--new {
    --stat-gradient: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
}

.module-isolated-students__stat-card--overdue {
    --stat-gradient: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%);
}

/* ==============================================
   FILTERS PREMIUM
   ============================================== */
.module-isolated-students__filters {
    @extend .module-filters-premium;
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: var(--spacing-md);
    align-items: center;
}

.module-isolated-students__search {
    @extend .search-input-premium;
}

.module-isolated-students__filter-buttons {
    display: flex;
    gap: var(--spacing-sm);
}

.module-isolated-students__filter-button {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: var(--font-size-sm);
    cursor: pointer;
    transition: var(--transition-base);
}

.module-isolated-students__filter-button:hover {
    border-color: var(--primary-color);
    background: rgba(102, 126, 234, 0.05);
}

.module-isolated-students__filter-button--active {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
}

/* ==============================================
   DATA LIST
   ============================================== */
.module-isolated-students__list {
    background: var(--color-surface);
    border-radius: var(--radius-md);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--color-border);
}

.module-isolated-students__list__item {
    padding: var(--spacing-md);
    border-bottom: 1px solid var(--color-border);
    transition: var(--transition-base);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
}

.module-isolated-students__list__item:last-child {
    border-bottom: none;
}

.module-isolated-students__list__item:hover {
    background: var(--color-background);
}

.module-isolated-students__list__item--selected {
    background: rgba(102, 126, 234, 0.1);
    border-left: 4px solid var(--primary-color);
}

.module-isolated-students__avatar {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-lg);
    overflow: hidden;
    flex-shrink: 0;
}

.module-isolated-students__avatar__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.module-isolated-students__info {
    flex: 1;
}

.module-isolated-students__name {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text);
    margin: 0 0 var(--spacing-xs) 0;
}

.module-isolated-students__email {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin: 0;
}

.module-isolated-students__status {
    display: inline-block;
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    text-transform: uppercase;
    letter-spacing: 0.025em;
}

.module-isolated-students__status--active {
    background: rgba(16, 185, 129, 0.1);
    color: #059669;
}

.module-isolated-students__status--inactive {
    background: rgba(239, 68, 68, 0.1);
    color: #DC2626;
}

.module-isolated-students__actions {
    display: flex;
    gap: var(--spacing-sm);
}

/* ==============================================
   EMPTY STATE
   ============================================== */
.module-isolated-students__empty-state {
    text-align: center;
    padding: var(--spacing-3xl) var(--spacing-lg);
    color: var(--color-text-muted);
}

.module-isolated-students__empty-state__icon {
    font-size: 4rem;
    margin-bottom: var(--spacing-lg);
    opacity: 0.5;
}

.module-isolated-students__empty-state__title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text);
    margin-bottom: var(--spacing-md);
}

.module-isolated-students__empty-state__description {
    margin-bottom: var(--spacing-xl);
}

/* ==============================================
   ERROR STATE
   ============================================== */
.module-isolated-students__error-state {
    text-align: center;
    padding: var(--spacing-3xl) var(--spacing-lg);
    color: var(--color-error);
}

.module-isolated-students__error-state__icon {
    font-size: 4rem;
    margin-bottom: var(--spacing-lg);
    opacity: 0.7;
}

.module-isolated-students__error-state__title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    margin-bottom: var(--spacing-md);
}

.module-isolated-students__error-state__description {
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-xl);
}

/* ==============================================
   RESPONSIVE GRID
   ============================================== */
@media (max-width: 768px) {
    .module-isolated-students__filters {
        grid-template-columns: 1fr;
        gap: var(--spacing-md);
    }
    
    .module-isolated-students__stats {
        grid-template-columns: 1fr;
    }
    
    .module-isolated-students__list__item {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--spacing-sm);
    }
    
    .module-isolated-students__actions {
        width: 100%;
        justify-content: flex-end;
    }
}

@media (min-width: 768px) {
    .module-isolated-students__stats {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (min-width: 1024px) {
    .module-isolated-students__stats {
        grid-template-columns: repeat(4, 1fr);
    }
}
```

## ✅ Checklist CSS

### Antes de commit:
- [ ] Prefixo `.module-isolated-*` aplicado em todas as classes
- [ ] BEM usado para elementos aninhados (`__element`, `--modifier`)
- [ ] Tokens CSS utilizados (nunca valores hardcoded)
- [ ] Classes premium aplicadas (`.module-header-premium`, `.stat-card-enhanced`)
- [ ] Responsividade testada nos 3 breakpoints (768px/1024px/1440px)
- [ ] Hover states implementados com transições
- [ ] Estados empty/error/loading estilizados
- [ ] Dark mode suportado com CSS variables

### Exemplos PROIBIDOS:
```css
/* ❌ Sem isolamento */
.students-card { }
.card { }

/* ❌ Valores hardcoded */
.card {
    color: #667eea;  /* Use var(--primary-color) */
    padding: 16px;   /* Use var(--spacing-md) */
    margin: 20px;    /* Use var(--spacing-lg) */
}

/* ❌ Nomes genéricos */
.list { }
.item { }
.button { }

/* ❌ Classes antigas */
.module-header { /* Use .module-header-premium */ }
.stat-card { /* Use .stat-card-enhanced */ }
```

### Exemplos CORRETOS:
```css
/* ✅ Com isolamento + BEM + tokens */
.module-isolated-students__card {
    color: var(--primary-color);
    padding: var(--spacing-md);
    background: var(--gradient-primary);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
    transition: var(--transition-base);
}

.module-isolated-students__card__header {
    padding: var(--spacing-md);
    border-bottom: 1px solid var(--color-border);
}

.module-isolated-students__card__header--active {
    background: rgba(102, 126, 234, 0.1);
    border-color: var(--primary-color);
}

/* ✅ Classes premium */
.module-isolated-students__header {
    @extend .module-header-premium;
}

.module-isolated-students__stat {
    @extend .stat-card-enhanced;
}
```

## 🎯 Convenção de Nomenclatura

### Por Módulo:
- **students**: `.module-isolated-students__*`
- **classes**: `.module-isolated-classes__*`
- **activities**: `.module-isolated-activities__*`
- **courses**: `.module-isolated-courses__*`
- **instructors**: `.module-isolated-instructors__*`
- **payments**: `.module-isolated-payments__*`

### Padrões Comuns:
- Container: `__container`
- Header: `__header` (sempre premium)
- Stats: `__stats`, `__stat-card` (sempre enhanced)
- Filters: `__filters` (sempre premium)
- List: `__list`, `__list__item`
- Cards: `__card`, `__card__header`, `__card__content`
- Actions: `__actions`, `__action-button`
- States: `__empty-state`, `__error-state`, `__loading-state`

---

**Regra de Ouro**: Isolamento + BEM + Tokens + Premium Classes = CSS sustentável
