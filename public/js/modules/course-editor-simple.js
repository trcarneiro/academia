// Course Editor Simple Module - Test Version
// Following CLAUDE.md guidelines: API-first, modular isolation

console.log('📝 Course Editor Simple Module - Starting...');

// Global variables
let currentCourseId = null;
let isEditMode = false;

// Module initialization function
async function initializeCourseEditorSimpleModule() {
    console.log('🔧 Initializing Course Editor Simple Module...');
    
    try {
        // Wait for DOM to be ready
        await waitForCourseEditorSimpleDOM();
        
        // Get course ID from URL or global variable
        currentCourseId = getCurrentCourseId();
        isEditMode = !!currentCourseId;
        
        // Update UI based on mode
        updateUIForMode();
        
        // Load course data if editing
        if (isEditMode) {
            await loadCourseData(currentCourseId);
        }
        
        // Setup event listeners
        setupEventListeners();
        
        console.log('✅ Course Editor Simple Module initialized successfully');
        
    } catch (error) {
        console.error('❌ Error initializing Course Editor Simple Module:', error);
        showMessage('Erro ao inicializar editor de curso', 'error');
    }
}

// Wait for DOM elements to be available
async function waitForCourseEditorSimpleDOM() {
    console.log('🔍 Waiting for course editor simple DOM...');
    
    const maxAttempts = 20;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
        const container = document.querySelector('.course-editor-simple-isolated');
        const nameInput = document.getElementById('courseName');
        
        if (container && nameInput) {
            console.log('✅ Course editor simple DOM found');
            return;
        }
        
        attempts++;
        console.log(`⏳ Waiting for course editor simple DOM... (attempt ${attempts}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new Error('Course editor simple DOM not found after waiting');
}

// Get current course ID from various sources
function getCurrentCourseId() {
    // Try to get from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const urlId = urlParams.get('id') || urlParams.get('courseId');
    
    // Try to get from global variable set by navigation
    const globalId = window.currentCourseId;
    
    // Try to get from localStorage (fallback)
    const storageId = localStorage.getItem('editingCourseId');
    
    const courseId = urlId || globalId || storageId;
    console.log('🔍 Current course ID:', courseId);
    
    return courseId;
}

// Update UI based on edit/create mode
function updateUIForMode() {
    const titleElement = document.getElementById('titleText');
    const saveButton = document.getElementById('saveCourseBtn');
    
    if (isEditMode) {
        titleElement.textContent = 'Editar Curso';
        saveButton.innerHTML = '💾 Atualizar Curso';
    } else {
        titleElement.textContent = 'Novo Curso';
        saveButton.innerHTML = '➕ Criar Curso';
    }
}

// Load course data for editing
async function loadCourseData(courseId) {
    console.log('📊 Loading course data for ID:', courseId);
    
    try {
        showLoading(true);
        
        const response = await fetch(`/api/courses/${courseId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('📊 Course data loaded:', data);
        
        if (data.success && data.data) {
            populateForm(data.data);
        } else {
            throw new Error('Invalid course data received');
        }
        
    } catch (error) {
        console.error('❌ Error loading course data:', error);
        showMessage('Erro ao carregar dados do curso', 'error');
    } finally {
        showLoading(false);
    }
}

// Populate form with course data
function populateForm(courseData) {
    console.log('📝 Populating form with course data');
    
    // Basic information
    setInputValue('courseName', courseData.name || '');
    setInputValue('courseLevel', courseData.level || '');
    setInputValue('courseDuration', courseData.duration || '');
    setInputValue('coursePrice', courseData.price || '');
    setInputValue('courseDescription', courseData.description || '');
    
    // Status and configuration
    setInputValue('courseStatus', courseData.status || 'active');
    setInputValue('courseCategory', courseData.category || '');
}

// Helper function to set input values safely
function setInputValue(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.value = value;
    }
}

// Setup event listeners
function setupEventListeners() {
    console.log('🔧 Setting up event listeners...');
    
    // Form validation on input
    const requiredFields = ['courseName', 'courseLevel', 'courseDuration'];
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('input', validateForm);
        }
    });
    
    console.log('✅ Event listeners setup completed');
}

// Validate form
function validateForm() {
    const courseName = document.getElementById('courseName').value.trim();
    const courseLevel = document.getElementById('courseLevel').value;
    const courseDuration = document.getElementById('courseDuration').value;
    
    const isValid = courseName && courseLevel && courseDuration;
    
    const saveButton = document.getElementById('saveCourseBtn');
    if (saveButton) {
        saveButton.disabled = !isValid;
        saveButton.style.opacity = isValid ? '1' : '0.6';
    }
    
    return isValid;
}

// Save course function (global for onclick)
async function saveCourseSimple() {
    console.log('💾 Saving course...');
    
    try {
        if (!validateForm()) {
            showMessage('Por favor, preencha todos os campos obrigatórios', 'error');
            return;
        }
        
        showLoading(true);
        
        const courseData = {
            name: document.getElementById('courseName').value.trim(),
            level: document.getElementById('courseLevel').value,
            duration: parseInt(document.getElementById('courseDuration').value),
            price: parseFloat(document.getElementById('coursePrice').value) || 0,
            description: document.getElementById('courseDescription').value.trim(),
            status: document.getElementById('courseStatus').value,
            category: document.getElementById('courseCategory').value
        };
        
        console.log('📤 Sending course data:', courseData);
        
        const url = isEditMode ? `/api/courses/${currentCourseId}` : '/api/courses';
        const method = isEditMode ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(courseData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('✅ Course saved successfully:', result);
        
        showMessage(
            isEditMode ? 'Curso atualizado com sucesso!' : 'Curso criado com sucesso!', 
            'success'
        );
        
        // Navigate back after short delay
        setTimeout(() => {
            goBack();
        }, 1500);
        
    } catch (error) {
        console.error('❌ Error saving course:', error);
        showMessage('Erro ao salvar curso. Tente novamente.', 'error');
    } finally {
        showLoading(false);
    }
}

// Show/hide loading state
function showLoading(show) {
    const loadingElement = document.getElementById('courseEditorLoading');
    const contentElement = document.getElementById('courseEditorContent');
    
    if (loadingElement && contentElement) {
        loadingElement.style.display = show ? 'flex' : 'none';
        contentElement.style.display = show ? 'none' : 'block';
    }
}

// Show message to user
function showMessage(message, type = 'info') {
    const messageContainer = document.getElementById('messageContainer');
    if (!messageContainer) return;
    
    messageContainer.textContent = message;
    messageContainer.className = `message-container ${type}`;
    messageContainer.style.display = 'block';
    
    // Auto-hide after 4 seconds
    setTimeout(() => {
        messageContainer.style.display = 'none';
    }, 4000);
}

// Go back function (global for onclick)
function goBack() {
    console.log('↩️ Going back...');
    
    // Clear editing state
    localStorage.removeItem('editingCourseId');
    window.currentCourseId = null;
    
    // Navigate back to courses list
    if (typeof window.navigateTo === 'function') {
        window.navigateTo('courses');
    } else {
        // Fallback
        window.location.href = '#courses';
        window.location.reload();
    }
}

// Make functions globally available
window.initializeCourseEditorSimpleModule = initializeCourseEditorSimpleModule;
window.saveCourseSimple = saveCourseSimple;
window.goBack = goBack;

console.log('📝 Course Editor Simple Module - Loaded');
