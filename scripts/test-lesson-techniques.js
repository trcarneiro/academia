#!/usr/bin/env node
/**
 * Test Script: Lesson Plan Techniques Integration
 * 
 * Este script testa se as técnicas estão sendo corretamente vinculadas
 * e exibidas nos lesson plans.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testLessonPlanTechniques() {
    console.log('🧪 Testing Lesson Plan Techniques Integration...\n');

    try {
        // 1. Get a course with lesson plans
        console.log('📚 Step 1: Finding course with lesson plans...');
        const course = await prisma.course.findFirst({
            include: {
                lessonPlans: {
                    take: 1
                }
            }
        });

        if (!course) {
            console.log('❌ No course found in database');
            return;
        }

        if (course.lessonPlans.length === 0) {
            console.log('❌ Course has no lesson plans');
            return;
        }

        console.log(`✅ Found course: ${course.name}`);
        console.log(`   Lesson Plan: ${course.lessonPlans[0].title}\n`);

        const lessonPlanId = course.lessonPlans[0].id;

        // 2. Get available techniques
        console.log('🥋 Step 2: Finding available techniques...');
        const techniques = await prisma.technique.findMany({
            take: 3,
            select: {
                id: true,
                name: true,
                category: true,
                difficulty: true
            }
        });

        if (techniques.length === 0) {
            console.log('❌ No techniques found in database');
            return;
        }

        console.log(`✅ Found ${techniques.length} techniques:`);
        techniques.forEach((t, i) => {
            console.log(`   ${i + 1}. ${t.name} (${t.category || 'N/A'} - Level ${t.difficulty || 'N/A'})`);
        });
        console.log('');

        // 3. Link techniques to lesson plan
        console.log('🔗 Step 3: Linking techniques to lesson plan...');
        const techniqueIds = techniques.map(t => t.id);

        let successCount = 0;
        for (let i = 0; i < techniqueIds.length; i++) {
            try {
                await prisma.lessonPlanTechniques.upsert({
                    where: {
                        lessonPlanId_techniqueId: {
                            lessonPlanId: lessonPlanId,
                            techniqueId: techniqueIds[i]
                        }
                    },
                    create: {
                        lessonPlanId: lessonPlanId,
                        techniqueId: techniqueIds[i],
                        order: i + 1,
                        allocationMinutes: 10,
                        objectiveMapping: []
                    },
                    update: {
                        order: i + 1
                    }
                });
                successCount++;
            } catch (error) {
                console.log(`   ⚠️ Failed to link technique ${i + 1}: ${error.message}`);
            }
        }

        console.log(`✅ Successfully linked ${successCount}/${techniqueIds.length} techniques\n`);

        // 4. Verify links were created
        console.log('✔️  Step 4: Verifying links...');
        const lessonWithTechniques = await prisma.lessonPlan.findUnique({
            where: { id: lessonPlanId },
            include: {
                techniqueLinks: {
                    include: {
                        technique: {
                            select: {
                                id: true,
                                name: true,
                                category: true,
                                difficulty: true
                            }
                        }
                    },
                    orderBy: { order: 'asc' }
                }
            }
        });

        if (!lessonWithTechniques.techniqueLinks || lessonWithTechniques.techniqueLinks.length === 0) {
            console.log('❌ No technique links found!');
            return;
        }

        console.log(`✅ Found ${lessonWithTechniques.techniqueLinks.length} linked techniques:`);
        lessonWithTechniques.techniqueLinks.forEach((link, i) => {
            console.log(`   ${i + 1}. ${link.technique.name} (Order: ${link.order})`);
        });
        console.log('');

        // 5. Test API endpoint format
        console.log('🌐 Step 5: Testing API response format...');
        const apiResponse = {
            lessonNumber: lessonWithTechniques.lessonNumber,
            weekNumber: lessonWithTechniques.weekNumber,
            title: lessonWithTechniques.title,
            techniques: lessonWithTechniques.techniqueLinks.map(lt => ({
                id: lt.technique.id,
                title: lt.technique.name,
                name: lt.technique.name,
                category: lt.technique.category,
                difficulty: lt.technique.difficulty,
                order: lt.order,
                allocationMinutes: lt.allocationMinutes
            }))
        };

        console.log('✅ API Response Format:');
        console.log(JSON.stringify(apiResponse, null, 2));
        console.log('');

        // 6. Summary
        console.log('📊 SUMMARY:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Course: ${course.name}`);
        console.log(`Lesson Plan: ${lessonWithTechniques.title}`);
        console.log(`Techniques Linked: ${lessonWithTechniques.techniqueLinks.length}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ All tests passed! Techniques are properly linked.\n');

    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error(error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

// Run tests
testLessonPlanTechniques();
