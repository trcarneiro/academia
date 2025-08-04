# 🎯 PROJETO: SISTEMA DE CONTROLE DE FREQUÊNCIA E GRADUAÇÃO

**Baseado em:** CLAUDE.md v2.0 - Análise e Planejamento Obrigatório  
**Criado em:** 01/08/2025  
**Status:** Planejamento Aprovado ✅

## 📊 ESTRUTURA HIERÁRQUICA DO NEGÓCIO

### **🎯 Hierarquia Principal:**
```
PLANO → CURSO → AULAS → TÉCNICAS
  ↓       ↓       ↓        ↓
Plan   Course   Class  Technique
```

### **👤 Fluxo do Aluno:**
```
ALUNO → PLANO → TURMA → AULA DO DIA → TÉCNICAS EXECUTADAS
  ↓       ↓       ↓         ↓             ↓
Student  Plan   Group   Daily Class   Attendance
```

### **📋 Definições do Negócio:**
- **PLANO:** Programa estruturado (ex: "Krav Maga Iniciante 6 meses")
- **CURSO:** Sequência de aulas dentro do plano (ex: "Fundamentos - 40 aulas")
- **TURMA:** Cronograma + alunos + instrutor (ex: "Segunda/Quarta 19h")
- **AULA:** Sessão específica com técnicas definidas (ex: "Aula 1: Postura")
- **TÉCNICA:** Exercício específico (posições, alongamentos, drills, combos)

### **📅 Exemplo Prático de Controle:**
```
Data: 01/06/25
Aluno: João Silva
Plano: Krav Maga Iniciante
Turma: Segunda/Quarta 19h
Aula: Aula 1 - Fundamentos
Técnicas:
  ✅ Postura de guarda - Executada
  ✅ Movimentação lateral - Executada  
  ❌ Soco direto - Não executada
  ✅ Alongamento final - Executada
```

## 🔬 ANÁLISE TÉCNICA (CLAUDE.md STEP 1)

### **📊 Impact Analysis:**
**Módulos Afetados:**
- ✅ **Students Module** (existente - referência)
- ✅ **Plans Module** (existente - base dos planos)  
- ❓ **Courses Module** (em desenvolvimento - problema de carregamento)
- 🆕 **Classes Module** (novo - aulas específicas)
- 🆕 **Techniques Module** (novo - técnicas/exercícios)
- 🆕 **Attendance Module** (novo - controle de presença)
- 🆕 **Progress Module** (novo - acompanhamento)
- 🆕 **Graduation Module** (novo - avaliação e graduação)

### **🏗️ Architectural Blueprint:**
```
/public/js/modules/
├── students.js ✅ (referência CLAUDE.md)
├── plans.js ✅ (existente)
├── courses.js ⚠️ (corrigir problema de carregamento)
├── classes.js 🆕 (novo - gerenciamento de aulas)
├── techniques.js 🆕 (novo - biblioteca de técnicas)
├── attendance.js 🆕 (novo - controle de frequência)
├── progress.js 🆕 (novo - dashboards de progresso)
└── graduation.js 🆕 (novo - sistema de graduação)

/public/views/
├── students.html ✅
├── plans.html ✅
├── courses.html ⚠️
├── classes.html 🆕
├── techniques.html 🆕
├── attendance.html 🆕
├── progress.html 🆕
└── graduation.html 🆕
```

### **⚠️ Risk Assessment:**
- **Complexidade:** 8 módulos interconectados hierarquicamente
- **Dependências:** Sistema existente de Students e Plans como base
- **Protected Modules:** PlansManager e ModuleLoader (não modificar)
- **Critical:** Courses Module com problema de carregamento atual

### **🎯 API-First Contract:**
```javascript
// Estrutura hierárquica de APIs
GET /api/plans/:planId/courses
GET /api/courses/:courseId/classes  
GET /api/classes/:classId/techniques
GET /api/students/:studentId/attendance
GET /api/students/:studentId/progress
GET /api/attendance/class/:classId/date/:date
POST /api/attendance/record
PUT /api/progress/evaluate
GET /api/graduation/requirements/:level
```

## 📝 PLANO DE EXECUÇÃO (CLAUDE.md STEP 2)

### **🏁 TASK 1: Verificação e Correção do Módulo Courses**
**Prioridade:** CRÍTICA (Base para tudo)  
**Status:** 🚨 PROBLEMA ATIVO - course-editor não carrega

**Problema Atual:**
- HTML carregado mas DOM `.course-editor-isolated` não encontrado
- JavaScript aguarda 30 tentativas mas `innerHTML.length = 0`
- Sistema de navegação SPA com timing incorreto

**Subtasks:**
1.1. Verificar APIs existentes `/api/courses`
1.2. Corrigir sistema de carregamento DOM 
1.3. Implementar course-editor funcional
1.4. Integração com Plans Module

**Files:**
- `public/js/modules/courses.js` (corrigir problema de timing)
- `public/views/course-editor.html` (verificar estrutura)
- `public/index.html` (corrigir carregamento de módulos)

---

### **🎓 TASK 2: Módulo Classes (Aulas)**
**Prioridade:** ALTA (Dependência: Task 1)  
**Pattern:** "Uma Ação = Uma Tela" (CLAUDE.md)

**Campos Classes:**
```javascript
{
  course_id: UUID,
  name: "Aula 1: Fundamentos",
  description: "Introdução aos princípios básicos",
  order: 1, // Sequência da aula
  duration_minutes: 60,
  objectives: ["Postura", "Distância"],
  equipment_needed: ["Tatame", "Protetor bucal"],
  difficulty_level: "EASY", // EASY|MEDIUM|HARD
  total_techniques: 4
}
```

**Files:**
- `public/js/modules/classes.js` (novo)
- `public/views/classes.html` (novo)
- `public/views/class-editor.html` (novo)
- `public/css/modules/classes.css` (novo)
- API: `/api/classes` (novo)

---

### **🥋 TASK 3: Módulo Techniques (Técnicas)**
**Prioridade:** ALTA (Dependência: Task 2)

**Campos Techniques:**
```javascript
{
  class_id: UUID,
  name: "Soco Direto",
  description: "Técnica básica de ataque direto",
  order: 1,
  instructions: "1. Posicione o pé...",
  safety_tips: "Mantenha o punho alinhado...",
  video_url: "https://...",
  difficulty: "BASIC", // BASIC|INTERMEDIATE|ADVANCED
  technique_type: "STRIKE", // STRIKE|DEFENSE|GRAPPLE|COMBO
  body_part: "ARMS", // ARMS|LEGS|CORE|FULL_BODY
  practice_time_minutes: 15,
  repetitions: 10
}
```

**Files:**
- `public/js/modules/techniques.js` (novo)
- `public/views/techniques.html` (novo) 
- `public/views/technique-editor.html` (novo)
- API: `/api/techniques` (novo)

---

### **📅 TASK 4: Módulo Attendance (Controle de Frequência)**
**Prioridade:** MÉDIA (Core do Sistema)

**Campos Attendance:**
```javascript
{
  student_id: UUID,
  class_id: UUID,
  date: "2025-06-01",
  present: true,
  techniques_completed: [technique_ids],
  notes: "Aluno teve dificuldade com...",
  instructor_id: UUID,
  duration_minutes: 60
}
```

**Files:**
- `public/js/modules/attendance.js` (novo)
- `public/views/attendance.html` (novo)
- `public/views/attendance-daily.html` (novo)
- API: `/api/attendance` (novo)

---

### **📊 TASK 5: Módulo Progress (Acompanhamento)**
**Prioridade:** MÉDIA (Inteligência do Sistema)

**Métricas Progress:**
```javascript
{
  student_id: UUID,
  total_classes_attended: 15,
  techniques_mastered: 28,
  current_level: "YELLOW_BELT",
  attendance_percentage: 87.5,
  time_training_hours: 25,
  next_graduation_requirements: [
    "Dominar 5 técnicas de defesa",
    "80% presença últimos 3 meses"
  ]
}
```

**Files:**
- `public/js/modules/progress.js` (novo)
- `public/views/progress.html` (novo)
- `public/views/student-progress.html` (novo)
- API: `/api/progress` (novo)

---

### **🏆 TASK 6: Módulo Graduation (Graduação)**
**Prioridade:** BAIXA (Funcionalidade Avançada)

**Sistema de Graduação:**
- Critérios por nível (frequência + técnicas + tempo)
- Avaliações práticas com checklist
- Workflow de aprovação por instrutor
- Histórico e certificados

**Files:**
- `public/js/modules/graduation.js` (novo)
- `public/views/graduation.html` (novo)
- `public/views/graduation-evaluation.html` (novo)
- API: `/api/graduation` (novo)

---

### **🔗 TASK 7: Integração Hierárquica**
**Prioridade:** ALTA (UX Critical)

**Navegação Fluida:**
```
Students → Student Detail → Progress → Attendance History
Plans → Plan Detail → Courses → Classes → Techniques
Attendance → Daily View → Student Details → Technique Evaluation
```

**Files:**
- `public/index.html` (atualizar navegação)
- Todos os módulos (breadcrumbs e links)

---

### **🧪 TASK 8: Testes e Validação Final**
**Prioridade:** CRÍTICA (Quality Gate)

**Checklist Final:**
- [ ] Fluxo completo: Plano → Graduação
- [ ] API-First: Nenhum dado hardcoded
- [ ] Performance: Carregamento < 2s
- [ ] UX: "Uma Ação = Uma Tela"
- [ ] Modular: CSS isolado, módulos independentes
- [ ] Mobile: Responsivo completo

## 🎯 CRONOGRAMA DE EXECUÇÃO

### **🚨 FASE 1: BASE (Semana 1)**
- **TASK 1:** Corrigir Courses Module ← **COMEÇAR AQUI**
- **TASK 2:** Implementar Classes Module

### **⚡ FASE 2: CORE (Semana 2)**  
- **TASK 3:** Implementar Techniques Module
- **TASK 4:** Implementar Attendance Module

### **📈 FASE 3: INTELIGÊNCIA (Semana 3)**
- **TASK 5:** Implementar Progress Module
- **TASK 7:** Integração Hierárquica

### **🏆 FASE 4: AVANÇADO (Semana 4)**
- **TASK 6:** Implementar Graduation Module
- **TASK 8:** Testes e Validação Final

## 🎯 BENEFÍCIOS ESPERADOS

### **Para o Instrutor:**
- Controle total de presença e progresso individual
- Planejamento de aulas baseado em dados
- Identificação de alunos que precisam de atenção

### **Para o Aluno:**
- Acompanhamento visual do próprio progresso
- Histórico completo de treinamento
- Clareza sobre requisitos para graduação

### **Para a Academia:**
- Métricas de qualidade de ensino
- Relatórios de performance por turma/instrutor
- Sistema objetivo de graduação

## 🚨 REGRAS CRÍTICAS (CLAUDE.md)

### **✅ OBRIGATÓRIO:**
- **API-First:** Todos os dados vêm da API real
- **Full-Screen:** Uma ação = uma tela completa
- **Modular:** Módulos isolados em `/js/modules/`
- **CSS Isolado:** Prefixo `.module-name-isolated`
- **Verificação:** "Check first, implement second"

### **❌ PROIBIDO:**
- Dados hardcoded ou mock
- Modais ou popups
- Modificação de arquivos core
- Placeholder data (nomes, preços, datas fixas)

---

**Next Action:** Executar TASK 1 - Correção do módulo Courses