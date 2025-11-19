$filePath = "h:\projetos\academia\public\js\modules\graduation\index.js"

Write-Host "⭐ Adicionando funções de estrelas clicáveis..." -ForegroundColor Cyan

# Read file
$content = Get-Content $filePath -Raw

# Check if already exists
if ($content -match "renderClickableStars\(activityId") {
    Write-Host "⚠️  Funções já existem!" -ForegroundColor Yellow
    exit 0
}

# The marker to find
$marker = @"
    renderStarsInline(rating) {
        if (rating === 0) return '<span class="text-muted">Não avaliado</span>';
        return '⭐'.repeat(rating);
    },


    // ============================================
    // BULK EDIT FUNCTIONS
    // ============================================
"@

# New code to inject
$newCode = @"
    renderStarsInline(rating) {
        if (rating === 0) return '<span class="text-muted">Não avaliado</span>';
        return '⭐'.repeat(rating);
    },

    /**
     * Render clickable stars for inline editing
     */
    renderClickableStars(activityId, currentRating) {
        const stars = [];
        for (let i = 1; i <= 3; i++) {
            const filled = i <= currentRating;
            stars.push(`<span class="star-clickable" 
                             onclick="window.graduationModule.updateActivityRatingInline('${'$'}{activityId}', ${'$'}{i}); event.stopPropagation();"
                             title="Avaliar: ${'$'}{i} ${'$'}{i === 1 ? 'estrela' : 'estrelas'}"
                             style="cursor: pointer; font-size: 1.2rem; margin-right: 2px;">
                        ${'$'}{filled ? '⭐' : '☆'}
                        </span>`);
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
            const response = await this.moduleAPI.request(`/api/graduation/student/${'$'}{student.id}/activity/${'$'}{activityId}`, {
                method: 'PUT',
                body: JSON.stringify({ 
                    qualitativeRating: rating 
                })
            });

            if (response.success) {
                // Update local data
                const activity = this.selectedStudentData.activities.find(a => a.id === activityId);
                if (activity) {
                    activity.qualitativeRating = rating;
                }

                // Re-render table
                const tableBody = document.getElementById('activitiesTableBody');
                if (tableBody) {
                    tableBody.innerHTML = this.renderActivitiesRows(this.selectedStudentData.activities);
                }

                // Show success toast
                this.showToast(`✅ Avaliação salva: ${'$'}{rating} ${'$'}{rating === 1 ? 'estrela' : 'estrelas'}`, 'success');
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
"@

# Replace
$content = $content -replace [regex]::Escape($marker), $newCode

# Save
$content | Out-File -FilePath $filePath -Encoding UTF8 -NoNewline

Write-Host "✅ Funções adicionadas com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Funções adicionadas:" -ForegroundColor Yellow
Write-Host "   - renderClickableStars(activityId, currentRating)"
Write-Host "   - updateActivityRatingInline(activityId, rating)"
Write-Host ""
Write-Host "🔄 Faça hard refresh no navegador (Ctrl+Shift+R)" -ForegroundColor Cyan
