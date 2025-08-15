# Estrutura do Módulo de Estudantes

## Caminho da pasta principal
```
h:\projetos\academia\public\js\modules\student\
```

## Estrutura de Pastas
```
student/
├── index.js                # Listagem e gerenciamento de estudantes
└── student-editor/
    ├── main.js             # Controlador principal do editor de estudante
    ├── profile-tab.js      # Aba de perfil do editor
    └── financial-tab.js    # Aba financeira do editor
    └── AGENTS.MD           # (Este arquivo de documentação)
```

## O que cada arquivo faz

- **index.js**
  - Caminho: `public/js/modules/student/index.js`
  - Função: Responsável pela listagem, busca, filtros e navegação para o editor de estudantes.

- **student-editor/main.js**
  - Caminho: `public/js/modules/student/student-editor/main.js`
  - Função: Controlador principal do editor de estudante, gerencia abas, inicialização e integração entre componentes.

- **student-editor/profile-tab.js**
  - Caminho: `public/js/modules/student/student-editor/profile-tab.js`
  - Função: Gerencia a aba de perfil do editor de estudante (dados pessoais, validação, coleta de dados).

- **student-editor/financial-tab.js**
  - Caminho: `public/js/modules/student/student-editor/financial-tab.js`
  - Função: Gerencia a aba financeira do editor de estudante (planos, pagamentos, histórico financeiro).

- **student-editor/AGENTS.MD**
  - Caminho: `public/js/modules/student/student-editor/AGENTS.MD`
  - Função: Documentação da estrutura e dos arquivos do módulo de estudantes.

## Observações
- Todos os imports e caminhos nos scripts e HTML devem ser atualizados para refletir essa nova estrutura.
- O módulo agora está mais organizado, facilitando manutenção e escalabilidade.
