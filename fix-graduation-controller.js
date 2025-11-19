const fs = require('fs');

const file = 'src/controllers/graduationController.ts';
let content = fs.readFileSync(file, 'utf8');

console.log('📝 Fixing graduationController.ts...');

// Replace turmaLesson: with lesson:
const before = content.match(/turmaLesson:/g)?.length || 0;
content = content.replace(/turmaLesson:/g, 'lesson:');
const after1 = content.match(/lesson:/g)?.length || 0;

// Replace checkin.turmaLesson with checkin.lesson  
const before2 = content.match(/checkin\.turmaLesson/g)?.length || 0;
content = content.replace(/checkin\.turmaLesson/g, 'checkin.lesson');
const after2 = content.match(/checkin\.lesson/g)?.length || 0;

fs.writeFileSync(file, content, 'utf8');

console.log(`✅ Fixed ${before} occurrences of "turmaLesson:" to "lesson:"`);
console.log(`✅ Fixed ${before2} occurrences of "checkin.turmaLesson" to "checkin.lesson"`);
console.log('✅ File saved successfully!');
