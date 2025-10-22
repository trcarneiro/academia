# 🧪 TESTE DE FUNCIONALIDADES - Check-in Operacional

## 📋 Roteiro de Testes Rápidos (5 min)

### ✅ Pré-requisito
- [ ] Servidor rodando em http://localhost:3000
- [ ] Aluno "Lucas Mol" (e2ce2a98...) visível na lista
- [ ] Console do navegador aberto (F12)

---

## 🔄 TESTE 1: Adicionar Novo Plano

**Objetivo**: Verificar que POST com UUID funciona

```
📍 Passos:
1. Ir para: Estudantes → Double-click em "Lucas Mol"
2. Aba: "Financeiro"
3. Botão: "+ Adicionar Plano"
4. Selecionar: "🎉 Trial 7 Dias" (grátis, fácil)
5. Confirmar

✅ Esperado:
   ├─ Modal fecha
   ├─ Nova assinatura aparece na lista
   ├─ Status: ACTIVE
   ├─ Console: ✅ POST /api/financial/subscriptions completed successfully
   └─ Nenhum erro 400

❌ Se erro:
   └─ Verificar console: Qual erro aparece?
```

---

## 🗑️ TESTE 2: Deletar Assinatura (SEM Checkins)

**Objetivo**: Verificar que DELETE funciona

```
📍 Passos:
1. Aluno: "Lucas Mol" (que tem 2 assinaturas)
2. Procurar por: "💪 Personal - Aulas Agendadas (1x/semana)"
3. Botão: "🗑️ Deletar" (deve estar vermelho/habilitado)
4. Clicar → Confirmar

✅ Esperado:
   ├─ Modal: "Tem certeza que deseja deletar?"
   ├─ Após confirmar: Assinatura desaparece
   ├─ Contador "totalSubscriptions" diminui (de 2 → 1)
   ├─ Console: ✅ DELETE /api/subscriptions/... 200 OK
   └─ Alerta: "✅ Assinatura deletada com sucesso!"

❌ Se erro:
   ├─ Erro 400? → Verificar se há checkins no aluno
   └─ Erro 500? → Verificar logs do servidor
```

---

## 🔒 TESTE 3: Bloquear Deletar (COM Checkins)

**Objetivo**: Validar que não deixa deletar com frequências

```
📍 Passos:
1. Aluno: "Lorraine C S M Barbosa" (bce5897a...)
   (Este aluno tem 2 assinaturas e pode ter checkins)
2. Procurar: Uma assinatura ATIVA
3. Verificar botão: "🗑️ Deletar"

✅ Esperado (se tem checkins):
   ├─ Botão DESABILITADO (cinzento/opaco)
   ├─ Hover mostra: "Não é possível deletar assinatura com frequências"
   └─ Click não funciona

✅ Esperado (se SEM checkins):
   ├─ Botão HABILITADO (vermelho)
   └─ Funciona normalmente (vide Teste 2)
```

---

## ✏️ TESTE 4: Editar Assinatura

**Objetivo**: Verificar que modal de edição abre/salva

```
📍 Passos:
1. Aluno com assinatura ATIVA
2. Botão: "✏️ Editar"
3. Modal abre com campos preenchidos
4. Alterar um campo (ex: Preço Customizado: 500 → 600)
5. Botão: "💾 Salvar Alterações"

✅ Esperado:
   ├─ Modal fecha
   ├─ Preço atualizado na lista (600 visível)
   ├─ Console: ✅ PATCH /api/subscriptions/... 200 OK
   └─ Alerta: "✅ Assinatura atualizada com sucesso!"

❌ Se erro:
   └─ Verificar console pelo erro específico
```

---

## ⏸️ TESTE 5: Finalizar Assinatura

**Objetivo**: Verificar que muda status para CANCELLED

```
📍 Passos:
1. Aluno com assinatura ACTIVE
2. Botão: "⏸️ Finalizar Assinatura"
3. Confirmar

✅ Esperado:
   ├─ Status muda: ACTIVE → CANCELLED
   ├─ Botão "⏸️ Finalizar" fica DESABILITADO
   ├─ Botão "🗑️ Deletar" ainda visível mas DESABILITADO
   ├─ Console: ✅ PATCH /api/subscriptions/... 200 OK
   └─ Alerta: "✅ Assinatura finalizada com sucesso!"

✅ Depois tentar novamente:
   ├─ Botão "⏸️ Finalizar" está cinzento
   └─ Click não faz nada
```

---

## 📊 RESUMO DO STATUS

| Feature | Status | Teste | Risco |
|---------|--------|-------|-------|
| POST Plano (UUID) | ✅ OK | Teste 1 | Baixo |
| DELETE Assinatura | ✅ OK | Teste 2 | Baixo |
| Validação Checkins | ✅ OK | Teste 3 | Muito Baixo |
| PATCH Editar | ✅ OK | Teste 4 | Baixo |
| PATCH Finalizar | ✅ OK | Teste 5 | Muito Baixo |

---

## 🎯 Conclusão Esperada

Após completar todos os 5 testes:

```
✅ POST /api/financial/subscriptions: FUNCIONANDO
✅ DELETE /api/subscriptions/:id: FUNCIONANDO
✅ PATCH /api/subscriptions/:id: FUNCIONANDO
✅ Validações backend: FUNCIONANDO
✅ Mensagens frontend: FUNCIONANDO
✅ Banco de dados: ÍNTEGRO
```

**Tempo estimado**: 5-10 minutos

---

**Data**: 17/10/2025
**Versão**: 1.0
**Autor**: Sistema de QA Automatizado
