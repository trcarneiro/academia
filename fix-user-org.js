/**
 * Fix User Organization Script
 * Ensures user has organizationId and correct ID matching Supabase
 * 
 * Run: node fix-user-org.js
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const USERS_TO_FIX = [
    {
        email: 'trcampos@gmail.com',
        supabaseId: 'cbe69948-5bc7-4877-afa8-b895e7752cbe',
        organizationId: 'ff5ee00e-d8a3-4291-9428-d28b852fb472',
        role: 'ADMIN'
    },
    {
        email: 'tiago@smartdefence.com.br', 
        supabaseId: 'cbe69948-8b07-4fbf-a40f-f80a3cdb2325',
        organizationId: 'ff5ee00e-d8a3-4291-9428-d28b852fb472',
        role: 'ADMIN'
    }
];

async function fixUsers() {
    console.log('🔧 Fixing user organizations...\n');
    
    for (const userConfig of USERS_TO_FIX) {
        console.log(`📧 Processing: ${userConfig.email}`);
        
        try {
            // Find user by email
            let user = await prisma.user.findFirst({
                where: { email: userConfig.email.toLowerCase() }
            });
            
            if (!user) {
                // Create user if doesn't exist
                console.log(`   ➕ Creating user...`);
                user = await prisma.user.create({
                    data: {
                        id: userConfig.supabaseId,
                        email: userConfig.email.toLowerCase(),
                        role: userConfig.role,
                        organizationId: userConfig.organizationId
                    }
                });
                console.log(`   ✅ User created with ID: ${user.id}`);
            } else {
                console.log(`   📋 Found user with ID: ${user.id}`);
                
                // Check if ID needs update
                if (user.id !== userConfig.supabaseId) {
                    console.log(`   🔄 ID mismatch! Updating ${user.id} → ${userConfig.supabaseId}`);
                    
                    // Update related records first (if any)
                    try {
                        await prisma.instructor.updateMany({
                            where: { userId: user.id },
                            data: { userId: userConfig.supabaseId }
                        });
                        await prisma.student.updateMany({
                            where: { userId: user.id },
                            data: { userId: userConfig.supabaseId }
                        });
                    } catch (e) {
                        // Ignore if no related records
                    }
                    
                    // Delete old user and create new with correct ID
                    await prisma.user.delete({ where: { id: user.id } });
                    user = await prisma.user.create({
                        data: {
                            id: userConfig.supabaseId,
                            email: userConfig.email.toLowerCase(),
                            role: userConfig.role,
                            organizationId: userConfig.organizationId
                        }
                    });
                    console.log(`   ✅ User recreated with correct ID`);
                }
                
                // Check if organizationId needs update
                if (!user.organizationId || user.organizationId !== userConfig.organizationId) {
                    console.log(`   🏢 Updating organizationId: ${user.organizationId || 'null'} → ${userConfig.organizationId}`);
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { 
                            organizationId: userConfig.organizationId,
                            role: userConfig.role
                        }
                    });
                    console.log(`   ✅ Organization updated`);
                } else {
                    console.log(`   ✅ Organization already correct`);
                }
            }
            
        } catch (error) {
            console.error(`   ❌ Error: ${error.message}`);
        }
        
        console.log('');
    }
    
    // List all users for verification
    console.log('\n📋 Current users in database:');
    const allUsers = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            role: true,
            organizationId: true
        }
    });
    
    console.table(allUsers);
    
    await prisma.$disconnect();
    console.log('\n✅ Done!');
}

fixUsers().catch(console.error);
