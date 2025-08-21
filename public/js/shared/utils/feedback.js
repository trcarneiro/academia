// Shared Feedback Utilities (Design System compliant)
// Provides accessible toasts, inline errors, and loading states for buttons
(function(){
  if (window.feedback) return; // idempotent

  function ensureToastContainer(){
    let c = document.getElementById('toast-container');
    if (!c) {
      c = document.createElement('div');
      c.id = 'toast-container';
      c.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:99999;display:flex;flex-direction:column;gap:8px;max-width:92vw;';
      document.body.appendChild(c);
    }
    return c;
  }

  function toast(message, type='info', opts={}){
    try{
      const container = ensureToastContainer();
      const el = document.createElement('div');
      el.setAttribute('role','alert');
      el.setAttribute('aria-live','assertive');
      el.style.cssText = 'padding:10px 14px;border-radius:10px;color:#fff;box-shadow:0 6px 20px rgba(0,0,0,.25);font-weight:600;display:flex;align-items:center;gap:8px;';
      const colors = { success:'#16a34a', error:'#dc2626', info:'#2563eb', warning:'#d97706' };
      el.style.background = colors[type] || colors.info;
      el.textContent = String(message || '');
      container.appendChild(el);
      const ttl = opts.ttl ?? 3500;
      setTimeout(()=>{ try{ el.remove(); }catch(_){} }, ttl);
    }catch(err){ console.error('[feedback.toast] failed', err); }
  }

  function showError(message){ toast(message || 'Ocorreu um erro.', 'error'); }
  function showSuccess(message){ toast(message || 'Operação realizada com sucesso.', 'success'); }
  function showInfo(message){ toast(message || '', 'info'); }
  function showWarning(message){ toast(message || '', 'warning'); }

  function setButtonLoading(btn, isLoading, labelWhenDone){
    if (!btn) return;
    try{
      if (isLoading){
        btn.dataset.prevText = btn.textContent;
        btn.disabled = true;
        btn.setAttribute('aria-busy','true');
        btn.textContent = '⏳ Aguarde...';
      } else {
        btn.disabled = false;
        btn.removeAttribute('aria-busy');
        if (labelWhenDone) btn.textContent = labelWhenDone;
        else if (btn.dataset.prevText) btn.textContent = btn.dataset.prevText;
        delete btn.dataset.prevText;
      }
    }catch(_){}
  }

  function setInlineError(containerSelector, message){
    try{
      const c = typeof containerSelector === 'string' ? document.querySelector(containerSelector) : containerSelector;
      if (!c) return showError(message);
      let el = c.querySelector('[data-inline-error]');
      if (!el){
        el = document.createElement('div');
        el.dataset.inlineError = 'true';
        el.setAttribute('role','alert');
        el.className = 'module-isolated-text-error module-isolated-mt-sm';
        c.prepend(el);
      }
      el.textContent = message || '';
    }catch(e){ console.warn('setInlineError failed', e); }
  }

  window.feedback = { toast, showError, showSuccess, showInfo, showWarning, setButtonLoading, setInlineError };
})();
