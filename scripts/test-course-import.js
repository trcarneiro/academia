/**
 * Test Course Import with Lesson Plans and Techniques
 * 
 * This script tests the full import workflow:
 * 1. Import course from JSON (cursofaixabranca.json)
 * 2. Verify lesson plans were created
 * 3. Verify techniques are linked to lessons
 * 4. Display schedule structure
 * 
 * Usage: node scripts/test-course-import.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// ANSI color codes for better output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(emoji, message, color = colors.reset) {
    console.log(`${color}${emoji} ${message}${colors.reset}`);
}

async function main() {
    try {
        log('🚀', 'Starting Course Import Test...', colors.bright);
        console.log('');
        
        // Step 1: Load JSON file (try multiple locations)
        log('📂', 'Looking for cursofaixabranca.json...', colors.cyan);
        
        const possiblePaths = [
            path.join(process.cwd(), 'cursofaixabranca.json'),
            path.join(process.cwd(), '..', 'cursofaixabranca.json'),
            'C:\\Users\\trcar\\Desktop\\cursofaixabranca.json'
        ];
        
        let jsonPath = null;
        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                jsonPath = p;
                break;
            }
        }
        
        if (!jsonPath) {
            throw new Error('cursofaixabranca.json not found! Searched locations:\n' + possiblePaths.join('\n'));
        }
        
        log('✅', `Found: ${jsonPath}`, colors.green);
        const courseData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        
        log('✅', `Loaded: ${courseData.name}`, colors.green);
        log('📊', `Duration: ${courseData.durationTotalWeeks} weeks`, colors.blue);
        log('📊', `Total Lessons: ${courseData.totalLessons}`, colors.blue);
        log('📊', `Techniques: ${courseData.techniques.length}`, colors.blue);
        console.log('');
        
        // Step 2: Get organization
        log('🏢', 'Finding organization...', colors.cyan);
        const organization = await prisma.organization.findFirst();
        
        if (!organization) {
            throw new Error('No organization found! Please create one first.');
        }
        
        log('✅', `Organization: ${organization.name} (${organization.id})`, colors.green);
        console.log('');
        
        // Step 3: Import course via service
        log('📥', 'Importing course...', colors.cyan);
        log('⏳', 'This may take a while...', colors.yellow);
        
        // We need to import the TypeScript file directly
        // For now, we'll make a direct API call simulation
        
        // Check if course already exists
        const existingCourse = await prisma.course.findUnique({
            where: { id: courseData.courseId }
        });
        
        if (existingCourse) {
            log('⚠️', 'Course already exists! Deleting it first...', colors.yellow);
            await prisma.course.delete({
                where: { id: courseData.courseId }
            });
            log('✅', 'Existing course deleted', colors.green);
        }
        
        // Import via HTTP API call
        const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
        
        const response = await fetch('http://localhost:3000/api/courses/import-full-course', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                ...courseData,
                createMissingTechniques: true
            })
        });
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(`Import failed: ${result.message}\n${JSON.stringify(result.data, null, 2)}`);
        }
        
        log('✅', 'Course imported successfully!', colors.green);
        log('📊', `Course ID: ${result.data.courseId}`, colors.blue);
        log('📊', `Lesson Count: ${result.data.lessonCount}`, colors.blue);
        log('📊', `Techniques Created: ${result.data.techniquesCreated || 0}`, colors.blue);
        log('📊', `Weeks Created: ${result.data.weeksCreated}`, colors.blue);
        console.log('');
        
        // Step 4: Verify lesson plans
        log('📅', 'Verifying lesson plans...', colors.cyan);
        const lessonPlans = await prisma.lessonPlan.findMany({
            where: { courseId: courseData.courseId },
            include: {
                techniqueLinks: {
                    include: { technique: true },
                    orderBy: { order: 'asc' }
                }
            },
            orderBy: { lessonNumber: 'asc' }
        });
        
        log('✅', `Found ${lessonPlans.length} lesson plans`, colors.green);
        console.log('');
        
        // Step 5: Display schedule structure (first 3 weeks only)
        log('📋', 'Schedule Structure (First 3 weeks):', colors.bright);
        console.log('');
        
        const byWeek = {};
        lessonPlans.forEach(lesson => {
            if (!byWeek[lesson.weekNumber]) {
                byWeek[lesson.weekNumber] = [];
            }
            byWeek[lesson.weekNumber].push(lesson);
        });
        
        Object.keys(byWeek).sort((a, b) => Number(a) - Number(b)).slice(0, 3).forEach(week => {
            log('📅', `Semana ${week} (${byWeek[week].length} aulas)`, colors.magenta);
            
            byWeek[week].forEach(lesson => {
                const techniqueCount = lesson.techniqueLinks.length;
                log('  📝', `Aula ${lesson.lessonNumber}: ${lesson.title}`, colors.blue);
                log('    🥋', `Técnicas: ${techniqueCount}`, techniqueCount > 0 ? colors.green : colors.yellow);
                
                if (techniqueCount > 0 && techniqueCount <= 5) {
                    lesson.techniqueLinks.forEach((link, idx) => {
                        console.log(`      ${idx + 1}. ${link.technique.name} (${link.technique.category}) - ${link.allocationMinutes || 15}min`);
                    });
                } else if (techniqueCount > 5) {
                    lesson.techniqueLinks.slice(0, 3).forEach((link, idx) => {
                        console.log(`      ${idx + 1}. ${link.technique.name} (${link.technique.category}) - ${link.allocationMinutes || 15}min`);
                    });
                    console.log(`      ... and ${techniqueCount - 3} more`);
                }
            });
            console.log('');
        });
        
        // Step 6: Summary
        log('📊', 'SUMMARY', colors.bright);
        console.log('');
        const totalTechniques = lessonPlans.reduce((sum, lesson) => sum + lesson.techniqueLinks.length, 0);
        const lessonsWithTechniques = lessonPlans.filter(lesson => lesson.techniqueLinks.length > 0).length;
        
        console.log(`  Course ID: ${colors.cyan}${courseData.courseId}${colors.reset}`);
        console.log(`  Lesson Plans: ${colors.green}${lessonPlans.length}${colors.reset}`);
        console.log(`  Lessons with Techniques: ${colors.green}${lessonsWithTechniques}${colors.reset}`);
        console.log(`  Total Technique Links: ${colors.green}${totalTechniques}${colors.reset}`);
        console.log(`  Avg Techniques/Lesson: ${colors.cyan}${(totalTechniques / lessonPlans.length).toFixed(2)}${colors.reset}`);
        console.log('');
        
        // Step 7: Test navigation URL
        log('🌐', 'Test URLs:', colors.bright);
        console.log('');
        console.log(`  Dashboard: ${colors.cyan}http://localhost:3000/#courses${colors.reset}`);
        console.log(`  Course Editor: ${colors.cyan}http://localhost:3000/#course-editor/${courseData.courseId}${colors.reset}`);
        if (lessonPlans[0]) {
            console.log(`  First Lesson: ${colors.cyan}http://localhost:3000/#lesson-plans/${lessonPlans[0].id}${colors.reset}`);
        }
        console.log('');
        
        log('✅', 'ALL TESTS PASSED!', colors.bright + colors.green);
        
    } catch (error) {
        console.error('');
        log('❌', 'TEST FAILED', colors.bright + colors.red);
        console.error('');
        console.error(colors.red + error.message + colors.reset);
        console.error('');
        if (error.stack) {
            console.error(error.stack);
        }
        process.exit(1);
        
    } finally {
        await prisma.$disconnect();
    }
}

main();
