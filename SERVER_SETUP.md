# 🚀 Setup do Servidor Linux - Academia Krav Maga

Guia rápido para configurar a aplicação em um servidor Linux (DigitalOcean, AWS, etc).

## 📋 Pré-requisitos

- ✅ Node.js 18.x ou superior
- ✅ PostgreSQL 14+
- ✅ Git
- ✅ npm ou yarn

---

## ⚡ Setup Rápido (3 minutos)

### Opção 1: Script Automatizado (Recomendado)

```bash
# No servidor, dentro do diretório /var/www/academia
chmod +x quick-start-server.sh
./quick-start-server.sh
```

### Opção 2: Manual

```bash
# 1. Instalar dependências
npm install

# 2. Gerar Prisma Client
npx prisma generate

# 3. Compilar TypeScript
npm run build

# 4. Configurar .env (ver próxima seção)
cp .env.server-example .env
nano .env

# 5. Rodar migrations
npx prisma migrate deploy

# 6. Iniciar servidor
npm start
```

---

## 🔧 Configuração do Ambiente (.env)

### Criar arquivo .env

```bash
nano .env
```

### Variáveis OBRIGATÓRIAS

```bash
# Banco de Dados
DATABASE_URL="postgresql://usuario:senha@localhost:5432/academia_db"

# Segurança
JWT_SECRET="gere_com_openssl_rand_base64_32"

# Servidor
NODE_ENV=production
PORT=3000
```

### Gerar JWT_SECRET seguro

```bash
openssl rand -base64 32
```

---

## 🗄️ Configurar PostgreSQL

### 1. Instalar PostgreSQL (se necessário)

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

### 2. Criar banco de dados

```bash
# Acessar PostgreSQL
sudo -u postgres psql

# Criar usuário e banco
CREATE USER academia WITH PASSWORD 'senha_segura';
CREATE DATABASE academia_db OWNER academia;
GRANT ALL PRIVILEGES ON DATABASE academia_db TO academia;
\q
```

### 3. Atualizar DATABASE_URL no .env

```bash
DATABASE_URL="postgresql://academia:senha_segura@localhost:5432/academia_db"
```

### 4. Rodar migrations

```bash
npx prisma migrate deploy
```

---

## 🚀 Iniciar a Aplicação

### Modo Desenvolvimento

```bash
npm run dev
```

### Modo Produção (Simples)

```bash
npm start
```

### Modo Produção (PM2 - Recomendado)

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar aplicação
pm2 start npm --name "academia" -- start

# Configurar para iniciar no boot
pm2 startup
pm2 save

# Monitorar
pm2 logs academia
pm2 status
```

---

## 🌐 Configurar Nginx (Reverse Proxy)

### 1. Instalar Nginx

```bash
sudo apt install nginx
```

### 2. Configurar site

```bash
sudo nano /etc/nginx/sites-available/academia
```

**Conteúdo do arquivo:**

```nginx
server {
    listen 80;
    server_name seudominio.com.br www.seudominio.com.br;

    # Redirecionar para HTTPS (depois de configurar SSL)
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Servir arquivos estáticos
    location /public {
        alias /var/www/academia/public;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### 3. Ativar site

```bash
sudo ln -s /etc/nginx/sites-available/academia /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. Configurar SSL (Certbot)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d seudominio.com.br -d www.seudominio.com.br
```

---

## 🔒 Segurança

### 1. Firewall

```bash
# Permitir apenas HTTP, HTTPS e SSH
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. Fail2Ban

```bash
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

### 3. Atualizações automáticas

```bash
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## 📊 Monitoramento

### Logs da aplicação (PM2)

```bash
pm2 logs academia          # Ver logs em tempo real
pm2 logs academia --lines 100  # Ver últimas 100 linhas
```

### Logs do Nginx

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Status do servidor

```bash
pm2 status                 # Status da aplicação
sudo systemctl status nginx  # Status do Nginx
sudo systemctl status postgresql  # Status do PostgreSQL
```

---

## 🔄 Deploy de Atualizações

### Script de deploy

```bash
#!/bin/bash
cd /var/www/academia

# Pull das últimas mudanças
git pull origin master

# Instalar novas dependências
npm install

# Rodar migrations (se houver)
npx prisma migrate deploy

# Rebuild
npm run build

# Reiniciar aplicação
pm2 restart academia
```

### Tornar executável

```bash
chmod +x deploy.sh
```

### Executar deploy

```bash
./deploy.sh
```

---

## ❌ Troubleshooting

### Erro: "tsx: not found"

```bash
# Solução: Instalar dependências
npm install
```

### Erro: "Cannot find module"

```bash
# Solução: Regenerar Prisma Client
npx prisma generate
```

### Erro de conexão com banco

```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Testar conexão
psql -U academia -d academia_db -h localhost
```

### Aplicação não inicia

```bash
# Ver logs completos
pm2 logs academia --err

# Verificar variáveis de ambiente
cat .env

# Testar manualmente
npm start
```

### Porta 3000 já em uso

```bash
# Encontrar processo usando a porta
sudo lsof -i :3000

# Matar processo
sudo kill -9 <PID>
```

---

## 📚 Comandos Úteis

```bash
# PM2
pm2 list                   # Listar processos
pm2 restart academia       # Reiniciar
pm2 stop academia          # Parar
pm2 delete academia        # Remover
pm2 monit                  # Monitor em tempo real

# PostgreSQL
sudo -u postgres psql      # Acessar console
\l                         # Listar bancos
\dt                        # Listar tabelas
\q                         # Sair

# Nginx
sudo nginx -t              # Testar configuração
sudo systemctl restart nginx  # Reiniciar
sudo systemctl status nginx   # Status

# Sistema
df -h                      # Espaço em disco
free -h                    # Memória
top                        # Processos (Ctrl+C para sair)
```

---

## 🆘 Suporte

**Erro persistente?**

1. Verifique logs: `pm2 logs academia`
2. Teste conexão com banco: `psql -U academia -d academia_db`
3. Verifique .env: `cat .env`
4. Reinstale dependências: `rm -rf node_modules && npm install`

---

## ✅ Checklist de Produção

- [ ] PostgreSQL instalado e configurado
- [ ] Banco de dados criado
- [ ] Migrations rodadas
- [ ] Arquivo .env configurado com credenciais reais
- [ ] JWT_SECRET gerado com segurança
- [ ] PM2 instalado e configurado
- [ ] Nginx configurado como reverse proxy
- [ ] SSL/HTTPS configurado (Certbot)
- [ ] Firewall configurado (UFW)
- [ ] Backups automáticos do banco (pg_dump)
- [ ] Monitoramento configurado

---

**Última atualização**: 22/11/2025
