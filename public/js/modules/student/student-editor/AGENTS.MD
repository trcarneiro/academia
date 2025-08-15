# Documentação do Submódulo Student Editor

## Caminho da pasta
```
h:\projetos\academia\public\js\modules\student\student-editor\
```

## Arquivos
- **main.js**: Controlador principal do editor de estudante. Gerencia inicialização, navegação entre abas, carregamento/salvamento de dados, integração com abas de perfil e financeira, e exibe notificações de sucesso/erro.
- **profile-tab.js**: Aba de perfil do estudante. Responsável por coletar, exibir e validar dados pessoais do estudante (nome, email, telefone, etc). Também faz a transformação dos dados para o backend.
- **financial-tab.js**: Aba financeira do estudante. Gerencia informações financeiras, planos, pagamentos e exibe o histórico financeiro do estudante.

## Observação
- Todos os imports internos devem usar caminhos relativos a partir desta pasta.
- Para usar o editor, importe `main.js` como módulo principal.
