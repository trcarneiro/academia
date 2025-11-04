const fs = require('fs');

const schemaPath = './prisma/schema.prisma';
let schema = fs.readFileSync(schemaPath, 'utf8');

console.log('🔧 Corrigindo schema.prisma...\n');

// Pattern: Json @default("[]") @relation(...)
// Should be: Json @default("[]")
const pattern = /(Json\s+@default\("\[\]"\))\s+@relation\([^)]+\)/g;
let matches = schema.match(pattern);

if (matches) {
  console.log(`📋 Encontrados ${matches.length} campos Json com @relation inválido:\n`);
  
  schema = schema.replace(pattern, (match, jsonPart) => {
    console.log(`   ✅ Corrigido: ${match.substring(0, 60)}...`);
    return jsonPart;
  });
  
  fs.writeFileSync(schemaPath, schema);
  console.log(`\n✅ Schema corrigido! ${matches.length} @relation removidos de campos Json`);
  console.log('\n💡 Próximo passo: npx prisma generate');
} else {
  console.log('✅ Nenhum problema encontrado!');
}
