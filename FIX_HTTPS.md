# Guia de Correção HTTPS e Google Login

## 1. Habilitar Login com Google

O código para login com Google já está implementado no `login.html`. Para que funcione, você precisa configurar o Supabase:

1. Acesse o painel do Supabase: https://supabase.com/dashboard/project/yawfuymgwukericlhgxh
2. Vá em **Authentication** > **Providers**.
3. Habilite o **Google**.
4. Você precisará criar um projeto no **Google Cloud Console** para obter o `Client ID` e `Client Secret`.
5. No Google Cloud Console, configure a **Authorized redirect URI** para:
   `https://yawfuymgwukericlhgxh.supabase.co/auth/v1/callback`
6. De volta ao Supabase, vá em **Authentication** > **URL Configuration**.
7. Adicione a URL do seu site em **Redirect URLs**:
   `https://app.smartdefence.com.br/login.html`
   `https://smartdefence.com.br/login.html`

## 2. Corrigir "Não Seguro" (HTTPS)

Se o site ainda mostra "Não Seguro", verifique os passos abaixo:

### Passo A: Testar HTTPS
Tente acessar diretamente com `https://`:
https://app.smartdefence.com.br

Se funcionar e mostrar o cadeado, o problema é apenas que o servidor não está redirecionando automaticamente de HTTP para HTTPS.

### Passo B: Configurar Redirecionamento no Nginx
Atualizei o arquivo `nginx-academia.conf` no projeto com a configuração correta. Você precisa aplicar isso no servidor.

Acesse o servidor via SSH e edite o arquivo de configuração:

```bash
ssh root@64.227.28.147
nano /etc/nginx/sites-available/academia
```

Substitua o conteúdo pelo conteúdo do arquivo `nginx-academia.conf` atualizado (que está na pasta raiz do projeto). Certifique-se de que os caminhos dos certificados (`/etc/letsencrypt/live/...`) estão corretos.

Depois, teste e recarregue o Nginx:
```bash
nginx -t
systemctl reload nginx
```

### Passo C: Conteúdo Misto (Mixed Content)
Se você acessar via HTTPS e ainda ver "Não Seguro" (ou um cadeado com alerta), é porque algum recurso (imagem, script) está sendo carregado via HTTP.

1. Abra o site no Chrome.
2. Pressione `F12` para abrir o DevTools.
3. Vá na aba **Console**.
4. Procure por erros em vermelho ou amarelo dizendo "Mixed Content".
5. Isso indicará exatamente qual arquivo está causando o problema.

**Nota:** Já adicionei uma meta tag no `login.html` e `index.html` para tentar forçar o upgrade de recursos inseguros:
`<meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">`
