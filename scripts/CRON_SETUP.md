# Configuração de Cron Job para Google Ads Sync

Este documento explica como configurar a sincronização automática do Google Ads para rodar a cada 6 horas.

## Scripts Disponíveis

### Sincronização Manual
```bash
npm run sync:google-ads
```

Executa sincronização completa:
- Sincroniza campanhas e métricas do Google Ads
- Faz upload de conversões offline pendentes
- Gera logs detalhados em `api-server.log`

## Configuração de Automação

### Opção 1: Cron (Linux/Mac)

Edite o crontab:
```bash
crontab -e
```

Adicione a linha (executa a cada 6 horas):
```
0 */6 * * * cd /caminho/para/academia && npm run sync:google-ads >> /var/log/google-ads-sync.log 2>&1
```

**Horários de execução**: 00:00, 06:00, 12:00, 18:00

### Opção 2: Windows Task Scheduler

#### Via PowerShell (Recomendado)

Execute o script abaixo como Administrador:

```powershell
# Criar tarefa agendada para sincronização Google Ads
$action = New-ScheduledTaskAction -Execute "npm" -Argument "run sync:google-ads" -WorkingDirectory "H:\projetos\academia"
$trigger = New-ScheduledTaskTrigger -Daily -At 12am -RepetitionInterval (New-TimeSpan -Hours 6) -RepetitionDuration (New-TimeSpan -Days 1)
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERNAME" -LogonType S4U -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Register-ScheduledTask -TaskName "Academia Google Ads Sync" -Action $action -Trigger $trigger -Principal $principal -Settings $settings
```

#### Via Interface Gráfica

1. Abra o **Task Scheduler** (Agendador de Tarefas)
2. Clique em **"Create Basic Task"** (Criar Tarefa Básica)
3. **Nome**: Google Ads Sync
4. **Trigger**: Daily (Diariamente)
5. **Start time**: 12:00 AM (00:00)
6. **Recur every**: 1 day
7. **Action**: Start a program
   - **Program**: `C:\Program Files\nodejs\npm.cmd`
   - **Arguments**: `run sync:google-ads`
   - **Start in**: `H:\projetos\academia`
8. Em **Settings** (Configurações):
   - ✅ "Run task as soon as possible after a scheduled start is missed"
   - ✅ "Stop the task if it runs longer than: 1 hour"
9. Na aba **Triggers**, edite o trigger:
   - ✅ "Repeat task every: 6 hours"
   - ✅ "For a duration of: Indefinitely"

### Opção 3: PM2 (Node.js Process Manager)

Ideal para ambientes de produção.

#### Instalar PM2
```bash
npm install -g pm2
```

#### Criar arquivo de configuração PM2
Crie `ecosystem.config.js` na raiz do projeto:

```javascript
module.exports = {
  apps: [
    {
      name: 'google-ads-sync',
      script: 'scripts/sync-google-ads.ts',
      interpreter: 'tsx',
      cron_restart: '0 */6 * * *', // A cada 6 horas
      autorestart: false,
      watch: false,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
```

#### Iniciar com PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Configure para iniciar no boot
```

#### Comandos PM2
```bash
pm2 list                  # Ver processos
pm2 logs google-ads-sync  # Ver logs
pm2 restart google-ads-sync
pm2 stop google-ads-sync
pm2 delete google-ads-sync
```

### Opção 4: Docker (Contêiner)

Adicione ao `docker-compose.yml`:

```yaml
services:
  google-ads-sync:
    image: node:18-alpine
    working_dir: /app
    volumes:
      - .:/app
    command: sh -c "while true; do npm run sync:google-ads; sleep 21600; done"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    restart: unless-stopped
```

Ou use um cron contêiner dedicado:

```yaml
services:
  cron:
    image: node:18-alpine
    working_dir: /app
    volumes:
      - .:/app
    command: sh -c "apk add --no-cache dcron && echo '0 */6 * * * cd /app && npm run sync:google-ads' > /etc/crontabs/root && crond -f"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    restart: unless-stopped
```

## Monitoramento

### Verificar Logs

#### Linux/Mac
```bash
tail -f /var/log/google-ads-sync.log
```

#### Windows
```powershell
Get-Content -Path "api-server.log" -Tail 50 -Wait
```

### Logs Importantes

O script gera logs detalhados:
```
🚀 Starting Google Ads automatic synchronization...
🔌 Testing Google Ads connection...
✅ Connection OK
📊 Syncing campaigns from Google Ads...
✅ 5 campaigns synced successfully
📤 Uploading pending conversions...
📋 Found 3 pending conversion(s)
✅ Conversion uploaded for lead: João Silva (uuid-123)
✅ GOOGLE ADS SYNC COMPLETE
   Campaigns synced: 5
   Conversions uploaded: 3
```

### Verificar Status da Última Execução

#### Linux/Mac (Cron)
```bash
grep "GOOGLE ADS SYNC" /var/log/google-ads-sync.log | tail -1
```

#### Windows (Task Scheduler)
1. Abra o Task Scheduler
2. Encontre a tarefa "Google Ads Sync"
3. Veja em **"Last Run Time"** e **"Last Run Result"**

#### PM2
```bash
pm2 logs google-ads-sync --lines 100
```

## Notificações

### Email em Caso de Erro (Linux/Mac)

Edite o crontab para incluir `MAILTO`:
```
MAILTO=seu-email@exemplo.com
0 */6 * * * cd /caminho/para/academia && npm run sync:google-ads >> /var/log/google-ads-sync.log 2>&1
```

### Webhook/Slack (Opcional)

Modifique `scripts/sync-google-ads.ts` para enviar notificações:

```typescript
// Adicione ao final da função main()
if (!result.success) {
  await fetch('https://hooks.slack.com/services/YOUR/WEBHOOK/URL', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `⚠️ Google Ads Sync Failed\nErrors: ${result.errors.join(', ')}`
    })
  });
}
```

## Troubleshooting

### Script não executa
1. **Verifique permissões**:
   ```bash
   chmod +x scripts/sync-google-ads.ts
   ```

2. **Teste manualmente**:
   ```bash
   npm run sync:google-ads
   ```

3. **Verifique variáveis de ambiente**:
   - `DATABASE_URL` configurado no `.env`
   - `DEFAULT_ORG_ID` (opcional)

### Erro "Google Ads not connected"
1. Acesse **CRM → Settings**
2. Configure credenciais da API
3. Clique em **"Conectar Google Ads"**
4. Complete o fluxo OAuth2

### Erro "Connection test failed"
- Verifique Client ID, Secret e Developer Token
- Confirme que Customer ID está correto (formato: XXX-XXX-XXXX)
- Valide que Conversion Action está configurada

### Conversões não são enviadas
- Verifique se leads têm `gclid` capturado
- Confirme que `convertedAt` está preenchido
- Verifique que Conversion Action está configurada em Settings
- Upload só funciona dentro de 90 dias da clicada

## Boas Práticas

1. **Frequência**: 6 horas é ideal para balancear atualização vs API quota
2. **Horários**: Considere timezone do negócio para horários de sincronização
3. **Monitoramento**: Configure alertas para falhas de sincronização
4. **Logs**: Mantenha logs por no mínimo 30 dias para auditoria
5. **Backup**: Faça backup regular do banco antes de mudanças na sincronização

## Referências

- [GOOGLE_ADS_SETUP.md](../GOOGLE_ADS_SETUP.md) - Guia completo de configuração
- [Google Ads API Docs](https://developers.google.com/google-ads/api/docs/start)
- [Crontab Guru](https://crontab.guru/) - Validador de expressões cron
