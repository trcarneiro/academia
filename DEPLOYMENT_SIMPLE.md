# 🚀 Deployment Setup - Node.js Only (Supabase Database)

**Database:** Supabase (Cloud PostgreSQL) ☁️  
**Backend:** Node.js + Fastify on Ubuntu Server  
**No local PostgreSQL needed!**

---

## ⚡ Quick Start (2 Steps Only!)

### **Step 1: Configure GitHub Secrets** ⏱️ 5 minutes

Go to: https://github.com/trcarneiro1/academia/settings/secrets/actions

Add these **6 secrets**:

| Secret | Value | Description |
|--------|-------|-------------|
| `SSH_PRIVATE_KEY` | `-----BEGIN OPENSSH...` | SSH key for server access |
| `SERVER_HOST` | `psicologobelohorizontecombr20210803-s-1vcpu-1gb-nyc1-01` | Your server hostname/IP |
| `SERVER_USER` | `root` | SSH user |
| `SERVER_URL` | `http://your-server-ip` | For health checks |
| `DATABASE_URL` | `postgresql://postgres:[password]@[supabase-host]:5432/postgres` | Supabase connection string |
| `SUPABASE_URL` | `https://yawfuymgwukericlhgxh.supabase.co` | Supabase project URL |

**Get DATABASE_URL from Supabase:**
1. Go to: https://app.supabase.com/project/yawfuymgwukericlhgxh/settings/database
2. Copy **Connection String → URI** (Transaction mode)
3. Replace `[YOUR-PASSWORD]` with your database password

**Generate SSH Key:**
```bash
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/academia_deploy
cat ~/.ssh/academia_deploy  # Copy to GitHub secret
```

---

### **Step 2: Setup Server (Node.js Only)** ⏱️ 15 minutes

```bash
# SSH into server
ssh root@psicologobelohorizontecombr20210803-s-1vcpu-1gb-nyc1-01

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Nginx (reverse proxy)
sudo apt-get install -y nginx

# Verify installations
node --version  # Should show v18.x
npm --version
pm2 --version

# Create project directory
sudo mkdir -p /var/www/academia
sudo chown -R $USER:$USER /var/www/academia
cd /var/www/academia

# Clone repository
git clone https://github.com/trcarneiro1/academia.git .

# Add SSH public key to server
mkdir -p ~/.ssh
nano ~/.ssh/authorized_keys
# Paste public key content from: cat ~/.ssh/academia_deploy.pub
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

---

## 📝 Create .env File on Server

```bash
cd /var/www/academia
nano .env
```

**Paste this (update values):**
```bash
# Server
PORT=3000
NODE_ENV=production

# Supabase Database (COPY FROM SUPABASE DASHBOARD)
DATABASE_URL="postgresql://postgres.yawfuymgwukericlhgxh:[YOUR-PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres"
DIRECT_URL="postgresql://postgres.yawfuymgwukericlhgxh:[YOUR-PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres"

# JWT
JWT_SECRET="your-production-jwt-secret-min-32-characters-long"

# Supabase Auth
SUPABASE_URL="https://yawfuymgwukericlhgxh.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhd2Z1eW1nd3VrZXJpY2xoZ3hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA5NTYsImV4cCI6MjA2NjUzNjk1Nn0.sqm8ZAVJoS_tUGSGFuQapJYFTjfdAa7dkLs437A5bUs"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-from-supabase"

# AI Services (Optional)
GEMINI_API_KEY="AIzaSyA65j9jrAJAd9VAjU4rhLc7EWmbiM8Q530"
OPENAI_API_KEY=""
CLAUDE_API_KEY=""

# CORS
CORS_ORIGIN="http://your-server-ip,http://your-domain.com"
```

**Save:** `Ctrl+O`, `Enter`, `Ctrl+X`

---

## 🚀 First Deployment (Manual)

```bash
cd /var/www/academia

# Install dependencies
npm ci

# Generate Prisma Client (connects to Supabase)
npx prisma generate

# Build TypeScript
npm run build

# Create logs directory
mkdir -p logs

# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 process list
pm2 save

# Setup auto-restart on server reboot
pm2 startup systemd
# Run the command it shows

# Check status
pm2 status
pm2 logs academia --lines 50
```

---

## 🌐 Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/academia
```

**Paste this configuration:**
```nginx
server {
    listen 80;
    server_name psicologobelohorizontecombr20210803-s-1vcpu-1gb-nyc1-01;

    client_max_body_size 50M;
    
    # API proxy
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
        
        proxy_connect_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }

    # Frontend
    location / {
        root /var/www/academia/public;
        try_files $uri $uri/ /index.html;
        
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

**Enable site:**
```bash
sudo ln -s /etc/nginx/sites-available/academia /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## ✅ Test Your Deployment

```bash
# Test health endpoint
curl http://localhost:3000/health

# Should return:
# {"status":"healthy","timestamp":"2025-10-24T...","database":"connected"}

# Test from external
curl http://your-server-ip/health
```

---

## 🔄 Auto-Deploy Setup Complete!

Now every push to `main` branch will:

1. ✅ Build on GitHub Actions
2. ✅ SSH to your server
3. ✅ Pull latest code
4. ✅ Install dependencies
5. ✅ Generate Prisma Client (Supabase connection)
6. ✅ Build TypeScript
7. ✅ Restart PM2
8. ✅ Health check

---

## 📊 Architecture

```
┌─────────────┐
│   GitHub    │
│   Actions   │
└──────┬──────┘
       │ SSH
       ▼
┌─────────────┐        ┌──────────────┐
│   Ubuntu    │        │   Supabase   │
│   Server    │◄──────►│  PostgreSQL  │
│ (Node + PM2)│  HTTPS │   (Cloud)    │
└──────┬──────┘        └──────────────┘
       │
       ▼
    Users
```

**No local PostgreSQL needed!** ✨

---

## 🎯 What's Different from Full Setup

**Removed:**
- ❌ Local PostgreSQL installation
- ❌ Database creation scripts
- ❌ `prisma db push` in deploy workflow

**Kept:**
- ✅ Node.js + PM2 + Nginx
- ✅ Prisma Client generation (connects to Supabase)
- ✅ GitHub Actions auto-deploy
- ✅ All application features

---

## 🔍 Monitor Your App

```bash
# PM2 status
pm2 status

# View logs
pm2 logs academia

# Monitor resources
pm2 monit

# Restart if needed
pm2 restart academia
```

---

## 🆘 Troubleshooting

### Can't connect to Supabase
```bash
# Test connection
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$queryRaw\`SELECT 1\`.then(() => console.log('✓ Connected')).catch(e => console.error('✗ Failed:', e.message))"

# Check .env file
cat /var/www/academia/.env | grep DATABASE_URL
```

### PM2 process crashed
```bash
pm2 logs academia --err --lines 100
pm2 restart academia
```

### Nginx 502 error
```bash
sudo systemctl status nginx
pm2 status
curl http://localhost:3000/health
```

---

## 📞 Next Steps

1. **Push your code:**
   ```bash
   git push origin main
   ```

2. **Watch deployment:**
   https://github.com/trcarneiro1/academia/actions

3. **Access your app:**
   - Frontend: http://your-server-ip/
   - API: http://your-server-ip/api
   - Health: http://your-server-ip/health

---

## 🎉 That's It!

**Total Setup Time:** ~20 minutes  
**No database management needed!** Supabase handles everything.

**Happy Deploying! 🚀**
