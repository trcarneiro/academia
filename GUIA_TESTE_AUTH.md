# 🧪 GUIA DE TESTE - AUTH SUPABASE

**Data**: 20/10/2025  
**Página de Teste**: http://localhost:3000/test-auth-flow.html  
**Status**: ✅ Pronto para execução

---

## 📋 O QUE VOCÊ VERÁ NA TELA

A página de teste tem:

1. **Título**: "🧪 Teste Completo - Auth Supabase"

2. **5 Passos de Teste** (cada um em uma caixa):
   - ✅ 1. Verificar Supabase Client
   - ✅ 2. Fazer Logout (limpar sessão)
   - ✅ 3. Fazer Login (email/senha)
   - ✅ 4. Verificar OrganizationId
   - ✅ 5. Testar Logout Final

3. **Botões**:
   - 🔵 "▶️ Executar Todos os Testes"
   - 🔴 "🗑️ Limpar Log"

4. **Console de Log** (fundo preto com texto verde estilo Matrix)

---

## 🎯 COMO EXECUTAR OS TESTES

### Passo 1: Fornecer Senha

Quando você clicar no botão "▶️ Executar Todos os Testes", aparecerá um popup pedindo:

```
Digite a senha para trcampos@gmail.com:
```

**Digite a senha** e clique OK.

### Passo 2: Aguardar Execução

Os testes vão rodar automaticamente:

1. **Teste 1** - Caixa ficará amarela → verde ✅
2. **Teste 2** - Caixa ficará amarela → verde ✅
3. **Teste 3** - Caixa ficará amarela → verde ✅ (aqui vai fazer o LOGIN)
4. **Teste 4** - Caixa ficará amarela → verde ✅
5. **Teste 5** - Caixa ficará amarela → verde ✅ (aqui vai fazer o LOGOUT)

### Passo 3: Ver Logs

No console preto, você verá logs detalhados:

```
[04:45:23] 🚀 Iniciando bateria de testes de autenticação...
[04:45:23] 📋 Teste 1: Verificando Supabase Client...
[04:45:23] ✅ Supabase client criado com sucesso
[04:45:24] 📋 Teste 2: Fazendo logout (limpando sessão anterior)...
[04:45:24] ✅ Logout executado com sucesso
[04:45:25] 📋 Teste 3: Fazendo login com email/senha...
[04:45:27] ✅ Login bem-sucedido!
[04:45:27]    User ID: abc123...
[04:45:27]    Buscando organizationId do backend...
[04:45:28]    ✅ OrganizationId obtido: 452c0b35-1822...
[04:45:29] 📋 Teste 4: Verificando OrganizationId no localStorage...
[04:45:29] ✅ OrganizationId válido e presente!
[04:45:30] 📋 Teste 5: Testando logout final...
[04:45:31] ✅ Logout executado com sucesso!
[04:45:31] ✅ TODOS OS TESTES CONCLUÍDOS COM SUCESSO!
```

---

## ✅ RESULTADOS ESPERADOS

### Se TUDO DER CERTO:

1. **Todas as 5 caixas** ficarão **VERDES** ✅
2. **Log final** mostrará: `✅ TODOS OS TESTES CONCLUÍDOS COM SUCESSO!`
3. **Nenhum erro** em vermelho

### Teste 3 (Login) - O que acontece:

```
📋 Teste 3: Fazendo login com email/senha...
   Email: trcampos@gmail.com
   Senha: ********
✅ Login bem-sucedido!
   User ID: [seu-uuid]
   Email: trcampos@gmail.com
   Access Token: eyJhbGci...
   Buscando organizationId do backend...
   ✅ OrganizationId obtido: 452c0b35-1822-4890-851e-922356c812fb
```

**Backend verá**:
```
[timestamp] INFO: incoming request
  req: { "method": "GET", "url": "/api/users/by-email?email=trcampos@gmail.com" }
[timestamp] INFO: request completed
  res: { "statusCode": 200 }
```

### Teste 5 (Logout) - O que acontece:

```
📋 Teste 5: Testando logout final...
   Estado ANTES do logout:
   - Token: Presente
   - OrganizationId: Presente
   Estado DEPOIS do logout:
   - Token: Ausente
   - OrganizationId: Ausente
✅ Logout executado com sucesso!
   Sessão encerrada
   localStorage limpo
```

---

## ❌ SE DER ERRO

### Erro: "Senha não fornecida"
- **Causa**: Você cancelou o popup
- **Solução**: Clique no botão novamente e digite a senha

### Erro: "Invalid login credentials"
- **Causa**: Senha incorreta
- **Solução**: Recarregue a página (F5) e tente com a senha correta

### Erro: "OrganizationId não encontrado"
- **Causa**: Backend não retornou organizationId
- **Solução**: Verificar se o endpoint `/api/users/by-email` está funcionando

### Erro: "Cannot connect to backend"
- **Causa**: Servidor não está rodando
- **Solução**: Verifique se `npm run dev` está ativo

---

## 📊 MONITORAMENTO NO TERMINAL

Enquanto os testes rodam, eu estarei monitorando o terminal do servidor.

**Você verá logs como**:

```
[timestamp] INFO: incoming request
  reqId: "req-2"
  req: {
    "method": "GET",
    "url": "/api/users/by-email?email=trcampos@gmail.com",
    "host": "localhost:3000"
  }

[timestamp] INFO: request completed
  reqId: "req-2"
  res: { "statusCode": 200 }
  responseTime: 45.2ms
```

---

## 🎬 AÇÃO AGORA!

1. **Olhe para a janela do Simple Browser** (deve estar aberta com test-auth-flow.html)
2. **Clique no botão azul** "▶️ Executar Todos os Testes"
3. **Digite a senha** no popup
4. **Aguarde 10-15 segundos** para os testes completarem
5. **Observe**:
   - Caixas ficando verdes ✅
   - Logs aparecendo no console preto
   - Mensagem final de sucesso

**Quando terminar, me avise que vou verificar os logs do servidor!** 🚀

---

## 📝 CHECKLIST DE VALIDAÇÃO

Após executar, marque o que aconteceu:

- [ ] Popup de senha apareceu
- [ ] Teste 1 ficou verde (Supabase Client)
- [ ] Teste 2 ficou verde (Logout inicial)
- [ ] Teste 3 ficou verde (Login)
- [ ] Teste 4 ficou verde (OrganizationId)
- [ ] Teste 5 ficou verde (Logout final)
- [ ] Log mostrou "TODOS OS TESTES CONCLUÍDOS COM SUCESSO"
- [ ] Nenhuma mensagem em vermelho

**Se todos os ✅ estiverem marcados = TESTE 100% APROVADO!** 🎉
