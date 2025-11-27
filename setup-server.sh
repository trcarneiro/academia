#!/bin/bash
# 🔧 Script de Setup Inicial do Servidor - Academia Krav Maga v2.0
# Executar UMA VEZ no servidor remoto para configurar o ambiente

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 Setup Inicial - Academia Krav Maga v2.0"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verificar se é root
if [ "$EUID" -ne 0 ]; then 
  echo "❌ Execute como root: sudo bash setup-server.sh"
  exit 1
fi

APP_PATH="/var/www/academia"
APP_USER="www-data"

# 1. Atualizar sistema
echo "📦 Atualizando sistema..."
apt-get update -qq
apt-get upgrade -y -qq
echo "✅ Sistema atualizado"

# 2. Instalar dependências
echo ""
echo "📦 Instalando dependências..."

# Node.js 20.x LTS
if ! command -v node &> /dev/null; then
    echo "  → Instalando Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

NODE_VERSION=$(node -v)
echo "  ✅ Node.js $NODE_VERSION instalado"

# PM2
if ! command -v pm2 &> /dev/null; then
    echo "  → Instalando PM2..."
    npm install -g pm2
fi

echo "  ✅ PM2 instalado"

# Git
if ! command -v git &> /dev/null; then
    echo "  → Instalando Git..."
    apt-get install -y git
fi

echo "  ✅ Git instalado"

# 3. Criar estrutura de diretórios
echo ""
echo "📂 Criando estrutura de diretórios..."

mkdir -p $APP_PATH
mkdir -p $APP_PATH/logs
mkdir -p $APP_PATH/backups
mkdir -p /var/log/academia

chown -R $APP_USER:$APP_USER $APP_PATH
chown -R $APP_USER:$APP_USER /var/log/academia

echo "✅ Diretórios criados"

# 4. Configurar Firewall
echo ""
echo "🔥 Configurando firewall..."

if command -v ufw &> /dev/null; then
    ufw allow 22/tcp      # SSH
    ufw allow 3000/tcp    # API
    ufw allow 3001/tcp    # Kiosk
    ufw allow 80/tcp      # HTTP
    ufw allow 443/tcp     # HTTPS
    
    # Habilitar UFW se não estiver
    echo "y" | ufw enable || true
    
    echo "✅ Firewall configurado"
else
    echo "⚠️  UFW não encontrado, pule esta etapa manualmente"
fi

# 5. Configurar PM2 como serviço systemd
echo ""
echo "⚙️  Configurando PM2 como serviço..."

pm2 startup systemd -u $APP_USER --hp /var/www

echo "✅ PM2 configurado como serviço"

# 6. Criar script de deploy no servidor
echo ""
echo "📝 Criando script de deploy..."

cat > $APP_PATH/deploy-local.sh << 'DEPLOY_SCRIPT'
#!/bin/bash
# Script de deploy local (executa NO servidor)

set -e

APP_PATH="/var/www/academia"
cd $APP_PATH

echo "🚀 Iniciando deploy local..."

# 1. Backup do .env
if [ -f .env ]; then
  cp .env .env.backup
fi

# 2. Instalar dependências
echo "📦 Instalando dependências..."
npm ci --production --silent

# 3. Gerar Prisma Client
echo "🔧 Gerando Prisma Client..."
npx prisma generate

# 4. Aplicar migrations
echo "💾 Aplicando migrations..."
npx prisma db push --skip-generate

# 5. Restaurar .env
if [ -f .env.backup ]; then
  mv .env.backup .env
fi

# 6. Reiniciar aplicação
echo "🔄 Reiniciando aplicação..."
pm2 restart academia || pm2 start ecosystem.config.js --env production
pm2 save

echo "✅ Deploy concluído!"
pm2 logs academia --lines 20
DEPLOY_SCRIPT

chmod +x $APP_PATH/deploy-local.sh
chown $APP_USER:$APP_USER $APP_PATH/deploy-local.sh

echo "✅ Script de deploy criado: $APP_PATH/deploy-local.sh"

# 7. Configurar logrotate
echo ""
echo "📋 Configurando rotação de logs..."

cat > /etc/logrotate.d/academia << 'LOGROTATE'
/var/www/academia/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}

/var/log/academia/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
}
LOGROTATE

echo "✅ Logrotate configurado"

# 8. Criar script de monitoramento
echo ""
echo "📊 Criando script de monitoramento..."

cat > /usr/local/bin/academia-status << 'MONITORING'
#!/bin/bash
# Script de monitoramento rápido

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Status Academia Krav Maga"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# PM2 Status
echo "🔷 PM2 Processes:"
pm2 list

echo ""
echo "🔷 System Resources:"
free -h | grep Mem
df -h | grep -v tmpfs | grep -v udev

echo ""
echo "🔷 Recent Logs:"
pm2 logs academia --lines 10 --nostream

echo ""
echo "🔷 Uptime:"
uptime
MONITORING

chmod +x /usr/local/bin/academia-status

echo "✅ Script de monitoramento criado: academia-status"

# 9. Criar script de backup
echo ""
echo "💾 Criando script de backup..."

cat > /usr/local/bin/academia-backup << 'BACKUP_SCRIPT'
#!/bin/bash
# Backup automático

BACKUP_DIR="/var/www/academia/backups"
TIMESTAMP=$(date +%Y-%m-%d-%H%M%S)
BACKUP_PATH="$BACKUP_DIR/backup-$TIMESTAMP"

mkdir -p $BACKUP_PATH

# Backup de arquivos
cp -r /var/www/academia/.env $BACKUP_PATH/ 2>/dev/null || true
cp -r /var/www/academia/dist $BACKUP_PATH/ 2>/dev/null || true

# Backup do banco (se configurado localmente)
# pg_dump $DATABASE_URL > $BACKUP_PATH/database.sql 2>/dev/null || true

echo "✅ Backup criado: $BACKUP_PATH"

# Manter apenas últimos 7 dias
find $BACKUP_DIR -type d -name "backup-*" -mtime +7 -exec rm -rf {} \; 2>/dev/null || true
BACKUP_SCRIPT

chmod +x /usr/local/bin/academia-backup

echo "✅ Script de backup criado: academia-backup"

# 10. Configurar cron para backup diário
echo ""
echo "⏰ Configurando backup automático..."

(crontab -l 2>/dev/null || true; echo "0 3 * * * /usr/local/bin/academia-backup") | crontab -

echo "✅ Backup diário configurado (3:00 AM)"

# 11. Instalar ferramentas úteis
echo ""
echo "🔧 Instalando ferramentas úteis..."

apt-get install -y htop ncdu curl wget vim nano -qq

echo "✅ Ferramentas instaladas"

# Resumo
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ SETUP CONCLUÍDO COM SUCESSO!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 Próximos passos:"
echo ""
echo "1. Configurar .env em $APP_PATH/.env"
echo "2. Fazer o primeiro deploy do Windows:"
echo "   → PowerShell: ./deploy-remote.ps1"
echo ""
echo "🔧 Comandos úteis:"
echo "   academia-status      # Ver status completo"
echo "   academia-backup      # Fazer backup manual"
echo "   pm2 logs academia    # Ver logs em tempo real"
echo "   pm2 restart academia # Reiniciar aplicação"
echo "   pm2 monit            # Monitor visual"
echo ""
echo "📂 Diretórios:"
echo "   App: $APP_PATH"
echo "   Logs: $APP_PATH/logs"
echo "   Backups: $APP_PATH/backups"
echo ""
