
import { prisma } from '../src/utils/database';
import { CourseImportService } from '../src/services/courseImportService';
import fs from 'fs';
import path from 'path';

async function performImport() {
    try {
        console.log('🚀 Starting Course Import Process...');

        // 1. Get first organization
        const org = await prisma.organization.findFirst();
        if (!org) {
            console.error('❌ No organization found in database!');
            return;
        }
        console.log(`🏢 Target Organization: ${org.name} (${org.id})`);

        // 2. Read the unified JSON file
        const filePath = path.join(process.cwd(), 'cursos/cursokravmagafaixabranca-COMPLETO.json');
        if (!fs.existsSync(filePath)) {
            console.error(`❌ File not found: ${filePath}`);
            return;
        }
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const courseData = JSON.parse(fileContent);

        // 3. Perform the import
        console.log('📥 Calling CourseImportService.importFullCourse...');
        const result = await CourseImportService.importFullCourse(courseData, org.id, true);

        if (result.success) {
            console.log('✅ IMPORT SUCCESSFUL!');
            console.log('📊 Result Summary:', JSON.stringify(result.data, null, 2));
        } else {
            console.error('❌ IMPORT FAILED!');
            console.error('❌ Error Message:', result.message);
            console.error('❌ Error Data:', JSON.stringify(result.data, null, 2));
        }

    } catch (error) {
        console.error('❌ CRITICAL ERROR during import:', error);
    } finally {
        await prisma.$disconnect();
    }
}

performImport();
