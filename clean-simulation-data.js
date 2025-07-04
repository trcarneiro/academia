#!/usr/bin/env node

/**
 * Clean Simulation Data Script
 * Remove todos os dados de simulação para preparar para dados reais do Asaas
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Clean all simulation data
 */
async function cleanSimulationData() {
    console.log('🧹 Starting simulation data cleanup...');
    
    if (!SUPABASE_URL || !SUPABASE_KEY) {
        console.error('❌ Supabase configuration missing');
        process.exit(1);
    }

    const stats = {
        deleted: {
            attendance: 0,
            evaluations: 0,
            progress: 0,
            studentCourses: 0,
            students: 0,
            users: 0,
            weeklyChallenge: 0
        }
    };

    try {
        console.log('\n📋 CLEANING ATTENDANCE RECORDS...');
        const { error: attendanceError, count: attendanceCount } = await supabase
            .from('Attendance')
            .delete()
            .neq('id', 'dummy'); // Delete all

        if (attendanceError) throw attendanceError;
        stats.deleted.attendance = attendanceCount || 0;
        console.log(`✅ Deleted ${stats.deleted.attendance} attendance records`);

        console.log('\n📊 CLEANING EVALUATION RECORDS...');
        const { error: evaluationError, count: evaluationCount } = await supabase
            .from('EvaluationRecord')
            .delete()
            .neq('id', 'dummy');

        if (evaluationError) throw evaluationError;
        stats.deleted.evaluations = evaluationCount || 0;
        console.log(`✅ Deleted ${stats.deleted.evaluations} evaluation records`);

        console.log('\n📈 CLEANING PROGRESS RECORDS...');
        const { error: progressError, count: progressCount } = await supabase
            .from('Progress')
            .delete()
            .neq('id', 'dummy');

        if (progressError) throw progressError;
        stats.deleted.progress = progressCount || 0;
        console.log(`✅ Deleted ${stats.deleted.progress} progress records`);

        console.log('\n🏆 CLEANING WEEKLY CHALLENGES...');
        const { error: challengeError, count: challengeCount } = await supabase
            .from('WeeklyChallenge')
            .delete()
            .neq('id', 'dummy');

        if (challengeError) throw challengeError;
        stats.deleted.weeklyChallenge = challengeCount || 0;
        console.log(`✅ Deleted ${stats.deleted.weeklyChallenge} weekly challenge records`);

        console.log('\n📚 CLEANING STUDENT-COURSE ENROLLMENTS...');
        const { error: enrollmentError, count: enrollmentCount } = await supabase
            .from('StudentCourse')
            .delete()
            .neq('id', 'dummy');

        if (enrollmentError) throw enrollmentError;
        stats.deleted.studentCourses = enrollmentCount || 0;
        console.log(`✅ Deleted ${stats.deleted.studentCourses} enrollment records`);

        console.log('\n🎓 CLEANING STUDENT RECORDS...');
        const { error: studentError, count: studentCount } = await supabase
            .from('Student')
            .delete()
            .neq('id', 'dummy');

        if (studentError) throw studentError;
        stats.deleted.students = studentCount || 0;
        console.log(`✅ Deleted ${stats.deleted.students} student records`);

        console.log('\n👤 CLEANING USER RECORDS (STUDENTS ONLY)...');
        const { error: userError, count: userCount } = await supabase
            .from('User')
            .delete()
            .eq('role', 'STUDENT');

        if (userError) throw userError;
        stats.deleted.users = userCount || 0;
        console.log(`✅ Deleted ${stats.deleted.users} user records`);

        // Final summary
        console.log('\n' + '='.repeat(60));
        console.log('🧹 CLEANUP SUMMARY');
        console.log('='.repeat(60));
        console.log(`👤 Users deleted: ${stats.deleted.users}`);
        console.log(`🎓 Students deleted: ${stats.deleted.students}`);
        console.log(`📚 Enrollments deleted: ${stats.deleted.studentCourses}`);
        console.log(`📋 Attendance records deleted: ${stats.deleted.attendance}`);
        console.log(`📊 Evaluation records deleted: ${stats.deleted.evaluations}`);
        console.log(`📈 Progress records deleted: ${stats.deleted.progress}`);
        console.log(`🏆 Challenge records deleted: ${stats.deleted.weeklyChallenge}`);
        
        const totalDeleted = Object.values(stats.deleted).reduce((sum, count) => sum + count, 0);
        console.log(`\n🎯 TOTAL RECORDS DELETED: ${totalDeleted}`);

        console.log('\n✅ Simulation data cleanup completed successfully!');
        console.log('📝 System is now ready for Asaas customer import');

        return stats;

    } catch (error) {
        console.error('❌ Error during cleanup:', error.message);
        throw error;
    }
}

/**
 * CLI interface
 */
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('--help')) {
        console.log(`
Clean Simulation Data Script

Usage: node clean-simulation-data.js [options]

Options:
  --help             Show this help message
  --confirm          Skip confirmation prompt

Environment Variables:
  SUPABASE_URL       Your Supabase project URL (required)
  SUPABASE_SERVICE_KEY  Your Supabase service key (required)

Examples:
  node clean-simulation-data.js
  node clean-simulation-data.js --confirm
        `);
        process.exit(0);
    }

    const skipConfirmation = args.includes('--confirm');

    if (!skipConfirmation) {
        console.log('⚠️  WARNING: This will delete ALL simulation data from the database!');
        console.log('This includes users, students, enrollments, attendance, and progress records.');
        console.log('\nPress Ctrl+C to cancel, or any key to continue...');
        
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.on('data', () => {
            process.stdin.setRawMode(false);
            cleanSimulationData()
                .then(() => process.exit(0))
                .catch(() => process.exit(1));
        });
    } else {
        cleanSimulationData()
            .then(() => process.exit(0))
            .catch(() => process.exit(1));
    }
}

module.exports = { cleanSimulationData };