// Lightweight students listing module with best-effort UX
// Exported functions: init(target), destroy()

const API_URL = '/api/students';
const PAGE_SIZE = 25;
let container = null;
let listRoot = null;
let statusBar = null;
let loaderObserver = null;
let currentPage = 1;
let totalLoaded = 0;
let isLoading = false;
let finished = false;
let query = '';
let abortController = null;
let globalKeydownHandler = null;

function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(props).forEach(([k, v]) => {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('data-')) node.setAttribute(k, String(v));
    else node[k] = v;
  });
  children.flat().forEach(c => { if (c == null) return; node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
  return node;
}

function formatDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('pt-BR'); } catch (e) { return d; }
}

function renderSkeleton() {
  const skeleton = el('div', { class: 'students-skeleton' });
  for (let i = 0; i < 6; i++) {
    const card = el('div', { class: 'student-card skeleton', role: 'article', 'aria-busy': 'true' },
      el('div', { class: 'student-avatar' }, ' '),
      el('div', { class: 'student-info' },
        el('div', { class: 'student-name' }, ' '),
        el('div', { class: 'student-meta' }, ' ')
      )
    );
    skeleton.appendChild(card);
  }
  return skeleton;
}

function renderEmpty() {
  const box = el('div', { class: 'students-empty' },
    el('div', { class: 'empty-illustration' }, '👥'),
    el('div', { class: 'empty-title' }, 'Nenhum aluno encontrado'),
    el('div', { class: 'empty-text' }, 'Tente ajustar o filtro ou adicione novos alunos no sistema.')
  );
  return box;
}

function renderError(message) {
  const box = el('div', { class: 'students-error', role: 'alert' },
    el('strong', {}, 'Erro: '),
    el('span', {}, message || 'Falha ao carregar alunos')
  );

  const actions = el('div', { class: 'students-error-actions' });
  const retryBtn = el('button', { class: 'students-retry', type: 'button' }, 'Tentar novamente');
  retryBtn.addEventListener('click', () => {
    // if nothing loaded yet, do a full reset; otherwise try next page
    if (totalLoaded === 0) resetAndLoad(); else loadNext();
  });
  actions.appendChild(retryBtn);
  box.appendChild(actions);

  return box;
}

function createToolbar() {
  const search = el('input', { type: 'search', placeholder: 'Pesquisar por nome ou email…', class: 'students-search', 'aria-label': 'Pesquisar alunos' });
  const count = el('div', { id: 'studentsCount', class: 'students-count', role: 'status', 'aria-live': 'polite' }, 'Carregando...');

  // debounce
  let t = null;
  search.addEventListener('input', (e) => {
    clearTimeout(t);
    t = setTimeout(() => {
      query = String(search.value || '').trim();
      resetAndLoad();
    }, 300);
  });

  // keyboard: slash to focus
  // store handler so we can remove it on destroy
  if (globalKeydownHandler) window.removeEventListener('keydown', globalKeydownHandler);
  globalKeydownHandler = (ev) => {
    if (ev.key === '/') {
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;
      ev.preventDefault();
      search.focus();
    }
  };
  window.addEventListener('keydown', globalKeydownHandler);

  // link search to list for accessibility (will match list id set in init)
  search.setAttribute('aria-controls', 'studentsList');

  const toolbar = el('div', { class: 'students-toolbar' }, search, count);
  return { toolbar, search, count };
}

async function fetchPage(page = 1) {
  if (isLoading || finished) return [];
  isLoading = true;
  abortController?.abort();
  abortController = new AbortController();
  const params = new URLSearchParams({ _page: String(page), _limit: String(PAGE_SIZE) });
  if (query) params.set('q', query);
  const url = `${API_URL}?${params.toString()}`;

  try {
    const res = await fetch(url, { signal: abortController.signal });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const payload = await res.json();
    // normalize: backend may return { data: [] } or array
    const items = Array.isArray(payload.data) ? payload.data : (Array.isArray(payload) ? payload : (payload.success && Array.isArray(payload.data) ? payload.data : []));
    // if fewer than PAGE_SIZE returned, consider finished
    if (items.length < PAGE_SIZE) finished = true;
    totalLoaded += items.length;
    return items;
  } catch (err) {
    if (err.name === 'AbortError') return [];
    throw err;
  } finally {
    isLoading = false;
  }
}

function studentCard(item) {
  const avatar = el('div', { class: 'student-avatar' }, (item.user?.firstName?.charAt(0) || '') + (item.user?.lastName?.charAt(0) || ''));
  const nameId = `student-name-${item.id}`;
  const name = el('div', { id: nameId, class: 'student-name' }, (item.user?.firstName || '') + ' ' + (item.user?.lastName || ''));
  const meta = el('div', { class: 'student-meta' }, item.user?.email || '—', ' · ', item.plan?.name || '—');
  const footer = el('div', { class: 'student-footer' }, formatDate(item.createdAt));

  const card = el('article', { class: 'student-card', tabindex: '0', role: 'listitem', 'data-id': item.id, 'aria-labelledby': nameId }, avatar, el('div', { class: 'student-body' }, name, meta, footer));

  // accessible click + keyboard enter
  card.addEventListener('click', () => {
    // small UX: highlight then open detail if present
    card.classList.add('active');
    setTimeout(() => card.classList.remove('active'), 300);

    // persist navigation state so the Student Editor can read it on init
    try {
      localStorage.setItem('studentEditorMode', JSON.stringify({ mode: 'edit', studentId: item.id, timestamp: Date.now() }));
    } catch (e) {
      // ignore storage errors
    }

    const params = { id: item.id };
    if (typeof window.navigateToModule === 'function') {
      try {
        // prefer SPA navigation with params
        window.navigateToModule('student-editor', params);
      } catch (e) {
        // fall through to URL fallback
        console.warn('navigateToModule failed, falling back to full load', e);
      }

      // If the editor code is already loaded, initialize it (id will be picked from localStorage)
      if (typeof window.initializeStudentEditor === 'function') {
        try {
          // slight delay to allow module loader to attach if it is in progress
          setTimeout(() => { window.initializeStudentEditor(); }, 50);
        } catch (e) { /* noop */ }
      }

      return;
    }

    // final fallback: open the editor view with query string
    window.location.href = `/views/student-editor.html?id=${item.id}`;
  });

  card.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') { ev.preventDefault(); card.click(); return; }
    if (ev.key === 'ArrowDown') { ev.preventDefault(); const next = card.nextElementSibling; if (next) next.focus(); return; }
    if (ev.key === 'ArrowUp') { ev.preventDefault(); const prev = card.previousElementSibling; if (prev) prev.focus(); return; }
    if (ev.key === 'Home') { ev.preventDefault(); const first = card.parentElement.querySelector('.student-card'); if (first) first.focus(); return; }
    if (ev.key === 'End') { ev.preventDefault(); const last = card.parentElement.querySelector('.student-card:last-of-type'); if (last) last.focus(); return; }
  });

  return card;
}

async function loadNext() {
  if (!listRoot || finished) return;
  // append skeleton while loading
  const sk = renderSkeleton();
  listRoot.appendChild(sk);
  const prevTotal = totalLoaded;
  try {
    const items = await fetchPage(currentPage);
    sk.remove();
    if (items.length === 0 && totalLoaded === 0) {
      listRoot.appendChild(renderEmpty());
      finished = true;
      if (statusBar) statusBar.textContent = 'Nenhum aluno encontrado';
      return;
    }

    items.forEach(it => listRoot.appendChild(studentCard(it)));
    currentPage += 1;
    if (statusBar) statusBar.textContent = `Exibindo ${totalLoaded} alunos`;

    // focus first card on initial load for keyboard users
    if (prevTotal === 0 && totalLoaded > 0) {
      const first = listRoot.querySelector('.student-card');
      if (first) first.focus();
    }

    // if not finished, observe the last card
    observeLast();
  } catch (err) {
    sk.remove();
    console.error('loadNext error', err);
    listRoot.appendChild(renderError(err.message));
    finished = true;
    if (statusBar) statusBar.textContent = 'Falha ao carregar';
  }
}

function observeLast() {
  if (!loaderObserver || !listRoot) return;
  // disconnect previous
  loaderObserver.disconnect();
  const last = listRoot.querySelector('.student-card:last-of-type');
  if (last && !finished) loaderObserver.observe(last);
}

function resetAndLoad() {
  // reset pagination state
  currentPage = 1;
  totalLoaded = 0;
  finished = false;
  if (listRoot) listRoot.innerHTML = '';
  if (statusBar) statusBar.textContent = 'Carregando...';
  loadNext();
}

export async function init(target) {
  try {
    container = typeof target === 'string' ? document.querySelector(target) : target;
    if (!container) throw new Error('Container not found');

    // build layout
    container.classList.add('students-isolated-root');
    const header = el('header', { class: 'students-header' });
    const { toolbar, search, count } = createToolbar();
    header.appendChild(toolbar);

    statusBar = count;

    listRoot = el('div', { id: 'studentsList', class: 'students-list', role: 'list', 'aria-label': 'Lista de alunos' });

    container.innerHTML = '';
    container.appendChild(header);
    container.appendChild(listRoot);

    // intersection observer for infinite scroll
    loaderObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !isLoading) loadNext();
      });
    }, { root: null, rootMargin: '300px', threshold: 0.1 });

    // initial load
    resetAndLoad();

    console.log('✅ Students listing initialized');
  } catch (err) {
    console.error('Students init error', err);
    if (container) container.innerHTML = '';
    // show inline error when possible
    if (container) container.appendChild(renderError(err.message || 'Erro desconhecido'));
    throw err;
  }
}

export function destroy() {
  if (abortController) { abortController.abort(); abortController = null; }
  if (loaderObserver) { loaderObserver.disconnect(); loaderObserver = null; }
  if (globalKeydownHandler) { window.removeEventListener('keydown', globalKeydownHandler); globalKeydownHandler = null; }
  if (container) container.classList.remove('students-isolated-root');
  if (container) container.innerHTML = '';
  container = listRoot = statusBar = null;
  currentPage = 1; totalLoaded = 0; isLoading = false; finished = false; query = '';
}

// auto-init when view is injected (dashboard loads HTML then appends this module script)
(function tryAutoInit() {
  // look for known container id inside views/students.html -> #studentsContainer or #studentsList
  const possible = document.querySelector('#studentsContainer') || document.querySelector('#studentsList') || document.querySelector('[data-students-target]');
  if (possible) init(possible).catch(()=>{});
})();

// Ensure module CSS is loaded via a dedicated stylesheet for caching, theming and CSP
(function ensureStyles() {
  if (document.getElementById('studentsModuleStylesLink')) return;
  try {
    const link = document.createElement('link');
    link.id = 'studentsModuleStylesLink';
    link.rel = 'stylesheet';
    link.href = '/css/modules/students.css';
    // Optional SRI/integrity and nonce support: set globals in server or loader if you want them applied
    if (window.__STUDENTS_CSS_INTEGRITY) link.integrity = window.__STUDENTS_CSS_INTEGRITY;
    if (window.__STUDENTS_CSS_NONCE) link.setAttribute('nonce', window.__STUDENTS_CSS_NONCE);
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  } catch (e) {
    // Fallback: if link insertion fails, log and continue. No inline style injection is performed to favor caching.
    console.warn('Falha ao adicionar stylesheet link para módulo de alunos', e);
  }
})();
