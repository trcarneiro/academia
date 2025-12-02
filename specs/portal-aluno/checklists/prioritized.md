# Checklist Priorizado: Portal do Aluno - Por Criticidade

**Versão**: 1.0  
**Data**: 01/12/2025  
**Tipo**: Unit Tests for Requirements (Priorizado)  
**Profundidade**: Padrão (~35 itens)  
**Propósito**: Validar requisitos em ordem de criticidade - do que mais bloqueia ao menos urgente

---

## 📊 RESUMO EXECUTIVO

| Prioridade | Categoria | Items | Bloqueia Fase |
|------------|-----------|-------|---------------|
| 🔴 P0 | Segurança & Auth | 7 | Fase 0, 1 |
| 🔴 P0 | Integração Asaas | 6 | Fase 0 |
| 🟠 P1 | API/Backend Contracts | 6 | Fase 0, 1, 2 |
| 🟡 P2 | UX/Frontend | 6 | Fase 0, 1 |
| 🟢 P3 | Cenários Alternativos | 5 | Fase 2+ |
| 🔵 P4 | Não-Funcionais | 5 | Fase 5 |
| **TOTAL** | - | **35** | - |

---

## 🔴 P0: BLOQUEANTES IMEDIATOS (13 itens)

> Estes itens DEVEM ser resolvidos antes de iniciar a Fase 0. Qualquer gap aqui bloqueia o MVP de vendas.

### Segurança & Autenticação

- [x] **CHK001** - Está definido o comportamento quando o código Magic Link expira (5 min) ou quando o usuário está no meio da digitação? O que o frontend exibe? [Edge Case, Gap] ✅ Resolvido em spec.md §Decisões Técnicas

- [x] **CHK002** - Os requisitos de rate limiting para endpoints de autenticação (`/register`, `/login`, `/magic-link`) estão definidos com valores concretos (ex: "5 tentativas/minuto/IP")? A spec menciona apenas "5 tentativas por IP/minuto" mas não especifica janela de bloqueio. [Clarity, Spec §Segurança] ✅ Resolvido em spec.md §Decisões Técnicas

- [x] **CHK003** - Existe definição de como invalidar sessões antigas quando o aluno faz login em um novo dispositivo? A spec menciona "listar sessões ativas" mas não define comportamento automático. [Gap, Spec §Segurança] ✅ Resolvido em spec.md §Decisões Técnicas

- [x] **CHK004** - O requisito de senha "mínimo 6 caracteres" na spec conflita com boas práticas de segurança. Deveria exigir complexidade (maiúscula, número, especial)? [Ambiguity, Spec §1.1] ✅ Resolvido: 8+ chars, 1 maiúscula, 1 número

- [x] **CHK005** - O campo `email` no modelo `Student` é `@unique` globalmente, mas o sistema é multi-tenant. Deveria ser `@@unique([email, organizationId])`? [Conflict, Spec §Modelo vs Multi-tenant] ✅ Resolvido em spec.md §Decisões Técnicas

- [x] **CHK006** - Há conflito entre Magic Link "sem senha" e campo senha obrigatório no cadastro. Se aluno cadastra SEM senha (só Magic Link), como faz login tradicional depois? [Conflict, Spec §1.1 vs §1.3] ✅ Resolvido: senha opcional, Magic Link prioritário

- [ ] **CHK007** - O JWT payload inclui `type: 'portal'` para diferenciar de admin. Mas se o mesmo User tem ambos os acessos (admin + aluno), qual token prevalece? [Gap, Plan §JWT] ⏳ Adiado: cenário raro, resolver na Fase 2

### Integração Asaas

- [x] **CHK008** - Está especificado o comportamento quando a API do Asaas retorna erro 500 ou timeout durante criação de cobrança? O cadastro deve falhar? Retry automático? Salvar para retry manual? [Exception Flow, Gap] ✅ Resolvido: fallback com PENDING_CREATION

- [ ] **CHK009** - O webhook Asaas existente em `/api/financial/webhooks/asaas` processa apenas `PAYMENT_RECEIVED`? A spec menciona outros eventos (OVERDUE, CANCELLED) que podem ser necessários. [Completeness, Tasks §T006a] ⏳ Em implementação no paymentService.ts

- [x] **CHK010** - O QR Code PIX tem expiração definida? A spec mostra "⏱️ Este código expira em: 23:45:30" mas não define quanto tempo é válido (24h? 30min? configurável?). [Clarity, Spec §5.1] ✅ Resolvido: 30 minutos

- [ ] **CHK011** - Existe definição para tratamento de pagamento duplicado? Se aluno paga 2x a mesma fatura (erro no app do banco), qual o comportamento? [Edge Case, Gap] ⏳ Resolvido: Asaas gerencia automaticamente

- [x] **CHK012** - O que acontece se o customer já existe no Asaas (CPF já cadastrado por outra academia/organização)? A API retorna erro ou usa o customer existente? [Edge Case, Gap] ✅ Resolvido em spec.md §Decisões Técnicas

- [ ] **CHK013** - Está definido o tempo máximo entre pagamento PIX e atualização no portal? A spec diz "menos de 5 minutos" mas isso depende do polling no frontend - não é garantia. [Measurability, Spec §5.1] ⏳ Webhook + polling 10s = <1 min

---

## 🟠 P1: ALTA PRIORIDADE (6 itens)

> Estes itens afetam a implementação das Fases 0-1. Devem ser resolvidos antes de finalizar o backend.

### Contratos de API

- [x] **CHK014** - Os formatos de resposta de erro estão padronizados? A spec mostra `{ success, error, message }` em alguns lugares e `{ error: string }` em outros. Qual é o padrão? [Consistency, Gap] ✅ Resolvido em spec.md §Formato de Resposta Padrão

- [x] **CHK015** - Os endpoints da spec usam `/api/portal/register` mas a implementação atual usa `/api/portal/auth/register`. Qual é o correto? Atualizar spec ou implementação? [Consistency, Spec §API vs Tasks §T002] ✅ Resolvido: usar /api/portal/auth/*

- [ ] **CHK016** - O campo `passwordHash` no modelo Student é `String?` (opcional). Mas se é opcional, como validar se aluno tem senha configurada antes de permitir login tradicional? [Completeness, Plan §Modelo] ✅ Implementado em authService.ts

- [ ] **CHK017** - Está definido quais campos do perfil são editáveis pelo aluno? CPF provavelmente não, mas e email? Telefone? Alterar requer reverificação? [Clarity, Spec §3] ⏳ Fase 1

- [ ] **CHK018** - Os endpoints de listagem (faturas, notificações, frequência) têm requisitos de paginação? Limite máximo de itens por página? Formato de resposta com total? [Completeness, Gap] ⏳ Fase 2

- [x] **CHK019** - O `organizationId` é extraído do JWT no middleware. Mas na Fase 0 (cadastro), o aluno ainda não tem token. Como identificar a organização? Via subdomain? Query param? [Gap, Plan §Auth] ✅ Resolvido: query param ?org=uuid

---

## 🟡 P2: MÉDIA PRIORIDADE (6 itens)

> Estes itens afetam a experiência do usuário. Devem ser resolvidos antes de finalizar o frontend.

### UX/Frontend

- [ ] **CHK020** - Os três estados de UI (loading, empty, error) estão definidos para cada página? A spec mostra wireframes apenas do estado de sucesso. [Coverage, Gap]

- [ ] **CHK021** - O requisito "mobile-first" está quantificado? Quais breakpoints? A spec menciona "90% acessos pelo celular" mas não define tamanhos mínimos de botão ou espaçamento. [Clarity, Spec §Responsividade]

- [ ] **CHK022** - A "animação de sucesso" na tela de confirmação tem requisitos de duração e tipo? Confetti? Checkmark animado? Duração em ms? [Clarity, Spec §T012]

- [ ] **CHK023** - O timer do PIX ("Este código expira em: 23:45:30") atualiza em tempo real? A cada segundo? Polling? O que acontece quando chega a zero? [Completeness, Spec §5.1]

- [ ] **CHK024** - O formulário de cadastro mostra erros de validação onde? Inline abaixo do campo? Toast? Modal? Highlight vermelho? [Clarity, Spec §1.1]

- [ ] **CHK025** - Os requisitos de acessibilidade (contraste, navegação por teclado, leitores de tela) estão documentados? A spec não menciona WCAG. [Gap, NFR]

---

## 🟢 P3: BAIXA PRIORIDADE (5 itens)

> Estes itens afetam cenários menos comuns. Podem ser resolvidos durante as Fases 2+.

### Cenários Alternativos e Exceções

- [ ] **CHK026** - O fluxo de "Esqueci minha senha" está completamente especificado? Token de reset expira em quanto tempo? Email template definido? [Completeness, Spec §1.2]

- [ ] **CHK027** - O que acontece quando aluno tenta agendar reposição mas não tem créditos? A spec menciona "2 reposições disponíveis este mês" mas não define origem. [Gap, Spec §4.1]

- [ ] **CHK028** - Está definido o comportamento quando o plano do aluno está cancelado ou vencido? Acesso negado a todas as funcionalidades? Apenas leitura? [Exception Flow, Gap]

- [ ] **CHK029** - O chat IA menciona "escala para humano" quando aluno pede cancelamento. Como isso funciona? Abre ticket? Notifica admin? Integra com CRM? [Clarity, Spec §7]

- [ ] **CHK030** - Cenários de aluno menor de idade estão documentados? Responsável financeiro diferente? Autorização de emergência? [Coverage, Gap]

---

## 🔵 P4: FUTURO (5 itens)

> Estes itens são para Fase 5 (Polish) ou versões futuras. Não bloqueiam o MVP.

### Requisitos Não-Funcionais

- [ ] **CHK031** - Os requisitos de performance (FCP < 1.5s, TTI < 3s) têm condições de teste definidas? Conexão 3G? 4G? Desktop? [Measurability, Plan §Critérios]

- [ ] **CHK032** - O PWA define comportamento offline específico? Quais páginas funcionam offline? Dashboard com dados cached? [Clarity, Plan §PWA]

- [ ] **CHK033** - O limite de tamanho para foto de perfil está definido? 2MB? 5MB? Formato (JPEG, PNG, WebP)? [Gap, Spec §3]

- [ ] **CHK034** - Os logs e métricas de sucesso ("80% cadastros self-service") têm instrumentação definida? Analytics? Eventos custom? [Gap, Spec §Métricas]

- [ ] **CHK035** - A política de rate limiting da API está documentada com limites por endpoint? Diferente para autenticado vs anônimo? [Completeness, Spec §Segurança]

---

## 📋 COMO USAR ESTE CHECKLIST

### Antes de cada Sprint:
1. Revisar itens P0 pendentes - **bloqueantes**
2. Incluir 2-3 itens P1/P2 no sprint
3. Documentar decisões tomadas

### Durante PR Review:
```
✅ CHK005 - Decidido: @@unique([email, organizationId]) no schema
✅ CHK010 - Definido: QR Code expira em 30 minutos
⏳ CHK029 - Adiado para Fase 4
```

### Status Legend:
| Símbolo | Significado |
|---------|-------------|
| ⬜ | Não revisado |
| ✅ | Resolvido/Definido |
| ⏳ | Adiado intencionalmente |
| ❌ | Não aplicável |
| 🔍 | Em análise |

---

## 📝 DECISÕES TOMADAS

| CHK | Decisão | Data | Responsável |
|-----|---------|------|-------------|
| CHK001 | Contador regressivo + botão "Reenviar" quando expira | 01/12/2025 | Copilot |
| CHK002 | Rate limits definidos: register 3/min, login 5/min, magic-link 3/min | 01/12/2025 | Copilot |
| CHK003 | Não invalida auto; limite 5 sessões; notifica novos logins | 01/12/2025 | Copilot |
| CHK004 | Senha: 8+ chars, 1 maiúscula, 1 número | 01/12/2025 | Copilot |
| CHK005 | `@@unique([email, organizationId])` - email único por organização | 01/12/2025 | Copilot |
| CHK006 | Senha opcional; Magic Link prioritário; pode criar senha depois | 01/12/2025 | Copilot |
| CHK008 | Fallback com status PENDING_CREATION; cron retry 5 min | 01/12/2025 | Copilot |
| CHK010 | QR Code PIX expira em 30 minutos | 01/12/2025 | Copilot |
| CHK012 | Buscar por CPF antes de criar; reutiliza se existe na mesma org | 01/12/2025 | Copilot |
| CHK014 | Formato padrão: { success, data?, error?, errorCode? } | 01/12/2025 | Copilot |
| CHK015 | Usar `/api/portal/auth/register` (já implementado) | 01/12/2025 | Copilot |
| CHK019 | Query param `?org=uuid` no link de venda | 01/12/2025 | Copilot |

---

## 🔗 REFERÊNCIAS

- **Spec**: `specs/portal-aluno/spec.md` v1.2
- **Plan**: `specs/portal-aluno/plan.md` v1.0
- **Tasks**: `specs/portal-aluno/tasks.md` v1.0
- **Checklist Completo**: `specs/portal-aluno/checklists/requirements-quality.md` (85 itens)

---

**Autor**: GitHub Copilot  
**Criado**: 01/12/2025  
**Próxima revisão**: Antes de iniciar Fase 1
