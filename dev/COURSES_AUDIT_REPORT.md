# 🔍 Auditoria Completa do Módulo de Cursos
**Data**: 01/10/2025  
**Versão do Sistema**: 2.0  
**Autor**: AI Agent  
**Status**: 🚨 CRÍTICO - Múltiplos problemas identificados

---

## 📊 Resumo Executivo

### ❌ Problemas Críticos Encontrados
1. **Botões de exclusão ausentes** na UI (listagem + detalhes)
2. **HTML placeholder básico** - interface não implementada (6 linhas!)
3. **Inconsistência de dados** - cursos sem técnicas associadas
4. **UX incompleta** - faltam ações importantes

### 📈 Métricas de Conformidade
- **Backend**: ✅ 90% (CRUD completo, rotas OK)
- **Frontend**: ❌ 30% (UI básica, faltam features)
- **UX Premium**: ❌ 20% (design system parcial)
- **AGENTS.md**: ⚠️ 60% (estrutura OK, features faltando)

---

## 🔧 Correções Urgentes

### 1. HTML Completo (CRÍTICO)
**Problema**: `courses.html` tem apenas 6 linhas placeholder  
**Solução**: Implementar HTML premium completo (ver arquivo separado)

### 2. Botões de Exclusão (CRÍTICO)
**Problema**: Método `deleteCourse()` existe mas nenhum botão chama  
**Solução**: Adicionar botões "🗑️ Excluir" em grid + table views

### 3. Modal de Confirmação (IMPORTANTE)
**Problema**: Usa `confirm()` nativo (feio)  
**Solução**: Modal premium com warning visual

---

## 📋 Plano de Implementação

### Sprint 1: Correção Crítica (2h)
1. Substituir HTML placeholder por interface premium
2. Adicionar botões de exclusão nos cards
3. Criar modal de confirmação
4. Testar exclusão end-to-end

### Sprint 2: Filtros e Busca (3h)
1. Implementar busca por nome
2. Filtros por status e nível
3. Ordenação configurável

### Sprint 3: Visualizações (4h)
1. Melhorar grid view (cards maiores)
2. Melhorar table view (colunas customizáveis)
3. Calendar view (timeline de cursos)

---

## 🎓 Documentação: Papel do Plano de Aula

**Definição**: O plano de aula é a unidade fundamental de ensino que prepara o aluno para executar técnicas específicas de forma segura e progressiva.

**Componentes Essenciais**:

1. **Preparação Física** (25% do tempo):
   - Alongamentos direcionados para as técnicas da aula
   - Mobilidade articular específica
   - Fortalecimento muscular preventivo
   - Condicionamento cardiovascular

2. **Aquecimento Lúdico** (15% do tempo):
   - Brincadeiras relacionadas ao tema da aula
   - Jogos de coordenação motora
   - Atividades em grupo (integração social)
   - Desenvolvimento motor básico

3. **Drills Técnicos** (40% do tempo):
   - Repetição da técnica isolada
   - Progressão gradual de complexidade
   - Correção postural contínua
   - Feedback individualizado

4. **Simulações Práticas** (15% do tempo):
   - Aplicação da técnica em contexto real
   - Sparring controlado
   - Cenários de defesa pessoal
   - Variações da técnica base

5. **Desaquecimento e Reflexão** (5% do tempo):
   - Alongamento passivo
   - Relaxamento mental
   - Feedback da aula
   - Reflexão sobre aprendizado

**Relação com Técnicas do Curso**:
- Cada curso possui técnicas definidas via `CourseTechniques`
- Cada plano de aula foca em 1-3 técnicas específicas
- Atividades são criadas para **preparar o aluno** para executar essas técnicas
- Progressão segue nível de dificuldade crescente

**"Plano de Curso"**:
- ✅ **Plano de Curso = `Course.description`** (objetivos gerais do curso)
- ✅ **Currículo Técnico = `CourseTechniques`** (técnicas que serão ensinadas)
- ✅ **Planos de Aula = `LessonPlans`** (como ensinar cada técnica)
- ❌ **NÃO existe `model CoursePlan`** no Prisma

**Fluxo Completo**:
```
Curso "Krav Maga - Iniciante"
├─ Description: "Defesa pessoal para situações urbanas..."
├─ Techniques: [Soco Direto, Chute Frontal, Defesa Gravata, ...]
└─ Lesson Plans:
   ├─ Aula 1: Preparar aluno para "Soco Direto"
   │  ├─ Alongamento de ombros
   │  ├─ Brincadeira: "Acerte o alvo"
   │  ├─ Drill: Soco no ar (100x)
   │  ├─ Simulação: Soco no saco
   │  └─ Relaxamento
   ├─ Aula 2: Preparar aluno para "Chute Frontal"
   │  ├─ Alongamento de quadril
   │  ├─ Brincadeira: "Equilibrista"
   │  └─ ...
```

---

## 🚀 Próximos Passos

1. ✅ **Auditar módulo** → COMPLETO
2. ⏳ **Corrigir HTML** → Criar courses.html premium
3. ⏳ **Adicionar botões** → Exclusão em grid/table
4. ⏳ **Testar E2E** → Excluir curso com sucesso

**Tempo Estimado**: 4h para correção crítica

---

**Arquivos Relacionados**:
- `/dev/AI_MODULE_ACTIVITIES_REFACTOR.md` - Geração de planos baseada em atividades
- `/dev/MODULE_STANDARDS.md` - Padrões de módulos (single vs multi-file)
- `AGENTS.md` - Guia operacional principal
