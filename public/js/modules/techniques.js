// Techniques module - isolated in /public/js/modules
import { fetchTechniques } from '/js/modules/activities.js';

let techniques = [];
export async function initializeTechniquesModule() {
  const root = document.getElementById('techniques-root');
  if (!root) return;

  const listEl = document.getElementById('techniques-list');
  const searchEl = document.getElementById('techniques-search');
  const refreshBtn = document.getElementById('techniques-refresh');
  const detailPage = document.getElementById('technique-detail-page');
  const listPage = document.getElementById('techniques-list-page');
  const detailEl = document.getElementById('technique-detail');
  const backBtn = document.getElementById('techniques-back-btn');

  async function load() {
    try {
      techniques = await fetchTechniques();
      renderList(techniques);
    } catch (e) {
      listEl.innerHTML = '<div class="error">Falha ao carregar técnicas</div>';
    }
  }

  function renderList(items) {
    if (!listEl) return;
    listEl.innerHTML = items.map(t => (`<div class="technique-card" data-id="${t.id}"><h3>${escapeHtml(t.title || t.name || 'Sem nome')}</h3><p>${escapeHtml((t.description||'').slice(0,120))}</p></div>`)).join('');
  }

  function showDetail(id) {
    const t = techniques.find(x => x.id === id);
    if (!t) return;
    listPage.style.display = 'none';
    detailPage.style.display = '';
    backBtn.style.display = '';
    detailEl.innerHTML = `<h2>${escapeHtml(t.title||t.name)}</h2><p>${escapeHtml(t.description||'')}</p><pre>${escapeHtml(JSON.stringify(t.defaultParams||{},null,2))}</pre>`;
  }

  listEl?.addEventListener('click', (e) => {
    const card = (e.target as HTMLElement).closest('.technique-card');
    if (!card) return;
    const id = card.getAttribute('data-id');
    if (id) showDetail(id);
  });

  backBtn?.addEventListener('click', () => {
    detailPage.style.display = 'none';
    listPage.style.display = '';
    backBtn.style.display = 'none';
  });

  searchEl?.addEventListener('input', () => {
    const q = (searchEl.value||'').toLowerCase().trim();
    renderList(techniques.filter(t => (t.title||t.name||'').toLowerCase().includes(q) || (t.description||'').toLowerCase().includes(q)));
  });

  refreshBtn?.addEventListener('click', load);

  load();
}

// minimal HTML escape helper
function escapeHtml(s){ return (s+'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[c]); }

// Auto-init for SPA pages
window.initializeTechniquesModule = initializeTechniquesModule;
