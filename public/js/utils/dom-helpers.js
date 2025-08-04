/**
 * DOM Helper Utilities
 * Common DOM manipulation and helper functions
 */

class DOMHelpers {
    /**
     * Safely get element by ID
     */
    static getElementById(id) {
        const element = document.getElementById(id);
        if (!element) {
            console.warn(`⚠️ Element not found: ${id}`);
        }
        return element;
    }

    /**
     * Safely update element text content
     */
    static updateText(elementId, text) {
        const element = this.getElementById(elementId);
        if (element) {
            element.textContent = text;
            return true;
        }
        return false;
    }

    /**
     * Safely update element HTML content
     */
    static updateHTML(elementId, html) {
        const element = this.getElementById(elementId);
        if (element) {
            element.innerHTML = html;
            return true;
        }
        return false;
    }

    /**
     * Create element with attributes and content
     */
    static createElement(tag, attributes = {}, content = '') {
        const element = document.createElement(tag);
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'style' && typeof value === 'object') {
                Object.assign(element.style, value);
            } else {
                element.setAttribute(key, value);
            }
        });

        if (content) {
            if (typeof content === 'string') {
                element.innerHTML = content;
            } else {
                element.appendChild(content);
            }
        }

        return element;
    }

    /**
     * Show element with optional animation
     */
    static show(elementId, animation = false) {
        const element = this.getElementById(elementId);
        if (element) {
            element.style.display = 'block';
            if (animation) {
                element.style.opacity = '0';
                setTimeout(() => {
                    element.style.transition = 'opacity 0.3s ease';
                    element.style.opacity = '1';
                }, 10);
            }
        }
    }

    /**
     * Hide element with optional animation
     */
    static hide(elementId, animation = false) {
        const element = this.getElementById(elementId);
        if (element) {
            if (animation) {
                element.style.transition = 'opacity 0.3s ease';
                element.style.opacity = '0';
                setTimeout(() => {
                    element.style.display = 'none';
                }, 300);
            } else {
                element.style.display = 'none';
            }
        }
    }

    /**
     * Toggle element visibility
     */
    static toggle(elementId, animation = false) {
        const element = this.getElementById(elementId);
        if (element) {
            const isVisible = element.style.display !== 'none';
            if (isVisible) {
                this.hide(elementId, animation);
            } else {
                this.show(elementId, animation);
            }
            return !isVisible;
        }
        return false;
    }

    /**
     * Add class to element
     */
    static addClass(elementId, className) {
        const element = this.getElementById(elementId);
        if (element) {
            element.classList.add(className);
            return true;
        }
        return false;
    }

    /**
     * Remove class from element
     */
    static removeClass(elementId, className) {
        const element = this.getElementById(elementId);
        if (element) {
            element.classList.remove(className);
            return true;
        }
        return false;
    }

    /**
     * Toggle class on element
     */
    static toggleClass(elementId, className) {
        const element = this.getElementById(elementId);
        if (element) {
            element.classList.toggle(className);
            return element.classList.contains(className);
        }
        return false;
    }

    /**
     * Clear element content
     */
    static clear(elementId) {
        const element = this.getElementById(elementId);
        if (element) {
            element.innerHTML = '';
            return true;
        }
        return false;
    }

    /**
     * Get form data as object
     */
    static getFormData(formId) {
        const form = this.getElementById(formId);
        if (form) {
            const formData = new FormData(form);
            const data = {};
            for (const [key, value] of formData.entries()) {
                data[key] = value;
            }
            return data;
        }
        return null;
    }

    /**
     * Set form values from object
     */
    static setFormData(formId, data) {
        const form = this.getElementById(formId);
        if (form && data) {
            Object.entries(data).forEach(([key, value]) => {
                const field = form.querySelector(`[name="${key}"]`);
                if (field) {
                    if (field.type === 'checkbox') {
                        field.checked = value;
                    } else {
                        field.value = value;
                    }
                }
            });
            return true;
        }
        return false;
    }

    /**
     * Create loading spinner
     */
    static createLoadingSpinner(size = '32px') {
        return this.createElement('div', {
            className: 'loading-spinner',
            style: {
                width: size,
                height: size,
                border: '3px solid #334155',
                borderTop: '3px solid #3B82F6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto'
            }
        });
    }

    /**
     * Show loading in element
     */
    static showLoading(elementId, message = 'Carregando...') {
        const element = this.getElementById(elementId);
        if (element) {
            const originalContent = element.innerHTML;
            element.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; padding: 2rem; color: #64748B;">
                    ${this.createLoadingSpinner().outerHTML}
                    <div style="margin-top: 1rem; font-size: 0.875rem;">${message}</div>
                </div>
            `;
            return originalContent;
        }
        return null;
    }

    /**
     * Show error message in element
     */
    static showError(elementId, message = 'Erro ao carregar', actionButton = null) {
        const element = this.getElementById(elementId);
        if (element) {
            const buttonHTML = actionButton ? 
                `<button onclick="${actionButton.action}" style="background: #3B82F6; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; margin-top: 1rem;">
                    ${actionButton.text}
                </button>` : '';

            element.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; padding: 2rem; color: #EF4444;">
                    <div style="font-size: 2rem; margin-bottom: 1rem;">❌</div>
                    <div style="font-weight: 600; margin-bottom: 0.5rem;">${message}</div>
                    ${buttonHTML}
                </div>
            `;
        }
    }

    /**
     * Show empty state in element
     */
    static showEmpty(elementId, message = 'Nenhum item encontrado', icon = '📭') {
        const element = this.getElementById(elementId);
        if (element) {
            element.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; padding: 2rem; color: #64748B;">
                    <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;">${icon}</div>
                    <div style="font-weight: 600; margin-bottom: 0.5rem;">${message}</div>
                </div>
            `;
        }
    }

    /**
     * Debounce function for input events
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Throttle function for scroll/resize events
     */
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Animate element with CSS transition
     */
    static animate(elementId, properties, duration = 300) {
        const element = this.getElementById(elementId);
        if (element) {
            element.style.transition = `all ${duration}ms ease`;
            Object.assign(element.style, properties);
            
            return new Promise(resolve => {
                setTimeout(() => {
                    element.style.transition = '';
                    resolve();
                }, duration);
            });
        }
        return Promise.resolve();
    }

    /**
     * Smooth scroll to element
     */
    static scrollTo(elementId, behavior = 'smooth') {
        const element = this.getElementById(elementId);
        if (element) {
            element.scrollIntoView({ behavior, block: 'start' });
        }
    }
}

// Add CSS for loading spinner animation
if (!document.querySelector('#dom-helpers-styles')) {
    const style = document.createElement('style');
    style.id = 'dom-helpers-styles';
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
}

// Global access for legacy compatibility
window.DOMHelpers = DOMHelpers;
window.DOM = DOMHelpers;