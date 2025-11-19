const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'public', 'js', 'modules', 'graduation', 'index.js');

console.log('📝 Corrigindo função renderActivitiesRows...');

let content = fs.readFileSync(filePath, 'utf-8');

// Find and replace the renderActivitiesRows function
const oldFunctionPattern = /renderActivitiesRows\(activities\) \{[\s\S]*?return activities\.map\(\(activity, index\) => \{[\s\S]*?\}\)\.join\(''\);[\s\S]*?\},/;

const newFunction = `renderActivitiesRows(activities) {
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

            // Determine badge color and text based on qualification method
            const hasManualRating = activity.qualitativeRating > 0;
            const hasCheckInProgress = activity.quantitativeProgress >= activity.quantitativeTarget;
            
            let originBadge = '';
            if (hasManualRating && hasCheckInProgress) {
                originBadge = '<span class="badge-source badge-both">✓ Check-in + Manual</span>';
            } else if (hasManualRating) {
                originBadge = '<span class="badge-source badge-manual">✏️ Manual</span>';
            } else if (hasCheckInProgress) {
                originBadge = '<span class="badge-source badge-checkin">✓ Check-in</span>';
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
                    <td style="width: 40px; text-align: center;">
                        <input type="checkbox" 
                               class="activity-checkbox" 
                               data-activity-id="\${activity.id}"
                               onclick="event.stopPropagation(); window.graduationModule.toggleActivitySelection(this);">
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

if (oldFunctionPattern.test(content)) {
    content = content.replace(oldFunctionPattern, newFunction);
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('✅ Função renderActivitiesRows atualizada com sucesso!');
} else {
    console.log('⚠️  Padrão não encontrado. Tentando localizar função...');
    const lines = content.split('\n');
    let startLine = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('renderActivitiesRows(activities)')) {
            startLine = i;
            console.log(`✅ Função encontrada na linha ${i + 1}`);
            break;
        }
    }
}

console.log('✅ Script concluído!');
