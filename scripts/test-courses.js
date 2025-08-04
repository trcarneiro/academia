#!/usr/bin/env node
/**
 * Test script for courses module
 * Run with: node scripts/test-courses.js
 */

const axios = require('axios');
const colors = require('colors');

const BASE_URL = 'http://localhost:3000';

// Test data
const testCourse = {
    title: 'Defesa Pessoal - Nível Iniciante',
    description: 'Curso completo de defesa pessoal para iniciantes. Aprenda técnicas básicas de proteção pessoal em situações reais. 24 semanas de treinamento intensivo.',
    targetAudience: 'Adultos 15+ anos, sem experiência prévia',
    duration: 24,
    category: 'BEGINNER',
    active: true
};

async function testCoursesModule() {
    console.log('🧪 Testing Courses Module'.cyan.bold);
    console.log('================================'.cyan);
    
    try {
        // Test 1: GET /api/courses (empty)
        console.log('\n1. GET /api/courses (initial)'.yellow);
        const initialResponse = await axios.get(`${BASE_URL}/api/courses`);
        console.log(`   ✅ Status: ${initialResponse.status}`);
        console.log(`   📊 Courses count: ${initialResponse.data.data.length}`);
        
        // Test 2: POST /api/courses (create)
        console.log('\n2. POST /api/courses (create)'.yellow);
        const createResponse = await axios.post(`${BASE_URL}/api/courses`, testCourse);
        const createdCourse = createResponse.data.data;
        console.log(`   ✅ Status: ${createResponse.status}`);
        console.log(`   🆔 Created course ID: ${createdCourse.id}`);
        console.log(`   📋 Title: ${createdCourse.title}`);
        
        // Test 3: GET /api/courses (with data)
        console.log('\n3. GET /api/courses (after create)'.yellow);
        const afterCreateResponse = await axios.get(`${BASE_URL}/api/courses`);
        console.log(`   ✅ Status: ${afterCreateResponse.status}`);
        console.log(`   📊 Courses count: ${afterCreateResponse.data.data.length}`);
        
        // Test 4: GET /api/courses/:id (single course)
        console.log('\n4. GET /api/courses/:id'.yellow);
        const singleResponse = await axios.get(`${BASE_URL}/api/courses/${createdCourse.id}`);
        console.log(`   ✅ Status: ${singleResponse.status}`);
        console.log(`   📋 Course title: ${singleResponse.data.data.title}`);
        
        // Test 5: PATCH /api/courses/:id (update)
        console.log('\n5. PATCH /api/courses/:id (update)'.yellow);
        const updateData = {
            title: 'Defesa Pessoal - Nível Iniciante (Atualizado)',
            duration: 26
        };
        const updateResponse = await axios.patch(`${BASE_URL}/api/courses/${createdCourse.id}`, updateData);
        console.log(`   ✅ Status: ${updateResponse.status}`);
        console.log(`   📋 Updated title: ${updateResponse.data.data.title}`);
        console.log(`   📅 Updated duration: ${updateResponse.data.data.duration}`);
        
        // Test 6: DELETE /api/courses/:id (delete)
        console.log('\n6. DELETE /api/courses/:id'.yellow);
        const deleteResponse = await axios.delete(`${BASE_URL}/api/courses/${createdCourse.id}`);
        console.log(`   ✅ Status: ${deleteResponse.status}`);
        console.log(`   🗑️  Message: ${deleteResponse.data.message}`);
        
        // Test 7: GET /api/courses (final)
        console.log('\n7. GET /api/courses (final)'.yellow);
        const finalResponse = await axios.get(`${BASE_URL}/api/courses`);
        console.log(`   ✅ Status: ${finalResponse.status}`);
        console.log(`   📊 Final courses count: ${finalResponse.data.data.length}`);
        
        console.log('\n✅ All tests passed!'.green.bold);
        console.log('================================'.green);
        
    } catch (error) {
        console.error('\n❌ Test failed:'.red.bold);
        console.error(`   Error: ${error.message}`.red);
        if (error.response) {
            console.error(`   Status: ${error.response.status}`.red);
            console.error(`   Data: ${JSON.stringify(error.response.data)}`.red);
        }
        process.exit(1);
    }
}

// Test validation errors
async function testValidation() {
    console.log('\n🧪 Testing Validation Errors'.cyan.bold);
    console.log('================================'.cyan);
    
    const invalidCourses = [
        { title: 'A', description: 'Test', targetAudience: 'Test', duration: 1, category: 'BEGINNER' },
        { title: 'Valid Title', description: 'Short', targetAudience: 'Test', duration: 1, category: 'BEGINNER' },
        { title: 'Valid Title', description: 'Valid description', targetAudience: 'Test', duration: 0, category: 'BEGINNER' },
        { title: 'Valid Title', description: 'Valid description', targetAudience: 'Test', duration: 1, category: 'INVALID' }
    ];
    
    for (let i = 0; i < invalidCourses.length; i++) {
        try {
            console.log(`\n${i + 1}. Testing invalid course ${i + 1}`.yellow);
            await axios.post(`${BASE_URL}/api/courses`, invalidCourses[i]);
            console.log(`   ❌ Expected validation error but got success`.red);
        } catch (error) {
            console.log(`   ✅ Validation error caught: ${error.response?.data?.error || error.message}`.green);
        }
    }
}

// Run tests
async function runTests() {
    try {
        // Wait for server to be ready
        console.log('⏳ Waiting for server...'.gray);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await testCoursesModule();
        await testValidation();
        
        console.log('\n🎉 All tests completed successfully!'.green.bold);
        console.log('\n📚 Next steps:'.cyan);
        console.log('   1. Open http://localhost:3000/views/courses.html'.white);
        console.log('   2. Test the UI manually'.white);
        console.log('   3. Check browser console for any errors'.white);
        
    } catch (error) {
        console.error('\n💥 Test suite failed:'.red.bold);
        console.error(error.message.red);
        process.exit(1);
    }
}

// Check if server is running
async function checkServer() {
    try {
        await axios.get(`${BASE_URL}/health`);
        console.log('✅ Server is running'.green);
        return true;
    } catch (error) {
        console.error('❌ Server is not running. Please start with: npm run dev'.red);
        return false;
    }
}

// Main execution
async function main() {
    const serverRunning = await checkServer();
    if (serverRunning) {
        await runTests();
    } else {
        process.exit(1);
    }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { testCoursesModule, testValidation };
