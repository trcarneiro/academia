/**
 * Script to fix Prisma schema for MySQL compatibility
 * Converts all array types (String[], Json[], Float[], Enum[]) to Json type
 */

const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');

console.log('Reading schema file...');
let schema = fs.readFileSync(schemaPath, 'utf8');

console.log('Backing up original schema...');
fs.writeFileSync(schemaPath + '.backup', schema);

console.log('Converting array types to Json...');

// Process line by line to preserve formatting
const lines = schema.split('\n');
const fixed = lines.map(line => {
  // Skip lines that already have Json @default
  if (line.includes('Json') && line.includes('@default')) {
    return line;
  }
  
  // Convert String[] to Json @default("[]")
  if (line.match(/\s+\w+\s+String\[\]/)) {
    return line.replace(/String\[\](.*)$/, 'Json $1@default("[]")').replace(/\s+@default/, ' @default');
  }
  
  // Convert Json[] to Json @default("[]")
  if (line.match(/\s+\w+\s+Json\[\]/)) {
    return line.replace(/Json\[\](.*)$/, 'Json $1@default("[]")').replace(/\s+@default/, ' @default');
  }
  
  // Convert Float[] to Json @default("[]")
  if (line.match(/\s+\w+\s+Float\[\]/)) {
    return line.replace(/Float\[\]/, 'Json @default("[]")');
  }
  
  // Convert enum arrays (SpecialNeed[], etc.) to Json
  if (line.match(/\s+\w+\s+[A-Z]\w+\[\]/) && !line.includes('Json')) {
    return line.replace(/[A-Z]\w+\[\]/, 'Json @default("[]")');
  }
  
  return line;
});

schema = fixed.join('\n');

console.log('Writing fixed schema...');
fs.writeFileSync(schemaPath, schema);

console.log('✅ Schema fixed successfully!');
console.log('Backup saved to: prisma/schema.prisma.backup');
console.log('\nNext steps:');
console.log('1. Run: npx prisma generate');
console.log('2. Run: npx prisma db push');
