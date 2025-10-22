# 🧪 TESTING INSTRUCTIONS - Responsáveis Financeiros

**Quick Start**: 5 minutos para validar toda feature

---

## ✅ PRÉ-REQUISITOS

- [ ] Servidor rodando: `npm run dev` ✅ (já iniciado em http://localhost:3000)
- [ ] Browser aberto na aplicação
- [ ] DevTools aberta (F12) - aba Network
- [ ] Alunos cadastrados na base de dados ✅ (existem 37 alunos)

---

## 📋 TESTE 1: Visualizar Aba (2 minutos)

### Passos
1. Clique em **"Estudantes"** no menu lateral
2. Duplo clique em qualquer aluno (ex: "Lucas Mol")
3. Procure pelas abas: **"Visão Geral"** | **"Responsável Financeiro"** | **"Financeiro"** | **"Cursos"**
4. Clique na aba **"👤 Responsável Financeiro"**

### Esperado ✅
- [ ] Aba carrega com spinner brevemente
- [ ] Mensagem: **"⚠️ Nenhum Responsável"**
- [ ] Subtexto: **"Nenhum responsável financeiro vinculado a este aluno"**
- [ ] Campo de seleção vazio: **"-- Selecionar --"**
- [ ] Botão [**+ Novo**] visível
- [ ] Botões [**💾 Salvar Responsável**] e [**❌ Remover Vínculo**] visíveis

### Console (DevTools → Console)
```
✅ Nenhum erro vermelho
✅ GET /api/students/financial-responsibles - 200 OK
✅ GET /api/students/:id - 200 OK com financialResponsible: null
```

**Status**: ⏳ Aguardando sua validação

---

## 📋 TESTE 2: Criar Novo Responsável (3 minutos)

### Passos
1. Na aba "Responsável Financeiro", clique [**+ Novo**]
2. Preencha o formulário:
   - **Nome**: "João Silva"
   - **CPF/CNPJ**: "123.456.789-00"
   - **Email**: "joao@example.com"
   - **Telefone**: "(31) 98888-8888"
3. Clique [**✓ Salvar**]

### Esperado ✅
- [ ] Toast verde: **"✅ Responsável criado com sucesso!"**
- [ ] Aba recarrega
- [ ] Dropdown agora mostra: **"João Silva - joao@example.com"**
- [ ] Formulário de criação se fecha

### Console (DevTools → Network)
```
✅ POST /api/students/financial-responsibles
   Status: 201 Created
   Body: { name, cpfCnpj, email, phone }
   Response: { success: true, data: {...} }
```

**Status**: ⏳ Aguardando sua validação

---

## 📋 TESTE 3: Atribuir Responsável ao Aluno (3 minutos)

### Passos
1. Dropdown deve mostrar "João Silva" agora
2. Selecione-o no dropdown
3. Clique [**💾 Salvar Responsável**]

### Esperado ✅
- [ ] Toast verde: **"✅ Responsável vinculado com sucesso!"**
- [ ] UI atualiza mostrando:
  - [ ] **"✅ Responsável Vinculado"**
  - [ ] Nome: "João Silva"
  - [ ] Email: "joao@example.com"
  - [ ] Telefone: "(31) 98888-8888"

### Console (DevTools → Network)
```
✅ PATCH /api/students/:id/financial-responsible
   Status: 200 OK
   Body: { financialResponsibleId: "uuid" }
   Response: student com financialResponsible populado
```

### Validação no Inspector
```javascript
// DevTools → Console, execute:
document.querySelector('#student-responsible-container').innerText
// Deve conter: "João Silva" e "joao@example.com"
```

**Status**: ⏳ Aguardando sua validação

---

## 📋 TESTE 4: Verificar Roteamento de Pagamento (5 minutos)

### Contexto
Quando um aluno com responsável contrata um plano, o `payerId` deve ser do responsável.

### Passos
1. Ainda no editor do aluno, clique na aba **"Financeiro"**
2. Procure botão para contratar novo plano
3. Selecione um plano qualquer (ex: "Plano Ilimitado")
4. Clique para confirmar a contratação

### Esperado ✅
- [ ] Assinatura criada com sucesso
- [ ] Toast de sucesso aparece

### Validação via API
**Terminal** (PowerShell):
```powershell
$headers = @{
    'x-organization-id' = '452c0b35-1822-4890-851e-922356c812fb'
}
$response = Invoke-WebRequest -Uri 'http://localhost:3000/api/subscriptions' `
    -Headers $headers -UseBasicParsing
$response.Content | ConvertFrom-Json | ConvertTo-Json
```

**Esperado na resposta**:
```json
{
  "studentId": "e2ce2a98-6198-4398-844a-5a5ac3126256",
  "financialResponsibleId": "uuid-do-joao"  // ← IMPORTANTE!
}
```

### Console (DevTools → Network)
```
✅ POST /api/packages/:id/subscribe
   Response contém: financialResponsibleId
```

**Status**: ⏳ Aguardando sua validação

---

## 📋 TESTE 5: Remover Vínculo (2 minutos)

### Passos
1. Volte para aba **"👤 Responsável Financeiro"**
2. Clique [**❌ Remover Vínculo**]
3. Confirme a remoção quando perguntado

### Esperado ✅
- [ ] Toast verde: **"✅ Vínculo removido"**
- [ ] UI volta para:
  - [ ] **"⚠️ Nenhum Responsável"**
  - [ ] Dropdown limpo
  - [ ] Subtexto: "Nenhum responsável..."

### Console (DevTools → Network)
```
✅ PATCH /api/students/:id/financial-responsible
   Body: { financialResponsibleId: null }
   Response: student com financialResponsible: null
```

**Status**: ⏳ Aguardando sua validação

---

## 📊 RESUMO DOS TESTES

| Teste | Funcionalidade | Status |
|-------|---|---|
| 1 | Visualizar aba e estado vazio | ⏳ |
| 2 | Criar novo responsável | ⏳ |
| 3 | Atribuir responsável | ⏳ |
| 4 | Verificar roteamento de payerId | ⏳ |
| 5 | Remover vínculo | ⏳ |

**Total Esperado**: ✅ 5/5 passando

---

## 🐛 TROUBLESHOOTING

### Problema: Aba não carrega (spinner infinito)
**Solução**:
1. Abra DevTools (F12)
2. Aba Network
3. Procure por erro em GET `/api/students/financial-responsibles`
4. Verifique se header `x-organization-id` está sendo enviado

### Problema: Toast não aparece
**Solução**:
1. Verificar console para erros
2. Confirmar que `window.app.showToast` está disponível
3. Recarregar página (F5)

### Problema: Dropdown vazio após criar
**Solução**:
1. Verificar POST em Network → Response deve ter `data.id`
2. Recarregar aba (clicar em outra aba, depois voltar)
3. Verificar console para erros de JavaScript

### Problema: "Responsável vinculado" mas não persiste
**Solução**:
1. Verificar PATCH `/api/students/:id/financial-responsible` em Network
2. Confirmar status 200 OK
3. Recarregar página para validar persistência

---

## ✅ CHECKLIST FINAL

Ao completar os testes, marque:
- [ ] Teste 1 Passou
- [ ] Teste 2 Passou
- [ ] Teste 3 Passou
- [ ] Teste 4 Passou
- [ ] Teste 5 Passou
- [ ] Nenhum erro em DevTools Console
- [ ] Nenhum erro em DevTools Network
- [ ] Feature está pronta para produção

---

## 📞 DÚVIDAS?

**Documentação Completa**: `FEATURE_FINANCIAL_RESPONSIBLES_COMPLETE.md`
**Sumário de Implementação**: `FINANCIAL_RESPONSIBLES_IMPLEMENTATION_SUMMARY.md`
**Logs do Servidor**: Verificar terminal onde `npm run dev` está rodando

---

**Tempo Total de Testes**: ~15 minutos
**Dificuldade**: Baixa (apenas clicar e verificar)
**Status**: Pronto para testes ✅
