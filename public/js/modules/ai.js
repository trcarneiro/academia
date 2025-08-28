(function() {
    'use strict';
    
    console.log('🤖 AI Module - Starting...');
    
    let aiAPI = null;
    let isInitialized = false;
    let currentCourse = null;
    let generationMode = 'direct';
    
    async function waitForAPIClient() {
        return new Promise((resolve) => {
            const check = () => {
                if (window.createModuleAPI) {
                    resolve();
                } else {
                    setTimeout(check, 100);
                }
            };
            check();
        });
    }
    
    async function initializeAPI() {
        await waitForAPIClient();
        aiAPI = window.createModuleAPI('AI');
    }
    
    window.initializeAIModule = initializeAIModule;
    
    async function initializeAIModule() {
        if (isInitialized) {
            console.log('ℹ️ AI module already initialized');
            return;
        }
        
        console.log('🔧 Initializing AI Module...');
        
        try {
            const aiContainer = document.querySelector('.ai-isolated');
            if (!aiContainer) {
                console.log('ℹ️ Not on AI page, skipping initialization');
                return;
            }
            
            isInitialized = true;
            
            aiContainer.setAttribute('data-module', 'ai');
            aiContainer.setAttribute('data-active', 'true');
            aiContainer.classList.add('module-active');
            
            await initializeAPI();
            setupEventListeners();
            await loadCoursesList();
            
            console.log('✅ AI Module initialized successfully');
            
            if (window.app?.dispatchEvent) {
                window.app.dispatchEvent('module:loaded', { name: 'ai' });
            }
            
        } catch (error) {
            isInitialized = false;
            console.error('❌ Error initializing AI module:', error);
            if (window.app?.handleError) {
                window.app.handleError(error, 'AI Module Initialization');
            }
        }
    }
    
    async function loadCoursesList() {
        try {
            await aiAPI.fetchWithStates('/api/courses', {
                onSuccess: (data) => {
                    populateCoursesSelect(data);
                    updateStats({ totalCourses: data.length });
                },
                onEmpty: () => {
                    populateCoursesSelect([]);
                    showEmptyCoursesState();
                },
                onError: (error) => {
                    console.error('❌ Error loading courses:', error);
                    showError('Erro ao carregar cursos: ' + error.message);
                }
            });
        } catch (error) {
            console.error('❌ Error in loadCoursesList:', error);
        }
    }
    
    function populateCoursesSelect(courses) {
        const select = document.getElementById('courseSelect');
        if (!select) return;
        
        const firstOption = select.querySelector('option[value=""]');
        select.innerHTML = '';
        if (firstOption) select.appendChild(firstOption.cloneNode(true));
        
        courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.id;
            option.textContent = `${course.name} (${course.level})`;
            select.appendChild(option);
        });
    }
    
    function showEmptyCoursesState() {
        const select = document.getElementById('courseSelect');
        if (!select) return;
        
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Nenhum curso disponível';
        option.disabled = true;
        select.appendChild(option);
    }
    
    function showError(message) {
        console.error('AI Module Error:', message);
    }
    
    function updateStats(stats) {
        if (stats.totalCourses !== undefined) {
            const el = document.getElementById('aiTotalCourses');
            if (el) el.textContent = stats.totalCourses;
        }
        if (stats.generatedTechniques !== undefined) {
            const el = document.getElementById('aiGeneratedTechniques');
            if (el) el.textContent = stats.generatedTechniques;
        }
        if (stats.generatedLessons !== undefined) {
            const el = document.getElementById('aiGeneratedLessons');
            if (el) el.textContent = stats.generatedLessons;
        }
        if (stats.processingTime !== undefined) {
            const el = document.getElementById('aiProcessingTime');
            if (el) el.textContent = stats.processingTime + 's';
        }
    }
    
    function setupEventListeners() {
        console.log('🔌 Setting up AI event listeners...');
        
        const optionCards = document.querySelectorAll('.option-card');
        optionCards.forEach(card => {
            card.addEventListener('click', handleGenerationModeChange);
        });
        
        const uploadBtn = document.getElementById('uploadDocumentBtn');
        const fileInput = document.getElementById('documentFile');
        
        uploadBtn?.addEventListener('click', () => fileInput?.click());
        fileInput?.addEventListener('change', handleDocumentUpload);
        
        const uploadZone = document.querySelector('.upload-zone');
        if (uploadZone) {
            uploadZone.addEventListener('dragover', handleDragOver);
            uploadZone.addEventListener('dragleave', handleDragLeave);
            uploadZone.addEventListener('drop', handleDrop);
        }
        
        const generateTechniquesBtn = document.getElementById('generateTechniquesBtn');
        const generateLessonsBtn = document.getElementById('generateLessonsBtn');
        const generateAllBtn = document.getElementById('generateAllBtn');
        
        generateTechniquesBtn?.addEventListener('click', handleGenerateTechniques);
        generateLessonsBtn?.addEventListener('click', handleGenerateLessons);
        generateAllBtn?.addEventListener('click', handleGenerateAll);
        
        const courseSelect = document.getElementById('courseSelect');
        courseSelect?.addEventListener('change', handleCourseSelection);
        
        console.log('✅ AI event listeners setup completed');
    }
    
    function handleGenerationModeChange(event) {
        const card = event.currentTarget;
        const mode = card.dataset.mode;
        
        document.querySelectorAll('.option-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        
        generationMode = mode;
        
        const uploadArea = document.getElementById('uploadArea');
        const courseAnalysisPreview = document.getElementById('courseAnalysisPreview');
        
        if (mode === 'document') {
            if (uploadArea) uploadArea.style.display = 'block';
            if (courseAnalysisPreview) courseAnalysisPreview.style.display = 'none';
        } else {
            if (uploadArea) uploadArea.style.display = 'none';
            if (courseAnalysisPreview) courseAnalysisPreview.style.display = 'block';
            enableGenerationButtons();
        }
        
        console.log(`🔄 Generation mode changed to: ${mode}`);
    }
    
    async function handleCourseSelection(event) {
        const courseId = event.target.value;
        const courseInfo = document.getElementById('courseInfo');
        
        if (!courseId) {
            if (courseInfo) courseInfo.style.display = 'none';
            currentCourse = null;
            return;
        }
        
        try {
            await aiAPI.fetchWithStates(`/api/courses/${courseId}`, {
                onSuccess: (course) => {
                    currentCourse = course;
                    displayCourseInfo(course);
                },
                onError: (error) => {
                    console.error('❌ Error loading course:', error);
                    showError('Erro ao carregar curso: ' + error.message);
                }
            });
        } catch (error) {
            console.error('❌ Error in handleCourseSelection:', error);
        }
    }
    
    function displayCourseInfo(course) {
        const courseInfo = document.getElementById('courseInfo');
        if (!courseInfo) return;
        
        const nameEl = document.getElementById('courseInfoName');
        const levelEl = document.getElementById('courseInfoLevel');
        const durationEl = document.getElementById('courseInfoDuration');
        const statusEl = document.getElementById('courseInfoStatus');
        
        if (nameEl) nameEl.textContent = course.name || '-';
        if (levelEl) levelEl.textContent = course.level || '-';
        if (durationEl) durationEl.textContent = course.duration ? `${course.duration} semanas` : '-';
        if (statusEl) statusEl.textContent = course.status === 'ACTIVE' ? 'Ativo' : 'Inativo';
        
        courseInfo.style.display = 'block';
        enableGenerationButtons();
    }
    
    function handleDragOver(event) {
        event.preventDefault();
        event.currentTarget.classList.add('dragover');
    }
    
    function handleDragLeave(event) {
        event.currentTarget.classList.remove('dragover');
    }
    
    function handleDrop(event) {
        event.preventDefault();
        event.currentTarget.classList.remove('dragover');
        
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            const fileInput = document.getElementById('documentFile');
            if (fileInput) {
                fileInput.files = files;
                handleDocumentUpload({ target: { files } });
            }
        }
    }
    
    async function handleDocumentUpload(event) {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        
        const file = files[0];
        const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!allowedTypes.includes(fileExtension)) {
            alert('Tipo de arquivo não suportado. Use PDF, DOC, DOCX ou TXT.');
            event.target.value = '';
            return;
        }
        
        if (file.size > 10 * 1024 * 1024) {
            alert('Arquivo muito grande. Tamanho máximo: 10MB');
            event.target.value = '';
            return;
        }
        
        try {
            showUploadProgress();
            
            const formData = new FormData();
            formData.append('file', file);
            formData.append('courseId', currentCourse.id);
            formData.append('aiProvider', 'claude');
            formData.append('analysisType', 'full');
            
            const startTime = Date.now();
            
            const response = await fetch('/api/ai/analyze-course-document', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Erro ao analisar documento');
            }
            
            const processingTime = Math.round((Date.now() - startTime) / 1000);
            updateStats({ processingTime });
            
            displayAnalysisResults(result.data);
            enableGenerationButtons();
            
        } catch (error) {
            console.error('❌ Error uploading document:', error);
            alert(`Erro ao fazer upload: ${error.message}`);
        } finally {
            hideUploadProgress();
            event.target.value = '';
        }
    }
    
    async function handleGenerateTechniques() {
        if (!currentCourse) {
            alert('Selecione um curso primeiro.');
            return;
        }
        
        try {
            showGenerationProgress('Gerando técnicas...');
            const startTime = Date.now();
            
            const requestData = {
                courseId: currentCourse.id,
                options: getGenerationOptions()
            };
            
            if (generationMode === 'document') {
                const analysisResults = document.getElementById('analysisResults');
                if (!analysisResults || analysisResults.style.display === 'none') {
                    alert('Faça o upload de um documento primeiro ou use o modo "Dados do Curso".');
                    hideGenerationProgress();
                    return;
                }
            }
            
            await aiAPI.saveWithFeedback('/api/ai/generate-techniques', requestData, {
                onSuccess: (data) => {
                    const processingTime = Math.round((Date.now() - startTime) / 1000);
                    updateStats({ 
                        generatedTechniques: data.created,
                        processingTime 
                    });
                    
                    displayTechniquesResults(data);
                    showBanner(`✅ ${data.created} técnicas geradas com sucesso!`, 'success');
                },
                onError: (error) => {
                    console.error('❌ Error generating techniques:', error);
                    showBanner(`Erro ao gerar técnicas: ${error.message}`, 'error');
                }
            });
            
        } catch (error) {
            console.error('❌ Error in handleGenerateTechniques:', error);
        } finally {
            hideGenerationProgress();
        }
    }
    
    async function handleGenerateLessons() {
        if (!currentCourse) {
            alert('Selecione um curso primeiro.');
            return;
        }
        
        try {
            showGenerationProgress('Gerando planos de aula...');
            const startTime = Date.now();
            
            const requestData = {
                courseId: currentCourse.id,
                options: getGenerationOptions()
            };
            
            if (generationMode === 'document') {
                const analysisResults = document.getElementById('analysisResults');
                if (!analysisResults || analysisResults.style.display === 'none') {
                    alert('Faça o upload de um documento primeiro ou use o modo "Dados do Curso".');
                    hideGenerationProgress();
                    return;
                }
            }
            
            await aiAPI.saveWithFeedback('/api/ai/generate-lesson-plans', requestData, {
                onSuccess: (data) => {
                    const processingTime = Math.round((Date.now() - startTime) / 1000);
                    updateStats({ 
                        generatedLessons: data.created,
                        processingTime 
                    });
                    
                    displayLessonsResults(data);
                    showBanner(`✅ ${data.created} planos de aula gerados com sucesso!`, 'success');
                },
                onError: (error) => {
                    console.error('❌ Error generating lessons:', error);
                    showBanner(`Erro ao gerar planos: ${error.message}`, 'error');
                }
            });
            
        } catch (error) {
            console.error('❌ Error in handleGenerateLessons:', error);
        } finally {
            hideGenerationProgress();
        }
    }
    
    async function handleGenerateAll() {
        if (!currentCourse) {
            alert('Selecione um curso primeiro.');
            return;
        }
        
        try {
            showGenerationProgress('Gerando técnicas e planos de aula...');
            await handleGenerateTechniques();
            await handleGenerateLessons();
            showBanner('✅ Geração completa finalizada!', 'success');
        } catch (error) {
            console.error('❌ Error in handleGenerateAll:', error);
            showBanner(`Erro na geração completa: ${error.message}`, 'error');
        }
    }
    
    function enableGenerationButtons() {
        if (!currentCourse) return;
        
        const shouldEnable = generationMode === 'direct' || 
            (generationMode === 'document' && document.getElementById('analysisResults')?.style.display !== 'none');
        
        const buttons = ['generateTechniquesBtn', 'generateLessonsBtn', 'generateAllBtn'];
        buttons.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.disabled = !shouldEnable;
        });
        
        console.log(`🔘 Generation buttons ${shouldEnable ? 'enabled' : 'disabled'} (mode: ${generationMode})`);
    }
    
    function getGenerationOptions() {
        return {
            aiProvider: document.getElementById('aiProvider')?.value || 'claude',
            difficulty: document.getElementById('difficultyLevel')?.value || 'auto',
            generateVariations: document.getElementById('generateVariations')?.checked || false,
            includeAdaptations: document.getElementById('includeAdaptations')?.checked || true
        };
    }
    
    function displayAnalysisResults(data) {
        const resultsDiv = document.getElementById('analysisResults');
        if (!resultsDiv) return;
        
        resultsDiv.innerHTML = `
            <div class="analysis-summary">
                <h4>📋 Análise do Documento</h4>
                <div class="analysis-content">
                    <p><strong>Tipo:</strong> ${data.documentType || 'Detectado automaticamente'}</p>
                    <p><strong>Páginas:</strong> ${data.pageCount || 'N/A'}</p>
                    <p><strong>Resumo:</strong> ${data.summary || 'Documento analisado com sucesso'}</p>
                </div>
            </div>
        `;
        
        resultsDiv.style.display = 'block';
    }
    
    function displayTechniquesResults(data) {
        console.log('📊 Techniques generated:', data);
    }
    
    function displayLessonsResults(data) {
        console.log('📊 Lessons generated:', data);
    }
    
    function showUploadProgress() {
        const progressDiv = document.getElementById('uploadProgress');
        if (progressDiv) progressDiv.style.display = 'block';
    }
    
    function hideUploadProgress() {
        const progressDiv = document.getElementById('uploadProgress');
        if (progressDiv) progressDiv.style.display = 'none';
    }
    
    function showGenerationProgress(message) {
        console.log('🔄', message);
        const progressDiv = document.getElementById('generationProgress');
        if (progressDiv) {
            const progressText = progressDiv.querySelector('.progress-text');
            if (progressText) progressText.textContent = `🤖 ${message}`;
            progressDiv.style.display = 'block';
        }
        
        const buttons = ['generateTechniquesBtn', 'generateLessonsBtn', 'generateAllBtn'];
        buttons.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.disabled = true;
                btn.classList.add('loading');
            }
        });
    }
    
    function hideGenerationProgress() {
        console.log('✅ Generation progress hidden');
        const progressDiv = document.getElementById('generationProgress');
        if (progressDiv) progressDiv.style.display = 'none';
        
        enableGenerationButtons();
        
        const buttons = ['generateTechniquesBtn', 'generateLessonsBtn', 'generateAllBtn'];
        buttons.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.classList.remove('loading');
        });
    }
    
    function showBanner(message, type) {
        console.log(`📢 [${type}]`, message);
        
        const banner = document.createElement('div');
        banner.className = `notification notification-${type}`;
        banner.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${type === 'success' ? '✅' : '❌'}</span>
                <span class="notification-message">${message}</span>
            </div>
        `;
        
        const container = document.querySelector('.ai-isolated') || document.body;
        container.appendChild(banner);
        
        setTimeout(() => banner.classList.add('show'), 100);
        
        setTimeout(() => {
            banner.classList.remove('show');
            setTimeout(() => banner.remove(), 300);
        }, 5000);
    }
    
    window.aiModule = {
        init: initializeAIModule,
        isInitialized: () => isInitialized
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                try { initializeAIModule(); } catch (_) {}
            }, 100);
        });
    } else {
        setTimeout(() => {
            try { initializeAIModule(); } catch (_) {}
        }, 100);
    }
    
    console.log('🤖 AI Module - Loaded');
})();