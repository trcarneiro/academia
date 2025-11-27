/**
 * Reset Password Script
 * Run: node reset-password.js <email> <new-password>
 * Example: node reset-password.js tiago@smartdefence.com.br NovaSenha123!
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Supabase Admin Client (requires service_role key)
const supabaseUrl = process.env.SUPABASE_URL || 'https://yawfuymgwukericlhgxh.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function resetPassword() {
    const email = process.argv[2];
    const newPassword = process.argv[3];
    
    if (!email || !newPassword) {
        console.log('❌ Usage: node reset-password.js <email> <new-password>');
        console.log('   Example: node reset-password.js tiago@smartdefence.com.br NovaSenha123!');
        process.exit(1);
    }
    
    if (newPassword.length < 8) {
        console.log('❌ Password must be at least 8 characters');
        process.exit(1);
    }
    
    console.log(`🔐 Resetting password for: ${email}`);
    
    try {
        // 1. Check if user exists in local database
        const user = await prisma.user.findFirst({
            where: { email: email.toLowerCase() }
        });
        
        if (!user) {
            console.log('❌ User not found in local database');
            process.exit(1);
        }
        
        console.log(`✅ Found user: ${user.firstName} ${user.lastName} (ID: ${user.id})`);
        
        // 2. Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        
        // 3. Update local database
        await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: hashedPassword }
        });
        
        console.log('✅ Local database password updated');
        
        // 4. Try to update Supabase (if service key is available)
        if (supabaseServiceKey) {
            try {
                const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
                    auth: { autoRefreshToken: false, persistSession: false }
                });
                
                // Get Supabase user by email
                const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
                
                if (listError) {
                    console.log('⚠️ Could not list Supabase users:', listError.message);
                } else {
                    const supabaseUser = users.users.find(u => u.email === email.toLowerCase());
                    
                    if (supabaseUser) {
                        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                            supabaseUser.id,
                            { password: newPassword }
                        );
                        
                        if (updateError) {
                            console.log('⚠️ Could not update Supabase password:', updateError.message);
                        } else {
                            console.log('✅ Supabase password updated');
                        }
                    } else {
                        console.log('⚠️ User not found in Supabase Auth');
                    }
                }
            } catch (supabaseError) {
                console.log('⚠️ Supabase update skipped:', supabaseError.message);
            }
        } else {
            console.log('ℹ️ SUPABASE_SERVICE_ROLE_KEY not set - skipping Supabase update');
            console.log('   The local password has been updated. Login should work.');
        }
        
        console.log('\n✅ Password reset complete!');
        console.log(`\n📝 You can now login with:`);
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${newPassword}`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

resetPassword();
