# Google Ads Error - Deep Dive Debug 🔍

**Data**: 17/10/2025 19:22  
**Status**: INVESTIGANDO

## 🚨 Erro Atual

```
TypeError: Cannot read properties of undefined (reading 'get')
at Customer.getGoogleAdsError (google-ads-api/src/service.js:102:49)
```

## 📊 Estado Atual

**Configurações Validadas** ✅:
- `hasClient`: true
- `hasCustomerId`: true (4118936474)
- `hasRefreshToken`: true (103 caracteres)
- `customerId`: "4118936474" (sem espaços)
- `developerToken`: "Xph0niG06NhkFI8VpTyCEQ" (sem espaços)

**OAuth Completo** ✅:
- Popup aberto
- Google login realizado (trcampos@gmail.com)
- Permissões concedidas
- Callback executado com sucesso
- Refresh token salvo (103 chars)

**Conexão** ❌:
- Teste de conexão FALHA
- Sincronização de campanhas FALHA
- Erro ocorre na linha 265 de `googleAdsService.ts`

## 🔍 Análise do Erro

### O que está acontecendo:

1. ✅ Cliente Google Ads é criado com sucesso
2. ✅ Customer instance é criada com sucesso
3. ✅ Query é enviada para a API
4. ❌ **Google Ads API retorna um erro**
5. ❌ **Biblioteca tenta processar o erro mas o objeto está undefined**

### Stack Trace:

```
Customer.query() → 
  Customer.querier() → 
    Customer.getGoogleAdsError() → 
      ❌ TypeError: undefined.get()
```

### Linha problemática (google-ads-api library):

```typescript
// node_modules/google-ads-api/build/src/service.js:102
getGoogleAdsError(err) {
    return err.metadata.get('google.rpc.help-v1-bin'); // ← err.metadata is undefined!
}
```

## 🎯 Possíveis Causas

### 1. **Refresh Token Expirado** (MAIS PROVÁVEL) 🔴

**Sintomas**: 
- Token existe (103 chars)
- OAuth foi completado
- Mas API rejeita com erro malformado

**Solução**: Re-autorizar OAuth

### 2. **Developer Token Não Aprovado** 🟡

**Sintomas**:
- Token em modo TEST
- Ou token não aprovado pelo Google

**Como verificar**:
1. Acesse https://ads.google.com
2. Tools & Settings → Setup → API Center
3. Verificar status do Developer Token

**Status esperado**: **APPROVED** (não "PENDING" ou "TEST")

### 3. **Conta Sem Acesso ao Customer ID** 🟡

**Sintomas**:
- Conta trcampos@gmail.com não tem acesso à conta 411-893-6474
- Ou conta é Manager (MCC) tentando acessar diretamente

**Como verificar**:
1. Login em https://ads.google.com com trcampos@gmail.com
2. Clicar no seletor de contas (canto superior direito)
3. Procurar por "411-893-6474" ou "4118936474"

**Se não aparecer**: Conta não tem acesso!

### 4. **OAuth Scope Insuficiente** 🔵

**Scope atual**: `https://www.googleapis.com/auth/adwords`

**Problema possível**: Scope desatualizado ou revogado

**Solução**: Revogar permissões antigas e re-autorizar

## 🔧 Próximos Passos para Diagnóstico

### Passo 1: Capturar Erro RAW ✅ FEITO

Adicionado log detalhado ANTES da biblioteca processar erro:

```typescript
logger.error('❌ Google Ads query FAILED - RAW ERROR:', {
    errorType: typeof queryError,
    errorConstructor: queryError?.constructor?.name,
    errorKeys: Object.keys(queryError),
    errorStringified: JSON.stringify(queryError, ...),
    hasMessage: !!queryError?.message,
    hasCode: !!queryError?.code,
    hasDetails: !!queryError?.details
});
```

### Passo 2: Testar Novamente 🔄

1. Reiniciar servidor (`npm run dev`)
2. Clicar em "Sincronizar Campanhas"
3. Verificar logs do backend
4. Procurar por **"RAW ERROR"**

### Passo 3: Interpretar Erro RAW 🔍

**Se erro contém**:
- `code: 16` ou `UNAUTHENTICATED` → Refresh token inválido
- `code: 7` ou `PERMISSION_DENIED` → Sem acesso ao Customer ID
- `code: 3` ou `INVALID_ARGUMENT` → Customer ID errado
- `message: "invalid_grant"` → OAuth expirado/revogado

### Passo 4: Aplicar Correção ✅

**Se refresh token inválido**:
1. Desconectar
2. Conectar novamente
3. Re-autorizar OAuth

**Se Developer Token não aprovado**:
1. Ir para Google Ads API Center
2. Solicitar aprovação do token
3. Aguardar aprovação (24-48h)
4. Durante teste: Usar token em modo TEST

**Se sem acesso ao Customer ID**:
1. Verificar qual conta tem acesso
2. Re-fazer OAuth com conta correta
3. Ou solicitar acesso à conta 411-893-6474

## 📋 Checklist de Validação

- [ ] Refresh token tem mais de 100 caracteres
- [ ] Developer Token status = "APPROVED" no Google Ads
- [ ] Conta OAuth tem acesso ao Customer ID 411-893-6474
- [ ] OAuth scope inclui `adwords` permission
- [ ] Não há espaços em branco nos campos
- [ ] Customer ID está sem hífens (4118936474)
- [ ] Cliente ID e Secret estão corretos

## 🎯 Ação Imediata

1. **Reinicie o servidor** com novos logs
2. **Clique em "Sincronizar Campanhas"**
3. **Copie TODO o log que aparecer** após "RAW ERROR"
4. **Compartilhe comigo** para análise precisa

Com o erro RAW, vamos identificar **exatamente** o que o Google Ads está retornando e aplicar a correção específica.

---

## 📚 Referências

- [Google Ads API Error Codes](https://developers.google.com/google-ads/api/docs/errors)
- [OAuth 2.0 Troubleshooting](https://developers.google.com/identity/protocols/oauth2/web-server#handlingresponse)
- [Developer Token Status](https://support.google.com/google-ads/answer/7459399)
