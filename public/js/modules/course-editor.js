(function() {
    'use strict';
    
    console.log('📝 Course Editor Module - Starting...');
    
    // Module state
    let currentCourse = null;
    let isEditing = false;
    let isInitialized = false;
    let isDirty = false;
    
    // Export initialization function
    window.initializeCourseEditorModule = initializeCourseEditorModule;
    
    // Module initialization
    async function initializeCourseEditorModule() {
        if (isInitialized) {
            console.log('ℹ️ Course editor already initialized, skipping...');
            return;
        }
        
        console.log('🔧 Initializing Course Editor Module...');
        
        try {
            // Simplified DOM check - SPA timing is now fixed
            const editorElement = document.querySelector('.course-editor-isolated');
            
            if (!editorElement) {
                console.log('ℹ️ Course editor DOM not found, skipping initialization');
                return;
            }
            
            console.log('✅ Course editor DOM found');
            isInitialized = true;
            
            // Check if editing existing course
            const urlParams = new URLSearchParams(window.location.search);
            const courseId = urlParams.get('id') || window.currentCourseId;
            
            if (courseId) {
                isEditing = true;
                console.log('📝 Loading course for edit:', courseId);
                await loadCourseForEdit(courseId);
                updateUIForEdit();
            } else {
                console.log('➕ Initializing new course form');
                initializeNewCourse();
            }
            
            setupEventListeners();
            setupFormValidation();
            
            console.log('✅ Course Editor Module initialized');
            
        } catch (error) {
            console.error('❌ Error initializing course editor:', error);
            showError(`Erro ao inicializar editor de curso: ${error.message}`);
        }
    }
    
    // Initialize new course with default values
    function initializeNewCourse() {
        currentCourse = {
            name: '',
            description: '',
            methodology: '',
            level: '',
            target: '',
            duration: 16,
            status: 'ACTIVE',
            generalObjectives: [''],
            specificObjectives: [''],
            resources: [''],
            evaluation: {
                criteria: [''],
                methods: [''],
                requirements: ''
            }
        };
        
        console.log('📝 New course initialized');
    }
    
    // Load course for editing
    async function loadCourseForEdit(courseId) {
        try {
            showLoadingState();
            
            const response = await fetch(`/api/courses/${courseId}`);
            if (!response.ok) {
                throw new Error(`Curso não encontrado: ${response.status}`);
            }
            
            const result = await response.json();
            if (result.success) {
                currentCourse = result.data;
                populateForm();
                console.log('✅ Course loaded for edit:', currentCourse.name);
            } else {
                throw new Error(result.error || 'Erro ao carregar curso');
            }
            
        } catch (error) {
            console.error('❌ Error loading course:', error);
            showError('Erro ao carregar curso para edição');
        } finally {
            hideLoadingState();
        }
    }
    
    // Update UI for edit mode
    function updateUIForEdit() {
        const titleText = document.getElementById('titleText');
        const saveCourseBtn = document.getElementById('saveCourseBtn');
        
        if (titleText) titleText.textContent = 'Editar Curso';
        if (saveCourseBtn) saveCourseBtn.innerHTML = '💾 Atualizar Curso';
    }
    
    // Populate form with course data
    function populateForm() {
        // Basic fields
        setValue('courseName', currentCourse.name);
        setValue('courseDescription', currentCourse.description);
        setValue('courseMethodology', currentCourse.methodology);
        setValue('courseLevel', currentCourse.level);
        setValue('courseTarget', currentCourse.target);
        setValue('courseDuration', currentCourse.duration);
        setValue('courseStatus', currentCourse.status);
        
        // Evaluation requirements
        setValue('evaluationRequirements', currentCourse.evaluation?.requirements);
        
        // Populate dynamic lists
        populateObjectivesList('generalObjectives', currentCourse.generalObjectives);
        populateObjectivesList('specificObjectives', currentCourse.specificObjectives);
        populateResourcesList(currentCourse.resources);
        populateEvalList('evaluationCriteria', currentCourse.evaluation?.criteria);
        populateEvalList('evaluationMethods', currentCourse.evaluation?.methods);
    }
    
    // Helper function to set form values
    function setValue(id, value) {
        const element = document.getElementById(id);
        if (element && value !== undefined && value !== null) {
            element.value = value;
        }
    }
    
    // Populate objectives lists
    function populateObjectivesList(containerId, objectives) {
        const container = document.getElementById(containerId);
        if (!container || !objectives) return;
        
        container.innerHTML = '';
        
        objectives.forEach((objective, index) => {
            if (objective.trim() || index === 0) {
                addObjectiveItem(containerId, objective);
            }
        });
        
        // Ensure at least one empty item
        if (container.children.length === 0) {
            addObjectiveItem(containerId, '');
        }
    }
    
    // Populate resources list
    function populateResourcesList(resources) {
        const container = document.getElementById('resourcesList');
        if (!container || !resources) return;
        
        container.innerHTML = '';
        
        resources.forEach((resource, index) => {
            if (resource.trim() || index === 0) {
                addResourceItem(resource);
            }
        });
        
        // Ensure at least one empty item
        if (container.children.length === 0) {
            addResourceItem('');
        }
    }
    
    // Populate evaluation lists
    function populateEvalList(containerId, items) {
        const container = document.getElementById(containerId);
        if (!container || !items) return;
        
        container.innerHTML = '';
        
        items.forEach((item, index) => {
            if (item.trim() || index === 0) {
                addEvalItem(containerId.replace('evaluation', '').toLowerCase(), item);
            }
        });
        
        // Ensure at least one empty item
        if (container.children.length === 0) {
            addEvalItem(containerId.replace('evaluation', '').toLowerCase(), '');
        }
    }
    
    // Setup event listeners
    function setupEventListeners() {
        // Form change tracking
        const form = document.getElementById('editorContent');
        if (form) {
            form.addEventListener('input', markAsDirty);
            form.addEventListener('change', markAsDirty);
        }
        
        // Prevent accidental navigation
        window.addEventListener('beforeunload', handleBeforeUnload);
        
        console.log('✅ Event listeners setup completed');
    }
    
    // Setup form validation
    function setupFormValidation() {
        const requiredFields = ['courseName', 'courseLevel', 'courseTarget'];
        
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('blur', validateField);
            }
        });
    }
    
    // Mark form as dirty
    function markAsDirty() {
        isDirty = true;
    }
    
    // Handle before unload
    function handleBeforeUnload(event) {
        if (isDirty) {
            event.preventDefault();
            event.returnValue = '';
        }
    }
    
    // Validate individual field
    function validateField(event) {
        const field = event.target;
        const value = field.value.trim();
        
        if (field.required && !value) {
            field.classList.add('error');
            showFieldError(field, 'Este campo é obrigatório');
        } else {
            field.classList.remove('error');
            hideFieldError(field);
        }
    }
    
    // Show field error
    function showFieldError(field, message) {
        let errorEl = field.parentNode.querySelector('.field-error');
        if (!errorEl) {
            errorEl = document.createElement('div');
            errorEl.className = 'field-error';
            field.parentNode.appendChild(errorEl);
        }
        errorEl.textContent = message;
    }
    
    // Hide field error
    function hideFieldError(field) {
        const errorEl = field.parentNode.querySelector('.field-error');
        if (errorEl) {
            errorEl.remove();
        }
    }
    
    // Add objective item
    function addObjectiveItem(containerId, value = '') {
        const container = document.getElementById(containerId);
        const type = containerId.includes('general') ? 'general' : 'specific';
        
        const item = document.createElement('div');
        item.className = 'objective-item';
        item.innerHTML = `
            <textarea placeholder="Descreva um objetivo ${type === 'general' ? 'geral' : 'específico'} do curso...">${value}</textarea>
            <button type="button" class="remove-btn" onclick="removeObjective(this, '${type}')">🗑️</button>
        `;
        
        container.appendChild(item);
    }
    
    // Add resource item
    function addResourceItem(value = '') {
        const container = document.getElementById('resourcesList');
        
        const item = document.createElement('div');
        item.className = 'resource-item';
        item.innerHTML = `
            <input type="text" placeholder="Ex: Tatame, Luvas de boxe, Escudos..." value="${value}">
            <button type="button" class="remove-btn" onclick="removeResource(this)">🗑️</button>
        `;
        
        container.appendChild(item);
    }
    
    // Add evaluation item
    function addEvalItemElement(type, value = '') {
        const containerId = type === 'criteria' ? 'evaluationCriteria' : 'evaluationMethods';
        const container = document.getElementById(containerId);
        const placeholder = type === 'criteria' ? 'Ex: Execução correta das técnicas' : 'Ex: Avaliação prática individual';
        
        const item = document.createElement('div');
        item.className = 'eval-item';
        item.innerHTML = `
            <input type="text" placeholder="${placeholder}" value="${value}">
            <button type="button" class="remove-btn" onclick="removeEvalItem(this, '${type}')">🗑️</button>
        `;
        
        container.appendChild(item);
    }
    
    // Collect form data
    function collectFormData() {
        return {
            name: document.getElementById('courseName').value.trim(),
            description: document.getElementById('courseDescription').value.trim(),
            methodology: document.getElementById('courseMethodology').value.trim(),
            level: document.getElementById('courseLevel').value,
            target: document.getElementById('courseTarget').value,
            duration: parseInt(document.getElementById('courseDuration').value),
            status: document.getElementById('courseStatus').value,
            generalObjectives: collectTextList('#generalObjectives textarea'),
            specificObjectives: collectTextList('#specificObjectives textarea'),
            resources: collectTextList('#resourcesList input'),
            evaluation: {
                criteria: collectTextList('#evaluationCriteria input'),
                methods: collectTextList('#evaluationMethods input'),
                requirements: document.getElementById('evaluationRequirements').value.trim()
            }
        };
    }
    
    // Collect text from list items
    function collectTextList(selector) {
        const elements = document.querySelectorAll(selector);
        return Array.from(elements)
            .map(el => el.value.trim())
            .filter(value => value.length > 0);
    }
    
    // Validate form
    function validateForm(data) {
        const errors = [];
        
        if (!data.name) errors.push('Nome do curso é obrigatório');
        if (!data.level) errors.push('Nível do curso é obrigatório');
        if (!data.target) errors.push('Público-alvo é obrigatório');
        if (!data.duration || data.duration < 1) errors.push('Duração deve ser pelo menos 1 semana');
        
        return errors;
    }
    
    // State management functions
    function showLoadingState() {
        const loadingState = document.getElementById('loadingState');
        const editorContent = document.getElementById('editorContent');
        
        if (loadingState) loadingState.style.display = 'flex';
        if (editorContent) editorContent.style.display = 'none';
    }
    
    function hideLoadingState() {
        const loadingState = document.getElementById('loadingState');
        const editorContent = document.getElementById('editorContent');
        
        if (loadingState) loadingState.style.display = 'none';
        if (editorContent) editorContent.style.display = 'block';
    }
    
    function showError(message) {
        console.error('❌ Error:', message);
        alert(message); // TODO: Replace with proper notification
    }
    
    function showSuccess(message) {
        console.log('✅ Success:', message);
        alert(message); // TODO: Replace with proper notification
    }
    
    // Global functions for UI interactions
    window.addObjective = function(type) {
        const containerId = type === 'general' ? 'generalObjectives' : 'specificObjectives';
        addObjectiveItem(containerId);
        markAsDirty();
    };
    
    window.removeObjective = function(button, type) {
        const container = button.closest('.objectives-list');
        if (container.children.length > 1) {
            button.closest('.objective-item').remove();
            markAsDirty();
        }
    };
    
    window.addResource = function() {
        addResourceItem();
        markAsDirty();
    };
    
    window.removeResource = function(button) {
        const container = button.closest('#resourcesList');
        if (container.children.length > 1) {
            button.closest('.resource-item').remove();
            markAsDirty();
        }
    };
    
    window.addEvalItem = function(type) {
        addEvalItemElement(type);
        markAsDirty();
    };
    
    window.removeEvalItem = function(button, type) {
        const container = button.closest('.eval-list');
        if (container.children.length > 1) {
            button.closest('.eval-item').remove();
            markAsDirty();
        }
    };
    
    window.saveDraft = function() {
        const data = collectFormData();
        localStorage.setItem('courseDraft', JSON.stringify(data));
        showSuccess('Rascunho salvo localmente!');
        isDirty = false;
    };
    
    window.saveCourse = async function() {
        try {
            const data = collectFormData();
            
            // Validate form
            const errors = validateForm(data);
            if (errors.length > 0) {
                showError('Erros de validação:\n' + errors.join('\n'));
                return;
            }
            
            showLoadingState();
            
            // Prepare request
            const url = isEditing ? `/api/courses/${currentCourse.id}` : '/api/courses';
            const method = isEditing ? 'PUT' : 'POST';
            
            // Make request
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                showSuccess(`Curso ${isEditing ? 'atualizado' : 'criado'} com sucesso!`);
                isDirty = false;
                
                // Redirect after delay
                setTimeout(() => {
                    window.location.href = '#courses';
                }, 1500);
            } else {
                throw new Error(result.error || 'Erro desconhecido');
            }
            
        } catch (error) {
            console.error('❌ Error saving course:', error);
            showError(`Erro ao salvar curso: ${error.message}`);
        } finally {
            hideLoadingState();
        }
    };
    
    window.goBack = function() {
        if (isDirty) {
            if (confirm('Você tem alterações não salvas. Tem certeza que deseja sair?')) {
                window.history.back();
            }
        } else {
            window.history.back();
        }
    };
    
    // Module is ready - initialization will be called by index.html
    console.log('📝 Course Editor Module - Loaded');
    
})();
