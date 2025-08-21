export function showLoading(selector, message = 'Carregando...') {
  try {
    const el = document.querySelector(selector);
    if (!el) return null;
    // Save original content so we can restore later
    if (el.__originalContent === undefined) el.__originalContent = el.innerHTML;
    el.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;padding:2rem;color:#64748B;">
        <div class="loading-spinner" style="width:32px;height:32px;border:3px solid #334155;border-top:3px solid #3B82F6;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto"></div>
        <div style="margin-top:1rem;font-size:0.875rem;">${message}</div>
      </div>
    `;
    return el.__originalContent;
  } catch (e) {
    console.error('showLoading error', e);
    return null;
  }
}

export function hideLoading(selector) {
  try {
    const el = document.querySelector(selector);
    if (!el) return;
    if (el.__originalContent !== undefined) {
      el.innerHTML = el.__originalContent;
      delete el.__originalContent;
    }
  } catch (e) {
    console.error('hideLoading error', e);
  }
}
