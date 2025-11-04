#!/bin/bash
# 🧪 Script para Testar Fluxo de Login/Logout

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  🧪 TESTE DE FLUXO DE LOGIN - SUPABASE AUTH              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# 1. Verificar se servidor está rodando
echo "1️⃣  Verificando servidor..."
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ Servidor está rodando"
else
    echo "❌ Servidor não respondeu - execute: npm run dev"
    exit 1
fi

# 2. Testar backend endpoint
echo ""
echo "2️⃣  Testando backend endpoint..."
echo "   GET /api/auth/users/by-email"
RESPONSE=$(curl -s "http://localhost:3000/api/auth/users/by-email?email=trcampos@gmail.com")
if echo "$RESPONSE" | grep -q "organizationId"; then
    echo "✅ Backend endpoint funciona"
    echo "   Response: $RESPONSE"
else
    echo "❌ Backend endpoint falhou"
    echo "   Response: $RESPONSE"
fi

# 3. Instrução para testar logout
echo ""
echo "3️⃣  Para testar logout/login:"
echo "   1. Abra DevTools (F12)"
echo "   2. Console → execute:"
echo "      localStorage.clear()"
echo "   3. Recarregue a página (F5)"
echo "   4. Deve mostrar página de LOGIN"
echo ""

# 4. Informação sobre o fluxo
echo "4️⃣  Fluxo esperado:"
echo "   ✅ Com localStorage → Redireciona para dashboard"
echo "   ✅ Sem localStorage → Mostra página de login"
echo "   ✅ Google OAuth → Pop-up ou redirect"
echo ""

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Para testar interativamente, abra em navegador:          ║"
echo "║  http://localhost:3000/test-login-flow.html               ║"
echo "╚════════════════════════════════════════════════════════════╝"
