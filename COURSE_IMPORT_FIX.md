# Course Import Fix - Unique Constraint Error

**Date**: 05/10/2025 02:44  
**Issue**: Course import failing with 400 Bad Request  
**Root Cause**: Unique constraint violation on `LessonPlan` table

---

## Problem Description

When importing the course "Krav Maga Faixa Branca" via the import module, the operation was failing with:

```
Prisma Error P2002: Unique constraint failed on the fields: (`courseId`,`lessonNumber`,`isActive`)
```

**What was happening**:
1. User uploaded `cursofaixabranca.json` file
2. Frontend validated and sent data to `POST /api/courses/import-full-course`
3. Backend validated techniques (20 found) ✅
4. Backend created/updated course ✅
5. Backend associated techniques with course ✅
6. **Backend tried to create 35 lesson plans** ❌
7. **Prisma threw unique constraint error** because lesson plans already existed from previous import attempt

---

## Root Cause Analysis

The database already had 35 lesson plans for course `krav-maga-faixa-branca-2025`:
- Created from a previous import attempt
- Still marked as `isActive: true`
- Prisma schema enforces unique constraint: `@@unique([courseId, lessonNumber, isActive])`

When the import service tried to create new lesson plans with the same `courseId` and `lessonNumber` values, Prisma rejected the operation.

**Why it wasn't caught earlier**:
- The `CourseImportService.createSchedule()` method didn't check for existing lesson plans
- It went straight to batch creation: `prisma.lessonPlan.create()`
- No cleanup step before creating new data

---

## Solution Implemented

### File Modified
`src/services/CourseImportService.ts` - Lines 486-509

### Changes Made

Added **cleanup logic** at the start of `createSchedule()` method:

```typescript
// 🧹 CLEANUP: Delete existing lesson plans for this course to avoid unique constraint errors
const existingLessonPlans = await prisma.lessonPlan.findMany({
  where: { courseId: courseId, isActive: true },
  select: { id: true, lessonNumber: true }
});

if (existingLessonPlans.length > 0) {
  console.log(`  🧹 Found ${existingLessonPlans.length} existing lesson plans, deleting...`);
  
  // Delete technique links first (foreign key constraint)
  await prisma.lessonPlanTechnique.deleteMany({
    where: {
      lessonPlanId: { in: existingLessonPlans.map(lp => lp.id) }
    }
  });
  
  // Delete lesson plans
  await prisma.lessonPlan.deleteMany({
    where: { courseId: courseId, isActive: true }
  });
  
  console.log(`  ✅ Cleanup complete, ready for fresh import`);
}
```

### Why This Works

1. **Check before create**: Query database for existing lesson plans
2. **Respect foreign keys**: Delete `LessonPlanTechnique` links first (child records)
3. **Clean slate**: Delete existing lesson plans for the course
4. **Proceed safely**: Continue with batch creation of new lesson plans
5. **Idempotent operation**: Re-importing the same course now works without errors

---

## Expected Behavior After Fix

### Import Flow (Updated)
1. ✅ Validate 20 techniques (all found)
2. ✅ Create/update course `krav-maga-faixa-branca-2025`
3. ✅ Delete existing 20 course-technique associations
4. ✅ Create 20 new course-technique associations
5. 🆕 **Find 35 existing lesson plans**
6. 🆕 **Delete 35 technique links (foreign key cleanup)**
7. 🆕 **Delete 35 existing lesson plans**
8. ✅ Create 35 new lesson plans in batch
9. ✅ Link techniques to new lesson plans
10. ✅ Return success response

### Console Output (Expected)
```
📅 Creating schedule for course krav-maga-faixa-branca-2025: 18 weeks, 18 week entries
  🧹 Found 35 existing lesson plans, deleting...
  ✅ Cleanup complete, ready for fresh import
  📌 Week 1: 2 lessons, focus: 4 items
  📌 Week 2: 2 lessons, focus: 4 items
  ...
  ⚡ Creating 35 lesson plans in batch...
  ✅ Created 35 lesson plans
  🔗 Linking techniques to lessons...
  ✅ All operations complete
```

---

## Testing Steps

### 1. Reload Frontend (Clear Cache)
**Browser**: Press `Ctrl + Shift + R` to hard refresh  
**Reason**: Ensure latest `importControllerEnhanced.js` is loaded

### 2. Navigate to Import Module
1. Click "Importar" in sidebar
2. Verify tab shows "courses" (not "students")

### 3. Upload Course JSON
1. Click "Escolher arquivo" button
2. Select `cursofaixabranca.json`
3. Wait for validation (should show: "✅ Validação concluída: 1 válidos, 0 inválidos")

### 4. Trigger Import
1. Scroll down to preview
2. Click "🚀 Importar Agora" button
3. **Expected**: Progress messages → "✅ Importação finalizada: 1/1 com sucesso"
4. **Not Expected**: "❌ Erro: Erro interno na importação do curso"

### 5. Verify Database
```sql
SELECT courseId, COUNT(*) as lesson_count 
FROM LessonPlan 
WHERE courseId = 'krav-maga-faixa-branca-2025' AND isActive = true
GROUP BY courseId;

-- Expected: 35 lesson plans
```

### 6. Verify Frontend
1. Navigate to "Planos de Aula" module
2. Should see 35 lesson plans listed
3. Click any lesson plan → should open editor
4. Verify techniques are linked (should show technique list)

---

## Related Code Locations

### Backend (Import Logic)
- **Route Handler**: `src/routes/courses.ts` - Line 393 (`POST /import-full-course`)
- **Service (Fixed)**: `src/services/CourseImportService.ts` - Lines 486-509 (`createSchedule()`)
- **Technique Validation**: `src/services/CourseImportService.ts` - Lines 200-250 (`validateTechniques()`)
- **Association Cleanup**: `src/services/CourseImportService.ts` - Line 445 (`associateTechniques()`)

### Frontend (Import UI)
- **Controller**: `public/js/modules/import/controllers/importControllerEnhanced.js`
- **Entry Point**: `public/js/modules/import/index.js`
- **API Call**: Line 922 in `importControllerEnhanced.js` (`importFullCourse()`)

### Database Schema
- **LessonPlan Model**: `prisma/schema.prisma` (unique constraint defined)
- **Foreign Keys**: `LessonPlanTechnique` → `LessonPlan.id`

---

## Prevention Strategy

### Why This Happened
- Initial import succeeded partially (created lesson plans)
- Subsequent imports failed due to existing data
- No cleanup logic in original implementation
- Manual database cleanup required before second import

### How to Prevent
✅ **Implemented**: Automatic cleanup before creating new lesson plans  
✅ **Preserved**: Course-technique association cleanup (already existed)  
⏳ **Future Enhancement**: Add UI option "Replace existing course data" (explicit user confirmation)  
⏳ **Future Enhancement**: Use soft deletes (`isActive: false`) instead of hard deletes for audit trail

---

## Rollback Plan (If Needed)

If the fix causes issues:

1. **Revert TypeScript changes**:
```bash
git checkout src/services/CourseImportService.ts
```

2. **Manually clean database**:
```sql
DELETE FROM LessonPlanTechnique WHERE lessonPlanId IN (
  SELECT id FROM LessonPlan WHERE courseId = 'krav-maga-faixa-branca-2025'
);
DELETE FROM LessonPlan WHERE courseId = 'krav-maga-faixa-branca-2025';
```

3. **Restart server**:
```powershell
npm run dev
```

---

## Success Metrics

- ✅ Import completes without errors (200 OK response)
- ✅ All 35 lesson plans created
- ✅ All techniques properly linked to lessons
- ✅ No duplicate entries in database
- ✅ Re-importing same course works (idempotent)
- ✅ Console shows cleanup logs

---

## Next Steps

1. **Test the import** with the file already uploaded
2. **Verify lesson plans** appear in "Planos de Aula" module
3. **Test re-import** (upload same file again) to verify idempotency
4. **Document in WORKFLOW.md** (add to import SOPs)

---

**Status**: ✅ Fix implemented, server restarted, ready for testing  
**Server**: Running at http://localhost:3000  
**Last restart**: 02:44:22
