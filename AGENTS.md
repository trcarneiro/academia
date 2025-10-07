# v2.0 - Guia Operacional para Agentes e Devs

Uma visão prática e acionável para aumentar produtividade e assertividade nas entregas.

## Índice
- Princípios Fundamentais
- Quick Start por Perfil
- Integração com AcademyApp (Core)
- Estrutura de Módulos (Frontend)
- Contratos de Ferramentas (APIs internas)
- SOPs Essenciais (Passo a passo)
- Quality Gates (Build/Lint/Test/Smoke)
- Definition of Ready / Done
- RAG e Prompts (AI)
- Observabilidade e Erros
- Referências e Fontes de Verdade

## Princípios Fundamentais
- API-First: sempre consumir APIs; não hardcode dados.
- Modularidade: isolamento via classes `.module-isolated-*` e ModuleLoader; não editar core.
- Design System: tokens oficiais (#667eea, #764ba2) e variações em `public/css/design-system/tokens.css`.
- UI Premium: `.module-header-premium`, `.stat-card-enhanced`, `.data-card-premium` e gradientes.
- Estados de UI: loading, empty, error em TODAS as telas de dados.
- Acessibilidade e Responsividade: WCAG 2.1; 768/1024/1440.

## Quick Start por Perfil
- AI Agents: consulte WORKFLOW.md + FALLBACK_RULES.md (na pasta /dev ou raiz). Siga os SOPs abaixo.
- Frontend: leia DESIGN_SYSTEM.md + CSS_NAMING.md; use fetchWithStates e ModuleAPI.
- Backend: siga padrões Fastify + Prisma; documente endpoints no Swagger.

## Integração com AcademyApp (Core)
Todo módulo deve:
- Registrar em `AcademyApp.loadModules()`.
- Expor global: `window.myModule = module;` (para ações onclick simples).
- Disparar eventos: `window.app.dispatchEvent('module:loaded', { name: 'module' })`.
- Usar `window.app.handleError(error, context)` para erros.

## Estrutura de Módulos (Frontend)

### **Duas Abordagens Válidas**

#### **1. Estrutura Multi-File (Complexa)**
```
/public/js/modules/[module]/
├── index.js           # Entry point
├── controllers/       # MVC controllers
├── services/          # Business logic
├── views/             # HTML templates
└── components/        # Reusable UI components
```

#### **2. Estrutura Single-File (Simplificada)** 🆕
```
/public/js/modules/[module]/
├── index.js           # TUDO EM UM ARQUIVO (400-600 linhas)
├── controllers/       # Apenas stubs de compatibilidade
└── [outros removidos]
```

### **Quando Usar Cada Abordagem?**

**🔥 SINGLE-FILE (RECOMENDADO)**: 
- Módulos com CRUD básico (Create, Read, Update, Delete)
- Funcionalidades simples a médias
- Casos onde performance é crítica
- **Exemplo de sucesso**: Módulo Instructors (86% menos arquivos, 73% menos código)

**📁 MULTI-FILE**: 
- Módulos muito complexos (500+ linhas de lógica específica)
- Múltiplas integrações externas
- Funcionalidades muito especializadas

### **Padrões Obrigatórios (Ambas Abordagens)**
- **MÓDULO DE REFERÊNCIA**: Activities (`/public/js/modules/activities/`) como base
- **API client central**: `window.createModuleAPI('ModuleName')` e `fetchWithStates`
- **Navegação SPA**: páginas full-screen com breadcrumb, sem modais
- **UI Premium**: `.module-header-premium`, `.stat-card-enhanced`, `.data-card-premium`
- **Estados obrigatórios**: loading, empty, error em TODAS as telas
- **Integração AcademyApp**: Registro, eventos, error handling

## Contratos de Ferramentas
Module API
- createModuleAPI(name): retorna helper com `request(url, options)` e `fetchWithStates(url, { targetElement, onLoading, onSuccess, onEmpty, onError, ... })`.
- Estados: onLoading (spinner), onEmpty (estado vazio), onError (tratamento padrão + app.handleError), onSuccess (renderização).
AcademyApp
- Eventos: `module:loaded`, `module:error` (opcional); erros via `handleError(error, context)`.

## SOPs Essenciais

### **1) Escolher Abordagem de Módulo**
**Decisão**: Single-file vs Multi-file
- **CRUD básico + performance crítica** → Single-file (como Instructors)
- **Lógica complexa + múltiplas integrações** → Multi-file (como Activities)

### **2a) Criar módulo Single-file** 🆝
- **PRIMEIRO**: Use módulo Instructors como template (`/public/js/modules/instructors/index.js`)
- **SEGUNDO**: Copie estrutura: carregamento de dados, renderização, navegação interna
- **TERCEIRO**: Adapte endpoints, campos e validações específicas
- **QUARTO**: CSS isolado com `.module-isolated-*` prefixes
- **QUINTO**: Integração AcademyApp: registro, eventos, error handling

### **2b) Criar módulo Multi-file**
- **PRIMEIRO**: Copie estrutura completa do módulo Activities (`/public/js/modules/activities/`)
- **SEGUNDO**: Renomeie arquivos, classes e endpoints conforme o novo módulo
- **TERCEIRO**: Mantenha exatamente a mesma estrutura CSS, API client e navegação
- **QUARTO**: CSS isolado em `/public/css/modules/[module].css` com prefixos `.module-isolated-*`
- **QUINTO**: Registrar módulo no AcademyApp

### **3) Migrar módulo existente → padrão moderno**
- **PRIMEIRO**: Avalie complexidade - single-file ou multi-file?
- **SEGUNDO**: Use template adequado (Instructors para single-file, Activities para multi-file)
- **TERCEIRO**: Migre funcionalidades mantendo API contracts
- **QUARTO**: Teste todos os estados: loading, empty, error
- **QUINTO**: Valide navegação duplo-clique e responsividade

### **4) Adicionar endpoint backend**
- Criar rota em `src/routes/[entity].ts`, controller em `src/controllers/` e tipos em `prisma/schema.prisma` se necessário.
- Documentar no Swagger; cobrir happy path + erro.

## Quality Gates
- Build: sem erros TypeScript/JS.
- Lint: sem erros bloqueantes.
- Test: executar Vitest com pelo menos 1 happy path + 1 edge.
- Smoke: navegar até a tela, ver loading → conteúdo/empty → nenhuma exception.
Relate no PR: PASS/FAIL por gate e breve “requirements coverage”.

## Definition of Ready / Done
DoR
- Endpoint mapeado no Swagger; contrato acordado.
- Design tokens e classes premium definidos.
- Estado de UI (loading/empty/error) pensado.
DoD
- Implementação com API helper e estados.
- Testes mínimos cobrindo sucesso e 1 erro comum.
- Responsivo em 768/1024/1440.
- Erros tratados via `window.app.handleError`.

## RAG e Prompts (AI)
- Servidor RAG: iniciar via task “Start RAG Server” quando necessário.
- Documentos e ingestão: manter metadados e tags consistentes; atualizar índices após mudanças.
- Prompts: seguir `.github/prompts/` e serviços em `src/services/aiService.ts`.

## Observabilidade e Erros
- Frontend: sempre capturar e reportar erros com `window.app.handleError(error, context)`.
- Backend: logs legíveis, erros com mensagem útil e status code corretos.
- UI: mensagens de erro claras; ações de retry quando possível.

## Module Compliance Status (🆕 Auditoria 30/09/2025)

### 📊 Métricas de Conformidade
- **Total de módulos**: 19 ativos
- **100% Conformes**: 26% (Students, Instructors, Activities, Packages, Turmas)
- **Parcialmente Conformes**: 47% (Organizations, Units, Agenda, Courses, Lesson Plans, etc.)
- **Legados**: 26% (Frequency, Import, AI, Course Editor, Techniques)

### ⭐ Módulos de Referência (Gold Standard)
1. **Students** - Multi-file complexo (1470 linhas, 5 arquivos)
   - 100% UI Premium, Estados completos, API Client integrado
   - Use para: Funcionalidades com múltiplas abas, CRUD avançado, integrações complexas
2. **Instructors** - Single-file simplificado (745 linhas)
   - 86% menos arquivos vs versão antiga, CRUD completo
   - Use para: CRUD simples, listagem + edição, funcionalidades diretas
3. **Activities** - Multi-file MVC (estrutura completa)
   - Padrão MVC clássico com controllers/services/views/components
   - Use para: Features com múltiplas views, lógica de negócio complexa

### 🎯 Prioridades de Refatoração
**CRÍTICO (7 dias)**:
- AI Module (dividir em submódulos)
- Course Editor (integrar ao módulo Courses)
- Lesson Plans (migrar para API Client)

**ALTA (2 semanas)**:
- Frequency (refatoração completa)
- Courses (completar UI Premium)
- Agenda (padronizar estados)

**MÉDIA (1 mês)**:
- Organizations, Units (adicionar API Client)
- Import, Techniques (modernizar estrutura)

### 📚 Relatório Completo
Veja `AUDIT_REPORT.md` para análise detalhada, métricas por módulo e plano de ação completo.

## 🚧 Tarefas Pendentes (TODO)

### Backend / Infraestrutura
- [ ] **Adicionar índice único composto no modelo User** (MÉDIO) �
  - **Contexto**: Atualmente o modelo `User` não tem `@@unique([organizationId, email])` no schema Prisma
  - **Problema**: Queries precisam usar `findFirst` em vez de `findUnique`, menos performático
  - **Solução**: 
    1. Adicionar no `prisma/schema.prisma` dentro do modelo User (antes do `@@map`):
       ```prisma
       @@unique([organizationId, email])
       ```
    2. Rodar migração: `npx prisma migrate dev --name add_user_org_email_unique`
    3. Atualizar queries em `src/routes/instructors.ts` e outros para usar `findUnique`
  - **Arquivos afetados**: 
    - `prisma/schema.prisma` (adicionar constraint)
    - `src/routes/instructors.ts` (mudar findFirst → findUnique)
    - `src/routes/students.ts` (verificar se precisa atualizar)
  - **Validação**: 
    - Migration aplicada com sucesso
    - Não pode ter emails duplicados na mesma organização
    - Queries mais performáticas
  - **Prioridade**: MÉDIA - Funciona com findFirst, mas unique é melhor prática
  - **Estimativa**: 30 minutos
  - **Data**: Identificado em 06/10/2025
  - **Status**: Pendente (workaround com findFirst implementado)

- [ ] **Integrar organizationId do Supabase no API Client** (CRÍTICO) 🔥
  - **Contexto**: Atualmente usando hardcoded `a55ad715-2eb0-493c-996c-bb0f60bacec9` como fallback temporário em `public/js/shared/api-client.js` (linha ~170)
  - **Problema**: Usuário loga pelo Supabase, tem organizationId no perfil, mas API Client não está pegando essa informação automaticamente
  - **Solução**: 
    1. No módulo de autenticação (`public/js/modules/auth/`), após login bem-sucedido no Supabase:
       ```javascript
       const { data: { user } } = await supabase.auth.getUser();
       localStorage.setItem('activeOrganizationId', user.user_metadata.organizationId);
       ```
    2. Remover fallback hardcoded do `api-client.js` após implementação
    3. Adicionar verificação: se não tem organizationId após login, redirecionar para página de setup
  - **Arquivos afetados**: 
    - `public/js/modules/auth/index.js` (adicionar localStorage.setItem após login)
    - `public/js/shared/api-client.js` (remover hardcode após implementação)
  - **Validação**: 
    - Usuário faz login → organizationId automaticamente configurado
    - Multi-tenancy funciona sem configuração manual
    - Suporta múltiplas organizações por usuário (admin/instrutor)
  - **Prioridade**: ALTA - Multi-tenancy depende disso para funcionar corretamente em produção
  - **Estimativa**: 1-2 horas
  - **Status**: Pendente (temporariamente resolvido com hardcode desde 05/10/2025)
  - **Status**: Pendente (temporariamente resolvido com hardcode desde 05/10/2025)

### Features / Melhorias
- [x] **Melhorar UX do Check-in Kiosk** ✅ (06/10/2025)
  - Adicionado status visual do plano (✅ Ativo / ❌ Inativo)
  - Validade com avisos de expiração (⚠️ pulsante quando < 7 dias)
  - Dica de matrícula quando aluno tem plano mas sem curso
  - Classes CSS: `.plan-active`, `.plan-expiring`, `.plan-expired`, `.no-course`
  - **Arquivos modificados**:
    - `public/js/modules/checkin-kiosk.js` (método `updateStudentInfo` + `showEnrollmentHint`)
    - `public/css/modules/checkin-kiosk.css` (estilos visuais com animações)
  - **Documentação**: `CHECKIN_UX_IMPROVED.md`
  - **Status**: ✅ COMPLETO - Feedback visual profissional implementado

- [x] **Adicionar Check-in Kiosk no menu lateral** ✅ (06/10/2025)
  - Adicionado item "Check-in Kiosk" (ícone ✅) no menu entre "Instrutores" e "Agenda"
  - Abre em nova janela/aba (ideal para tablet fixo)
  - Rota: `#checkin-kiosk` → `/views/checkin-kiosk.html`
  - **Arquivo modificado**: `public/index.html` (sidebar navigation)
  - **Status**: ✅ COMPLETO - Acesso direto via menu

- [x] **Corrigir planos duplicados + adicionar opção DELETE permanente** ✅ (05/10/2025)
  - Removido aviso amarelo de "múltiplos planos ativos detectados"
  - Exibir TODOS os planos ativos em grid (não apenas o primeiro)
  - Adicionar botão "Deletar" (vermelho) para remoção permanente via DELETE endpoint
  - Manter botão "Finalizar" (amarelo) para inativar mantendo histórico
  - Remover aviso na inserção de novo plano (backend já valida duplicatas)
  - **Arquivos modificados**:
    - `public/js/modules/students/controllers/editor-controller.js` (múltiplos planos + método deleteSubscription)
    - `public/css/modules/students-enhanced.css` (grid múltiplo + btn-warning)
  - **Documentação**: `FIX_DUPLICATE_PLANS_COMPLETE.md`
  - **Status**: ✅ COMPLETO - Pronto para teste no navegador

- [ ] **Matrícula Manual de Alunos em Cursos** ⚠️ BLOQUEADO (06/10/2025)
  - ✅ Endpoint POST /api/students/:id/courses implementado
  - ✅ Endpoint PATCH /api/students/:id/courses/:enrollmentId implementado
  - ✅ Frontend com botões "Matricular" e "Encerrar Matrícula" funcionais
  - ❌ **BLOQUEIO**: Schema StudentCourse requer classId obrigatório
  - **Problema**: Não existe Class padrão para matrículas manuais
  - **Soluções Possíveis**:
    1. Criar Class dummy automaticamente (rápido)
    2. Modificar schema para classId opcional (definitivo)
    3. Criar Default Class por Organization (intermediário)
  - **Documentação**: `ENROLLMENT_ISSUE.md` (análise completa das opções)
  - **Decisão Pendente**: Usuário precisa escolher abordagem arquitetural
  - **Prioridade**: ALTA - Feature 80% completa, apenas questão arquitetural

- [ ] **Integrar IA no módulo de Planos de Aula**
  - Adicionar funcionalidade de AI no lesson-plans para sugerir melhorias, completar descrições, ajustar duração
  - Usar `src/services/aiService.ts` existente
  - **Prioridade**: MÉDIA

- [x] **Corrigir aulas vazias no Check-in Kiosk** ✅ (07/10/2025)
  - **Problema**: `getEligibleCourseIds` retornando array vazio mesmo com aluno matriculado
  - **Causa Raiz**: Método buscando em `CourseEnrollment` (tabela legacy) em vez de `StudentCourse` (tabela correta)
  - **Solução**: Corrigido `src/services/attendanceService.ts` método `getEligibleCourseIds()` (linhas 11-42)
  - **Mudança**: `prisma.courseEnrollment.findMany()` → `prisma.studentCourse.findMany()`
  - **Impacto**: Check-in Kiosk agora mostra aulas disponíveis corretamente
  - **Arquivos Afetados**:
    - `src/services/attendanceService.ts` (getEligibleCourseIds)
  - **Documentação**: `FIX_CHECKIN_EMPTY_CLASSES.md`
  - **Status**: ✅ COMPLETO - Pronto para teste após reinício do servidor

## Referências e Fontes de Verdade
- Arquivo mestre desta versão: `AGENTS.md` (este arquivo).
- **Auditoria de Módulos**: `AUDIT_REPORT.md` - Relatório completo de conformidade (atualizado 30/09/2025)
- **Padrões de Módulos**: `dev/MODULE_STANDARDS.md` - Establece Activities (multi-file) e Instructors (single-file) como referências
- **Templates Oficiais**:
  - Single-file: `/public/js/modules/instructors/` (CRUD simplificado, 745 linhas)
  - Multi-file: `/public/js/modules/activities/` (Funcionalidades complexas, estrutura MVC)
  - Gold Standard: `/public/js/modules/students/` (Multi-file avançado, 1470 linhas)
- Configurações detalhadas do software: pasta `/dev` (WORKFLOW, FALLBACK_RULES, DESIGN_SYSTEM, CSS_NAMING, DOCUMENTATION, EXAMPLES).
- Padrões críticos de integração/UI/estados: `.github/copilot-instructions.md`.
- Documentação de API: Swagger em http://localhost:3000/docs.

—
Versão: 2.1 • Data: 11/09/2025 • Status: Ativo • Última Auditoria: 30/09/2025 • Atualização: Adicionada abordagem Single-file baseada no sucesso do módulo Instructors + seção de conformidade de módulos
