
const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
let content = fs.readFileSync(schemaPath, 'utf8');

console.log('🔄 Converting String[] to Json in schema.prisma...');

// Replace String[] with Json
// Handle cases with default values too
// Case 1: String[] @default([]) -> Json @default("[]")
content = content.replace(/String\[\]\s+@default\(\[\]\)/g, 'Json @default("[]")');

// Case 2: String[] (no default) -> Json
content = content.replace(/String\[\]/g, 'Json');

// Case 3: Fix Float[] (Embeddings)
content = content.replace(/Float\[\]/g, 'Json');

// Case 4: Fix @db.Timestamptz
content = content.replace(/@db\.Timestamptz\(\d+\)/g, '');
content = content.replace(/@db\.Timestamptz/g, '');

// Case 6: Fix scalar Enum arrays (e.g. SpecialNeed[])
// We replace specific known enum arrays or try a generic catch for capitalized types that aren't handling relations well?
// Safer to list known ones or just SpecialNeed[] for now.
content = content.replace(/SpecialNeed\[\]/g, 'Json');
content = content.replace(/ObjectiveMapping\[\]/g, 'Json'); // If used

// Case 7: Fix Json[] -> Json
content = content.replace(/Json\[\]/g, 'Json');

// Case 8: catch-all for any other scalar lists (String[], Int[], Enum[])
// Prisma scalar lists are Type[]
// But relations are Model[]
// Ideally we'd parse the schema, but regex is acceptable for these specific errors.

// Case 9: Fix Postgres dbgenerated UUID
content = content.replace(/@default\(dbgenerated\("\(gen_random_uuid\(\)\)::text"\)\)/g, '@default(uuid())');
content = content.replace(/@default\(dbgenerated\("gen_random_uuid\(\)"\)\)/g, '@default(uuid())');

fs.writeFileSync(schemaPath, content);
console.log('✅ Done! Schema patched for MySQL compatibility.');
