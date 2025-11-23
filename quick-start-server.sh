#!/bin/bash

##############################################################################
# 🚀 Quick Start - Academia Krav Maga
# Para servidores que já têm Node.js instalado
##############################################################################

set -e

echo "🚀 Quick Start - Academia Krav Maga"
echo "═══════════════════════════════════"
echo ""

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Gerar Prisma Client
echo "🔧 Gerando Prisma Client..."
npx prisma generate

# Build
echo "🏗️  Compilando TypeScript..."
npm run build

echo ""
echo "✅ Setup concluído!"
echo ""
echo "Para iniciar:"
echo "  Desenvolvimento: npm run dev"
echo "  Produção: npm start"
echo ""
