const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const archiveDir = path.join(rootDir, '.archive', `cleanup-${timestamp}`);

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
  'services',
  'utils',
  'routes',
  'middlewares',
  'schemas',
  'api',
  'templates',
  'tools',
  '.archive',
  '.claude',
  '.reports',
  '.idea',
  '.vscode'
];

// Patterns to archive (SAME AS AUDIT)
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
  /^.*\.bat$/,
  /^.*\.sql$/,
  /^.*\.log$/,
  /^AGENT_.*\.md$/,
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
  for (const pattern of ARCHIVE_PATTERNS) {
    if (pattern.test(filename)) return true;
  }
  return false;
}

function performCleanup() {
  if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir, { recursive: true });
  }

  const files = fs.readdirSync(rootDir);
  let movedCount = 0;

  files.forEach(file => {
    if (shouldArchive(file)) {
      const oldPath = path.join(rootDir, file);
      const newPath = path.join(archiveDir, file);
      
      try {
        fs.renameSync(oldPath, newPath);
        console.log(`Moved: ${file}`);
        movedCount++;
      } catch (err) {
        console.error(`Failed to move ${file}:`, err.message);
      }
    }
  });

  console.log(`\n✅ Cleanup complete! Moved ${movedCount} files to ${archiveDir}`);
}

performCleanup();
