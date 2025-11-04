// 🔧 DEBUG SCRIPT - Delete Button Test
// Copie e cole no console do navegador (F12)

console.log('🧪 Testing Delete Button...');

// 1. Check if StudentEditorController exists
console.log('1️⃣ Checking window.studentEditor...');
console.log('window.studentEditor exists?', !!window.studentEditor);
console.log('window.studentEditor type:', typeof window.studentEditor);

if (window.studentEditor) {
    console.log('2️⃣ Checking methods...');
    console.log('checkAndDeleteSubscription exists?', typeof window.studentEditor.checkAndDeleteSubscription);
    console.log('confirmDeleteSubscription exists?', typeof window.studentEditor.confirmDeleteSubscription);
    console.log('deleteSubscription exists?', typeof window.studentEditor.deleteSubscription);
    
    console.log('3️⃣ Checking API...');
    console.log('API exists?', !!window.studentEditor.api);
    console.log('API.api exists?', !!window.studentEditor.api?.api);
    
    console.log('4️⃣ Checking delete method on api.api...');
    console.log('api.api.delete exists?', typeof window.studentEditor.api.api?.delete);
    
    console.log('5️⃣ Current student data...');
    console.log('Current student:', window.studentEditor.current?.id);
    console.log('Current student subscriptions:', window.studentEditor.current?.subscriptions);
}

console.log('6️⃣ Trying to call delete directly...');
if (window.studentEditor && window.studentEditor.checkAndDeleteSubscription) {
    // Get first subscription ID
    const firstSubId = window.studentEditor.current?.subscriptions?.[0]?.id;
    if (firstSubId) {
        console.log('Calling checkAndDeleteSubscription with ID:', firstSubId);
        window.studentEditor.checkAndDeleteSubscription(firstSubId);
    } else {
        console.log('❌ No subscription found!');
    }
} else {
    console.log('❌ StudentEditor or method not found!');
}
