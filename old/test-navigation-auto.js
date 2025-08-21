// Test script for student navigation
console.log('🧪 Testing Student Navigation Flow');

// Step 1: Set up localStorage with student data
const studentId = 'd61ae58e-8db6-4d96-a909-887df891ce08';
const editorData = {
    mode: 'edit',
    studentId: studentId,
    timestamp: Date.now()
};

console.log('📱 Setting localStorage:', editorData);
localStorage.setItem('studentEditorMode', JSON.stringify(editorData));

// Step 2: Test API call
async function testAPI() {
    try {
        console.log('🔍 Testing API call...');
        const response = await fetch(`/api/students/${studentId}`);
        const result = await response.json();
        
        console.log('📊 API Response:', result);
        
        if (result.success && result.data) {
            console.log('✅ API test successful - Student:', result.data.name);
            return true;
        } else {
            console.log('❌ API test failed - No data');
            return false;
        }
    } catch (error) {
        console.log('❌ API test error:', error.message);
        return false;
    }
}

// Step 3: Navigate to student editor
function navigateToEditor() {
    console.log('🔄 Navigating to student editor...');
    window.location.href = '/views/student-editor.html';
}

// Run tests
testAPI().then(success => {
    if (success) {
        console.log('✅ All tests passed! Ready to navigate.');
        setTimeout(navigateToEditor, 2000); // Navigate after 2 seconds
    } else {
        console.log('❌ Tests failed. Check the server and API.');
    }
});
