# 🧪 Teste de Conexão Google Ads - Instruções Manuais

**Data**: 19/10/2025  
**Objetivo**: Testar conexão e sincronizar campanhas via CRM Module

---

## 🚀 Passo-a-Passo

### 1. Certifique-se que o servidor está rodando

```bash
npm run dev
# Ou abra a URL: http://localhost:3000
```

### 2. Navegue até o Módulo CRM

- Abra: http://localhost:3000
- Clique em **CRM** (menu lateral esquerdo)
- Vá para aba **Settings** ou **Configurações**

### 3. Verifique a seção de Google Ads

Você deve ver:
- ✅ **Cliente ID**: 692896555152-1vavst4...
- ✅ **Developer Token**: Xph0niG06N...
- ✅ **Customer ID**: 4118936474
- ✅ **Status**: Connected (verde)

### 4. Clique em "Testar Conexão" (Test Connection)

Aguarde os 6 passos:
1. ✅ Cliente ID configurado
2. ✅ Client Secret configurado
3. ✅ Developer Token configurado
4. ✅ Customer ID configurado
5. 🔵 Refresh Token válido (API test)
6. ⏳ Conexão com Google Ads API

**Resultado esperado**: ✅ Verde em todos os passos

### 5. Sincronizar Campanhas

Clique em botão **"Sincronizar Campanhas"** ou **"Sync Campaigns"**

**Resultado esperado**:
```
✅ Sincronização concluída!
Total de campanhas: X
```

### 6. Visualizar Campanhas Sincronizadas

Volte para aba **"Campanhas"** ou **"Campaigns"**

Você deve ver:
- Lista de campanhas do Google Ads
- Nome, Status, Impressões, Cliques, Custo, Conversões

---

## 🔍 Esperado ver no Banco de Dados

Após sincronização, estas tabelas devem ter dados:

```sql
SELECT * FROM "GoogleAdsCampaign" 
WHERE "organizationId" = '452c0b35-1822-4890-851e-922356c812fb'
ORDER BY "cost" DESC;
```

**Esperado**: Lista de campanhas com:
- `id`, `googleAdsId`, `name`, `status`
- `impressions`, `clicks`, `cost`, `conversions`

---

## 🐛 Se receber erro

### Erro: "Cannot read properties of undefined (reading 'get')"
- Significa que o token do Google está inválido ou expirado
- **Solução**: 
  1. Clique em "Desconectar" (Disconnect)
  2. Aguarde 5 segundos
  3. Clique em "Conectar Google Ads" novamente
  4. Autorize no popup que abrir
  5. Volte e teste novamente

### Erro: "UNAUTHENTICATED" ou "Invalid Credentials"
- O token de refresh pode ter expirado
- **Solução**: Mesmo que acima - reconecte OAuth

### Erro: "PERMISSION_DENIED"
- A conta Google não tem acesso ao Customer ID 4118936474
- **Solução**: 
  1. Vá para https://ads.google.com
  2. Faça login com a mesma conta (trcampos@gmail.com)
  3. Verifique se vê a conta "411-893-6474"

---

## ✅ Validação

Após sincronizar com sucesso, verifique:

1. **UI do CRM**:
   - [ ] Aba "Campanhas" mostra lista
   - [ ] Nomes das campanhas estão visíveis
   - [ ] Métricas (impressões, cliques, custo) aparecem

2. **Backend Logs** (console do servidor):
   - [ ] Log mostra "✅ Query completed successfully"
   - [ ] Log mostra "synced X campaigns"

3. **Banco de Dados**:
   - [ ] Tabela `GoogleAdsCampaign` tem registros
   - [ ] `organizationId` está correto
   - [ ] Timestamps `createdAt` e `updatedAt` são recentes

---

## 🔗 URLs Úteis

- **Frontend**: http://localhost:3000
- **API Swagger**: http://localhost:3000/docs
- **Status da API**: http://localhost:3000/api/google-ads/auth/status
- **Campanhas Sincronizadas**: http://localhost:3000/api/google-ads/campaigns

---

## 📞 Contato

Se persistir o erro, compartilhe:
1. Screenshot da mensagem de erro
2. Console logs (F12 → Console tab)
3. Backend server logs (terminal onde rodou `npm run dev`)
