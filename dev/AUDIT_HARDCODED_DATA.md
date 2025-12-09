# Auditoria de Dados Hardcoded

**Data**: 03/12/2025  
**Status**: ✅ Corrigido

---

## 📊 Resumo Executivo

| Categoria | Ocorrências | Severidade | Status |
|-----------|-------------|------------|--------|
| OrganizationId hardcoded | 22 | 🔴 CRÍTICO | ✅ Corrigido |
| UserId hardcoded | 5 | 🟡 MÉDIO | ✅ Corrigido |
| InstructorId hardcoded | 3 | 🟡 MÉDIO | ✅ Corrigido |
| CourseId hardcoded | 3 | 🟢 BAIXO | Demo/test |
| StudentId hardcoded (test) | 6 | 🟢 BAIXO | Test files |

---

## 🔴 OrganizationIds Hardcoded (CRÍTICO)

### IDs Encontrados

| UUID | Organização | Ocorrências |
|------|-------------|-------------|
| `ff5ee00e-d8a3-4291-9428-d28b852fb472` | Smart Defence | 12 |
| `a55ad715-2eb0-493c-996c-bb0f60bacec9` | Academia antiga | 5 |
| `452c0b35-1822-4890-851e-922356c812fb` | Academia Demo | 1 (corrigido) |

### Arquivos Afetados

#### 1. **CRÍTICOS - Afetam produção**

| Arquivo | Linha | Contexto | Correção |
|---------|-------|----------|----------|
| `public/js/core/app.js` | 29 | DEV_ORG_ID fallback | ✅ OK como fallback dev |
| `public/js/core/organization-context.js` | 20 | DEV_ORG_ID | ✅ OK como fallback dev |
| `public/js/shared/organization-context.js` | 26 | Fallback | ✅ OK como fallback |
| `public/js/components/organization-selector-init.js` | 45, 77 | Fallback | ✅ OK como fallback |
| `public/js/modules/auth/index.js` | 210 | Login fallback | ✅ OK como fallback |
| `public/js/modules/packages/index.js` | ~99 | ❌ Hardcoded header | ✅ CORRIGIDO |

#### 2. **MÉDIOS - Módulos específicos** ✅ CORRIGIDOS

| Arquivo | Linha | Problema | Status |
|---------|-------|----------|--------|
| `public/js/modules/turmas-consolidated.js` | 1116 | ID antigo hardcoded | ✅ CORRIGIDO |
| `public/js/modules/turmas-simple.js` | 277-279 | IDs hardcoded | ✅ CORRIGIDO |
| `public/js/modules/create-turma-from-course.js` | 29-31 | IDs hardcoded | ✅ CORRIGIDO |
| `public/js/modules/turmas/controllers/TurmasEditorController.js` | 209 | ID antigo | ✅ CORRIGIDO |
| `public/js/modules/crm/index.js` | 2227 | Fallback antigo | ✅ CORRIGIDO |

#### 3. **BAIXOS - Fallbacks aceitáveis**

| Arquivo | Linha | Contexto | Status |
|---------|-------|----------|--------|
| `public/js/modules/students/controllers/editor-controller.js` | 839, 3464, 3496, 3936, 4019, 4225 | Usa localStorage primeiro | ✅ OK |
| `public/js/modules/graduation/index.js` | 116, 628, 1454 | Fallback após dinâmico | ✅ OK |

---

## 🟡 UserIds Hardcoded (MÉDIO) ✅ CORRIGIDOS

| Arquivo | Linha | UUID | Status |
|---------|-------|------|--------|
| `public/js/modules/crm/index.js` | 948, 972, 999, 1232 | `de5b9ba7-...` | ✅ Usa `window.currentUser?.id` |

---

## 🟢 IDs de Teste/Demo (BAIXO)

### students_backup/ (arquivos de teste)
- `test-guide.js` - StudentIds para testes manuais
- `demo-and-testing.js` - IDs de demonstração

### courses/controllers/ (dados demo)
- `course-details-controller.js` - IDs de técnicas demo

**Ação**: Manter como estão (arquivos de desenvolvimento/teste).

---

## ✅ Padrão Correto de Obtenção de OrganizationId

```javascript
// 1. Prioridade: localStorage (definido no login/seleção)
const orgId = localStorage.getItem('activeOrganizationId');

// 2. Fallback: sessionStorage
const orgId = sessionStorage.getItem('activeOrganizationId');

// 3. Fallback: window global
const orgId = window.currentOrganizationId;

// 4. Fallback: contexto do app
const orgId = window.academyApp?.organizationId;

// 5. Fallback: usuário atual
const orgId = window.currentUser?.organizationId;

// PADRÃO RECOMENDADO (em ordem de prioridade)
function getOrganizationId() {
    return localStorage.getItem('activeOrganizationId') 
        || sessionStorage.getItem('activeOrganizationId')
        || window.currentOrganizationId
        || window.academyApp?.organizationId
        || window.currentUser?.organizationId
        || null; // NÃO usar fallback hardcoded em produção
}
```

---

## 📋 Correções Aplicadas (03/12/2025)

### 1. packages/index.js ✅
```javascript
// ANTES - hardcoded
this.apiHelper = window.createModuleAPI('Packages', {
    defaultHeaders: { 'x-organization-id': '452c0b35-...' }
});

// DEPOIS - dinâmico
this.apiHelper = window.createModuleAPI('Packages');
```

### 2. turmas-consolidated.js ✅
```javascript
// ANTES
turmaData.organizationId = 'a55ad715-...';

// DEPOIS
turmaData.organizationId = localStorage.getItem('activeOrganizationId') 
    || window.currentUser?.organizationId;
```

### 3. turmas-simple.js ✅
```javascript
// ANTES - IDs hardcoded de instructor, org, unit
instructorId: 'ba8a4a0b-...',
organizationId: 'a55ad715-...',
unitId: 'ba8a4a0b-...',

// DEPOIS - dinâmico
const orgId = localStorage.getItem('activeOrganizationId') || window.currentUser?.organizationId;
organizationId: orgId,
// instructorId e unitId devem ser selecionados pelo usuário
```

### 4. create-turma-from-course.js ✅
Mesma correção de turmas-simple.js

### 5. TurmasEditorController.js ✅
```javascript
// ANTES
organizationId: 'a55ad715-...',

// DEPOIS
const orgId = localStorage.getItem('activeOrganizationId') || window.currentUser?.organizationId;
organizationId: orgId,
```

### 6. crm/index.js ✅
```javascript
// ANTES - userId hardcoded
const userId = 'de5b9ba7-...'; // TODO

// DEPOIS - dinâmico
const userId = window.currentUser?.id;
```

---

## 📝 Notas

- O `api-client.js` já obtém automaticamente o `organizationId` do `localStorage`
- Módulos que usam `createModuleAPI()` não precisam passar headers manualmente
- Fallbacks para desenvolvimento são aceitáveis, mas devem ser documentados
- Em produção, a organização deve vir do usuário logado
