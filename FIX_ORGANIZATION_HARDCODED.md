# 🔧 Fix: Multi-Tenancy - Organization ID Hardcoded

**Data**: 05/10/2025  
**Status**: ✅ APLICADO (Solução Temporária)  
**Prioridade**: ALTA - Precisa integração com Supabase login

---

## 📋 Problema

**Sintoma**: Curso "Krav Maga Faixa Branca" não aparecia no módulo de Cursos nem no dropdown de Pacotes.

**Causa Raiz**: 
- API Client (`public/js/shared/api-client.js`) buscava `organizationId` de:
  1. `localStorage.getItem('activeOrganizationId')`
  2. `sessionStorage.getItem('activeOrganizationId')`
  3. `window.currentOrganizationId`
- **Nenhum desses estava configurado!**
- Sem o header `X-Organization-Id`, backend retornava array vazio `[]`

---

## ✅ Solução Aplicada

### 1. **API Client** (`public/js/shared/api-client.js` - linha ~172)

```javascript
// 🔧 TEMPORARY FIX: Hardcoded fallback para única org na base
// TODO: Remover quando integração com Supabase login estiver completa
// Ver task em AGENTS.md > "Integrar organizationId do Supabase no API Client"
if (!orgId && !orgSlug) {
    orgId = 'a55ad715-2eb0-493c-996c-bb0f60bacec9'; // Academia Demo
    console.warn('⚠️ Using hardcoded organization ID (temporary fix)');
}
```

**Comportamento**:
- Se não encontrar `organizationId` em localStorage/sessionStorage/window
- **Usa hardcoded** `a55ad715-2eb0-493c-996c-bb0f60bacec9` (única org na base)
- Emite warning no console para rastreamento

---

### 2. **Task Criada** (`AGENTS.md` - seção TODO)

```markdown
## 🚧 Tarefas Pendentes (TODO)

### Backend / Infraestrutura
- [ ] **Integrar organizationId do Supabase no API Client** (CRÍTICO)
  - **Contexto**: Atualmente usando hardcoded `a55ad715-2eb0-493c-996c-bb0f60bacec9` como fallback temporário
  - **Problema**: Usuário loga pelo Supabase, tem organizationId no perfil, mas API Client não está pegando
  - **Solução**: 
    1. Extrair `user.organizationId` do Supabase após login bem-sucedido
    2. Configurar em `localStorage.setItem('activeOrganizationId', user.organizationId)`
    3. Remover hardcode do api-client.js
  - **Arquivo relacionado**: `public/js/modules/auth/` (módulo de autenticação)
  - **Prioridade**: ALTA - Multi-tenancy não funciona corretamente sem isso
```

---

## 🎯 Solução Permanente (TODO)

### Integração com Supabase Login

**Local**: `public/js/modules/auth/` (módulo de autenticação)

**Implementação necessária**:

```javascript
// Após login bem-sucedido no Supabase
async function handleSuccessfulLogin(supabaseUser) {
    // 1. Buscar dados completos do usuário
    const { data: userData, error } = await supabase
        .from('users')
        .select('*, organization:organizations(*)')
        .eq('id', supabaseUser.id)
        .single();
    
    if (error) {
        console.error('Erro ao buscar organização do usuário:', error);
        return;
    }
    
    // 2. Configurar organizationId no localStorage
    const orgId = userData.organizationId || userData.organization?.id;
    if (orgId) {
        localStorage.setItem('activeOrganizationId', orgId);
        sessionStorage.setItem('activeOrganizationId', orgId);
        window.currentOrganizationId = orgId;
        console.log('✅ Organization ID configurado:', orgId);
    }
    
    // 3. Se usuário tem múltiplas orgs, permitir seleção
    if (userData.organizations?.length > 1) {
        // Mostrar seletor de organização
        showOrganizationSelector(userData.organizations);
    }
    
    // 4. Redirecionar para dashboard
    window.location.href = '/';
}
```

---

## 🧪 Validação

### Como testar se está funcionando:

1. **Abra o Console do Browser** (F12)

2. **Recarregue a página** (Ctrl+R)

3. **Verifique os logs**:
   ```
   ⚠️ Using hardcoded organization ID (temporary fix)
   🌐 GET /api/courses
   ✅ GET /api/courses completed successfully
   📚 Courses loaded: 1 course(s)
   ```

4. **Verifique o header enviado**:
   - Abra **Network tab**
   - Clique em `courses` request
   - Verifique header: `X-Organization-Id: a55ad715-2eb0-493c-996c-bb0f60bacec9`

5. **Verifique a resposta**:
   ```json
   {
     "success": true,
     "data": [{
       "id": "krav-maga-faixa-branca-2025",
       "name": "Krav Maga Faixa Branca",
       "totalLessons": 35
     }]
   }
   ```

---

## 📊 Status Multi-Tenancy

### ✅ Funcionando:
- Backend routes com organização correta
- API Client enviando header `X-Organization-Id`
- Cursos e Pacotes filtrando por organização
- Import de cursos vinculando à organização correta

### ⚠️ Temporário:
- Organization ID hardcoded (fallback)
- Não suporta múltiplas organizações por usuário
- Não integrado com login do Supabase

### ❌ Pendente:
- Extrair organizationId do usuário logado no Supabase
- Suporte a múltiplas organizações por usuário
- Seletor de organização ativa

---

## 🔗 Arquivos Modificados

- `public/js/shared/api-client.js` - Linha ~172 (hardcoded fallback)
- `src/routes/courses.ts` - Função `getOrganizationId(request)` (já corrigida)
- `src/controllers/courseController.ts` - Função `getOrganizationId(request)` (já correta)
- `AGENTS.md` - Seção "🚧 Tarefas Pendentes (TODO)" (task criada)

---

## 📚 Referências

- **AGENTS.md**: Seção "🚧 Tarefas Pendentes (TODO)"
- **DIAGNOSTIC_MULTITENANCY_ISSUE.md**: Análise detalhada do problema
- **FIX_COURSES_NOT_SHOWING_IN_PACKAGE.md**: Fix backend multi-tenancy
- **API Swagger**: http://localhost:3000/docs

---

## 🎯 Próximos Passos

1. ✅ **AGORA**: Curso aparece corretamente (hardcoded fix)
2. ⏳ **Depois**: Integrar com Supabase login
3. ⏳ **Futuro**: Suporte a múltiplas organizações por usuário

**Quando implementar a integração com Supabase**:
- Remover hardcode em `api-client.js` linha ~172
- Fechar task no `AGENTS.md`
- Atualizar este documento com status CONCLUÍDO

---

**Versão**: 1.0  
**Data**: 05/10/2025  
**Autor**: AI Agent (Copilot)  
**Status**: ATIVO (Temporário)
