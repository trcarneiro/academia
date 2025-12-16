const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const versionJsonPath = path.join(__dirname, '..', 'version.json');

function bumpVersion(type = 'patch') {
    try {
        // 1. Read package.json
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        const currentVersion = packageJson.version;
        const [major, minor, patch] = currentVersion.split('.').map(Number);

        let newVersion;
        if (type === 'major') {
            newVersion = `${major + 1}.0.0`;
        } else if (type === 'minor') {
            newVersion = `${major}.${minor + 1}.0`;
        } else {
            newVersion = `${major}.${minor}.${patch + 1}`;
        }

        // 2. Update package.json
        packageJson.version = newVersion;
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 4));
        console.log(`✅ Bumped version from ${currentVersion} to ${newVersion}`);

        // 3. Update version.json (Changelog) if it exists
        if (fs.existsSync(versionJsonPath)) {
            try {
                const versionHistory = JSON.parse(fs.readFileSync(versionJsonPath, 'utf-8'));
                
                // Add new entry
                const newEntry = {
                    id: Date.now(),
                    timestamp: new Date().toISOString(),
                    version: newVersion,
                    description: "Auto-bumped version",
                    files: {}
                };
                
                // Prepend to history
                versionHistory.unshift(newEntry);
                
                fs.writeFileSync(versionJsonPath, JSON.stringify(versionHistory, null, 2));
                console.log(`✅ Updated version.json history`);
            } catch (err) {
                console.warn('⚠️ Could not update version.json:', err.message);
            }
        }

        return newVersion;

    } catch (error) {
        console.error('❌ Error bumping version:', error);
        process.exit(1);
    }
}

// Get type from args
const type = process.argv[2] || 'patch';
bumpVersion(type);
