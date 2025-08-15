# Student Editor Module

## 📁 Estrutura de Arquivos

```
public/
├── js/modules/student-editor/
│   ├── main.js              # Controlador principal
│   ├── profile-tab.js       # Componente da aba de perfil
│   ├── financial-tab.js     # Componente da aba financeira
│   └── config.js            # Configurações e constantes
├── css/modules/student-editor/
│   └── styles.css           # Estilos específicos do módulo
└── views/
    └── student-editor.html  # Template HTML principal
```

## 🏗️ Arquitetura

### Padrão de Design
- **Modular**: Cada aba é um componente independente
- **Orientado a Eventos**: Comunicação através de eventos personalizados
- **Responsivo**: Design adaptativo para diferentes tamanhos de tela
- **Acessível**: Seguindo princípios de acessibilidade web

### Principais Componentes

#### 1. Main Controller (`main.js`)
- **Responsabilidade**: Gerenciar o ciclo de vida da aplicação
- **Funcionalidades**:
  - Inicialização dos componentes
  - Navegação entre abas
  - Comunicação com a API
  - Estados de loading e erro
  - Persistência de dados

#### 2. Profile Tab (`profile-tab.js`)
- **Responsabilidade**: Gerenciar dados do perfil do estudante
- **Funcionalidades**:
  - Validação de formulários
  - Máscaras de input (CPF, telefone)
  - Auto-save local
  - Validação em tempo real
  - Estados de erro visuais

#### 3. Financial Tab (`financial-tab.js`)
- **Responsabilidade**: Gerenciar assinaturas e dados financeiros
- **Funcionalidades**:
  - Gestão de assinaturas
  - Seleção de planos
  - Status de pagamentos
  - Histórico financeiro
  - Ações de assinatura (criar, editar, cancelar)

#### 4. Configuration (`config.js`)
- **Responsabilidade**: Centralizador de configurações
- **Funcionalidades**:
  - Constantes da aplicação
  - Configurações de API
  - Mensagens do sistema
  - Utilitários de formatação
  - Validadores

## 🚀 Inicialização

### Como Funciona
1. O HTML carrega o script principal (`main.js`) como módulo ES6
2. O Main Controller extrai o ID do estudante da URL
3. Componentes das abas são carregados dinamicamente
4. Dados do estudante são buscados na API
5. Interface é populada com os dados

### Fluxo de Dados
```
URL → Main Controller → API → Componentes → UI
```

## 📋 APIs Esperadas

### Endpoints
- `GET /api/students/:id` - Buscar dados do estudante
- `PUT /api/students/:id` - Atualizar dados do estudante
- `GET /api/plans` - Listar planos disponíveis
- `POST /api/subscriptions` - Criar nova assinatura
- `PUT /api/subscriptions/:id` - Atualizar assinatura
- `DELETE /api/subscriptions/:id` - Cancelar assinatura

### Formato de Dados

#### Student Object
```javascript
{
  id: "123",
  name: "João Silva",
  email: "joao@email.com",
  phone: "(11) 99999-9999",
  birthdate: "1990-01-01",
  cpf: "123.456.789-00",
  status: "ativo",
  whatsapp: "(11) 99999-9999",
  emergencyContact: "Maria Silva - (11) 88888-8888",
  address: "Rua das Flores, 123",
  notes: "Observações sobre o aluno",
  subscription: {
    id: "456",
    planId: "basic",
    planName: "Plano Básico",
    monthlyPrice: 150.00,
    status: "active",
    paymentStatus: "paid",
    nextDueDate: "2025-09-01",
    createdAt: "2025-08-01"
  },
  financialHistory: []
}
```

## 🎨 Estilos e Temas

### Sistema de Cores
- **Primary**: #3B82F6 (Azul)
- **Secondary**: #8B5CF6 (Roxo)
- **Success**: #10B981 (Verde)
- **Warning**: #F59E0B (Amarelo)
- **Error**: #EF4444 (Vermelho)

### Breakpoints Responsivos
- **Mobile**: até 480px
- **Tablet**: 481px - 768px
- **Desktop**: 769px - 1024px
- **Wide**: acima de 1024px

## ⚙️ Configurações

### Auto-save
- **Intervalo**: 30 segundos
- **Storage**: localStorage
- **Expiração**: 24 horas

### Validação
- **Em tempo real**: Durante a digitação (debounce 500ms)
- **Visual**: Bordas coloridas e mensagens de erro
- **Máscaras**: CPF, telefone, valores monetários

### Performance
- **Lazy Loading**: Componentes carregados sob demanda
- **Debounce**: Validação e API calls otimizadas
- **Cache**: localStorage para dados temporários

## 🔧 Personalização

### Adicionar Nova Aba
1. Criar novo arquivo na pasta `student-editor/`
2. Implementar a classe com métodos obrigatórios:
   - `init()`
   - `onDataLoaded(data)`
   - `onTabActivated()`
   - `collectData()`
3. Registrar no Main Controller
4. Adicionar HTML e CSS correspondentes

### Exemplo de Nova Aba
```javascript
export class CustomTab {
    constructor(mainController) {
        this.main = mainController;
        this.init();
    }

    init() {
        console.log('🎯 Inicializando aba customizada...');
    }

    onDataLoaded(studentData) {
        // Processar dados recebidos
    }

    onTabActivated() {
        // Ações quando aba é ativada
    }

    async collectData() {
        // Coletar dados para salvar
        return {};
    }
}
```

## 📱 Estados da Interface

### Loading States
- **Global**: Tela cheia com backdrop
- **Local**: Indicadores em campos específicos
- **Skeleton**: Placeholder durante carregamento

### Error States
- **Validação**: Bordas vermelhas + mensagens
- **API**: Notificações toast
- **Network**: Fallback offline

### Success States
- **Visual**: Bordas verdes + ícones
- **Notifications**: Mensagens de confirmação
- **Auto-hide**: Limpeza automática após 3s

## 🧪 Testes e Debug

### Console Logs
- Prefixos por categoria: 🚀 🔄 📥 💾 ❌ ✅
- Níveis configuráveis via `DEV_CONFIG`
- Informações de performance incluídas

### localStorage Debug
```javascript
// Ver dados salvos
console.log(localStorage.getItem('academia_student_editor_profile_data'));

// Limpar cache
studentEditor.tabs.profile.clearLocalStorage();
```

## 🔍 Troubleshooting

### Problemas Comuns

#### "ID do estudante não encontrado"
- Verificar se URL contém parâmetro `?id=123`
- Confirmar redirecionamento de páginas anteriores

#### "Dados não carregam"
- Verificar se API está rodando
- Checar Network tab no DevTools
- Confirmar endpoints na configuração

#### "Validação não funciona"
- Verificar se campos têm IDs corretos
- Confirmar se regex de validação está adequada
- Checar console para erros JavaScript

#### "Auto-save não funciona"
- Verificar se localStorage está habilitado
- Confirmar se não há erros de quota
- Checar configuração de intervalo

### Debug Mode
```javascript
// Ativar debug
window.studentEditor.config.debug = true;

// Ver estado atual
console.log(window.studentEditor.studentData);
console.log(window.studentEditor.tabs);
```

## 🚀 Deploy e Build

### Produção
1. Minificar arquivos JavaScript
2. Comprimir CSS
3. Otimizar imagens
4. Configurar CDN se necessário

### Versionamento
- Usar hash nos nomes dos arquivos
- Configurar cache headers apropriados
- Implementar service worker se necessário

## 📄 Changelog

### Versão 1.0.0
- ✅ Estrutura modular implementada
- ✅ Componentes de perfil e financeiro
- ✅ Sistema de validação robusto
- ✅ Auto-save e persistência local
- ✅ Design responsivo e acessível
- ✅ Configurações centralizadas
- ✅ Documentação completa
