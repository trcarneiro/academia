# 🎯 Plano de Reorganização do Módulo de IA
## Geração de Planos baseada em Atividades do Plano de Curso

**Data**: 01/10/2025  
**Status**: 🚧 Em Planejamento  
**Objetivo**: Expandir funcionalidade de geração de planos no módulo de IA existente para usar atividades do plano de curso como base, incluindo cadastro automático de novas atividades.

---

## 📊 Análise da Situação Atual

### Estrutura do Módulo de IA
- **Arquivo**: `/public/js/modules/ai.js` (4,450 linhas)
- **Classe Principal**: `EnhancedAIModule`
- **Tabs Existentes**:
  - 🔍 RAG (Base de Conhecimento)
  - 🤖 Agentes (IA Especializada)
  - 📚 Geração de Conteúdo (ATIVA - Cursos, Técnicas & Planos)
  - 📊 Monitor de Planos (Análise & Otimização)

### Funcionalidades Atuais de Geração
✅ **Já Implementado**:
- Seleção de curso via dropdown
- Análise de planos existentes vs faltantes
- Geração individual de planos (`generateSinglePlan()`)
- Geração em lote de todos os planos faltantes (`generateAllMissingPlans()`)
- Progress bar com logs em tempo real
- Stats cards (cursos, planos existentes, faltantes, cobertura)
- UI premium com gradientes e animações

❌ **Não Implementado**:
- Análise de atividades do plano de curso
- Geração baseada nas atividades específicas do curso
- Cadastro automático de novas atividades
- Sincronização de atividades com técnicas
- Validação de atividades existentes vs necessárias

---

## 🗄️ Estrutura de Dados

### Modelos Prisma Relevantes

#### 1. Course
```prisma
model Course {
  id               String        @id @default(uuid())
  organizationId   String
  martialArtId     String
  name             String
  description      String?
  level            CourseLevel?  // BEGINNER, INTERMEDIATE, ADVANCED, etc
  totalLessons     Int
  totalWeeks       Int
  // ... outros campos
  lessonPlans      LessonPlan[]
  // coursePlan (não existe - atividades vem de outro lugar?)
}
```

#### 2. LessonPlan
```prisma
model LessonPlan {
  id               String                 @id @default(uuid())
  courseId         String
  title            String
  lessonNumber     Int
  weekNumber       Int
  warmup           Json                   // Aquecimento
  techniques       Json                   // Técnicas
  simulations      Json                   // Simulações
  cooldown         Json                   // Desaquecimento
  activities       String[]               // IDs das atividades (?)
  activityItems    LessonPlanActivity[]   // 🔑 RELAÇÃO COM ACTIVITIES
  // ... outros campos
}
```

#### 3. Activity
```prisma
model Activity {
  id              String               @id @default(uuid())
  organizationId  String
  type            ActivityType         // WARMUP, DRILL, SPARRING, etc
  title           String
  description     String?
  equipment       String[]
  safety          String?
  adaptations     String[]
  difficulty      Int?
  refTechniqueId  String?              // 🔑 Referência para técnica
  lessonPlanItems LessonPlanActivity[] // 🔑 RELAÇÃO COM LESSON PLANS
  // ... outros campos
}
```

#### 4. LessonPlanActivity (Tabela Pivô)
```prisma
model LessonPlanActivity {
  id           String        @id @default(uuid())
  lessonPlanId String
  activityId   String
  segment      LessonSegment  // WARMUP, TECHNIQUE, SIMULATION, COOLDOWN
  ord          Int            // Ordem na sequência
  params       Json?          // Parâmetros específicos
  objectives   String?
  safetyNotes  String?
  adaptations  String?
  // ... outros campos
}
```

### ❓ Questão Crítica: Onde estão as atividades do "Plano de Curso"?

**Problema**: Não encontrei `model CoursePlan` no schema Prisma.

**Hipóteses**:
1. **Atividades vêm direto das técnicas do curso?**
   - Course → MartialArt → Techniques → Activities
2. **Atividades estão em JSON dentro do Course?**
   - `Course.description` ou campo customizado?
3. **Atividades são definidas manualmente por aula?**
   - Não existe "plano de curso" pré-definido
4. **Plano de Curso = Técnicas associadas ao curso?**
   - Usar técnicas como base para gerar atividades

---

## 🎯 Solução Proposta

### Abordagem 1: Usar Técnicas do Curso como Base
**Premissa**: Cada curso tem técnicas específicas definidas. Vamos usar essas técnicas para gerar atividades e planos.

#### Fluxo de Geração:
```
1. Usuário seleciona curso
   ↓
2. Sistema busca técnicas do curso (via MartialArt)
   ↓
3. Para cada aula faltante:
   a) Busca técnicas apropriadas para o nível
   b) Busca atividades existentes relacionadas a essas técnicas
   c) Se atividade não existe → cria automaticamente
   d) Gera plano de aula com atividades + contexto RAG
   ↓
4. Vincula atividades ao plano (LessonPlanActivity)
   ↓
5. Exibe resultado com stats de novas atividades criadas
```

#### Endpoints Necessários:

**Backend (criar/modificar)**:
```typescript
// 1. GET /api/courses/:id/techniques
// Retorna técnicas do curso baseado na arte marcial

// 2. GET /api/activities/by-technique/:techniqueId
// Retorna atividades existentes para uma técnica

// 3. POST /api/activities/auto-create
// Cria atividade automaticamente baseado em técnica + AI
{
  techniqueId: string;
  type: ActivityType;  // WARMUP, DRILL, SPARRING, etc
  difficulty: number;
  aiProvider?: string;
}

// 4. POST /api/ai/generate-lesson-with-activities
// Geração inteligente: busca/cria atividades + gera plano
{
  courseId: string;
  lessonNumber: number;
  techniqueIds: string[];    // Técnicas para esta aula
  createMissingActivities: boolean;
  aiProvider: string;
}
```

**Frontend (ai.js)**:
```javascript
// Novo método na classe EnhancedAIModule

async analyzeCourseWithActivities(courseId) {
  // 1. Busca curso + técnicas
  // 2. Busca atividades existentes por técnica
  // 3. Calcula atividades faltantes
  // 4. Retorna análise completa
  return {
    course: {...},
    techniques: [...],
    existingActivities: [...],
    missingActivities: [...],
    lessonPlans: {
      existing: [...],
      missing: [...]
    }
  };
}

async generateLessonWithActivities(courseId, lessonNumber, options) {
  // 1. Seleciona técnicas para esta aula
  // 2. Busca/cria atividades necessárias
  // 3. Gera plano usando atividades + RAG
  // 4. Vincula atividades ao plano
  // 5. Retorna resultado com stats
}
```

---

## 📋 Implementação Detalhada

### Sprint 1: Backend - Endpoints de Atividades (3 dias)

#### Task 1.1: Endpoint de Técnicas do Curso
**Arquivo**: `src/routes/courses.ts`

```typescript
// GET /api/courses/:id/techniques
fastify.get('/:id/techniques', async (request, reply) => {
  const { id } = request.params;
  
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      martialArt: {
        include: {
          techniques: {
            where: {
              difficulty: {
                lte: getLevelDifficulty(course.level)
              }
            },
            orderBy: { difficulty: 'asc' }
          }
        }
      }
    }
  });
  
  return {
    success: true,
    data: course.martialArt.techniques
  };
});
```

#### Task 1.2: Endpoint de Atividades por Técnica
**Arquivo**: `src/routes/activities.ts`

```typescript
// GET /api/activities/by-technique/:techniqueId
fastify.get('/by-technique/:techniqueId', async (request, reply) => {
  const { techniqueId } = request.params;
  
  const activities = await prisma.activity.findMany({
    where: { refTechniqueId: techniqueId },
    include: {
      refTechnique: true,
      lessonPlanItems: {
        select: { lessonPlanId: true }
      }
    }
  });
  
  return {
    success: true,
    data: activities,
    count: activities.length
  };
});
```

#### Task 1.3: Endpoint de Auto-Criação de Atividades
**Arquivo**: `src/routes/activities.ts`

```typescript
// POST /api/activities/auto-create
fastify.post('/auto-create', async (request, reply) => {
  const { techniqueId, type, difficulty, aiProvider = 'gemini' } = request.body;
  
  // 1. Busca técnica
  const technique = await prisma.technique.findUnique({
    where: { id: techniqueId }
  });
  
  if (!technique) {
    return reply.code(404).send({ success: false, error: 'Technique not found' });
  }
  
  // 2. Gera atividade com AI
  const prompt = `
    Crie uma atividade de treinamento para a técnica "${technique.name}".
    
    Tipo: ${type}
    Dificuldade: ${difficulty}
    Descrição da Técnica: ${technique.description}
    
    Retorne em JSON:
    {
      "title": "Título da atividade",
      "description": "Descrição completa",
      "equipment": ["equipamento1", "equipamento2"],
      "safety": "Instruções de segurança",
      "adaptations": ["adaptação1", "adaptação2"]
    }
  `;
  
  const aiResponse = await generateWithAI(prompt, aiProvider);
  const activityData = JSON.parse(aiResponse);
  
  // 3. Cria atividade no banco
  const activity = await prisma.activity.create({
    data: {
      organizationId: request.user.organizationId,
      type: type,
      title: activityData.title,
      description: activityData.description,
      equipment: activityData.equipment,
      safety: activityData.safety,
      adaptations: activityData.adaptations,
      difficulty: difficulty,
      refTechniqueId: techniqueId
    }
  });
  
  return {
    success: true,
    data: activity,
    message: 'Activity created automatically'
  };
});
```

#### Task 1.4: Endpoint de Geração com Atividades
**Arquivo**: `src/routes/ai.ts`

```typescript
// POST /api/ai/generate-lesson-with-activities
fastify.post('/generate-lesson-with-activities', async (request, reply) => {
  const { 
    courseId, 
    lessonNumber, 
    techniqueIds = [], 
    createMissingActivities = true,
    aiProvider = 'gemini' 
  } = request.body;
  
  const results = {
    lessonPlan: null,
    activitiesCreated: [],
    activitiesUsed: [],
    errors: []
  };
  
  try {
    // 1. Busca técnicas selecionadas
    const techniques = await prisma.technique.findMany({
      where: { id: { in: techniqueIds } }
    });
    
    // 2. Para cada técnica, busca ou cria atividades
    for (const technique of techniques) {
      // Busca atividades existentes
      let activities = await prisma.activity.findMany({
        where: { refTechniqueId: technique.id }
      });
      
      // Se não existe e createMissingActivities = true
      if (activities.length === 0 && createMissingActivities) {
        const newActivity = await autoCreateActivity(technique, 'DRILL', aiProvider);
        activities.push(newActivity);
        results.activitiesCreated.push(newActivity);
      }
      
      results.activitiesUsed.push(...activities);
    }
    
    // 3. Gera plano de aula usando atividades + RAG
    const lessonPlan = await generateLessonPlanWithActivities({
      courseId,
      lessonNumber,
      techniques,
      activities: results.activitiesUsed,
      aiProvider
    });
    
    results.lessonPlan = lessonPlan;
    
    return {
      success: true,
      data: results,
      message: `Lesson plan generated with ${results.activitiesCreated.length} new activities`
    };
    
  } catch (error) {
    logger.error('Error generating lesson with activities:', error);
    return reply.code(500).send({
      success: false,
      error: error.message
    });
  }
});
```

---

### Sprint 2: Frontend - UI de Atividades (2 dias)

#### Task 2.1: Nova Seção de Análise de Atividades
**Arquivo**: `public/js/modules/ai.js` (linha ~200, após courseAnalysisSection)

```javascript
// Adicionar nova seção no HTML gerado em setupEnhancedInterface()

<!-- Activities Analysis Section -->
<div class="data-card-premium" id="activitiesAnalysisSection" style="display: none;">
  <div class="card-header">
    <h3>🎯 Análise de Atividades</h3>
    <p>Atividades disponíveis vs necessárias para gerar planos completos</p>
  </div>
  <div style="padding: 2rem;">
    <!-- Técnicas do Curso -->
    <div class="techniques-grid" id="techniquesGrid">
      <!-- Populated dynamically -->
    </div>
    
    <!-- Atividades Existentes por Técnica -->
    <div class="activities-by-technique" id="activitiesByTechnique">
      <!-- Populated dynamically -->
    </div>
    
    <!-- Atividades Faltantes -->
    <div class="missing-activities-alert" id="missingActivitiesAlert" style="display: none;">
      <div class="alert alert-warning">
        <strong>⚠️ Atividades Faltantes</strong>
        <p id="missingActivitiesCount">0</p> atividades serão criadas automaticamente durante a geração.
      </div>
    </div>
  </div>
</div>
```

#### Task 2.2: Método de Análise de Atividades
**Arquivo**: `public/js/modules/ai.js` (adicionar método na classe EnhancedAIModule)

```javascript
async analyzeCourseWithActivities(courseId) {
  console.log('🔍 Analyzing course activities:', courseId);
  
  try {
    // 1. Busca técnicas do curso
    const techniquesResponse = await this.apiHelper.api.get(`/api/courses/${courseId}/techniques`);
    
    if (!techniquesResponse.success) {
      throw new Error('Failed to load course techniques');
    }
    
    const techniques = techniquesResponse.data;
    
    // 2. Para cada técnica, busca atividades existentes
    const activitiesAnalysis = await Promise.all(
      techniques.map(async (technique) => {
        const activitiesResponse = await this.apiHelper.api.get(`/api/activities/by-technique/${technique.id}`);
        
        return {
          technique: technique,
          activities: activitiesResponse.success ? activitiesResponse.data : [],
          hasActivities: activitiesResponse.success && activitiesResponse.data.length > 0
        };
      })
    );
    
    // 3. Calcula estatísticas
    const totalTechniques = techniques.length;
    const techniquesWithActivities = activitiesAnalysis.filter(a => a.hasActivities).length;
    const techniquesWithoutActivities = totalTechniques - techniquesWithActivities;
    
    // 4. Atualiza UI
    this.displayActivitiesAnalysis(activitiesAnalysis, {
      totalTechniques,
      techniquesWithActivities,
      techniquesWithoutActivities
    });
    
    // 5. Mostra seção
    document.getElementById('activitiesAnalysisSection').style.display = 'block';
    
    return activitiesAnalysis;
    
  } catch (error) {
    console.error('Error analyzing activities:', error);
    this.showBanner('Erro ao analisar atividades: ' + error.message, 'error');
  }
}

displayActivitiesAnalysis(analysis, stats) {
  const techniquesGrid = document.getElementById('techniquesGrid');
  const activitiesByTechnique = document.getElementById('activitiesByTechnique');
  const missingActivitiesAlert = document.getElementById('missingActivitiesAlert');
  const missingActivitiesCount = document.getElementById('missingActivitiesCount');
  
  // Renderizar grid de técnicas
  techniquesGrid.innerHTML = `
    <div class="techniques-stats">
      <div class="stat">
        <span class="number">${stats.totalTechniques}</span>
        <span class="label">Técnicas Totais</span>
      </div>
      <div class="stat success">
        <span class="number">${stats.techniquesWithActivities}</span>
        <span class="label">Com Atividades</span>
      </div>
      <div class="stat warning">
        <span class="number">${stats.techniquesWithoutActivities}</span>
        <span class="label">Sem Atividades</span>
      </div>
    </div>
  `;
  
  // Renderizar atividades por técnica
  activitiesByTechnique.innerHTML = analysis.map(item => `
    <div class="technique-activities-card">
      <div class="technique-header">
        <h5>${item.technique.name}</h5>
        <span class="badge ${item.hasActivities ? 'badge-success' : 'badge-warning'}">
          ${item.activities.length} atividade(s)
        </span>
      </div>
      <div class="activities-list">
        ${item.activities.length > 0 
          ? item.activities.map(act => `
            <div class="activity-item">
              <span class="activity-type">${act.type}</span>
              <span class="activity-title">${act.title}</span>
            </div>
          `).join('')
          : `<p class="no-activities">⚠️ Será criada automaticamente durante a geração</p>`
        }
      </div>
    </div>
  `).join('');
  
  // Mostrar alerta se houver técnicas sem atividades
  if (stats.techniquesWithoutActivities > 0) {
    missingActivitiesCount.textContent = stats.techniquesWithoutActivities;
    missingActivitiesAlert.style.display = 'block';
  } else {
    missingActivitiesAlert.style.display = 'none';
  }
}
```

#### Task 2.3: Atualizar onCourseSelect para Incluir Atividades
**Arquivo**: `public/js/modules/ai.js` (modificar método existente ~linha 537)

```javascript
async onCourseSelect() {
  const courseId = document.getElementById('courseSelect')?.value;
  if (!courseId) {
    this.hideCourseAnalysis();
    return;
  }

  console.log('🔍 Analyzing course:', courseId);
  
  try {
    this.showCourseAnalysisLoading();
    
    // Carregar em paralelo: detalhes + planos + ATIVIDADES
    await Promise.all([
      this.loadCourseDetails(courseId),
      this.loadCoursePlansAnalysis(courseId),
      this.analyzeCourseWithActivities(courseId)  // 🆕 NOVO!
    ]);

  } catch (error) {
    console.error('Error analyzing course:', error);
    this.showBanner('Erro ao analisar curso: ' + error.message, 'error');
  }
}
```

#### Task 2.4: Novo Botão de Geração com Atividades
**Arquivo**: `public/js/modules/ai.js` (adicionar botão na seção missingPlansSection ~linha 231)

```javascript
// Modificar header-actions da seção Missing Plans

<div class="header-actions">
  <!-- Botão existente -->
  <button class="btn-primary" onclick="enhancedAI.generateAllMissingPlans()" id="generateAllBtn">
    🤖 Gerar Todos os Planos Faltantes
  </button>
  
  <!-- 🆕 Novo botão com atividades -->
  <button class="btn-success" onclick="enhancedAI.generateAllWithActivities()" id="generateWithActivitiesBtn" style="margin-left: 1rem;">
    🎯 Gerar com Atividades Automáticas
  </button>
</div>
```

#### Task 2.5: Método de Geração com Atividades
**Arquivo**: `public/js/modules/ai.js` (adicionar método na classe)

```javascript
async generateAllWithActivities() {
  const courseId = document.getElementById('courseSelect')?.value;
  if (!courseId) {
    this.showBanner('Nenhum curso selecionado', 'error');
    return;
  }

  console.log(`🎯 Generating all missing plans WITH automatic activities for course ${courseId}`);
  
  try {
    // Busca técnicas do curso
    const techniquesResponse = await this.apiHelper.api.get(`/api/courses/${courseId}/techniques`);
    if (!techniquesResponse.success) {
      throw new Error('Failed to load course techniques');
    }
    const techniqueIds = techniquesResponse.data.map(t => t.id);
    
    // Get missing plan numbers
    const missingCards = document.querySelectorAll('.missing-plan');
    const missingNumbers = Array.from(missingCards).map(card => {
      const numberElement = card.querySelector('.plan-number');
      return parseInt(numberElement.textContent.replace('Aula ', ''));
    });

    if (missingNumbers.length === 0) {
      this.showBanner('Nenhum plano faltante encontrado', 'info');
      return;
    }

    // Show generation progress
    this.showGenerationProgress(missingNumbers.length);
    
    let successCount = 0;
    let failCount = 0;
    let totalActivitiesCreated = 0;

    // Generate plans sequentially
    for (let i = 0; i < missingNumbers.length; i++) {
      const lessonNumber = missingNumbers[i];
      
      try {
        this.updateGenerationProgress(
          i + 1, 
          missingNumbers.length, 
          `Gerando Aula ${lessonNumber} (com atividades automáticas)...`
        );
        
        // 🆕 Usar endpoint de geração com atividades
        const response = await this.apiHelper.api.post('/api/ai/generate-lesson-with-activities', {
          courseId: courseId,
          lessonNumber: lessonNumber,
          techniqueIds: techniqueIds,
          createMissingActivities: true,  // 🔑 Criar atividades automaticamente
          aiProvider: 'gemini'
        });
        
        if (response.success) {
          successCount++;
          const activitiesCreated = response.data.activitiesCreated?.length || 0;
          totalActivitiesCreated += activitiesCreated;
          
          this.addGenerationLog(
            `✅ Aula ${lessonNumber} gerada | ${activitiesCreated} atividades criadas`
          );
        } else {
          throw new Error(response.error || 'Erro na geração');
        }
        
        // Delay between generations
        await new Promise(resolve => setTimeout(resolve, 1500));
        
      } catch (error) {
        failCount++;
        this.addGenerationLog(`❌ Erro na Aula ${lessonNumber}: ${error.message}`);
        console.error(`Error generating lesson ${lessonNumber}:`, error);
      }
    }

    // Show final results with activities count
    this.completeGenerationProgress(successCount, failCount, totalActivitiesCreated);
    
    // Log summary
    console.log(`
      📊 Generation Summary:
      - Plans: ${successCount} success, ${failCount} failures
      - Activities: ${totalActivitiesCreated} automatically created
    `);
    
    // Refresh analysis
    setTimeout(() => {
      this.onCourseSelect();  // Reload all data
    }, 2000);

  } catch (error) {
    console.error('Error generating with activities:', error);
    this.showBanner('Erro na geração: ' + error.message, 'error');
    this.hideGenerationProgress();
  }
}
```

---

### Sprint 3: CSS & Polish (1 dia)

#### Task 3.1: Estilos para Nova Seção de Atividades
**Arquivo**: `public/css/modules/ai.css` (adicionar ao final)

```css
/* Activities Analysis Section */
#activitiesAnalysisSection {
  margin-top: 2rem;
}

.techniques-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.techniques-stats .stat {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1.5rem;
  border-radius: 12px;
  text-align: center;
  color: white;
}

.techniques-stats .stat.success {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.techniques-stats .stat.warning {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.techniques-stats .stat .number {
  display: block;
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.techniques-stats .stat .label {
  display: block;
  font-size: 0.9rem;
  opacity: 0.9;
}

.technique-activities-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.technique-activities-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.technique-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f0f0f0;
}

.technique-header h5 {
  margin: 0;
  color: #1f2937;
  font-size: 1.1rem;
}

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

.badge-success {
  background: #d1fae5;
  color: #065f46;
}

.badge-warning {
  background: #fed7aa;
  color: #92400e;
}

.activities-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.activity-type {
  background: #667eea;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.activity-title {
  flex: 1;
  color: #374151;
  font-size: 0.9rem;
}

.no-activities {
  text-align: center;
  color: #9ca3af;
  font-style: italic;
  padding: 1rem;
  margin: 0;
}

.missing-activities-alert {
  margin-top: 2rem;
}

.alert {
  padding: 1.5rem;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.alert-warning {
  background: linear-gradient(135deg, #fff5e6 0%, #ffe6cc 100%);
  border-left: 4px solid #f59e0b;
}

.alert strong {
  display: block;
  color: #92400e;
  font-size: 1.1rem;
}

.alert p {
  color: #78350f;
  margin: 0;
  font-size: 0.95rem;
}
```

---

## 🧪 Testes

### Cenário 1: Curso com Atividades Completas
1. Selecionar "Krav Maga - Faixa Branca"
2. Verificar análise de atividades mostra 100% com atividades
3. Gerar plano → deve usar atividades existentes
4. Verificar nenhuma atividade nova criada

### Cenário 2: Curso sem Atividades
1. Selecionar "Jiu-Jitsu - Iniciante" (sem atividades)
2. Verificar análise mostra 0% com atividades
3. Clicar "Gerar com Atividades Automáticas"
4. Verificar criação automática de atividades
5. Verificar logs mostrando "X atividades criadas"
6. Recarregar análise → deve mostrar atividades criadas

### Cenário 3: Curso com Atividades Parciais
1. Selecionar curso com 50% de atividades
2. Verificar análise mostra técnicas com/sem atividades
3. Gerar plano → cria apenas atividades faltantes
4. Verificar uso de atividades existentes + novas

---

## 📊 Métricas de Sucesso

- ✅ 100% dos planos gerados com atividades vinculadas
- ✅ Redução de 80% no tempo manual de criação de atividades
- ✅ Atividades criadas automaticamente com qualidade (validação manual)
- ✅ UI intuitiva mostrando análise clara de atividades
- ✅ Logs detalhados de geração (atividades criadas, técnicas usadas)
- ✅ Zero erros de sincronização entre planos e atividades

---

## 🚀 Próximos Passos

1. **Validar premissa**: Confirmar com usuário se técnicas do curso são a base correta
2. **Iniciar Sprint 1**: Criar endpoints backend
3. **Testar backend**: Validar geração de atividades via AI
4. **Sprint 2**: Implementar UI frontend
5. **Sprint 3**: Polish e testes E2E
6. **Deploy**: Validação com usuários reais

---

**Status**: 📋 Aguardando confirmação do usuário sobre premissas
