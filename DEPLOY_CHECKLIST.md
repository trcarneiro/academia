# ✅ Checklist de Deploy - Academia Krav Maga v2.0
**Servidor**: 64.227.28.147  
**Data**: ___/___/_____  
**Responsável**: _________________

---

## 📦 PARTE 1: Preparação do Servidor (Setup Inicial - UMA VEZ)

### 1.1 Acesso ao Servidor
- [ ] Consegui acessar via SSH: `ssh root@64.227.28.147`
- [ ] Anotei as credenciais:
  - [ ] MySQL root password: `sudo cat .db_password`
  - [ ] OpenLiteSpeed admin: `sudo cat /root/.litespeed_password`

### 1.2 Instalação de Dependências
- [ ] Node.js 20 instalado
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
  node -v  # Deve mostrar v20.x.x
  ```

- [ ] PM2 instalado globalmente
  ```bash
  sudo npm install -g pm2
  pm2 --version
  ```

- [ ] Git instalado
  ```bash
  sudo apt-get install -y git
  git --version
  ```

### 1.3 Configuração do Diretório
- [ ] Diretório criado: `/var/www/academia`
  ```bash
  sudo mkdir -p /var/www/academia
  sudo chown -R $USER:$USER /var/www/academia
  cd /var/www/academia
  ```

- [ ] Repositório clonado
  ```bash
  git clone https://github.com/trcarneiro/academia.git .
  # OU
  git clone git@github.com:trcarneiro/academia.git .
  ```

### 1.4 Configuração do .env
- [ ] Arquivo `.env` criado (copiar de `.env.production`)
  ```bash
  cp .env.production .env
  nano .env
  ```

- [ ] **JWT_SECRET gerado** (CRÍTICO!)
  ```bash
  openssl rand -base64 64
  # Copiar output e colar no .env como JWT_SECRET
  ```

- [ ] Variáveis ajustadas:
  - [ ] `NODE_ENV="production"`
  - [ ] `PORT=3001`
  - [ ] `HOST="0.0.0.0"`
  - [ ] `CORS_ORIGIN` com domínios públicos
  - [ ] `JWT_SECRET` com valor gerado
  - [ ] `DATABASE_URL` verificada (Supabase)
  - [ ] `ASAAS_API_KEY` de produção confirmada

### 1.5 Build Inicial
- [ ] Dependências instaladas
  ```bash
  npm install --production=false
  ```

- [ ] Prisma Client gerado
  ```bash
  npx prisma generate
  ```

- [ ] TypeScript compilado
  ```bash
  npm run build
  ```

- [ ] Diretório `dist/` foi gerado
  ```bash
  ls -la dist/
  ```

### 1.6 PM2 Setup
- [ ] Script de deploy executável
  ```bash
  chmod +x deploy.sh
  ```

- [ ] Aplicação iniciada com PM2
  ```bash
  pm2 start ecosystem.config.js --env production
  pm2 status
  ```

- [ ] PM2 salvo
  ```bash
  pm2 save
  ```

- [ ] PM2 startup configurado
  ```bash
  pm2 startup systemd
  # Executar comando retornado
  ```

### 1.7 Verificação Final
- [ ] Aplicação está "online" no PM2
  ```bash
  pm2 status
  ```

- [ ] Logs não mostram erros
  ```bash
  pm2 logs academia --lines 50
  ```

- [ ] Health check responde
  ```bash
  curl http://localhost:3001/api/health
  # Deve retornar: {"status":"ok"}
  ```

- [ ] API acessível externamente
  ```
  Abrir no navegador: http://64.227.28.147:3001/docs
  ```

---

## 🔄 PARTE 2: Deploy de Atualização (Uso Diário)

### 2.1 Pré-Deploy (Local)
- [ ] Branch `main` atualizado localmente
  ```bash
  git checkout main
  git pull origin main
  ```

- [ ] Testes passando
  ```bash
  npm run test
  npm run lint
  npm run build
  ```

- [ ] Commit e push realizados
  ```bash
  git add .
  git commit -m "feat: descrição da mudança"
  git push origin main
  ```

### 2.2 Deploy no Servidor

#### Opção A: Script Automático (RECOMENDADO)
- [ ] Conectado no servidor
  ```bash
  ssh root@64.227.28.147
  ```

- [ ] Script executado
  ```bash
  cd /var/www/academia
  ./deploy.sh
  ```

- [ ] Deploy concluído sem erros
  - [ ] ✅ Código atualizado
  - [ ] ✅ Dependências instaladas
  - [ ] ✅ Prisma gerado
  - [ ] ✅ Build compilado
  - [ ] ✅ PM2 reiniciado
  - [ ] ✅ Health check respondendo

#### Opção B: Manual (Passo a Passo)
- [ ] Backup do .env
  ```bash
  cp .env .env.backup
  ```

- [ ] Pull do Git
  ```bash
  git pull origin main
  ```

- [ ] .env restaurado
  ```bash
  mv .env.backup .env
  ```

- [ ] Dependências atualizadas
  ```bash
  npm ci --production=false
  ```

- [ ] Prisma regenerado
  ```bash
  npx prisma generate
  ```

- [ ] Build executado
  ```bash
  npm run build
  ```

- [ ] PM2 reiniciado
  ```bash
  pm2 restart academia --update-env
  ```

### 2.3 Validação Pós-Deploy
- [ ] PM2 status = "online"
  ```bash
  pm2 status
  ```

- [ ] Logs sem erros
  ```bash
  pm2 logs academia --lines 20
  ```

- [ ] Health check OK
  ```bash
  curl http://localhost:3001/api/health
  ```

- [ ] API externa acessível
  ```
  http://64.227.28.147:3001/docs
  ```

- [ ] Funcionalidades principais testadas:
  - [ ] Login funciona
  - [ ] Listagem de dados funciona
  - [ ] CRUD básico funciona

---

## 🎣 PARTE 3: Webhook Automático (OPCIONAL)

### 3.1 Instalação
- [ ] Dependência instalada
  ```bash
  sudo npm install -g github-webhook-handler
  ```

- [ ] Secret gerado
  ```bash
  openssl rand -hex 32
  # Anotar o valor gerado
  ```

- [ ] Secret adicionado no .env
  ```env
  WEBHOOK_SECRET="[valor_gerado]"
  ```

- [ ] Webhook listener iniciado
  ```bash
  cd /var/www/academia
  pm2 start webhook-server.js --name webhook
  pm2 save
  ```

- [ ] Porta aberta no firewall
  ```bash
  sudo ufw allow 7777/tcp
  sudo ufw reload
  ```

### 3.2 Configuração no GitHub
- [ ] Acessei Settings > Webhooks do repositório
- [ ] Webhook criado com:
  - [ ] Payload URL: `http://64.227.28.147:7777/webhook`
  - [ ] Content type: `application/json`
  - [ ] Secret: (mesmo valor do .env)
  - [ ] Events: `Just the push event`
  - [ ] Active: ✅

- [ ] Webhook testado (ping)
  ```bash
  pm2 logs webhook
  # Deve mostrar: "🏓 Ping recebido do GitHub!"
  ```

### 3.3 Teste de Deploy Automático
- [ ] Push simples no branch main
  ```bash
  # No local
  git commit --allow-empty -m "test: webhook deploy"
  git push origin main
  ```

- [ ] Logs do webhook mostram deploy
  ```bash
  pm2 logs webhook
  # Deve mostrar: "🚀 Iniciando deploy automático..."
  ```

- [ ] Deploy executado com sucesso

---

## 🛡️ PARTE 4: Segurança (CRÍTICO)

### 4.1 Senhas Fortes
- [ ] JWT_SECRET gerado (64 caracteres)
- [ ] WEBHOOK_SECRET gerado (se usar webhook)
- [ ] MySQL root password atualizado
  ```bash
  openssl rand -base64 32
  # Atualizar no MySQL e em .db_password
  ```

### 4.2 Firewall
- [ ] UFW ativo
  ```bash
  sudo ufw status
  ```

- [ ] Portas corretas abertas:
  - [ ] 22 (SSH)
  - [ ] 80 (HTTP)
  - [ ] 443 (HTTPS)
  - [ ] 3001 (API) - se acesso direto necessário
  - [ ] 7777 (Webhook) - se usar webhook

### 4.3 Rate Limiting
- [ ] Configurado no .env
  ```env
  RATE_LIMIT_MAX=50
  RATE_LIMIT_WINDOW="15m"
  ```

### 4.4 Backups
- [ ] Backup do .env criado
  ```bash
  cp .env .env.backup
  ```

- [ ] Backup do banco (Supabase tem automático)
- [ ] Cronograma de backups definido

---

## 📊 PARTE 5: Monitoramento (Pós-Deploy)

### 5.1 PM2 Dashboard
- [ ] Monitoramento ativo
  ```bash
  pm2 monit
  ```

- [ ] Logs sendo gerados
  ```bash
  ls -lh logs/
  ```

### 5.2 Métricas
- [ ] CPU usage < 70%
- [ ] RAM usage < 80%
- [ ] Uptime > 99%
- [ ] Restart count = 0 (ou baixo)

### 5.3 Alertas
- [ ] Notificação configurada (email/Slack) - se disponível
- [ ] Health check endpoint monitorado - se disponível

---

## 🆘 TROUBLESHOOTING

### Se aplicação não iniciar:
```bash
# Ver logs de erro
pm2 logs academia --err

# Verificar porta em uso
sudo lsof -i :3001

# Reiniciar forçado
pm2 kill
pm2 start ecosystem.config.js --env production
```

### Se build falhar:
```bash
# Limpar e rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Se Git falhar:
```bash
# Ver status
git status

# Resetar (CUIDADO!)
git reset --hard origin/main
```

### Se banco não conectar:
```bash
# Testar conexão
npx prisma db pull

# Ver logs do Prisma
npx prisma studio
```

---

## ✅ APROVAÇÃO FINAL

- [ ] **Aplicação acessível**: http://64.227.28.147:3001
- [ ] **Swagger funcionando**: http://64.227.28.147:3001/docs
- [ ] **Health check OK**: http://64.227.28.147:3001/api/health
- [ ] **PM2 status**: online e estável
- [ ] **Logs**: sem erros críticos
- [ ] **Performance**: CPU/RAM dentro dos limites
- [ ] **Segurança**: JWT_SECRET gerado, senhas atualizadas
- [ ] **Backup**: .env backup criado
- [ ] **Documentação**: equipe treinada

---

**Assinaturas**:

Deploy realizado por: ___________________ Data: ___/___/_____

Aprovado por: ___________________ Data: ___/___/_____

---

## 📚 Documentação de Referência

- **Guia Rápido**: `DEPLOY_QUICK_START.md`
- **Guia Completo**: `DEPLOYMENT_GUIDE.md`
- **Comandos PM2**: `pm2 --help`
- **Logs**: `/var/www/academia/logs/`

---

**Versão**: 1.0  
**Última Atualização**: 1 de novembro de 2025
