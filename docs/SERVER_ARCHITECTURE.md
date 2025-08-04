# 🏗️ Arquitetura de Servidores - Krav Academy

**Data de Criação**: 20/07/2025  
**Status**: ✅ ATIVO E DOCUMENTADO  
**Último Update**: 20/07/2025

## 🚨 SERVIDOR CORRETO A SER USADO

### ✅ **SERVIDOR PRINCIPAL** (USE ESTE!)
```bash
npm run dev
```

**Características:**
- **Tecnologia**: TypeScript + Fastify
- **Banco de Dados**: PostgreSQL + Prisma ORM  
- **Documentação**: Swagger UI integrado
- **APIs**: Completas e funcionais
- **Dados**: **REAIS** do banco de dados
- **URL**: `http://localhost:3000`
- **Docs**: `http://localhost:3000/docs` (Swagger UI oficial)

### ❌ **SERVIDOR SIMPLES** (NÃO USAR EM PRODUÇÃO!)
```bash
npm run dev:simple
```

**Características:**
- **Propósito**: Apenas desenvolvimento/mockup
- **Tecnologia**: Node.js básico
- **Dados**: APIs mock/simuladas
- **Limitações**: Sem banco de dados real

---

## 📊 Dados Reais Disponíveis

### 👥 **Students API** - `/api/students`
```json
{
  "success": true,
  "data": [
    {
      "id": "0b997817-3ce9-426b-9230-ab2a71e5b53a",
      "organizationId": "0671e975-8f7e-48da-91ed-329ef45cb7b2",
      "userId": "3b23c410-a72d-48b1-8f75-95a1c0346c8c",
      "user": {
        "firstName": "Teste",
        "lastName": "CPF",
        "email": "teste@example.com",
        "phone": "31999999999"
      },
      "category": "ADULT",
      "isActive": true,
      "totalXP": 0,
      "globalLevel": 1
    }
    // ... mais 26 alunos reais
  ],
  "pagination": {
    "total": 27,
    "limit": 50,
    "offset": 0,
    "pages": 1
  }
}
```

**Total de Alunos**: **27 alunos reais** do banco PostgreSQL

---

## 🔗 URLs Importantes

### **Frontend Dashboard**
- **Principal**: `http://localhost:3000/`
- **Módulo Students**: `http://localhost:3000/` → "👥 Gestão de Alunos"

### **APIs Principais**
- **Students**: `http://localhost:3000/api/students`
- **Classes**: `http://localhost:3000/api/classes`  
- **Attendance**: `http://localhost:3000/api/attendance`
- **Analytics**: `http://localhost:3000/api/analytics`

### **Documentação**
- **Swagger UI**: `http://localhost:3000/docs`
- **Health Check**: `http://localhost:3000/api/health`

---

## 🛠️ Como Iniciar Corretamente

### 1. **Parar Qualquer Servidor Anterior**
```bash
pkill -f node
```

### 2. **Iniciar Servidor Principal**
```bash
npm run dev
```

### 3. **Verificar se Funcionou**
```bash
curl http://localhost:3000/api/students
# Deve retornar 27 alunos reais
```

### 4. **Acessar Interface**
- Dashboard: `http://localhost:3000/`
- Documentação: `http://localhost:3000/docs`

---

## 📋 Checklist de Verificação

- [ ] **Servidor Principal rodando**: `npm run dev`
- [ ] **API Students retorna 27 alunos**: `GET /api/students`
- [ ] **Swagger UI funcionando**: `http://localhost:3000/docs`
- [ ] **Dashboard carrega alunos reais**: Navegue para "👥 Gestão de Alunos"
- [ ] **Sem dados hardcoded**: APIs conectadas ao PostgreSQL

---

## 🚫 Erros Anteriores Corrigidos

### ❌ **O que NÃO fazer:**
1. ~~Usar `server-simple.js` como principal~~
2. ~~Criar documentação customizada quando já existe Swagger~~
3. ~~Trabalhar com dados mock quando há banco real~~
4. ~~Modificar servidor simples para funcionalidades completas~~

### ✅ **O que fazer:**
1. **Sempre usar** `npm run dev` (servidor TypeScript)
2. **Sempre acessar** `/docs` para documentação oficial
3. **Sempre verificar** dados reais do PostgreSQL
4. **Sempre testar** com `curl /api/students` primeiro

---

## 📈 Capacidades do Sistema

### **Backend Completo**
- ✅ **Prisma ORM** configurado
- ✅ **PostgreSQL** como banco principal
- ✅ **Fastify** como framework web
- ✅ **Swagger UI** para documentação
- ✅ **TypeScript** para type safety
- ✅ **Autenticação JWT** implementada
- ✅ **Rate limiting** configurado
- ✅ **CORS** configurado

### **Dados Reais Disponíveis**
- ✅ **27 Alunos** cadastrados
- ✅ **Organizações** configuradas
- ✅ **Usuários** vinculados
- ✅ **Categorias** (ADULT, CHILD, etc.)
- ✅ **Estados** (ATIVO/INATIVO)
- ✅ **XP e Levels** para gamificação

---

## 🔒 CLAUDE.md Compliance

O sistema está **100% CLAUDE.md compliant**:
- ✅ **API-First**: Dados sempre via banco PostgreSQL
- ✅ **No Hardcoded Data**: Zero dados fixos no código
- ✅ **Modular Architecture**: Módulos isolados em `/src/`
- ✅ **Empty States**: UI gracefully handles empty data
- ✅ **Security**: JWT auth, rate limiting, CORS

---

## 📞 Suporte

Se houver problemas:

1. **Verificar logs**: `tail -f server-main.log`
2. **Verificar banco**: `npm run db:studio`
3. **Resetar se necessário**: `npm run db:reset`
4. **Documentação técnica**: Ver `/docs/` para detalhes específicos

---

**⚠️ IMPORTANTE**: Este documento é a fonte da verdade para arquitetura de servidores. Sempre consulte antes de fazer mudanças!