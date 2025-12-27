const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths
const packageJsonPath = path.join(__dirname, '../package.json');
const agentsMdPath = path.join(__dirname, '../AGENTS.md');

// Read package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const newVersion = packageJson.version;

// Read AGENTS.md
let agentsMd = fs.readFileSync(agentsMdPath, 'utf8');

// Update Version
const versionRegex = /\*\*Versão\*\*: .*/;
if (versionRegex.test(agentsMd)) {
    agentsMd = agentsMd.replace(versionRegex, `**Versão**: ${newVersion}`);
} else {
    console.error('Could not find version pattern in AGENTS.md');
    process.exit(1);
}

// Update Date
const dateRegex = /\*\*Última atualização\*\*: .*/;
const today = new Date();
const formattedDate = today.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
});

if (dateRegex.test(agentsMd)) {
    agentsMd = agentsMd.replace(dateRegex, `**Última atualização**: ${formattedDate}`);
} else {
    console.error('Could not find date pattern in AGENTS.md');
    process.exit(1);
}

// Write AGENTS.md
fs.writeFileSync(agentsMdPath, agentsMd);

console.log(`Updated AGENTS.md to version ${newVersion} and date ${formattedDate}`);

// Git add AGENTS.md so it is included in the version commit
try {
    execSync(`git add ${agentsMdPath}`);
    console.log('Staged AGENTS.md for commit');
} catch (error) {
    console.error('Failed to stage AGENTS.md', error);
    process.exit(1);
}
