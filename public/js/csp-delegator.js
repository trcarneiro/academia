// CSP-safe event delegator for data-action attributes
// Usage: <button data-action="fnName" data-args='["arg1"]'>...</button>
// Calls window[fnName](...args) on click

document.addEventListener('DOMContentLoaded', function() {
  document.body.addEventListener('click', function(ev) {
    let el = ev.target;
    while (el && el !== document.body) {
      const fn = el.getAttribute('data-action');
      if (fn && typeof window[fn] === 'function') {
        let args = [];
        try {
          const raw = el.getAttribute('data-args');
          if (raw) args = JSON.parse(raw);
        } catch(e){}
        window[fn].apply(el, args);
        ev.preventDefault();
        return;
      }
      el = el.parentElement;
    }
  }, true);
});
