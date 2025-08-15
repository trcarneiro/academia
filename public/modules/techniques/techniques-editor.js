// Techniques editor logic
export async function initializeTechniqueEditor() {
  const form = document.getElementById('technique-editor-form');
  const backBtn = document.getElementById('technique-editor-back');
  const saveBtn = document.getElementById('technique-save');
  const saveCloseBtn = document.getElementById('technique-save-close');
  const cancelBtn = document.getElementById('technique-cancel');
  const statusEl = document.getElementById('technique-status');

  if (!form) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  function setStatus(msg, isError) {
    statusEl.textContent = msg || '';
    statusEl.style.color = isError ? '#ef4444' : '#94a3b8';
  }

  function readForm() {
    const data = {
      title: document.getElementById('technique-title').value.trim(),
      type: document.getElementById('technique-type').value || 'TECHNIQUE',
      description: document.getElementById('technique-description').value || '',
      difficulty: (document.getElementById('technique-difficulty').value || '') === '' ? null : Number(document.getElementById('technique-difficulty').value),
      equipment: (document.getElementById('technique-equipment').value || '').split(',').map(s=>s.trim()).filter(Boolean),
      adaptations: (document.getElementById('technique-adaptations').value || '').split(',').map(s=>s.trim()).filter(Boolean),
      refTechniqueId: (document.getElementById('technique-ref').value || '') || null,
      courses: Array.from(document.getElementById('technique-courses').selectedOptions).map(o=>o.value)
    };
    return data;
  }

  function writeForm(data) {
    if (!data) return;
    document.getElementById('technique-title').value = data.title || '';
    document.getElementById('technique-type').value = data.type || 'TECHNIQUE';
    document.getElementById('technique-description').value = data.description || '';
    document.getElementById('technique-difficulty').value = data.difficulty ?? '';
    document.getElementById('technique-equipment').value = (data.equipment && data.equipment.join(', ')) || '';
    document.getElementById('technique-adaptations').value = (data.adaptations && data.adaptations.join(', ')) || '';
    document.getElementById('technique-ref').value = data.refTechniqueId || '';
    // courses selection left as is; will set after courses are loaded
  }

  // Autosave draft
  const draftKey = 'technique-draft-' + (id || 'new');
  function saveDraft() { localStorage.setItem(draftKey, JSON.stringify(readForm())); setStatus('Rascunho salvo localmente'); }
  function loadDraft() { const raw = localStorage.getItem(draftKey); if (raw) try { writeForm(JSON.parse(raw)); setStatus('Rascunho carregado'); } catch(e){} }

  // Fetch courses list for multi-select
  async function loadCourses() {
    try {
      const res = await fetch('/api/courses');
      const j = await res.json().catch(()=>({}));
      const items = (j && j.data) || [];
      const sel = document.getElementById('technique-courses');
      sel.innerHTML = items.map(c=>`<option value="${c.id}">${escapeHtml(c.title||c.name||c.id)}</option>`).join('');
    } catch(e) {
      console.warn('Failed to load courses', e);
    }
  }

  // Load existing technique
  async function load(id) {
    try {
      setStatus('Carregando...');
      const res = await fetch(`/api/activities/${encodeURIComponent(id)}`);
      const j = await res.json().catch(()=>({}));
      if (!res.ok || !j.success) { setStatus('Não foi possível carregar'); return; }
      const data = j.data;
      writeForm(data);
      setStatus('Carregado');
    } catch (e) {
      console.error('Failed to load', e);
      setStatus('Erro ao carregar', true);
    }
  }

  async function doSave(closeAfter) {
    const payload = readForm();
    if (!payload.title) { alert('Título é obrigatório'); return; }
    try {
      saveBtn.disabled = true; saveCloseBtn.disabled = true; setStatus('Salvando...');
      let res;
      if (id) {
        res = await fetch(`/api/activities/${encodeURIComponent(id)}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      } else {
        res = await fetch('/api/activities', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      }
      const j = await res.json().catch(()=>({}));
      if (res.ok && j.success) {
        localStorage.removeItem(draftKey);
        setStatus('Salvo com sucesso');
        if (closeAfter) {
          if (typeof navigateToModule === 'function') navigateToModule('techniques'); else window.location.href = '/modules/techniques/techniques.html';
        }
      } else {
        setStatus('Falha ao salvar', true); alert('Falha: ' + (j.error||j.message||res.statusText));
      }
    } catch(e) {
      console.error('Save error', e); setStatus('Erro ao salvar', true);
    } finally { saveBtn.disabled = false; saveCloseBtn.disabled = false; }
  }

  // simple ref autocomplete (search by title)
  let refTimer = 0;
  document.getElementById('technique-ref').addEventListener('input', (ev)=>{
    clearTimeout(refTimer);
    refTimer = window.setTimeout(async ()=>{
      const q = (ev.target.value||'').trim();
      if (!q) return;
      try {
        const res = await fetch(`/api/activities?type=TECHNIQUE&q=${encodeURIComponent(q)}&page=1&pageSize=6`);
        const j = await res.json().catch(()=>({}));
        const items = (j && j.data) || [];
        // show simple list below input
        let list = document.getElementById('technique-ref-list');
        if (!list) { list = document.createElement('div'); list.id = 'technique-ref-list'; list.className='ref-list'; document.getElementById('technique-ref').parentElement.appendChild(list); }
        list.innerHTML = items.map(it=>`<div class="ref-item" data-id="${it.id}">${escapeHtml(it.title||it.name||it.id)}</div>`).join('');
        list.querySelectorAll('.ref-item').forEach(el=>el.addEventListener('click', (e)=>{ document.getElementById('technique-ref').value = e.target.dataset.id; list.remove(); }));
      } catch(e){ }
    }, 300);
  });

  // events
  saveBtn.addEventListener('click', ()=>doSave(false));
  saveCloseBtn.addEventListener('click', ()=>doSave(true));
  cancelBtn.addEventListener('click', ()=>{ if (confirm('Descartar alterações?')) { if (typeof navigateToModule === 'function') navigateToModule('techniques'); else window.location.href='/modules/techniques/techniques.html'; }});
  backBtn?.addEventListener('click', ()=>{ if (typeof navigateToModule === 'function') navigateToModule('techniques'); else window.location.href='/modules/techniques/techniques.html'; });

  // auto-save interval
  setInterval(saveDraft, 15000);

  await loadCourses();
  loadDraft();
  if (id) await load(id);
}

// expose for module loader
window.initializeTechniqueEditor = initializeTechniqueEditor;
