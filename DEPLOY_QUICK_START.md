# 🚀 Deploy Rápido - Academia Krav Maga v2.0

## 📋 Informações do Servidor
- **IP**: 64.227.28.147
- **Acesso SSH**: `ssh root@64.227.28.147`
- **Diretório**: `/var/www/academia`
- **Porta App**: 3001
- **Branch**: main

---

## ⚡ Setup Inicial (Fazer UMA VEZ)

### 1. Conectar no servidor
```bash
ssh root@64.227.28.147
```

### 2. Instalar dependências
```bash
# Node.js 18 LTS (Compatível Ubuntu 18.04+)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2
sudo npm install -g pm2

# Git
sudo apt-get install -y git

# Verificar instalações
node -v && npm -v && git --version && pm2 -v
```

**Nota**: Node.js 18 LTS é usado por compatibilidade com Ubuntu 18.04+.

### 3. Criar diretório e clonar repositório
```bash
# Criar diretório
sudo mkdir -p /var/www/academia
sudo chown -R $USER:$USER /var/www/academia
cd /var/www/academia

# Clonar repositório
git clone https://github.com/trcarneiro/academia.git .

# OU se já configurou SSH no GitHub
git clone git@github.com:trcarneiro/academia.git .
```

### 4. Configurar .env
```bash
# Copiar template
cp .env.example .env

# Editar variáveis (ver seção abaixo)
nano .env
```

**Variáveis OBRIGATÓRIAS para produção**:
```env
NODE_ENV="production"
PORT=3001
HOST="0.0.0.0"
CORS_ORIGIN="http://64.227.28.147,https://seudominio.com"

# ⚠️ IMPORTANTE: Gerar novo JWT_SECRET!
JWT_SECRET="[GERAR COM: openssl rand -base64 64]"

# Database (Supabase - manter as mesmas credenciais)
DATABASE_URL="postgresql://postgres.yawfuymgwukericlhgxh:Ojqemgeowt%2Aa1@aws-0-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=30&pool_timeout=20"
DIRECT_URL="postgresql://postgres.yawfuymgwukericlhgxh:Ojqemgeowt%2Aa1@aws-0-us-east-2.pooler.supabase.com:5432/postgres"

# AI (manter as mesmas)
AI_PROVIDER=GEMINI
GEMINI_API_KEY=AIzaSyBURQeVbJ0NCCEZVMNs82u9PNWbAvRWu54
```

### 5. Build e iniciar aplicação
```bash
# Instalar dependências
npm install --production=false

# Gerar Prisma Client
npx prisma generate

# Build TypeScript
npm run build

# Dar permissão de execução ao script de deploy
chmod +x deploy.sh

# Iniciar com PM2
pm2 start ecosystem.config.js --env production

# Salvar configuração
pm2 save

# Configurar para iniciar no boot
pm2 startup systemd
# ⚠️ Copiar e executar o comando retornado
```

### 6. Verificar se está rodando
```bash
# Ver status
pm2 status

# Ver logs
pm2 logs academia

# Testar API
curl http://localhost:3001/api/health
```

---

## 🔄 Deploy Atualização (Uso Diário)

### Opção A: Script Automático (RECOMENDADO)
```bash
# Conectar no servidor
ssh root@64.227.28.147

# Executar script de deploy
cd /var/www/academia
./deploy.sh
```

### Opção B: Manual (Passo a Passo)
```bash
ssh root@64.227.28.147
cd /var/www/academia

# 1. Backup .env
cp .env .env.backup

# 2. Pull do código
git pull origin main

# 3. Restaurar .env
mv .env.backup .env

# 4. Instalar dependências
npm ci --production=false

# 5. Gerar Prisma
npx prisma generate

# 6. Build
npm run build

# 7. Reiniciar
pm2 restart academia --update-env

# 8. Verificar
pm2 logs academia
```

---

## 📊 Comandos PM2 Úteis

```bash
# Ver status de todos os processos
pm2 status

# Ver logs em tempo real
pm2 logs academia

# Ver logs com limite de linhas
pm2 logs academia --lines 100

# Reiniciar aplicação
pm2 restart academia

# Parar aplicação
pm2 stop academia

# Iniciar aplicação
pm2 start academia

# Deletar do PM2
pm2 delete academia

# Monitoramento visual
pm2 monit

# Informações detalhadas
pm2 show academia

# Limpar logs
pm2 flush

# Ver uso de recursos
pm2 list
```

---

## 🔍 Troubleshooting

### Aplicação não inicia
```bash
# Ver logs de erro
pm2 logs academia --err

# Testar conexão com banco
npx prisma db pull

# Verificar porta
sudo lsof -i :3001

# Reiniciar forçado
pm2 kill
pm2 start ecosystem.config.js --env production
```

### Build falha
```bash
# Limpar e rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Git pull falha
```bash
# Ver status
git status

# Resetar mudanças locais (CUIDADO!)
git reset --hard origin/main

# Atualizar
git pull origin main
```

---

## 🌐 URLs Importantes

- **API**: http://64.227.28.147:3001
- **Swagger Docs**: http://64.227.28.147:3001/docs
- **Health Check**: http://64.227.28.147:3001/api/health
- **OpenLiteSpeed WebAdmin**: http://64.227.28.147:7080
- **phpMyAdmin**: http://64.227.28.147/phpmyadmin

---

## 🔐 Credenciais do Servidor

```bash
# Ver senha do MySQL root
sudo cat .db_password

# Ver senha do OpenLiteSpeed WebAdmin
sudo cat /root/.litespeed_password

# Ver senha WordPress (se necessário)
# Está no banco de dados MySQL
```

---

## 📝 Workflow Recomendado

```
┌─────────────────┐
│  LOCAL (Dev)    │
└────────┬────────┘
         │ git push origin main
         ▼
┌─────────────────┐
│  GitHub (main)  │
└────────┬────────┘
         │ (manual) ssh + ./deploy.sh
         │ (auto) webhook trigger
         ▼
┌─────────────────┐
│  Servidor Prod  │
│  PM2 restart    │
└─────────────────┘
```

### Desenvolvimento Local → Produção
1. **Local**: Desenvolver no branch `develop` ou `feature/xyz`
2. **Local**: Testar tudo (`npm run dev`, `npm test`, `npm run lint`)
3. **Local**: Commit e push: `git push origin feature/xyz`
4. **GitHub**: Criar Pull Request de `feature/xyz` → `main`
5. **GitHub**: Revisar código e aprovar merge
6. **Servidor**: Executar `./deploy.sh` (automático ou manual)

---

## ⚙️ Configuração de Webhook (Opcional)

Para deploy automático ao fazer push no GitHub:

### 1. Instalar dependência
```bash
sudo npm install -g github-webhook-handler
```

### 2. Iniciar webhook listener
```bash
cd /var/www/academia
pm2 start webhook-server.js --name webhook
pm2 save
```

### 3. Configurar no GitHub
1. Ir em **Settings > Webhooks > Add webhook**
2. Payload URL: `http://64.227.28.147:7777/webhook`
3. Content type: `application/json`
4. Secret: gerar com `openssl rand -hex 32` e adicionar no `.env` como `WEBHOOK_SECRET`
5. Events: **Just the push event**
6. Save

### 4. Abrir porta no firewall
```bash
sudo ufw allow 7777/tcp
sudo ufw reload
```

---

## 🛡️ Segurança

### Gerar JWT Secret Forte
```bash
openssl rand -base64 64
# Copiar output e adicionar no .env como JWT_SECRET
```

### Atualizar Senha MySQL
```bash
# Gerar nova senha
openssl rand -base64 32

# Atualizar no MySQL
mysql -u root -p
ALTER USER 'root'@'localhost' IDENTIFIED BY 'NOVA_SENHA';
FLUSH PRIVILEGES;
EXIT;

# Salvar em arquivo
echo "root_mysql_pass=\"NOVA_SENHA\"" | sudo tee .db_password
```

### Rate Limiting (já configurado)
```env
RATE_LIMIT_MAX=50        # Máximo de requests
RATE_LIMIT_WINDOW="15m"  # Janela de tempo
```

---

## 📖 Documentação Completa

Ver arquivo `DEPLOYMENT_GUIDE.md` para documentação detalhada.

---

**Versão**: 1.0  
**Data**: 1 de novembro de 2025
