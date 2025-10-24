# 🤖 Geração de Planos de Aula com IA - Guia Completo

## 📋 Overview

Sistema de geração automática de planos de aula usando IA (Claude/OpenAI) baseado nas técnicas do curso e estrutura pedagógica do Krav Maga.

**Status**: ✅ TÉCNICAS DISPONÍVEIS | 🚧 IA EM DESENVOLVIMENTO

---

## 🎯 Objetivo

Gerar planos de aula detalhados e personalizados para cada aula do curso, considerando:
- Técnicas específicas da aula (extraídas do cronograma)
- Progressão pedagógica (nível do aluno, semana do curso)
- Estrutura padrão de aula (aquecimento, técnica, drill, sparring, desaquecimento)
- Objetivos da semana/mês
- Preparação para avaliações

---

## 📊 Dados Disponíveis para IA

### 1. Técnicas do Cronograma (✅ IMPLEMENTADO)

**Endpoint**: Extraído de Lesson Plans (fallback automático)

**Estrutura de Dados**:
```javascript
{
  id: "tech-uuid",
  technique: {
    id: "tech-uuid",
    name: "Soco Jab",
    slug: "soco-jab",
    category: "PUNCH", // PUNCH, KICK, DEFENSE, GROUND, etc.
    description: "Soco direto com o braço da frente"
  },
  lessonPlans: [
    { weekNumber: 1, lessonNumber: 1, title: "Introdução aos Golpes" },
    { weekNumber: 2, lessonNumber: 3, title: "Combinações Básicas" }
  ]
}
```

**Como Usar**:
```javascript
// Course Editor já carrega automaticamente
await loadCourseTechniques(courseId);
// Técnicas disponíveis em: window.courseTechniques
```

### 2. Estrutura do Curso

**Campos Disponíveis**:
- `duration`: 16 semanas
- `classesPerWeek`: 2 aulas/semana
- `totalClasses`: 32 aulas
- `level`: BEGINNER, INTERMEDIATE, ADVANCED
- `category`: ADULT, TEEN, KIDS
- `objectives`: Array de objetivos gerais
- `prerequisites`: Array de pré-requisitos

### 3. Lesson Plan Atual

**Estrutura**:
```javascript
{
  id: "lp-uuid",
  courseId: "course-uuid",
  weekNumber: 1,
  lessonNumber: 1,
  title: "Introdução aos Golpes Básicos",
  description: "Primeira aula focada em postura e socos",
  objectives: ["Aprender postura", "Dominar Jab"],
  activities: [
    { technique: {...}, segment: "TECHNIQUE", ord: 1 },
    { technique: {...}, segment: "DRILL", ord: 2 }
  ]
}
```

---

## 🧠 Estratégia de Geração com IA

### Fluxo de Geração

```
1. Carregar Lesson Plan
   ↓
2. Extrair Técnicas da Aula
   ↓
3. Montar Contexto para IA (prompt engineering)
   ↓
4. Gerar Plano com Claude/OpenAI
   ↓
5. Parsear Resposta (JSON estruturado)
   ↓
6. Salvar Plano Gerado
   ↓
7. Atualizar UI
```

### Prompt Template para IA

```javascript
const prompt = `
Você é um instrutor experiente de Krav Maga criando um plano de aula detalhado.

**CONTEXTO DO CURSO:**
- Curso: ${course.name}
- Nível: ${course.level}
- Categoria: ${course.category}
- Semana: ${lessonPlan.weekNumber} de ${course.duration}
- Aula: ${lessonPlan.lessonNumber} de ${course.totalClasses}

**TÉCNICAS DESTA AULA:**
${techniques.map(t => `- ${t.name} (${t.category}): ${t.description}`).join('\n')}

**OBJETIVOS DA AULA:**
${lessonPlan.objectives.join('\n')}

**ESTRUTURA OBRIGATÓRIA:**
1. AQUECIMENTO (10min)
   - Preparação física geral
   - Mobilidade articular
   - Cardio leve

2. TÉCNICA (25min)
   - Demonstração das técnicas
   - Prática individual
   - Correção de postura

3. DRILL (20min)
   - Exercícios em dupla
   - Progressão de intensidade
   - Aplicação realista

4. SPARRING/SIMULAÇÃO (10min)
   - Cenários práticos
   - Tomada de decisão
   - Controle emocional

5. DESAQUECIMENTO (5min)
   - Alongamento
   - Feedback
   - Próxima aula

**FORMATO DA RESPOSTA:**
Retorne um JSON com esta estrutura:
{
  "warmup": {
    "duration": 10,
    "activities": ["atividade 1", "atividade 2", ...]
  },
  "technique": {
    "duration": 25,
    "activities": ["demonstração X", "prática Y", ...]
  },
  "drill": {
    "duration": 20,
    "activities": ["drill 1", "drill 2", ...]
  },
  "sparring": {
    "duration": 10,
    "scenarios": ["cenário 1", "cenário 2", ...]
  },
  "cooldown": {
    "duration": 5,
    "activities": ["alongamento", "feedback", ...]
  },
  "equipmentNeeded": ["luvas", "escudos", ...],
  "safetyNotes": ["nota 1", "nota 2", ...],
  "progressionTips": ["dica 1", "dica 2", ...]
}

Crie um plano DETALHADO, SEGURO e PROGRESSIVO para esta aula.
`;
```

---

## 🛠️ Implementação

### Arquivo Principal
**Localização**: `/public/js/modules/courses/controllers/aiLessonPlanGenerator.js`

### Estrutura do Módulo

```javascript
/**
 * AI Lesson Plan Generator
 * Generates detailed lesson plans using Claude AI
 */

const AILessonPlanGenerator = {
    
    /**
     * Generate lesson plan for specific lesson
     */
    async generateLessonPlan(courseId, lessonPlanId) {
        // 1. Load course data
        const course = await loadCourse(courseId);
        
        // 2. Load lesson plan
        const lessonPlan = await loadLessonPlan(lessonPlanId);
        
        // 3. Extract techniques
        const techniques = await extractTechniquesForLesson(lessonPlan);
        
        // 4. Build AI prompt
        const prompt = this.buildPrompt(course, lessonPlan, techniques);
        
        // 5. Call AI service
        const generatedPlan = await this.callAIService(prompt);
        
        // 6. Save generated plan
        await this.saveLessonPlan(lessonPlanId, generatedPlan);
        
        return generatedPlan;
    },
    
    /**
     * Build AI prompt with all context
     */
    buildPrompt(course, lessonPlan, techniques) {
        // Implementation above
    },
    
    /**
     * Call AI service (Claude or OpenAI)
     */
    async callAIService(prompt) {
        const response = await fetch('/api/ai/generate-lesson-plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });
        
        return response.json();
    },
    
    /**
     * Save generated plan to database
     */
    async saveLessonPlan(lessonPlanId, generatedPlan) {
        // Update LessonPlan with generated content
        await fetch(`/api/courses/lesson-plans/${lessonPlanId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                generatedPlan: generatedPlan,
                generatedAt: new Date().toISOString()
            })
        });
    }
};
```

---

## 🎨 Interface do Usuário

### Botão "Gerar com IA"

**Localização**: Course Editor → Aba Cronograma → Cada Lesson Card

**HTML**:
```html
<div class="lesson-item">
    <div class="lesson-info">
        <h4>Semana 1 - Aula 1</h4>
        <p>📋 0 item(s)</p>
    </div>
    <div class="lesson-actions">
        <button onclick="generateWithAI('lesson-plan-id')" class="btn-generate-ai">
            🤖 Gerar com IA
        </button>
        <button onclick="editLesson('lesson-plan-id')" class="btn-edit">
            ✏️ Editar
        </button>
    </div>
</div>
```

**CSS** (adicionar a `course-editor-premium.css`):
```css
.btn-generate-ai {
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-generate-ai:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-generate-ai:active {
    transform: translateY(0);
}

.btn-generate-ai:disabled {
    background: #ccc;
    cursor: not-allowed;
}

.ai-generation-progress {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    background: var(--editor-surface-alt);
    border-radius: 8px;
    margin: 1rem 0;
}

.ai-spinner {
    width: 20px;
    height: 20px;
    border: 3px solid var(--editor-border);
    border-top-color: var(--editor-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}
```

### Fluxo de Interação

```
1. Usuário clica "Gerar com IA"
   ↓
2. Modal de confirmação aparece
   "Gerar plano de aula automático para Semana 1 - Aula 1?"
   [Cancelar] [Gerar]
   ↓
3. Botão desabilita, mostra spinner
   "🤖 Gerando plano... (pode levar 10-30 segundos)"
   ↓
4. Chamada API para IA
   ↓
5. Resposta recebida, parsear JSON
   ↓
6. Salvar no banco
   ↓
7. Atualizar UI
   ✅ "Plano gerado com sucesso!"
   Mostrar preview do plano
   ↓
8. Usuário pode:
   - Ver plano completo
   - Editar plano
   - Regenerar se não gostar
```

---

## 🔌 Backend API

### Novo Endpoint

**Rota**: `POST /api/ai/generate-lesson-plan`

**Arquivo**: `src/routes/ai.ts`

**Implementação**:
```typescript
app.post('/generate-lesson-plan', async (request, reply) => {
  try {
    const { prompt } = request.body as { prompt: string };
    
    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });
    
    // Extract JSON from response
    const content = response.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }
    
    const lessonPlan = JSON.parse(jsonMatch[0]);
    
    return reply.send({
      success: true,
      data: lessonPlan
    });
    
  } catch (error) {
    request.log.error('AI generation error:', error);
    return reply.code(500).send({
      success: false,
      error: 'Failed to generate lesson plan'
    });
  }
});
```

### Atualizar Lesson Plan

**Rota**: `PATCH /api/courses/lesson-plans/:id`

**Adicionar campo**: `generatedPlan` (JSON)

**Schema Prisma**:
```prisma
model LessonPlan {
  // ... existing fields
  generatedPlan  Json?     // AI-generated lesson plan
  generatedAt    DateTime? // When it was generated
}
```

---

## 📈 Melhorias Futuras

### Fase 1 (Atual)
- ✅ Extrair técnicas do cronograma
- ✅ Exibir técnicas com informação de aulas
- 🚧 Implementar geração básica com IA

### Fase 2 (Próxima)
- [ ] Regenerar planos em lote (todas as aulas)
- [ ] Template de prompts customizáveis
- [ ] Preview antes de salvar
- [ ] Histórico de versões geradas

### Fase 3 (Futuro)
- [ ] IA aprende com feedback dos instrutores
- [ ] Sugestões de variações de exercícios
- [ ] Adaptação automática para alunos especiais
- [ ] Integração com agenda (horário, local, equipamento disponível)
- [ ] Geração de aquecimentos lúdicos por faixa etária
- [ ] Sistema de RAG com vídeos de técnicas

---

## 🧪 Testes

### Casos de Teste

1. **Geração Básica**
   - Curso: Krav Maga Faixa Branca
   - Aula: Semana 1, Aula 1
   - Técnicas: 4 técnicas (Postura, Jab, Direto, Defesa)
   - Espera: Plano de 70 minutos com 5 segmentos

2. **Aula Complexa**
   - Curso: Krav Maga Faixa Laranja
   - Aula: Semana 8, Aula 15
   - Técnicas: 10 técnicas (múltiplas categorias)
   - Espera: Plano com drills avançados

3. **Aula de Avaliação**
   - Curso: Qualquer
   - Aula: Semana 8 (avaliação)
   - Técnicas: Revisão de 20+ técnicas
   - Espera: Plano focado em revisão e teste

### Comandos de Teste

```bash
# Teste unitário
npm run test src/services/aiService.test.ts

# Teste integração
npm run test:integration api/ai/generate-lesson-plan

# Teste E2E
npm run test:e2e course-editor-ai-generation
```

---

## 📚 Referências

- **Claude AI Docs**: https://docs.anthropic.com/claude/reference
- **OpenAI API**: https://platform.openai.com/docs
- **Prompt Engineering**: https://www.promptingguide.ai/
- **Krav Maga Curriculum**: /docs/krav-maga-curriculum.pdf
- **Lesson Plan Structure**: /dev/COURSES_AUDIT_REPORT.md

---

## 🎯 Checklist de Implementação

### Frontend
- [x] Extrair técnicas do cronograma (fallback automático)
- [x] Exibir técnicas com contador de aulas
- [x] CSS para `.technique-lessons` badge
- [ ] Adicionar botão "Gerar com IA" em cada lesson card
- [ ] Implementar `AILessonPlanGenerator.js`
- [ ] Modal de confirmação
- [ ] Loading state com spinner
- [ ] Preview do plano gerado
- [ ] Integração com Course Editor

### Backend
- [ ] Criar endpoint `POST /api/ai/generate-lesson-plan`
- [ ] Adicionar campo `generatedPlan` ao schema Prisma
- [ ] Implementar chamada para Claude API
- [ ] Parser de resposta JSON
- [ ] Endpoint `PATCH /api/courses/lesson-plans/:id`
- [ ] Validação de dados gerados
- [ ] Rate limiting (evitar abuse)

### Testes
- [ ] Testes unitários AI service
- [ ] Testes integração endpoint
- [ ] Testes E2E geração completa
- [ ] Teste com dados reais de curso

### Documentação
- [x] Este documento criado
- [ ] Atualizar AGENTS.md com nova feature
- [ ] Tutorial em vídeo
- [ ] Exemplos de prompts

---

**Versão**: 1.0  
**Data**: 03/10/2025  
**Status**: 🚧 EM DESENVOLVIMENTO  
**Próximo Passo**: Implementar botão "Gerar com IA" e AILessonPlanGenerator.js
