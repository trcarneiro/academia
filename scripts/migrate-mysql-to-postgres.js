/**
 * Script de Migração: MySQL → Supabase PostgreSQL
 * 
 * Migra todos os dados do MySQL antigo para o novo Supabase PostgreSQL
 * preservando os dados do Asaas e melhorias do dashboard.
 */

const mysql = require('mysql2/promise');
const { PrismaClient } = require('@prisma/client');

// Configuração MySQL (origem)
const MYSQL_CONFIG = {
  host: '67.205.159.161',
  port: 3306,
  user: '-WBA-Carneiro',
  password: 'Ojqemjeowt*a1',
  database: 'academia'
};

// Prisma Client já configurado para Supabase PostgreSQL (destino)
const prisma = new PrismaClient();

// Ordem de migração (respeitando foreign keys)
const MIGRATION_ORDER = [
  'organizations',
  'organization_settings',
  'martial_arts',
  'users',
  'students',
  'financial_responsibles',
  'instructors',
  'units',
  'training_areas',
  'mats',
  'courses',
  'course_templates',
  'technique_libraries',
  'techniques',
  'lesson_plans',
  'asaas_customers',
  'billing_plans',
  'student_subscriptions',
  'payments',
  'classes',
  'attendances',
  'turmas',
  // Adicione outras tabelas conforme necessário
];

async function connectMySQL() {
  console.log('🔌 Conectando ao MySQL...');
  const connection = await mysql.createConnection(MYSQL_CONFIG);
  console.log('✅ Conectado ao MySQL');
  return connection;
}

async function getTableData(mysqlConn, tableName) {
  try {
    const [rows] = await mysqlConn.query(`SELECT * FROM ${tableName}`);
    return rows;
  } catch (error) {
    console.warn(`⚠️  Tabela ${tableName} não existe ou está vazia:`, error.message);
    return [];
  }
}

function transformData(tableName, mysqlRow) {
  // Converter campos específicos do MySQL para PostgreSQL
  const transformed = { ...mysqlRow };
  
  // Converter TINYINT(1) para Boolean (TODOS os campos 0/1)
  Object.keys(transformed).forEach(key => {
    if (typeof transformed[key] === 'number' && (transformed[key] === 0 || transformed[key] === 1)) {
      // Lista de campos que devem ser booleanos
      const boolFields = [
        'isActive', 'isPublic', 'requiresConfirmation', 'autoRenew', 'isPinned', 'isRead',
        'emailVerified', 'notifications', 'isBaseCourse', 'requireAttendanceForProgress',
        'canApproveAgentTasks', 'canExecuteAgentTasks', 'canCreateAgents', 'canDeleteAgents',
        'isUnlimitedAccess', 'hasPersonalTraining', 'hasNutrition', 'allowInstallments',
        'isRecurring', 'accessAllModalities', 'allowFreeze', 'allowPartialCredit',
        'allowRefund', 'allowTransfer', 'autoRenewCredits'
      ];
      if (boolFields.includes(key)) {
        transformed[key] = Boolean(transformed[key]);
      }
    }
    
    // Converter strings vazias em null para campos opcionais
    if (transformed[key] === '') {
      transformed[key] = null;
    }
    
    // Converter JSON strings duplo-escaped para arrays
    if (typeof transformed[key] === 'string') {
      // Detectar arrays duplo-escaped: "[\"item1\",\"item2\"]"
      if (transformed[key].startsWith('"[') && transformed[key].endsWith(']"')) {
        try {
          // Remove aspas externas e faz parse
          const unescaped = transformed[key].slice(1, -1).replace(/\\"/g, '"');
          transformed[key] = JSON.parse(unescaped);
        } catch (e) {
          console.warn(`   ⚠️  Falha ao converter array duplo-escaped no campo ${key}`);
        }
      }
      // JSON strings normais
      else if (transformed[key].startsWith('{') || transformed[key].startsWith('[')) {
        try {
          transformed[key] = JSON.parse(transformed[key]);
        } catch (e) {
          // Não é JSON válido, manter como string
        }
      }
    }
  });
  
  return transformed;
}

async function migrateTable(mysqlConn, tableName) {
  console.log(`\n📦 Migrando tabela: ${tableName}`);
  
  const rows = await getTableData(mysqlConn, tableName);
  
  if (rows.length === 0) {
    console.log(`   ℹ️  Nenhum dado encontrado em ${tableName}`);
    return { table: tableName, count: 0, success: true };
  }
  
  console.log(`   📊 Encontrados ${rows.length} registros`);
  
  let successCount = 0;
  let errorCount = 0;
  const errors = [];
  
  for (const row of rows) {
    try {
      const transformed = transformData(tableName, row);
      
      // Remover campos que não existem no schema PostgreSQL
      const cleaned = removeUnknownFields(tableName, transformed);
      
      // Usar o método Prisma apropriado baseado no nome da tabela
      const prismaModel = getPrismaModelName(tableName);
      
      if (prisma[prismaModel]) {
        await prisma[prismaModel].create({
          data: cleaned
        });
        successCount++;
      } else {
        console.warn(`   ⚠️  Modelo Prisma não encontrado para: ${tableName}`);
        errorCount++;
      }
    } catch (error) {
      errorCount++;
      errors.push({
        row: row.id || row.name || 'unknown',
        error: error.message.split('\n')[0] // Primeira linha do erro
      });
    }
  }
  
  console.log(`   ✅ Migrados: ${successCount}`);
  if (errorCount > 0) {
    console.log(`   ❌ Erros: ${errorCount}`);
    errors.slice(0, 3).forEach(e => {
      console.log(`      - ${e.row}: ${e.error}`);
    });
  }
  
  return {
    table: tableName,
    count: successCount,
    errors: errorCount,
    success: errorCount === 0
  };
}

function removeUnknownFields(tableName, data) {
  // Campos que foram removidos do schema PostgreSQL
  const removedFields = {
    'users': [
      'permissions', 'canApproveAgentTasks', 'canExecuteAgentTasks', 
      'canCreateAgents', 'canDeleteAgents', 'maxTaskPriority', 'canApproveCategories'
    ],
    'students': [], // Sem campos removidos agora
    'billing_plans': ['creditsValidity', 'pricePerClass', 'allowPartialCredit', 'allowRefund', 'allowTransfer', 'bulkDiscountTiers', 'creditQuantity', 'creditType', 'creditValidityDays', 'minCreditsPerClass', 'planType', 'refundDaysBeforeExp', 'transferFeePercent', 'autoRenewChargeMethod', 'autoRenewCredits', 'maxAutoRenewals', 'renewalIntervalDays', 'creditRenewalMethod', 'creditRenewalTrigger'],
    // Adicione outros conforme necessário
  };
  
  const fieldsToRemove = removedFields[tableName] || [];
  const cleaned = { ...data };
  
  fieldsToRemove.forEach(field => {
    delete cleaned[field];
  });
  
  return cleaned;
}

function getPrismaModelName(tableName) {
  // Converter nome da tabela para nome do modelo Prisma
  // Ex: "organizations" -> "organization"
  //     "martial_arts" -> "martialArt"
  
  const mapping = {
    'organizations': 'organization',
    'organization_settings': 'organizationSettings',
    'martial_arts': 'martialArt',
    'users': 'user',
    'students': 'student',
    'financial_responsibles': 'financialResponsible',
    'instructors': 'instructor',
    'units': 'unit',
    'training_areas': 'trainingArea',
    'mats': 'mat',
    'courses': 'course',
    'course_templates': 'courseTemplate',
    'technique_libraries': 'techniqueLibrary',
    'techniques': 'technique',
    'lesson_plans': 'lessonPlan',
    'asaas_customers': 'asaasCustomer',
    'billing_plans': 'billingPlan',
    'student_subscriptions': 'studentSubscription',
    'payments': 'payment',
    'classes': 'class',
    'attendances': 'attendance',
    'turmas': 'turma',
  };
  
  return mapping[tableName] || tableName;
}

async function main() {
  console.log('🚀 Iniciando Migração MySQL → Supabase PostgreSQL\n');
  console.log('📍 Origem: MySQL @ 67.205.159.161:3306/academia');
  console.log('📍 Destino: Supabase PostgreSQL\n');
  
  let mysqlConn;
  const results = [];
  
  try {
    // Conectar ao MySQL
    mysqlConn = await connectMySQL();
    
    // Migrar cada tabela na ordem correta
    for (const tableName of MIGRATION_ORDER) {
      const result = await migrateTable(mysqlConn, tableName);
      results.push(result);
    }
    
    // Resumo final
    console.log('\n\n📊 RESUMO DA MIGRAÇÃO');
    console.log('═'.repeat(60));
    
    let totalSuccess = 0;
    let totalErrors = 0;
    
    results.forEach(r => {
      const status = r.success ? '✅' : '❌';
      console.log(`${status} ${r.table.padEnd(30)} | ${r.count} registros`);
      totalSuccess += r.count;
      totalErrors += r.errors || 0;
    });
    
    console.log('═'.repeat(60));
    console.log(`✅ Total migrado: ${totalSuccess} registros`);
    if (totalErrors > 0) {
      console.log(`❌ Total de erros: ${totalErrors}`);
    }
    console.log('\n🎉 Migração concluída!');
    
  } catch (error) {
    console.error('\n❌ Erro fatal na migração:', error);
    process.exit(1);
  } finally {
    // Desconectar
    if (mysqlConn) {
      await mysqlConn.end();
      console.log('\n🔌 Desconectado do MySQL');
    }
    await prisma.$disconnect();
    console.log('🔌 Desconectado do Supabase PostgreSQL');
  }
}

// Executar
main()
  .catch(error => {
    console.error('❌ Erro não tratado:', error);
    process.exit(1);
  });
