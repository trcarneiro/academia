#!/bin/bash

##############################################################################
# 🚀 Academia Krav Maga - Server Setup Script
# Automatiza a configuração inicial do servidor Linux
##############################################################################

set -e  # Parar em caso de erro

echo "════════════════════════════════════════════════════════"
echo "🚀 Academia Krav Maga - Setup do Servidor"
echo "════════════════════════════════════════════════════════"
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Função de log
log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 1. Verificar Node.js
echo ""
log_info "1/8 Verificando Node.js..."
if ! command -v node &> /dev/null; then
    log_error "Node.js não está instalado!"
    log_info "Instalando Node.js 20.x LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    NODE_VERSION=$(node --version)
    log_success "Node.js encontrado: $NODE_VERSION"
fi

# 2. Verificar npm
echo ""
log_info "2/8 Verificando npm..."
NPM_VERSION=$(npm --version)
log_success "npm encontrado: $NPM_VERSION"

# 3. Verificar diretório do projeto
echo ""
log_info "3/8 Verificando diretório do projeto..."
if [ ! -f "package.json" ]; then
    log_error "Arquivo package.json não encontrado!"
    log_error "Execute este script de dentro do diretório /var/www/academia"
    exit 1
fi
log_success "Diretório do projeto confirmado"

# 4. Instalar dependências
echo ""
log_info "4/8 Instalando dependências do Node.js..."
log_info "Isso pode levar alguns minutos..."
npm install --production=false
log_success "Dependências instaladas"

# 5. Verificar arquivo .env
echo ""
log_info "5/8 Verificando arquivo .env..."
if [ ! -f ".env" ]; then
    log_warning "Arquivo .env não encontrado!"
    if [ -f ".env.example" ]; then
        log_info "Copiando .env.example para .env..."
        cp .env.example .env
        log_warning "IMPORTANTE: Edite o arquivo .env com suas configurações!"
        log_info "Execute: nano .env"
    else
        log_error "Arquivo .env.example também não encontrado!"
        log_info "Crie manualmente o arquivo .env com as variáveis necessárias"
    fi
else
    log_success "Arquivo .env encontrado"
fi

# 6. Gerar Prisma Client
echo ""
log_info "6/8 Gerando Prisma Client..."
npx prisma generate
log_success "Prisma Client gerado"

# 7. Verificar banco de dados
echo ""
log_info "7/8 Verificando conexão com banco de dados..."
if npx prisma db pull --force 2>/dev/null; then
    log_success "Conexão com banco de dados OK"
    
    # Perguntar se deve rodar migrations
    read -p "Deseja rodar as migrations do banco de dados? (s/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        log_info "Rodando migrations..."
        npx prisma migrate deploy
        log_success "Migrations aplicadas"
    fi
else
    log_warning "Não foi possível conectar ao banco de dados"
    log_info "Verifique a variável DATABASE_URL no arquivo .env"
fi

# 8. Build do projeto
echo ""
log_info "8/8 Compilando TypeScript..."
npm run build
log_success "Build concluído"

# Finalização
echo ""
echo "════════════════════════════════════════════════════════"
log_success "Setup concluído com sucesso!"
echo "════════════════════════════════════════════════════════"
echo ""
log_info "PRÓXIMOS PASSOS:"
echo ""
echo "1. Verifique/edite as variáveis de ambiente:"
echo "   nano .env"
echo ""
echo "2. Para desenvolvimento:"
echo "   npm run dev"
echo ""
echo "3. Para produção:"
echo "   npm start"
echo ""
echo "4. Para usar PM2 (recomendado para produção):"
echo "   npm install -g pm2"
echo "   pm2 start npm --name 'academia' -- start"
echo "   pm2 save"
echo "   pm2 startup"
echo ""
log_warning "LEMBRE-SE: Configure o .env com suas credenciais antes de iniciar!"
echo ""
