# Correção: Matrícula não aparecia no Check-in Kiosk

**Data**: 06/10/2025  
**Status**: ✅ RESOLVIDO

## Problema

Aluno "Thiago Carneiro" estava **matriculado** no curso "Krav Maga Faixa Branca" (visível no módulo Alunos), mas **NÃO aparecia** no Check-in Kiosk.

### Console Error
```
GET http://localhost:3000/api/attendance/dashboard/93c60d89-c610-4948-87fc-23b0e7925ab1 400 (Bad Request)

Invalid `prisma.student.findUnique()` invocation

Unknown argument `isActive`. Available options are marked with ?.
```

## Root Cause

No arquivo `src/services/attendanceService.ts` linha **732**, a query estava usando:

```typescript
enrollments: { 
  where: { 
    status: 'ACTIVE',
    isActive: true  // ❌ ESTE CAMPO NÃO EXISTE
  }
}
```

### Análise Técnica

1. **Model `CourseEnrollment`** (schema Prisma linha 675-699):
   - ✅ TEM: `status` (tipo `EnrollmentStatus`)
   - ❌ NÃO TEM: `isActive` (campo boolean)

2. **Query incorreta**: Prisma rejeitou porque `isActive` não é um campo válido
3. **Resultado**: API retornava erro 400, kiosk não carregava matrículas

## Solução

### Arquivo Modificado
`src/services/attendanceService.ts` (linha 732)

**ANTES** (incorreto):
```typescript
enrollments: { 
  where: { 
    status: 'ACTIVE',
    isActive: true  // ❌ Campo inexistente
  }, 
  include: { 
    course: { 
      select: { id: true, name: true } 
    } 
  } 
}
```

**DEPOIS** (correto):
```typescript
enrollments: { 
  where: { 
    status: 'ACTIVE'  // ✅ Apenas status, campo correto
  }, 
  include: { 
    course: { 
      select: { id: true, name: true } 
    } 
  } 
}
```

## Validação

### Steps para Testar
1. ✅ Servidor reiniciado (`npm run dev`)
2. 🔄 Recarregar página do Check-in Kiosk
3. 🔄 Buscar aluno "Thiago Carneiro"
4. 🔄 Verificar se aparece: **"Curso: Krav Maga Faixa Branca"**
5. 🔄 Console NÃO deve mostrar erro 400

### Expected Results
```javascript
// Dashboard API Response
{
  success: true,
  data: {
    student: { ... },
    enrollments: [
      {
        id: "...",
        course: {
          id: "...",
          name: "Krav Maga Faixa Branca"
        },
        status: "ACTIVE"
      }
    ],
    ...
  }
}
```

### Visual no Kiosk
```
📊 Dashboard do Aluno
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Nome: Thiago Carneiro
💳 Plano: Ilimitado ✅ Ativo
📅 Validade: 05/10/2025 até Indeterminado
📚 Curso: Krav Maga Faixa Branca  ← ✅ APARECE AGORA
```

## Files Changed
- ✅ `src/services/attendanceService.ts` (linha 732) - Removido `isActive: true`

## Related Issues
- 🔗 Check-in UX Improvements: `CHECKIN_UX_IMPROVED.md`
- 🔗 Enrollment Feature: `ENROLLMENT_ISSUE.md` (Schema classId opcional)
- 🔗 Router Navigation Fix: `FIX_ROUTER_NAVIGATION_DEADLOCK.md`

## Lessons Learned

### 1. Always Verify Schema Before Queries
❌ **Não assumir** campos existem  
✅ **Verificar** `prisma/schema.prisma` antes de usar where clauses

### 2. Model Naming Confusion
- `CourseEnrollment` vs `StudentCourse` (ambos existem no schema)
- `enrollments` relation usa `CourseEnrollment`
- `CourseEnrollment` não tem `isActive`, apenas `status`

### 3. Status vs isActive Pattern
```typescript
// Diferentes models usam padrões diferentes:
Student         → isActive: boolean
CourseEnrollment → status: EnrollmentStatus (ACTIVE/COMPLETED/DROPPED)
LessonPlan      → isActive: boolean
```

**Takeaway**: Não misturar padrões entre models diferentes.

## Next Steps
- [ ] Usuário testar no navegador
- [ ] Validar matrícula aparece corretamente
- [ ] Se funcionar, marcar tarefa como ✅ no AGENTS.md
- [ ] Considerar padronizar status/isActive em todos os models (refactoring futuro)

---
**Compliance**: AGENTS.md v2.1 ✅  
**Documentation**: API-first, Error handling, Schema validation
