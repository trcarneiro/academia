const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'public', 'js', 'modules', 'graduation', 'index.js');

console.log('📝 Reading file...');
let content = fs.readFileSync(file, 'utf-8');

if (content.includes('renderClickableStars(activityId')) {
    console.log('✅ Functions already exist!');
    process.exit(0);
}

// Use regex to handle line ending variations
const pattern = /renderStarsInline\(rating\) \{[\r\n]+\s+if \(rating === 0\)[\s\S]+?return '⭐'\.repeat\(rating\);[\r\n]+\s+\},[\r\n]+[\r\n]+\s+\/\/ ============================================[\r\n]+\s+\/\/ BULK EDIT FUNCTIONS/;

const match = content.match(pattern);
if (!match) {
    console.error('❌ Pattern not found!');
    console.log('');
    console.log('Searching for renderStarsInline...');
    const idx = content.indexOf('renderStarsInline(rating)');
    if (idx >= 0) {
        console.log('Found at position', idx);
        console.log('Context:', content.substring(idx, idx + 300));
    }
    process.exit(1);
}

console.log('✅ Pattern found!');

const injection = `

    renderClickableStars(activityId, currentRating) {
        const stars = [];
        for (let i = 1; i <= 3; i++) {
            const filled = i <= currentRating;
            stars.push(\`<span class="star-clickable" 
                             onclick="window.graduationModule.updateActivityRatingInline('\${activityId}', \${i}); event.stopPropagation();"
                             title="Avaliar: \${i} \${i === 1 ? 'estrela' : 'estrelas'}"
                             style="cursor: pointer; font-size: 1.2rem; margin-right: 2px;">
                        \${filled ? '⭐' : '☆'}
                        </span>\`);
        }
        return stars.join('');
    },

    async updateActivityRatingInline(activityId, rating) {
        try {
            const student = this.selectedStudentData?.student;
            if (!student) {
                console.error('No student selected');
                return;
            }

            const response = await this.moduleAPI.request(\`/api/graduation/student/\${student.id}/activity/\${activityId}\`, {
                method: 'PUT',
                body: JSON.stringify({ qualitativeRating: rating })
            });

            if (response.success) {
                const activity = this.selectedStudentData.activities.find(a => a.id === activityId);
                if (activity) {
                    activity.qualitativeRating = rating;
                }

                const tableBody = document.getElementById('activitiesTableBody');
                if (tableBody) {
                    tableBody.innerHTML = this.renderActivitiesRows(this.selectedStudentData.activities);
                }

                this.showToast(\`✅ Avaliação salva: \${rating} \${rating === 1 ? 'estrela' : 'estrelas'}\`, 'success');
            } else {
                this.showToast('❌ Erro ao salvar avaliação', 'error');
            }
        } catch (error) {
            console.error('Error updating rating inline:', error);
            this.showToast('❌ Erro ao salvar avaliação', 'error');
        }
    },
`;

// Insert after renderStarsInline, before BULK EDIT FUNCTIONS
const replacement = match[0] + injection;
content = content.replace(match[0], replacement);

console.log('💾 Writing file...');
fs.writeFileSync(file, content, 'utf-8');

console.log('✅ Functions injected!');
console.log('');
const verify = fs.readFileSync(file, 'utf-8');
console.log('🔍 Verification:');
console.log('  - Has renderClickableStars:', verify.includes('renderClickableStars(activityId'));
console.log('  - Has updateActivityRatingInline:', verify.includes('updateActivityRatingInline'));
console.log('');
console.log('🔄 HARD REFRESH: Ctrl+Shift+R');
