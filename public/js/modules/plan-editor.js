(function() {
    'use strict';

    // Idempotent init guard for validator and re-entrancy
    if (window.__planEditorInitialized) {
        console.log('[PlanEditor] Already initialized, skipping.');
        return;
    }
    window.__planEditorInitialized = true;

    // Boot retry state (handles SPA view injection races)
    let __planEditorBootAttempts = 0;
    
    // Module state
    let currentPlan = null;
    let editMode = false;
    let allCourses = [];

    // Safe feedback helpers using shared utils if available
    const FE = {
        toast: (m,t) => (window.feedback?.toast ? window.feedback.toast(m,t) : alert((t==='error'?'Erro: ':'') + (m||''))),
        error: (m) => (window.feedback?.showError ? window.feedback.showError(m) : alert('Erro: '+(m||''))),
        success: (m) => (window.feedback?.showSuccess ? window.feedback.showSuccess(m) : alert('Sucesso: '+(m||''))),
        setBtnLoading: (b,l) => (window.feedback?.setButtonLoading ? window.feedback.setButtonLoading(b,l) : (b&&(b.disabled=l))),
        inlineError: (sel,m) => (window.feedback?.setInlineError ? window.feedback.setInlineError(sel,m) : console.warn('InlineError:',m))
    };

    // Guidelines.MD: Module API helper
    const PlansAPI = (typeof window.createModuleAPI === 'function') ? window.createModuleAPI('Plans') : null;

    // --- New: Collect and normalize form data ---
    function collectFormData() {
        const get = (id) => (document.getElementById(id)?.value ?? '').toString().trim();
        const name = get('planName');
        const description = get('planDescription');
        const category = get('planCategory');
        const priceStr = get('planPrice').replace(',', '.');
        const billingType = get('planBillingType');
        const classesPerWeekStr = get('planClassesPerWeek');

        const price = priceStr === '' ? NaN : Number(priceStr);
        const classesPerWeek = classesPerWeekStr === '' ? null : parseInt(classesPerWeekStr, 10);

        return {
            name,
            description,
            category,
            price,
            billingType,
            ...(classesPerWeek !== null && !Number.isNaN(classesPerWeek) ? { classesPerWeek } : {})
        };
    }

    // Utility functions for visibility control using CSS classes
    function showElement(element) {
        if (element) {
            element.classList.remove('hidden');
            element.classList.add('show');
        }
    }

    function hideElement(element) {
        if (element) {
            element.classList.remove('show');
            element.classList.add('hidden');
        }
    }

    function toggleElement(element, show) {
        if (show) { showElement(element); } else { hideElement(element); }
    }
    
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
    
    // Initialize module when DOM is ready or immediately if already loaded
    console.log('[PlanEditor] Boot scheduling, readyState:', document.readyState);
    function __bootPlanEditor() {
        try {
            console.log('[PlanEditor] Boot invoked');
            initializePlanEditor();
        } catch (e) {
            console.error('[PlanEditor] Boot error:', e);
            window.app?.handleError?.(e, { module: 'plan-editor', stage: 'boot' });
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
                document.querySelector('[data-module="plan-editor"]') ||
                document.querySelector('.module-isolated-base');
            
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
            if (editorContainer.dataset) {
                editorContainer.dataset.initialized = 'true';
                // Mark as active for validator and DS
                try {
                    editorContainer.id = editorContainer.id || 'planEditorContainer';
                    editorContainer.dataset.module = 'plan-editor';
                    editorContainer.dataset.active = 'true';
                    editorContainer.classList.add('module-isolated-container','module-active');
                } catch(_){}
            }
            
            console.log('✅ DOM validation passed - plan editor container found');

            // Dispatch module loaded when finishing init
            const dispatchLoaded = () => window.app?.dispatchEvent?.('module:loaded', { name: 'plan-editor' });
            
            // Check if we're editing an existing plan (session from router supports deep routes)
            const storedId = (window.EditingSession && window.EditingSession.getEditingPlanId && window.EditingSession.getEditingPlanId()) || null;
            // Hash deep route fallback: #plan-editor/<id>
            const hash = (location.hash||'').replace(/^#/,'');
            const parts = hash.split('/');
            const hashId = parts[0]==='plan-editor' && parts[1] ? decodeURIComponent(parts[1]) : null;
            const editingPlanId = storedId || hashId;
            if (editingPlanId) {
                console.log('🔄 Loading plan for editing:', editingPlanId);
                editMode = true;
                await loadPlanData(editingPlanId);
                if (storedId && window.EditingSession?.clearEditingPlanId) window.EditingSession.clearEditingPlanId();
            } else {
                console.log('🆕 Creating new plan');
                editMode = false;
                currentPlan = null;
                const loadingState = document.getElementById('loadingState');
                const mainContent = document.getElementById('mainContent');
                const tabsNav = document.getElementById('planTabs');
                const tabsPanels = document.getElementById('planTabPanels');
                const coursesTabBtn = document.getElementById('coursesTabBtn');
                hideElement(loadingState);
                showElement(mainContent);
                showElement(tabsNav);
                showElement(tabsPanels);
                showElement(coursesTabBtn);
                // Focus first input for a11y
                requestAnimationFrame(()=>{ document.getElementById('planName')?.focus(); });
                const pageTitle = document.querySelector('#pageTitle, h1');
                if (pageTitle) pageTitle.textContent = 'Adicionar Novo Plano';
            }
            
            // Load supporting data
            await loadSupportingData();
            
            // Setup event listeners
            setupEventListeners();
            
            // A11y adjustments for header actions
            const headerSaveBtn = document.getElementById('savePlanHeaderBtn');
            if (headerSaveBtn) {
                headerSaveBtn.type = 'button';
                headerSaveBtn.setAttribute('aria-label','Salvar alterações do plano');
            }
            const backBtn = document.getElementById('backBtn');
            if (backBtn) backBtn.setAttribute('aria-label','Voltar para a lista de planos');

            // Register with ModuleLoader and expose globally
            window.planEditor = Object.assign(window.planEditor || {}, { init: initializePlanEditor });
            window.ModuleLoader?.register?.('plan-editor', window.planEditor);

            console.log('✅ Plan Editor Module initialized successfully');
            dispatchLoaded();
        } catch (error) {
            console.error('❌ Error initializing plan editor module:', error);
            window.app?.handleError?.(error, { module: 'plan-editor', stage: 'init' });
            
            const loadingState = document.getElementById('loadingState');
            const mainContent = document.getElementById('mainContent');
            hideElement(loadingState);
            showElement(mainContent);
        }
    }
    
    // Utility: fetch with timeout
    async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const res = await fetch(url, { ...options, signal: controller.signal });
            return res;
        } catch (err) {
            if (err.name === 'AbortError') throw new Error('Tempo esgotado ao comunicar com o servidor. Tente novamente.');
            throw err;
        } finally { clearTimeout(id); }
    }

    // Parse API error body/text
    async function parseApiError(resp){
        try {
            const ct = resp.headers.get('content-type')||'';
            if (ct.includes('application/json')){
                const j = await resp.json();
                return j?.message || JSON.stringify(j);
            } else {
                const t = await resp.text();
                return t || `${resp.status} ${resp.statusText}`;
            }
        } catch(e){
            return `${resp.status} ${resp.statusText}`;
        }
    }

    // Load plan data for editing (migrated to ModuleAPIHelper when available)
    async function loadPlanData(planId) {
        const loadingState = document.getElementById('loadingState');
        const mainContent = document.getElementById('mainContent');
        const tabsNav = document.getElementById('planTabs');
        const tabsPanels = document.getElementById('planTabPanels');
        const onErr = (error) => {
            console.error('❌ Error loading plan data:', error);
            hideElement(loadingState);
            hideElement(mainContent);
            const errorContainer = document.getElementById('planEditorError') || document.createElement('div');
            errorContainer.id = 'planEditorError';
            errorContainer.className = 'plan-editor-error';
            errorContainer.innerHTML = `
                <div style='text-align:center;padding:2rem;'>
                    <h2>Erro ao carregar dados do plano</h2>
                    <p>${(error?.message)||'Falha desconhecida.'}</p>
                    <button id='retryLoadPlanBtn' class='module-isolated-btn-primary'>Tentar novamente</button>
                    <button id='backToPlansBtn' class='module-isolated-btn-secondary' style='margin-left:1rem;'>Voltar</button>
                </div>
            `;
            document.getElementById('module-container')?.appendChild(errorContainer);
            document.getElementById('retryLoadPlanBtn').onclick = () => {
                errorContainer.remove();
                showElement(loadingState);
                hideElement(mainContent);
                loadPlanData(planId);
            };
            document.getElementById('backToPlansBtn').onclick = () => { window.goBackToPlans(); };
            showElement(tabsNav);
            showElement(tabsPanels);
            editMode = true;
            currentPlan = { id: planId };
        };

        try {
            if (PlansAPI?.fetchWithStates) {
                await PlansAPI.fetchWithStates(`/api/billing-plans/${encodeURIComponent(planId)}`, {
                    loadingElement: loadingState,
                    targetElement: mainContent,
                    onLoading: () => { showElement(loadingState); hideElement(mainContent); hideElement(tabsNav); hideElement(tabsPanels); },
                    onSuccess: (data) => { currentPlan = data; populateForm(currentPlan); },
                    onError: (err) => onErr(err),
                    onEmpty: () => onErr(new Error('Plano não encontrado.'))
                });
            } else {
                // Fallback
                console.log('[PlanEditor] Fetching plan data (fallback)...', planId);
                const response = await fetchWithTimeout(`/api/billing-plans/${encodeURIComponent(planId)}`);
                if (!response.ok){
                    const msg = await parseApiError(response);
                    throw new Error(msg);
                }
                const result = await response.json();
                if (result?.success) {
                    currentPlan = result.data;
                    populateForm(currentPlan);
                    console.log('✅ Plan data loaded for editing');
                } else {
                    throw new Error(result?.message || 'Falha ao carregar dados do plano');
                }
            }
        } catch (error) { onErr(error); }
    }

    // Load supporting data (courses, etc.) using ModuleAPIHelper when available
    async function loadSupportingData() {
        const coursesTabBtn = document.getElementById('coursesTabBtn');
        try {
            if (PlansAPI?.fetchWithStates) {
                await PlansAPI.fetchWithStates('/api/courses', {
                    onSuccess: (data) => { allCourses = data || []; },
                    onError: (err) => { console.warn('⚠️ Could not load supporting data:', err); }
                });
            } else {
                console.log('[PlanEditor] Fetching courses list (fallback)...');
                const coursesResponse = await fetchWithTimeout('/api/courses');
                if (coursesResponse.ok) {
                    const coursesResult = await coursesResponse.json();
                    allCourses = coursesResult.data || [];
                }
            }
            showElement(coursesTabBtn);
        } catch (error) {
            console.warn('⚠️ Could not load supporting data:', error);
            showElement(coursesTabBtn);
        }
    }
    
    // Populate form with plan data
    function populateForm(plan) {
        const form = document.getElementById('plan-form') || document.getElementById('planForm') || document.querySelector('form');
        if (!form) return;
        
        const fields = {
            'planName': plan.name,
            'planDescription': plan.description,
            'planCategory': plan.category,
            'planPrice': (plan.price?.value ?? plan.price),
            'planBillingType': plan.billingType,
            'planClassesPerWeek': plan.classesPerWeek
        };
        
        Object.entries(fields).forEach(([fieldId, value]) => {
            const field = document.getElementById(fieldId);
            if (field && value !== undefined && value !== null) {
                field.value = value;
            }
        });
        
        const pageTitle = document.querySelector('#pageTitle, h1');
        if (pageTitle) pageTitle.textContent = editMode ? 'Editar Plano' : 'Adicionar Novo Plano';

        // Focus first field when data is ready
        requestAnimationFrame(()=>{ document.getElementById('planName')?.focus(); });
        
        console.log('✅ Form populated with plan data');

        const loadingState = document.getElementById('loadingState');
        const tabsNav = document.getElementById('planTabs');
        const tabsPanels = document.getElementById('planTabPanels');
        const mainContent = document.getElementById('mainContent');
        
        hideElement(loadingState);
        showElement(tabsNav);
        showElement(tabsPanels);
        showElement(mainContent);
        
        const coursesTabBtn = document.getElementById('coursesTabBtn');
        if (coursesTabBtn) showElement(coursesTabBtn);
        else console.warn('[DEBUG] Aba Cursos não encontrada.');
    }
    
    // Safe back navigation to Plans module
    function navigateBackToPlans() {
        try { window.EditingSession?.clearEditingPlanId?.(); } catch (_) {}
        // Prefer router if exposed, else fallback to hash
        try {
            if (window.router && typeof window.router.navigateTo === 'function') {
                window.router.navigateTo('plans');
            } else {
                location.hash = 'plans';
            }
        } catch (_) {
            location.hash = 'plans';
        }
        // Try to refresh/reinitialize the Plans module after navigation
        setTimeout(() => {
            try { window.initializePlansModule?.(); } catch (_) {}
            try { window.loadAndShowPlans?.(); } catch (_) {}
        }, 200);
    }

    // Expose for any external callers expecting this name
    window.goBackToPlans = navigateBackToPlans;

    // Ensure integration with AcademyApp and ModuleLoader
    window.planEditor = Object.assign(window.planEditor || {}, { init: initializePlanEditor });
    window.ModuleLoader?.register?.('plan-editor', window.planEditor);

    function getActivePanelKey(){
        const active = document.querySelector('.plan-editor-tab-panel.active');
        return active?.dataset?.panel || 'details';
    }

    function hasPendingCoursesDiff(){
        try{
            const currentLinkedIds = new Set(coursesTabState.linked.map(c => String(c.id)));
            let pending = false;
            currentLinkedIds.forEach(id => { if (!coursesTabState.originalLinkedIds.has(id)) pending = true; });
            if (!pending) {
                coursesTabState.originalLinkedIds.forEach(id => { if (!currentLinkedIds.has(id)) pending = true; });
            }
            return pending;
        }catch(_){ return false; }
    }

    function handlePrimarySave(){
        const panel = getActivePanelKey();
        if (panel === 'courses'){
            if (hasPendingCoursesDiff()) return saveCoursesTabDiff();
            if (window.feedback?.showInfo) window.feedback.showInfo('Nada para salvar.');
            return;
        }
        return handleSavePlan();
    }

    // Setup event listeners
    function setupEventListeners() {
        // Unified tab navigation logic
        const tabsContainer = document.getElementById('planTabs');
        if (tabsContainer) {
            tabsContainer.addEventListener('click', (e) => {
                const tab = e.target.closest('.plan-editor-tab');
                if (!tab) return;
                const target = tab.dataset.tab;
                if (!target) return;
                tabsContainer.querySelectorAll('.plan-editor-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.plan-editor-tab-panel').forEach(p => p.classList.remove('active'));
                tab.classList.add('active');
                const panel = document.querySelector('.plan-editor-tab-panel[data-panel="' + target + '"]');
                if (panel) panel.classList.add('active');
                if (target === 'courses') initCoursesTab();
            }, { once: false });
        }

        // Back button
        const backBtn = document.getElementById('backBtn');
        if (backBtn && !backBtn.dataset.bound) {
            backBtn.dataset.bound = 'true';
            backBtn.addEventListener('click', () => navigateBackToPlans());
        }

        // Save button (form submit)
        const form = document.getElementById('plan-form') || document.getElementById('planForm') || document.querySelector('form');
        if (form && !form.dataset.bound) {
            form.dataset.bound = 'true';
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                handleSavePlan();
            });
        }

        // Header save routes to primary save (details or courses diff)
        const headerSaveBtn = document.getElementById('savePlanHeaderBtn');
        if (headerSaveBtn && !headerSaveBtn.dataset.bound) {
            headerSaveBtn.dataset.bound = 'true';
            headerSaveBtn.addEventListener('click', function() {
                handlePrimarySave();
            });
        }

        // Delete button - only show if editing
        const deleteBtn = document.getElementById('deletePlanBtn');
        if (deleteBtn) {
            if (editMode) {
                showElement(deleteBtn);
                if (!deleteBtn.dataset.bound) {
                    deleteBtn.dataset.bound = 'true';
                    deleteBtn.addEventListener('click', handleDeletePlan);
                }
            } else {
                hideElement(deleteBtn);
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
        // Prefer current loaded plan
        if (currentPlan && currentPlan.id) return currentPlan.id;
        // From EditingSession (provided by router)
        if (window.EditingSession && typeof window.EditingSession.getEditingPlanId === 'function') {
            const s = window.EditingSession.getEditingPlanId();
            if (s) return s;
        }
        // From deep hash: #plan-editor/<id>
        const raw = (location.hash || '').replace(/^#/, '');
        const [seg0, seg1] = raw.split('/');
        if (seg0 === 'plan-editor' && seg1) return decodeURIComponent(seg1);
        // Fallback to URLSearchParams
        const urlParams = new URLSearchParams(window.location.search);
        const idFromUrl = urlParams.get('id');
        if (idFromUrl) return idFromUrl;
        // Legacy session storage
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

    // Courses Tab: Load and render using ModuleAPIHelper
    async function loadCoursesTabData() {
        try {
            console.log('[CoursesTab] Iniciando carregamento de dados de cursos...');
            const coursesLoading = document.getElementById('coursesLoading');
            const coursesAssociation = document.getElementById('coursesAssociation');
            const target = document.getElementById('coursesPanelContent');

            const buildLists = (allList, linkedList) => {
                const allNorm = (Array.isArray(allList) ? allList : []).map(normalizeCourse).filter(Boolean);
                let linkedNorm = [];
                if (Array.isArray(linkedList) && linkedList.length && (typeof linkedList[0] === 'string' || typeof linkedList[0] === 'number')) {
                    const idSet = new Set(linkedList.map(v => String(v)));
                    linkedNorm = allNorm.filter(c => idSet.has(String(c.id)));
                } else {
                    linkedNorm = (Array.isArray(linkedList) ? linkedList : []).map(normalizeCourse).filter(Boolean).map(c => {
                        if (c.name) return c;
                        const found = allNorm.find(ac => String(ac.id) === String(c.id));
                        return found || c;
                    });
                }
                const effectiveAll = allNorm.filter(c => c.isActive !== false);
                const linkedIds = new Set(linkedNorm.map(c => String(c.id)));
                coursesTabState.linked = linkedNorm;
                coursesTabState.originalLinkedIds = new Set(Array.from(linkedIds));
                coursesTabState.available = effectiveAll.filter(c => !linkedIds.has(String(c.id)));
                renderCoursesTabLists();
                toggleCoursesTabLoading(false);
                if (coursesAssociation) coursesAssociation.style.display = 'flex';
                console.log('[CoursesTab] Dados prontos. all:', effectiveAll.length, 'linked:', linkedNorm.length, 'available:', coursesTabState.available.length);
            };

            if (PlansAPI?.fetchWithStates) {
                let allCoursesRaw = [];
                await PlansAPI.fetchWithStates('/api/courses', {
                    loadingElement: coursesLoading,
                    targetElement: target,
                    onLoading: () => { toggleCoursesTabLoading(true); if (coursesAssociation) coursesAssociation.style.display = 'none'; },
                    onSuccess: (data) => { allCoursesRaw = Array.isArray(data) ? data : []; },
                    onError: (err) => { showCoursesTabError('Erro ao carregar cursos: ' + (err?.message||err)); }
                });

                let linkedRaw = [];
                await PlansAPI.fetchWithStates(`/api/plans/${coursesTabState.planId}/courses`, {
                    // Do NOT pass targetElement here to avoid EMPTY state wiping the panel
                    onSuccess: (data) => { linkedRaw = Array.isArray(data) ? data : []; },
                    onEmpty: () => { linkedRaw = []; }
                });

                buildLists(allCoursesRaw, linkedRaw);
            } else {
                // Fallback to fetch
                toggleCoursesTabLoading(true);
                const allResp = await fetch('/api/courses');
                const allJson = allResp.ok ? await allResp.json() : { data: [] };
                const allRaw = Array.isArray(allJson?.data) ? allJson.data : [];

                const linkedResp = await fetch(`/api/plans/${coursesTabState.planId}/courses`);
                const linkedJson = linkedResp.ok ? await linkedResp.json() : { data: [] };
                const linkedRaw = Array.isArray(linkedJson?.data) ? linkedJson.data : [];

                buildLists(allRaw, linkedRaw);
            }
        } catch (err) {
            console.error('[CoursesTab] Falha ao carregar associação de cursos', err);
            showCoursesTabError('Erro ao carregar cursos: ' + (err?.message||err));
            toggleCoursesTabLoading(false);
        }
    }

    // Helper: normalize different course shapes into a unified object
    function normalizeCourse(raw) {
        if (!raw) return null;
        // Detect nested course object
        const nested = raw.course || raw.Course || null;
        const id = raw.id ?? raw.courseId ?? raw.uuid ?? raw._id ?? nested?.id ?? nested?.courseId;
        const name = raw.name ?? raw.title ?? nested?.name ?? nested?.title ?? '';
        const level = raw.level ?? nested?.level ?? '';
        const status = raw.status ?? nested?.status ?? null;
        const isActive = (status != null)
            ? (String(status).toUpperCase() !== 'INACTIVE')
            : ((raw.isActive ?? nested?.isActive) !== false);
        return id ? { id: String(id), name, level, status, isActive } : null;
    }

    function renderCoursesTabLists() {
        const availUl = document.getElementById('availableCoursesList');
        const linkedUl = document.getElementById('linkedCoursesList');
        if (!availUl || !linkedUl) return;

        const availFiltered = coursesTabState.available.filter(c => !coursesTabState.filterAvailable || (c.name||'').toLowerCase().includes(coursesTabState.filterAvailable));
        const linkedFiltered = coursesTabState.linked.filter(c => !coursesTabState.filterLinked || (c.name||'').toLowerCase().includes(coursesTabState.filterLinked));

        availUl.innerHTML = availFiltered.map(c => courseLi(c, 'available')).join('');
        linkedUl.innerHTML = linkedFiltered.map(c => courseLi(c, 'linked')).join('');

        const availableCount = document.getElementById('availableCount');
        const linkedCount = document.getElementById('linkedCount');
        if (availableCount) availableCount.textContent = String(availFiltered.length);
        if (linkedCount) linkedCount.textContent = String(linkedFiltered.length);

        const availableEmpty = document.getElementById('availableEmptyState');
        const linkedEmpty = document.getElementById('linkedEmptyState');
        if (availableEmpty) availableEmpty.style.display = availFiltered.length ? 'none' : 'block';
        if (linkedEmpty) linkedEmpty.style.display = linkedFiltered.length ? 'none' : 'block';

        availUl.querySelectorAll('li').forEach(li => li.addEventListener('click', () => toggleSelect(li, 'available')));
        linkedUl.querySelectorAll('li').forEach(li => li.addEventListener('click', () => toggleSelect(li, 'linked')));

        updateCoursesTabDiffBar();
    }

    function toggleSelect(li, list) {
        const id = li.dataset.id;
        const set = (list === 'available') ? coursesTabState.selectedAvailable : coursesTabState.selectedLinked;
        if (set.has(id)) set.delete(id); else set.add(id);
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
        const added = [], removed = [];
        currentLinkedIds.forEach(id => { if (!coursesTabState.originalLinkedIds.has(id)) added.push(id); });
        coursesTabState.originalLinkedIds.forEach(id => { if (!currentLinkedIds.has(id)) removed.push(id); });
        const diffBar = document.getElementById('coursesDiffBar');
        if (!diffBar) return;
        if (!added.length && !removed.length) {
            diffBar.style.display = 'none';
            markCoursesTabDirty(false);
            return;
        }
        diffBar.style.display = 'flex';
        const diffSummary = document.getElementById('diffSummary');
        if (diffSummary) {
            const summary = [];
            if (added.length) summary.push(`<span class='tag-added'>+${added.length} adicionados</span>`);
            if (removed.length) summary.push(`<span class='tag-removed'>-${removed.length} removidos</span>`);
            diffSummary.innerHTML = summary.join(' | ');
        }
        markCoursesTabDirty(true);
    }

    function markCoursesTabDirty(isDirty) {
        const tab = document.getElementById('coursesTabBtn');
        if (tab) tab.classList.toggle('badge-dirty', !!isDirty);
    }

    function discardCoursesTabChanges() {
        const original = new Set(coursesTabState.originalLinkedIds);
        const all = [...coursesTabState.available, ...coursesTabState.linked];
        coursesTabState.linked = all.filter(c => original.has(c.id));
        const linkedIds = new Set(coursesTabState.linked.map(c => c.id));
        coursesTabState.available = all.filter(c => !linkedIds.has(c.id));
        coursesTabState.selectedAvailable.clear();
        coursesTabState.selectedLinked.clear();
        renderCoursesTabLists();
    }

    function toggleCoursesTabLoading(isLoading) {
        const l = document.getElementById('coursesLoading');
        if (l) l.style.display = isLoading ? 'block' : 'none';
    }

    function courseLi(course, list) {
        const selectedSet = list === 'available' ? coursesTabState.selectedAvailable : coursesTabState.selectedLinked;
        const selected = selectedSet.has(String(course.id));
        return `<li data-id="${course.id}" class="${selected ? 'selected' : ''}"><span>${escapeHtml(course.name)}</span><span class="meta">${course.level||''}</span></li>`;
    }

    function debounce(fn, wait) {
        let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), wait); };
    }

    function escapeHtml(str) {
        return (String(str||'')).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]||c));
    }

    function showCoursesTabError(message) {
        if (window.feedback?.toast) window.feedback.toast(message, 'error');
        else alert('Erro: ' + message);
    }

    function showCoursesTabSuccess(message) {
        if (window.feedback?.toast) window.feedback.toast(message, 'success');
        else alert('Sucesso: ' + message);
    }

    // Save diff of course associations
    async function saveCoursesTabDiff() {
        try {
            if (!coursesTabState.planId) {
                showCoursesTabError('Salve o plano primeiro para associar cursos.');
                return;
            }
            const btn = document.getElementById('saveCoursesChangesBtn');
            if (btn && window.feedback?.setButtonLoading) window.feedback.setButtonLoading(btn, true);

            const currentLinkedIds = new Set(coursesTabState.linked.map(c => String(c.id)));
            const added = [];
            const removed = [];
            currentLinkedIds.forEach(id => { if (!coursesTabState.originalLinkedIds.has(id)) added.push(id); });
            coursesTabState.originalLinkedIds.forEach(id => { if (!currentLinkedIds.has(id)) removed.push(id); });

            if (!added.length && !removed.length) {
                showCoursesTabSuccess('Nada para salvar.');
                return;
            }

            const endpoint = `/api/plans/${coursesTabState.planId}/courses`;
            const payload = { add: added, remove: removed };

            if (PlansAPI?.saveWithFeedback) {
                await PlansAPI.saveWithFeedback(endpoint, payload, {
                    method: 'POST',
                    onSuccess: () => {
                        coursesTabState.originalLinkedIds = new Set(Array.from(currentLinkedIds));
                        document.getElementById('coursesDiffBar')?.style && (document.getElementById('coursesDiffBar').style.display = 'none');
                        markCoursesTabDirty(false);
                        showCoursesTabSuccess('Associações salvas com sucesso.');
                    },
                    onError: (err) => {
                        showCoursesTabError('Falha ao salvar associações: ' + (err?.message||err));
                    }
                });
            } else {
                const resp = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                if (!resp.ok) {
                    const msg = await resp.text().catch(() => 'Erro ao salvar associações.');
                    throw new Error(msg || `HTTP ${resp.status}`);
                }
                coursesTabState.originalLinkedIds = new Set(Array.from(currentLinkedIds));
                document.getElementById('coursesDiffBar')?.style && (document.getElementById('coursesDiffBar').style.display = 'none');
                markCoursesTabDirty(false);
                showCoursesTabSuccess('Associações salvas com sucesso.');
            }
        } catch (e) {
            showCoursesTabError('Falha ao salvar associações: ' + (e?.message || e));
        } finally {
            const btn = document.getElementById('saveCoursesChangesBtn');
            if (btn && window.feedback?.setButtonLoading) window.feedback.setButtonLoading(btn, false);
        }
    }

    // Re-add: Save/Delete handlers using API helper
    async function handleSavePlan() {
        const saveBtn = document.getElementById('savePlanBtn');
        const headerSaveBtn = document.getElementById('savePlanHeaderBtn');
        FE.setBtnLoading(saveBtn, true);
        FE.setBtnLoading(headerSaveBtn, true);
        try {
            const formData = collectFormData();
            if (!formData || !formData.name || !isFinite(formData.price) || formData.price < 0 || !formData.billingType) {
                FE.error('Falha ao salvar. Verifique os campos e tente novamente.');
                return;
            }
            const isEdit = editMode && currentPlan && currentPlan.id;
            const endpoint = isEdit ? `/api/billing-plans/${encodeURIComponent(currentPlan.id)}` : '/api/billing-plans';
            const method = isEdit ? 'PUT' : 'POST';

            if (PlansAPI?.saveWithFeedback) {
                await PlansAPI.saveWithFeedback(endpoint, formData, {
                    method,
                    onSuccess: () => {
                        FE.success(isEdit ? 'Plano atualizado com sucesso!' : 'Plano criado com sucesso!');
                        setTimeout(()=>{ try { window.router?.navigateTo?.('plans'); } catch(_) {} location.hash = 'plans'; try { window.loadAndShowPlans?.(); } catch(_) {} }, 250);
                    },
                    onError: (err) => {
                        FE.error(String(err?.message || 'Erro ao salvar plano.'));
                        FE.inlineError('#mainContent', String(err?.message || 'Erro ao salvar'));
                    }
                });
            } else {
                const resp = await fetch(endpoint, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
                if (!resp.ok) {
                    const msg = await (async()=>{try{const c=resp.headers.get('content-type')||'';return c.includes('json')? (await resp.json()).message : await resp.text();}catch{return '';}})();
                    throw new Error(msg || (resp.status===500 ? 'Falha ao salvar. Verifique os campos e tente novamente.' : 'Erro ao salvar plano'));
                }
                FE.success(isEdit ? 'Plano atualizado com sucesso!' : 'Plano criado com sucesso!');
                setTimeout(()=>{ try { window.router?.navigateTo?.('plans'); } catch(_) {} location.hash = 'plans'; try { window.loadAndShowPlans?.(); } catch(_) {} }, 250);
            }
        } catch (error) {
            console.error('❌ Error saving plan:', error);
            FE.error(String(error?.message || error || 'Falha ao salvar.'));
            FE.inlineError('#mainContent', String(error?.message || 'Erro ao salvar'));
        } finally {
            FE.setBtnLoading(saveBtn, false);
            FE.setBtnLoading(headerSaveBtn, false);
        }
    }

    async function handleDeletePlan() {
        if (!editMode || !currentPlan) { FE.error('Nenhum plano selecionado para excluir.'); return; }
        if (!confirm(`Tem certeza que deseja excluir o plano "${currentPlan.name||''}"? Esta ação não pode ser desfeita.`)) return;
        const delBtn = document.getElementById('deletePlanBtn');
        FE.setBtnLoading(delBtn, true);
        try {
            const endpoint = `/api/billing-plans/${encodeURIComponent(currentPlan.id)}`;
            if (PlansAPI?.saveWithFeedback) {
                await PlansAPI.saveWithFeedback(endpoint, null, {
                    method: 'DELETE',
                    onSuccess: () => {
                        FE.success('Plano excluído com sucesso!');
                        setTimeout(()=>{ try { window.router?.navigateTo?.('plans'); } catch(_) {} location.hash = 'plans'; try { window.loadAndShowPlans?.(); } catch(_) {} }, 250);
                    },
                    onError: (err) => {
                        FE.error(String(err?.message || 'Erro ao excluir plano.'));
                        FE.inlineError('#mainContent', String(err?.message || 'Erro ao excluir plano.'));
                    }
                });
            } else {
                const resp = await fetch(endpoint, { method: 'DELETE' });
                if (!resp.ok) {
                    const msg = await (async()=>{try{const c=resp.headers.get('content-type')||'';return c.includes('json')? (await resp.json()).message : await resp.text();}catch{return '';}})();
                    throw new Error(msg || (resp.status===400 ? 'Plano vinculado a alunos. Remova vínculos antes de excluir.' : 'Erro ao excluir plano'));
                }
                FE.success('Plano excluído com sucesso!');
                setTimeout(()=>{ try { window.router?.navigateTo?.('plans'); } catch(_) {} location.hash = 'plans'; try { window.loadAndShowPlans?.(); } catch(_) {} }, 250);
            }
        } catch (error) {
            console.error('❌ Error deleting plan:', error);
            FE.error(String(error?.message || error || 'Erro ao excluir plano.'));
            FE.inlineError('#mainContent', String(error?.message || 'Erro ao excluir plano.'));
        } finally {
            FE.setBtnLoading(delBtn, false);
        }
    }

    // Export to global scope for auto-initialization
    window.initializePlanEditor = initializePlanEditor;
    
    // Ensure initialization is attempted even if loader misses DOMContentLoaded
    try { __bootPlanEditor(); } catch (_) {}
    setTimeout(() => { try { __bootPlanEditor(); } catch (_) {} }, 0);
    setTimeout(() => { try { __bootPlanEditor(); } catch (_) {} }, 300);

    console.log('📝 Plan Editor Module script loaded, initializePlanEditor available:', typeof window.initializePlanEditor);
})();
