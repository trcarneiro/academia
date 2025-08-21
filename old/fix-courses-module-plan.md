# Fix Courses Module Loading Issue - Implementation Plan

## Problem Analysis
The courses module is stuck at "Carregando cursos..." due to data structure mismatch between `courses.json` and what `courses.js` expects.

## Current Data Structure (courses.json)
```json
[
  {
    "id": "krav-maga-basic",
    "title": "Krav Maga Básico",
    "targetAudience": "Iniciantes",
    "duration": 24,
    "category": "BEGINNER",
    "active": true,
    "description": "Curso fundamental de Krav Maga para iniciantes"
  }
]
```

## Expected Data Structure (courses.js)
```javascript
{
  id: "1",
  name: "Krav Maga Básico",
  description: "Curso fundamental de Krav Maga para iniciantes",
  duration: "24 aulas",
  level: "Iniciante",
  instructor: "Instrutor Principal",
  status: "Ativo",
  students: 15,
  startDate: "2024-01-15",
  schedule: "Seg/Qua 19h-21h"
}
```

## Required Changes

### 1. Update loadCoursesFromFile() Function
- Map `title` → `name`
- Map `targetAudience` → `level`
- Map `duration` → `duration` (add "aulas" suffix)
- Map `active` → `status` (true → "Ativo", false → "Inativo")
- Add default values for missing fields
- Handle category mapping (BEGINNER → "Iniciante", etc.)

### 2. Update fetchCoursesData() Function
- Ensure proper error handling
- Add fallback to local data
- Implement proper data transformation

### 3. Test Data Loading
- Verify courses display correctly
- Check filtering and sorting functionality
- Test responsive design

## Implementation Steps

1. **Fix data mapping in courses.js** (lines 45-80)
2. **Update fetchCoursesData()** (lines 82-120)
3. **Test loading functionality**
4. **Verify UI display**
5. **Test CRUD operations**

## Code Changes Required

### In public/js/modules/courses.js:

#### Update loadCoursesFromFile():
```javascript
async function loadCoursesFromFile() {
    try {
        const response = await fetch('/data/courses.json');
        if (!response.ok) throw new Error('Failed to load courses');
        
        const data = await response.json();
        
        // Map data structure
        return data.map(course => ({
            id: course.id,
            name: course.title,
            description: course.description,
            duration: `${course.duration} aulas`,
            level: mapCategoryToLevel(course.category),
            instructor: "Instrutor Principal", // Default value
            status: course.active ? "Ativo" : "Inativo",
            students: Math.floor(Math.random() * 30) + 5, // Random default
            startDate: new Date().toISOString().split('T')[0], // Today
            schedule: "Seg/Qua 19h-21h" // Default schedule
        }));
    } catch (error) {
        console.error('Error loading courses from file:', error);
        return [];
    }
}

function mapCategoryToLevel(category) {
    const mapping = {
        'BEGINNER': 'Iniciante',
        'INTERMEDIATE': 'Intermediário',
        'ADVANCED': 'Avançado'
    };
    return mapping[category] || category;
}
```

#### Update fetchCoursesData():
```javascript
async function fetchCoursesData() {
    try {
        // Try API first
        const response = await fetch('http://localhost:3000/api/courses');
        if (response.ok) {
            const apiData = await response.json();
            return apiData;
        }
    } catch (error) {
        console.log('API unavailable, loading from local file...');
    }
    
    // Fallback to local file
    return await loadCoursesFromFile();
}
```

## Testing Checklist
- [ ] Courses load without "Carregando..." message
- [ ] All 2 sample courses display correctly
- [ ] Data mapping works (title→name, category→level, etc.)
- [ ] Filtering works by level and status
- [ ] Sorting works correctly
- [ ] Responsive design displays properly
- [ ] Add/Edit/Delete buttons work
- [ ] Modal dialogs open correctly

## Success Criteria
- No more "Carregando cursos..." message
- All courses display with correct data
- All functionality works (CRUD, filtering, sorting)
- Responsive design works on mobile and desktop