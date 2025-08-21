# Design System Unificado

## 🎨 Tokens CSS (Obrigatórios)

```css
:root {
  /* Cores Primárias */
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --gradient-secondary: linear-gradient(135deg, #764ba2 0%, #f093fb 100%);
  
  /* Cores Semânticas */
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-info: #3B82F6;
  
  /* Superfícies */
  --color-surface: #FFFFFF;
  --color-background: #F8FAFC;
  --color-border: #E2E8F0;
  --color-text: #1E293B;
  --color-text-muted: #64748B;
  
  /* Tipografia */
  --font-family-primary: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  
  /* Espaçamentos */
  --spacing-xs: 0.25rem;    /* 4px */
  --spacing-sm: 0.5rem;     /* 8px */
  --spacing-md: 1rem;       /* 16px */
  --spacing-lg: 1.5rem;     /* 24px */
  --spacing-xl: 2rem;       /* 32px */
  --spacing-2xl: 3rem;      /* 48px */
  --spacing-3xl: 4rem;      /* 64px */
  
  /* Sombras */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  
  /* Raios de Borda */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  --radius-2xl: 1rem;
  
  /* Transições */
  --transition-base: 150ms ease-in-out;
  --transition-bounce: 200ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
  --transition-smooth: 300ms cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Z-Index Scale */
  --z-dropdown: 1000;
  --z-sticky: 1020;
  --z-fixed: 1030;
  --z-modal-backdrop: 1040;
  --z-modal: 1050;
  --z-popover: 1060;
  --z-tooltip: 1070;
  --z-toast: 1080;
}
```

## 🎯 Classes Premium Obrigatórias

### Header Premium
```css
.module-header-premium {
  background: linear-gradient(135deg, var(--color-surface) 0%, var(--color-background) 100%);
  border-bottom: 1px solid var(--color-border);
  padding: var(--spacing-lg);
  position: relative;
  overflow: hidden;
}

.module-header-premium::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--gradient-primary);
}

.module-header-premium__breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--primary-color);
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-md);
}

.module-header-premium__title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text);
  margin: 0;
}

.module-header-premium__subtitle {
  color: var(--color-text-muted);
  font-size: var(--font-size-base);
  margin-top: var(--spacing-xs);
}
```

### Stats Cards Premium
```css
.stat-card-enhanced {
  background: linear-gradient(135deg, var(--color-surface) 0%, var(--color-background) 100%);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  transition: var(--transition-bounce);
  position: relative;
  overflow: hidden;
}

.stat-card-enhanced:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-card-enhanced::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: var(--stat-gradient, var(--gradient-primary));
}

.stat-card-enhanced.primary { --stat-gradient: var(--gradient-primary); }
.stat-card-enhanced.secondary { --stat-gradient: var(--gradient-secondary); }
.stat-card-enhanced.success { --stat-gradient: linear-gradient(135deg, #10B981 0%, #34D399 100%); }
.stat-card-enhanced.warning { --stat-gradient: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%); }
.stat-card-enhanced.error { --stat-gradient: linear-gradient(135deg, #EF4444 0%, #F87171 100%); }

.stat-card-enhanced__icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  background: var(--stat-gradient, var(--gradient-primary));
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--spacing-md);
}

.stat-card-enhanced__value {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text);
  margin: 0 0 var(--spacing-xs) 0;
}

.stat-card-enhanced__label {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin: 0;
}
```

### Data Cards Premium
```css
.data-card-premium {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  box-shadow: var(--shadow-sm);
  transition: var(--transition-base);
}

.data-card-premium:hover {
  border-color: var(--primary-color);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.data-card-premium__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
  margin-bottom: var(--spacing-md);
}

.data-card-premium__content {
  flex: 1;
}

.data-card-premium__actions {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
}
```

### Filters Premium
```css
.module-filters-premium {
  background: linear-gradient(135deg, var(--color-background) 0%, var(--color-border) 100%);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.search-input-premium {
  width: 100%;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  font-size: var(--font-size-base);
  transition: var(--transition-base);
}

.search-input-premium:focus {
  border-color: var(--primary-color);
  outline: none;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}
```

## 📱 Breakpoints Responsivos

```css
/* Mobile First */
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-md);
}

.grid-responsive {
  display: grid;
  gap: var(--spacing-md);
  grid-template-columns: 1fr;
}

/* Tablet */
@media (min-width: 768px) {
  .grid-responsive {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .container {
    padding: 0 var(--spacing-lg);
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .grid-responsive {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Large Desktop */
@media (min-width: 1440px) {
  .grid-responsive {
    grid-template-columns: repeat(4, 1fr);
  }
  
  .container {
    padding: 0 var(--spacing-xl);
  }
}
```

## 🌙 Dark Mode Support

```css
[data-theme="dark"] {
  --color-surface: #1E293B;
  --color-background: #0F172A;
  --color-border: #334155;
  --color-text: #F8FAFC;
  --color-text-muted: #94A3B8;
  --primary-color: #818CF8;
  --secondary-color: #A78BFA;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-surface: #1E293B;
    --color-background: #0F172A;
    --color-border: #334155;
    --color-text: #F8FAFC;
    --color-text-muted: #94A3B8;
  }
}
```

## ⚡ Uso Obrigatório

### Regras de Aplicação:
- **SEMPRE** usar tokens CSS ao invés de valores hardcoded
- **NUNCA** criar cores/espaçamentos fora do sistema
- **APLICAR** classes premium em todos os módulos novos
- **TESTAR** responsividade nos 3 breakpoints principais
- **VALIDAR** acessibilidade e contraste

### Exemplos PROIBIDOS:
```css
/* ❌ Valores hardcoded */
.card {
    color: #667eea;
    padding: 16px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* ❌ Classes genéricas */
.header { }
.card { }
.button { }
```

### Exemplos CORRETOS:
```css
/* ✅ Com tokens e classes premium */
.module-isolated-students__card {
    color: var(--primary-color);
    padding: var(--spacing-md);
    box-shadow: var(--shadow-sm);
}

.module-header-premium {
    background: var(--gradient-primary);
    padding: var(--spacing-lg);
}
```

---

**Regra de Ouro**: Todo estilo deve usar tokens CSS e classes premium do design system
