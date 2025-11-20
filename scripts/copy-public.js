const fs = require('fs-extra');
const path = require('path');

const publicSrc = path.join(__dirname, '..', 'public');
const publicDest = path.join(__dirname, '..', 'dist', 'public');

console.log('📦 Copying public folder to dist...');
console.log('   From:', publicSrc);
console.log('   To:', publicDest);

fs.copySync(publicSrc, publicDest, { overwrite: true });
console.log('✅ Public folder copied successfully!');
