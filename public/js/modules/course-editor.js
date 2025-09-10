(function() {
  'use strict';

  /**
   * Course Editor Module (Refactored)
   * Boas práticas aplicadas:
   * - Estado isolado e idempotente (reentrada segura via flag isInitialized)
   * - Seletores resilientes (.course-editor-simple-isolated | .course-editor-isolated)
   * - Adaptação de view model backend -> modelo interno (duracao, status/isActive)
   * - Normalização de null vs string vazia antes de enviar
   * - Validação mínima no cliente (nome, nível, duração)
   * - Prevenção de perda de dados (beforeunload + isDirty)
   * - Funções públicas explicitadas no window (initializeCourseEditorModule, saveCourseSimple, goBack)
   * - Reuso de list refresh (window.refreshCourses) após salvar
   * - Evita múltiplas instâncias de fetch paralelos para o mesmo ciclo
   *
   * Checklist TODO (próximos passos):
   * [ ] Substituir alert() por sistema de toast/unified notifications
   * [ ] Implementar botão "Salvar Rascunho" (persist localStorage + status draft)
   * [ ] Suporte a campos avançados (generalObjectives, specificObjectives, resources, evaluation) alinhados ao backend quando schema estiver pronto
   * [ ] Tratar erros de rede offline (navigator.onLine + retry)
   * [ ] Mapear enum público-alvo (target) se backend expuser
   * [ ] Integrar loadingState placeholder existente (unificar IDs: courseEditorLoading vs loadingState)
   * [ ] Adicionar máscara/limitação de tamanho de campos (ex: name max length)
   * [ ] Internacionalização futura (strings isoladas em objeto messages)
   * [ ] Converter duração para persistir como número (remover formatação "X semanas" no backend)
   * [ ] Centralizar adaptadores (adapter layer) reutilizável entre viewer e editor
   */

  console.log('📝 Course Editor Module - Starting...');

  // State
  let currentCourse = null;
  let isEditing = false;
  let isInitialized = false;
  let isDirty = false;
  let courseId = null;
  let loadedTechniques = []; // Store all loaded techniques
  let loadingTechniquesPromise = null; // Prevent duplicate concurrent loads

  // API helper (centralized client per Guidelines)
  let moduleAPI = null;
  function ensureModuleAPI() {
    if (!moduleAPI && typeof window.createModuleAPI === 'function') {
      moduleAPI = window.createModuleAPI('Course Editor');
    }
    return moduleAPI;
  }

  // Public init
  window.initializeCourseEditorModule = initializeCourseEditorModule;
  window.saveCourseSimple = saveCourseSimple;
  window.goBack = goBack;
  window.editWeekTechniques = editWeekTechniques;
  window.addTechniqueToCourse = addTechniqueToCourse;
  window.removeTechniqueFromCourse = removeTechniqueFromCourse;
  window.removeTechniqueFromWeek = removeTechniqueFromWeek;
  window.viewTechniqueDetails = viewTechniqueDetails;
  window.dragTechnique = dragTechnique;
  window.allowDrop = allowDrop;
  window.loadCourse = loadCourse;
  window.renderAvailableTechniques = renderAvailableTechniques;
  window.dragLeave = dragLeave;
  window.dropTechnique = dropTechnique;

  async function initializeCourseEditorModule() {
    if (isInitialized) { console.log('ℹ️ Course editor already initialized.'); return; }
    const container = document.querySelector('.course-editor-simple-isolated, .course-editor-isolated');
    if (!container) { console.log('ℹ️ Course editor container not found.'); return; }
    isInitialized = true;

    // Initialize tab system
    initializeTabs();
    
    // Initialize specific tab functionalities
    initializeScheduleTab();
    initializeTechniquesTab();
    initializeRAGTab();

    // Resolve course id (query or global)
    const urlParams = new URLSearchParams(window.location.search);
    courseId = urlParams.get('id') || window.currentCourseId || null;
    isEditing = !!courseId;

    try {
      ensureModuleAPI();
      if (isEditing) { await loadCourse(courseId); updateUIForEdit(); } else { initNewCourseDefaults(); }
      attachListeners();
      await loadLessonPlansSummary();
      const saveBtn = document.getElementById('saveCourseBtn');
      if (saveBtn) { saveBtn.onclick = null; saveBtn.addEventListener('click', e => { e.preventDefault(); saveCourseSimple(); }); }
      const backBtn = document.getElementById('goBackBtn');
      if (backBtn) { backBtn.onclick = null; backBtn.addEventListener('click', e => { e.preventDefault(); goBack(); }); }

      // Wire: Generate lesson plans from syllabus
      const genBtn = document.getElementById('lpGenerateBtn');
      const genText = document.getElementById('lpSyllabusText');
      const genReplace = document.getElementById('lpReplace');
      const genDryRun = document.getElementById('lpDryRun');
      const genResult = document.getElementById('lpGenerateResult');
      if (genBtn && genText) {
        genBtn.addEventListener('click', async () => {
          try {
            if (!courseId && currentCourse?.id) courseId = currentCourse.id;
            if (!courseId) { alert('Salve o curso primeiro para gerar planos.'); return; }
            let syllabus;
            try { syllabus = JSON.parse(genText.value || '[]'); } catch { alert('JSON inválido no cronograma.'); return; }
            if (!Array.isArray(syllabus) || syllabus.length === 0) { alert('Cole um array JSON com itens do cronograma.'); return; }
            genBtn.disabled = true; const original = genBtn.textContent; genBtn.textContent = 'Gerando...';
            ensureModuleAPI();
            const result = await moduleAPI.api.post(`/api/courses/${courseId}/generate-lesson-plans`, { syllabus, replace: !!genReplace?.checked, dryRun: !!genDryRun?.checked });
            const data = (result && result.success) ? result : { success: true, summary: result?.summary };
            if (!data.success) throw new Error(data.error || data.message || 'Falha ao gerar');
            genResult.textContent = `Resultado: ${data.summary?.dryRun ? 'Simulação' : 'Criado'} ${data.summary?.created || 0} planos` + (data.summary?.replaced ? `, removidos ${data.summary.replaced}` : '');
            if (!data.summary?.dryRun) { await loadLessonPlansSummary(); }
          } catch (e) {
            window.app?.handleError?.(e, 'Gerar Planos');
            alert('Erro ao gerar planos: ' + (e.message || e));
          } finally {
            genBtn.disabled = false; genBtn.textContent = '🚀 Gerar Planos';
          }
        });
      }

      console.log('✅ Course editor initialized.');
    } catch (e) { console.error('❌ Initialization failed', e); alert('Erro ao inicializar editor de curso.'); }
  }

  function initNewCourseDefaults() {
    currentCourse = { name: '', description: '', level: 'BEGINNER', duration: 4, isActive: true };
    populateFormFromState();
  }

  async function loadCourse(id) {
    showLoading();
    try {
      ensureModuleAPI();
      const result = await moduleAPI.api.get(`/api/courses/${id}`);
      const json = result;
      if (!json.success) throw new Error(json.error || 'Falha ao carregar curso');
      
      currentCourse = adaptBackendCourse(json.data);
      populateFormFromState();
      
      // Load course techniques if available
      if (json.data.techniques && Array.isArray(json.data.techniques)) {
        console.log('📚 Loading course techniques:', json.data.techniques.length);
        loadedTechniques = json.data.techniques;
        
        // Populate scheduleTechniquesMap with week assignments
        scheduleTechniquesMap.clear();
        json.data.techniques.forEach(technique => {
          if (technique.weekNumber) {
            addTechniqueToWeekData(technique.weekNumber.toString(), technique.id);
          }
        });
        
        // Update techniques tab if it's initialized
        if (document.getElementById('availableTechniques')) {
          renderAvailableTechniques(loadedTechniques);
        }
        
        // Populate selected techniques container  
        const selectedContainer = document.getElementById('selectedTechniques');
        if (selectedContainer) {
          // Clear container first
          selectedContainer.innerHTML = '';
          
          // Add each technique with proper structure for getSelectedTechniques()
          json.data.techniques.forEach((technique, index) => {
            const techniqueHTML = `
              <div class="technique-item" data-technique-id="${technique.id}" draggable="true">
                <span class="technique-order">${index + 1}</span>
                <span class="technique-name">${technique.name || technique.title || 'Técnica sem nome'}</span>
                <span class="technique-category">${technique.category || 'Não definida'}</span>
                <span class="technique-week">${technique.weekNumber ? `Semana ${technique.weekNumber}` : 'Não definida'}</span>
                <button type="button" class="btn btn-remove" onclick="removeTechniqueFromCourse('${technique.id}')">❌</button>
              </div>
            `;
            selectedContainer.insertAdjacentHTML('beforeend', techniqueHTML);
          });
          
          console.log('✅ Selected techniques populated:', json.data.techniques.length);
        }
        
        updateTechniquesStats();
        
        // Also load available techniques for the techniques tab
        loadAvailableTechniques();
      }
      
      // Load course schedule if available
      if (json.data.schedule) {
        console.log('📅 Loading course schedule:', json.data.schedule);
        
        // Update schedule inputs
        const totalWeeksInput = document.getElementById('totalWeeks');
        const lessonsPerWeekInput = document.getElementById('lessonsPerWeek');
        
        if (totalWeeksInput && json.data.schedule.weeks) {
          totalWeeksInput.value = json.data.schedule.weeks;
        }
        
        if (lessonsPerWeekInput && json.data.schedule.lessonsPerWeek && json.data.schedule.lessonsPerWeek.length > 0) {
          lessonsPerWeekInput.value = json.data.schedule.lessonsPerWeek[0].lessons || 2;
        }
        
        // Render the schedule with real techniques from database
        await processScheduleFromCourseData(json.data.schedule);
      } else {
        console.log('⚠️ No schedule data found for course');
        
        // Set default values and generate default schedule
        const totalWeeksInput = document.getElementById('totalWeeks');
        const lessonsPerWeekInput = document.getElementById('lessonsPerWeek');
        
        if (totalWeeksInput && currentCourse.duration) {
          totalWeeksInput.value = currentCourse.duration;
        }
        if (lessonsPerWeekInput) {
          lessonsPerWeekInput.value = 2;
        }
        
        // Generate default schedule after a brief delay
        setTimeout(() => {
          generateScheduleAutomatically();
        }, 500);
      }
      
      console.log('✅ Course loaded with techniques and schedule', currentCourse);
  } finally {
      hideLoading();
    }
  }

  // Map backend view model to internal model
  function adaptBackendCourse(api) {
    // backend duration arrives as string "X semanas"; extract number
    let durationWeeks = api.duration;
    if (typeof durationWeeks === 'string') {
      const m = durationWeeks.match(/\d+/);
      durationWeeks = m ? parseInt(m[0], 10) : 4;
    }
    return {
      id: api.id,
      name: api.name || '',
      description: api.description || '',
      level: api.level || 'BEGINNER',
      duration: durationWeeks || 4,
      isActive: api.isActive === true || api.status === 'active',
      targetAudience: api.targetAudience || '',
      methodology: api.methodology || api.teachingStyle || '',
      objectives: api.objectives || [],
      generalObjectives: api.generalObjectives || [],
      specificObjectives: api.specificObjectives || [],
      resources: api.resources || [],
      equipment: api.equipment || [],
      preparation: api.preparation || [],
      gamification: api.gamification || [],
      evaluationCriteria: api.evaluationCriteria || [],
      evaluation: api.evaluation || {}
    };
  }

  // Enhanced populateFormFromState to load ALL complex course structure
  function populateFormFromState() {
    // Basic fields
    setVal('courseName', currentCourse.name);
    setVal('courseDescription', currentCourse.description);
    setVal('courseLevel', currentCourse.level);
    setVal('courseDuration', currentCourse.duration);
    setVal('courseTarget', currentCourse.targetAudience);
    setVal('courseMethodology', currentCourse.methodology);
    
    // Use uppercase to match HTML <option> values
    setVal('courseStatus', currentCourse.isActive ? 'ACTIVE' : 'INACTIVE');

    // Load objectives
    populateObjectives();
    
    // Load resources
    populateResources();
    
    // Load evaluation criteria and methods
    populateEvaluation();
    
    console.log('✅ Form populated with complete course structure');
  }

  // Populate objectives (general and specific)
  function populateObjectives() {
    // Clear existing objectives
    const generalContainer = document.getElementById('generalObjectives');
    const specificContainer = document.getElementById('specificObjectives');
    
    if (generalContainer) {
      generalContainer.innerHTML = '';
      
      // Load general objectives
      const generalObjectives = currentCourse.generalObjectives || [];
      if (generalObjectives.length === 0) {
        // Add empty field if no objectives
        addObjectiveItem('general', '');
      } else {
        generalObjectives.forEach(objective => {
          addObjectiveItem('general', objective);
        });
      }
    }
    
    if (specificContainer) {
      specificContainer.innerHTML = '';
      
      // Load specific objectives  
      const specificObjectives = currentCourse.specificObjectives || [];
      if (specificObjectives.length === 0) {
        // Add empty field if no objectives
        addObjectiveItem('specific', '');
      } else {
        specificObjectives.forEach(objective => {
          addObjectiveItem('specific', objective);
        });
      }
    }
    
    // Also load from legacy objectives array
    if (currentCourse.objectives && Array.isArray(currentCourse.objectives)) {
      currentCourse.objectives.forEach((objective, index) => {
        if (index < 3) {
          addObjectiveItem('general', objective);
        } else {
          addObjectiveItem('specific', objective);
        }
      });
    }
  }

  // Populate resources/equipment
  function populateResources() {
    const resourcesContainer = document.getElementById('resourcesList');
    if (!resourcesContainer) return;
    
    resourcesContainer.innerHTML = '';
    
    // Load resources
    const resources = currentCourse.resources || [];
    const equipment = currentCourse.equipment || [];
    const allResources = [...resources, ...equipment];
    
    if (allResources.length === 0) {
      // Add empty field if no resources
      addResourceItem('');
    } else {
      allResources.forEach(resource => {
        const resourceName = typeof resource === 'string' ? resource : resource.name || resource.item || '';
        addResourceItem(resourceName);
      });
    }
  }

  // Populate evaluation criteria and methods
  function populateEvaluation() {
    const criteriaContainer = document.getElementById('evaluationCriteria');
    const methodsContainer = document.getElementById('evaluationMethods');
    const requirementsField = document.getElementById('evaluationRequirements');
    
    // Load evaluation criteria
    if (criteriaContainer) {
      criteriaContainer.innerHTML = '';
      
      const criteria = currentCourse.evaluationCriteria || 
                      (currentCourse.evaluation && currentCourse.evaluation.criteria) || [];
      
      if (criteria.length === 0) {
        addEvalItemElement('criteria', '');
      } else {
        criteria.forEach(criterion => {
          addEvalItemElement('criteria', criterion);
        });
      }
    }
    
    // Load evaluation methods
    if (methodsContainer) {
      methodsContainer.innerHTML = '';
      
      const methods = (currentCourse.evaluation && currentCourse.evaluation.methods) || [];
      
      if (methods.length === 0) {
        addEvalItemElement('methods', '');
      } else {
        methods.forEach(method => {
          addEvalItemElement('methods', method);
        });
      }
    }
    
    // Load evaluation requirements
    if (requirementsField && currentCourse.evaluation && currentCourse.evaluation.requirements) {
      requirementsField.value = currentCourse.evaluation.requirements;
    }
  }

  function setVal(id, value) { const el = document.getElementById(id); if (el && value !== undefined && value !== null) el.value = value; }
  // Helper para obter valor de input/select/textarea com fallback string vazia
  function val(id) { const el = document.getElementById(id); return (el && el.value !== undefined) ? el.value : ''; }
  // Coleta textos de uma lista dinâmica (textareas/inputs)
  function collectListText(selector) {
    const nodes = document.querySelectorAll(selector);
    return Array.from(nodes).map(n => (n.value || '').trim()).filter(v => v.length > 0);
  }
  function collectFormData() {
    const name = val('courseName').trim();
    const description = val('courseDescription').trim();
    const level = val('courseLevel');
    const duration = parseInt(val('courseDuration'), 10) || 1;
    const statusRaw = val('courseStatus');
    const status = statusRaw.toUpperCase();
    const isActive = status === 'ACTIVE';
    const targetAudienceRaw = val('courseTarget');
    const methodology = val('courseMethodology').trim();
    // Extended fields (present in advanced editor HTML)
    const generalObjectives = collectListText('#generalObjectives textarea');
    const specificObjectives = collectListText('#specificObjectives textarea');
    const resources = collectListText('#resourcesList input');
    const evalCriteria = collectListText('#evaluationCriteria input');
    const evalMethods = collectListText('#evaluationMethods input');
    const evalRequirementsEl = document.getElementById('evaluationRequirements');
    const evaluationRequirements = evalRequirementsEl ? evalRequirementsEl.value.trim() : undefined;

    return {
      name,
      description: description || null,
      level,
      duration,
      isActive,
      targetAudience: targetAudienceRaw || null,
      methodology: methodology || null,
      generalObjectives,
      specificObjectives,
      resources,
      evaluation: {
        criteria: evalCriteria,
        methods: evalMethods,
        requirements: evaluationRequirements || null
      }
    };
  }

  function mapTarget(aud) {
    if (!aud) return 'ADULT';
    const map = { ADULTS: 'ADULT', TEENS: 'TEEN', KIDS: 'CHILD', SENIORS: 'SENIOR', ALL: 'GENERAL' };
    return map[aud] || aud || 'ADULT';
  }

  function validate(data) {
    const errors = [];
    if (!data.name || data.name.length < 3) errors.push('Nome é obrigatório (mín. 3)');
    if (!data.level) errors.push('Nível é obrigatório');
    if (!(data.duration > 0)) errors.push('Duração deve ser > 0');
    return errors;
  }

  async function saveCourseSimple() {
    try {
      const data = collectFormData();
      const errs = validate(data);
      if (errs.length) { alert('Erros:\n' + errs.join('\n')); return; }

      // Collect techniques data
      const selectedTechniques = [];
      const selectedContainer = document.getElementById('selectedTechniques');
      if (selectedContainer) {
        const techniqueCards = selectedContainer.querySelectorAll('.technique-card.selected');
        techniqueCards.forEach((card, index) => {
          const techniqueId = card.dataset.techniqueId;
          const technique = getTechniqueById(techniqueId);
          if (technique) {
            // Find week assignment
            let weekNumber = null;
            scheduleTechniquesMap.forEach((techniques, week) => {
              if (techniques.some(t => t.id == techniqueId)) {
                weekNumber = parseInt(week);
              }
            });
            
            selectedTechniques.push({
              id: techniqueId,
              name: technique.name,
              orderIndex: index + 1,
              weekNumber: weekNumber,
              lessonNumber: null,
              isRequired: true
            });
          }
        });
      }

      // Montar payload compatível com backend (working-server.js)
      const payload = {
        name: data.name,
        description: data.description,
        martialArt: 'Krav Maga',
        level: data.level,
        targetAudience: mapTarget(data.targetAudience),
        ageGroup: null,
        gender: null,
        duration: data.duration,
        totalLessons: data.duration ? data.duration * 2 : 48,
        lessonDuration: 60,
        objectives: [...data.generalObjectives, ...data.specificObjectives],
        evaluationCriteria: data.evaluation.criteria.length ? data.evaluation.criteria : (data.evaluation.requirements ? [data.evaluation.requirements] : []),
        teachingStyle: data.methodology,
        adaptations: null,
        createdBy: 'system',
        techniques: selectedTechniques // Include techniques
      };

      // Remover campos null/undefined (pode causar rejeição em validações estritas)
      Object.keys(payload).forEach(k => (payload[k] === null || payload[k] === undefined) && delete payload[k]);

      console.log('[course-editor] Payload preparado para envio', payload);
      console.log('[course-editor] Techniques to save:', selectedTechniques);

      showLoading();
      ensureModuleAPI();

      // Save course (without techniques) using API client
      let result;
      if (!isEditing) {
        result = await moduleAPI.api.post('/api/courses', payload);
        if (!result?.success) throw new Error(result?.error || 'Falha ao criar curso');
        courseId = result.data?.id || courseId;
      } else {
        const id = currentCourse?.id || courseId;
        result = await moduleAPI.api.put(`/api/courses/${id}`, payload);
        if (!result?.success) throw new Error(result?.error || 'Falha ao atualizar curso');
      }

      // If techniques are selected, call techniques association endpoint (replace)
      const finalCourseId = currentCourse?.id || courseId || result?.data?.id;
      if (finalCourseId && selectedTechniques.length > 0) {
        const techPayload = { replace: true, techniques: selectedTechniques };
        const assoc = await moduleAPI.api.post(`/api/courses/${finalCourseId}/techniques`, techPayload);
        if (!assoc?.success) throw new Error(assoc?.error || 'Falha ao associar técnicas');
      }

      alert(`Curso ${isEditing ? 'atualizado' : 'criado'} com sucesso`);
      isDirty = false;
      if (window.refreshCourses) window.refreshCourses();
      setTimeout(()=> { if (window.navigateToModule) navigateToModule('courses'); }, 600);
    } catch (e) {
      console.error('❌ Save failed', e);
      window.app?.handleError?.(e, 'Salvar Curso');
      alert('Erro ao salvar curso: ' + (e.message || e));
    } finally { hideLoading(); }
  }

  function updateUIForEdit() {
    const title = document.getElementById('titleText');
    const btn = document.getElementById('saveCourseBtn');
    if (title) title.textContent = 'Editar Curso';
    if (btn) btn.innerHTML = '💾 Salvar Alterações';
  }

  function attachListeners() {
    const content = document.getElementById('courseEditorContent');
    if (content) {
      content.addEventListener('input', ()=> isDirty = true, { capture: true });
      content.addEventListener('change', ()=> isDirty = true, { capture: true });
    }
    window.addEventListener('beforeunload', e => { if (isDirty) { e.preventDefault(); e.returnValue=''; }});
    
    // Enter key on form triggers save
    const name = document.getElementById('courseName');
    if (name && name.form) {
      name.form.addEventListener('submit', (e)=> { e.preventDefault(); saveCourseSimple(); });
    }

    // Enhanced event listeners for dynamic content
    setupDynamicEventListeners();
  }

  // Setup event listeners for add/remove buttons
  function setupDynamicEventListeners() {
    const content = document.getElementById('editorContent') || document.getElementById('courseEditorContent');
    if (!content) return;

    // Use event delegation for dynamic buttons
    content.addEventListener('click', (e) => {
      const button = e.target.closest('button[data-action]');
      if (!button) return;

      const action = button.dataset.action;
      const args = button.dataset.args ? JSON.parse(button.dataset.args) : [];

      switch (action) {
        case 'addObjective':
          e.preventDefault();
          addObjectiveItem(args[0] || 'general');
          break;
        case 'removeObjective':
          e.preventDefault();
          removeObjectiveItem(button, args[1] || 'general');
          break;
        case 'addResource':
          e.preventDefault();
          addResourceItem();
          break;
        case 'removeResource':
          e.preventDefault();
          removeResourceItem(button);
          break;
        case 'addEvalItem':
          e.preventDefault();
          addEvalItemElement(args[0] || 'criteria');
          break;
        case 'removeEvalItem':
          e.preventDefault();
          removeEvalItemElement(button, args[1] || 'criteria');
          break;
      }
    });

    console.log('✅ Dynamic event listeners setup completed');
  }

  // Enhance loading helpers to support legacy IDs (loadingState/editorContent)
  function showLoading() {
    const l1 = document.getElementById('courseEditorLoading');
    const l2 = document.getElementById('loadingState');
    const c1 = document.getElementById('courseEditorContent');
    const c2 = document.getElementById('editorContent');
    if (l1) l1.style.display = 'flex'; else if (l2) l2.style.display = 'flex';
    [c1, c2].forEach(c => { if (c) c.style.opacity = '0.4'; });
  }
  function hideLoading() {
    const l1 = document.getElementById('courseEditorLoading');
    const l2 = document.getElementById('loadingState');
    const c1 = document.getElementById('courseEditorContent');
    const c2 = document.getElementById('editorContent');
    if (l1) l1.style.display = 'none';
    if (l2) l2.style.display = 'none';
    [c1, c2].forEach(c => { if (c) c.style.opacity = '1'; });
  }

  function goBack() {
    if (isDirty && !confirm('Você tem alterações não salvas. Sair mesmo assim?')) return;
    if (window.navigateToModule) navigateToModule('courses'); else window.history.back();
  }

  // Compatibility wrappers & legacy dynamic list helpers
  function addObjectiveItem(type, value = '') {
    const containerId = type === 'general' ? 'generalObjectives' : 'specificObjectives';
    const container = document.getElementById(containerId);
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'objective-item';
    div.innerHTML = `<textarea placeholder="Descreva um objetivo ${type === 'general' ? 'geral' : 'específico'} do curso...">${value}</textarea><button type="button" class="remove-btn" data-action="removeObjective" data-args='["this","${type}"]'>🗑️</button>`;
    container.appendChild(div);
    isDirty = true;
  }

  function removeObjectiveItem(button, type) {
    const item = button.closest('.objective-item');
    if (item) {
      item.remove();
      isDirty = true;
    }
  }

  function addResourceItem(value = '') {
    const container = document.getElementById('resourcesList');
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'resource-item';
    div.innerHTML = `<input type="text" placeholder="Ex: Tatame, Luvas de boxe, Escudos..." value="${value}"><button type="button" class="remove-btn" data-action="removeResource" data-args='["this"]'>🗑️</button>`;
    container.appendChild(div);
    isDirty = true;
  }

  function removeResourceItem(button) {
    const item = button.closest('.resource-item');
    if (item) {
      item.remove();
      isDirty = true;
    }
  }

  function addEvalItemElement(type, value = '') {
    const containerId = type === 'criteria' ? 'evaluationCriteria' : 'evaluationMethods';
    const placeholder = type === 'criteria' ? 'Ex: Execução correta das técnicas' : 'Ex: Avaliação prática individual';
    const container = document.getElementById(containerId);
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'eval-item';
    div.innerHTML = `<input type="text" placeholder="${placeholder}" value="${value}"><button type="button" class="remove-btn" data-action="removeEvalItem" data-args='["this","${type}"]'>🗑️</button>`;
    container.appendChild(div);
    isDirty = true;
  }

  function removeEvalItemElement(button, type) {
    const item = button.closest('.eval-item');
    if (item) {
      item.remove();
      isDirty = true;
    }
  }

  // CSP delegate helpers used when templates embed data-action attributes
  if (typeof window !== 'undefined') {
    window.removeObjectiveDelegate = function(type) { if (typeof removeObjective === 'function') return removeObjective(this, type); };
    window.removeResourceDelegate = function() { if (typeof removeResource === 'function') return removeResource(this); };
    window.removeEvalItemDelegate = function(type) { if (typeof removeEvalItem === 'function') return removeEvalItem(this, type); };
  }

  // Expose legacy expected functions (reapplied at end for robustness)
  function exposeLegacyCourseEditorFunctions() {
    window.saveCourse = function() { console.log('[course-editor] saveCourse called'); saveCourseSimple(); };
    window.addObjective = function(type) { addObjectiveItem(type); isDirty = true; };
    window.removeObjective = function(btn, type) {
      const container = document.getElementById(type === 'general' ? 'generalObjectives' : 'specificObjectives');
      if (btn && container && container.children.length > 1) { btn.closest('.objective-item')?.remove(); isDirty = true; }
    };
    window.addResource = function() { addResourceItem(); isDirty = true; };
    window.removeResource = function(btn) { const container = document.getElementById('resourcesList'); if (btn && container && container.children.length > 1) { btn.closest('.resource-item')?.remove(); isDirty = true; } };
    window.addEvalItem = function(type) { addEvalItemElement(type); isDirty = true; };
    window.removeEvalItem = function(btn, type) {
      const container = document.getElementById(type === 'criteria' ? 'evaluationCriteria' : 'evaluationMethods');
      if (btn && container && container.children.length > 1) { btn.closest('.eval-item')?.remove(); isDirty = true; }
    };
    console.log('[course-editor] Funções legacy expostas no window (draft removido)');
  }
  exposeLegacyCourseEditorFunctions();

  // Attempt to load draft for new course
  function tryLoadDraft() {
    // Draft loading disabled per request
    return;
  }

  async function loadLessonPlansSummary(){
    try {
      const lpList = document.getElementById('lpSummaryList');
      const empty = document.getElementById('lpSummaryEmpty');
      const targetSel = document.getElementById('lpImportTarget');
      if (!lpList || !empty || !targetSel) return;
      if (!courseId && currentCourse?.id) courseId = currentCourse.id;
      if (!courseId) { empty.style.display='block'; return; }
  ensureModuleAPI();
  const json = await moduleAPI.api.get(`/api/courses/${courseId}/lesson-plans`);
      const plans = json?.data || [];
      lpList.innerHTML = '';
      targetSel.innerHTML = '';
      if (!plans.length) { empty.style.display='block'; return; } else { empty.style.display='none'; }

      for (const p of plans) {
        const li = document.createElement('li');
        li.className = 'resource-item';
        li.innerHTML = `<span>${p.name || 'Plano'}</span><span class="meta">Atividades: ${p.itemsCount ?? '-'}</span>`;
        lpList.appendChild(li);
        const opt = document.createElement('option');
        opt.value = p.id; opt.textContent = p.name || p.id; targetSel.appendChild(opt);
      }

      const btn = document.getElementById('lpImportBtn');
      const file = document.getElementById('lpImportFile');
    btn?.addEventListener('click', async ()=>{
        try {
          if (!file?.files?.length) return alert('Selecione um arquivo JSON');
          const targetId = targetSel.value; if (!targetId) return alert('Selecione um plano de aula');
          const text = await file.files[0].text();
          const data = JSON.parse(text);
          if (!Array.isArray(data.items)) return alert('JSON inválido: campo items ausente');
          // Normalize payload
          const items = data.items.map((it, idx)=>({
            activityId: it.activityId || it.activity?.id,
            segment: (it.segment || 'TECHNIQUE').toUpperCase(),
            ord: it.ord || idx+1
          })).filter(x=>x.activityId);
          if (!items.length) return alert('Nenhum item válido para importar');
      ensureModuleAPI();
      const j = await moduleAPI.api.post(`/api/lesson-plans/${targetId}/activities`, { items });
      if (!j?.success) throw new Error(j?.message || 'Falha ao importar');
          alert('Itens importados com sucesso');
          file.value = '';
        } catch(e){ alert('Erro na importação: ' + (e.message || e)); }
      });
    } catch(e){ console.warn('Lesson plans summary load error', e); }
  }

  // Re-expose legacy functions at the very end (robustness for SPA reloads)
  exposeLegacyCourseEditorFunctions();

  // Tab system functions
  function initializeTabs() {
    console.log('🔧 Initializing tab system...');
    
    // Tab click handlers
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tabName = e.target.dataset.tab;
        switchTab(tabName);
      });
    });
    
    // Set default active tab
    switchTab('info');
  }
  
  function switchTab(tabName) {
    console.log(`📑 Switching to tab: ${tabName}`);
    
    // Remove active class from all tabs and content
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
      content.style.display = 'none';
    });
    
    // Add active class to current tab and content
    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    const activeContent = document.getElementById(`tabContent${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
    
    if (activeBtn) activeBtn.classList.add('active');
    if (activeContent) {
      activeContent.classList.add('active');
      activeContent.style.display = 'block';
    }
    
    // Trigger tab-specific initialization if needed
    switch(tabName) {
      case 'schedule':
        updateScheduleOverview();
        // Generate automatic schedule when tab is activated
        setTimeout(() => {
          generateScheduleAutomatically();
        }, 100);
        break;
      case 'techniques':
        // Only load available techniques if not already loaded
        const availableTechniques = document.getElementById('availableTechniques');
        if (!availableTechniques || availableTechniques.innerHTML.includes('loading-state') || availableTechniques.innerHTML.trim() === '') {
          loadAvailableTechniques();
        }
        updateTechniquesStats();
        break;
      case 'rag-generation':
        updateRAGOverview();
        break;
    }
  }

  function initializeScheduleTab() {
    console.log('📅 Initializing schedule tab...');

    // Schedule tools event listeners
    const generateScheduleBtn = document.getElementById('generateScheduleBtn');
    const importScheduleBtn = document.getElementById('importScheduleBtn');
    const exportScheduleBtn = document.getElementById('exportScheduleBtn');
    const processScheduleJsonBtn = document.getElementById('processScheduleJsonBtn');
    const cancelScheduleImportBtn = document.getElementById('cancelScheduleImportBtn');
    
    // Schedule control inputs
    const totalWeeksInput = document.getElementById('totalWeeks');
    const lessonsPerWeekInput = document.getElementById('lessonsPerWeek');

    // Set default values if inputs are empty
    if (totalWeeksInput && !totalWeeksInput.value) {
      totalWeeksInput.value = '18';
    }
    if (lessonsPerWeekInput && !lessonsPerWeekInput.value) {
      lessonsPerWeekInput.value = '2';
    }

    // Initial stats update
    updateScheduleStats();

    if (generateScheduleBtn) {
      generateScheduleBtn.addEventListener('click', generateScheduleAutomatically);
    }

    if (totalWeeksInput) {
      totalWeeksInput.addEventListener('change', () => {
        updateScheduleStats();
        isDirty = true;
      });
      totalWeeksInput.addEventListener('input', () => {
        updateScheduleStats();
      });
    }

    if (lessonsPerWeekInput) {
      lessonsPerWeekInput.addEventListener('change', () => {
        updateScheduleStats();
        isDirty = true;
      });
      lessonsPerWeekInput.addEventListener('input', () => {
        updateScheduleStats();
      });
    }

    if (importScheduleBtn) {
      importScheduleBtn.addEventListener('click', () => {
        document.querySelector('.schedule-json-import').style.display = 'block';
      });
    }

    if (exportScheduleBtn) {
      exportScheduleBtn.addEventListener('click', exportScheduleToJSON);
    }

    if (processScheduleJsonBtn) {
      processScheduleJsonBtn.addEventListener('click', processScheduleJSON);
    }

    if (cancelScheduleImportBtn) {
      cancelScheduleImportBtn.addEventListener('click', () => {
        document.querySelector('.schedule-json-import').style.display = 'none';
        document.getElementById('scheduleJsonInput').value = '';
      });
    }

    console.log('✅ Schedule tab initialized with default values');
    
    // Load techniques first, then initialize integrations
    loadAvailableTechniques();
    
    // Initialize schedule-techniques integration
    initializeScheduleTechniquesIntegration();

    // Generate automatic schedule on initialization if needed
    setTimeout(() => {
      const scheduleGrid = document.getElementById('scheduleGrid');
      if (scheduleGrid) {
        console.log('🚀 Auto-generating schedule with techniques...');
        
        // Ensure loadedTechniques is available before generating
        if (loadedTechniques.length === 0) {
          console.log('� Loading techniques synchronously...');
          loadAvailableTechniques();
        }
        
        // Clear and regenerate
        scheduleGrid.innerHTML = '';
        scheduleTechniquesMap.clear();
        
        // Force generate with a short delay to ensure techniques are loaded
        setTimeout(() => {
          console.log('🎯 Techniques available:', loadedTechniques.length);
          generateScheduleAutomatically();
        }, 500);
      }
    }, 2000); // Increased delay to ensure techniques are loaded
  }

  function initializeScheduleTechniquesIntegration() {
    const weekSelect = document.getElementById('scheduleWeekSelect');
    if (weekSelect) {
      weekSelect.addEventListener('change', loadTechniquesForWeek);
    }

    // Load available techniques for week assignment
    loadAvailableTechniquesForWeek();
  }

  function loadTechniquesForWeek() {
    const weekSelect = document.getElementById('scheduleWeekSelect');
    const weekTechniques = document.getElementById('weekTechniques');
    const selectedWeek = weekSelect.value;

    if (!selectedWeek) {
      weekTechniques.innerHTML = '<div class="empty-state">Selecione uma semana para ver as técnicas</div>';
      return;
    }

    // Get techniques assigned to this week
    const assignedTechniques = getTechniquesForWeek(selectedWeek);

    if (assignedTechniques.length === 0) {
      weekTechniques.innerHTML = `
        <div class="empty-state">
          <p>Nenhuma técnica associada a esta semana</p>
          <p>Arraste técnicas da lista abaixo para esta semana</p>
        </div>
      `;
    } else {
      let html = `<div class="week-techniques-header">
        <h4>Técnicas da Semana ${selectedWeek}</h4>
        <span class="technique-count">${assignedTechniques.length} técnica(s)</span>
      </div>`;
      html += '<div class="week-techniques-items">';
      assignedTechniques.forEach((technique, index) => {
        const position = technique.position || (index + 1);
        const category = technique.category || 'Categoria não definida';
        const difficulty = technique.difficulty || 'Dificuldade não definida';
        const time = technique.time || 'Tempo não definido';
        
        html += `
          <div class="week-technique-item" data-technique-id="${technique.id}">
            <div class="technique-info">
              <span class="technique-position">#${position}</span>
              <span class="technique-name">${technique.name || technique.title || 'Técnica sem nome'}</span>
              <div class="technique-details">
                <span class="technique-category">${category}</span>
                <span class="technique-difficulty">${difficulty}</span>
                <span class="technique-time">${time}</span>
              </div>
            </div>
            <button type="button" class="btn btn-remove" onclick="removeTechniqueFromWeek('${selectedWeek}', '${technique.id}')" title="Remover da semana">❌</button>
          </div>
        `;
      });
      html += '</div>';
      weekTechniques.innerHTML = html;
    }
  }

  function loadAvailableTechniquesForWeek() {
    const container = document.getElementById('availableTechniquesForWeek');
    if (!container) return;

    // Get all selected techniques that aren't assigned to any week yet
    const selectedTechniques = getSelectedTechniques();
    const assignedTechniques = getAllAssignedTechniques();

    const availableTechniques = selectedTechniques.filter(technique =>
      !assignedTechniques.some(assigned => assigned.id === technique.id)
    );

    if (availableTechniques.length === 0) {
      container.innerHTML = '<div class="empty-state">Todas as técnicas já estão associadas ao cronograma</div>';
    } else {
      let html = '<div class="available-techniques-grid">';
      availableTechniques.forEach(technique => {
        html += `
          <div class="available-technique-item" data-technique-id="${technique.id}">
            <span class="technique-name">${technique.name}</span>
            <button type="button" class="btn btn-add" onclick="addTechniqueToWeek('${technique.id}')">+</button>
          </div>
        `;
      });
      html += '</div>';
      container.innerHTML = html;
    }
  }

  function addTechniqueToWeek(techniqueId) {
    const weekSelect = document.getElementById('scheduleWeekSelect');
    const selectedWeek = weekSelect.value;

    if (!selectedWeek) {
      alert('Selecione uma semana primeiro');
      return;
    }

    // Add technique to week
    addTechniqueToWeekData(selectedWeek, techniqueId);

    // Refresh displays
    loadTechniquesForWeek();
    loadAvailableTechniquesForWeek();
  }

  function removeTechniqueFromWeek(week, techniqueId) {
    // Remove technique from week
    removeTechniqueFromWeekData(week, techniqueId);

    // Refresh displays
    loadTechniquesForWeek();
    loadAvailableTechniquesForWeek();
  }

  function initializeTechniquesTab() {
    console.log('🥋 Initializing techniques tab...');

    // Techniques tools event listeners
    const techniqueSearch = document.getElementById('techniqueSearch');
    const techniqueFilter = document.getElementById('techniqueFilter');
    const addTechniqueBtn = document.getElementById('addTechniqueBtn');
    const difficultyFilter = document.getElementById('difficultyFilter');
    const timeFilter = document.getElementById('timeFilter');
    const sortTechniques = document.getElementById('sortTechniques');
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    const autoOrderBtn = document.getElementById('autoOrderBtn');
    const exportTechniqueOrderBtn = document.getElementById('exportTechniqueOrderBtn');
    const clearAllTechniquesBtn = document.getElementById('clearAllTechniquesBtn');

    if (techniqueSearch) {
      techniqueSearch.addEventListener('input', filterTechniques);
    }

    if (techniqueFilter) {
      techniqueFilter.addEventListener('change', filterTechniques);
    }

    if (difficultyFilter) {
      difficultyFilter.addEventListener('change', filterTechniques);
    }

    if (timeFilter) {
      timeFilter.addEventListener('change', filterTechniques);
    }

    if (sortTechniques) {
      sortTechniques.addEventListener('change', sortTechniquesList);
    }

    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', clearAllFilters);
    }

    if (addTechniqueBtn) {
      addTechniqueBtn.addEventListener('click', openAddTechniqueModal);
    }

    if (autoOrderBtn) {
      autoOrderBtn.addEventListener('click', autoOrderTechniques);
    }

    if (exportTechniqueOrderBtn) {
      exportTechniqueOrderBtn.addEventListener('click', exportTechniqueOrder);
    }

    if (clearAllTechniquesBtn) {
      clearAllTechniquesBtn.addEventListener('click', clearAllTechniques);
    }

    // Initialize drag and drop for technique ordering
    initializeDragAndDrop();
  }

  function initializeDragAndDrop() {
    const selectedTechniques = document.getElementById('selectedTechniques');
    if (!selectedTechniques) return;

    // Add drag and drop functionality
    selectedTechniques.addEventListener('dragstart', handleDragStart);
    selectedTechniques.addEventListener('dragover', handleDragOver);
    selectedTechniques.addEventListener('drop', handleDrop);
    selectedTechniques.addEventListener('dragend', handleDragEnd);
  }

  function handleDragStart(e) {
    if (e.target.classList.contains('technique-item')) {
      e.target.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', e.target.outerHTML);
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function handleDrop(e) {
    e.preventDefault();
    const draggingElement = document.querySelector('.dragging');
    if (draggingElement && e.target.classList.contains('technique-item')) {
      const allItems = Array.from(draggingElement.parentNode.children);
      const draggedIndex = allItems.indexOf(draggingElement);
      const targetIndex = allItems.indexOf(e.target);

      if (draggedIndex !== targetIndex) {
        // Reorder the techniques array
        reorderTechniques(draggedIndex, targetIndex);
        renderSelectedTechniques();
      }
    }
  }

  function handleDragEnd(e) {
    if (e.target.classList.contains('dragging')) {
      e.target.classList.remove('dragging');
    }
  }

  function initializeRAGTab() {
    console.log('🧠 Initializing RAG tab...');
    
    // RAG event listeners
    const generateRAGPlansBtn = document.getElementById('generateRAGPlansBtn');
    const previewRAGBtn = document.getElementById('previewRAGBtn');
    
    if (generateRAGPlansBtn) {
      generateRAGPlansBtn.addEventListener('click', generateRAGLessonPlans);
    }
    
    if (previewRAGBtn) {
      previewRAGBtn.addEventListener('click', previewRAGGeneration);
    }
  }

  // Schedule tab functions
  function updateScheduleOverview() {
    const totalWeeks = document.getElementById('totalWeeks')?.value || 18;
    const lessonsPerWeek = document.getElementById('lessonsPerWeek')?.value || 2;
    
    console.log(`📊 Schedule overview: ${totalWeeks} weeks, ${lessonsPerWeek} lessons/week`);
  }

  async function generateScheduleAutomatically() {
    console.log('⚡ Generating automatic schedule...');

    const totalWeeksInput = document.getElementById('totalWeeks');
    const lessonsPerWeekInput = document.getElementById('lessonsPerWeek');

    if (!totalWeeksInput || !lessonsPerWeekInput) {
      console.error('Schedule controls not found');
      alert('Erro: Controles de cronograma não encontrados. Verifique se a página carregou corretamente.');
      return;
    }

    const totalWeeks = parseInt(totalWeeksInput.value) || 18;
    const lessonsPerWeek = parseInt(lessonsPerWeekInput.value) || 2;

    if (totalWeeks <= 0 || lessonsPerWeek <= 0) {
      alert('Por favor, defina valores válidos para o número de semanas e aulas por semana.');
      return;
    }

    console.log(`📊 Creating schedule: ${totalWeeks} weeks, ${lessonsPerWeek} lessons/week`);

    // Ensure techniques are loaded before generating schedule
    if (loadedTechniques.length === 0) {
      console.log('📚 No techniques loaded, loading them first...');
      loadAvailableTechniques();
      
      // Wait for techniques to load with a more reliable method
      let attempts = 0;
      const checkTechniques = setInterval(() => {
        attempts++;
        if (loadedTechniques.length > 0) {
          clearInterval(checkTechniques);
          console.log(`✅ Techniques loaded after ${attempts} attempts:`, loadedTechniques.length);
          proceedWithGeneration();
        } else if (attempts > 20) { // Max 2 seconds
          clearInterval(checkTechniques);
          console.warn('⚠️ Timeout waiting for techniques, proceeding anyway');
          proceedWithGeneration();
        }
      }, 100);
      
      return; // Exit early, will continue in proceedWithGeneration
    } else {
      console.log('✅ Techniques already loaded:', loadedTechniques.length);
      proceedWithGeneration();
    }
    
    function proceedWithGeneration() {
      console.log('🚀 Proceeding with schedule generation...');

    // Generate more intelligent schedule based on course data
    const schedule = {
      weeks: totalWeeks,
      lessonsPerWeek: []
    };

    // Auto-assign techniques to lessons
    const totalLessons = totalWeeks * lessonsPerWeek;
    const autoAssignedTechniques = autoAssignTechniquesToLessons(totalLessons);

    console.log('🎯 Auto-assigned techniques result:', autoAssignedTechniques);
    console.log('🎯 Total techniques assigned:', Object.values(autoAssignedTechniques).flat().length);

    for (let week = 1; week <= totalWeeks; week++) {
      const weekFocus = generateWeekFocus(week, totalWeeks, {});
      
      schedule.lessonsPerWeek.push({
        week: week,
        lessons: lessonsPerWeek,
        focus: weekFocus
      });
    }

    console.log('📋 Schedule data:', schedule);
    
    // Store the auto-assigned techniques in scheduleTechniquesMap before rendering
    Object.keys(autoAssignedTechniques).forEach(lessonNum => {
      scheduleTechniquesMap.set(lessonNum, autoAssignedTechniques[lessonNum]);
      console.log(`📌 Stored techniques for lesson ${lessonNum}:`, autoAssignedTechniques[lessonNum]);
    });

    renderSchedule(schedule);
    updateScheduleStats();
    
    // Show success message
    const notification = document.createElement('div');
    notification.className = 'schedule-notification success';
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">✅</span>
        <span class="notification-text">Cronograma gerado com sucesso! ${totalWeeks * lessonsPerWeek} aulas criadas com ${Object.values(autoAssignedTechniques).flat().length} técnicas atribuídas.</span>
      </div>
    `;
    
    const scheduleContainer = document.querySelector('.schedule-content');
    if (scheduleContainer) {
      scheduleContainer.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
    }
    
    console.log('✅ Schedule generated and rendered automatically');
    } // End of proceedWithGeneration
  } // End of generateScheduleAutomatically

  function autoAssignTechniquesToLessons(totalLessons) {
    console.log(`🎯 Auto-assigning techniques to ${totalLessons} lessons...`);
    console.log(`📚 Available loadedTechniques:`, loadedTechniques.length, loadedTechniques);
    
    if (loadedTechniques.length === 0) {
      console.warn('⚠️ No techniques available for auto-assignment');
      return {};
    }

    const assignments = {};
    const techniquesPerLesson = Math.min(4, Math.max(2, Math.floor(loadedTechniques.length / totalLessons)));
    
    // Group techniques by difficulty/complexity
    const beginnerTechs = loadedTechniques.filter(t => 
      (t.complexity === 'EASY' || t.difficulty === 'Iniciante' || t.difficulty === 'beginner') ||
      (!t.complexity && !t.difficulty)
    );
    const intermediateTechs = loadedTechniques.filter(t => 
      t.complexity === 'MEDIUM' || t.difficulty === 'Intermediário' || t.difficulty === 'intermediate'
    );
    const advancedTechs = loadedTechniques.filter(t => 
      t.complexity === 'HARD' || t.difficulty === 'Avançado' || t.difficulty === 'advanced'
    );

    console.log(`📊 Techniques by level: Beginner=${beginnerTechs.length}, Intermediate=${intermediateTechs.length}, Advanced=${advancedTechs.length}`);

    let usedTechniques = new Set();
    
    for (let lesson = 1; lesson <= totalLessons; lesson++) {
      const lessonTechniques = [];
      const progressRatio = lesson / totalLessons;
      
      // Determine technique pool based on lesson progression
      let availableTechs = [];
      if (progressRatio < 0.4) {
        // First 40% - Focus on beginner techniques
        availableTechs = beginnerTechs.filter(t => !usedTechniques.has(t.id));
        if (availableTechs.length < techniquesPerLesson) {
          availableTechs = [...availableTechs, ...intermediateTechs.filter(t => !usedTechniques.has(t.id))];
        }
      } else if (progressRatio < 0.8) {
        // Middle 40% - Mix of beginner and intermediate
        availableTechs = [...intermediateTechs, ...beginnerTechs].filter(t => !usedTechniques.has(t.id));
      } else {
        // Final 20% - Advanced and review
        availableTechs = [...advancedTechs, ...intermediateTechs].filter(t => !usedTechniques.has(t.id));
      }
      
      // If no unused techniques available, reset and allow reuse
      if (availableTechs.length === 0) {
        console.log(`🔄 Resetting technique pool for lesson ${lesson}`);
        usedTechniques.clear();
        availableTechs = loadedTechniques;
      }
      
      // Select techniques for this lesson
      const selectedTechs = availableTechs
        .sort(() => Math.random() - 0.5) // Randomize
        .slice(0, techniquesPerLesson);
      
      selectedTechs.forEach(tech => {
        lessonTechniques.push({
          id: tech.id,
          title: tech.name || tech.title,
          type: 'TECHNIQUE',
          description: tech.description || '',
          complexity: tech.complexity || 'EASY'
        });
        usedTechniques.add(tech.id);
      });
      
      assignments[lesson.toString()] = lessonTechniques;
    }
    
    console.log(`✅ Auto-assignment complete: ${Object.keys(assignments).length} lessons with techniques`);
    return assignments;
  }

  function groupTechniquesByLevel(techniques) {
    const groups = {
      beginner: [],
      intermediate: [],
      advanced: []
    };

    techniques.forEach(tech => {
      const level = tech.dataset.level || 'beginner';
      if (groups[level]) {
        groups[level].push(tech.textContent.trim());
      }
    });

    return groups;
  }

  function generateWeekFocus(week, totalWeeks, techniqueGroups) {
    const progressRatio = week / totalWeeks;
    
    if (progressRatio < 0.3) {
      // First 30% - Beginner focus
      return [
        `Semana ${week} - Fundamentos Básicos`,
        `Foco: Técnicas iniciantes e posicionamento`
      ];
    } else if (progressRatio < 0.7) {
      // Middle 40% - Intermediate focus  
      return [
        `Semana ${week} - Desenvolvimento Técnico`,
        `Foco: Combinações e aplicação prática`
      ];
    } else {
      // Final 30% - Advanced focus
      return [
        `Semana ${week} - Aperfeiçoamento`,
        `Foco: Técnicas avançadas e simulações`
      ];
    }
  }

  function updateScheduleStats() {
    const totalWeeks = parseInt(document.getElementById('totalWeeks')?.value) || 0;
    const lessonsPerWeek = parseInt(document.getElementById('lessonsPerWeek')?.value) || 0;
    const totalLessons = totalWeeks * lessonsPerWeek;
    
    // Update total lessons count
    const totalLessonsElement = document.getElementById('totalLessonsCount');
    if (totalLessonsElement) {
      totalLessonsElement.textContent = totalLessons;
    }
    
    // Count assigned techniques
    let assignedTechniques = 0;
    scheduleTechniquesMap.forEach(techniques => {
      assignedTechniques += techniques.length;
    });
    
    const assignedTechniquesElement = document.getElementById('assignedTechniquesCount');
    if (assignedTechniquesElement) {
      assignedTechniquesElement.textContent = assignedTechniques;
    }
    
    console.log(`📊 Statistics: ${totalLessons} lessons, ${assignedTechniques} techniques assigned`);
  }

  async function renderSchedule(schedule) {
    console.log('🎨 Rendering schedule with lessons:', schedule);

    const scheduleGrid = document.getElementById('scheduleGrid');

    if (!scheduleGrid) {
      console.error('❌ scheduleGrid element not found!');
      return;
    }

    // Process schedule from course data (imported schedule)
    if (schedule && schedule.lessonsPerWeek) {
      await processScheduleFromCourseData(schedule);
      return;
    }

    let html = '<div class="schedule-list">';

    if (schedule && schedule.lessonsPerWeek) {
      console.log(`📋 Rendering ${schedule.lessonsPerWeek.length} weeks`);
      
      // Primeiro, vamos carregar as técnicas das aulas para poder mapear por semana
      let lessonNumber = 1;

      schedule.lessonsPerWeek.forEach(weekData => {
        const lessonsInWeek = weekData.lessons || 2;
        
        // Coletar todas as técnicas das aulas desta semana
        let weekTechniques = [];
        let weekTechniqueIds = new Set(); // Para evitar duplicatas
        
        for (let lessonInWeek = 1; lessonInWeek <= lessonsInWeek; lessonInWeek++) {
          const lessonTechniques = getTechniquesForWeek(lessonNumber.toString()) || [];
          console.log(`🔍 Semana ${weekData.week}, Aula ${lessonNumber}: ${lessonTechniques.length} técnicas`, lessonTechniques);
          lessonTechniques.forEach(technique => {
            if (!weekTechniqueIds.has(technique.id || technique)) {
              weekTechniqueIds.add(technique.id || technique);
              weekTechniques.push(technique);
            }
          });
          lessonNumber++;
        }
        
        console.log(`📊 Semana ${weekData.week} total: ${weekTechniques.length} técnicas únicas`);
        
        const techniqueCount = weekTechniques.length;
        const techniqueNames = weekTechniques.map(t => {
          if (typeof t === 'string') {
            // Se for ID, buscar o nome na lista de técnicas carregadas
            const foundTech = loadedTechniques.find(tech => tech.id === t);
            return foundTech ? (foundTech.name || foundTech.title || 'Técnica sem nome') : t;
          }
          return t.name || t.title || 'Técnica sem nome';
        }).join(', ');
        
        html += `
          <div class="schedule-item" data-week="${weekData.week}" onclick="editWeekTechniques(${weekData.week})" 
               ondrop="dropTechnique(event, ${weekData.week})" ondragover="allowDrop(event)" ondragleave="dragLeave(event)">
            <div class="schedule-header">
              <span class="schedule-week">Semana ${weekData.week}</span>
              <span class="schedule-lessons">${weekData.lessons} aulas</span>
              <span class="schedule-techniques">(${techniqueCount} técnicas)</span>
            </div>
            <div class="schedule-focus">${weekData.focus ? weekData.focus.join(', ') : 'Sem foco definido'}</div>
            ${techniqueNames ? `<div class="schedule-technique-list">${techniqueNames}</div>` : ''}
          </div>
        `;
      });
    } else {
      console.log('📋 No weeks data, showing empty state');
      html += '<div class="schedule-empty-state"><p>Cronograma vazio</p></div>';
    }

    html += '</div>';
    scheduleGrid.innerHTML = html;
    console.log('✅ Schedule HTML inserted into DOM');
  }

  // Process schedule from course data (imported schedule) - shows lessons instead of weeks
  async function processScheduleFromCourseData(schedule) {
    console.log('🔄 Processing course schedule data:', schedule);
    
    if (!schedule || !schedule.lessonsPerWeek) {
      console.log('⚠️ Invalid schedule data');
      return;
    }

    const scheduleGrid = document.getElementById('scheduleGrid');
    if (!scheduleGrid) return;

    // Load lesson techniques from database only if scheduleTechniquesMap is empty
    let lessonTechniques = {};
    if (scheduleTechniquesMap.size === 0) {
      console.log('📚 Loading techniques from database as fallback...');
      lessonTechniques = await loadLessonTechniques();
      console.log('📚 Loaded lesson techniques from database:', lessonTechniques);
    } else {
      console.log('🎯 Using pre-assigned techniques from scheduleTechniquesMap');
    }
    
    let lessonNumber = 1;
    let scheduleHTML = '<div class="schedule-list">';

    // Process each week to extract individual lessons
    schedule.lessonsPerWeek.forEach(weekData => {
      const lessonsInWeek = weekData.lessons || 2;
      
      // Create individual lessons for each week
      for (let lessonInWeek = 1; lessonInWeek <= lessonsInWeek; lessonInWeek++) {
        const lessonId = `lesson-${lessonNumber}`;
        
        // Get techniques for this lesson (either from scheduleTechniquesMap or database)
        let techniquesForThisLesson = [];
        
        if (scheduleTechniquesMap.has(lessonNumber.toString())) {
          // Use pre-assigned techniques
          techniquesForThisLesson = scheduleTechniquesMap.get(lessonNumber.toString());
          console.log(`🎯 Lesson ${lessonNumber}: Found ${techniquesForThisLesson.length} pre-assigned techniques`);
        } else if (lessonTechniques[lessonNumber]) {
          // Use techniques from database
          techniquesForThisLesson = lessonTechniques[lessonNumber];
          scheduleTechniquesMap.set(lessonNumber.toString(), techniquesForThisLesson);
          console.log(`📚 Lesson ${lessonNumber}: Loaded ${techniquesForThisLesson.length} techniques from database`);
        } else {
          console.log(`⚠️ Lesson ${lessonNumber}: No techniques found, using empty array`);
        }
        
        console.log(`📊 Lesson ${lessonNumber} final techniques:`, techniquesForThisLesson);
        
        scheduleHTML += `
          <div class="schedule-item" data-lesson="${lessonNumber}" 
               ondrop="dropTechniqueToLesson(event, ${lessonNumber})" 
               ondragover="allowDrop(event)"
               ondragleave="dragLeave(event)"
               onclick="selectLesson(${lessonNumber})">
            <div class="lesson-header">
              <div class="lesson-info">
                <span class="lesson-number">Aula ${lessonNumber}</span>
                <span class="lesson-week">Semana ${weekData.week}</span>
              </div>
              <div class="lesson-stats">
                <span class="technique-count">${techniquesForThisLesson.length} técnicas</span>
              </div>
            </div>
            <div class="lesson-content">
              <div class="lesson-objective">
                ${weekData.focus ? weekData.focus.find(item => typeof item === 'string')?.substring(0, 60) + '...' || 'Objetivos da aula' : 'Objetivos da aula'}
              </div>
              <div class="lesson-techniques">
                ${techniquesForThisLesson.map(tech => `
                  <span class="technique-tag" onclick="navigateToActivity('${tech.id}')" title="Click para ver detalhes">
                    ${tech.title || tech.name}
                  </span>
                `).join('')}
              </div>
            </div>
          </div>
        `;
        
        lessonNumber++;
      }
    });

    scheduleHTML += '</div>';
    scheduleGrid.innerHTML = scheduleHTML;
    
    console.log(`✅ Course schedule processed: ${lessonNumber - 1} lessons created with techniques`);
    updateScheduleStats();
  }

  // Load lesson techniques from database
  async function loadLessonTechniques() {
    if (!courseId) return {};
    
    try {
      console.log('🔍 Loading lesson techniques from database...');
    ensureModuleAPI();
    const data = await moduleAPI.api.get(`/api/courses/${courseId}/lesson-techniques`);
      if (!data.success) {
        console.warn('API returned error:', data.error);
        return {};
      }
      
      // Group techniques by lesson number and collect all unique techniques
      const lessonTechniques = {};
      const allTechniques = new Map(); // Use Map to avoid duplicates
      
      if (data.data && Array.isArray(data.data)) {
        data.data.forEach(lesson => {
          if (lesson.lessonNumber && lesson.techniques) {
            lessonTechniques[lesson.lessonNumber] = lesson.techniques;
            
            // Collect all techniques for global access
            lesson.techniques.forEach(tech => {
              if (!allTechniques.has(tech.id)) {
                allTechniques.set(tech.id, {
                  id: tech.id,
                  name: tech.title,
                  title: tech.title,
                  category: tech.type || 'TECHNIQUE',
                  difficulty: 'Iniciante',
                  time: 'Não definido',
                  description: tech.description || '',
                  type: tech.type,
                  segment: tech.segment
                });
              }
            });
          }
        });
      }
      
      // Update global loadedTechniques with real data from database
      loadedTechniques = Array.from(allTechniques.values());
      console.log('🎯 Updated global loadedTechniques:', loadedTechniques.length, 'techniques');
      
      console.log('✅ Lesson techniques loaded:', lessonTechniques);
      return lessonTechniques;
    } catch (error) {
      console.error('Error loading lesson techniques:', error);
      return {};
    }
  }

  // Distribute techniques among lessons in a week
  function distribuirTecnicasPorAula(weekTechniques, lessonInWeek, totalLessonsInWeek) {
    if (weekTechniques.length === 0) return [];
    
    const techniquesPerLesson = Math.ceil(weekTechniques.length / totalLessonsInWeek);
    const startIndex = (lessonInWeek - 1) * techniquesPerLesson;
    const endIndex = startIndex + techniquesPerLesson;
    
    return weekTechniques.slice(startIndex, endIndex);
  }

  // Navigate to activity module
  function navigateToActivity(techniqueId) {
    console.log(`🔗 Navigating to activity: ${techniqueId}`);
    console.log(`🔍 LoadedTechniques count: ${loadedTechniques.length}`);
    console.log(`🔍 LoadedTechniques IDs:`, loadedTechniques.map(t => t.id));
    
    // Find the corresponding activity
    const activity = loadedTechniques.find(t => t.id === techniqueId);
    if (!activity) {
      console.log('⚠️ Activity not found in loadedTechniques, trying navigation anyway');
    } else {
      console.log('✅ Activity found:', activity.name || activity.title);
    }
    
    // Navigate to specific activity editor
    if (window.router && typeof window.router.navigateTo === 'function') {
      console.log('📍 Navigating to activity editor for:', techniqueId);
      // Use the activity-editor route with the specific ID
      window.location.hash = `#activity-editor/${techniqueId}`;
    } else {
      console.log('📍 Using fallback hash navigation to activity editor');
      window.location.hash = `#activity-editor/${techniqueId}`;
    }
  }

  // Drop technique on specific lesson
  function dropTechniqueToLesson(event, lessonNumber) {
    event.preventDefault();
    event.target.classList.remove('drag-over');
    
    const techniqueId = event.dataTransfer.getData('text/plain');
    const technique = loadedTechniques.find(t => t.id === techniqueId);
    
    if (!technique) {
      console.log('⚠️ Technique not found for drop');
      return;
    }
    
    // Add technique to lesson
    addTechniqueToLesson(lessonNumber, techniqueId);
    console.log(`✅ Technique ${technique.name} added to Lesson ${lessonNumber}`);
  }

  // Add technique to specific lesson
  function addTechniqueToLesson(lessonNumber, techniqueId) {
    const lessonKey = lessonNumber.toString();
    
    if (!scheduleTechniquesMap.has(lessonKey)) {
      scheduleTechniquesMap.set(lessonKey, []);
    }
    
    const lessonTechniques = scheduleTechniquesMap.get(lessonKey);
    if (!lessonTechniques.includes(techniqueId)) {
      lessonTechniques.push(techniqueId);
      scheduleTechniquesMap.set(lessonKey, lessonTechniques);
      
      // Update display
      updateLessonDisplay(lessonNumber);
      updateScheduleStats();
    }
  }

  // Update display of specific lesson
  function updateLessonDisplay(lessonNumber) {
    const lessonElement = document.querySelector(`[data-lesson="${lessonNumber}"]`);
    if (!lessonElement) return;
    
    const lessonTechniques = scheduleTechniquesMap.get(lessonNumber.toString()) || [];
    const techniques = lessonTechniques.map(id => loadedTechniques.find(t => t.id === id)).filter(Boolean);
    
    // Update counter
    const countElement = lessonElement.querySelector('.technique-count');
    if (countElement) {
      countElement.textContent = `${techniques.length} técnicas`;
    }
    
    // Update technique list
    const techniquesContainer = lessonElement.querySelector('.lesson-techniques');
    if (techniquesContainer) {
      techniquesContainer.innerHTML = techniques.map(tech => `
        <span class="technique-tag" onclick="navigateToActivity('${tech.id}')" title="Click para ver detalhes">
          ${tech.name}
        </span>
      `).join('');
    }
  }

  // Select lesson for editing
  function selectLesson(lessonNumber) {
    // Remove previous selection
    document.querySelectorAll('.schedule-item.selected').forEach(item => {
      item.classList.remove('selected');
    });
    
    // Select new lesson
    const lessonElement = document.querySelector(`[data-lesson="${lessonNumber}"]`);
    if (lessonElement) {
      lessonElement.classList.add('selected');
      
      // Show lesson details if needed
      showLessonDetails(lessonNumber);
    }
  }

  // Show lesson details
  function showLessonDetails(lessonNumber) {
    const lessonTechniques = scheduleTechniquesMap.get(lessonNumber.toString()) || [];
    const techniques = lessonTechniques.map(id => loadedTechniques.find(t => t.id === id)).filter(Boolean);
    
    console.log(`📋 Lesson ${lessonNumber}:`, {
      totalTechniques: techniques.length,
      techniques: techniques.map(t => t.name)
    });
  }

  // Update schedule statistics
  function updateScheduleStats() {
    const totalWeeksInput = document.getElementById('totalWeeks');
    const lessonsPerWeekInput = document.getElementById('lessonsPerWeek');
    const scheduleGrid = document.getElementById('scheduleGrid');
    
    if (!totalWeeksInput || !lessonsPerWeekInput) {
      console.warn('Schedule controls not found for stats update');
      return;
    }

    const totalWeeks = parseInt(totalWeeksInput.value) || 0;
    const lessonsPerWeek = parseInt(lessonsPerWeekInput.value) || 0;
    const totalLessons = totalWeeks * lessonsPerWeek;
    
    // Get existing schedule data
    let scheduledLessons = 0;
    if (scheduleGrid) {
      scheduledLessons = scheduleGrid.querySelectorAll('.lesson-cell').length;
    }

    // Alternative: count from schedule items
    const scheduleItems = document.querySelectorAll('.schedule-item');
    if (scheduleItems.length > 0) {
      scheduledLessons = scheduleItems.length;
    }

    const totalTechniques = Array.from(scheduleTechniquesMap.values()).flat().length;
    
    // Update counters in UI
    const totalLessonsElement = document.getElementById('totalLessonsCount');
    const assignedTechniquesElement = document.getElementById('assignedTechniquesCount');
    
    if (totalLessonsElement) {
      totalLessonsElement.textContent = totalLessons || scheduledLessons;
    }
    
    if (assignedTechniquesElement) {
      assignedTechniquesElement.textContent = totalTechniques;
    }

    // Update stats display if available
    const scheduleStatsDiv = document.querySelector('.schedule-stats');
    if (scheduleStatsDiv) {
      scheduleStatsDiv.innerHTML = `
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">Total de Semanas:</span>
            <span class="stat-value">${totalWeeks}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Aulas por Semana:</span>
            <span class="stat-value">${lessonsPerWeek}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Total de Aulas:</span>
            <span class="stat-value">${totalLessons}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Aulas Agendadas:</span>
            <span class="stat-value">${scheduledLessons}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Técnicas Atribuídas:</span>
            <span class="stat-value">${totalTechniques}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Progresso:</span>
            <span class="stat-value">${totalLessons > 0 ? Math.round((scheduledLessons / totalLessons) * 100) : 0}%</span>
          </div>
        </div>
      `;
    }
    
    console.log(`📊 Statistics: ${totalLessons} total lessons, ${scheduledLessons} scheduled, ${totalTechniques} techniques assigned`);
  }

  // Debug functions (global access)
  window.debugSchedule = function() {
    console.log('🔍 DEBUG SCHEDULE STATE:');
    console.log('📚 loadedTechniques:', loadedTechniques.length, loadedTechniques);
    console.log('📋 scheduleTechniquesMap:', scheduleTechniquesMap);
    console.log('🎯 scheduleTechniquesMap size:', scheduleTechniquesMap.size);
    
    // Force regenerate schedule
    scheduleTechniquesMap.clear();
    const totalLessons = 32; // 16 weeks * 2 lessons
    const autoAssigned = autoAssignTechniquesToLessons(totalLessons);
    console.log('🎯 Force assigned:', autoAssigned);
    
    Object.keys(autoAssigned).forEach(lessonNum => {
      scheduleTechniquesMap.set(lessonNum, autoAssigned[lessonNum]);
    });
    
    console.log('📋 Updated scheduleTechniquesMap:', scheduleTechniquesMap);
  };

  window.forceRegenerateSchedule = function() {
    console.log('🔄 Force regenerating schedule...');
    const scheduleGrid = document.getElementById('scheduleGrid');
    if (scheduleGrid) {
      scheduleGrid.innerHTML = '';
      scheduleTechniquesMap.clear();
      generateScheduleAutomatically();
    }
  };

  // Make functions globally available
  window.navigateToActivity = navigateToActivity;
  window.dropTechniqueToLesson = dropTechniqueToLesson;
  window.selectLesson = selectLesson;  function exportScheduleToJSON() {
    console.log('📤 Exporting schedule to JSON...');
    
    const schedule = getCurrentSchedule();
    const jsonString = JSON.stringify(schedule, null, 2);
    
    // Create download link
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cronograma-${currentCourse?.name || 'curso'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function processScheduleJSON() {
    try {
      const jsonInput = document.getElementById('scheduleJsonInput').value;
      const schedule = JSON.parse(jsonInput);
      
      await renderSchedule(schedule);
      document.querySelector('.schedule-json-import').style.display = 'none';
      document.getElementById('scheduleJsonInput').value = '';
      
      console.log('✅ Schedule imported from JSON');
    } catch (error) {
      alert('Erro ao processar JSON: ' + error.message);
    }
  }

  // Schedule-Techniques Integration Functions
  let scheduleTechniquesMap = new Map(); // week -> techniques[]

  function getTechniquesForWeek(week) {
    return scheduleTechniquesMap.get(week) || [];
  }

  function addTechniqueToWeekData(week, techniqueId) {
    if (!scheduleTechniquesMap.has(week)) {
      scheduleTechniquesMap.set(week, []);
    }

    const technique = getTechniqueById(techniqueId);
    if (technique) {
      scheduleTechniquesMap.get(week).push(technique);
    }
  }

  function removeTechniqueFromWeekData(week, techniqueId) {
    const techniques = scheduleTechniquesMap.get(week) || [];
    const filtered = techniques.filter(t => t.id !== techniqueId);
    scheduleTechniquesMap.set(week, filtered);
  }

  function getAllAssignedTechniques() {
    const assigned = [];
    scheduleTechniquesMap.forEach(techniques => {
      assigned.push(...techniques);
    });
    return assigned;
  }

  function getTechniqueById(id) {
    // First try to find in loaded techniques
    const technique = loadedTechniques.find(t => t.id == id);
    if (technique) return technique;
    
    // Fallback to selected techniques
    const selectedTechniques = getSelectedTechniques();
    return selectedTechniques.find(t => t.id == id);
  }

  function getSelectedTechniques() {
    // This should return the currently selected techniques from the techniques tab
    const selectedContainer = document.getElementById('selectedTechniques');
    if (!selectedContainer) return [];

    const items = selectedContainer.querySelectorAll('.technique-item');
    return Array.from(items).map(item => ({
      id: item.dataset.techniqueId,
      name: item.querySelector('.technique-name').textContent
    }));
  }

  function reorderTechniques(fromIndex, toIndex) {
    // Implement technique reordering logic
    console.log(`Reordering techniques from ${fromIndex} to ${toIndex}`);
  }

  function renderSelectedTechniques() {
    // Re-render the selected techniques list
    const selectedTechniques = getSelectedTechniques();
    const container = document.getElementById('selectedTechniques');

    if (selectedTechniques.length === 0) {
      container.innerHTML = '<div class="empty-state">Nenhuma técnica selecionada</div>';
    } else {
      let html = '';
      selectedTechniques.forEach((technique, index) => {
        html += `
          <div class="technique-item" data-technique-id="${technique.id}" draggable="true">
            <span class="technique-order">${index + 1}</span>
            <span class="technique-name">${technique.name}</span>
            <button type="button" class="btn btn-remove" onclick="removeTechnique('${technique.id}')">❌</button>
          </div>
        `;
      });
      container.innerHTML = html;
    }
  }

  // Advanced filtering functions
  function filterTechniques() {
    const searchTerm = document.getElementById('techniqueSearch')?.value.toLowerCase() || '';
    const categoryFilter = document.getElementById('techniqueFilter')?.value || 'all';
    const difficultyFilter = document.getElementById('difficultyFilter')?.value || 'all';
    const timeFilter = document.getElementById('timeFilter')?.value || 'all';

    // Apply filters to available techniques
    console.log('Applying filters:', { searchTerm, categoryFilter, difficultyFilter, timeFilter });
  }

  function sortTechniquesList() {
    const sortBy = document.getElementById('sortTechniques')?.value || 'name';
    console.log('Sorting techniques by:', sortBy);
  }

  function clearAllFilters() {
    document.getElementById('techniqueSearch').value = '';
    document.getElementById('techniqueFilter').value = 'all';
    document.getElementById('difficultyFilter').value = 'all';
    document.getElementById('timeFilter').value = 'all';
    filterTechniques();
  }

  function autoOrderTechniques() {
    // Implement automatic ordering based on difficulty, prerequisites, etc.
    console.log('Auto-ordering techniques...');
  }

  function exportTechniqueOrder() {
    const techniques = getSelectedTechniques();
    const dataStr = JSON.stringify(techniques, null, 2);
    const dataBlob = new Blob([dataStr], {type:'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'technique-order.json';
    link.click();
  }

  function clearAllTechniques() {
    if (confirm('Tem certeza que deseja remover todas as técnicas do curso?')) {
      // Clear all selected techniques
      document.getElementById('selectedTechniques').innerHTML = '<div class="empty-state">Nenhuma técnica selecionada</div>';
      updateTechniqueStats();
    }
  }

  function getCurrentSchedule() {
    // Implementation to get current schedule from UI
    const totalWeeks = parseInt(document.getElementById('totalWeeks')?.value) || 18;
    const lessonsPerWeek = parseInt(document.getElementById('lessonsPerWeek')?.value) || 2;
    
    return {
      weeks: totalWeeks,
      lessonsPerWeek: Array.from({length: totalWeeks}, (_, i) => ({
        week: i + 1,
        lessons: lessonsPerWeek,
        focus: [`Semana ${i + 1}`]
      }))
    };
  }

  // Techniques tab functions
  // Helper to normalize technique fields coming from /api/techniques
  function mapTechniqueComplexity(val) {
    // Backend enums: BASICA | INTERMEDIARIA | AVANCADA
    if (!val) return 'Iniciante';
    switch(String(val).toUpperCase()){
      case 'BASICA': return 'Iniciante';
      case 'INTERMEDIARIA': return 'Intermediário';
      case 'AVANCADA': return 'Avançado';
      default: return val;
    }
  }

  async function fetchAllTechniquesPaginated() {
    // Techniques endpoint validates limit <= 100; fetch pages until done
    const limit = 100;
    let page = 1;
    const all = [];
    const seen = new Set();
    while (true) {
      const res = await moduleAPI.api.get(`/api/techniques?limit=${limit}&page=${page}`);
      const chunk = Array.isArray(res?.data?.techniques) ? res.data.techniques : [];
      for (const t of chunk) {
        if (t?.id && !seen.has(t.id)) { seen.add(t.id); all.push(t); }
      }
      const pag = res?.data?.pagination;
      const totalPages = pag?.totalPages || 1;
      if (page >= totalPages || chunk.length === 0) break;
      page++;
      if (page > 25) break; // safety cap
    }
    return all;
  }

  function loadAvailableTechniques() {
    console.log('📚 Loading available techniques...');
    const container = document.getElementById('availableTechniques');
    if (container) {
      container.innerHTML = '<div class="loading-state">Carregando técnicas...</div>';
    }
    ensureModuleAPI();
    if (loadingTechniquesPromise) {
      return loadingTechniquesPromise.then(() => {
        if (container) renderAvailableTechniques(loadedTechniques);
      });
    }

    loadingTechniquesPromise = (async () => {
      try {
        // Primary: Activities API (organization-scoped)
        const res = await moduleAPI.api.get('/api/activities?type=TECHNIQUE&pageSize=1000');
        const list = Array.isArray(res?.data) ? res.data : [];

        if (list.length > 0) {
          loadedTechniques = list.map((a, idx) => ({
            id: a.id || a.activityId || a._id,
            name: a.name || a.title,
            title: a.title || a.name,
            category: a.category || a.type || 'TECHNIQUE',
            difficulty: a.difficulty || a.complexity || 'Iniciante',
            time: a.duration ? `${a.duration} min` : (a.durationMin ? `${a.durationMin} min` : 'Não definido'),
            description: a.description || '',
            position: a.position || idx + 1
          }));
          console.log(`✅ Loaded ${loadedTechniques.length} techniques from /api/activities`);
          return;
        }

        // Fallback: Techniques API (techniques table)
        console.log('ℹ️ No activities found. Falling back to /api/techniques (paginated)');
        const techs = await fetchAllTechniquesPaginated();
        loadedTechniques = techs.map((t, idx) => ({
          id: t.id,
          name: t.name,
          title: t.name,
          category: t.category || 'TECHNIQUE',
          difficulty: mapTechniqueComplexity(t.complexity),
          time: (t.durationMin || t.durationMax) ? `${t.durationMin || t.durationMax} min` : 'Não definido',
          description: t.shortDescription || '',
          position: idx + 1
        }));
        console.log(`✅ Loaded ${loadedTechniques.length} techniques from /api/techniques (merged pages)`);
      } catch (err) {
        console.warn('⚠️ Falha ao carregar técnicas', err);
        loadedTechniques = [];
      } finally {
        if (container) {
          if (loadedTechniques.length > 0) renderAvailableTechniques(loadedTechniques);
          else container.innerHTML = '<div class="empty-state">Nenhuma técnica disponível</div>';
        }
        // Clear promise so future refreshes can reload
        loadingTechniquesPromise = null;
      }
    })();

    return loadingTechniquesPromise;
  }

  function renderAvailableTechniques(techniques) {
    const availableTechniques = document.getElementById('availableTechniques');
    if (!availableTechniques) return;
    
    console.log(`🎨 Rendering ${techniques.length} available techniques`);
    
    if (techniques.length === 0) {
      availableTechniques.innerHTML = '<div class="empty-state">Nenhuma técnica disponível</div>';
      return;
    }
    
    let html = '<div class="techniques-table">';
    html += `
      <div class="technique-table-header">
        <span class="technique-position">#</span>
        <span class="technique-name">Nome da Técnica</span>
        <span class="technique-category">Categoria</span>
        <span class="technique-difficulty">Dificuldade</span>
        <span class="technique-time">Tempo</span>
        <span class="technique-actions">Ações</span>
      </div>
    `;
    
    techniques.forEach((technique) => {
      html += createTechniqueCard(technique, false);
    });
    
    html += '</div>';
    availableTechniques.innerHTML = html;
    
    console.log('✅ Available techniques rendered');
  }

  function filterTechniques() {
    const search = document.getElementById('techniqueSearch')?.value.toLowerCase() || '';
    const filter = document.getElementById('techniqueFilter')?.value || 'all';
    
    console.log(`🔍 Filtering techniques: search="${search}", filter="${filter}"`);
    
    // Implementation for filtering techniques
    document.querySelectorAll('.technique-card').forEach(card => {
      const name = card.querySelector('h4')?.textContent.toLowerCase() || '';
      const category = card.querySelector('.technique-category')?.textContent || '';
      
      const matchesSearch = name.includes(search);
      const matchesFilter = filter === 'all' || category === filter;
      
      card.style.display = (matchesSearch && matchesFilter) ? 'flex' : 'none';
    });
  }

  function updateTechniquesStats() {
    // Update technique statistics
    const selectedContainer = document.getElementById('selectedTechniques');
    if (!selectedContainer) return;
    
    const selectedTechniques = selectedContainer.querySelectorAll('.technique-item');
    const totalTechniques = selectedTechniques.length;
    const requiredTechniques = Array.from(selectedTechniques).filter(item => 
      item.dataset.required === 'true').length;
    const optionalTechniques = totalTechniques - requiredTechniques;
    
    // Update stat displays
    const totalEl = document.getElementById('totalTechniques');
    const requiredEl = document.getElementById('requiredTechniques');
    const optionalEl = document.getElementById('optionalTechniques');
    
    if (totalEl) totalEl.textContent = totalTechniques;
    if (requiredEl) requiredEl.textContent = requiredTechniques;
    if (optionalEl) optionalEl.textContent = optionalTechniques;
    
    console.log(`📊 Stats updated: ${totalTechniques} total, ${requiredTechniques} required, ${optionalTechniques} optional`);
    
    // Update empty state - only if no techniques
    if (totalTechniques === 0) {
      const emptyState = selectedContainer.querySelector('.empty-state');
      if (!emptyState) {
        selectedContainer.innerHTML = `
          <div class="empty-state">
            <p>Nenhuma técnica selecionada</p>
            <p>Adicione técnicas da biblioteca acima</p>
          </div>
        `;
      }
    }
  }

  function openAddTechniqueModal() {
    console.log('➕ Opening add technique modal...');
    // Implementation for adding new technique
  }

  // RAG tab functions
  function updateRAGOverview() {
    console.log('🧠 Updating RAG overview...');
    
    const scheduleStatus = getCurrentSchedule().lessonsPerWeek.length > 0 ? 
      `${getCurrentSchedule().weeks} semanas configuradas` : 'Não configurado';
    
    const selectedTechniques = document.querySelectorAll('.technique-card.selected').length;
    
    document.getElementById('ragScheduleStatus').textContent = scheduleStatus;
    document.getElementById('ragTechniquesStatus').textContent = `${selectedTechniques} selecionadas`;
    document.getElementById('ragExistingPlans').textContent = '0 planos'; // TODO: Get from API
  }

  function generateRAGLessonPlans() {
    console.log('🚀 Generating lesson plans with RAG...');
    
    const ragProgress = document.getElementById('ragProgress');
    const ragResults = document.getElementById('ragResults');
    
    if (ragProgress) ragProgress.style.display = 'block';
    if (ragResults) ragResults.style.display = 'none';
    
    // Get configuration from UI
    const options = {
      provider: document.getElementById('ragProvider')?.value || 'claude',
      lessonDuration: parseInt(document.getElementById('ragLessonDuration')?.value) || 60,
      customInstructions: document.getElementById('ragInstructions')?.value || '',
      replaceExisting: document.getElementById('ragReplaceExisting')?.checked || false,
      includeWarmup: document.getElementById('ragIncludeWarmup')?.checked !== false,
      includeCooldown: document.getElementById('ragIncludeCooldown')?.checked !== false,
      dryRun: document.getElementById('ragDryRun')?.checked || false
    };
    
    // Use the RAG integration
    if (window.CourseRAGIntegration) {
      const ragIntegration = new window.CourseRAGIntegration();
      const courseId = currentCourse?.id || courseId;
      
      ragIntegration.generateLessonPlansFromCourse(courseId, options)
        .then(result => {
          console.log('✅ RAG generation completed:', result);
          
          // Show results
          setTimeout(() => {
            const ragProgress = document.getElementById('ragProgress');
            const ragResults = document.getElementById('ragResults');
            
            if (ragProgress) ragProgress.style.display = 'none';
            if (ragResults) {
              ragResults.style.display = 'block';
              document.getElementById('ragResultsSummary').innerHTML = `
                <div class="success-message">
                  ✅ <strong>${result.plansGenerated} planos de aula</strong> ${options.dryRun ? 'simulados' : 'gerados'} com sucesso!<br>
                  🧠 Provedor: ${options.provider}<br>
                  ⏱️ Duração por aula: ${options.lessonDuration} minutos<br>
                  ${options.dryRun ? '👁️ Modo simulação ativo - nada foi salvo' : '💾 Planos salvos no sistema'}
                </div>
              `;
              
              if (result.plans && result.plans.length > 0) {
                const previewHtml = result.plans.slice(0, 3).map(plan => `
                  <div class="plan-preview">
                    <h4>${plan.title}</h4>
                    <p><strong>Objetivos:</strong> ${plan.objectives.join(', ')}</p>
                    <p><strong>Técnicas:</strong> ${plan.techniques.substring(0, 100)}...</p>
                  </div>
                `).join('');
                
                document.getElementById('ragResultsPreview').innerHTML = `
                  <h4>Preview dos Primeiros Planos:</h4>
                  ${previewHtml}
                  ${result.plans.length > 3 ? `<p><em>...e mais ${result.plans.length - 3} planos</em></p>` : ''}
                `;
              }
            }
          }, 1000);
        })
        .catch(error => {
          console.error('❌ RAG generation failed:', error);
          
          // Show error
          const ragProgress = document.getElementById('ragProgress');
          if (ragProgress) ragProgress.style.display = 'none';
          
          alert(`Erro na geração RAG: ${error.message}`);
        });
    } else {
      // Fallback to simulation
      console.warn('⚠️ CourseRAGIntegration not available, using simulation');
      simulateRAGGeneration();
    }
  }

  function previewRAGGeneration() {
    console.log('👁️ Previewing RAG generation...');
    
    const isDryRun = document.getElementById('ragDryRun')?.checked;
    if (!isDryRun) {
      document.getElementById('ragDryRun').checked = true;
    }
    
    generateRAGLessonPlans();
  }

  function simulateRAGGeneration() {
    const progressFill = document.getElementById('ragProgressFill');
    const progressStatus = document.getElementById('ragProgressStatus');
    const progressLog = document.getElementById('ragProgressLog');
    
    let progress = 0;
    const steps = [
      'Analisando cronograma...',
      'Carregando técnicas selecionadas...',
      'Conectando com provedor de IA...',
      'Gerando plano de aula 1/18...',
      'Gerando plano de aula 5/18...',
      'Gerando plano de aula 10/18...',
      'Gerando plano de aula 15/18...',
      'Gerando plano de aula 18/18...',
      'Processando resultados...',
      'Finalizando...'
    ];
    
    function updateProgress() {
      if (progress < steps.length) {
        const currentStep = steps[progress];
        const percentage = Math.round((progress / steps.length) * 100);
        
        if (progressFill) progressFill.style.width = `${percentage}%`;
        if (progressStatus) progressStatus.textContent = currentStep;
        if (progressLog) {
          progressLog.innerHTML += `<div>${new Date().toLocaleTimeString()}: ${currentStep}</div>`;
          progressLog.scrollTop = progressLog.scrollHeight;
        }
        
        progress++;
        setTimeout(updateProgress, 800);
      } else {
        // Show results
        setTimeout(() => {
          const ragProgress = document.getElementById('ragProgress');
          const ragResults = document.getElementById('ragResults');
          
          if (ragProgress) ragProgress.style.display = 'none';
          if (ragResults) {
            ragResults.style.display = 'block';
            document.getElementById('ragResultsSummary').innerHTML = `
              <div class="success-message">
                ✅ <strong>18 planos de aula</strong> gerados com sucesso!<br>
                🕒 Tempo total: 12 segundos<br>
                🧠 Provedor: ${document.getElementById('ragProvider')?.value || 'Claude'}
              </div>
            `;
          }
        }, 1000);
      }
    }
    
    updateProgress();
  }

  // Global functions for technique management
  window.addTechniqueToCourse = function(techniqueId) {
    console.log(`➕ Adding technique ${techniqueId} to course`);
    
    const card = document.querySelector(`[data-technique-id="${techniqueId}"]`);
    if (card) {
      card.classList.add('selected');
      // Move to selected techniques section
      const selectedSection = document.getElementById('selectedTechniques');
      if (selectedSection) {
        selectedSection.appendChild(card.cloneNode(true));
      }
      updateTechniquesStats();
    }
  };

  // Hook into existing init path (run after initNewCourseDefaults)
  const originalInitNew = initNewCourseDefaults;
  initNewCourseDefaults = function() { originalInitNew(); /* tryLoadDraft(); */ };

  // Function to edit techniques for a specific week
  function editWeekTechniques(weekNumber) {
    console.log(`📝 Editing techniques for week ${weekNumber}`);
    
    // Switch to techniques tab
    switchTab('techniques');
    
    // Update week selector
    const weekSelect = document.getElementById('scheduleWeekSelect');
    if (weekSelect) {
      weekSelect.value = weekNumber;
      loadTechniquesForWeek();
    }
    
    // Highlight the week in the schedule
    document.querySelectorAll('.schedule-item').forEach(item => {
      item.classList.remove('selected-week');
    });
    const selectedWeek = document.querySelector(`.schedule-item[data-week="${weekNumber}"]`);
    if (selectedWeek) {
      selectedWeek.classList.add('selected-week');
      selectedWeek.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // Drag and drop functions
  function dragTechnique(event, techniqueId) {
    event.dataTransfer.setData('text/plain', techniqueId);
    event.dataTransfer.effectAllowed = 'copy';
  }

  function viewTechniqueDetails(techniqueId) {
    const technique = getTechniqueById(techniqueId);
    if (technique) {
      const details = `
Nome: ${technique.name || 'Não definido'}
Categoria: ${technique.category || 'Não definida'}
Dificuldade: ${technique.difficulty || 'Não definida'}
Tempo: ${technique.time || 'Não definido'}
Descrição: ${technique.description || 'Sem descrição'}
      `;
      alert(details);
    }
  }

  // Drag and drop event handlers
  function allowDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.add('drag-over');
  }

  function dragLeave(event) {
    event.currentTarget.classList.remove('drag-over');
  }

  function dropTechnique(event, weekNumber) {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');
    
    const techniqueId = event.dataTransfer.getData('text/plain');
    if (techniqueId) {
      console.log(`🎯 Dropping technique ${techniqueId} to week ${weekNumber}`);
      addTechniqueToWeekData(weekNumber.toString(), techniqueId);
      renderSchedule(getCurrentSchedule()).catch(console.error);
      
      // If we're on the techniques tab, refresh the week view
      const activeTab = document.querySelector('.tab-btn.active');
      if (activeTab && activeTab.dataset.tab === 'techniques') {
        loadTechniquesForWeek();
      }
    }
  }

  // Function to add technique to course
  function addTechniqueToCourse(techniqueId) {
    console.log(`➕ Adding technique ${techniqueId} to course`);
    
    const technique = getTechniqueById(techniqueId);
    if (!technique) {
      console.error('Technique not found:', techniqueId);
      return;
    }
    
    const selectedContainer = document.getElementById('selectedTechniques');
    if (!selectedContainer) return;
    
    // Check if already added
    const existing = selectedContainer.querySelector(`[data-technique-id="${techniqueId}"]`);
    if (existing) {
      console.log('Technique already added to course');
      return;
    }
    
    // Add to selected techniques
    const techniqueCardHTML = createTechniqueCard(technique, true);
    
    // Remove empty state if exists
    const emptyState = selectedContainer.querySelector('.empty-state');
    if (emptyState) {
      emptyState.remove();
    }
    
    selectedContainer.insertAdjacentHTML('beforeend', techniqueCardHTML);
    
    updateTechniquesStats();
    console.log('✅ Technique added to course');
  }

  // Function to remove technique from week
  function removeTechniqueFromWeek(week, techniqueId) {
    console.log(`❌ Removing technique ${techniqueId} from week ${week}`);
    removeTechniqueFromWeekData(week, techniqueId);
    loadTechniquesForWeek();
    renderSchedule(getCurrentSchedule()).catch(console.error);
  }

  // Function to create technique card
  function createTechniqueCard(technique, isSelected = false) {
    const position = technique.position || 1;
    const name = technique.name || technique.title || 'Técnica sem nome';
    const category = technique.category || 'Não definida';
    const difficulty = technique.difficulty || 'Não definida';
    const time = technique.time || 'Não definido';
    const description = technique.description || '';
    
    return `
      <div class="technique-card ${isSelected ? 'selected' : ''}" data-technique-id="${technique.id}" 
           draggable="true" ondragstart="dragTechnique(event, '${technique.id}')">
        <div class="technique-info">
          <span class="technique-position">#${position}</span>
          <div class="technique-details">
            <span class="technique-name" title="${description}">${name}</span>
            <span class="technique-category">${category}</span>
            <span class="technique-difficulty">${difficulty}</span>
            <span class="technique-time">${time}</span>
          </div>
        </div>
        <div class="technique-actions">
          ${isSelected ? 
            `<button class="btn btn-sm btn-remove" onclick="removeTechniqueFromCourse('${technique.id}')" title="Remover do curso">❌</button>` :
            `<button class="btn btn-sm" onclick="addTechniqueToCourse('${technique.id}')" title="Adicionar ao curso">➕</button>`
          }
          <button class="btn btn-sm" onclick="viewTechniqueDetails('${technique.id}')" title="Ver detalhes">👁️</button>
        </div>
      </div>
    `;
  }

  // Function to remove technique from course
  function removeTechniqueFromCourse(techniqueId) {
    console.log(`❌ Removing technique ${techniqueId} from course`);
    
    const selectedContainer = document.getElementById('selectedTechniques');
    if (!selectedContainer) return;
    
    const techniqueCard = selectedContainer.querySelector(`[data-technique-id="${techniqueId}"]`);
    if (techniqueCard) {
      techniqueCard.remove();
      updateTechniquesStats();
      
      // Also remove from all weeks
      scheduleTechniquesMap.forEach((techniques, week) => {
        removeTechniqueFromWeekData(week, techniqueId);
      });
      
      // Refresh schedule display
      renderSchedule(getCurrentSchedule()).catch(console.error);
      loadTechniquesForWeek();
    }
  }

  console.log('📝 Course Editor Module - Loaded');
})();
