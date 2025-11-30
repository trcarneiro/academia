# Deploy Manual - Reativação Self-Service

## Comandos para executar no servidor

1. **Conecte via SSH:**
```bash
ssh root@64.227.28.147
```

2. **Execute os comandos:**
```bash
cd /var/www/academia
git pull origin main
pm2 restart academia
pm2 logs academia --lines 20
```

## Alternativa: Execute tudo de uma vez

Após conectar via SSH:
```bash
cd /var/www/academia && git pull origin main && pm2 restart academia && echo "Deploy concluido!"
```

## Verificar se funcionou

1. Acesse: https://app.smartdefence.com.br
2. No kiosk, um aluno com plano inativo deve ver a opção de reativar
3. Verifique os logs: `pm2 logs academia --lines 50`

## Arquivos alterados neste deploy

- `src/routes/subscriptions.ts` - Novo endpoint POST /api/subscriptions/reactivate
- `public/js/modules/checkin-kiosk/views/ConfirmationView.js` - Telas de reativação
- `public/js/modules/checkin-kiosk/services/ReactivationService.js` - Serviço de reativação
- `public/css/modules/checkin-kiosk.css` - Estilos das telas de reativação
- `src/services/asaasService.ts` - makeRequest agora é público
