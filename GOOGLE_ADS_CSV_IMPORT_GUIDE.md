# 📊 Guia de Importação: Dados Reais do Google Ads (CSV)

## 🎯 Para Que Serve?

Este guia te permite **testar o CRM HOJE** com seus dados reais do Google Ads, **enquanto aguarda aprovação do Developer Token** (1-3 dias).

### Benefícios Imediatos
- ✅ **Dashboard funcionando com dados reais** (3+ anos de histórico)
- ✅ **Testar todas as funcionalidades** do módulo CRM
- ✅ **Ver métricas reais** de campanhas, conversões, custos
- ✅ **Validar UI/UX** com números do seu negócio
- ✅ **Treinar equipe** antes da API estar ativa

---

## 🚀 Como Executar a Importação

### 1️⃣ Preparação (2 minutos)

**Certifique-se de ter:**
- ✅ 14 arquivos CSV exportados do Google Ads
- ✅ Arquivos no formato correto (veja seção "Estrutura dos CSVs")
- ✅ Caminho correto configurado no script

**Localização dos arquivos:**
```
c:\Users\trcar\Downloads\Cards_da_Visão_geral_csv(2025-10-03_03_44_06)\
```

**Arquivos necessários:**
1. `Campanhas_*.csv` - Lista de campanhas
2. `Série_temporal_*.csv` - Dados diários (3 anos)
3. `Dia_e_hora_*.csv` - Performance por dia da semana
4. `Dispositivos_*.csv` - Mobile/Desktop/Tablet
5. `Informações_demográficas_-_idade_*.csv` - Faixa etária
6. `Informações_demográficas_-_sexo_*.csv` - Gênero
7. `Palavras-chave_de_pesquisa_*.csv` - Termos de busca
8. `Redes_*.csv` - Google Search/Display/Partners
9. `Pesquisas_*.csv` - Queries específicas

---

### 2️⃣ Executar o Script (1 minuto)

**Abra o terminal no VSCode** (Ctrl + ` ou Terminal > New Terminal):

```bash
# Comando único
npm run import:google-ads
```

**OU diretamente:**
```bash
npx tsx scripts/import-real-google-ads-data.ts
```

---

### 3️⃣ O Que Acontece? (30 segundos)

**Output esperado:**
```
🚀 IMPORTAÇÃO DE DADOS REAIS DO GOOGLE ADS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🧹 Limpando dados antigos...
✅ Removidas X campanhas antigas com prefixo REAL_

📊 Importando Campanhas...
✅ Krav Maga - Academia
   Cliques: 1.234 | Impressões: 45.678
   CTR: 2,70% | CPC: R$ 1,50
   Custo: R$ 1.851,00 | Conversões: 89

✅ Defesa Pessoal - São Paulo
   Cliques: 987 | Impressões: 23.456
   CTR: 4,21% | CPC: R$ 2,10
   Custo: R$ 2.072,70 | Conversões: 45

📈 Importando Série Temporal...
📊 Métricas Totais (1.095 dias):
   Total Cliques: 12.345
   Total Impressões: 234.567
   Total Custo: R$ 18.765,43
   Total Conversões: 456

📅 Importando Análise por Dia da Semana...
✅ Segunda-feira: 1.234 cliques | CTR: 2,5%
✅ Terça-feira: 1.456 cliques | CTR: 2,8%
[...]

📱 Importando Dispositivos...
✅ Mobile: 45,6% dos cliques
✅ Desktop: 38,2% dos cliques
✅ Tablet: 16,2% dos cliques

👥 Importando Demografia (Idade)...
✅ 18-24: 12,3% | 25-34: 34,5% | 35-44: 28,7%

👤 Importando Demografia (Sexo)...
✅ Masculino: 67,8% | Feminino: 32,2%

🔍 Importando Palavras-chave...
Top 10 Termos por Cliques:
1. "krav maga são paulo" - 2.345 cliques
2. "defesa pessoal perto de mim" - 1.987 cliques
[...]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ IMPORTAÇÃO CONCLUÍDA COM SUCESSO!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 RESUMO:
   • 8 campanhas importadas
   • 1.095 dias de histórico (Out/2022 - Out/2025)
   • 147 palavras-chave analisadas
   • Total investido: R$ 18.765,43
   • Total conversões: 456
```

---

### 4️⃣ Visualizar no Dashboard (1 minuto)

**Inicie o servidor:**
```bash
npm run dev
```

**Navegue até:**
```
http://localhost:3000/#/crm/settings
```

**O que você verá:**
- ✅ **Tabela de campanhas** com nomes reais
- ✅ **Métricas reais**: cliques, impressões, CTR, CPC
- ✅ **Status badges** (Ativo/Pausado)
- ✅ **Custos formatados** (R$ X.XXX,XX)
- ✅ **Conversões e taxa de conversão**

---

## 🔍 Validação: Como Saber Se Funcionou?

### Via Prisma Studio (Visual)
```bash
npm run db:studio
```

**Abra o navegador em `http://localhost:5555`:**
1. Clique em **GoogleAdsCampaign**
2. Veja registros com `campaignId` começando com `REAL_CAMPAIGN_`
3. Verifique se os nomes das campanhas são seus
4. Confirme que métricas não são zero

### Via Query SQL (Rápido)
```sql
SELECT "campaignId", "name", "impressions", "clicks", "cost", "conversions"
FROM "GoogleAdsCampaign"
WHERE "campaignId" LIKE 'REAL_%'
ORDER BY "impressions" DESC;
```

**Resultado esperado:**
| campaignId | name | impressions | clicks | cost | conversions |
|------------|------|-------------|--------|------|-------------|
| REAL_CAMPAIGN_1 | Krav Maga - Academia | 45678 | 1234 | 1851.00 | 89 |
| REAL_CAMPAIGN_2 | Defesa Pessoal SP | 23456 | 987 | 2072.70 | 45 |

---

## 🛠️ Estrutura dos CSVs: O Que o Script Espera

### 📄 Campanhas_*.csv
**Colunas obrigatórias:**
- `Campanha` (nome)
- `Impressões`
- `Cliques`
- `Custo`
- `Conversões`
- `Status` (Ativada/Pausada/Removida)

**Exemplo:**
```csv
Campanha,Impressões,Cliques,Custo,Conversões,Status
"Krav Maga - Academia","45.678","1.234","R$ 1.851,00","89","Ativada"
```

### 📈 Série_temporal_*.csv
**Colunas obrigatórias:**
- `Data` (formato DD/MM/YYYY)
- `Impressões`
- `Cliques`
- `Custo`
- `Conversões`

**Exemplo:**
```csv
Data,Impressões,Cliques,Custo,Conversões
"01/10/2022","123","45","R$ 67,89","2"
"02/10/2022","156","52","R$ 78,12","3"
```

### 📱 Dispositivos_*.csv
**Colunas obrigatórias:**
- `Dispositivo` (Mobile/Desktop/Tablet)
- `Impressões`
- `Cliques`
- `Custo`

**Exemplo:**
```csv
Dispositivo,Impressões,Cliques,Custo
"Mobile","23.456","1.234","R$ 1.851,00"
"Desktop","19.876","987","R$ 1.481,00"
```

### 👥 Demografia (Idade/Sexo)
**Colunas obrigatórias:**
- `Idade` ou `Sexo`
- `Impressões`
- `Cliques`
- `Porcentagem` (ex: "34,5%")

---

## ⚠️ Troubleshooting: Problemas Comuns

### ❌ Erro: "Cannot find CSV file"
**Causa:** Arquivo não encontrado no caminho especificado

**Solução:**
1. Abra `scripts/import-real-google-ads-data.ts`
2. Localize a linha:
   ```typescript
   const CSV_PATH = 'c:\\Users\\trcar\\Downloads\\Cards_da_Visão_geral_csv(2025-10-03_03_44_06)';
   ```
3. Altere para o caminho correto dos seus arquivos
4. **Atenção:** Use `\\` (double backslash) no Windows

### ❌ Erro: "Invalid number format"
**Causa:** Formato de número não reconhecido

**Verificar:**
- CSV exportado do Google Ads Brasil usa: `1.000,00` (ponto = milhar, vírgula = decimal)
- Script converte automaticamente: `1.000,00` → `1000.00`
- Se erro persistir, abra o CSV e verifique se valores usam este formato

**Exemplo correto:**
```csv
Custo
"R$ 1.851,00"  ✅
"R$ 2.072,70"  ✅
```

**Exemplo errado:**
```csv
Custo
"$1,851.00"  ❌ (formato americano)
"1851"       ❌ (sem formatação)
```

### ❌ Erro: "Prisma Client not initialized"
**Causa:** Banco de dados não está configurado

**Solução:**
```bash
# 1. Gere o Prisma Client
npx prisma generate

# 2. Aplique o schema ao banco
npx prisma db push

# 3. Tente novamente
npm run import:google-ads
```

### ❌ Nenhum erro, mas tabela vazia
**Causa:** Arquivos CSV estão vazios ou com encoding errado

**Verificar:**
1. Abra um CSV no Notepad++
2. Menu: `Encoding` > deve estar `UTF-8 with BOM`
3. Veja se há pelo menos 2 linhas (header + 1 dado)

**Converter se necessário:**
```bash
# No PowerShell (Windows)
Get-Content -Path "Campanhas.csv" -Encoding UTF8 | Set-Content -Encoding UTF8 -Path "Campanhas_utf8.csv"
```

---

## 🔄 Como Atualizar os Dados?

### Se Você Exportar Novos CSVs:
1. **Exporte** novamente do Google Ads (menu: Campanhas > Exportar)
2. **Substitua** os arquivos antigos pelos novos
3. **Execute** novamente o script:
   ```bash
   npm run import:google-ads
   ```
4. **Resultado:** Script limpa dados antigos (`REAL_*`) e importa os novos

### Limpeza Manual:
```sql
-- Remove APENAS dados importados de CSV
DELETE FROM "GoogleAdsCampaign" WHERE "campaignId" LIKE 'REAL_%';

-- Não afeta dados que virão da API depois
```

---

## 🎯 Próximos Passos: Da Importação para a API

### Status Atual: ✅ TESTANDO COM CSV
**Você está aqui:**
- ✅ Dados reais importados
- ✅ Dashboard funcionando
- ✅ Métricas visualizadas

### Próximo: ⏳ AGUARDANDO APROVAÇÃO DO TOKEN
**O que fazer:**
1. **Submeter aplicação** ao Google (use `GOOGLE_ADS_SHORT_APPLICATION.md`)
2. **Aguardar email** de aprovação (1-3 dias)
3. **Continuar testando** com os dados CSV

### Futuro: 🚀 SINCRONIZAÇÃO AUTOMÁTICA
**Quando o token chegar:**
1. **Configurar `.env`** com credenciais reais:
   ```bash
   GOOGLE_ADS_DEVELOPER_TOKEN=seu_token_aqui
   GOOGLE_ADS_CLIENT_ID=seu_client_id
   GOOGLE_ADS_CLIENT_SECRET=seu_secret
   GOOGLE_ADS_CUSTOMER_ID=123-456-7890
   ```

2. **Limpar dados CSV**:
   ```sql
   DELETE FROM "GoogleAdsCampaign" WHERE "campaignId" LIKE 'REAL_%';
   ```

3. **Primeira sincronização manual**:
   ```bash
   npm run sync:google-ads
   ```

4. **Configurar cron job** (sincronização automática a cada hora):
   ```bash
   # Windows (Task Scheduler)
   # Linux/Mac (crontab)
   0 * * * * cd /path/to/academia && npm run sync:google-ads
   ```

5. **Resultado:** Sistema passa a buscar dados em tempo real da API

---

## 📊 Métricas: O Que Esperar?

### Dados que Serão Importados:
| Categoria | Quantidade Esperada | Período |
|-----------|---------------------|---------|
| Campanhas | 5-15 | Ativas + Pausadas |
| Série Temporal | 1.000+ registros | Out/2022 - Out/2025 |
| Palavras-chave | 100-500 | Top termos |
| Dispositivos | 3 tipos | Mobile/Desktop/Tablet |
| Demografia (Idade) | 6-8 faixas | 18-24, 25-34, etc. |
| Demografia (Sexo) | 2 tipos | Masculino/Feminino |
| Dia da Semana | 7 dias | Segunda-Domingo |

### Performance do Script:
- ⚡ **Tempo de execução:** 5-15 segundos
- 💾 **Espaço em banco:** ~5-20 MB (dependendo do histórico)
- 🔄 **Pode ser reexecutado:** Sim (limpa dados antigos automaticamente)

---

## 🎓 Entendendo os Dados Importados

### Como Identificar Dados de CSV vs API?

**Dados de CSV (importação manual):**
- `campaignId` começa com `REAL_CAMPAIGN_`
- Exemplo: `REAL_CAMPAIGN_1`, `REAL_CAMPAIGN_2`
- Status sempre `ENABLED` (script define padrão)
- `lastSyncAt` = data da importação

**Dados da API (quando token chegar):**
- `campaignId` é numérico do Google
- Exemplo: `12345678901`
- Status reflete estado real no Google Ads
- `lastSyncAt` = última sincronização automática

### Transição Suave:
Quando você rodar a primeira sincronização com a API:
1. Script detecta campanhas com `REAL_` no ID
2. Remove automaticamente
3. Importa campanhas reais da API
4. IDs corretos + status corretos + sync automático

**Não há risco de duplicação!**

---

## ❓ FAQ: Perguntas Frequentes

### **P: Posso importar CSVs de períodos diferentes?**
**R:** Sim! O script aceita qualquer período. A Série Temporal pode ter de 30 dias a 3+ anos.

### **P: E se meus arquivos tiverem nomes diferentes?**
**R:** Edite o script (`scripts/import-real-google-ads-data.ts`) e altere os nomes dos arquivos nas constantes no topo:
```typescript
const CAMPANHAS_FILE = 'seu_arquivo_aqui.csv';
const SERIE_TEMPORAL_FILE = 'outro_nome.csv';
```

### **P: Posso importar múltiplas vezes?**
**R:** Sim! O script limpa dados antigos antes de importar. Sem risco de duplicação.

### **P: E se eu não tiver todos os 14 arquivos CSV?**
**R:** O script marca arquivos ausentes como "AVISO" mas continua a importação dos disponíveis.

### **P: Os dados importados afetam a API quando ela funcionar?**
**R:** Não! Dados `REAL_*` são separados e serão removidos na primeira sincronização com a API.

### **P: Preciso ter o Developer Token para importar CSV?**
**R:** Não! Este é exatamente o objetivo: **testar o sistema ANTES de ter o token**.

### **P: Os dados são persistentes?**
**R:** Sim! Ficam no banco PostgreSQL até você rodar a primeira sincronização com a API ou limpar manualmente.

---

## 🎯 Checklist: Sucesso da Importação

Use este checklist para validar que tudo funcionou:

### Antes de Executar:
- [ ] Arquivos CSV estão no caminho correto
- [ ] Encoding UTF-8 verificado
- [ ] Banco de dados está rodando (PostgreSQL)
- [ ] Prisma Client gerado (`npx prisma generate`)

### Durante a Execução:
- [ ] Script iniciou sem erros
- [ ] Vejo mensagens de sucesso (✅) para cada CSV
- [ ] Estatísticas são exibidas (total cliques, impressões, etc.)
- [ ] Nenhuma mensagem de erro crítico

### Depois da Execução:
- [ ] Prisma Studio mostra registros com `REAL_CAMPAIGN_` no ID
- [ ] Dashboard CRM exibe campanhas reais na tabela
- [ ] Métricas não são zero ou vazias
- [ ] Status badges aparecem corretamente
- [ ] Custos formatados como R$ X.XXX,XX

### Teste Final (Smoke Test):
- [ ] Abrir `http://localhost:3000/#/crm/settings`
- [ ] Ver pelo menos 1 campanha na tabela
- [ ] Clicar em uma linha (não deve dar erro)
- [ ] Verificar que os números fazem sentido vs seus CSVs originais

---

## 📚 Arquivos Relacionados

**Script principal:**
- `scripts/import-real-google-ads-data.ts` - Código da importação

**Documentação:**
- `GOOGLE_ADS_INDEX.md` - Índice de toda documentação Google Ads
- `GOOGLE_ADS_API_SETUP.md` - Como obter o Developer Token
- `GOOGLE_ADS_SHORT_APPLICATION.md` - Texto pronto para aplicação

**Schema:**
- `prisma/schema.prisma` - Modelos `GoogleAdsCampaign` e `GoogleAdsConfig`

**Frontend:**
- `public/js/modules/crm/` - Interface do dashboard
- `public/css/modules/crm.css` - Estilos

**Backend:**
- `src/routes/google-ads.ts` - Endpoints da API (para quando token chegar)
- `src/services/googleAdsService.ts` - Lógica de sincronização

---

## 🚀 Comando Único (TL;DR)

Se você só quer importar os dados e testar:

```bash
# 1. Importar dados
npm run import:google-ads

# 2. Iniciar servidor
npm run dev

# 3. Abrir browser
http://localhost:3000/#/crm/settings
```

**Pronto!** 🎉 Seu CRM está funcionando com dados reais.

---

**Versão:** 1.0  
**Data:** 03/10/2025  
**Status:** Ativo  
**Próxima revisão:** Quando Developer Token for aprovado
