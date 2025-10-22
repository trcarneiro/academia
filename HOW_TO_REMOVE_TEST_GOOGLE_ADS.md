# Como remover credenciais de TESTE do Google Ads (seguro)

Este documento descreve como limpar as credenciais de teste que foram inseridas no ambiente de desenvolvimento para a organização `452c0b35-1822-4890-851e-922356c812fb`.

Passos rápidos:

1. Certifique-se de estar na branch correta e de que o servidor de desenvolvimento está parado para evitar concorrência com processos que possam sobrescrever os dados.
2. Execute o script de limpeza (requer Node.js e dependências já instaladas):

```powershell
cd h:\projetos\academia
node scripts\cleanup-google-ads-test-creds.js
```

3. Verifique o resultado fazendo uma requisição à API (substitua host/porta se necessário):

```powershell
Invoke-WebRequest -Uri 'http://localhost:3000/api/google-ads/auth/status' -Headers @{ 'x-organization-id' = '452c0b35-1822-4890-851e-922356c812fb' } | Select-Object -ExpandProperty Content
```

4. A resposta deve mostrar as propriedades `clientId`, `clientSecret`, `developerToken`, `customerId` como `null` e `enabled: false`.

Notas de segurança:
- Não rode este script em produção. Ele foi destinado ao ambiente de desenvolvimento/demo.
- Se você quiser apenas desativar a integração sem apagar as credenciais, adapte o script para apenas setar `googleAdsEnabled: false`.

Se quiser, eu posso rodar esse script para você agora (se você aprovar). Caso prefira, posso também criar um PR com as mudanças e uma etapa de rollback.
