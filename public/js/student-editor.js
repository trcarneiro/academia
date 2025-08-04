(function() {
    'use strict';
    
    console.log('🎯 Student Editor initialized');
    
    // Global state
    let currentStudent = null;
    let currentTab = 'profile';
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeStudentEditor);
    } else {
        initializeStudentEditor();
    }
    
    function initializeStudentEditor() {
        console.log('🔄 Initializing Student Editor...');
        
        setupTabSystem();
        loadStudentData();
        setupEventListeners();

        // Failsafe mechanism using MutationObserver to win race conditions
        setupPopulationObserver();
    }

    function setupPopulationObserver() {
        const targetNode = document.getElementById('profile-tab');
        if (!targetNode) {
            console.error('❌ Observer target #profile-tab not found');
            return;
        }

        let populationAttempted = false;

        const observer = new MutationObserver((mutationsList, obs) => {
            // We are looking for the moment the form inputs are added to the DOM.
            const nameInput = document.getElementById('student-firstName');
            if (nameInput && !populationAttempted) {
                
                // If input is empty but we have data, a race condition likely occurred.
                if (nameInput.value === '' && currentStudent) {
                    console.log('🏃‍♂️ Race condition detected! Re-populating form...');
                    populateStudentData(currentStudent);
                    populationAttempted = true; // Ensure we only run this once
                }

                // Once we've successfully populated, we don't need the observer anymore.
                if (nameInput.value !== '') {
                    console.log('✅ Observer task complete, disconnecting.');
                    obs.disconnect();
                }
            }
        });

        observer.observe(targetNode, { childList: true, subtree: true });
        console.log('👀 MutationObserver is watching for form population...');
    }
    
    function setupTabSystem() {
        console.log('📋 Setting up tab system...');
        
        const tabButtons = document.querySelectorAll('.page-tab');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                // Use currentTarget to ensure we get the button element
                const tabId = e.currentTarget.dataset.tab;
                switchPageTab(tabId);
            });
        });
        
        // Activate first tab by default
        if (tabButtons.length > 0) {
            // Find the active one from the HTML, or default to profile
            const initialTab = document.querySelector('.page-tab.active')?.dataset.tab || 'profile';
            switchPageTab(initialTab);
        }
    }
    
    function switchPageTab(tabId) {
        console.log(`🔄 Switching to tab: ${tabId}`);
        currentTab = tabId;

        // Update button active states
        document.querySelectorAll('.page-tab').forEach(button => {
            button.classList.toggle('active', button.dataset.tab === tabId);
        });

        // Hide all tab content sections
        document.querySelectorAll('.tab-content').forEach(content => {
            content.style.display = 'none';
        });

        // Show the selected tab's content
        const activeContent = document.getElementById(`${tabId}-content`);
        if (activeContent) {
            activeContent.style.display = 'block';
        } else {
            // Fallback for older structure if needed
            const fallbackContent = document.getElementById(`${tabId}-tab`);
            if (fallbackContent) {
                fallbackContent.style.display = 'block';
            } else {
                console.error(`❌ Content for tab '${tabId}' not found.`);
            }
        }

        // Load data for the newly activated tab
        loadTabData(tabId);
    }
    
    async function loadStudentData() {
        console.log('🔄 Loading student data...');
        
        try {
            let studentId = null;
            
            // 1. Try to get from localStorage (primary method)
            const editorModeData = localStorage.getItem('studentEditorMode');
            console.log('📱 Raw localStorage data:', editorModeData);

            if (editorModeData) {
                try {
                    const editorData = JSON.parse(editorModeData);
                    console.log('📊 Parsed editor data:', editorData);
                    studentId = editorData.studentId;
                } catch (e) {
                    console.error('❌ Failed to parse studentEditorMode from localStorage', e);
                }
            }

            // 2. Fallback to URL parameters if not found in localStorage
            if (!studentId) {
                console.log('ℹ️ No studentId in localStorage, checking URL parameters...');
                const urlParams = new URLSearchParams(window.location.search);
                studentId = urlParams.get('id');
                if (studentId) {
                    console.log(`✅ Found studentId in URL: ${studentId}`);
                }
            }
            
            if (!studentId) {
                console.log('❌ No student ID found in localStorage or URL.');
                showError('Nenhum estudante selecionado. Retorne à lista de estudantes.');
                hideLoadingState();
                return;
            }
            
            console.log(`🔍 Fetching student data for ID: ${studentId}`);
            
            // Make API call to get student data
            const response = await fetch(`/api/students/${studentId}`);
            console.log('📡 API Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('📊 API Result:', result);
            
            if (result.success && result.data) {
                currentStudent = result.data;
                console.log('✅ Student loaded:', currentStudent.user.firstName);
                
                populateStudentData(currentStudent);
                updatePageTitle(`${currentStudent.user.firstName} ${currentStudent.user.lastName}`);
                hideLoadingState();

                // Forcefully load the active tab data again now that we have the student
                loadTabData(currentTab);
            } else {
                throw new Error('Estudante não encontrado na resposta da API');
            }
        } catch (error) {
            console.error('❌ Error loading student data:', error);
            showError(`Erro ao carregar dados do estudante: ${error.message}`);
            hideLoadingState();
        }
    }
    
    function populateStudentData(student) {
        if (!student) {
            console.error('❌ populateStudentData called with null or undefined student');
            return;
        }

        setTimeout(() => {
            console.log('📝 Populating form with student data (robustly):', student);

            const user = student.user || {};
            
            const fields = {
                'student-firstName': user.firstName || '',
                'student-lastName': user.lastName || '',
                'student-email': user.email || '',
                'student-phone': user.phone || '',
                'student-cpf': user.cpf || '',
                'student-birthDate': user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : '',
                'student-gender': student.gender || 'MASCULINO',
                'student-category': student.category || '',
                'student-enrollmentDate': student.enrollmentDate ? new Date(student.enrollmentDate).toISOString().split('T')[0] : '',
                'student-status': student.isActive ? 'true' : 'false',
                'student-emergencyContact': student.emergencyContact || '',
                'student-medicalConditions': student.medicalConditions || ''
            };

            for (const [id, value] of Object.entries(fields)) {
                const element = document.getElementById(id);
                if (element) {
                    element.value = value;
                } else {
                    console.warn(`⚠️ Field with ID '${id}' not found in the DOM.`);
                }
            }

        }, 100);
    }
    
    function updatePageTitle(studentName) {
        const titleElement = document.querySelector('.page-title');
        if (titleElement) {
            titleElement.textContent = `Editando: ${studentName}`;
        }
        
        // Also update browser title
        document.title = `Academia - Editando ${studentName}`;
    }
    
    async function loadTabData(tabId) {
        console.log(`🔄 Loading data for tab: ${tabId}`);
        
        if (!currentStudent) {
            console.log('❌ No current student, cannot load tab data');
            return;
        }
        
        try {
            switch (tabId) {
                case 'profile':
                    // Profile data already loaded
                    break;
                case 'financial':
                    await loadFinancialData();
                    break;
                case 'courses':
                    await loadCoursesData();
                    break;
                case 'classes':
                    await loadClassesData();
                    break;
                case 'progress':
                    await loadProgressData();
                    break;
                case 'ia':
                    await loadIAData();
                    break;
            }
        } catch (error) {
            console.error(`❌ Error loading ${tabId} data:`, error);
            showError(`Erro ao carregar dados da aba ${tabId}`);
        }
    }
    
    async function loadFinancialData() {
        console.log('💳 Loading financial data...');
        const financialContent = document.getElementById('financial-content');
        if (!financialContent) return;

        try {
            financialContent.innerHTML = await (await fetch('/views/financial-tab.html')).text();

            const [subscriptionResponse, plansResponse] = await Promise.all([
                fetch(`/api/students/${currentStudent.id}/subscription`),
                fetch('/api/billing-plans')
            ]);

            const subscriptionResult = await subscriptionResponse.json();
            const plansResult = await plansResponse.json();

            if (subscriptionResult.success) {
                renderCurrentSubscription(subscriptionResult.data);
            }

            if (plansResult.success) {
                populateBillingPlans(plansResult.data);
            }

            setupFinancialTabEventListeners();
        } catch (error) {
            console.error('❌ Error loading financial data:', error);
            financialContent.innerHTML = `<div class="error-state">Error loading financial data</div>`;
        }
    }
    
    async function loadCoursesData() {
        console.log('📚 Loading courses data...');
        // TODO: Implement courses data loading
    }
    
    async function loadClassesData() {
        console.log('🏫 Loading classes data...');
        // TODO: Implement classes data loading
    }
    
    async function loadProgressData() {
        console.log('📊 Loading progress data...');
        // TODO: Implement progress data loading
    }
    
    async function loadIAData() {
        console.log('🤖 Loading IA data...');
        // TODO: Implement IA data loading
    }
    
    function setupEventListeners() {
        console.log('🎧 Setting up event listeners...');
        
        // Back button
        const backButton = document.getElementById('back-to-list-btn');
        if (backButton) {
            backButton.addEventListener('click', goBackToStudents);
        }
        
        // Save button
        const saveButton = document.getElementById('save-student-btn');
        if (saveButton) {
            saveButton.addEventListener('click', saveStudentChanges);
        }
        
        // Form validation
        const form = document.getElementById('student-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                saveStudentChanges();
            });
        }
    }
    
    function goBackToStudents() {
        console.log('🔙 Going back to students list...');
        
        // Clear editor mode from localStorage
        localStorage.removeItem('studentEditorMode');
        
        if (window.navigateToModule) {
            window.navigateToModule('students');
        } else {
            window.location.href = '/views/students.html';
        }
    }
    
    async function saveStudentChanges() {
        console.log('💾 Saving student changes...');
        
        if (!currentStudent) {
            showError('Nenhum estudante carregado para salvar');
            return;
        }
        
        try {
            showLoadingState('Salvando...');
            
            const formData = {
                user: {
                    firstName: document.getElementById('student-firstName')?.value || '',
                    lastName: document.getElementById('student-lastName')?.value || '',
                    email: document.getElementById('student-email')?.value || '',
                    phone: document.getElementById('student-phone')?.value || '',
                    cpf: document.getElementById('student-cpf')?.value || '',
                    birthDate: document.getElementById('student-birthDate')?.value || ''
                },
                gender: document.getElementById('student-gender')?.value || 'MASCULINO',
                category: document.getElementById('student-category')?.value || '',
                isActive: document.getElementById('student-status')?.value === 'true',
                emergencyContact: document.getElementById('student-emergencyContact')?.value || '',
                medicalConditions: document.getElementById('student-medicalConditions')?.value || ''
            };
            
            console.log('📤 Sending data:', formData);
            
            const response = await fetch(`/api/students/${currentStudent.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log('✅ Student saved successfully');
                showSuccess('Estudante salvo com sucesso!');
                currentStudent = { ...currentStudent, ...formData };
            } else {
                throw new Error(result.message || 'Erro ao salvar estudante');
            }
        } catch (error) {
            console.error('❌ Error saving student:', error);
            showError(`Erro ao salvar: ${error.message}`);
        } finally {
            hideLoadingState();
        }
    }
    
    function showLoadingState(message = 'Carregando...') {
        const loadingElement = document.querySelector('.loading-state');
        if (loadingElement) {
            loadingElement.textContent = message;
            loadingElement.style.display = 'block';
        }
    }
    
    function hideLoadingState() {
        const loadingElement = document.querySelector('.loading-state');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }
    
    function showError(message) {
        console.error('❌ Error:', message);
        
        // Try to show in UI if error element exists
        const errorElement = document.querySelector('.error-message');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            setTimeout(() => {
                errorElement.style.display = 'none';
            }, 5000);
        } else {
            // Fallback to alert
            alert(`Erro: ${message}`);
        }
    }
    
    function showSuccess(message) {
        console.log('✅ Success:', message);
        
        // Try to show in UI if success element exists
        const successElement = document.querySelector('.success-message');
        if (successElement) {
            successElement.textContent = message;
            successElement.style.display = 'block';
            setTimeout(() => {
                successElement.style.display = 'none';
            }, 3000);
        } else {
            // Fallback to alert
            alert(message);
        }
    }

    function renderCurrentSubscription(subscription) {
        const container = document.getElementById('current-subscription');
        if (!container) return;

        if (subscription) {
            container.innerHTML = `
                <p><strong>Plano:</strong> ${subscription.plan.name}</p>
                <p><strong>Status:</strong> ${subscription.status}</p>
                <p><strong>Próxima cobrança:</strong> ${new Date(subscription.nextBillingDate).toLocaleDateString('pt-BR')}</p>
            `;
        } else {
            container.innerHTML = `<p>Nenhuma assinatura ativa.</p>`;
        }
    }

    function populateBillingPlans(plans) {
        const select = document.getElementById('billing-plans');
        if (!select) return;

        plans.forEach(plan => {
            const option = document.createElement('option');
            option.value = plan.id;
            option.textContent = `${plan.name} - R$${plan.price}`;
            select.appendChild(option);
        });
    }

    function setupFinancialTabEventListeners() {
        const changePlanBtn = document.getElementById('change-plan-btn');
        if (changePlanBtn) {
            changePlanBtn.addEventListener('click', changeSubscription);
        }

        const cancelSubscriptionBtn = document.getElementById('cancel-subscription-btn');
        if (cancelSubscriptionBtn) {
            cancelSubscriptionBtn.addEventListener('click', cancelSubscription);
        }
    }

    async function changeSubscription() {
        const planId = document.getElementById('billing-plans').value;
        if (!planId) {
            showError('Selecione um plano.');
            return;
        }

        try {
            const response = await fetch(`/api/students/${currentStudent.id}/subscription`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ planId })
                });

            const result = await response.json();

            if (result.success) {
                showSuccess('Plano alterado com sucesso!');
                loadFinancialData();
            } else {
                throw new Error(result.message || 'Erro ao alterar plano.');
            }
        } catch (error) {
            showError(error.message);
        }
    }

    async function cancelSubscription() {
        if (!confirm('Tem certeza que deseja cancelar a assinatura?')) return;

        try {
            const response = await fetch(`/api/students/${currentStudent.id}/subscription`, { method: 'DELETE' });
            const result = await response.json();

            if (result.success) {
                showSuccess('Assinatura cancelada com sucesso!');
                loadFinancialData();
            } else {
                throw new Error(result.message || 'Erro ao cancelar assinatura.');
            }
        } catch (error) {
            showError(error.message);
        }
    }
    
    // Expose functions for testing
    window.StudentEditor = {
        loadStudentData,
        switchPageTab,
        saveStudentChanges,
        goBackToStudents
    };
    
    console.log('✅ Student Editor module loaded');
})();