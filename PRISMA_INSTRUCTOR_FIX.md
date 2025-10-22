# 🔧 CORREÇÃO: Prisma Query - Instructor é User Direto

**Data**: 07/10/2025 09:59  
**Problema**: Prisma error "Unknown field `user` for include statement on model `User`"  
**Causa**: Tentativa de acessar `turma.instructor.user` quando `instructor` JÁ É `User`

---

## 🐛 Erro Original

```
Invalid `prisma.turmaLesson.findMany()` invocation

Unknown field `user` for include statement on model `User`. 
Available options are marked with ?.
```

### Query Problemática (attendanceService.ts linha 666)

```typescript
const turmaLessons = await prisma.turmaLesson.findMany({
  include: {
    turma: {
      include: {
        instructor: {
          include: {
            user: {  // ❌ ERRO: instructor JÁ É User!
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    },
  },
});
```

---

## 🔍 Causa Raiz: Schema Prisma

Verificando `prisma/schema.prisma` linha 1507:

```prisma
model Turma {
  // ...
  instructorId   String
  instructor     User @relation(fields: [instructorId], references: [id])
  // ...
}
```

**Descoberta**: `Turma.instructor` é do tipo **`User`** (não `Instructor`!)

---

## ✅ Solução Aplicada

### 1. Query Corrigida (Include direto em User)

```typescript
// src/services/attendanceService.ts linha 666

const turmaLessons = await prisma.turmaLesson.findMany({
  where: {
    scheduledDate: { gte: startOfDay, lte: endOfDay },
    isActive: true,
    status: 'SCHEDULED',
    turma: { courseId: { in: eligibleCourseIds } },
  },
  include: {
    turma: {
      include: {
        instructor: {
          select: {  // ✅ CORRETO: Instructor é User, selecionar direto
            firstName: true,
            lastName: true,
          },
        },
        course: {
          select: { name: true, level: true },
        },
      },
    },
    attendances: studentId ? { where: { studentId } } : false,
  },
  orderBy: { scheduledDate: 'asc' },
});
```

### 2. Mapeamento Corrigido (Linha 745)

**ANTES** (❌ ERRADO):
```typescript
instructor: turmaLesson.turma.instructor
  ? {
      name: `${turmaLesson.turma.instructor.user.firstName} ${turmaLesson.turma.instructor.user.lastName}`,
    }
  : null,
```

**DEPOIS** (✅ CORRETO):
```typescript
instructor: turmaLesson.turma.instructor
  ? {
      name: `${turmaLesson.turma.instructor.firstName} ${turmaLesson.turma.instructor.lastName}`,
    }
  : null,
```

---

## 📋 Arquivos Modificados

1. **`src/services/attendanceService.ts`**
   - Linha 666-709: Query `prisma.turmaLesson.findMany()` - Include corrigido
   - Linha 745: Mapeamento `instructor.firstName` - Removido `.user`

---

## 🧪 Como Testar

### Backend (Terminal)
```powershell
# Verificar se servidor está rodando
Invoke-RestMethod -Uri "http://localhost:3000/api/attendance/classes/available?studentId=93c60d89-c610-4948-87fc-23b0e7925ab1"
```

### Frontend (Browser Console)
```javascript
// Check-in Kiosk - Deve retornar 1 aula
fetch('/api/attendance/classes/available?studentId=93c60d89-c610-4948-87fc-23b0e7925ab1')
  .then(r => r.json())
  .then(data => console.log('✅ Aulas:', data.data))
```

### Resultado Esperado
```json
{
  "success": true,
  "data": [
    {
      "id": "51a391c9-b71e-43cb-902b-b03859ed1928",
      "name": "Aula 2 - krav-maga-faixa-branca-2025",
      "startTime": "2025-10-07T05:30:00.000Z",
      "endTime": "2025-10-07T06:30:00.000Z",
      "instructor": {
        "name": "Thiago Carneiro"  // ✅ Nome do instrutor (User)
      },
      "course": {
        "name": "Krav Maga Faixa Branca",
        "level": "BEGINNER"
      },
      "canCheckIn": true,
      "status": "AVAILABLE"
    }
  ],
  "message": "Aulas disponíveis recuperadas com sucesso"
}
```

---

## ⚠️ Status Atual

**Servidor**: Reiniciado com correção aplicada  
**Código**: Compilado sem erros TypeScript  
**Prisma Query**: Corrigido (instructor é User, não Instructor)  

**Próximo Passo**: Recarregar Check-in Kiosk no navegador e verificar se aula das 02:30 aparece

---

## 📚 Lições Aprendidas

1. **Sempre verificar o schema Prisma antes de fazer includes**
   - `Turma.instructor` é `User`, não `Instructor`
   - Não assumir relações sem confirmar no `schema.prisma`

2. **Prisma validation errors são literais**
   - "Unknown field `user` for include on model `User`" significa que já ESTÁ em User

3. **Relações podem ser diretas ou através de tabelas intermediárias**
   - `User` (tabela master) ← `Turma.instructor` (relação direta)
   - `Instructor` (extends User) mas Turma NÃO usa essa tabela

---

**Status**: ✅ **CORREÇÃO APLICADA - AGUARDANDO TESTE**  
**Confiança**: 95% (query correta, schema validado, mapeamento ajustado)  
**Próxima Ação**: Usuário testar Check-in Kiosk no navegador
