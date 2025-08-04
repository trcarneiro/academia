/* ===== UTILITY FUNCTIONS ===== */
/* Following Claude.md utility isolation principles */

import { REGEX, DATE_FORMATS, VALIDATION_RULES, SYSTEM_LIMITS } from './constants.js';

// ===== DOM UTILITIES =====
export const DOM = {
    // Element selection
    $(selector) {
        return document.querySelector(selector);
    },
    
    $$(selector) {
        return document.querySelectorAll(selector);
    },
    
    // Element creation
    createElement(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'innerHTML') {
                element.innerHTML = value;
            } else if (key === 'textContent') {
                element.textContent = value;
            } else {
                element.setAttribute(key, value);
            }
        });
        
        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else if (child instanceof HTMLElement) {
                element.appendChild(child);
            }
        });
        
        return element;
    },
    
    // Class manipulation
    addClass(element, className) {
        if (element) element.classList.add(className);
    },
    
    removeClass(element, className) {
        if (element) element.classList.remove(className);
    },
    
    toggleClass(element, className) {
        if (element) element.classList.toggle(className);
    },
    
    hasClass(element, className) {
        return element ? element.classList.contains(className) : false;
    },
    
    // Style manipulation
    setStyle(element, styles) {
        if (element && typeof styles === 'object') {
            Object.entries(styles).forEach(([property, value]) => {
                element.style[property] = value;
            });
        }
    },
    
    // Visibility
    show(element) {
        if (element) element.style.display = '';
    },
    
    hide(element) {
        if (element) element.style.display = 'none';
    },
    
    // Event handling
    on(element, event, handler, options = {}) {
        if (element) {
            element.addEventListener(event, handler, options);
        }
    },
    
    off(element, event, handler) {
        if (element) {
            element.removeEventListener(event, handler);
        }
    },
    
    // Form utilities
    serialize(form) {
        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            if (data[key]) {
                if (Array.isArray(data[key])) {
                    data[key].push(value);
                } else {
                    data[key] = [data[key], value];
                }
            } else {
                data[key] = value;
            }
        }
        
        return data;
    },
    
    // Animation utilities
    fadeIn(element, duration = 300) {
        if (!element) return;
        
        element.style.opacity = '0';
        element.style.display = '';
        
        let start = performance.now();
        
        function animate(currentTime) {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            element.style.opacity = progress;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        }
        
        requestAnimationFrame(animate);
    },
    
    fadeOut(element, duration = 300) {
        if (!element) return;
        
        let start = performance.now();
        const initialOpacity = parseFloat(getComputedStyle(element).opacity);
        
        function animate(currentTime) {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            element.style.opacity = initialOpacity * (1 - progress);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.style.display = 'none';
            }
        }
        
        requestAnimationFrame(animate);
    }
};

// ===== STRING UTILITIES =====
export const StringUtils = {
    // Capitalize first letter
    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    },
    
    // Title case
    titleCase(str) {
        if (!str) return '';
        return str.replace(/\\w\\S*/g, (txt) => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
    },
    
    // Generate slug
    slug(str) {
        if (!str) return '';
        return str
            .toLowerCase()
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    },
    
    // Truncate text
    truncate(str, length = 100, suffix = '...') {
        if (!str || str.length <= length) return str;
        return str.substring(0, length) + suffix;
    },
    
    // Remove accents
    removeAccents(str) {
        if (!str) return '';
        return str.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
    },
    
    // Format student code
    formatStudentCode(code) {
        if (!code) return '';
        return code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    },
    
    // Search similarity
    similarity(str1, str2) {
        if (!str1 || !str2) return 0;
        
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const distance = this.levenshtein(longer, shorter);
        return (longer.length - distance) / longer.length;
    },
    
    // Levenshtein distance
    levenshtein(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }
};

// ===== NUMBER UTILITIES =====
export const NumberUtils = {
    // Format currency
    formatCurrency(value, currency = 'BRL', locale = 'pt-BR') {
        if (value === null || value === undefined) return '';
        
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency
        }).format(value);
    },
    
    // Format number
    formatNumber(value, decimals = 0, locale = 'pt-BR') {
        if (value === null || value === undefined) return '';
        
        return new Intl.NumberFormat(locale, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(value);
    },
    
    // Parse currency
    parseCurrency(str) {
        if (!str) return 0;
        
        // Remove currency symbols and convert to number
        const cleaned = str.replace(/[^0-9,-]/g, '');
        const normalized = cleaned.replace(',', '.');
        
        return parseFloat(normalized) || 0;
    },
    
    // Generate random number
    random(min = 0, max = 100) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    // Round to decimals
    round(value, decimals = 2) {
        return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
    },
    
    // Clamp value between min and max
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },
    
    // Check if number is in range
    inRange(value, min, max) {
        return value >= min && value <= max;
    }
};

// ===== DATE UTILITIES =====
export const DateUtils = {
    // Format date
    format(date, format = DATE_FORMATS.SHORT) {
        if (!date) return '';
        
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        
        const pad = (num) => num.toString().padStart(2, '0');
        
        const tokens = {
            'YYYY': d.getFullYear(),
            'MM': pad(d.getMonth() + 1),
            'DD': pad(d.getDate()),
            'HH': pad(d.getHours()),
            'mm': pad(d.getMinutes()),
            'ss': pad(d.getSeconds())
        };
        
        return format.replace(/YYYY|MM|DD|HH|mm|ss/g, match => tokens[match]);
    },
    
    // Parse date string
    parse(dateString, format = DATE_FORMATS.SHORT) {
        if (!dateString) return null;
        
        // Simple parsing for DD/MM/YYYY format
        if (format === DATE_FORMATS.SHORT) {
            const parts = dateString.split('/');
            if (parts.length === 3) {
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                const year = parseInt(parts[2], 10);
                
                return new Date(year, month, day);
            }
        }
        
        return new Date(dateString);
    },
    
    // Get relative time
    relative(date) {
        if (!date) return '';
        
        const now = new Date();
        const diff = now.getTime() - new Date(date).getTime();
        
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days} dia${days > 1 ? 's' : ''} atrás`;
        if (hours > 0) return `${hours} hora${hours > 1 ? 's' : ''} atrás`;
        if (minutes > 0) return `${minutes} minuto${minutes > 1 ? 's' : ''} atrás`;
        return 'Agora mesmo';
    },
    
    // Check if date is today
    isToday(date) {
        if (!date) return false;
        
        const d = new Date(date);
        const today = new Date();
        
        return d.getDate() === today.getDate() &&
               d.getMonth() === today.getMonth() &&
               d.getFullYear() === today.getFullYear();
    },
    
    // Get week boundaries
    getWeekBoundaries(date = new Date()) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day;
        
        const start = new Date(d.setDate(diff));
        const end = new Date(d.setDate(diff + 6));
        
        return { start, end };
    },
    
    // Get month boundaries
    getMonthBoundaries(date = new Date()) {
        const d = new Date(date);
        const start = new Date(d.getFullYear(), d.getMonth(), 1);
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        
        return { start, end };
    }
};

// ===== VALIDATION UTILITIES =====
export const ValidationUtils = {
    // Validate email
    isEmail(email) {
        if (!email) return false;
        return REGEX.EMAIL.test(email);
    },
    
    // Validate phone
    isPhone(phone) {
        if (!phone) return false;
        return REGEX.PHONE.test(phone);
    },
    
    // Validate CPF
    isCPF(cpf) {
        if (!cpf) return false;
        
        // Remove formatting
        const cleanCPF = cpf.replace(/[^0-9]/g, '');
        
        // Check length
        if (cleanCPF.length !== 11) return false;
        
        // Check for repeated digits
        if (/^(\\d)\\1{10}$/.test(cleanCPF)) return false;
        
        // Validate check digits
        let sum = 0;
        let remainder;
        
        for (let i = 1; i <= 9; i++) {
            sum += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
        }
        
        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;
        
        sum = 0;
        for (let i = 1; i <= 10; i++) {
            sum += parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
        }
        
        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false;
        
        return true;
    },
    
    // Validate student code
    isStudentCode(code) {
        if (!code) return false;
        return REGEX.STUDENT_CODE.test(code);
    },
    
    // Validate required field
    isRequired(value) {
        if (value === null || value === undefined) return false;
        if (typeof value === 'string') return value.trim().length > 0;
        if (Array.isArray(value)) return value.length > 0;
        return true;
    },
    
    // Validate length
    isLength(value, min = 0, max = Infinity) {
        if (!value) return min === 0;
        const length = typeof value === 'string' ? value.length : value.toString().length;
        return length >= min && length <= max;
    },
    
    // Validate numeric
    isNumeric(value) {
        if (!value) return false;
        return REGEX.NUMERIC.test(value.toString());
    },
    
    // Validate date
    isDate(date) {
        if (!date) return false;
        const d = new Date(date);
        return !isNaN(d.getTime());
    },
    
    // Validate URL
    isURL(url) {
        if (!url) return false;
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
};

// ===== ARRAY UTILITIES =====
export const ArrayUtils = {
    // Remove duplicates
    unique(array, key) {
        if (!Array.isArray(array)) return [];
        
        if (key) {
            const seen = new Set();
            return array.filter(item => {
                const value = item[key];
                if (seen.has(value)) return false;
                seen.add(value);
                return true;
            });
        }
        
        return [...new Set(array)];
    },
    
    // Group by key
    groupBy(array, key) {
        if (!Array.isArray(array)) return {};
        
        return array.reduce((groups, item) => {
            const value = typeof key === 'function' ? key(item) : item[key];
            if (!groups[value]) groups[value] = [];
            groups[value].push(item);
            return groups;
        }, {});
    },
    
    // Sort by key
    sortBy(array, key, direction = 'asc') {
        if (!Array.isArray(array)) return [];
        
        return [...array].sort((a, b) => {
            const aValue = typeof key === 'function' ? key(a) : a[key];
            const bValue = typeof key === 'function' ? key(b) : b[key];
            
            if (aValue < bValue) return direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return direction === 'asc' ? 1 : -1;
            return 0;
        });
    },
    
    // Filter by search term
    filterBySearch(array, searchTerm, keys = []) {
        if (!Array.isArray(array) || !searchTerm) return array;
        
        const term = searchTerm.toLowerCase();
        
        return array.filter(item => {
            if (keys.length === 0) {
                return JSON.stringify(item).toLowerCase().includes(term);
            }
            
            return keys.some(key => {
                const value = key.includes('.') ? 
                    key.split('.').reduce((obj, k) => obj?.[k], item) : 
                    item[key];
                
                return value && value.toString().toLowerCase().includes(term);
            });
        });
    },
    
    // Paginate array
    paginate(array, page = 1, limit = 20) {
        if (!Array.isArray(array)) return { items: [], total: 0, page, limit };
        
        const start = (page - 1) * limit;
        const end = start + limit;
        
        return {
            items: array.slice(start, end),
            total: array.length,
            page,
            limit,
            pages: Math.ceil(array.length / limit)
        };
    },
    
    // Check if array is empty
    isEmpty(array) {
        return !Array.isArray(array) || array.length === 0;
    },
    
    // Get random item
    random(array) {
        if (!Array.isArray(array) || array.length === 0) return null;
        return array[Math.floor(Math.random() * array.length)];
    },
    
    // Shuffle array
    shuffle(array) {
        if (!Array.isArray(array)) return [];
        
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        return shuffled;
    }
};

// ===== OBJECT UTILITIES =====
export const ObjectUtils = {
    // Deep clone
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj);
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const cloned = {};
            Object.keys(obj).forEach(key => {
                cloned[key] = this.deepClone(obj[key]);
            });
            return cloned;
        }
        return obj;
    },
    
    // Deep merge
    deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    },
    
    // Get nested value
    get(obj, path, defaultValue = null) {
        if (!obj || !path) return defaultValue;
        
        const keys = path.split('.');
        let result = obj;
        
        for (const key of keys) {
            result = result?.[key];
            if (result === undefined) return defaultValue;
        }
        
        return result;
    },
    
    // Set nested value
    set(obj, path, value) {
        if (!obj || !path) return obj;
        
        const keys = path.split('.');
        let current = obj;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in current) || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        
        current[keys[keys.length - 1]] = value;
        return obj;
    },
    
    // Check if object is empty
    isEmpty(obj) {
        return !obj || Object.keys(obj).length === 0;
    },
    
    // Pick properties
    pick(obj, keys) {
        if (!obj) return {};
        
        return keys.reduce((result, key) => {
            if (key in obj) result[key] = obj[key];
            return result;
        }, {});
    },
    
    // Omit properties
    omit(obj, keys) {
        if (!obj) return {};
        
        const result = { ...obj };
        keys.forEach(key => delete result[key]);
        return result;
    }
};

// ===== STORAGE UTILITIES =====
export const StorageUtils = {
    // Local storage
    setLocal(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error setting localStorage:', error);
            return false;
        }
    },
    
    getLocal(key, defaultValue = null) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : defaultValue;
        } catch (error) {
            console.error('Error getting localStorage:', error);
            return defaultValue;
        }
    },
    
    removeLocal(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing localStorage:', error);
            return false;
        }
    },
    
    // Session storage
    setSession(key, value) {
        try {
            sessionStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error setting sessionStorage:', error);
            return false;
        }
    },
    
    getSession(key, defaultValue = null) {
        try {
            const value = sessionStorage.getItem(key);
            return value ? JSON.parse(value) : defaultValue;
        } catch (error) {
            console.error('Error getting sessionStorage:', error);
            return defaultValue;
        }
    },
    
    removeSession(key) {
        try {
            sessionStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing sessionStorage:', error);
            return false;
        }
    },
    
    // Clear all storage
    clearAll() {
        try {
            localStorage.clear();
            sessionStorage.clear();
            return true;
        } catch (error) {
            console.error('Error clearing storage:', error);
            return false;
        }
    }
};

// ===== DEBOUNCE/THROTTLE UTILITIES =====
export const TimingUtils = {
    // Debounce function
    debounce(func, wait, immediate = false) {
        let timeout;
        
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            
            if (callNow) func(...args);
        };
    },
    
    // Throttle function
    throttle(func, limit) {
        let inThrottle;
        
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    // Delay function
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    // Timeout with promise
    timeout(promise, ms) {
        return Promise.race([
            promise,
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), ms)
            )
        ]);
    }
};

// ===== EXPORT ALL UTILITIES =====
export const Utils = {
    DOM,
    StringUtils,
    NumberUtils,
    DateUtils,
    ValidationUtils,
    ArrayUtils,
    ObjectUtils,
    StorageUtils,
    TimingUtils
};

// Default export for legacy compatibility
export default Utils;
