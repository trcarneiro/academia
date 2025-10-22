# 🧪 Consolidated Charges - Testing Guide

## ✅ Pre-Requisites

Antes de começar o teste, certifique-se que:
- [ ] Servidor está rodando em `http://localhost:3000`
- [ ] Você está autenticado na aplicação
- [ ] Existem pelo menos 2 alunos cadastrados
- [ ] Existe pelo menos 1 plano disponível

---

## 📝 Test Scenario

### Scenario: Adriana é responsável financeira de Pedro

**Setup:**
- Aluno A: Adriana Silva (responsável)
- Aluno B: Pedro Teste (dependente)
- Plan: Plano Premium - R$ 299.90/mês

---

## 🚀 Step-by-Step Testing

### PARTE 1: Criar Relacionamento Financeiro

#### Step 1.1: Abrir perfil de Pedro Teste
1. Navegue para módulo **"Alunos"**
2. Procure por **"Pedro Teste"** (ou crie um novo aluno)
3. Clique para abrir o perfil
4. Você deve ver a tela de edição

```
Expected: Página de edição de aluno aberta
```

#### Step 1.2: Navegar para aba Financeira
1. Na tela de edição, clique na aba **"Financeiro"**
2. Você deve ver seção "Responsável Financeiro Atual"

```
Expected: Seção "Responsável Financeiro" visível
Current: Nenhum responsável financeiro vinculado
```

#### Step 1.3: Selecionar Adriana como responsável
1. Na seção "Selecionar Responsável Financeiro", clique no dropdown
2. Procure e selecione **"Adriana Silva"**
3. Clique no botão **"💾 Salvar"**

```
Expected: 
- Dropdown mostra Adriana Silva na lista
- POST request: /api/students/:id/financial-responsible-student → 200 OK
- Toast: "Responsável financeiro atualizado com sucesso"
```

#### Step 1.4: Verificar relacionamento
1. Atualize a página (F5)
2. Abra novamente o perfil de Pedro
3. Na aba Financeiro, deve aparecer: **✅ Adriana Silva**

```
Expected: 
- "✅ Adriana Silva - adriana@email.com • (11) xxxxx-xxxx"
```

---

### PARTE 2: Adicionar Plano a Pedro

#### Step 2.1: Na mesma aba Financeiro, procurar "Pacotes Ativos"
1. Scroll down um pouco
2. Você deve ver seção **"📦 Pacotes Ativos"**
3. Clique em **"➕ Adicionar Pacote"**

```
Expected: 
- Seção "Pacotes Ativos" visível
- Botão "Adicionar Pacote" disponível
```

#### Step 2.2: Selecionar um plano
1. Uma lista de pacotes deve aparecer (ou um modal)
2. Procure por **"Plano Premium"** (ou qualquer plano disponível)
3. Clique para selecionar

```
Expected:
- Lista de planos disponíveis mostrada
- Exemplo: "Plano Premium - R$ 299.90/mês"
```

#### Step 2.3: Confirmar compra
1. Confirme a seleção do plano
2. Aguarde a requisição POST ser processada

```
Expected:
- POST /api/students/:pedroId/subscriptions → 200 OK
- Toast: "Plano adicionado com sucesso"
- Plano aparece em "Pacotes Ativos"
```

#### Step 2.4: Verificar plano adicionado
1. A seção "Pacotes Ativos" agora deve mostrar o plano
2. Exemplo:

```
┌─ Plano Premium ─────────────┐
│ Início: 21/10/2025          │
│ Renovação: 21/11/2025       │
│ Valor: R$ 299.90/mês        │
│ Status: ✅ Ativo            │
└─────────────────────────────┘
```

---

### PARTE 3: Testar Seção Consolidada

#### Step 3.1: Abrir perfil de Adriana Silva
1. Volte ao módulo **"Alunos"**
2. Procure por **"Adriana Silva"**
3. Clique para abrir o perfil

```
Expected: Página de edição de Adriana aberta
```

#### Step 3.2: Navegar para aba Financeira
1. Clique na aba **"Financeiro"**
2. Scroll down para procurar nova seção

```
Expected: 
- Seção "Responsável Financeiro Atual" (vazia ou com dados pessoais)
- Seção "Pacotes Ativos" (vazios se Adriana não tem planos)
```

#### Step 3.3: 🎉 Verificar Nova Seção "Planos dos Dependentes"
Scroll down um pouco mais e você deve ver:

```
┌─────────────────────────────────────────────────────┐
│ 📊 Planos dos Dependentes      [1 dependente] 🎨   │
├─────────────────────────────────────────────────────┤
│                                                       │
│  Total de Planos: 1                                 │
│  Total Consolidado: R$ 299.90/mês                   │
│                                                       │
│  ┌──────────────┬────────────┬──────────┬──────────┐│
│  │ Dependente   │ Plano      │ Valor    │ Status   ││
│  ├──────────────┼────────────┼──────────┼──────────┤│
│  │ 👤 Pedro     │ Plano      │ R$       │ ✅ Ativo ││
│  │ Teste        │ Premium    │ 299.90   │          ││
│  │ pedro@email  │            │          │          ││
│  └──────────────┴────────────┴──────────┴──────────┘│
│                                                       │
└─────────────────────────────────────────────────────┘
```

**✅ SUCESSO!** Seção consolidada aparecendo!

---

## 🧪 Validation Checklist

### Seção "Planos dos Dependentes" (NOVO)

#### Estrutura Visual
- [ ] Seção tem título "📊 Planos dos Dependentes"
- [ ] Badge mostra número correto de dependentes (exemplo: "[1 dependente]")
- [ ] Background é gradiente azul (#f0f4ff → #ffffff)
- [ ] Border é azul (#667eea)
- [ ] Border radius é arredondado

#### Informações Sumárias
- [ ] "Total de Planos:" mostra número correto (exemplo: "1")
- [ ] "Total Consolidado:" mostra valor formatado (exemplo: "R$ 299.90/mês")
- [ ] Valor está em vermelho/roxo (gradient color)

#### Tabela de Dados
- [ ] Header da tabela tem fundo gradiente (azul → roxo)
- [ ] Header text é branco
- [ ] Colunas: Dependente | Plano | Valor | Status | Início | Renovação

#### Linha de Dados
- [ ] Dependente mostra: 👤 icon + nome + email
- [ ] Nome está em negrito
- [ ] Email está em cinza (muted)
- [ ] Plano mostra nome correto (exemplo: "Plano Premium")
- [ ] Valor mostra formato correto (exemplo: "R$ 299.90")
- [ ] Status mostra badge verde com "✅ Ativo"
- [ ] Início mostra data em formato DD/MM/YYYY (exemplo: "21/10/2025")
- [ ] Renovação mostra data em formato DD/MM/YYYY (exemplo: "21/11/2025")

#### Interatividade
- [ ] Ao passar o mouse sobre a linha, background muda (light blue)
- [ ] Cursor muda para pointer
- [ ] Sem erros no console

#### Responsividade
- [ ] Desktop (1440px): Tabela completa visível
- [ ] Tablet (1024px): Fonte um pouco menor, mas legível
- [ ] Mobile (768px): Tabela se adapta, sem quebras

---

## 🔍 API Validation

### Check Backend Requests

Abra DevTools (F12) → Aba Network

#### Request esperado ao abrir Financial tab de Adriana:
```
GET /api/students/[adriana-id]/consolidated-charges

Status: 200 OK
Response:
{
  "success": true,
  "data": {
    "dependents": 1,
    "charges": [
      {
        "dependentId": "uuid-pedro",
        "dependentName": "Pedro Teste",
        "dependentEmail": "pedro@email.com",
        "planId": "uuid-plan",
        "planName": "Plano Premium",
        "planPrice": 299.90,
        "subscriptionStatus": "active",
        "subscriptionStartDate": "2025-10-21T00:00:00.000Z",
        "subscriptionEndDate": "2025-11-21T00:00:00.000Z"
      }
    ],
    "totalAmount": 299.90,
    "totalCharges": 1
  }
}
```

#### Validação:
- [ ] Status: 200 OK (não 500, não 404)
- [ ] Success: true
- [ ] Dependents: número correto
- [ ] Charges array: tem dados
- [ ] TotalAmount: sum correto
- [ ] TotalCharges: count correto

---

## 🐛 Troubleshooting

### Problema 1: Seção "Planos dos Dependentes" não aparece

**Possíveis causas:**
1. Pedro não está marcado como dependente de Adriana
   - **Fix**: Volte ao Step 1.3 e confirme o relacionamento

2. Pedro não tem planos ativos
   - **Fix**: Volte ao Step 2 e adicione um plano

3. JavaScript erro
   - **Fix**: Abra DevTools (F12) e procure por erros na aba Console

**Verificar:**
```javascript
// No console (F12 → Console):
console.log(consolidatedData); // Deve mostrar os dependentes
```

### Problema 2: Seção aparece mas sem dados

**Possíveis causas:**
1. API endpoint retornando erro
   - **Fix**: Verificar Network tab (F12), procurar por 500 erro

2. Dados não formatados corretamente
   - **Fix**: Verificar Response JSON no Network tab

**Verificar:**
```
Network tab → GET /api/students/.../consolidated-charges
→ Response tab → Verificar JSON estrutura
```

### Problema 3: Estilos não aparecem

**Possíveis causas:**
1. CSS não carregou
   - **Fix**: Hard refresh (Ctrl+Shift+R)

2. CSS classes conflitando
   - **Fix**: Abrir DevTools, inspecionar elemento, verificar styles

**Verificar:**
```
DevTools → Elements → Inspecionar elemento consolidado
→ Styles tab → Procurar .consolidated-* classes
```

---

## 📊 Extended Testing

### Teste com Múltiplos Dependentes

1. Crie 2-3 alunos adicionais
2. Marque todos como dependentes de Adriana
3. Adicione planos diferentes para cada um
4. Verificar que:
   - [ ] Badge mostra número correto (exemplo: "[3 dependentes]")
   - [ ] Tabela mostra todas as linhas
   - [ ] Total consolidado está correto

### Teste com Diferentes Status de Plano

1. Adicione plano com status diferente (exemplo: "inactive")
2. Verificar que badge de status muda (exemplo: "❌ Inativo")
3. Verificar que cor muda (vermelha para inativo)

### Teste de Performance

1. Marque 10+ dependentes
2. Adicione vários planos
3. Abra Financial tab
4. Verificar que:
   - [ ] Página carrega em < 2 segundos
   - [ ] Tabela renderiza corretamente
   - [ ] Sem freezing ou lag

---

## 📱 Mobile Testing

### No Chrome DevTools:
1. F12 → Toggle device toolbar (Ctrl+Shift+M)
2. Selecione "iPhone 12" ou "Galaxy S20"
3. Abra Financial tab
4. Verificar que:
   - [ ] Seção é legível em mobile
   - [ ] Não há overflow horizontal
   - [ ] Fonte é legível
   - [ ] Tabela é responsiva
   - [ ] Badges e ícones aparecem corretamente

---

## ✅ Final Verification

```javascript
// Checklist Final

INTERFACE:
☐ Seção "Planos dos Dependentes" visible
☐ Badge mostra dependentes
☐ Tabela mostra dados corretos
☐ Status badges corretos
☐ Datas formatadas pt-BR
☐ Valores formatados em R$

FUNCIONAMENTO:
☐ API retorna dados corretos
☐ Sem erros no console
☐ Network requests 200 OK
☐ Responsive em 3 breakpoints
☐ Hover effects funcionam

DADOS:
☐ Nomes dos dependentes corretos
☐ Emails dos dependentes corretos
☐ Planos aparecem certos
☐ Valores corretos
☐ Datas corretas
☐ Status corretos
☐ Total consolidado correto
```

---

## 🎉 Expected Outcome

Quando tudo estiver funcionando:

1. **Adriana vê seu perfil** → Financial tab
2. **Nova seção aparece** → "Planos dos Dependentes"
3. **Tabela mostra Pedro** → Com seu plano "Plano Premium"
4. **Informações exatas** → R$ 299.90, status ativo, datas corretas
5. **Design premium** → Cores, gradientes, espaçamento corretos
6. **Responsivo** → Funciona em todos os tamanhos de tela

**Você conseguirá visualizar consolidadamente os planos de seus dependentes!** 🎊

---

## 📞 Support

Se encontrar problemas:

1. **Verifique console** (F12 → Console)
2. **Verifique Network** (F12 → Network)
3. **Verifique que Pedro está marcado como dependente de Adriana**
4. **Verifique que Pedro tem pelo menos 1 plano ativo**
5. **Faça hard refresh**: Ctrl+Shift+R

---

## 🚀 Next Steps

Após validação bem-sucedida:

1. ✅ Sistema está pronto para produção
2. ✅ Testar com dados reais
3. ✅ Treinar usuários
4. ✅ Monitorar performance

---

**Happy Testing!** 🎨✨
