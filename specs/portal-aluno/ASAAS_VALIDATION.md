# Validação da Integração Asaas - 29/11/2025

## Status: ⚠️ API Key Inválida

### Configuração Atual

```
Ambiente: PRODUÇÃO
URL Base: https://www.asaas.com/api/v3
API Key: $aact_prod_000M... (formato correto)
```

### Resultado do Teste

```json
{
  "errors": [
    {
      "code": "invalid_access_token",
      "description": "A chave de API fornecida é inválida"
    }
  ]
}
```

### Possíveis Causas

1. **API Key expirada** - Chaves de API podem expirar ou ser revogadas
2. **API Key incorreta** - Pode ter sido copiada incorretamente
3. **Conta Asaas desativada** - A conta pode estar bloqueada
4. **Permissões insuficientes** - A chave pode não ter permissões de leitura

### Ações Necessárias

1. **Acessar o painel Asaas** ([app.asaas.com](https://app.asaas.com))
2. **Ir em Configurações > Integrações > API**
3. **Verificar se a chave está ativa**
4. **Se necessário, gerar uma nova chave**
5. **Atualizar o arquivo `.env`**:
   ```
   ASAAS_API_KEY="nova_chave_aqui"
   ASAAS_IS_SANDBOX=false
   ASAAS_BASE_URL="https://www.asaas.com/api/v3"
   ```

### Código Implementado (Funcionando)

✅ **AsaasService** (`src/services/asaasService.ts`)
- `createCustomer()` - Criar cliente
- `getCustomer()` - Buscar cliente
- `listCustomers()` - Listar clientes
- `createPayment()` - Criar cobrança
- `getPayment()` - Buscar cobrança
- `listPayments()` - Listar cobranças
- `createSubscription()` - Criar assinatura
- `deletePayment()` - Cancelar cobrança

✅ **FinancialService** (`src/services/financialService.ts`)
- `createPaymentForSubscription()` - Criar cobrança para assinatura
- Processamento de webhooks

✅ **Rotas Disponíveis**
- `GET /api/asaas-simple/validate-key` - Validar chave
- `GET /api/asaas-simple/customers` - Listar clientes Asaas
- `POST /api/asaas-simple/sync/customers` - Sincronizar clientes
- `POST /api/financial/webhooks/asaas` - Webhook de notificações

### Próximos Passos Após Validação

1. Gerar nova API Key no Asaas
2. Atualizar `.env` com a nova chave
3. Rodar `node test-asaas-validation.mjs` para confirmar
4. Configurar webhook no painel Asaas: `https://seu-dominio.com/api/financial/webhooks/asaas`
5. Implementar endpoint de criação de cobrança avulsa para Portal do Aluno

---

## Para o Portal do Aluno

Após validar a API Key, precisamos:

### 1. Endpoint de Criação de Cobrança (A CRIAR)

```typescript
// POST /api/portal/payments/create
{
  studentId: 'uuid',
  amount: 150.00,
  description: 'Mensalidade Dezembro 2025',
  dueDate: '2025-12-10',
  billingType: 'PIX' // ou 'BOLETO', 'CREDIT_CARD'
}
```

### 2. Endpoint de Histórico de Pagamentos

```typescript
// GET /api/portal/payments/history?studentId=uuid
{
  success: true,
  data: [
    { id: '...', value: 150, status: 'RECEIVED', dueDate: '...' }
  ]
}
```

### 3. Webhook de Atualização

Já implementado em `/api/financial/webhooks/asaas`, atualiza:
- Status de cobrança local
- Badge no painel do aluno
- Histórico financeiro
