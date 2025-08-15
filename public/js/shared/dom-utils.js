/**
 * @fileoverview DOM Utilities
 * @version 1.0.0
 * @description DOM manipulation and utility functions
 */

// ==============================================
// DOM UTILITIES
// ==============================================

export class DOMUtils {
    constructor() {
        this.cache = new Map();
    }

    /**
     * Get element by selector with caching
     */
    getElement(selector, useCache = true) {
        if (useCache && this.cache.has(selector)) {
            const element = this.cache.get(selector);
            // Check if element is still in DOM
            if (document.contains(element)) {
                return element;
            } else {
                this.cache.delete(selector);
            }
        }

        const element = document.querySelector(selector);
        
        if (useCache && element) {
            this.cache.set(selector, element);
        }
        
        return element;
    }

    /**
     * Get multiple elements by selector
     */
    getElements(selector) {
        return Array.from(document.querySelectorAll(selector));
    }

    /**
     * Create element with attributes and children
     */
    createElement(tag, options = {}) {
        const element = document.createElement(tag);
        
        // Set attributes
        if (options.attributes) {
            Object.entries(options.attributes).forEach(([key, value]) => {
                element.setAttribute(key, value);
            });
        }
        
        // Set properties
        if (options.properties) {
            Object.assign(element, options.properties);
        }
        
        // Add classes
        if (options.classes) {
            const classes = Array.isArray(options.classes) ? options.classes : [options.classes];
            element.classList.add(...classes);
        }
        
        // Set text content
        if (options.text) {
            element.textContent = options.text;
        }
        
        // Set HTML content
        if (options.html) {
            element.innerHTML = options.html;
        }
        
        // Add event listeners
        if (options.events) {
            Object.entries(options.events).forEach(([event, handler]) => {
                element.addEventListener(event, handler);
            });
        }
        
        // Append children
        if (options.children) {
            const children = Array.isArray(options.children) ? options.children : [options.children];
            children.forEach(child => {
                if (typeof child === 'string') {
                    element.appendChild(document.createTextNode(child));
                } else {
                    element.appendChild(child);
                }
            });
        }
        
        return element;
    }

    /**
     * Wait for element to exist in DOM
     */
    waitForElement(selector, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            
            if (element) {
                resolve(element);
                return;
            }
            
            const observer = new MutationObserver((mutations, obs) => {
                const element = document.querySelector(selector);
                if (element) {
                    obs.disconnect();
                    resolve(element);
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            
            // Timeout fallback
            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Element ${selector} not found within ${timeout}ms`));
            }, timeout);
        });
    }

    /**
     * Wait for DOM content loaded
     */
    ready() {
        return new Promise(resolve => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    }

    /**
     * Show element with animation
     */
    show(element, animation = 'fade') {
        if (!element) return;
        
        element.style.display = '';
        
        switch (animation) {
            case 'fade':
                element.style.opacity = '0';
                element.style.transition = 'opacity 0.3s ease';
                requestAnimationFrame(() => {
                    element.style.opacity = '1';
                });
                break;
            case 'slide':
                element.style.height = '0';
                element.style.overflow = 'hidden';
                element.style.transition = 'height 0.3s ease';
                const fullHeight = element.scrollHeight;
                requestAnimationFrame(() => {
                    element.style.height = fullHeight + 'px';
                    setTimeout(() => {
                        element.style.height = '';
                        element.style.overflow = '';
                    }, 300);
                });
                break;
        }
    }

    /**
     * Hide element with animation
     */
    hide(element, animation = 'fade') {
        if (!element) return;
        
        switch (animation) {
            case 'fade':
                element.style.transition = 'opacity 0.3s ease';
                element.style.opacity = '0';
                setTimeout(() => {
                    element.style.display = 'none';
                }, 300);
                break;
            case 'slide':
                element.style.height = element.scrollHeight + 'px';
                element.style.overflow = 'hidden';
                element.style.transition = 'height 0.3s ease';
                requestAnimationFrame(() => {
                    element.style.height = '0';
                    setTimeout(() => {
                        element.style.display = 'none';
                    }, 300);
                });
                break;
            default:
                element.style.display = 'none';
        }
    }

    /**
     * Toggle element visibility
     */
    toggle(element, animation = 'fade') {
        if (!element) return;
        
        const isVisible = element.offsetParent !== null;
        
        if (isVisible) {
            this.hide(element, animation);
        } else {
            this.show(element, animation);
        }
        
        return !isVisible;
    }

    /**
     * Add event listener with automatic cleanup
     */
    addEventDelegate(parent, selector, event, handler) {
        const delegateHandler = (e) => {
            const target = e.target.closest(selector);
            if (target && parent.contains(target)) {
                handler.call(target, e);
            }
        };
        
        parent.addEventListener(event, delegateHandler);
        
        return () => parent.removeEventListener(event, delegateHandler);
    }

    /**
     * Debounced event listener
     */
    addDebouncedEvent(element, event, handler, delay = 300) {
        let timeoutId;
        
        const debouncedHandler = (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => handler(...args), delay);
        };
        
        element.addEventListener(event, debouncedHandler);
        
        return () => {
            clearTimeout(timeoutId);
            element.removeEventListener(event, debouncedHandler);
        };
    }

    /**
     * Throttled event listener
     */
    addThrottledEvent(element, event, handler, delay = 100) {
        let isThrottled = false;
        
        const throttledHandler = (...args) => {
            if (!isThrottled) {
                handler(...args);
                isThrottled = true;
                setTimeout(() => {
                    isThrottled = false;
                }, delay);
            }
        };
        
        element.addEventListener(event, throttledHandler);
        
        return () => element.removeEventListener(event, throttledHandler);
    }

    /**
     * Smooth scroll to element
     */
    scrollToElement(element, options = {}) {
        if (!element) return;
        
        const defaultOptions = {
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
        };
        
        element.scrollIntoView({ ...defaultOptions, ...options });
    }

    /**
     * Get element position relative to viewport
     */
    getElementPosition(element) {
        if (!element) return null;
        
        const rect = element.getBoundingClientRect();
        
        return {
            top: rect.top,
            left: rect.left,
            bottom: rect.bottom,
            right: rect.right,
            width: rect.width,
            height: rect.height,
            centerX: rect.left + rect.width / 2,
            centerY: rect.top + rect.height / 2
        };
    }

    /**
     * Check if element is in viewport
     */
    isInViewport(element, threshold = 0) {
        if (!element) return false;
        
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        const windowWidth = window.innerWidth || document.documentElement.clientWidth;
        
        return (
            rect.top >= -threshold &&
            rect.left >= -threshold &&
            rect.bottom <= windowHeight + threshold &&
            rect.right <= windowWidth + threshold
        );
    }

    /**
     * Animate element property
     */
    animate(element, properties, duration = 300, easing = 'ease') {
        if (!element) return Promise.resolve();
        
        return new Promise(resolve => {
            const startValues = {};
            const endValues = {};
            
            // Get initial values
            Object.keys(properties).forEach(prop => {
                const computedStyle = window.getComputedStyle(element);
                startValues[prop] = parseFloat(computedStyle[prop]) || 0;
                endValues[prop] = properties[prop];
            });
            
            const startTime = performance.now();
            
            function animate(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                let easedProgress;
                switch (easing) {
                    case 'ease-in':
                        easedProgress = progress * progress;
                        break;
                    case 'ease-out':
                        easedProgress = 1 - Math.pow(1 - progress, 2);
                        break;
                    case 'ease-in-out':
                        easedProgress = progress < 0.5 
                            ? 2 * progress * progress 
                            : 1 - Math.pow(-2 * progress + 2, 2) / 2;
                        break;
                    default: // linear
                        easedProgress = progress;
                }
                
                Object.keys(properties).forEach(prop => {
                    const startValue = startValues[prop];
                    const endValue = endValues[prop];
                    const currentValue = startValue + (endValue - startValue) * easedProgress;
                    
                    if (prop === 'opacity') {
                        element.style[prop] = currentValue;
                    } else {
                        element.style[prop] = currentValue + 'px';
                    }
                });
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            }
            
            requestAnimationFrame(animate);
        });
    }

    /**
     * Create loading spinner
     */
    createLoadingSpinner(size = 'medium') {
        const sizes = {
            small: '16px',
            medium: '24px',
            large: '32px'
        };
        
        return this.createElement('div', {
            classes: ['loading-spinner', `spinner-${size}`],
            attributes: {
                'aria-label': 'Carregando...',
                role: 'status'
            },
            html: `
                <div class="spinner-circle" style="
                    width: ${sizes[size]};
                    height: ${sizes[size]};
                    border: 2px solid #f3f3f3;
                    border-top: 2px solid #3498db;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                "></div>
            `
        });
    }

    /**
     * Create modal backdrop
     */
    createModalBackdrop() {
        return this.createElement('div', {
            classes: 'modal-backdrop',
            attributes: {
                style: `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                `
            }
        });
    }

    /**
     * Copy text to clipboard
     */
    async copyToClipboard(text) {
        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(text);
            } else {
                // Fallback for older browsers
                const textarea = this.createElement('textarea', {
                    properties: {
                        value: text,
                        readOnly: true
                    },
                    attributes: {
                        style: 'position: absolute; left: -9999px;'
                    }
                });
                
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
            }
            
            console.log('✅ Text copied to clipboard');
            return true;
        } catch (error) {
            console.error('❌ Failed to copy text:', error);
            return false;
        }
    }

    /**
     * Format file size
     */
    formatFileSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    }

    /**
     * Clear element cache
     */
    clearCache() {
        this.cache.clear();
        console.log('🗑️ DOM cache cleared');
    }

    /**
     * Get cache size
     */
    getCacheSize() {
        return this.cache.size;
    }

    /**
     * Debug cache contents
     */
    debugCache() {
        console.group('🔍 DOM Cache Debug');
        console.log('Cache size:', this.cache.size);
        console.table(Object.fromEntries(this.cache));
        console.groupEnd();
    }
}

// ==============================================
// DEFAULT EXPORT
// ==============================================

export default DOMUtils;
