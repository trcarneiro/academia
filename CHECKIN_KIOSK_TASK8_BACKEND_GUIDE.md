# 🔧 CHECK-IN KIOSK - TASK 8: Backend Biometric Routes

## 📋 Objetivo

Implementar endpoints backend para suportar o sistema de reconhecimento facial.

**Tempo estimado:** 2-3 horas
**Complexidade:** Média
**Dependências:** ✅ Frontend COMPLETO, PostgreSQL, Prisma

---

## 📂 Estrutura de Arquivos a Criar

```
src/
├── routes/
│   └── biometric.ts              # ✨ NOVO - Endpoints biométricos
├── controllers/
│   └── biometricController.ts    # ✨ NOVO - Lógica de biometria
├── services/
│   └── biometricService.ts       # ✨ NOVO - Operações biométricas
└── types/
    └── biometric.ts              # ✨ NOVO - Tipos TypeScript

prisma/
└── schema.prisma                 # ✏️ ATUALIZAR - Novos modelos
```

---

## 🛠️ Step-by-Step Implementation

### Step 1: Prisma Schema Updates (30 minutos)

#### Arquivo: `prisma/schema.prisma`

**Adicionar ao modelo Student:**
```prisma
model Student {
    // ...existing fields
    
    // Biometric fields
    faceEmbedding     Float[]?                 // 128-dimensional vector
    facePhotoUrl      String?                  // Snapshot URL
    biometricEnabled  Boolean @default(false)
    biometricCreatedAt DateTime?
    
    // Relations
    biometricData     BiometricData?
    biometricAttempts BiometricAttempt[]
}
```

**Adicionar novos modelos:**
```prisma
model BiometricData {
    id                String @id @default(cuid())
    
    // Foreign key
    studentId         String @unique
    student           Student @relation(fields: [studentId], references: [id], onDelete: Cascade)
    
    // Biometric data
    faceEmbedding     Float[]              // 128-dim vector
    facePhotoUrl      String               // JPEG data:image/...
    quality           Int @default(0)      // 0-100
    
    // Metadata
    enrolledAt        DateTime @default(now())
    lastUpdated       DateTime @updatedAt
    organizationId    String
    
    // Indexes
    @@unique([organizationId, studentId])
    @@index([studentId])
    @@index([organizationId])
}

model BiometricAttempt {
    id                String @id @default(cuid())
    
    // Foreign key
    studentId         String
    student           Student @relation(fields: [studentId], references: [id], onDelete: Cascade)
    
    // Attempt data
    success           Boolean
    similarity        Float                // 0.0 - 1.0
    method            String               // 'camera', 'upload'
    result            String               // 'match', 'no_match', 'error'
    
    // Metadata
    attemptedAt       DateTime @default(now())
    organizationId    String
    
    // Indexes
    @@index([studentId, attemptedAt])
    @@index([organizationId, attemptedAt])
}
```

**Executar migração:**
```bash
npx prisma migrate dev --name add_biometric_fields
npx prisma generate
```

---

### Step 2: Criar BiometricService (45 minutos)

#### Arquivo: `src/services/biometricService.ts`

```typescript
import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';

export class BiometricService {
    /**
     * Save face embedding for a student
     */
    async saveEmbedding(studentId: string, organizationId: string, data: {
        embedding: number[];
        photoUrl: string;
        quality?: number;
    }) {
        try {
            logger.info(`Saving embedding for student ${studentId}`);

            // Upsert BiometricData
            const biometric = await prisma.biometricData.upsert({
                where: {
                    organizationId_studentId: {
                        organizationId,
                        studentId,
                    },
                },
                update: {
                    faceEmbedding: data.embedding,
                    facePhotoUrl: data.photoUrl,
                    quality: data.quality || 0,
                    lastUpdated: new Date(),
                },
                create: {
                    studentId,
                    organizationId,
                    faceEmbedding: data.embedding,
                    facePhotoUrl: data.photoUrl,
                    quality: data.quality || 0,
                },
            });

            // Update Student
            await prisma.student.update({
                where: { id: studentId },
                data: {
                    faceEmbedding: data.embedding,
                    facePhotoUrl: data.photoUrl,
                    biometricEnabled: true,
                    biometricCreatedAt: new Date(),
                },
            });

            logger.info('Embedding saved successfully');
            return biometric;
        } catch (error) {
            logger.error('Error saving embedding', error);
            throw error;
        }
    }

    /**
     * Get all embeddings for a given organization
     */
    async getEmbeddings(organizationId: string) {
        try {
            logger.info(`Fetching embeddings for org ${organizationId}`);

            const embeddings = await prisma.biometricData.findMany({
                where: {
                    organizationId,
                },
                select: {
                    id: true,
                    studentId: true,
                    faceEmbedding: true,
                    facePhotoUrl: true,
                    student: {
                        select: {
                            name: true,
                        },
                    },
                },
            });

            // Format response
            const formatted = embeddings.map((e) => ({
                id: e.studentId,
                name: e.student.name,
                embedding: e.faceEmbedding,
                facePhotoUrl: e.facePhotoUrl,
            }));

            logger.info(`Found ${formatted.length} embeddings`);
            return formatted;
        } catch (error) {
            logger.error('Error fetching embeddings', error);
            throw error;
        }
    }

    /**
     * Log a biometric recognition attempt
     */
    async logAttempt(studentId: string, organizationId: string, data: {
        success: boolean;
        similarity: number;
        method: 'camera' | 'upload';
    }) {
        try {
            const result = data.success ? 'match' : 'no_match';

            const attempt = await prisma.biometricAttempt.create({
                data: {
                    studentId,
                    organizationId,
                    success: data.success,
                    similarity: data.similarity,
                    method: data.method,
                    result,
                },
            });

            logger.info(`Biometric attempt logged: ${result}`);
            return attempt;
        } catch (error) {
            logger.error('Error logging attempt', error);
            // Don't throw - logging shouldn't block main flow
            return null;
        }
    }

    /**
     * Get biometric attempts for analysis
     */
    async getAttempts(organizationId: string, filters?: {
        studentId?: string;
        startDate?: Date;
        endDate?: Date;
    }) {
        try {
            const attempts = await prisma.biometricAttempt.findMany({
                where: {
                    organizationId,
                    ...(filters?.studentId && { studentId: filters.studentId }),
                    ...(filters?.startDate && {
                        attemptedAt: {
                            gte: filters.startDate,
                        },
                    }),
                    ...(filters?.endDate && {
                        attemptedAt: {
                            lte: filters.endDate,
                        },
                    }),
                },
                orderBy: {
                    attemptedAt: 'desc',
                },
            });

            return attempts;
        } catch (error) {
            logger.error('Error fetching attempts', error);
            throw error;
        }
    }

    /**
     * Delete biometric data for a student (GDPR compliance)
     */
    async deleteEmbedding(studentId: string, organizationId: string) {
        try {
            await prisma.$transaction([
                // Delete biometric data
                prisma.biometricData.deleteMany({
                    where: {
                        studentId,
                        organizationId,
                    },
                }),

                // Delete attempts
                prisma.biometricAttempt.deleteMany({
                    where: {
                        studentId,
                        organizationId,
                    },
                }),

                // Update student
                prisma.student.update({
                    where: { id: studentId },
                    data: {
                        faceEmbedding: null,
                        facePhotoUrl: null,
                        biometricEnabled: false,
                    },
                }),
            ]);

            logger.info(`Deleted biometric data for student ${studentId}`);
            return { success: true };
        } catch (error) {
            logger.error('Error deleting embedding', error);
            throw error;
        }
    }
}

export const biometricService = new BiometricService();
```

---

### Step 3: Criar BiometricController (30 minutos)

#### Arquivo: `src/controllers/biometricController.ts`

```typescript
import { FastifyReply, FastifyRequest } from 'fastify';
import { biometricService } from '@/services/biometricService';
import { logger } from '@/utils/logger';
import { ResponseHelper } from '@/utils/ResponseHelper';

export class BiometricController {
    /**
     * Save face embedding
     */
    static async saveEmbedding(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { studentId } = request.params as { studentId: string };
            const { embedding, photoUrl, quality } = request.body as any;
            const organizationId = (request as any).organizationId as string;

            // Validation
            if (!embedding || !Array.isArray(embedding) || embedding.length !== 128) {
                return reply.code(400).send(
                    ResponseHelper.error('Embedding must be a 128-dimensional array')
                );
            }

            if (!photoUrl || typeof photoUrl !== 'string') {
                return reply.code(400).send(
                    ResponseHelper.error('Photo URL is required')
                );
            }

            // Save
            const result = await biometricService.saveEmbedding(
                studentId,
                organizationId,
                {
                    embedding,
                    photoUrl,
                    quality: quality || 0,
                }
            );

            return reply.send(
                ResponseHelper.success(result, 'Face embedding saved successfully')
            );
        } catch (error) {
            logger.error('Error saving embedding', error);
            return reply.code(500).send(
                ResponseHelper.error('Failed to save embedding')
            );
        }
    }

    /**
     * Get all embeddings
     */
    static async getEmbeddings(request: FastifyRequest, reply: FastifyReply) {
        try {
            const organizationId = (request as any).organizationId as string;

            const embeddings = await biometricService.getEmbeddings(organizationId);

            return reply.send(
                ResponseHelper.success(embeddings, 'Embeddings retrieved successfully')
            );
        } catch (error) {
            logger.error('Error fetching embeddings', error);
            return reply.code(500).send(
                ResponseHelper.error('Failed to fetch embeddings')
            );
        }
    }

    /**
     * Log biometric attempt
     */
    static async logAttempt(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { studentId, success, similarity } = request.body as any;
            const organizationId = (request as any).organizationId as string;

            const attempt = await biometricService.logAttempt(
                studentId,
                organizationId,
                {
                    success,
                    similarity,
                    method: 'camera',
                }
            );

            return reply.send(
                ResponseHelper.success(attempt, 'Attempt logged')
            );
        } catch (error) {
            logger.error('Error logging attempt', error);
            return reply.code(500).send(
                ResponseHelper.error('Failed to log attempt')
            );
        }
    }

    /**
     * Delete embedding (GDPR)
     */
    static async deleteEmbedding(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { studentId } = request.params as { studentId: string };
            const organizationId = (request as any).organizationId as string;

            const result = await biometricService.deleteEmbedding(
                studentId,
                organizationId
            );

            return reply.send(
                ResponseHelper.success(result, 'Embedding deleted successfully')
            );
        } catch (error) {
            logger.error('Error deleting embedding', error);
            return reply.code(500).send(
                ResponseHelper.error('Failed to delete embedding')
            );
        }
    }
}
```

---

### Step 4: Criar Routes (30 minutos)

#### Arquivo: `src/routes/biometric.ts`

```typescript
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { BiometricController } from '@/controllers/biometricController';

// Schemas
const saveEmbeddingSchema = z.object({
    embedding: z.array(z.number()).length(128),
    photoUrl: z.string().url(),
    quality: z.number().optional(),
});

const logAttemptSchema = z.object({
    studentId: z.string().uuid(),
    success: z.boolean(),
    similarity: z.number().min(0).max(1),
});

export default async function biometricRoutes(fastify: FastifyInstance) {
    // POST: Save face embedding
    fastify.post('/:studentId/face-embedding', async (request, reply) => {
        try {
            const body = saveEmbeddingSchema.parse(request.body);
            request.body = body;
            return BiometricController.saveEmbedding(request, reply);
        } catch (error) {
            return reply.code(400).send({ success: false, message: 'Validation error' });
        }
    });

    // GET: Fetch all embeddings
    fastify.get('/students/embeddings', async (request, reply) => {
        return BiometricController.getEmbeddings(request, reply);
    });

    // POST: Log attempt
    fastify.post('/attempts', async (request, reply) => {
        try {
            const body = logAttemptSchema.parse(request.body);
            request.body = body;
            return BiometricController.logAttempt(request, reply);
        } catch (error) {
            return reply.code(400).send({ success: false, message: 'Validation error' });
        }
    });

    // DELETE: Remove embedding (GDPR)
    fastify.delete('/:studentId/face-embedding', async (request, reply) => {
        return BiometricController.deleteEmbedding(request, reply);
    });
}
```

---

### Step 5: Registrar Routes no Server (10 minutos)

#### Arquivo: `src/server.ts`

**Adicionar ao registro de routes:**
```typescript
// Existing imports
import biometricRoutes from '@/routes/biometric';

// ... inside fastify setup
fastify.register(biometricRoutes, { prefix: '/api/biometric' });
```

---

### Step 6: Criar Tipos TypeScript (15 minutos)

#### Arquivo: `src/types/biometric.ts`

```typescript
export interface FaceEmbedding {
    id: string;
    studentId: string;
    embedding: number[];
    photoUrl: string;
    quality: number;
}

export interface BiometricAttempt {
    id: string;
    studentId: string;
    success: boolean;
    similarity: number;
    method: 'camera' | 'upload';
    result: 'match' | 'no_match' | 'error';
    attemptedAt: Date;
}

export interface SaveEmbeddingRequest {
    embedding: number[];
    photoUrl: string;
    quality?: number;
}

export interface LogAttemptRequest {
    studentId: string;
    success: boolean;
    similarity: number;
}
```

---

## ✅ Checklist de Validação

### Backend Implementation
- [ ] Prisma schema atualizado com novos modelos
- [ ] Migração Prisma executada sem erros
- [ ] BiometricService implementado (5 métodos)
- [ ] BiometricController implementado (4 métodos)
- [ ] Routes registradas (/api/biometric/*)
- [ ] Tipos TypeScript definidos
- [ ] Build: `npm run build` sem erros
- [ ] Lint: `npm run lint` passa

### API Testing
- [ ] POST /api/biometric/students/:studentId/face-embedding → 200
- [ ] GET /api/biometric/students/embeddings → 200 (array)
- [ ] POST /api/biometric/attempts → 200
- [ ] DELETE /api/biometric/students/:studentId/face-embedding → 200

### Database
- [ ] BiometricData table criada
- [ ] BiometricAttempt table criada
- [ ] Student.faceEmbedding adicionado
- [ ] Índices criados corretamente
- [ ] Foreign keys funcionando

### Integration
- [ ] Endpoints retornam formato `{ success, data, message }`
- [ ] organizationId extraído corretamente
- [ ] Error handling implementado
- [ ] Logging funcional

---

## 📊 API Endpoints Summary

```typescript
// Save embedding
POST /api/biometric/students/:studentId/face-embedding
Body: { embedding: Float[], photoUrl: string, quality?: number }
Response: { success: true, data: { id, studentId, ... } }

// Get all embeddings
GET /api/biometric/students/embeddings
Response: { success: true, data: [{ id, name, embedding, facePhotoUrl }, ...] }

// Log attempt
POST /api/biometric/attempts
Body: { studentId: string, success: boolean, similarity: number }
Response: { success: true, data: { id, studentId, ... } }

// Delete embedding (GDPR)
DELETE /api/biometric/students/:studentId/face-embedding
Response: { success: true, data: { success: true } }
```

---

## 🚀 Próximos Passos (Depois de Task 8)

### Task 9: Menu Integration
- Adicionar link "📸 Check-in Kiosk" no menu
- Criar `/public/views/checkin-kiosk.html`
- Registrar no `AcademyApp.loadModules()`

### Task 10: Testing
- Testar fluxo completo (camera → face detection → check-in)
- Validar responsividade
- Testes de performance

---

**Tempo Total Estimado:** 2-3 horas
**Complexidade:** Média
**Risco:** Baixo

---

**Data:** 17/10/2025
**Versão:** 1.0
**Próxima Tarefa:** Task 9 - Menu Integration
