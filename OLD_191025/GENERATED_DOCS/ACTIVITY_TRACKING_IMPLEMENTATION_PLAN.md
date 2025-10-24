# Plano de Implementação: Sistema de Rastreamento de Atividades

**Criado em**: 06/10/2025  
**Estimativa Total**: 18-24 horas (3-4 dias úteis)  
**Status Atual**: Fase 1 completa (Schema), iniciando Fase 2 (Backend)

---

## 📊 Visão Geral do Sistema

### **Funcionalidade**
Sistema que permite rastreamento individual da execução de atividades do plano de aula por aluno, com dois modos de operação:

1. **Modo Automático**: No check-in, todas as atividades são marcadas como completas
2. **Modo Manual**: Professor valida manualmente cada atividade durante a aula

### **Principais Benefícios**
- ✅ Professores sabem exatamente quem fez cada atividade
- ✅ Alunos diferentes podem seguir planos diferentes na mesma aula
- ✅ Estatísticas detalhadas de performance individual e coletiva
- ✅ Flexibilidade: academia escolhe nível de controle (auto vs manual)

---

## 🎯 Fases de Implementação

### ✅ **Fase 1: Schema Prisma** - COMPLETA (06/10/2025)
**Duração**: 2 horas  
**Status**: ✅ 100%

**Tarefas Completadas**:
- [x] Adicionar modelo `LessonActivityExecution`
- [x] Adicionar modelo `ActivityTrackingSettings`
- [x] Modificar `TurmaAttendance` (adicionar relação `activityExecutions`)
- [x] Modificar `LessonPlanActivity` (adicionar relação `executions`)
- [x] Modificar `Instructor` (adicionar relação `activityValidations`)
- [x] Modificar `Organization` (adicionar relação `activityTrackingSettings`)
- [x] Validar schema (`npx prisma format`)
- [x] Sincronizar banco (`npx prisma db push`)

**Bloqueio Atual**:
- ⏸️ Prisma Client regeneração (Windows file lock)
- **Solução**: Usuário deve parar servidor, rodar `.\force-prisma-regen.ps1`, reiniciar

**Documentação**: `ACTIVITY_TRACKING_SCHEMA_COMPLETE.md`

---

### 🔄 **Fase 2: Backend API** - PRÓXIMA
**Duração Estimada**: 4-6 horas  
**Status**: ⏹️ Aguardando Prisma Client  
**Prioridade**: 🔥 ALTA

#### **2.1 Criar Estrutura de Arquivos** (30 min)
```
src/
├── routes/
│   └── activityExecutions.ts          (150 linhas)
├── controllers/
│   └── activityExecutionController.ts (200 linhas)
└── services/
    └── activityExecutionService.ts    (300 linhas)
```

#### **2.2 Implementar Service Layer** (2h)
**Arquivo**: `src/services/activityExecutionService.ts`

**Métodos a Implementar**:
```typescript
class ActivityExecutionService {
  // Marcar atividade como completa (upsert)
  async recordExecution(data: {
    attendanceId: string;
    activityId: string;
    completed: boolean;
    performanceRating?: number;
    actualDuration?: number;
    actualReps?: number;
    notes?: string;
    recordedBy?: string;
  }): Promise<LessonActivityExecution>

  // Buscar execuções de uma aula (visão do instrutor)
  async findByLesson(lessonId: string): Promise<{
    lesson: TurmaLesson;
    students: Array<{
      studentId: string;
      studentName: string;
      activities: Array<{
        activityId: string;
        activityName: string;
        completed: boolean;
        performanceRating?: number;
      }>;
    }>;
    completionRate: number;
  }>

  // Estatísticas de performance de um aluno
  async getStudentStats(
    studentId: string,
    filters?: { startDate?: Date; endDate?: Date; courseId?: string }
  ): Promise<{
    byActivity: Array<{
      activityName: string;
      totalAttempts: number;
      completions: number;
      completionRate: number;
      avgRating: number;
      avgDuration: number;
    }>;
    overallStats: {
      totalActivities: number;
      completedActivities: number;
      completionRate: number;
      avgRating: number;
    };
    trend: 'improving' | 'stable' | 'declining';
  }>

  // Auto-completar atividades no check-in (se configurado)
  async autoCompleteOnCheckin(attendanceId: string): Promise<void>

  // Buscar configurações da organização
  async getSettings(organizationId: string): Promise<ActivityTrackingSettings>
}
```

**Validações Críticas**:
- ✅ Verificar se `attendanceId` e `activityId` pertencem ao mesmo `turmaLessonId`
- ✅ `performanceRating` entre 1-5 quando fornecido
- ✅ Não permitir duplicatas (unique constraint `[attendanceId, activityId]`)
- ✅ Calcular tendência baseado em últimas 5 aulas

#### **2.3 Implementar Controller** (1h)
**Arquivo**: `src/controllers/activityExecutionController.ts`

**Endpoints a Implementar**:
```typescript
// POST /api/lesson-activity-executions
async recordExecution(request, reply)

// GET /api/lesson-activity-executions/lesson/:lessonId
async getLessonExecutions(request, reply)

// GET /api/lesson-activity-executions/student/:studentId/stats
async getStudentStats(request, reply)

// PATCH /api/lesson-activity-executions/:id
async updateExecution(request, reply)

// DELETE /api/lesson-activity-executions/:id
async deleteExecution(request, reply)
```

**Validação de Request**:
- Usar Zod schemas para validar body/params/query
- Retornar sempre formato padrão: `{ success: boolean, data?: any, message?: string }`

#### **2.4 Criar Rotas Fastify** (30 min)
**Arquivo**: `src/routes/activityExecutions.ts`

```typescript
export default async function activityExecutionsRoutes(fastify: FastifyInstance) {
  // POST / - Registrar execução
  fastify.post('/', {
    schema: {
      body: {
        type: 'object',
        required: ['attendanceId', 'activityId'],
        properties: {
          attendanceId: { type: 'string' },
          activityId: { type: 'string' },
          completed: { type: 'boolean' },
          performanceRating: { type: 'integer', minimum: 1, maximum: 5 },
          actualDuration: { type: 'integer' },
          actualReps: { type: 'integer' },
          notes: { type: 'string' },
          recordedBy: { type: 'string' }
        }
      }
    },
    handler: activityExecutionController.recordExecution
  });

  // GET /lesson/:lessonId - Visão da turma
  fastify.get('/lesson/:lessonId', {
    schema: {
      params: {
        type: 'object',
        properties: {
          lessonId: { type: 'string' }
        }
      }
    },
    handler: activityExecutionController.getLessonExecutions
  });

  // GET /student/:studentId/stats - Estatísticas
  fastify.get('/student/:studentId/stats', {
    schema: {
      params: {
        type: 'object',
        properties: {
          studentId: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          startDate: { type: 'string', format: 'date' },
          endDate: { type: 'string', format: 'date' },
          courseId: { type: 'string' }
        }
      }
    },
    handler: activityExecutionController.getStudentStats
  });

  // PATCH /:id - Atualizar execução
  fastify.patch('/:id', {
    handler: activityExecutionController.updateExecution
  });

  // DELETE /:id - Deletar execução
  fastify.delete('/:id', {
    handler: activityExecutionController.deleteExecution
  });
}
```

#### **2.5 Registrar no Server** (10 min)
**Arquivo**: `src/server.ts`

```typescript
// Adicionar após outras rotas
fastify.register(activityExecutionsRoutes, { prefix: '/api/lesson-activity-executions' });
```

#### **2.6 Integrar com Check-in** (1h)
**Arquivo**: `src/services/attendanceService.ts` (modificar)

**No método `recordAttendance`**:
```typescript
// Após criar TurmaAttendance
const attendance = await prisma.turmaAttendance.create({ ... });

// Verificar configurações de auto-complete
const settings = await activityExecutionService.getSettings(organizationId);
if (settings?.autoCompleteOnCheckin) {
  await activityExecutionService.autoCompleteOnCheckin(attendance.id);
}
```

#### **2.7 Testes Backend** (30 min)
**Arquivo**: `tests/activityExecutions.test.ts`

**Casos de Teste**:
```typescript
describe('ActivityExecutionService', () => {
  it('deve registrar execução de atividade', async () => { ... });
  it('deve buscar execuções por aula', async () => { ... });
  it('deve calcular estatísticas de aluno', async () => { ... });
  it('deve auto-completar no check-in quando configurado', async () => { ... });
  it('deve rejeitar performanceRating fora do range 1-5', async () => { ... });
});
```

**Checklist Fase 2**:
- [ ] `activityExecutionService.ts` implementado e testado
- [ ] `activityExecutionController.ts` implementado
- [ ] `activityExecutions.ts` rotas registradas
- [ ] Integração com check-in funcionando (auto-complete)
- [ ] Testes unitários passando
- [ ] Endpoints documentados no Swagger
- [ ] Testado manualmente via Postman/Insomnia

---

### 🔄 **Fase 3: Frontend - Live Lesson Tracking** - PRÓXIMA
**Duração Estimada**: 8-10 horas  
**Status**: ⏹️ Aguardando Fase 2  
**Prioridade**: 🔥 ALTA

#### **3.1 Criar Módulo Principal** (4h)
**Arquivo**: `public/js/modules/lesson-execution/index.js` (500 linhas)

**Estrutura do Módulo**:
```javascript
const LessonExecutionModule = {
  // State
  lessonId: null,
  lessonData: null,
  settings: null,
  moduleAPI: null,
  pollInterval: null,
  
  // Lifecycle
  async init(lessonId) { 
    this.lessonId = lessonId;
    await this.initializeAPI();
    await this.loadSettings();
    await this.loadLessonData();
    this.render();
    this.setupEvents();
    this.startPolling();
  },
  
  async loadLessonData() {
    await this.moduleAPI.fetchWithStates(
      `/api/lesson-activity-executions/lesson/${this.lessonId}`,
      {
        loadingElement: document.getElementById('lesson-execution-container'),
        onSuccess: (data) => {
          this.lessonData = data.data;
          this.render();
        }
      }
    );
  },
  
  // Rendering
  render() {
    const container = document.getElementById('lesson-execution-container');
    container.innerHTML = `
      ${this.renderHeader()}
      ${this.renderActivitiesSummary()}
      ${this.renderStudentGrid()}
      ${this.renderActions()}
    `;
  },
  
  renderHeader() {
    return `
      <div class="module-header-premium">
        <h1>🥋 ${this.lessonData.lesson.title}</h1>
        <nav class="breadcrumb">
          Home > Turmas > ${this.lessonData.lesson.turma.name} > Aula ao Vivo
        </nav>
        <div class="lesson-meta">
          <span>📅 ${formatDate(this.lessonData.lesson.scheduledDate)}</span>
          <span>👥 ${this.lessonData.students.length} alunos presentes</span>
          <span class="completion-badge ${this.getCompletionClass()}">
            ${this.lessonData.completionRate.toFixed(1)}% completo
          </span>
        </div>
      </div>
    `;
  },
  
  renderActivitiesSummary() {
    const activities = this.getLessonPlanActivities();
    return `
      <div class="activities-summary">
        <h2>📋 Plano de Aula (${activities.length} atividades)</h2>
        <ul class="activity-list">
          ${activities.map(activity => `
            <li class="activity-item ${activity.completed ? 'completed' : ''}">
              <span class="activity-icon">${activity.segment.icon}</span>
              <span class="activity-name">${activity.name}</span>
              <span class="activity-duration">${activity.duration} min</span>
              <span class="completion-rate">${activity.completionRate}% completo</span>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  },
  
  renderStudentGrid() {
    return `
      <div class="student-grid">
        <h2>👥 Alunos e Execuções Individuais</h2>
        <div class="grid-container">
          ${this.lessonData.students.map(student => `
            <div class="student-card" data-student-id="${student.studentId}">
              <div class="student-header">
                <img src="${student.avatarUrl || '/assets/default-avatar.png'}" 
                     alt="${student.studentName}" class="student-avatar">
                <h3>${student.studentName}</h3>
                <span class="student-completion">
                  ${this.getStudentCompletionRate(student)}%
                </span>
              </div>
              <div class="activity-checklist">
                ${student.activities.map(activity => `
                  <div class="activity-execution" data-activity-id="${activity.activityId}">
                    <label class="checkbox-wrapper">
                      <input type="checkbox" 
                             ${activity.completed ? 'checked' : ''}
                             onchange="lessonExecution.toggleActivity(
                               '${student.studentId}', 
                               '${activity.activityId}',
                               this.checked
                             )">
                      <span>${activity.activityName}</span>
                    </label>
                    ${this.settings.enablePerformanceRating ? `
                      <div class="rating-stars">
                        ${[1,2,3,4,5].map(rating => `
                          <button 
                            class="star ${activity.performanceRating >= rating ? 'active' : ''}"
                            onclick="lessonExecution.rateActivity(
                              '${student.studentId}',
                              '${activity.activityId}',
                              ${rating}
                            )">⭐</button>
                        `).join('')}
                      </div>
                    ` : ''}
                    <button class="btn-notes" 
                            onclick="lessonExecution.openNotesModal(
                              '${student.studentId}',
                              '${activity.activityId}'
                            )">📝 Notas</button>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },
  
  // Actions
  async toggleActivity(studentId, activityId, completed) {
    const attendance = this.findAttendance(studentId);
    await this.moduleAPI.request('/api/lesson-activity-executions', {
      method: 'POST',
      body: JSON.stringify({
        attendanceId: attendance.id,
        activityId: activityId,
        completed: completed,
        recordedBy: this.getCurrentInstructorId()
      })
    });
    await this.loadLessonData(); // Refresh
  },
  
  async rateActivity(studentId, activityId, rating) {
    const attendance = this.findAttendance(studentId);
    await this.moduleAPI.request('/api/lesson-activity-executions', {
      method: 'POST',
      body: JSON.stringify({
        attendanceId: attendance.id,
        activityId: activityId,
        performanceRating: rating,
        recordedBy: this.getCurrentInstructorId()
      })
    });
    await this.loadLessonData();
  },
  
  openNotesModal(studentId, activityId) {
    // TODO: Implementar modal de notas
  },
  
  // Polling
  startPolling() {
    this.pollInterval = setInterval(() => {
      this.loadLessonData();
    }, 5000); // Atualizar a cada 5 segundos
  },
  
  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  },
  
  // Cleanup
  destroy() {
    this.stopPolling();
  }
};

window.lessonExecution = LessonExecutionModule;
```

#### **3.2 Criar Estilos CSS** (1h)
**Arquivo**: `public/css/modules/lesson-execution.css`

```css
/* Layout principal */
.lesson-execution-container {
  padding: 2rem;
  background: var(--background-color);
}

/* Header com meta info */
.lesson-meta {
  display: flex;
  gap: 1.5rem;
  margin-top: 1rem;
  font-size: 0.95rem;
}

.completion-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-weight: 600;
}

.completion-badge.high { background: #10b981; color: white; }
.completion-badge.medium { background: #f59e0b; color: white; }
.completion-badge.low { background: #ef4444; color: white; }

/* Resumo de atividades */
.activities-summary {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  margin: 1.5rem 0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.activity-list {
  list-style: none;
  padding: 0;
}

.activity-item {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
  transition: background 0.2s;
}

.activity-item:hover {
  background: #f9fafb;
}

.activity-item.completed {
  opacity: 0.7;
  text-decoration: line-through;
}

/* Grid de alunos */
.student-grid {
  margin-top: 2rem;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
}

.student-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.student-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.student-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f3f4f6;
}

.student-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
}

.student-completion {
  margin-left: auto;
  font-weight: 700;
  color: var(--primary-color);
}

/* Checklist de atividades */
.activity-checklist {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.activity-execution {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #f9fafb;
  border-radius: 6px;
  transition: background 0.2s;
}

.activity-execution:hover {
  background: #f3f4f6;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  cursor: pointer;
}

.checkbox-wrapper input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

/* Rating stars */
.rating-stars {
  display: flex;
  gap: 0.25rem;
}

.rating-stars .star {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  opacity: 0.3;
  transition: opacity 0.2s, transform 0.2s;
}

.rating-stars .star.active {
  opacity: 1;
  transform: scale(1.1);
}

.rating-stars .star:hover {
  opacity: 0.8;
  transform: scale(1.15);
}

/* Botão de notas */
.btn-notes {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background 0.2s;
}

.btn-notes:hover {
  background: var(--secondary-color);
}

/* Responsivo */
@media (max-width: 768px) {
  .grid-container {
    grid-template-columns: 1fr;
  }
  
  .activity-execution {
    flex-wrap: wrap;
  }
  
  .rating-stars {
    width: 100%;
    justify-content: center;
  }
}
```

#### **3.3 Integrar com Router** (30 min)
**Arquivo**: `public/js/dashboard/spa-router.js` (modificar)

```javascript
// Adicionar rota
router.registerRoute('lesson-execution/:lessonId', async (params) => {
  console.log('🥋 Carregando interface de execução ao vivo...');
  
  // Carregar assets
  await router.loadModuleAssets('lesson-execution');
  
  // Inicializar módulo
  if (window.lessonExecution) {
    const container = document.getElementById('content');
    container.innerHTML = '<div id="lesson-execution-container"></div>';
    await window.lessonExecution.init(params.lessonId);
  }
});
```

#### **3.4 Adicionar Link no Módulo de Frequência** (1h)
**Arquivo**: `public/js/modules/frequency/index.js` (modificar)

**No método de renderização de aulas**:
```javascript
renderLessonCard(lesson) {
  return `
    <div class="lesson-card" data-lesson-id="${lesson.id}">
      <h3>${lesson.title}</h3>
      <p>📅 ${formatDate(lesson.scheduledDate)}</p>
      <p>👥 ${lesson.attendances.length} presentes</p>
      
      ${lesson.lessonPlanId ? `
        <button class="btn-primary" onclick="frequencyModule.viewLiveExecution('${lesson.id}')">
          🎯 Ver Execução ao Vivo
        </button>
        <button class="btn-secondary" onclick="frequencyModule.viewStats('${lesson.id}')">
          📊 Estatísticas
        </button>
      ` : `
        <p class="text-muted">Sem plano de aula associado</p>
      `}
    </div>
  `;
}

viewLiveExecution(lessonId) {
  window.location.hash = `#lesson-execution/${lessonId}`;
}
```

#### **3.5 Testes Frontend** (1h)
**Cenários de Teste Manual**:
1. Abrir aula ao vivo com 10+ alunos
2. Marcar/desmarcar atividades de diferentes alunos
3. Dar ratings de 1-5 estrelas
4. Verificar atualização automática (polling 5s)
5. Testar responsividade (mobile/tablet/desktop)
6. Verificar integração com Frequência

**Checklist Fase 3**:
- [ ] `lesson-execution/index.js` implementado
- [ ] CSS com design premium aplicado
- [ ] Rota registrada no SPA router
- [ ] Link adicionado no módulo de Frequência
- [ ] Polling de 5s funcionando
- [ ] Rating de estrelas funcional
- [ ] Responsivo em 768/1024/1440px
- [ ] Sem erros no console do navegador

---

### 🔄 **Fase 4: Dashboard de Estatísticas** - PRÓXIMA
**Duração Estimada**: 6-8 horas  
**Status**: ⏹️ Aguardando Fase 3  
**Prioridade**: 🟡 MÉDIA

#### **4.1 Criar Módulo de Estatísticas** (4h)
**Arquivo**: `public/js/modules/stats/activity-performance.js`

**Visualizações**:
- Heatmap de performance (aluno × atividades × tempo)
- Gráfico de linha com tendência (melhorando/estável/declinando)
- Comparação aluno vs média da turma
- Top 5 atividades mais/menos completadas
- Análise de dificuldade por atividade

**Bibliotecas de Gráficos**:
- Chart.js (já usado no projeto)
- ApexCharts (alternativa mais moderna)

#### **4.2 Endpoint de Estatísticas Agregadas** (2h)
**Arquivo**: `src/routes/activityExecutions.ts` (adicionar)

```typescript
// GET /api/lesson-activity-executions/stats/aggregated
fastify.get('/stats/aggregated', {
  schema: {
    querystring: {
      type: 'object',
      properties: {
        organizationId: { type: 'string' },
        startDate: { type: 'string', format: 'date' },
        endDate: { type: 'string', format: 'date' },
        courseId: { type: 'string' }
      },
      required: ['organizationId']
    }
  },
  handler: async (request, reply) => {
    // Retornar:
    // - Top atividades por completion rate
    // - Média de ratings por atividade
    // - Tendências ao longo do tempo
    // - Comparação entre turmas/cursos
  }
});
```

#### **4.3 Integração com Menu** (30 min)
Adicionar item "📊 Estatísticas de Atividades" no menu lateral.

**Checklist Fase 4**:
- [ ] Módulo de estatísticas implementado
- [ ] Gráficos renderizando corretamente
- [ ] Endpoint de estatísticas agregadas funcionando
- [ ] Exportação para PDF/CSV
- [ ] Item de menu adicionado
- [ ] Performance aceitável com 1000+ registros

---

## 📝 Checklist Geral do Projeto

### **Schema & Banco de Dados**
- [x] Modelos Prisma adicionados
- [x] Relações configuradas
- [x] Schema validado (`npx prisma format`)
- [x] Banco sincronizado (`npx prisma db push`)
- [ ] Prisma Client regenerado (bloqueado)

### **Backend**
- [ ] Service layer implementado
- [ ] Controller implementado
- [ ] Rotas registradas
- [ ] Integração com check-in
- [ ] Validações de request
- [ ] Testes unitários
- [ ] Swagger documentado

### **Frontend**
- [ ] Módulo de execução ao vivo
- [ ] CSS premium aplicado
- [ ] Rota no SPA router
- [ ] Integração com Frequência
- [ ] Polling em tempo real
- [ ] Componente de rating
- [ ] Modal de notas
- [ ] Responsivo testado

### **Estatísticas**
- [ ] Módulo de estatísticas
- [ ] Gráficos implementados
- [ ] Endpoint agregado
- [ ] Exportação PDF/CSV
- [ ] Performance otimizada

### **Documentação**
- [x] Schema documentado (`ACTIVITY_TRACKING_SCHEMA_COMPLETE.md`)
- [x] TODO atualizado no `AGENTS.md`
- [ ] README.md atualizado
- [ ] Swagger completo
- [ ] Manual do usuário
- [ ] Changelog atualizado

---

## 🚀 Como Continuar

### **Passo 1: Desbloquear Prisma Client** (URGENTE)
```bash
# Terminal 1: Parar servidor
Ctrl+C

# Terminal 2: Forçar regeneração
.\force-prisma-regen.ps1

# Ou manualmente:
Stop-Process -Name node -Force
Remove-Item -Recurse -Force node_modules\.prisma\client
npx prisma generate

# Reiniciar servidor
npm run dev
```

### **Passo 2: Implementar Backend** (4-6h)
1. Criar `src/services/activityExecutionService.ts`
2. Criar `src/controllers/activityExecutionController.ts`
3. Criar `src/routes/activityExecutions.ts`
4. Registrar rotas em `src/server.ts`
5. Integrar com `attendanceService.ts` (check-in)
6. Testar endpoints via Postman

### **Passo 3: Implementar Frontend** (8-10h)
1. Criar `public/js/modules/lesson-execution/index.js`
2. Criar `public/css/modules/lesson-execution.css`
3. Registrar rota no SPA router
4. Adicionar link no módulo de Frequência
5. Testar interface ao vivo

### **Passo 4: Dashboard de Estatísticas** (6-8h)
1. Criar `public/js/modules/stats/activity-performance.js`
2. Implementar endpoint de estatísticas agregadas
3. Renderizar gráficos com Chart.js
4. Testar performance com dados reais

---

## 🎯 Critérios de Sucesso

### **Técnicos**
- ✅ Todos os testes unitários passando
- ✅ Zero erros no console do navegador
- ✅ API response time < 500ms (endpoint de estatísticas)
- ✅ Frontend rendering < 100ms (lista de alunos)
- ✅ Polling não congestiona servidor (max 1 req/5s por sessão)

### **Funcionais**
- ✅ Check-in automático marca atividades quando configurado
- ✅ Professor consegue marcar/desmarcar atividades durante aula
- ✅ Ratings de 1-5 estrelas funcionam
- ✅ Estatísticas de aluno são precisas
- ✅ Gráficos renderizam corretamente
- ✅ Exportação PDF funciona

### **UX**
- ✅ Interface intuitiva (professor aprende em < 2 minutos)
- ✅ Feedback visual imediato (checkboxes, ratings)
- ✅ Responsivo em tablet (uso principal)
- ✅ Sem travamentos com 20+ alunos

---

## 📊 Estimativas Finais

| Fase | Duração | Status | Bloqueio |
|------|---------|--------|----------|
| 1. Schema Prisma | 2h | ✅ Completo | Prisma Client (Windows) |
| 2. Backend API | 4-6h | ⏹️ Pendente | Aguardando Prisma Client |
| 3. Frontend Live | 8-10h | ⏹️ Pendente | Aguardando Backend |
| 4. Dashboard Stats | 6-8h | ⏹️ Pendente | Aguardando Dados Reais |
| **TOTAL** | **20-26h** | **8% completo** | **1 bloqueio crítico** |

**Tempo Efetivo Restante**: 18-24 horas (3-4 dias úteis)

---

## 📚 Referências

- **Documentação**: `ACTIVITY_TRACKING_SCHEMA_COMPLETE.md`
- **Schema**: `prisma/schema.prisma` (linhas 1563-1650)
- **AGENTS.md**: TODO atualizado com todas as tarefas
- **Swagger**: http://localhost:3000/docs (endpoints a adicionar)
- **Módulo Referência**: `public/js/modules/students/` (estrutura similar)

---

**Atualizado por**: GitHub Copilot  
**Data**: 06/10/2025  
**Próxima Ação**: Desbloquear Prisma Client e iniciar Fase 2 (Backend)
