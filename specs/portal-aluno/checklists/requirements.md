# Checklist: Qualidade dos Requisitos - Portal do Aluno

**Tipo**: Requisitos de Qualidade (Unit Tests for English)  
**Criado**: 30/11/2025  
**Feature**: Portal do Aluno  
**Fase**: Pré-implementação

---

## Propósito

Este checklist valida a **qualidade, clareza e completude dos requisitos** documentados em `spec.md`, `plan.md` e `tasks.md`. Não é para testar implementação - é para testar se os requisitos estão bem escritos.

---

## Requirement Completeness

- [ ] CHK001 - São todos os campos do formulário de cadastro explicitamente listados com tipos e validações? [Completeness, Spec §1.1]
- [ ] CHK002 - São os valores dos planos (Mensal, Trimestral, Anual) quantificados com preços específicos? [Gap, Spec §Fluxo Onboarding]
- [ ] CHK003 - São os estados do pagamento (PENDING, CONFIRMED, RECEIVED, etc.) documentados com transições permitidas? [Completeness, Spec §5]
- [ ] CHK004 - São os campos obrigatórios vs opcionais claramente distinguidos no cadastro? [Completeness, Spec §1.1]
- [ ] CHK005 - São requisitos de acessibilidade (WCAG) especificados para formulários e navegação? [Gap]

---

## Requirement Clarity

- [ ] CHK006 - É o termo "Magic Link" definido com fluxo técnico específico (geração, expiração, validação)? [Clarity, Spec §1.3]
- [ ] CHK007 - É "mobile-first" quantificado com breakpoints e comportamentos específicos? [Clarity, Spec §Responsividade]
- [ ] CHK008 - São tempos de expiração do QR Code PIX explicitamente definidos? [Clarity, Spec §5.1]
- [ ] CHK009 - É o "polling de status" quantificado com intervalo e timeout máximo? [Ambiguity, Tasks T011]
- [ ] CHK010 - São critérios de "quórum mínimo" para turmas definidos com valores? [Clarity, Spec §Agenda]

---

## Requirement Consistency

- [ ] CHK011 - São os campos de Student consistentes entre spec.md e plan.md (modelo Prisma)? [Consistency]
- [ ] CHK012 - São os endpoints documentados em spec.md correspondentes às tasks em tasks.md? [Consistency]
- [ ] CHK013 - São os status de Payment consistentes entre Asaas e modelo local? [Consistency, Plan §Integração Asaas]
- [ ] CHK014 - É o fluxo de JWT consistente entre portal e sistema admin existente? [Consistency, Plan §Auth]

---

## Acceptance Criteria Quality

- [ ] CHK015 - Cada tarefa em tasks.md tem critérios de aceite mensuráveis? [Measurability, Tasks]
- [ ] CHK016 - São métricas de sucesso (tempo de cadastro < 3min, etc.) testáveis? [Measurability, Spec §Métricas]
- [ ] CHK017 - São requisitos de performance (FCP < 1.5s) verificáveis com ferramentas? [Measurability, Plan §Critérios]

---

## Scenario Coverage

- [ ] CHK018 - São cenários de erro de pagamento documentados (PIX expirado, falha de rede)? [Coverage, Exception Flow]
- [ ] CHK019 - São cenários de CPF/email duplicado tratados com mensagens específicas? [Coverage, Exception Flow]
- [ ] CHK020 - É o fluxo de "esqueci senha" especificado com todos os passos? [Coverage, Alternate Flow]
- [ ] CHK021 - São cenários de sessão expirada tratados (redirect, mensagem)? [Coverage, Exception Flow]
- [ ] CHK022 - É o comportamento offline (PWA) especificado para cada página? [Coverage, Gap]

---

## Edge Case Coverage

- [ ] CHK023 - É o comportamento definido quando aluno já existe no Asaas mas não no sistema local? [Edge Case, Gap]
- [ ] CHK024 - São limites de caracteres definidos para campos de texto (nome, observações)? [Edge Case]
- [ ] CHK025 - É o comportamento de múltiplas abas/sessões simultâneas especificado? [Edge Case, Gap]
- [ ] CHK026 - São formatos de CPF com/sem pontuação tratados igualmente? [Edge Case]

---

## Non-Functional Requirements

- [ ] CHK027 - São requisitos de rate limiting especificados por endpoint? [NFR, Security]
- [ ] CHK028 - São requisitos de logging/auditoria para ações sensíveis definidos? [NFR, Security]
- [ ] CHK029 - São requisitos de backup/recovery para dados de pagamento documentados? [NFR, Gap]
- [ ] CHK030 - São requisitos de LGPD (consentimento, exclusão) especificados? [NFR, Compliance, Gap]

---

## Dependencies & Assumptions

- [ ] CHK031 - A dependência do Z-API/WhatsApp está marcada como opcional com fallback? [Dependency, ✅ Corrigido]
- [ ] CHK032 - A assunção de "API Asaas sempre disponível" tem fallback documentado? [Assumption, Gap]
- [ ] CHK033 - As versões mínimas de navegadores suportados estão documentadas? [Dependency, Gap]

---

## Traceability

- [ ] CHK034 - Cada requisito em spec.md tem pelo menos uma tarefa correspondente em tasks.md? [Traceability]
- [ ] CHK035 - Cada tarefa em tasks.md referencia a seção de spec.md que implementa? [Traceability]
- [ ] CHK036 - Cada endpoint em plan.md tem tarefa de implementação? [Traceability]

---

## Resumo

| Categoria | Total | Críticos |
|-----------|-------|----------|
| Completeness | 5 | CHK002 (planos), CHK005 (a11y) |
| Clarity | 5 | CHK009 (polling) |
| Consistency | 4 | - |
| Acceptance Criteria | 3 | - |
| Scenario Coverage | 5 | CHK022 (offline) |
| Edge Cases | 4 | CHK023 (Asaas sync) |
| NFRs | 4 | CHK030 (LGPD) |
| Dependencies | 3 | ✅ CHK031 corrigido |
| Traceability | 3 | - |
| **TOTAL** | **36** | **5 gaps críticos** |

---

## Próximos Passos

1. ✅ CHK031 - WhatsApp opcional já documentado
2. 🔴 CHK002 - Definir valores dos planos (tarefa T000)
3. 🔴 CHK030 - Adicionar seção LGPD na spec
4. 🟡 CHK009 - Especificar intervalo de polling (sugestão: 5s, max 30min)
5. 🟡 CHK022 - Definir comportamento offline do PWA

---

**Autor**: GitHub Copilot  
**Próxima revisão**: Antes de iniciar Fase 0
