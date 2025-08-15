// lesson-plans.js
// Módulo de Planos de Aulas

(function() {
    let state = { plans: [], selectedPlan: null, items: [], catalog: [], dirty:false };

    function el(html){ const t=document.createElement('template'); t.innerHTML=html.trim(); return t.content.firstChild; }
    function $(sel,root=document){ return root.querySelector(sel); }
    function $all(sel,root=document){ return Array.from(root.querySelectorAll(sel)); }

    async function api(path, opts) {
        const res = await fetch(path, Object.assign({ headers: { 'Content-Type':'application/json' } }, opts));
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    }

    function renderList(container){
        container.innerHTML = `
            <div class="lesson-plans-container">
                <div class="lesson-plans-header">
                    <h2>Planos de Aula</h2>
                    <div>
                        <button id="newPlanBtn" class="btn btn-primary"><span class="icon">＋</span>Novo Plano</button>
                    </div>
                </div>
                <div class="lesson-plans-filters">
                    <select id="courseFilter" class="form-select"><option value="">Todos os cursos</option></select>
                </div>
                <div id="plansGrid" class="lesson-plans-grid"></div>
                <div id="emptyState" class="empty-state" style="display:none;">
                    <p>Nenhum plano de aula encontrado.</p>
                    <button class="btn btn-outline" id="createFirstPlan">Criar primeiro plano</button>
                </div>
            </div>`;

        const grid = $('#plansGrid', container);
        if (!state.plans.length) {
            $('#emptyState', container).style.display = 'block';
        } else {
            state.plans.forEach(p => {
                const card = el(`
                    <div class="lp-card">
                        <div class="lp-card-head">
                            <div>
                                <div class="lp-title">${p.name || 'Sem nome'}</div>
                                <div class="lp-sub">Curso: ${p.course?.name || p.courseId || '-'}</div>
                            </div>
                        </div>
                        <div class="lp-card-body">${p.description || ''}</div>
                        <div class="lp-card-actions">
                            <button class="btn btn-outline" data-act="edit" data-id="${p.id}">✏️ Editar</button>
                            <button class="btn btn-outline" data-act="activities" data-id="${p.id}">🧩 Atividades</button>
                        </div>
                    </div>`);
                grid.appendChild(card);
            });
        }

        grid.addEventListener('click', (e)=>{
            const btn = e.target.closest('button[data-act]');
            if (!btn) return;
            const id = btn.getAttribute('data-id');
            if (btn.dataset.act === 'activities') openActivities(container, id);
            // basic edit can be wired later
        });
    }

    function renderActivities(container){
        container.innerHTML = `
            <div class="lp-activities">
                <div class="lp-activities-head">
                    <button id="backToList" class="btn btn-outline">← Voltar</button>
                    <div class="lp-plan-title">${state.selectedPlan?.name || 'Plano'}</div>
                    <div class="lp-actions">
                        <label class="btn btn-light" for="lpFileImport" style="margin-right:6px;">Importar JSON</label>
                        <input id="lpFileImport" type="file" accept="application/json" style="display:none;" />
                        <button id="exportActivities" class="btn btn-light">Exportar JSON</button>
                        <button id="discardChanges" class="btn btn-outline" ${state.dirty?'':'disabled'}>Descartar</button>
                        <button id="saveActivities" class="btn btn-primary" ${state.dirty?'':'disabled'}>Salvar</button>
                    </div>
                </div>
                <div class="lp-activities-layout">
                    <aside class="lp-catalog">
                        <div class="lp-section-title">Catálogo de Atividades</div>
                        <div class="lp-catalog-search"><input id="catalogSearch" type="search" placeholder="Buscar atividade..."></div>
                        <ul id="catalogList" class="lp-list"></ul>
                    </aside>
                    <main class="lp-items">
                        <div class="lp-section-title">Atividades do Plano</div>
                        <ul id="itemsList" class="lp-list droppable"></ul>
                    </main>
                </div>
            </div>`;

        const catalogList = $('#catalogList', container);
        const itemsList = $('#itemsList', container);

        // render catalog
        catalogList.innerHTML = '';
        state.catalog.forEach(a => {
            const li = el(`<li class="lp-row" draggable="true" data-id="${a.id}">
                <div>
                    <div class="lp-row-title">${a.title}</div>
                    <div class="lp-row-sub">${a.type}</div>
                </div>
                <button class="btn btn-light" data-add="${a.id}">Adicionar</button>
            </li>`);
            catalogList.appendChild(li);
        });

        // render items
        redrawItems(itemsList);

        // events
        $('#backToList', container).onclick = () => showList(container);
        $('#discardChanges', container).onclick = () => { state.dirty=false; openActivities(container, state.selectedPlan.id); };
        $('#saveActivities', container).onclick = () => saveActivities(container);
        $('#exportActivities', container).onclick = () => exportCurrentItems();
        $('#lpFileImport', container).onchange = (e)=> importItemsFromFile(e.target?.files?.[0]);
        catalogList.addEventListener('click', (e)=>{
            const btn = e.target.closest('button[data-add]');
            if (!btn) return;
            const activityId = btn.getAttribute('data-add');
            addItem(activityId); redrawItems(itemsList); markDirty(container);
        });

        // simple item controls
        itemsList.addEventListener('click',(e)=>{
            const up = e.target.closest('[data-up]');
            const down = e.target.closest('[data-down]');
            const del = e.target.closest('[data-del]');
            if (up||down||del){
                const id = (up||down||del).dataset.up || (up||down||del).dataset.down || (up||down||del).dataset.del;
                const idx = state.items.findIndex(i=>i._uid===id);
                if (idx<0) return;
                if (up && idx>0){ const tmp=state.items[idx-1]; state.items[idx-1]=state.items[idx]; state.items[idx]=tmp; }
                if (down && idx<state.items.length-1){ const tmp=state.items[idx+1]; state.items[idx+1]=state.items[idx]; state.items[idx]=tmp; }
                if (del){ state.items.splice(idx,1); }
                redrawItems(itemsList); markDirty(container);
            }
        });
    }

    function redrawItems(ul){
        ul.innerHTML = '';
        state.items.forEach((it, idx)=>{
            if (!it._uid) it._uid = crypto.randomUUID();
            const li = el(`<li class="lp-row" data-uid="${it._uid}">
                <div>
                    <div class="lp-row-title">${it.activity?.title || it.activityTitle || it.activityId}</div>
                    <div class="lp-row-sub">Ordem ${idx+1} • Segmento: <select data-field="segment">
                        <option value="WARMUP" ${it.segment==='WARMUP'?'selected':''}>Aquecimento</option>
                        <option value="STRETCH" ${it.segment==='STRETCH'?'selected':''}>Alongamento</option>
                        <option value="TECHNIQUE" ${it.segment==='TECHNIQUE'?'selected':''}>Técnica</option>
                        <option value="DRILL" ${it.segment==='DRILL'?'selected':''}>Drill</option>
                        <option value="SIMULATION" ${it.segment==='SIMULATION'?'selected':''}>Simulação</option>
                        <option value="COOLDOWN" ${it.segment==='COOLDOWN'?'selected':''}>Volta à calma</option>
                    </select></div>
                </div>
                <div class="lp-item-actions">
                    <button class="btn btn-light" data-up="${it._uid}">↑</button>
                    <button class="btn btn-light" data-down="${it._uid}">↓</button>
                    <button class="btn btn-light" data-del="${it._uid}">✕</button>
                </div>
            </li>`);
            ul.appendChild(li);
            // Bind select change
            li.querySelector('select[data-field="segment"]').onchange = (e)=>{ it.segment = e.target.value; markDirty(); };
        });
    }

    function markDirty(container){ state.dirty = true; const saveBtn = container && container.querySelector('#saveActivities'); if (saveBtn){ saveBtn.disabled = false; $('#discardChanges', container).disabled=false; } }

    function addItem(activityId){
        const act = state.catalog.find(a=>a.id===activityId);
        state.items.push({ activityId, segment: 'TECHNIQUE', ord: state.items.length+1, activity: act });
    }

    async function saveActivities(container){
        const planId = state.selectedPlan.id;
        const payload = { items: state.items.map((it,idx)=>({ activityId: it.activityId || it.activity?.id, segment: it.segment||'TECHNIQUE', ord: idx+1 })) };
        await api(`/api/lesson-plans/${planId}/activities`, { method:'POST', body: JSON.stringify(payload) });
        state.dirty=false; if (container){ $('#saveActivities', container).disabled=true; $('#discardChanges', container).disabled=true; }
    }

    function exportCurrentItems(){
        const items = state.items.map((it, idx)=>({ activityId: it.activityId || it.activity?.id, segment: it.segment || 'TECHNIQUE', ord: idx+1 }));
        const blob = new Blob([JSON.stringify({ items }, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${(state.selectedPlan?.name||'plano').replace(/\s+/g,'-').toLowerCase()}-items.json`;
        a.click();
        URL.revokeObjectURL(a.href);
    }

    async function importItemsFromFile(file){
        try{
            if (!file) return;
            const text = await file.text();
            const data = JSON.parse(text);
            if (!Array.isArray(data.items)) throw new Error('JSON inválido');
            state.items = data.items.map((it, idx)=>({ _uid: crypto.randomUUID(), activityId: it.activityId || it.activity?.id, segment: (it.segment || 'TECHNIQUE').toUpperCase(), ord: it.ord || idx+1 }));
            const container = document.querySelector('#lessonPlansContainer') || document.querySelector('.module-content');
            if (container) renderActivities(container);
            state.dirty = true;
        } catch(e){ alert('Falha ao importar JSON: ' + (e.message || e)); }
    }

    async function openActivities(container, id){
        const { data: plan } = await api(`/api/lesson-plans/${id}`);
        state.selectedPlan = plan;
        const itemsRes = await api(`/api/lesson-plans/${id}/activities`);
        state.items = (itemsRes.data || []).map(it=>({ _uid: crypto.randomUUID(), activityId: it.activityId, segment: it.segment, activity: it.activity }));
        const catalogRes = await api('/api/activities');
        state.catalog = catalogRes.data || catalogRes || [];
        state.dirty = false;
        renderActivities(container);
    }

    async function showList(container){
        state.selectedPlan = null; state.items = []; state.dirty=false;
        const res = await api('/api/lesson-plans');
        state.plans = res?.data || res || [];
        renderList(container);
    }

    window.initializeLessonPlansModule = async function(){
        const host = document.querySelector('#lessonPlansContainer') || document.querySelector('.module-content');
        if (!host) return;
        await showList(host);
    };
})();
