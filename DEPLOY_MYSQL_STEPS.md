# 🚀 Deploy com MySQL - Passos Finais

## ✅ Arquivos já atualizados localmente:
- ✅ `.env` - Configurado para MySQL remoto (67.205.159.161)
- ✅ `prisma/schema.prisma` - Provider alterado para `mysql`

---

## 📝 Passos no Servidor (64.227.28.147):

### 1️⃣ Editar o .env no servidor com a senha correta

No servidor, execute:
```bash
cd /var/www/academia
nano .env
```

Localize esta linha:
```
DATABASE_URL="mysql://WBA-Carneiro:YOUR_PASSWORD_HERE@67.205.159.161:3306/academia"
```

Substitua `YOUR_PASSWORD_HERE` pela senha real do usuário `WBA-Carneiro`.

Faça o mesmo na linha:
```
DIRECT_URL="mysql://WBA-Carneiro:YOUR_PASSWORD_HERE@67.205.159.161:3306/academia"
```

Salve: `Ctrl+O`, `Enter`, `Ctrl+X`

---

### 2️⃣ Fazer commit e push das mudanças locais

**No seu computador local (Windows):**
```bash
cd h:\projetos\academia
git add .env prisma/schema.prisma
git commit -m "chore: migrate from PostgreSQL to MySQL"
git push origin chore/validation-hardening-tenant-helmet-rate-limit
```

---

### 3️⃣ Atualizar código no servidor

**No servidor:**
```bash
cd /var/www/academia
git pull origin chore/validation-hardening-tenant-helmet-rate-limit
```

---

### 4️⃣ Instalar dependências e gerar Prisma Client

```bash
npm install --production=false
npx prisma generate
```

---

### 5️⃣ Criar as tabelas no banco MySQL

```bash
npx prisma db push
```

Este comando vai:
- Conectar no MySQL remoto (67.205.159.161)
- Criar todas as tabelas do schema
- ⚠️ **ATENÇÃO:** Se já existir dados no banco, use `npx prisma migrate dev` ao invés

---

### 6️⃣ Build da aplicação

```bash
npm run build
```

---

### 7️⃣ Iniciar com PM2

```bash
chmod +x deploy.sh
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup systemd
```

Execute o comando que o PM2 retornar (algo como):
```bash
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root
```

---

### 8️⃣ Verificar se está rodando

```bash
pm2 logs --lines 30
```

Pressione `Ctrl+C` para sair dos logs.

```bash
curl http://localhost:3001/api/health
```

Deve retornar algo como:
```json
{"status":"ok","timestamp":"2025-11-02T..."}
```

---

### 9️⃣ Testar no navegador

Abra: http://64.227.28.147:3001

---

## 🔥 Em caso de erro "Can't reach database server"

Verifique se o MySQL remoto aceita conexões externas:
```bash
mysql -h 67.205.159.161 -u WBA-Carneiro -p academia
```

Se não conectar, o firewall do servidor MySQL (67.205.159.161) precisa liberar o IP do servidor de aplicação (64.227.28.147).

---

## 📊 Comandos úteis PM2:

```bash
pm2 status              # Ver status
pm2 logs academia       # Ver logs
pm2 restart academia    # Reiniciar
pm2 stop academia       # Parar
pm2 delete academia     # Remover
```

---

## ✅ Checklist Final:

- [ ] .env com senha correta do MySQL
- [ ] Git pull com mudanças do schema
- [ ] npm install completo
- [ ] npx prisma generate executado
- [ ] npx prisma db push criou as tabelas
- [ ] npm run build sem erros
- [ ] PM2 iniciado e rodando
- [ ] Aplicação respondendo em http://64.227.28.147:3001

---

Boa sorte! 🚀
