# 🚀 Server Deployment Guide - Academia Krav Maga

## 📋 Prerequisites Checklist

- [x] Ubuntu 18.04 server (psicologobelohorizontecombr20210803-s-1vcpu-1gb-nyc1-01)
- [ ] Node.js 18+ installed
- [ ] PostgreSQL database
- [ ] Nginx reverse proxy
- [ ] PM2 process manager
- [ ] Git installed

---

## 🔧 **STEP 1: Prepare Your Server**

### 1.1 SSH into your server
```bash
ssh root@psicologobelohorizontecombr20210803-s-1vcpu-1gb-nyc1-01
```

### 1.2 Install Node.js 18 (if not installed)
```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Install Node.js
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x or higher
```

### 1.3 Install PostgreSQL (if not installed)
```bash
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
```

```sql
-- Inside PostgreSQL console
CREATE DATABASE academia_prod;
CREATE USER academia_user WITH PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE academia_prod TO academia_user;
\q
```

### 1.4 Install PM2 globally
```bash
sudo npm install -g pm2

# Verify installation
pm2 --version
```

### 1.5 Install Nginx (reverse proxy)
```bash
sudo apt-get install -y nginx

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## 🔑 **STEP 2: Configure GitHub Secrets**

Go to your GitHub repository: `https://github.com/trcarneiro1/academia/settings/secrets/actions`

Add these secrets:

| Secret Name | Value | Description |
|------------|-------|-------------|
| `SERVER_HOST` | `psicologobelohorizontecombr20210803-s-1vcpu-1gb-nyc1-01` | Your server hostname or IP |
| `SERVER_USER` | `root` or `deploy` | SSH user (create dedicated user recommended) |
| `SSH_PRIVATE_KEY` | `-----BEGIN OPENSSH PRIVATE KEY-----...` | Your SSH private key |
| `SSH_PORT` | `22` | SSH port (default 22) |
| `SERVER_URL` | `http://your-domain.com` | Your server URL for health checks |
| `DATABASE_URL` | `postgresql://academia_user:password@localhost:5432/academia_prod` | Production database URL |

### Generate SSH Key for GitHub Actions
```bash
# On your LOCAL machine
ssh-keygen -t ed25519 -C "github-actions@academia" -f ~/.ssh/academia_deploy

# Copy PRIVATE key content (add to GitHub secret SSH_PRIVATE_KEY)
cat ~/.ssh/academia_deploy

# Copy PUBLIC key to server
ssh-copy-id -i ~/.ssh/academia_deploy.pub root@your-server
```

Or manually add to server:
```bash
# On SERVER
mkdir -p ~/.ssh
nano ~/.ssh/authorized_keys
# Paste public key content, save and exit

# Set permissions
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

---

## 📂 **STEP 3: Setup Project Directory on Server**

```bash
# Create project directory
sudo mkdir -p /var/www/academia
sudo chown -R $USER:$USER /var/www/academia
cd /var/www/academia

# Clone repository (first time only)
git clone https://github.com/trcarneiro1/academia.git .

# Create .env file
nano .env
```

**Production .env template:**
```bash
# Server
PORT=3000
NODE_ENV=production

# Database
DATABASE_URL="postgresql://academia_user:your_password@localhost:5432/academia_prod"
DIRECT_URL="postgresql://academia_user:your_password@localhost:5432/academia_prod"

# JWT
JWT_SECRET="your-super-secure-production-jwt-secret-min-32-chars"

# Supabase
SUPABASE_URL="https://yawfuymgwukericlhgxh.supabase.co"
SUPABASE_ANON_KEY="your-production-supabase-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# AI Services
GEMINI_API_KEY="your-gemini-api-key"
OPENAI_API_KEY="your-openai-api-key"
CLAUDE_API_KEY="your-claude-api-key"

# CORS
CORS_ORIGIN="https://your-domain.com,https://www.your-domain.com"

# Optional Services
ASAAS_API_KEY="your-asaas-key"
SENDGRID_API_KEY="your-sendgrid-key"
```

```bash
# Install dependencies
npm ci --production=false

# Generate Prisma Client
npx prisma generate

# Push database schema
npx prisma db push

# Build project
npm run build

# Create logs directory
mkdir -p logs
```

---

## 🚦 **STEP 4: Start Application with PM2**

```bash
# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 process list (auto-restart on reboot)
pm2 save

# Setup PM2 startup script
pm2 startup systemd
# Copy and run the command it shows

# Check status
pm2 status
pm2 logs academia --lines 50
```

---

## 🌐 **STEP 5: Configure Nginx Reverse Proxy**

```bash
sudo nano /etc/nginx/sites-available/academia
```

**Nginx configuration:**
```nginx
server {
    listen 80;
    server_name psicologobelohorizontecombr20210803-s-1vcpu-1gb-nyc1-01 your-domain.com;

    # Increase max upload size
    client_max_body_size 50M;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # API proxy
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Serve static frontend files
    location / {
        root /var/www/academia/public;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Swagger docs
    location /docs {
        proxy_pass http://localhost:3000/docs;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/academia /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## 🔐 **STEP 6: Setup SSL (Optional but Recommended)**

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal is configured automatically
sudo certbot renew --dry-run
```

---

## ✅ **STEP 7: Verify Deployment**

```bash
# Check PM2 status
pm2 status

# Check application logs
pm2 logs academia --lines 100

# Test endpoints
curl http://localhost:3000/health
curl http://your-domain.com/api/health

# Check Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 🔄 **GitHub Actions Auto-Deploy**

Once configured, every push to `main`/`master` branch will:

1. ✅ Checkout code
2. ✅ Install dependencies
3. ✅ Build TypeScript
4. ✅ SSH into server
5. ✅ Pull latest code
6. ✅ Install dependencies
7. ✅ Run migrations
8. ✅ Build project
9. ✅ Restart PM2
10. ✅ Health check

**Monitor deployments:**
- GitHub: `https://github.com/trcarneiro1/academia/actions`
- Server logs: `pm2 logs academia`

---

## 🛠️ **Useful Commands**

```bash
# PM2 Management
pm2 restart academia        # Restart app
pm2 stop academia          # Stop app
pm2 delete academia        # Remove app
pm2 logs academia          # View logs
pm2 monit                  # Real-time monitoring

# Manual Deployment
cd /var/www/academia
git pull origin main
npm ci
npx prisma generate
npx prisma db push --skip-generate
npm run build
pm2 restart academia

# Check Resource Usage
free -h                    # Memory usage
df -h                      # Disk usage
htop                       # CPU/Memory monitor
pm2 monit                  # PM2 monitoring

# Nginx
sudo systemctl status nginx
sudo nginx -t              # Test config
sudo systemctl reload nginx
sudo tail -f /var/log/nginx/error.log
```

---

## ⚠️ **Performance Optimization for 1GB RAM**

Your server has limited resources. Apply these optimizations:

### 1. Enable Swap (Extra Virtual Memory)
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 2. Optimize PostgreSQL for Low Memory
```bash
sudo nano /etc/postgresql/10/main/postgresql.conf
```

Add/modify:
```conf
shared_buffers = 128MB
effective_cache_size = 512MB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 4MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 8MB
min_wal_size = 1GB
max_wal_size = 2GB
max_connections = 20
```

```bash
sudo systemctl restart postgresql
```

### 3. PM2 Memory Management
Already configured in `ecosystem.config.js`:
- `max_memory_restart: '800M'` - Restart if exceeds 800MB
- Single instance mode
- Auto-restart enabled

---

## 🆘 **Troubleshooting**

### App won't start
```bash
pm2 logs academia --err --lines 200
# Check for missing env variables, database connection issues
```

### Out of memory errors
```bash
free -h
pm2 restart academia
# Consider upgrading to 2GB RAM server
```

### Database connection failed
```bash
sudo systemctl status postgresql
sudo -u postgres psql -c "SELECT version();"
# Verify DATABASE_URL in .env
```

### Nginx 502 Bad Gateway
```bash
sudo systemctl status nginx
pm2 status
# Ensure app is running on port 3000
netstat -tlnp | grep 3000
```

---

## 📊 **Monitoring & Maintenance**

### Setup Automatic Backups
```bash
# Database backup script
nano /home/backup-db.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/academia"
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
pg_dump -U academia_user academia_prod > $BACKUP_DIR/db_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "db_*.sql" -mtime +7 -delete

echo "Backup completed: $DATE"
```

```bash
chmod +x /home/backup-db.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add line:
0 2 * * * /home/backup-db.sh >> /var/log/academia-backup.log 2>&1
```

### Health Monitoring
Use UptimeRobot or similar to monitor:
- `http://your-domain.com/health`
- `http://your-domain.com/api/health`

---

## ✅ **Deployment Complete!**

Your application should now be accessible at:
- **Frontend**: http://your-domain.com
- **API**: http://your-domain.com/api
- **Swagger Docs**: http://your-domain.com/docs

**Next Steps:**
1. Configure domain DNS to point to your server IP
2. Setup SSL certificate with Certbot
3. Configure monitoring (PM2 Plus, DataDog, etc.)
4. Setup log rotation for `/var/log/nginx` and PM2 logs
5. Configure firewall (UFW) for security

---

## 📞 **Support**

If deployment fails, check:
1. GitHub Actions logs: https://github.com/trcarneiro1/academia/actions
2. PM2 logs: `pm2 logs academia --lines 500`
3. Nginx logs: `sudo tail -f /var/log/nginx/error.log`
4. System logs: `sudo journalctl -xe`

For questions, refer to:
- `AGENTS.md` - Development guide
- `dev/WORKFLOW.md` - SOPs
- GitHub Issues

**Happy Deploying! 🚀**
