(function() {
    'use strict';
    
    // Module state
    let currentPlan = null;
    let editMode = false;
    let allCourses = [];
    
    // Initialize module on DOM ready
    document.addEventListener('DOMContentLoaded', function() {
        initializePlanEditor();
    });
    
    // Module initialization
    async function initializePlanEditor() {
        console.log('🔧 Initializing Plan Editor Module...');
        
        try {
            // Validate DOM is ready
            const editorContainer = document.querySelector('.plan-editor-isolated') || 
                                  document.querySelector('.plan-editor') || 
                                  document.querySelector('[id*="plan"]') ||
                                  document.body;
            
            if (!editorContainer) {
                console.log('⚠️ Plan editor container not found, module may not be in editor view');
                return;
            }
            
            console.log('✅ DOM validation passed - plan editor container found');
            
            // Check if we're editing an existing plan
            const editingPlanId = sessionStorage.getItem('editingPlanId');
            if (editingPlanId) {
                console.log('🔄 Loading plan for editing:', editingPlanId);
                editMode = true;
                await loadPlanData(editingPlanId);
                sessionStorage.removeItem('editingPlanId'); // Clean up
            } else {
                // This is a new plan - hide loading and show form
                console.log('🆕 Creating new plan');
                editMode = false;
                currentPlan = null;
                
                // Hide loading state and show form
                const loadingState = document.getElementById('loadingState');
                const mainContent = document.getElementById('mainContent');
                if (loadingState) loadingState.style.display = 'none';
                if (mainContent) mainContent.style.display = 'block';
                
                // Update page title for new plan
                const pageTitle = document.querySelector('h1');
                if (pageTitle) {
                    pageTitle.textContent = 'Adicionar Novo Plano';
                }
            }
            
            // Load supporting data
            await loadSupportingData();
            
            // Setup event listeners
            setupEventListeners();
            
            console.log('✅ Plan Editor Module initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing plan editor module:', error);
            showError('Erro ao inicializar editor de planos: ' + error.message);
            
            // Hide loading state even on error
            const loadingState = document.getElementById('loadingState');
            const mainContent = document.getElementById('mainContent');
            if (loadingState) loadingState.style.display = 'none';
            if (mainContent) mainContent.style.display = 'block';
        }
    }
    
    // Load plan data for editing
    async function loadPlanData(planId) {
        try {
            const response = await fetch(`/api/billing-plans/${planId}`);
            const result = await response.json();
            
            if (result.success) {
                currentPlan = result.data;
                populateForm(currentPlan);
                console.log('✅ Plan data loaded for editing');
            } else {
                throw new Error(result.message || 'Failed to load plan data');
            }
        } catch (error) {
            console.error('❌ Error loading plan data:', error);
            showError('Erro ao carregar dados do plano: ' + error.message);
        }
    }
    
    // Load supporting data (courses, etc.)
    async function loadSupportingData() {
        try {
            // Load courses if needed
            const coursesResponse = await fetch('/api/courses');
            if (coursesResponse.ok) {
                const coursesResult = await coursesResponse.json();
                allCourses = coursesResult.data || [];
                console.log('✅ Courses data loaded:', allCourses.length);
            }
        } catch (error) {
            console.warn('⚠️ Could not load supporting data:', error);
        }
    }
    
    // Populate form with plan data
    function populateForm(plan) {
        const form = document.getElementById('planForm') || document.querySelector('form');
        if (!form) return;
        
        // Populate basic fields
        const fields = {
            'planName': plan.name,
            'planDescription': plan.description,
            'planCategory': plan.category,
            'planPrice': plan.price,
            'planBillingType': plan.billingType,
            'planClassesPerWeek': plan.classesPerWeek
        };
        
        Object.entries(fields).forEach(([fieldId, value]) => {
            const field = document.getElementById(fieldId);
            if (field && value !== undefined && value !== null) {
                field.value = value;
            }
        });
        
        // Update page title if editing
        const pageTitle = document.querySelector('h1');
        if (pageTitle) {
            pageTitle.textContent = editMode ? 'Editar Plano' : 'Adicionar Novo Plano';
        }
        
        console.log('✅ Form populated with plan data');

        // Hide loading state and show form
        const loadingState = document.getElementById('loadingState');
        const mainContent = document.getElementById('mainContent');
        if (loadingState) loadingState.style.display = 'none';
        if (mainContent) mainContent.style.display = 'block';
    }
    
    // Setup event listeners
    function setupEventListeners() {
        // Back button
        const backBtn = document.getElementById('backBtn');
        if (backBtn) {
            backBtn.addEventListener('click', function() {
                if (typeof window.navigateToModule === 'function') {
                    window.navigateToModule('plans');
                } else {
                    window.history.back();
                }
            });
        }

        // Save button
        const form = document.getElementById('plan-form') || document.getElementById('planForm') || document.querySelector('form');
        
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                handleSavePlan();
            });
        }

        // Delete button - only show if editing
        const deleteBtn = document.getElementById('deletePlanBtn');
        if (deleteBtn) {
            if (editMode && currentPlan) {
                deleteBtn.style.display = 'inline-block';
                deleteBtn.addEventListener('click', handleDeletePlan);
            } else {
                deleteBtn.style.display = 'none';
            }
        }
        
        console.log('✅ Event listeners setup completed');
    }
    
    // Handle save plan
    async function handleSavePlan() {
        console.log('💾 Saving plan...');
        
        try {
            const formData = collectFormData();
            if (!formData) return;
            
            const url = editMode && currentPlan ? 
                `/api/billing-plans/${currentPlan.id}` : 
                '/api/billing-plans';
            
            const method = editMode && currentPlan ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                showSuccess(editMode ? 'Plano atualizado com sucesso!' : 'Plano criado com sucesso!');
                
                if (editMode) {
                    // If editing, refresh the current plan data
                    await loadPlanData(currentPlan.id);
                } else {
                    // If creating a new plan, redirect to its editor page
                    if (result.data && result.data.id) {
                        sessionStorage.setItem('editingPlanId', result.data.id);
                        if (typeof window.navigateToModule === 'function') {
                            window.navigateToModule('plan-editor');
                        } else {
                            window.location.href = `/views/plan-editor.html?id=${result.data.id}`;
                        }
                    } else {
                        // Fallback if new plan ID is not returned
                        showError('Plano criado, mas ID não retornado. Recarregue a página.');
                    }
                }
            } else {
                throw new Error(result.message || 'Failed to save plan');
            }
        } catch (error) {
            console.error('❌ Error saving plan:', error);
            showError('Erro ao salvar plano: ' + error.message);
        }
    }
    
    // Collect form data
    function collectFormData() {
        const form = document.getElementById('plan-form') || document.getElementById('planForm') || document.querySelector('form');
        if (!form) {
            showError('Formulário não encontrado');
            return null;
        }
        
        const formData = new FormData(form);
        const data = {};
        
        // Required fields
        const requiredFields = ['planName', 'planPrice', 'planBillingType'];
        for (const field of requiredFields) {
            const value = formData.get(field);
            if (!value) {
                showError(`Campo obrigatório não preenchido: ${field}`);
                return null;
            }
        }
        
        // Collect all form data
        data.name = formData.get('planName');
        data.description = formData.get('planDescription');
        data.category = formData.get('planCategory');
        data.price = parseFloat(formData.get('planPrice'));
        data.billingType = formData.get('planBillingType');
        data.classesPerWeek = parseInt(formData.get('planClassesPerWeek')) || 2;
        
        // Optional fields
        data.hasPersonalTraining = formData.get('hasPersonalTraining') === 'on';
        data.hasNutrition = formData.get('hasNutrition') === 'on';
        data.allowFreeze = formData.get('allowFreeze') === 'on';
        
        console.log('📋 Form data collected:', data);
        return data;
    }

    // Handle delete plan
    async function handleDeletePlan() {
        if (!editMode || !currentPlan) {
            showError('Nenhum plano selecionado para excluir.');
            return;
        }

        if (!confirm(`Tem certeza que deseja excluir o plano "${currentPlan.name}"?`)) {
            return;
        }

        console.log('🗑️ Deleting plan...');

        try {
            const response = await fetch(`/api/billing-plans/${currentPlan.id}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.success) {
                showSuccess('Plano excluído com sucesso!');
                setTimeout(() => {
                    if (typeof window.navigateToModule === 'function') {
                        window.navigateToModule('plans');
                    } else {
                        window.location.href = '/views/plans.html';
                    }
                }, 1500);
            } else {
                throw new Error(result.message || 'Failed to delete plan');
            }
        } catch (error) {
            console.error('❌ Error deleting plan:', error);
            showError('Erro ao excluir plano: ' + error.message);
        }
    }
    
    // Utility functions
    function showError(message) {
        console.error('❌ Error:', message);
        alert('Erro: ' + message);
    }
    
    function showSuccess(message) {
        console.log('✅ Success:', message);
        if (typeof showToast === 'function') {
            showToast(message, 'success');
        } else {
            alert('Sucesso: ' + message);
        }
    }
    
    // Global functions for navigation
    window.goBackToPlans = function() {
        if (typeof window.navigateToModule === 'function') {
            window.navigateToModule('plans');
        } else {
            window.location.href = '/views/plans.html';
        }
    };
    
    // Export to global scope for auto-initialization
    window.initializePlanEditor = initializePlanEditor;
    
    // Module loaded successfully
    console.log('📝 Plan Editor Module script loaded, initializePlanEditor available:', typeof window.initializePlanEditor);
    
})();
