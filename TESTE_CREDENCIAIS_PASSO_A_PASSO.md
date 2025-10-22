# 🧪 TESTE COMPLETO: Credenciais Google Ads

## ✅ O que foi feito

1. ✅ Script `save-test-credentials.js` executado
2. ✅ Credenciais de TESTE salvas no banco de dados:
   - Client ID: `test-client-123456.apps.googleusercontent.com`
   - Client Secret: `Ov22l9Z5_KkYm9X2test...`
   - Developer Token: `test1234567890ABCDEFGHIJKLMNOP...`
   - Customer ID: `1234567890`
3. ✅ Servidor reiniciado

---

## 🚀 Agora você precisa fazer:

### Passo 1: Abrir DevTools do Navegador
- **Navegador já está aberto** em: http://localhost:3000
- Pressione: **F12** (ou Ctrl+Shift+I)
- Clique na aba **"Console"**

### Passo 2: Testar a API
No console, copie e cole este código:

```javascript
async function testGoogleAdsAPI() {
  console.log('🧪 Testando Google Ads API...\n');
  try {
    console.log('📡 Requisição: GET /api/google-ads/auth/status');
    const response = await fetch('/api/google-ads/auth/status', {
      method: 'GET',
      headers: {
        'x-organization-id': '452c0b35-1822-4890-851e-922356c812fb',
        'Content-Type': 'application/json'
      }
    });
    console.log(`📊 Status HTTP: ${response.status}`);
    const data = await response.json();
    console.log('✅ Resposta da API:');
    console.table(data);
    console.log('\n🔍 Análise:');
    console.log('Client ID:', data.data.clientId ? 'PREENCHIDO ✅' : 'VAZIO ❌');
    console.log('Client Secret:', data.data.clientSecret ? 'PREENCHIDO ✅' : 'VAZIO ❌');
    console.log('Developer Token:', data.data.developerToken ? 'PREENCHIDO ✅' : 'VAZIO ❌');
    console.log('Customer ID:', data.data.customerId ? 'PREENCHIDO ✅' : 'VAZIO ❌');
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}
testGoogleAdsAPI();
```

**Resultado esperado:**
```
✅ Client ID: PREENCHIDO ✅
✅ Client Secret: PREENCHIDO ✅
✅ Developer Token: PREENCHIDO ✅
✅ Customer ID: PREENCHIDO ✅
```

---

### Passo 3: Verificar na Tela CRM

1. **Feche o DevTools** (F12) ou deixe em background
2. Na mesma página, clique em: **"CRM"** (menu lateral)
3. Clique em: **"⚙️ Configurações"** ou aba **"Google Ads"**
4. **Verifique se os campos aparecem PREENCHIDOS**:

```
┌──────────────────────────────┐
│ Client ID                    │
│ [test-client-123456.apps...] │ ← Deve aparecer preenchido!
│                              │
│ Client Secret                │
│ [Ov22l9Z5_KkYm9X2test...]   │ ← Deve aparecer preenchido!
│                              │
│ Developer Token              │
│ [test1234567890ABC...]       │ ← Deve aparecer preenchido!
│                              │
│ Customer ID                  │
│ [1234567890]                 │ ← Deve aparecer preenchido!
└──────────────────────────────┘
```

---

## 🎯 Possíveis Resultados

### ✅ RESULTADO 1: Tudo funcionando!
```
API retorna: Credenciais PREENCHIDAS ✅
CRM mostra:  Campos PREENCHIDOS ✅
Conclusão:   SISTEMA OK! 🎉
```

### ⚠️ RESULTADO 2: API OK, CRM vazio
```
API retorna: Credenciais PREENCHIDAS ✅
CRM mostra:  Campos VAZIOS ❌
Problema:    Bug no frontend (loadGoogleAdsSettings)
Solução:     Verificar console do navegador por erros
```

### ❌ RESULTADO 3: API retorna vazio
```
API retorna: Credenciais VAZIAS ❌
CRM mostra:  Campos VAZIOS ❌
Problema:    Credenciais não foram salvas ou config errada
Solução:     Executar save-test-credentials.js novamente
```

---

## 📊 Checklist de Verificação

- [ ] Abri http://localhost:3000
- [ ] Pressionei F12 para abrir DevTools
- [ ] Cliquei em aba "Console"
- [ ] Colei o código de teste e pressionei Enter
- [ ] API retornou credenciais PREENCHIDAS
- [ ] Cliquei em CRM → Configurações → Google Ads
- [ ] Campos de formulário aparecem PREENCHIDOS
- [ ] Sistema funcionando corretamente! ✅

---

## 🔧 Se algo não funcionar

### Erro: "API não responde"
```
Solução:
1. Verifique se servidor está rodando: npm run dev
2. Aguarde 10 segundos para inicializar
3. Recarregue a página: Ctrl+F5
4. Tente novamente
```

### Erro: "Credenciais aparecem VAZIAS na API"
```
Solução:
1. Execute novamente: node save-test-credentials.js
2. Verifique se saída mostrou: ✅ Credenciais de TESTE salvas com sucesso!
3. Se erro → verificar logs do script
```

### Erro: "Campos CRM vazios mesmo com API OK"
```
Solução (Debug):
1. Abra DevTools (F12)
2. Vá para Console
3. Procure por mensagens de erro
4. Procure por: "[GOOGLE ADS]" para rastrear o fluxo
5. Se vir "✅ Client ID loaded" → campos devem estar preenchidos
6. Se NÃO vir → há erro no carregamento
```

---

## 📝 Arquivo de Teste

O arquivo `test-google-ads-api.js` já foi criado no repositório se precisar usar depois.

Você pode também abrir em:
- `h:\projetos\academia\test-google-ads-api.js`

---

**Status**: 🟢 Pronto para testes!  
**Próximas etapas**: 
1. Execute os testes acima
2. Me reporte o resultado (FUNCIONA ou ERRO)
3. Se erro, vou debugar pelo console
