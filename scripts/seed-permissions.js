/**
 * Seed de Permissões do Sistema
 * 
 * Popula as tabelas:
 * - permissions: todas as ações possíveis por módulo
 * - role_permissions: mapeamento role -> permission -> scope
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Definição dos módulos e ações
const MODULES = {
  dashboard: {
    actions: ['view', 'view_metrics', 'view_financial', 'view_attendance'],
    description: 'Dashboard principal'
  },
  students: {
    actions: ['list', 'view', 'create', 'edit', 'delete', 'view_financial', 'register_attendance', 'view_progress'],
    description: 'Gerenciamento de alunos'
  },
  instructors: {
    actions: ['list', 'view', 'create', 'edit', 'delete', 'view_salary', 'assign_courses'],
    description: 'Gerenciamento de instrutores'
  },
  turmas: {
    actions: ['list', 'view', 'create', 'edit', 'delete', 'register_attendance', 'view_students'],
    description: 'Gerenciamento de turmas'
  },
  courses: {
    actions: ['list', 'view', 'create', 'edit', 'delete', 'manage_techniques'],
    description: 'Gerenciamento de cursos'
  },
  packages: {
    actions: ['list', 'view', 'create', 'edit', 'delete', 'view_subscriptions', 'create_subscription', 'view_payments', 'reports'],
    description: 'Planos e financeiro'
  },
  organizations: {
    actions: ['list', 'view', 'create', 'edit'],
    description: 'Gerenciamento de organizações'
  },
  units: {
    actions: ['list', 'view', 'create', 'edit', 'delete'],
    description: 'Gerenciamento de unidades'
  },
  agenda: {
    actions: ['view', 'create', 'edit', 'delete'],
    description: 'Agenda de eventos'
  },
  checkin: {
    actions: ['access', 'do_checkin', 'view_history'],
    description: 'Check-in de presença'
  },
  frequency: {
    actions: ['view_reports', 'register_manual', 'edit_records', 'export'],
    description: 'Relatórios de frequência'
  },
  progress: {
    actions: ['view', 'register_evaluation', 'approve_graduation', 'issue_certificate'],
    description: 'Progresso e graduação'
  },
  crm: {
    actions: ['view_leads', 'create_lead', 'edit_lead', 'convert_lead', 'view_pipeline'],
    description: 'CRM e Leads'
  },
  ai_agents: {
    actions: ['chat', 'create_agent', 'view_activities', 'approve_tasks'],
    description: 'IA e Agentes'
  },
  reports: {
    actions: ['view_general', 'view_financial', 'view_students', 'export'],
    description: 'Relatórios'
  },
  import: {
    actions: ['import_asaas', 'import_courses', 'import_students'],
    description: 'Importação de dados'
  },
  settings: {
    actions: ['view', 'edit_general', 'edit_asaas', 'manage_users', 'view_logs'],
    description: 'Configurações'
  }
};

// Mapeamento de permissões por role
// scope: ALL = todos, OWN = próprios, TEAM = time/turmas, NONE = sem acesso
const ROLE_PERMISSIONS = {
  SUPER_ADMIN: {
    // Super admin tem acesso total a tudo
    _default: { scope: 'ALL' }
  },
  
  ADMIN: {
    // Admin tem acesso total na organização
    _default: { scope: 'ALL' },
    // Exceto organizações (só vê a própria)
    organizations: {
      list: 'NONE',
      create: 'NONE',
      view: 'OWN',
      edit: 'OWN'
    }
  },
  
  MANAGER: {
    // Gerente tem acesso amplo com algumas restrições
    _default: { scope: 'ALL' },
    // Restrições
    organizations: { _all: 'OWN' },
    packages: {
      create: 'NONE',
      edit: 'NONE',
      delete: 'NONE',
      reports: 'ALL'
    },
    instructors: {
      create: 'NONE',
      delete: 'NONE',
      view_salary: 'NONE'
    },
    settings: { _all: 'NONE' },
    import: { _all: 'NONE' },
    ai_agents: {
      create_agent: 'NONE',
      approve_tasks: 'NONE'
    }
  },
  
  INSTRUCTOR: {
    dashboard: {
      view: 'ALL',
      view_metrics: 'TEAM',
      view_financial: 'NONE',
      view_attendance: 'TEAM'
    },
    students: {
      list: 'TEAM',
      view: 'TEAM',
      create: 'NONE',
      edit: 'NONE',
      delete: 'NONE',
      view_financial: 'NONE',
      register_attendance: 'TEAM',
      view_progress: 'TEAM'
    },
    instructors: {
      list: 'ALL',
      view: 'OWN',
      create: 'NONE',
      edit: 'OWN',
      delete: 'NONE',
      view_salary: 'OWN',
      assign_courses: 'NONE'
    },
    turmas: {
      list: 'TEAM',
      view: 'TEAM',
      create: 'NONE',
      edit: 'TEAM',
      delete: 'NONE',
      register_attendance: 'TEAM',
      view_students: 'TEAM'
    },
    courses: {
      list: 'ALL',
      view: 'ALL',
      create: 'NONE',
      edit: 'NONE',
      delete: 'NONE',
      manage_techniques: 'NONE'
    },
    packages: { _all: 'NONE' },
    organizations: { _all: 'NONE' },
    units: {
      list: 'ALL',
      view: 'ALL',
      create: 'NONE',
      edit: 'NONE',
      delete: 'NONE'
    },
    agenda: {
      view: 'TEAM',
      create: 'TEAM',
      edit: 'OWN',
      delete: 'OWN'
    },
    checkin: { _all: 'ALL' },
    frequency: {
      view_reports: 'TEAM',
      register_manual: 'TEAM',
      edit_records: 'NONE',
      export: 'TEAM'
    },
    progress: {
      view: 'TEAM',
      register_evaluation: 'TEAM',
      approve_graduation: 'NONE',
      issue_certificate: 'NONE'
    },
    crm: { _all: 'NONE' },
    ai_agents: { _all: 'NONE' },
    reports: {
      view_general: 'NONE',
      view_financial: 'NONE',
      view_students: 'TEAM',
      export: 'NONE'
    },
    import: { _all: 'NONE' },
    settings: { _all: 'NONE' }
  },
  
  STUDENT: {
    dashboard: {
      view: 'OWN',
      view_metrics: 'NONE',
      view_financial: 'NONE',
      view_attendance: 'OWN'
    },
    students: {
      list: 'NONE',
      view: 'OWN',
      create: 'NONE',
      edit: 'OWN', // Apenas dados básicos
      delete: 'NONE',
      view_financial: 'OWN',
      register_attendance: 'NONE',
      view_progress: 'OWN'
    },
    instructors: {
      list: 'ALL',
      view: 'ALL', // Apenas dados básicos públicos
      create: 'NONE',
      edit: 'NONE',
      delete: 'NONE',
      view_salary: 'NONE',
      assign_courses: 'NONE'
    },
    turmas: {
      list: 'OWN', // Apenas matriculadas
      view: 'OWN',
      create: 'NONE',
      edit: 'NONE',
      delete: 'NONE',
      register_attendance: 'NONE',
      view_students: 'NONE'
    },
    courses: {
      list: 'OWN', // Apenas matriculados
      view: 'OWN',
      create: 'NONE',
      edit: 'NONE',
      delete: 'NONE',
      manage_techniques: 'NONE'
    },
    packages: {
      list: 'ALL', // Ver planos disponíveis
      view: 'ALL',
      create: 'NONE',
      edit: 'NONE',
      delete: 'NONE',
      view_subscriptions: 'OWN',
      create_subscription: 'NONE',
      view_payments: 'OWN',
      reports: 'NONE'
    },
    organizations: { _all: 'NONE' },
    units: {
      list: 'ALL',
      view: 'ALL',
      create: 'NONE',
      edit: 'NONE',
      delete: 'NONE'
    },
    agenda: {
      view: 'OWN',
      create: 'NONE',
      edit: 'NONE',
      delete: 'NONE'
    },
    checkin: {
      access: 'ALL',
      do_checkin: 'OWN',
      view_history: 'OWN'
    },
    frequency: {
      view_reports: 'OWN',
      register_manual: 'NONE',
      edit_records: 'NONE',
      export: 'NONE'
    },
    progress: {
      view: 'OWN',
      register_evaluation: 'NONE',
      approve_graduation: 'NONE',
      issue_certificate: 'NONE'
    },
    crm: { _all: 'NONE' },
    ai_agents: { _all: 'NONE' },
    reports: {
      view_general: 'NONE',
      view_financial: 'NONE',
      view_students: 'OWN',
      export: 'NONE'
    },
    import: { _all: 'NONE' },
    settings: { _all: 'NONE' }
  }
};

async function seedPermissions() {
  console.log('🔐 Iniciando seed de permissões...\n');
  
  // 1. Criar todas as permissões
  console.log('📝 Criando permissões...');
  const permissions = [];
  
  for (const [moduleName, moduleConfig] of Object.entries(MODULES)) {
    for (const action of moduleConfig.actions) {
      permissions.push({
        module: moduleName,
        action: action,
        description: `${moduleConfig.description} - ${action}`
      });
    }
  }
  
  // Upsert permissions
  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: {
        module_action: {
          module: perm.module,
          action: perm.action
        }
      },
      update: { description: perm.description },
      create: perm
    });
  }
  
  console.log(`   ✅ ${permissions.length} permissões criadas/atualizadas\n`);
  
  // 2. Buscar todas as permissões criadas
  const allPermissions = await prisma.permission.findMany();
  const permissionMap = new Map();
  allPermissions.forEach(p => {
    permissionMap.set(`${p.module}.${p.action}`, p.id);
  });
  
  // 3. Criar role permissions
  console.log('👥 Criando permissões por role...');
  
  const roles = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'INSTRUCTOR', 'STUDENT'];
  let rolePermCount = 0;
  
  for (const role of roles) {
    const roleConfig = ROLE_PERMISSIONS[role];
    const defaultScope = roleConfig._default?.scope || 'NONE';
    
    for (const [moduleName, moduleConfig] of Object.entries(MODULES)) {
      const moduleRoleConfig = roleConfig[moduleName];
      
      for (const action of moduleConfig.actions) {
        let scope = defaultScope;
        
        // Verificar configuração específica do módulo
        if (moduleRoleConfig) {
          if (moduleRoleConfig._all) {
            scope = moduleRoleConfig._all;
          } else if (moduleRoleConfig[action]) {
            scope = moduleRoleConfig[action];
          }
        }
        
        const permissionId = permissionMap.get(`${moduleName}.${action}`);
        if (!permissionId) continue;
        
        await prisma.rolePermission.upsert({
          where: {
            role_permissionId: {
              role: role,
              permissionId: permissionId
            }
          },
          update: { scope: scope },
          create: {
            role: role,
            permissionId: permissionId,
            scope: scope
          }
        });
        
        rolePermCount++;
      }
    }
    
    console.log(`   ✅ ${role} configurado`);
  }
  
  console.log(`\n   📊 ${rolePermCount} role permissions criadas/atualizadas\n`);
  
  console.log('✅ Seed de permissões concluído!\n');
  
  // Mostrar resumo
  console.log('📊 Resumo:');
  console.log(`   - Módulos: ${Object.keys(MODULES).length}`);
  console.log(`   - Permissões: ${permissions.length}`);
  console.log(`   - Roles: ${roles.length}`);
  console.log(`   - Role Permissions: ${rolePermCount}`);
}

// Executar se chamado diretamente
if (require.main === module) {
  seedPermissions()
    .then(() => prisma.$disconnect())
    .catch((e) => {
      console.error('❌ Erro no seed:', e);
      prisma.$disconnect();
      process.exit(1);
    });
}

module.exports = { seedPermissions, MODULES, ROLE_PERMISSIONS };
