# 🔧 TROUBLESHOOTING - SE ALGO NÃO FUNCIONAR

## 🎯 Árvore de Decisão

```
START: Cliquei em [✏️ Editar]
│
├─ Modal apareceu?
│  │
│  ├─ SIM ✅ → Vá para "Modal abriu"
│  │
│  └─ NÃO ❌ → Vá para "Modal não aparece"
│
└─ FIM
```

---

## ❌ PROBLEMA 1: Modal não aparece

```
Você clica [✏️ Editar]
    ↓
Nada acontece
    ↓
Nenhum modal, nenhuma mensagem
```

### Diagnóstico 1A: Página está atualizada?
```
❓ Quando você abriu a página pela última vez?

☐ Agora mesmo        → OK, continue
☐ Há 5+ minutos      → Recarregue (F5)
☐ De outra aba       → Recarregue (F5)
☐ Não tenho certeza  → Pressione Ctrl+F5 (limpar cache)

Depois: Tente novamente [✏️ Editar]
```

### Diagnóstico 1B: Console limpo?
```
Abra DevTools:     F12
Vá para:           Console (aba)
Procure por:       ❌ erros vermelhos

Se houver erro:
  └─ Anote o erro exato
  └─ Verifique abaixo se existe

Se não houver erro:
  └─ Procure por: "✏️ Editing subscription:"
  └─ Se não aparecer, continuar em 1C
```

### Diagnóstico 1C: Servidor rodando?
```
Terminal com "npm run dev" deve mostrar:
  ✅ [12:XX:XX] INFO: Server listening at http://127.0.0.1:3000
  ✅ CRM routes registered
  ✅ Frequency routes registered
  ✅ Packages routes registered
  ✅ Subscriptions routes registered

Se não aparecer:
  └─ Servidor não iniciou corretamente
  └─ Solução: Ctrl+C (parar), depois npm run dev

Se tiver erro de compilação TypeScript:
  └─ Há um erro no código
  └─ Avise com print do erro
```

### Diagnóstico 1D: Aluno tem planos ativos?
```
Na página do aluno, aba "Financeiro":

☐ Não vejo seção "Planos Ativos"
   └─ Aluno não tem planos
   └─ Solução: Click "Adicionar Plano" primeiro
   └─ Depois tente [✏️ Editar]

☐ Vejo "Plano Ativo" mas sem botões
   └─ Dados não carregaram
   └─ Solução: Recarregue (F5) e aguarde
   └─ Se persistir, vá para "Dados não carregam"

☐ Vejo "Plano Ativo" com botões [✏️ Editar] [⏸️ Finalizar]
   └─ OK, aluno tem planos
   └─ Volte ao passo 1B (console)
```

### Diagnóstico 1E: Console detalhe

Abra DevTools (F12) e cole isto no Console:
```javascript
console.log('window.studentEditor:', window.studentEditor);
console.log('typeof editSubscription:', typeof window.editSubscription);
```

Você deve ver:
```
window.studentEditor: { editSubscription: ƒ, ... }
typeof editSubscription: function
```

Se ver `undefined`:
  └─ Página não carregou completamente
  └─ Aguarde 3 segundos
  └─ Tente novamente

---

## ❌ PROBLEMA 2: Modal aparece mas está vazio

```
Modal abre
    ↓
Mas não mostra dados
    ↓
Ou mostra "carregando..."
```

### Causa Provável
Dados não carregaram do servidor

### Solução Rápida
```
1. Feche o modal [X]
2. Aguarde 3 segundos
3. Clique [✏️ Editar] novamente
4. Dados devem aparecer
```

### Se Continuar Vazio

F12 → Network → Procure por:
```
GET /api/students/{id}/financial-summary

Status deve ser:
  ✅ 200 OK
  
Se for:
  ❌ 404 Not Found   → Endpoint não existe
  ❌ 500 Server Error → Erro no backend
  ⏳ Pending          → Ainda carregando (aguarde)
```

---

## ❌ PROBLEMA 3: Campo está cinza (desabilitado) quando deveria estar editável

```
Modal abre
    ↓
Todos os campos são cinzas
    ↓
Não consigo editar nada
```

### Causa Provável
Todos os campos foram marcados como `disabled`

### Solução
Verifique quais campos DEVEM ser editáveis:
- ✅ "Próximo Vencimento" → DEVE ser editável
- ✅ "Status" → DEVE ser editável
- ❌ "Plano" → NÃO deve ser editável
- ❌ "Valor Mensal" → NÃO deve ser editável
- ❌ "Data de Início" → NÃO deve ser editável

Se "Próximo Vencimento" ou "Status" estão cinzas:
  └─ Há um bug no código
  └─ Reinicie o servidor: npm run dev
  └─ Recarregue página: F5
  └─ Tente novamente

---

## ❌ PROBLEMA 4: Clico [Salvar ✅] mas nada acontece

```
Modal aberto
    ↓
Mudo a data
    ↓
Clico [Salvar ✅]
    ↓
Nada acontece
```

### Diagnóstico 4A: Console mostra erro?
```
F12 → Console
Procure por erros vermelhos ao clicar

Se houver erro tipo:
  ❌ Cannot read property 'value' of null
     → Campo está undefined
     → Reinicie página (F5)

  ❌ Network error
     → Servidor não responde
     → Verifique if servidor está rodando

  ❌ 400 Bad Request
     → Dados inválidos
     → Cheque formato da data (YYYY-MM-DD)
```

### Diagnóstico 4B: Dados válidos?
```
Ao editar a data, deve estar em formato:
  ✅ 2025-10-16  (correto)
  ❌ 16/10/2025  (errado)
  ❌ 16-10-2025  (errado)

Se inseriu data errada:
  └─ Mude para formato correto
  └─ Clique [Salvar ✅]
```

### Diagnóstico 4C: Requisição sendo enviada?
```
F12 → Network
Clique [Salvar ✅]
Procure por requisição tipo:
  
  PATCH /api/subscriptions/{id}

Se não aparecer:
  └─ Método saveSubscriptionChanges não está funcionando
  └─ Reinicie: npm run dev
  └─ Recarregue: F5

Se aparece com erro (❌ vermelho):
  └─ Request chegou ao servidor mas falhou
  └─ Veja status code:
    - 404 → Endpoint não existe
    - 500 → Erro no backend
    - 400 → Dados inválidos
```

---

## ❌ PROBLEMA 5: Toast verde não aparece após salvar

```
Clico [Salvar ✅]
    ↓
Requisição foi enviada (200 OK)
    ↓
Mas não vejo toast "Sucesso!"
```

### Causa Provável
Função `showFeedback` não está disponível

### Solução
```
F12 → Console
Digite: window.app
Procure por: showFeedback

Se não ver método:
  └─ AcademyApp não inicializou
  └─ Aguarde página carregar completamente
  └─ Recarregue: F5

Se aparecer:
  └─ Método existe mas não está sendo chamado
  └─ Tente novamente após recarregar
```

---

## ❌ PROBLEMA 6: Botão [⏸️ Finalizar] não funciona

```
Vejo botão [⏸️ Finalizar]
    ↓
Clico
    ↓
Nada acontece
```

### Diagnóstico 6A: Confirmação aparece?
```
Pode haver um confirm() JavaScript:
  "Tem certeza que deseja finalizar?"

Se não aparecer:
  └─ Acesso à função confirmEndSubscription bloqueado
  └─ Verifique console (F12)

Se aparecer:
  └─ Confirme e observe resultado
  └─ Se nada acontecer, vá para 6B
```

### Diagnóstico 6B: Console durante clique
```
F12 → Console (aberta antes de clicar)
Clique [⏸️ Finalizar]
Procure por:
  ✅ "Cancelling subscription: [id]"
  ❌ Erros vermelhos

Se ver erro:
  └─ Anote o erro exato
  └─ Reinicie: npm run dev
  └─ Recarregue: F5
```

---

## 🟢 TUDO FUNCIONANDO? ✅

Se passou por todos os testes:

```
┌────────────────────────────────┐
│                                │
│  ✅ FEATURE FUNCIONANDO!       │
│                                │
│  • Modal abre                  │
│  • Dados são editáveis         │
│  • Salvamento funciona         │
│  • Toast confirma sucesso      │
│  • Finalizar funciona          │
│                                │
│  🎉 TUDO PRONTO!              │
│                                │
└────────────────────────────────┘
```

Próximo passo: Execute os 5 testes em `TESTE_AGORA.md`

---

## 📞 SUPORTE RÁPIDO

| Problema | Solução |
|----------|---------|
| Nada acontece | F5 (recarregar) |
| Erros no console | Ctrl+F5 (limpar cache) |
| Servidor não responde | npm run dev |
| Dados em branco | Aguarde 3s, tente novamente |
| Toast não aparece | Reinicie servidor |
| Botões não funcionam | Recarregue página |

---

## 🎯 ÚLTIMO RECURSO

Se nada funcionar:

1. **Ctrl+C** no terminal (parar servidor)
2. **npm run dev** (reiniciar servidor)
3. **Ctrl+Shift+Delete** (limpar cache)
4. **F5** (recarregar página)
5. **Tente novamente**

Se ainda não funcionar:
- Abra DevTools (F12)
- Execute os diagnósticos acima
- Envie screenshot dos erros

---

**Documento completo**: `TESTE_AGORA.md`
**Solução técnica**: `PROBLEMA_CORRIGIDO.md`
