# 🥋 Funcionalidade: Vincular Técnicas a Planos de Aula

**Data de Implementação:** 03/10/2025  
**Módulo:** Courses (Course Editor)  
**Status:** ✅ Completo e Funcional

---

## 📋 Visão Geral

Esta funcionalidade permite que instrutores e administradores vinculem técnicas de Krav Maga diretamente aos planos de aula individuais dentro de um curso. Ao clicar no botão "Adicionar Técnicas" em cada aula, um modal interativo é aberto mostrando todas as técnicas disponíveis no sistema.

---

## 🎯 Objetivos

1. **Facilitar o planejamento pedagógico:** Vincular técnicas específicas a cada aula do cronograma
2. **Organização visual:** Ver claramente quais técnicas estão associadas a cada aula
3. **Reutilização de conteúdo:** Usar o banco de dados de técnicas para compor aulas
4. **Flexibilidade:** Adicionar múltiplas técnicas por aula com busca e filtros

---

## 🏗️ Arquitetura

### Backend (Node.js + Fastify + Prisma)

#### **Rotas Criadas**

**Arquivo:** `src/routes/lessonPlans.ts`

```typescript
// GET - Listar técnicas de uma aula
app.get('/:id/techniques', lessonPlanController.getTechniques);

// POST - Adicionar técnicas a uma aula
app.post('/:id/techniques', lessonPlanController.addTechniques);

// DELETE - Remover técnica de uma aula
app.delete('/:id/techniques/:techniqueId', lessonPlanController.removeTechnique);
```

#### **Controller**

**Arquivo:** `src/controllers/lessonPlanController.ts`

**Métodos Implementados:**

1. **`getTechniques()`**
   - Retorna todas as técnicas vinculadas a uma aula específica
   - Inclui informações da técnica (nome, categoria, dificuldade)
   - Ordenação por `orderIndex`

2. **`addTechniques()`**
   - Recebe array de `techniqueIds` para vincular
   - Suporta modo `replace` (substituir todas as técnicas existentes)
   - Verifica se a técnica já está vinculada antes de adicionar
   - Mantém ordem sequencial automática (`orderIndex`)
   - Retorna técnicas adicionadas com sucesso

3. **`removeTechnique()`**
   - Remove uma técnica específica de uma aula
   - Verifica se a vinculação existe antes de deletar

**Validação com Zod:**

```typescript
const schema = z.object({
  techniqueIds: z.array(z.string().uuid()).min(1),
  replace: z.boolean().default(false)
});
```

---

### Frontend (Vanilla JavaScript)

#### **Arquivo Principal**

`public/js/modules/courses/controllers/courseEditorController.js`

#### **Funcionalidades Implementadas**

### 1. **Botão "Adicionar Técnicas"**

Cada aula no cronograma agora exibe um botão para abrir o modal de seleção:

```html
<button class="btn-add-techniques" 
        data-lesson-id="${lesson.id}" 
        data-lesson-number="${lesson.lesson}" 
        data-lesson-name="${lesson.name}">
    ➕ Adicionar Técnicas
</button>
```

**Event Listener:**

```javascript
button.addEventListener('click', (e) => {
    e.stopPropagation();
    const lessonId = button.dataset.lessonId;
    const lessonNumber = button.dataset.lessonNumber;
    const lessonName = button.dataset.lessonName;
    openTechniquesModal(lessonId, lessonNumber, lessonName);
});
```

---

### 2. **Modal Interativo de Seleção**

**Função:** `openTechniquesModal(lessonId, lessonNumber, lessonName)`

**O que faz:**

1. Carrega todas as técnicas disponíveis via `GET /api/techniques`
2. Carrega técnicas já vinculadas via `GET /api/lesson-plans/:id/techniques`
3. Renderiza modal com:
   - Campo de busca por nome
   - Filtros por categoria (Ataque, Defesa, Quedas, Táticas)
   - Filtro por dificuldade (Níveis 1-5)
   - Grid de técnicas com checkboxes
   - Contador de técnicas selecionadas
   - Técnicas já vinculadas marcadas como "✓ Já vinculada" (desabilitadas)

**Estrutura do Modal:**

```
┌─────────────────────────────────────────┐
│  🥋 Adicionar Técnicas              [✕]  │
│  Aula 1 - Defesa contra socos           │
├─────────────────────────────────────────┤
│  🔍 Buscar técnicas...                  │
│  [Todas as categorias ▾] [Nível ▾]    │
│  ═══════════════════════════════════    │
│  3 técnicas selecionadas                │
│  ┌──┐ Técnica 1                         │
│  │☑│ ATAQUE │ Nível 2                   │
│  └──┘ Descrição da técnica...           │
│  ┌──┐ Técnica 2 ✓ Já vinculada          │
│  │☐│ DEFESA │ Nível 3                   │
│  └──┘ Descrição...                      │
├─────────────────────────────────────────┤
│  [Cancelar] [Adicionar Selecionadas]    │
└─────────────────────────────────────────┘
```

---

### 3. **Busca e Filtros**

**Função:** `filterTechniques()`

- **Busca por texto:** Filtra técnicas pelo nome (case-insensitive)
- **Filtro de categoria:** Ataque, Defesa, Quedas, Táticas
- **Filtro de dificuldade:** Níveis 1 (iniciante) a 5 (avançado)
- **Combinação de filtros:** Todos os filtros funcionam simultaneamente

**Implementação:**

```javascript
const matchesSearch = techniqueName.includes(searchTerm);
const matchesCategory = !category || cardCategory === category;
const matchesDifficulty = !difficulty || cardDifficulty === difficulty;

if (matchesSearch && matchesCategory && matchesDifficulty) {
    card.style.display = 'flex';
} else {
    card.style.display = 'none';
}
```

---

### 4. **Salvar Técnicas Selecionadas**

**Função:** `saveLessonTechniques(lessonId)`

**Fluxo:**

1. Coleta todos os checkboxes marcados (exceto os desabilitados)
2. Extrai os IDs das técnicas selecionadas
3. Valida se pelo menos uma técnica foi selecionada
4. Envia `POST /api/lesson-plans/:id/techniques` com:
   ```json
   {
     "techniqueIds": ["uuid1", "uuid2", ...],
     "replace": false
   }
   ```
5. Exibe mensagem de sucesso
6. Fecha o modal
7. Recarrega o cronograma de aulas (`loadLessonPlans()`) para mostrar as novas técnicas

**Tratamento de Erros:**

- Validação no frontend: "Selecione pelo menos uma técnica"
- Erros de rede/backend: Mensagem de erro exibida
- Rollback visual: Grid não é atualizado em caso de erro

---

### 5. **Atualização Visual Automática**

Após vincular técnicas com sucesso:

```javascript
await loadLessonPlans(currentCourseId);
```

Isso recarrega todas as aulas e mostra:

- Badge "🥋 Técnicas:" com lista
- Cada técnica exibida como item de lista
- Hover com descrição completa (via `title` attribute)

---

## 🎨 Estilos CSS

**Arquivo:** `public/css/modules/course-techniques-modal.css`

### **Componentes Estilizados:**

1. **`.btn-add-techniques`**
   - Gradiente primary → secondary
   - Hover com elevação (+2px)
   - Sombra colorida em hover

2. **`.modal-overlay`**
   - Fundo escuro (rgba(0,0,0,0.7))
   - Centralizado na tela
   - z-index: 10000
   - Animação de fade-in

3. **`.technique-selector-modal`**
   - Largura máxima: 900px
   - Altura máxima: 85vh
   - Scroll interno no `.modal-body`
   - Animação de slide-up

4. **`.technique-card`**
   - Grid responsivo (auto-fill, 280px mínimo)
   - Hover com borda azul e elevação
   - Estado `.already-linked` com opacidade reduzida

5. **`.technique-badges`**
   - Cores específicas por categoria:
     - Ataque: vermelho (#fee/#c33)
     - Defesa: verde (#efe/#3c3)
     - Quedas: amarelo (#fef6e0/#c90)
     - Táticas: azul (#e0f2fe/#369)

### **Responsividade:**

```css
@media (max-width: 768px) {
  .techniques-grid {
    grid-template-columns: 1fr; /* 1 coluna em mobile */
  }
  
  .technique-filters {
    flex-direction: column; /* Filtros empilhados */
  }
  
  .modal-footer .btn {
    width: 100%; /* Botões full-width */
  }
}
```

---

## 📊 Banco de Dados

### **Tabela:** `LessonTechnique`

```prisma
model LessonTechnique {
  id            String      @id @default(uuid())
  lessonPlanId  String
  techniqueId   String
  orderIndex    Int         // Ordem de exibição
  isRequired    Boolean     @default(true)
  createdAt     DateTime    @default(now())
  
  lessonPlan    LessonPlan  @relation(fields: [lessonPlanId], references: [id], onDelete: Cascade)
  technique     Technique   @relation(fields: [techniqueId], references: [id], onDelete: Cascade)
  
  @@unique([lessonPlanId, techniqueId])
  @@index([lessonPlanId])
  @@index([techniqueId])
}
```

**Relacionamentos:**

- `LessonPlan` 1:N `LessonTechnique`
- `Technique` 1:N `LessonTechnique`

**Constraints:**

- `@@unique([lessonPlanId, techniqueId])` → Evita duplicatas
- `onDelete: Cascade` → Remove vinculações ao deletar aula ou técnica

---

## 🧪 Como Testar

### **Pré-requisitos:**

1. Servidor rodando: `npm run dev`
2. Banco de dados com técnicas cadastradas
3. Curso com lesson plans importados/gerados

### **Passo a Passo:**

1. **Navegar para o Course Editor:**
   - Dashboard > Cursos > Clicar em um curso
   - Ir para aba "Cronograma"

2. **Abrir Modal de Técnicas:**
   - Clicar em "➕ Adicionar Técnicas" em qualquer aula
   - Modal deve abrir com todas as técnicas disponíveis

3. **Buscar e Filtrar:**
   - Digite "soco" no campo de busca → Técnicas de soco aparecem
   - Selecione categoria "ATAQUE" → Apenas técnicas de ataque
   - Selecione dificuldade "1" → Apenas técnicas iniciantes

4. **Selecionar Técnicas:**
   - Marque 2-3 checkboxes
   - Contador deve mostrar "3 técnicas selecionadas"
   - Técnicas já vinculadas devem estar desabilitadas

5. **Salvar:**
   - Clicar em "Adicionar Técnicas Selecionadas"
   - Aguardar mensagem de sucesso
   - Modal fecha automaticamente
   - Cronograma recarrega mostrando as técnicas adicionadas

6. **Verificar Persistência:**
   - Recarregar a página (F5)
   - As técnicas devem continuar visíveis na aula

---

## 🐛 Troubleshooting

### **Problema:** Modal não abre

**Possíveis causas:**

1. JavaScript não carregado: Verificar console do navegador
2. API de técnicas falhou: Verificar Network tab (GET /api/techniques)
3. Event listener não registrado: Conferir `setupTechniqueButtons()`

**Solução:**

```javascript
// No console do navegador:
window.courseEditorController.openTechniquesModal('lesson-id', '1', 'Test Lesson');
```

---

### **Problema:** Técnicas não salvam

**Possíveis causas:**

1. Backend não está respondendo
2. IDs de técnicas inválidos
3. Lesson plan não existe

**Verificar:**

```bash
# Terminal do servidor - deve mostrar:
POST /api/lesson-plans/:id/techniques 200
```

**Debug no frontend:**

```javascript
// Adicionar antes do fetch:
console.log('Sending techniqueIds:', techniqueIds);
```

---

### **Problema:** Técnicas não aparecem após salvar

**Causa:** O endpoint `/api/courses/:id/lesson-techniques` não está retornando as técnicas

**Solução:**

Verificar se o endpoint existe e está incluindo as técnicas:

```typescript
// src/routes/courses.ts
app.get('/:id/lesson-techniques', async (request, reply) => {
  const lessonPlans = await prisma.lessonPlan.findMany({
    where: { courseId: id },
    include: {
      lessonTechniques: {
        include: { technique: true }
      }
    }
  });
  // ...
});
```

---

## 🚀 Melhorias Futuras

### **Curto Prazo:**

- [ ] Drag & drop para reordenar técnicas
- [ ] Editar `orderIndex` manualmente
- [ ] Marcar técnica como "opcional" (isRequired: false)
- [ ] Duplicar técnicas de uma aula para outra
- [ ] Toast notifications em vez de alerts

### **Médio Prazo:**

- [ ] Preview de vídeo da técnica no modal
- [ ] Estatísticas: "Técnicas mais usadas"
- [ ] Sugestões automáticas de técnicas baseadas na aula
- [ ] Exportar lista de técnicas por curso (PDF/Excel)

### **Longo Prazo:**

- [ ] Integração com RAG para sugerir técnicas via IA
- [ ] Histórico de mudanças (audit log)
- [ ] Aprovação de mudanças por instrutor sênior
- [ ] Templates de aulas pré-configuradas

---

## 📚 Documentação Relacionada

- **AGENTS.md:** Padrões de módulos e arquitetura
- **MODULE_STANDARDS.md:** Convenções de código
- **DESIGN_SYSTEM.md:** Tokens CSS e componentes
- **Prisma Schema:** `prisma/schema.prisma` (modelos LessonPlan, Technique, LessonTechnique)

---

## 🏆 Benefícios da Implementação

### **Para Instrutores:**

- ✅ Planejamento de aulas mais rápido e estruturado
- ✅ Reutilização de técnicas cadastradas
- ✅ Visão clara do conteúdo de cada aula

### **Para Administradores:**

- ✅ Padronização do currículo
- ✅ Rastreabilidade de técnicas ensinadas
- ✅ Relatórios de cobertura técnica por curso

### **Para Alunos:**

- ✅ Transparência sobre o que será ensinado
- ✅ Preparação prévia para aulas (quando habilitado)
- ✅ Revisão de técnicas aprendidas

---

**Implementado por:** GitHub Copilot  
**Revisado por:** TRCampos  
**Versão:** 1.0  
**Status:** ✅ Pronto para Produção
