/**
 * @fileoverview Validator Utility
 * @version 1.0.0
 * @description Data validation and sanitization functions
 */

// ==============================================
// VALIDATOR
// ==============================================

export class Validator {
    constructor() {
        this.rules = new Map();
        this.messages = new Map();
        this.setupDefaultRules();
        this.setupDefaultMessages();
    }

    /**
     * Setup default validation rules
     */
    setupDefaultRules() {
        this.rules.set('required', (value) => {
            return value !== null && value !== undefined && String(value).trim() !== '';
        });

        this.rules.set('email', (value) => {
            if (!value) return true; // Optional field
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(value);
        });

        this.rules.set('phone', (value) => {
            if (!value) return true; // Optional field
            const phoneRegex = /^[\d\s\-\(\)\+]+$/;
            return phoneRegex.test(value) && value.replace(/\D/g, '').length >= 10;
        });

        this.rules.set('minLength', (value, minLength) => {
            if (!value) return true; // Optional field
            return String(value).length >= minLength;
        });

        this.rules.set('maxLength', (value, maxLength) => {
            if (!value) return true; // Optional field
            return String(value).length <= maxLength;
        });

        this.rules.set('numeric', (value) => {
            if (!value) return true; // Optional field
            return !isNaN(value) && !isNaN(parseFloat(value));
        });

        this.rules.set('integer', (value) => {
            if (!value) return true; // Optional field
            return Number.isInteger(Number(value));
        });

        this.rules.set('positive', (value) => {
            if (!value) return true; // Optional field
            return Number(value) > 0;
        });

        this.rules.set('url', (value) => {
            if (!value) return true; // Optional field
            try {
                new URL(value);
                return true;
            } catch {
                return false;
            }
        });

        this.rules.set('date', (value) => {
            if (!value) return true; // Optional field
            const date = new Date(value);
            return !isNaN(date.getTime());
        });

        this.rules.set('dateAfter', (value, afterDate) => {
            if (!value) return true; // Optional field
            const date = new Date(value);
            const after = new Date(afterDate);
            return date > after;
        });

        this.rules.set('dateBefore', (value, beforeDate) => {
            if (!value) return true; // Optional field
            const date = new Date(value);
            const before = new Date(beforeDate);
            return date < before;
        });

        this.rules.set('pattern', (value, regex) => {
            if (!value) return true; // Optional field
            return regex.test(value);
        });

        this.rules.set('in', (value, allowedValues) => {
            if (!value) return true; // Optional field
            return allowedValues.includes(value);
        });

        this.rules.set('notIn', (value, forbiddenValues) => {
            if (!value) return true; // Optional field
            return !forbiddenValues.includes(value);
        });
    }

    /**
     * Setup default error messages
     */
    setupDefaultMessages() {
        this.messages.set('required', 'Este campo é obrigatório');
        this.messages.set('email', 'Deve ser um email válido');
        this.messages.set('phone', 'Deve ser um telefone válido');
        this.messages.set('minLength', 'Deve ter pelo menos {0} caracteres');
        this.messages.set('maxLength', 'Deve ter no máximo {0} caracteres');
        this.messages.set('numeric', 'Deve ser um número');
        this.messages.set('integer', 'Deve ser um número inteiro');
        this.messages.set('positive', 'Deve ser um número positivo');
        this.messages.set('url', 'Deve ser uma URL válida');
        this.messages.set('date', 'Deve ser uma data válida');
        this.messages.set('dateAfter', 'Deve ser após {0}');
        this.messages.set('dateBefore', 'Deve ser antes de {0}');
        this.messages.set('pattern', 'Formato inválido');
        this.messages.set('in', 'Deve ser um dos valores permitidos');
        this.messages.set('notIn', 'Não pode ser um dos valores proibidos');
    }

    /**
     * Add custom validation rule
     */
    addRule(name, validator, message) {
        this.rules.set(name, validator);
        if (message) {
            this.messages.set(name, message);
        }
    }

    /**
     * Validate single value
     */
    validateValue(value, rules, fieldName = 'Campo') {
        const errors = [];
        
        if (!Array.isArray(rules)) {
            rules = [rules];
        }
        
        for (const rule of rules) {
            let ruleName, ruleParams = [];
            
            if (typeof rule === 'string') {
                const parts = rule.split(':');
                ruleName = parts[0];
                if (parts[1]) {
                    ruleParams = parts[1].split(',');
                }
            } else if (typeof rule === 'object') {
                ruleName = rule.name;
                ruleParams = rule.params || [];
            } else {
                continue;
            }
            
            const validator = this.rules.get(ruleName);
            if (!validator) {
                console.warn(`⚠️ Unknown validation rule: ${ruleName}`);
                continue;
            }
            
            const isValid = validator(value, ...ruleParams);
            if (!isValid) {
                const message = this.getMessage(ruleName, fieldName, ruleParams);
                errors.push(message);
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            value: this.sanitizeValue(value)
        };
    }

    /**
     * Validate multiple fields
     */
    validateFields(data, schema) {
        const errors = {};
        const sanitizedData = {};
        
        for (const [fieldName, fieldRules] of Object.entries(schema)) {
            const value = data[fieldName];
            const result = this.validateValue(value, fieldRules, fieldName);
            
            if (!result.isValid) {
                errors[fieldName] = result.errors;
            }
            
            sanitizedData[fieldName] = result.value;
        }
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors,
            sanitizedData
        };
    }

    /**
     * Validate student data specifically
     */
    validateStudentData(data) {
        const schema = {
            firstName: ['required', 'maxLength:50'],
            lastName: ['maxLength:50'],
            email: ['required', 'email'],
            phone: ['phone'],
            birthDate: ['date', `dateBefore:${new Date().toISOString()}`],
            notes: ['maxLength:500'],
            isActive: ['required']
        };
        
        return this.validateFields(data, schema);
    }

    /**
     * Validate course data
     */
    validateCourseData(data) {
        const schema = {
            name: ['required', 'maxLength:100'],
            description: ['maxLength:500'],
            price: ['numeric', 'positive'],
            duration: ['integer', 'positive'],
            isActive: ['required']
        };
        
        return this.validateFields(data, schema);
    }

    /**
     * Validate class data
     */
    validateClassData(data) {
        const schema = {
            name: ['required', 'maxLength:100'],
            courseId: ['required', 'integer', 'positive'],
            startDate: ['required', 'date'],
            endDate: ['date'],
            maxStudents: ['integer', 'positive'],
            isActive: ['required']
        };
        
        const result = this.validateFields(data, schema);
        
        // Additional validation: end date after start date
        if (data.startDate && data.endDate) {
            const startDate = new Date(data.startDate);
            const endDate = new Date(data.endDate);
            
            if (endDate <= startDate) {
                result.isValid = false;
                if (!result.errors.endDate) {
                    result.errors.endDate = [];
                }
                result.errors.endDate.push('Data de término deve ser posterior à data de início');
            }
        }
        
        return result;
    }

    /**
     * Validate ID
     */
    isValidId(id) {
        return id && (Number.isInteger(Number(id)) && Number(id) > 0);
    }

    /**
     * Get error message for rule
     */
    getMessage(ruleName, fieldName, params = []) {
        let message = this.messages.get(ruleName) || `${fieldName} is invalid`;
        
        // Replace placeholders
        params.forEach((param, index) => {
            message = message.replace(`{${index}}`, param);
        });
        
        return message;
    }

    /**
     * Sanitize value
     */
    sanitizeValue(value) {
        if (value === null || value === undefined) {
            return null;
        }
        
        if (typeof value === 'string') {
            return value.trim();
        }
        
        return value;
    }

    /**
     * Sanitize string for HTML
     */
    sanitizeHtml(str) {
        if (!str) return '';
        
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Sanitize string for SQL (basic)
     */
    sanitizeSql(str) {
        if (!str) return '';
        
        return str
            .replace(/'/g, "''")
            .replace(/;/g, '\\;')
            .replace(/--/g, '\\--');
    }

    /**
     * Clean phone number
     */
    cleanPhone(phone) {
        if (!phone) return '';
        return phone.replace(/\D/g, '');
    }

    /**
     * Format phone number
     */
    formatPhone(phone) {
        const cleaned = this.cleanPhone(phone);
        
        if (cleaned.length === 11) {
            return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        } else if (cleaned.length === 10) {
            return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        }
        
        return phone;
    }

    /**
     * Clean CPF/CNPJ
     */
    cleanDocument(document) {
        if (!document) return '';
        return document.replace(/\D/g, '');
    }

    /**
     * Validate CPF
     */
    validateCPF(cpf) {
        const cleaned = this.cleanDocument(cpf);
        
        if (cleaned.length !== 11) return false;
        
        // Check for known invalid patterns
        if (/^(\d)\1+$/.test(cleaned)) return false;
        
        // Validate check digits
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cleaned.charAt(i)) * (10 - i);
        }
        let remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cleaned.charAt(9))) return false;
        
        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(cleaned.charAt(i)) * (11 - i);
        }
        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cleaned.charAt(10))) return false;
        
        return true;
    }

    /**
     * Validate CNPJ
     */
    validateCNPJ(cnpj) {
        const cleaned = this.cleanDocument(cnpj);
        
        if (cleaned.length !== 14) return false;
        
        // Check for known invalid patterns
        if (/^(\d)\1+$/.test(cleaned)) return false;
        
        // Validate check digits
        let sum = 0;
        let weight = 5;
        
        for (let i = 0; i < 12; i++) {
            sum += parseInt(cleaned.charAt(i)) * weight;
            weight = weight === 2 ? 9 : weight - 1;
        }
        
        let remainder = sum % 11;
        const digit1 = remainder < 2 ? 0 : 11 - remainder;
        
        if (digit1 !== parseInt(cleaned.charAt(12))) return false;
        
        sum = 0;
        weight = 6;
        
        for (let i = 0; i < 13; i++) {
            sum += parseInt(cleaned.charAt(i)) * weight;
            weight = weight === 2 ? 9 : weight - 1;
        }
        
        remainder = sum % 11;
        const digit2 = remainder < 2 ? 0 : 11 - remainder;
        
        return digit2 === parseInt(cleaned.charAt(13));
    }

    /**
     * Format CPF
     */
    formatCPF(cpf) {
        const cleaned = this.cleanDocument(cpf);
        return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }

    /**
     * Format CNPJ
     */
    formatCNPJ(cnpj) {
        const cleaned = this.cleanDocument(cnpj);
        return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }

    /**
     * Validate email format
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate strong password
     */
    isStrongPassword(password) {
        const hasMinLength = password.length >= 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        return {
            isValid: hasMinLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
            requirements: {
                minLength: hasMinLength,
                upperCase: hasUpperCase,
                lowerCase: hasLowerCase,
                numbers: hasNumbers,
                specialChar: hasSpecialChar
            }
        };
    }

    /**
     * Get password strength score
     */
    getPasswordStrength(password) {
        let score = 0;
        const checks = this.isStrongPassword(password);
        
        Object.values(checks.requirements).forEach(passed => {
            if (passed) score++;
        });
        
        const strength = ['Muito Fraca', 'Fraca', 'Regular', 'Boa', 'Forte'][score];
        
        return {
            score,
            maxScore: 5,
            strength,
            percentage: (score / 5) * 100
        };
    }
}

// ==============================================
// DEFAULT EXPORT
// ==============================================

export default Validator;
