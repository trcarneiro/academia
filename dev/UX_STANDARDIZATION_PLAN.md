# Plano de Padronização de UX/UI (UX Standardization Plan)

**Data**: 10/12/2025
**Status**: Planejamento
**Objetivo**: Unificar a experiência do usuário em todos os módulos, eliminando inconsistências visuais e garantindo o padrão "Premium".

---

## 1. O Padrão Premium (The Premium Standard)

O padrão visual é definido centralmente em `public/css/design-system/tokens.css`. NENHUMA cor ou estilo deve ser hardcoded nos módulos.

### 1.1 Paleta de Cores Obrigatória
- **Primary**: `#667eea` (Azul Confiança)
- **Secondary**: `#764ba2` (Roxo Premium)
- **Gradient**: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- **Background**: `#F8FAFC` (Slate 50)
- **Surface**: `#FFFFFF` (White)

### 1.2 Componentes Chave (CSS Classes)
Todos os módulos DEVEM usar estas classes para garantir consistência:

| Componente | Classe CSS | Descrição |
|------------|------------|-----------|
| **Header** | `.module-header-premium` | Cabeçalho com gradiente sutil, título e breadcrumbs. |
| **Card de Dados** | `.data-card-premium` | Container principal de conteúdo (tabelas, listas). |
| **Card de Stats** | `.stat-card-enhanced` | Cards de métricas no topo (Total, Ativos, etc.). |
| **Filtros** | `.module-filters-premium` | Barra de busca e filtros. |
| **Botão Primário** | `.btn-premium-primary` | Ação principal (Novo, Salvar). |
| **Tabela** | `.premium-table` | Tabela com hover, bordas sutis e status badges. |

### 1.3 Estrutura de Layout (Full-Screen)
```html
<div class="module-container">
    <!-- 1. Header -->
    <div class="module-header-premium">
        <div class="header-content">
            <h1>Título do Módulo</h1>
            <nav class="breadcrumb">Home > Módulo</nav>
        </div>
        <div class="header-actions">
            <button class="btn-premium-primary">Novo Item</button>
        </div>
    </div>

    <!-- 2. Stats (Opcional) -->
    <div class="stats-grid">
        <div class="stat-card-enhanced">...</div>
    </div>

    <!-- 3. Filtros -->
    <div class="module-filters-premium">...</div>

    <!-- 4. Conteúdo -->
    <div class="data-card-premium">
        <!-- Tabela ou Grid -->
    </div>
</div>
```

---

## 2. Diagnóstico Atual (Current State)

### ✅ Módulos Referência (Gold Standard)
Estes módulos seguem 100% o padrão e devem ser usados como modelo (Copy/Paste).
1. **Activities** (`public/js/modules/activities/`): **GOLD STANDARD**. Melhor exemplo de arquitetura MVC e UI Premium.
2. **Instructors** (`public/js/modules/instructors/index.js`): Exemplo de Single-File (Legacy, precisa de atualização para remover CSS customizado).

### ⚠️ Módulos Inconsistentes (Need Refactoring)
1. **Courses (Cursos)**:
   - **Problema**: Visual "terrível", mistura de CSS antigo e novo, estrutura de controllers complexa sem necessidade.
   - **Ação**: Refatoração completa para Single-File Module (ou simplificação drástica).
2. **Frequency (Frequência)**:
   - **Problema**: Funcional mas visualmente divergente.
   - **Ação**: Aplicar classes premium na tabela de chamada.
3. **Students (Alunos)**:
   - **Status**: Em transição. Precisa garantir que todas as abas usem o padrão.
   - **Ação**: Verificar conformidade com `tokens.css`.

---

## 3. Plano de Ação: Refatoração do Módulo de Cursos

O módulo de cursos será o piloto desta padronização.

### Passo 1: Limpeza (Cleanup)
- Remover `courses.css` e `courses-premium.css` conflitantes.
- Criar um único `public/css/modules/courses.css` que importe/use apenas variáveis do `tokens.css`.

### Passo 2: Simplificação da Arquitetura
- Converter de Multi-File (Controllers complexos) para **Single-File Module** (`courses/index.js`).
- **Por que?** O módulo de cursos é essencialmente um CRUD com uma listagem e um formulário. A complexidade atual é desnecessária (YAGNI).

### Passo 3: Implementação Visual
- Recriar o método `render()` usando Template Literals com as classes `.module-header-premium`, etc.
- Implementar visualização em **Grid de Cards** (melhor para cursos) e **Tabela** (para administração), com toggle.

### Passo 4: Integração
- Garantir que `organizationId` seja enviado em todas as requisições.
- Testar fluxos de Criar, Editar (Double-click), Excluir.

---

## 4. Guia de Implementação para Desenvolvedores

Para padronizar qualquer tela:

1. **Não invente CSS**: Use `var(--primary-color)`, `var(--spacing-md)`, etc.
2. **Copie o HTML de Instructors**: A estrutura de divs é crucial.
3. **Use o API Client**: `moduleAPI.fetchWithStates()` garante os estados de Loading/Empty/Error com o visual correto.
4. **Remova Modais**: Transforme formulários em "Edição Full-Screen" ou "Inline" se for simples.

---

**Próximo Passo Imediato**: Executar a refatoração do módulo de **Cursos** seguindo este plano.
