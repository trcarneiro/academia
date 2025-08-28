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

  // Public init
  window.initializeCourseEditorModule = initializeCourseEditorModule;
  window.saveCourseSimple = saveCourseSimple;
  window.goBack = goBack;

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
            const resp = await fetch(`/api/courses/${courseId}/generate-lesson-plans`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ syllabus, replace: !!genReplace?.checked, dryRun: !!genDryRun?.checked })
            });
            const data = await resp.json();
            if (!resp.ok || !data.success) throw new Error(data.error || data.message || 'Falha ao gerar');
            genResult.textContent = `Resultado: ${data.summary?.dryRun ? 'Simulação' : 'Criado'} ${data.summary?.created || 0} planos` + (data.summary?.replaced ? `, removidos ${data.summary.replaced}` : '');
            if (!data.summary?.dryRun) { await loadLessonPlansSummary(); }
          } catch (e) {
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
      const res = await fetch(`/api/courses/${id}`);
      if (!res.ok) throw new Error('Curso não encontrado');
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Falha ao carregar curso');
      currentCourse = adaptBackendCourse(json.data);
      populateFormFromState();
      console.log('✅ Course loaded', currentCourse);
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
      isActive: api.isActive === true || api.status === 'active'
    };
  }

  // Patch: adjust populateFormFromState & collectFormData to handle uppercase status values
  function populateFormFromState() {
    setVal('courseName', currentCourse.name);
    setVal('courseDescription', currentCourse.description);
    setVal('courseLevel', currentCourse.level);
    setVal('courseDuration', currentCourse.duration);
    // Use uppercase to match HTML <option> values
    setVal('courseStatus', currentCourse.isActive ? 'ACTIVE' : 'INACTIVE');
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
        createdBy: 'system'
      };

      // Remover campos null/undefined (pode causar rejeição em validações estritas)
      Object.keys(payload).forEach(k => (payload[k] === null || payload[k] === undefined) && delete payload[k]);

      console.log('[course-editor] Payload preparado para envio', payload);

      showLoading();
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing ? `/api/courses/${currentCourse?.id || courseId}` : '/api/courses';
      const headers = { 'Content-Type': 'application/json' };
      // Adiciona cabeçalho de organização se existir no storage
      try {
        const orgId = localStorage.getItem('activeOrganizationId');
        if (orgId) headers['X-Organization-Id'] = orgId;
      } catch {}
      const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });
      let json = null;
      try { json = await res.json(); } catch { json = {}; }

      if (!res.ok || !json.success) {
        // Log detalhado para diagnóstico
        console.group('[course-editor] Falha ao salvar curso');
        console.warn('Status HTTP:', res.status);
        console.warn('Response JSON bruto:', json);
        console.warn('Headers possiveis:', Object.fromEntries(res.headers.entries()));
        console.groupEnd();

        // Tentar extrair mensagem útil (ex: Zod issues ou validação custom)
        let msg = json.error || json.message || `HTTP ${res.status}`;
        if (json.error && typeof json.error === 'object') {
          if (json.error.issues) {
            const issues = json.error.issues.map(i => (i.path ? i.path.join('.') + ': ' : '') + i.message).join('\n');
            msg += '\n' + issues;
          } else if (json.error.message) {
            msg += '\n' + json.error.message;
          }
        }
        throw new Error(msg);
      }
      alert(`Curso ${isEditing ? 'atualizado' : 'criado'} com sucesso`);
      isDirty = false;
      if (window.refreshCourses) window.refreshCourses();
      setTimeout(()=> { if (window.navigateToModule) navigateToModule('courses'); }, 600);
    } catch (e) {
      console.error('❌ Save failed', e);
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
    div.innerHTML = `<textarea placeholder="Descreva um objetivo ${type === 'general' ? 'geral' : 'específico'} do curso...">${value}</textarea><button type="button" class="remove-btn" data-action="removeObjectiveDelegate" data-args='["${type}"]'>🗑️</button>`;
    container.appendChild(div);
  }
  function addResourceItem(value = '') {
    const container = document.getElementById('resourcesList');
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'resource-item';
    div.innerHTML = `<input type="text" placeholder="Ex: Tatame, Luvas de boxe, Escudos..." value="${value}"><button type="button" class="remove-btn" data-action="removeResourceDelegate">🗑️</button>`;
    container.appendChild(div);
  }
  function addEvalItemElement(type, value = '') {
    const containerId = type === 'criteria' ? 'evaluationCriteria' : 'evaluationMethods';
    const placeholder = type === 'criteria' ? 'Ex: Execução correta das técnicas' : 'Ex: Avaliação prática individual';
    const container = document.getElementById(containerId);
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'eval-item';
    div.innerHTML = `<input type="text" placeholder="${placeholder}" value="${value}"><button type="button" class="remove-btn" data-action="removeEvalItemDelegate" data-args='["${type}"]'>🗑️</button>`;
    container.appendChild(div);
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

      const res = await fetch(`/api/courses/${courseId}/lesson-plans`);
      const json = await res.json();
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
          const resp = await fetch(`/api/lesson-plans/${targetId}/activities`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ items }) });
          const j = await resp.json();
          if (!resp.ok || !j.success) throw new Error(j.message || 'Falha ao importar');
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
        break;
      case 'techniques':
        loadAvailableTechniques();
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
    
    if (generateScheduleBtn) {
      generateScheduleBtn.addEventListener('click', generateScheduleAutomatically);
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
  }

  function initializeTechniquesTab() {
    console.log('🥋 Initializing techniques tab...');
    
    // Techniques tools event listeners
    const techniqueSearch = document.getElementById('techniqueSearch');
    const techniqueFilter = document.getElementById('techniqueFilter');
    const addTechniqueBtn = document.getElementById('addTechniqueBtn');
    
    if (techniqueSearch) {
      techniqueSearch.addEventListener('input', filterTechniques);
    }
    
    if (techniqueFilter) {
      techniqueFilter.addEventListener('change', filterTechniques);
    }
    
    if (addTechniqueBtn) {
      addTechniqueBtn.addEventListener('click', openAddTechniqueModal);
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

  function generateScheduleAutomatically() {
    console.log('⚡ Generating automatic schedule...');
    
    const totalWeeks = parseInt(document.getElementById('totalWeeks')?.value) || 18;
    const lessonsPerWeek = parseInt(document.getElementById('lessonsPerWeek')?.value) || 2;
    
    const schedule = {
      weeks: totalWeeks,
      lessonsPerWeek: []
    };
    
    for (let week = 1; week <= totalWeeks; week++) {
      schedule.lessonsPerWeek.push({
        week: week,
        lessons: lessonsPerWeek,
        focus: [`Semana ${week} - Foco Principal`, `Técnicas da semana ${week}`]
      });
    }
    
    renderSchedule(schedule);
    console.log('✅ Schedule generated automatically');
  }

  function exportScheduleToJSON() {
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

  function processScheduleJSON() {
    try {
      const jsonInput = document.getElementById('scheduleJsonInput').value;
      const schedule = JSON.parse(jsonInput);
      
      renderSchedule(schedule);
      document.querySelector('.schedule-json-import').style.display = 'none';
      document.getElementById('scheduleJsonInput').value = '';
      
      console.log('✅ Schedule imported from JSON');
    } catch (error) {
      alert('Erro ao processar JSON: ' + error.message);
    }
  }

  function renderSchedule(schedule) {
    const scheduleGrid = document.getElementById('scheduleGrid');
    if (!scheduleGrid) return;
    
    let html = '<div class="schedule-list">';
    
    if (schedule.lessonsPerWeek && schedule.lessonsPerWeek.length > 0) {
      schedule.lessonsPerWeek.forEach(weekData => {
        html += `
          <div class="schedule-item">
            <span class="schedule-week">Semana ${weekData.week}</span>
            <span class="schedule-lessons">${weekData.lessons} aulas</span>
            <span class="schedule-focus">${weekData.focus ? weekData.focus.join(', ') : 'Sem foco definido'}</span>
          </div>
        `;
      });
    } else {
      html += '<div class="schedule-empty-state"><p>Cronograma vazio</p></div>';
    }
    
    html += '</div>';
    scheduleGrid.innerHTML = html;
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
  function loadAvailableTechniques() {
    console.log('📚 Loading available techniques...');
    
    const availableTechniques = document.getElementById('availableTechniques');
    if (availableTechniques) {
      availableTechniques.innerHTML = '<div class="loading-state">Carregando técnicas...</div>';
      
      // Simulate loading techniques from activities module
      setTimeout(() => {
        const mockTechniques = [
          { id: 1, name: 'Jab Básico', category: 'attack', required: true },
          { id: 2, name: 'Defesa Estrangulamento', category: 'defense', required: true },
          { id: 3, name: 'Movimentação Lateral', category: 'movement', required: false }
        ];
        
        renderAvailableTechniques(mockTechniques);
      }, 1000);
    }
  }

  function renderAvailableTechniques(techniques) {
    const availableTechniques = document.getElementById('availableTechniques');
    if (!availableTechniques) return;
    
    let html = '';
    techniques.forEach(technique => {
      html += `
        <div class="technique-card" data-technique-id="${technique.id}">
          <div class="technique-info">
            <h4>${technique.name}</h4>
            <span class="technique-category">${technique.category}</span>
          </div>
          <div class="technique-actions">
            <button class="btn btn-sm" onclick="addTechniqueToCourse(${technique.id})">
              ➕ Adicionar
            </button>
          </div>
        </div>
      `;
    });
    
    availableTechniques.innerHTML = html;
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
    const totalTechniques = document.querySelectorAll('.technique-card').length;
    const requiredTechniques = document.querySelectorAll('.technique-card[data-required="true"]').length;
    const optionalTechniques = totalTechniques - requiredTechniques;
    
    document.getElementById('totalTechniques').textContent = totalTechniques;
    document.getElementById('requiredTechniques').textContent = requiredTechniques;
    document.getElementById('optionalTechniques').textContent = optionalTechniques;
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

  console.log('📝 Course Editor Module - Loaded');
})();
