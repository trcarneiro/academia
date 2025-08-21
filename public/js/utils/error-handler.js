export function handleApiError(err, selector = null) {
  console.error('API Error:', err);
  const message = err?.message || 'Erro no servidor';
  if (selector) {
    const el = document.querySelector(selector);
    if (el) el.innerHTML = `<div style="color:#EF4444;padding:1rem;border-radius:8px;background:#FFF5F5">${message}</div>`;
  } else if (window.showToast) {
    window.showToast(message, 'error');
  } else {
    alert(message);
  }
}
