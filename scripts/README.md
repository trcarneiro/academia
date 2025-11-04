# 🎯 Scripts de Dados Demo - Academia Krav Maga

Este diretório contém scripts para gerenciar dados de demonstração da aplicação Academia Krav Maga v2.0.

## 📋 Scripts Disponíveis

### 🚀 Scripts Principais

```bash
# Reset completo (recomendado)
npm run reset:demo        # Limpa e recria dados completos
npm run reset:demo:quick  # Limpa e recria apenas dados básicos

# Inserção de dados
npm run seed:demo         # Dados completos (100+ registros)
npm run seed:quick        # Dados básicos (essenciais)

# Limpeza
npm run clean:demo        # Remove apenas dados demo
```

### 📊 Comparação dos Scripts

| Script | Tempo | Registros | Uso Recomendado |
|--------|-------|-----------|----------------|
| `seed:quick` | ~5s | ~10 | Desenvolvimento rápido |
| `seed:demo` | ~15s | ~100 | Demonstração completa |
| `reset:demo:quick` | ~7s | ~10 | Reset rápido |
| `reset:demo` | ~20s | ~100 | Reset completo |

## 🗂️ Estrutura dos Dados

### 👥 Usuários Demo
```
joao@academia.demo     / demo123  (Estudante)
ana@academia.demo      / demo123  (Estudante)  
carlos@academia.demo   / demo123  (Estudante)
marcus@academia.demo   / demo123  (Instrutor)
```

### 💰 Planos Disponíveis
- **Plano Básico**: R$ 150/mês (2x semana)
- **Plano Premium**: R$ 250/mês (Ilimitado + Personal)
- **Plano Teen**: R$ 120/mês (Adolescentes)

### 🎓 Cursos
- **Krav Maga Iniciante**: 12 semanas, 24 aulas
- **Krav Maga Intermediário**: 16 semanas, 48 aulas

## 🛠️ Arquivos do Sistema

### `seed-demo-data.ts`
- **Função**: Inserção completa de dados demo
- **Dados**: Organização, cursos, instrutores, estudantes, planos, técnicas, atividades
- **Uso**: Demonstrações, apresentações, desenvolvimento completo

### `seed-quick-demo.ts`
- **Função**: Inserção rápida de dados essenciais
- **Dados**: Usuários básicos, 1 curso, 1 plano, dados mínimos
- **Uso**: Desenvolvimento ágil, testes rápidos

### `clean-demo-data.ts`
- **Função**: Limpeza seletiva de dados demo
- **Preserva**: Estrutura da organização, configurações
- **Remove**: Usuários, estudantes, aulas, presenças

### `reset-demo.ts`
- **Função**: Reset completo (limpa + recria)
- **Opções**: `--quick` para dados básicos
- **Uso**: Resetar ambiente rapidamente

## 🔧 Configurações Técnicas

### Organização Demo
- **ID Fixo**: `452c0b35-1822-4890-851e-922356c812fb`
- **Nome**: Academia Krav Maga Demo
- **Slug**: academia-demo

### Senhas
- Todas as senhas demo são: `demo123`
- Hash BCrypt: `$2a$12$RzWS/zz4OrQr4SuKSZxN2OuNTBrj4E/.fR7IdgWi.wlpiEmK23xrO`

### IDs Fixos (para consistência)
```typescript
// Planos
const PLAN_BASICO_ID = '18f7d0e9-c375-4792-afb3-f59b2e4c2157';

// Cursos  
const COURSE_INICIANTE_ID = 'f7a3af16-7ccb-407c-8d5e-6d4b97cf8b53';

// Aulas
const DEMO_CLASS_ID = 'f9eed5a6-0f6a-479e-be01-311b05cb3ff5';
```

## 🚨 Troubleshooting

### Erro: "Organização não encontrada"
```bash
# Verificar se a organização existe
npm run db:studio
# Ou recriar tudo
npm run reset:demo
```

### Erro: "Foreign key constraint"
```bash
# Ordem correta: sempre limpar antes
npm run clean:demo
npm run seed:quick
```

### Erro: "Database connection"
```bash
# Verificar se PostgreSQL está rodando
# Verificar .env DATABASE_URL
npm run db:push
```

### Performance Lenta
```bash
# Use versão rápida para desenvolvimento
npm run reset:demo:quick

# Para dados completos apenas em demonstrações
npm run reset:demo
```

## 📈 Logs de Exemplo

### Execução Bem-sucedida
```
🎯 INICIANDO INSERÇÃO DE DADOS DEMO
=====================================

🧹 Limpando dados demo existentes...
   ✅ attendances limpa
   ✅ students limpa
   ✅ instructors limpa

🏢 Criando organização...
   ✅ Organização: Academia Krav Maga Demo

👥 Criando estudantes...
   ✅ Estudante: João Silva (Plano Básico)
   ✅ Estudante: Ana Santos (Plano Premium)

🎉 DADOS DEMO INSERIDOS COM SUCESSO!
====================================
📊 Resumo:
   • 3 instrutores
   • 2 cursos  
   • 3 planos de cobrança
   • 6 estudantes
   • 2 técnicas
   • 2 atividades
   • 3 aulas exemplo

🌐 Acesse: http://localhost:3000
👤 Login: joao@academia.demo / demo123
```

## 🎯 Fluxo Recomendado

### Para Desenvolvimento
1. `npm run reset:demo:quick` (primeira vez)
2. Desenvolver/testar
3. `npm run clean:demo` (quando necessário)
4. `npm run seed:quick` (recriar dados básicos)

### Para Demonstração
1. `npm run reset:demo` (dados completos)
2. Verificar em http://localhost:3000
3. Login com usuários demo
4. Apresentar funcionalidades

### Para CI/CD
```bash
# Em ambiente de teste
npm run clean:demo
npm run seed:quick
npm run test
```

---

## 📞 Suporte

Se encontrar problemas:

1. **Verifique o banco**: `npm run db:studio`
2. **Reset completo**: `npm run reset:demo`  
3. **Logs detalhados**: Todos os scripts mostram logs de progresso
4. **Ambiente limpo**: `npm run clean:demo` antes de recriar

**Tempo médio de execução**: 5-20 segundos dependendo do script escolhido.
