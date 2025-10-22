# 🚀 PRÓXIMO PASSO - Task 20: Dashboard de Créditos

## ✅ Status Atual

**Task 19 (Seed Planos)**: ✅ COMPLETO + UUID FIX
- 15 planos criados com UUIDs válidos
- API validation passando
- Pronto para uso

## 🎯 Task 20: Frontend Dashboard de Créditos

### O que é?
Interface visual para alunos acompanharem seu saldo de créditos:
- Saldo atual de créditos
- Histórico de consumo
- Data de expiração
- Renovações automáticas planejadas
- Progresso visual (barra/percentual)

### Arquitetura
```
/public/js/modules/credits/
├── index.js                 # Single-file module (400-600 linhas)
├── controllers/             # (vazio - compatibilidade)
└── services/                # (vazio - compatibilidade)

/public/css/modules/
└── credits.css              # Estilos premium isolados

/public/views/
└── credits.html             # Página HTML (template)
```

### Template a Usar
**Referência**: `/public/js/modules/instructors/index.js` (single-file)
- ✅ Simples e direto
- ✅ Sem complexidade desnecessária
- ✅ Performance otimizada

**Ou avançado**: `/public/js/modules/students/` (multi-file)
- Se precisar de múltiplas abas/views
- Se tiver muita lógica específica

### Padrão Obrigatório
```javascript
// 1. API client pattern
moduleAPI = createModuleAPI('Credits');

// 2. Fetch with states
await moduleAPI.fetchWithStates('/api/student/:id/credits', {
  onLoading: (el) => showSpinner(),
  onSuccess: (data) => renderDashboard(data),
  onEmpty: () => showEmptyState(),
  onError: (err) => showErrorState(err)
});

// 3. CSS isolado
.module-isolated-credits-header { }
.module-isolated-credits-card { }
.module-isolated-credits-progress { }

// 4. Integração AcademyApp
window.credits = Credits;
window.app?.dispatchEvent('module:loaded', { name: 'credits' });
```

### Endpoints Necessários (Já implementados? ✅)
```
GET /api/student/:id/credits
├─ Retorna: saldo, consumo, renovações
GET /api/credits/history/:studentId
└─ Retorna: histórico detalhado de transações
```

**Status**: Verificar em http://localhost:3000/docs

### Features MVP (Mínimo Viável)
1. **Card Principal**
   - Título: "💰 Seus Créditos"
   - Saldo: "X créditos disponíveis"
   - Barra de progresso (cor verde até 30%, amarelo até 10%, vermelho < 10%)

2. **Tabela de Histórico**
   - Data | Tipo | Quantidade | Saldo Restante
   - Filtro por período (últimos 30 dias, 90 dias, tudo)
   - Paginação se > 10 itens

3. **Informações de Renovação**
   - "Próxima renovação em: X dias"
   - Plano ativo: "Trial 7 Dias"
   - Data de expiração: "XX/XX/XXXX"

### Features Nice-to-Have (Pós-MVP)
- [ ] Gráfico de consumo (chart.js)
- [ ] Simulador de gasto (quanto duraria se usar X créditos/semana)
- [ ] Exportar histórico (PDF)
- [ ] Notificações de renovação automática

## 📋 Checklist de Desenvolvimento

### Preparação
- [ ] Ler `/dev/MODULE_STANDARDS.md`
- [ ] Ler `copilot-instructions.md` (Design System section)
- [ ] Copiar template de `instructors/index.js`

### Implementação Frontend
- [ ] Criar `/public/js/modules/credits/index.js` (450 linhas aprox.)
- [ ] Criar `/public/css/modules/credits.css` (200 linhas aprox.)
- [ ] Criar `/public/views/credits.html` (80 linhas aprox.)
- [ ] Integrar no `index.html` (menu + CSS link)

### Integração AcademyApp
- [ ] Adicionar "credits" no `loadModules()` array
- [ ] Expor global: `window.credits = Credits`
- [ ] Disparar evento: `window.app.dispatchEvent('module:loaded')`

### Styling (Design System)
- [ ] Usar `.module-isolated-credits-*` para todas as classes
- [ ] Cores: `--primary-color` e `--gradient-primary`
- [ ] Barra de progresso com cores condicionais
- [ ] Responsivo: 768px, 1024px, 1440px

### Testing
- [ ] [ ] Teste Loading state (spinner)
- [ ] [ ] Teste Success state (dados carregam)
- [ ] [ ] Teste Empty state (sem créditos)
- [ ] [ ] Teste Error state (API falha)
- [ ] [ ] Teste Responsividade (3 breakpoints)
- [ ] [ ] Teste com dados reais (Lucas Mol + Trial 7 Dias)

### Quality Gates
```bash
npm run build        # ✅ Sem erros TypeScript
npm run lint         # ✅ Sem erros ESLint
npm run test         # ✅ Testes cobrem happy path + erro
npm run ci           # ✅ Full pipeline
```

## 🎨 UI Mockup Esperado

```
╔════════════════════════════════════════════════╗
║           💰 Seus Créditos                     ║
╠════════════════════════════════════════════════╣
║                                                ║
║  Saldo Disponível:  7 créditos                ║
║  ████████░░░░░░░░░░░░░░░░░░░░░░░░  70%       ║
║                                                ║
║  Próxima renovação: 7 dias (24/10/2025)       ║
║  Plano ativo: 🎉 Trial 7 Dias                 ║
║                                                ║
╠════════════════════════════════════════════════╣
║  📋 Histórico                                  ║
├────────────────────────────────────────────────┤
║  Data       │ Tipo           │ Qtd │ Saldo   ║
├────────────────────────────────────────────────┤
║  17/10/2025 │ ✅ Aula usado   │ -1  │ 7 / 10 ║
║  16/10/2025 │ ✅ Aula usado   │ -1  │ 8 / 10 ║
║  15/10/2025 │ ➕ Trial criado│ +7  │ 9 / 10 ║
╚════════════════════════════════════════════════╝
```

## 🔗 Dependências

| Item | Status | Impacto |
|------|--------|--------|
| Planos com UUID | ✅ COMPLETO | Bloqueador removido |
| API endpoints | ⚠️ A verificar | Alta |
| Design tokens | ✅ Existem | Nenhum (já tenho) |
| AcademyApp | ✅ Funciona | Nenhum (já funciona) |

## ⏱️ Estimativa

| Parte | Horas |
|-------|-------|
| Frontend (HTML + CSS + JS) | 2-3h |
| Integration (AcademyApp) | 0.5h |
| Testing (manual + unit) | 1h |
| **Total** | **3-4h** |

## 🚀 Como Começar

```bash
# 1. Copiar template
cp public/js/modules/instructors/index.js public/js/modules/credits/index.js

# 2. Customizar para créditos
# - Mudar endpoints: /api/students/:id/courses → /api/students/:id/credits
# - Mudar campos: renderizar créditos em vez de aulas
# - Mudar estados: loading/empty/error igual, só dados diferentes

# 3. Rodar build
npm run build

# 4. Testar no navegador
# http://localhost:3000 → Menu → "Créditos" (ou similar)
```

## ✅ Definition of Done

- [ ] Frontend mostra saldo de créditos
- [ ] Histórico carrega com dados reais
- [ ] Todos os 3 UI states funcionam
- [ ] Responsivo em 768/1024/1440
- [ ] Sem erros no console
- [ ] Build/lint/test passam
- [ ] Código bem documentado
- [ ] Menu tem link para "Créditos"

## 📚 Referências

- Template: `/public/js/modules/instructors/index.js`
- Design: `dev/DESIGN_SYSTEM.md`
- Padrões: `/dev/MODULE_STANDARDS.md`
- API Docs: http://localhost:3000/docs

---

**Próximo passo**: Implementar frontend do Dashboard de Créditos  
**Tempo estimado**: 3-4 horas  
**Prioridade**: ALTA (desbloqueador para Task 21)  
**Status**: ✅ Pronto para começar
