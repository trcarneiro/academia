# 🚀 Guia de Deploy - Academia Krav Maga v2.0

## Visão Geral

Este guia detalha o processo completo de deployment da aplicação do ambiente Windows local para o servidor Linux remoto.

**Servidor**: `root@64.227.28.147` (Ubuntu/Debian)  
**Porta SSH**: 22  
**Caminho**: `/var/www/academia`

---

## 📋 Pré-requisitos

### No Windows (Local)

1. **Node.js 20.x** instalado
2. **Git** instalado
3. **PuTTY** instalado (para SSH/SCP)
   ```powershell
   winget install PuTTY.PuTTY
   ```
4. **WSL** (opcional, para rsync mais rápido)
   ```powershell
   wsl --install
   ```

### No Servidor Linux (Remoto)

- Ubuntu/Debian atualizado
- Acesso root via SSH
- Portas abertas: 22, 3000, 3001

---

## 🔧 Setup Inicial do Servidor (UMA VEZ)

### Passo 1: Conectar via SSH

```powershell
# Do Windows, use PuTTY ou:
ssh root@64.227.28.147 -p 22
```

### Passo 2: Enviar script de setup

```powershell
# Do Windows
pscp -P 22 setup-server.sh root@64.227.28.147:/root/
```

### Passo 3: Executar setup no servidor

```bash
# No servidor Linux
cd /root
chmod +x setup-server.sh
sudo bash setup-server.sh
```

**O que o script faz**:
- ✅ Instala Node.js 20.x, PM2, Git
- ✅ Cria estrutura de diretórios `/var/www/academia`
- ✅ Configura firewall (portas 22, 3000, 3001, 80, 443)
- ✅ Configura PM2 como serviço systemd
- ✅ Cria scripts auxiliares (deploy-local.sh, backup, monitoramento)
- ✅ Configura logrotate para rotação de logs
- ✅ Configura backup diário automático (3:00 AM)

### Passo 4: Configurar .env no servidor

```bash
# No servidor
cd /var/www/academia
nano .env
```

**Copie o conteúdo do .env local**, ajustando:

```env
# IMPORTANTE: Mudar para produção
NODE_ENV="production"

# Porta do servidor
PORT=3000

# CORS - adicionar domínio público
CORS_ORIGIN="http://64.227.28.147,http://seu-dominio.com"

# Banco de dados (usar DIRECT_URL em produção)
DATABASE_URL="postgresql://postgres:senha@host:5432/postgres"
DIRECT_URL="postgresql://postgres:senha@host:5432/postgres"

# JWT Secret - GERAR NOVO EM PRODUÇÃO
JWT_SECRET="GERAR-UM-SEGREDO-FORTE-AQUI-256-BITS"

# APIs (mesmas chaves ou novas)
GEMINI_API_KEY="..."
ASAAS_API_KEY="..."
```

**Gerar JWT Secret seguro**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Passo 5: Instalar Nginx (opcional mas recomendado)

```bash
# No servidor
sudo apt-get install nginx -y

# Copiar configuração
sudo cp /var/www/academia/nginx-academia.conf /etc/nginx/sites-available/academia

# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/academia /etc/nginx/sites-enabled/

# Remover site padrão
sudo rm /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
sudo systemctl enable nginx
```

---

## 🚀 Deploy Automatizado (Sempre)

### Opção 1: Script PowerShell (Recomendado)

```powershell
# Do Windows, no diretório do projeto
./deploy-remote.ps1
```

**Flags disponíveis**:
```powershell
# Pular build local
./deploy-remote.ps1 -SkipBuild

# Pular testes
./deploy-remote.ps1 -SkipTests

# Modo dry-run (não executa, apenas mostra o que faria)
./deploy-remote.ps1 -DryRun

# Combinação
./deploy-remote.ps1 -SkipTests -DryRun
```

**O que o script faz**:
1. ✅ Carrega configurações do .env
2. ✅ Compila aplicação localmente (`npm run build`)
3. ✅ Executa testes (`npm run test`)
4. ✅ Verifica conexão SSH
5. ✅ Cria backup no servidor
6. ✅ Sincroniza arquivos (via rsync ou pscp)
7. ✅ Instala dependências no servidor (`npm ci`)
8. ✅ Gera Prisma Client
9. ✅ Aplica migrations
10. ✅ Reinicia aplicação via PM2
11. ✅ Verifica health check
12. ✅ Mostra logs recentes

### Opção 2: Deploy Manual

```powershell
# 1. Build local
npm run build

# 2. Upload de arquivos
pscp -r -P 22 dist public prisma package.json .env root@64.227.28.147:/var/www/academia/

# 3. Conectar via SSH
ssh root@64.227.28.147 -p 22

# 4. No servidor, executar:
cd /var/www/academia
bash deploy-local.sh
```

---

## 📊 Monitoramento e Manutenção

### Comandos Úteis no Servidor

```bash
# Status completo (script customizado)
academia-status

# PM2 - Gerenciamento
pm2 list                    # Listar processos
pm2 logs academia           # Ver logs em tempo real
pm2 logs academia --lines 50  # Últimas 50 linhas
pm2 restart academia        # Reiniciar app
pm2 stop academia           # Parar app
pm2 start academia          # Iniciar app
pm2 monit                   # Monitor visual interativo

# Logs
tail -f /var/www/academia/logs/pm2-out.log   # Log de saída
tail -f /var/www/academia/logs/pm2-error.log # Log de erros

# Backup manual
academia-backup

# Nginx
sudo systemctl status nginx
sudo systemctl restart nginx
sudo nginx -t  # Testar configuração
```

### Health Check

```bash
# No servidor
curl http://localhost:3000/health

# Do Windows
curl http://64.227.28.147:3000/health
```

**Resposta esperada**:
```json
{
  "status": "ok",
  "timestamp": "2025-11-24T...",
  "uptime": 12345,
  "database": "connected"
}
```

### Verificar Logs de Erro

```bash
# Últimos erros
pm2 logs academia --err --lines 50

# Logs do Nginx
sudo tail -f /var/log/nginx/academia-error.log

# Logs do sistema
journalctl -u academia -f
```

---

## 🔄 Rollback (Reverter Deploy)

Se algo der errado após o deploy:

```bash
# No servidor
cd /var/www/academia

# 1. Listar backups disponíveis
ls -lh backups/

# 2. Identificar último backup
# Exemplo: backups/backup-2025-11-24-143022/

# 3. Restaurar .env
cp backups/backup-2025-11-24-143022/.env .env

# 4. Restaurar dist/
rm -rf dist
cp -r backups/backup-2025-11-24-143022/dist dist/

# 5. Reiniciar aplicação
pm2 restart academia

# 6. Verificar logs
pm2 logs academia --lines 30
```

---

## 🛡️ Segurança

### SSL/HTTPS (Recomendado para Produção)

```bash
# No servidor
sudo apt-get install certbot python3-certbot-nginx -y

# Obter certificado (substitua seu-dominio.com)
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# Renovação automática (já configurado)
sudo certbot renew --dry-run
```

**Depois de obter SSL**:
1. Editar `/etc/nginx/sites-available/academia`
2. Descomentar linhas SSL (linhas 20-26)
3. Recarregar Nginx: `sudo systemctl reload nginx`

### Firewall (UFW)

```bash
# Verificar status
sudo ufw status

# Permitir apenas portas necessárias
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS

# Bloquear acesso direto às portas Node.js
# (usar apenas via Nginx)
sudo ufw deny 3000/tcp
sudo ufw deny 3001/tcp
```

### Limitar Acesso SSH

Editar `/etc/ssh/sshd_config`:

```bash
# Desabilitar login root (após criar usuário normal)
PermitRootLogin no

# Usar apenas chave SSH (mais seguro)
PasswordAuthentication no

# Reiniciar SSH
sudo systemctl restart sshd
```

---

## 🐛 Troubleshooting

### Problema: Aplicação não inicia

```bash
# Verificar logs de erro
pm2 logs academia --err

# Verificar se porta está em uso
sudo lsof -i :3000

# Reiniciar PM2 completamente
pm2 delete all
pm2 start ecosystem.config.js --env production
```

### Problema: Erro de conexão com banco

```bash
# Verificar .env
cat .env | grep DATABASE_URL

# Testar conexão
cd /var/www/academia
npx prisma db pull  # Deve conectar sem erro
```

### Problema: Permissões negadas

```bash
# Corrigir permissões
sudo chown -R www-data:www-data /var/www/academia
sudo chmod -R 755 /var/www/academia
```

### Problema: Nginx retorna 502 Bad Gateway

```bash
# Verificar se Node.js está rodando
pm2 status

# Verificar logs do Nginx
sudo tail -f /var/log/nginx/academia-error.log

# Testar se backend responde
curl http://localhost:3000/health

# Reiniciar tudo
pm2 restart academia
sudo systemctl restart nginx
```

### Problema: Deploy PowerShell falha

```powershell
# Verificar conectividade SSH
plink -batch -P 22 root@64.227.28.147 "echo Conexao OK"

# Verificar se PuTTY está instalado
Get-Command plink, pscp

# Tentar deploy manual
# (Ver "Opção 2: Deploy Manual" acima)
```

---

## 📈 Performance

### PM2 Cluster Mode (para múltiplos cores)

Editar `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'academia',
    script: './dist/server.js',
    instances: 2,  // Ou 'max' para usar todos os cores
    exec_mode: 'cluster',
    // ... resto da config
  }]
}
```

Aplicar:
```bash
pm2 reload ecosystem.config.js
```

### Monitoramento de Recursos

```bash
# CPU e RAM em tempo real
htop

# Uso de disco
df -h
ncdu /var/www/academia

# PM2 monitor
pm2 monit
```

---

## 🔗 URLs Importantes

- **API**: http://64.227.28.147:3000
- **Swagger Docs**: http://64.227.28.147:3000/docs
- **Health Check**: http://64.227.28.147:3000/health
- **Kiosk**: http://64.227.28.147:3001

---

## 📞 Checklist de Deploy

Antes de cada deploy, verifique:

- [ ] Código commitado no Git (`git status`)
- [ ] Build local passa (`npm run build`)
- [ ] Testes passam (`npm run test`)
- [ ] Linting OK (`npm run lint`)
- [ ] .env configurado no servidor
- [ ] Backup recente disponível
- [ ] Horário de baixo tráfego (se possível)

Após deploy:

- [ ] Health check responde OK
- [ ] Logs sem erros críticos (`pm2 logs`)
- [ ] Login funciona
- [ ] Páginas principais carregam
- [ ] API responde corretamente

---

## 📚 Recursos Adicionais

- **PM2 Docs**: https://pm2.keymetrics.io/
- **Nginx Docs**: https://nginx.org/en/docs/
- **Prisma Docs**: https://www.prisma.io/docs/
- **Let's Encrypt**: https://letsencrypt.org/

---

**Última atualização**: 24 de novembro de 2025  
**Versão**: 2.0.0
