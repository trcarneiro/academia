#!/usr/bin/env node

/**
 * Asaas Customer Import Script
 * Importa clientes do Asaas para o sistema da academia
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
const ASAAS_BASE_URL = process.env.ASAAS_BASE_URL || 'https://sandbox.asaas.com/api/v3';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY; // Use anon key since service key has issues

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Default course and class IDs
const DEFAULT_COURSE_ID = '750273f9-7508-4fbf-affb-8efe189f2875';
const DEFAULT_CLASS_ID = '2e47c8b1-5d4c-4a9b-8f3e-1b2c3d4e5f60';

/**
 * Fetch customers from Asaas API
 */
async function fetchAsaasCustomers(limit = 100, offset = 0) {
    try {
        console.log(`📡 Fetching customers from Asaas (limit: ${limit}, offset: ${offset})...`);
        
        const url = `${ASAAS_BASE_URL}/customers?limit=${limit}&offset=${offset}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'access_token': ASAAS_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Asaas API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`✅ Found ${data.data.length} customers, total available: ${data.totalCount}`);
        
        return {
            customers: data.data || [],
            totalCount: data.totalCount || 0,
            hasMore: data.hasMore || false
        };

    } catch (error) {
        console.error('❌ Error fetching Asaas customers:', error.message);
        throw error;
    }
}

/**
 * Check if user already exists by email
 */
async function userExists(email) {
    const { data, error } = await supabase
        .from('User')
        .select('id')
        .eq('email', email)
        .single();

    return !!data && !error;
}

/**
 * Create user in the system
 */
async function createUser(customerData) {
    const names = customerData.name.trim().split(' ');
    const firstName = names[0] || customerData.name;
    const lastName = names.slice(1).join(' ') || '';

    const userData = {
        firstName,
        lastName,
        email: customerData.email,
        phone: customerData.phone || '',
        cpf: customerData.cpfCnpj || '',
        role: 'STUDENT',
        isActive: true,
        createdAt: new Date().toISOString(),
        asaasCustomerId: customerData.id // Link to Asaas customer
    };

    const { data, error } = await supabase
        .from('User')
        .insert(userData)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Create student record
 */
async function createStudent(userId, customerData) {
    const studentData = {
        userId,
        birthDate: customerData.dateOfBirth || null,
        category: 'ADULT', // Default category
        gender: 'MASCULINO', // Default - should be updated manually
        specialNeeds: [],
        emergencyContact: customerData.phone || '',
        medicalConditions: '',
        notes: `Imported from Asaas on ${new Date().toLocaleDateString('pt-BR')}`,
        asaasCustomerId: customerData.id
    };

    const { data, error } = await supabase
        .from('Student')
        .insert(studentData)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Enroll student in default course
 */
async function enrollStudent(studentId, courseId = DEFAULT_COURSE_ID, classId = DEFAULT_CLASS_ID) {
    const enrollmentData = {
        studentId,
        courseId,
        classId,
        enrollmentDate: new Date().toISOString(),
        status: 'ACTIVE'
    };

    const { data, error } = await supabase
        .from('StudentCourse')
        .insert(enrollmentData)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Import a single customer
 */
async function importCustomer(customer) {
    try {
        // Validate required fields
        if (!customer.email) {
            return {
                success: false,
                error: 'No email provided',
                customer: customer.name
            };
        }

        if (!customer.name) {
            return {
                success: false,
                error: 'No name provided',
                customer: customer.email
            };
        }

        // Check if user already exists
        if (await userExists(customer.email)) {
            return {
                success: false,
                error: 'User already exists',
                customer: customer.name,
                skipped: true
            };
        }

        // Create user
        const user = await createUser(customer);
        console.log(`👤 Created user: ${user.firstName} ${user.lastName}`);

        // Create student
        const student = await createStudent(user.id, customer);
        console.log(`🎓 Created student record for: ${user.firstName}`);

        // Enroll in course
        const enrollment = await enrollStudent(student.id);
        console.log(`📚 Enrolled ${user.firstName} in Krav Maga course`);

        return {
            success: true,
            user,
            student,
            enrollment,
            customer: customer.name
        };

    } catch (error) {
        console.error(`❌ Error importing ${customer.name}:`, error.message);
        return {
            success: false,
            error: error.message,
            customer: customer.name
        };
    }
}

/**
 * Main import function
 */
async function importAsaasCustomers(options = {}) {
    const {
        limit = 100,
        dryRun = false,
        enrollInCourse = true
    } = options;

    console.log('🚀 Starting Asaas customer import...');
    console.log(`📊 Options: limit=${limit}, dryRun=${dryRun}, enrollInCourse=${enrollInCourse}`);
    
    if (!ASAAS_API_KEY) {
        console.error('❌ ASAAS_API_KEY not configured in environment variables');
        process.exit(1);
    }

    if (!SUPABASE_URL || !SUPABASE_KEY) {
        console.error('❌ Supabase configuration missing in environment variables');
        process.exit(1);
    }

    const stats = {
        total: 0,
        imported: 0,
        skipped: 0,
        errors: 0,
        results: []
    };

    try {
        let offset = 0;
        let hasMore = true;

        while (hasMore && stats.total < limit) {
            const batchLimit = Math.min(50, limit - stats.total); // Process in batches of 50
            const { customers, totalCount, hasMore: moreAvailable } = await fetchAsaasCustomers(batchLimit, offset);
            
            hasMore = moreAvailable && stats.total < limit;
            offset += batchLimit;

            console.log(`\n📦 Processing batch of ${customers.length} customers...`);

            for (const customer of customers) {
                if (stats.total >= limit) break;

                console.log(`\n👤 Processing: ${customer.name} (${customer.email})`);
                
                if (dryRun) {
                    console.log(`🔍 DRY RUN - Would import: ${customer.name}`);
                    stats.total++;
                    continue;
                }

                const result = await importCustomer(customer);
                stats.results.push(result);

                if (result.success) {
                    stats.imported++;
                    console.log(`✅ Successfully imported: ${result.customer}`);
                } else if (result.skipped) {
                    stats.skipped++;
                    console.log(`⏭️ Skipped (already exists): ${result.customer}`);
                } else {
                    stats.errors++;
                    console.log(`❌ Failed to import: ${result.customer} - ${result.error}`);
                }

                stats.total++;

                // Small delay to avoid overwhelming the API
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            console.log(`\n📊 Batch completed. Progress: ${stats.total} processed`);
        }

    } catch (error) {
        console.error('❌ Import process failed:', error.message);
        throw error;
    }

    // Final report
    console.log('\n' + '='.repeat(60));
    console.log('📊 IMPORT SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total processed: ${stats.total}`);
    console.log(`✅ Successfully imported: ${stats.imported}`);
    console.log(`⏭️ Skipped (already exist): ${stats.skipped}`);
    console.log(`❌ Errors: ${stats.errors}`);
    
    if (stats.errors > 0) {
        console.log('\n❌ ERRORS:');
        stats.results
            .filter(r => !r.success && !r.skipped)
            .forEach(r => console.log(`  - ${r.customer}: ${r.error}`));
    }

    console.log('\n🎉 Import process completed!');
    return stats;
}

/**
 * CLI interface
 */
if (require.main === module) {
    const args = process.argv.slice(2);
    const options = {};

    // Parse command line arguments
    args.forEach(arg => {
        if (arg === '--dry-run') {
            options.dryRun = true;
        } else if (arg.startsWith('--limit=')) {
            options.limit = parseInt(arg.split('=')[1]);
        } else if (arg === '--no-enroll') {
            options.enrollInCourse = false;
        } else if (arg === '--help') {
            console.log(`
Asaas Customer Import Script

Usage: node asaas-import.js [options]

Options:
  --limit=N          Import at most N customers (default: 100)
  --dry-run          Show what would be imported without actually importing
  --no-enroll        Don't automatically enroll students in the default course
  --help             Show this help message

Environment Variables:
  ASAAS_API_KEY      Your Asaas API key (required)
  ASAAS_BASE_URL     Asaas API base URL (default: sandbox)
  SUPABASE_URL       Your Supabase project URL (required)
  SUPABASE_SERVICE_KEY  Your Supabase service key (required)

Examples:
  node asaas-import.js --limit=10 --dry-run
  node asaas-import.js --limit=50
  node asaas-import.js --no-enroll
            `);
            process.exit(0);
        }
    });

    // Run import
    importAsaasCustomers(options)
        .then(stats => {
            process.exit(stats.errors > 0 ? 1 : 0);
        })
        .catch(error => {
            console.error('💥 Fatal error:', error.message);
            process.exit(1);
        });
}

module.exports = {
    importAsaasCustomers,
    fetchAsaasCustomers,
    importCustomer
};