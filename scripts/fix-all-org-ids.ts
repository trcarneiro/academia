#!/usr/bin/env npx tsx

/**
 * 🔧 Fix All Organization IDs
 * Substitui todas as ocorrências do ID antigo pelo novo
 */

import fs from 'fs';
import path from 'path';

const OLD_ID = 'a55ad715-2eb0-493c-996c-bb0f60bacec9';
const NEW_ID = '452c0b35-1822-4890-851e-922356c812fb';

// Arquivos críticos para atualizar
const FILES_TO_UPDATE = [
  'src/routes/subscriptions.ts',
  'src/routes/packages-simple.ts',
  'src/routes/frequency.ts',
  'public/js/modules/packages/index.js',
  'public/js/shared/api-client.js',
];

let totalReplacements = 0;

FILES_TO_UPDATE.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Arquivo não encontrado: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf-8');
  const beforeCount = (content.match(new RegExp(OLD_ID, 'g')) || []).length;
  
  if (beforeCount === 0) {
    console.log(`✅ ${file} - Já estava correto`);
    return;
  }
  
  content = content.replaceAll(OLD_ID, NEW_ID);
  fs.writeFileSync(filePath, content, 'utf-8');
  
  totalReplacements += beforeCount;
  console.log(`✅ ${file} - ${beforeCount} substituição(ões)`);
});

console.log(`\n🎉 Total: ${totalReplacements} substituições em ${FILES_TO_UPDATE.length} arquivos`);
console.log(`\n📝 ID Antigo: ${OLD_ID}`);
console.log(`✅ ID Novo: ${NEW_ID}`);
