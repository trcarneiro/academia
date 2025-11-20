const fs = require('fs');
const path = require('path');

const publicSrc = path.join(__dirname, '..', 'public');
const publicDest = path.join(__dirname, '..', 'dist', 'public');

console.log('📦 Copying public folder to dist...');
console.log('   From:', publicSrc);
console.log('   To:', publicDest);

try {
  // Use Node.js native recursive copy (Node 16.7+)
  fs.cpSync(publicSrc, publicDest, { recursive: true });
  console.log('✅ Public folder copied successfully!');
} catch (error) {
  console.error('❌ Error copying public folder:', error.message);
  process.exit(1);
}
