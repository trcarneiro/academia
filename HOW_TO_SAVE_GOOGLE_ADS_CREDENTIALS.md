# 🎯 GUIA PRÁTICO: Carregar Credenciais Google Ads no CRM

**Problema**: Campos de credenciais aparecem vazios na tela CRM Settings  
**Causa**: Credenciais não foram salvas no banco de dados  
**Solução**: Preencher e salvar as credenciais manualmente  

---

## 📋 O que foi corrigido

✅ **`src/config/dev.ts`** - Agora aponta para organização CORRETA  
✅ **Servidor** - Reiniciado com nova configuração  
✅ **Banco de dados** - Registrado CrmSettings para organização correta  

---

## 🚀 Como Salvar as Credenciais Google Ads

### Passo 1: Abrir a aplicação
```
http://localhost:3000
```

### Passo 2: Navegar até CRM
- Clicar em **"CRM"** no menu lateral esquerdo

### Passo 3: Abrir Settings
- Procurar pela opção **"⚙️ Configurações"** ou **"Settings"**
- Pode estar em abas no topo ou em um submenu

### Passo 4: Ir para aba "Google Ads"
Na página de Settings, buscar a seção de **Google Ads**

Você verá um formulário assim:
```
┌─────────────────────────────────────────┐
│ Google Ads - Configuração               │
├─────────────────────────────────────────┤
│                                         │
│ Client ID                               │
│ [___________________________]            │
│                                         │
│ Client Secret                           │
│ [___________________________]            │
│                                         │
│ Developer Token                         │
│ [___________________________]            │
│                                         │
│ Customer ID                             │
│ [___________________________]            │
│                                         │
│ [💾 Salvar Credenciais]  [🔗 Conectar]  │
│                                         │
└─────────────────────────────────────────┘
```

### Passo 5: Preencher os campos

Cada campo precisa de informações do Google Ads Console:

#### 1️⃣ Client ID
```
Onde encontrar: Google Cloud Console → APIs & Services → Credentials
Formato: xxxxxxxx.apps.googleusercontent.com
Exemplo: 1234567890-abc123xyz.apps.googleusercontent.com
```

#### 2️⃣ Client Secret
```
Onde encontrar: Google Cloud Console → APIs & Services → Credentials → OAuth 2.0
Formato: Texto sem espaços, começa com Ov ou similar
Exemplo: Ov22l9Z5_KkYm9X2abc...
```

#### 3️⃣ Developer Token
```
Onde encontrar: Google Ads API Center → Settings → API Center
Formato: Texto com 40+ caracteres
Exemplo: 1234567890123456789012345...
```

#### 4️⃣ Customer ID
```
Onde encontrar: Google Ads Account → Settings
Formato: Números com hífens (1234-567-8901) ou apenas números (1234567890)
Exemplo: 1234567890
```

### Passo 6: Clicar "Salvar Credenciais"
```
[💾 Salvar Credenciais]
```

**Resultado esperado:**
```
✅ Credenciais salvas com sucesso!
```

### Passo 7: Verificar se foi salvo
Feche e reabra a página de Settings:
- Se os campos estão **PREENCHIDOS** → ✅ Funcionou!
- Se ainda estão vazios → ❌ Houve erro (verifique console)

---

## 🔍 Verificação: Como Saber se Funcionou

### Sinal 1: Campos preenchidos
Na próxima vez que abrir Settings, os campos devem mostrar valores (mascarados por segurança)

### Sinal 2: Badge de status
Deve aparecer uma badge: ✅ "Conectado" ou ⚠️ "Credenciais Salvas - Conectar"

### Sinal 3: Verificar no banco (Técnico)
```bash
cd h:\projetos\academia
node check-all-crm-data.js
```

Resultado esperado:
```
Has Google Ads Credentials: SIM ✅
Client ID: ***HIDDEN***
Developer Token: ***HIDDEN***
```

---

## ❌ Se ainda não funcionar

### Erro 1: "Preencha todos os campos"
```
❌ Solução: Certifique-se que TODOS os 4 campos estão preenchidos
```

### Erro 2: Conexão recusada
```
❌ Solução: 
- Verificar se servidor está rodando (npm run dev)
- Esperar 30 segundos para inicializar completamente
```

### Erro 3: Campos vazios após salvar
```
❌ Solução:
1. Abrir DevTools (F12) → Console
2. Procurar por erros vermelhos
3. Recarregar a página (Ctrl+F5)
4. Tentar salvar novamente
```

### Erro 4: Dados não aparecem no banco
```
❌ Solução (Técnico):
1. Abrir http://localhost:5555 (Prisma Studio)
2. Ir para tabela "crm_settings"
3. Verificar se a linha foi criada
4. Verificar se o organizationId está correto:
   452c0b35-1822-4890-851e-922356c812fb
```

---

## 📊 Resumo do Fluxo

```
┌──────────────────────────────────┐
│  Abrir CRM → Settings            │
└────────────┬─────────────────────┘
             ↓
┌──────────────────────────────────┐
│  Frontend carrega credenciais     │
│  GET /api/google-ads/auth/status │
└────────────┬─────────────────────┘
             ↓
┌──────────────────────────────────┐
│  Backend consulta banco           │
│  SELECT FROM crm_settings WHERE  │
│  organizationId = '452c0b35...'  │
└────────────┬─────────────────────┘
             ↓
        ┌────┴────┐
        ↓         ↓
    SIM ✅     NÃO ❌
   (dados)   (vazio)
        ↓         ↓
     Preenche   Mostra
     campos     vazio
```

---

## ✅ Verificação Final

Depois de salvar, teste:

```
✅ Campos aparecem preenchidos
✅ Badge mostra "Conectado" ou "Credenciais Salvas"
✅ Nenhum erro no console (F12)
✅ node check-all-crm-data.js mostra dados salvos
```

Se tudo ok → **Sistema funcionando corretamente!** 🎉

---

**Dúvidas?** Verifique `DIAGNOSTIC_FINAL_CRM_CREDENTIALS.md` para análise técnica completa.
