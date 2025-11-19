# 🔧 Guia de Teste - Fix Instructors organizationId

**Data**: 13 de Novembro de 2025  
**Versão**: 2.1.0  
09+:3/

**Problema Corrigido**: 400 Bad Request "Organization context required"

---

## ⚡ AÇÃO IMEDIATA NECESSÁRIA

O fix foi aplicado no código, mas o **browser está usando cache**. Siga os passos abaixo:

---

## 📋 PASSO A PASSO DE TESTE

### 1️⃣ Limpar Cache do Browser (OBRIGATÓRIO)

**Opção A - Hard Refresh** (Mais Rápido):
```
Windows/Linux: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

**Opção B - Limpar Cache Completo** (Recomendado):
```
1. Pressione F12 (abrir DevTools)
2. Clique com botão direito no ícone de refresh
3. Selecione "Limpar cache e recarregar"
```

**Opção C - DevTools Network Settings**:
```
1. F12 → Aba "Network"
2. Marque checkbox "Disable cache"
3. F5 para recarregar
```

---

### 2️⃣ Verificar Versão Carregada

Após recarregar, abra o **Console** (F12) e procure por:

✅ **Esperado** (versão corrigida):
```
👨‍🏫 Instructors Module v2.1.0 - Starting (Organization Context Fixed)...
```

❌ **Antigo** (versão com bug):
```
👨‍🏫 Instructors Module - Starting (Simplified)...
```

Se aparecer a versão antiga, repita o passo 1 (cache ainda ativo).

---

### 3️⃣ Testar Carregamento da Lista

1. Clique em **"Instructors"** no menu lateral
2. Aguarde 2-3 segundos
3. Verifique no Console:

✅ **Esperado**:
```
📡 Loading instructors data...
🌐 GET /api/instructors?organizationId=ff5ee00e-...
📊 Loaded X instructors
```

❌ **Erro** (se continuar):
```
GET /api/instructors 400 (Bad Request)
❌ Error loading instructors: Organization context required
```

---

### 4️⃣ Testar Criação de Instrutor

1. Clique no botão **"Novo Instrutor"** (canto superior direito)
2. Preencha o formulário:
   - Nome: `João Silva`
   - Email: `joao@test.com`
   - CPF: `123.456.789-00`
   - Status: `ACTIVE`
3. Clique em **"Salvar"**
4. Verifique no Console:

✅ **Esperado**:
```
🌐 POST /api/instructors
Body: { name: "João Silva", ..., organizationId: "ff5ee00e-..." }
✅ Instructor saved successfully
```

❌ **Erro** (se continuar):
```
POST /api/instructors 400 (Bad Request)
Organization context required
```

---

### 5️⃣ Testar Edição de Instrutor

1. Na lista de instrutores, **duplo-clique** em qualquer card
2. Modifique algum campo (ex: telefone)
3. Clique em **"Salvar"**
4. Verifique no Console:

✅ **Esperado**:
```
🌐 PUT /api/instructors/[id]
Body: { ..., organizationId: "ff5ee00e-..." }
✅ Instructor updated successfully
```

---

## 🔍 CHECKLIST DE VALIDAÇÃO

Marque conforme testa:

- [ ] **Cache limpo** - Hard refresh executado (Ctrl+Shift+R)
- [ ] **Versão correta** - Console mostra "v2.1.0 - Organization Context Fixed"
- [ ] **Lista carrega** - Sem erro 400, mostra lista de instrutores
- [ ] **GET tem organizationId** - URL contém `?organizationId=...`
- [ ] **POST funciona** - Criar novo instrutor funciona sem erro
- [ ] **POST tem organizationId** - Body inclui `organizationId` field
- [ ] **PUT funciona** - Editar instrutor funciona sem erro
- [ ] **DELETE funciona** - Excluir instrutor funciona sem erro
- [ ] **Zero erros console** - Nenhum erro vermelho no console

---

## 🐛 TROUBLESHOOTING

### Problema: Ainda aparece erro 400

**Causa**: Cache do browser não foi limpo  
**Solução**:
```
1. Feche TODAS as abas do localhost:3001
2. Feche o browser completamente
3. Reabra e acesse localhost:3001
4. Ctrl+Shift+R para hard refresh
```

---

### Problema: Console mostra versão antiga

**Causa**: Script carregado antes do fix  
**Solução**:
```
1. F12 → Aba "Application"
2. "Storage" → "Clear site data"
3. Marque "Cache storage"
4. Clique "Clear site data"
5. Recarregar página
```

---

### Problema: Erro "organizationId is undefined"

**Causa**: Variável `window.currentOrganizationId` não está setada  
**Solução**:
```javascript
// No Console, execute:
localStorage.getItem('currentOrganizationId')

// Se retornar null, setar manualmente:
localStorage.setItem('currentOrganizationId', 'ff5ee00e-d8a3-4291-9428-d28b852fb472');

// Recarregar página
location.reload();
```

---

### Problema: GET funciona, POST falha

**Causa**: Body do POST não inclui organizationId  
**Verificação**:
```
1. F12 → Aba "Network"
2. Criar novo instrutor
3. Clicar na requisição "instructors" (POST)
4. Aba "Payload" → verificar se tem "organizationId"
```

**Se não tiver**, o cache ainda está ativo. Repetir limpeza.

---

## ✅ O QUE FOI CORRIGIDO

### Fix #1: loadData() - GET Request (linha 63-86)

**Antes**:
```javascript
const response = await fetch('/api/instructors');
// ❌ Faltava organizationId
```

**Depois**:
```javascript
const organizationId = window.currentOrganizationId || 
                     localStorage.getItem('currentOrganizationId');
                     
if (!organizationId) {
    throw new Error('Organization context required');
}

const response = await fetch(`/api/instructors?organizationId=${organizationId}`);
// ✅ Query parameter adicionado
```

---

### Fix #2: handleFormSubmit() - POST/PUT Body (linha 607-628)

**Antes**:
```javascript
const data = {
    name: `${firstName} ${lastName}`,
    email, phone, document, birthDate, bio, isActive
    // ❌ Faltava organizationId
};
```

**Depois**:
```javascript
const organizationId = window.currentOrganizationId || 
                     localStorage.getItem('currentOrganizationId');
                     
if (!organizationId) {
    this.showError('Organization context required');
    return;
}

const data = {
    name: `${firstName} ${lastName}`,
    email, phone, document, birthDate, bio, isActive,
    organizationId: organizationId  // ✅ Campo adicionado
};
```

---

### Fix #3: Cache-Busting no Router (spa-router.js)

**Adicionado**:
```javascript
// Remove old script tags
scriptsToLoad.forEach(src => {
    const oldScripts = Array.from(document.scripts)
        .filter(script => script.src.includes(src));
    oldScripts.forEach(script => script.remove());
});

// Add cache-busting timestamp
const cacheBuster = Date.now();
script.src = `${src}?v=${cacheBuster}`;
```

---

## 📊 MÉTRICAS DE SUCESSO

Após teste completo, você deve ter:

✅ **0 erros 400** no Network tab  
✅ **0 erros vermelhos** no Console  
✅ **100% dos requests** com organizationId  
✅ **CRUD completo** funcionando (Create, Read, Update, Delete)  
✅ **Lista renderizada** com todos os instrutores  

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ Teste local completo (este guia)
2. ⏭️ Teste em outros módulos se necessário
3. ⏭️ Deploy para staging/produção
4. ⏭️ Monitorar logs de erro

---

## 📚 DOCUMENTAÇÃO RELACIONADA

- `UX_STANDARDIZATION_COMPLETE.md` - Resumo completo de todas as mudanças
- `AGENTS.md` - Arquitetura e padrões do sistema
- `MODULE_STANDARDS.md` - Padrões de módulos single-file

---

**Desenvolvido com ❤️ para Academia Krav Maga v2.0**  
**Fix aplicado**: 13 de Novembro de 2025  
**Versão**: 2.1.0
