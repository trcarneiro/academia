# 🚀 Quick Deploy - Academia Krav Maga

## Setup Inicial (Uma vez)

### 1. No Servidor Linux

```bash
# Enviar script de setup
pscp -P 22 setup-server.sh root@64.227.28.147:/root/

# Conectar via SSH
ssh root@64.227.28.147 -p 22

# Executar setup
cd /root
chmod +x setup-server.sh
sudo bash setup-server.sh

# Configurar .env
cd /var/www/academia
nano .env
# (Copiar conteúdo do .env local)
```

### 2. Instalar PuTTY no Windows

```powershell
winget install PuTTY.PuTTY
```

## Deploy Rápido

```powershell
# Deploy completo
npm run deploy

# Deploy sem testes
npm run deploy:skip-tests

# Dry-run (apenas simula)
npm run deploy:dry
```

## Comandos Úteis no Servidor

```bash
# Status da aplicação
academia-status

# Logs em tempo real
pm2 logs academia

# Reiniciar
pm2 restart academia

# Backup manual
academia-backup
```

## URLs

- **API**: http://64.227.28.147:3000
- **Docs**: http://64.227.28.147:3000/docs
- **Health**: http://64.227.28.147:3000/health
- **Kiosk**: http://64.227.28.147:3001

## Documentação Completa

Ver: [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md)
