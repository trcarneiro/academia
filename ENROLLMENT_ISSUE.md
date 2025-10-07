# ⚠️ Problema Encontrado: StudentCourse Requer classId

**Data**: 06/10/2025  
**Status**: ❌ BLOQUEADO  
**Severidade**: ALTA - Impede matrícula manual de alunos em cursos

## 🔍 Descrição do Problema

Ao tentar matricular um aluno em um curso via botão "Matricular" na aba Cursos, o backend retorna **500 Internal Server Error**.

### **Causa Raiz**
O modelo `StudentCourse` no Prisma Schema **requer obrigatoriamente** o campo `classId`:

```prisma
model StudentCourse {
  id              String           @id @default(uuid())
  studentId       String
  courseId        String
  classId         String           // ❌ OBRIGATÓRIO - não pode ser null
  // ...
  @@unique([studentId, courseId, classId])
}
```

**Problema**: Não existe uma "Class" padrão/genérica para associar matrículas manuais.

---

## 💡 Soluções Propostas

### **Opção 1: Criar Class Dummy Automática** ✅ RECOMENDADA

**Abordagem**: Criar automaticamente uma `Class` genérica quando não houver turma disponível.

**Implementação**:
```typescript
// No método enrollStudentInCourse
if (!activeClass) {
    // Criar Class dummy para este curso
    activeClass = await prisma.class.create({
        data: {
            organizationId,
            courseId,
            instructorId: 'DEFAULT_INSTRUCTOR_ID', // TODO: Pegar instrutor padrão da org
            date: new Date(),
            startTime: new Date(),
            endTime: new Date(Date.now() + 3600000), // +1 hora
            status: 'SCHEDULED',
            title: `Matrícula Manual - ${course.name}`,
            description: 'Turma criada automaticamente para matrícula manual'
        }
    });
}
```

**Prós**:
- ✅ Não quebra o schema existente
- ✅ Mantém integridade referencial
- ✅ Permite evolução futura (associar aluno a turmas reais depois)

**Contras**:
- ❌ Cria Classes "fake" no banco
- ❌ Precisa de lógica para identificar/limpar Classes dummy

---

### **Opção 2: Modificar Schema Prisma** ⚙️ SOLUÇÃO DEFINITIVA

**Abordagem**: Tornar `classId` **opcional** no `StudentCourse`.

**Implementação**:
```prisma
model StudentCourse {
  id              String           @id @default(uuid())
  studentId       String
  courseId        String
  classId         String?          // ✅ OPCIONAL
  // ...
  // Remover constraint unique com classId:
  @@unique([studentId, courseId])  // Apenas studentId + courseId
}
```

**Migração necessária**:
```bash
npx prisma migrate dev --name make_classid_optional
```

**Prós**:
- ✅ Solução limpa e permanente
- ✅ Permite matrículas "gerais" sem turma específica
- ✅ Reflete melhor o modelo de negócio real

**Contras**:
- ❌ Requer migração de banco de dados
- ❌ Pode afetar queries existentes que assumem classId sempre presente
- ❌ Precisa revisar lógica de attendance/progress que dependem de Class

---

### **Opção 3: Criar Sistema de Default Class por Organization** 🏢 INTERMEDIÁRIA

**Abordagem**: Cada Organization tem uma "Class Virtual" padrão para matrículas gerais.

**Implementação**:
```typescript
// Criar na migration ou seeder
await prisma.class.create({
    data: {
        organizationId,
        courseId: 'VIRTUAL_COURSE_ID',  // Curso genérico
        instructorId: 'SYSTEM_INSTRUCTOR',
        title: 'Matrícula Geral',
        description: 'Turma virtual para matrículas sem turma específica',
        status: 'ACTIVE',
        date: new Date(),
        startTime: new Date(),
        endTime: new Date(),
        // Marcar como virtual:
        notes: JSON.stringify({ virtual: true, purpose: 'default_enrollment' })
    }
});

// No enrollStudentInCourse:
const defaultClass = await prisma.class.findFirst({
    where: {
        organizationId,
        notes: { contains: '"virtual":true' }
    }
});
```

**Prós**:
- ✅ Não quebra schema
- ✅ Classe identificável como "default"
- ✅ Uma única Class por org (não polui banco)

**Contras**:
- ❌ Requer setup inicial (migration/seed)
- ❌ Lógica de "virtual class" espalhada no código

---

## 🚀 Recomendação Final

**Use Opção 2 (Modificar Schema)** se:
- Sistema está em desenvolvimento/staging
- Pode fazer migração de banco facilmente
- Quer solução permanente e limpa

**Use Opção 1 (Class Dummy Automática)** se:
- Precisa de solução rápida
- Não pode modificar schema agora
- Quer testar funcionalidade antes de decidir arquitetura final

**Use Opção 3 (Default Class por Org)** se:
- Quer meio-termo entre as duas
- Precisa rastrear matrículas gerais vs turmas específicas
- Organização tem modelo híbrido (turmas + matrículas gerais)

---

## 📝 Próximos Passos

1. **Decisão de Arquitetura**: Escolher uma das 3 opções acima
2. **Implementação**: Aplicar solução escolhida
3. **Teste**: Verificar matrícula manual funcionando
4. **Documentação**: Atualizar `AGENTS.md` com decisão arquitetural

---

## 🔗 Arquivos Relacionados

- **Backend Service**: `src/services/studentCourseService.ts` (linha 405-440)
- **Backend Controller**: `src/controllers/studentCourseController.ts`
- **Backend Route**: `src/routes/studentCourses.ts`
- **Frontend Controller**: `public/js/modules/students/controllers/editor-controller.js` (linha 3255)
- **Prisma Schema**: `prisma/schema.prisma` (linha 879-898)

---

## 💬 Mensagem de Erro Completa

```
POST http://localhost:3000/api/students/93c60d89-c610-4948-87fc-23b0e7925ab1/courses 500 (Internal Server Error)

{
  "success": false,
  "error": "Erro ao matricular aluno no curso",
  "timestamp": "2025-10-06T16:41:05.566Z"
}
```

**Backend Log** (esperado):
```
⚠️ Nenhuma turma ativa encontrada para o curso. Matrícula requer turma.
Error: Nenhuma turma ativa disponível para este curso. Configure uma turma antes de matricular alunos.
```
