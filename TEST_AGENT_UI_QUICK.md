# ✅ Guia Rápido - Testar Interface de Agentes

## 📋 Passo a Passo para Validação

### **1. Recarregar a Página** (CTRL+F5)
```
✅ Forçar reload do JavaScript modificado
✅ Limpar cache do navegador
```

### **2. Navegar para IA & Agentes**
```
URL: http://localhost:3000/#ai
Ou: Menu lateral → "IA & Agentes"
```

### **3. Verificar Curriculum Agent**
```
✅ Na seção "Agentes Cadastrados"
✅ Procurar por: "Professor Virtual de Artes Marciais"
✅ Deve mostrar:
   - Ícone: 📚
   - Status: 🟢 Ativo
   - Modelo: gemini-1.5-pro
```

### **4. Testar Edição**
```
1. Clicar no botão "⚙️ Configurar"
2. ✅ Modal deve abrir com dados preenchidos
3. ✅ Campos editáveis:
   - Nome
   - Especialização (dropdown com "curriculum")
   - Modelo (Gemini Pro/Flash)
   - Temperatura (slider 0-1)
   - Max Tokens (256-8192)
   - Status (Ativo/Inativo)
   - System Prompt (textarea editável)
   - Descrição (textarea opcional)
4. Fazer uma mudança (ex: temperatura de 0.7 → 0.5)
5. Clicar "💾 Salvar Alterações"
6. ✅ Modal fecha
7. ✅ Alert: "✅ Agente atualizado com sucesso!"
```

### **5. Testar Criação de Novo Agent**
```
1. Rolar para seção "Criar Novo Agente"
2. Preencher:
   - Nome: "Teste de Criação"
   - Especialização: "📚 Curricular (Planos de Curso/Aula)"
   - Modelo: "⚡ Gemini 1.5 Flash"
   - Instruções: "Agente de teste para validar funcionalidade..."
3. Clicar "🤖 Criar Agente"
4. ✅ Alert: "✅ Agente criado com sucesso!"
5. ✅ Novo agent aparece na lista
```

### **6. Verificar Console (F12)**
```
✅ Nenhum erro vermelho
✅ Logs esperados:
   - "✅ Enhanced AI Module initialized successfully"
   - "✅ PackagesModule inicializado com sucesso"
   - "🔧 Initializing API Client..."
```

---

## 🐛 Se Algo Não Funcionar

### **Modal não abre**
```bash
# Console F12 → verificar erros
# Provavelmente: JavaScript não carregou

# Solução: Hard reload
CTRL + SHIFT + R (Chrome)
CTRL + F5 (Firefox)
```

### **Agent não aparece na lista**
```bash
# Verificar se seed foi executado
npx tsx scripts/seed-curriculum-agent.ts

# Verificar no Prisma Studio
npx prisma studio
# Tabela: AIAgent
# Procurar: "Professor Virtual de Artes Marciais"
```

### **Erro ao salvar**
```bash
# Console mostrará erro específico:
- 400: Campo inválido (verificar validação)
- 404: Agent não encontrado
- 500: Erro no servidor (ver logs do servidor)

# Ver logs do servidor:
# Terminal onde rodou: npm run dev
```

---

## ✅ Checklist Final

- [ ] Página carregou sem erros
- [ ] Agent "Professor Virtual..." aparece na lista
- [ ] Botão "⚙️ Configurar" funciona
- [ ] Modal abre com dados corretos
- [ ] Campos são editáveis
- [ ] Salvar funciona (alert de sucesso)
- [ ] Criar novo agent funciona
- [ ] Deletar agent funciona (com confirmação)
- [ ] Dropdown "Especialização" tem opção "curriculum"
- [ ] Dropdown "Modelo" tem Gemini Pro e Flash

---

## 🎯 Próximo Teste

Depois de validar a interface, teste via API direto:

```bash
# Listar todos os agents
curl http://localhost:3000/api/agents \
  -H "x-organization-id: 452c0b35-1822-4890-851e-922356c812fb"

# Deve retornar JSON com array de agents
```

**TUDO PRONTO!** 🚀

Se todos os checkboxes acima estiverem ✅, a interface está **100% funcional**.
