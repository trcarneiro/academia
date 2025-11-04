// Simple test script to debug instructors module loading
console.log('🧪 Starting Instructors Module Debug Test');

// Test 1: Check if InstructorsController exists
setTimeout(() => {
  console.log('🧪 Test 1: InstructorsController availability');
  console.log('window.InstructorsController:', typeof window.InstructorsController);
  console.log('InstructorsController exists:', !!window.InstructorsController);
  
  if (window.InstructorsController) {
    try {
      const testController = new window.InstructorsController();
      console.log('✅ InstructorsController can be instantiated');
      console.log('Controller methods:', Object.getOwnPropertyNames(window.InstructorsController.prototype));
    } catch (error) {
      console.error('❌ InstructorsController instantiation failed:', error);
    }
  }
}, 2000);

// Test 2: Check if API client is available
setTimeout(() => {
  console.log('🧪 Test 2: API Client availability');
  console.log('window.createModuleAPI:', typeof window.createModuleAPI);
  
  if (window.createModuleAPI) {
    try {
      const testAPI = window.createModuleAPI('TestInstructors');
      console.log('✅ API Client can be created');
      console.log('API methods:', Object.getOwnPropertyNames(testAPI));
    } catch (error) {
      console.error('❌ API Client creation failed:', error);
    }
  }
}, 3000);

// Test 3: Check instructors module state
setTimeout(() => {
  console.log('🧪 Test 3: Instructors Module state');
  console.log('window.instructorsModule:', !!window.instructorsModule);
  if (window.instructorsModule) {
    console.log('Module _isInitialized:', window.instructorsModule._isInitialized);
    console.log('Module _isInitializing:', window.instructorsModule._isInitializing);
    console.log('Module controller:', !!window.instructorsModule.controller);
    console.log('Module api:', !!window.instructorsModule.api);
  }
}, 4000);

// Test 4: Manual module initialization
window.testInstructorsInit = async function() {
  console.log('🧪 Test 4: Manual module initialization');
  
  // Create a test container
  const testContainer = document.createElement('div');
  testContainer.id = 'test-instructors-container';
  testContainer.className = 'module-content';
  document.body.appendChild(testContainer);
  
  try {
    const result = await window.initInstructorsModule(testContainer);
    console.log('✅ Manual initialization successful:', result);
  } catch (error) {
    console.error('❌ Manual initialization failed:', error);
  }
};

console.log('🧪 Debug script loaded. Available functions:');
console.log('- testInstructorsInit() - Test manual initialization');
