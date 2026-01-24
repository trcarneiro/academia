const fs = require('fs');
const path = require('path');

const publicSrc = path.join(__dirname, '..', 'public');
const publicDest = path.join(__dirname, '..', 'dist', 'public');
const packageJsonPath = path.join(__dirname, '..', 'package.json');

// Ler versão do package.json
let version = '1.0.0';
try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  version = packageJson.version;
  console.log(`📌 Version found: ${version}`);
} catch (e) {
  console.warn('⚠️ Could not read package.json version, using default');
}

console.log('📦 Copying public folder to dist...');
console.log('   From:', publicSrc);
console.log('   To:', publicDest);

try {
  // Use Node.js native recursive copy (Node 16.7+)
  fs.cpSync(publicSrc, publicDest, { recursive: true });
  console.log('✅ Public folder copied successfully!');

  // Lista de arquivos para injetar versão
  const htmlFiles = ['index.html', 'login.html'];

  htmlFiles.forEach(file => {
    const filePath = path.join(publicDest, file);
    if (fs.existsSync(filePath)) {
      console.log(`🔧 Injecting version directly to ${file}...`);
      let content = fs.readFileSync(filePath, 'utf8');

      // Substituir CSS
      // Regex procura por .css" ou .css?v=..." e substitui por .css?v=VERSAO"
      content = content.replace(/(\.css)(\?v=[^"]*)?"/g, `\$1?v=${version}"`);

      // Substituir JS (módulos e scripts normais)
      content = content.replace(/(\.js)(\?v=[^"]*)?"/g, `\$1?v=${version}"`);

      fs.writeFileSync(filePath, content);
      console.log(`   ✨ Updated ${file} with version ${version}`);
    }
  });

} catch (error) {
  console.error('❌ Error copying public folder:', error.message);
  process.exit(1);
}
