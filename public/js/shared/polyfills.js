// Polyfills for older browsers
if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
}

if (!Element.prototype.closest) {
    Element.prototype.closest = function(s) {
        var el = this;
        do {
            if (Element.prototype.matches.call(el, s)) return el;
            el = el.parentElement || el.parentNode;
        } while (el !== null && el.nodeType === 1);
        return null;
    };
}

// Promise polyfill for very old browsers
if (typeof Promise === 'undefined') {
    // Simple Promise polyfill - in production, use a proper polyfill library
    window.Promise = function(executor) {
        // Basic implementation for compatibility
        this.then = function() { return this; };
        this.catch = function() { return this; };
        executor(() => {}, () => {});
    };
}