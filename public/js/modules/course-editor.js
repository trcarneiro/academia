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

    // Resolve course id (query or global)
    const urlParams = new URLSearchParams(window.location.search);
    courseId = urlParams.get('id') || window.currentCourseId || null;
    isEditing = !!courseId;

    try {
      if (isEditing) { await loadCourse(courseId); updateUIForEdit(); } else { initNewCourseDefaults(); }
      attachListeners();
      await loadLessonPlansSummary();
      const saveBtn = document.getElementById('saveCourseBtn');
      if (saveBtn) { saveBtn.onclick = null; saveBtn.addEventListener('click', e => { e.preventDefault(); window.saveCourse(); }); }
      const draftBtn = document.getElementById('saveDraftBtn');
      if (draftBtn) { draftBtn.onclick = null; draftBtn.addEventListener('click', e => { e.preventDefault(); if (typeof window.saveDraft==='function') window.saveDraft(); }); }
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
    if (btn) btn.innerHTML = '💾 Atualizar Curso';
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
-    div.innerHTML = `<textarea placeholder="Descreva um objetivo ${type === 'general' ? 'geral' : 'específico'} do curso...">${value}</textarea><button type="button" class="remove-btn" onclick="removeObjective(this, '${type}')">🗑️</button>`;
+    div.innerHTML = `<textarea placeholder="Descreva um objetivo ${type === 'general' ? 'geral' : 'específico'} do curso...">${value}</textarea><button type="button" class="remove-btn" data-action="removeObjectiveDelegate" data-args='["${type}"]'>🗑️</button>`;
    container.appendChild(div);
  }
  function addResourceItem(value = '') {
    const container = document.getElementById('resourcesList');
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'resource-item';
-    div.innerHTML = `<input type="text" placeholder="Ex: Tatame, Luvas de boxe, Escudos..." value="${value}"><button type="button" class="remove-btn" onclick="removeResource(this)">🗑️</button>`;
+    div.innerHTML = `<input type="text" placeholder="Ex: Tatame, Luvas de boxe, Escudos..." value="${value}"><button type="button" class="remove-btn" data-action="removeResourceDelegate">🗑️</button>`;
    container.appendChild(div);
  }
  function addEvalItemElement(type, value = '') {
    const containerId = type === 'criteria' ? 'evaluationCriteria' : 'evaluationMethods';
    const placeholder = type === 'criteria' ? 'Ex: Execução correta das técnicas' : 'Ex: Avaliação prática individual';
    const container = document.getElementById(containerId);
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'eval-item';
+    // Importar Técnicas/Atividades
+    const activitiesBtn = document.getElementById('activitiesImportBtn');
+    const activitiesFile = document.getElementById('activitiesImportFile');
+    activitiesBtn?.addEventListener('click', async ()=>{
+      try {
+        if (!activitiesFile?.files?.length) return alert('Selecione um arquivo JSON');
+        const text = await activitiesFile.files[0].text();
+        const data = JSON.parse(text);
+        if (!Array.isArray(data)) return alert('JSON inválido: esperado array de técnicas/atividades');
+        // Upsert cada técnica/atividade
+        let successCount = 0, failCount = 0;
+        for (const item of data) {
+          if (!item.name) { failCount++; continue; }
+          const resp = await fetch('/api/activities', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(item) });
+          const j = await resp.json();
+          if (resp.ok && j.success) successCount++; else failCount++;
+        }
+        alert(`Importação concluída: ${successCount} técnicas/atividades importadas, ${failCount} falhas.`);
+        activitiesFile.value = '';
+      } catch(e){ alert('Erro na importação de técnicas: ' + (e.message || e)); }
+    });
+    // Importar Curso
+    const courseBtn = document.getElementById('courseImportBtn');
+    const courseFile = document.getElementById('courseImportFile');
+    courseBtn?.addEventListener('click', async ()=>{
+      try {
+        if (!courseFile?.files?.length) return alert('Selecione um arquivo JSON');
+        const text = await courseFile.files[0].text();
+        const data = JSON.parse(text);
+        if (!data.name) return alert('JSON inválido: campo "name" obrigatório');
+        // Upsert por nome/título
+        const resp = await fetch('/api/courses/import', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) });
+        const j = await resp.json();
+        if (!resp.ok || !j.success) throw new Error(j.message || 'Falha ao importar curso');
+        alert('Curso importado com sucesso');
+        courseFile.value = '';
+      } catch(e){ alert('Erro na importação de curso: ' + (e.message || e)); }
+    });
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
    window.saveDraft = function() {
      try {
        const data = collectFormData();
        localStorage.setItem('courseDraft', JSON.stringify({ ...data, draft: true, savedAt: new Date().toISOString() }));
        alert('Rascunho salvo localmente');
        isDirty = false;
      } catch (e) { console.error('Draft save error', e); alert('Falha ao salvar rascunho'); }
    };
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
    console.log('[course-editor] Funções legacy expostas no window:', {
      saveCourse: typeof window.saveCourse,
      saveDraft: typeof window.saveDraft,
      addObjective: typeof window.addObjective,
      removeObjective: typeof window.removeObjective,
      addResource: typeof window.addResource,
      removeResource: typeof window.removeResource,
      addEvalItem: typeof window.addEvalItem,
      removeEvalItem: typeof window.removeEvalItem
    });
  }
  exposeLegacyCourseEditorFunctions();

  // Attempt to load draft for new course
  function tryLoadDraft() {
    if (isEditing) return;
    const raw = localStorage.getItem('courseDraft');
    if (!raw) return;
    try {
      const draft = JSON.parse(raw);
      if (draft && draft.name) {
        currentCourse = {
          id: draft.id || null,
          name: draft.name,
          description: draft.description || '',
          level: draft.level || 'BEGINNER',
          duration: draft.duration || 4,
          isActive: draft.isActive !== undefined ? draft.isActive : true
        };
        populateFormFromState();
        console.log('📝 Draft carregado');
      }
    } catch { /* ignore */ }
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

  // Hook into existing init path (run after initNewCourseDefaults)
  const originalInitNew = initNewCourseDefaults;
  initNewCourseDefaults = function() { originalInitNew(); tryLoadDraft(); };

  console.log('📝 Course Editor Module - Loaded');
})();
