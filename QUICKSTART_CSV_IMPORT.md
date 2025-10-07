# 🎯 Quick Start: Importação CSV via Drag-and-Drop

## 3 Passos para Importar Seus Dados

### 1️⃣ Inicie o servidor
```bash
npm run dev
```

### 2️⃣ Acesse a interface
```
http://localhost:3000/#/crm/settings
```
Role até "📄 Importar Dados do Google Ads (CSV)"

### 3️⃣ Arraste seus CSVs e clique "Iniciar Importação"

**Pronto!** Em 10-30 segundos seus dados estarão no dashboard 🚀

---

## 📁 Arquivos Necessários

Exporte do Google Ads (português BR):

✅ **Obrigatórios** (sistema funciona sem os outros):
- `Campanhas_*.csv` - Lista de campanhas com métricas

✅ **Recomendados** (enriquecem a análise):
- `Série_temporal_*.csv` - Histórico diário (3+ anos)
- `Palavras-chave_de_pesquisa_*.csv` - Top termos de busca

⏳ **Futuros** (ainda não implementados):
- `Dispositivos_*.csv`
- `Informações_demográficas_*.csv`
- `Dia_e_hora_*.csv`

---

## 📊 Como Exportar do Google Ads

1. Acesse Google Ads: https://ads.google.com
2. Menu **Campanhas** → selecione período (ex: últimos 3 anos)
3. Botão **Exportar** (ícone download)
4. Escolha formato: **CSV**
5. Salve arquivos em uma pasta

Repita para cada tipo de relatório que quiser importar.

---

## ✅ Checklist de Sucesso

Após importação, verifique:

- [ ] Resumo mostra "X campanhas importadas" (X > 0)
- [ ] Total investido aparece (R$ X.XXX,XX)
- [ ] Dashboard em `/#/crm/dashboard` mostra campanhas reais
- [ ] Prisma Studio (`npm run db:studio`) tem registros com `REAL_CAMPAIGN_*`

---

## 🆘 Problemas Comuns

### "Nenhum arquivo CSV selecionado"
→ Você arrastou .xlsx ou .txt. Use apenas .csv

### "No files uploaded"
→ Servidor não está rodando. Execute `npm run dev`

### "Error processing [arquivo].csv"
→ CSV não tem colunas esperadas. Confira se exportou do Google Ads em português BR

---

## 📚 Documentação Completa

- **GOOGLE_ADS_WEB_IMPORT_GUIDE.md** - Guia de 20 seções (700+ linhas)
- **CSV_IMPORT_FEATURE_COMPLETE.md** - Documentação técnica completa
- **GOOGLE_ADS_INDEX.md** - Índice de toda documentação

---

**Versão:** 1.0 | **Data:** 03/10/2025 | **Status:** ✅ Funcional
