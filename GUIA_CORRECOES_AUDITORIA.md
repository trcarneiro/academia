# GUIA DE CORREÇÕES - Auditoria Pré-Produção

Este guia contém exemplos práticos de como corrigir cada tipo de problema identificado na auditoria.

---

## 🎯 P1 - PROBLEMAS DE ALTA PRIORIDADE

### 1. Frontend - Migrar para API Client Pattern

**Módulos afetados**: `ai`, `ai-dashboard`, `auth`, `import`, `instructors`, `lesson-plans`, `organizations`, `units`

#### ❌ ANTES (Código antigo)
```javascript
// /public/js/modules/instructors/index.js
async function loadInstructors() {
    try {
        const response = await fetch('/api/instructors');
        const data = await response.json();
        renderInstructors(data);
    } catch (error) {
        console.error('Erro:', error);
    }
}
```

#### ✅ DEPOIS (Código correto)
```javascript
// /public/js/modules/instructors/index.js

// 1. Inicializar API Client no topo do módulo
let instructorsAPI = null;

async function init() {
    // Aguardar carregamento do api-client.js
    await waitForAPIClient();
    instructorsAPI = window.createModuleAPI('Instructors');
    
    await loadInstructors();
}

// 2. Usar fetchWithStates para UI automática
async function loadInstructors() {
    const container = document.getElementById('instructors-list');
    
    await instructorsAPI.fetchWithStates('/api/instructors', {
        loadingElement: container,
        onSuccess: (data) => renderInstructors(data.data),
        onEmpty: () => showEmptyState('Nenhum instrutor cadastrado'),
        onError: (error) => showErrorState(error)
    });
}

// 3. Helper para aguardar API client
function waitForAPIClient() {
    return new Promise((resolve) => {
        if (window.createModuleAPI) {
            resolve();
        } else {
            const interval = setInterval(() => {
                if (window.createModuleAPI) {
                    clearInterval(interval);
                    resolve();
                }
            }, 100);
        }
    });
}
```

**Benefícios**:
- ✅ Retry automático (3 tentativas)
- ✅ Cache (5min padrão)
- ✅ Estados UI (loading/empty/error)
- ✅ Error handling normalizado

---

### 2. Frontend - Integrar ao AcademyApp

**Módulos afetados**: `activities`, `ai-dashboard`

#### ❌ ANTES (Código antigo)
```javascript
// Módulo não registrado, sem eventos

const MyModule = {
    init() {
        this.loadData();
    }
};
```

#### ✅ DEPOIS (Código correto)
```javascript
const MyModule = {
    init() {
        this.loadData();
        
        // 1. Registrar globalmente
        window.myModule = this;
        
        // 2. Disparar evento de carregamento
        if (window.app) {
            window.app.dispatchEvent('module:loaded', {
                name: 'myModule',
                timestamp: new Date()
            });
        }
    },
    
    async loadData() {
        try {
            // ... código ...
        } catch (error) {
            // 3. Usar error handling global
            if (window.app) {
                window.app.handleError(error, {
                    module: 'myModule',
                    context: 'loadData',
                    severity: 'error'
                });
            } else {
                console.error('Erro no módulo:', error);
            }
        }
    }
};

// 4. Certificar que está no AcademyApp.loadModules()
// Em /public/js/core/app.js:
// const moduleList = ['students', 'instructors', 'myModule', ...];
```

**Validação**: Abrir console → digitar `window.myModule` → deve retornar o objeto do módulo

---

### 3. Backend - Adicionar Error Handling

**Rotas afetadas**: `activities`, `activityExecutions`, `attendance`, `auth`, `biometric`, `graduation`, `hybrid-agenda`, `studentCourses`, `turmas`

#### ❌ ANTES (Código perigoso)
```typescript
// src/routes/activities.ts
fastify.get('/', async (_request, reply) => {
    const activities = await prisma.activity.findMany();
    reply.send(activities);
});
```

#### ✅ DEPOIS (Código seguro)
```typescript
// src/routes/activities.ts
import { logger } from '@/utils/logger';

fastify.get('/', async (_request, reply: FastifyReply) => {
    try {
        const activities = await prisma.activity.findMany({
            include: { course: true },
            orderBy: { createdAt: 'desc' }
        });
        
        return reply.send({
            success: true,
            data: activities,
            total: activities.length
        });
        
    } catch (error) {
        logger.error('Error fetching activities:', error);
        
        return reply.code(500).send({
            success: false,
            message: 'Falha ao buscar atividades'
        });
    }
});
```

**Padrão completo**:
1. ✅ Bloco try-catch em TODA rota
2. ✅ Logger para debug/monitoramento
3. ✅ Response code apropriado (500 para errors)
4. ✅ Mensagem amigável ao usuário

---

## 📋 P2 - PROBLEMAS DE MÉDIA PRIORIDADE

### 4. Frontend - Implementar Estados UI

**Módulos afetados**: `ai-dashboard`

#### ❌ ANTES (UX ruim)
```javascript
async function loadData() {
    const data = await fetch('/api/data').then(r => r.json());
    renderData(data);
}
```

#### ✅ DEPOIS (UX profissional)
```javascript
async function loadData() {
    const container = document.getElementById('data-container');
    
    // 1. Estado loading
    container.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Carregando dados...</p>
        </div>
    `;
    
    try {
        const response = await fetch('/api/data');
        const data = await response.json();
        
        if (data.length === 0) {
            // 2. Estado empty
            container.innerHTML = `
                <div class="empty-state">
                    <p>📭 Nenhum dado encontrado</p>
                    <button onclick="myModule.createNew()">Criar Novo</button>
                </div>
            `;
        } else {
            // 3. Estado success
            renderData(data);
        }
        
    } catch (error) {
        // 4. Estado error
        container.innerHTML = `
            <div class="error-state">
                <p>❌ Erro ao carregar dados</p>
                <p>${error.message}</p>
                <button onclick="myModule.loadData()">Tentar Novamente</button>
            </div>
        `;
    }
}
```

**CSS obrigatório** (adicionar em `/public/css/modules/[module].css`):
```css
.loading-state, .empty-state, .error-state {
    padding: 40px;
    text-align: center;
    border-radius: 8px;
}

.loading-state {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.empty-state {
    background: #f8f9fa;
    color: #666;
}

.error-state {
    background: #fee;
    color: #c00;
}

.spinner {
    border: 4px solid rgba(255,255,255,0.3);
    border-top: 4px solid white;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
    margin: 0 auto 16px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
```

---

### 5. Backend - Padronizar Response Format

**Rotas afetadas**: 16 rotas diversas

#### ❌ ANTES (Formato inconsistente)
```typescript
// Rota 1
reply.send(activities); // Array direto

// Rota 2
reply.send({ data: students, count: 10 }); // Objeto custom

// Rota 3
reply.send({ result: 'ok' }); // Outro formato
```

#### ✅ DEPOIS (Formato padronizado)
```typescript
// PADRÃO OFICIAL: {success: boolean, data?: any, message?: string}

// 1. Success com dados
return reply.send({
    success: true,
    data: activities,
    total: activities.length
});

// 2. Success sem dados (operação)
return reply.send({
    success: true,
    message: 'Atividade criada com sucesso'
});

// 3. Error
return reply.code(400).send({
    success: false,
    message: 'Email já cadastrado'
});

// 4. Error com detalhes
return reply.code(500).send({
    success: false,
    message: 'Erro ao processar requisição',
    error: error.message // Apenas em desenvolvimento
});
```

**Criar utility** (recomendado):
```typescript
// src/utils/ResponseHelper.ts
export class ResponseHelper {
    static success(reply: FastifyReply, data: any, message?: string) {
        return reply.send({
            success: true,
            data,
            message
        });
    }
    
    static error(reply: FastifyReply, code: number, message: string) {
        return reply.code(code).send({
            success: false,
            message
        });
    }
}

// Uso:
return ResponseHelper.success(reply, activities, 'Listagem de atividades');
return ResponseHelper.error(reply, 404, 'Atividade não encontrada');
```

---

## 🐢 P3 - PROBLEMAS DE PERFORMANCE

### 6. Backend - Adicionar Paginação

**Rotas afetadas**: 11 rotas com `findMany`

#### ❌ ANTES (Retorna tudo - lento)
```typescript
fastify.get('/', async (_request, reply) => {
    const students = await prisma.student.findMany(); // Pode retornar 1000+ registros
    reply.send(students);
});
```

#### ✅ DEPOIS (Paginação eficiente)
```typescript
interface QueryParams {
    page?: number;
    limit?: number;
}

fastify.get<{ Querystring: QueryParams }>('/', async (request, reply) => {
    const { page = 1, limit = 50 } = request.query;
    
    const skip = (page - 1) * limit;
    
    try {
        // 1. Buscar dados paginados
        const students = await prisma.student.findMany({
            take: limit,
            skip: skip,
            orderBy: { createdAt: 'desc' }
        });
        
        // 2. Contar total (para calcular páginas)
        const total = await prisma.student.count();
        
        return reply.send({
            success: true,
            data: students,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrev: page > 1
            }
        });
        
    } catch (error) {
        logger.error('Error fetching students:', error);
        return reply.code(500).send({
            success: false,
            message: 'Falha ao buscar alunos'
        });
    }
});
```

**Frontend - Consumir paginação**:
```javascript
async function loadStudents(page = 1) {
    const response = await instructorsAPI.request(
        `/api/students?page=${page}&limit=50`
    );
    
    renderStudents(response.data);
    renderPagination(response.pagination);
}

function renderPagination(pagination) {
    const html = `
        <div class="pagination">
            ${pagination.hasPrev ? `
                <button onclick="loadStudents(${pagination.page - 1})">
                    Anterior
                </button>
            ` : ''}
            
            <span>Página ${pagination.page} de ${pagination.totalPages}</span>
            
            ${pagination.hasNext ? `
                <button onclick="loadStudents(${pagination.page + 1})">
                    Próxima
                </button>
            ` : ''}
        </div>
    `;
    
    document.getElementById('pagination-container').innerHTML = html;
}
```

---

## ✅ CHECKLIST DE VALIDAÇÃO

Após cada correção, verificar:

### Frontend
- [ ] Módulo usa `createModuleAPI('ModuleName')`
- [ ] Tem 3 estados: loading, empty, error
- [ ] Registrado globalmente: `window.myModule`
- [ ] Dispara evento: `window.app.dispatchEvent('module:loaded')`
- [ ] Usa `window.app.handleError()` para erros
- [ ] CSS isolado: `.module-isolated-mymodule-*`
- [ ] Responsivo: 768px, 1024px, 1440px
- [ ] Sem erros no console do navegador

### Backend
- [ ] Toda rota tem try-catch
- [ ] Logger em operações críticas
- [ ] Response format: `{success, data, message}`
- [ ] Códigos HTTP corretos (200, 400, 404, 500)
- [ ] findMany tem take/skip
- [ ] Inclui validação Zod (se aceita input)
- [ ] Sem N+1 queries (usar includes estratégicos)
- [ ] TypeScript sem erros: `npm run build`

---

## 🚀 SCRIPTS DE VALIDAÇÃO

### Rodar após correções
```powershell
# 1. Validar build
npm run build

# 2. Rodar auditoria novamente
.\scripts\quick-audit.ps1

# 3. Testar no navegador
npm run dev
# Abrir http://localhost:3000
# Testar módulo corrigido
```

---

## 📚 REFERÊNCIAS

- **Padrões oficiais**: `AGENTS.md` (v2.1)
- **Módulos de referência**:
  - Single-file: `/public/js/modules/instructors/`
  - Multi-file: `/public/js/modules/activities/`
  - Avançado: `/public/js/modules/students/`
- **Design System**: `dev/DESIGN_SYSTEM.md`
- **API Client**: `/public/js/shared/api-client.js`

---

**Última atualização**: 19/10/2025 19:00
**Versão**: 1.0
