# Guia de Deploy no Render

Este guia explica como implantar o projeto Academia Krav Maga no Render.com para testes.

## 1. Preparação

O projeto já foi configurado para deploy no Render com as seguintes alterações:
- **Build Script**: Atualizado para compilar TypeScript, resolver aliases (`@/`) e copiar arquivos estáticos.
- **Render Config**: Arquivo `render.yaml` criado.
- **Cross-platform**: Script de cópia de arquivos ajustado para funcionar em Windows e Linux.

## 2. Configuração no Render

1. Crie uma conta no [Render.com](https://render.com).
2. Clique em **New +** e selecione **Web Service**.
3. Conecte sua conta do GitHub e selecione o repositório `academia`.
4. O Render deve detectar automaticamente o arquivo `render.yaml`.
5. Se não detectar, configure manualmente:
   - **Name**: academia-krav-maga
   - **Environment**: Node
   - **Build Command**: `npm run render-build`
   - **Start Command**: `npm start`

## 3. Variáveis de Ambiente (Environment Variables)

Você **PRECISA** configurar as seguintes variáveis no painel do Render (Environment > Environment Variables):

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DATABASE_URL` | URL de conexão do PostgreSQL | `postgres://user:pass@host:5432/db` |
| `JWT_SECRET` | Segredo para tokens JWT | Gere um hash aleatório |
| `NODE_ENV` | Ambiente | `production` |
| `USE_HTTPS` | Forçar HTTPS (opcional) | `false` (Render já faz SSL termination) |

**Nota sobre Banco de Dados:**
O Render oferece um PostgreSQL gerenciado (grátis por 90 dias). Você pode criar um no painel do Render e copiar a `Internal Database URL` para a variável `DATABASE_URL`.

## 4. Deploy

1. Faça commit e push das alterações para o GitHub:
   ```bash
   git add .
   git commit -m "chore: setup render deployment"
   git push origin feature/frontend-online-setup
   ```
2. No Render, inicie o deploy (se não for automático).
3. Acompanhe os logs. O comando de build irá:
   - Instalar dependências
   - Gerar o cliente Prisma
   - Compilar o TypeScript (resolvendo caminhos `@/`)
   - Copiar a pasta `public` para `dist`

## 5. Verificação

Após o deploy, acesse a URL fornecida pelo Render (ex: `https://academia-krav-maga.onrender.com`).
Verifique se o frontend carrega corretamente e se a API responde.
