#!/usr/bin/env node

/**
 * Simplified Asaas Customer Import Script
 * Usa a API do sistema ao invés de conectar diretamente ao banco
 */

require('dotenv').config();

// Configuration
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
const ASAAS_BASE_URL = process.env.ASAAS_BASE_URL || 'https://www.asaas.com/api/v3';
const SYSTEM_API_BASE = 'http://localhost:3000/api';

/**
 * Fetch customers from Asaas API
 */
async function fetchAsaasCustomers(limit = 50, offset = 0) {
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
 * Check if student already exists by email
 */
async function checkStudentExists(email) {
    try {
        const response = await fetch(`${SYSTEM_API_BASE}/students`);
        const data = await response.json();
        
        if (data.success && data.data) {
            return data.data.some(student => student.user.email === email);
        }
        return false;
    } catch (error) {
        console.error('Error checking existing students:', error.message);
        return false;
    }
}

/**
 * Create student via system API
 */
async function createStudentViaAPI(customerData) {
    const names = customerData.name.trim().split(' ');
    const firstName = names[0] || customerData.name;
    const lastName = names.slice(1).join(' ') || '';

    const studentData = {
        firstName,
        lastName,
        email: customerData.email,
        phone: customerData.phone || '',
        cpf: customerData.cpfCnpj || '',
        category: 'ADULT',
        gender: 'MASCULINO' // Default, can be updated later
    };

    const response = await fetch(`${SYSTEM_API_BASE}/students`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(studentData)
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to create student: ${response.status} ${errorData}`);
    }

    const result = await response.json();
    return result.data;
}

/**
 * Import single customer
 */
async function importCustomer(customer, dryRun = false) {
    try {
        console.log(`👤 Processing: ${customer.name} (${customer.email || 'no email'})`);
        
        // Skip customers without email
        if (!customer.email) {
            return { 
                success: false, 
                error: 'No email provided',
                skipped: true 
            };
        }

        if (dryRun) {
            console.log(`🔍 DRY RUN - Would import: ${customer.name}`);
            return { success: true, dryRun: true };
        }

        // Check if student already exists
        const exists = await checkStudentExists(customer.email);
        if (exists) {
            console.log(`⏭️ Skipping ${customer.name} - already exists`);
            return { 
                success: true, 
                skipped: true,
                reason: 'already exists' 
            };
        }

        // Create student
        const student = await createStudentViaAPI(customer);
        console.log(`✅ Successfully imported: ${customer.name} (ID: ${student.id})`);
        
        return { 
            success: true, 
            data: student,
            customer: customer
        };

    } catch (error) {
        console.error(`❌ Failed to import: ${customer.name} - ${error.message}`);
        return { 
            success: false, 
            error: error.message,
            customer: customer
        };
    }
}

/**
 * Main import function
 */
async function importAsaasCustomers(options = {}) {
    const {
        limit = 100,
        dryRun = false
    } = options;

    console.log('🚀 Starting Asaas customer import...');
    console.log(`📊 Options: limit=${limit}, dryRun=${dryRun}`);

    const stats = {
        processed: 0,
        imported: 0,
        skipped: 0,
        errors: 0,
        errorList: []
    };

    try {
        let offset = 0;
        let totalProcessed = 0;

        while (totalProcessed < limit) {
            const batchLimit = Math.min(50, limit - totalProcessed);
            const { customers, hasMore } = await fetchAsaasCustomers(batchLimit, offset);
            
            if (customers.length === 0) break;

            console.log(`\n📦 Processing batch of ${customers.length} customers...`);

            for (const customer of customers) {
                if (totalProcessed >= limit) break;
                
                const result = await importCustomer(customer, dryRun);
                stats.processed++;
                totalProcessed++;

                if (result.success && !result.dryRun) {
                    if (result.skipped) {
                        stats.skipped++;
                    } else {
                        stats.imported++;
                    }
                } else if (!result.success) {
                    stats.errors++;
                    stats.errorList.push(`${customer.name}: ${result.error}`);
                }
            }

            console.log(`📊 Batch completed. Progress: ${totalProcessed} processed`);
            
            if (!hasMore || totalProcessed >= limit) break;
            offset += batchLimit;
        }

        // Final summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 IMPORT SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total processed: ${stats.processed}`);
        console.log(`✅ Successfully imported: ${stats.imported}`);
        console.log(`⏭️ Skipped (already exist): ${stats.skipped}`);
        console.log(`❌ Errors: ${stats.errors}`);

        if (stats.errorList.length > 0) {
            console.log('\n❌ ERRORS:');
            stats.errorList.forEach(error => console.log(`  - ${error}`));
        }

        console.log('\n🎉 Import process completed!');
        return stats;

    } catch (error) {
        console.error('❌ Import process failed:', error.message);
        console.error('💥 Fatal error:', error.message);
        throw error;
    }
}

/**
 * CLI interface
 */
if (require.main === module) {
    const args = process.argv.slice(2);
    
    const options = {
        limit: 100,
        dryRun: false
    };

    // Parse command line arguments
    args.forEach(arg => {
        if (arg.startsWith('--limit=')) {
            options.limit = parseInt(arg.split('=')[1]) || 100;
        } else if (arg === '--dry-run') {
            options.dryRun = true;
        } else if (arg === '--help') {
            console.log(`
Asaas Customer Import Script

Usage: node asaas-import-simple.js [options]

Options:
  --limit=N         Import maximum N customers (default: 100)
  --dry-run         Simulate import without creating records
  --help            Show this help message

Examples:
  node asaas-import-simple.js --limit=10
  node asaas-import-simple.js --dry-run
  node asaas-import-simple.js --limit=50 --dry-run
            `);
            process.exit(0);
        }
    });

    importAsaasCustomers(options)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = { importAsaasCustomers, importCustomer };