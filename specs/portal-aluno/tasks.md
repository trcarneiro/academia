# Tarefas: Portal do Aluno

**Versão**: 1.0  
**Data**: 30/11/2025  
**Status**: 🟢 PRONTO PARA EXECUÇÃO  
**Base**: `plan.md` v1.0

---

## 📋 ÍNDICE DE FASES

| Fase | Descrição | Duração | Tarefas |
|------|-----------|---------|---------|
| 0 | MVP de Venda | 5 dias | T000-T012 |
| 1 | Dashboard + Login | 5 dias | T013-T024 |
| 2 | Pagamentos + Agenda | 10 dias | T025-T040 |
| 3 | Cursos + Gamificação | 10 dias | T041-T052 |
| 4 | Assistente IA | 5 dias | T053-T060 |
| 5 | Polish + PWA | 5 dias | T061-T068 |

**Nota**: T006 foi dividido em T006a (validação) e T006b (teste E2E).

---

## 🚀 FASE 0: MVP DE VENDA (5 dias)

> **Objetivo**: Link de venda funcionando. Aluno cadastra, paga PIX, recebe confirmação.

### Pré-requisitos (antes de iniciar)

#### T000: Definir Planos e Preços
**Prioridade**: 🔴 CRÍTICA  
**Estimativa**: 1h  
**Responsável**: Gestão da Academia  

**Descrição**:
Definir os planos que serão oferecidos na landing page.

**Checklist**:
- [ ] Plano Mensal: R$ ___/mês
- [ ] Plano Trimestral: R$ ___/mês (___% desconto)
- [ ] Plano Anual: R$ ___/mês (___% desconto)
- [ ] Cadastrar planos no banco (tabela Package)

---

#### T000b: Configurar WhatsApp (OPCIONAL)
**Prioridade**: 🟢 OPCIONAL para Fase 0  
**Estimativa**: 2h  

**Descrição**:
Configurar Z-API ou Twilio para envio de mensagens WhatsApp. **NÃO é bloqueante para Fase 0** - confirmação pode ser apenas por email/tela.

**Se configurar**:
- [ ] Criar conta Z-API (https://z-api.io)
- [ ] Obter token de acesso
- [ ] Adicionar ao `.env`: `ZAPI_TOKEN=xxx`, `ZAPI_INSTANCE=xxx`
- [ ] Testar envio de mensagem

**Se NÃO configurar**:
- [ ] Página de sucesso mostra link WhatsApp manual para contato
- [ ] Implementar WhatsApp na Fase 1 com Magic Link

---

### Backend

#### T001: Migração Prisma - Novas Tabelas [P] ✅
**Prioridade**: 🔴 CRÍTICA  
**Estimativa**: 2h  
**Status**: ✅ CONCLUÍDO (30/11/2025)
**Arquivos**:
- `prisma/schema.prisma`
- `scripts/apply-portal-migration-v2.mjs`

**Descrição**:
Adicionar tabelas `StudentSession`, `StudentNotification` e campos extras em `Student` e `Payment`.

**Critérios de Aceite**:
- [x] Migração roda sem erros
- [x] Tabelas criadas no banco
- [x] Prisma Client gerado

**Implementação**:
- Adicionados modelos `StudentSession` e `StudentNotification` ao schema
- Criados enums `StudentNotificationType` e `NotificationPriority`
- Adicionadas relações no modelo `Student`
- Script de migração: `scripts/apply-portal-migration-v2.mjs`

---

#### T002: Endpoint de Cadastro - POST /api/portal/register ✅
**Prioridade**: 🔴 CRÍTICA  
**Estimativa**: 3h  
**Status**: ✅ CONCLUÍDO (01/12/2025)
**Dependências**: T001  
**Arquivos**:
- `src/routes/portal/auth.ts`
- `src/services/portal/authService.ts`

**Descrição**:
Criar endpoint de cadastro com validação de CPF único, hash de senha, criação de customer no Asaas.

**Input**:
```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "phone": "11999999999",
  "cpf": "12345678900",
  "password": "senha123",
  "organizationId": "uuid"
}
```

**Output**:
```json
{
  "success": true,
  "student": { "id": "...", "name": "...", "email": "..." },
  "token": "jwt..."
}
```

**Critérios de Aceite**:
- [x] Validação Fastify Schema dos campos
- [x] CPF único (retorna erro se já existe)
- [x] Email único  
- [x] Senha com hash bcrypt
- [ ] Customer criado no Asaas (pendente - T003)
- [x] JWT retornado

**Implementação**:
- Endpoint: POST `/api/portal/auth/register`
- Schema validation com Fastify JSON Schema
- bcrypt com salt rounds 10
- JWT com 7 dias de expiração
- Criação de User + Student em transação
- Notificação de boas-vindas criada automaticamente
- Sessão criada (StudentSession)

**Testes Validados**:
- ✅ Cadastro retorna status 201
- ✅ Token JWT válido gerado
- ✅ Login funciona com credenciais criadas
- ✅ Verify-token valida token corretamente
- ✅ Magic-link request gera código

---

#### T003: Serviço de Criação de Cobrança Asaas [P]
**Prioridade**: 🔴 CRÍTICA  
**Estimativa**: 3h  
**Dependências**: T001  
**Arquivos**:
- `src/services/portal/paymentService.ts`

**Descrição**:
Serviço para criar cobrança PIX no Asaas e obter QR Code.

**Funções**:
- `createPixCharge(studentId, amount, description, dueDate)`
- `getChargeStatus(chargeId)`

**Critérios de Aceite**:
- [ ] Cobrança criada no Asaas
- [ ] QR Code PIX retornado
- [ ] IDs salvos no Payment local

---

#### T004: Endpoint Criar Cobrança - POST /api/portal/payments/create
**Prioridade**: 🔴 CRÍTICA  
**Estimativa**: 2h  
**Dependências**: T002, T003  
**Arquivos**:
- `src/routes/portal/payments.ts`

**Descrição**:
Endpoint para criar cobrança após cadastro.

**Input**:
```json
{
  "planId": "uuid",
  "billingType": "PIX"
}
```

**Output**:
```json
{
  "success": true,
  "payment": {
    "id": "...",
    "amount": 199.00,
    "pixCode": "00020126...",
    "qrCode": "data:image/png;base64,..."
  }
}
```

**Critérios de Aceite**:
- [ ] Cobrança criada no Asaas
- [ ] Payment salvo localmente
- [ ] QR Code retornado

---

#### T005: Endpoint Status Pagamento - GET /api/portal/payments/:id/status [P]
**Prioridade**: 🟡 ALTA  
**Estimativa**: 1h  
**Dependências**: T004  
**Arquivos**:
- `src/routes/portal/payments.ts`

**Descrição**:
Verificar status do pagamento (para polling no frontend).

**Output**:
```json
{
  "status": "PENDING" | "CONFIRMED" | "RECEIVED",
  "paidAt": "2025-11-30T..."
}
```

---

#### T006a: Validar Webhook Asaas Existente [P]
**Prioridade**: 🔴 CRÍTICA  
**Estimativa**: 1h  
**Arquivos**:
- `src/routes/financial.ts`

**Descrição**:
Revisar código do webhook em `/api/financial/webhooks/asaas` e garantir que processa eventos corretamente.

**Critérios de Aceite**:
- [ ] Webhook processa evento PAYMENT_RECEIVED
- [ ] Payment.status atualizado para PAID
- [ ] Payment.paidAt preenchido
- [ ] Logs adequados para debug

---

#### T006b: Teste End-to-End do Webhook Asaas
**Prioridade**: 🔴 CRÍTICA  
**Estimativa**: 2h  
**Dependências**: T006a, T004  
**Arquivos**:
- `tests/portal/webhook-asaas.test.ts`
- Script de teste manual

**Descrição**:
Testar fluxo completo: criar cobrança → pagar no Asaas → webhook recebido → Payment atualizado.

**Critérios de Aceite**:
- [ ] Teste com cobrança real no ambiente de produção (valor mínimo R$1)
- [ ] Webhook recebido em menos de 5 minutos após pagamento
- [ ] Frontend atualiza status corretamente via polling
- [ ] Documentar URL do webhook para configurar no painel Asaas

**Nota**: URL do webhook a configurar no Asaas: `https://seu-dominio.com/api/financial/webhooks/asaas`

---

#### T007: Router Principal Portal [P] ✅
**Prioridade**: 🔴 CRÍTICA  
**Estimativa**: 1h  
**Status**: ✅ CONCLUÍDO (01/12/2025)
**Arquivos**:
- `src/routes/portal/index.ts`
- `src/app.ts`

**Descrição**:
Registrar rotas do portal no Fastify.

**Implementação**:
- Criado `src/routes/portal/index.ts` com registro de authRoutes
- Registrado em app.ts com prefix `/api/portal`
- Rotas disponíveis:
  - POST `/api/portal/auth/register`
  - POST `/api/portal/auth/login`
  - POST `/api/portal/auth/magic-link/request`
  - POST `/api/portal/auth/magic-link/verify`
  - POST `/api/portal/auth/verify-token`
  - POST `/api/portal/auth/logout`

---

### Frontend

#### T008: Estrutura Base do Portal [P]
**Prioridade**: 🔴 CRÍTICA  
**Estimativa**: 2h  
**Arquivos**:
- `public/portal/index.html`
- `public/js/portal/app.js`
- `public/js/portal/router.js`
- `public/js/portal/api.js`
- `public/css/portal/base.css`

**Descrição**:
Criar estrutura SPA do portal com router hash-based.

**Critérios de Aceite**:
- [ ] index.html carrega app.js
- [ ] Router funciona (#/landing, #/register, etc)
- [ ] API client configurado
- [ ] CSS base com tokens

---

#### T009: Landing Page - Planos
**Prioridade**: 🔴 CRÍTICA  
**Estimativa**: 3h  
**Dependências**: T008  
**Arquivos**:
- `public/js/portal/pages/landing.js`
- `public/css/portal/pages/landing.css`

**Descrição**:
Página de vendas com planos e preços. Design mobile-first, cores premium.

**Elementos**:
- Hero com chamada
- Cards de planos (Mensal, Trimestral, Anual)
- Botão "Começar Agora"
- Benefícios listados

---

#### T010: Formulário de Cadastro
**Prioridade**: 🔴 CRÍTICA  
**Estimativa**: 3h  
**Dependências**: T002, T008  
**Arquivos**:
- `public/js/portal/pages/register.js`
- `public/css/portal/pages/register.css`

**Descrição**:
Formulário de cadastro com validação frontend.

**Campos**:
- Nome completo
- Email
- Celular (máscara)
- CPF (máscara + validação)
- Senha

**Critérios de Aceite**:
- [ ] Máscaras de input funcionando
- [ ] Validação CPF (dígitos verificadores)
- [ ] Mensagens de erro claras
- [ ] Loading durante submit
- [ ] Redireciona para checkout após sucesso

---

#### T011: Tela de Pagamento PIX
**Prioridade**: 🔴 CRÍTICA  
**Estimativa**: 3h  
**Dependências**: T004, T010  
**Arquivos**:
- `public/js/portal/pages/checkout.js`
- `public/css/portal/pages/checkout.css`

**Descrição**:
Exibir QR Code PIX e código copia-e-cola.

**Elementos**:
- Resumo do pedido
- QR Code grande
- Botão "Copiar código PIX"
- Timer de expiração
- Polling de status (a cada 5s)
- Redireciona para success quando pago

---

#### T012: Tela de Sucesso
**Prioridade**: 🔴 CRÍTICA  
**Estimativa**: 2h  
**Dependências**: T011  
**Arquivos**:
- `public/js/portal/pages/success.js`
- `public/css/portal/pages/success.css`

**Descrição**:
Confirmação de pagamento com próximos passos.

**Elementos**:
- ✅ Animação de sucesso
- "Bem-vindo à família Krav Maga!"
- Primeira aula (data/hora/local)
- O que trazer
- Botão WhatsApp para contato
- Link para acessar portal (futuro)

---

## 📱 FASE 1: DASHBOARD + LOGIN (5 dias)

### Backend

#### T013: Endpoint Login - POST /api/portal/login [P] ✅
**Prioridade**: 🟡 ALTA  
**Estimativa**: 2h  
**Status**: ✅ CONCLUÍDO (01/12/2025)
**Dependências**: T002  
**Arquivos**:
- `src/routes/portal/auth.ts`
- `src/services/portal/authService.ts`

**Descrição**:
Login com email/senha.

**Implementação**:
- Endpoint: POST `/api/portal/auth/login`
- Validação de credenciais com bcrypt
- Retorna JWT + dados do aluno
- Cria sessão ativa (StudentSession)
- Atualiza lastLoginAt no User

---

#### T014: Endpoint Magic Link - POST /api/portal/magic-link [P] ✅
**Prioridade**: 🟡 ALTA  
**Estimativa**: 3h  
**Status**: ✅ CONCLUÍDO (01/12/2025)
**Dependências**: T001  
**Arquivos**:
- `src/routes/portal/auth.ts`
- `src/services/portal/authService.ts`

**Descrição**:
Gerar código de 6 dígitos e enviar via WhatsApp (Z-API).

**Implementação**:
- Endpoint: POST `/api/portal/auth/magic-link/request`
- Gera código 6 dígitos
- Expira em 5 minutos
- Cria sessão pendente (isActive=false)
- Log do código para debug (TODO: enviar via Z-API)

---

#### T015: Endpoint Verificar Código - POST /api/portal/verify-code [P] ✅
**Prioridade**: 🟡 ALTA  
**Estimativa**: 2h  
**Status**: ✅ CONCLUÍDO (01/12/2025)
**Dependências**: T014  
**Arquivos**:
- `src/routes/portal/auth.ts`

**Implementação**:
- Endpoint: POST `/api/portal/auth/magic-link/verify`
- Valida código e expiração
- Ativa sessão
- Retorna JWT + dados do aluno

---

#### T016: Middleware de Autenticação Portal [P]
**Prioridade**: 🟡 ALTA  
**Estimativa**: 2h  
**Arquivos**:
- `src/middlewares/portalAuth.ts`

**Descrição**:
Validar JWT com type='portal' e extrair studentId.

---

#### T017: Endpoint Dashboard - GET /api/portal/dashboard
**Prioridade**: 🟡 ALTA  
**Estimativa**: 3h  
**Dependências**: T016  
**Arquivos**:
- `src/routes/portal/dashboard.ts`

**Descrição**:
Retornar dados resumidos: próxima aula, status financeiro, frequência, progresso.

---

#### T018: Endpoint Perfil - GET/PUT /api/portal/profile [P]
**Prioridade**: 🟡 ALTA  
**Estimativa**: 2h  
**Dependências**: T016  
**Arquivos**:
- `src/routes/portal/profile.ts`

---

### Frontend

#### T019: Página de Login [P]
**Prioridade**: 🟡 ALTA  
**Estimativa**: 3h  
**Arquivos**:
- `public/js/portal/pages/login.js`

---

#### T020: Fluxo Magic Link [P]
**Prioridade**: 🟡 ALTA  
**Estimativa**: 3h  
**Dependências**: T014, T015  
**Arquivos**:
- `public/js/portal/pages/magic-link.js`

---

#### T021: Componente Header/Nav [P]
**Prioridade**: 🟡 ALTA  
**Estimativa**: 2h  
**Arquivos**:
- `public/js/portal/components/header.js`
- `public/js/portal/components/nav-bottom.js`

---

#### T022: Dashboard Principal
**Prioridade**: 🟡 ALTA  
**Estimativa**: 4h  
**Dependências**: T017, T021  
**Arquivos**:
- `public/js/portal/pages/dashboard.js`

---

#### T023: Página de Perfil
**Prioridade**: 🟡 ALTA  
**Estimativa**: 3h  
**Dependências**: T018  
**Arquivos**:
- `public/js/portal/pages/profile.js`

---

#### T024: Componentes Reutilizáveis [P]
**Prioridade**: 🟡 ALTA  
**Estimativa**: 2h  
**Arquivos**:
- `public/js/portal/components/loading.js`
- `public/js/portal/components/empty-state.js`
- `public/js/portal/components/toast.js`

---

## 💳 FASE 2: PAGAMENTOS + AGENDA (10 dias)

### Backend

#### T025: Endpoint Listar Faturas - GET /api/portal/payments [P]
**Prioridade**: 🟡 ALTA  
**Estimativa**: 2h  
**Dependências**: T016  
**Arquivos**:
- `src/routes/portal/payments.ts`

---

#### T026: Endpoint Detalhes Fatura - GET /api/portal/payments/:id [P]
**Prioridade**: 🟡 ALTA  
**Estimativa**: 1h  
**Arquivos**:
- `src/routes/portal/payments.ts`

---

#### T027: Endpoint Gerar PIX - POST /api/portal/payments/:id/pix [P]
**Prioridade**: 🟡 ALTA  
**Estimativa**: 2h  
**Arquivos**:
- `src/routes/portal/payments.ts`

---

#### T028: Endpoint Gerar Boleto - POST /api/portal/payments/:id/boleto [P]
**Prioridade**: 🟢 MÉDIA  
**Estimativa**: 2h  
**Arquivos**:
- `src/routes/portal/payments.ts`

---

#### T029: Endpoint Minhas Turmas - GET /api/portal/enrollments [P]
**Prioridade**: 🟡 ALTA  
**Estimativa**: 2h  
**Dependências**: T016  
**Arquivos**:
- `src/routes/portal/schedule.ts`

---

#### T030: Endpoint Calendário - GET /api/portal/schedule [P]
**Prioridade**: 🟡 ALTA  
**Estimativa**: 3h  
**Arquivos**:
- `src/routes/portal/schedule.ts`

---

#### T031: Endpoint Horários Disponíveis - GET /api/portal/available-slots [P]
**Prioridade**: 🟡 ALTA  
**Estimativa**: 3h  
**Arquivos**:
- `src/routes/portal/schedule.ts`

---

#### T032: Endpoint Agendar Aula - POST /api/portal/bookings [P]
**Prioridade**: 🟡 ALTA  
**Estimativa**: 3h  
**Arquivos**:
- `src/routes/portal/schedule.ts`

---

#### T033: Endpoint Cancelar Agendamento - DELETE /api/portal/bookings/:id [P]
**Prioridade**: 🟡 ALTA  
**Estimativa**: 2h  
**Arquivos**:
- `src/routes/portal/schedule.ts`

---

#### T034: Endpoint Frequência - GET /api/portal/attendance [P]
**Prioridade**: 🟢 MÉDIA  
**Estimativa**: 2h  
**Arquivos**:
- `src/routes/portal/schedule.ts`

---

### Frontend

#### T035: Página de Faturas
**Prioridade**: 🟡 ALTA  
**Estimativa**: 4h  
**Arquivos**:
- `public/js/portal/pages/payments.js`

---

#### T036: Modal de Pagamento [P]
**Prioridade**: 🟡 ALTA  
**Estimativa**: 4h  
**Arquivos**:
- `public/js/portal/components/payment-modal.js`

---

#### T037: Página de Agenda/Turmas
**Prioridade**: 🟡 ALTA  
**Estimativa**: 4h  
**Arquivos**:
- `public/js/portal/pages/schedule.js`

---

#### T038: Componente Calendário [P]
**Prioridade**: 🟡 ALTA  
**Estimativa**: 4h  
**Arquivos**:
- `public/js/portal/components/calendar.js`

---

#### T039: Modal de Agendamento [P]
**Prioridade**: 🟡 ALTA  
**Estimativa**: 3h  
**Arquivos**:
- `public/js/portal/components/booking-modal.js`

---

#### T040: Página de Frequência
**Prioridade**: 🟢 MÉDIA  
**Estimativa**: 3h  
**Arquivos**:
- `public/js/portal/pages/attendance.js`

---

## 📚 FASE 3: CURSOS + GAMIFICAÇÃO (10 dias)

### Backend

#### T041: Endpoint Jornada - GET /api/portal/journey [P]
**Prioridade**: 🟢 MÉDIA  
**Estimativa**: 3h  
**Arquivos**:
- `src/routes/portal/courses.ts`

---

#### T042: Endpoint Módulos - GET /api/portal/modules [P]
**Prioridade**: 🟢 MÉDIA  
**Estimativa**: 2h  
**Arquivos**:
- `src/routes/portal/courses.ts`

---

#### T043: Endpoint Técnicas - GET /api/portal/techniques [P]
**Prioridade**: 🟢 MÉDIA  
**Estimativa**: 2h  
**Arquivos**:
- `src/routes/portal/courses.ts`

---

#### T044: Endpoint Completar Técnica - POST /api/portal/techniques/:id/complete [P]
**Prioridade**: 🟢 MÉDIA  
**Estimativa**: 2h  
**Arquivos**:
- `src/routes/portal/courses.ts`

---

#### T045: Endpoint Conquistas - GET /api/portal/achievements [P]
**Prioridade**: 🟢 MÉDIA  
**Estimativa**: 2h  
**Arquivos**:
- `src/routes/portal/courses.ts`

---

#### T046: Serviço de Gamificação [P]
**Prioridade**: 🟢 MÉDIA  
**Estimativa**: 4h  
**Arquivos**:
- `src/services/portal/gamificationService.ts`

---

### Frontend

#### T047: Página de Jornada
**Prioridade**: 🟢 MÉDIA  
**Estimativa**: 4h  
**Arquivos**:
- `public/js/portal/pages/journey.js`

---

#### T048: Página de Módulos/Técnicas
**Prioridade**: 🟢 MÉDIA  
**Estimativa**: 4h  
**Arquivos**:
- `public/js/portal/pages/techniques.js`

---

#### T049: Player de Vídeo [P]
**Prioridade**: 🟢 MÉDIA  
**Estimativa**: 3h  
**Arquivos**:
- `public/js/portal/components/video-player.js`

---

#### T050: Componente de Progresso [P]
**Prioridade**: 🟢 MÉDIA  
**Estimativa**: 2h  
**Arquivos**:
- `public/js/portal/components/progress-bar.js`

---

#### T051: Página de Conquistas
**Prioridade**: 🟢 MÉDIA  
**Estimativa**: 3h  
**Arquivos**:
- `public/js/portal/pages/achievements.js`

---

#### T052: Componente de Badge [P]
**Prioridade**: 🟢 MÉDIA  
**Estimativa**: 2h  
**Arquivos**:
- `public/js/portal/components/badge.js`

---

## 🤖 FASE 4: ASSISTENTE IA (5 dias)

### Backend

#### T053: Endpoint Chat - POST /api/portal/chat [P]
**Prioridade**: 🟢 MÉDIA  
**Estimativa**: 4h  
**Arquivos**:
- `src/routes/portal/chat.ts`

---

#### T054: Serviço de Chat com Gemini [P]
**Prioridade**: 🟢 MÉDIA  
**Estimativa**: 4h  
**Arquivos**:
- `src/services/portal/chatService.ts`

---

#### T055: Ações Automáticas do Chat [P]
**Prioridade**: 🟢 MÉDIA  
**Estimativa**: 4h  
**Arquivos**:
- `src/services/portal/chatActionsService.ts`

---

#### T056: Histórico de Conversas [P]
**Prioridade**: 🟢 MÉDIA  
**Estimativa**: 2h  
**Arquivos**:
- Migração Prisma (ChatHistory)
- `src/routes/portal/chat.ts`

---

### Frontend

#### T057: Interface de Chat
**Prioridade**: 🟢 MÉDIA  
**Estimativa**: 4h  
**Arquivos**:
- `public/js/portal/pages/chat.js`

---

#### T058: Componente de Mensagem [P]
**Prioridade**: 🟢 MÉDIA  
**Estimativa**: 2h  
**Arquivos**:
- `public/js/portal/components/chat-message.js`

---

#### T059: Botões de Ação Rápida [P]
**Prioridade**: 🟢 MÉDIA  
**Estimativa**: 2h  
**Arquivos**:
- `public/js/portal/components/quick-actions.js`

---

#### T060: Sugestões Contextuais [P]
**Prioridade**: 🟢 MÉDIA  
**Estimativa**: 2h  
**Arquivos**:
- `public/js/portal/components/suggestions.js`

---

## ✨ FASE 5: POLISH + PWA (5 dias)

#### T061: Configuração PWA Completa [P]
**Prioridade**: 🟢 MÉDIA  
**Estimativa**: 3h  
**Arquivos**:
- `public/portal/manifest.json`
- `public/portal/sw.js`

---

#### T062: Service Worker Avançado [P]
**Prioridade**: 🟢 MÉDIA  
**Estimativa**: 3h  
**Arquivos**:
- `public/portal/sw.js`

---

#### T063: Push Notifications [P]
**Prioridade**: 🟢 MÉDIA  
**Estimativa**: 4h  
**Arquivos**:
- `src/services/portal/pushService.ts`
- `public/js/portal/push.js`

---

#### T064: Endpoint Notificações - GET/PUT /api/portal/notifications [P]
**Prioridade**: 🟢 MÉDIA  
**Estimativa**: 2h  
**Arquivos**:
- `src/routes/portal/notifications.ts`

---

#### T065: Página de Notificações
**Prioridade**: 🟢 MÉDIA  
**Estimativa**: 3h  
**Arquivos**:
- `public/js/portal/pages/notifications.js`

---

#### T066: QR Code no Totem [P]
**Prioridade**: 🟢 MÉDIA  
**Estimativa**: 2h  
**Arquivos**:
- Integração com sistema de kiosk existente

---

#### T067: Testes E2E [P]
**Prioridade**: 🟡 ALTA  
**Estimativa**: 4h  
**Arquivos**:
- `tests/portal/`

---

#### T068: Deploy e Configuração Final
**Prioridade**: 🔴 CRÍTICA  
**Estimativa**: 3h  
**Arquivos**:
- Configuração nginx/vercel
- Subdomínio aluno.xxx.com

---

## 📊 RESUMO

| Fase | Tarefas | Estimativa Total |
|------|---------|------------------|
| 0 - MVP Venda | 12 | 28h (~5 dias) |
| 1 - Dashboard | 12 | 30h (~5 dias) |
| 2 - Pagamentos | 16 | 42h (~8 dias) |
| 3 - Cursos | 12 | 32h (~6 dias) |
| 4 - Chat IA | 8 | 24h (~4 dias) |
| 5 - Polish | 8 | 24h (~4 dias) |
| **TOTAL** | **68** | **~180h (~32 dias úteis)** |

---

## 🏷️ LEGENDA

- **[P]** = Pode ser paralelizado com outras tarefas da mesma fase
- 🔴 CRÍTICA = Bloqueia outras tarefas
- 🟡 ALTA = Importante para o fluxo
- 🟢 MÉDIA = Pode ser adiada se necessário

---

**Autor**: GitHub Copilot  
**Data**: 30/11/2025  
**Próximo passo**: Executar `/speckit.analyze` ou iniciar Fase 0
