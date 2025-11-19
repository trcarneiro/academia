const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'public', 'js', 'modules', 'graduation', 'index.js');

console.log('📝 Reading file...');
let content = fs.readFileSync(file, 'utf-8');

console.log('📊 File size:', content.length, 'chars');

// Check if already has functions
if (content.includes('renderClickableStars(activityId')) {
    console.log('✅ Functions already exist!');
    process.exit(0);
}

// Find exact marker
const marker = `    renderStarsInline(rating) {
        if (rating === 0) return '<span class="text-muted">Não avaliado</span>';
        return '⭐'.repeat(rating);
    },


    // ============================================
    // BULK EDIT FUNCTIONS
    // ============================================

    toggleActivitySelection(checkbox) {`;

if (!content.includes(marker)) {
    console.error('❌ Marker not found in file!');
    console.log('Looking for lines around renderStarsInline...');
    const lines = content.split('\n');
    const idx = lines.findIndex(l => l.includes('renderStarsInline(rating)'));
    if (idx >= 0) {
        console.log('Found at line', idx + 1);
        console.log('Context:');
        for (let i = Math.max(0, idx - 2); i < Math.min(lines.length, idx + 15); i++) {
            console.log(`${i + 1}: ${lines[i]}`);
        }
    }
    process.exit(1);
}

console.log('✅ Marker found, injecting functions...');

const replacement = `    renderStarsInline(rating) {
        if (rating === 0) return '<span class="text-muted">Não avaliado</span>';
        return '⭐'.repeat(rating);
    },

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


    // ============================================
    // BULK EDIT FUNCTIONS
    // ============================================

    toggleActivitySelection(checkbox) {`;

content = content.replace(marker, replacement);

console.log('💾 Writing file...');
fs.writeFileSync(file, content, 'utf-8');

console.log('✅ Functions added successfully!');
console.log('');
console.log('🔍 Verification:');
const verify = fs.readFileSync(file, 'utf-8');
console.log('  - Has renderClickableStars:', verify.includes('renderClickableStars(activityId'));
console.log('  - Has updateActivityRatingInline:', verify.includes('updateActivityRatingInline'));
console.log('');
console.log('🔄 Refresh browser with Ctrl+Shift+R');
