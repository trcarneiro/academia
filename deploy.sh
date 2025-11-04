#!/bin/bash
# 🚀 Script de Deploy Automático - Academia Krav Maga v2.0
# Para usar no servidor: /var/www/academia/deploy.sh

set -e  # Para execução no primeiro erro

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Iniciando deploy da Academia Krav Maga"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. Navegar para o diretório da aplicação
echo "📂 Navegando para /var/www/academia..."
cd /var/www/academia || exit 1

# 2. Backup do .env (se existir)
if [ -f .env ]; then
  echo "💾 Criando backup do .env..."
  cp .env .env.backup
  echo "   ✅ Backup salvo em .env.backup"
fi

# 3. Pull das mudanças do Git
echo ""
echo "📥 Baixando atualizações do Git (branch main)..."
git fetch origin
CURRENT_COMMIT=$(git rev-parse HEAD)
git reset --hard origin/main
NEW_COMMIT=$(git rev-parse HEAD)

if [ "$CURRENT_COMMIT" = "$NEW_COMMIT" ]; then
  echo "   ℹ️  Nenhuma atualização encontrada"
else
  echo "   ✅ Código atualizado: $CURRENT_COMMIT -> $NEW_COMMIT"
fi

# 4. Restaurar .env
if [ -f .env.backup ]; then
  echo "🔄 Restaurando .env..."
  mv .env.backup .env
  echo "   ✅ .env restaurado"
fi

# 5. Instalar dependências
echo ""
echo "📦 Instalando dependências..."
npm ci --production=false --silent
echo "   ✅ Dependências instaladas"

# 6. Gerar Prisma Client
echo ""
echo "🔧 Gerando Prisma Client..."
npx prisma generate
echo "   ✅ Prisma Client gerado"

# 7. Rodar migrações (se houver)
echo ""
echo "🗃️ Aplicando migrações do banco de dados..."
if npx prisma migrate deploy 2>/dev/null; then
  echo "   ✅ Migrações aplicadas"
else
  echo "   ⚠️  Nenhuma migração pendente, aplicando push..."
  npx prisma db push --skip-generate
  echo "   ✅ Schema sincronizado"
fi

# 8. Build TypeScript
echo ""
echo "🏗️ Compilando TypeScript..."
npm run build
echo "   ✅ Build concluído"

# 9. Verificar se dist/ foi gerado
if [ ! -d "dist" ]; then
  echo "   ❌ ERRO: Diretório dist/ não foi gerado!"
  exit 1
fi

# 10. Reiniciar aplicação com PM2
echo ""
echo "♻️ Reiniciando aplicação..."
if pm2 show academia > /dev/null 2>&1; then
  pm2 restart academia --update-env
  echo "   ✅ Aplicação reiniciada"
else
  echo "   ⚠️  Aplicação não está rodando no PM2"
  echo "   Iniciando pela primeira vez..."
  pm2 start ecosystem.config.js --env production
  pm2 save
  echo "   ✅ Aplicação iniciada"
fi

# 11. Verificar status
echo ""
echo "📊 Status da aplicação:"
pm2 status academia

# 12. Testar health check
echo ""
echo "🏥 Testando health check..."
sleep 3  # Aguardar 3 segundos para aplicação iniciar
if curl -f -s http://localhost:3001/api/health > /dev/null; then
  echo "   ✅ Aplicação respondendo corretamente"
else
  echo "   ⚠️  Aplicação não respondeu ao health check"
  echo "   Verifique os logs: pm2 logs academia"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Deploy concluído com sucesso!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Comandos úteis:"
echo "   pm2 logs academia       - Ver logs em tempo real"
echo "   pm2 status              - Ver status de todos os processos"
echo "   pm2 restart academia    - Reiniciar aplicação"
echo "   pm2 stop academia       - Parar aplicação"
echo "   pm2 monit               - Monitoramento visual"
echo ""
echo "🌐 URLs:"
echo "   http://64.227.28.147:3001       - API direta"
echo "   http://64.227.28.147/api/       - API via proxy (se configurado)"
echo "   http://64.227.28.147/docs       - Swagger API Documentation"
echo ""
