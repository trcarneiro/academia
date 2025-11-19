const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'public', 'js', 'modules', 'graduation', 'index.js');

console.log('📝 Reading file...');
let content = fs.readFileSync(filePath, 'utf8');

// Find and replace the updateActivityRatingInline function
const oldFunction = `            if (response.success) {
                const activity = this.selectedStudentData.activities.find(a => a.id === activityId);
                if (activity) {
                    activity.qualitativeRating = rating;
                }

                const tableBody = document.getElementById('activitiesTableBody');
                if (tableBody) {
                    tableBody.innerHTML = this.renderActivitiesRows(this.selectedStudentData.activities);
                }

                this.showToast(\`✅ Avaliação salva: \${rating} \${rating === 1 ? 'estrela' : 'estrelas'}\`, 'success');`;

const newFunction = `            if (response.success) {
                // ✅ Reload full student data to update badges and stats
                await this.showStudentDetail(student.id);
                
                this.showToast(\`✅ Avaliação salva: \${rating} \${rating === 1 ? 'estrela' : 'estrelas'}\`, 'success');`;

console.log('🔍 Searching for function to replace...');
if (content.includes(oldFunction)) {
    console.log('✅ Found! Replacing...');
    content = content.replace(oldFunction, newFunction);
    
    console.log('💾 Writing file...');
    fs.writeFileSync(filePath, content, 'utf8');
    
    console.log('✅ File updated successfully!');
    console.log('');
    console.log('📋 What changed:');
    console.log('   ❌ OLD: Update activity locally + re-render table');
    console.log('   ✅ NEW: Reload full data from server (updates badges automatically)');
    console.log('');
    console.log('🔄 NEXT STEPS:');
    console.log('1. Hard refresh browser: Ctrl+Shift+R');
    console.log('2. Click on Pedro Teste');
    console.log('3. Click stars on any activity');
    console.log('4. Badge should change from gray to yellow!');
} else {
    console.log('❌ Pattern not found!');
    console.log('');
    console.log('Checking if already applied...');
    if (content.includes('await this.showStudentDetail(student.id)')) {
        console.log('✅ Fix already applied!');
    } else {
        console.log('⚠️ Manual intervention needed');
    }
}
