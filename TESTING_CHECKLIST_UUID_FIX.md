# ✅ CHECKLIST - Testar Adição de Plano no Navegador

## 🚀 Pré-Requisitos
- [ ] Servidor rodando: `npm run dev` (porta 3000)
- [ ] Banco de dados: PostgreSQL online
- [ ] Planos seeded com UUIDs: ✅ COMPLETO

## 📋 Teste Step-by-Step

### 1️⃣ Preparação
- [ ] Abrir http://localhost:3000 no navegador
- [ ] Fazer login (se necessário)
- [ ] Abrir console do navegador (F12)
- [ ] Limpar logs anteriores

### 2️⃣ Navegar até Student Editor
- [ ] Menu lateral → "Alunos" (ou Estudantes)
- [ ] Procurar por "Lucas Mol" na lista
- [ ] Duplo-clique no aluno (ou botão editar)
- [ ] Esperar carregar página de detalhes

### 3️⃣ Seção de Planos
- [ ] Descer até seção "Planos" ou "Subscriptions"
- [ ] Verificar se há botão "Adicionar Plano" ou "+ Novo Plano"
- [ ] Clicar no botão

### 4️⃣ Seleção de Plano
- [ ] Modal/formulário abre
- [ ] Procurar select/dropdown de "Plano"
- [ ] Clicar para abrir dropdown
- [ ] Verificar se aparecem os 15 planos:
  ```
  ✨ Aula Avulsa
  🎉 Trial 7 Dias
  📦 Pack 10 Aulas
  📦 Pack 20 Aulas
  📦 Pack 30 Aulas
  💪 Personal - Aulas Agendadas (1x/semana)
  💪 Personal - Aulas Agendadas (2x/semana)
  💪 Personal - Aulas por Créditos (1x/semana)
  💪 Personal - Aulas por Créditos (2x/semana)
  👧 Kids Smart Defence - Anual 2x/semana
  👧 Kids Smart Defence - Anual Ilimitado
  👧 Kids Smart Defence - Mensal 2x/semana
  👧 Kids Smart Defence - Mensal Ilimitado
  🥋 Smart Defence - Anual Ilimitado
  🥋 Smart Defence - Mensal Ilimitado
  ```

### 5️⃣ Selecionar Trial Plan
- [ ] Selecionar "🎉 Trial 7 Dias" do dropdown
- [ ] Verificar se data de início aparece (hoje)
- [ ] Verificar se duração mostra "7 dias"

### 6️⃣ Confirmar Adição
- [ ] Clicar em "Adicionar Plano" ou "Salvar"
- [ ] Aguardar resposta da API (3-5 segundos)
- [ ] **VALIDAÇÃO**: Console deve mostrar:
  ```
  ✅ Plan added successfully
  OU
  ✅ Subscription created: {...}
  ```

### 7️⃣ Verificar Sucesso
- [ ] Não aparecer erro vermelho
- [ ] Modal fechar automaticamente
- [ ] Plano aparecer na lista de planos ativos do aluno
- [ ] Mostrar informações:
  - ✅ Nome: "🎉 Trial 7 Dias"
  - ✅ Status: "Ativo" (ou "Active")
  - ✅ Data de Validade: "+7 dias"
  - ✅ Créditos: "7"

### 8️⃣ Validação no Console
- [ ] Abrir Network tab (F12)
- [ ] Procurar por POST request a `/api/financial/subscriptions`
- [ ] Clicar na request
- [ ] Verificar:
  - **Request Headers**:
    ```
    Content-Type: application/json
    x-organization-id: 452c0b35-1822-4890-851e-922356c812fb
    ```
  - **Request Body**:
    ```json
    {
      "studentId": "e2ce2a98-6198-4398-844a-5a5ac3126256",
      "planId": "5372c597-48e8-4d30-8f0e-687e062976b8"  // UUID válido
    }
    ```
  - **Response Status**: ✅ 200 OK
  - **Response Body**:
    ```json
    {
      "success": true,
      "data": {
        "id": "subscription-...",
        "studentId": "e2ce2a98-...",
        "planId": "5372c597-...",
        "status": "ACTIVE",
        "startDate": "2025-10-17T..."
      }
    }
    ```

## ✅ Critérios de Sucesso

- [x] Planos aparecem no dropdown com UUIDs válidos
- [ ] Trial plan pode ser selecionado
- [ ] POST request envia UUID válido
- [ ] API retorna 200 OK (não 400 Bad Request)
- [ ] Plano aparece na lista do aluno
- [ ] Não há erros no console

## ❌ Cenários de Erro

### Se erro: "body/planId must match format 'uuid'"
→ Seed não executou corretamente
→ Solução: `npx tsx scripts/seed-all-plans-uuid.ts`

### Se error: "Student not found"
→ ID do aluno Lucas Mol está diferente
→ Solução: Usar ID correto: `e2ce2a98-6198-4398-844a-5a5ac3126256`

### Se error: "Plan not found"
→ Plano foi deletado ou não existe
→ Solução: `npx tsx scripts/verify-uuids.ts` e copiar ID válido

### Se erro: "Organization mismatch"
→ IDs de organização não correspondem
→ Verificar: API client envia `x-organization-id` correto

## 📊 Esperado vs Atual

### Esperado (Pré-Bug):
```
✅ 15 planos seeded com string IDs
✅ Frontend mostra todos os planos
❌ POST retorna 400 Bad Request (ID inválido)
❌ Plano não é adicionado ao aluno
```

### Atual (Pós-Fix):
```
✅ 17 planos seeded com UUID válido
✅ Frontend mostra todos os planos
✅ POST retorna 200 OK
✅ Plano é adicionado ao aluno
✅ Subscription aparece na lista
```

## 🎯 Próximo Passo Após Sucesso
Se tudo passar ✅:
→ Proceder com **Task 20: Dashboard de Créditos**

Se algo falhar ❌:
→ Verificar logs em `api-server.log`
→ Contactar suporte com:
  - Screenshot do erro
  - Response do console
  - ID do aluno testado
  - ID do plano testado

---

**Data**: 17/10/2025  
**Status**: Pronto para testar  
**Bloqueador**: Nenhum  
**Dependência**: Seed UUID ✅ completo
