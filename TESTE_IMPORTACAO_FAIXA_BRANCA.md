# Guia de Teste - Importacao do Curso Faixa Branca

## Status Atual
- ✅ Endpoint de importacao criado: POST /api/courses/import-full-course
- ✅ Arquivo JSON preparado: src/cursofaixabranca.json (18 semanas, 35 aulas, 20 tecnicas)
- ✅ CourseImportService implementado com batch operations (otimizado)
- ✅ Interface de cronograma refatorada para exibir aulas expandidas
- ✅ Navegacao entre modulos implementada (cronograma → tecnicas/lesson-plans)

## Opcao 1: Teste pela Interface Web (RECOMENDADO)

### Passo 1: Acessar o Modulo de Cursos
1. Abrir o navegador em: http://localhost:3000
2. Fazer login (ou usar dev auto-login se disponivel)
3. Navegar para o modulo "Cursos"

### Passo 2: Importar o Curso
1. Procurar botao "Importar Curso" ou similar na interface
2. Selecionar o arquivo: `src/cursofaixabranca.json`
3. Clicar em "Importar"
4. Aguardar mensagem de sucesso

### Passo 3: Validar a Importacao
1. Localizar o curso "Krav Maga Faixa Branca" na lista
2. Clicar para abrir o curso
3. Navegar para a aba "Cronograma"
4. Verificar:
   - ✅ 18 semanas exibidas
   - ✅ 35 aulas distribuidas nas semanas
   - ✅ Cada aula mostra as tecnicas base
   - ✅ Cards de aula com design premium

### Passo 4: Testar Navegacao
1. Clicar em uma tecnica dentro de uma aula
   - Deve navegar para o modulo "Tecnicas" com a tecnica selecionada
2. Voltar ao cronograma
3. Clicar no card de uma aula
   - Deve navegar para o modulo "Lesson Plans" com o plano de aula selecionado

## Opcao 2: Teste pela API (Via PowerShell)

### Pre-requisito: Servidor Rodando
```powershell
# Abrir novo terminal PowerShell
cd H:\projetos\academia
npm run dev
```

### Executar o Script de Teste
```powershell
# Abrir outro terminal PowerShell
cd H:\projetos\academia
.\test-import-simple.ps1
```

### Resultado Esperado
```
========== IMPORTACAO CONCLUIDA COM SUCESSO ==========

Resultados da importacao:
   Curso criado: Krav Maga Faixa Branca
   ID do curso: [UUID]
   Slug: krav-maga-faixa-branca-2025

   Tecnicas importadas: 20
   Tecnicas criadas: [numero de tecnicas nao existentes]
   Tecnicas ignoradas: 0

   Lesson Plans criados: 35
   Semanas processadas: 18
```

## Opcao 3: Teste Manual via API (Postman/Insomnia)

### Endpoint
- **URL**: http://localhost:3000/api/courses/import-full-course
- **Metodo**: POST
- **Headers**: Content-Type: application/json
- **Body**: Conteudo completo do arquivo src/cursofaixabranca.json

### Verificacao dos Dados

#### 1. Verificar Curso Criado
```http
GET http://localhost:3000/api/courses
```
Procurar por "Krav Maga Faixa Branca" na lista

#### 2. Verificar Lesson Plans
```http
GET http://localhost:3000/api/lesson-plans?courseId=[ID_DO_CURSO]
```
Deve retornar 35 lesson plans

#### 3. Verificar Tecnicas Vinculadas
```http
GET http://localhost:3000/api/courses/[ID_DO_CURSO]
```
Verificar:
- _count.techniques = 20
- _count.lessonPlans = 35

## Estrutura do Curso Importado

### Dados Basicos
- **Nome**: Krav Maga Faixa Branca
- **Duracao**: 18 semanas
- **Total de Aulas**: 35 aulas
- **Tecnicas**: 20 tecnicas (posturas, socos, chutes, defesas, quedas)

### Distribuicao das Aulas
- Semana 1-17: 2 aulas por semana
- Semana 18: 1 aula (avaliacao final)

### Tecnicas por Categoria
1. **Posturas** (3): guarda de boxe, ortodoxa, canhota
2. **Socos** (2): jab, direto
3. **Chutes** (3): reto, empurrao, joelhada frontal
4. **Cotoveladas** (2): frontal, traseira
5. **Defesas** (5): estrangulamento (3 variacoes), agarramento (2 variacoes), soco reto
6. **Quedas** (4): tras, frente suave, lateral
7. **Rolamentos** (1): frente

## Checklist de Validacao

### Importacao
- [ ] Curso aparece na lista de cursos
- [ ] Nome correto: "Krav Maga Faixa Branca"
- [ ] Descricao presente
- [ ] Duracao: 18 semanas
- [ ] 20 tecnicas associadas
- [ ] 35 lesson plans criados

### Cronograma (Aba Schedule)
- [ ] 18 semanas visiveis
- [ ] Semanas 1-17 mostram 2 aulas cada
- [ ] Semana 18 mostra 1 aula (final)
- [ ] Cards de aula exibem titulo e numero
- [ ] Tecnicas base listadas em cada aula
- [ ] Design premium aplicado (gradientes, cards elevados)

### Navegacao
- [ ] Click em tecnica → abre modulo Tecnicas
- [ ] Tecnica correta selecionada (ID matching)
- [ ] Click em card de aula → abre modulo Lesson Plans
- [ ] Lesson plan correto exibido
- [ ] Navegacao de volta funciona (breadcrumb ou botao voltar)

### Performance
- [ ] Importacao completa em < 5 segundos
- [ ] Carregamento do cronograma em < 1 segundo
- [ ] Navegacao entre modulos instantanea
- [ ] Sem erros no console do navegador

## Solucao de Problemas

### Servidor nao esta rodando
```powershell
npm run dev
# Aguardar mensagem: Server listening at http://localhost:3000
```

### Erro "Tecnicas nao encontradas"
- O sistema tentara criar as tecnicas automaticamente
- Verificar parametro `createMissingTechniques: true` no JSON

### Erro "Organization not found"
- Verificar se existe pelo menos uma organization no banco
- Executar seed se necessario: `npm run db:seed`

### Curso ja existe
- Deletar o curso existente antes de reimportar
- Ou alterar o `courseId` no JSON

## Proximas Etapas (Apos Validacao)

1. **Testar navegacao completa** - Validar deep linking entre modulos
2. **Integrar IA no modulo Lesson Plans** - Adicionar sugestoes de IA
3. **Adicionar edicao de tecnicas extras** - Permitir adicionar tecnicas adicionais por aula
4. **Implementar duplicacao de cursos** - Facilitar criacao de novos cursos baseados em existentes

## Arquivos de Teste Criados

- `test-import-faixabranca.ts` - Script TypeScript completo (requer tsx)
- `test-import.ps1` - Script PowerShell com emojis (encoding issues)
- `test-import-simple.ps1` - Script PowerShell sem emojis (RECOMENDADO)

## Contato para Suporte

Se encontrar problemas:
1. Verificar console do navegador (F12) para erros JavaScript
2. Verificar terminal do servidor para erros backend
3. Consultar o arquivo `AGENTS.md` para padroes de importacao
4. Revisar a documentacao em `dev/WORKFLOW.md`

---

**Data**: 04/10/2025
**Status**: Pronto para teste
**Versao**: v2.0
