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
            const nameInput = document.getElementById('student-name');
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
        
        // Update buttons
        document.querySelectorAll('.editor-tab-button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });
        
        // Update content
        document.querySelectorAll('.editor-tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabId}-tab`);
        });
        
        currentTab = tabId;
        
        // Load tab-specific data
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
                console.log('✅ Student loaded:', currentStudent.name);
                
                populateStudentData(currentStudent);
                updatePageTitle(currentStudent.name);
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

        // Use a minimal delay to ensure the DOM is ready for population.
        setTimeout(() => {
            console.log('📝 Populating form with student data (robustly):', student);
            
            const user = student.user || {};
            const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
            const email = user.email || '';
            const phone = user.phone || student.phone || '';
            const birthDate = student.birthDate ? new Date(student.birthDate).toISOString().split('T')[0] : '';
            const notes = student.notes || '';
            const status = student.isActive ? 'ACTIVE' : 'INACTIVE';

            // Direct DOM manipulation with verification
            const fields = {
                'student-name': name,
                'student-email': email,
                'student-phone': phone,
                'student-birth-date': birthDate,
                'student-notes': notes,
                'student-status': status
            };

            let allFieldsFound = true;
            for (const [id, value] of Object.entries(fields)) {
                const element = document.getElementById(id);
                if (element) {
                    console.log(`✅ Setting ${id} to: "${value}"`)
                    element.value = value;
                    if (element.value !== value) {
                         console.warn(`⚠️ Post-assignment check failed for ${id}. Value is now: "${element.value}"`)
                    }
                } else {
                    console.error(`❌ Field with ID '${id}' not found in the DOM.`);
                    allFieldsFound = false;
                }
            }

            if(allFieldsFound) {
                 console.log('✅ All fields populated successfully.');
            } else {
                 console.error('❌ Some form fields were not found. Population may be incomplete.');
            }

            updatePageTitle(name);

        }, 100); // A 100ms delay is a safer bet than 0 for complex DOMs.
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
        // TODO: Implement financial data loading
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
            
            // Collect form data
            const formData = {
                id: currentStudent.id,
                name: document.getElementById('student-name')?.value || '',
                email: document.getElementById('student-email')?.value || '',
                phone: document.getElementById('student-phone')?.value || '',
                'birthDate': document.getElementById('student-birth-date')?.value || '',
                notes: document.getElementById('student-notes')?.value || '',
                status: document.getElementById('student-status')?.value || 'ACTIVE'
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
    
    // Expose functions for testing
    window.StudentEditor = {
        loadStudentData,
        switchPageTab,
        saveStudentChanges,
        goBackToStudents
    };
    
    console.log('✅ Student Editor module loaded');
})();
