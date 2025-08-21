# Academia Krav Maga v2.0 - Guidelines Modernizadas

## 🎯 Visão Geral

Esta documentação substitui o `Guidelines.MD` monolítico por uma estrutura modular, facilitando manutenção e consulta por desenvolvedores e AI agents.

## 🏗️ Princípios Fundamentais

- **API-First**: Sempre consumir APIs RESTful, nunca hardcode
- **Modularidade**: Isolamento completo com `.module-isolated-*`
- **Design System**: Tokens CSS unificados (#667eea, #764ba2)
- **Responsividade**: 768px/1024px/1440px breakpoints
- **Acessibilidade**: WCAG 2.1, 44px touch targets
- **Premium UI**: Stats cards enhanced, headers premium, gradientes

## 📚 Documentação Modular

| Arquivo | Propósito | Para quem |
|---------|-----------|-----------|
| [WORKFLOW.md](WORKFLOW.md) | Processo AI-driven development | AI Agents + Devs |
| [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) | Tokens CSS e paleta unificada | Frontend Devs |
| [CSS_NAMING.md](CSS_NAMING.md) | Convenções BEM + isolamento | CSS Devs |
| [DOCUMENTATION.md](DOCUMENTATION.md) | Como manter docs vivas | Equipe completa |
| [FALLBACK_RULES.md](FALLBACK_RULES.md) | Estratégias de recuperação | AI Agents |
| [EXAMPLES.md](EXAMPLES.md) | Snippets práticos | Todos |

## ⚡ Quick Start

1. **AI Agents**: Comece com [WORKFLOW.md](WORKFLOW.md) + [FALLBACK_RULES.md](FALLBACK_RULES.md)
2. **Frontend Devs**: [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) + [CSS_NAMING.md](CSS_NAMING.md)
3. **Novos membros**: [EXAMPLES.md](EXAMPLES.md) + [DOCUMENTATION.md](DOCUMENTATION.md)

## 🔄 Migração do Guidelines.MD

- ✅ Conteúdo dividido em módulos especializados
- ✅ Exemplos práticos em cada seção
- ✅ Foco em AI-driven development
- ✅ Fallbacks para cenários reais
- ✅ Premium templates com design system unificado

## 🎯 Arquitetura Core

### AcademyApp Integration
Todos os módulos devem se integrar com o sistema central:
- Registro em `AcademyApp.loadModules()` array
- Exposição global via `window.moduleName`
- Uso de eventos para coordenação
- Error handling via `window.app.handleError()`

### Module Structure
```
/public/js/modules/[module]/
├── index.js           # Entry point
├── controllers/       # MVC controllers
├── services/         # Business logic
├── views/            # HTML templates
└── components/       # Reusable UI components
```

### Toolsets Integration
- `academiaModuleDev`: Desenvolvimento de novos módulos
- `academiaPremiumMigration`: MVP → Premium upgrades
- `academiaAPITesting`: Teste de endpoints
- `academiaGuidelinesCompliance`: Validação de conformidade

## 🚀 Próximos Passos

1. Leia o arquivo específico para sua tarefa
2. Use os exemplos como base
3. Siga os checklists de validação
4. Integre com os toolsets apropriados

---

**Versão**: 2.0 | **Data**: 21/08/2025 | **Status**: Ativo
