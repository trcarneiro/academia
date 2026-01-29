
const fs = require('fs');
const path = require('path');

const coursePath = path.join(__dirname, '../cursos/cursokravmagafaixabranca-FIXED.json');
const techniquesPath = path.join(__dirname, '../cursos/Tecnicas_Krav_Maga_Faixa_Branca.json');
const outputPath = path.join(__dirname, '../cursos/cursokravmagafaixabranca-COMPLETO.json');

try {
    console.log('📖 Reading files...');
    const courseRaw = fs.readFileSync(coursePath, 'utf8');
    const techniquesRaw = fs.readFileSync(techniquesPath, 'utf8');

    const courseData = JSON.parse(courseRaw);
    const techniquesData = JSON.parse(techniquesRaw);

    console.log('🔄 Merging structures...');

    // Normalizar estrutura (se necessário)
    let finalCourse = courseData;
    if (finalCourse.course) {
        finalCourse = finalCourse.course;
    }

    // Incorporar a lista completa de técnicas
    finalCourse.techniques = techniquesData;

    // Criar o objeto final no formato v2.0
    const finalJSON = {
        course: finalCourse
    };

    console.log(`✅ Merged ${techniquesData.length} techniques into course "${finalCourse.name}"`);

    fs.writeFileSync(outputPath, JSON.stringify(finalJSON, null, 2), 'utf8');
    console.log(`💾 Saved to: ${outputPath}`);

} catch (error) {
    console.error('❌ Error merging files:', error);
}
