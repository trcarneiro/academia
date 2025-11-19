const fs = require('fs');

console.log('📋 Lendo schemas...');
const backupSchema = fs.readFileSync('prisma/schema.backup.prisma', 'utf8');
const currentSchema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Extract all model names with their relations from current schema (db pull result)
const modelRelationsRegex = /model (\w+) \{([\s\S]*?)\n\}/g;
const relationMap = new Map();

let match;
while ((match = modelRelationsRegex.exec(currentSchema)) !== null) {
  const modelName = match[1];
  const modelBody = match[2];
  
  // Extract all relation lines (lines that reference other models)
  const relationLines = modelBody.split('\n')
    .filter(line => line.includes('@relation') && !line.trim().startsWith('//'))
    .map(line => line.trim());
  
  if (relationLines.length > 0) {
    relationMap.set(modelName.toLowerCase(), relationLines);
  }
}

console.log(`✅ Encontrados ${relationMap.size} models com relacionamentos no schema atual`);

// Now merge: use backup schema but add missing reverse relations
let mergedSchema = backupSchema;
let addedRelations = 0;

// Para cada model no backup, verificar se há relacionamentos novos no current
const backupModels = backupSchema.match(/model (\w+) \{[\s\S]*?\n\}/g) || [];

backupModels.forEach(backupModelBlock => {
  const modelNameMatch = backupModelBlock.match(/model (\w+) \{/);
  if (!modelNameMatch) return;
  
  const backupModelName = modelNameMatch[1];
  const backupModelNameLower = backupModelName.toLowerCase();
  
  // Check if current schema has this model with extra relations
  const currentRelations = relationMap.get(backupModelNameLower);
  if (!currentRelations || currentRelations.length === 0) return;
  
  // Check each relation from current schema
  currentRelations.forEach(relationLine => {
    // Extract field name from relation line
    const fieldMatch = relationLine.match(/^\s*(\w+)\s+(\w+)(\[\])?\s+@relation/);
    if (!fieldMatch) return;
    
    const fieldName = fieldMatch[1];
    const fieldType = fieldMatch[2];
    const isArray = fieldMatch[3] === '[]';
    
    // Check if this field exists in backup model
    const fieldExistsInBackup = backupModelBlock.includes(`${fieldName} `) || 
                                 backupModelBlock.includes(`${fieldName}\t`);
    
    if (!fieldExistsInBackup && isArray) {
      // This is a reverse relation that's missing in backup!
      console.log(`  ➕ Adding missing reverse relation: ${backupModelName}.${fieldName}`);
      
      // Insert before closing brace of the model
      const closeIndex = backupModelBlock.lastIndexOf('}');
      const beforeClose = backupModelBlock.substring(0, closeIndex);
      const updatedModel = beforeClose + `  ${relationLine}\n` + '}';
      
      mergedSchema = mergedSchema.replace(backupModelBlock, updatedModel);
      backupModelBlock = updatedModel; // Update for next iteration
      addedRelations++;
    }
  });
});

console.log(`✅ Adicionados ${addedRelations} relacionamentos reversos faltantes`);

// Write merged schema
fs.writeFileSync('prisma/schema.prisma', mergedSchema, 'utf8');
console.log('💾 Schema mesclado salvo em prisma/schema.prisma');
console.log('🔍 Execute: npx prisma format && npx prisma validate && npx prisma generate');
