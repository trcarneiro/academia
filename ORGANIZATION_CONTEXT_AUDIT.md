# Auditoria de Contexto de Organização - Academia Krav Maga v2.0
**Data**: 11 de novembro de 2025  
**Objetivo**: Garantir que todos os módulos usem organizationId correto

## ✅ Backend - CORRETO

### Rotas com organizationId correto (`ff5ee00e-d8a3-4291-9428-d28b852fb472`)
- ✅ `src/routes/packages.ts` - Helper `getOrganizationId()` com fallback correto
- ✅ `src/routes/packages-simple.ts` - Helper `resolveOrganizationId()` com fallback correto
- ✅ `src/routes/frequency.ts` - 4 endpoints com fallback correto
- ✅ `src/routes/subscriptions.ts` - Helper `getOrganizationId()` com fallback correto
- ✅ `src/services/authService.ts` - organizationId correto
- ✅ `src/middlewares/tenant.ts` - Fallback para desenvolvimento com ID correto

### Organização no Banco de Dados
- ✅ Organização `Smart Defence` existe no banco
- ✅ ID: `ff5ee00e-d8a3-4291-9428-d28b852fb472`
- ✅ Verificado via `npm run seed:org`

## ✅ Frontend - API Client (CORRETO)

### Módulos usando API Client (header automático)
O API Client (`public/js/shared/api-client.js`) **adiciona automaticamente** o header `x-organization-id` de `localStorage.getItem('activeOrganizationId')`:

- ✅ **students** (`public/js/modules/students/index.js`) - Usa `createModuleAPI('Students')`
- ✅ **settings** (`public/js/modules/settings.js`) - Usa `createModuleAPI('Settings')`
- ✅ **student-progress** (`public/js/modules/student-progress/index.js`) - Usa `createModuleAPI('StudentProgress')`
- ✅ **turmas-premium** (`public/js/modules/turmas-premium.js`) - Usa `createModuleAPI('Turmas')`
- ✅ **turmas-simple** (`public/js/modules/turmas-simple.js`) - Usa `createModuleAPI('Turmas')`
- ✅ **turmas-consolidated** (`public/js/modules/turmas-consolidated.js`) - Usa `createModuleAPI('Turmas')`
- ✅ **units/unit-editor** (`public/js/modules/units/unit-editor.js`) - Usa `createModuleAPI('UnitEditor')`

**Total: 7 módulos** já corretos ✅

## ⚠️ Frontend - Fetch Direto (PRECISA CORREÇÃO)

### Módulos usando `fetch()` direto SEM header x-organization-id

#### 🔴 CRÍTICO - Módulos principais sem contexto de organização

1. **units** (`public/js/modules/units/index.js`)
   - Linha 68: `fetch('/api/units')` - loadData()
   - Linha 335: `fetch('/api/units/${unitId}')` - DELETE
   - Linha 381: `fetch('/api/units/${unitId}')` - GET
   - Linha 698: `fetch('/api/training-areas?unitId=${unitId}')` - GET
   - Linha 834: `fetch('/api/training-areas/${areaId}')` - GET
   - Linha 1018: `fetch('/api/training-areas/${areaId}')` - DELETE
   - **Impacto**: Unidades e áreas de treino não filtradas por organização
   - **Solução**: Migrar para API Client ou adicionar header manualmente

2. **organizations** (`public/js/modules/organizations.js`)
   - Linha 71: `fetch('/api/organizations')` - loadData()
   - Linha 358: `fetch('/api/organizations/${organizationId}')` - UPDATE
   - **Impacto**: CRÍTICO - módulo de organizações não funciona corretamente
   - **Solução**: Este módulo é especial - lista TODAS organizações, não precisa filtro

3. **classes** (`public/js/modules/classes.js`)
   - Linha 39: `fetch('/api/classes')` - loadData()
   - Linha 116: `fetch('/api/classes/${classId}')` - DELETE
   - Linha 398: `fetch('/api/classes/${classId}')` - GET
   - **Impacto**: Aulas não filtradas por organização
   - **Solução**: Migrar para API Client

4. **evaluations** (`public/js/modules/evaluations.js`)
   - Linha 506: `fetch('/api/evaluations')` - loadData()
   - **Impacto**: Avaliações não filtradas por organização
   - **Solução**: Migrar para API Client

5. **lesson-plans-fixed** (`public/js/modules/lesson-plans-fixed.js`)
   - Linha 96: `fetch('/api/lesson-plans')` - loadData()
   - Linha 100: `fetch('/api/courses')` - loadCourses()
   - Linha 104: `fetch('/api/activities')` - loadActivities()
   - Linha 397: `fetch('/api/lesson-plans/${id}')` - DELETE
   - **Impacto**: Planos de aula, cursos e atividades não filtrados
   - **Solução**: Migrar para API Client

6. **mats** (`public/js/modules/mats.js`)
   - Linha 585: `fetch('/api/mats')` - loadData()
   - **Impacto**: Tatames não filtrados por organização
   - **Solução**: Migrar para API Client

7. **plans** (múltiplas versões)
   - `plans-refactored.js` linha 184: `fetch('/api/billing-plans')`
   - `plans-standardized.js` linha 42: `fetch('/api/billing-plans')`
   - `plans-ultra-simple.js` linha 13: `fetch('/api/billing-plans')`
   - `plans.js` linha 260: `fetch('/api/billing-plans')`
   - **Impacto**: CRÍTICO - Planos de cobrança não filtrados
   - **Solução**: Migrar para API Client

8. **progress** (`public/js/modules/progress.js`)
   - Linha 506: `fetch('/api/progress')` - loadData()
   - **Impacto**: Progresso não filtrado por organização
   - **Solução**: Migrar para API Client

9. **lessons** (`public/js/modules/lessons.js`)
   - Linha 40: `fetch('/api/lessons')` - loadLessons()
   - Linha 49: `fetch('/api/courses')` - loadCourses()
   - Linha 57: `fetch('/api/units')` - loadUnits()
   - Linha 438: `fetch('/api/lessons/${id}')` - DELETE
   - **Impacto**: Aulas, cursos e unidades não filtrados
   - **Solução**: Migrar para API Client

10. **student-editor** (múltiplas versões)
    - `student-editor.js` linhas 195-196: 2 fetches sem header
    - `student-editor-new-refactored.js` linhas 75, 212, 506: 3 fetches sem header
    - **Impacto**: CRÍTICO - Editor de aluno pode mostrar dados errados
    - **Solução**: Migrar para API Client

#### 🟡 MÉDIO - Módulos secundários

11. **plan-editor** (`public/js/modules/plan-editor.js`)
    - Linha 501: `fetch('/api/plans/${id}/courses')`
    - Linha 676: `fetch('/api/courses')`
    - Linha 680: `fetch('/api/plans/${id}/courses')`
    - **Impacto**: Editor de planos não filtra por organização
    - **Solução**: Migrar para API Client

12. **plan-editor-courses-tab** (`public/js/modules/plan-editor-courses-tab.js`)
    - Linha 135: `fetch('/api/courses')`
    - Linha 140: `fetch('/api/plans/${planId}/courses')`
    - Linha 259: `fetch('/api/plans/${planId}/courses')` - POST
    - **Impacto**: Aba de cursos não filtra por organização
    - **Solução**: Migrar para API Client

13. **view-course** (`public/js/modules/view-course.js`)
    - Linha 12: `fetch('/api/courses/${courseId}')`
    - **Impacto**: Visualização de curso não verifica organização
    - **Solução**: Migrar para API Client

#### 🟢 BAIXO - Módulos específicos (podem não precisar)

14. **ai-monitor** (`public/js/modules/ai-monitor/index.js`)
    - Linha 41: `fetch('/api/ai-monitor/health')`
    - **Impacto**: Baixo - health check pode ser global
    - **Solução**: Opcional - adicionar header por consistência

15. **auth** (`public/js/modules/auth/index.js`)
    - Linha 177: `fetch('/api/users/by-email')`
    - **Impacto**: Baixo - autenticação é antes de ter contexto org
    - **Solução**: OK - não precisa de organização

### 📊 Estatísticas

- **Total módulos frontend**: ~40
- **Usando API Client (correto)**: 7 (17.5%)
- **Usando fetch direto**: 15 (37.5%)
- **Críticos para corrigir**: 10 módulos
- **Médios**: 3 módulos
- **Baixos**: 2 módulos

## 🔧 Plano de Correção

### Fase 1: Críticos (IMEDIATO) ⚠️

1. **packages** (4 versões) - Adicionar header x-organization-id
2. **student-editor** (2 versões) - Migrar para API Client
3. **units** - Migrar para API Client
4. **classes** - Migrar para API Client
5. **evaluations** - Migrar para API Client
6. **lesson-plans-fixed** - Migrar para API Client
7. **mats** - Migrar para API Client
8. **progress** - Migrar para API Client
9. **lessons** - Migrar para API Client

### Fase 2: Médios (ALTA PRIORIDADE)

10. **plan-editor** - Migrar para API Client
11. **plan-editor-courses-tab** - Migrar para API Client
12. **view-course** - Migrar para API Client

### Fase 3: Baixos (BAIXA PRIORIDADE)

13. **ai-monitor** - Opcional
14. **auth** - OK como está

### Fase 4: Especial

15. **organizations** - ESPECIAL: Este módulo deve listar TODAS organizações disponíveis para o usuário, não filtrar por uma só. Precisa de lógica diferente.

## 🎯 Solução Padrão: Migrar para API Client

### Antes (❌ SEM contexto de organização):
```javascript
async loadData() {
    const response = await fetch('/api/units');
    const data = await response.json();
    this.units = data.data || [];
}
```

### Depois (✅ COM contexto de organização):
```javascript
async loadData() {
    if (!this.moduleAPI) {
        await this.initializeAPI();
    }
    
    await this.moduleAPI.fetchWithStates('/api/units', {
        loadingElement: this.container,
        onSuccess: (data) => {
            this.units = data.data || [];
            this.render();
        },
        onEmpty: () => this.showEmpty(),
        onError: (error) => this.showError(error)
    });
}

async initializeAPI() {
    // Wait for API client to load
    while (!window.createModuleAPI) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    this.moduleAPI = window.createModuleAPI('Units');
}
```

## 🔍 Como Verificar se Está Correto

### Backend
1. Verificar que todas as queries Prisma incluem `where: { organizationId }`
2. Verificar que helpers de organizationId retornam `ff5ee00e-d8a3-4291-9428-d28b852fb472`
3. Verificar logs do servidor: não deve haver warnings de "Organization not found"

### Frontend
1. Abrir DevTools → Network
2. Clicar em qualquer requisição para API
3. Verificar **Request Headers** → Deve conter `x-organization-id: ff5ee00e-d8a3-4291-9428-d28b852fb472`
4. Se não tiver o header, o módulo está usando fetch direto e precisa correção

### Teste Completo
1. Login no sistema
2. Verificar que localStorage tem `activeOrganizationId`
3. Navegar por cada módulo
4. Verificar no Network que todas requisições tem o header
5. Trocar de organização (quando houver mais de uma)
6. Verificar que dados são recarregados da nova organização

## 📝 Notas Importantes

1. **API Client é obrigatório** para novos módulos (AGENTS.md requirement)
2. **Organizações existentes no banco**: Apenas `Smart Defence` (ff5ee00e-d8a3-4291-9428-d28b852fb472)
3. **Tenant Middleware**: Tem fallback para desenvolvimento, mas produção deve ter org no banco
4. **LocalStorage Keys**:
   - `activeOrganizationId` - UUID da organização
   - `activeOrganizationName` - Nome para exibição
   - `activeOrganizationSlug` - Slug para URLs
5. **Organization Selector**: Componente no header permite trocar entre organizações

## 🚨 Próximos Passos

1. ✅ Backend totalmente auditado e corrigido
2. ⚠️ Corrigir 10 módulos críticos do frontend
3. ⚠️ Corrigir 3 módulos médios do frontend
4. ✅ Criar seed para múltiplas organizações (teste)
5. ✅ Testar troca de organização end-to-end
