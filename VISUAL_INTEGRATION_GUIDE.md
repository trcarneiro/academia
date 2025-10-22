# 🎨 INTEGRAÇÃO VISUAL - Planos Consolidados

## Localização na Interface

### 📍 Aba "Financeiro" do Aluno Responsável (Adriana)

```
┌────────────────────────────────────────────────────────────────────┐
│  HOME / ESTUDANTES / ADRIANA SILVA                                 │
├────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  👈 Voltar          Duplicar          💾 Salvar                     │
│                                                                      │
├─── Abas ─────────────────────────────────────────────────────────┤
│ 👤 Dados Pessoais | 📊 Visão Geral | 👤 Responsável | 💳 Financeiro │
│                                                                      │
├─ Financeiro ──────────────────────────────────────────────────────┤
│                                                                      │
│ 📄 Matrículas e Planos                                            │
│ ├─ Sem planos pessoais ❌                                          │
│                                                                      │
│ 📜 Histórico de Pagamentos                                         │
│ ├─ Sem histórico                                                   │
│                                                                      │
├─ 📊 Planos dos Dependentes ────────────────────────────────────┤
│                                                                      │
│  [1 dependentes] Total Consolidado: R$ 149,90/mês                 │
│                                                                      │
│  Total de Planos: 1                                                │
│  Valor Total Consolidado: R$ 149,90/mês                           │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ Dependente        │ Plano │ Valor  │ Status │ Início │ Renov. │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │ 👤 Pedro Silva    │Premium│ 149,90 │ ✅    │ 01/01  │ 01/02  │
│  │ pedro@email.com   │       │ R$     │ Ativo │ 2025   │ 2025   │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                      │
└────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Componentes Visuais

### 1. Seção Principal (.consolidated-section)

**Estilo:**
- Fundo gradiente suave: #f0f4ff → #ffffff
- Borda esquerda: 4px sólida #667eea
- Padding: 1.5rem
- Border-radius: 8px
- Sombra leve: 0 2px 8px rgba(102, 126, 234, 0.1)

**Cores:**
```css
--primary-color: #667eea;      /* Azul principal */
--secondary-color: #764ba2;    /* Roxo complementar */
--gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### 2. Cabeçalho (.section-header)

**Layout:** Flex com espaço entre
- Esquerda: Título com ícone
- Direita: Badge mostrando quantidade

**Badge (.badge-consolidated):**
- Fundo gradient
- Cor: #764ba2 com opacidade
- Padding: 0.25rem 0.75rem
- Border-radius: 12px
- Fonte: Bold, tamanho 0.85rem

### 3. Tabela (.consolidated-table)

**Cabeçalho (thead):**
- Fundo gradient: #667eea → #764ba2
- Texto branco
- Padding: 1rem
- Fonte: Bold 0.95rem
- Text-transform: uppercase
- Letter-spacing: 0.5px

**Corpo (tbody):**
- Linha com hover: Background #f8f9ff
- Transição suave: 200ms
- Padding celula: 1rem 0.75rem

**Bordas:**
- Sem bordo interno
- Apenas separação visual entre linhas
- Border-bottom: 1px solid #e0e0e0

### 4. Status Badge (.status-badge)

**Estados:**

```css
/* Ativo - Verde */
.status-active {
    background: #d1fae5 → #a7f3d0;
    color: #065f46;
    border: 1px solid #6ee7b7;
}

/* Inativo - Vermelho */
.status-inactive {
    background: #fee2e2 → #fecaca;
    color: #7f1d1d;
    border: 1px solid #fca5a5;
}

/* Pendente - Amarelo */
.status-pending {
    background: #fef3c7 → #fde68a;
    color: #92400e;
    border: 1px solid #fcd34d;
}
```

**Ícone:**
- Círculo pulsante antes do texto
- Animação: fade in/out 1.5s infinite

### 5. Dependente (.dependent-name)

**Layout:**
- Flex: avatar + texto
- Avatar: Círculo 40px com ícone 👤
- Texto: Nome (bold) + Email (muted small)

**Avatar:**
- Background: #667eea
- Cor ícone: white
- Border-radius: 50%
- Display: Flex centered

### 6. Informações Resumidas (.consolidated-info)

**Cards (.info-row):**
- Flex: label + valor
- Espaçamento: 0.5rem
- Padding: 0.75rem 0
- Border-bottom: 1px solid #e0e0e0

**Valor Especial (.info-value.price):**
- Color: #28a745 (verde)
- Font-weight: 600
- Font-size: 1.1rem

---

## 📱 Responsividade

### Desktop (1440px)
```
┌──────────────────────────────────────────────┐
│ 📊 Planos dos Dependentes  [1 dependentes]   │
├──────────────────────────────────────────────┤
│ Total de Planos: 1        Total: R$ 149,90   │
├───────┬────────┬───────┬────────┬─────┬──────┤
│ Depend│ Plano  │ Valor │ Status │Início│Renov│
├───────┼────────┼───────┼────────┼─────┼──────┤
│ Pedro │Premium │149,90 │ ✅    │01/01│01/02│
└──────────────────────────────────────────────┘
```
- Todas as colunas visíveis
- Tabela normal
- Font-size: 1rem

### Tablet (1024px)
```
┌─────────────────────────────────────┐
│ 📊 Planos (1 dependentes)           │
├─────────────────────────────────────┤
│ Total: R$ 149,90                   │
├────────┬─────────┬────────┬────────┤
│ Depend │ Plano   │ Valor  │ Status │
├────────┼─────────┼────────┼────────┤
│ Pedro  │ Premium │ 149,90 │ ✅    │
└─────────────────────────────────────┘
```
- Colunas de data ocultas
- Tabela encolhe ligeiramente
- Font-size: 0.95rem

### Mobile (768px)
```
┌──────────────────────────┐
│ 📊 Planos (1)            │
├──────────────────────────┤
│ Total: R$ 149,90        │
│                          │
│ DEPENDENTE               │
│ 👤 Pedro Silva           │
│ pedro@email.com          │
│                          │
│ Plano: Premium           │
│ Valor: R$ 149,90         │
│ Status: ✅ Ativo        │
│ Início: 01/01/2025       │
│                          │
└──────────────────────────┘
```
- Layout de cards empilhados
- Sem tabela (grid responsivo)
- Font-size: 0.9rem
- Padding reduzido

---

## 🎨 Paleta de Cores

```css
Primária:       #667eea (Azul confiável)
Secundária:     #764ba2 (Roxo premium)
Sucesso:        #28a745 (Verde ativo)
Aviso:          #ffc107 (Amarelo pendente)
Erro:           #dc3545 (Vermelho inativo)
Neutro Light:   #f0f4ff (Background claro)
Neutro Dark:    #2c3e50 (Texto forte)
Muted:          #999999 (Texto secundário)
Border:         #e0e0e0 (Divisórias)
```

---

## 🔤 Tipografia

**Títulos:**
- Font-size: 1.2rem
- Font-weight: 600
- Color: #2c3e50

**Rótulos:**
- Font-size: 0.95rem
- Font-weight: 500
- Color: #666

**Valores:**
- Font-size: 1rem
- Font-weight: 400
- Color: #2c3e50

**Muted:**
- Font-size: 0.85rem
- Font-weight: 400
- Color: #999

---

## 🎬 Animações

### Hover na linha da tabela
```css
Transição: 200ms ease-in-out
Efeito: Background #f8f9ff
Elevação: Sombra sutil aumenta
Cursor: pointer
```

### Badge pulsante (Ativo)
```css
Animação: pulse 1.5s infinite
Keyframes:
  0% { opacity: 1 }
  50% { opacity: 0.7 }
  100% { opacity: 1 }
```

### Carregamento
```css
Spinner com rotação contínua
Cor: #667eea
Tamanho: 20px
```

---

## 📐 Espaçamento (Grid)

```css
Seção padding:    1.5rem
Tabela padding:   1rem 0.75rem
Card margin:      1rem 0
Linha spacing:    0.5rem
Icon spacing:     0.5rem
```

---

## 🧪 Estados Visuais

### 1. Sem Dependentes
```
┌─────────────────────────────────────────┐
│ 📊 Planos dos Dependentes              │
├─────────────────────────────────────────┤
│                                         │
│ 📭 Nenhum dependente vinculado         │
│                                         │
│ 💡 Dica: Selecione outro aluno na aba  │
│    "Responsável Financeiro"             │
│                                         │
└─────────────────────────────────────────┘
```

### 2. 1 Dependente
```
[Tabela com 1 linha - visto acima]
```

### 3. Múltiplos Dependentes
```
┌─────────────────────────────────────────┐
│ 📊 Planos dos Dependentes [3 deps]      │
├─────────────────────────────────────────┤
│ Total: R$ 449,70/mês                   │
├──────────┬────────┬─────┬────────┐     │
│ Depend 1 │ Plan 1 │... │ Status │     │
├──────────┼────────┼─────┼────────┤     │
│ Depend 2 │ Plan 2 │... │ Status │     │
├──────────┼────────┼─────┼────────┤     │
│ Depend 3 │ Plan 3 │... │ Status │     │
└──────────┴────────┴─────┴────────┘     │
│                                         │
└─────────────────────────────────────────┘
```

### 4. Sem Planos (Dependente Sem Plano)
```
┌──────────────────────────────────┐
│ 📊 Planos dos Dependentes [1]   │
├──────────────────────────────────┤
│ ⚠️ Nenhum plano ativo            │
│                                  │
│ Você tem 1 dependente vinculado, │
│ mas sem planos no momento        │
└──────────────────────────────────┘
```

---

## 🔗 Integração com Sistema Existente

**Classe Premium Usadas:**
- `.data-card-premium` - Container principal
- `.module-header-premium` - Header consistente
- `.stat-card-enhanced` - Cards de informação
- `.badge-consolidated` - Badge customizado

**Ícones FontAwesome:**
- `fa-sitemap` - Ícone principal
- `fa-user` - Dependente
- `fa-circle` - Status indicador
- `fa-file-invoice-dollar` - Financeiro

**Responsive Breakpoints:**
- Desktop: 1440px
- Tablet: 1024px
- Mobile: 768px

---

## ✅ Validação Visual

Ao implementar, confirme:

- [ ] Fundo gradiente suave visível
- [ ] Ícones FontAwesome renderizam corretamente
- [ ] Tabela com scroll horizontal em mobile
- [ ] Badges com cores corretas por estado
- [ ] Hover effect funciona em linhas
- [ ] Responsividade em 3 breakpoints
- [ ] Texto legível em todos os tamanhos
- [ ] Espaçamento consistente
- [ ] Sem overflow de texto
- [ ] Formatação de datas correta (DD/MM/YYYY)
- [ ] Valores monetários com R$ e decimais

