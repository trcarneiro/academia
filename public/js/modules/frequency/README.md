# Módulo de Frequência v1.0 - Academia Krav Maga

Fonte da verdade de padrões e processos: consulte AGENTS.md (guia mestre). Especificações detalhadas e tokens vivem em /dev; em caso de conflito, AGENTS.md prevalece.

## 📋 Visão Geral

O **Módulo de Frequência** é um sistema completo de gestão de presença para a Academia Krav Maga v2.0. Ele permite registro de check-ins, análise de padrões de frequência, relatórios detalhados e insights automáticos sobre a participação dos alunos.

## ✨ Funcionalidades Principais

### 🎯 Core Features
- ✅ **Check-in Digital**: Registro rápido de presença com múltiplos métodos
- 📊 **Histórico Completo**: Consulta e filtros avançados de frequência
- 📈 **Relatórios Premium**: Análises gráficas e insights automáticos
- 📱 **Scanner QR Code**: Check-in via QR para agilidade
- 🔄 **Modo Offline**: Funciona sem conexão, sincroniza quando online
- 🎨 **UI Premium**: Interface moderna seguindo AGENTS.md + /dev

### 🛡️ Validações e Segurança
- 🔐 **Integridade de Dados**: Hash de verificação anti-duplicação
- ⏰ **Janela Temporal**: Check-in limitado a horários válidos
- 🎓 **Validação de Planos**: Compatibilidade sessão-plano automática
- 📊 **Rate Limiting**: Proteção contra spam de requisições
- 🔍 **Auditoria Completa**: Log detalhado de todas as operações

### 📊 Analytics e Insights
- 📈 **Tendências Automáticas**: Identificação de padrões de frequência
- 🎯 **Recomendações IA**: Sugestões para otimização
- 📅 **Previsões**: Forecast de frequência futura
- 🏆 **Rankings**: Top alunos por período
- 🕒 **Análise de Horários**: Identificação de picos e vales

## 🏗️ Arquitetura do Sistema

### 📁 Estrutura de Arquivos
```
/public/js/modules/frequency/
├── index.js                    # Módulo principal
├── app-integration.js          # Integração com AcademyApp
├── services/
│   ├── frequencyService.js     # Lógica de negócio principal
│   └── validationService.js    # Validações e regras
├── controllers/
│   └── frequencyController.js  # Controlador de UI
├── components/
│   ├── checkinForm.js          # Formulário de check-in
│   ├── attendanceList.js       # Lista de presenças
│   └── frequencyStats.js       # Estatísticas e gráficos
├── views/
│   ├── checkinView.js          # View principal de check-in
│   ├── historyView.js          # View de histórico
│   └── reportsView.js          # View de relatórios
└── README.md                   # Esta documentação

/public/css/modules/
└── frequency.css               # Estilos do módulo
```

### 🔧 Padrões Arquiteturais
- **MVC Pattern**: Separação clara entre Model, View e Controller
- **Service Layer**: Lógica de negócio isolada em services
- **Component-Based**: UI modular e reutilizável
- **Event-Driven**: Comunicação via eventos customizados
- **API-First**: Todas as operações via endpoints REST

## 🚀 Como Usar

### 1. 📥 Instalação
O módulo já está configurado e pronto para uso. Certifique-se de que:
- AcademyApp está funcionando
- API Client está disponível
- CSS do módulo está carregado

### 2. ✅ Check-in Básico
```javascript
// Via interface
// 1. Acesse o módulo de Frequência
// 2. Selecione aluno e sessão
// 3. Clique em "Confirmar Check-in"

// Via código
const checkinData = {
    studentId: 'uuid-do-aluno',
    sessionId: 'uuid-da-sessao',
    context: {
        device: 'desktop',
        trigger: 'manual'
    }
};

await window.frequencyModule.checkin(checkinData);
```

### 3. 📊 Consultar Histórico
```javascript
// Buscar histórico com filtros
const filters = {
    student: 'uuid-do-aluno',
    dateFrom: '2024-01-01',
    dateTo: '2024-01-31',
    status: 'CONFIRMED'
};

const history = await window.frequencyModule.getHistory(filters);
```

### 4. 📈 Gerar Relatórios
```javascript
// Gerar relatório personalizado
const reportOptions = {
    period: 30,
    groupBy: 'week',
    includeCharts: true,
    format: 'pdf'
};

const report = await window.frequencyModule.generateReport(reportOptions);
```

## 🎛️ API Endpoints

### Check-in
- `POST /api/frequency/checkin` - Registrar presença
- `GET /api/frequency/validate/{studentId}/{sessionId}` - Validar check-in

### Histórico
- `GET /api/frequency/attendance` - Listar presenças
- `GET /api/frequency/attendance/{id}` - Detalhes da presença
- `PATCH /api/frequency/attendance/{id}` - Atualizar presença

### Relatórios
- `GET /api/frequency/stats` - Estatísticas gerais
- `GET /api/frequency/reports/weekly` - Relatório semanal
- `GET /api/frequency/reports/student/{id}` - Relatório do aluno

### Utilitários
- `GET /api/frequency/sessions/active` - Sessões ativas
- `GET /api/frequency/insights` - Insights automáticos

## 🎨 Interface do Usuário

### 🖥️ Telas Principais

#### ✅ Check-in
- **Formulário intuitivo** com seleção de aluno e sessão
- **Scanner QR Code** para check-in rápido
- **Feed ao vivo** com presenças em tempo real
- **Sessões atuais** com status e contadores
- **Ações rápidas** para bulk operations

#### 📊 Histórico
- **Filtros avançados** por período, aluno, curso, status
- **Múltiplas visualizações**: tabela, timeline, calendário
- **Rankings automáticos** de top alunos
- **Insights inteligentes** sobre padrões
- **Exportação completa** em múltiplos formatos

#### 📈 Relatórios
- **Gráficos interativos** de evolução e distribuição
- **Análise de tendências** com previsões
- **Comparações detalhadas** entre períodos
- **Métricas avançadas** de correlação
- **Recomendações IA** para otimização

### 🎨 Design System
- **Cores primárias**: `#667eea` (Primary), `#764ba2` (Secondary)
- **Gradientes premium** em cards e headers
- **Transições suaves** com easing personalizado
- **Responsividade total** para todos os dispositivos
- **Dark mode ready** com CSS variables

## ⚙️ Configurações

### 🔧 Variáveis Principais
```javascript
// Configuração do módulo
const CONFIG = {
    checkInWindow: {
        before: 15, // minutos antes da sessão
        after: 30   // minutos depois da sessão
    },
    rateLimit: {
        maxRequests: 20,
        windowMs: 60000
    },
    offline: {
        maxQueueSize: 100,
        syncInterval: 30000
    },
    validation: {
        requireActivePlan: true,
        allowDuplicates: false,
        enforceTimeWindow: true
    }
};
```

### 🛡️ Regras de Negócio
- **R1**: Aluno deve ter plano ativo
- **R2**: Sessão deve ser compatível com o plano
- **R3**: Evitar check-ins duplicados
- **R4**: Respeitar janela temporal de check-in
- **R5**: Validar status da sessão
- **R6**: Verificar whitelist de cursos
- **R7**: Alertar sobre limite diário
- **R8**: Garantir integridade dos dados

## 📊 Performance e Otimização

### ⚡ Métricas de Performance
- **Tempo de check-in**: < 2 segundos
- **Load inicial**: < 3 segundos
- **Bundle size**: < 200KB (comprimido)
- **Memory usage**: < 50MB (steady state)

### 🔄 Estratégias de Cache
- **Service Worker**: Cache de assets estáticos
- **LocalStorage**: Dados de sessão e preferências
- **IndexedDB**: Queue offline e histórico local
- **Memory Cache**: Resultados de API temporários

### 📱 Responsividade
- **Mobile First**: Design otimizado para mobile
- **Progressive Enhancement**: Funcionalidades adicionais em desktop
- **Touch Friendly**: Botões e áreas de toque adequadas
- **Offline Support**: Funciona mesmo sem conexão

## 🧪 Testes e Qualidade

### ✅ Cobertura de Testes
- **Unit Tests**: Services e validações
- **Integration Tests**: API endpoints
- **E2E Tests**: Fluxos críticos de usuário
- **Performance Tests**: Load e stress testing

### 🔍 Monitoramento
- **Error Tracking**: Sentry integration
- **Analytics**: Google Analytics events
- **Performance**: Core Web Vitals
- **User Feedback**: In-app feedback system

## 🐛 Troubleshooting

### 🔧 Problemas Comuns

#### ❌ Check-in não funciona
```javascript
// Verificar dependências
console.log('API Client:', !!window.apiClient);
console.log('App Instance:', !!window.app);
console.log('Module Loaded:', !!window.frequencyModule);

// Verificar status da sessão
const session = await window.apiClient.get(`/api/sessions/${sessionId}`);
console.log('Session status:', session.status);
```

#### 📊 Dados não carregam
```javascript
// Verificar cache local
localStorage.clear();
sessionStorage.clear();

// Forçar refresh
window.frequencyModule.clearCache();
await window.frequencyModule.refreshData();
```

#### 🔄 Sincronização offline
```javascript
// Verificar fila offline
const queue = window.frequencyModule.getOfflineQueue();
console.log('Offline queue size:', queue.length);

// Forçar sincronização
await window.frequencyModule.processOfflineQueue();
```

### 📞 Suporte
- **Logs**: Sempre verifique o console do navegador
- **Network**: Monitore requisições na aba Network
- **Storage**: Verifique LocalStorage/SessionStorage
- **Service Worker**: Confirme registro do SW

## 🚀 Roadmap Futuro

### 🎯 Próximas Funcionalidades
- 🤖 **IA Avançada**: Predição de dropout de alunos
- 📧 **Notificações**: Email/SMS para faltas
- 🎮 **Gamificação**: Badges e conquistas
- 📍 **Geolocalização**: Check-in por proximidade
- 🔗 **Integração**: Wearables e fitness trackers

### 🏗️ Melhorias Técnicas
- ⚡ **PWA**: Progressive Web App completo
- 🔄 **Real-time**: WebSocket para updates live
- 📊 **Big Data**: Analytics avançado
- 🛡️ **Security**: Biometria e 2FA
- 🌐 **i18n**: Internacionalização

## 👥 Contribuição

### 📝 Guidelines
Para desenvolvimento neste módulo, siga:
1) AGENTS.md (master) — padrões de UI, integração com AcademyApp, API-first e Quality Gates.
2) /dev — especificações detalhadas de design tokens, classes premium e exemplos.
1. **Siga o padrão**: Architecture patterns estabelecidos
2. **Teste tudo**: 100% de cobertura em novos recursos
3. **Documente**: README e comentários no código
4. **Performance**: Sempre considere otimização
5. **Acessibilidade**: WCAG 2.1 compliance

### 🔄 Processo
1. Fork do repositório
2. Branch feature/fix
3. Testes locais
4. Pull request
5. Code review
6. Deploy

---

## 📄 Licença

Este módulo faz parte do sistema Academia Krav Maga v2.0 e segue a mesma licença do projeto principal.

## 🙋 Suporte

Para dúvidas, problemas ou sugestões:
- 📧 Email: dev@academia.com
- 💬 Slack: #frequency-module
- 📱 WhatsApp: +55 11 99999-9999

---

**Desenvolvido com ❤️ para a Academia Krav Maga v2.0**
