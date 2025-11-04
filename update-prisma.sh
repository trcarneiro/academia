#!/bin/bash
echo "🔧 Atualizando Prisma Schema..."

echo "1️⃣ Aplicando mudanças no banco..."
npx prisma db push

echo "2️⃣ Regenerando cliente Prisma..."
npx prisma generate

echo "✅ Prisma atualizado! Reinicie o servidor."
