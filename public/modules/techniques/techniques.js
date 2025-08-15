import { fetchTechniques } from '/js/modules/activities.js';

// Initialize when techniques.html is loaded
document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('techniques-root');
  if (!root) return;
  initializeTechniques();
});

let techniques = [];
async function initializeTechniques() {
  const listEl = document.getElementById('techniques-list');
  const searchEl = document.getElementById('techniques-search');
  const refreshBtn = document.getElementById('techniques-refresh');
  const newBtn = document.getElementById('techniques-new');

  // pagination state
  let page = 1;
  let pageSize = 20;
  let total = 0;
  let q = '';

  // create pagination UI
  let paginationEl = document.getElementById('techniques-pagination');
  if (!paginationEl) {
    paginationEl = document.createElement('div');
    paginationEl.id = 'techniques-pagination';
    paginationEl.className = 'techniques-pagination';
    paginationEl.style.display = 'flex';
    paginationEl.style.justifyContent = 'center';
    paginationEl.style.gap = '8px';
    paginationEl.style.marginTop = '12px';
    listEl?.parentElement?.appendChild(paginationEl);
  }

  // create header info element
  let infoEl = document.getElementById('techniques-info');
  if (!infoEl) {
    infoEl = document.createElement('div');
    infoEl.id = 'techniques-info';
    infoEl.style.marginTop = '8px';
    listEl?.parentElement?.insertBefore(infoEl, paginationEl);
  }

  // sorting state
  let sortField = 'createdAt';
  let sortOrder = 'desc';

  // add sorting/import controls in header (ensure we can attach even if .techniques-actions is missing)
  let headerActions = document.querySelector('.techniques-actions');
  if (!headerActions) {
    // try to find a sensible header container: prefer the parent of the new button, refresh button, or the search field
    headerActions = newBtn?.parentElement || refreshBtn?.parentElement || searchEl?.parentElement || document.querySelector('#techniques-root');
    if (headerActions && !headerActions.classList.contains('techniques-actions')) {
      headerActions.classList.add('techniques-actions');
    }
  }
  if (headerActions && !document.getElementById('techniques-sort')) {
    const sortSelect = document.createElement('select');
    sortSelect.id = 'techniques-sort';
    sortSelect.innerHTML = '<option value="createdAt">Mais recentes</option><option value="title">Título</option><option value="difficulty">Dificuldade</option>';
    const orderBtn = document.createElement('button');
    orderBtn.id = 'techniques-order-btn';
    orderBtn.className = 'btn btn-light';
    orderBtn.textContent = '↓';
    // import button + hidden file input
    const importBtn = document.createElement('button');
    importBtn.id = 'techniques-import-btn';
    importBtn.className = 'btn btn-primary';
    importBtn.textContent = 'Importar técnica';
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json,application/json';
    fileInput.style.display = 'none';
    headerActions.appendChild(sortSelect);
    headerActions.appendChild(orderBtn);
    headerActions.appendChild(importBtn);
    headerActions.appendChild(fileInput);
    importBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async (ev) => {
      const f = (ev.target || {}).files && ev.target.files[0];
      if (!f) return;
      try {
        importBtn.disabled = true;
        importBtn.textContent = 'Importando...';
        const text = await f.text();
        const parsed = JSON.parse(text);
        const arr = Array.isArray(parsed) ? parsed : (parsed.items || [parsed]);
        let created = 0, updated = 0, skipped = 0, failed = 0;
        for (const item of arr) {
          // normalize minimal payload for technique
          const payload = {
            type: 'TECHNIQUE',
            title: item.title || item.name || item.titulo || '',
            description: item.description || item.descricao || item.content || null,
            difficulty: item.difficulty != null ? (typeof item.difficulty === 'string' ? Number(item.difficulty) : item.difficulty) : null,
            refTechniqueId: item.refTechniqueId || null,
            equipment: item.equipment || item.equipments || null,
            adaptations: item.adaptations || null
          };
          // skip empty title
          if (!payload.title) { skipped++; continue; }
          try {
            const res = await fetch('/api/activities', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (res.status === 201) created++; else if (res.status === 200) updated++; else if (res.status === 409) skipped++; else failed++;
          } catch (err) {
            failed++;
          }
        }
        alert(`Importação concluída:\nCriadas: ${created}\nAtualizadas: ${updated}\nPuladas: ${skipped}\nFalha: ${failed}`);
        await load();
      } catch (err) {
        alert('Falha ao processar o ficheiro: ' + (err && err.message ? err.message : String(err)));
      } finally {
        importBtn.disabled = false;
        importBtn.textContent = 'Importar técnica';
        fileInput.value = '';
      }
    });
    sortSelect.addEventListener('change', (e) => { sortField = (e.target.value || 'createdAt'); page = 1; load(); });
    orderBtn.addEventListener('click', () => { sortOrder = (sortOrder === 'asc') ? 'desc' : 'asc'; orderBtn.textContent = sortOrder === 'asc' ? '↑' : '↓'; page = 1; load(); });
  }

  function renderPagination() {
    if (!paginationEl) return;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    paginationEl.innerHTML = `
      <button id="techniques-prev" class="btn btn-light" ${page<=1? 'disabled':''}>Anterior</button>
      <div style="display:flex;align-items:center;gap:8px;padding:4px 8px">Página <strong id="techniques-page">${page}</strong> de <strong id="techniques-total-pages">${totalPages}</strong></div>
      <button id="techniques-next" class="btn btn-light" ${page>=totalPages? 'disabled':''}>Próxima</button>
      <select id="techniques-page-size" style="margin-left:8px"><option>10</option><option>20</option><option>50</option><option>100</option></select>
    `;
    const prev = document.getElementById('techniques-prev');
    const next = document.getElementById('techniques-next');
    const pageSizeEl = document.getElementById('techniques-page-size');
    if (pageSizeEl) pageSizeEl.value = String(pageSize);
    prev?.addEventListener('click', () => { if (page>1) { page--; load(); } });
    next?.addEventListener('click', () => { const totalPages = Math.max(1, Math.ceil(total / pageSize)); if (page<totalPages) { page++; load(); } });
    pageSizeEl?.addEventListener('change', (e) => { pageSize = Number((e.target || {}).value) || 20; page = 1; load(); });
  }

  function renderList(items) {
    if (!listEl) return;
    listEl.innerHTML = items.map(t => (`<div class="technique-card" data-id="${t.id}"><h3>${escapeHtml(t.title || t.name || 'Sem nome')}</h3><p>${escapeHtml((t.description||'').slice(0,120))}</p></div>`)).join('');
    // update info
    if (infoEl) infoEl.textContent = `Mostrando ${items.length} de ${total} técnicas`;
  }

  async function load() {
    try {
      listEl.innerHTML = '<div class="loading">Carregando...</div>';
      const resp = await fetchTechniques({ page, pageSize, q, sortField, sortOrder });
      const items = resp.items || [];
      total = resp.count || 0;
      renderList(items);
      renderPagination();
    } catch (e) {
      listEl.innerHTML = '<div class="error">Falha ao carregar técnicas</div>';
    }
  }

  // debounce helper for search
  let searchTimer = 0;
  searchEl?.addEventListener('input', () => {
    q = (searchEl.value||'').toLowerCase().trim();
    clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => { page = 1; load(); }, 300);
  });

  refreshBtn?.addEventListener('click', load);
  newBtn?.addEventListener('click', () => openEditor());

  load();
}

function openEditor(id){
  // Navigate to editor page or open editor view; for now redirect to techniques-editor.html with id param
  const url = '/modules/techniques/techniques-editor.html' + (id ? `?id=${encodeURIComponent(id)}` : '');
  window.location.href = url;
}

function escapeHtml(s){ return (s+'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[c]); }

// Expose for modular loader (scripts loaded as type="module" don't create globals)
if (typeof window !== 'undefined') {
  window.initializeTechniques = initializeTechniques;
  window.openTechniqueEditor = openEditor;
}
