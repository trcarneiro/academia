# Google Ads OAuth Connection - Fix Completo

## 🐛 Problema Identificado

Quando o usuário clicava em "Connect Google Ads" no CRM, recebia o seguinte erro:

```
ApiError: Missing required parameters: clientId, clientSecret, redirectUri
HTTP 400 Bad Request - GET /api/google-ads/auth/url
```

### Análise da Causa Raiz

O endpoint `/api/google-ads/auth/url` estava esperando que as credenciais OAuth fossem passadas como **query parameters** na URL:

```typescript
// ❌ IMPLEMENTAÇÃO ANTERIOR (INCORRETA)
fastify.get('/auth/url', async (request: FastifyRequest<{
    Querystring: {
        clientId: string;
        clientSecret: string;
        redirectUri: string;
    };
}>, reply: FastifyReply) => {
    const { clientId, clientSecret, redirectUri } = request.query;
    // Frontend não estava enviando estes parâmetros
});
```

**Frontend chamava assim:**
```javascript
// Em public/crm/modules/index.js linha ~1700
const response = await moduleAPI.request('GET', '/api/google-ads/auth/url');
// ❌ Sem query parameters!
```

**Problemas dessa abordagem:**
1. ❌ Frontend teria que expor credenciais sensíveis no código
2. ❌ Credenciais apareceriam na URL do navegador
3. ❌ Inconsistente com o endpoint `/auth/callback` que busca do banco
4. ❌ Menos seguro - credenciais transitando em múltiplos pontos

---

## ✅ Solução Implementada

### Backend Fix (src/routes/googleAds.ts)

Modificado o endpoint `/auth/url` para **buscar credenciais do banco de dados**, seguindo o mesmo padrão do `/auth/callback`:

```typescript
// ✅ NOVA IMPLEMENTAÇÃO (CORRETA)
fastify.get('/auth/url', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const organizationId = getDefaultOrganizationId();
        
        // 🔐 Busca credenciais do banco (salvas via /auth/save-credentials)
        const settings = await prisma.crmSettings.findUnique({
            where: { organizationId }
        });
        
        if (!settings?.googleAdsClientId || !settings?.googleAdsClientSecret) {
            return reply.code(400).send({
                success: false,
                message: 'Google Ads credentials not configured. Please save credentials first in Settings.'
            });
        }
        
        // 🔐 Usa credenciais do banco, não da URL
        const redirectUri = process.env.GOOGLE_ADS_REDIRECT_URI || 'http://localhost:3000/api/google-ads/auth/callback';
        const service = new GoogleAdsService(organizationId);
        
        await service.initializeOAuth2(
            settings.googleAdsClientId,
            settings.googleAdsClientSecret,
            redirectUri
        );
        const authUrl = service.getAuthorizationUrl(redirectUri);
        
        return reply.send({
            success: true,
            data: { authUrl }
        });
        
    } catch (error: any) {
        logger.error('Error generating auth URL:', error);
        return reply.code(500).send({
            success: false,
            message: 'Failed to generate authorization URL',
            error: error.message
        });
    }
});
```

### Benefícios da Nova Implementação

1. ✅ **Segurança**: Credenciais NUNCA saem do backend
2. ✅ **Consistência**: Mesmo padrão do `/auth/callback` (linhas 93-103)
3. ✅ **Simplicidade**: Frontend não precisa gerenciar credenciais
4. ✅ **Rastreabilidade**: Todas as credenciais vêm de uma única fonte (banco)
5. ✅ **Manutenibilidade**: Mais fácil de entender e modificar

---

## 🔄 Fluxo OAuth Completo (Após Fix)

### 1️⃣ Salvar Credenciais (FUNCIONANDO)
```
Frontend → POST /api/google-ads/auth/save-credentials
         → Backend salva no `CrmSettings`
         → ✅ "Credenciais salvas com sucesso!"
```

### 2️⃣ Iniciar Conexão OAuth (AGORA FUNCIONA)
```
Frontend → Clica "Connect Google Ads"
         → GET /api/google-ads/auth/url (SEM query params)
         → Backend busca credenciais do banco
         → Backend gera URL de autorização OAuth
         → Frontend redireciona para Google
```

### 3️⃣ Callback OAuth (JÁ FUNCIONAVA)
```
Google  → Redireciona para /api/google-ads/auth/callback?code=ABC123
        → Backend busca credenciais do banco
        → Backend troca code por refresh_token
        → Backend salva tokens no CrmSettings
        → ✅ Redirect para /crm?tab=settings&success=google-ads-connected
```

---

## 🧪 Como Testar

### Pré-requisitos
1. Server rodando: `npm run dev`
2. Credenciais Google Ads configuradas em CRM > Settings:
   - Client ID
   - Client Secret
   - Developer Token
   - Customer ID (ex: 136-615-2046)

### Teste Passo a Passo

1. **Abrir CRM Settings**
   ```
   http://localhost:3000/crm?tab=settings
   ```

2. **Preencher credenciais** (se ainda não estiverem salvas)
   - Client ID: [seu client ID]
   - Client Secret: [seu client secret]
   - Developer Token: [seu token]
   - Customer ID: 136-615-2046
   - Clicar "Save Credentials"
   - ✅ Ver mensagem: "Credenciais salvas com sucesso!"

3. **Conectar Google Ads**
   - Clicar botão "Connect Google Ads"
   - ✅ **ANTES**: Erro 400 "Missing required parameters"
   - ✅ **AGORA**: Redireciona para tela de consentimento do Google

4. **Completar OAuth no Google**
   - Selecionar conta Google
   - Aceitar permissões
   - ✅ Redireciona de volta para `/crm?tab=settings&success=google-ads-connected`

5. **Verificar Status**
   - Status deve mostrar "Connected"
   - Botão muda para "Disconnect"

---

## 📊 Comparação Técnica

| Aspecto | ❌ Antes (Query Params) | ✅ Depois (Database) |
|---------|------------------------|----------------------|
| **Segurança** | Credenciais na URL | Credenciais no backend |
| **Frontend** | Precisa gerenciar secrets | Só chama endpoint |
| **Consistência** | Diferente do callback | Igual ao callback |
| **Código** | Frontend + Backend | Só Backend |
| **Manutenção** | Duplicação de lógica | Centralizado |
| **Logs** | Credenciais podem vazar | Credenciais seguras |

---

## 🔐 Segurança

### Antes (❌ INSEGURO)
```
GET /api/google-ads/auth/url?clientId=XXX&clientSecret=YYY&redirectUri=ZZZ
           ^^^ Credenciais expostas na URL do navegador
```

### Depois (✅ SEGURO)
```
GET /api/google-ads/auth/url
    ↓
Backend busca de: CrmSettings.findUnique({ where: { organizationId } })
    ↓
Credenciais NUNCA saem do banco/backend
```

---

## 🎯 Status do Fix

- ✅ **Problema identificado**: Query params ausentes
- ✅ **Causa raiz mapeada**: Frontend não enviava credenciais
- ✅ **Solução implementada**: Backend busca do banco
- ✅ **Código revisado**: Sem erros TypeScript
- ✅ **Server reiniciado**: npm run dev
- ⏳ **Teste manual**: Aguardando usuário testar no navegador

---

## 📝 Arquivos Modificados

### src/routes/googleAds.ts
- **Linhas 25-60**: Endpoint `/auth/url` refatorado
- **Mudança**: De `request.query` para `prisma.crmSettings.findUnique()`
- **Impacto**: Zero quebra de compatibilidade (frontend já estava chamando sem params)

---

## 🔍 Troubleshooting

### Erro: "Google Ads credentials not configured"
**Causa**: Credenciais não foram salvas no banco
**Solução**: Ir em CRM > Settings > Preencher e salvar credenciais

### Erro: "Failed to generate authorization URL"
**Causa**: Google Ads API rejeitou as credenciais
**Solução**: Verificar se Client ID e Secret estão corretos no Google Cloud Console

### Erro: 404 Not Found
**Causa**: Server não está rodando
**Solução**: `npm run dev`

---

## 🚀 Próximos Passos

1. **Teste Manual**: Usuário deve clicar "Connect Google Ads" e verificar o redirect
2. **OAuth Callback**: Completar fluxo no Google e verificar tokens salvos
3. **API Calls**: Testar listagem de campanhas após conectar
4. **Developer Token**: Submeter aplicação ao Google (use GOOGLE_ADS_SHORT_APPLICATION.md)

---

## 📚 Referências

- **Swagger Docs**: http://localhost:3000/docs (endpoint `/api/google-ads/auth/url`)
- **Google Ads OAuth Guide**: https://developers.google.com/google-ads/api/docs/oauth/overview
- **Prisma CrmSettings Model**: `prisma/schema.prisma` linha ~450
- **Frontend CRM Module**: `public/crm/modules/index.js` linha ~1700

---

**Versão**: 1.0  
**Data**: 2025-09-11  
**Autor**: GitHub Copilot  
**Status**: ✅ Fix implementado, aguardando teste
