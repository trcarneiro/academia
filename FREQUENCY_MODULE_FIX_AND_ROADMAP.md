# Módulo de Frequência - Correção + Roadmap Completo

**Data**: 07/10/2025  
**Status**: 🔧 EM DESENVOLVIMENTO  
**Visão**: Sistema completo de gestão de frequência quantitativa + integração com Avaliações (qualitativo)

---

## 🐛 CORREÇÃO APLICADA: Erro de Sintaxe ES6

### **Problema**
```
Uncaught SyntaxError: Cannot use import statement outside a module
Uncaught SyntaxError: Unexpected token 'export'
```

**Arquivos Afetados**:
- `frequencyController.js`
- `attendanceList.js`
- `checkinView.js`
- `historyView.js`

### **Causa Raiz**
O método `loadJS()` do `spa-router.js` **não estava detectando** arquivos do módulo `frequency/` como ES6 modules.

**Código Anterior** (linha 165-180):
```javascript
// Verificar se é um módulo ES6 (baseado no caminho)
if (url.includes('student-editor') || url.includes('techniques') || 
    url.includes('students/index.js') || url.includes('lesson-plans') ||
    url.includes('services/')) {
    script.type = 'module';  // ❌ services/ não funcionou para frequency
}
```

### **Solução Aplicada**
```javascript
// ✅ CORRIGIDO: Adicionadas todas as pastas de módulos MVC
if (url.includes('student-editor') || url.includes('techniques') || 
    url.includes('students/index.js') || url.includes('lesson-plans') ||
    url.includes('services/') || url.includes('controllers/') || 
    url.includes('components/') || url.includes('views/') ||
    url.includes('frequency/') || url.includes('agenda/') ||
    url.includes('activities/')) {
    script.type = 'module';
}
```

**Arquivo Modificado**: `public/js/dashboard/spa-router.js` (linha 165-180)

### **Validação**
```bash
# 1. Recarregar página (Ctrl+F5)
# 2. Clicar em "Frequência" no menu
# 3. Verificar console - DEVE mostrar:
✅ [Router] Route 'frequency' registered
📊 Inicializando módulo de frequência...
✅ [FrequencyController] Initialized successfully

# 4. NÃO deve mostrar:
❌ Uncaught SyntaxError: Cannot use import statement outside a module
```

---

## 🎯 VISÃO GERAL DO SISTEMA

### **Frequência = QUANTITATIVO**
- ✅ Check-ins (presença/ausência)
- ✅ Horários de entrada/saída
- ✅ Total de aulas participadas
- ✅ Taxa de assiduidade (%)
- ✅ Estatísticas agregadas

### **Avaliações = QUALITATIVO** (módulo separado)
- 📊 Performance em atividades (rating 1-5)
- 📝 Observações do instrutor
- 🎯 Progresso técnico
- 💪 Pontos fortes/fracos
- ⭐ Avaliação geral por faixa

### **Graduação = COMBINADO**
```
Liberação para Exame = 
    (Frequência >= 75%) 
    AND 
    (Avaliação Qualitativa >= "Apto")
```

---

## 📋 FUNCIONALIDADES DO MÓDULO DE FREQUÊNCIA

### **1. Dashboard de Estatísticas** 🎯 (TODO #3)

#### **Cards Principais**
```javascript
┌──────────────────────┬──────────────────────┐
│ Check-ins Hoje       │ Alunos Presentes     │
│      42              │       38             │
│ +12% vs ontem        │ 📊 90.5%            │
└──────────────────────┴──────────────────────┘

┌──────────────────────┬──────────────────────┐
│ Aulas Ativas         │ Alunos Faltando      │
│       3              │       5              │
│ 🕐 Em andamento     │ ⚠️ Com plano ativo  │
└──────────────────────┴──────────────────────┘
```

**Endpoint Backend**: `GET /api/frequency/dashboard-stats`
```typescript
{
  todayCheckins: number;
  presentStudents: number;
  activeClasses: number;
  studentsWithPlansMissing: {
    count: number;
    list: Array<{
      id: string;
      name: string;
      lastAttendance: Date;
      planName: string;
    }>;
  };
  comparisonYesterday: {
    checkinsChange: number; // +12%
    attendanceRate: number;  // 90.5%
  };
}
```

#### **Gráficos**
1. **Frequência por Dia da Semana** (Chart.js Bar)
   - Média de check-ins seg-dom últimos 30 dias
   - Cores: Verde (alta), Amarelo (média), Vermelho (baixa)

2. **Top 10 Alunos Mais Assíduos** (Chart.js Horizontal Bar)
   - Nome + % presença últimos 30 dias
   - Avatar + badge de ranking

3. **Taxa de Presença por Turma** (Chart.js Doughnut)
   - % por curso/turma
   - Tooltip com nomes de alunos faltosos

**Endpoint Backend**: `GET /api/frequency/charts-data`
```typescript
{
  weeklyStats: Array<{ day: string; avgCheckins: number }>;
  topStudents: Array<{ id: string; name: string; attendanceRate: number; avatar?: string }>;
  classesByAttendance: Array<{ classId: string; className: string; attendanceRate: number }>;
}
```

---

### **2. Histórico de Aulas** 📖 (TODO #4)

#### **Interface**
```
┌───────────────────────────────────────────────────────────┐
│ 🔍 Buscar: [___________]  🗓️ Data: [____] 👨‍🏫 Instrutor: [____] │
├───────────────────────────────────────────────────────────┤
│ Data/Hora          │ Curso       │ Instrutor │ Presentes │
├────────────────────┼─────────────┼───────────┼───────────┤
│ 📅 06/10 - 19:00  │ Krav Maga   │ João      │ 25/30     │ ⯈
│ 📅 06/10 - 18:00  │ Defesa      │ Maria     │ 18/22     │ ⯈
│ 📅 05/10 - 19:00  │ Krav Maga   │ João      │ 28/30     │ ⯈
└────────────────────┴─────────────┴───────────┴───────────┘

[Clique na linha para expandir lista de participantes]
```

#### **Expansão de Linha**
```
▼ 06/10 - 19:00 | Krav Maga | João | 25/30
  ┌─────────────────────────────────────────┐
  │ 👤 Ana Silva       ✅ 18:55 - 20:05    │
  │ 👤 Bruno Costa     ✅ 19:02 - 20:10    │
  │ 👤 Carla Souza     ✅ 18:58 - 20:03    │
  │ ...                                     │
  │ ❌ Pedro Lima      (FALTOU)            │ [+ Check-in Manual]
  └─────────────────────────────────────────┘
```

**Endpoint Backend**: `GET /api/frequency/lessons-history`
```typescript
{
  lessons: Array<{
    id: string;
    date: Date;
    startTime: string;
    endTime: string;
    courseId: string;
    courseName: string;
    instructorId: string;
    instructorName: string;
    totalExpected: number;
    totalPresent: number;
    attendances: Array<{
      studentId: string;
      studentName: string;
      studentAvatar?: string;
      checkinTime: Date;
      checkoutTime?: Date;
      status: 'present' | 'absent';
    }>;
  }>;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}
```

---

### **3. Check-ins Tempo Real** ⚡ (TODO #5)

#### **Interface**
```
┌───────────────────────────────────────────────────────────┐
│ 🔴 AO VIVO - Atualização automática (5s)                 │
│ 🔍 Filtrar: [Todos os cursos ▼]  [Todas as turmas ▼]    │
├───────────────────────────────────────────────────────────┤
│ Hora   │ Aluno              │ Curso       │ Status        │
├────────┼────────────────────┼─────────────┼───────────────┤
│ 19:05  │ 👤 Ana Silva      │ Krav Maga   │ 🟢 Presente   │
│ 19:03  │ 👤 Bruno Costa    │ Krav Maga   │ 🟢 Presente   │
│ 19:00  │ 👤 Carla Souza    │ Defesa      │ 🟡 Em aula    │
│ 18:58  │ 👤 Diego Lima     │ Krav Maga   │ 🔴 Saiu       │
└────────┴────────────────────┴─────────────┴───────────────┘

[⏸️ Pausar] [🔄 Atualizar Agora] [+ Check-in Manual]
```

**Endpoint Backend**: `GET /api/frequency/live-checkins`
```typescript
{
  checkins: Array<{
    id: string;
    studentId: string;
    studentName: string;
    studentAvatar?: string;
    courseId: string;
    courseName: string;
    turmaId: string;
    turmaName: string;
    checkinTime: Date;
    checkoutTime?: Date;
    status: 'checked-in' | 'in-class' | 'checked-out';
  }>;
  lastUpdate: Date;
}
```

**Polling Implementation**:
```javascript
const FrequencyLiveView = {
  pollingInterval: null,
  
  startPolling() {
    this.pollingInterval = setInterval(() => {
      this.refreshCheckins();
    }, 5000); // 5 segundos
  },
  
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  },
  
  async refreshCheckins() {
    const response = await moduleAPI.request('/api/frequency/live-checkins');
    this.renderCheckins(response.data);
  }
};
```

---

### **4. Check-in Manual** ➕ (TODO #6)

#### **Botão no Histórico**
```
[+ Check-in Manual] → Abre modal
```

#### **Modal de Check-in Manual**
```
┌─────────────────────────────────────────────┐
│         ➕ Adicionar Check-in Manual        │
├─────────────────────────────────────────────┤
│                                             │
│ 🔍 Buscar Aluno:                           │
│ [_________________________] [Buscar]       │
│                                             │
│ 👤 Resultados:                             │
│ ┌─────────────────────────────────────┐   │
│ │ ○ Ana Silva (Plano Mensal - Ativo) │   │
│ │ ○ Bruno Costa (Plano Trimestral)   │   │
│ └─────────────────────────────────────┘   │
│                                             │
│ 📅 Aula:                                   │
│ [Selecionar aula ▼]                        │
│                                             │
│ 🕐 Horário de Entrada:                     │
│ [19:05] (Agora)                            │
│                                             │
│ 📝 Observação (opcional):                  │
│ [_____________________________]            │
│                                             │
│    [❌ Cancelar]      [✅ Adicionar]       │
└─────────────────────────────────────────────┘
```

**Endpoint Backend**: `POST /api/frequency/manual-checkin`
```typescript
Request:
{
  studentId: string;
  turmaLessonId: string;
  checkinTime: Date;
  notes?: string;
  createdBy: string; // instructorId
}

Response:
{
  success: true;
  data: {
    attendanceId: string;
    studentName: string;
    lessonDate: Date;
    courseName: string;
  };
}
```

#### **Remover Check-in**
```javascript
// Botão "🗑️ Remover" em cada check-in (apenas admin/instrutor)
async removeCheckin(attendanceId) {
  const confirm = await window.app.confirm({
    title: 'Remover Check-in?',
    message: 'Esta ação não pode ser desfeita. Confirmar remoção?',
    confirmText: 'Sim, Remover',
    cancelText: 'Cancelar',
    type: 'danger'
  });
  
  if (confirm) {
    await moduleAPI.request(`/api/frequency/checkin/${attendanceId}`, {
      method: 'DELETE'
    });
    
    this.refreshData();
  }
}
```

**Endpoint Backend**: `DELETE /api/frequency/checkin/:id`
```typescript
Response:
{
  success: true;
  message: 'Check-in removido com sucesso';
}
```

---

### **5. Alunos Faltosos com Plano Ativo** ⚠️ (TODO #7)

#### **Card no Dashboard**
```
┌─────────────────────────────────────────────────────────┐
│ ⚠️ Alunos com Planos Ativos Faltando (5)              │
│ (Sem check-in nos últimos 7 dias)                      │
├─────────────────────────────────────────────────────────┤
│ 👤 Pedro Lima                                           │
│    💳 Plano Mensal - Ativo até 15/10                   │
│    📅 Última presença: 28/09 (9 dias atrás)            │
│    [📧 Enviar Lembrete]                                 │
├─────────────────────────────────────────────────────────┤
│ 👤 Maria Santos                                         │
│    💳 Plano Trimestral - Ativo até 20/11               │
│    📅 Última presença: 30/09 (7 dias atrás)            │
│    [📧 Enviar Lembrete]                                 │
├─────────────────────────────────────────────────────────┤
│ ... (ver todos)                                         │
└─────────────────────────────────────────────────────────┘
```

**Endpoint Backend**: `GET /api/frequency/students-missing-with-active-plans`
```typescript
{
  students: Array<{
    id: string;
    name: string;
    avatar?: string;
    planName: string;
    planExpiresAt: Date;
    lastAttendance: Date | null;
    daysAgo: number;
    contactEmail?: string;
    contactPhone?: string;
  }>;
  total: number;
}
```

**Backend Query (Prisma)**:
```typescript
// src/services/frequencyService.ts
async getStudentsMissingWithActivePlans(organizationId: string, daysThreshold = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);
  
  const students = await prisma.student.findMany({
    where: {
      organizationId,
      subscriptions: {
        some: {
          status: 'active',
          expiresAt: {
            gte: new Date() // Plano ainda válido
          }
        }
      }
    },
    include: {
      user: true,
      subscriptions: {
        where: { status: 'active' },
        orderBy: { expiresAt: 'desc' },
        take: 1
      },
      attendances: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });
  
  // Filtrar apenas quem não tem attendance recente
  return students.filter(student => {
    const lastAttendance = student.attendances[0]?.createdAt;
    return !lastAttendance || lastAttendance < cutoffDate;
  }).map(student => ({
    id: student.id,
    name: student.user.name,
    avatar: student.user.avatarUrl,
    planName: student.subscriptions[0]?.packageName || 'Plano Ativo',
    planExpiresAt: student.subscriptions[0]?.expiresAt,
    lastAttendance: student.attendances[0]?.createdAt || null,
    daysAgo: lastAttendance ? 
      Math.floor((Date.now() - lastAttendance.getTime()) / (1000 * 60 * 60 * 24)) : 
      999,
    contactEmail: student.user.email,
    contactPhone: student.user.phone
  }));
}
```

---

## 🔗 INTEGRAÇÃO COM OUTROS MÓDULOS

### **1. Check-in Kiosk → Frequency**
```javascript
// public/js/modules/checkin-kiosk.js
async function recordCheckin(studentId) {
  const response = await fetch('/api/attendance/checkin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId })
  });
  
  // ✅ Após check-in bem-sucedido, dispara evento
  window.dispatchEvent(new CustomEvent('student-checked-in', {
    detail: { studentId, timestamp: new Date() }
  }));
}
```

```javascript
// public/js/modules/frequency/index.js
window.addEventListener('student-checked-in', (event) => {
  console.log('🔔 Novo check-in detectado:', event.detail);
  
  // Atualizar lista de check-ins ao vivo (se estiver na view)
  if (FrequencyModule.currentView === 'live') {
    FrequencyModule.refreshCheckins();
  }
  
  // Atualizar estatísticas do dashboard
  if (FrequencyModule.currentView === 'dashboard') {
    FrequencyModule.refreshStats();
  }
});
```

### **2. Frequency → Módulo de Avaliações** (futuro)
```javascript
// Botão no histórico de aulas: "📊 Ver Avaliações desta Aula"
<button onclick="navigateToEvaluations('${lessonId}')">
  📊 Ver Avaliações
</button>

function navigateToEvaluations(lessonId) {
  window.app.navigate(`evaluations/lesson/${lessonId}`);
}
```

### **3. Frequency + Avaliações → Graduação** (futuro)
```javascript
// GET /api/graduation/eligibility/:studentId
{
  eligible: boolean;
  requirements: {
    attendance: {
      required: 75,      // % mínimo
      current: 82.5,     // % atual (Frequency)
      met: true
    },
    qualitativeEvaluation: {
      required: 'Apto',
      current: 'Apto',   // Avaliações
      met: true
    },
    minimumClasses: {
      required: 24,      // aulas mínimas
      current: 28,       // Frequency
      met: true
    }
  },
  nextExamDate: '2025-11-15T19:00:00Z',
  currentBelt: 'Faixa Branca',
  nextBelt: 'Faixa Amarela'
}
```

---

## 🚀 PLANO DE IMPLEMENTAÇÃO

### **Fase 1: Correção ES6 Modules** ✅ (COMPLETO)
- [x] Corrigir `loadJS()` em `spa-router.js`
- [x] Testar carregamento do módulo

### **Fase 2: Dashboard de Estatísticas** 🎯 (PRÓXIMO)
**Estimativa**: 6-8 horas

#### **2.1 Backend (3h)**
- [ ] Criar `GET /api/frequency/dashboard-stats`
- [ ] Criar `GET /api/frequency/charts-data`
- [ ] Query Prisma para alunos faltosos com planos ativos
- [ ] Testes unitários (Vitest)

#### **2.2 Frontend (4h)**
- [ ] Dashboard view com 4 cards principais
- [ ] Integração Chart.js (3 gráficos)
- [ ] Polling 30s para stats ao vivo
- [ ] CSS premium (gradientes, animações)
- [ ] Responsive (3 breakpoints)

#### **2.3 Validação (1h)**
- [ ] Smoke test: navegação → dashboard carrega
- [ ] Dados reais exibidos corretamente
- [ ] Gráficos renderizam sem erros
- [ ] Responsivo em 768/1024/1440

---

### **Fase 3: Histórico de Aulas** 📖
**Estimativa**: 5-6 horas

#### **3.1 Backend (2h)**
- [ ] Criar `GET /api/frequency/lessons-history`
- [ ] Paginação (20 por página)
- [ ] Filtros (data, instrutor, curso)
- [ ] Include attendances + student data

#### **3.2 Frontend (3h)**
- [ ] Tabela com expansão de linhas
- [ ] Busca + filtros (3 campos)
- [ ] Lista de participantes por aula
- [ ] Loading states + empty state
- [ ] CSS premium

#### **3.3 Validação (1h)**
- [ ] Busca funciona
- [ ] Expansão de linhas suave
- [ ] Dados corretos exibidos

---

### **Fase 4: Check-ins Tempo Real** ⚡
**Estimativa**: 4-5 horas

#### **4.1 Backend (1h)**
- [ ] Criar `GET /api/frequency/live-checkins`
- [ ] Filtros (curso, turma)
- [ ] Status (checked-in, in-class, checked-out)

#### **4.2 Frontend (3h)**
- [ ] Live view com polling 5s
- [ ] Filtros dinâmicos
- [ ] Animações de entrada (CSS)
- [ ] Botões pausar/atualizar

#### **4.3 Validação (1h)**
- [ ] Polling funciona
- [ ] Filtros atualizam lista
- [ ] Performance OK (sem memory leaks)

---

### **Fase 5: Check-in Manual + Remoção** ➕
**Estimativa**: 6-7 horas

#### **5.1 Backend (3h)**
- [ ] Criar `POST /api/frequency/manual-checkin`
- [ ] Criar `DELETE /api/frequency/checkin/:id`
- [ ] Validações (role-based auth)
- [ ] Auditoria (log de operações manuais)

#### **5.2 Frontend (3h)**
- [ ] Modal de check-in manual
- [ ] Busca de alunos (autocomplete)
- [ ] Seleção de aula (dropdown)
- [ ] Botão remover (confirm dialog)
- [ ] CSS premium modal

#### **5.3 Validação (1h)**
- [ ] Check-in manual funciona
- [ ] Remoção com confirmação
- [ ] Apenas admin/instrutor vê botões

---

### **Fase 6: Alunos Faltosos com Planos Ativos** ⚠️
**Estimativa**: 4-5 horas

#### **6.1 Backend (2h)**
- [ ] Criar `GET /api/frequency/students-missing-with-active-plans`
- [ ] Query Prisma complexa (subscriptions + attendances)
- [ ] Parâmetro `daysThreshold` (default 7)

#### **6.2 Frontend (2h)**
- [ ] Card no dashboard
- [ ] Lista expansível
- [ ] Botão "Enviar Lembrete" (disabled por enquanto)
- [ ] CSS premium

#### **6.3 Validação (1h)**
- [ ] Lista correta exibida
- [ ] Ordenação por dias desde última presença
- [ ] Performance OK (query otimizada)

---

### **Fase 7: Refatoração Single-File** 📦 (OPCIONAL)
**Estimativa**: 8-10 horas

Seguindo AGENTS.md v2.1, consolidar multi-file em single-file:
- [ ] Migrar para `public/js/modules/frequency/index.js` (único arquivo)
- [ ] Template: `/public/js/modules/instructors/index.js`
- [ ] Manter API client, estados UI, navegação
- [ ] Reduzir de ~7 arquivos para 1 arquivo (~600-800 linhas)

---

## 📚 DOCUMENTAÇÃO ADICIONAL

### **Arquivos de Referência**
- `AGENTS.md` - Padrões arquiteturais (v2.1)
- `AUDIT_REPORT.md` - Status de conformidade de módulos
- `dev/MODULE_STANDARDS.md` - Single-file vs Multi-file
- `FIX_FREQUENCY_MODULE_NOT_OPENING.md` - Correção de rota SPA

### **Módulos Similares (Templates)**
- **Dashboard**: `public/js/modules/students/` (stats + cards)
- **Live Updates**: `public/js/modules/lesson-execution/` (polling)
- **Manual CRUD**: `public/js/modules/instructors/` (single-file CRUD)

---

## ✅ CHECKLIST FINAL

### **Antes de Deploy**
- [ ] Todos os endpoints documentados no Swagger
- [ ] Testes unitários (backend) passando
- [ ] Smoke tests (frontend) OK
- [ ] Zero erros no console do navegador
- [ ] Responsive em 768/1024/1440
- [ ] Loading/empty/error states em TODAS as views
- [ ] Integração AcademyApp (registro + eventos)
- [ ] CSS isolado (`.module-isolated-frequency-*`)
- [ ] Design system compliance (tokens.css)
- [ ] Performance OK (queries < 200ms, polling sem memory leaks)

### **Documentação**
- [ ] README do módulo atualizado
- [ ] Endpoints documentados em Swagger
- [ ] Screenshots das views principais
- [ ] Vídeo demo (opcional)

---

**Próximos Passos**: Implementar Fase 2 (Dashboard de Estatísticas) 🚀
