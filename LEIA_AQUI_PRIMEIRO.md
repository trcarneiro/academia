# 🚀 Como Subir a Academia para o Servidor - Guia Simplificado

**Servidor**: 64.227.28.147 (DigitalOcean)  
**Tempo Total**: ~30 minutos (primeira vez) / ~2 minutos (atualizações)

---

## 🎯 Resumão: O que você precisa saber

### 1. **Sim, dá pra instalar o Git e manter atualizado!**
✅ O fluxo ideal é:
```
Local (seu PC) → GitHub (main) → Servidor (deploy automático)
```

### 2. **Como funciona:**
- Você desenvolve local no branch `develop` ou `feature/xyz`
- Testa tudo (`npm run dev`, `npm test`)
- Faz merge para `main` no GitHub
- No servidor, roda `./deploy.sh` (ou automático via webhook)
- Pronto! App atualizado em 2 minutos

### 3. **Já criei tudo pra você:**
- ✅ Script de deploy automático (`deploy.sh`)
- ✅ Configuração PM2 (gerenciador de processo)
- ✅ Webhook para deploy automático (opcional)
- ✅ 4 guias de documentação completos

---

## ⚡ Setup Rápido (COPIAR E COLAR)

### PASSO 1: Conectar no servidor
```bash
ssh root@64.227.28.147
```

### PASSO 2: Rodar script de setup (COPIAR TUDO)
```bash
# Baixar e executar setup automático
curl -fsSL https://raw.githubusercontent.com/trcarneiro/academia/main/server-setup.sh | bash

# OU se preferir fazer manual (ver DEPLOY_QUICK_START.md)
```

**⚠️ O script vai:**
1. Instalar Node.js 18 LTS + PM2 + Git (~3 min)
2. Clonar seu repositório (~1 min)
3. Configurar .env (JWT_SECRET auto-gerado)
4. Build da aplicação (~2 min)
5. Iniciar com PM2
6. Validar que está funcionando

**Nota**: Node.js 18 LTS é usado por compatibilidade com Ubuntu 18.04+

### PASSO 3: Configurar PM2 para iniciar no boot
```bash
# Vai retornar um comando, copie e execute
pm2 startup systemd

# Exemplo de comando retornado (NÃO COPIE ISSO, USE O SEU):
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root
```

### PASSO 4: Testar se está funcionando
```bash
# Ver status
pm2 status

# Ver logs
pm2 logs academia

# Testar API
curl http://localhost:3001/api/health
```

**Abrir no navegador:**
- API: http://64.227.28.147:3001
- Swagger Docs: http://64.227.28.147:3001/docs

---

## 🔄 Deploy de Atualizações (Uso Diário)

### Depois de fazer merge no GitHub:

```bash
# 1. Conectar
ssh root@64.227.28.147

# 2. Deploy (escolha um método)

# Método A: Automático (RECOMENDADO - 2 minutos)
cd /var/www/academia
./deploy.sh

# Método B: Manual (se quiser controle)
cd /var/www/academia
git pull origin main
npm install
npx prisma generate
npm run build
pm2 restart academia
```

**Pronto!** App atualizado.

---

## 🎣 Deploy 100% Automático (OPCIONAL)

Se você quiser que o deploy aconteça automaticamente quando fizer push no GitHub:

### No servidor:
```bash
# 1. Instalar dependência
sudo npm install -g github-webhook-handler

# 2. Gerar secret
openssl rand -hex 32
# Copiar o valor gerado

# 3. Adicionar no .env
nano /var/www/academia/.env
# Adicionar linha: WEBHOOK_SECRET="valor_copiado"

# 4. Iniciar webhook listener
cd /var/www/academia
pm2 start webhook-server.js --name webhook
pm2 save

# 5. Abrir porta no firewall
sudo ufw allow 7777/tcp
sudo ufw reload
```

### No GitHub:
1. Ir em **Settings > Webhooks > Add webhook**
2. Payload URL: `http://64.227.28.147:7777/webhook`
3. Content type: `application/json`
4. Secret: (mesmo valor do .env)
5. Events: **Just the push event**
6. Save

**Agora**: Push no `main` → Deploy automático no servidor! 🚀

---

## 📊 Fluxo de Trabalho Completo

```
┌─────────────────────────────────────────────────────────────┐
│ 1. DESENVOLVIMENTO LOCAL (Seu PC - Windows)                 │
│    • git checkout -b feature/nova-funcionalidade            │
│    • Codificar, testar (npm run dev)                        │
│    • git commit -m "feat: nova funcionalidade"              │
│    • git push origin feature/nova-funcionalidade            │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. GITHUB (Pull Request)                                     │
│    • Criar PR: feature/xyz → main                           │
│    • Code review (opcional)                                  │
│    • Merge para main                                         │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. SERVIDOR (64.227.28.147)                                 │
│    • Webhook detecta push (se configurado)                  │
│    • OU executar ./deploy.sh manualmente                    │
│    • Git pull, build, restart (2 minutos)                   │
│    • ✅ App atualizado e rodando!                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Comandos PM2 Mais Usados

```bash
# Ver status de todos os processos
pm2 status

# Ver logs em tempo real
pm2 logs academia

# Ver logs das últimas 50 linhas
pm2 logs academia --lines 50

# Reiniciar aplicação
pm2 restart academia

# Parar aplicação
pm2 stop academia

# Iniciar aplicação
pm2 start academia

# Monitoramento visual (CPU, RAM)
pm2 monit

# Ver informações detalhadas
pm2 show academia

# Limpar logs antigos
pm2 flush
```

---

## 🔐 Segurança: O que VOCÊ precisa fazer

### OBRIGATÓRIO:
1. **Gerar novo JWT_SECRET** (já feito pelo script, mas pode gerar manualmente)
   ```bash
   openssl rand -base64 64
   # Copiar e colar no .env como JWT_SECRET
   ```

2. **Adicionar domínios em CORS_ORIGIN** (no .env)
   ```env
   CORS_ORIGIN="http://64.227.28.147,https://seudominio.com"
   ```

3. **Atualizar senha do MySQL** (depois que resetar)
   ```bash
   # Gerar nova senha
   openssl rand -base64 32
   
   # Conectar no MySQL
   mysql -u root -p
   # Usar senha atual de: sudo cat .db_password
   
   # Atualizar senha
   ALTER USER 'root'@'localhost' IDENTIFIED BY 'NOVA_SENHA';
   FLUSH PRIVILEGES;
   EXIT;
   
   # Salvar nova senha
   echo "root_mysql_pass=\"NOVA_SENHA\"" | sudo tee .db_password
   ```

---

## 🆘 Resolvendo Problemas

### Problema: "Aplicação não inicia"
```bash
# Ver erros
pm2 logs academia --err

# Verificar se porta está em uso
sudo lsof -i :3001

# Se estiver, matar processo
sudo kill -9 PID

# Reiniciar forçado
pm2 kill
pm2 start ecosystem.config.js --env production
```

### Problema: "Build falha"
```bash
cd /var/www/academia
rm -rf node_modules dist
npm install
npm run build
```

### Problema: "Git não funciona"
```bash
cd /var/www/academia
git status
git reset --hard origin/main  # CUIDADO: apaga mudanças locais
git pull origin main
```

### Problema: "Deploy script falha"
```bash
# Ver logs detalhados
./deploy.sh 2>&1 | tee deploy.log

# Ver arquivo de log
cat deploy.log
```

---

## 📞 Arquivos de Ajuda

- **`DEPLOY_QUICK_START.md`** - Guia rápido com todos os comandos
- **`DEPLOYMENT_GUIDE.md`** - Guia super completo (516 linhas)
- **`DEPLOY_CHECKLIST.md`** - Checklist para validar (80+ itens)
- **`DEPLOY_SUMMARY.md`** - Sumário executivo
- **`server-setup.sh`** - Script de setup automático

---

## ✅ Checklist Rápido

### Setup Inicial (UMA VEZ)
- [ ] Conectei no servidor via SSH
- [ ] Rodei script de setup (`server-setup.sh`)
- [ ] PM2 startup configurado
- [ ] Aplicação rodando (PM2 status = online)
- [ ] API acessível: http://64.227.28.147:3001/docs
- [ ] JWT_SECRET gerado no .env
- [ ] CORS_ORIGIN configurado com domínios
- [ ] Senha MySQL atualizada

### Deploy de Atualização (DIÁRIO)
- [ ] Código testado localmente
- [ ] Merge para `main` feito
- [ ] Conectei no servidor
- [ ] Rodei `./deploy.sh`
- [ ] PM2 status = online
- [ ] Health check OK: curl http://localhost:3001/api/health
- [ ] App funcionando no navegador

---

## 🎉 Pronto!

**Você agora tem:**
- ✅ Aplicação rodando em produção
- ✅ Deploy automático em 2 minutos
- ✅ Webhook opcional para deploy 100% automático
- ✅ 4 guias completos de documentação
- ✅ Scripts testados e prontos

**Próximos passos (opcional):**
1. Configurar domínio próprio (academia.com)
2. Adicionar SSL com Let's Encrypt
3. Configurar webhook do GitHub
4. Adicionar monitoramento (UptimeRobot)

---

**Dúvidas?** Consulte:
- `DEPLOY_QUICK_START.md` para referência rápida
- `DEPLOYMENT_GUIDE.md` para guia completo
- `DEPLOY_CHECKLIST.md` para validação passo a passo

**Criado em**: 1 de novembro de 2025  
**Versão**: 1.0.0
