// Quick fix para corrigir problema de validação do campo classesPerWeek
// Executar: node fix-classes-field.js

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'public/js/modules/packages/index.js');

// Ler arquivo
let content = fs.readFileSync(filePath, 'utf8');

// Substituição 1: Corrigir primeira ocorrência (linha ~925)
const oldPattern1 = "document.getElementById('classesPerWeek').value = packageData.classesPerWeek || '';";
const newPattern1 = `// Para planos ilimitados ou com 0 aulas, deixar campo vazio para evitar erro de validação
                const classesValue = packageData.isUnlimitedAccess || packageData.classesPerWeek === 0 ? '' : (packageData.classesPerWeek || '');
                document.getElementById('classesPerWeek').value = classesValue;`;

content = content.replace(oldPattern1, newPattern1);

// Substituição 2: Corrigir segunda ocorrência (linha ~1163) 
content = content.replace(oldPattern1, newPattern1);

// Salvar arquivo
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Arquivo corrigido com sucesso!');
console.log('🔧 Problema do classesPerWeek com valor 0 foi resolvido.');
