# Diagnóstico: Curso Não Aparece no Pacote + Import 400

**Data**: 05/10/2025 03:28  
**Status**: 🔴 CRÍTICO - Servidor crashando + Curso vazio + Import falhando

---

## Situação Atual

### 1️⃣ GET /api/courses retorna array vazio
```javascript
// Console do browser
api-client.js:238 🔧 parseResponse - Raw text: {"success":true,"data":[]}
index.js?v=2.0.1:1416 ✅ Cursos carregados: 0
```

**Problema**: Apesar do fix de `getOrganizationId(request)`, o endpoint continua retornando vazio.

**Possíveis causas**:
- ✅ **Organizações diferentes**: Curso criado em org `7991cd3c-...` mas pacote em `a55ad715-...`
- ❌ **Função não corrigida**: NÃO! Já verificamos que `courseController.ts` usa `getOrganizationId(request)`
- ❌ **Headers não enviados**: Browser **ESTÁ** enviando headers (vimos nos logs)
- ⚠️ **Curso nunca foi criado**: Import falhou com 400 Bad Request

### 2️⃣ Import falha com 400 Bad Request
```javascript
api-client.js:188  POST http://localhost:3000/api/courses/import-full-course 400 (Bad Request)
```

**Contexto**: Usuário tentou reimportar o curso `cursofaixabranca.json` mas o endpoint retornou erro 400.

**Possíveis causas**:
- Endpoint `/api/courses/import-full-course` não existe (404 → mas retornou 400!)
- Validação Zod falhando no payload
- Erro de TypeScript crashando o handler
- Organizat ionId não resolvido corretamente

### 3️⃣ Servidor crashando silenciosamente
```bash
PS H:\projetos\academia> npm run build
# ... 615 errors in 62 files ...
```

**Problema GRAVE**: O projeto **NÃO COMPILA** no TypeScript!

**Arquivos com erros**:
- `src/services/evaluationService.ts` (8 erros)
- `src/services/financialService.ts` (9 erros)
- `src/services/googleAdsService.ts` (34 erros)
- `src/services/multiAIService.ts` (22 erros)
- `src/types/index.ts` (13 erros - tipos faltando!)

**Consequência**: O servidor inicia mas **qualquer requisição que toque esses arquivos explode**.

---

## Análise Detalhada

### Fix Anterior (Parcial)

✅ **O que foi corrigido**:
```typescript
// src/routes/courses.ts - CORRIGIDO
async function getOrganizationId(request: FastifyRequest): Promise<string> {
  // 1) Body organizationId
  // 2) Headers x-organization-id / x-organization-slug
  // 3) Fallback primeira organização
}
```

✅ **Chamadas atualizadas**:
- Linha 187: `/import` endpoint
- Linha 442: `/import-full-course` endpoint

❌ **O que NÃO foi verificado**:
- Se o endpoint `/import-full-course` **realmente existe** nas rotas registradas
- Se o payload do frontend está correto (validação Zod)
- Se a organização está sendo passada no body/header do import
- Se há curso no banco de dados (possivelmente NENHUM curso existe!)

### Estado do Banco de Dados

**⚠️ HIPÓTESE CRÍTICA**: Não há curso no banco!

Evidências:
1. GET /api/courses retorna `[]` para **QUALQUER** organização
2. Import anterior (sessão passada) pode ter **rollback** por erro
3. Logs dizem "Import executado com sucesso" mas **SEM CONFIRMAÇÃO** de criação

**Verificação necessária**:
```sql
SELECT id, name, organizationId FROM "Course";
-- Espera-se: ZERO linhas (banco vazio)
```

---

## Plano de Ação (Priorizado)

### CRÍTICO (Fazer AGORA)

#### ✅ **PASSO 1: Verificar Estado do Banco**
```powershell
# Abrir Prisma Studio (já em execução)
# Navegar para: Course → Ver quantos registros existem
# Navegar para: Organization → Confirmar organizações existentes
```

**Resultado esperado**:
- **SE Course vazio** → Ir para PASSO 2 (Criar curso manualmente)
- **SE Course existe** → Ir para PASSO 3 (Verificar organizationId)

#### ✅ **PASSO 2: Criar Curso Manualmente (SQL)**
```sql
-- Usar a organização do pacote "Ilimitado"
INSERT INTO "Course" (
  id,
  name,
  description,
  "organizationId",
  "martialArtId",
  level,
  duration,
  "isActive",
  "createdAt",
  "updatedAt"
) VALUES (
  'krav-maga-faixa-branca-2025',
  'Krav Maga Faixa Branca',
  'Curso introdutório de Krav Maga para iniciantes',
  'a55ad715-2eb0-493c-996c-bb0f60bacec9', -- MESMA ORG DO PACOTE
  (SELECT id FROM "MartialArt" WHERE "organizationId" = 'a55ad715-2eb0-493c-996c-bb0f60bacec9' LIMIT 1),
  'BEGINNER',
  18, -- weeks
  true,
  NOW(),
  NOW()
);
```

**Validação**: Recarregar browser → Pacote editor → Ver curso no dropdown

#### ✅ **PASSO 3: Verificar Endpoint /import-full-course**
```bash
# Verificar se rota está registrada
grep -r "import-full-course" src/routes/
grep -r "import-full-course" src/server.ts
```

**Resultado esperado**:
- Endpoint existe em `src/routes/courses.ts` linha 442
- Rota registrada em `src/server.ts` via `coursesRoutes(app)`

#### ✅ **PASSO 4: Testar Import com Payload Mínimo**
```javascript
// No browser console:
const testPayload = {
  courseId: 'test-course-123',
  name: 'Curso Teste',
  description: 'Teste mínimo',
  durationTotalWeeks: 1,
  totalLessons: 1,
  lessonDurationMinutes: 60,
  difficulty: 'Iniciante',
  organizationId: 'a55ad715-2eb0-493c-996c-bb0f60bacec9', // EXPLÍCITO
  techniques: [],
  activities: ['TECHNIQUE'],
  objectives: [],
  equipment: [],
  warmup: { description: 'Aquecimento', duration: 5, type: 'STRETCH' },
  cooldown: { description: 'Alongamento', duration: 5, type: 'STRETCH' },
  schedule: { weeks: [] }
};

const response = await fetch('/api/courses/import-full-course', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-organization-id': 'a55ad715-2eb0-493c-996c-bb0f60bacec9'
  },
  body: JSON.stringify(testPayload)
});

console.log('Status:', response.status);
console.log('Response:', await response.json());
```

**Resultado esperado**:
- **200/201**: Import funciona! Problema é payload do arquivo JSON
- **400**: Erro de validação Zod → Ver mensagem exata
- **500**: Erro interno → Ver logs do servidor

### ALTA (Depois de resolver CRÍTICO)

#### ✅ **PASSO 5: Corrigir Erros TypeScript Bloqueantes**

**Problema**: 615 erros impedem compilação TypeScript

**Foco**: Apenas arquivos que afetam rotas de Course/Import:
1. `src/routes/courses.ts` (já corrigido)
2. `src/controllers/courseController.ts` (verificar tipos)
3. `src/services/courseImportService.ts` (1 erro apenas)

**Não mexer** (por hora):
- Services não relacionados (googleAds, financial, evaluation, etc.)
- Rotas não relacionadas (analytics, ai, pedagogical, etc.)

**Comando para rodar sem build**:
```bash
# Usar tsx diretamente (tolera erros de tipo)
npx tsx src/server.ts
```

#### ✅ **PASSO 6: Adicionar Logs Detalhados**

Adicionar console.logs no endpoint `/import-full-course` para debug:

```typescript
// src/routes/courses.ts linha 442
app.post('/import-full-course', async (request, reply) => {
  console.log('🔍 /import-full-course - START');
  console.log('🔍 Headers:', request.headers);
  console.log('🔍 Body keys:', Object.keys(request.body || {}));
  
  try {
    const organizationId = await getOrganizationId(request);
    console.log('✅ Resolved organizationId:', organizationId);
    
    // ... resto do código
  } catch (error) {
    console.error('❌ Import failed:', error);
    // ... tratamento de erro
  }
});
```

### MÉDIA (Melhorias futuras)

- Adicionar validação explícita de organizationId no frontend
- Criar endpoint `/api/debug/organizations` para listar orgs disponíveis
- Adicionar teste automatizado para multi-tenancy
- Documentar fluxo de import completo

---

## Troubleshooting Rápido

### Problema: Curso não aparece no dropdown

**Checklist**:
```bash
✅ Servidor rodando? (http://localhost:3000/health)
✅ Curso existe no banco? (SELECT * FROM "Course")
✅ organizationId do curso = organizationId do pacote?
✅ Header x-organization-id enviado na requisição?
✅ Função getOrganizationId() recebe request?
✅ Browser console SEM erros 500?
```

**Solução rápida**: Criar curso manualmente com SQL (PASSO 2)

### Problema: Import retorna 400 Bad Request

**Checklist**:
```bash
✅ Endpoint /import-full-course existe?
✅ Payload tem todos os campos obrigatórios?
✅ organizationId está no body OU no header?
✅ Validação Zod passa? (ver logs do servidor)
✅ Técnicas existem no banco?
```

**Solução rápida**: Testar com payload mínimo (PASSO 4)

### Problema: Servidor crashando

**Causa**: 615 erros TypeScript

**Solução imediata**:
```bash
# NÃO usar npm run build
# NÃO usar npm run dev (usa tsx watch que compila)

# Usar tsx direto (ignora erros de tipo em desenvolvimento)
npx tsx src/server.ts
```

**Solução permanente**: Corrigir erros TypeScript (ver AUDIT_REPORT.md)

---

## Logs de Referência

### Console do Browser (Curso Vazio)
```javascript
// Pacote carregado OK
GET /api/billing-plans/67c3c6f3-5d65-46e6-bcb3-bb596850e797
Response: {
  "organizationId": "a55ad715-2eb0-493c-996c-bb0f60bacec9",
  "name": "Ilimitado"
}

// Cursos VAZIO ❌
GET /api/courses
Response: {"success":true,"data":[]}
```

### Console do Browser (Import Falhando)
```javascript
POST /api/courses/import-full-course 400 (Bad Request)
executeRequest @ api-client.js:188
```

### Terminal (Erros TypeScript)
```bash
src/types/index.ts:32:9 - error TS2304: Cannot find name 'UserRole'.
src/types/index.ts:61:15 - error TS2552: Cannot find name 'AIProvider'.
src/services/evaluationService.ts:161:7 - error TS2322: Type 'xyz' is not assignable...

Found 615 errors in 62 files.
```

---

## Próximos Comandos

```powershell
# 1. Abrir Prisma Studio (já rodando)
# Navegar: http://localhost:5555

# 2. Se Course vazio, executar SQL:
# (Copiar INSERT do PASSO 2 acima)

# 3. Recarregar browser e testar
# Ctrl + Shift + R

# 4. Se ainda vazio, rodar teste de import:
# (Copiar código JavaScript do PASSO 4)
```

---

## Status

🔴 **BLOQUEADOR CRÍTICO**: Curso não existe no banco  
🟡 **PROBLEMA SECUNDÁRIO**: TypeScript não compila (usar tsx direto)  
🟢 **FIX PARCIAL APLICADO**: getOrganizationId() corrigido

**Próxima Ação**: PASSO 1 - Verificar banco via Prisma Studio
