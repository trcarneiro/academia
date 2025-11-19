const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'public', 'js', 'modules', 'graduation', 'index.js');

console.log('📝 Aplicando patch para Bulk Edit + Origin Badges...\n');

let content = fs.readFileSync(filePath, 'utf8');

// 1. Substituir renderActivitiesRows
const oldRenderActivities = `    /**
     * Render activities table rows - DOUBLE-CLICK TO EDIT (AGENTS.md pattern)
     */
    renderActivitiesRows(activities) {
        if (!activities || activities.length === 0) {
            return \`
                <tr>
                    <td colspan="7" class="empty-table-cell">
                        <div class="empty-state-small">
                            <p>📭 Nenhuma atividade registrada</p>
                        </div>
                    </td>
                </tr>
            \`;
        }

        return activities.map((activity, index) => {
            const completion = activity.quantitativeTarget > 0 
                ? Math.round((activity.quantitativeProgress / activity.quantitativeTarget) * 100) 
                : 0;

            return \`
                <tr 
                    data-activity-id="\${activity.id}" 
                    ondblclick="window.graduationModule.navigateToActivityEdit('\${activity.id}')"
                    style="cursor: pointer;"
                    title="Duplo-clique para editar"
                >
                    <td>\${activity.lessonNumber || index + 1}</td>
                    <td>
                        <strong>\${activity.name}</strong><br>
                        <small class="text-muted">\${activity.lessonTitle || ''}</small>
                    </td>
                    <td><span class="badge-category">\${activity.category}</span></td>
                    <td>
                        <div class="progress-inline">
                            <span class="progress-text">\${activity.quantitativeProgress || 0}</span>
                            <div class="progress-bar-mini" style="width: 100%; height: 4px; background: #e0e0e0; border-radius: 2px; margin-top: 4px;">
                                <div style="width: \${completion}%; height: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 2px;"></div>
                            </div>
                        </div>
                    </td>
                    <td>\${activity.quantitativeTarget || 0}</td>
                    <td>
                        <span class="rating-display">
                            \${this.renderStarsInline(activity.qualitativeRating || 0)}
                        </span>
                    </td>
                    <td><span class="badge-source">\${this.translateSource(activity.source)}</span></td>
                </tr>
            \`;
        }).join('');
    },`;

const newRenderActivities = `    /**
     * Render activities table rows - DOUBLE-CLICK TO EDIT (AGENTS.md pattern)
     */
    renderActivitiesRows(activities) {
        if (!activities || activities.length === 0) {
            return \`
                <tr>
                    <td colspan="8" class="empty-table-cell">
                        <div class="empty-state-small">
                            <p>📭 Nenhuma atividade registrada</p>
                        </div>
                    </td>
                </tr>
            \`;
        }

        return activities.map((activity, index) => {
            const completion = activity.quantitativeTarget > 0 
                ? Math.round((activity.quantitativeProgress / activity.quantitativeTarget) * 100) 
                : 0;

            // Determine origem baseado em múltiplos fatores
            let originBadge = '';
            const hasManualRating = activity.qualitativeRating && activity.qualitativeRating > 0;
            const hasCheckInProgress = activity.quantitativeProgress >= activity.quantitativeTarget;
            
            if (hasManualRating && hasCheckInProgress) {
                originBadge = '<span class="badge-source badge-both" title="Qualificado por Check-in E Manual">✓ Check-in + Manual</span>';
            } else if (hasManualRating) {
                originBadge = '<span class="badge-source badge-manual" title="Avaliação manual pelo instrutor">✏️ Manual</span>';
            } else if (hasCheckInProgress) {
                originBadge = '<span class="badge-source badge-checkin" title="Meta atingida via check-in">✓ Check-in</span>';
            } else {
                originBadge = '<span class="badge-source badge-pending">⏳ Pendente</span>';
            }

            return \`
                <tr 
                    data-activity-id="\${activity.id}" 
                    ondblclick="window.graduationModule.navigateToActivityEdit('\${activity.id}')"
                    style="cursor: pointer;"
                    title="Duplo-clique para editar"
                >
                    <td style="text-align: center;">
                        <input 
                            type="checkbox" 
                            class="activity-checkbox" 
                            data-activity-id="\${activity.id}"
                            onclick="event.stopPropagation(); window.graduationModule.toggleActivitySelection(this)"
                            style="cursor: pointer; width: 18px; height: 18px;"
                        />
                    </td>
                    <td>\${activity.lessonNumber || index + 1}</td>
                    <td>
                        <strong>\${activity.name}</strong><br>
                        <small class="text-muted">\${activity.lessonTitle || ''}</small>
                    </td>
                    <td><span class="badge-category">\${activity.category}</span></td>
                    <td>
                        <div class="progress-inline">
                            <span class="progress-text">\${activity.quantitativeProgress || 0}</span>
                            <div class="progress-bar-mini" style="width: 100%; height: 4px; background: #e0e0e0; border-radius: 2px; margin-top: 4px;">
                                <div style="width: \${completion}%; height: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 2px;"></div>
                            </div>
                        </div>
                    </td>
                    <td>\${activity.quantitativeTarget || 0}</td>
                    <td>
                        <span class="rating-display">
                            \${this.renderStarsInline(activity.qualitativeRating || 0)}
                        </span>
                    </td>
                    <td>\${originBadge}</td>
                </tr>
            \`;
        }).join('');
    },`;

if (content.includes(oldRenderActivities)) {
    content = content.replace(oldRenderActivities, newRenderActivities);
    console.log('✅ renderActivitiesRows atualizado');
} else {
    console.log('⚠️  renderActivitiesRows já atualizado ou não encontrado');
}

// 2. Adicionar funções de bulk edit antes do showToast
const bulkFunctions = `
    // ============================================
    // BULK EDIT FUNCTIONS
    // ============================================

    toggleActivitySelection(checkbox) {
        this.updateBulkToolbar();
    },

    toggleSelectAll(checked) {
        const checkboxes = document.querySelectorAll('.activity-checkbox');
        checkboxes.forEach(cb => {
            cb.checked = checked;
        });
        this.updateBulkToolbar();
    },

    updateBulkToolbar() {
        const checkboxes = document.querySelectorAll('.activity-checkbox:checked');
        const toolbar = document.getElementById('bulkEditToolbar');
        const countEl = document.getElementById('selectedCount');
        
        if (toolbar && countEl) {
            if (checkboxes.length > 0) {
                toolbar.style.display = 'block';
                countEl.textContent = checkboxes.length;
            } else {
                toolbar.style.display = 'none';
            }
        }
    },

    clearBulkSelection() {
        const checkboxes = document.querySelectorAll('.activity-checkbox');
        checkboxes.forEach(cb => {
            cb.checked = false;
        });
        
        const selectAll = document.getElementById('selectAllActivities');
        if (selectAll) {
            selectAll.checked = false;
        }
        
        this.updateBulkToolbar();
    },

    openBulkEvaluationModal() {
        const selectedCheckboxes = document.querySelectorAll('.activity-checkbox:checked');
        const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.dataset.activityId);
        
        if (selectedIds.length === 0) {
            this.showToast('Selecione pelo menos uma atividade', 'error');
            return;
        }

        const modal = document.createElement('div');
        modal.id = 'bulkEvaluationModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = \`
            <div class="modal-content-premium" style="max-width: 500px;">
                <div class="modal-header-premium">
                    <h2>⭐ Avaliação em Massa</h2>
                    <button class="modal-close" onclick="document.getElementById('bulkEvaluationModal').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <p style="margin-bottom: 1.5rem; color: #666;">
                        <strong>\${selectedIds.length}</strong> atividades selecionadas serão avaliadas.
                    </p>

                    <div class="form-group">
                        <label class="form-label">Avaliação Qualitativa (Estrelas)</label>
                        <div class="star-rating-input" style="display: flex; gap: 0.5rem; font-size: 2rem;">
                            \${[1, 2, 3].map(star => \`
                                <span 
                                    class="star-clickable" 
                                    data-rating="\${star}"
                                    onclick="window.graduationModule.setBulkRating(\${star})"
                                    style="cursor: pointer; opacity: 0.3; transition: opacity 0.2s;"
                                    onmouseover="this.style.opacity='1'"
                                    onmouseout="if(!this.classList.contains('active')) this.style.opacity='0.3'"
                                >⭐</span>
                            \`).join('')}
                        </div>
                        <input type="hidden" id="bulkRating" value="0" />
                        <p class="form-hint" style="margin-top: 0.5rem;">
                            <small>⭐ = Iniciante | ⭐⭐ = Intermediário | ⭐⭐⭐ = Avançado</small>
                        </p>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Observações (Opcional)</label>
                        <textarea 
                            id="bulkNotes" 
                            class="form-control" 
                            rows="3" 
                            placeholder="Observações gerais sobre essas atividades..."
                        ></textarea>
                    </div>
                </div>
                <div class="modal-footer-premium">
                    <button 
                        class="btn-secondary" 
                        onclick="document.getElementById('bulkEvaluationModal').remove()"
                    >
                        Cancelar
                    </button>
                    <button 
                        class="btn-primary" 
                        onclick="window.graduationModule.saveBulkEvaluation()"
                    >
                        💾 Salvar Avaliações
                    </button>
                </div>
            </div>
        \`;

        document.body.appendChild(modal);

        if (!document.getElementById('bulkModalStyles')) {
            const style = document.createElement('style');
            style.id = 'bulkModalStyles';
            style.textContent = \`
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    animation: fadeIn 0.3s ease;
                }
                .modal-content-premium {
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    max-height: 90vh;
                    overflow-y: auto;
                    animation: slideUp 0.3s ease;
                }
                .modal-header-premium {
                    padding: 1.5rem;
                    border-bottom: 1px solid #e0e0e0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border-radius: 12px 12px 0 0;
                }
                .modal-header-premium h2 {
                    margin: 0;
                    font-size: 1.5rem;
                }
                .modal-close {
                    background: rgba(255,255,255,0.2);
                    border: none;
                    color: white;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 1.2rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background 0.2s;
                }
                .modal-close:hover {
                    background: rgba(255,255,255,0.3);
                }
                .modal-body {
                    padding: 2rem;
                }
                .modal-footer-premium {
                    padding: 1.5rem;
                    border-top: 1px solid #e0e0e0;
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                    background: #f9fafb;
                    border-radius: 0 0 12px 12px;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { 
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .star-clickable.active {
                    opacity: 1 !important;
                    transform: scale(1.1);
                }
            \`;
            document.head.appendChild(style);
        }
    },

    setBulkRating(rating) {
        document.getElementById('bulkRating').value = rating;
        
        const stars = document.querySelectorAll('.star-clickable');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
                star.style.opacity = '1';
            } else {
                star.classList.remove('active');
                star.style.opacity = '0.3';
            }
        });
    },

    async saveBulkEvaluation() {
        const rating = parseInt(document.getElementById('bulkRating').value);
        const notes = document.getElementById('bulkNotes').value;

        if (rating === 0) {
            this.showToast('Selecione uma avaliação (estrelas)', 'error');
            return;
        }

        const selectedCheckboxes = document.querySelectorAll('.activity-checkbox:checked');
        const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.dataset.activityId);

        try {
            const modal = document.getElementById('bulkEvaluationModal');
            const saveBtn = modal.querySelector('.btn-primary');
            saveBtn.disabled = true;
            saveBtn.textContent = '⏳ Salvando...';

            const studentId = this.selectedStudentData.student.id;
            const organizationId = typeof getActiveOrganizationId === 'function' 
                ? getActiveOrganizationId() 
                : window.organizationContext?.currentOrganizationId 
                || 'ff5ee00e-d8a3-4291-9428-d28b852fb472';

            let successCount = 0;
            let errorCount = 0;

            for (const activityId of selectedIds) {
                try {
                    await this.moduleAPI.request(\`/api/graduation/student/\${studentId}/activity/\${activityId}?organizationId=\${organizationId}\`, {
                        method: 'PUT',
                        body: JSON.stringify({
                            qualitativeRating: rating,
                            notes: notes || undefined
                        })
                    });
                    successCount++;
                } catch (error) {
                    console.error(\`Error updating activity \${activityId}:\`, error);
                    errorCount++;
                }
            }

            modal.remove();

            if (errorCount === 0) {
                this.showToast(\`✅ \${successCount} atividades avaliadas com sucesso!\`, 'success');
            } else {
                this.showToast(\`⚠️ \${successCount} avaliadas, \${errorCount} com erro\`, 'error');
            }

            await this.showStudentDetail(studentId);
            this.clearBulkSelection();

        } catch (error) {
            console.error('Error in bulk evaluation:', error);
            this.showToast('Erro ao salvar avaliações', 'error');
        }
    },
`;

if (!content.includes('toggleActivitySelection')) {
    content = content.replace('    showToast(message, type = \'info\') {', bulkFunctions + '    showToast(message, type = \'info\') {');
    console.log('✅ Funções de bulk edit adicionadas');
} else {
    console.log('⚠️  Funções de bulk edit já existem');
}

// Salvar arquivo
fs.writeFileSync(filePath, content, 'utf8');

console.log('\n✅ Patch aplicado com sucesso!');
console.log('🔄 Reinicie o servidor (npm run dev) e force refresh no navegador (Ctrl+Shift+R)');
