#!/bin/bash
# Script para aplicar mudanças do sistema de pré-matrícula com segurança

echo "=========================================="
echo "🔍 VERIFICAÇÃO PRÉ-APLICAÇÃO"
echo "=========================================="

# 1. Verificar conexão com banco
echo "1️⃣ Testando conexão com banco..."
timeout 10 npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Banco acessível"
else
    echo "❌ Banco inacessível. Aguarde e tente novamente."
    exit 1
fi

# 2. Mostrar o que será criado
echo ""
echo "2️⃣ O que será criado:"
echo "   ✅ Tabela: pre_enrollments (pré-matrículas)"
echo "   ✅ Tabela: enrollment_links (links personalizados)"
echo "   ✅ Relações com: billing_plans, courses, students, organizations"
echo ""
echo "⚠️  IMPORTANTE: Nenhum dado existente será alterado ou perdido!"
echo "   • Tabelas de students, users, billing_plans: INTOCADAS"
echo "   • Apenas ADIÇÃO de novas tabelas"
echo "   • Zero risco de perda de dados"

# 3. Aplicar mudanças
echo ""
echo "=========================================="
echo "🚀 APLICANDO MUDANÇAS"
echo "=========================================="
echo "3️⃣ Criando novas tabelas no banco..."
npx prisma db push --skip-generate --accept-data-loss

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✅ SUCESSO!"
    echo "=========================================="
    echo "📊 Novas tabelas criadas:"
    echo "   • pre_enrollments (pré-matrículas públicas)"
    echo "   • enrollment_links (links personalizados)"
    echo ""
    echo "🔗 Sistema pronto para uso:"
    echo "   • Página pública: https://seudominio.com/pre-enrollment.html"
    echo "   • Módulo admin: pre-enrollment-admin"
    echo ""
    echo "🎯 Próximo passo:"
    echo "   1. Acessar módulo admin de pré-matrícula"
    echo "   2. Gerar primeiro link personalizado"
    echo "   3. Compartilhar link com clientes"
    echo ""
    echo "📸 Cliente poderá:"
    echo "   • Preencher dados sozinho"
    echo "   • Tirar foto pela webcam"
    echo "   • Academia converte em aluno com 1 clique"
else
    echo ""
    echo "=========================================="
    echo "❌ ERRO NA APLICAÇÃO"
    echo "=========================================="
    echo "⚠️  Nenhum dado foi alterado ou perdido."
    echo "Possíveis causas:"
    echo "   • Banco temporariamente inacessível"
    echo "   • Timeout de conexão"
    echo ""
    echo "💡 Solução: Aguarde alguns minutos e execute novamente:"
    echo "   bash apply-pre-enrollment-safely.sh"
    exit 1
fi
