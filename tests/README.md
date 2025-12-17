# 🧪 Testes - Academia Krav Maga v2.0

Este diretório contém todos os testes automatizados do sistema (smoke, integration e unit tests).

## 📁 Estrutura de Testes

```
tests/
├── smoke/                               # Smoke tests (validação básica)
│   ├── smoke-agenda.test.ts            ✅ Agenda module
│   ├── smoke-agents.test.ts            ✅ AI Agents (NOVO)
│   ├── smoke-asaas.test.ts             ✅ Asaas integration (NOVO)
│   ├── smoke-attendance.test.ts        ✅ Attendance/Checkin (NOVO)
│   ├── smoke-auth.test.ts              ✅ Authentication (NOVO)
│   ├── smoke-courses.test.ts           ✅ Courses module
│   ├── smoke-crm.test.ts               ✅ CRM module
│   ├── smoke-deploy-ops.test.ts        ✅ Deploy Ops (NOVO)
│   ├── smoke-financial.test.ts         ✅ Financial module (NOVO)
│   ├── smoke-graduation.test.ts        ✅ Graduation (NOVO)
│   ├── smoke-instructors.test.ts       ✅ Instructors module
│   ├── smoke-pedagogical.test.ts       ✅ Pedagogical (NOVO)
│   ├── smoke-subscriptions.test.ts     ✅ Subscriptions (NOVO)
│   └── smoke-units.test.ts             ✅ Units module
├── contract/                            # Contract/Integration tests
│   └── ops.deploy.test.ts              ✅ Deploy Ops API (NOVO)
├── integration/
│   ├── students-api.test.ts            ✅ Students API
│   ├── billing-plans-api.test.ts       ✅ Billing Plans API
│   ├── financial-module.test.ts        ✅ Financial module
│   └── students-plans.test.js          # Legacy integration
├── unit/
│   ├── authService.test.ts             ✅ Auth service
│   ├── financialService.test.ts        ✅ Financial service
│   └── packagesSimpleRoutes.test.ts    ✅ Packages routes
├── e2e/                                 # End-to-end tests (futuro)
├── setup.js                             # Jest setup
├── setup.ts                             # Vitest setup
└── README.md                            # Este arquivo
```

## 🚀 Como Executar os Testes

### 1. Testes Unificados (Recomendado)
```bash
# Executar todos os testes
node scripts/run-all-tests.js

# Executar apenas testes backend
node scripts/run-all-tests.js backend

# Executar apenas testes frontend
node scripts/run-all-tests.js frontend

# Executar testes simples
node scripts/run-all-tests.js simple
```

### 2. Testes Backend (Jest)
```bash
# Instalar dependências
npm install --save-dev jest supertest

# Executar testes backend
npx jest tests/integration/students-plans-backend.test.js

# Executar com coverage
npx jest --coverage
```

### 3. Testes Frontend
Abra o navegador e acesse:
```
http://localhost:3000/test/students-plans-frontend.html
```

### 4. Testes Manuais
```bash
# Testar endpoints simples
node scripts/test-simple.js

# Testar associações
node scripts/test-associations.js
```

## 📋 O que é Testado

### Backend Tests (`students-plans-backend.test.js`)
- ✅ Criação de estudantes
- ✅ Atualização de estudantes
- ✅ Listagem de estudantes
- ✅ Criação de planos
- ✅ Atualização de planos
- ✅ Listagem de planos
- ✅ Assinaturas (estudante-plano)
- ✅ Validações de campos obrigatórios
- ✅ Fluxo completo de integração
- ✅ Limpeza de dados de teste

### Frontend Tests (`students-plans-frontend.html`)
- ✅ Carregamento de módulos
- ✅ Disponibilidade de views
- ✅ Testes de API via fetch
- ✅ Testes de integração frontend-backend
- ✅ Interface de usuário

## 🛠️ Configuração

### Pré-requisitos
1. Node.js instalado
2. Servidor rodando na porta 3000
3. Banco de dados configurado

### Instalação de Dependências
```bash
npm install --save-dev jest supertest
```

### Configuração do Ambiente
```bash
# Copiar arquivo de ambiente
cp .env.example .env

# Configurar variáveis de ambiente
# Editar .env com suas configurações
```

## 🎯 Exemplos de Uso

### Teste de Criação de Estudante
```javascript
const studentData = {
  firstName: 'João',
  lastName: 'Silva',
  email: 'joao@example.com',
  phone: '11999999999',
  birthDate: '1990-01-01',
  category: 'ADULT',
  status: 'ACTIVE'
};

// POST /api/students
```

### Teste de Criação de Plano
```javascript
const planData = {
  name: 'Plano Premium',
  price: 150.00,
  billingCycle: 'MONTHLY',
  description: 'Plano com acesso completo',
  features: ['Acesso ilimitado', 'Personal trainer']
};

// POST /api/billing-plans
```

### Teste de Assinatura
```javascript
const subscriptionData = {
  planId: 'plan-id-aqui',
  startDate: new Date().toISOString(),
  status: 'ACTIVE'
};

// POST /api/students/:studentId/subscriptions
```

## 🔍 Debugging

### Logs de Teste
Os testes geram logs detalhados:
- Console output durante execução
- Arquivos de log em `logs/`
- Relatórios de coverage em `coverage/`

### Problemas Comuns

1. **Servidor não inicia**
   ```bash
   # Verificar porta 3000
   lsof -i :3000
   
   # Matar processo se necessário
   kill -9 $(lsof -t -i :3000)
   ```

2. **Testes falham com timeout**
   ```bash
   # Aumentar timeout
   npx jest --testTimeout=30000
   ```

3. **Erro de conexão com banco**
   ```bash
   # Verificar configuração do banco
   node scripts/test-db-connection.js
   ```

## 📊 Relatórios

### Coverage Report
```bash
# Gerar relatório de cobertura
npx jest --coverage

# Abrir relatório HTML
open coverage/lcov-report/index.html
```

### Test Results
- Backend: `tests/results/backend/`
- Frontend: Console do navegador
- Integração: `tests/results/integration/`

## 🔄 CI/CD

### GitHub Actions
```yaml
name: Test Students and Plans
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm test
```

## 📞 Suporte

Para problemas com os testes:
1. Verifique os logs em `logs/`
2. Execute `node scripts/check-system.js`
3. Consulte a documentação em `docs/`
4. Abra uma issue no GitHub
