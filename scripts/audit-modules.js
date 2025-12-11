const fs = require('fs');
const path = require('path');

const MODULES_DIR = path.join(__dirname, '../public/js/modules');
const CSS_DIR = path.join(__dirname, '../public/css/modules');

const CRITERIA = {
    apiClient: {
        label: 'API Client (createModuleAPI)',
        regex: /createModuleAPI\s*\(/,
        weight: 20
    },
    stateManagement: {
        label: 'State Mgmt (fetchWithStates)',
        regex: /fetchWithStates\s*\(/,
        weight: 20
    },
    premiumHeader: {
        label: 'Premium Header (.module-header-premium)',
        regex: /module-header-premium/,
        weight: 10
    },
    premiumCard: {
        label: 'Premium Card (.data-card-premium)',
        regex: /data-card-premium/,
        weight: 10
    },
    noModals: {
        label: 'No Modals',
        regex: /modal/i,
        negative: true, // If found, it fails (unless it's the new selector pattern, but simple check for now)
        weight: 20
    },
    cssIsolation: {
        label: 'CSS Isolation',
        check: (moduleName) => {
            const cssPath = path.join(CSS_DIR, `${moduleName}.css`);
            return fs.existsSync(cssPath);
        },
        weight: 10
    },
    appRegistration: {
        label: 'App Registration (module:loaded)',
        regex: /dispatchEvent\s*\(\s*['"]module:loaded['"]/,
        weight: 10
    }
};

function getModules() {
    const items = fs.readdirSync(MODULES_DIR, { withFileTypes: true });
    const modules = [];

    for (const item of items) {
        if (item.isDirectory()) {
            // Check for index.js
            const indexPath = path.join(MODULES_DIR, item.name, 'index.js');
            if (fs.existsSync(indexPath)) {
                modules.push({
                    name: item.name,
                    type: 'folder',
                    mainFile: indexPath
                });
            } else {
                // Maybe it has a file with the same name as the folder?
                const namedPath = path.join(MODULES_DIR, item.name, `${item.name}.js`);
                if (fs.existsSync(namedPath)) {
                    modules.push({
                        name: item.name,
                        type: 'folder',
                        mainFile: namedPath
                    });
                } else {
                    // Just scan all js files in the folder
                     const jsFiles = fs.readdirSync(path.join(MODULES_DIR, item.name)).filter(f => f.endsWith('.js'));
                     if (jsFiles.length > 0) {
                         // Concatenate content of all JS files for analysis
                         modules.push({
                             name: item.name,
                             type: 'folder-multi',
                             files: jsFiles.map(f => path.join(MODULES_DIR, item.name, f))
                         });
                     }
                }
            }
        } else if (item.isFile() && item.name.endsWith('.js')) {
            // Single file module at root of modules dir
            // We only include it if there isn't a folder with the same name (to avoid duplicates)
            const nameWithoutExt = path.parse(item.name).name;
            const folderPath = path.join(MODULES_DIR, nameWithoutExt);
            if (!fs.existsSync(folderPath)) {
                modules.push({
                    name: nameWithoutExt,
                    type: 'file',
                    mainFile: path.join(MODULES_DIR, item.name)
                });
            }
        }
    }
    return modules;
}

function analyzeModule(module) {
    let content = '';
    
    if (module.files) {
        module.files.forEach(f => {
            content += fs.readFileSync(f, 'utf8') + '\n';
        });
    } else {
        content = fs.readFileSync(module.mainFile, 'utf8');
    }

    const results = {};
    let score = 0;

    for (const [key, criterion] of Object.entries(CRITERIA)) {
        let passed = false;
        if (criterion.check) {
            passed = criterion.check(module.name);
        } else {
            const match = criterion.regex.test(content);
            passed = criterion.negative ? !match : match;
            
            // Exception for "No Modals": if it contains "selector-dialog" or similar new pattern, we might forgive "modal" if it's just in comments or legacy variable names that were refactored? 
            // For now, strict check. If "modal" is present, it fails.
            // Actually, let's refine: if it has "modal" but also "selector-dialog", maybe it's in transition?
            // Let's stick to the strict check as per "guard:no-modals".
        }

        results[key] = passed;
        if (passed) score += criterion.weight;
    }

    return {
        name: module.name,
        type: module.type,
        score,
        details: results
    };
}

const modules = getModules();
const report = modules.map(analyzeModule).sort((a, b) => b.score - a.score);

console.log(JSON.stringify(report, null, 2));

// Also print a summary table
console.log('\nSummary Table:');
console.log('Module'.padEnd(25) + 'Score'.padEnd(10) + 'Compliance');
console.log('-'.repeat(50));
report.forEach(m => {
    console.log(m.name.padEnd(25) + `${m.score}%`.padEnd(10) + (m.score === 100 ? '✅' : m.score >= 80 ? '⚠️' : '❌'));
});
