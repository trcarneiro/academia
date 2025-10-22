# 📚 Plano de Atualização do Importador de Cursos

## 🎯 Objetivo
Atualizar `CourseImportService` para suportar o novo modelo de curso com:
- **Sistema de Graduação** (graus progressivos 20%, 40%, 60%, 80%)
- **Categorias de Atividades** (POSTURAS, SOCOS, CHUTES, DEFESAS, QUEDAS, COMBINAÇÕES)
- **Lessons com Activities** (repetições obrigatórias, multiplicador de intensidade, mínimo para graduação)
- **Checkpoints de Grau** (aulas marcos nas lessons 7, 14, 21, 28, 35)
- **Gamification Expandida** (achievements, milestones, badges)
- **Metadata Completo** (total de repetições, tempo estimado, versão)

---

## 📋 Estrutura do Novo JSON

### 1. **course.graduation** (NOVO)
```json
{
  "currentBelt": "BRANCA",
  "nextBelt": "AMARELA",
  "beltColor": "#FFFFFF",
  "nextBeltColor": "#FFD700",
  
  "progressionSystem": {
    "type": "PERCENTAGE_BASED",
    "totalDegrees": 4,
    "degreePercentageIncrement": 20
  },
  
  "degrees": [
    {
      "degree": 1,
      "name": "1º Grau - Fundamentos",
      "requiredPercentage": 20,
      "requiredLessons": 7,
      "badge": "⭐",
      "color": "#FFD700",
      "keyTechniques": ["postura-guarda-de-boxe", "soco-jab"]
    }
    // ... mais 3 graus
  ],
  
  "requirements": {
    "forGraduation": {
      "minimumAttendanceRate": 80,
      "minimumQualityRating": 3.0,
      "minimumRepetitionsTotal": 500,
      "minimumMonthsEnrolled": 3,
      "requiresInstructorApproval": true,
      "requiresSimulationPass": true
    }
  }
}
```

### 2. **course.activityCategories** (NOVO)
```json
[
  {
    "id": "posturas",
    "name": "POSTURAS E GUARDAS",
    "description": "Posições fundamentais de combate e defesa",
    "color": "#3B82F6",
    "icon": "🥋",
    "order": 1,
    "minimumForGraduation": 100
  }
  // ... mais 5 categorias
]
```

### 3. **course.lessons[].activities** (MODIFICADO)
```json
{
  "lessonNumber": 1,
  "name": "Aula 1 - Introdução ao Krav Maga",
  "durationMinutes": 60,
  "isCheckpoint": false,
  "checkpointType": null,
  "degreeAchieved": null,
  
  "activities": [
    {
      "name": "Soco - Jab",
      "description": "Soco rápido e direto com mão da frente",
      "categoryId": "socos",
      "durationMinutes": 20,
      "repetitionsPerClass": 50,
      "intensityMultiplier": 1.2,
      "minimumForGraduation": 200,
      "keyPoints": ["Rotação do ombro", "Extensão completa do braço"]
    }
  ],
  
  "totalRepetitionsPlanned": 85,
  "estimatedIntensity": "MODERATE"
}
```

### 4. **course.gamification** (EXPANDIDO)
```json
{
  "achievements": [
    {
      "code": "FIRST_PUNCH",
      "name": "Primeiro Soco",
      "description": "Executou seu primeiro jab",
      "icon": "👊",
      "rarity": "COMMON",
      "unlockedAt": "LESSON_1"
    }
  ],
  
  "milestones": [
    { "percentage": 10, "message": "🎯 10% completo! Continue firme!" }
  ]
}
```

### 5. **course.metadata** (NOVO)
```json
{
  "totalPlannedRepetitions": 3850,
  "averageRepetitionsPerLesson": 110,
  "estimatedCompletionTimeWeeks": 18,
  "requiredWeeklyFrequency": 2,
  "version": "2.0.0",
  "author": "Sistema de IA - Academia Krav Maga"
}
```

---

## 🔧 Mudanças Necessárias

### 1. **Interface CourseImportData** (ATUALIZAR)

```typescript
export interface CourseImportData {
  // EXISTENTES (manter)
  courseId: string;
  name: string;
  description: string;
  level: string;
  duration: string; // "6-12 meses"
  totalLessons: number;
  
  // NOVOS CAMPOS
  graduation?: {
    currentBelt: string;
    nextBelt: string;
    beltColor: string;
    nextBeltColor: string;
    progressionSystem: {
      type: string;
      totalDegrees: number;
      degreePercentageIncrement: number;
      description: string;
    };
    degrees: Array<{
      degree: number;
      name: string;
      requiredPercentage: number;
      requiredLessons: number;
      badge: string;
      color: string;
      description: string;
      keyTechniques: string[];
      estimatedWeeks: string;
    }>;
    requirements: {
      forGraduation: {
        minimumAttendanceRate: number;
        minimumQualityRating: number;
        minimumRepetitionsTotal: number;
        minimumMonthsEnrolled: number;
        requiresInstructorApproval: boolean;
        requiresSimulationPass: boolean;
      };
    };
  };
  
  activityCategories?: Array<{
    id: string;
    name: string;
    description: string;
    color: string;
    icon: string;
    order: number;
    minimumForGraduation: number;
  }>;
  
  lessons?: Array<{
    lessonNumber: number;
    name: string;
    description: string;
    durationMinutes: number;
    objectives?: string[];
    isCheckpoint?: boolean;
    checkpointType?: string;
    degreeAchieved?: number;
    completionMessage?: string;
    nextStepMessage?: string;
    celebrationMessage?: string;
    isFinalExam?: boolean;
    
    activities: Array<{
      name: string;
      description: string;
      categoryId: string;
      durationMinutes: number;
      repetitionsPerClass: number;
      intensityMultiplier: number;
      minimumForGraduation?: number;
      keyPoints?: string[];
      notes?: string;
      isEvaluation?: boolean;
      isSimulation?: boolean;
      requiresPass?: boolean;
      passingScore?: number;
    }>;
    
    totalRepetitionsPlanned: number;
    estimatedIntensity?: string;
  }>;
  
  metadata?: {
    totalPlannedRepetitions: number;
    averageRepetitionsPerLesson: number;
    estimatedCompletionTimeWeeks: number;
    requiredWeeklyFrequency: number;
    createdAt: string;
    updatedAt: string;
    version: string;
    author: string;
    notes?: string[];
  };
  
  gamification?: {
    achievements: Array<{
      code: string;
      name: string;
      description: string;
      icon: string;
      rarity: string;
      unlockedAt: string;
    }>;
    milestones: Array<{
      percentage: number;
      message: string;
    }>;
  };
}
```

### 2. **Método importFullCourse** (MODIFICAR)

```typescript
static async importFullCourse(courseData: CourseImportData, organizationId: string, createMissingTechniques: boolean = false) {
  try {
    console.log('🔍 Importing course with new v2.0 structure...');
    console.log('📊 Metadata version:', courseData.metadata?.version || 'legacy');
    
    // 1. Validar técnicas (já existe)
    const techniqueValidation = await this.validateTechniques(courseData.techniques);
    
    // 2. Criar curso principal (já existe)
    const course = await this.createOrUpdateCourse(courseData, organizationId);
    
    // 3. NOVO: Criar sistema de graduação
    if (courseData.graduation) {
      await this.createGraduationSystem(course.id, courseData.graduation);
      console.log('✅ Graduation system created with', courseData.graduation.degrees.length, 'degrees');
    }
    
    // 4. NOVO: Criar categorias de atividades
    if (courseData.activityCategories) {
      await this.createActivityCategories(course.id, courseData.activityCategories);
      console.log('✅ Activity categories created:', courseData.activityCategories.length);
    }
    
    // 5. MODIFICADO: Criar lessons com activities
    if (courseData.lessons) {
      await this.createLessonsWithActivities(course.id, courseData.lessons);
      console.log('✅ Lessons created:', courseData.lessons.length);
    } else {
      // Fallback: usar estrutura antiga de schedule
      await this.createSchedule(course.id, courseData.schedule);
    }
    
    // 6. NOVO: Salvar metadata
    if (courseData.metadata) {
      await this.saveMetadata(course.id, courseData.metadata);
      console.log('✅ Metadata saved');
    }
    
    // 7. MODIFICADO: Setup gamification expandida
    if (courseData.gamification) {
      await this.setupGamificationV2(course.id, courseData.gamification);
      console.log('✅ Gamification v2 configured');
    }
    
    return createResponse.success('Curso v2.0 importado com sucesso', {
      courseId: course.id,
      courseName: course.name,
      version: courseData.metadata?.version || 'legacy',
      graduation: courseData.graduation ? {
        currentBelt: courseData.graduation.currentBelt,
        nextBelt: courseData.graduation.nextBelt,
        degreesCount: courseData.graduation.degrees.length
      } : null,
      activityCategories: courseData.activityCategories?.length || 0,
      lessonsCount: courseData.lessons?.length || 0,
      totalActivities: courseData.lessons?.reduce((sum, l) => sum + l.activities.length, 0) || 0,
      totalRepetitionsPlanned: courseData.metadata?.totalPlannedRepetitions || 0
    });
    
  } catch (error) {
    console.error('❌ Error importing course v2.0:', error);
    return createResponse.error('Erro na importação', { error: error.message });
  }
}
```

### 3. **Novos Métodos a Criar**

#### **createGraduationSystem**
```typescript
private static async createGraduationSystem(courseId: string, graduation: any) {
  // TODO: Criar tabela CourseGraduation se não existir
  // Salvar sistema de graus, requisitos para graduação
  
  for (const degree of graduation.degrees) {
    await prisma.courseDegree.create({
      data: {
        courseId: courseId,
        degree: degree.degree,
        name: degree.name,
        requiredPercentage: degree.requiredPercentage,
        requiredLessons: degree.requiredLessons,
        badge: degree.badge,
        color: degree.color,
        description: degree.description,
        keyTechniques: degree.keyTechniques
      }
    });
  }
}
```

#### **createActivityCategories**
```typescript
private static async createActivityCategories(courseId: string, categories: any[]) {
  // TODO: Criar tabela CourseActivityCategory se não existir
  
  for (const category of categories) {
    await prisma.courseActivityCategory.create({
      data: {
        courseId: courseId,
        categoryId: category.id,
        name: category.name,
        description: category.description,
        color: category.color,
        icon: category.icon,
        order: category.order,
        minimumForGraduation: category.minimumForGraduation
      }
    });
  }
}
```

#### **createLessonsWithActivities**
```typescript
private static async createLessonsWithActivities(courseId: string, lessons: any[]) {
  for (const lesson of lessons) {
    const lessonPlan = await prisma.lessonPlan.create({
      data: {
        courseId: courseId,
        title: lesson.name,
        description: lesson.description,
        lessonNumber: lesson.lessonNumber,
        weekNumber: Math.ceil(lesson.lessonNumber / 2), // Assumir 2 aulas/semana
        objectives: lesson.objectives || [],
        duration: lesson.durationMinutes,
        isCheckpoint: lesson.isCheckpoint || false,
        checkpointType: lesson.checkpointType,
        degreeAchieved: lesson.degreeAchieved,
        totalRepetitionsPlanned: lesson.totalRepetitionsPlanned,
        estimatedIntensity: lesson.estimatedIntensity
      }
    });
    
    // Criar activities da lesson
    for (const activity of lesson.activities) {
      await prisma.lessonPlanActivity.create({
        data: {
          lessonPlanId: lessonPlan.id,
          name: activity.name,
          description: activity.description,
          categoryId: activity.categoryId,
          durationMinutes: activity.durationMinutes,
          repetitionsPerClass: activity.repetitionsPerClass,
          intensityMultiplier: activity.intensityMultiplier,
          minimumForGraduation: activity.minimumForGraduation,
          keyPoints: activity.keyPoints || [],
          notes: activity.notes,
          isEvaluation: activity.isEvaluation || false,
          isSimulation: activity.isSimulation || false
        }
      });
    }
  }
}
```

---

## 📊 Schema Prisma Necessário

```prisma
model CourseGraduation {
  id                    String   @id @default(uuid())
  courseId              String
  currentBelt           String
  nextBelt              String
  beltColor             String
  nextBeltColor         String
  systemType            String   // "PERCENTAGE_BASED"
  totalDegrees          Int
  degreeIncrement       Int      // 20%
  
  course                Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  degrees               CourseDegree[]
  
  @@map("course_graduations")
}

model CourseDegree {
  id                    String   @id @default(uuid())
  graduationId          String
  degree                Int
  name                  String
  requiredPercentage    Int
  requiredLessons       Int
  badge                 String
  color                 String
  description           String
  keyTechniques         String[] // Array de technique IDs
  estimatedWeeks        String?
  
  graduation            CourseGraduation @relation(fields: [graduationId], references: [id], onDelete: Cascade)
  
  @@map("course_degrees")
}

model CourseActivityCategory {
  id                    String   @id @default(uuid())
  courseId              String
  categoryId            String   // "posturas", "socos", etc
  name                  String
  description           String
  color                 String
  icon                  String
  order                 Int
  minimumForGraduation  Int
  
  course                Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  
  @@map("course_activity_categories")
}

model LessonPlanActivity {
  id                    String   @id @default(uuid())
  lessonPlanId          String
  name                  String
  description           String
  categoryId            String
  durationMinutes       Int
  repetitionsPerClass   Int
  intensityMultiplier   Float
  minimumForGraduation  Int?
  keyPoints             String[]
  notes                 String?
  isEvaluation          Boolean  @default(false)
  isSimulation          Boolean  @default(false)
  requiresPass          Boolean  @default(false)
  passingScore          Float?
  
  lessonPlan            LessonPlan @relation(fields: [lessonPlanId], references: [id], onDelete: Cascade)
  executions            LessonActivityExecution[]
  
  @@map("lesson_plan_activities")
}

// Já existe no schema atual
model LessonActivityExecution {
  id                    String   @id @default(uuid())
  activityId            String
  attendanceId          String
  studentId             String
  completed             Boolean  @default(false)
  completedAt           DateTime?
  performanceRating     Int?     // 1-5 estrelas
  repetitionsCompleted  Int?
  durationSeconds       Int?
  notes                 String?
  
  activity              LessonPlanActivity @relation(fields: [activityId], references: [id])
  attendance            TurmaAttendance @relation(fields: [attendanceId], references: [id])
  student               Student @relation(fields: [studentId], references: [id])
  
  @@map("lesson_activity_executions")
}
```

---

## ✅ Checklist de Implementação

### Fase 1: Schema (30min)
- [ ] Criar modelos Prisma: `CourseGraduation`, `CourseDegree`, `CourseActivityCategory`
- [ ] Adicionar campos ao `LessonPlan`: `isCheckpoint`, `checkpointType`, `degreeAchieved`, `totalRepetitionsPlanned`, `estimatedIntensity`
- [ ] Criar modelo `LessonPlanActivity` com todos os campos
- [ ] Rodar migration: `npx prisma migrate dev --name add_course_v2_models`

### Fase 2: Service (1h)
- [ ] Atualizar interface `CourseImportData`
- [ ] Criar método `createGraduationSystem`
- [ ] Criar método `createActivityCategories`
- [ ] Criar método `createLessonsWithActivities`
- [ ] Criar método `saveMetadata`
- [ ] Criar método `setupGamificationV2`
- [ ] Modificar `importFullCourse` para orquestrar tudo

### Fase 3: Frontend (30min)
- [ ] Atualizar exemplo de JSON em `importControllerEnhanced.js`
- [ ] Adicionar validação para novos campos
- [ ] Exibir preview expandido (graus, categorias, repetições totais)

### Fase 4: Testes (30min)
- [ ] Importar `curso-faixa-branca-completo.json`
- [ ] Validar dados no Prisma Studio
- [ ] Verificar se graus foram criados
- [ ] Verificar se activities foram criadas com repetições
- [ ] Verificar se checkpoints foram marcados

---

## 🚀 Como Executar

1. **Aplicar schema**:
```bash
npx prisma migrate dev --name add_course_v2_structure
npx prisma generate
```

2. **Atualizar service**:
```bash
# Editar src/services/courseImportService.ts
```

3. **Testar importação**:
```bash
# Abrir http://localhost:3000/#import
# Upload do arquivo curso-faixa-branca-completo.json
# Ativar "Criar técnicas automaticamente"
# Importar
```

4. **Validar no banco**:
```bash
npx prisma studio
# Verificar tabelas: course_graduations, course_degrees, course_activity_categories, lesson_plan_activities
```

---

## 📝 Notas Importantes

1. **Backward Compatibility**: Se `courseData.lessons` não existir, usar `courseData.schedule` (modo legado)
2. **Auto-create Techniques**: Manter flag `createMissingTechniques` funcionando
3. **Performance**: Criar activities em batch (não N queries)
4. **Validação**: Checar se todos os `categoryId` das activities existem em `activityCategories`
5. **Metadata**: Salvar em campo JSON no Course ou em tabela separada

---

## 🎯 Resultado Esperado

Após importação de `curso-faixa-branca-completo.json`:

✅ **1 Course criado**: "Krav Maga - Faixa Branca"  
✅ **1 CourseGraduation**: Sistema de 4 graus (20%, 40%, 60%, 80%)  
✅ **4 CourseDegree**: Fundamentos, Ataque Básico, Defesa Intermediária, Preparação Amarela  
✅ **6 ActivityCategories**: POSTURAS, SOCOS, CHUTES, DEFESAS, QUEDAS, COMBINAÇÕES  
✅ **35 LessonPlans**: Com checkpoints nas aulas 7, 14, 21, 28, 35  
✅ **~175 LessonPlanActivities**: Média de 5 atividades por aula com repetições  
✅ **3850 repetições planejadas**: Rastreadas via executions  
✅ **6 Achievements**: FIRST_PUNCH, DEGREE_1-4, YELLOW_BELT  
✅ **6 Milestones**: Mensagens de progresso (10%, 25%, 50%, 75%, 90%, 100%)  

---

**Versão**: 1.0  
**Data**: 10/10/2025  
**Autor**: AI Assistant  
**Status**: PLANEJAMENTO COMPLETO ✅
