# 🤖 ORIENTAÇÕES PARA AGENTES IA - KRAV MAGA ACADEMY

## 🛡️ **PROTOCOLO DE DESENVOLVIMENTO SEGURO - OBRIGATÓRIO**

### ⚠️ **ATENÇÃO CRÍTICA - LEIA ANTES DE QUALQUER ALTERAÇÃO**

Este sistema possui uma **arquitetura modular protegida** implementada em 05/07/2025. **NUNCA** altere o código diretamente sem seguir os protocolos de segurança.

## 🔒 **REGRAS OBRIGATÓRIAS**

### **1. 📦 SEMPRE USE MÓDULOS ISOLADOS**

#### **✅ CORRETO - Criar Novo Módulo:**
```javascript
// Em: /public/js/modules/nome-modulo.js
window.NomeModulo = (function() {
    'use strict';
    
    // Estado privado protegido
    let _state = {};
    
    return {
        version: '1.0.0',
        init: function() {
            console.log(`NomeModulo v${this.version} inicializado`);
            return this;
        },
        // API pública...
    };
})();
```

#### **❌ PROIBIDO - Alterar Sistema Principal:**
```javascript
// NUNCA faça isso:
function alterarFuncaoExistente() {
    // Alteração direta quebra o sistema
}
```

### **2. 🔄 WORKFLOW OBRIGATÓRIO**

#### **ANTES DE QUALQUER ALTERAÇÃO:**
```bash
# 1. SEMPRE criar backup
node version-manager.js create "Descrição do que vai implementar"

# 2. Verificar integridade
node version-manager.js check
```

#### **DURANTE IMPLEMENTAÇÃO:**
- ✅ Criar módulos em `/js/modules/`
- ✅ CSS isolado em `/css/modules/`
- ✅ Usar prefixos únicos (`.modulo-isolated`)
- ✅ Implementar fallbacks para sistema original

#### **APÓS IMPLEMENTAÇÃO:**
```bash
# 1. Verificar se não quebrou
node version-manager.js check

# 2. Testar no browser (F12 = 0 erros)

# 3. Criar versão estável
node version-manager.js create "Funcionalidade implementada e testada"
```

### **3. 🔌 INTEGRAÇÃO COM SISTEMA PRINCIPAL**

#### **Padrão para Integrar Módulos:**
```javascript
// No sistema principal
if (window.ModuleLoader && window.ModuleLoader.isModuleLoaded('NomeModulo')) {
    // Usar módulo isolado
    const modulo = window.NomeModulo.init();
    modulo.render();
} else {
    // Fallback para sistema original
    funcaoOriginal();
}
```

### **4. 🎨 CSS ISOLADO OBRIGATÓRIO**

```css
/* Sempre usar prefixo do módulo */
.nome-modulo-isolated {
    /* Estilos base */
}

.nome-modulo-isolated .component {
    /* Componentes específicos */
}

/* Proteção contra override */
.nome-modulo-isolated * {
    box-sizing: border-box;
}
```

## 🚨 **PROTOCOLOS DE EMERGÊNCIA**

### **Se Algo Quebrar:**
```bash
# Rollback imediato para última versão funcional
node version-manager.js list
node version-manager.js rollback [ID_DA_VERSAO_FUNCIONAL]
```

### **Se Houver Erro no Console:**
1. **PARE imediatamente**
2. Verifique logs do browser (F12)
3. Faça rollback se necessário
4. Investigue o erro antes de continuar

## 📋 **MÓDULOS EXISTENTES E FUNCIONAIS**

### **🔒 NÃO ALTERE ESTES MÓDULOS (ESTÃO FUNCIONANDO):**

#### **1. PlansManager v1.0.0**
- **Localização:** `/js/modules/plans-manager.js`
- **CSS:** `/css/modules/plans-styles.css`
- **Status:** ✅ FUNCIONAL E TESTADO
- **Função:** Gestão de planos isolada
- **Última versão estável:** 1751744745983

#### **2. ModuleLoader v1.0.0**
- **Localização:** `/js/module-loader.js`
- **Status:** ✅ FUNCIONAL E TESTADO
- **Função:** Carregamento seguro de módulos

#### **3. Sistema Principal**
- **Localização:** `/public/index.html`
- **Status:** ✅ FUNCIONAL COM FALLBACKS
- **Última versão estável:** 1751744745983

## 🎯 **ORIENTAÇÕES ESPECÍFICAS POR TIPO DE TAREFA**

### **💳 Alterações em Planos:**
- ✅ Usar `PlansManager` existente
- ✅ Adicionar métodos na API pública
- ❌ NUNCA alterar sistema original de planos

### **👥 Alterações em Alunos:**
- ✅ Criar `StudentsManager` modular
- ✅ Seguir padrão do `PlansManager`
- ✅ Integrar com fallback

### **📊 Nova Funcionalidade:**
- ✅ Criar módulo isolado
- ✅ Seguir padrão de versionamento
- ✅ Documentar API pública
- ✅ Implementar testes básicos

### **🎨 Alterações de Interface:**
- ✅ CSS em módulos isolados
- ✅ Prefixos únicos obrigatórios
- ❌ NUNCA alterar CSS global

## 📊 **MONITORAMENTO OBRIGATÓRIO**

### **Antes de Cada Commit:**
```bash
# Verificar integridade
node version-manager.js check

# Testar no browser
curl http://localhost:3000/health

# Console deve estar limpo (0 erros)
```

### **Métricas de Qualidade:**
- ✅ Zero erros JavaScript no console
- ✅ Todas as APIs retornando 200/304
- ✅ Módulos carregando sem erro
- ✅ Funcionalidades originais funcionando

## 🔧 **FERRAMENTAS DISPONÍVEIS**

### **1. Version Manager**
```bash
node version-manager.js create "Descrição"
node version-manager.js list
node version-manager.js rollback [ID]
node version-manager.js check
```

### **2. Backup System**
```javascript
const backup = new BackupSystem();
backup.createBackup('caminho/arquivo.js', 'descrição');
```

### **3. Module Loader**
```javascript
await ModuleLoader.loadModule('ModuleName', '/js/modules/module.js');
await ModuleLoader.loadModuleCSS('/css/modules/module.css');
```

## 📚 **DOCUMENTAÇÃO COMPLETA**

### **Arquitetura Detalhada:**
- 📖 `/DESENVOLVIMENTO-SEGURO.md` - Manual completo
- 🔧 `/version-manager.js` - Gerenciador de versões
- 🛡️ `/backup-system.js` - Sistema de backup

### **Exemplos Práticos:**
- 📦 `/js/modules/plans-manager.js` - Exemplo de módulo
- 🎨 `/css/modules/plans-styles.css` - Exemplo de CSS isolado

## ⚡ **COMANDOS RÁPIDOS**

```bash
# Workflow completo seguro:
node version-manager.js create "Nova feature X"
# [fazer alterações em módulos]
node version-manager.js check
# [testar no browser]
node version-manager.js create "Feature X implementada"

# Emergência:
node version-manager.js rollback [ID_ULTIMA_VERSAO_BOA]
```

## 🎯 **OBJETIVO FINAL**

**ZERO DOWNTIME** - O sistema deve sempre funcionar, mesmo durante desenvolvimento. Toda alteração deve ser reversível e não deve quebrar funcionalidades existentes.

---

## 📊 **STATUS ATUAL DO SISTEMA**

### **✅ FUNCIONANDO (NÃO ALTERE):**
- Sistema principal com fallbacks
- PlansManager modular
- ModuleLoader
- Sistema de backup/versionamento

### **📦 VERSÃO ESTÁVEL ATUAL:**
- **ID:** 1751744745983
- **Data:** 05/07/2025
- **Descrição:** "Implementação inicial da arquitetura modular - Sistema de isolamento implementado"

### **🔧 PARA IMPLEMENTAR NOVAS FUNCIONALIDADES:**
1. Siga o workflow obrigatório
2. Crie módulos isolados
3. Use versionamento
4. Mantenha fallbacks

---

**⚠️ IMPORTANTE:** Este documento deve ser seguido RIGOROSAMENTE. Qualquer desvio pode quebrar o sistema funcionando. Em caso de dúvida, sempre priorize a segurança e use os backups.

---

*📝 Última atualização: 05/07/2025*  
*🤖 Sistema modular implementado com sucesso*  
*🛡️ Proteção ativa contra regressões*

---

## 🚨 **PROBLEMAS CRÍTICOS IDENTIFICADOS E SOLUÇÕES**

### **⚡ PROBLEMA: Alunos não carregando + Menus principais não funcionam**
*Status: CRÍTICO - Identificado em 05/07/2025*

#### **🔍 POSSÍVEIS CAUSAS:**
1. **Servidor Backend não rodando** - `node dist/server-simple.js`
2. **Erro JavaScript no frontend** - Verificar console F12
3. **APIs falhando** - Testar `/api/health` e `/api/students`
4. **CORS issues** - Verificar configuração de origem
5. **Conflito de módulos** - PlansManager vs sistema original

#### **🔧 DIAGNÓSTICO RÁPIDO:**
```bash
# 1. Verificar se servidor está rodando
curl http://localhost:3000/health

# 2. Testar API de alunos
curl http://localhost:3000/api/students

# 3. Verificar logs do servidor
node dist/server-simple.js

# 4. Verificar versão estável
node version-manager.js list
```

#### **⚡ SOLUÇÕES IMEDIATAS:**
1. **Rollback para versão estável:**
   ```bash
   node version-manager.js rollback 1751744745983
   ```

2. **Restart completo do servidor:**
   ```bash
   # Parar servidor
   Ctrl+C
   
   # Rebuild
   npm run build
   
   # Restart
   node dist/server-simple.js
   ```

3. **Verificar módulos carregando:**
   - Abrir F12 no browser
   - Verificar se PlansManager está carregando
   - Procurar erros JavaScript

### **🚨 PROBLEMA CRÍTICO: Check-in por Matrícula Bloqueado**
*Status: CRÍTICO - Sistema encontra aluno mas falha na validação*

#### **🎯 CAUSA RAIZ:** 
Sistema exige `StudentSubscription` ativa para qualquer check-in

#### **🔧 SOLUÇÕES:**

**1. SOLUÇÃO IMEDIATA (5 min):**
```bash
# Criar assinatura para aluno específico
curl -X POST http://localhost:3000/api/students/KMA0001/quick-activate
```

**2. SOLUÇÃO ESTRUTURAL (Modo Básico):**
Implementar modo de check-in básico sem validação financeira
```javascript
// Em server-simple.ts - adicionar flag allowBasicMode
const basicMode = process.env.CHECKIN_BASIC_MODE === 'true';
if (basicMode) {
    // Permitir check-in sem validação de assinatura
}
```

**3. VARIÁVEL DE AMBIENTE:**
```bash
# No .env
CHECKIN_BASIC_MODE=true
```

---

## 📋 **PADRÕES OBRIGATÓRIOS DE INTERFACE**

### **🎯 REGRA ANTI-MODAL:**
**JAMAIS** criar modals para edições. SEMPRE usar telas full-screen.

#### **✅ PADRÃO CORRETO:**
1. **Duplo Clique:** Qualquer linha da tabela → Tela completa de edição
2. **Tela Full-Screen:** Substituir modal por página completa
3. **Navegação:** Botão "Voltar" para retornar à listagem
4. **Consistência:** Seguir padrão das telas de Alunos e Planos

### **🚫 PROIBIÇÃO ABSOLUTA DE DADOS HARDCODED**
**JAMAIS** incluir dados de teste, simulados ou hardcoded.

#### **🎯 REGRAS OBRIGATÓRIAS:**
1. **APIs Vazias:** Retornar arrays vazios `{success: true, data: []}`
2. **Sem Mock Data:** Nenhum dado fictício no JavaScript
3. **Sem Fallbacks:** Não criar dados de exemplo quando API falha
4. **Interface Limpa:** Sistema deve funcionar com dados vazios
5. **Estados Vazios:** Mensagens apropriadas para "nenhum dado encontrado"

#### **✅ PADRÃO CORRETO:**
```javascript
// CORRETO
const response = await fetch('/api/billing-plans');
const data = await response.json();
if (data.success && data.data.length > 0) {
    // Processar dados reais
} else {
    // Mostrar estado vazio
    showEmptyState('Nenhum plano encontrado');
}

// PROIBIDO
const mockData = [{ id: 1, name: 'Plano Demo' }]; // ❌ NUNCA FAZER
```

---

## 📊 **STATUS ATUAL DETALHADO DO SISTEMA**

### **✅ MÓDULOS 100% FUNCIONAIS:**
- **PlansManager v1.0.0** - Gestão de planos isolada ✅
- **ModuleLoader v1.0.0** - Carregamento seguro ✅
- **Sistema Principal** - Com fallbacks funcionando ✅
- **Version Manager** - Controle de versões ✅
- **Backup System** - Sistema de backup ✅
- **Cadastro de Alunos** - CRUD completo ✅
- **Cursos e Turmas** - Gestão acadêmica ✅
- **Controle de Frequência** - Múltiplos métodos ✅
- **Sistema de Avaliações** - Scoring e feedback ✅
- **Responsáveis Financeiros** - CRUD completo ✅
- **Planos de Pagamento** - Gestão financeira ✅

### **🟡 MÓDULOS PARCIAIS:**
- **Check-in por Matrícula** - 90% (bloqueado por validação)
- **Desafios Semanais** - 70% (backend pronto, frontend pendente)
- **Sistema de Progresso** - 85% (funcional, precisa gamificação)

### **❌ MÓDULOS PENDENTES:**
- **Autenticação JWT** - 0%
- **Relatórios Avançados** - 0%
- **Testes Automatizados** - 25%

---

## 🔧 **PROCEDIMENTOS DE EMERGÊNCIA EXPANDIDOS**

### **🚨 Se Sistema Não Carrega:**
```bash
# 1. Verificar processo
ps aux | grep node

# 2. Matar processos antigos
pkill -f "node.*server"

# 3. Verificar porta
netstat -tulpn | grep :3000

# 4. Rebuild completo
npm run build

# 5. Restart servidor
node dist/server-simple.js
```

### **🚨 Se Menus Não Funcionam:**
1. **Abrir F12 → Console**
2. **Procurar erros JavaScript**
3. **Verificar se módulos carregaram:**
   ```javascript
   console.log(window.ModuleLoader);
   console.log(window.PlansManager);
   ```
4. **Se houver erro, fazer rollback:**
   ```bash
   node version-manager.js rollback 1751744745983
   ```

### **🚨 Se APIs Falham:**
1. **Testar health check:**
   ```bash
   curl http://localhost:3000/health
   ```
2. **Verificar logs do servidor**
3. **Verificar conexão com banco:**
   ```bash
   # No arquivo .env verificar DATABASE_URL
   ```
4. **Restart servidor se necessário**

---

## 📚 **FUNCIONALIDADES AVANÇADAS IMPLEMENTADAS**

### **📱 Múltiplos Métodos de Check-in:**
1. **Manual/Checkbox** - ✅ 100% funcional
2. **QR Code** - ✅ Backend 100%, Frontend 0%
3. **Geolocalização** - ✅ Backend 80%, Frontend 0%
4. **Por Matrícula** - ✅ Backend 90%, validação bloqueada
5. **Por Nome** - ✅ Backend 70%, Frontend 0%
6. **Reconhecimento Facial** - ⏳ Backend 20%
7. **NFC Tags** - ⏳ Backend 20%

### **💰 Sistema Financeiro Completo:**
- **Responsáveis Financeiros** - CRUD completo
- **Planos de Pagamento** - Por categoria e curso
- **Matrícula Inteligente** - Associação automática
- **Validação de Pagamentos** - Sistema robusto

### **📊 Gestão Acadêmica Avançada:**
- **42 Técnicas** catalogadas
- **48 Planos de Aula** estruturados
- **Sistema de Avaliações** com scoring
- **Progresso Individual** por aluno
- **Estatísticas em Tempo Real**

---

## 🎯 **METODOLOGIA DE DESENVOLVIMENTO ATUALIZADA**

### **🔥 REGRA FUNDAMENTAL:**
> "POC Funcional Primeiro, Depois Melhorar"

### **✅ ABORDAGEM CORRETA:**
1. **POC Mínimo** - Versão básica que FUNCIONA
2. **Teste no Browser** - Validar funcionamento real
3. **Console Limpo** - Zero erros JavaScript
4. **Backup Funcional** - Sempre manter versão que funciona
5. **Iteração Incremental** - Melhorar após validação

### **❌ ERROS A EVITAR:**
- ❌ Complexidade prematura
- ❌ Dependências externas sem teste
- ❌ Debugging excessivo de libraries
- ❌ Assumir que código funciona sem testar

### **📝 CHECKLIST OBRIGATÓRIO:**
- [ ] POC funcional criado
- [ ] Testado no browser real
- [ ] Console sem erros JavaScript
- [ ] Navegação funcionando
- [ ] Backup da versão anterior
- [ ] Documentação atualizada