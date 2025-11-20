const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const archiveDir = path.join(rootDir, '.archive');

// Files to ALWAYS keep in root
const KEEP_FILES = [
  '.env',
  '.env.example',
  '.env.production',
  '.eslintrc.js',
  '.git',
  '.gitignore',
  '.github',
  '.npmrc',
  '.prettierrc',
  'AGENTS.md',
  'DEPLOY_RENDER.md',
  'Dockerfile',
  'Dockerfile.dev',
  'README.md',
  'README-DEPLOY.md',
  'docker-compose.yml',
  'docker-compose.dev.yml',
  'ecosystem.config.js',
  'nginx.conf',
  'package.json',
  'package-lock.json',
  'render.yaml',
  'tsconfig.json',
  'vercel.json',
  'version.json',
  'node_modules',
  'dist',
  'src',
  'public',
  'prisma',
  'scripts',
  'tests',
  'docs',
  'logs',
  'certs',
  'backup',
  'backups',
  'migrations',
  'models',
  'services', // if exists in root
  'utils',    // if exists in root
  'routes',   // if exists in root
  'middlewares', // if exists in root
  'schemas',   // if exists in root
  'api',       // if exists in root
  'templates', // if exists in root
  'tools',     // if exists in root
  '.archive',
  '.claude',
  '.reports',
  '.idea',
  '.vscode'
];

// Patterns to archive
const ARCHIVE_PATTERNS = [
  /^asaas-.*\.(json|sql|csv|js|ts)$/,
  /^audit-report-.*\.(json|txt|md)$/,
  /^check-.*\.(js|ts|mjs)$/,
  /^create-.*\.(js|ts|mjs)$/,
  /^debug-.*\.(js|ts|mjs|log|html)$/,
  /^fix-.*\.(js|ts|ps1|py|md)$/,
  /^import-.*\.(js|ts|ps1)$/,
  /^test-.*\.(js|ts|ps1|json|sh|html)$/,
  /^setup-.*\.(js|ts)$/,
  /^reset-.*\.(js|ts)$/,
  /^update-.*\.(sh)$/,
  /^verify-.*\.(js|ts)$/,
  /^analyze-.*\.(js|ts)$/,
  /^associate-.*\.(ts)$/,
  /^clean-.*\.(ts|bat)$/,
  /^convert-.*\.(ps1)$/,
  /^delete-.*\.(mjs)$/,
  /^demo-.*\.(js)$/,
  /^enroll-.*\.(mjs)$/,
  /^find-.*\.(ts)$/,
  /^force-.*\.(ps1|html)$/,
  /^generate-.*\.(ts)$/,
  /^investigate-.*\.(js)$/,
  /^krav-maga-.*\.(ts)$/,
  /^link-.*\.(ts)$/,
  /^merge-.*\.(js)$/,
  /^move-.*\.(bat)$/,
  /^normalize-.*\.(js)$/,
  /^populate-.*\.(ts)$/,
  /^recreate-.*\.(js)$/,
  /^rename-.*\.(js)$/,
  /^sanitizacao.*\.(bat|txt)$/,
  /^save-.*\.(js)$/,
  /^search-.*\.(js)$/,
  /^seed-.*\.(ts)$/,
  /^server-.*\.(sh|txt)$/,
  /^temp-.*\.(ts)$/,
  /^validate-.*\.(txt)$/,
  /^.*\.txt$/,
  /^.*\.pdf$/,
  /^.*\.csv$/,
  /^.*\.xlsx$/,
  /^.*\.bat$/, // Be careful with this one
  /^.*\.sql$/,
  /^.*\.log$/,
  /^AGENT_.*\.md$/, // Old agent logs
  /^ASAAS_.*\.md$/,
  /^AUDIT_.*\.md$/,
  /^AUDITORIA_.*\.md$/,
  /^BACKUP_.*$/,
  /^CHECK_.*\.md$/,
  /^CHECKIN_.*\.md$/,
  /^DEPLOY_MANUAL_.*\.md$/,
  /^FASE_.*\.md$/,
  /^FINAL_.*\.txt$/,
  /^FIX_.*\.md$/,
  /^FIX_.*\.ts$/,
  /^GRADUATION_.*\.md$/,
  /^INSTRUCTORS_.*\.md$/,
  /^INSTRUCTOR_.*\.md$/,
  /^LEIA_ME_.*\.txt$/,
  /^MIGRATION_.*\.md$/,
  /^MOVIMENTO_.*\.txt$/,
  /^OLD_.*$/,
  /^ORGANIZACAO_.*\.md$/,
  /^ORGANIZATION_.*\.md$/,
  /^PHASE1_.*$/,
  /^SANITIZACAO_.*\.txt$/,
  /^SOLUCAO_.*$/,
  /^SUPABASE_.*\.md$/,
  /^UI_.*\.md$/,
  /^UX_.*\.md$/,
  /^VERCEL_.*\.md$/,
  /^build_errors\.txt$/,
  /^build-log\.txt$/
];

function shouldArchive(filename) {
  if (KEEP_FILES.includes(filename)) return false;
  
  // Check if it matches any archive pattern
  for (const pattern of ARCHIVE_PATTERNS) {
    if (pattern.test(filename)) return true;
  }
  
  return false;
}

function runAudit() {
  const files = fs.readdirSync(rootDir);
  const toArchive = [];
  const unknown = [];

  files.forEach(file => {
    const stats = fs.statSync(path.join(rootDir, file));
    if (shouldArchive(file)) {
      toArchive.push({ file, size: stats.size, isDir: stats.isDirectory() });
    } else if (!KEEP_FILES.includes(file)) {
      unknown.push(file);
    }
  });

  const report = `# Relatório de Auditoria de Limpeza

**Data:** ${new Date().toISOString()}
**Total de arquivos para arquivar:** ${toArchive.length}
**Total de arquivos desconhecidos:** ${unknown.length}

## 📦 Arquivos para Arquivar (.archive/)
Estes arquivos parecem ser scripts temporários, logs, relatórios ou backups antigos.

${toArchive.map(f => `- [ ] ${f.file} (${(f.size / 1024).toFixed(2)} KB)`).join('\n')}

## ❓ Arquivos Desconhecidos (Revisar)
Estes arquivos não estão na lista de "Manter" nem na lista de "Arquivar".

${unknown.map(f => `- [ ] ${f}`).join('\n')}

## ✅ Arquivos Mantidos (Produção/Config)
Estes arquivos permanecerão na raiz.

${KEEP_FILES.filter(f => fs.existsSync(path.join(rootDir, f))).map(f => `- ${f}`).join('\n')}
`;

  fs.writeFileSync(path.join(rootDir, 'CLEANUP_AUDIT.md'), report);
  console.log('Relatório gerado em CLEANUP_AUDIT.md');
}

runAudit();
