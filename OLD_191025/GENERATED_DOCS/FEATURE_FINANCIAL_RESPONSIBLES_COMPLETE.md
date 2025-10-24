# 🎯 Recurso: Responsáveis Financeiros - Documentação Completa

**Status**: ✅ **IMPLEMENTADO E TESTÁVEL**
**Data**: 16 de outubro de 2025
**Servidor**: ✅ Rodando em http://localhost:3000

---

## 📋 Resumo Executivo

Feature que permite atribuir um **responsável financeiro** a cada aluno, fazendo com que todas as cobranças de planos e assinaturas sejam roteadas para esse responsável em vez do próprio aluno.

### Casos de Uso
1. **Aluno Menor**: Pai/mãe é responsável financeiro
2. **Aluno Profissional**: Empresa é responsável (representante financeiro)
3. **Programa Corporativo**: Múltiplos responsáveis por grupo de alunos

---

## 🏗️ Arquitetura Implementada

### Backend (TypeScript + Fastify)

#### Endpoints Criados

**1. GET `/api/students/financial-responsibles`**
```
Descrição: Listar todos os responsáveis financeiros da organização
Método: GET
Auth: Header x-organization-id
Resposta:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "organizationId": "uuid",
      "name": "João Silva",
      "email": "joao@example.com",
      "phone": "(31) 99999-9999",
      "createdAt": "2025-10-16T10:00:00.000Z",
      "updatedAt": "2025-10-16T10:00:00.000Z"
    }
  ]
}
```

**2. POST `/api/students/financial-responsibles`**
```
Descrição: Criar novo responsável financeiro
Método: POST
Body:
{
  "name": "João Silva",
  "email": "joao@example.com",
  "phone": "(31) 99999-9999"
}
Resposta:
{
  "success": true,
  "data": { ...financialResponsible object... }
}
```

**3. PATCH `/api/students/:id/financial-responsible`**
```
Descrição: Vincular/desvincular responsável a aluno
Método: PATCH
Body:
{
  "financialResponsibleId": "uuid" // ou null para remover
}
Resposta:
{
  "success": true,
  "data": { ...updated student... }
}
```

#### Integração com Assinaturas

**Arquivo**: `src/routes/packages.ts` (linha ~477)

Quando um plano é contratado para um aluno:
- Se `student.financialResponsibleId` existir → `payerId = student.financialResponsibleId`
- Caso contrário → `payerId = studentId` (padrão)

```typescript
let payerId = studentId;
if (student.financialResponsibleId) {
  payerId = student.financialResponsibleId;
}
// Criar subscription com payerId
```

#### GET Endpoints Modificados

**GET `/api/students/:id`**
- Agora inclui `financialResponsible` object (com nome, email, telefone)
- Exemplo na response:
```json
{
  "financialResponsibleId": "uuid",
  "financialResponsible": {
    "id": "uuid",
    "name": "João Silva",
    "email": "joao@example.com",
    "phone": "(31) 99999-9999"
  }
}
```

**Endpoint de Edição de Assinatura**:
**PATCH `/api/subscriptions/:id`**
```
Descrição: Editar preço, data ou status de assinatura
Método: PATCH
Body:
{
  "currentPrice": 250,
  "startDate": "2025-10-20T00:00:00.000Z",
  "status": "ACTIVE" | "PAUSED" | "CANCELLED"
}
Validação:
- Se status = "ACTIVE": garante que não há outra ACTIVE para o mesmo aluno
- Previne múltiplas assinaturas ativas
Resposta:
{
  "success": true,
  "data": { ...updated subscription... }
}
```

---

### Frontend (Vanilla JavaScript)

#### Localização: `public/js/modules/students/controllers/editor-controller.js`

#### 1. Nova Aba: "Responsável Financeiro"

**Posição**: Entre "Visão Geral" e "Financeiro"
**Ícone**: 👤 `fa-user-tie`
**Data Attribute**: `data-tab="responsible"`

#### 2. Interface UI

```
┌─────────────────────────────────────────────┐
│ 👤 Responsável Financeiro                   │
│                                             │
│ [✅ João Silva (Se houver vinculado)]       │
│ Email: joao@example.com                     │
│ Telefone: (31) 99999-9999                   │
│                                             │
│ ─────────────────────────────────────────── │
│                                             │
│ Alterar Responsável:                        │
│ [Dropdown: Selecionar responsável] [+ Novo] │
│                                             │
│ [Criar Novo Responsável] (oculto por padrão)│
│ Nome: [____________]                        │
│ Email: [____________]                       │
│ Telefone: [____________]                    │
│ [Salvar] [Cancelar]                         │
│                                             │
│ [💾 Salvar Responsável] [❌ Remover Vínculo]│
└─────────────────────────────────────────────┘
```

#### 3. Método: `renderResponsibleTab(studentId)`

**Linhas**: 986-1150 em `editor-controller.js`

**Funcionalidades**:
1. Carrega dados do aluno (com `financialResponsible`)
2. Carrega lista de responsáveis disponíveis
3. Renderiza UI com estado atual
4. Permite:
   - **Criar novo responsável**: Form inline com campos nome, email, telefone
   - **Selecionar responsável**: Dropdown com responsáveis disponíveis
   - **Salvar seleção**: PATCH para vincular responsável ao aluno
   - **Remover vínculo**: PATCH com `financialResponsibleId: null`
5. Notificações toast para feedback

#### 4. Fluxo de Interação

```
1. Usuário clica em aba "Responsável Financeiro"
   ↓
2. Tab event handler dispara renderResponsibleTab(studentId)
   ↓
3. Carrega dados do aluno + lista de responsáveis
   ↓
4. Renderiza UI:
   - Se vinculado: mostra nome, email, telefone
   - Se não vinculado: mostra mensagem vazia
   ↓
5. Usuário pode:
   a) Clicar [+ Novo] para criar novo responsável
      → Form aparece
      → Preenche nome (obrigatório), email, telefone
      → Clica [Salvar]
      → POST /api/students/financial-responsibles
      → Toast de sucesso
      → Aba recarrega
   
   b) Selecionar no dropdown um responsável existente
      → Clica [Salvar Responsável]
      → PATCH /api/students/:id/financial-responsible
      → Toast de sucesso
      → UI atualiza mostrando responsável vinculado
   
   c) Clicar [Remover Vínculo]
      → Confirmação
      → PATCH /api/students/:id/financial-responsible { financialResponsibleId: null }
      → Toast de sucesso
      → UI volta para estado vazio
```

---

## 🧪 Guia de Testes

### Pré-requisitos
✅ Servidor rodando: `npm run dev` (http://localhost:3000)
✅ Browser: http://localhost:3000
✅ Students módulo carregado

### Teste 1: Visualizar Aba

**Passos**:
1. Ir para: Students → Editar um aluno
2. Verificar que aparece aba "👤 Responsável Financeiro"
3. Clicar na aba
4. **Esperado**: Aba carrega com UI mostrando "⚠️ Nenhum Responsável"

**Validação no Console**:
```javascript
// Verificar chamadas de API
console.log(window.app?.logs); // Deve incluir GET /api/students/financial-responsibles
```

---

### Teste 2: Criar Novo Responsável

**Passos**:
1. Na aba "Responsável Financeiro", clicar em botão [+ Novo]
2. Preencher:
   - Nome: "Maria Silva"
   - Email: "maria@example.com"
   - Telefone: "(31) 98888-8888"
3. Clicar [Salvar]
4. **Esperado**: 
   - Toast: "✅ Responsável criado com sucesso!"
   - Aba recarrega
   - Dropdown agora mostra "Maria Silva - maria@example.com"

**Validação**:
```javascript
// Verificar POST request no Network tab
// POST /api/students/financial-responsibles
// Status: 201 ou 200
// Response: { success: true, data: { id: "...", name: "Maria Silva", ... } }
```

---

### Teste 3: Atribuir Responsável a Aluno

**Passos**:
1. Na aba "Responsável Financeiro", dropdown mostra responsáveis
2. Selecionar "Maria Silva"
3. Clicar [💾 Salvar Responsável]
4. **Esperado**:
   - Toast: "✅ Responsável vinculado com sucesso!"
   - UI atualiza mostrando:
     ```
     ✅ Responsável Vinculado
     Maria Silva
     Email: maria@example.com
     Telefone: (31) 98888-8888
     ```

**Validação**:
```javascript
// Verificar PATCH request
// PATCH /api/students/{studentId}/financial-responsible
// Body: { financialResponsibleId: "..." }
// Response: { success: true, data: { ...updated student... } }
```

---

### Teste 4: Verificar Roteamento de Pagamento

**Passos**:
1. Aluno com responsável vinculado (Ex: "Maria Silva")
2. Ir para aba "Financeiro" → criar nova assinatura
3. Escolher plano e "Contratar"
4. **Esperado**:
   - Subscription criada com `payerId = Maria Silva (ID)`
   - Não `payerId = aluno (ID)`

**Validação - Via API**:
```bash
# GET the subscription
curl http://localhost:3000/api/subscriptions/{id} \
  -H "x-organization-id: 452c0b35-1822-4890-851e-922356c812fb"

# Response deve ter
{
  "payerId": "uuid-da-maria-silva",  // Não o ID do aluno
  "studentId": "uuid-do-aluno"
}
```

**Validação - Via Browser**:
1. Abrir DevTools → Network
2. Filtrar por `subscribe` ou `POST /api/packages`
3. Verificar request body:
```json
{
  "planId": "...",
  "studentId": "...",
  // payerId é calculado server-side
}
```
4. Verificar response:
```json
{
  "success": true,
  "data": {
    "payerId": "uuid-da-maria-silva",
    "studentId": "uuid-do-aluno"
  }
}
```

---

### Teste 5: Editar Assinatura

**Passos**:
1. Na aba "Financeiro", encontrar assinatura criada
2. Clicar para editar (se botão disponível)
3. Alterar:
   - Preço: 300 (de 250)
   - Status: PAUSED
4. Salvar
5. **Esperado**:
   - PATCH `/api/subscriptions/{id}` com novo preço e status
   - Toast de sucesso
   - UI atualiza refletindo mudanças

**Validação**:
```javascript
// DevTools → Network
// PATCH /api/subscriptions/{id}
// Body:
{
  "currentPrice": 300,
  "status": "PAUSED"
}
// Response: { success: true, data: { currentPrice: "300", status: "PAUSED" } }
```

---

### Teste 6: Validação - Múltiplas Assinaturas Ativas

**Passos**:
1. Aluno com 1 assinatura ACTIVE
2. Na aba "Financeiro", criar outra assinatura
3. Tentar deixar ambas como ACTIVE
4. **Esperado**: 
   - Erro: "❌ Já existe outra assinatura ativa para este aluno"
   - Sistema impede múltiplas ativas

**Validação**:
```javascript
// DevTools → Network
// POST /api/packages/{id}/subscribe (for second plan)
// Response Status: 400 (Bad Request)
// Response body: { success: false, message: "Já existe outra assinatura ativa..." }
```

---

### Teste 7: Remover Vínculo

**Passos**:
1. Aluno com responsável vinculado
2. Na aba "Responsável Financeiro", clicar [❌ Remover Vínculo]
3. Confirmar remoção
4. **Esperado**:
   - Toast: "✅ Vínculo removido"
   - UI volta para "⚠️ Nenhum Responsável"
   - `financialResponsibleId` do aluno é setado para `null`

**Validação**:
```javascript
// GET /api/students/{studentId}
// Response: { ..., financialResponsibleId: null, financialResponsible: null }
```

---

## 🔧 Troubleshooting

### Problema: Aba "Responsável Financeiro" não carrega
**Causa Provável**: API não respondendo
**Solução**:
1. Verificar se servidor está rodando: `npm run dev`
2. Abrir DevTools → Console
3. Verificar erros de rede (Network tab)
4. Verificar se GET `/api/students/financial-responsibles` retorna 200

### Problema: Criação de responsável falha
**Causa Provável**: Validação de input
**Solução**:
1. Verificar se "Nome" não está vazio
2. Validar formato de email (se preenchido)
3. Verificar console.log para mensagem de erro específica

### Problema: Toast de sucesso não aparece
**Causa Provável**: `window.app.showToast()` não disponível
**Solução**:
1. Verificar se AcademyApp inicializou
2. Verificar console para erros de setup
3. Fallback: Verificar Network tab para confirmar sucesso da API

### Problema: Múltiplas assinaturas ativas foram criadas
**Causa Provável**: Validação não foi executada
**Solução**:
1. Verificar `/api/subscriptions` endpoint
2. Executar manualmente PATCH para atualizar status
3. Relatar bug com IDs específicos

---

## 📊 Métricas de Implementação

| Aspecto | Status | Detalhes |
|---------|--------|----------|
| Backend Routes | ✅ Completo | 3 endpoints implementados em `src/routes/students.ts` |
| Integração Pagamentos | ✅ Completo | `payerId` logic em `src/routes/packages.ts` |
| Frontend UI | ✅ Completo | Aba + form em `editor-controller.js` (linhas 144, 502, 986) |
| API Client | ✅ Completo | Usa `this.api.request()` e toasts |
| Validação | ✅ Completo | Server-side (1 active max), client-side (nome obrigatório) |
| Testes | 🟡 Manual | Guia acima, automados podem ser adicionados |
| Documentação | ✅ Completo | Este arquivo |

---

## 💾 Modelos Afetados (Prisma)

### Novos Modelos
```prisma
model FinancialResponsible {
  id                 String    @id @default(uuid())
  organizationId     String
  name               String
  email              String?
  phone              String?
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
  students           Student[]
  organizationObject Organization @relation(fields: [organizationId], references: [id])
}
```

### Modelos Modificados
```prisma
model Student {
  // ... existing fields ...
  financialResponsibleId String?
  financialResponsible   FinancialResponsible? @relation(fields: [financialResponsibleId], references: [id])
}

model StudentSubscription {
  // ... existing fields ...
  // payerId é calculado em runtime (não armazenado, usa studentId ou financialResponsibleId)
  // Se necessário persistir, adicionar campo: payerId String?
}
```

---

## 🚀 Próximos Passos (Futuro)

1. **Persistir `payerId` em DB**: Adicionar coluna `StudentSubscription.payerId`
2. **Integração Asaas**: Validar que cobranças são roteadas para email correto
3. **Dashboard Financeiro**: Relatório de responsáveis e cobranças vinculadas
4. **Testes Automatizados**: Unit tests para endpoints, E2E para UI
5. **Documentação API**: Swagger documentation completa
6. **Auditoria**: Log de mudanças de responsável

---

## 📞 Suporte

**Arquivo Principal**: `src/routes/students.ts` e `editor-controller.js`
**Database**: PostgreSQL (Prisma ORM)
**API Client**: `public/js/shared/api-client.js`
**UI Framework**: Vanilla JavaScript + Premium CSS Design System

---

**Última atualização**: 16 de outubro de 2025
**Versão**: 1.0 (Completa)
**Servidor**: ✅ Running - Pronto para testes
