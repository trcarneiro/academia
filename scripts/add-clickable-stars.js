const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'public', 'js', 'modules', 'graduation', 'index.js');

console.log('⭐ Adicionando funções de estrelas clicáveis...');

let content = fs.readFileSync(filePath, 'utf-8');

// Find the location after renderStarsInline
const searchAfter = `    renderStarsInline(rating) {
        if (rating === 0) return '<span class="text-muted">Não avaliado</span>';
        return '⭐'.repeat(rating);
    },`;

const functionsToAdd = `

    /**
     * Render clickable stars for inline editing
     */
    renderClickableStars(activityId, currentRating) {
        const stars = [];
        for (let i = 1; i <= 3; i++) {
            const filled = i <= currentRating;
            const starClass = filled ? 'star-filled' : 'star-empty';
            stars.push(\`<span class="star-clickable \${starClass}" 
                             data-rating="\${i}" 
                             data-activity-id="\${activityId}"
                             onclick="window.graduationModule.updateActivityRatingInline('\${activityId}', \${i}); event.stopPropagation();"
                             title="Avaliar: \${i} \${i === 1 ? 'estrela' : 'estrelas'}"
                             style="cursor: pointer; font-size: 1.2rem; margin-right: 2px;">
                        \${filled ? '⭐' : '☆'}
                        </span>\`);
        }
        return stars.join('');
    },

    /**
     * Update activity rating inline (without opening modal)
     */
    async updateActivityRatingInline(activityId, rating) {
        try {
            const student = this.selectedStudentData?.student;
            if (!student) {
                console.error('No student selected');
                return;
            }

            // Call API to update rating
            const response = await this.moduleAPI.request(
                \`/api/graduation/student/\${student.id}/activity/\${activityId}\`,
                {
                    method: 'PUT',
                    body: JSON.stringify({
                        qualitativeRating: rating
                    })
                }
            );

            if (response.success) {
                // Update local data
                const activity = this.selectedStudentData.activities.find(a => a.id === activityId);
                if (activity) {
                    activity.qualitativeRating = rating;
                }

                // Re-render just the activities table
                const tableBody = document.getElementById('activitiesTableBody');
                if (tableBody) {
                    tableBody.innerHTML = this.renderActivitiesRows(this.selectedStudentData.activities || []);
                }
                
                // Show success toast
                this.showToast(\`✅ Avaliação salva: \${rating} \${rating === 1 ? 'estrela' : 'estrelas'}\`, 'success');
            } else {
                throw new Error(response.message || 'Erro ao salvar avaliação');
            }
        } catch (error) {
            console.error('Error updating rating:', error);
            this.showToast('❌ Erro ao salvar avaliação', 'error');
        }
    },`;

if (content.includes(searchAfter) && !content.includes('renderClickableStars')) {
    content = content.replace(searchAfter, searchAfter + functionsToAdd);
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('✅ Funções de estrelas clicáveis adicionadas!');
    console.log('   - renderClickableStars() criada');
    console.log('   - updateActivityRatingInline() criada');
} else if (content.includes('renderClickableStars')) {
    console.log('⚠️  Funções já existem no arquivo');
} else {
    console.log('❌ Não foi possível encontrar o local para inserir as funções');
}

console.log('\n🎯 Próximo passo: Hard refresh (Ctrl+Shift+R) no navegador');
