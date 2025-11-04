# 🚀 Deploy Manual - Migração para MySQL

## ⚠️ IMPORTANTE
Este guia é para fazer a migração PostgreSQL → MySQL **diretamente no servidor**, sem precisar fazer push do código local.

---

## 📝 Passos no Servidor (64.227.28.147)

### 1️⃣ Conectar no servidor via SSH
```bash
ssh root@64.227.28.147
cd /var/www/academia
```

---

### 2️⃣ Fazer backup do schema atual
```bash
cp prisma/schema.prisma prisma/schema.prisma.backup
```

---

### 3️⃣ Editar o Prisma Schema
```bash
nano prisma/schema.prisma
```

**Localize estas linhas (início do arquivo):**
```prisma
datasource db {
  provider          = "postgresql"
  url               = env("DATABASE_URL")
  directUrl         = env("DIRECT_URL")
  shadowDatabaseUrl = env("SHADOW_DATABASE_URL")
}
```

**Substitua por:**
```prisma
datasource db {
  provider  = "mysql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

Salve: `Ctrl+O`, `Enter`, `Ctrl+X`

---

### 4️⃣ Editar o arquivo .env
```bash
nano .env
```

**Localize estas linhas:**
```bash
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
```

**Substitua por (coloque a senha real do MySQL):**
```bash
DATABASE_URL="mysql://WBA-Carneiro:SUA_SENHA_AQUI@67.205.159.161:3306/academia"
DIRECT_URL="mysql://WBA-Carneiro:SUA_SENHA_AQUI@67.205.159.161:3306/academia"
```

**Também atualize:**
```bash
PORT=3001
NODE_ENV="production"
CORS_ORIGIN="http://64.227.28.147:3001"
```

Salve: `Ctrl+O`, `Enter`, `Ctrl+X`

---

### 5️⃣ Regenerar Prisma Client
```bash
npx prisma generate
```

---

### 6️⃣ Criar tabelas no MySQL
```bash
npx prisma db push
```

⚠️ Este comando vai:
- Conectar no MySQL remoto (67.205.159.161)
- Criar todas as tabelas do schema
- **CUIDADO:** Se já existir dados, use `npx prisma migrate dev` ao invés

---

### 7️⃣ Instalar dependências
```bash
npm install --production=false
```

---

### 8️⃣ Build da aplicação
```bash
npm run build
```

---

### 9️⃣ Iniciar com PM2
```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 logs --lines 30
```

Pressione `Ctrl+C` para sair dos logs.

---

### 🔟 Configurar PM2 para iniciar automaticamente
```bash
pm2 startup systemd
```

Execute o comando que o PM2 retornar (algo como):
```bash
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root
```

---

### 1️⃣1️⃣ Testar aplicação
```bash
curl http://localhost:3001/api/health
```

Deve retornar:
```json
{"status":"ok","timestamp":"2025-11-02T..."}
```

No navegador: http://64.227.28.147:3001

---

## 🔥 Troubleshooting

### Erro: "Can't reach database server at 67.205.159.161"
O firewall do MySQL precisa liberar o IP do servidor de aplicação:
```bash
# No servidor MySQL (67.205.159.161), execute:
sudo ufw allow from 64.227.28.147 to any port 3306
```

### Erro: "Access denied for user 'WBA-Carneiro'"
Verifique:
1. Senha correta no .env
2. Usuário tem permissões no banco:
```sql
GRANT ALL PRIVILEGES ON academia.* TO 'WBA-Carneiro'@'%';
FLUSH PRIVILEGES;
```

### Erro: "Database 'academia' does not exist"
Criar o banco no MySQL:
```sql
CREATE DATABASE academia CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## ✅ Checklist Final

- [ ] prisma/schema.prisma alterado para `provider = "mysql"`
- [ ] .env com DATABASE_URL do MySQL
- [ ] .env com PORT=3001 e NODE_ENV=production
- [ ] npx prisma generate executado
- [ ] npx prisma db push criou tabelas
- [ ] npm install completo
- [ ] npm run build sem erros
- [ ] PM2 rodando e salvou configuração
- [ ] PM2 configurado para auto-start
- [ ] Aplicação respondendo em http://64.227.28.147:3001

---

## 📊 Comandos Úteis PM2

```bash
pm2 status              # Ver status da aplicação
pm2 logs academia       # Ver logs em tempo real
pm2 restart academia    # Reiniciar aplicação
pm2 stop academia       # Parar aplicação
pm2 delete academia     # Remover do PM2
pm2 monit               # Monitor interativo
```

---

Boa sorte! 🚀
