# 🔐 GitHub Secrets Setup Guide

This guide helps you configure all necessary secrets for GitHub Actions deployment.

## 📋 Required Secrets

Go to: `https://github.com/trcarneiro1/academia/settings/secrets/actions`

Click **"New repository secret"** for each:

---

### 1️⃣ **SSH_PRIVATE_KEY** (Required)
Your SSH private key for server access.

**Generate SSH key pair:**
```bash
# On your LOCAL machine
ssh-keygen -t ed25519 -C "github-actions@academia" -f ~/.ssh/academia_deploy

# Display PRIVATE key (copy entire content including BEGIN/END lines)
cat ~/.ssh/academia_deploy
```

**Copy output** and paste into GitHub secret `SSH_PRIVATE_KEY`:
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
...
(many lines)
...
-----END OPENSSH PRIVATE KEY-----
```

**Add PUBLIC key to server:**
```bash
# Display PUBLIC key
cat ~/.ssh/academia_deploy.pub

# SSH into server and add to authorized_keys
ssh root@your-server
mkdir -p ~/.ssh
nano ~/.ssh/authorized_keys
# Paste public key, save and exit

# Set permissions
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

---

### 2️⃣ **SERVER_HOST** (Required)
Your server hostname or IP address.

**Value:** `psicologobelohorizontecombr20210803-s-1vcpu-1gb-nyc1-01`

Or your server IP (find it with):
```bash
# On server
hostname -I
```

---

### 3️⃣ **SERVER_USER** (Required)
SSH username for deployment.

**Recommended:** Create dedicated user
```bash
# On server (as root)
adduser deploy
usermod -aG sudo deploy

# Setup SSH for deploy user
su - deploy
mkdir -p ~/.ssh
# Add public key to ~/.ssh/authorized_keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

**Value:** `deploy` or `root`

---

### 4️⃣ **SSH_PORT** (Optional)
SSH port number.

**Default:** `22`

If you changed SSH port:
```bash
# On server
sudo nano /etc/ssh/sshd_config
# Find: Port 22
```

---

### 5️⃣ **SERVER_URL** (Required for health checks)
Your production URL.

**Examples:**
- `http://psicologobelohorizontecombr20210803-s-1vcpu-1gb-nyc1-01`
- `http://your-domain.com`
- `https://your-domain.com` (with SSL)

---

### 6️⃣ **DATABASE_URL** (Required)
Production PostgreSQL connection string.

**Format:**
```
postgresql://username:password@localhost:5432/database_name
```

**Example:**
```
postgresql://academia_user:SecureP@ssw0rd123@localhost:5432/academia_prod
```

**Create database on server:**
```bash
# On server
sudo -u postgres psql

# In PostgreSQL console:
CREATE DATABASE academia_prod;
CREATE USER academia_user WITH PASSWORD 'SecureP@ssw0rd123';
GRANT ALL PRIVILEGES ON DATABASE academia_prod TO academia_user;
\q
```

---

## 🔍 **Optional Secrets** (for advanced features)

### **SUPABASE_URL**
```
https://yawfuymgwukericlhgxh.supabase.co
```

### **SUPABASE_ANON_KEY**
Get from Supabase dashboard → Settings → API

### **SUPABASE_SERVICE_ROLE_KEY**
Get from Supabase dashboard → Settings → API (keep secret!)

### **GEMINI_API_KEY**
Google AI Studio API key for AI features

### **OPENAI_API_KEY**
OpenAI API key (optional fallback)

### **CLAUDE_API_KEY**
Anthropic Claude API key (optional)

### **ASAAS_API_KEY**
Brazilian payment gateway (if using)

### **SENDGRID_API_KEY**
Email service (if using)

---

## ✅ Verification Checklist

After adding all secrets:

- [ ] SSH_PRIVATE_KEY (with BEGIN/END lines)
- [ ] SERVER_HOST (hostname or IP)
- [ ] SERVER_USER (deploy or root)
- [ ] SERVER_URL (http://your-domain.com)
- [ ] DATABASE_URL (postgresql://...)
- [ ] Public key added to server's ~/.ssh/authorized_keys
- [ ] Can SSH manually: `ssh -i ~/.ssh/academia_deploy user@server`
- [ ] Database created and accessible
- [ ] PM2 installed on server: `pm2 --version`
- [ ] Nginx installed on server: `nginx -v`

---

## 🧪 Test SSH Connection

Before pushing, test SSH:

```bash
# From your local machine
ssh -i ~/.ssh/academia_deploy deploy@psicologobelohorizontecombr20210803-s-1vcpu-1gb-nyc1-01

# If successful, you should see server prompt
```

If connection fails:
```bash
# Check SSH logs on server
sudo tail -f /var/log/auth.log

# Common issues:
# 1. Wrong permissions: chmod 600 ~/.ssh/authorized_keys
# 2. Key not added: cat ~/.ssh/academia_deploy.pub >> ~/.ssh/authorized_keys
# 3. SSH service not running: sudo systemctl restart sshd
```

---

## 🚀 Trigger Deployment

Once secrets are configured:

```bash
git add .
git commit -m "feat: Setup GitHub Actions deployment"
git push origin main
```

Watch deployment: https://github.com/trcarneiro1/academia/actions

---

## 🆘 Troubleshooting

### "Permission denied (publickey)"
- Check if public key is in server's `~/.ssh/authorized_keys`
- Verify SSH_PRIVATE_KEY secret has complete key (including BEGIN/END)
- Check permissions: `ls -la ~/.ssh/`

### "Host key verification failed"
Add this to workflow (already included):
```yaml
- name: Add server to known hosts
  run: ssh-keyscan -H ${{ secrets.SERVER_HOST }} >> ~/.ssh/known_hosts
```

### "Database connection failed"
- Verify DATABASE_URL format
- Check PostgreSQL is running: `sudo systemctl status postgresql`
- Test connection: `psql "$DATABASE_URL" -c "SELECT 1"`

### "PM2 command not found"
Install PM2 on server:
```bash
sudo npm install -g pm2
pm2 --version
```

---

## 📞 Need Help?

Check these logs:

**GitHub Actions:**
- https://github.com/trcarneiro1/academia/actions

**Server Logs:**
```bash
# PM2 logs
pm2 logs academia

# Nginx logs
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -xe
```

**Related Documentation:**
- `DEPLOYMENT_GUIDE.md` - Full server setup
- `AGENTS.md` - Development guide
- `.github/workflows/deploy.yml` - Workflow config

---

**Happy Deploying! 🎉**
