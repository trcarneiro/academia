
import { CourseImportService } from '../src/services/courseImportService';
import fs from 'fs';
import path from 'path';

async function testImport() {
    try {
        const filePath = path.join(__dirname, '../cursos/cursokravmagafaixabranca-FIXED.json');
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const courseData = JSON.parse(fileContent);

        console.log('🧪 Starting manual verification test for v2.0 import...');

        // This test bypasses the API layer to test the service directly
        // We need a dummy organization ID
        const orgId = 'ff5ee00e-d8a3-4291-9428-d28b852fb472';

        const result = await CourseImportService.importFullCourse(courseData, orgId, true);

        console.log('📊 Result success:', result.success);
        console.log('📊 Message:', result.message);

        if (result.success) {
            console.log('✅ PASS: Course imported successfully with v2.0 structure');
            console.log('📊 Stats:', result.data);
        } else {
            console.error('❌ FAIL:', result.message);
            console.error('❌ Details:', result.data);
        }
    } catch (error) {
        console.error('❌ CRITICAL ERROR:', error);
    }
}

testImport();
