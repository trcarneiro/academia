# 🏗️ Sistema de Gestão Academia - Arquitetura Completa

## 📋 **Visão Geral do Sistema**

Este é um sistema completo de gestão para academias de Krav Maga com arquitetura modular, API-first e foco em segurança e escalabilidade.

### **Princípios Arquiteturais**
- **API-First**: Todos os dados fluem através de APIs RESTful
- **Modular**: Componentes isolados com responsabilidades específicas
- **Full-Screen UI**: Sem modals - uma ação = uma tela completa
- **Isolamento**: Módulos não afetam uns aos outros

## 🏢 **Estrutura Principal**

### **Pontos de Entrada**
- **Dashboard Principal**: `/public/index.html` - Dashboard integrado com abas
- **Servidor TypeScript**: `/src/server.ts` - Servidor Fastify principal
- **Servidor JavaScript**: `/servers/server-complete.js` - Fallback
- **Sistema Check-in**: `/public/checkpoint.html` - Sistema independente

### **Carregamento de Módulos**
```
ModuleLoader (/public/js/module-loader.js) - **PROTEGIDO**
    ↓
Módulos Isolados (/public/js/modules/)
    ↓
Utilitários Core (/public/js/core/)
```

## 🧩 **Ecossistema de Módulos**

### **Módulos Isolados** (`/public/js/modules/`)
| Módulo | Arquivo | Status | Função |
|--------|---------|--------|---------|
| **PlansManager** | `plans-manager.js` | **PROTEGIDO** | Gestão de planos de cobrança |
| **Students** | `students.js` | Ativo | Gestão completa de alunos |
| **Classes** | `classes.js` | Ativo | Agendamento e gestão de aulas |
| **Plans** | `plans.js` | Ativo | Planos educacionais |

### **Utilitários Core** (`/public/js/core/`)
- **api-client.js**: Cliente API centralizado com retry
- **navigation.js**: Sistema de roteamento
- **app.js**: Inicialização da aplicação
- **utils.js**: Funções compartilhadas

## 🔄 **Fluxo de Dados**

### **Frontend → Backend**
```
Interação do Usuário → Módulo → Cliente API → Rota do Servidor → Database → Resposta
```

### **Gerenciamento de Estado**
- **Estado Local**: Nível do módulo
- **Estado da API**: Server-side com Prisma ORM
- **Estado da UI**: Baseado no DOM com event listeners
- **Estado de Sessão**: Sem estado persistente no cliente

## 🎨 **Arquitetura Frontend**

### **Sistema de Navegação**
- **Dashboard por Abas**: Navegação single-page em `index.html`
- **Views Full-Screen**: Páginas dedicadas em `/public/views/` para CRUD
- **Navegação Breadcrumb**: Padrão de botão "voltar" consistente

### **Padrões de UI**
- **Somente Full-Screen**: Sem modals ou popups (restrição arquitetural)
- **Isolamento de Componentes**: Módulos CSS com prefixos de classe
- **Design Responsivo**: Mobile-first com progressive enhancement

### **Arquitetura CSS**
```
/public/css/
├── core/              # Estilos globais do sistema
│   ├── variables.css  # Propriedades CSS customizadas
│   ├── reset.css      # Normalização de browsers
│   └── layout.css     # Utilitários de layout
├── components/        # Componentes UI reutilizáveis
│   └── toast.css      # Sistema de notificações
└── modules/           # Estilos isolados por módulo
    ├── students.css
    ├── classes.css
    └── plans-styles.css
```

## ⚙️ **Arquitetura Backend**

### **Implementações do Servidor**
1. **Servidor TypeScript** (`/src/server.ts`):
   - Framework Fastify com plugins
   - Rotas API type-safe
   - Stack de middleware abrangente
   - Documentação Swagger

2. **Servidor JavaScript** (`/servers/server-complete.js`):
   - Fallback Express.js
   - Estrutura de rotas simplificada
   - Compatibilidade legacy

### **Padrões de Rota API**
- **Design RESTful**: Métodos HTTP padrão e códigos de status
- **Formato de Resposta Consistente**: `{ success: boolean, data: any, message?: string }`
- **Tratamento de Erros**: Middleware de erro centralizado
- **Validação**: Validação de schema Zod para rotas TypeScript

### **Integração com Database**
- **Prisma ORM**: Operações de database type-safe
- **PostgreSQL**: Database principal com features avançadas
- **Sistema de Migração**: Mudanças de schema com controle de versão
- **Seeding**: Geração de dados de teste realistas

## 🔗 **Dependências Críticas**

### **Dependências Inter-Módulos**
```javascript
ModuleLoader → Módulos Core → Módulos de Feature
     ↓              ↓              ↓
Cliente API → Navegação → Lógica de Negócio
```

### **Utilitários Compartilhados**
- **Sistema Toast**: Gestão global de notificações
- **Cliente API**: Comunicação HTTP centralizada
- **Sistema de Eventos**: Comunicação módulo-a-módulo
- **Handlers de Erro**: Gestão consistente de erros

### **Integrações Externas**
- **Gateway Asaas**: Processamento de pagamentos brasileiro
- **Serviços de IA**: Suporte a múltiplos providers (Claude, OpenAI, Gemini)
- **Armazenamento de Arquivos**: Gestão de imagens e documentos
- **Serviços de Email**: Notificações automatizadas

## 🛡️ **Diretrizes de Modificação Segura**

### **Componentes Protegidos** (NÃO MODIFICAR)
- `ModuleLoader` - Crítico para estabilidade do sistema
- `PlansManager` - Lógica de cobrança crítica para negócio
- Relacionamentos core do schema do database
- Middleware de autenticação

### **Pontos de Extensão Seguros**
1. **Novos Módulos**: Adicionar em `/public/js/modules/` com CSS isolado
2. **Rotas API**: Adicionar novas rotas em `/src/routes/` seguindo padrões existentes
3. **Componentes UI**: Criar em `/public/css/components/` com prefixos adequados
4. **Extensões de Database**: Adicionar novas tabelas, evitar modificar relacionamentos existentes

### **Workflow de Desenvolvimento**
1. **Fase de Análise**: Avaliação de impacto e planejamento arquitetural
2. **Controle de Versão**: Usar `version-manager.js` para backups seguros
3. **Desenvolvimento Isolado**: Criar módulos em diretórios designados
4. **API-First**: Definir endpoints antes de implementar frontend
5. **Testes**: Verificar integração sem quebrar funcionalidade existente

### **Estratégia de Rollback**
- **Version Manager**: Sistema automatizado de backup e rollback
- **Isolamento de Módulos**: Contenção independente de falhas de módulo
- **Migrações de Database**: Mudanças de schema reversíveis
- **Feature Flags**: Capacidades de rollout gradual

Esta arquitetura garante máxima estabilidade enquanto permite expansão segura das capacidades do sistema. Todas as modificações devem seguir o padrão de módulo isolado e os princípios de design API-first descritos em `CLAUDE.md` e `agents.md`.