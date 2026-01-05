# 🧪 GUIA DE TESTES MANUAIS - Pré-Matrícula Rápida

## 🎯 Objetivo
Testar todas as funcionalidades do módulo de pré-matrícula através da interface web.

---

## 🚀 PASSO A PASSO

### 1. Acessar o Sistema

```
URL: http://localhost:3000
```

1. Faça login no sistema
2. No menu lateral, procure por "Pré-Matrículas" ou "Matricula Rápida"
3. Clique para abrir o módulo

---

### 2. Verificar Dashboard

**O que você deve ver:**

```
┌────────────────────────────────────────┐
│ 📝 Pré-Matrículas & Links Públicos    │
│ [➕ Gerar Link de Matrícula]           │
├────────────────────────────────────────┤
│ Stats Cards:                           │
│ - ⏳ Pendentes                         │
│ - ✅ Convertidas                       │
│ - 👥 Total                             │
└────────────────────────────────────────┘
```

**✅ Teste**: Verificar se os números nos cards fazem sentido

---

### 3. Gerar Link de Matrícula

1. Clique em **"Gerar Link de Matrícula"**
2. No modal que abrir:
   - Selecione um **Plano** (obrigatório)
   - Selecione um **Curso** (opcional)
   - Digite um **Preço Customizado** (opcional, ex: 99.90)
   - Defina **Válido por** (dias, padrão 30)
3. Clique em **"Gerar Link"**
4. O link aparecerá na tela
5. Clique em **"Copiar"** para copiar o link

**✅ Teste**: 
- Link foi gerado?
- Link foi copiado para a área de transferência?
- Link tem o formato correto?

---

### 4. Criar Pré-Matrícula Manual

Como o formulário de criação pode não estar visível no admin, você pode:

**Opção A: Via API (curl no terminal)**

```bash
curl -X POST http://localhost:3000/api/pre-enrollment \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Maria",
    "lastName": "Santos",
    "cpf": "22233344455",
    "phone": "(31) 98888-2222",
    "email": "maria.teste@example.com",
    "birthDate": "1995-08-20",
    "source": "teste_manual"
  }'
```

**Opção B: Via link público (criar página HTML)**

Abra o link gerado no passo 3 em uma aba anônima.

**✅ Teste**: 
- Pré-matrícula apareceu na lista?
- Dados estão corretos?
- Status é "PENDENTE"?

---

### 5. Filtrar Pré-Matrículas

1. Use o **campo de busca** para procurar por:
   - Nome: "Maria"
   - Email: "maria.teste@example.com"
   - CPF: "22233344455"

2. Use o **dropdown de status**:
   - Selecione "Pendentes"
   - Selecione "Convertidas"
   - Selecione "Todos"

**✅ Teste**: 
- Busca por nome funciona?
- Filtro por status funciona?
- Resultados são atualizados em tempo real?

---

### 6. Visualizar Detalhes

1. Clique duas vezes em um card de pré-matrícula
   - Ou clique no botão "Ver Detalhes"

**O que você deve ver:**
- Nome completo
- Email e telefone
- CPF e data de nascimento
- Plano escolhido (se houver)
- Curso escolhido (se houver)
- Preço customizado (se houver)
- Origem (website, instagram, etc)
- Data de criação
- Notas (se houver)

**✅ Teste**: 
- Todos os dados estão corretos?
- Layout está bem formatado?

---

### 7. Editar Pré-Matrícula

1. Clique em **"Editar"** em uma pré-matrícula
2. Altere o **telefone** para: `(31) 99999-8888`
3. Altere o **email** para: `novo.email@example.com`
4. Clique em **"Salvar"**

**✅ Teste**: 
- Dados foram atualizados?
- Card reflete as mudanças?
- Não houve erro de validação?

---

### 8. Adicionar Nota

1. Clique em **"Adicionar Nota"** em uma pré-matrícula
2. Digite: `Cliente demonstrou muito interesse. Ligar amanhã às 10h.`
3. Clique em **"Salvar"**

**✅ Teste**: 
- Nota foi adicionada?
- Nota aparece com timestamp?
- Formato: `[29/12/2025 14:30] Cliente demonstrou...`

---

### 9. Converter em Aluno

1. Selecione uma pré-matrícula com status **PENDENTE**
2. Clique em **"Converter em Aluno"**
3. Confirme a ação
4. Aguarde o processamento

**O que acontece:**
- Cria um usuário (login + senha)
- Cria um registro de aluno (student)
- Cria uma assinatura (subscription) se houver plano
- Matricula no curso se houver curso
- Cria responsável financeiro se houver
- Atualiza status para **CONVERTIDA**

**✅ Teste**: 
- Status mudou para "CONVERTIDA"?
- Mensagem de sucesso apareceu?
- Aluno aparece na lista de alunos?
- Navegue até "Alunos" e verifique

---

### 10. Rejeitar Pré-Matrícula

1. Selecione uma pré-matrícula com status **PENDENTE**
2. Clique em **"Rejeitar"**
3. Digite um motivo (opcional): `Cliente não atende aos critérios`
4. Confirme a ação

**✅ Teste**: 
- Status mudou para "REJEITADA"?
- Mensagem de sucesso apareceu?
- Card mudou de cor (cinza/vermelho)?

---

## 📊 CHECKLIST FINAL

Use este checklist durante os testes:

- [ ] Dashboard carrega sem erros
- [ ] Stats cards mostram números corretos
- [ ] Gerar link de matrícula funciona
- [ ] Link gerado pode ser copiado
- [ ] Criar pré-matrícula (manual ou via API) funciona
- [ ] Listagem mostra todas as pré-matrículas
- [ ] Busca por nome/email/CPF funciona
- [ ] Filtro por status funciona
- [ ] Visualizar detalhes funciona
- [ ] Editar informações funciona
- [ ] Adicionar nota funciona
- [ ] Nota aparece com timestamp correto
- [ ] Converter em aluno funciona
- [ ] Aluno criado aparece na lista de alunos
- [ ] Rejeitar pré-matrícula funciona
- [ ] Status é atualizado corretamente
- [ ] UI está responsiva (mobile, tablet, desktop)
- [ ] Não há erros no console do navegador
- [ ] Não há erros nos logs do servidor

---

## 🐛 PROBLEMAS COMUNS

### 1. "Rota não encontrada"
**Solução**: Reinicie o servidor PM2
```bash
pm2 restart all
```

### 2. "Erro ao carregar dados"
**Solução**: Verifique conexão com o banco de dados
```bash
pm2 logs academia
```

### 3. "Modal não abre"
**Solução**: Verifique console do navegador (F12)
- Procure por erros JavaScript
- Verifique se `window.preEnrollmentAdmin` existe

### 4. "Link não copia"
**Solução**: 
- Navegador pode bloquear clipboard API
- Tente selecionar e copiar manualmente (Ctrl+C)

### 5. "Conversão falha"
**Solução**: Verifique se:
- Organização está configurada
- Plano existe no sistema
- Curso existe no sistema
- Email não está duplicado

---

## 📸 SCREENSHOTS ESPERADOS

### 1. Dashboard Vazio
```
┌────────────────────────────────────────┐
│ 📝 Pré-Matrículas & Links Públicos    │
├────────────────────────────────────────┤
│ 0 Pendentes | 0 Convertidas | 0 Total │
├────────────────────────────────────────┤
│    Nenhuma pré-matrícula encontrada    │
└────────────────────────────────────────┘
```

### 2. Dashboard Com Dados
```
┌────────────────────────────────────────┐
│ 📝 Pré-Matrículas & Links Públicos    │
├────────────────────────────────────────┤
│ 3 Pendentes | 2 Convertidas | 5 Total │
├────────────────────────────────────────┤
│ ┌────────────────────────────────────┐ │
│ │ 👤 Maria Santos      ⏳ PENDENTE  │ │
│ │ maria.teste@example.com           │ │
│ │ (31) 98888-2222 | website         │ │
│ └────────────────────────────────────┘ │
│ ┌────────────────────────────────────┐ │
│ │ 👤 João Silva       ✅ CONVERTIDA │ │
│ │ joao.teste@example.com            │ │
│ │ (31) 98888-1111 | instagram       │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

### 3. Modal de Link
```
┌─────────────────────────────────┐
│ 🔗 Gerar Link de Matrícula      │
├─────────────────────────────────┤
│ Plano: [Mensal - R$ 149,90]     │
│ Curso: [Defesa Pessoal]         │
│ Preço: [99.90]                  │
│ Válido: [30] dias               │
│                                 │
│ Link: [http://localhost:3000...]│
│ [📋 Copiar]                     │
│                                 │
│ [Fechar] [Gerar]                │
└─────────────────────────────────┘
```

---

## 📞 SUPORTE

Se encontrar algum problema:

1. **Verifique os logs**:
   ```bash
   pm2 logs academia --lines 50
   ```

2. **Verifique o console do navegador** (F12):
   - Aba "Console" para erros JavaScript
   - Aba "Network" para erros de API

3. **Verifique o relatório completo**:
   - Leia `RELATORIO_TESTES_PRE_MATRICULA.md`

---

## ✨ BOA PRÁTICA

Após os testes, documente:

1. **O que funcionou** ✅
2. **O que não funcionou** ❌
3. **Sugestões de melhoria** 💡
4. **Bugs encontrados** 🐛

Isso ajudará a melhorar o módulo!

---

**Bons testes! 🚀**

