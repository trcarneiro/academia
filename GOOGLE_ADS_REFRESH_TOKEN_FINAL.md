# 🔐 Google Ads Refresh Token Issue - FINAL DIAGNOSIS

**Data**: 17/10/2025 16:46  
**Status**: 🔍 REFRESH TOKEN INVÁLIDO/EXPIRADO  
**Ação Necessária**: Re-autorização OAuth completa

---

## 📊 Diagnóstico Final

### Evidências do Backend Log
```json
{
  "config": {
    "hasClient": true,           ✅ OK
    "hasCustomerId": true,        ✅ OK
    "hasRefreshToken": true,      ⚠️ EXISTS but INVALID
    "refreshTokenLength": 103,    ⚠️ Token present
    "customerId": "4118936474"    ✅ OK (format corrected)
  }
}
```

### O Problema
O refresh token **existe no banco** (103 caracteres), mas quando a API do Google tenta usá-lo:
1. Google API retorna erro de autenticação
2. Response vem vazio/undefined (porque token é inválido)
3. Biblioteca tenta processar `error.get()` mas `error` é `undefined`
4. Result: `TypeError: Cannot read properties of undefined (reading 'get')`

### Por Que o Token é Inválido?

**Possíveis causas**:

1. **Token gerado em ambiente diferente** ❓
   - Redirect URI no OAuth deve ser exatamente: `http://localhost:3000/api/google-ads/auth/callback`
   - Se foi `http://127.0.0.1:3000` ou outro, token não funciona

2. **Permissões insuficientes** ❓
   - Usuário não concedeu todas as permissões solicitadas
   - Scope necessário: `https://www.googleapis.com/auth/adwords`

3. **Token expirou** ❓
   - Refresh tokens do Google podem expirar se não usados por 6 meses
   - Ou se usuário revogou acesso manualmente

4. **Customer ID não pertence ao usuário autorizado** ❓
   - Token foi gerado com uma conta Google
   - Mas Customer ID `4118936474` pertence a outra conta

5. **Developer Token com problema** ⚠️
   - Developer token tem espaço no início: `" Xph0niG06NhkFI8VpTyCEQ"` (veja o espaço)
   - Isso pode estar causando falha na autenticação

---

## 🔍 Problema Descoberto: Developer Token com Espaço!

**Log mostra**:
```json
"developerToken": " Xph0niG06NhkFI8VpTyCEQ"
                   ↑ ESPAÇO EXTRA AQUI!
```

**Deveria ser**:
```
"developerToken": "Xph0niG06NhkFI8VpTyCEQ"
```

### 🎯 Primeira Ação: Limpar Developer Token

Vamos criar um script para corrigir isso:

```typescript
// Script: scripts/fix-google-ads-developer-token.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixDeveloperToken() {
  const orgId = '452c0b35-1822-4890-851e-922356c812fb';
  
  const integration = await prisma.googleAdsIntegration.findUnique({
    where: { organizationId: orgId }
  });
  
  if (!integration) {
    console.log('❌ Integration not found');
    return;
  }
  
  console.log('🔍 Current developer token:', JSON.stringify(integration.developerToken));
  
  // Trim whitespace
  const cleanToken = integration.developerToken?.trim();
  
  if (cleanToken !== integration.developerToken) {
    await prisma.googleAdsIntegration.update({
      where: { organizationId: orgId },
      data: { developerToken: cleanToken }
    });
    
    console.log('✅ Developer token cleaned!');
    console.log('📝 Old:', JSON.stringify(integration.developerToken));
    console.log('📝 New:', JSON.stringify(cleanToken));
  } else {
    console.log('✅ Developer token already clean');
  }
}

fixDeveloperToken()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
```

---

## 🧪 Plano de Ação (Passo a Passo)

### Etapa 1: Limpar Developer Token ⚡
```bash
# No terminal
cd h:\projetos\academia
npx tsx scripts/fix-google-ads-developer-token.ts
```

**Resultado esperado**:
```
✅ Developer token cleaned!
📝 Old: " Xph0niG06NhkFI8VpTyCEQ"
📝 New: "Xph0niG06NhkFI8VpTyCEQ"
```

### Etapa 2: Deletar Refresh Token Inválido 🗑️
```sql
-- Via Prisma Studio ou SQL direto
UPDATE "GoogleAdsIntegration"
SET "refreshToken" = NULL
WHERE "organizationId" = '452c0b35-1822-4890-851e-922356c812fb';
```

**Resultado esperado**:
- Status muda para `"connected": false`
- Frontend mostra botão "Conectar Google Ads"

### Etapa 3: Re-autorização OAuth Completa 🔐

**3.1. No navegador - CRM Settings → Google Ads**:
- Clicar em "Conectar Google Ads"
- Popup abre com tela do Google

**3.2. Na tela do Google**:
- **Fazer login** com a conta que tem acesso ao Customer ID `411-893-6474`
- **IMPORTANTE**: Verificar se a conta tem acesso a esse Customer ID
- Ver lista de contas Google Ads disponíveis

**3.3. Conceder permissões**:
- ✅ "View and manage your Google Ads campaigns"
- ✅ "See and download your Google Ads reports and data"
- Clicar em "Allow"

**3.4. Redirecionamento**:
- Sistema redireciona para: `http://localhost:3000/api/google-ads/auth/callback?code=...`
- Backend processa código e obtém novo refresh token
- Frontend mostra "Conectado com sucesso"

### Etapa 4: Testar Sincronização ✅

**4.1. Clicar em "Testar Conexão"**:
- Deve retornar `"success": true`
- Sem erros no console

**4.2. Clicar em "Sincronizar Campanhas"**:
- Backend deve retornar campanhas do Google Ads
- Ou mensagem clara se não houver campanhas

**Logs esperados** (sucesso):
```
🔄 Creating Google Ads customer instance
  customerId: "4118936474"
  hasRefreshToken: true
  refreshTokenLength: 120+
🔍 Querying Google Ads campaigns...
✅ Synced X campaigns from Google Ads
```

**Se falhar novamente**:
```
🔐 Google Ads authentication error: The refresh token is invalid or expired.

📋 How to fix:
1. Click "Conectar Google Ads" button
2. Complete the OAuth authorization flow
3. Make sure to grant all requested permissions
4. Try syncing again after authorization completes
```

---

## 🔧 Alternativa: Verificar Customer ID

Se após limpar o developer token e re-autorizar **ainda falhar**, pode ser que o Customer ID esteja errado.

**Como verificar**:
1. Fazer login em: https://ads.google.com
2. Com a conta que você vai usar no OAuth
3. Ver Customer ID no topo direito (formato: `411-893-6474`)
4. Copiar exatamente como aparece
5. Atualizar no banco se diferente:

```sql
UPDATE "GoogleAdsIntegration"
SET "customerId" = 'CUSTOMER-ID-CORRETO'
WHERE "organizationId" = '452c0b35-1822-4890-851e-922356c812fb';
```

---

## 📝 Checklist de Validação

Antes de tentar sincronizar, confirme:

- [ ] Developer Token **sem espaços** no início/fim
- [ ] Customer ID está correto e sem hífens no banco: `4118936474`
- [ ] Customer ID pertence à conta Google que vai autorizar
- [ ] Refresh token foi deletado (forçar nova autorização)
- [ ] OAuth redirect URI é exatamente: `http://localhost:3000/api/google-ads/auth/callback`
- [ ] Usuário concedeu **todas** as permissões solicitadas
- [ ] Conta Google tem acesso de **Admin** ao Customer ID
- [ ] Developer Token é válido no Google Ads API Center

---

## 🚀 Próximos Passos

### Imediato (AGORA):
1. ⏳ **Criar e executar script** para limpar developer token
2. ⏳ **Deletar refresh token inválido** via Prisma Studio
3. ⏳ **Recarregar página** CRM Settings
4. ⏳ **Clicar "Conectar Google Ads"** e completar OAuth
5. ⏳ **Testar conexão** → deve retornar sucesso
6. ⏳ **Sincronizar campanhas** → deve funcionar ou dar erro específico

### Se Continuar Falhando:
1. Verificar que Customer ID `4118936474` existe e está acessível
2. Confirmar que usuário OAuth tem permissões de Admin
3. Revisar Google Ads API Center: https://ads.google.com/aw/apicenter
4. Verificar se Developer Token está aprovado (não é "test")
5. Checar logs do Google OAuth Consent Screen para erros

---

## 📚 Documentação de Suporte

**Criada nesta sessão**:
- `CONSOLE_LOGS_FIX_COMPLETE.md` - Fix de org context warning
- `GOOGLE_ADS_SYNC_DIAGNOSTIC_UPDATE.md` - Enhanced error logging
- `GOOGLE_ADS_CUSTOMER_ID_FIX.md` - Customer ID format fix
- `GOOGLE_ADS_AUTH_ISSUE_FINAL.md` - Diagnóstico completo de autenticação
- `GOOGLE_ADS_REFRESH_TOKEN_FINAL.md` - Este documento

**Google Ads Docs**:
- OAuth 2.0: https://developers.google.com/google-ads/api/docs/oauth/overview
- Refresh Tokens: https://developers.google.com/identity/protocols/oauth2#expiration
- API Center: https://ads.google.com/aw/apicenter
- Customer ID: https://support.google.com/google-ads/answer/1704344

---

**Status Atual**: 
- ✅ Customer ID format fixado
- ✅ Enhanced error messages implementadas
- ⚠️ Developer Token com espaço detectado
- ❌ Refresh Token inválido/expirado
- ⏳ Aguardando limpeza de developer token + re-autorização OAuth
