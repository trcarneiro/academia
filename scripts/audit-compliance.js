const fs = require('fs');
const path = require('path');

const MODULES_DIR = path.join(__dirname, '../public/js/modules');
const CSS_DIR = path.join(__dirname, '../public/css/modules');

// Helper to read file content safely
function readFile(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            return fs.readFileSync(filePath, 'utf8');
        }
    } catch (e) {
        return '';
    }
    return '';
}

// Helper to recursively get all JS files in a directory
function getAllJsFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function(file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllJsFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            if (file.endsWith('.js')) {
                arrayOfFiles.push(path.join(dirPath, "/", file));
            }
        }
    });

    return arrayOfFiles;
}

function analyzeModule(moduleName, modulePath, isDirectory) {
    let content = '';
    let fileCount = 0;

    if (isDirectory) {
        const files = getAllJsFiles(modulePath);
        fileCount = files.length;
        files.forEach(f => content += readFile(f) + '\n');
    } else {
        content = readFile(modulePath);
        fileCount = 1;
    }

    // Check CSS file if exists
    const cssPath = path.join(CSS_DIR, `${moduleName}.css`);
    const cssContent = readFile(cssPath);

    const score = {
        apiClient: 0,
        premiumUI: 0,
        noModals: 0,
        stateManagement: 0,
        structure: 0,
        total: 0,
        issues: []
    };

    // 1. API Client (30%)
    if (content.includes('createModuleAPI') || content.includes('moduleAPI')) {
        score.apiClient = 30;
    } else {
        score.issues.push('Missing API Client');
    }

    // 2. Premium UI (30%)
    // Check in JS (for dynamic rendering) or CSS
    const hasHeader = content.includes('module-header-premium') || cssContent.includes('module-header-premium');
    const hasCard = content.includes('data-card-premium') || cssContent.includes('data-card-premium');
    
    if (hasHeader) score.premiumUI += 15;
    else score.issues.push('Missing Premium Header');
    
    if (hasCard) score.premiumUI += 15;
    else score.issues.push('Missing Premium Card');

    // 3. No Modals (20%)
    // We look for "modal" class usage or IDs, but exclude "selector-dialog" or comments saying "no modals"
    // Simple check: if it has "modal" and not "no-modal" guard comments
    const modalMatches = (content.match(/class\s*=\s*["'][^"']*modal[^"']*["']/gi) || []).length + 
                         (content.match(/id\s*=\s*["'][^"']*modal[^"']*["']/gi) || []).length;
    
    if (modalMatches === 0) {
        score.noModals = 20;
    } else {
        // Check if they are false positives or legacy
        score.issues.push(`Detected ${modalMatches} modal references`);
    }

    // 4. State Management (10%)
    if (content.includes('fetchWithStates') || (content.includes('loading') && content.includes('error'))) {
        score.stateManagement = 10;
    } else {
        score.issues.push('Weak State Management');
    }

    // 5. Structure (10%)
    // If directory and has index.js or controllers, or if single file < 1000 lines (arbitrary complexity check)
    if (isDirectory) {
        if (fs.existsSync(path.join(modulePath, 'index.js'))) {
            score.structure = 10;
        } else {
            score.issues.push('Directory missing index.js');
        }
    } else {
        if (content.split('\n').length < 1500) {
            score.structure = 10;
        } else {
            score.issues.push('File too large (>1500 lines)');
        }
    }

    score.total = score.apiClient + score.premiumUI + score.noModals + score.stateManagement + score.structure;
    return score;
}

function main() {
    const items = fs.readdirSync(MODULES_DIR);
    const results = [];

    items.forEach(item => {
        // Skip some known non-modules or backups
        if (item.includes('backup') || item.includes('old') || item.includes('test')) return;

        const itemPath = path.join(MODULES_DIR, item);
        const isDirectory = fs.statSync(itemPath).isDirectory();
        
        // If it's a file, remove extension for name
        const name = isDirectory ? item : path.parse(item).name;
        
        // Skip if we already processed this module (e.g. if both folder and .js exist, prefer folder)
        if (results.find(r => r.name === name)) return;

        const analysis = analyzeModule(name, itemPath, isDirectory);
        results.push({
            name,
            type: isDirectory ? 'Multi-file' : 'Single-file',
            ...analysis
        });
    });

    // Sort by score ascending
    results.sort((a, b) => a.total - b.total);

    console.log('| Module | Type | Score | Issues |');
    console.log('|--------|------|-------|--------|');
    results.forEach(r => {
        const issues = r.issues.length > 0 ? r.issues.slice(0, 2).join(', ') + (r.issues.length > 2 ? '...' : '') : '✅ Compliant';
        const icon = r.total >= 90 ? '🟢' : (r.total >= 50 ? '🟡' : '🔴');
        console.log(`| ${icon} **${r.name}** | ${r.type} | **${r.total}%** | ${issues} |`);
    });
}

main();
