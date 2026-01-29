/**
 * Shared Utility Functions
 * As per AGENTS.md, this file provides common, reusable functions for various modules.
 */

/**
 * Displays an error message in a standardized way.
 * This function should be adapted to use the project's designated feedback component.
 * @param {string} message The error message to display.
 * @param {string} [context='General'] A string indicating the context where the error occurred.
 */
function showError(message, context = 'General') {
    console.error(`[${context}] Error:`, message);

    // Fallback to a simple alert if no sophisticated UI feedback is available.
    // In a real app, this should trigger a standardized toast or modal.
    if (window.app && window.app.handleError) {
        window.app.handleError(new Error(message), context);
    } else {
        alert(`Error: ${message}`);
    }
}

/**
 * Formats a CPF string (e.g., 12345678900 to 123.456.789-00).
 * @param {string} cpf The raw CPF string.
 * @returns {string} The formatted CPF string.
 */
function formatCPF(cpf) {
    if (!cpf) return '';
    const cpfStr = String(cpf).replace(/\D/g, ''); // Remove non-digit characters
    if (cpfStr.length !== 11) return cpf; // Return original if not a valid length

    return cpfStr.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formats a phone number string into a standard Brazilian format.
 * @param {string} phone The raw phone number.
 * @returns {string} The formatted phone number.
 */
function formatPhone(phone) {
    if (!phone) return '';
    const phoneStr = String(phone).replace(/\D/g, '');
    const len = phoneStr.length;

    if (len === 11) {
        return phoneStr.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    if (len === 10) {
        return phoneStr.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return phone; // Return original if not a recognized length
}

/**
 * Debounces a function, delaying its execution until after a certain time has passed
 * without it being called again.
 * @param {Function} func The function to debounce.
 * @param {number} delay The debounce delay in milliseconds.
 * @returns {Function} The debounced function.
 */
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

/**
 * Formats a ZIP code (CEP) string into the standard Brazilian format.
 * @param {string} zipCode The raw ZIP code.
 * @returns {string} The formatted ZIP code.
 */
function formatZipCode(zipCode) {
    if (!zipCode) return '';

    const digits = String(zipCode).replace(/\D/g, '');
    if (digits.length === 8) {
        return digits.replace(/(\d{5})(\d{3})/, '$1-$2');
    }

    return digits;
}

/**
 * Looks up address information based on a Brazilian ZIP code (CEP).
 * This is a placeholder function that would typically call an API.
 * @param {string} zipCode The ZIP code to look up.
 */
function lookupAddress(zipCode) {
    // This would typically make an API call to a CEP service
    // For now, it's a placeholder
    console.log('Looking up address for ZIP code:', zipCode);
    // You could implement this to call services like ViaCEP API
}

/**
 * Shows or hides a loading state on a specified element.
 * @param {boolean} show - Whether to show or hide the loading state.
 * @param {string} message - The loading message to display.
 */
function showLoading(show, message = 'Carregando...') {
    const loadingElement = document.getElementById('loading-state');
    const formContainer = document.getElementById('form-container');

    if (show) {
        if (loadingElement) {
            loadingElement.style.display = 'flex';
            const messageElement = loadingElement.querySelector('.loading-message') || loadingElement;
            if (messageElement && messageElement !== loadingElement) {
                messageElement.textContent = message;
            }
        }
        if (formContainer) {
            formContainer.style.display = 'none';
        }
    } else {
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
        if (formContainer) {
            formContainer.style.display = 'block';
        }
    }
}

/**
 * Escapes a string for safe use in HTML.
 * @param {string} str The string to escape.
 * @returns {string} The escaped string.
 */
function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Expose functions to the global scope if needed, but modules should ideally handle dependencies.
window.showError = showError;
window.formatCPF = formatCPF;
window.formatPhone = formatPhone;
window.formatZipCode = formatZipCode;
window.lookupAddress = lookupAddress;
window.showLoading = showLoading;
window.debounce = debounce;
window.escapeHTML = escapeHTML;
