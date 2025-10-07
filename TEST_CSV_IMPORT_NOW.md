# 🧪 Teste: Importação CSV - Passo a Passo

## ✅ Status Atual

**Servidor**: ✅ Rodando em http://localhost:3000  
**Interface**: ✅ Settings carregada corretamente  
**Credenciais**: ✅ Salvas com sucesso (Customer ID: 136-615-2046)

---

## 🎯 Próximo Passo: Importar CSVs

### 1️⃣ Acesse a Seção de Importação

Você já está em: `http://localhost:3000/#/crm/settings`

**Role a página para baixo** até encontrar:

```
┌─────────────────────────────────────────────────────────┐
│ 📄 Importar Dados do Google Ads (CSV)                  │
│ ℹ️ Use enquanto aguarda aprovação da API               │
└─────────────────────────────────────────────────────────┘
```

### 2️⃣ Selecione Seus Arquivos CSV

**Opção A: Drag & Drop**
1. Abra o Windows Explorer
2. Navegue até: `c:\Users\trcar\Downloads\Cards_da_Visão_geral_csv(2025-10-03_03_44_06)\`
3. Selecione os arquivos (Ctrl+A ou selecione individualmente):
   - `Campanhas_*.csv`
   - `Série_temporal_*.csv`
   - `Palavras-chave_de_pesquisa_*.csv`
4. Arraste para a área pontilhada no navegador

**Opção B: Botão Selecionar**
1. Clique no botão **"📁 Selecionar Arquivos"**
2. Navegue até a pasta dos CSVs
3. Segure `Ctrl` e clique nos arquivos que quer importar
4. Clique "Abrir"

### 3️⃣ Confirme os Arquivos

Você verá uma lista como:

```
📋 Arquivos Selecionados (3)

┌────────────────────────────────────────────────┐
│ 📄 Campanhas_2025-10-03.csv           245 KB  │
│ 📄 Série_temporal_2025-10-03.csv      1.2 MB  │
│ 📄 Palavras-chave_2025-10-03.csv      567 KB  │
└────────────────────────────────────────────────┘

[▶️ Iniciar Importação]  [✖️ Limpar Arquivos]
```

### 4️⃣ Inicie a Importação

Clique no botão verde: **"▶️ Iniciar Importação"**

### 5️⃣ Acompanhe o Progresso

Você verá:

```
Processando arquivos...              60%
████████████░░░░░░░░░░░░░░░░░░░░
```

**Tempo esperado**: 10-30 segundos

### 6️⃣ Veja o Resumo

Após conclusão, você verá algo como:

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

### 7️⃣ Verifique os Dados

**Clique em "📊 Ver Dashboard"** ou navegue até:
```
http://localhost:3000/#/crm/dashboard
```

Você deve ver:
- ✅ Suas campanhas reais na tabela
- ✅ Métricas com números reais (não zeros)
- ✅ Custos formatados (R$ X.XXX,XX)

---

## 🔍 Como Validar que Funcionou

### Opção 1: Via Dashboard
```
http://localhost:3000/#/crm/dashboard
```
- Deve mostrar campanhas reais
- Métricas não são zero
- Nomes das campanhas são do Google Ads

### Opção 2: Via Prisma Studio
```bash
npm run db:studio
```
1. Abra http://localhost:5555
2. Clique em **GoogleAdsCampaign**
3. Filtre por: `campaignId` contains `REAL_`
4. Deve ver registros com seus dados reais

### Opção 3: Via Console do Navegador
Abra DevTools (F12) → Console

Procure por mensagens como:
```
✅ [Nome da Campanha] - 1234 cliques, R$ 1851.00
📊 Métricas Totais (1095 dias):
   Total Cliques: 12345
   Total Impressões: 234567
   Total Custo: R$ 18.765,43
```

---

## ❌ Se Algo Der Errado

### Erro: "Nenhum arquivo CSV selecionado"
**Causa**: Arquivos não são .csv  
**Solução**: Verifique extensão dos arquivos

### Erro: "No files uploaded"
**Causa**: Servidor não recebeu arquivos  
**Solução**: 
1. Verifique se servidor está rodando (`npm run dev`)
2. Tente com menos arquivos (1-2 primeiro)

### Erro: "Error processing [arquivo].csv"
**Causa**: CSV com formato errado  
**Solução**:
1. Abra CSV no Excel/Notepad
2. Verifique se primeira linha tem: `Campanha, Impressões, Cliques, Custo, Conversões`
3. Se não, re-exporte do Google Ads em português BR

### Nenhum Erro, Mas Dados Não Aparecem
**Debug**:
1. Abra Console (F12)
2. Veja se há erros em vermelho
3. Procure por mensagens de sucesso (✅)
4. Verifique se resumo mostra "0 campanhas importadas" (problema no parse)

---

## 🎯 Checklist de Sucesso

- [ ] Área de drag-and-drop aparece na página
- [ ] Consegui arrastar arquivos ou selecionar via botão
- [ ] Lista de arquivos aparece com ícones e tamanhos
- [ ] Botão "Iniciar Importação" ficou visível
- [ ] Barra de progresso apareceu (0% → 100%)
- [ ] Resumo mostra "X campanhas importadas" (X > 0)
- [ ] Dashboard mostra campanhas reais
- [ ] Prisma Studio tem registros com `REAL_CAMPAIGN_*`

---

## 📊 O Que Esperar

### Com 3 Arquivos (Campanhas + Série Temporal + Keywords)
- **Campanhas**: 5-15 registros
- **Histórico**: 1000-1500 dias (3+ anos)
- **Palavras-chave**: 100-500 termos
- **Custo Total**: R$ 10.000 - R$ 50.000 (dependendo do período)

### Com 1 Arquivo (Apenas Campanhas)
- **Campanhas**: 5-15 registros
- **Histórico**: 0 dias (normal, não enviou série temporal)
- **Palavras-chave**: 0 (normal, não enviou keywords)
- **Custo Total**: Soma dos custos das campanhas

---

## 🆘 Precisa de Ajuda?

### Documentação Completa
- **GOOGLE_ADS_WEB_IMPORT_GUIDE.md** - 700+ linhas, 20 seções
- **QUICKSTART_CSV_IMPORT.md** - Guia rápido de 3 passos
- **CSV_IMPORT_FEATURE_COMPLETE.md** - Documentação técnica

### Logs Úteis
Abra Console do navegador (F12) e procure por:
- `✅` - Operações bem-sucedidas
- `❌` - Erros
- `📊` - Estatísticas de importação
- `🔧` - Debug de parseamento

### Teste Rápido
Se quiser apenas testar se funciona:
1. Pegue **APENAS** `Campanhas_*.csv`
2. Arraste para a interface
3. Clique "Iniciar Importação"
4. Deve ver pelo menos 1 campanha importada

---

**Boa sorte com o teste!** 🚀

Se funcionar, você terá:
- ✅ 3+ anos de dados históricos reais
- ✅ Dashboard funcionando com suas campanhas
- ✅ Sistema pronto para quando o Developer Token chegar
- ✅ Análise completa de ROI e conversões

**Tempo total esperado**: 2-5 minutos do início ao fim.
