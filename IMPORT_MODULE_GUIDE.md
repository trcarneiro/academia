# 🚀 Central de Importação - Guia Completo

## 📋 Visão Geral

A **Central de Importação** é um módulo unificado que permite importar diferentes tipos de dados para o sistema, com acompanhamento em tempo real, validação inteligente e relatórios detalhados.

### ✨ Funcionalidades Principais

- **3 Tipos de Importação:**
  - 📚 **Cursos Completos** (JSON com técnicas + cronograma)
  - 🥋 **Técnicas** (CSV ou JSON com lista de técnicas)
  - 👥 **Alunos** (CSV ou JSON com dados básicos)

- **4 Etapas de Processo:**
  1. **Upload** - Seleção e validação inicial do arquivo
  2. **Validação** - Verificação detalhada dos dados
  3. **Preview** - Visualização prévia antes de importar
  4. **Importação** - Execução com progress bar e logs

- **Feedback Visual:**
  - Progress bar animado (0-100%)
  - Console de logs em tempo real
  - Estatísticas simultâneas (Total, Sucesso, Erros, Avisos)
  - Relatório final com métricas de performance

---

## 📚 Tipo 1: Importação de Cursos Completos

### Formato Esperado (JSON)

```json
{
  "courseId": "krav-maga-faixa-branca-2025",
  "name": "Krav Maga Faixa Branca",
  "description": "Curso introdutório de Krav Maga para iniciantes",
  "durationTotalWeeks": 18,
  "totalLessons": 35,
  "lessonDurationMinutes": 60,
  "objectives": [
    "Desenvolver habilidades básicas de autodefesa",
    "Aprender técnicas de ataque (socos, chutes, cotoveladas)"
  ],
  "equipment": ["Luvas de boxe", "Tatame macio"],
  "difficulty": "Iniciante",
  "techniques": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-123456789001",
      "name": "postura-guarda-de-boxe"
    },
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-123456789002",
      "name": "soco-jab"
    }
  ],
  "schedule": {
    "weeks": 18,
    "lessonsPerWeek": [
      {
        "week": 1,
        "lessons": 2,
        "focus": [
          {"id": "a1b2c3d4-e5f6-7890-abcd-123456789001", "name": "postura-guarda-de-boxe"},
          "STRETCH",
          "DRILL"
        ]
      }
    ]
  }
}
```

### Campos Obrigatórios

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `courseId` | string | ID único do curso (slug) |
| `name` | string | Nome do curso |
| `techniques` | array | Lista de técnicas com ID e nome |
| `schedule` | object | Cronograma completo do curso |

### Campos Opcionais

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `description` | string | Descrição detalhada |
| `durationTotalWeeks` | number | Duração em semanas |
| `totalLessons` | number | Total de aulas |
| `objectives` | array | Objetivos do curso |
| `equipment` | array | Equipamentos necessários |
| `difficulty` | string | Nível de dificuldade |

### O Que é Importado

✅ **Curso** - Criado no banco com todos os dados  
✅ **Técnicas** - Criadas ou vinculadas ao curso  
✅ **Cronograma** - Semanas e aulas estruturadas  
✅ **Planos de Aula** - Criados automaticamente para cada aula  
✅ **Atividades** - Técnicas associadas aos planos de aula  

### Endpoint API

```
POST /api/courses/import-full-course
```

### Passo a Passo

1. **Clique na tab "📚 Cursos Completos"**
2. **Baixe o template** (botão "📥 Baixar template exemplo")
3. **Edite o JSON** com os dados do seu curso
4. **Faça upload** arrastando ou clicando na área
5. **Aguarde validação** (verifica estrutura JSON)
6. **Revise preview** (mostra resumo do curso)
7. **Inicie importação** (botão "⚡ Iniciar Importação")
8. **Acompanhe progresso** (progress bar + logs)
9. **Confira relatório** (estatísticas finais)
10. **Baixe relatório** (JSON com todos os detalhes)

---

## 🥋 Tipo 2: Importação de Técnicas

### Formato Esperado (CSV)

```csv
name,category,description,difficulty
soco-jab,PUNCH,"Soco rápido frontal com mão da frente",BEGINNER
chute-reto,KICK,"Chute frontal reto com perna traseira",BEGINNER
defesa-estrangulamento,DEFENSE,"Defesa contra estrangulamento frontal",INTERMEDIATE
```

### Formato Alternativo (JSON)

```json
[
  {
    "name": "soco-jab",
    "category": "PUNCH",
    "description": "Soco rápido frontal com mão da frente",
    "difficulty": "BEGINNER"
  },
  {
    "name": "chute-reto",
    "category": "KICK",
    "description": "Chute frontal reto com perna traseira",
    "difficulty": "BEGINNER"
  }
]
```

### Campos Obrigatórios

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `name` | string | Nome da técnica (slug) |

### Campos Opcionais

| Campo | Tipo | Valores Aceitos | Descrição |
|-------|------|----------------|-----------|
| `category` | string | PUNCH, KICK, DEFENSE, GRAPPLING, THROW | Categoria da técnica |
| `description` | string | - | Descrição detalhada |
| `difficulty` | string | BEGINNER, INTERMEDIATE, ADVANCED | Nível de dificuldade |

### O Que é Importado

✅ **Técnicas** - Criadas no banco de dados  
✅ **Categorias** - Associadas automaticamente  
✅ **Metadados** - Descrição e dificuldade salvos  

### Endpoint API

```
POST /api/techniques (múltiplas chamadas)
```

### Passo a Passo

1. **Clique na tab "🥋 Técnicas"**
2. **Baixe o template CSV** ou prepare JSON
3. **Preencha os dados** das técnicas
4. **Faça upload** do arquivo
5. **Aguarde validação** (verifica campos obrigatórios)
6. **Revise preview** (tabela com primeiras 10 técnicas)
7. **Inicie importação** (processa técnica por técnica)
8. **Veja logs** (cada técnica mostra sucesso/erro)
9. **Confira relatório** (total importado + erros)

---

## 👥 Tipo 3: Importação de Alunos

### Formato Esperado (CSV)

```csv
name,email,phone,birthDate
João Silva,joao@email.com,11999999999,1990-01-01
Maria Santos,maria@email.com,11888888888,1985-05-15
Pedro Oliveira,pedro@email.com,11777777777,2000-03-20
```

### Formato Alternativo (JSON)

```json
[
  {
    "name": "João Silva",
    "email": "joao@email.com",
    "phone": "11999999999",
    "birthDate": "1990-01-01"
  },
  {
    "name": "Maria Santos",
    "email": "maria@email.com",
    "phone": "11888888888",
    "birthDate": "1985-05-15"
  }
]
```

### Campos Obrigatórios

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `name` | string | Nome completo do aluno |

### Campos Opcionais

| Campo | Tipo | Formato | Descrição |
|-------|------|---------|-----------|
| `email` | string | email@domain.com | Email do aluno |
| `phone` | string | 11999999999 | Telefone (apenas números) |
| `birthDate` | string | YYYY-MM-DD | Data de nascimento |

### O Que é Importado

✅ **Alunos** - Criados no banco com status ACTIVE  
✅ **Usuários** - Criados automaticamente (se email fornecido)  
✅ **Contatos** - Telefone e email salvos  

### Endpoint API

```
POST /api/students (múltiplas chamadas)
```

### Passo a Passo

1. **Clique na tab "👥 Alunos"**
2. **Baixe o template CSV**
3. **Preencha os dados** dos alunos
4. **Faça upload**
5. **Aguarde validação**
6. **Revise preview**
7. **Inicie importação**
8. **Acompanhe progresso**
9. **Confira relatório**

---

## 🎯 Validações Automáticas

### Validação de Curso Completo

✅ **Estrutura JSON válida**  
✅ **Campos obrigatórios presentes** (courseId, name, techniques, schedule)  
✅ **Técnicas com ID e nome**  
✅ **Cronograma com weeks e lessonsPerWeek**  
⚠️ **Avisos** para campos opcionais vazios  

### Validação de Técnicas

✅ **Nome não vazio**  
⚠️ **Categoria válida** (PUNCH, KICK, DEFENSE, GRAPPLING, THROW)  
⚠️ **Dificuldade válida** (BEGINNER, INTERMEDIATE, ADVANCED)  

### Validação de Alunos

✅ **Nome não vazio**  
⚠️ **Email em formato válido** (se fornecido)  
⚠️ **Telefone apenas números** (se fornecido)  
⚠️ **Data de nascimento no formato YYYY-MM-DD** (se fornecida)  

---

## 📊 Console de Logs

### Tipos de Log

| Ícone | Tipo | Cor | Quando Aparece |
|-------|------|-----|----------------|
| 📝 | Info | Branco | Informações gerais |
| ✅ | Success | Verde | Operações bem-sucedidas |
| ❌ | Error | Vermelho | Erros que bloqueiam importação |
| ⚠️ | Warning | Amarelo | Avisos não bloqueantes |
| ℹ️ | Info | Azul | Informações adicionais |
| ⏳ | Processing | Roxo | Operações em andamento |

### Exemplos de Logs

```
[14:35:21] 📝 Tab alterada para: courses
[14:35:45] 📝 Arquivo selecionado: cursofaixabranca.json (size: 12.5 KB)
[14:35:46] ✅ Arquivo processado com sucesso: 1 registros encontrados
[14:35:47] ✅ Estrutura do curso válida
[14:35:47] ℹ️ 20 técnicas encontradas
[14:35:47] ℹ️ Cronograma: 18 semanas
[14:35:47] ✅ Validação concluída: 1 válidos, 0 inválidos, 0 avisos
[14:36:15] ⏳ Importando curso: Krav Maga Faixa Branca...
[14:36:18] ✅ Curso "Krav Maga Faixa Branca" importado com sucesso!
[14:36:18] ℹ️ 20 técnicas criadas
[14:36:18] ℹ️ 35 aulas criadas
[14:36:18] ✅ Importação finalizada: 1/1 com sucesso em 3.25s
```

---

## 📈 Relatório Final

### Estatísticas Exibidas

- **Total Processados** - Quantidade de registros tentados
- **Importados com Sucesso** - Registros salvos no banco (verde)
- **Erros** - Registros que falharam (vermelho)
- **Tempo Total** - Duração da importação (segundos)
- **Velocidade** - Registros por segundo
- **Data/Hora de Conclusão** - Timestamp

### Botões Disponíveis

- **📋 Ver Log Completo** - Abre console com todos os logs
- **📥 Baixar Relatório** - Salva JSON com detalhes completos
- **🔄 Nova Importação** - Reinicia o processo

### Formato do Relatório (JSON)

```json
{
  "summary": {
    "total": 20,
    "success": 18,
    "errors": 2,
    "warnings": 0,
    "startTime": "2025-10-03T14:36:15.123Z",
    "endTime": "2025-10-03T14:36:18.456Z",
    "duration": 3.333
  },
  "logs": [
    {
      "type": "success",
      "message": "Técnica 'soco-jab' importada",
      "timestamp": "14:36:16"
    }
  ]
}
```

---

## 🔧 Troubleshooting

### Erro: "Formato de arquivo não suportado"

**Causa:** Arquivo não é CSV ou JSON  
**Solução:** Verifique a extensão (.csv ou .json)

### Erro: "JSON deve conter courseId, name, techniques e schedule"

**Causa:** Campos obrigatórios faltando no JSON  
**Solução:** Baixe o template e compare a estrutura

### Erro: "Nome é obrigatório"

**Causa:** Campo `name` vazio ou ausente  
**Solução:** Preencha o nome em todas as linhas

### Aviso: "Nenhuma técnica encontrada no curso"

**Causa:** Array `techniques` vazio  
**Solução:** Adicione pelo menos 1 técnica ao array

### Importação trava em X%

**Causa:** Erro de rede ou timeout  
**Solução:** Recarregue a página e tente novamente

---

## 🚀 Boas Práticas

### Antes de Importar

✅ **Baixe o template** específico para seu tipo de importação  
✅ **Valide os dados** localmente antes de fazer upload  
✅ **Teste com poucos registros** primeiro (5-10)  
✅ **Faça backup** dos dados existentes  

### Durante a Importação

✅ **Não feche a janela** enquanto importa  
✅ **Acompanhe os logs** para detectar erros cedo  
✅ **Anote erros** que aparecerem para correção  

### Depois de Importar

✅ **Baixe o relatório** para documentação  
✅ **Verifique os dados** no módulo respectivo (Cursos/Técnicas/Alunos)  
✅ **Corrija erros** e reimporte se necessário  

---

## 🎨 Atalhos de Teclado

| Tecla | Ação |
|-------|------|
| `Tab` | Navegar entre tabs |
| `Esc` | Cancelar importação |
| `Ctrl+Z` | Voltar etapa (se disponível) |

---

## 📞 Suporte

### Em Caso de Problemas

1. **Verifique os logs** no console para detalhes do erro
2. **Baixe o relatório** para análise posterior
3. **Consulte este guia** para soluções comuns
4. **Entre em contato** com o suporte técnico

### Informações Úteis para Suporte

- **Tipo de importação** (Cursos/Técnicas/Alunos)
- **Arquivo usado** (enviar se possível)
- **Logs de erro** (copiar do console)
- **Relatório JSON** (baixar e enviar)

---

**Versão:** 2.0.0  
**Data:** 2025-10-03  
**Status:** ✅ Produção  
**Autor:** GitHub Copilot
