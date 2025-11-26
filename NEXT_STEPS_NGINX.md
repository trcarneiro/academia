# 🎯 Configuração Final do Servidor

## ✅ O que foi feito

1. ✅ **Rota /academia removida** do nginx
2. ✅ **Configuração atualizada** no repositório (commit: da3f9a8)
3. ✅ **Script de deploy criado** (`update-nginx-server.sh`)

## 📋 Próximos Passos (Execute no Servidor)

### 1. Conecte-se ao servidor

```bash
ssh root@64.227.28.147
```

### 2. Execute o script de atualização

```bash
cd /var/www/academia
git pull origin master
bash update-nginx-server.sh
```

**OU execute manualmente:**

```bash
cd /var/www/academia
git pull origin master
cp nginx-proxy.conf /etc/nginx/sites-available/proxy
nginx -t
systemctl reload nginx
```

### 3. Verifique o status

```bash
systemctl status nginx
curl -I https://smartdefence.com.br
```

---

## 🌐 Configuração Atual dos Domínios

### ✅ Funcionando

- **https://smartdefence.com.br** → WordPress (via OpenLiteSpeed na porta 8080)
- **https://psicologobelohorizonte.com.br** → WordPress (via OpenLiteSpeed na porta 8080)

### ❌ Removido

- ~~https://smartdefence.com.br/academia~~ → **REMOVIDO**

---

## 🎯 Para Acessar o Sistema de Academia

Você tem **3 opções**:

### **Opção 1: Criar Subdomínio (RECOMENDADO) ⭐**

1. **No Cloudflare**, crie um registro DNS:
   - Type: `A`
   - Name: `app`
   - Content: `64.227.28.147`
   - Proxy status: `Proxied` (nuvem laranja)

2. **No servidor**, atualize o nginx para adicionar o subdomínio:

```bash
# Crie uma cópia do nginx-proxy.conf e adicione:
server {
    listen 443 ssl http2;
    server_name app.smartdefence.com.br;

    ssl_certificate /etc/letsencrypt/live/smartdefence.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/smartdefence.com.br/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

3. **Recarregue o nginx**:

```bash
nginx -t && systemctl reload nginx
```

4. **Acesse**: https://app.smartdefence.com.br

---

### **Opção 2: Usar Outro Domínio**

Se você tiver outro domínio (ex: `academia.com.br`), pode apontá-lo para o mesmo servidor e configurar um novo bloco `server` no nginx.

---

### **Opção 3: Restaurar /academia (NÃO RECOMENDADO)**

Se você **realmente** quer usar `/academia`, precisamos fazer ajustes no código do sistema para suportar "base path". Isso é mais complexo e não é a melhor prática.

---

## 🔍 Verificação de Status

### Verificar se o Nginx está rodando

```bash
systemctl status nginx
```

### Verificar se o OpenLiteSpeed está rodando

```bash
systemctl status lsws
```

### Verificar se o Node.js está rodando

```bash
pm2 status
pm2 logs academia
```

### Testar conexões

```bash
# Testar WordPress (OLS na porta 8080)
curl -I http://localhost:8080

# Testar Node.js (porta 3000)
curl -I http://localhost:3000

# Testar Nginx (porta 443)
curl -I https://smartdefence.com.br
```

---

## 📞 Suporte

Se algo der errado:

1. Verifique os logs do Nginx:
   ```bash
   tail -f /var/log/nginx/error.log
   ```

2. Verifique os logs do OpenLiteSpeed:
   ```bash
   tail -f /usr/local/lsws/logs/error.log
   ```

3. Verifique os logs da aplicação:
   ```bash
   pm2 logs academia
   ```

---

## ✅ Checklist Final

- [ ] Script executado no servidor
- [ ] Nginx recarregado sem erros
- [ ] https://smartdefence.com.br carrega o WordPress
- [ ] https://psicologobelohorizonte.com.br carrega o WordPress
- [ ] Decidir: criar subdomínio `app.smartdefence.com.br` (recomendado)

---

**Última atualização**: 2025-01-30
**Status**: Aguardando execução no servidor
