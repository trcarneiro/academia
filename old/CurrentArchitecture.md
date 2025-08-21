# Current Architecture - Academia System

## Visão Geral
Sistema de gestão para academias com módulos integrados via SPA. Arquitetura baseada em:
- Frontend: HTML/CSS/JavaScript com Single Page Application
- Backend: Node.js + Express + Prisma ORM
- Banco de Dados: PostgreSQL

## Estrutura de Diretórios
```
public/
├── css/
│   ├── dashboard/           # Estilos do dashboard principal
│   └── modules/             # Estilos específicos por módulo
│       ├── activities/
│       ├── courses/         # Módulo de cursos (novo padrão)
│       ├── plans/
│       ├── students/
│       └── techniques/
│
├── js/
│   ├── dashboard/           # Navegação SPA e controle UI
│   └── modules/             # Lógica de módulos
│       ├── activities/
│       ├── courses/         # Módulo de cursos (novo padrão)
│       ├── plans/
│       ├── students/
│       └── techniques/
│
└── views/
    ├── modules/             # Templates HTML por módulo
    │   ├── activities/
    │   ├── courses/         # Módulo de cursos (novo padrão)
    │   ├── plans/
    │   ├── students/
    │   └── techniques/
    └── dashboard.html       # Ponto de entrada
```

## Padrões de Implementação
1. **Módulos Frontend**:
   - HTML: `public/views/modules/[nome]`
   - CSS: `public/css/modules/[nome]`
   - JS: `public/js/modules/[nome]`
   
2. **Navegação**:
   - SPA com router customizado (`spa-router.js`)
   - Carregamento dinâmico de módulos

3. **Componentização**:
   - Estilos isolados com prefixos `.module-isolated-*`
   - UI em tela cheia sem modais

## Módulos Principais
1. **Dashboard** (core)
2. Alunos
3. Financeiro
4. Atividades
5. Planos
6. Cursos
7. Técnicas

## Dependências Críticas
- API Backend: `/api/[recurso]`
- Module Loader: Sistema de carregamento dinâmico
- Design System: Componentes UI consistentes