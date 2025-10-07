/**
 * Apply enum migration manually
 * Run: node apply-enum-migration.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function applyEnumMigration() {
  console.log('🔄 Applying StudentCategory enum migration...\n');

  try {
    // Add new enum values (PostgreSQL allows this)
    const migrations = [
      "ALTER TYPE \"StudentCategory\" ADD VALUE IF NOT EXISTS 'TEEN'",
      "ALTER TYPE \"StudentCategory\" ADD VALUE IF NOT EXISTS 'KIDS'",
      "ALTER TYPE \"StudentCategory\" ADD VALUE IF NOT EXISTS 'WOMEN'",
      "ALTER TYPE \"StudentCategory\" ADD VALUE IF NOT EXISTS 'MEN'",
      "ALTER TYPE \"StudentCategory\" ADD VALUE IF NOT EXISTS 'MIXED'",
      "ALTER TYPE \"StudentCategory\" ADD VALUE IF NOT EXISTS 'LAW_ENFORCEMENT'",
    ];

    for (const sql of migrations) {
      console.log('📝 Executing:', sql);
      await prisma.$executeRawUnsafe(sql);
      console.log('   ✅ Success\n');
    }

    // Verify by querying enum values
    console.log('🔍 Verifying enum values...');
    const result = await prisma.$queryRaw`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = 'StudentCategory'::regtype::oid 
      ORDER BY enumsortorder
    `;
    
    console.log('✅ Current StudentCategory values:');
    result.forEach(row => console.log('   -', row.enumlabel));
    
    console.log('\n🎉 Migration applied successfully!');
    console.log('🚀 You can now use the new categories in the UI');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    
    if (error.code === 'P2010') {
      console.log('\n⚠️  Enum values might already exist');
      console.log('   This is OK - the migration is idempotent');
    }
  } finally {
    await prisma.$disconnect();
  }
}

applyEnumMigration();
