# 🎯 ACESSO RÁPIDO - Módulo IA & Agentes

## ✅ **MUDANÇA APLICADA**

Adicionei o menu **"🤖 IA & Agentes"** no menu lateral!

## 📍 **Como Acessar AGORA**

### **Método 1: Pelo Menu Lateral** (RECOMENDADO)

1. **Recarregue a página** (pressione `F5` ou clique em Recarregar)
2. Olhe no **menu lateral esquerdo**
3. **Role a lista** se necessário (pode estar abaixo de "Frequência")
4. Procure o item: **🤖 IA & Agentes**
5. **Clique nele**

### **Método 2: URL Direta** (MAIS RÁPIDO)

Cole esta URL no navegador:
```
http://localhost:3000/#ai
```

---

## 🗺️ **Localização no Menu**

O menu lateral agora tem esta ordem:

```
📊 Dashboard
👥 Alunos
🎯 CRM & Leads
🏷️ Comercial
🏃 Atividades
📚 Planos de Aula
🎓 Cursos
👥 Turmas
🏫 Organizações
🏢 Unidades
👨‍🏫 Instrutores
✅ Check-in Kiosk
📅 Agenda
📊 Frequência
🤖 IA & Agentes  ← NOVO! AQUI!
📥 Importação
📈 Relatórios
⚙️ Configurações
```

---

## 🎨 **O Que Você Verá**

Ao clicar em **"🤖 IA & Agentes"**, você verá:

### **Topo da Página**
- Título: "Inteligência Artificial"
- Breadcrumb: "Home / Cursos / IA"

### **Dashboard com 5 Abas**
1. **📊 Visão Geral** - Busca de alunos, ferramentas AI
2. **📚 Cursos** - Cursos matriculados
3. **📅 Frequência** - Histórico de presença
4. **💡 Insights AI** - Análises e recomendações
5. **🤖 Agentes IA** ⭐ **← CLIQUE AQUI!**

### **Aba "Agentes IA"**
- **Estado Vazio** (primeira vez):
  - Mensagem: "Nenhum agente cadastrado"
  - Ícone de robô grande (🤖)
  - Botão: **"Criar Primeiro Agente"**
  
- **Filtros no Topo**:
  - Dropdown: Especialização (Pedagógico, Analítico, Suporte, etc)
  - Dropdown: Status (Ativos, Inativos)

---

## 🚀 **Teste Rápido - Passo a Passo**

1. **Recarregue a página** (`F5`)
2. **Clique em "🤖 IA & Agentes"** no menu lateral
3. **Clique na aba "🤖 Agentes IA"** (última aba à direita)
4. **Clique em "Criar Primeiro Agente"**
5. **Preencha o formulário**:
   - Nome: `Assistente de Teste`
   - Especialização: `Pedagógico`
   - Modelo: `Gemini Flash`
   - System Prompt: `Você é um assistente que ajuda instrutores.`
   - Marque algumas fontes RAG (ex: Cursos, Técnicas)
   - Marque algumas ferramentas MCP (ex: getStudentData)
6. **Clique em "Criar Agente"**
7. **Abra o Console do Navegador** (`F12` → Console)
8. **Veja os dados logados**:
   ```
   Creating agent: {
     name: "Assistente de Teste",
     specialization: "pedagogical",
     ...
   }
   ```

---

## 🐛 **Se Não Aparecer o Menu**

### **Opção A: Forçar Reload**
- Pressione `Ctrl + Shift + R` (Windows)
- Ou `Cmd + Shift + R` (Mac)
- Isso limpa o cache e recarrega tudo

### **Opção B: Limpar Cache Completo**
1. `F12` para abrir DevTools
2. Clique com **botão direito** no ícone de Recarregar
3. Selecione **"Limpar cache e recarregar forçado"**

### **Opção C: Usar URL Direta**
```
http://localhost:3000/#ai
```
Digite direto na barra de endereço e pressione Enter

---

## 📊 **Console Logs Esperados**

Ao acessar o módulo IA, você deve ver no console:

```
🤖 Initializing AI Module...
AI View initialized
✅ AI View rendered successfully
✅ AI Module initialized successfully
```

Se ver esses logs, está funcionando! 🎉

---

## ❓ **FAQ Rápido**

**P: Onde está o menu "RAG System"?**  
R: Foi renomeado para "🤖 IA & Agentes" (mais intuitivo)

**P: Por que o formulário não salva?**  
R: Backend ainda não implementado. Os dados aparecem no console do navegador (F12) para debug.

**P: Posso criar agentes agora?**  
R: Interface sim! Mas não vão salvar no banco até implementarmos a API.

**P: Quando vai funcionar completo?**  
R: Precisamos implementar o backend (estimativa: 8-12 horas de dev)

---

## 📞 **Próximos Passos**

1. ✅ **Teste a interface** (formulário, filtros, navegação)
2. ⏳ **Aguarde backend** (APIs + banco de dados)
3. 🚀 **Use em produção** (criar agentes reais, chat, etc)

---

**Última Atualização**: 09/10/2025 - 16:30  
**Status**: Menu adicionado, pronto para teste  
**Ação**: Recarregue a página (F5) e procure "🤖 IA & Agentes"
