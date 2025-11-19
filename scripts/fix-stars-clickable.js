const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'public', 'js', 'modules', 'graduation', 'index.js');

console.log('⭐ Tornando estrelas clicáveis na listagem...');

let content = fs.readFileSync(filePath, 'utf-8');

// Replace the stars rendering in the table
const oldStarsPattern = /(<td>\s*<span class="rating-display">\s*)\$\{this\.renderStarsInline\(activity\.qualitativeRating \|\| 0\)\}\s*<\/span>\s*<\/td>\s*<td>\$\{originBadge\}<\/td>/;

const newStarsCode = `<td ondblclick="window.graduationModule.navigateToActivityEdit('\${activity.id}')">\${activity.quantitativeTarget || 0}</td>
                    <td onclick="event.stopPropagation();" style="cursor: default;">
                        <span class="rating-display">
                            \${this.renderClickableStars(activity.id, activity.qualitativeRating || 0)}
                        </span>
                    </td>
                    <td ondblclick="window.graduationModule.navigateToActivityEdit('\${activity.id}')">`;

// Find the exact pattern
const searchPattern = `<td>\${activity.quantitativeTarget || 0}</td>
                    <td>
                        <span class="rating-display">
                            \${this.renderStarsInline(activity.qualitativeRating || 0)}
                        </span>
                    </td>
                    <td>\${originBadge}</td>`;

const replaceWith = `<td ondblclick="window.graduationModule.navigateToActivityEdit('\${activity.id}')">\${activity.quantitativeTarget || 0}</td>
                    <td onclick="event.stopPropagation();" style="cursor: default;">
                        <span class="rating-display">
                            \${this.renderClickableStars(activity.id, activity.qualitativeRating || 0)}
                        </span>
                    </td>
                    <td ondblclick="window.graduationModule.navigateToActivityEdit('\${activity.id}')">\${originBadge}</td>`;

if (content.includes(searchPattern)) {
    content = content.replace(searchPattern, replaceWith);
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('✅ Estrelas agora são clicáveis!');
    console.log('   - Clique em uma estrela para avaliar (1-3)');
    console.log('   - Salva automaticamente via API');
    console.log('   - Badge atualiza automaticamente');
} else {
    console.log('⚠️  Padrão não encontrado. Procurando alternativa...');
    
    // Try simpler pattern
    const simplePattern = '${this.renderStarsInline(activity.qualitativeRating || 0)}';
    if (content.includes(simplePattern)) {
        content = content.replace(
            simplePattern,
            '${this.renderClickableStars(activity.id, activity.qualitativeRating || 0)}'
        );
        
        // Also need to add onclick to prevent double-click
        content = content.replace(
            '<td>\n                        <span class="rating-display">',
            '<td onclick="event.stopPropagation();" style="cursor: default;">\n                        <span class="rating-display">'
        );
        
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log('✅ Estrelas atualizadas com método alternativo!');
    } else {
        console.log('❌ Não foi possível encontrar o padrão.');
    }
}

console.log('\n🎯 Próximo passo: Hard refresh (Ctrl+Shift+R) no navegador');
