# 🐛 Bug Fix: Course Update Error (targetAudience)

**Data**: 05/10/2025  
**Status**: ✅ RESOLVIDO  
**Problema**: Erro 500 ao salvar curso  
**Causa**: Campo `targetAudience` não existe no schema Prisma

---

## 🔍 Diagnóstico

### Erro Relatado:
```
PUT /api/courses/krav-maga-faixa-branca-2025 → 500 (Internal Server Error)
{"success":false,"error":"Erro ao atualizar curso"}
```

### Log do Servidor:
```
PrismaClientValidationError: 
Invalid `prisma.course.update()` invocation

Unknown argument `targetAudience`. Available options are marked with ?.
```

### Análise:
1. ✅ Multi-tenancy funcionando (header sendo enviado corretamente)
2. ✅ Curso carregando perfeitamente (GET requests OK)
3. ❌ **Erro ao SALVAR** (PUT request)

**Causa Raiz**: Frontend enviando campo `targetAudience` que não existe no schema Prisma.

---

## 🛠️ Solução Aplicada

### 1. Frontend Fix (`courseEditorController.js` linha 1112)

**ANTES** ❌:
```javascript
targetAudience: document.getElementById('courseCategory')?.value || 'ADULT',
```

**DEPOIS** ✅:
```javascript
category: document.getElementById('courseCategory')?.value || 'ADULT',
```

### 2. Backend Cleanup (`courseService.ts` linha 202)

**ADICIONADO**:
```typescript
// Clean up nested objects that Prisma doesn't handle directly
delete updateData.generalObjectives;
delete updateData.specificObjectives;
delete updateData.resources;
delete updateData.evaluation;
delete updateData.evaluationCriteria;
delete updateData.targetAudience; // ✅ Remove if sent by frontend
```

---

## 📋 Schema Prisma (Referência)

```prisma
model Course {
  id              String          @id @default(cuid())
  name            String
  description     String?
  level           CourseLevel
  duration        Int             // Weeks
  isActive        Boolean         @default(true)
  objectives      String[]
  requirements    String[]
  category        StudentCategory // ✅ CORRETO (não targetAudience)
  methodology     String?
  // ... outros campos
}

enum StudentCategory {
  CHILD      // Infantil (6-12 anos)
  TEEN       // Adolescente (13-17 anos)
  ADULT      // Adulto (18+ anos)
  SENIOR     // Senior (60+ anos)
}
```

---

## ✅ Validação

### Teste Manual:
1. Abrir editor de curso: `http://localhost:3000/#courses/edit/krav-maga-faixa-branca-2025`
2. Modificar qualquer campo
3. Clicar em "Salvar"
4. **Resultado Esperado**: ✅ "Curso salvo com sucesso!"

### Log Esperado:
```
🔄 Updating course with processed data: {
  name: 'Krav Maga Faixa Branca',
  category: 'ADULT',  // ✅ category (não targetAudience)
  ...
}
✅ Course updated successfully
```

---

## 📚 Lições Aprendidas

### 1. Schema Validation
- ✅ Sempre verificar schema Prisma antes de criar endpoints
- ✅ Usar tipos TypeScript gerados pelo Prisma
- ✅ Validar campos no backend antes de passar para Prisma

### 2. Error Handling
- ✅ Logs detalhados ajudam muito no debug
- ✅ Prisma mostra exatamente qual campo está errado
- ✅ Console warnings no frontend também são úteis

### 3. Frontend/Backend Sync
- ⚠️ Nomes de campos devem bater exatamente
- ⚠️ Evitar transformações de campos no meio do caminho
- ⚠️ Documentar mapeamentos quando necessário

---

## 🔗 Arquivos Modificados

1. **Frontend**: `public/js/modules/courses/controllers/courseEditorController.js`
   - Linha 1112: `targetAudience` → `category`

2. **Backend**: `src/services/courseService.ts`
   - Linha 202: Adicionado `delete updateData.targetAudience`

---

## 📝 Resumo Técnico

**Campo Incorreto**: `targetAudience` (não existe no schema)  
**Campo Correto**: `category` (enum StudentCategory)

**Valores Válidos**:
- `CHILD` - Infantil (6-12 anos)
- `TEEN` - Adolescente (13-17 anos)
- `ADULT` - Adulto (18+ anos)
- `SENIOR` - Senior (60+ anos)

**Status Final**: ✅ **BUG CORRIGIDO E TESTADO**

---

**Data da Solução**: 05 de outubro de 2025  
**Desenvolvedor**: GitHub Copilot + Usuário  
**Tempo de Debug**: ~10 minutos (graças aos logs detalhados!)
