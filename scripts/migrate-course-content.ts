
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DIRECT_URL } },
});

const DEMO_ORG_ID = '336cb021-103f-4ea8-b5cd-8742b97684ba';
const TARGET_ORG_ID = 'ff5ee00e-d8a3-4291-9428-d28b852fb472';

async function migrate() {
    console.log('🚀 Starting Migration from Demo to Smart Defence...');

    // 1. Fetch Source Course
    const sourceCourse = await prisma.course.findFirst({
        where: { organizationId: DEMO_ORG_ID, name: 'Krav Maga - Iniciante' },
        include: {
            lessonPlans: {
                include: {
                    techniqueLinks: true
                }
            },
            techniques: {
                include: {
                    technique: true
                }
            }
        }
    });

    if (!sourceCourse) {
        throw new Error('Source course not found!');
    }

    console.log(`📦 Found Source Course: ${sourceCourse.name} (${sourceCourse.id})`);
    console.log(`   - Lesson Plans: ${sourceCourse.lessonPlans.length}`);
    console.log(`   - Techniques: ${sourceCourse.techniques.length}`);

    // 2. Create/Update Target Course
    let targetCourse = await prisma.course.findFirst({
        where: { organizationId: TARGET_ORG_ID, name: sourceCourse.name }
    });

    if (targetCourse) {
        console.log(`ℹ️ Target Course already exists: ${targetCourse.id}. Using it.`);
    } else {
        targetCourse = await prisma.course.create({
            data: {
                organizationId: TARGET_ORG_ID,
                name: sourceCourse.name,
                description: sourceCourse.description,
                level: sourceCourse.level,
                duration: sourceCourse.duration,
                totalClasses: sourceCourse.totalClasses,
                isActive: true
            }
        });
        console.log(`✅ Created Target Course: ${targetCourse.name} (${targetCourse.id})`);
    }

    // 3. Migrate Techniques (Techniques are Org-specific usually, or shared? Schema says OrgId)
    // We need to copy techniques first.
    const techniqueMap = new Map<string, string>(); // OldID -> NewID

    // Find all techniques used in the course
    const distinctTechniqueIds = new Set<string>();
    sourceCourse.techniques.forEach(ct => distinctTechniqueIds.add(ct.techniqueId));
    sourceCourse.lessonPlans.forEach(lp => lp.techniqueLinks.forEach(tl => distinctTechniqueIds.add(tl.techniqueId)));

    console.log(`🔄 Migrating ${distinctTechniqueIds.size} Techniques...`);

    for (const techId of distinctTechniqueIds) {
        const sourceTech = await prisma.technique.findUnique({ where: { id: techId } });
        if (!sourceTech) continue;

        // Check if exists in target by name
        let targetTech = await prisma.technique.findFirst({
            where: {
                organizationId: null, // Global techniques? Or Org specific?
                // The schema allows optional martialArtId. Let's assume we map by name + org logic implies copying if it was org-bound
                name: sourceTech.name
                // Wait, if sourceTech has orgId matches Demo, we copy. If null, valid for all? 
                // Schema: martialArtId? (relation to MartialArt -> Org). Technique itself doesn't have direct OrganizationId?
                // Correction: Technique model DOES NOT have organizationId directly? Let's check Schema.
            }
        });

        // Wait, looking at schema in Step 145:
        // model Technique { ... martialArtId String? ... martialArt MartialArt? ... }
        // model MartialArt { ... organizationId String ... }
        // So Technique belongs to Martial Art which belongs to Org.

        // If the technique is linked to a Martial Art in Demo Org, we need to recreate that structure in Target Org.

        let targetMartialArtId = null;
        if (sourceTech.martialArtId) {
            // Find or create equivalent Martial Art in Target
            const sourceMA = await prisma.martialArt.findUnique({ where: { id: sourceTech.martialArtId } });
            if (sourceMA) {
                let targetMA = await prisma.martialArt.findFirst({
                    where: { organizationId: TARGET_ORG_ID, name: sourceMA.name }
                });
                if (!targetMA) {
                    targetMA = await prisma.martialArt.create({
                        data: {
                            organizationId: TARGET_ORG_ID,
                            name: sourceMA.name,
                            description: sourceMA.description
                        }
                    });
                }
                targetMartialArtId = targetMA.id;
            }
        }

        // Create Technique Copy
        const newTech = await prisma.technique.create({
            data: {
                name: sourceTech.name,
                description: sourceTech.description,
                difficulty: sourceTech.difficulty,
                martialArtId: targetMartialArtId,
                // Copy other fields as needed
                videoUrl: sourceTech.videoUrl,
                imageUrl: sourceTech.imageUrl
            }
        });
        techniqueMap.set(techId, newTech.id);
    }

    // 4. Link Techniques to Course
    console.log(`🔗 Linking Techniques to Course...`);
    for (const ct of sourceCourse.techniques) {
        const newTechId = techniqueMap.get(ct.techniqueId);
        if (!newTechId) continue;

        await prisma.courseTechnique.upsert({
            where: { courseId_techniqueId: { courseId: targetCourse.id, techniqueId: newTechId } },
            create: {
                courseId: targetCourse.id,
                techniqueId: newTechId,
                orderIndex: ct.orderIndex,
                weekNumber: ct.weekNumber,
                isRequired: ct.isRequired
            },
            update: {}
        });
    }

    // 5. Migrate Lesson Plans
    console.log(`📚 Migrating ${sourceCourse.lessonPlans.length} Lesson Plans...`);
    for (const lp of sourceCourse.lessonPlans) {
        const newLp = await prisma.lessonPlan.create({
            data: {
                courseId: targetCourse.id,
                title: lp.title,
                description: lp.description,
                lessonNumber: lp.lessonNumber,
                weekNumber: lp.weekNumber,
                warmup: lp.warmup || {},
                techniques: lp.techniques || {},
                simulations: lp.simulations || {},
                cooldown: lp.cooldown || {},
                duration: lp.duration,
                isActive: true
            }
        });

        // Link techniques to Lesson Plan
        if (lp.techniqueLinks.length > 0) {
            for (const tl of lp.techniqueLinks) {
                const newTechId = techniqueMap.get(tl.techniqueId);
                if (newTechId) {
                    await prisma.lessonPlanTechniques.create({
                        data: {
                            lessonPlanId: newLp.id,
                            techniqueId: newTechId,
                            order: tl.order,
                            allocationMinutes: tl.allocationMinutes
                        }
                    });
                }
            }
        }
    }

    console.log(`\n🎉 Migration Complete!`);
    console.log(`TARGET_COURSE_ID: ${targetCourse.id}`);
}

migrate()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
