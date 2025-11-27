# 📦 Sistema de Deploy - Academia Krav Maga v2.0

## Arquivos Criados

### Scripts de Deploy
- ✅ **deploy-remote.ps1** - Script PowerShell para deploy do Windows para Linux
- ✅ **setup-server.sh** - Script bash para setup inicial do servidor Linux
- ✅ **ecosystem.config.js** - Configuração PM2 atualizada para produção

### Configurações
- ✅ **nginx-academia.conf** - Configuração Nginx (reverse proxy)
- ✅ **.env** - Variáveis de ambiente (já existente, com configurações SSH)

### Documentação
- ✅ **DEPLOY_GUIDE.md** - Guia completo de deployment
- ✅ **DEPLOY_QUICK.md** - Guia rápido para deploy
- ✅ **SUMMARY_DEPLOY.md** - Este arquivo

### Scripts Adicionados ao package.json
```json
{
  "deploy": "npm run deploy automatizado",
  "deploy:skip-tests": "deploy sem executar testes",
  "deploy:dry": "simular deploy sem executar"
}
```

---

## 🚀 Como Usar

### 1️⃣ Setup Inicial (PRIMEIRA VEZ)

#### No Windows:

```powershell
# 1. Instalar PuTTY
winget install PuTTY.PuTTY

# 2. Enviar script de setup para servidor
pscp -P 22 setup-server.sh root@64.227.28.147:/root/
```

#### No Servidor Linux:

```bash
# 3. Conectar via SSH
ssh root@64.227.28.147 -p 22

# 4. Executar setup
cd /root
chmod +x setup-server.sh
sudo bash setup-server.sh
# (Aguarde 2-5 minutos)

# 5. Configurar .env
cd /var/www/academia
nano .env
# Copie o conteúdo do .env local e ajuste:
# - NODE_ENV="production"
# - Gere novo JWT_SECRET
# - Verifique DATABASE_URL
```

#### Opcional - Instalar Nginx:

```bash
# No servidor
sudo apt-get install nginx -y
sudo cp /var/www/academia/nginx-academia.conf /etc/nginx/sites-available/academia
sudo ln -s /etc/nginx/sites-available/academia /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl enable nginx
```

---

### 2️⃣ Deploy (SEMPRE QUE ATUALIZAR)

#### No Windows:

```powershell
# Deploy completo (recomendado)
npm run deploy

# Ou usando o script diretamente
./deploy-remote.ps1
```

**Flags disponíveis:**
```powershell
# Pular testes (mais rápido)
npm run deploy:skip-tests

# Modo simulação (não executa)
npm run deploy:dry

# Pular build local
./deploy-remote.ps1 -SkipBuild
```

---

## 📊 Monitoramento

### No Servidor:

```bash
# Status completo
academia-status

# Logs em tempo real
pm2 logs academia

# Monitor visual
pm2 monit

# Reiniciar aplicação
pm2 restart academia

# Backup manual
academia-backup
```

### Health Check:

```bash
# No servidor
curl http://localhost:3000/health

# Do Windows
curl http://64.227.28.147:3000/health
```

---

## 🔧 Estrutura no Servidor

```
/var/www/academia/
├── dist/                    # Código compilado
├── public/                  # Frontend
├── prisma/                  # Schema do banco
├── node_modules/            # Dependências
├── logs/                    # Logs PM2
├── backups/                 # Backups automáticos
├── .env                     # Variáveis de ambiente
├── ecosystem.config.js      # Configuração PM2
└── deploy-local.sh          # Script de deploy local
```

---

## 🎯 O Que Acontece no Deploy

1. **Local (Windows)**:
   - ✅ Compila TypeScript → JavaScript (`npm run build`)
   - ✅ Executa testes (`npm run test`)
   - ✅ Verifica conexão SSH

2. **Servidor (Linux)**:
   - ✅ Cria backup da versão atual
   - ✅ Recebe novos arquivos (dist/, public/, prisma/, package.json)
   - ✅ Instala dependências (`npm ci`)
   - ✅ Gera Prisma Client
   - ✅ Aplica migrations do banco
   - ✅ Reinicia aplicação via PM2

3. **Verificação**:
   - ✅ Health check
   - ✅ Exibe logs recentes
   - ✅ Confirma sucesso

**Tempo médio**: 2-3 minutos

---

## 🛡️ Segurança

### Firewall (Configurado automaticamente):
- ✅ Porta 22 (SSH)
- ✅ Porta 3000 (API)
- ✅ Porta 3001 (Kiosk)
- ✅ Porta 80 (HTTP)
- ✅ Porta 443 (HTTPS)

### Recomendações Adicionais:

1. **SSL/HTTPS** (Importante!):
   ```bash
   # No servidor
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d seu-dominio.com
   ```

2. **JWT Secret em Produção**:
   ```bash
   # Gerar segredo forte
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **Backup do Banco**:
   ```bash
   # Adicionar ao cron (diário às 3AM)
   0 3 * * * pg_dump $DATABASE_URL > /backups/db-$(date +\%Y\%m\%d).sql
   ```

---

## 🚨 Troubleshooting

### Problema: Deploy falha na conexão SSH
```powershell
# Testar conexão
plink -batch -P 22 root@64.227.28.147 "echo OK"

# Verificar se PuTTY está instalado
Get-Command plink, pscp
```

### Problema: Aplicação não inicia
```bash
# No servidor
pm2 logs academia --err
pm2 restart academia
```

### Problema: Erro no banco de dados
```bash
# Verificar .env
cat /var/www/academia/.env | grep DATABASE_URL

# Testar conexão
cd /var/www/academia
npx prisma db pull
```

### Problema: Nginx 502 Bad Gateway
```bash
# Verificar se app está rodando
pm2 status

# Testar backend diretamente
curl http://localhost:3000/health

# Reiniciar tudo
pm2 restart academia
sudo systemctl restart nginx
```

---

## 📞 Suporte

### Logs Importantes:

```bash
# Logs da aplicação
pm2 logs academia
tail -f /var/www/academia/logs/pm2-error.log

# Logs do Nginx
sudo tail -f /var/log/nginx/academia-error.log

# Logs do sistema
journalctl -u academia -f
```

### Comandos PM2:

```bash
pm2 list            # Listar processos
pm2 describe academia  # Detalhes do processo
pm2 restart academia   # Reiniciar
pm2 reload academia    # Reload sem downtime
pm2 stop academia      # Parar
pm2 delete academia    # Remover
pm2 save              # Salvar configuração
```

---

## 🔗 URLs do Sistema

- **API**: http://64.227.28.147:3000
- **Swagger Docs**: http://64.227.28.147:3000/docs
- **Health Check**: http://64.227.28.147:3000/health
- **Kiosk**: http://64.227.28.147:3001

---

## 📚 Documentação

- **Guia Completo**: [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md)
- **Guia Rápido**: [DEPLOY_QUICK.md](./DEPLOY_QUICK.md)
- **Arquitetura**: [AGENTS.md](./AGENTS.md)
- **README**: [README-DEPLOY.md](./README-DEPLOY.md)

---

## ✅ Checklist de Deploy

### Antes do Deploy:
- [ ] Código commitado no Git
- [ ] Build local passa (`npm run build`)
- [ ] Testes passam (`npm run test`)
- [ ] .env configurado no servidor
- [ ] Backup recente disponível

### Após Deploy:
- [ ] Health check OK
- [ ] Logs sem erros
- [ ] Login funciona
- [ ] Páginas carregam
- [ ] API responde

---

**Data**: 24 de novembro de 2025  
**Versão**: 2.0.0  
**Status**: ✅ Sistema Completo e Pronto para Deploy
