(function(){
  'use strict';
  // Courses Tab Module for Plan Editor
  // Relies on plan-editor.js setting current plan + exposing hooks.

  let state = {
    initialized:false,
    planId:null,
    loading:false,
    available:[],
    linked:[],
    originalLinkedIds:new Set(),
    selectedAvailable:new Set(),
    selectedLinked:new Set(),
    filterAvailable:'',
    filterLinked:''
  };

  document.addEventListener('DOMContentLoaded',()=>{
    setupTabActivation();
  });

  function setupTabActivation(){
    const tabsContainer = document.getElementById('planTabs');
    if(!tabsContainer) return;
    tabsContainer.style.display='flex';
    const panelsContainer = document.getElementById('planTabPanels');
    if(panelsContainer) panelsContainer.style.display='block';

    tabsContainer.addEventListener('click', (e)=>{
      const tab = e.target.closest('.plan-tab');
      if(!tab) return;
      const target = tab.dataset.tab;
      if(!target) return;
      tabsContainer.querySelectorAll('.plan-tab').forEach(t=>t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.plan-tab-panel').forEach(p=>{
        p.classList.toggle('active', p.dataset.panel===target);
      });
      if(target==='courses' && !state.initialized){
        initCoursesTab();
      }
    });
  }

  async function initCoursesTab(){
    // Only bind events once on first initialization
    if(!state.initialized) {
        state.initialized=true;
        bindUIEvents();
    }
    
    const panel = document.getElementById('coursesPanel');
    if(!panel) return;
    
    const planId = getCurrentPlanId();
    state.planId = planId; // Store planId in state
    
    if(!planId){
      // Show message if no plan ID, even after initialization
      panel.querySelector('#coursesPanelContent').innerHTML = '<div class="empty-state">Salve o plano primeiro para associar cursos.</div>';
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
    const coursesLoading = document.getElementById('coursesLoading');
    const coursesAssociation = document.getElementById('coursesAssociation');
    if (coursesLoading) coursesLoading.style.display = 'block';
    if (coursesAssociation) coursesAssociation.style.display = 'none';
    
    await loadCoursesData();
  }

  function getCurrentPlanId(){
    // plan-editor.js stores currentPlan in closure; we can't access it directly.
    // We try to infer from URL or sessionStorage editingPlanId
    const urlParams = new URLSearchParams(window.location.search);
    const idFromUrl = urlParams.get('id');
    if(idFromUrl) return idFromUrl;
    const idFromSession = sessionStorage.getItem('editingPlanId');
    return idFromSession || null;
  }

  function bindUIEvents(){
    const addBtn = document.getElementById('addCourseBtn');
    const remBtn = document.getElementById('removeCourseBtn');
    const searchAvail = document.getElementById('searchAvailableCourses');
    const searchLinked = document.getElementById('searchLinkedCourses');
    const saveBtn = document.getElementById('saveCoursesChangesBtn');
    const discardBtn = document.getElementById('discardCoursesChangesBtn');

    addBtn?.addEventListener('click',()=>moveSelected('available'));
    remBtn?.addEventListener('click',()=>moveSelected('linked'));
    searchAvail?.addEventListener('input', debounce(e=>{state.filterAvailable=e.target.value.trim().toLowerCase(); renderLists();},250));
    searchLinked?.addEventListener('input', debounce(e=>{state.filterLinked=e.target.value.trim().toLowerCase(); renderLists();},250));
    saveBtn?.addEventListener('click', saveDiff);
    discardBtn?.addEventListener('click', discardChanges);
  }

  async function loadCoursesData(){
    try {
      toggleLoading(true);
      // Fetch ALL courses
      const allResp = await fetch('/api/courses');
      const allJson = allResp.ok? await allResp.json(): {data:[]};
      const allCourses = (allJson.data||[]).filter(c=>c.isActive!==false);

      // Fetch linked courses
      const linkedResp = await fetch(`/api/plans/${state.planId}/courses`);
      const linkedJson = linkedResp.ok? await linkedResp.json(): {data:[]};
      state.linked = linkedJson.data||[];
      state.originalLinkedIds = new Set(state.linked.map(c=>c.id));

      // Available = all - linked
      const linkedIds = new Set(state.linked.map(c=>c.id));
      state.available = allCourses.filter(c=>!linkedIds.has(c.id));

      renderLists();
      toggleLoading(false);
      document.getElementById('coursesAssociation').style.display='flex';
    } catch(err){
      console.error('Failed load courses association', err);
      showError('Erro ao carregar cursos: '+err.message);
      toggleLoading(false);
    }
  }

  function renderLists(){
    const availUl = document.getElementById('availableCoursesList');
    const linkedUl = document.getElementById('linkedCoursesList');
    if(!availUl||!linkedUl) return;

    const availFiltered = state.available.filter(c=>!state.filterAvailable || c.name.toLowerCase().includes(state.filterAvailable));
    const linkedFiltered = state.linked.filter(c=>!state.filterLinked || c.name.toLowerCase().includes(state.filterLinked));

    availUl.innerHTML = availFiltered.map(c=>courseLi(c,'available')).join('');
    linkedUl.innerHTML = linkedFiltered.map(c=>courseLi(c,'linked')).join('');

    document.getElementById('availableCount').textContent = availFiltered.length;
    document.getElementById('linkedCount').textContent = linkedFiltered.length;

    document.getElementById('availableEmptyState').style.display = availFiltered.length? 'none':'block';
    document.getElementById('linkedEmptyState').style.display = linkedFiltered.length? 'none':'block';

    // Attach click handlers
    availUl.querySelectorAll('li').forEach(li=>{
      li.addEventListener('click',()=>toggleSelect(li,'available'));
    });
    linkedUl.querySelectorAll('li').forEach(li=>{
      li.addEventListener('click',()=>toggleSelect(li,'linked'));
    });

    updateDiffBar();
  }

  function courseLi(course,list){
    const selectedSet = list==='available'? state.selectedAvailable: state.selectedLinked;
    const selected = selectedSet.has(course.id);
    return `<li data-id="${course.id}" class="${selected? 'selected':''}"><span>${escapeHtml(course.name)}</span><span class="meta">${course.level||''}</span></li>`;
  }

  function toggleSelect(li,list){
    const id = li.dataset.id;
    const set = list==='available'? state.selectedAvailable: state.selectedLinked;
    if(set.has(id)) set.delete(id); else set.add(id);
    li.classList.toggle('selected');
  }

  function moveSelected(from){
    if(from==='available'){
      if(!state.selectedAvailable.size) return;
      const movingIds = new Set(state.selectedAvailable);
      const moving = state.available.filter(c=>movingIds.has(c.id));
      state.linked.push(...moving);
      state.available = state.available.filter(c=>!movingIds.has(c.id));
      state.selectedAvailable.clear();
    } else {
      if(!state.selectedLinked.size) return;
      const movingIds = new Set(state.selectedLinked);
      const moving = state.linked.filter(c=>movingIds.has(c.id));
      state.available.push(...moving);
      state.linked = state.linked.filter(c=>!movingIds.has(c.id));
      state.selectedLinked.clear();
    }
    renderLists();
  }

  function updateDiffBar(){
    const currentLinkedIds = new Set(state.linked.map(c=>c.id));
    let added = [], removed = [];
    currentLinkedIds.forEach(id=>{ if(!state.originalLinkedIds.has(id)) added.push(id); });
    state.originalLinkedIds.forEach(id=>{ if(!currentLinkedIds.has(id)) removed.push(id); });
    const diffBar = document.getElementById('coursesDiffBar');
    if(!added.length && !removed.length){ diffBar.style.display='none'; markTabDirty(false); return; }
    diffBar.style.display='flex';
    const summary = [];
    if(added.length) summary.push(`<span class='tag-added'>+${added.length} adicionados</span>`);
    if(removed.length) summary.push(`<span class='tag-removed'>-${removed.length} removidos</span>`);
    document.getElementById('diffSummary').innerHTML = summary.join(' | ');
    markTabDirty(true);
  }

  function markTabDirty(isDirty){
    const tab = document.getElementById('coursesTabBtn');
    if(!tab) return;
    tab.classList.toggle('badge-dirty', isDirty);
  }

  function discardChanges(){
    // Reset to original
    const currentLinkedIds = new Set(state.originalLinkedIds);
    const all = [...state.available, ...state.linked];
    state.linked = all.filter(c=>currentLinkedIds.has(c.id));
    const linkedIds = new Set(state.linked.map(c=>c.id));
    state.available = all.filter(c=>!linkedIds.has(c.id));
    state.selectedAvailable.clear();
    state.selectedLinked.clear();
    renderLists();
  }

  async function saveDiff(){
    try {
      const currentLinkedIds = new Set(state.linked.map(c=>c.id));
      let add=[], remove=[];
      currentLinkedIds.forEach(id=>{ if(!state.originalLinkedIds.has(id)) add.push(id); });
      state.originalLinkedIds.forEach(id=>{ if(!currentLinkedIds.has(id)) remove.push(id); });
      if(!add.length && !remove.length){ showSuccess('Nenhuma alteração para salvar'); return; }
      const resp = await fetch(`/api/plans/${state.planId}/courses`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ add, remove })
      });
      const json = await resp.json();
      if(!resp.ok || !json.success) throw new Error(json.message||'Falha ao salvar associações');
      state.originalLinkedIds = new Set(state.linked.map(c=>c.id));
      updateDiffBar();
      showSuccess('Associações salvas');
    } catch(err){
      console.error('Save diff error', err);
      showError('Erro ao salvar associações: '+err.message);
    }
  }

  function toggleLoading(is){
    const l = document.getElementById('coursesLoading');
    if(l) l.style.display = is? 'block':'none';
  }

  function debounce(fn, wait){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a),wait); }; }
  function escapeHtml(str){ return (str||'').replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;' }[c]||c)); }

  function showError(message){ if(typeof showToast==='function') showToast(message,'error'); else alert('Erro: '+message); }
  function showSuccess(message){ if(typeof showToast==='function') showToast(message,'success'); else alert('Sucesso: '+message); }

})();
