const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Running Academy Tests Suite\n');

const testFiles = [
    'tests/integration/financial-simple.test.js',
    'tests/integration/students-plans.test.js',
    'tests/integration/students-api.test.js',
    'tests/integration/billing-plans-api.test.js'
];

let passed = 0;
let failed = 0;

async function runTest(file) {
    const relativePath = path.relative(process.cwd(), file);
    console.log(`📋 Running: ${relativePath}`);
    
    try {
        const output = execSync(`npx vitest run ${file}`, { 
            encoding: 'utf8',
            stdio: 'pipe'
        });
        
        console.log(`✅ PASSED: ${relativePath}`);
        console.log(output);
        passed++;
    } catch (error) {
        console.log(`❌ FAILED: ${relativePath}`);
        console.log(error.stdout || error.message);
        failed++;
    }
    
    console.log('─'.repeat(50));
}

async function runAllTests() {
    console.log('Starting test execution...\n');
    
    for (const file of testFiles) {
        await runTest(file);
    }
    
    console.log('\n📊 Test Summary:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📋 Total: ${passed + failed}`);
    
    if (failed > 0) {
        console.log('\n⚠️  Some tests failed. Check the output above for details.');
        process.exit(1);
    } else {
        console.log('\n🎉 All tests passed!');
        process.exit(0);
    }
}

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n🛑 Tests interrupted by user');
    process.exit(0);
});

// Run tests
runAllTests().catch(error => {
    console.error('Error running tests:', error);
    process.exit(1);
});
