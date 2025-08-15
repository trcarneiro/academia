# RAG Module – Contexto Central

Este diretório concentra toda a documentação e artefatos do módulo RAG (Retrieval-Augmented Generation) abrangendo domínios pedagógicos, operacionais, financeiros e engajamento.

Versão base migrada do arquivo raiz `docs/RAG_CONTEXT.md`.

## CHANGELOG LOCAL
- v0.1 (migração inicial): Conteúdo movido para pasta dedicada.
- v0.2 (expansão): Placeholders substituídos pelo conteúdo completo.
- v0.3 (rationale + status): Adicionada seção de rationale preservação schema e marcado F1-01 concluído.
- v0.4 (snapshot execução): Controller alinhado ao service, migração ainda não aplicada (P1002), plano de desbloqueio documentado.

## STATUS SNAPSHOT (v0.4)
Estado Atual:
- Schema Prisma estendido (tabelas RAG + pivot prerequisites) OK.
- Migração segura criada (additive only) NÃO aplicada (F1-02 pendente) devido a advisory lock em host pooler.
- Controller de CourseTemplate sincronizado ao service simplificado.
- Serviço de geração de curso desativado (falta alinhamento schema Course).

Bloqueio Principal:
- P1002 (advisory lock) ao rodar `prisma migrate deploy` via conexão pooler.

Ação Imediata Requerida:
1. Configurar DIRECT_URL para conexão direta (sem *.pooler.*) e reexecutar migrate.
2. Em caso de falha: aplicar SQL manual + `prisma migrate resolve --applied`.
3. `prisma generate` após sucesso.

Próximos (curto prazo):
- F1-02 concluir migração / gerar client.
- F1-03 confirmar `CREATE EXTENSION vector`.
- F1-04 script seed inicial (techniques/mental/adaptation).

Riscos:
- Divergência futura se desenvolvimentos ocorrerem sem migração aplicada.
- Possível necessidade de ajustar dimensionamento de vetor antes de embeddings (definir dim padrão ex: 1536 / 3072).

Mitigações:
- Trabalhar somente em read-model RAG até F1-02 concluído.
- Congelar alterações em schema RAG até client gerado.

Métricas a Observar Pós F1-07:
- retrieval_latency_ms p95
- chunk_reuse_ratio
- embedding_queue_depth (se assíncrono for adotado)

---

# Projeto Academia – Documento de Contexto para Agente (RAG-Centric)

## 1. Visão Geral
Plataforma de gestão acadêmica (alunos, cursos, planos, assinaturas, aulas, pagamentos) evoluindo para arquitetura IA-first onde RAG (Retrieval-Augmented Generation) é a camada de conhecimento central.  
Banco relacional (Postgres/Prisma) continua como fonte de verdade transacional; RAG adiciona camada semântica (conteúdo pedagógico, técnicas, currículos, narrativas, explicações, recomendações).

## 2. Princípios
1. IA não altera estado crítico sem comando explícito (create/update/delete).
2. RAG fornece: consistência terminológica + redução de alucinação + versionamento de conteúdo.
3. Conteúdo gerado precisa de rastreabilidade (retrieval_trace, model_version).
4. Drafts pedagógicos passam por aprovação humana antes de “promoted”.
5. Diferenciar conhecimento estruturado (DB) de conhecimento textual (chunks).

## 3. Entidades Principais (Transacionais)
Student(id, userId, isActive, category, medicalConditions, emergencyContact)  
User(id, firstName, lastName, email, phone, organizationId)  
Plan(id, name, description, category, price, billingType, classesPerWeek, status)  
Course(id, name, category, status)  
PlanCourse(planId, courseId) // pivot  
StudentSubscription(id, studentId, planId, status, priceSnapshot, startDate, nextBillingDate)  
Payment(id, subscriptionId, amount, status, dueDate, paidAt)  
Attendance(id, studentId, status, createdAt)  

## 4. Entidades Pedagógicas (RAG / Semânticas)
Technique(id, name, family, level, complexity, tags[], description, cues, commonErrors)  
Combination(id, name, componentTechniqueIds[])  
MentalModule(id, name, objective, recommendedPhase, durationMin)  
Challenge(id, title, baseActivity, focusTags[], pointValue, progressionRules)  
LessonDraft(number, unit, level, techniqueIds[], newTechniqueIds[], objective, flags{miniTest,simulation})  
CourseDraft(id, version, faixa, weeks, lessons[], challenges[], metadata)  
AdaptationSnippet(id, audienceTag(TEA,TDAH,mobility), text)  

## 5. Invariantes
- Máx. 1 StudentSubscription ACTIVE por aluno.
- PlanCourse chave composta evita duplicado.
- Técnicas citadas em drafts precisam existir em Technique.
- Mini-testes somente em aulas pré-configuradas (ex.: 8,16,24,32,40).
- Limite de novas técnicas por aula (<=3) em faixa branca.
- Toda técnica deve reaparecer (revisão) no intervalo definido (ex.: 2–5 aulas após introdução).

## 6. Módulos Frontend (Resumo)
students/index.js – listagem/filtros alunos  
student-editor/main.js – orquestra abas (profile, financial)  
student-editor/financial-tab.js – assinatura & pagamentos  
plans/plans.js – listagem planos  
plan-editor.js – criação/edição plano (futuro: tab cursos integrada)  
plans/courses-tab.js – associação plano ↔ cursos (diff add/remove)  
courses/courses.js – listagem cursos  
course-editor.js – criação/edição curso  

## 7. Logs – Convenção
Emojis prefix:
🔧 init / setup  
📊 dados carregados / estatística  
💾 persistência (save/update/delete)  
💳 financeiro  
🎯 ação de usuário  
📥 carregando (fetch)  
✅ sucesso  
❌ erro  
⚠️ atenção / fallback  

Manter padrão; novos módulos seguem a semântica.

## 8. RAG – Arquitetura em Camadas
1. Data (Postgres + pgvector)  
2. Ingestion Pipeline (PDF/Doc/Transcrição → limpeza → chunk → enrichment(tags) → embedding)  
3. Vector Index (tabela chunks: id, type, source_id, version, lang, tags[], text, embedding)  
4. Knowledge Graph Leve (tabelas de relacionamento: technique_prerequisite, lesson_reinforces, course_contains)  
5. Retrieval Orchestrator (filtros estruturais → dense similarity → re-ranking híbrido → diversificação)  
6. Prompt Builder (templates parametrizados por tarefa)  
7. Guardrails (whitelist técnica, regex termos proibidos, moderação)  
8. Validation Engine (regras curriculares/contagem)  
9. Generation Services (course planner, lesson adjuster, Q&A, metric explainer)  
10. Observability (traces, métricas, custos)  
11. Caching (retrieval cache, prompt+chunks hash, output diff)  

## 9. Chunking Diretrizes
- Técnica: 1 chunk (~150–300 tokens)  
- MentalModule: 120–200 tokens  
- Challenge: 60–100 tokens  
- Narrativa (apresentação / missão / seção motivacional): 300–600 tokens  
- Vídeo transcrição: segmentar por tópico (timestamp + técnicas referenciadas)  

## 10. Retrieval Multi-Stage
Stage 1: Structured filter (faixa, idioma, version=latest)  
Stage 2: Dense similarity (top-k inicial)  
Stage 3: Lexical/BM25 blend (rerank)  
Stage 4: Diversity (penaliza repetição de mesma técnica)  
Stage 5: Slot filling (assegura módulos mentais obrigatórios)  
Store trace: retrieval_trace = [{chunk_id, score, reason}]  

## 11. Workflows de Geração
A) Course Draft  
1) Input params (faixa, início, aulas/semana)  
2) Planner determinístico gera esqueleto (48 aulas, flags mini-test)  
3) Retrieval por bloco → gerar objetivos e distribuição texto  
4) Validation (novas técnicas, revisões, coerência)  
5) Persistir draft (status: pending_approval)  

B) Aula Adaptativa  
Input: performance (faltas, técnicas fracas) → retrieval reforço → gerar variação → suggestion overlay.  

C) Q&A Instrutor / Aluno  
Intenção → scope filter → retrieval (k pequeno) → resposta com citations[].  

D) Métrica Explicativa  
Input: métricas brutas → retrieval guidelines pedagógicas → gerar insight textual (explicação + sugestão).  

## 12. Validações Automáticas
- Hallucination Check: extração de técnicas → diff whitelist.
- NewTechniqueLimitCheck: counting newTechniqueIds per lesson.
- ReviewCoverageCheck: cada técnica revisada >=1 vez em janelas definidas.
- MiniTestScope: mini-test contém apenas técnicas introduzidas antes.
- ObjectiveLengthCheck: objetivo <= N caracteres.
- EmojiLimiter: <= X emojis/section.

Falhas geram status draft_incomplete com issue list.

## 13. JSON Schemas (Rascunhos Simplificados)
Technique:
```
{
  "id": "uuid",
  "name": "Jab",
  "family": "soco",
  "level": 1,
  "complexity": 2,
  "tags": ["fundamental","upper_body"],
  "description": "...",
  "cues": ["cotovelo fechado"],
  "commonErrors": ["ombro baixo"]
}
```

LessonDraft:
```
{
  "number": 1,
  "unit": "Fundamentos",
  "level": 1,
  "techniqueIds": ["tech_jab","tech_guard"],
  "newTechniqueIds": ["tech_jab","tech_guard"],
  "objective": "Aprender postura e soco básico",
  "flags": {"miniTest": false, "simulation": false}
}
```

CourseDraft:
```
{
  "id": "uuid",
  "version": 1,
  "faixa": "Branca",
  "weeks": 24,
  "lessons": [LessonDraft...],
  "challenges": ["chal_week1", "..."],
  "metadata": {
    "aulasPorSemana": 2,
    "generatedAt": "ISO",
    "modelVersion": "gpt-x.y",
    "embeddingSet": "v1"
  },
  "retrievalSummary": {
    "totalChunksUsed": 142,
    "techniqueCoveragePct": 100
  },
  "status": "pending_approval"
}
```

RetrievalTrace:
```
{
  "generationId": "uuid",
  "task": "course_draft",
  "chunks": [
     {"id":"chunk_tech_jab_v3","score":0.89,"stage":2},
     {"id":"chunk_guideline_spacing","score":0.77,"stage":3}
  ]
}
```

## 14. Endpoints (Existentes / Planejados)
Existentes (exemplos):
GET /api/students  
GET /api/students/:id  
GET /api/students/:id/subscription  
GET /api/students/:id/financial-summary  
GET /api/billing-plans  
POST /api/billing-plans  
PUT /api/billing-plans/:id  
GET /api/billing-plans/:id/courses  
POST /api/billing-plans/:id/courses (diff add/remove)  
GET /api/courses  

Planejados (RAG):
POST /api/rag/course-drafts (gera)  
GET /api/rag/course-drafts/:id  
POST /api/rag/course-drafts/:id/approve  
POST /api/rag/lesson/:courseDraftId/:lessonNumber/regenerate  
POST /api/rag/qna  
GET /api/rag/techniques  
GET /api/rag/retrieval-trace/:generationId  

## 15. Guardrails
- Nunca inventar técnica (bloquear saída).
- Não expor chunk raw se classe de usuário = aluno (mostrar apenas citações resumidas).
- Logar cada geração (userId, purpose, tokens).
- Limitar prompts extensos (max tokens context configurável).
- Filtrar PII em ingestão (regex email/telefone removidos).

## 16. Métricas (Observability)
- retrieval_latency_ms (p50/p95)
- generation_latency_ms
- hallucination_rate (técnicas inválidas / total gerações)
- draft_approval_ratio
- technique_coverage_pct
- average_new_techniques_per_lesson
- cache_hit_rate (retrieval/output)
- cost_tokens_input/output

## 17. Roadmap (Macro)
M1: Ontologia mínima + ingestão técnica + Q&A instrutor  
M2: Planner + Course Draft + validações básicas  
M3: Aula adaptativa + challenges personalizáveis  
M4: Gamificação explicações + mental modules slot fill  
M5: Observability avançada + rerank híbrido  
M6: Vídeo transcrição alinhada (timestamp retrieval)  
M7+: Multi-faixa + idioma + insights retenção Financeiro (explicador valor)

## 18. Processos de Aprovação
Estados: pending_approval → approved → published → archived  
Requisitos promoção: sem blocking issues, coverage alvo atingida, assinatura instrutor.

## 19. Checklists de Qualidade (Course Draft)
[ ] Contém todas as seções obrigatórias  
[ ] Técnicas totais == esperado (faixa tabela)  
[ ] Nenhuma técnica extra / desconhecida  
[ ] Revisões espaçadas atendidas  
[ ] Mini-testes apenas com técnicas introduzidas  
[ ] Objetivos curtos coerentes  
[ ] Emojis <= limite  
[ ] Metadata modelVersion + embeddingSet  

## 20. Glossário
Faixa: nível hierárquico  
RAG: retrieve + augment + generate  
Chunk: unidade indexável  
Coverage: % técnicas representadas  
Hallucination: referência inexistente  

## 21. Tarefas Permitidas ao Agente
- Explicar fluxo de módulo  
- Sugerir refator sem quebrar logs  
- Propor schema JSON refinado  
- Listar riscos pedagógicos  
- Gerar migração pivot  
- Planejar validação drafts  

## 22. Tarefas Bloqueadas
- Alterar autenticação  
- Escrita crítica sem confirmação  
- Inventar endpoint silencioso  
- Remover logs  
- Introduzir técnica inexistente  

## 23. Prompt Pattern (Exemplo)
System: Instrutor Chefe. Use apenas técnicas fornecidas.  
User: Gerar aula 12 (fase Golpes Nível 1). Técnicas novas: Cotovelada Traseira.  
Context: chunks técnicas + guideline espaçamento  
Output: JSON LessonDraft  

## 24. Integração UI (Futuro)
askAI(params) → /api/rag/qna  
generateCourseDraft(data) → /api/rag/course-drafts  
regenerateLesson(id,n) → /api/rag/lesson/:id/:n/regenerate  
showRetrievalTrace(id) → overlay  

## 25. Evolução
- CourseVersion diff  
- Weighting dinâmica lacunas turma  
- Retenção ↔ engajamento análise  

## 26. Pendências Atuais
[ ] Tabela technique  
[ ] Tabela chunk + embedding  
[ ] Migração PlanCourse confirmada  
[ ] Endpoint /api/rag/course-drafts  
[ ] Validation engine base  
[ ] Registro retrieval_trace piloto  
[ ] Dashboard métricas  

## 27. Backlog Estruturado (Fases e Tarefas)

### Fase 1 – Fundações
[x] F1-01 Definir schema Prisma: technique, technique_prerequisite, mental_module, challenge, adaptation_snippet, chunk, embedding_meta  
[ ] F1-02 Criar migração + prisma generate  
[ ] F1-03 Habilitar extensão pgvector e tabela embeddings (chunk_id, vector, dim, metadata)  
[ ] F1-04 Script ETL inicial (seed técnicas + módulos mentais + desafios)  
[ ] F1-05 Serviço de embedding (função generateEmbedding(text): vector)  
[ ] F1-06 Ingestão inicial (gerar embeddings + persistir)  
[ ] F1-07 Retrieval básico (filtros estruturais + similarity top-k)  
[ ] F1-08 Métricas básicas retrieval (latência, k retornado)  

### Fase 2 – Planner & Draft
[ ] F2-09 Planner determinístico (48 aulas + flags mini-test + simulações)  
[ ] F2-10 Validação: limite novas técnicas por aula  
[ ] F2-11 Validação: mini-test scope  
[ ] F2-12 Hallucination check (técnica fora whitelist)  
[ ] F2-13 Endpoint POST /api/rag/course-drafts (gera + salva + trace)  
[ ] F2-14 Endpoint GET /api/rag/course-drafts/:id  
[ ] F2-15 Persistir retrieval_trace (tabela generation_trace)  
[ ] F2-16 Guardrails sanitização saída (remover PII, limitar emojis)  

### Fase 3 – Refinos Pedagógicos
[ ] F3-17 ReviewCoverageCheck (revisão espaçada)  
[ ] F3-18 EmojiLimiter + ObjectiveLengthCheck  
[ ] F3-19 Endpoint approve draft (status transition)  
[ ] F3-20 Endpoint regenerate lesson (escopo aula)  
[ ] F3-21 Cache retrieval (hash filtros + consulta)  

### Fase 4 – Conteúdos Adicionais
[ ] F4-22 Ingest mental_module + challenge + adaptation_snippet (separar seeds)  
[ ] F4-23 Slot filling módulos mentais obrigatórios  
[ ] F4-24 Geração desafios semanais (regras + seleção adaptativa)  
[ ] F4-25 GET /api/rag/techniques (metadados paginados)  

### Fase 5 – Observabilidade
[ ] F5-26 Tabela rag_metrics (aggregation diária)  
[ ] F5-27 Coletor métricas (cron)  
[ ] F5-28 Dashboard Prometheus/Grafana (latência, coverage, hallucination)  
[ ] F5-29 Log custo tokens (input/output)  

### Fase 6 – Personalização
[ ] F6-30 Schema StudentProfile embedding  
[ ] F6-31 Cálculo perfil (dificuldades / técnicas fracas)  
[ ] F6-32 Retrieval com boost técnicas fracas  
[ ] F6-33 Endpoint sugestão reforço aula adaptativa  

### Fase 7 – Hardening
[ ] F7-34 Testes unit planner/validators  
[ ] F7-35 Testes integração (geração → aprovação)  
[ ] F7-36 Script reindex (re-embed all)  
[ ] F7-37 Namespace embeddings (versão)  
[ ] F7-38 Política rollback (desativar versão embeddings)  

### Fase 8 – UI Integração
[ ] F8-39 SDK frontend (askAI, generateCourseDraft, regenerateLesson)  
[ ] F8-40 Tela listagem drafts + filtros + status  
[ ] F8-41 Tela revisão draft (full-screen)  
[ ] F8-42 Exibição issues validação (painel lateral)  
[ ] F8-43 Tela trace retrieval (full-screen)  

### Fase 9 – Segurança & Compliance
[ ] F9-44 Scrub PII ingest (regex email/phone)  
[ ] F9-45 Rate limiting endpoints RAG  
[ ] F9-46 RBAC approvals (role instructor_admin)  
[ ] F9-47 Audit log approvals (who, when, version)  

### Fase 10 – Otimização
[ ] F10-48 Re-ranking híbrido (BM25 + cross-encoder)  
[ ] F10-49 Diversificação resultados (penalidade repetição técnica)  
[ ] F10-50 Partial regeneration diff (somente aulas alteradas)  
[ ] F10-51 Coverage incremental (atualizar sem full recompute)  

### Critérios MVP (Go Live Interno)
[ ] Planner + Draft (F2 completo)  
[ ] Validações essenciais (F2 + F3-17,18)  
[ ] Aprovação de draft (F3-19)  
[ ] Métricas básicas (F1-08)  
[ ] Zero hallucination em ≥5 drafts consecutivos  
[ ] P95 geração < 30s  

### Critérios Beta Externo
[ ] Personalização inicial (F6-30..32)  
[ ] Observabilidade avançada (F5 completo)  
[ ] UI revisão completa (F8-39..42)  

### Critérios Estabilidade
[ ] Testes cobertura >70% (core RAG)  
[ ] Scripts reindex confiáveis  
[ ] Rollback embeddings testado  

## 28. Mapping Pendências ↔ Fases
- Tabela technique → F1-01 / F1-02  
- Tabela chunk + embedding → F1-01 / F1-03  
- Migração PlanCourse confirmada → (fora RAG direto, pré-requisito)  
- Endpoint /api/rag/course-drafts → F2-13  
- Validation engine base → F2-10..12  
- Registro retrieval_trace piloto → F2-15  
- Dashboard métricas → F5-28  

---
Manter atualizado e modularizar ao exceder ~500 linhas.

---
## 29. Rationale – Preservação de Campos no Schema Technique
Motivação para reintroduzir e manter campos legados como opcionais em `Technique` durante a fase inicial do módulo RAG:
1. Evitar migração destrutiva automática (DROP COLUMN) e risco de perda de dados existentes.
2. Manter compatibilidade com código e serviços que ainda podem referenciar metadados ricos (objetivos, critérios, riscos, tags).
3. Fornecer base semântica ampla para futura indexação (chunks + embeddings) e validações pedagógicas.
4. Estratégia “additive only” simplifica deploy contínuo e rollback (não remove nada até confirmação posterior).
5. Suporta transição gradual para grafo normalizado (pivot `TechniquePrerequisite`) mantendo lista raw `prerequisites[]` como redundância temporária.
6. Facilita auditoria e rastreabilidade de geração (mais atributos enriquecem contexto de prompts e validações anti-alucinação).
7. Minimiza necessidade de refactors emergenciais quando funcionalidades avançadas (planner, validações) forem ativadas.
8. Permite criar seeds/ETL iniciais sem reconstruir estrutura histórica.

Status Atual:
- F1-01 concluído (modelos adicionados ao schema Prisma).
- F1-02 pendente aplicação efetiva (bloqueada por timeout/advisory lock no cluster remoto). Próximo passo: configurar `SHADOW_DATABASE_URL` local e reaplicar.
- F1-03 parcialmente descrito (extensão pgvector prevista em migration segura) mas não validado no banco ainda.

Próximos Passos Imediatos:
1. Ajustar `.env` com `SHADOW_DATABASE_URL` (Postgres local) e aplicar `npx prisma migrate dev --skip-generate`.
2. `npx prisma generate` após sucesso da migração.
3. Atualizar este documento marcando F1-02/F1-03 conforme execução real.

---
