# 🎯 Guia: Importação de CSV via Interface Web

## 📊 O Que Mudou?

Agora você pode importar os dados do Google Ads **diretamente pelo navegador**! Não precisa mais usar linha de comando.

### ✨ Novidades

**ANTES (modo linha de comando):**
```bash
npm run import:google-ads
```

**AGORA (modo drag-and-drop):**
1. Acesse `http://localhost:3000/#/crm/settings`
2. Role até "Importar Dados do Google Ads (CSV)"
3. Arraste os arquivos CSV ou clique em "Selecionar Arquivos"
4. Clique em "Iniciar Importação"
5. Veja o progresso e resumo na tela

---

## 🚀 Como Usar a Nova Interface

### 1️⃣ Acesse as Configurações do CRM

**Navegue até:**
```
http://localhost:3000/#/crm/settings
```

**Ou pelo menu:**
1. Dashboard do CRM
2. Botão "⚙️ Configurações" no topo

### 2️⃣ Localize a Seção de Importação

Role a página até encontrar:

```
┌─────────────────────────────────────────────────────────┐
│ 📄 Importar Dados do Google Ads (CSV)                  │
│ ℹ️ Use enquanto aguarda aprovação da API               │
└─────────────────────────────────────────────────────────┘
```

### 3️⃣ Arraste os Arquivos CSV

**Você tem 2 opções:**

**Opção A: Drag & Drop (Arrastar e Soltar)**
1. Selecione múltiplos arquivos CSV no Windows Explorer
2. Arraste para a área pontilhada
3. Solte os arquivos

**Opção B: Seleção Manual**
1. Clique no botão "📁 Selecionar Arquivos"
2. Navegue até a pasta dos CSVs
3. Segure `Ctrl` e clique em múltiplos arquivos
4. Clique "Abrir"

### 4️⃣ Revise os Arquivos Selecionados

A interface mostra uma lista:

```
📋 Arquivos Selecionados (8)

┌────────────────────────────────────────────────┐
│ 📄 Campanhas_2025-10-03.csv           245 KB  │
│ 📄 Série_temporal_2025-10-03.csv      1.2 MB  │
│ 📄 Dispositivos_2025-10-03.csv        89 KB   │
│ 📄 Palavras-chave_2025-10-03.csv      567 KB  │
│ ... (e outros)                                │
└────────────────────────────────────────────────┘
```

**Ações disponíveis:**
- ❌ Remover arquivo individual (botão X em cada linha)
- 🗑️ Limpar todos (botão "Limpar Arquivos")

### 5️⃣ Inicie a Importação

Clique no botão:

```
▶️ Iniciar Importação
```

### 6️⃣ Acompanhe o Progresso

A interface mostra:

```
Processando arquivos...              60%
████████████░░░░░░░░░░░░░░░░░░░░
```

**Fases:**
1. **20%** - Enviando arquivos ao servidor
2. **60%** - Processando dados (parse CSV + validação)
3. **100%** - Salvando no banco de dados

### 7️⃣ Veja o Resumo

Após conclusão:

```
┌──────────────────────────────────────────────────┐
│ ✅ Importação Concluída com Sucesso!             │
├──────────────────────────────────────────────────┤
│                                                  │
│  📢 8 Campanhas Importadas                       │
│  📅 1.095 Dias de Histórico                      │
│  🔑 147 Palavras-chave                           │
│  💰 R$ 18.765,43 Total Investido                 │
│                                                  │
│  [📊 Ver Dashboard]  [🔄 Nova Importação]        │
└──────────────────────────────────────────────────┘
```

---

## 📁 Arquivos Aceitos

A interface aceita os seguintes tipos de CSV:

| Tipo | Nome do Arquivo | Dados Importados |
|------|----------------|------------------|
| ✅ Campanhas | `Campanhas_*.csv` | Nome, cliques, impressões, custo, conversões |
| ✅ Série Temporal | `Série_temporal_*.csv` | Dados diários (3+ anos) |
| ✅ Palavras-chave | `Palavras-chave_de_pesquisa_*.csv` | Top termos de busca |
| ⏳ Dispositivos | `Dispositivos_*.csv` | Mobile/Desktop/Tablet (em breve) |
| ⏳ Demografia | `Informações_demográficas_*.csv` | Idade/Sexo (em breve) |

**Legenda:**
- ✅ Totalmente implementado
- ⏳ Estrutura pronta, implementação pendente

---

## 🎨 Recursos da Interface

### Validação Automática
- ✅ Aceita apenas arquivos `.csv`
- ✅ Detecta duplicatas (mesmo nome + tamanho)
- ✅ Mostra tamanho formatado (KB/MB)
- ✅ Limite de 20 arquivos simultâneos
- ✅ Máximo 50MB por arquivo

### Feedback Visual
- 🟦 **Azul claro** - Área pronta para receber arquivos
- 🟦 **Azul escuro** - Arquivo sendo arrastado sobre a área
- ✅ **Verde** - Importação bem-sucedida
- ❌ **Vermelho** - Erro na importação

### Tratamento de Erros
Se algo der errado:

```
┌──────────────────────────────────────────────────┐
│ ⚠️ Erro na Importação                            │
├──────────────────────────────────────────────────┤
│ Error processing Serie_temporal.csv:            │
│ Invalid date format at line 45                  │
│                                                  │
│ [✖️ Fechar]                                      │
└──────────────────────────────────────────────────┘
```

A interface mostra:
- Nome do arquivo problemático
- Mensagem de erro específica
- Linha onde ocorreu o problema (quando aplicável)

---

## 🔄 Comparação: Linha de Comando vs Interface Web

| Aspecto | Linha de Comando | Interface Web |
|---------|------------------|---------------|
| **Facilidade** | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Velocidade** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Feedback visual** | ⭐⭐ (texto no terminal) | ⭐⭐⭐⭐⭐ (barra de progresso) |
| **Seleção de arquivos** | ⭐⭐ (digitar caminho) | ⭐⭐⭐⭐⭐ (drag & drop) |
| **Tratamento de erros** | ⭐⭐⭐ (logs no console) | ⭐⭐⭐⭐ (mensagens claras) |
| **Resumo de importação** | ⭐⭐⭐⭐ (estatísticas) | ⭐⭐⭐⭐⭐ (cards visuais) |

**Recomendação:**
- 👨‍💼 **Usuários de negócio**: Use a interface web
- 👨‍💻 **Desenvolvedores**: Ambos funcionam bem (interface é mais rápida)
- 🤖 **Automação/Scripts**: Use linha de comando (`npm run import:google-ads`)

---

## 🛠️ Troubleshooting

### ❌ "Nenhum arquivo CSV selecionado"
**Causa:** Você tentou importar arquivos que não são CSV

**Solução:**
1. Verifique a extensão: deve ser `.csv` (não `.xlsx`, `.txt`)
2. Se exportou do Google Ads, confirme que escolheu formato CSV

### ❌ "No files uploaded"
**Causa:** Arquivos não chegaram ao servidor

**Solução:**
1. Verifique sua conexão com o servidor (`npm run dev` rodando?)
2. Tente com menos arquivos (comece com 1-2)
3. Verifique o tamanho (máx 50MB por arquivo)

### ❌ "Error processing [arquivo].csv"
**Causa:** Formato do CSV não é o esperado

**Solução:**
1. Abra o CSV no Excel/Notepad
2. Verifique se tem header (primeira linha com nomes de colunas)
3. Confira se os nomes das colunas estão corretos:
   - `Campanha`, `Impressões`, `Cliques`, `Custo`, `Conversões`
4. Se exportou direto do Google Ads em português BR, deve funcionar

### ⚠️ "Alguns arquivos foram ignorados"
**Causa:** Arquivos não reconhecidos pelo sistema

**Solução:**
1. Verifique os nomes dos arquivos (veja tabela de "Arquivos Aceitos")
2. Apenas 3 tipos estão implementados agora: Campanhas, Série Temporal, Palavras-chave
3. Outros tipos aparecerão em breve (dispositivos, demografia)

---

## 🎯 Casos de Uso

### Caso 1: Primeira Importação
**Situação:** Nunca importou dados antes

**Passos:**
1. Acesse Settings
2. Arraste TODOS os CSVs (8-14 arquivos)
3. Clique "Iniciar Importação"
4. Aguarde 10-30 segundos
5. Veja resumo e clique "Ver Dashboard"

**Resultado esperado:**
- ✅ 5-15 campanhas importadas
- ✅ 1000+ dias de histórico
- ✅ 100-500 palavras-chave

### Caso 2: Atualização de Dados
**Situação:** Já importou antes, quer atualizar com novos dados

**Passos:**
1. Exporte novos CSVs do Google Ads (período atualizado)
2. Acesse Settings
3. Arraste os novos CSVs
4. Clique "Iniciar Importação"
5. Sistema remove dados antigos e importa os novos

**Resultado esperado:**
- ✅ Campanhas antigas (`REAL_CAMPAIGN_*`) removidas
- ✅ Novas campanhas criadas com mesmos IDs
- ✅ Métricas atualizadas com período mais recente

### Caso 3: Testar com Dados Parciais
**Situação:** Quer testar antes de importar tudo

**Passos:**
1. Selecione APENAS `Campanhas_*.csv`
2. Arraste para a interface
3. Clique "Iniciar Importação"
4. Veja campanhas no dashboard
5. Se OK, importe o resto depois

**Resultado esperado:**
- ✅ Campanhas visíveis no dashboard
- ⚠️ Sem dados de série temporal (gráficos vazios)
- ⚠️ Sem palavras-chave

---

## 🔐 Segurança e Privacidade

### Dados Permanecem Locais
- ✅ Arquivos CSV são processados no SEU servidor
- ✅ Nada é enviado para serviços externos
- ✅ Dados ficam no SEU banco PostgreSQL

### Arquivos Temporários
- ✅ Arquivos CSV são salvos temporariamente no servidor
- ✅ Após processamento, são automaticamente deletados
- ✅ Não ficam armazenados em disco após importação

### Dados no Banco
- ✅ Campanhas importadas têm prefixo `REAL_CAMPAIGN_`
- ✅ Fácil identificar e remover se necessário
- ✅ Não interferem com dados da API (quando ativa)

---

## 📚 Próximos Passos

**Após importar com sucesso:**

1. **Ver Dashboard**
   ```
   http://localhost:3000/#/crm/dashboard
   ```
   - Métricas de campanhas
   - Gráficos de performance
   - ROI por campanha

2. **Testar Funcionalidades**
   - Criar leads manualmente
   - Atribuir campanhas aos leads
   - Converter leads em alunos

3. **Submeter Aplicação ao Google**
   - Use `GOOGLE_ADS_SHORT_APPLICATION.md`
   - Aguarde aprovação (1-3 dias)

4. **Configurar API Real** (quando aprovado)
   - Vá em Settings → Google Ads Integration
   - Preencha credenciais reais
   - Conecte conta
   - Sistema passa a usar API em vez de CSV

---

## 💡 Dicas Pro

### Dica 1: Importação Rápida
**Selecione múltiplos arquivos de uma vez:**
1. Abra pasta dos CSVs no Windows Explorer
2. Pressione `Ctrl + A` (seleciona todos)
3. Arraste todos juntos para a interface
4. Sistema processa em batch

### Dica 2: Validação Antes de Importar
**Abra 1 CSV no Excel primeiro:**
1. Verifique se colunas estão corretas
2. Veja se números estão formatados (1.000,00)
3. Confirme que não há linhas vazias no meio
4. Se OK, importe todos

### Dica 3: Backup dos CSVs
**Mantenha uma cópia dos CSVs originais:**
1. Crie pasta `backup-csv-original`
2. Copie todos os CSVs para lá
3. Se algo der errado, pode reimportar

### Dica 4: Limpeza Periódica
**Remova dados importados quando API estiver ativa:**
```sql
-- Abra Prisma Studio (npm run db:studio)
-- Execute query:
DELETE FROM "GoogleAdsCampaign" 
WHERE "campaignId" LIKE 'REAL_%';
```

---

## 🎓 Perguntas Frequentes

**P: Posso importar arquivos um de cada vez?**
**R:** Sim! Mas é mais eficiente importar todos juntos. Sistema processa em paralelo.

**P: E se eu fechar o navegador durante a importação?**
**R:** Importação continua no servidor. Recarregue a página para ver o status.

**P: Posso importar CSVs de períodos diferentes?**
**R:** Sim, mas última importação substitui a anterior (remove `REAL_*` antes de importar).

**P: Preciso ter o Developer Token para usar a interface?**
**R:** Não! A interface existe exatamente para testar SEM o token.

**P: A interface funciona em mobile?**
**R:** Sim, mas drag-and-drop pode não funcionar. Use botão "Selecionar Arquivos".

**P: Quantos arquivos posso importar de uma vez?**
**R:** Limite de 20 arquivos e 50MB cada. Prático: 8-14 arquivos do Google Ads cabem tranquilo.

---

**Versão:** 1.0  
**Data:** 03/10/2025  
**Status:** Ativo  
**Modo de uso:** Interface Web (drag-and-drop)
