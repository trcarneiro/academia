const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'public', 'js', 'modules', 'graduation', 'index.js');

console.log('📝 Reading file...');
let content = fs.readFileSync(filePath, 'utf8');

console.log(`📊 Original file has ${content.split('\n').length} lines`);

// Count occurrences of PUT
const putCount = (content.match(/method: 'PUT'/g) || []).length;
console.log(`🔍 Found ${putCount} occurrences of method: 'PUT'`);

// Replace all PUT with PATCH
content = content.replace(/method: 'PUT'/g, "method: 'PATCH'");

// Count occurrences after replacement
const patchCount = (content.match(/method: 'PATCH'/g) || []).length;
console.log(`✅ Now has ${patchCount} occurrences of method: 'PATCH'`);

console.log('💾 Writing file...');
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ File updated successfully!');
console.log('');
console.log('🔄 NEXT STEPS:');
console.log('1. Hard refresh browser: Ctrl+Shift+R');
console.log('2. Test clicking on stars again');
console.log('3. Check console for PATCH requests (not PUT)');
