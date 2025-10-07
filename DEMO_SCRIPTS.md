# 🎯 SCRIPTS DE DADOS DEMO - GUIA RÁPIDO

## ⚡ Comandos Principais

```bash
# 🔥 RECOMENDADO: Reset rápido (5s)
npm run reset:demo:quick

# 📊 Reset completo com mais dados (15s) 
npm run reset:demo

# 🧹 Apenas limpar
npm run clean:demo

# ➕ Apenas inserir (sem limpar)
npm run seed:quick    # Básico
npm run seed:demo     # Completo
```

## 👤 Usuários Demo Criados

| Email | Senha | Tipo | Plano |
|-------|-------|------|-------|
| joao@academia.demo | demo123 | Estudante | Plano Básico |
| ana@academia.demo | demo123 | Estudante | Plano Básico |

## 🌐 Links Úteis

- **Aplicação**: http://localhost:3000
- **API Docs**: http://localhost:3000/docs  
- **Admin DB**: http://localhost:3000/admin (se disponível)

## 🚀 Workflow Recomendado

### Para Desenvolvimento Diário
```bash
# Ao iniciar o trabalho
npm run reset:demo:quick

# Durante desenvolvimento (se precisar limpar)
npm run clean:demo
npm run seed:quick
```

### Para Demonstrações
```bash  
# Preparar ambiente para cliente/demo
npm run reset:demo
```

### Para Testes Automatizados
```bash
# Em CI/CD ou testes
npm run clean:demo
npm run seed:quick
npm test
```

## 📊 Dados Incluídos

### Quick (seed:quick | reset:demo:quick)
- ✅ 1 organização
- ✅ 1 curso (Krav Maga Iniciante)  
- ✅ 1 plano (Básico R$ 150/mês)
- ✅ 2 estudantes com assinaturas
- ✅ 1 instrutor automático
- ✅ 1 aula exemplo
- ✅ 1 registro de presença

### Demo Completo (seed:demo | reset:demo)  
- ✅ 1 organização completa
- ✅ 3 instrutores especializados
- ✅ 2 cursos (Iniciante + Intermediário)
- ✅ 3 planos (Básico, Premium, Teen)
- ✅ 6 estudantes diversos
- ✅ 2+ técnicas catalogadas  
- ✅ 2+ atividades
- ✅ 3+ aulas exemplo
- ✅ Múltiplos registros de presença

## 🔧 Solução de Problemas

### ❌ "Erro de conexão com banco"
```bash
# Verificar se PostgreSQL está rodando
# Verificar .env DATABASE_URL
npm run db:push
npm run reset:demo:quick
```

### ❌ "Foreign key constraint"  
```bash
# Sempre limpar antes de inserir
npm run clean:demo
npm run seed:quick
```

### ❌ "Organização não encontrada"
```bash
# Recriar tudo do zero
npm run reset:demo
```

### ⚠️ Performance lenta
```bash  
# Use quick para desenvolvimento
npm run reset:demo:quick

# Use completo apenas para demos
npm run reset:demo
```

## 📈 Logs de Sucesso Esperados

```
🎉 RESET CONCLUÍDO COM SUCESSO!
===============================
⏱️  Tempo total: 5s
🌐 Aplicação: http://localhost:3000  
👤 Login demo: joao@academia.demo / demo123
📚 Swagger: http://localhost:3000/docs
```

## 🎯 Status dos Scripts

- ✅ `reset:demo:quick` - **PRONTO** (testado)
- ✅ `reset:demo` - **PRONTO** (completo)  
- ✅ `clean:demo` - **PRONTO** (seguro)
- ✅ `seed:quick` - **PRONTO** (rápido)
- ✅ `seed:demo` - **PRONTO** (detalhado)

---

💡 **Dica**: Use `reset:demo:quick` no dia a dia e `reset:demo` para demonstrações importantes!
