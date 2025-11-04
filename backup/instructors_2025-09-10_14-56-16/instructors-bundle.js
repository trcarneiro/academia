// Instructors Module Bundle - Load all dependencies in correct order
// This file ensures all dependencies are loaded before the main module

// Load Service
const loadService = new Promise((resolve) => {
  const script = document.createElement('script');
  script.src = 'js/modules/instructors/services/InstructorsService.js';
  script.onload = resolve;
  document.head.appendChild(script);
});

// Load View after Service
const loadView = loadService.then(() => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'js/modules/instructors/views/InstructorsListView.js';
    script.onload = resolve;
    document.head.appendChild(script);
  });
});

// Load Controller after View
const loadController = loadView.then(() => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'js/modules/instructors/controllers/InstructorsController.js';
    script.onload = resolve;
    document.head.appendChild(script);
  });
});

// Load Main Module after all dependencies
const loadModule = loadController.then(() => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'js/modules/instructors/index.js';
    script.onload = resolve;
    document.head.appendChild(script);
  });
});

// Export promise for completion
window.instructorsModuleLoaded = loadModule;
