const { execSync } = require('child_process');
const path = require('path');

const publicSrc = path.join(__dirname, '..', 'public');
const publicDest = path.join(__dirname, '..', 'dist', 'public');

console.log('📦 Copying public folder to dist...');
console.log('   From:', publicSrc);
console.log('   To:', publicDest);

try {
  // Use native cp command (faster, less memory)
  execSync(`cp -r "${publicSrc}" "${publicDest}"`, { stdio: 'inherit' });
  console.log('✅ Public folder copied successfully!');
} catch (error) {
  console.error('❌ Error copying public folder:', error.message);
  process.exit(1);
}
