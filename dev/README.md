# Development Guides — dev/

This folder contains the modernized project guidelines and supporting documents. The primary guide is `GUIDELINES2.md` which replaces older, monolithic docs.

Start here
- `GUIDELINES2.md` — primary, opinionated guidelines for modules, UI, API patterns, and AcademyApp integration.
- `../AGENTS.md` — guia operacional (SOPs, Quality Gates, DoR/DoD, contratos de ferramentas).
- `.github/copilot-instructions.md` — normas-mestras de integração e UI premium.

Quick checklist for adding a module
1. Create files under `public/js/modules/<module>/` using the ModuleLoader pattern.
2. Register your module in `AcademyApp.loadModules()` (in `public/js/core/app.js`).
3. Use the centralized API client (`public/js/shared/api-client.js`) and `fetchWithStates` for network calls.
4. Isolate CSS under `public/css/modules/` using `.module-isolated-<module>-*` prefixes.
5. Expose the module globally: `window.<moduleName> = myModule;` and dispatch `window.app.dispatchEvent('module:loaded', { name: '<moduleName>' })`.
6. Add loading/empty/error states and follow premium UI classes if applicable.

Where to find more
- Design tokens: `dev/DESIGN_SYSTEM.md`
- AI/Workflow: `dev/WORKFLOW.md`
- Module examples: `public/js/modules/students/`

Table of contents
- Guidelines (this doc): `GUIDELINES2.md`
- CSS: `DESIGN_SYSTEM.md`, `CSS_NAMING.md`
- AI: `WORKFLOW.md`, `FALLBACK_RULES.md`
- Docs: `DOCUMENTATION.md`, `EXAMPLES.md`

If you find an area that should be added to the guide, open a PR and reference this README.
# Estrutura Modular Implementada ✅

## 📁 Nova Organização da Documentação

A documentação do projeto foi modernizada e dividida em módulos especializados para melhor manutenção e uso por IA agents.

### Arquivos Criados:

#### 1. `dev/GUIDELINES2.md` - Visão Geral e Coordenação
- **Propósito**: Documento índice que conecta todos os módulos
- **Conteúdo**: Navegação entre documentos, visão arquitetural geral
- **Uso**: Ponto de entrada para desenvolvimento

#### 2. `dev/WORKFLOW.md` - Processo de Desenvolvimento AI-Driven  
- **Propósito**: Fluxo completo para AI agents e desenvolvedores
- **Conteúdo**: Steps de análise → planejamento → implementação → testes
- **Uso**: Guia passo-a-passo para novas features

#### 3. `dev/DESIGN_SYSTEM.md` - Tokens e Componentes CSS
- **Propósito**: Sistema de design unificado com tokens CSS
- **Conteúdo**: Cores, espaçamentos, componentes premium, breakpoints
- **Uso**: Referência para interfaces consistentes

#### 4. `dev/CSS_NAMING.md` - Convenções de CSS com BEM + Isolamento
- **Propósito**: Padrões obrigatórios para naming e isolamento
- **Conteúdo**: Templates CSS, BEM patterns, prefixos de isolamento
- **Uso**: Garantir CSS sustentável e sem conflitos

#### 5. `dev/DOCUMENTATION.md` - Padrões de Documentação Viva
- **Propósito**: Como manter documentação sempre atualizada
- **Conteúdo**: JSDoc patterns, ADR templates, README estrutura
- **Uso**: Documentação que se auto-atualiza

#### 6. `dev/FALLBACK_RULES.md` - Estratégias de Auto-Recuperação para IA
- **Propósito**: IA que se corrige automaticamente
- **Conteúdo**: Fallback APIs, auto-scaffolding, estratégias de emergência
- **Uso**: Resiliência em desenvolvimento automatizado

#### 7. `dev/EXAMPLES.md` - Templates Copy-Paste Ready
- **Propósito**: Código pronto para usar sem modificações
- **Conteúdo**: Módulos completos, CSS templates, controllers backend
- **Uso**: Acelerar desenvolvimento com templates testados

## 🔄 Migração do Guidelines.MD

### Benefícios da Nova Estrutura:
- ✅ **Manutenção**: Cada arquivo tem responsabilidade específica
- ✅ **AI-Friendly**: Documentos focados facilitam prompts direcionados
- ✅ **Versionamento**: Mudanças isoladas, menos conflitos
- ✅ **Navegação**: Estrutura clara para encontrar informações
- ✅ **Escalabilidade**: Fácil adicionar novos módulos de documentação

### Próximos Passos:
1. **Integrar nos arquivos anexos**: Atualizar referências ao Guidelines.MD
2. **Atualizar .github/copilot-instructions.md**: Referenciar nova estrutura
3. **Modificar .github/prompts/prompt.md**: Usar módulos específicos
4. **Criar scripts de validação**: Verificar consistência entre módulos

## 📋 Status da Implementação:

| Arquivo | Status | Descrição |
|---------|--------|-----------|
| GUIDELINES2.md | ✅ Completo | Índice e visão geral |
| WORKFLOW.md | ✅ Completo | Processo AI-driven |
| DESIGN_SYSTEM.md | ✅ Completo | Tokens e componentes |
| CSS_NAMING.md | ✅ Completo | BEM + isolamento |
| DOCUMENTATION.md | ✅ Completo | Padrões de docs |
| FALLBACK_RULES.md | ✅ Completo | Auto-recuperação IA |
| EXAMPLES.md | ✅ Completo | Templates prontos |

## 🎯 Uso Recomendado:

### Para AI Agents:
- **Planejamento**: Consultar `WORKFLOW.md` primeiro
- **Design**: Usar tokens de `DESIGN_SYSTEM.md`
- **CSS**: Seguir padrões de `CSS_NAMING.md`
- **Templates**: Copiar de `EXAMPLES.md`
- **Problemas**: Aplicar `FALLBACK_RULES.md`

### Para Desenvolvedores:
- **Início**: Ler `GUIDELINES2.md` para visão geral
- **Feature Nova**: Seguir fluxo do `WORKFLOW.md`
- **Interface**: Consultar `DESIGN_SYSTEM.md` e `CSS_NAMING.md`
- **Documentar**: Usar padrões de `DOCUMENTATION.md`
- **Acelerar**: Templates de `EXAMPLES.md`

## 🔧 Integração com Ferramentas:

### VS Code Toolsets:
Os 6 toolsets criados anteriormente agora referenciam estes módulos específicos:
- `academiaModuleDev` → `WORKFLOW.md` + `EXAMPLES.md`
- `academiaPremiumMigration` → `DESIGN_SYSTEM.md` + `CSS_NAMING.md`
- `academiaAPITesting` → `FALLBACK_RULES.md`
- `academiaDocsUpdate` → `DOCUMENTATION.md`
- `academiaTroubleshooting` → `FALLBACK_RULES.md` + `WORKFLOW.md`
- `academiaFullAnalysis` → `GUIDELINES2.md` (ponto de entrada)

### Prompts AI:
Cada módulo pode ser referenciado diretamente em prompts:
```
Consulte dev/DESIGN_SYSTEM.md para tokens CSS corretos
Siga dev/WORKFLOW.md para implementar nova feature
Use templates de dev/EXAMPLES.md como base
```

---

**Próxima Ação**: Atualizar arquivos anexos para integrar com essa nova estrutura modular.
