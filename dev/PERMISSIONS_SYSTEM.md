# Sistema de Permissões - Academia Krav Maga

**Versão**: 1.0.0  
**Data**: 03/12/2025

---

## 📊 Visão Geral

Sistema de controle de acesso baseado em **roles** (papéis) com permissões granulares por módulo/ação.

### Roles Existentes (UserRole enum)

| Role | Descrição | Nível |
|------|-----------|-------|
| `SUPER_ADMIN` | Administrador do sistema (multi-tenant) | 100 |
| `ADMIN` | Administrador da organização | 80 |
| `MANAGER` | Gerente/Coordenador | 60 |
| `INSTRUCTOR` | Instrutor/Professor | 40 |
| `STUDENT` | Aluno | 20 |

---

## 🎯 Matriz de Permissões por Módulo

### Legenda
- ✅ Acesso total
- 👁️ Apenas visualização
- 🔒 Sem acesso
- 📝 Apenas próprios dados
- ⚙️ Configurável

---

### 1. Dashboard

| Recurso | SUPER_ADMIN | ADMIN | MANAGER | INSTRUCTOR | STUDENT |
|---------|-------------|-------|---------|------------|---------|
| Ver métricas gerais | ✅ | ✅ | ✅ | 👁️ próprias turmas | 🔒 |
| Ver financeiro | ✅ | ✅ | ⚙️ | 🔒 | 🔒 |
| Ver frequência | ✅ | ✅ | ✅ | 👁️ próprias turmas | 📝 |
| Ver alunos ativos | ✅ | ✅ | ✅ | 👁️ próprias turmas | 🔒 |

---

### 2. Alunos

| Ação | SUPER_ADMIN | ADMIN | MANAGER | INSTRUCTOR | STUDENT |
|------|-------------|-------|---------|------------|---------|
| Listar todos | ✅ | ✅ | ✅ | 👁️ próprias turmas | 🔒 |
| Ver detalhes | ✅ | ✅ | ✅ | 👁️ próprios alunos | 📝 próprio |
| Criar | ✅ | ✅ | ✅ | 🔒 | 🔒 |
| Editar | ✅ | ✅ | ✅ | 🔒 | 📝 próprio (limitado) |
| Excluir | ✅ | ✅ | 🔒 | 🔒 | 🔒 |
| Ver financeiro | ✅ | ✅ | ✅ | 🔒 | 📝 próprio |
| Registrar frequência | ✅ | ✅ | ✅ | ✅ | 🔒 |
| Ver progresso | ✅ | ✅ | ✅ | ✅ | 📝 próprio |

---

### 3. Instrutores

| Ação | SUPER_ADMIN | ADMIN | MANAGER | INSTRUCTOR | STUDENT |
|------|-------------|-------|---------|------------|---------|
| Listar | ✅ | ✅ | ✅ | 👁️ | 👁️ |
| Ver detalhes | ✅ | ✅ | ✅ | 📝 próprio | 👁️ básico |
| Criar | ✅ | ✅ | 🔒 | 🔒 | 🔒 |
| Editar | ✅ | ✅ | 🔒 | 📝 próprio | 🔒 |
| Excluir | ✅ | ✅ | 🔒 | 🔒 | 🔒 |
| Ver valor/hora | ✅ | ✅ | 🔒 | 📝 próprio | 🔒 |
| Associar cursos | ✅ | ✅ | ✅ | 🔒 | 🔒 |

---

### 4. Turmas

| Ação | SUPER_ADMIN | ADMIN | MANAGER | INSTRUCTOR | STUDENT |
|------|-------------|-------|---------|------------|---------|
| Listar todas | ✅ | ✅ | ✅ | 👁️ próprias | 👁️ matriculadas |
| Ver detalhes | ✅ | ✅ | ✅ | ✅ próprias | 👁️ matriculadas |
| Criar | ✅ | ✅ | ✅ | 🔒 | 🔒 |
| Editar | ✅ | ✅ | ✅ | 📝 próprias (limitado) | 🔒 |
| Excluir | ✅ | ✅ | 🔒 | 🔒 | 🔒 |
| Registrar presença | ✅ | ✅ | ✅ | ✅ próprias | 🔒 |
| Ver lista de alunos | ✅ | ✅ | ✅ | ✅ próprias | 🔒 |

---

### 5. Cursos

| Ação | SUPER_ADMIN | ADMIN | MANAGER | INSTRUCTOR | STUDENT |
|------|-------------|-------|---------|------------|---------|
| Listar | ✅ | ✅ | ✅ | ✅ | 👁️ matriculados |
| Ver detalhes | ✅ | ✅ | ✅ | ✅ | 👁️ matriculados |
| Criar | ✅ | ✅ | 🔒 | 🔒 | 🔒 |
| Editar | ✅ | ✅ | 🔒 | 🔒 | 🔒 |
| Excluir | ✅ | ✅ | 🔒 | 🔒 | 🔒 |
| Ver técnicas | ✅ | ✅ | ✅ | ✅ | 👁️ |
| Editar técnicas | ✅ | ✅ | 🔒 | 🔒 | 🔒 |

---

### 6. Pacotes/Planos (Financeiro)

| Ação | SUPER_ADMIN | ADMIN | MANAGER | INSTRUCTOR | STUDENT |
|------|-------------|-------|---------|------------|---------|
| Listar planos | ✅ | ✅ | ✅ | 👁️ | 👁️ disponíveis |
| Criar planos | ✅ | ✅ | 🔒 | 🔒 | 🔒 |
| Editar planos | ✅ | ✅ | 🔒 | 🔒 | 🔒 |
| Ver assinaturas | ✅ | ✅ | ✅ | 🔒 | 📝 próprias |
| Criar assinatura | ✅ | ✅ | ✅ | 🔒 | 🔒 |
| Ver pagamentos | ✅ | ✅ | ✅ | 🔒 | 📝 próprios |
| Relatórios | ✅ | ✅ | ⚙️ | 🔒 | 🔒 |

---

### 7. Organizações

| Ação | SUPER_ADMIN | ADMIN | MANAGER | INSTRUCTOR | STUDENT |
|------|-------------|-------|---------|------------|---------|
| Listar todas | ✅ | 🔒 | 🔒 | 🔒 | 🔒 |
| Ver própria | ✅ | ✅ | 👁️ | 👁️ básico | 👁️ básico |
| Editar própria | ✅ | ✅ | 🔒 | 🔒 | 🔒 |
| Criar nova | ✅ | 🔒 | 🔒 | 🔒 | 🔒 |

---

### 8. Unidades

| Ação | SUPER_ADMIN | ADMIN | MANAGER | INSTRUCTOR | STUDENT |
|------|-------------|-------|---------|------------|---------|
| Listar | ✅ | ✅ | ✅ | ✅ | 👁️ |
| Criar | ✅ | ✅ | 🔒 | 🔒 | 🔒 |
| Editar | ✅ | ✅ | 🔒 | 🔒 | 🔒 |
| Excluir | ✅ | ✅ | 🔒 | 🔒 | 🔒 |

---

### 9. Agenda

| Ação | SUPER_ADMIN | ADMIN | MANAGER | INSTRUCTOR | STUDENT |
|------|-------------|-------|---------|------------|---------|
| Ver agenda geral | ✅ | ✅ | ✅ | 👁️ própria | 👁️ própria |
| Criar evento | ✅ | ✅ | ✅ | ✅ própria turma | 🔒 |
| Editar evento | ✅ | ✅ | ✅ | 📝 próprios | 🔒 |
| Excluir evento | ✅ | ✅ | ✅ | 📝 próprios | 🔒 |

---

### 10. Check-in Kiosk

| Ação | SUPER_ADMIN | ADMIN | MANAGER | INSTRUCTOR | STUDENT |
|------|-------------|-------|---------|------------|---------|
| Acessar kiosk | ✅ | ✅ | ✅ | ✅ | ✅ |
| Fazer check-in | N/A | N/A | N/A | N/A | ✅ próprio |
| Ver histórico | ✅ | ✅ | ✅ | ✅ | 📝 próprio |

---

### 11. Frequência

| Ação | SUPER_ADMIN | ADMIN | MANAGER | INSTRUCTOR | STUDENT |
|------|-------------|-------|---------|------------|---------|
| Ver relatórios | ✅ | ✅ | ✅ | 👁️ próprias turmas | 📝 própria |
| Registrar manual | ✅ | ✅ | ✅ | ✅ próprias turmas | 🔒 |
| Editar registros | ✅ | ✅ | ✅ | 🔒 | 🔒 |
| Exportar | ✅ | ✅ | ✅ | 👁️ | 🔒 |

---

### 12. Progresso/Graduação

| Ação | SUPER_ADMIN | ADMIN | MANAGER | INSTRUCTOR | STUDENT |
|------|-------------|-------|---------|------------|---------|
| Ver progresso alunos | ✅ | ✅ | ✅ | ✅ próprios | 📝 próprio |
| Registrar avaliação | ✅ | ✅ | ✅ | ✅ próprios | 🔒 |
| Aprovar graduação | ✅ | ✅ | ⚙️ | 🔒 | 🔒 |
| Emitir certificado | ✅ | ✅ | ✅ | 🔒 | 🔒 |

---

### 13. CRM / Leads

| Ação | SUPER_ADMIN | ADMIN | MANAGER | INSTRUCTOR | STUDENT |
|------|-------------|-------|---------|------------|---------|
| Ver leads | ✅ | ✅ | ✅ | 🔒 | 🔒 |
| Criar lead | ✅ | ✅ | ✅ | 🔒 | 🔒 |
| Editar lead | ✅ | ✅ | ✅ | 🔒 | 🔒 |
| Converter lead | ✅ | ✅ | ✅ | 🔒 | 🔒 |
| Ver pipeline | ✅ | ✅ | ✅ | 🔒 | 🔒 |

---

### 14. IA & Agentes

| Ação | SUPER_ADMIN | ADMIN | MANAGER | INSTRUCTOR | STUDENT |
|------|-------------|-------|---------|------------|---------|
| Chat com agentes | ✅ | ✅ | ✅ | ⚙️ | 🔒 |
| Criar agentes | ✅ | ✅ | 🔒 | 🔒 | 🔒 |
| Ver atividades | ✅ | ✅ | ✅ | 🔒 | 🔒 |
| Aprovar tarefas | ✅ | ✅ | ⚙️ | 🔒 | 🔒 |

---

### 15. Relatórios

| Ação | SUPER_ADMIN | ADMIN | MANAGER | INSTRUCTOR | STUDENT |
|------|-------------|-------|---------|------------|---------|
| Relatórios gerais | ✅ | ✅ | ✅ | 🔒 | 🔒 |
| Relatórios financeiros | ✅ | ✅ | ⚙️ | 🔒 | 🔒 |
| Relatórios alunos | ✅ | ✅ | ✅ | 👁️ próprias turmas | 📝 próprio |
| Exportar dados | ✅ | ✅ | ⚙️ | 🔒 | 🔒 |

---

### 16. Importação

| Ação | SUPER_ADMIN | ADMIN | MANAGER | INSTRUCTOR | STUDENT |
|------|-------------|-------|---------|------------|---------|
| Importar Asaas | ✅ | ✅ | 🔒 | 🔒 | 🔒 |
| Importar cursos | ✅ | ✅ | 🔒 | 🔒 | 🔒 |
| Importar alunos | ✅ | ✅ | 🔒 | 🔒 | 🔒 |

---

### 17. Configurações

| Ação | SUPER_ADMIN | ADMIN | MANAGER | INSTRUCTOR | STUDENT |
|------|-------------|-------|---------|------------|---------|
| Configurações gerais | ✅ | ✅ | 🔒 | 🔒 | 🔒 |
| Configurar Asaas | ✅ | ✅ | 🔒 | 🔒 | 🔒 |
| Gerenciar usuários | ✅ | ✅ | 🔒 | 🔒 | 🔒 |
| Ver logs sistema | ✅ | ✅ | 🔒 | 🔒 | 🔒 |

---

## 🏗️ Arquitetura do Sistema

### 1. Estrutura de Dados

```prisma
// Já existe no schema
enum UserRole {
  SUPER_ADMIN
  ADMIN
  MANAGER
  INSTRUCTOR
  STUDENT
}

// NOVO: Tabela de permissões granulares
model Permission {
  id          String   @id @default(uuid())
  module      String   // 'students', 'turmas', 'courses', etc.
  action      String   // 'list', 'view', 'create', 'edit', 'delete'
  scope       String   // 'all', 'own', 'team', 'none'
  description String?
  
  rolePermissions RolePermission[]
  
  @@unique([module, action])
  @@map("permissions")
}

// NOVO: Associação Role -> Permissions
model RolePermission {
  id           String     @id @default(uuid())
  role         UserRole
  permissionId String
  
  permission   Permission @relation(fields: [permissionId], references: [id])
  
  @@unique([role, permissionId])
  @@map("role_permissions")
}

// NOVO: Override de permissão por usuário
model UserPermissionOverride {
  id           String     @id @default(uuid())
  userId       String
  permissionId String
  granted      Boolean    // true = permite, false = nega
  
  user         User       @relation(fields: [userId], references: [id])
  permission   Permission @relation(fields: [permissionId], references: [id])
  
  @@unique([userId, permissionId])
  @@map("user_permission_overrides")
}
```

### 2. Middleware Backend

```typescript
// src/middlewares/authorization.ts
import { FastifyRequest, FastifyReply } from 'fastify';

interface AuthContext {
  user: {
    id: string;
    role: UserRole;
    organizationId: string;
    instructorId?: string;
    studentId?: string;
  };
}

export function requireRole(...allowedRoles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as AuthContext['user'];
    
    if (!user) {
      return reply.code(401).send({ error: 'Não autenticado' });
    }
    
    if (!allowedRoles.includes(user.role)) {
      return reply.code(403).send({ 
        error: 'Sem permissão para esta ação',
        required: allowedRoles,
        current: user.role
      });
    }
  };
}

export function requirePermission(module: string, action: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as AuthContext['user'];
    
    // Verificar permissão no banco ou cache
    const hasPermission = await checkPermission(user, module, action);
    
    if (!hasPermission) {
      return reply.code(403).send({
        error: `Sem permissão: ${module}.${action}`
      });
    }
  };
}
```

### 3. Frontend - Context de Permissões

```javascript
// public/js/shared/permissions-context.js

class PermissionsContext {
  constructor() {
    this.userRole = null;
    this.permissions = new Map();
    this.cache = {};
  }

  async init() {
    const user = window.currentUser;
    if (!user) return;
    
    this.userRole = user.role;
    await this.loadPermissions();
  }

  async loadPermissions() {
    try {
      const response = await fetch('/api/auth/permissions');
      const data = await response.json();
      
      if (data.success) {
        data.permissions.forEach(p => {
          const key = `${p.module}.${p.action}`;
          this.permissions.set(key, p.scope);
        });
      }
    } catch (error) {
      console.error('Erro ao carregar permissões:', error);
    }
  }

  // Verifica se pode executar ação
  can(module, action) {
    const key = `${module}.${action}`;
    const scope = this.permissions.get(key);
    return scope && scope !== 'none';
  }

  // Verifica escopo (all, own, team, none)
  getScope(module, action) {
    const key = `${module}.${action}`;
    return this.permissions.get(key) || 'none';
  }

  // Helpers por role
  isAdmin() {
    return ['SUPER_ADMIN', 'ADMIN'].includes(this.userRole);
  }

  isManager() {
    return ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(this.userRole);
  }

  isInstructor() {
    return this.userRole === 'INSTRUCTOR';
  }

  isStudent() {
    return this.userRole === 'STUDENT';
  }
}

// Singleton global
window.permissions = new PermissionsContext();
```

### 4. Uso no Frontend

```javascript
// Em qualquer módulo
async function renderButtons() {
  const container = document.getElementById('actions');
  
  // Mostrar botões baseado em permissões
  if (window.permissions.can('students', 'create')) {
    container.innerHTML += `<button onclick="createStudent()">Novo Aluno</button>`;
  }
  
  if (window.permissions.can('students', 'delete')) {
    container.innerHTML += `<button onclick="deleteStudent()">Excluir</button>`;
  }
}

// Filtrar dados por escopo
async function loadStudents() {
  const scope = window.permissions.getScope('students', 'list');
  
  let endpoint = '/api/students';
  
  // Se escopo é 'own' (instrutor vendo próprios alunos)
  if (scope === 'own') {
    const instructorId = window.currentUser.instructorId;
    endpoint = `/api/instructors/${instructorId}/students`;
  }
  
  const response = await fetch(endpoint);
  // ...
}
```

---

## 🔐 Menu Dinâmico por Role

```javascript
// Configuração do menu por role
const menuConfig = {
  SUPER_ADMIN: [
    'dashboard', 'students', 'instructors', 'courses', 'turmas',
    'packages', 'organizations', 'units', 'agenda', 'frequency',
    'progress', 'graduation', 'crm', 'ai-agents', 'reports',
    'import', 'settings'
  ],
  ADMIN: [
    'dashboard', 'students', 'instructors', 'courses', 'turmas',
    'packages', 'units', 'agenda', 'frequency', 'progress',
    'graduation', 'crm', 'ai-agents', 'reports', 'import', 'settings'
  ],
  MANAGER: [
    'dashboard', 'students', 'instructors', 'courses', 'turmas',
    'units', 'agenda', 'frequency', 'progress', 'graduation',
    'crm', 'reports'
  ],
  INSTRUCTOR: [
    'dashboard', 'my-turmas', 'my-students', 'agenda', 
    'frequency', 'progress', 'my-profile'
  ],
  STUDENT: [
    'my-dashboard', 'my-courses', 'my-progress', 'my-attendance',
    'my-profile', 'check-in'
  ]
};
```

---

## 📋 Implementação em Fases

### Fase 1 - Fundação (Semana 1)
- [ ] Criar tabelas de permissões no Prisma
- [ ] Migrar banco de dados
- [ ] Seed de permissões padrão
- [ ] Endpoint GET /api/auth/permissions

### Fase 2 - Backend (Semana 2)
- [ ] Middleware requireRole
- [ ] Middleware requirePermission
- [ ] Aplicar em rotas críticas
- [ ] Testes de autorização

### Fase 3 - Frontend (Semana 3)
- [ ] PermissionsContext
- [ ] Menu dinâmico
- [ ] Ocultar/mostrar botões
- [ ] Filtro de dados por escopo

### Fase 4 - Refinamento (Semana 4)
- [ ] Tela de gerenciamento de roles
- [ ] Override de permissões por usuário
- [ ] Logs de auditoria
- [ ] Documentação final

---

## 🚀 Quick Start

Para começar a implementação, execute:

```bash
# 1. Criar migração
npx prisma migrate dev --name add_permissions_system

# 2. Seed das permissões
npm run seed:permissions

# 3. Testar
npm run test:permissions
```
