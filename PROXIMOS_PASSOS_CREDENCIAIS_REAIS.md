# 🔐 Próximas Passos: Usar Credenciais Reais do Google Ads

## ✅ Pré-requisitos Completos

Sistema está 100% funcional com credenciais de teste. Agora você pode usar credenciais REAIS.

---

## 🚀 Como Salvar Suas Credenciais Reais

### Passo 1: Abrir CRM Settings
```
http://localhost:3000
Menu: CRM → Configurações → Google Ads
```

### Passo 2: Ver os Campos Preenchidos
Você verá os campos já com credenciais de TESTE:
```
Client ID:        [test-client-123456.apps.googleusercontent.com]
Client Secret:    [Ov22l9Z5_KkYm9X2test...]
Developer Token:  [test1234567890ABC...]
Customer ID:      [1234567890]
```

### Passo 3: Substituir por Credenciais Reais

#### 1️⃣ **Limpar Client ID**
- Selecionar todo o texto
- Colar seu **Client ID real** do Google Cloud Console
- Formato: `xxxxxxxx-xxxx.apps.googleusercontent.com`

#### 2️⃣ **Limpar Client Secret**
- Selecionar todo o texto
- Colar seu **Client Secret real**
- Formato: começa com `Ov22...`

#### 3️⃣ **Limpar Developer Token**
- Selecionar todo o texto
- Colar seu **Developer Token real** do Google Ads API Center
- Formato: ~40 caracteres

#### 4️⃣ **Limpar Customer ID**
- Selecionar todo o texto
- Colar seu **Customer ID real** do Google Ads Account
- Formato: `1234567890` (sem hífens)

### Passo 4: Clicar "Salvar Credenciais"
```
[💾 Salvar Credenciais]
```

**Resultado esperado:**
```
✅ Credenciais salvas com sucesso!
```

---

## 🔄 Verificação Pós-Salvamento

### Visual
Feche e reabra a página. Os campos devem estar **PREENCHIDOS** com suas credenciais reais.

### Console (F12)
Procure pelas mensagens:
```
[GOOGLE ADS] ✅ Client ID loaded: seu-client-id...
[GOOGLE ADS] ✅ Client Secret loaded
[GOOGLE ADS] ✅ Developer Token loaded
[GOOGLE ADS] ✅ Customer ID loaded: seu-customer-id
```

### Badge de Status
Deve mudar para: **⚠️ Credenciais Salvas - Conectar**

---

## 🔗 Conectar ao Google Ads

Após salvar credenciais reais:

1. Clique no botão: **"🔗 Conectar Google Ads"**
2. Você será redirecionado para Google OAuth
3. Autorize a aplicação
4. Voltará para CRM automaticamente
5. Badge deve mostrar: **✅ Conectado**

---

## 📍 Onde Obter as Credenciais Reais

### 🔑 Client ID e Client Secret
```
Google Cloud Console
→ APIs & Services
→ Credentials
→ OAuth 2.0 Client IDs
→ Desktop application (ou Web application)
```

### 🎯 Developer Token
```
Google Ads API Center
→ Settings
→ API Center
→ Developer Token
```

### 👤 Customer ID
```
Google Ads Account
→ Settings
→ Account access user links (ou similar)
→ Seu Customer ID
```

---

## ✅ Checklist Final

- [ ] Tenho Client ID real do Google Cloud
- [ ] Tenho Client Secret real
- [ ] Tenho Developer Token real
- [ ] Tenho Customer ID real
- [ ] Abri http://localhost:3000
- [ ] Cliquei em CRM → Configurações → Google Ads
- [ ] Vi campos já preenchidos com dados de TESTE
- [ ] Substitui todos os 4 campos por dados REAIS
- [ ] Cliquei "Salvar Credenciais"
- [ ] Sistema confirmou: ✅ Credenciais salvas com sucesso!
- [ ] Reabri a página e campos estão com dados REAIS
- [ ] Cliquei "Conectar Google Ads"
- [ ] Completei autenticação no Google
- [ ] Badge mostra: ✅ Conectado

---

## 🎉 Sucesso!

Se todos os passos acima foram completados:

✅ **Suas credenciais Google Ads estão salvas**  
✅ **Sistema conectado ao Google Ads**  
✅ **Pronto para sincronizar leads**  
✅ **Pronto para rastrear conversões**  

---

## ❓ Troubleshooting

### Erro: "Campos continuam com dados de teste"
```
Solução:
1. Verifique se clicou "Salvar Credenciais"
2. Procure por erro no console (F12)
3. Se erro → reporte a mensagem exata
```

### Erro: "Google OAuth não funciona"
```
Solução:
1. Verifique se credenciais são VÁLIDAS
2. Verifique se Google APIs estão ATIVAS
3. Verifique se redirect_uri está correto
```

### Erro: "Conexão recusada"
```
Solução:
1. Verifique se servidor está rodando (npm run dev)
2. Recarregue a página (Ctrl+F5)
3. Tente novamente
```

---

## 📞 Suporte

Se tiver problemas, verifique:
- Console do navegador (F12 → Console) para mensagens de erro
- Logs do servidor (terminal onde rodou npm run dev)
- Arquivo: `CONCLUSAO_TESTE_COMPLETO.md` para análise técnica

---

**Sistema pronto para suas credenciais reais!** 🚀
