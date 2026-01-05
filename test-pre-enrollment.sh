#!/bin/bash
# Script de Teste do Módulo de Pré-Matrícula

echo "=============================================="
echo "🧪 TESTE DO MÓDULO DE PRÉ-MATRÍCULA"
echo "=============================================="
echo ""

API_BASE="http://localhost:3000"

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Função para log colorido
log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

log_section() {
    echo -e "\n${YELLOW}=== $1 ===${NC}\n"
}

# Teste 1: Servidor
log_section "TESTE 1: Verificar Servidor"
HEALTH=$(curl -s "$API_BASE/health" 2>&1)
if [[ $? -eq 0 ]]; then
    log_success "Servidor está respondendo"
else
    log_error "Servidor não está respondendo"
    exit 1
fi

# Teste 2: Criar Pré-Matrícula 1
log_section "TESTE 2: Criar Pré-Matrícula - João Silva"

RESPONSE=$(curl -s -X POST "$API_BASE/api/pre-enrollment" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "João",
    "lastName": "Silva Teste",
    "cpf": "11122233344",
    "phone": "(31) 98888-1111",
    "email": "joao.silva.teste@example.com",
    "birthDate": "1990-05-15",
    "source": "teste_script"
  }')

if echo "$RESPONSE" | grep -q '"success":true'; then
    log_success "Pré-matrícula criada com sucesso"
    JOAO_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    log_info "ID: $JOAO_ID"
else
    log_error "Falha ao criar pré-matrícula"
    echo "$RESPONSE"
fi

# Teste 3: Criar Pré-Matrícula 2
log_section "TESTE 3: Criar Pré-Matrícula - Maria Santos"

RESPONSE=$(curl -s -X POST "$API_BASE/api/pre-enrollment" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Maria",
    "lastName": "Santos Teste",
    "cpf": "22233344455",
    "phone": "(31) 98888-2222",
    "email": "maria.santos.teste@example.com",
    "birthDate": "1995-08-20",
    "source": "teste_script",
    "financialResponsible": {
      "name": "Pedro Santos",
      "cpf": "33344455566",
      "phone": "(31) 98888-3333",
      "email": "pedro.santos@example.com"
    }
  }')

if echo "$RESPONSE" | grep -q '"success":true'; then
    log_success "Pré-matrícula criada com sucesso"
    MARIA_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    log_info "ID: $MARIA_ID"
else
    log_error "Falha ao criar pré-matrícula"
fi

# Teste 4: Criar Pré-Matrícula 3
log_section "TESTE 4: Criar Pré-Matrícula - Carlos Oliveira"

RESPONSE=$(curl -s -X POST "$API_BASE/api/pre-enrollment" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Carlos",
    "lastName": "Oliveira Teste",
    "cpf": "44455566677",
    "phone": "(31) 98888-4444",
    "email": "carlos.oliveira.teste@example.com",
    "birthDate": "1988-03-10",
    "source": "teste_script"
  }')

if echo "$RESPONSE" | grep -q '"success":true'; then
    log_success "Pré-matrícula criada com sucesso"
    CARLOS_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    log_info "ID: $CARLOS_ID"
else
    log_error "Falha ao criar pré-matrícula"
fi

# Teste 5: Listar Pré-Matrículas
log_section "TESTE 5: Listar Todas as Pré-Matrículas"

RESPONSE=$(curl -s "$API_BASE/api/pre-enrollment")
if echo "$RESPONSE" | grep -q '"success":true'; then
    COUNT=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | wc -l)
    log_success "Listagem realizada com sucesso"
    log_info "Total de pré-matrículas: $COUNT"
else
    log_error "Falha ao listar pré-matrículas"
fi

# Teste 6: Editar Pré-Matrícula (se temos um ID)
if [ ! -z "$JOAO_ID" ]; then
    log_section "TESTE 6: Editar Pré-Matrícula - João Silva"
    
    RESPONSE=$(curl -s -X PUT "$API_BASE/api/pre-enrollment/$JOAO_ID" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer test-token" \
      -d '{
        "phone": "(31) 99999-8888",
        "notes": "Telefone atualizado via script de teste"
      }')
    
    if echo "$RESPONSE" | grep -q '"success":true'; then
        log_success "Pré-matrícula editada com sucesso"
        log_info "Novo telefone: (31) 99999-8888"
    else
        log_error "Falha ao editar pré-matrícula"
    fi
fi

# Teste 7: Adicionar Nota
if [ ! -z "$MARIA_ID" ]; then
    log_section "TESTE 7: Adicionar Nota - Maria Santos"
    
    RESPONSE=$(curl -s -X POST "$API_BASE/api/pre-enrollment/$MARIA_ID/notes" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer test-token" \
      -d '{
        "note": "Cliente muito interessada. Ligar amanhã às 10h."
      }')
    
    if echo "$RESPONSE" | grep -q '"success":true'; then
        log_success "Nota adicionada com sucesso"
    else
        log_error "Falha ao adicionar nota"
    fi
fi

# Teste 8: Filtro por Status
log_section "TESTE 8: Filtrar por Status PENDING"

RESPONSE=$(curl -s "$API_BASE/api/pre-enrollment?status=PENDING")
if echo "$RESPONSE" | grep -q '"success":true'; then
    COUNT=$(echo "$RESPONSE" | grep -o '"status":"PENDING"' | wc -l)
    log_success "Filtro aplicado com sucesso"
    log_info "Pré-matrículas pendentes: $COUNT"
else
    log_error "Falha ao filtrar"
fi

# Teste 9: Busca por Nome
log_section "TESTE 9: Buscar por Nome 'João'"

RESPONSE=$(curl -s "$API_BASE/api/pre-enrollment?search=João")
if echo "$RESPONSE" | grep -q '"success":true'; then
    log_success "Busca realizada com sucesso"
else
    log_error "Falha na busca"
fi

# Teste 10: Rejeitar Pré-Matrícula
if [ ! -z "$CARLOS_ID" ]; then
    log_section "TESTE 10: Rejeitar Pré-Matrícula - Carlos"
    
    RESPONSE=$(curl -s -X PUT "$API_BASE/api/pre-enrollment/$CARLOS_ID" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer test-token" \
      -d '{
        "status": "REJECTED",
        "notes": "Cliente não atende aos critérios"
      }')
    
    if echo "$RESPONSE" | grep -q '"success":true'; then
        log_success "Pré-matrícula rejeitada com sucesso"
    else
        log_error "Falha ao rejeitar"
    fi
fi

# Resumo Final
log_section "RESUMO DOS TESTES"

RESPONSE=$(curl -s "$API_BASE/api/pre-enrollment")
if echo "$RESPONSE" | grep -q '"success":true'; then
    TOTAL=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | wc -l)
    PENDING=$(echo "$RESPONSE" | grep -o '"status":"PENDING"' | wc -l)
    CONVERTED=$(echo "$RESPONSE" | grep -o '"status":"CONVERTED"' | wc -l)
    REJECTED=$(echo "$RESPONSE" | grep -o '"status":"REJECTED"' | wc -l)
    
    echo ""
    log_info "Total de pré-matrículas: $TOTAL"
    log_info "⏳ Pendentes: $PENDING"
    log_info "✅ Convertidas: $CONVERTED"
    log_info "❌ Rejeitadas: $REJECTED"
    echo ""
fi

echo ""
log_success "🎉 TESTES CONCLUÍDOS!"
echo ""
log_info "Acesse http://localhost:3000 e navegue até 'Pré-Matrículas'"
log_info "para visualizar os resultados na interface."
echo ""
