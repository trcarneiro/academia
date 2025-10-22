# 🎬 TESTE AGORA - PASSO A PASSO

## ⚡ Comece Em 2 Minutos

### Passo 1: Recarregue (30 segundos)
```
Pressione: F5
ou
Ctrl+F5 (para limpar cache)

Resultado: Página recarrega com novo código
```

### Passo 2: Teste (1.5 minutos)
```
Alunos → Duplo clique em um aluno
Aba "Financeiro"
Você deve ver:

┌─────────────────────────────┐
│ 📋 PLANO ATIVO             │
├─────────────────────────────┤
│                             │
│ Plano Ilimitado            │
│ R$ 250,00/mês              │
│                             │
│ [✏️ Editar] [🗑️ Deletar] [⏸️ Finalizar] │
│                             │
└─────────────────────────────┘
```

---

## 🧪 4 TESTES PRÁTICOS

### TESTE 1: Modal de Edição ✏️

**O que fazer:**
```
1. Clique [✏️ Editar]
```

**O que você vai ver:**
```
Modal abre com:
┌─────────────────────────────┐
│ ✏️ Editar Plano         [X] │
├─────────────────────────────┤
│ Plano: Plano Ilimitado      │ (cinza)
│ Valor: R$ 250,00           │ (cinza)
│ Início: 15/10/2025          │ (cinza)
│ Próxima: [16/11/2025 ⏱️]   │ (EDITÁVEL)
│ Status: [Ativo ▼]          │ (EDITÁVEL)
├─────────────────────────────┤
│    [Cancelar]  [Salvar ✅]  │
└─────────────────────────────┘
```

**Resultado esperado:**
```
✅ Modal abre sem erros
✅ Mostra dados do plano
✅ Campos cinza não permitem edição
✅ Data e Status podem ser editados
✅ Console limpo (F12)
```

---

### TESTE 2: Editar Data 📅

**O que fazer:**
```
1. Modal aberto (do Teste 1)
2. Clique no campo "Próxima"
3. Mude para: 2025-12-16 (qualquer data futura)
4. Clique [Salvar ✅]
```

**O que você vai ver:**
```
Toast verde:
✅ Plano atualizado com sucesso!

Modal fecha
Página recarrega
Nova data aparece no plano
```

**Resultado esperado:**
```
✅ Toast aparece
✅ Modal fecha automaticamente
✅ Nova data persiste (recarregue para confirmar)
```

---

### TESTE 3: Deletar SEM Checkins 🗑️

**Pré-requisito:** Aluno deve ter um plano sem nenhuma frequência

**O que fazer:**
```
1. Clique [🗑️ Deletar] em um plano novo
```

**O que você vai ver:**
```
Prompt de confirmação:
┌─────────────────────────────┐
│ Tem certeza que deseja      │
│ DELETAR permanentemente?    │
│                             │
│ Isso vai:                   │
│ • Remover completamente     │
│ • Deletar histórico         │
│ • Não será possível         │
│   recuperar                 │
│                             │
│ [Cancelar] [OK]             │
└─────────────────────────────┘
```

**Clique OK**
```
Toast verde:
✅ Assinatura deletada com sucesso!

Plano desaparece da lista
```

**Resultado esperado:**
```
✅ Confirmação é pedida
✅ Plano é deletado
✅ Desaparece da interface
✅ Toast verde confirma
```

---

### TESTE 4: Deletar COM Checkins ❌

**Pré-requisito:** Aluno que tem frequências registradas

**O que fazer:**
```
1. Clique [🗑️ Deletar] em um plano com checkins
```

**O que você vai ver:**
```
Toast VERMELHO com mensagem:
❌ Não é possível deletar!

Este plano tem 3 entrada(s) de frequência.

Opções:
• Use "Finalizar" para encerrar mantendo histórico
• Ou remova os checkins primeiro
```

**Resultado esperado:**
```
✅ NÃO pede confirmação (porque não pode)
✅ Mostra mensagem de erro clara
✅ Explica por que não pode
✅ Sugere alternativa (Finalizar)
✅ Plano NÃO é deletado
```

---

### TESTE 5: Finalizar ⏸️

**O que fazer:**
```
1. Clique [⏸️ Finalizar]
```

**O que você vai ver:**
```
Prompt:
┌─────────────────────────────┐
│ Tem certeza que deseja      │
│ FINALIZAR esta assinatura? │
│                             │
│ Isso vai:                   │
│ • Encerrar assinatura       │
│ • Parar pagamentos          │
│ • Manter histórico          │
│                             │
│ [Cancelar] [OK]             │
└─────────────────────────────┘
```

**Clique OK**
```
Toast verde:
✅ Assinatura finalizada com sucesso!

Plano continua visível mas com status INATIVO
```

**Resultado esperado:**
```
✅ Pede confirmação
✅ Finaliza sem deletar
✅ Mantém histórico
✅ Toast verde confirma
```

---

## 🎯 Checklist de Sucesso

```
□ TESTE 1: Modal abre
□ TESTE 2: Edita data com sucesso
□ TESTE 3: Deleta plano sem checkins
□ TESTE 4: Recusa deletar com checkins
□ TESTE 5: Finaliza mantendo histórico
□ Console limpo (F12 - nenhum erro vermelho)
□ Todas as mensagens aparecem
□ Toasts aparecem corretamente
□ Responsividade OK (testar mobile)
```

Se todos passarem:
```
✅ FEATURE 100% FUNCIONANDO!
🎉 PRONTO PARA PRODUÇÃO!
```

---

## 🐛 Se Algo Não Funcionar

### Problema: Modal não abre
```
F12 → Console
Procure por erro vermelho
Recarregue: Ctrl+F5
Tente novamente
```

### Problema: Toast não aparece
```
F12 → Console
Procure por: "window.app is undefined"
Significa: AcademyApp não carregou
Solução: Aguarde página carregar completamente
```

### Problema: Delete não valida checkins
```
F12 → Console
Procure por erro
Verifique que aluno tem frequências registradas
Tente novamente
```

### Problema: Dados não salvam
```
F12 → Network
Procure por requisição PATCH /api/subscriptions
Verifique se status é 200 OK
Se 400/500: Há erro no backend
```

---

## 💡 Dicas

1. **Abra DevTools** (F12) antes de testar
   - Assim vê erros em tempo real

2. **Use 2 alunos diferentes**
   - 1 com frequências (para Teste 4)
   - 1 sem frequências (para Teste 3)

3. **Se ficar preso em um teste**
   - Recarregue a página (F5)
   - Comece do Teste 1 novamente

4. **Teste em mobile** (F12 → Ctrl+Shift+M)
   - Verifique responsividade

---

## 📞 Resultado Esperado

Após todos os testes:

```
✅ 3 botões funcionam perfeitamente
✅ Validações funcionam
✅ Mensagens claras aparecem
✅ Dados persistem
✅ Interface responsiva
✅ Sem erros no console

🎊 SUCESSO! Feature pronta!
```

---

## 🚀 Quando Terminar

Se todos os testes passarem:

1. **Feature está pronta** ✅
2. **Pode fazer deploy** ✅
3. **Usuários podem usar** ✅

---

**Tempo estimado**: 5 minutos
**Dificuldade**: Fácil (clique e observe)
**Requisito**: Página recarregada + DevTools aberta

**Comece agora!** 👉 F5
