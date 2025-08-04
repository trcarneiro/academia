# 🧪 Guia Completo de Testes - Estudantes e Planos

## 📋 Visão Geral
Este guia fornece instruções completas para executar todos os testes dos módulos de estudantes e planos.

## 🚀 Execução Rápida (2 minutos)

### 1. Verificar se servidor está rodando
```bash
node scripts/test-quick.js
```

### 2. Executar testes completos
```bash
# Instalar dependências (apenas uma vez)
npm install --save-dev jest supertest

# Executar todos os testes
node scripts/run-all-tests.js

# Ou executar testes específicos
node scripts/run-all-tests.js backend
node scripts/run-all-tests.js frontend
```

## 📁 Estrutura de Testes

```
tests/
├── integration/
│   ├── students-plans-backend.test.js    # Testes backend completos
│   ├── students-api.test.ts             # Testes API estudantes
│   ├── billing-plans-api.test.ts        # Testes API planos
│   └── students-plans.test.js           # Testes integração
├── unit/
│   └── financialService.test.ts         # Testes unitários
├── setup.js                             # Configuração Jest
└── README.md                           # Documentação
```

## 🎯 Tipos de Testes

### 1. Testes Backend (Jest)
- ✅ Criação de estudantes
- ✅ Atualização de estudantes
- ✅ Listagem de estudantes
- ✅ Criação de planos
- ✅ Atualização de planos
- ✅ Listagem de planos
- ✅ Assinaturas estudante-plano
- ✅ Validações de campos
- ✅ Fluxo completo de integração

### 2. Testes Frontend
- ✅ Carregamento de módulos
- ✅ Disponibilidade de views
- ✅ Testes de API via fetch
- ✅ Interface de usuário

### 3. Testes de Integração
- ✅ Frontend + Backend
- ✅ Fluxo completo de uso

## 🔧 Comandos de Teste

### Comandos Rápidos
```bash
# Teste rápido (verifica endpoints)
node scripts/test-quick.js

# Teste simples
node scripts/test-simple.js

# Teste de associações
node scripts/test-associations.js
```

### Comandos Jest
```bash
# Executar todos os testes Jest
npx jest

# Executar testes específicos
npx jest tests/integration/students-plans-backend.test.js

# Com coverage
npx jest --coverage

# Modo watch
npx jest --watch
```

### Comandos Frontend
```bash
# Abrir testes no navegador
# Acesse: http://localhost:3000/test/students-plans-frontend.html
```

## 📊 Resultados Esperados

### Teste Rápido
```
✅ Health Check: 200
✅ List Students: 200
✅ List Plans: 200
✅ List Courses: 200
🎉 Todos os testes passaram!
```

### Testes Backend
```
Test Suites: 1 passed, 1 total
Tests:       10 passed, 10 total
Snapshots:   0 total
Time:        3.5s
```

## 🛠️ Solução de Problemas

### Servidor não inicia
```bash
# Verificar porta 3000
lsof -i :3000

# Matar processo
kill -9 $(lsof -t -i :3000)

# Iniciar servidor
node servers/working-server.js
```

### Erro de banco de dados
```bash
# Verificar conexão
node scripts/test-db-connection.js

# Resetar banco
npm run db:reset
```

### Timeout nos testes
```bash
# Aumentar timeout
npx jest --testTimeout=30000
```

## 📈 Métricas de Teste

### Cobertura de Código
- Backend: 85%+ cobertura
- Frontend: Testes manuais via navegador
- Integração: Fluxos completos testados

### Performance
- Testes rápidos: < 5 segundos
- Testes completos: < 30 segundos
- Testes Jest: < 10 segundos

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

### Problemas Comuns
1. **Porta 3000 ocupada**: Use `kill -9 $(lsof -t -i :3000)`
2. **Banco corrompido**: Delete `prisma/dev.db` e rode `npm run db:push`
3. **Dependências faltando**: `npm install --save-dev jest supertest`

### Logs
- Backend: `logs/server.log`
- Testes: `logs/test.log`
- Erros: Console output

## 🎓 Exemplos de Uso

### Criar Estudante via API
```bash
curl -X POST http://localhost:3000/api/students \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "João",
    "lastName": "Silva",
    "email": "joao@example.com",
    "phone": "11999999999",
    "birthDate": "1990-01-01",
    "category": "ADULT",
    "status": "ACTIVE"
  }'
```

### Criar Plano via API
```bash
curl -X POST http://localhost:3000/api/billing-plans \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Plano Premium",
    "price": 150.00,
    "billingCycle": "MONTHLY",
    "description": "Plano com acesso completo"
  }'
```

## ✅ Checklist Final

- [ ] Servidor rodando na porta 3000
- [ ] Dependências instaladas (`npm install`)
- [ ] Banco de dados configurado
- [ ] Teste rápido passando (`node scripts/test-quick.js`)
- [ ] Testes backend passando (`npx jest`)
- [ ] Testes frontend funcionando (navegador)
- [ ] Documentação lida (`tests/README.md`)
