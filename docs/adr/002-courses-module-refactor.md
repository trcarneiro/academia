# ADR 002: Courses Module Refactoring

## Status
Proposed

## Context
Analysis of courses module (public/js/modules/courses.js) revealed:
1. Modal usage violating full-screen UI principle (CLAUDE.md §3.2)
2. Inconsistent mock data handling between API and file fallback
3. Missing standardized error states

## Decision
1. **Remove modal implementation**:
   - Create new view-course.html template
   - Refactor viewCourse() to use navigation
   - Delete modal-related code (~80 lines)

2. **Standardize data handling**:
   ```javascript
   // Current
   if (apiFailed) loadFromFile()
   
   // Proposed
   const data = await fetchWithFallback(
     API_ENDPOINT,
     './data/courses-fallback.json'
   )
   ```

3. **Add UI states**:
   - Loading spinner component
   - Standard error display
   - Offline mode indicator

## Consequences
- ✅ Better CLAUDE.md compliance
- ✅ Improved error handling
- ⚠️ Requires updating 12 test cases
- ⚠️ ~2h estimated refactoring effort

## Migration Plan
1. Create view-course.html (1h)
2. Refactor data loading (0.5h)
3. Update tests (0.5h)