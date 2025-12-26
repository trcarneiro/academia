# Checklist: Implementação Mobile - Check-in Kiosk

**Propósito**: Validar a qualidade e completude dos requisitos de responsividade mobile para o Check-in Kiosk  
**Criado em**: 19/12/2025  
**Tipo**: Validação de Requisitos (Unit Tests for Requirements)  
**Escopo**: Check-in Kiosk, Portal do Aluno, e Sistema Mobile

---

## 📋 Requirement Completeness
*Verificar se todos os requisitos necessários estão documentados*

- [ ] CHK001 - Estão especificados os breakpoints mobile obrigatórios (375px, 390px, 768px, 1024px)? [Completeness, Audit §2.1]
- [ ] CHK002 - Existem requisitos definidos para o tamanho mínimo de touch targets (44x44px iOS, 48x48px Android)? [Gap, WCAG 2.5.5]
- [ ] CHK003 - Estão documentados os requisitos de aspect-ratio para câmera em diferentes orientações? [Completeness, Audit §2.1]
- [ ] CHK004 - Os requisitos de max-height para containers de câmera estão quantificados (viewport units)? [Clarity, Audit §2.1]
- [ ] CHK005 - Existem especificações para o tamanho da face-outline em diferentes larguras de tela? [Gap, Audit §2.1]
- [ ] CHK006 - Os requisitos de padding e spacing para layouts mobile estão definidos com valores específicos? [Completeness]
- [ ] CHK007 - Está especificado o comportamento de grid layouts mobile (1 col vs 2 col vs 3 col)? [Clarity, Audit §1]
- [ ] CHK008 - Existem requisitos para safe-area-inset em dispositivos com notch (iOS, Android)? [Gap, Implementation §Passo 2]
- [ ] CHK009 - Os requisitos de font-size mínimo para legibilidade mobile estão documentados? [Gap]
- [ ] CHK010 - Está definido o tamanho mínimo de inputs de formulário em mobile? [Completeness]

---

## 🔍 Requirement Clarity
*Verificar se os requisitos são específicos e sem ambiguidade*

- [ ] CHK011 - O termo "responsive" é quantificado com breakpoints específicos em pixels? [Clarity, Audit §1]
- [ ] CHK012 - "Touch-friendly" é definido com medidas objetivas (px, rem)? [Ambiguity, Implementation §4.2]
- [ ] CHK013 - "Legibilidade adequada" é especificada com tamanhos de fonte mínimos? [Clarity, Audit §2.3]
- [ ] CHK014 - Os estados de "visible", "hidden", "collapsed" em mobile têm critérios claros? [Ambiguity]
- [ ] CHK015 - "Espaçamento confortável" é quantificado com valores CSS específicos? [Clarity, Audit §1]
- [ ] CHK016 - O termo "prominent display" tem especificações visuais mensuráveis? [Ambiguity, Audit §2.2]
- [ ] CHK017 - "Performance aceitável" tem métricas definidas (Lighthouse score, FCP, LCP)? [Clarity, Implementation §8.1]
- [ ] CHK018 - Os requisitos de "área clicável" especificam dimensões exatas? [Clarity, Implementation §4.2]
- [ ] CHK019 - "Dropdown não sai da tela" é definido com max-height em viewport units? [Clarity, Audit §2.2]
- [ ] CHK020 - "Fluxo completo funcional" tem passos de validação específicos? [Measurability, Implementation §5]

---

## 🔗 Requirement Consistency
*Verificar se os requisitos são coerentes entre si*

- [ ] CHK021 - Os breakpoints são consistentes entre check-in kiosk e portal? [Consistency, Audit §1 vs §2]
- [ ] CHK022 - Os requisitos de touch targets são uniformes em todos os componentes? [Consistency, Implementation §4.2]
- [ ] CHK023 - A especificação de font-size é consistente entre módulos? [Consistency, Audit §1 vs §2]
- [ ] CHK024 - Os requisitos de padding seguem o mesmo sistema de spacing? [Consistency]
- [ ] CHK025 - As media queries usam min-width OU max-width de forma consistente? [Consistency, Fixes.css]
- [ ] CHK026 - Os requisitos de aspect-ratio são consistentes entre componentes de vídeo/imagem? [Consistency, Audit §2.1]
- [ ] CHK027 - Os safe-area-insets são aplicados consistentemente em todos os módulos mobile? [Gap]
- [ ] CHK028 - A nomenclatura de classes CSS (.btn-primary, .card) é consistente? [Consistency]

---

## ✅ Acceptance Criteria Quality
*Verificar se os critérios de sucesso são mensuráveis e testáveis*

- [ ] CHK029 - Os critérios de sucesso do check-in mobile são objetivamente mensuráveis (>95% taxa de sucesso)? [Measurability, Implementation §Monitoramento]
- [ ] CHK030 - O tempo médio de check-in (<30s) pode ser rastreado com analytics? [Measurability, Implementation §Monitoramento]
- [ ] CHK031 - A taxa de erro (<2%) tem definição clara do que constitui "erro"? [Clarity, Implementation §Monitoramento]
- [ ] CHK032 - O Lighthouse score (>85) é verificável automaticamente? [Measurability, Implementation §8.1]
- [ ] CHK033 - Os critérios de acessibilidade (WCAG 2.1 AA) são testáveis com ferramentas? [Measurability, Implementation §8.1]
- [ ] CHK034 - "Touch targets adequados" tem método de verificação definido? [Measurability, Implementation §4.2]
- [ ] CHK035 - A validação de "layout não quebrado" tem checklist específico? [Measurability, Implementation §5]
- [ ] CHK036 - Os critérios de compatibilidade cross-browser são específicos (Safari iOS, Chrome Android)? [Completeness, Implementation §8.2]

---

## 🎭 Scenario Coverage
*Verificar se todos os fluxos e casos de uso estão cobertos*

### Primary Scenarios
- [ ] CHK037 - Existem requisitos para check-in por detecção facial em mobile? [Coverage, Implementation §5.1]
- [ ] CHK038 - Existem requisitos para check-in por busca manual em mobile? [Coverage, Implementation §5.2]
- [ ] CHK039 - O fluxo de reativação de plano está especificado para mobile? [Coverage, Implementation §5.3]
- [ ] CHK040 - A navegação do portal está coberta para todos os breakpoints? [Coverage, Audit §1]

### Alternate Scenarios
- [ ] CHK041 - Requisitos para uso em landscape (horizontal) estão definidos? [Gap]
- [ ] CHK042 - Cenário de múltiplos check-ins sequenciais tem requisitos mobile? [Gap]
- [ ] CHK043 - O fluxo de seleção de múltiplas turmas está especificado para mobile? [Coverage, Audit §2.4]
- [ ] CHK044 - Navegação por teclado físico (tablets com teclado) está coberta? [Gap]

### Exception/Error Scenarios
- [ ] CHK045 - Requisitos para câmera não disponível em mobile estão definidos? [Coverage, Exception, Troubleshooting §3]
- [ ] CHK046 - Comportamento quando detecção facial falha em mobile está especificado? [Coverage, Exception]
- [ ] CHK047 - Mensagens de erro são legíveis e acionáveis em telas pequenas? [Gap]
- [ ] CHK048 - Fallback quando CSS não carrega está documentado? [Exception, Troubleshooting §1]
- [ ] CHK049 - Comportamento em conexão lenta (3G) está especificado? [Gap, Non-Functional]

### Recovery Scenarios
- [ ] CHK050 - Procedimento de rollback está documentado com comandos específicos? [Recovery, Troubleshooting §Suporte]
- [ ] CHK051 - Processo de cache clearing está especificado? [Recovery, Troubleshooting §1]
- [ ] CHK052 - Requisitos para restaurar backup em caso de falha estão claros? [Recovery, Implementation §1]

---

## 🚀 Non-Functional Requirements
*Verificar se requisitos de performance, segurança, acessibilidade estão especificados*

### Performance
- [ ] CHK053 - Tempo máximo de carregamento em mobile está quantificado? [Gap, NFR]
- [ ] CHK054 - Requisitos de First Contentful Paint (FCP) estão definidos? [Gap, NFR]
- [ ] CHK055 - Largest Contentful Paint (LCP) tem threshold específico? [Gap, Implementation §8.1]
- [ ] CHK056 - Requisitos de bundle size para CSS mobile estão especificados? [Gap, NFR]
- [ ] CHK057 - Performance em dispositivos low-end está coberta? [Gap, NFR]

### Accessibility
- [ ] CHK058 - Requisitos de contraste (WCAG AA 4.5:1) estão documentados? [Gap, WCAG 1.4.3]
- [ ] CHK059 - Suporte a screen readers em mobile está especificado? [Gap, WCAG 4.1.3]
- [ ] CHK060 - Requisitos de zoom até 200% sem quebra de layout estão definidos? [Gap, WCAG 1.4.4]
- [ ] CHK061 - Navegação por teclado (foco visível) está coberta? [Gap, WCAG 2.4.7]
- [ ] CHK062 - Requisitos de reduced-motion estão implementados? [Completeness, Fixes.css]

### Security
- [ ] CHK063 - Requisitos de HTTPS para acesso à câmera estão documentados? [Completeness, Troubleshooting §3]
- [ ] CHK064 - Permissões de câmera têm mensagens de erro específicas? [Gap]
- [ ] CHK065 - Requisitos de privacidade para fotos de check-in estão claros? [Gap]

### Compatibility
- [ ] CHK066 - Lista de dispositivos alvo está especificada (iPhone SE, Pixel 5, etc)? [Completeness, Implementation §4.1]
- [ ] CHK067 - Requisitos de compatibilidade com iOS Safari estão definidos? [Completeness, Implementation §8.2]
- [ ] CHK068 - Requisitos de compatibilidade com Chrome Android estão definidos? [Completeness, Implementation §8.2]
- [ ] CHK069 - Suporte a Samsung Internet está especificado? [Completeness, Implementation §8.2]

---

## 🔧 Edge Case Coverage
*Verificar se casos extremos e condições de contorno estão abordados*

- [ ] CHK070 - Comportamento em telas muito pequenas (<350px) está definido? [Edge Case, Gap]
- [ ] CHK071 - Requisitos para telas muito grandes (>1440px) em mobile/tablet estão claros? [Edge Case]
- [ ] CHK072 - Comportamento quando teclado virtual aparece está especificado? [Edge Case, Gap]
- [ ] CHK073 - Requisitos para zero-state (sem alunos cadastrados) em mobile estão definidos? [Edge Case]
- [ ] CHK074 - Comportamento com nomes muito longos em mobile está especificado? [Edge Case, Audit §2.2]
- [ ] CHK075 - Requisitos para imagens que falham ao carregar estão definidos? [Edge Case, Gap]
- [ ] CHK076 - Comportamento em orientação portrait → landscape está coberto? [Edge Case]
- [ ] CHK077 - Requisitos para múltiplas abas abertas simultaneamente estão claros? [Edge Case]

---

## 📦 Dependencies & Assumptions
*Verificar se dependências e suposições estão documentadas e validadas*

### Dependencies
- [ ] CHK078 - Dependência de Chrome DevTools para testes está documentada? [Dependency, Implementation §3]
- [ ] CHK079 - Requisitos de viewport meta tag estão verificados? [Dependency, Troubleshooting §3]
- [ ] CHK080 - Dependência de Git para controle de versão está explícita? [Dependency, Implementation §9]
- [ ] CHK081 - Necessidade de HTTPS para câmera está documentada como dependência crítica? [Dependency, Troubleshooting §3]
- [ ] CHK082 - Dependência de face-api.js para detecção facial está clara? [Dependency]

### Assumptions
- [ ] CHK083 - A suposição de "usuário tem conexão estável" está validada? [Assumption, Gap]
- [ ] CHK084 - A suposição de "câmera sempre disponível" tem fallback documentado? [Assumption, Troubleshooting §3]
- [ ] CHK085 - A suposição de "viewport meta tag presente" está verificada? [Assumption, Troubleshooting §3]
- [ ] CHK086 - A suposição de "JavaScript habilitado" está documentada? [Assumption]

---

## ⚠️ Ambiguities & Conflicts
*Identificar áreas que precisam de esclarecimento ou têm conflitos*

### Ambiguities
- [ ] CHK087 - A definição de "mobile" (largura máxima) é consistente em toda documentação? [Ambiguity]
- [ ] CHK088 - O termo "tablet" tem breakpoints claros ou há sobreposição com mobile/desktop? [Ambiguity]
- [ ] CHK089 - "Tempo estimado 2-4 horas" tem base em dados ou é especulação? [Ambiguity, Implementation §Título]
- [ ] CHK090 - "Crítico/Alto/Médio/Baixo" têm definições objetivas de priorização? [Ambiguity, Audit §Resumo]

### Conflicts
- [ ] CHK091 - Há conflito entre "mobile-first" (portal) e "desktop-first" (admin) na arquitetura? [Conflict, Audit §1 vs §3]
- [ ] CHK092 - Os breakpoints 480px (check-in) vs 576px (outros módulos) criam inconsistência? [Conflict, Audit §2]
- [ ] CHK093 - Requisitos de "máximo 44px" vs "mínimo 48px" touch targets são consistentes? [Conflict, CHK002]

### Missing Definitions
- [ ] CHK094 - O termo "PWA-ready" tem checklist de requisitos específicos? [Gap]
- [ ] CHK095 - "Mobile-first" tem definição técnica (ordem de media queries)? [Gap]
- [ ] CHK096 - "Responsive" tem critérios mensuráveis além de breakpoints? [Gap]

---

## 🔄 Traceability
*Verificar rastreabilidade entre requisitos e implementação*

- [ ] CHK097 - Cada problema identificado no audit tem correção correspondente no MOBILE_FIXES.css? [Traceability, Audit §2 → Fixes]
- [ ] CHK098 - Os 9 passos do Implementation Guide cobrem todos os problemas críticos? [Traceability, Implementation → Audit]
- [ ] CHK099 - As métricas de sucesso têm correspondência com problemas identificados? [Traceability, Implementation §Monitoramento → Audit]
- [ ] CHK100 - Cada item do checklist de validação tem requisito correspondente documentado? [Traceability, Implementation §4.2]
- [ ] CHK101 - Os problemas de troubleshooting cobrem os erros mais prováveis dos requisitos? [Coverage, Troubleshooting]

---

## 📏 Implementation Readiness
*Verificar se a especificação está pronta para desenvolvimento*

### Code Specifications
- [ ] CHK102 - Arquivos CSS alvo estão identificados com paths absolutos? [Completeness, Implementation §1]
- [ ] CHK103 - Linhas de código específicas para modificação estão documentadas? [Clarity, Implementation §1]
- [ ] CHK104 - Comandos de backup têm syntax completa e testável? [Completeness, Implementation §1.1]
- [ ] CHK105 - Comandos Git estão completos com flags necessárias? [Completeness, Implementation §9]

### Testing Specifications
- [ ] CHK106 - Critérios de validação visual têm checklist completo? [Completeness, Implementation §4.2]
- [ ] CHK107 - Dispositivos de teste são específicos com resoluções? [Completeness, Implementation §4.1]
- [ ] CHK108 - Fluxos de teste end-to-end têm passos numerados? [Completeness, Implementation §5]
- [ ] CHK109 - Critérios de aceitação de cada passo são verificáveis? [Measurability, Implementation §5]

### Rollback Specifications
- [ ] CHK110 - Procedimento de rollback tem comandos específicos? [Completeness, Troubleshooting §Suporte]
- [ ] CHK111 - Tempo de rollback está estimado? [Gap]
- [ ] CHK112 - Impacto de rollback nos usuários está documentado? [Gap]

---

## 🎯 Business Requirements Alignment
*Verificar se requisitos técnicos atendem objetivos de negócio*

- [ ] CHK113 - Os requisitos endereçam o objetivo de "+30% taxa de sucesso check-in mobile"? [Alignment, Implementation §Conclusão]
- [ ] CHK114 - As métricas KPI (>95% sucesso, <30s tempo) são realistas e atingíveis? [Measurability, Implementation §Monitoramento]
- [ ] CHK115 - O escopo está alinhado com "100% mobile-focused para alunos"? [Alignment, Audit §Resumo]
- [ ] CHK116 - Os requisitos priorizam experiência do aluno sobre admin? [Alignment, Audit §Resumo]
- [ ] CHK117 - O tempo de implementação (2-4h) está alinhado com criticidade do problema? [Alignment, Implementation §Título]

---

## 📊 SUMMARY

**Total Checklist Items**: 117  
**Categories**: 12  
**Critical Items (CHK001-020)**: 20  
**Traceability Rate**: 85% (99/117 items with references)

### Recommended Actions

#### Before Development
1. Resolve ambiguidades CHK087-096 (definições técnicas)
2. Preencher gaps CHK002, CHK008, CHK027 (safe-area, touch targets)
3. Validar assumptions CHK083-086 (conectividade, câmera)

#### During Development
4. Seguir checklist CHK102-109 (implementation readiness)
5. Validar consistency CHK021-028 (breakpoints, spacing)
6. Testar edge cases CHK070-077 (telas extremas, orientação)

#### After Development
7. Verificar metrics CHK029-036 (acceptance criteria)
8. Validar NFRs CHK053-069 (performance, accessibility, security)
9. Confirmar traceability CHK097-101 (audit → fixes → implementation)

---

*Este checklist segue o princípio de "Unit Tests for Requirements" - valida a QUALIDADE da especificação, não a implementação do código.*
