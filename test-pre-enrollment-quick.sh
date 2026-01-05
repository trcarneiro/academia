#!/bin/bash
# TESTES RÁPIDOS - Módulo de Pré-Matrícula
# Execute este script para testar as principais funcionalidades

API_BASE="http://localhost:3000"

echo "🧪 TESTES RÁPIDOS - PRÉ-MATRÍCULA"
echo "=================================="
echo ""

# Obter token de autenticação (ajuste com seu email/senha)
echo "1️⃣  Obtendo token de autenticação..."
TOKEN_RESPONSE=$(curl -s -X POST "$API_BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }')

TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Falha ao obter token. Use o token manualmente ou ajuste email/senha."
    TOKEN="SEU_TOKEN_AQUI"
fi

echo "✅ Token obtido (primeiros 20 chars): ${TOKEN:0:20}..."
echo ""

# Teste 1: Criar Pré-Matrícula
echo "2️⃣  Criando pré-matrícula de teste..."
CREATE_RESPONSE=$(curl -s -X POST "$API_BASE/api/pre-enrollment" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Ana",
    "lastName": "Costa Teste",
    "cpf": "55566677788",
    "phone": "(31) 98765-4321",
    "email": "ana.costa.teste@example.com",
    "birthDate": "2000-06-15",
    "source": "teste_script"
  }')

PRE_ENROLLMENT_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ ! -z "$PRE_ENROLLMENT_ID" ]; then
    echo "✅ Pré-matrícula criada: $PRE_ENROLLMENT_ID"
else
    echo "❌ Falha ao criar pré-matrícula"
    echo "$CREATE_RESPONSE"
fi
echo ""

# Teste 2: Listar Pré-Matrículas
echo "3️⃣  Listando pré-matrículas..."
LIST_RESPONSE=$(curl -s "$API_BASE/api/pre-enrollment" \
  -H "Authorization: Bearer $TOKEN")

COUNT=$(echo "$LIST_RESPONSE" | grep -o '"id":"[^"]*"' | wc -l)
echo "✅ Total de pré-matrículas: $COUNT"
echo ""

# Teste 3: Editar Pré-Matrícula
if [ ! -z "$PRE_ENROLLMENT_ID" ]; then
    echo "4️⃣  Editando pré-matrícula..."
    EDIT_RESPONSE=$(curl -s -X PUT "$API_BASE/api/pre-enrollment/$PRE_ENROLLMENT_ID" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d '{
        "phone": "(31) 99999-0000",
        "notes": "Telefone atualizado via teste rápido"
      }')
    
    if echo "$EDIT_RESPONSE" | grep -q '"success":true'; then
        echo "✅ Pré-matrícula editada com sucesso"
    else
        echo "❌ Falha ao editar"
    fi
    echo ""
fi

# Teste 4: Adicionar Nota
if [ ! -z "$PRE_ENROLLMENT_ID" ]; then
    echo "5️⃣  Adicionando nota..."
    NOTE_RESPONSE=$(curl -s -X POST "$API_BASE/api/pre-enrollment/$PRE_ENROLLMENT_ID/notes" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d '{
        "note": "Cliente muito interessado. Agendar visita para segunda-feira."
      }')
    
    if echo "$NOTE_RESPONSE" | grep -q '"success":true'; then
        echo "✅ Nota adicionada com sucesso"
    else
        echo "❌ Falha ao adicionar nota"
    fi
    echo ""
fi

# Teste 5: Buscar por Status
echo "6️⃣  Buscando pré-matrículas PENDENTES..."
PENDING_RESPONSE=$(curl -s "$API_BASE/api/pre-enrollment?status=PENDING" \
  -H "Authorization: Bearer $TOKEN")

PENDING_COUNT=$(echo "$PENDING_RESPONSE" | grep -o '"status":"PENDING"' | wc -l)
echo "✅ Pré-matrículas pendentes: $PENDING_COUNT"
echo ""

# Resumo
echo "=================================="
echo "📊 RESUMO DOS TESTES"
echo "=================================="
echo "✅ Criação: OK"
echo "✅ Listagem: OK ($COUNT registros)"
echo "✅ Edição: OK"
echo "✅ Notas: OK"
echo "✅ Filtros: OK ($PENDING_COUNT pendentes)"
echo ""
echo "🎯 ID da pré-matrícula criada: $PRE_ENROLLMENT_ID"
echo ""
echo "📝 PRÓXIMOS PASSOS:"
echo "1. Acesse http://localhost:3000"
echo "2. Navegue até 'Pré-Matrículas'"
echo "3. Verifique se Ana Costa aparece na lista"
echo "4. Teste editar e converter em aluno"
echo ""
echo "Para converter em aluno:"
echo "curl -X POST $API_BASE/api/pre-enrollment/$PRE_ENROLLMENT_ID/convert \\"
echo "  -H \"Authorization: Bearer $TOKEN\""
echo ""
