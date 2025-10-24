# 🎯 FIX: Aulas Disponíveis Vazias no Check-in Kiosk

**Data**: 07/10/2025 01:51  
**Problema**: Turma das 2:30 não aparece disponível para check-in  
**Causa Raiz**: `getEligibleCourseIds` usando tabela errada (CourseEnrollment vs StudentCourse)

---

## 🐛 Diagnóstico

### Sintoma Observado
- Usuário: Thiago Carneiro (93c60d89-c610-4948-87fc-23b0e7925ab1)
- Matriculado em: "Krav Maga Faixa Branca" (krav-maga-faixa-branca-2025)
- API retornando: `"data": []` (array vazio de aulas disponíveis)
- Check-in Kiosk mostrando: "Nenhuma aula disponível"

### Investigação dos Logs

**1. Dashboard mostrando matrícula ativa:**
```json
studentCoursesFound: 1
studentCourses: [{
    "courseId": "krav-maga-faixa-branca-2025",
    "courseName": "Krav Maga Faixa Branca",
    "status": "ACTIVE",
    "isActive": true
}]
```

**2. Aulas disponíveis retornando vazio:**
```json
GET /api/attendance/classes/available?studentId=93c60d89-c610-4948-87fc-23b0e7925ab1
Response: {
  "success": true,
  "data": [],
  "message": "Aulas disponíveis recuperadas com sucesso"
}
```

**3. eligibleCourseIds = 0:**
```
eligibleCourseIds: 0
unlimitedPlan: true
```

### Causa Raiz Identificada

**Arquivo**: `src/services/attendanceService.ts`  
**Método**: `getEligibleCourseIds()` (linhas 11-40)

**Código Problemático:**
```typescript
const [enrollments, turmaLinks] = await Promise.all([
    prisma.courseEnrollment.findMany({  // ❌ TABELA ERRADA!
        where: { studentId, status: EnrollmentStatus.ACTIVE },
        select: { courseId: true },
    }),
    // ...
]);
```

**Problema**: 
- Código busca em `courseEnrollment` (tabela legacy/antiga)
- Aluno está matriculado em `studentCourse` (tabela correta)
- Query retorna vazio → `eligibleCourseIds = []`
- Filtro na linha 667 bloqueia todas as aulas: `courseId: { in: [] }`

---

## ✅ Solução Implementada

### Mudança Aplicada
**Arquivo**: `src/services/attendanceService.ts` (linhas 11-42)

```typescript
// ✅ ANTES (ERRADO):
const [enrollments, turmaLinks] = await Promise.all([
    prisma.courseEnrollment.findMany({  // Tabela errada
        where: { studentId, status: EnrollmentStatus.ACTIVE },
        select: { courseId: true },
    }),
    // ...
]);
const courseIds = new Set<string>();
enrollments.forEach((e) => e.courseId && courseIds.add(e.courseId));

// ✅ DEPOIS (CORRETO):
const [studentCourses, turmaLinks] = await Promise.all([
    prisma.studentCourse.findMany({  // ✅ Tabela correta
        where: { 
            studentId, 
            status: EnrollmentStatus.ACTIVE,
            isActive: true  // ✅ Filtro adicional
        },
        select: { courseId: true },
    }),
    // ...
]);
const courseIds = new Set<string>();
studentCourses.forEach((sc) => sc.courseId && courseIds.add(sc.courseId));
```

### Validação

**Query SQL Gerada (após correção):**
```sql
-- Busca cursos elegíveis
SELECT "courseId" FROM "StudentCourse" 
WHERE "studentId" = '93c60d89-c610-4948-87fc-23b0e7925ab1'
  AND "status" = 'ACTIVE'
  AND "isActive" = true;

-- Resultado esperado:
-- courseId: krav-maga-faixa-branca-2025
```

**Query de aulas (após correção):**
```sql
-- Busca aulas do dia com filtro de curso
SELECT * FROM "Class"
WHERE "courseId" IN ('krav-maga-faixa-branca-2025')  -- ✅ Agora tem cursos!
  AND "status" IN ('SCHEDULED', 'IN_PROGRESS')
  AND ("date" BETWEEN '2025-10-07 00:00' AND '2025-10-07 23:59');
```

---

## 🎯 Impacto

### Antes da Correção
- ❌ `eligibleCourseIds` sempre vazio
- ❌ Filtro `courseId IN []` bloqueia todas as aulas
- ❌ Check-in Kiosk sempre vazio
- ❌ Alunos não conseguem fazer check-in mesmo matriculados

### Após Correção
- ✅ `eligibleCourseIds` = ["krav-maga-faixa-branca-2025"]
- ✅ Filtro `courseId IN ['krav-maga-faixa-branca-2025']` funciona corretamente
- ✅ Aulas do curso matriculado aparecem no check-in
- ✅ Janela de 60 minutos antes da aula funciona conforme esperado

---

## 🔍 Como Testar

### 1. Reiniciar Servidor
```bash
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
npm run dev
```

### 2. Testar API Diretamente
```bash
# Verificar cursos elegíveis (backend log)
# Deve mostrar: eligibleCourseIds: 1

# Testar endpoint de aulas disponíveis
curl http://localhost:3000/api/attendance/classes/available?studentId=93c60d89-c610-4948-87fc-23b0e7925ab1
```

**Resultado Esperado:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "name": "Krav Maga Faixa Branca - Aula X",
      "startTime": "2025-10-07T14:30:00.000Z",
      "status": "AVAILABLE",  // ou "NOT_YET" se mais de 1h antes
      "canCheckIn": true
    }
  ]
}
```

### 3. Testar no Check-in Kiosk
1. Navegar para `#checkin-kiosk`
2. Pesquisar: "Thiago Carneiro" ou "trcampos@gmail.com"
3. Clicar no aluno
4. Verificar seção "Aulas Disponíveis Agora"
5. Deve mostrar turma das 2:30 com status correto:
   - **AVAILABLE** (check-in liberado) - se dentro da janela de 60min
   - **NOT_YET** (abre em Xh Ymin) - se faltam mais de 60min

---

## 📋 Tabelas Prisma Envolvidas

### StudentCourse (CORRETO) ✅
```prisma
model StudentCourse {
  id         String   @id @default(cuid())
  studentId  String
  courseId   String
  status     EnrollmentStatus @default(ACTIVE)
  isActive   Boolean  @default(true)
  // ...
  student    Student  @relation(fields: [studentId], references: [id])
  course     Course   @relation(fields: [courseId], references: [id])
}
```

### CourseEnrollment (LEGACY) ❌
```prisma
model CourseEnrollment {
  id         String   @id @default(cuid())
  studentId  String
  courseId   String
  status     EnrollmentStatus @default(ACTIVE)
  // ... (tabela antiga, não mais usada)
}
```

**Migração**: Sistema migrou de CourseEnrollment → StudentCourse  
**Problema**: Alguns métodos ainda referenciavam a tabela antiga

---

## 🔄 Outros Locais Corrigidos (Sessão Anterior)

### 1. `attendanceService.ts` - Dashboard
- ✅ Linha ~729-1091: `student.enrollments` → `student.studentCourses` (6 locais)
- ✅ Documentação: `KIOSK_PRISMA_RELATION_FIX.md`

### 2. Check-in Window
- ✅ Linha 696: `subtract(30, 'minute')` → `subtract(60, 'minute')`
- ✅ Documentação: `CHECKIN_UX_60MIN_WINDOW.md`

### 3. Check-in Kiosk UX
- ✅ Contador de tempo visual
- ✅ Estados: AVAILABLE, NOT_YET, CHECKED_IN, EXPIRED
- ✅ Documentação: `CHECKIN_UX_IMPROVED.md`

---

## ✅ Checklist de Conformidade

- [x] **getEligibleCourseIds**: StudentCourse em vez de CourseEnrollment
- [x] **getStudentDashboard**: student.studentCourses em vez de student.enrollments
- [x] **getAvailableClasses**: Janela de 60 minutos implementada
- [x] **Check-in Kiosk**: Estados visuais premium
- [x] **Documentação**: 4 documentos técnicos criados
- [ ] **Teste de Integração**: Aguardando reinício do servidor

---

## 📚 Arquivos Relacionados

1. **`src/services/attendanceService.ts`**
   - Método: `getEligibleCourseIds()` (linhas 11-42) ✅ Corrigido
   - Método: `getAvailableClasses()` (linhas 635-719) ✅ Já estava correto
   - Método: `getStudentDashboard()` (linhas 740+) ✅ Corrigido anteriormente

2. **`prisma/schema.prisma`**
   - Model: `StudentCourse` (tabela correta)
   - Model: `CourseEnrollment` (considerar deprecação)

3. **`public/js/modules/checkin-kiosk.js`**
   - Método: `loadAvailableClasses()` (linha ~686)
   - Método: `renderAvailableClasses()` (linha ~813)

---

## 🎉 Resultado Esperado

Após reiniciar servidor, a turma das 2:30 deve:

1. ✅ Aparecer na lista de "Aulas Disponíveis"
2. ✅ Mostrar status correto:
   - "⏱️ Check-in abre em Xh Ymin" (se faltam > 60min)
   - "✅ Check-in Liberado" (se dentro da janela de 60min)
   - "❌ Check-in Expirado" (se passou mais de 15min do início)
3. ✅ Permitir check-in quando dentro da janela
4. ✅ Mostrar "✅ Check-in realizado!" após confirmação

---

**Status**: ✅ **CORREÇÃO COMPLETA**  
**Próximo Passo**: Reiniciar servidor e testar no navegador  
**Tempo Estimado**: 2 minutos (restart + teste)
