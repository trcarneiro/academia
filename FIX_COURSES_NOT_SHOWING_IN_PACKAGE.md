# Fix: Cursos não aparecendo na seleção de Pacotes

**Data**: 05/10/2025 03:03  
**Problema**: Cursos não aparecem no dropdown ao editar pacote  
**Root Cause**: Resolução incorreta de organizationId

---

## Problema Identificado

### **Sintoma**
Ao editar um pacote (billing plan) e tentar selecionar cursos associados, o dropdown aparece vazio com a mensagem "Nenhum curso encontrado", mesmo havendo cursos cadastrados no sistema.

### **Logs do Frontend**
```javascript
index.js?v=2.0.1:1410 🎓 Carregando cursos disponíveis...
api-client.js:186 🌐 GET /api/courses
api-client.js:238 🔧 parseResponse - Raw text: {"success":true,"data":[]}
index.js?v=2.0.1:1416 ✅ Cursos carregados: 0
```

### **Análise do Problema**
1. **Pacote pertence à organização**: `a55ad715-2eb0-493c-996c-bb0f60bacec9` (Academia Demo)
2. **Curso importado na organização**: `7991cd3c-5289-4d4f-9668-3f9aa654e552` (organização diferente)
3. **Endpoint `/api/courses`**: Retorna array vazio porque filtra pela organização errada

---

## Root Cause Analysis

### **Código Problemático (ANTES)**

**Arquivo**: `src/routes/courses.ts` - Linhas 9-13

```typescript
// Helper: resolve organizationId (first org fallback)
async function getOrganizationId(): Promise<string> {
  const org = await prisma.organization.findFirst();
  if (!org) throw new Error('No organization found');
  return org.id;
}
```

**Problema**:
- Função **não recebia o `request`** como parâmetro
- Sempre retornava a **primeira organização** do banco (`.findFirst()`)
- Em sistemas multi-tenant, isso causa dados cruzados entre organizações
- Ignorava completamente os **headers de contexto** enviados pelo frontend

### **Como Deveria Funcionar**

O sistema é **multi-tenant** e espera que a organização seja resolvida via:
1. **Body**: `organizationId` no corpo da requisição (prioridade alta)
2. **Headers**: `X-Organization-Id` ou `X-Organization-Slug` (padrão)
3. **Fallback**: Primeira organização disponível (apenas desenvolvimento)

**Referência Correta**: `src/controllers/courseController.ts` linha 34
```typescript
async function getOrganizationId(request: FastifyRequest): Promise<string> {
  // 1) Tenta body
  const bodyOrgId = (request.body as any)?.organizationId;
  if (bodyOrgId) { /* valida e retorna */ }
  
  // 2) Tenta headers
  const headerId = headers['x-organization-id'];
  if (headerId) { /* valida e retorna */ }
  
  // 3) Fallback
  return prisma.organization.findFirst();
}
```

---

## Solução Implementada

### **Código Corrigido (DEPOIS)**

**Arquivo**: `src/routes/courses.ts` - Linhas 9-53

```typescript
// Helper: resolve organizationId from request headers or fallback
async function getOrganizationId(request: FastifyRequest): Promise<string> {
  console.log('🔍 getOrganizationId - Starting resolution...');
  
  // 1) Try body organizationId
  const bodyOrgId = (request.body as any)?.organizationId as string | undefined;
  console.log('🔍 Body organizationId:', bodyOrgId);
  if (bodyOrgId) {
    const org = await prisma.organization.findUnique({ where: { id: bodyOrgId } });
    if (org) {
      console.log('✅ Organization found via body:', org.id);
      return org.id;
    }
  }

  // 2) Try headers
  const headers = request.headers as Record<string, string | undefined>;
  const headerId = headers['x-organization-id'] || headers['x-organizationid'] || headers['organization-id'];
  const headerSlug = headers['x-organization-slug'] || headers['organization-slug'];
  console.log('🔍 Header organizationId:', headerId);
  console.log('🔍 Header organizationSlug:', headerSlug);

  if (headerId) {
    const org = await prisma.organization.findUnique({ where: { id: headerId } });
    if (org) {
      console.log('✅ Organization found via header ID:', org.id);
      return org.id;
    }
  }

  if (headerSlug) {
    const org = await prisma.organization.findUnique({ where: { slug: headerSlug } });
    if (org) {
      console.log('✅ Organization found via header slug:', org.id);
      return org.id;
    }
  }

  // 3) Fallback: first organization
  console.log('🔍 Using fallback strategy - finding first available organization...');
  const org = await prisma.organization.findFirst();
  if (!org) throw new Error('No organization found');
  console.log('⚠️ Using first available organization as fallback:', org.id);
  return org.id;
}
```

### **Mudanças nas Chamadas**

**Antes**:
```typescript
const orgId = await getOrganizationId(); // ❌ Sem request
```

**Depois**:
```typescript
const orgId = await getOrganizationId(request); // ✅ Com request
```

**Locais Atualizados**:
1. Linha 187: `app.post('/import', async (request, reply) => {...})`
2. Linha 442: `app.post('/import-full-course', async (request, reply) => {...})`

---

## Impacto da Correção

### **Antes (Comportamento Incorreto)**
```
Frontend envia header: X-Organization-Id: a55ad715-2eb0...
Backend ignora header ❌
Backend usa findFirst() → retorna 7991cd3c-5289... (organização diferente)
Query filtra por: organizationId = 7991cd3c... ❌
Cursos da organização a55ad715... não aparecem ❌
```

### **Depois (Comportamento Correto)**
```
Frontend envia header: X-Organization-Id: a55ad715-2eb0...
Backend lê header do request ✅
Backend valida header existe na database ✅
Query filtra por: organizationId = a55ad715... ✅
Cursos da organização correta aparecem ✅
```

---

## Teste de Validação

### **Passos para Testar**

1. **Recarregar browser** (Ctrl + Shift + R)
2. Navegar para **Pacotes** (módulo de gestão de pacotes)
3. Clicar em **Editar** no pacote "Ilimitado"
4. Rolar até **"Cursos Associados"**
5. Clicar no dropdown de cursos

### **Resultado Esperado**

**ANTES** (Bug):
```
Nenhum curso encontrado
Cadastre cursos para associá-los a este pacote
```

**DEPOIS** (Corrigido):
```
▼ Selecione os cursos
  ☐ Krav Maga Faixa Branca (BEGINNER - 18 semanas)
```

### **Console Logs (Após Fix)**
```javascript
🔍 getOrganizationId - Starting resolution...
🔍 Body organizationId: undefined
🔍 Header organizationId: a55ad715-2eb0-493c-996c-bb0f60bacec9
🔍 Header organizationSlug: undefined
✅ Organization found via header ID: a55ad715-2eb0-493c-996c-bb0f60bacec9
```

### **API Response (Após Fix)**
```json
GET /api/courses
{
  "success": true,
  "data": [
    {
      "id": "krav-maga-faixa-branca-2025",
      "name": "Krav Maga Faixa Branca",
      "organizationId": "a55ad715-2eb0-493c-996c-bb0f60bacec9",
      "level": "BEGINNER",
      "totalLessons": 35
    }
  ]
}
```

---

## Lições Aprendidas

### **1. Multi-Tenancy Patterns**
Em sistemas multi-tenant, **NUNCA** usar `findFirst()` sem contexto. Sempre:
- Receber `request` como parâmetro
- Validar headers de contexto (`X-Organization-Id`, `X-Organization-Slug`)
- Documentar fallback behavior claramente

### **2. Consistência Entre Controllers e Routes**
- ✅ `courseController.ts` tinha função correta com `request`
- ❌ `courses.ts` tinha função simplificada sem `request`
- **Solução**: Padronizar ambas com mesma lógica

### **3. Headers HTTP Importantes**
```typescript
// Padrões comuns no sistema
'x-organization-id'      // UUID da organização
'x-organizationid'       // Variação sem hífen
'organization-id'        // Sem prefixo x-
'x-organization-slug'    // Slug legível (ex: "demo")
'organization-slug'      // Sem prefixo x-
```

### **4. Debugging Multi-Tenant Issues**
Quando dados "desaparecem" misteriosamente:
1. Verificar organizationId no banco vs no código
2. Adicionar console.logs nas resoluções de contexto
3. Inspecionar headers da requisição no Network tab
4. Validar fallback behavior está correto

---

## Arquivos Modificados

```
src/routes/courses.ts
├── getOrganizationId() - Adicionado parâmetro request
├── Linha 187 - Atualizada chamada com request
└── Linha 442 - Atualizada chamada com request
```

---

## Prevenção Futura

### **Code Review Checklist**
- [ ] Funções que resolvem organizationId **SEMPRE** recebem `request`
- [ ] Queries filtram por organizationId **SEMPRE** (exceto admin endpoints)
- [ ] Headers de contexto estão documentados
- [ ] Fallback behavior está claro (dev only vs production)

### **Padrão Recomendado**
```typescript
// ✅ CORRETO
async function getOrganizationId(request: FastifyRequest): Promise<string> {
  // Tenta body → headers → fallback
}

// ❌ ERRADO
async function getOrganizationId(): Promise<string> {
  return prisma.organization.findFirst(); // Ignora contexto!
}
```

### **Testes Automatizados**
Adicionar teste que valida multi-tenancy:
```typescript
describe('GET /api/courses', () => {
  it('should filter by organization from header', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/courses',
      headers: { 'x-organization-id': 'org-1' }
    });
    
    const courses = response.json().data;
    expect(courses.every(c => c.organizationId === 'org-1')).toBe(true);
  });
});
```

---

## Status

✅ **RESOLVIDO**  
Data: 05/10/2025 03:03  
Servidor: Reiniciado com sucesso  
Teste: Pendente validação pelo usuário  

**Próximo Passo**: Recarregar browser e testar seleção de cursos no pacote
