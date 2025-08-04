# Index.html Architecture - CLAUDE.md Guidelines

## 🎯 Princípio Fundamental
**O `index.html` deve conter APENAS o básico, jamais código de lógica**

## ✅ Estrutura Correta Atual

### 📄 `/public/index.html` (25 linhas)
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>🥋 Krav Maga Academy - Dashboard</title>
    
    <!-- Core CSS -->
    <link rel="stylesheet" href="/css/dashboard.css">
    
    <!-- Core JavaScript -->
    <script src="/js/core/spa-loader.js"></script>
</head>
<body>
    <div id="app">
        <div id="content">
            <!-- Loading State -->
            <div id="loading" class="loading-dashboard">
                <div class="loading-spinner"></div>
                <div class="loading-text">Carregando Sistema...</div>
            </div>
        </div>
    </div>
</body>
</html>
```

## 🔧 Componentes Isolados

### 📄 `/public/js/core/spa-loader.js`
- **Responsabilidade**: Sistema de navegação SPA
- **Funcionalidades**: 
  - Roteamento de módulos
  - Carregamento dinâmico de assets
  - Gerenciamento de estado da aplicação

### 📄 `/public/css/dashboard.css` 
- **Responsabilidade**: Estilos globais básicos
- **Conteúdo**: 
  - Loading screen
  - Layout base
  - Reset CSS

## 🚨 O que NUNCA deve estar no index.html

❌ **Proibido:**
- Funções JavaScript inline
- Lógica de negócio
- Event handlers
- Código específico de módulos
- Estilos CSS complexos inline
- Scripts longos (>10 linhas)

✅ **Permitido:**
- Links para arquivos CSS/JS externos
- Estrutura HTML básica
- Loading states simples
- Meta tags
- Títulos e configurações básicas

## 📁 Separação de Responsabilidades

```
/public/
├── index.html              ← APENAS estrutura básica (25 linhas)
├── js/core/
│   └── spa-loader.js      ← Lógica SPA isolada
├── js/modules/
│   ├── students.js        ← Lógica específica isolada
│   └── student-editor.js  ← Funcionalidades isoladas
├── css/
│   ├── dashboard.css      ← Estilos globais básicos
│   └── modules/           ← Estilos isolados por módulo
└── views/
    └── *.html            ← Templates específicos
```

## 🎯 Benefícios da Arquitetura Atual

1. **Manutenibilidade**: Cada arquivo tem responsabilidade única
2. **Escalabilidade**: Fácil adicionar novos módulos
3. **Performance**: Carregamento sob demanda
4. **Debugging**: Isolamento facilita identificação de problemas
5. **Compliance**: Segue diretrizes CLAUDE.md rigorosamente

## 📋 Checklist para Alterações

Antes de modificar o `index.html`, verifique:

- [ ] A alteração é estrutural básica?
- [ ] Não adiciona lógica de negócio?
- [ ] Mantém menos de 30 linhas total?
- [ ] Não duplica funcionalidade dos módulos?
- [ ] Segue o princípio "Uma Ação = Uma Tela"?

## 🔄 Histórico de Refatoração

- **Antes**: 1200+ linhas com código inline conflitante
- **Depois**: 25 linhas com separação clara de responsabilidades
- **Resultado**: Sistema de assinaturas funcionando perfeitamente