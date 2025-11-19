# Feature: Associar Instrutores a Cursos

## Problema Atual
Atualmente, um instrutor pode ser criado, mas **não há como definir quais cursos ele está habilitado a lecionar**.

## Solução Proposta

### 1. Adicionar Modelo `InstructorCourse` ao Schema

```prisma
// Adicionar ao schema.prisma (após model Instructor)

model InstructorCourse {
  id             String       @id @default(uuid())
  instructorId   String
  courseId       String
  isLead         Boolean      @default(false)  // Se é instrutor principal do curso
  certifiedAt    DateTime?                      // Data de certificação
  expiresAt      DateTime?                      // Certificação expira?
  notes          String?                        // Observações
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  
  instructor     Instructor   @relation(fields: [instructorId], references: [id], onDelete: Cascade)
  course         Course       @relation(fields: [courseId], references: [id], onDelete: Cascade)
  
  @@unique([instructorId, courseId])
  @@index([instructorId])
  @@index([courseId])
}
```

### 2. Atualizar Models Existentes

```prisma
// Adicionar ao model Instructor
model Instructor {
  // ... campos existentes ...
  courses            InstructorCourse[]  // ← ADICIONAR
}

// Adicionar ao model Course
model Course {
  // ... campos existentes ...
  instructors        InstructorCourse[]  // ← ADICIONAR
}
```

### 3. Migration

```bash
# Criar migration
npx prisma migrate dev --name add_instructor_courses

# Aplicar no banco
npx prisma generate
```

### 4. Backend - API Routes

**Arquivo**: `src/routes/instructor-courses.ts`

```typescript
import { FastifyInstance } from 'fastify';
import { prisma } from '@/utils/database';
import { requireOrganizationId } from '@/utils/tenantHelpers';

export default async function instructorCoursesRoutes(fastify: FastifyInstance) {
  // GET /api/instructors/:id/courses - listar cursos do instrutor
  fastify.get('/:instructorId/courses', async (request, reply) => {
    try {
      const { instructorId } = request.params as any;
      const organizationId = requireOrganizationId(request, reply);
      if (!organizationId) return;

      const courses = await prisma.instructorCourse.findMany({
        where: { 
          instructorId,
          instructor: { organizationId }
        },
        include: {
          course: {
            select: {
              id: true,
              name: true,
              description: true,
              isActive: true
            }
          }
        }
      });

      return { success: true, data: courses };
    } catch (error) {
      request.log.error(error);
      reply.code(500);
      return { success: false, error: 'Failed to fetch instructor courses' };
    }
  });

  // POST /api/instructors/:id/courses - adicionar curso ao instrutor
  fastify.post('/:instructorId/courses', async (request, reply) => {
    try {
      const { instructorId } = request.params as any;
      const { courseId, isLead, certifiedAt, notes } = request.body as any;
      const organizationId = requireOrganizationId(request, reply);
      if (!organizationId) return;

      // Verificar se instrutor existe e pertence à organização
      const instructor = await prisma.instructor.findFirst({
        where: { id: instructorId, organizationId }
      });

      if (!instructor) {
        reply.code(404);
        return { success: false, error: 'Instructor not found' };
      }

      // Criar associação
      const instructorCourse = await prisma.instructorCourse.create({
        data: {
          instructorId,
          courseId,
          isLead: isLead || false,
          certifiedAt: certifiedAt ? new Date(certifiedAt) : null,
          notes
        },
        include: {
          course: true
        }
      });

      return { success: true, data: instructorCourse };
    } catch (error: any) {
      if (error.code === 'P2002') {
        reply.code(409);
        return { success: false, error: 'Instructor already assigned to this course' };
      }
      request.log.error(error);
      reply.code(500);
      return { success: false, error: 'Failed to assign course to instructor' };
    }
  });

  // DELETE /api/instructors/:id/courses/:courseId - remover curso do instrutor
  fastify.delete('/:instructorId/courses/:courseId', async (request, reply) => {
    try {
      const { instructorId, courseId } = request.params as any;
      const organizationId = requireOrganizationId(request, reply);
      if (!organizationId) return;

      await prisma.instructorCourse.deleteMany({
        where: { 
          instructorId, 
          courseId,
          instructor: { organizationId }
        }
      });

      return { success: true, message: 'Course removed from instructor' };
    } catch (error) {
      request.log.error(error);
      reply.code(500);
      return { success: false, error: 'Failed to remove course from instructor' };
    }
  });
}
```

**Registrar no `src/server.ts`**:
```typescript
import instructorCoursesRoutes from '@/routes/instructor-courses';

// Dentro de registerRoutes():
app.register(instructorCoursesRoutes, { prefix: '/api/instructors' });
```

### 5. Frontend - UI do Editor de Instrutor

**Adicionar ao formulário** (`public/js/modules/instructors/index.js`):

```javascript
// Após seção de bio, adicionar:
<div class="form-group">
    <label>Cursos Habilitados</label>
    <div id="instructor-courses-selector">
        <!-- Multi-select de cursos -->
        <select id="courses-multiselect" multiple style="height: 200px;">
            <!-- Preenchido dinamicamente -->
        </select>
        <button type="button" onclick="instructorsModule.addCourse()">
            Adicionar Curso
        </button>
    </div>
    <div id="selected-courses-list">
        <!-- Lista de cursos selecionados com badge -->
    </div>
</div>
```

**JavaScript para carregar cursos disponíveis**:

```javascript
async loadAvailableCourses() {
    const orgId = window.currentOrganizationId || 
                  localStorage.getItem('currentOrganizationId');
    
    const response = await fetch(`/api/courses?organizationId=${orgId}`);
    const data = await response.json();
    
    if (data.success) {
        this.availableCourses = data.data;
        this.renderCoursesSelector();
    }
}

async loadInstructorCourses(instructorId) {
    const response = await fetch(`/api/instructors/${instructorId}/courses`);
    const data = await response.json();
    
    if (data.success) {
        this.instructorCourses = data.data;
        this.renderSelectedCourses();
    }
}

async addCourseToInstructor(instructorId, courseId) {
    const response = await fetch(`/api/instructors/${instructorId}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            courseId,
            isLead: false,
            certifiedAt: new Date().toISOString()
        })
    });
    
    const data = await response.json();
    if (data.success) {
        this.loadInstructorCourses(instructorId); // Refresh list
        this.showSuccess('Curso adicionado ao instrutor');
    }
}

async removeCourseFromInstructor(instructorId, courseId) {
    const response = await fetch(
        `/api/instructors/${instructorId}/courses/${courseId}`,
        { method: 'DELETE' }
    );
    
    const data = await response.json();
    if (data.success) {
        this.loadInstructorCourses(instructorId); // Refresh list
        this.showSuccess('Curso removido do instrutor');
    }
}
```

### 6. UI Premium - Badge de Cursos

```html
<!-- No card do instrutor na listagem -->
<div class="instructor-card">
    <h3>Gabriel Instrutor</h3>
    <p>email@example.com</p>
    
    <div class="instructor-courses-badges">
        <span class="badge badge-primary">Krav Maga Iniciante</span>
        <span class="badge badge-secondary">Defesa Pessoal</span>
        <span class="badge badge-success">
            Krav Maga Avançado 
            <i class="badge-star">⭐</i> <!-- Se isLead = true -->
        </span>
    </div>
</div>
```

**CSS** (`public/css/modules/instructors.css`):
```css
.instructor-courses-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
}

.badge {
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
}

.badge-primary {
    background: var(--gradient-primary);
    color: white;
}

.badge-star {
    margin-left: 4px;
    font-size: 10px;
}
```

### 7. Validação na Criação de Aulas

**Quando criar uma aula** (`src/routes/classes.ts`), validar se o instrutor está habilitado para aquele curso:

```typescript
// POST /api/classes
fastify.post('/', async (request, reply) => {
    const { instructorId, courseId, ... } = request.body;
    
    // Verificar se instrutor pode lecionar o curso
    const instructorCourse = await prisma.instructorCourse.findUnique({
        where: {
            instructorId_courseId: { instructorId, courseId }
        }
    });
    
    if (!instructorCourse) {
        reply.code(403);
        return { 
            success: false, 
            error: 'Instructor not certified for this course' 
        };
    }
    
    // Prosseguir com criação da aula...
});
```

### 8. Relatórios e Analytics

**Queries úteis**:

```typescript
// Cursos mais ensinados
const topCourses = await prisma.instructorCourse.groupBy({
    by: ['courseId'],
    _count: { instructorId: true },
    orderBy: { _count: { instructorId: 'desc' } },
    take: 10
});

// Instrutores polivalentes (lecionam mais cursos)
const versatileInstructors = await prisma.instructor.findMany({
    select: {
        user: { select: { firstName: true, lastName: true } },
        _count: { select: { courses: true } }
    },
    orderBy: { courses: { _count: 'desc' } }
});

// Certificações expirando nos próximos 30 dias
const expiringSoon = await prisma.instructorCourse.findMany({
    where: {
        expiresAt: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
    },
    include: {
        instructor: { include: { user: true } },
        course: true
    }
});
```

## Checklist de Implementação

- [ ] 1. Adicionar modelo `InstructorCourse` ao schema.prisma
- [ ] 2. Rodar `npx prisma migrate dev --name add_instructor_courses`
- [ ] 3. Criar `src/routes/instructor-courses.ts`
- [ ] 4. Registrar rotas no `src/server.ts`
- [ ] 5. Adicionar multi-select de cursos ao formulário de instrutor
- [ ] 6. Implementar funções JS: loadAvailableCourses, addCourseToInstructor
- [ ] 7. Adicionar badges de cursos no card do instrutor
- [ ] 8. Validar instrutor x curso na criação de aulas
- [ ] 9. Testar CRUD completo (adicionar/remover cursos)
- [ ] 10. Documentar na AGENTS.md

## Benefícios

✅ **Controle de qualidade**: Apenas instrutores certificados lecionam cursos  
✅ **Compliance**: Rastreamento de certificações e validades  
✅ **Otimização**: Sistema pode sugerir instrutores baseado em cursos  
✅ **Relatórios**: Analytics sobre cobertura de cursos por instrutor  
✅ **Planejamento**: Identificar gaps (cursos sem instrutor qualificado)

## Alternativa Simples (Sem migration)

Se não quiser criar nova tabela AGORA, pode usar o campo `specializations` que já existe:

```javascript
// No formulário do instrutor
async handleFormSubmit() {
    const data = {
        name: '...',
        email: '...',
        specializations: ['Course ID 1', 'Course ID 2'], // ← Usar array existente
        // ...
    };
}
```

Mas isso não permite:
- ❌ Marcar instrutor principal (`isLead`)
- ❌ Rastrear data de certificação
- ❌ Definir validade da certificação
- ❌ Adicionar notas sobre qualificação

**Recomendação**: Implementar `InstructorCourse` é a solução profissional e escalável. 🚀
