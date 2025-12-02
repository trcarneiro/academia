# Checklist: Portal do Aluno - Qualidade de Requisitos

**Propósito**: Validar a qualidade, completude e clareza dos requisitos documentados na especificação do Portal do Aluno.  
**Criado**: 30/11/2025  
**Spec Version**: 1.2  
**Tipo**: Qualidade de Requisitos (Unit Tests for English)

---

## Requirement Completeness

Verificar se todos os requisitos necessários estão documentados.

- [ ] CHK001 - São os fluxos de recuperação de falha definidos para cada método de pagamento (PIX timeout, boleto expirado, cartão recusado)? [Gap, Spec §5.1]
- [ ] CHK002 - Está especificado o comportamento quando o Asaas está indisponível durante cadastro? [Gap, Spec §1.1]
- [ ] CHK003 - São definidos requisitos de timeout para cada operação crítica (login, pagamento, agendamento)? [Gap, NFR]
- [ ] CHK004 - Está documentado o limite de sessões simultâneas por aluno? [Gap, Spec §StudentSession]
- [ ] CHK005 - São especificados requisitos de cache para dados do dashboard? [Gap, Spec §2]
- [ ] CHK006 - Está definido o comportamento offline para o PWA? [Gap, Spec §Responsividade]
- [ ] CHK007 - São documentados requisitos de acessibilidade (WCAG)? [Gap, NFR]
- [ ] CHK008 - Está especificado o fluxo quando o aluno tenta agendar aula em turma lotada? [Gap, Spec §4.1]
- [ ] CHK009 - São definidos requisitos de notificação para webhooks Asaas com falha? [Gap, Spec §Integrações]
- [ ] CHK010 - Está documentado o comportamento quando Magic Link expira durante digitação? [Gap, Spec §1.3]

---

## Requirement Clarity

Verificar se os requisitos são específicos e sem ambiguidades.

- [ ] CHK011 - É "aprovação instantânea" para PIX quantificada com tempo específico (ex: < 30 segundos)? [Clarity, Spec §5.1]
- [ ] CHK012 - São "5 tentativas de login" especificadas com janela de tempo clara? [Clarity, Spec §Segurança]
- [ ] CHK013 - É "bloqueio temporário" após 10 falhas quantificado (duração em minutos)? [Clarity, Spec §Segurança]
- [ ] CHK014 - São "botões grandes" no mobile definidos com tamanho mínimo em pixels? [Clarity, Spec §Responsividade]
- [ ] CHK015 - É "expiração de 7 dias" para JWT contada a partir de qual evento? [Clarity, Spec §Segurança]
- [ ] CHK016 - São "3 vagas disponíveis" atualizadas em tempo real ou com delay aceitável? [Clarity, Spec §4.1]
- [ ] CHK017 - É "< 3 minutos" para cadastro medido do início ao fim de qual fluxo específico? [Clarity, Spec §Métricas]
- [ ] CHK018 - São "reposições ilimitadas" realmente ilimitadas ou há limite mensal não documentado? [Clarity, Spec §4.1]
- [ ] CHK019 - É "atualizada automaticamente em até 5 minutos" um SLA ou estimativa? [Clarity, Spec §5.1]
- [ ] CHK020 - São os "planos e preços" estruturados no schema Prisma ou apenas exemplos? [Clarity, Spec §Onboarding]

---

## Requirement Consistency

Verificar se os requisitos são consistentes entre si.

- [ ] CHK021 - São os campos de cadastro (nome, email, cpf, telefone) consistentes entre spec, API e Prisma? [Consistency, Spec §1.1 vs §API]
- [ ] CHK022 - É o modelo `Student` da spec compatível com o modelo existente no schema.prisma? [Consistency, Spec §Modelo vs Prisma]
- [ ] CHK023 - São as rotas `/api/portal/register` vs `/api/portal/auth/register` consistentes na spec? [Consistency, Spec §API]
- [ ] CHK024 - É a estrutura de resposta `{ success, student, token }` consistente em todos endpoints de auth? [Consistency, Spec §API]
- [ ] CHK025 - São os status de pagamento (PENDING, PAID, OVERDUE, CANCELLED) consistentes com Asaas? [Consistency, Spec §Modelo vs Asaas]
- [ ] CHK026 - É o campo `password` obrigatório no cadastro mas opcional com Magic Link? [Consistency, Spec §1.1 vs §1.3]
- [ ] CHK027 - São os campos de Student no Prisma (email único) compatíveis com multi-tenant? [Consistency, Spec §Modelo]
- [ ] CHK028 - É a expiração do Magic Code (5 min no service) consistente com a spec? [Consistency, Spec §1.3 vs Implementation]

---

## Acceptance Criteria Quality

Verificar se os critérios de aceitação são mensuráveis.

- [ ] CHK029 - Pode "80% cadastros self-service" ser medido objetivamente? [Measurability, Spec §Métricas]
- [ ] CHK030 - São critérios de "técnica dominada" objetivamente definidos? [Measurability, Spec §6]
- [ ] CHK031 - É "reduzir 70% tickets" medido contra baseline documentado? [Measurability, Spec §Métricas]
- [ ] CHK032 - Pode "taxa de conclusão onboarding > 85%" ser rastreada no sistema? [Measurability, Spec §Métricas]
- [ ] CHK033 - São critérios para "progresso de faixa" definidos com requisitos específicos? [Measurability, Spec §6]
- [ ] CHK034 - É "QR Code funcional" testável com critérios de aceitação? [Measurability, Spec §Killer Features]
- [ ] CHK035 - São "ações do assistente IA" definidas com escopo claro? [Measurability, Spec §7]

---

## Scenario Coverage

Verificar se todos os cenários estão cobertos.

- [ ] CHK036 - São cenários de aluno menor de idade documentados (responsável financeiro)? [Coverage, Spec §1.1]
- [ ] CHK037 - Está especificado o cenário de troca de plano com cobrança proporcional? [Coverage, Spec §5]
- [ ] CHK038 - São cenários de cancelamento de matrícula com reembolso documentados? [Coverage, Spec §5]
- [ ] CHK039 - Está definido o fluxo quando aluno perde aula sem justificativa? [Coverage, Spec §4]
- [ ] CHK040 - São cenários de conflito de agendamento (mesma aula, mesmo horário) tratados? [Coverage, Spec §4.1]
- [ ] CHK041 - Está especificado o comportamento quando instrutor falta e aula é cancelada? [Coverage, Spec §4]
- [ ] CHK042 - São cenários de migração de dados de alunos existentes documentados? [Coverage, Gap]
- [ ] CHK043 - Está definido o fluxo de aluno que já existe no Asaas mas não no sistema? [Coverage, Spec §Asaas]
- [ ] CHK044 - São cenários de multi-unidade (aluno frequenta mais de uma unidade) tratados? [Coverage, Spec §4]
- [ ] CHK045 - Está especificado o comportamento quando exame de faixa é reprovado? [Coverage, Spec §6]

---

## Edge Case Coverage

Verificar se casos de borda estão definidos.

- [ ] CHK046 - É especificado limite de caracteres para campo "observações" no agendamento? [Edge Case, Gap]
- [ ] CHK047 - Está definido comportamento quando CPF já existe em outra organização? [Edge Case, Spec §1.1]
- [ ] CHK048 - São tratados telefones inválidos para envio de Magic Link? [Edge Case, Spec §1.3]
- [ ] CHK049 - Está especificado limite de reenvios de Magic Link por hora? [Edge Case, Gap]
- [ ] CHK050 - É definido comportamento quando foto de perfil excede tamanho máximo? [Edge Case, Gap]
- [ ] CHK051 - Está especificado o que acontece com sessões ativas após troca de senha? [Edge Case, Spec §Segurança]
- [ ] CHK052 - São tratados caracteres especiais em nome (acentos, apóstrofo)? [Edge Case, Gap]
- [ ] CHK053 - Está definido comportamento quando webhook Asaas recebe evento duplicado? [Edge Case, Gap]
- [ ] CHK054 - É especificado limite de técnicas que podem ser marcadas por dia? [Edge Case, Spec §6]
- [ ] CHK055 - Está definido o comportamento quando aluno tenta acessar curso de faixa superior? [Edge Case, Spec §6]

---

## Non-Functional Requirements

Verificar se requisitos não-funcionais estão especificados.

- [ ] CHK056 - São requisitos de performance definidos (tempo de carregamento de páginas)? [NFR, Gap]
- [ ] CHK057 - Estão especificados requisitos de disponibilidade (uptime SLA)? [NFR, Gap]
- [ ] CHK058 - São requisitos de escalabilidade documentados (alunos simultâneos)? [NFR, Gap]
- [ ] CHK059 - Está especificado tamanho máximo de arquivos (foto, anexos)? [NFR, Gap]
- [ ] CHK060 - São requisitos de backup e recuperação documentados? [NFR, Gap]
- [ ] CHK061 - Está definida política de retenção de logs e dados de sessão? [NFR, Gap]
- [ ] CHK062 - São requisitos de auditoria (quem fez o quê) documentados? [NFR, Gap]
- [ ] CHK063 - Está especificado suporte a browsers e versões mínimas? [NFR, Gap]
- [ ] CHK064 - São requisitos de SEO para landing page documentados? [NFR, Spec §Landing]
- [ ] CHK065 - Está definida política de rate limiting para APIs do portal? [NFR, Spec §Segurança]

---

## Dependencies & Assumptions

Verificar se dependências e premissas estão documentadas.

- [ ] CHK066 - É a dependência de Z-API/Twilio para WhatsApp claramente documentada como opcional? [Dependency, Spec §Dependências]
- [ ] CHK067 - Estão documentados os limites de API do Asaas (rate limits, quotas)? [Dependency, Gap]
- [ ] CHK068 - É assumido que todos alunos têm smartphone com WhatsApp? [Assumption, Spec §1.3]
- [ ] CHK069 - Está documentada a dependência de CDN para vídeos de técnicas? [Dependency, Gap]
- [ ] CHK070 - São os requisitos de infraestrutura (servidor, banco) documentados? [Dependency, Gap]
- [ ] CHK071 - Está clara a dependência do modelo Student existente vs novo? [Dependency, Spec §Modelo]
- [ ] CHK072 - É assumido que CPF é único por pessoa (não por organização)? [Assumption, Spec §1.1]

---

## Ambiguities & Conflicts

Identificar ambiguidades e conflitos nos requisitos.

- [ ] CHK073 - É ambíguo se "Plano Mensal Completo" é exemplo ou requisito fixo? [Ambiguity, Spec §5]
- [ ] CHK074 - Há conflito entre "acesso ilimitado às aulas" e "2 modalidades incluídas"? [Conflict, Spec §5]
- [ ] CHK075 - É ambíguo se JWT de 7 dias é renovável automaticamente? [Ambiguity, Spec §Segurança]
- [ ] CHK076 - Há conflito entre Student.email @unique e multi-tenant organizationId? [Conflict, Spec §Modelo]
- [ ] CHK077 - É ambíguo se "próximo exame" é automático ou agendado manualmente? [Ambiguity, Spec §6]
- [ ] CHK078 - Há conflito entre Magic Link "sem senha" e campo senha obrigatório no cadastro? [Conflict, Spec §1.1 vs §1.3]
- [ ] CHK079 - É ambíguo o que significa "escala para humano" no chat IA? [Ambiguity, Spec §7]
- [ ] CHK080 - Há conflito entre "90% acessos pelo celular" e wireframes de desktop? [Conflict, Spec §Responsividade]

---

## Traceability

Verificar rastreabilidade entre requisitos.

- [ ] CHK081 - Cada endpoint da API está mapeado para uma funcionalidade na spec? [Traceability, Spec §API]
- [ ] CHK082 - Os campos do modelo Prisma têm correspondência com os wireframes? [Traceability, Spec §Modelo vs UI]
- [ ] CHK083 - As métricas de sucesso têm implementação técnica documentada? [Traceability, Spec §Métricas]
- [ ] CHK084 - Cada fase do roadmap tem dependências claramente mapeadas? [Traceability, Spec §Roadmap]
- [ ] CHK085 - Os tipos de notificação (PAYMENT, CLASS, etc.) estão implementados nos fluxos? [Traceability, Spec §8 vs Modelo]

---

## Summary

| Categoria | Total | Status |
|-----------|-------|--------|
| Completeness | 10 | ⬜ |
| Clarity | 10 | ⬜ |
| Consistency | 8 | ⬜ |
| Acceptance Criteria | 7 | ⬜ |
| Scenario Coverage | 10 | ⬜ |
| Edge Cases | 10 | ⬜ |
| NFR | 10 | ⬜ |
| Dependencies | 7 | ⬜ |
| Ambiguities | 8 | ⬜ |
| Traceability | 5 | ⬜ |
| **TOTAL** | **85** | **⬜** |

---

**Próximos Passos**:
1. Revisar cada item do checklist com stakeholders
2. Documentar resoluções para gaps identificados
3. Atualizar spec.md com clarificações necessárias
4. Validar consistência com implementation atual

**Nota**: Este checklist testa a QUALIDADE DOS REQUISITOS escritos na spec, não a implementação do sistema.
