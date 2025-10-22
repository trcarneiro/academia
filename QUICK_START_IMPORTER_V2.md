# 🚀 Quick Start: Testar Importador v2.0

## 📋 Pré-requisitos
- ✅ Servidor backend rodando (`npm run dev`)
- ✅ Arquivo `curso-faixa-branca-completo.json` na raiz do projeto

## 🎯 Passo a Passo (5 minutos)

### 1. Reiniciar Servidor
```bash
# Se servidor estiver rodando, reiniciar para carregar novo código
# Ctrl+C para parar
npm run dev
```

### 2. Abrir Interface
- Navegar para: **http://localhost:3000/#import**
- Clicar na aba **"Cursos Completos"**

### 3. Upload do JSON
1. Clicar em **"Escolher Arquivo"**
2. Selecionar: `curso-faixa-branca-completo.json`
3. ✅ **IMPORTANTE**: Ativar checkbox **"Criar técnicas automaticamente"**
4. Clicar **"Próximo"**

### 4. Preview (Validação Visual)
Deve mostrar:
- ✅ **Versão**: v2.0.0
- ✅ **Faixas**: BRANCA → AMARELA
- ✅ **Graus**: 4 (20%, 40%, 60%, 80%)
- ✅ **Categorias**: 6 (POSTURAS, SOCOS, CHUTES, DEFESAS, QUEDAS, COMBINAÇÕES)
- ✅ **Lessons**: 35 aulas
- ✅ **Repetições Totais**: 3850

### 5. Importar
1. Clicar **"Iniciar Importação"**
2. Aguardar (~30-60 segundos)
3. Verificar mensagem de sucesso

### 6. Validar Logs do Servidor
Deve aparecer no terminal do backend:
```
🔍 Starting course import for: Krav Maga - Faixa Branca
📊 Course model version: 2.0.0
✅ All techniques validated/created successfully
✅ Course created/updated: krav-maga-faixa-branca-2025
🎓 Creating graduation system...
  ✅ Graduation system created: BRANCA → AMARELA (4 degrees)
📂 Creating activity categories...
  ✅ Created category: POSTURAS E GUARDAS (min: 100)
  ✅ Created category: SOCOS BÁSICOS (min: 200)
  ✅ Created category: CHUTES FUNDAMENTAIS (min: 150)
  ✅ Created category: DEFESAS ESSENCIAIS (min: 150)
  ✅ Created category: QUEDAS E ROLAMENTOS (min: 80)
  ✅ Created category: COMBINAÇÕES (min: 100)
  ✅ Activity categories processed: 6
📚 Creating lessons with activities...
  ✅ Lesson created: #1 - Aula 1 (5 activities)
  ✅ Lesson created: #2 - Aula 2 (6 activities)
  ...
  🎯 Checkpoint lesson created: #7 - Checkpoint 1º Grau (4 activities)
  ...
  ✅ Lessons created: 35 with 175 activities total
💾 Saving course metadata...
  ✅ Metadata saved (v2.0.0)
```

### 7. Verificar no Banco (Prisma Studio)
```bash
npx prisma studio
```

**Tabelas a checar**:
1. **courses** → 1 registro (`krav-maga-faixa-branca-2025`)
2. **course_graduation_levels** → 1 registro (BRANCA → AMARELA, 4 graus)
3. **activity_categories** → 6 registros (POSTURAS, SOCOS, CHUTES, etc.)
4. **lesson_plans** → 35 registros (Aulas 1-35)
5. **lesson_plan_activities** → ~175 registros (atividades com repetições)
6. **activities** → ~30-40 registros globais (Postura - Guarda, Soco - Jab, etc.)

---

## ✅ Checklist de Validação

- [ ] Servidor reiniciado
- [ ] JSON carregado sem erros
- [ ] Preview mostra versão v2.0.0
- [ ] Preview mostra 4 graus + 6 categorias + 35 lessons
- [ ] Importação completou sem erros
- [ ] Logs do servidor mostram criação de graus/categorias/lessons
- [ ] Prisma Studio mostra todos os dados importados
- [ ] Metadata contém `totalPlannedRepetitions: 3850`

---

## 🐛 Troubleshooting

### Erro: "Algumas técnicas não foram encontradas"
**Solução**: Ativar checkbox **"Criar técnicas automaticamente"** antes de importar

### Erro: "Category not found: posturas"
**Solução**: Verificar se `activity_categories` foi populada corretamente. Pode ser necessário limpar banco e reimportar.

### Importação demora muito (>2 minutos)
**Normal**: 175 activities sendo criadas individualmente. Considerar otimização com batch inserts.

### Erro de TypeScript ao compilar
**Solução**: Executar `npx prisma generate` para atualizar Prisma Client

---

## 📚 Documentação Completa

- **Guia Técnico**: `COURSE_IMPORTER_V2_COMPLETE.md`
- **Plano Original**: `COURSE_IMPORT_UPDATE_PLAN.md`
- **Registro no AGENTS.md**: Linha 243 (Feature completa)

---

## 🚀 Resultado Esperado

Após importação bem-sucedida:

✅ **1 Course**: Krav Maga - Faixa Branca  
✅ **1 CourseGraduationLevel**: Sistema de 4 graus  
✅ **6 ActivityCategories**: Com mínimos para graduação  
✅ **35 LessonPlans**: Com checkpoints  
✅ **~175 LessonPlanActivities**: Com repetições rastreáveis  
✅ **3850 repetições planejadas**: Metadata completo  
✅ **28 Techniques**: Criadas automaticamente  

---

**Status**: ✅ PRONTO PARA TESTE  
**Data**: 10/10/2025  
**Autor**: AI Assistant  
