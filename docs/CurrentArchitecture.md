# 🏗️ Current Architecture - Sistema de Gestão Academia

## 📋 **VISÃO GERAL ATUAL**

Sistema modular completo para gestão de academias de artes marciais com arquitetura SPA (Single Page Application) baseada em navegação por abas e views full-screen.

### **Características Principais**
- **Tipo**: SPA Modular com Backend API RESTful
- **Frontend**: Vanilla JavaScript + CSS Modular
- **Backend**: Node.js/TypeScript com Fastify + PostgreSQL
- **Arquitetura**: API-first, módulos isolados, full-screen UI
- **Estado**: Descoberta através de análise do sistema existente em `dashboard-optimized.js`

---

## 🏢 **ESTRUTURA DE ARQUIVOS ATUAL**

### **Frontend Principal**
```
public/
├── index.html                          # Dashboard principal com abas
├── js/
│   ├── modules/
│   │   └── dashboard-optimized.js      # Sistema de navegação principal
│   ├── config/
│   │   └── martial-arts-config.js      # Configuração de modalidades
│   ├── knowledge-base.js               # Sistema de graduações/faixas
│   └── core/ (utilitários)
├── views/                              # Views full-screen para CRUD
│   ├── martial-arts-config.html       # Configuração de modalidades
│   └── (outras views modulares)
└── css/
    ├── base/
    │   └── module-system.css           # Sistema CSS base
    └── modules/ (CSS específico)
```

### **Backend**
```
src/
├── server.ts                           # Servidor principal TypeScript/Fastify
└── servers/
    └── server-complete.js              # Servidor fallback JavaScript
```

### **Documentação Existente**
```
docs/
├── SYSTEM_ARCHITECTURE.md             # Arquitetura completa documentada
├── MODULAR_ARCHITECTURE_DOCUMENTATION.md  # Documentação modular
├── PLANS_MODULE_DOCUMENTATION.md      # Documentação específica de planos
└── Guidelines.MD                       # Workflow de desenvolvimento AI
```

---

## 🧩 **SISTEMA DE NAVEGAÇÃO ATUAL**

### **Função Principal: `navigateToModule`**
Localizada em: `public/js/modules/dashboard-optimized.js`

**Módulos Roteados Atualmente:**
```javascript
switch(module) {
    case 'students':      -> '/views/students.html'
    case 'plans':         -> '/views/plans.html'  
    case 'courses':       -> '/views/courses.html'
    case 'knowledge-base': -> '/views/knowledge-base.html'
    case 'classes':       -> '/views/classes.html'
    case 'evaluations':   -> '/views/evaluations.html'
    case 'martial-arts-config': -> '/views/martial-arts-config.html'
    // + outros módulos descobertos
}
```

### **Padrão de Integração**
- **Carregamento de View**: Fetch HTML + injeção no DOM
- **Carregamento de Script**: Dynamic import de módulos JS
- **Isolamento**: Cada módulo possui CSS e JS isolados
- **Estado**: Gerenciado por módulo, sem estado global persistente

---

## 🎨 **ARQUITETURA DE MODALIDADES**

### **Sistema Multi-Modalidades Implementado**
Configuração centralizada em: `public/js/config/martial-arts-config.js`

**Modalidades Suportadas:**
- Karatê, Judô, Jiu-Jitsu, Muay Thai, Boxe
- Taekwondo, Krav Maga, Capoeira, Aikido, Kung Fu
- MMA e outras modalidades customizáveis

**Características do Sistema:**
- **Graduações Específicas**: Sistema de faixas/cordas por modalidade
- **Cores Customizáveis**: Tema visual por modalidade
- **Configuração Flexível**: Academias podem personalizar
- **Persistência Local**: LocalStorage para configurações

---

## 🔄 **FLUXO DE DADOS ATUAL**

### **Frontend → Backend**
```
User Interaction → Module → API Client → Server Route → PostgreSQL → Response
```

### **Gerenciamento de Estado**
- **Módulo-Específico**: Cada módulo gerencia seu próprio estado
- **API-Driven**: Dados sempre via RESTful APIs
- **DOM-Based**: Manipulação direta do DOM sem frameworks
- **Event-Driven**: Comunicação entre módulos via eventos

---

## 🛡️ **MÓDULOS PROTEGIDOS**

### **Core Modules (Não Modificar)**
- `module-loader.js` - Sistema de carregamento modular
- `dashboard-optimized.js` - Sistema de navegação principal
- `PlansManager` - Gestão de planos (sistema crítico)

### **Módulos Editáveis**
- Módulos específicos de feature (students, courses, etc.)
- Views HTML individuais
- CSS modular específico

---

## 📊 **DADOS E PERSISTÊNCIA**

### **Database**: PostgreSQL
- **Users**: Dados pessoais de usuários
- **Students**: Dados acadêmicos (FK para Users)
- **Plans**: Planos de assinatura
- **Organizations**: Multi-tenancy

### **Configurações Locais**
- **LocalStorage**: Configurações de modalidades
- **Session**: Estado temporário de navegação

---

## 🎯 **PADRÕES ARQUITETURAIS IDENTIFICADOS**

### **Princípios Seguidos**
1. **Isolamento Modular**: Módulos independentes
2. **API-First**: Todos os dados via APIs
3. **Full-Screen UI**: Sem modals ou popups
4. **CSS Isolado**: Prefixos de classe únicos
5. **Progressive Enhancement**: Funcionalidade base + melhorias

### **Convenções de Naming**
- **CSS Classes**: `.module-isolated-*`
- **Files**: `{feature}-{type}.{ext}` (ex: `students-editor.js`)
- **API Routes**: `/api/{resource}` pattern

---

## ⚙️ **DEPENDÊNCIAS E INTEGRAÇÕES**

### **Dependencies Críticas**
- **Sistema Toast**: Notificações globais
- **Cliente API**: Comunicação HTTP centralizada
- **Sistema de Eventos**: Comunicação inter-módulos
- **Error Handlers**: Gestão consistente de erros

### **Integrações Externas**
- **Gateway de Pagamento**: Asaas (para planos)
- **Base Knowledge**: Sistema de faixas/graduações

---

## 🔍 **ESTADO ATUAL DO SISTEMA**

### **Módulos Funcionais** ✅
- **Students**: Sistema completo de gestão de alunos
- **Plans**: Gestão de planos com integração de pagamento
- **Martial Arts Config**: Sistema de configuração de modalidades
- **Knowledge Base**: Sistema de graduações/faixas

### **Módulos em Desenvolvimento** 🔄
- **Courses**: Reportado problema de carregamento
- **Classes**: Estrutura base presente
- **Techniques**: Planejado (ver PROJECT.md)
- **Attendance**: Planejado (ver PROJECT.md)

### **Arquivos de Configuração** ⚙️
- **docker-compose.yml**: Configuração de containerização
- **package.json**: Dependencies Node.js
- **tsconfig.json**: Configuração TypeScript
- **nginx.conf**: Configuração do servidor web

---

## 📈 **MÉTRICAS DO SISTEMA**

### **Complexidade Atual**
- **Módulos Core**: 4 (dashboard, students, plans, martial-arts)
- **Views HTML**: 10+ (full-screen interfaces)
- **API Endpoints**: 15+ (RESTful)
- **Database Tables**: 5+ principais
- **Documentação**: 90+ arquivos MD

### **Performance**
- **Tipo**: SPA com carregamento sob demanda
- **Otimizações**: CSS/JS isolados por módulo
- **Caching**: Sem estratégia específica identificada

---

## 🚨 **PROBLEMAS CONHECIDOS**

### **Issues Reportados**
1. **Dashboard Changes Lost**: Usuário reportou perda de alterações da manhã
2. **Courses Module**: Problema de carregamento reportado
3. **Missing Architecture Files**: CurrentArchitecture.md não existia (resolvido)

### **Debt Técnico**
- **Version Control**: Sem sistema de backup automático
- **Testing**: Estrutura de testes presente mas não extensiva
- **Documentation**: Algumas lacunas na documentação de APIs

---

## 🎯 **ANÁLISE DE CONFORMIDADE**

### **Guidelines.MD Compliance**
- ✅ **Arquitetura Modular**: Implementada
- ✅ **API-First**: Seguido consistentemente
- ✅ **Full-Screen UI**: Padrão adotado
- ❌ **CurrentArchitecture.md**: Estava ausente (agora criado)
- ❌ **ProposedArchitecture.md**: Ainda ausente

### **Próximos Passos Requeridos**
1. **Recovery Analysis**: Investigar alterações perdidas do dashboard
2. **ProposedArchitecture.md**: Criar conforme Guidelines.MD
3. **Courses Module Fix**: Resolver problema de carregamento
4. **Version Management**: Implementar sistema de backup

---

## 📝 **OBSERVAÇÕES FINAIS**

### **Pontos Fortes da Arquitetura**
- Sistema modular bem estruturado
- Isolamento efetivo entre módulos
- Configuração flexível para múltiplas modalidades
- Documentação extensa (quando presente)

### **Áreas de Melhoria**
- Sistema de versionamento/backup
- Testes automatizados mais abrangentes
- Documentação de APIs mais detalhada
- Processo de recovery para mudanças perdidas

**Status**: ✅ **Current Architecture documentada e analisada**  
**Next Step**: 🔄 **Criar ProposedArchitecture.md conforme Guidelines.MD**
