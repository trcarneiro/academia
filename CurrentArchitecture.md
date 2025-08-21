# Current Architecture v1.0
**Last Updated**: 2025-08-17  
**Status**: ACTIVE  

## Visão Geral
Sistema de gestão para academias com módulos independentes integrados via SPA.

## Componentes Principais
### Frontend
- **Tecnologia**: HTML5, CSS3, JavaScript (ES6+)
- **Estrutura**:
  - Dashboard SPA com roteamento dinâmico
  - Módulos isolados: Alunos, Planos, Técnicas
- **Diretórios**:
  - `public/`: Arquivos estáticos
  - `public/css/dashboard/`: Estilos do core
  - `public/css/modules/`: Estilos por módulo
  - `public/js/dashboard/`: Lógica do SPA
  - `public/js/modules/`: Lógica específica por módulo

### Backend
- **Tecnologia**: Node.js, Express, Prisma
- **Endpoints**:
  - `GET /api/students`: Listagem de alunos
  - `GET /api/billing-plans`: Listagem de planos
  - `GET /api/techniques`: Listagem de técnicas

## Princípios de Design
1. **Modularidade**: 
   - Cada módulo com CSS prefixado (ex: `.students-isolated-table`)
   - Acoplamento mínimo entre módulos
2. **API-First**:
   - Zero dados hardcoded
   - Estados: loading/empty/error
3. **Navegação**:
   - Páginas dedicadas para cada operação CRUD
   - Menu lateral persistente

## Dependências Críticas
- `spa-router.js`: Sistema de navegação
- `ui-controller.js`: Gestão de UI responsiva