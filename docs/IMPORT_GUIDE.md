# 🚀 COMO IMPORTAR O CURSO - Guia Rápido

## ✅ Problema Resolvido
- Backend agora cria lesson plans com técnicas automaticamente
- Cronograma exibe técnicas visualmente com cards premium
- Navegação funciona entre Cronograma → Editor de Aulas

---

## 📋 3 Formas de Importar

### 🌐 Opção 1: Interface Web (RECOMENDADA)

1. **Abra o navegador**:
   ```
   http://localhost:3000/test-import-browser.html
   ```

2. **Selecione o arquivo**:
   - Clique em "📂 Selecionar cursofaixabranca.json"
   - Escolha o arquivo no Desktop: `C:\Users\trcar\Desktop\cursofaixabranca.json`

3. **Clique em "🚀 Importar Curso com Técnicas"**

4. **Acompanhe o log** - você verá:
   - ✅ Curso importado com sucesso
   - ✅ 35 lesson plans criados
   - ✅ Técnicas vinculadas automaticamente

5. **Navegue para**:
   ```
   http://localhost:3000/#courses
   ```
   - Clique no curso "Krav Maga Faixa Branca"
   - Vá para aba "Cronograma"
   - Você verá todas as técnicas organizadas por aula!

---

### 💻 Opção 2: Via Node.js Script

1. **Execute o script**:
   ```bash
   node scripts/test-course-import.js
   ```

2. **O script vai**:
   - ✅ Buscar o JSON (tenta 3 locais automaticamente)
   - ✅ Importar via API HTTP
   - ✅ Validar lesson plans criados
   - ✅ Mostrar estrutura do cronograma

3. **Output esperado**:
   ```
   ✅ Course imported successfully!
   📊 Lesson Plans: 35
   📊 Lessons with Techniques: 35
   📊 Total Technique Links: ~70
   ```

---

### 🎯 Opção 3: Via Interface do Sistema

1. **Vá para**:
   ```
   http://localhost:3000/#import
   ```

2. **Upload do JSON**:
   - Arraste ou selecione `cursofaixabranca.json`
   - Marque "✅ Criar técnicas automaticamente"
   - Clique em "Importar"

---

## 🔍 Verificar se Funcionou

### 1. Via Dashboard
```
http://localhost:3000/#courses
```
- Deve aparecer: "Krav Maga Faixa Branca"
- Clique nele e vá para "Cronograma"
- Você verá cards premium com:
  - 📅 Semanas (1 a 18)
  - 📝 Aulas por semana
  - 🥋 Técnicas com badges coloridos
  - ✏️ Botão "Editar Aula"

### 2. Via Course Editor
```
http://localhost:3000/#course-editor/krav-maga-faixa-branca-2025
```
- Aba "Cronograma" mostra:
  - Grid de semanas
  - Cards expandidos de aulas
  - Grid de técnicas com categoria/dificuldade/duração

### 3. Via Banco de Dados
```sql
-- Verificar lesson plans criados
SELECT COUNT(*) as total_lessons
FROM "LessonPlan"
WHERE "courseId" = 'krav-maga-faixa-branca-2025';
-- Deve retornar: 35

-- Verificar técnicas vinculadas
SELECT COUNT(*) as total_links
FROM "LessonPlanTechniques" lpt
JOIN "LessonPlan" lp ON lp.id = lpt."lessonPlanId"
WHERE lp."courseId" = 'krav-maga-faixa-branca-2025';
-- Deve retornar: ~70 (depende do JSON)

-- Ver estrutura de uma aula
SELECT 
    lp.title,
    lp."lessonNumber",
    lp."weekNumber",
    t.name as technique_name,
    t.category,
    lpt.order,
    lpt."allocationMinutes"
FROM "LessonPlan" lp
JOIN "LessonPlanTechniques" lpt ON lp.id = lpt."lessonPlanId"
JOIN "Technique" t ON lpt."techniqueId" = t.id
WHERE lp."courseId" = 'krav-maga-faixa-branca-2025'
ORDER BY lp."lessonNumber", lpt.order
LIMIT 10;
```

---

## 🐛 Troubleshooting

### Erro: "Request timeout"
**Causa**: Muitas técnicas para criar/validar (20 técnicas no JSON)

**Solução**:
1. Backend agora tem logs detalhados
2. Verifique o terminal do servidor (`npm run dev`)
3. Você verá:
   ```
   🔍 Validating 20 techniques...
   ✅ Found X techniques by ID
   ⚠️ Y techniques not found by ID, will try name matching
   ```

### Erro: "400 Bad Request"
**Causa**: Validação falhou no endpoint

**Solução**:
1. Verifique o console do navegador
2. Logs no terminal do servidor mostrarão qual campo está faltando
3. Formato esperado:
   ```json
   {
     "courseId": "string",
     "name": "string",
     "techniques": [{id, name}],
     "schedule": {weeks, lessonsPerWeek},
     "createMissingTechniques": true
   }
   ```

### Técnicas não aparecem
**Causa**: IDs das técnicas no JSON não existem no banco

**Solução**:
1. Sempre use `createMissingTechniques: true`
2. Backend vai criar automaticamente as 20 técnicas
3. Categoria é inferida do nome (postura, soco, chute, defesa, queda)

### Cronograma vazio
**Causa**: Schedule não foi processado

**Solução**:
1. Verifique se o JSON tem a seção `schedule.lessonsPerWeek`
2. Cada semana deve ter array `focus` com IDs de técnicas:
   ```json
   {
     "week": 1,
     "lessons": 2,
     "focus": [
       {"id": "a1b2c3...", "name": "postura-guarda-de-boxe"},
       {"id": "a1b2c3...", "name": "soco-jab"}
     ]
   }
   ```

---

## 🎨 O Que Você Vai Ver

### Cronograma Premium
```
╔════════════════════════════════════════════╗
║ 📅 Semana 1                    [2 aulas]  ║
╠════════════════════════════════════════════╣
║                                            ║
║  [Aula 1] Semana 1 - Aula 1    [✏️ Editar]║
║                                            ║
║  🥋 Técnicas Base (2)                      ║
║  ┌──────────────────────────────────────┐ ║
║  │ #1 postura-guarda-de-boxe            │ ║
║  │    [STANCE] Nível 1 | ⏱️ 15min       │ ║
║  └──────────────────────────────────────┘ ║
║  ┌──────────────────────────────────────┐ ║
║  │ #2 postura-posicao-ortodoxa          │ ║
║  │    [STANCE] Nível 1 | ⏱️ 15min       │ ║
║  └──────────────────────────────────────┘ ║
║                                            ║
║  [➕ Adicionar/Gerenciar Técnicas]        ║
╚════════════════════════════════════════════╝
```

### Badges Coloridos
- 🔵 **STANCE** (Posturas) - Azul
- 🔴 **ATTACK** (Ataques) - Vermelho
- 🟢 **DEFENSE** (Defesas) - Verde
- 🟡 **FALL** (Quedas) - Amarelo
- 🟣 **TACTICS** (Táticas) - Roxo

---

## ✅ Checklist Final

Depois de importar, verifique:

- [ ] Curso aparece em http://localhost:3000/#courses
- [ ] Aba "Cronograma" mostra 18 semanas
- [ ] Cada semana tem 2 aulas (total 35 aulas)
- [ ] Aulas mostram técnicas com badges coloridos
- [ ] Botão "✏️ Editar Aula" funciona
- [ ] Botão "➕ Adicionar Técnicas" abre modal
- [ ] Navegação entre módulos funciona
- [ ] Console do navegador sem erros

---

## 🚀 Próximo Passo: Testar IA

Depois de importar e verificar:

1. Clique em "✏️ Editar Aula" em qualquer aula
2. No editor de lesson plans, você verá a aula carregada
3. (Futuro) Botão "✨ Melhorar com IA" vai sugerir:
   - Melhoria na descrição
   - Ajuste de duração
   - Técnicas complementares
   - Sequência pedagógica

---

**Data**: 04/10/2025  
**Status**: ✅ Pronto para Importar  
**Arquivos Criados**:
- `public/test-import-browser.html` (Interface web)
- `scripts/test-course-import.js` (Script Node.js)
- Logs melhorados no backend
