# Data Model: UX Standardization

No database schema changes are required for this UI/UX standardization project.
The focus is entirely on the frontend presentation layer.

## Existing Entities Involved
- **Course**: `id`, `title`, `description`, `organizationId`, `level`, `duration`, `price`.
- **Technique**: `id`, `name`, `description`, `courseId`.
- **LessonPlan**: `id`, `week`, `content`, `courseId`.

## Frontend Models
The frontend will use the following data structures (matching API responses):

```typescript
interface Course {
  id: string;
  name: string;
  description?: string;
  level: string;
  duration: string;
  isActive: boolean;
  techniques?: Technique[];
  lessonPlans?: LessonPlan[];
}
```
