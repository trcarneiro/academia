(function() {
    'use strict';

    // Boot retry state (handles SPA view injection races)
    let __planEditorBootAttempts = 0;
    
    // Module state
    let currentPlan = null;
    let editMode = false;
    let allCourses = [];
    
    // State for Courses Tab
    let coursesTabState = {
        initialized: false,
        planId: null,
        loading: false,
        available: [],
        linked: [],
        originalLinkedIds: new Set(),
        selectedAvailable: new Set(),
        selectedLinked: new Set(),
        filterAvailable: '',
        filterLinked: ''
    };
    
    // New: State for Lesson Plans Tab (lazy init)
    let lessonPlansTabState = { initialized: false };
    
    // Initialize module when DOM is ready or immediately if already loaded
    console.log('[PlanEditor] Boot scheduling, readyState:', document.readyState);
    function __bootPlanEditor() {
        try {
            console.log('[PlanEditor] Boot invoked');
            initializePlanEditor();
        } catch (e) {
            console.error('[PlanEditor] Boot error:', e);
        }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', __bootPlanEditor);
    } else {
        // DOM already loaded (SPA navigation). Initialize immediately.
        __bootPlanEditor();
    }
    
    // Module initialization
    async function initializePlanEditor() {
        console.log('🔧 Initializing Plan Editor Module...');
        
        try {
            // Find a specific editor container; avoid using document.body as a guard target
            const editorContainer =
                document.querySelector('.plan-editor-isolated') ||
                document.querySelector('.plan-editor') ||
                document.getElementById('mainContent') ||
                document.querySelector('#planEditorRoot') ||
                document.querySelector('[data-module="plan-editor"]');
            
            if (!editorContainer) {
                // DOM not yet injected; retry a few times
                if (__planEditorBootAttempts < 20) {
                    __planEditorBootAttempts++;
                    console.log(`[PlanEditor] Editor container not ready (attempt ${__planEditorBootAttempts}), retrying...`);
                    setTimeout(initializePlanEditor, 250);
                    return;
                } else {
                    console.warn('[PlanEditor] Editor container not found after retries. Showing minimal fallback.');
                    const loadingState = document.getElementById('loadingState');
                    if (loadingState) loadingState.textContent = 'Falha ao iniciar o editor.';
                    return;
                }
            }
            
            // Idempotent per-view guard on the actual editor container only
            if (editorContainer.dataset && editorContainer.dataset.initialized === 'true') {
                console.log('[PlanEditor] Already initialized for this view, skipping re-init.');
                return;
            }
            if (editorContainer.dataset) editorContainer.dataset.initialized = 'true';
            
            console.log('✅ DOM validation passed - plan editor container found');
            
            // Check if we're editing an existing plan (sessionStorage or URL fallback)
            const urlId = new URLSearchParams(window.location.search).get('id');
            const storedId = sessionStorage.getItem('editingPlanId');
            const editingPlanId = storedId || urlId;
            if (editingPlanId) {
                console.log('🔄 Loading plan for editing:', editingPlanId);
                editMode = true;
                await loadPlanData(editingPlanId);
                if (storedId) sessionStorage.removeItem('editingPlanId'); // Clean up if used
            } else {
                // This is a new plan - hide loading and show form and tabs
                console.log('🆕 Creating new plan');
                editMode = false;
                currentPlan = null;
                
                const loadingState = document.getElementById('loadingState');
                const mainContent = document.getElementById('mainContent');
                const tabsNav = document.getElementById('planTabs');
                const tabsPanels = document.getElementById('planTabPanels');
                const coursesTabBtn = document.getElementById('coursesTabBtn');
                if (loadingState) loadingState.style.display = 'none';
                if (mainContent) mainContent.style.display = 'block';
                if (tabsNav) tabsNav.style.display = 'flex';
                if (tabsPanels) tabsPanels.style.display = 'block';
                if (coursesTabBtn) coursesTabBtn.style.display = 'block';
                
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
    
    // Utility: fetch with timeout to avoid infinite loaders when the API hangs
    async function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const res = await fetch(url, { ...options, signal: controller.signal });
            return res;
        } catch (err) {
            if (err.name === 'AbortError') {
                throw new Error('Tempo esgotado ao comunicar com o servidor. Tente novamente.');
            }
            throw err;
        } finally {
            clearTimeout(id);
        }
    }

    // Load plan data for editing
    async function loadPlanData(planId) {
        try {
            console.log('[PlanEditor] Fetching plan data...', planId);
            const response = await fetchWithTimeout(`/api/billing-plans/${planId}`);
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
            // Remove loader and show error fallback
            const loadingState = document.getElementById('loadingState');
            const mainContent = document.getElementById('mainContent');
            if (loadingState) loadingState.style.display = 'none';
            if (mainContent) mainContent.style.display = 'none';
            const errorContainer = document.getElementById('planEditorError') || document.createElement('div');
            errorContainer.id = 'planEditorError';
            errorContainer.className = 'plan-editor-error';
            errorContainer.innerHTML = `
                <div style='text-align:center;padding:2rem;'>
                    <h2>Erro ao carregar dados do plano</h2>
                    <p>${error.message || 'Falha desconhecida.'}</p>
                    <button id='retryLoadPlanBtn' class='btn btn-primary'>Tentar novamente</button>
                    <button id='backToPlansBtn' class='btn btn-secondary' style='margin-left:1rem;'>Voltar</button>
                </div>
            `;
            document.body.appendChild(errorContainer);
            document.getElementById('retryLoadPlanBtn').onclick = () => {
                errorContainer.remove();
                if (loadingState) loadingState.style.display = 'block';
                if (mainContent) mainContent.style.display = 'none';
                loadPlanData(planId);
            };
            document.getElementById('backToPlansBtn').onclick = () => {
                window.goBackToPlans();
            };
            // Ensure tabs wrapper is shown so user can navigate other tabs if needed
            const tabsNav = document.getElementById('planTabs');
            const tabsPanels = document.getElementById('planTabPanels');
            if (tabsNav) tabsNav.style.display = 'flex';
            if (tabsPanels) tabsPanels.style.display = 'block';
            // Keep edit mode and remember id for other operations (e.g., Courses tab) even if details failed
            editMode = true;
            currentPlan = { id: planId };
        }
    }
    
    // Load supporting data (courses, etc.)
    async function loadSupportingData() {
        try {
            console.log('[PlanEditor] Fetching courses list...');
            // Load courses if needed
            const coursesResponse = await fetchWithTimeout('/api/courses');
            if (coursesResponse.ok) {
                const coursesResult = await coursesResponse.json();
                allCourses = coursesResult.data || [];
                console.log('✅ Courses data loaded:', allCourses.length);
            }
            // Always show the courses tab button after attempting to load courses
            // The content and specific messages will be handled by plan-editor-courses-tab.js
            const coursesTabBtn = document.getElementById('coursesTabBtn');
            if (coursesTabBtn) {
                coursesTabBtn.style.display = 'block';
            }
        } catch (error) {
            console.warn('⚠️ Could not load supporting data:', error);
            // Even if loading fails, show the tab so user is aware of its existence
            const coursesTabBtn = document.getElementById('coursesTabBtn');
            if (coursesTabBtn) {
                coursesTabBtn.style.display = 'block';
            }
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

        // Hide loading state and show content
        const loadingState = document.getElementById('loadingState');
        const tabsNav = document.getElementById('planTabs');
        const tabsPanels = document.getElementById('planTabPanels');
        const mainContent = document.getElementById('mainContent');
        
        if (loadingState) loadingState.style.display = 'none';
        if (tabsNav) tabsNav.style.display = 'flex';
        if (tabsPanels) tabsPanels.style.display = 'block';
        if (mainContent) mainContent.style.display = 'block';
        
        // Ensure the Courses tab button is visible
        const coursesTabBtn = document.getElementById('coursesTabBtn');
        if (coursesTabBtn) {
            console.log('[DEBUG] Aba Cursos encontrada, tornando-a visível.');
            coursesTabBtn.style.display = 'block';
        } else {
            console.warn('[DEBUG] Aba Cursos NÃO encontrada ao tentar torná-la visível.');
        }
    }
    
    // Setup event listeners
    function setupEventListeners() {
        // Unified tab navigation logic
        const tabsContainer = document.getElementById('planTabs');
        if (tabsContainer) {
            tabsContainer.addEventListener('click', (e) => {
                const tab = e.target.closest('.plan-tab');
                if (!tab) return;
                const target = tab.dataset.tab;
                if (!target) return;
                // Remove 'active' from all tabs and panels
                tabsContainer.querySelectorAll('.plan-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.plan-tab-panel').forEach(p => p.classList.remove('active'));
                // Activate selected tab and panel
                tab.classList.add('active');
                const panel = document.querySelector('.plan-tab-panel[data-panel="' + target + '"]');
                if (panel) panel.classList.add('active');
                // If switching to courses, initialize if needed
                if (target === 'courses') {
                    initCoursesTab();
                }
                // If switching to lesson plans, lazy-load module and init
                if (target === 'lesson-plans') {
                    initLessonPlansTab();
                }
            });
        }

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
    
    // Load and render courses for current plan
    async function loadPlanCourses() {
        if (!currentPlan?.id) return;
        
        try {
            const response = await fetch(`/api/plans/${currentPlan.id}/courses`);
            const result = await response.json();
            
            if (result.success) {
                renderCourses(result.data || []);
            }
        } catch (error) {
            console.error('Error loading plan courses:', error);
        }
    }
    
    // Render courses in the courses tab
    function renderCourses(courses) {
        const container = document.getElementById('coursesPanelContent');
        if (!container) return;
        
        // Show loading state
        const loadingEl = document.getElementById('coursesLoading');
        const associationEl = document.getElementById('coursesAssociation');
        
        if (loadingEl) loadingEl.style.display = 'block';
        if (associationEl) associationEl.style.display = 'none';
        
        // Simulate loading delay
        setTimeout(() => {
            if (loadingEl) loadingEl.style.display = 'none';
            if (associationEl) associationEl.style.display = 'flex';
            
            // TODO: Implement actual course rendering logic
            console.log('Rendering courses:', courses);
        }, 500);
    }
    
    // Courses Tab Functions (integrated from plan-editor-courses-tab.js)
    
    async function initCoursesTab() {
        console.log('[CoursesTab] initCoursesTab() chamada. Estado inicializado:', coursesTabState.initialized);
        // Only bind events once on first initialization
        if (!coursesTabState.initialized) {
            console.log('[CoursesTab] Primeira inicialização, configurando eventos...');
            coursesTabState.initialized = true;
            bindCoursesTabUIEvents();
        }
        
        const panel = document.getElementById('coursesPanel');
        if (!panel) {
            console.warn('[CoursesTab] Painel de cursos não encontrado.');
            return;
        }
        
        const planId = getCurrentPlanId();
        coursesTabState.planId = planId; // Store planId in state
        console.log('[CoursesTab] ID do plano obtido:', planId);
        
        if (!planId) {
            // Show message if no plan ID, even after initialization
            console.log('[CoursesTab] Nenhum ID de plano encontrado, mostrando mensagem.');
            panel.querySelector('#coursesPanelContent').innerHTML = '<div class=\"empty-state\">Salve o plano primeiro para associar cursos.</div>';
            // Hide loading and association elements if they exist
            const coursesLoading = document.getElementById('coursesLoading');
            const coursesAssociation = document.getElementById('coursesAssociation');
            const coursesDiffBar = document.getElementById('coursesDiffBar');
            if (coursesLoading) coursesLoading.style.display = 'none';
            if (coursesAssociation) coursesAssociation.style.display = 'none';
            if (coursesDiffBar) coursesDiffBar.style.display = 'none';
            return;
        }
        
        // Load courses data if we have a plan ID
        // Show loading state
        console.log('[CoursesTab] ID de plano encontrado, iniciando carregamento de dados.');
        const coursesLoading = document.getElementById('coursesLoading');
        const coursesAssociation = document.getElementById('coursesAssociation');
        if (coursesLoading) coursesLoading.style.display = 'block';
        if (coursesAssociation) coursesAssociation.style.display = 'none';
        
        await loadCoursesTabData();
    }

    function getCurrentPlanId() {
        // Use the currentPlan from the main module state if available
        if (currentPlan && currentPlan.id) {
            return currentPlan.id;
        }
        // Fallback to URL or sessionStorage
        const urlParams = new URLSearchParams(window.location.search);
        const idFromUrl = urlParams.get('id');
        if (idFromUrl) return idFromUrl;
        const idFromSession = sessionStorage.getItem('editingPlanId');
        return idFromSession || null;
    }

    function bindCoursesTabUIEvents() {
        const addBtn = document.getElementById('addCourseBtn');
        const remBtn = document.getElementById('removeCourseBtn');
        const searchAvail = document.getElementById('searchAvailableCourses');
        const searchLinked = document.getElementById('searchLinkedCourses');
        const saveBtn = document.getElementById('saveCoursesChangesBtn');
        const discardBtn = document.getElementById('discardCoursesChangesBtn');

        addBtn?.addEventListener('click', () => moveSelected('available'));
        remBtn?.addEventListener('click', () => moveSelected('linked'));
        searchAvail?.addEventListener('input', debounce(e => {
            coursesTabState.filterAvailable = e.target.value.trim().toLowerCase();
            renderCoursesTabLists();
        }, 250));
        searchLinked?.addEventListener('input', debounce(e => {
            coursesTabState.filterLinked = e.target.value.trim().toLowerCase();
            renderCoursesTabLists();
        }, 250));
        saveBtn?.addEventListener('click', saveCoursesTabDiff);
        discardBtn?.addEventListener('click', discardCoursesTabChanges);
    }

    async function loadCoursesTabData() {
        try {
            console.log('[CoursesTab] Iniciando carregamento de dados de cursos...');
            toggleCoursesTabLoading(true);
            // Fetch ALL courses
            console.log('[CoursesTab] Chamando API: GET /api/courses');
            const allResp = await fetch('/api/courses');
            const allJson = allResp.ok ? await allResp.json() : {
                data: []
            };
            console.log('[CoursesTab] Resposta da API /api/courses:', allJson);
            const allCourses = (allJson.data || []).filter(c => c.isActive !== false);
            console.log('[CoursesTab] Cursos ativos encontrados:', allCourses.length, allCourses);

            // Fetch linked courses
            console.log(`[CoursesTab] Chamando API: GET /api/plans/${coursesTabState.planId}/courses`);
            const linkedResp = await fetch(`/api/plans/${coursesTabState.planId}/courses`);
            const linkedJson = linkedResp.ok ? await linkedResp.json() : {
                data: []
            };
            console.log(`[CoursesTab] Resposta da API /api/plans/${coursesTabState.planId}/courses:`, linkedJson);
            coursesTabState.linked = linkedJson.data || [];
            coursesTabState.originalLinkedIds = new Set(coursesTabState.linked.map(c => c.id));
            console.log('[CoursesTab] Cursos já associados ao plano:', coursesTabState.linked.length, coursesTabState.linked);

            // Available = all - linked
            const linkedIds = new Set(coursesTabState.linked.map(c => c.id));
            coursesTabState.available = allCourses.filter(c => !linkedIds.has(c.id));
            console.log('[CoursesTab] Cursos disponíveis para associação:', coursesTabState.available.length, coursesTabState.available);

            renderCoursesTabLists();
            toggleCoursesTabLoading(false);
            document.getElementById('coursesAssociation').style.display = 'flex';
            console.log('[CoursesTab] Carregamento de dados de cursos concluído.');
        } catch (err) {
            console.error('[CoursesTab] Falha ao carregar associação de cursos', err);
            showCoursesTabError('Erro ao carregar cursos: ' + err.message);
            toggleCoursesTabLoading(false);
        }
    }

    function renderCoursesTabLists() {
        console.log('[CoursesTab] Iniciando renderização das listas de cursos...');
        const availUl = document.getElementById('availableCoursesList');
        const linkedUl = document.getElementById('linkedCoursesList');
        if (!availUl || !linkedUl) {
            console.warn('[CoursesTab] Elementos de lista não encontrados (availableCoursesList ou linkedCoursesList)');
            return;
        }

        const availFiltered = coursesTabState.available.filter(c => !coursesTabState.filterAvailable || c.name.toLowerCase().includes(coursesTabState.filterAvailable));
        const linkedFiltered = coursesTabState.linked.filter(c => !coursesTabState.filterLinked || c.name.toLowerCase().includes(coursesTabState.filterLinked));

        console.log('[CoursesTab] Cursos disponíveis (filtrados):', availFiltered.length, availFiltered);
        console.log('[CoursesTab] Cursos associados (filtrados):', linkedFiltered.length, linkedFiltered);

        availUl.innerHTML = availFiltered.map(c => courseLi(c, 'available')).join('');
        linkedUl.innerHTML = linkedFiltered.map(c => courseLi(c, 'linked')).join('');

        console.log('[CoursesTab] HTML das listas atualizado.');

        document.getElementById('availableCount').textContent = availFiltered.length;
        document.getElementById('linkedCount').textContent = linkedFiltered.length;

        document.getElementById('availableEmptyState').style.display = availFiltered.length ? 'none' : 'block';
        document.getElementById('linkedEmptyState').style.display = linkedFiltered.length ? 'none' : 'block';

        console.log('[CoursesTab] Estados vazios atualizados. Available empty:', !availFiltered.length, 'Linked empty:', !linkedFiltered.length);
        
        // Attach click handlers
        availUl.querySelectorAll('li').forEach(li => {
            li.addEventListener('click', () => toggleSelect(li, 'available'));
        });
        linkedUl.querySelectorAll('li').forEach(li => {
            li.addEventListener('click', () => toggleSelect(li, 'linked'));
        });

        updateCoursesTabDiffBar();
        console.log('[CoursesTab] Renderização das listas concluída.');
    }

    function toggleSelect(li, list) {
        const id = li.dataset.id;
        const set = list === 'available' ? coursesTabState.selectedAvailable : coursesTabState.selectedLinked;
        if (set.has(id)) set.delete(id);
        else set.add(id);
        li.classList.toggle('selected');
    }

    function moveSelected(from) {
        if (from === 'available') {
            if (!coursesTabState.selectedAvailable.size) return;
            const movingIds = new Set(coursesTabState.selectedAvailable);
            const moving = coursesTabState.available.filter(c => movingIds.has(c.id));
            coursesTabState.linked.push(...moving);
            coursesTabState.available = coursesTabState.available.filter(c => !movingIds.has(c.id));
            coursesTabState.selectedAvailable.clear();
        } else {
            if (!coursesTabState.selectedLinked.size) return;
            const movingIds = new Set(coursesTabState.selectedLinked);
            const moving = coursesTabState.linked.filter(c => movingIds.has(c.id));
            coursesTabState.available.push(...moving);
            coursesTabState.linked = coursesTabState.linked.filter(c => !movingIds.has(c.id));
            coursesTabState.selectedLinked.clear();
        }
        renderCoursesTabLists();
    }

    function updateCoursesTabDiffBar() {
        const currentLinkedIds = new Set(coursesTabState.linked.map(c => c.id));
        let added = [],
            removed = [];
        currentLinkedIds.forEach(id => {
            if (!coursesTabState.originalLinkedIds.has(id)) added.push(id);
        });
        coursesTabState.originalLinkedIds.forEach(id => {
            if (!currentLinkedIds.has(id)) removed.push(id);
        });
        const diffBar = document.getElementById('coursesDiffBar');
        if (!added.length && !removed.length) {
            diffBar.style.display = 'none';
            markCoursesTabDirty(false);
            return;
        }
        diffBar.style.display = 'flex';
        const summary = [];
        if (added.length) summary.push(`<span class='tag-added'>+${added.length} adicionados</span>`);
        if (removed.length) summary.push(`<span class='tag-removed'>-${removed.length} removidos</span>`);
        document.getElementById('diffSummary').innerHTML = summary.join(' | ');
        markCoursesTabDirty(true);
    }

    function markCoursesTabDirty(isDirty) {
        const tab = document.getElementById('coursesTabBtn');
        if (!tab) return;
        tab.classList.toggle('badge-dirty', isDirty);
    }

    function discardCoursesTabChanges() {
        // Reset to original
        const currentLinkedIds = new Set(coursesTabState.originalLinkedIds);
        const all = [...coursesTabState.available, ...coursesTabState.linked];
        coursesTabState.linked = all.filter(c => currentLinkedIds.has(c.id));
        const linkedIds = new Set(coursesTabState.linked.map(c => c.id));
        coursesTabState.available = all.filter(c => !linkedIds.has(c.id));
        coursesTabState.selectedAvailable.clear();
        coursesTabState.selectedLinked.clear();
        renderCoursesTabLists();
    }

    async function saveCoursesTabDiff() {
        try {
            const currentLinkedIds = new Set(coursesTabState.linked.map(c => c.id));
            let add = [],
                remove = [];
            currentLinkedIds.forEach(id => {
                if (!coursesTabState.originalLinkedIds.has(id)) add.push(id);
            });
            coursesTabState.originalLinkedIds.forEach(id => {
                if (!currentLinkedIds.has(id)) remove.push(id);
            });
            if (!add.length && !remove.length) {
                showCoursesTabSuccess('Nenhuma alteração para salvar');
                return;
            }
            const resp = await fetch(`/api/plans/${coursesTabState.planId}/courses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    add,
                    remove
                })
            });
            const json = await resp.json();
            if (!resp.ok || !json.success) throw new Error(json.message || 'Falha ao salvar associações');
            coursesTabState.originalLinkedIds = new Set(coursesTabState.linked.map(c => c.id));
            updateCoursesTabDiffBar();
            showCoursesTabSuccess('Associações salvas');
        } catch (err) {
            console.error('Save diff error', err);
            showCoursesTabError('Erro ao salvar associações: ' + err.message);
        }
    }

    function toggleCoursesTabLoading(is) {
        const l = document.getElementById('coursesLoading');
        if (l) l.style.display = is ? 'block' : 'none';
    }

    function courseLi(course, list) {
        const selectedSet = list === 'available' ? coursesTabState.selectedAvailable : coursesTabState.selectedLinked;
        const selected = selectedSet.has(course.id);
        return `<li data-id="${course.id}" class="${selected ? 'selected':''}"><span>${escapeHtml(course.name)}</span><span class="meta">${course.level||''}</span></li>`;
    }

    function debounce(fn, wait) {
        let t;
        return (...a) => {
            clearTimeout(t);
            t = setTimeout(() => fn(...a), wait);
        };
    }
    
    function escapeHtml(str) {
        return (str || '').replace(/[&<>\"']/g, c => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '\"': '&quot;',
            '\'': '&#39;'
        }[c] || c));
    }

    function showCoursesTabError(message) {
        if (typeof showToast === 'function') showToast(message, 'error');
        else alert('Erro: ' + message);
    }
    
    function showCoursesTabSuccess(message) {
        if (typeof showToast === 'function') showToast(message, 'success');
        else alert('Sucesso: ' + message);
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
    
    // Lazy load lesson-plans.js if needed and initialize
    async function initLessonPlansTab() {
        try {
            if (!lessonPlansTabState.initialized) {
                await ensureLessonPlansScript();
                if (typeof window.initializeLessonPlansModule === 'function') {
                    await window.initializeLessonPlansModule();
                }
                lessonPlansTabState.initialized = true;
            }
        } catch (err) {
            showError('Erro ao carregar Planos de Aula: ' + (err?.message || err));
        }
    }

    function ensureLessonPlansScript() {
        return new Promise((resolve, reject) => {
            // Ensure CSS for lesson-plans is present when loaded inside the editor tab
            const cssHref = '/css/modules/lesson-plans.css';
            if (!document.querySelector(`link[href="${cssHref}"]`)) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = cssHref;
                document.head.appendChild(link);
            }

            if (typeof window.initializeLessonPlansModule === 'function') return resolve();
            const existing = document.querySelector('script[data-module="lesson-plans"]');
            if (existing) {
                existing.addEventListener('load', () => resolve());
                existing.addEventListener('error', (e) => reject(e));
                return;
            }
            const s = document.createElement('script');
            s.src = '../js/modules/lesson-plans.js';
            s.async = true;
            s.defer = false;
            s.setAttribute('data-module', 'lesson-plans');
            s.onload = () => resolve();
            s.onerror = (e) => reject(new Error('Falha ao carregar lesson-plans.js'));
            document.body.appendChild(s);
        });
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
    
    // Ensure initialization is attempted even if loader misses DOMContentLoaded
    try { __bootPlanEditor(); } catch (_) {}
    // Extra safety: schedule another attempt shortly (handles late DOM injection)
    setTimeout(() => { try { __bootPlanEditor(); } catch (_) {} }, 0);
    setTimeout(() => { try { __bootPlanEditor(); } catch (_) {} }, 300);

    // Module loaded successfully
    console.log('📝 Plan Editor Module script loaded, initializePlanEditor available:', typeof window.initializePlanEditor);
    
})();
