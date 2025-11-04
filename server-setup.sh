#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# 🚀 SETUP COMPLETO - Academia Krav Maga v2.0
# ═══════════════════════════════════════════════════════════════════════════
# 
# INSTRUÇÕES:
# 1. Conectar no servidor: ssh root@64.227.28.147
# 2. Copiar este arquivo completo e colar no terminal
# 3. Pressionar Enter
# 4. Aguardar ~5 minutos para conclusão
# 5. Seguir instruções de configuração do .env
#
# ═══════════════════════════════════════════════════════════════════════════

set -e  # Para na primeira erro

echo "═══════════════════════════════════════════════════════════════════════════"
echo "🚀 ACADEMIA KRAV MAGA V2.0 - SETUP AUTOMÁTICO"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""
echo "⏱️  Tempo estimado: 5 minutos"
echo "📍 Servidor: 64.227.28.147"
echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PARTE 1: INSTALAÇÃO DE DEPENDÊNCIAS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo "📦 [1/6] Instalando Node.js 18 (LTS - Compatível Ubuntu 18.04+)..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo "   ✅ Node.js instalado: $(node -v)"
else
    echo "   ℹ️  Node.js já instalado: $(node -v)"
fi

echo ""
echo "📦 [2/6] Instalando PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    echo "   ✅ PM2 instalado: $(pm2 -v)"
else
    echo "   ℹ️  PM2 já instalado: $(pm2 -v)"
fi

echo ""
echo "📦 [3/6] Instalando Git..."
if ! command -v git &> /dev/null; then
    sudo apt-get update -qq
    sudo apt-get install -y git
    echo "   ✅ Git instalado: $(git --version)"
else
    echo "   ℹ️  Git já instalado: $(git --version)"
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PARTE 2: SETUP DO PROJETO
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo ""
echo "📁 [4/6] Criando diretório e clonando repositório..."

# Criar diretório
if [ ! -d "/var/www/academia" ]; then
    sudo mkdir -p /var/www/academia
    sudo chown -R $USER:$USER /var/www/academia
    echo "   ✅ Diretório criado: /var/www/academia"
else
    echo "   ℹ️  Diretório já existe: /var/www/academia"
fi

# Navegar para o diretório
cd /var/www/academia

# Clonar repositório (se não existir)
if [ ! -d ".git" ]; then
    echo "   📥 Clonando repositório do GitHub..."
    git clone https://github.com/trcarneiro/academia.git .
    echo "   ✅ Repositório clonado"
else
    echo "   ℹ️  Repositório já clonado"
    echo "   📥 Atualizando código..."
    git pull origin main
    echo "   ✅ Código atualizado"
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PARTE 3: CONFIGURAÇÃO .ENV
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo ""
echo "⚙️  [5/6] Configurando .env..."

if [ ! -f ".env" ]; then
    echo "   📝 Criando .env a partir do template..."
    cp .env.production .env
    echo "   ✅ .env criado"
    
    # Gerar JWT_SECRET
    echo "   🔐 Gerando JWT_SECRET..."
    JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
    sed -i "s|\[SUBSTITUIR_POR_SECRET_GERADO_COM_OPENSSL\]|$JWT_SECRET|g" .env
    echo "   ✅ JWT_SECRET gerado e configurado"
    
    echo ""
    echo "   ⚠️  IMPORTANTE: Revisar variáveis do .env:"
    echo "   1. CORS_ORIGIN - Adicionar domínios públicos"
    echo "   2. Database credentials (já configuradas para Supabase)"
    echo "   3. AI API Keys (já configuradas)"
    echo "   4. Asaas API Key (já configurada para produção)"
    echo ""
    echo "   Para editar: nano .env"
else
    echo "   ℹ️  .env já existe (mantendo configuração atual)"
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PARTE 4: BUILD E DEPLOY
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo ""
echo "🏗️  [6/6] Build e inicialização..."

# Instalar dependências
echo "   📦 Instalando dependências (npm)..."
npm install --production=false --silent

# Gerar Prisma Client
echo "   🔧 Gerando Prisma Client..."
npx prisma generate

# Build TypeScript
echo "   🏗️  Compilando TypeScript..."
npm run build

# Verificar se dist/ foi gerado
if [ -d "dist" ]; then
    echo "   ✅ Build concluído (dist/ gerado)"
else
    echo "   ❌ ERRO: dist/ não foi gerado!"
    exit 1
fi

# Dar permissão de execução ao script de deploy
chmod +x deploy.sh
echo "   ✅ deploy.sh configurado"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PARTE 5: PM2 SETUP
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo ""
echo "🔄 Configurando PM2..."

# Parar processos antigos (se existirem)
if pm2 show academia > /dev/null 2>&1; then
    echo "   ⏸️  Parando processo antigo..."
    pm2 stop academia
    pm2 delete academia
fi

# Iniciar aplicação
echo "   🚀 Iniciando aplicação..."
pm2 start ecosystem.config.js --env production

# Salvar configuração
pm2 save

echo "   ✅ PM2 configurado"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PARTE 6: VALIDAÇÃO
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "🔍 VALIDANDO INSTALAÇÃO"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

# Aguardar 3 segundos para aplicação iniciar
echo "⏳ Aguardando aplicação iniciar (3s)..."
sleep 3

# Verificar status PM2
echo ""
echo "📊 Status PM2:"
pm2 status

# Testar health check
echo ""
echo "🏥 Testando Health Check..."
if curl -f -s http://localhost:3001/api/health > /dev/null; then
    echo "   ✅ Health check respondendo"
else
    echo "   ⚠️  Health check não respondeu (verificar logs)"
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CONCLUSÃO
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "✅ SETUP CONCLUÍDO COM SUCESSO!"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""
echo "🌐 URLs Importantes:"
echo "   API:          http://64.227.28.147:3001"
echo "   Swagger Docs: http://64.227.28.147:3001/docs"
echo "   Health Check: http://64.227.28.147:3001/api/health"
echo ""
echo "📊 Comandos Úteis:"
echo "   pm2 status           - Ver status da aplicação"
echo "   pm2 logs academia   - Ver logs em tempo real"
echo "   pm2 restart academia - Reiniciar aplicação"
echo "   pm2 monit            - Monitoramento visual"
echo "   ./deploy.sh          - Deploy de atualizações"
echo ""
echo "📝 Próximos Passos:"
echo "   1. Configurar PM2 startup (executar comando abaixo):"
echo "      pm2 startup systemd"
echo "      (Copiar e executar o comando retornado)"
echo ""
echo "   2. Testar API no navegador:"
echo "      http://64.227.28.147:3001/docs"
echo ""
echo "   3. Configurar webhook (opcional):"
echo "      Ver: DEPLOY_QUICK_START.md (Parte 3)"
echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

# Salvar informações em arquivo
cat > /var/www/academia/SETUP_INFO.txt <<EOF
═══════════════════════════════════════════════════════════════════════════
🚀 ACADEMIA KRAV MAGA V2.0 - INFORMAÇÕES DO SETUP
═══════════════════════════════════════════════════════════════════════════

Data do Setup: $(date)
Servidor: 64.227.28.147
Diretório: /var/www/academia

Versões Instaladas:
- Node.js: $(node -v)
- npm: $(npm -v)
- PM2: $(pm2 -v)
- Git: $(git --version)

URLs:
- API: http://64.227.28.147:3001
- Swagger: http://64.227.28.147:3001/docs
- Health: http://64.227.28.147:3001/api/health

Comandos Úteis:
- pm2 status
- pm2 logs academia
- pm2 restart academia
- ./deploy.sh

Credenciais do Servidor:
- MySQL root: sudo cat .db_password
- OpenLiteSpeed: sudo cat /root/.litespeed_password

Documentação:
- DEPLOY_QUICK_START.md - Guia rápido
- DEPLOYMENT_GUIDE.md - Guia completo
- DEPLOY_CHECKLIST.md - Checklist de validação
- DEPLOY_SUMMARY.md - Sumário executivo

Próximo Passo:
- Configurar PM2 startup: pm2 startup systemd
- Executar comando retornado

═══════════════════════════════════════════════════════════════════════════
EOF

echo "💾 Informações salvas em: /var/www/academia/SETUP_INFO.txt"
echo ""
