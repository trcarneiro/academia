/**
 * Student Validator
 * Comprehensive validation for student data
 */

export class StudentValidator {
    constructor() {
        this.rules = this.defineValidationRules();
    }

    /**
     * Define validation rules
     */
    defineValidationRules() {
        return {
            user: {
                firstName: {
                    required: true,
                    minLength: 2,
                    maxLength: 50,
                    pattern: /^[a-zA-ZÀ-ÿ\s]+$/,
                    message: 'Nome deve ter entre 2 e 50 caracteres e conter apenas letras'
                },
                lastName: {
                    required: true,
                    minLength: 2,
                    maxLength: 50,
                    pattern: /^[a-zA-ZÀ-ÿ\s]+$/,
                    message: 'Sobrenome deve ter entre 2 e 50 caracteres e conter apenas letras'
                },
                email: {
                    required: true,
                    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Email deve ter um formato válido'
                },
                phone: {
                    required: false,
                    pattern: /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
                    message: 'Telefone deve estar no formato (11) 99999-9999'
                },
                cpf: {
                    required: false,
                    pattern: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
                    custom: 'validateCPF',
                    message: 'CPF deve ter um formato válido'
                },
                whatsapp: {
                    required: false,
                    pattern: /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
                    message: 'WhatsApp deve estar no formato (11) 99999-9999'
                },
                birthDate: {
                    required: false,
                    custom: 'validateBirthDate',
                    message: 'Data de nascimento deve ser válida e no passado'
                }
            },
            category: {
                required: true,
                enum: ['REGULAR', 'VIP', 'STUDENT', 'SENIOR'],
                message: 'Categoria deve ser uma das opções válidas'
            },
            isActive: {
                required: true,
                type: 'boolean',
                message: 'Status deve ser definido'
            }
        };
    }

    /**
     * Validate complete student data
     */
    async validateStudent(studentData) {
        const errors = [];
        
        try {
            // Validate user data
            if (studentData.user) {
                const userErrors = await this.validateObject(studentData.user, this.rules.user, 'user');
                errors.push(...userErrors);
            } else {
                errors.push({ field: 'user', message: 'Dados do usuário são obrigatórios' });
            }

            // Validate category
            if (this.rules.category) {
                const categoryError = this.validateField(studentData.category, this.rules.category, 'category');
                if (categoryError) errors.push(categoryError);
            }

            // Validate isActive
            if (this.rules.isActive) {
                const statusError = this.validateField(studentData.isActive, this.rules.isActive, 'isActive');
                if (statusError) errors.push(statusError);
            }

            return errors;

        } catch (error) {
            console.error('❌ Erro na validação:', error);
            return [{ field: 'general', message: 'Erro interno de validação' }];
        }
    }

    /**
     * Validate object against rules
     */
    async validateObject(data, rules, prefix = '') {
        const errors = [];

        for (const [field, rule] of Object.entries(rules)) {
            const value = data[field];
            const fieldName = prefix ? `${prefix}.${field}` : field;
            
            const error = await this.validateField(value, rule, fieldName);
            if (error) {
                errors.push(error);
            }
        }

        return errors;
    }

    /**
     * Validate single field
     */
    async validateField(value, rule, fieldName) {
        // Required validation
        if (rule.required && this.isEmpty(value)) {
            return {
                field: fieldName,
                message: `${this.getFieldLabel(fieldName)} é obrigatório`
            };
        }

        // Skip other validations if value is empty and not required
        if (this.isEmpty(value) && !rule.required) {
            return null;
        }

        // Type validation
        if (rule.type && !this.validateType(value, rule.type)) {
            return {
                field: fieldName,
                message: `${this.getFieldLabel(fieldName)} deve ser do tipo ${rule.type}`
            };
        }

        // Length validations
        if (rule.minLength && value.length < rule.minLength) {
            return {
                field: fieldName,
                message: `${this.getFieldLabel(fieldName)} deve ter pelo menos ${rule.minLength} caracteres`
            };
        }

        if (rule.maxLength && value.length > rule.maxLength) {
            return {
                field: fieldName,
                message: `${this.getFieldLabel(fieldName)} deve ter no máximo ${rule.maxLength} caracteres`
            };
        }

        // Pattern validation
        if (rule.pattern && !rule.pattern.test(value)) {
            return {
                field: fieldName,
                message: rule.message || `${this.getFieldLabel(fieldName)} tem formato inválido`
            };
        }

        // Enum validation
        if (rule.enum && !rule.enum.includes(value)) {
            return {
                field: fieldName,
                message: `${this.getFieldLabel(fieldName)} deve ser uma das opções: ${rule.enum.join(', ')}`
            };
        }

        // Custom validation
        if (rule.custom) {
            const customError = await this.runCustomValidation(value, rule.custom, fieldName);
            if (customError) {
                return customError;
            }
        }

        return null;
    }

    /**
     * Run custom validation method
     */
    async runCustomValidation(value, methodName, fieldName) {
        if (typeof this[methodName] === 'function') {
            const isValid = await this[methodName](value);
            if (!isValid) {
                const rule = this.findRuleByField(fieldName);
                return {
                    field: fieldName,
                    message: rule?.message || `${this.getFieldLabel(fieldName)} é inválido`
                };
            }
        }
        return null;
    }

    /**
     * Custom validation methods
     */
    validateCPF(cpf) {
        if (!cpf) return true; // Optional field
        
        // Remove formatting
        const numbers = cpf.replace(/[^\d]/g, '');
        
        if (numbers.length !== 11) return false;
        
        // Check for known invalid sequences
        if (/^(\d)\1{10}$/.test(numbers)) return false;
        
        // Validate checksum
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(numbers.charAt(i)) * (10 - i);
        }
        let remainder = 11 - (sum % 11);
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(numbers.charAt(9))) return false;
        
        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(numbers.charAt(i)) * (11 - i);
        }
        remainder = 11 - (sum % 11);
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(numbers.charAt(10))) return false;
        
        return true;
    }

    validateBirthDate(birthDate) {
        if (!birthDate) return true; // Optional field
        
        const date = new Date(birthDate);
        const now = new Date();
        
        // Check if date is valid
        if (isNaN(date.getTime())) return false;
        
        // Check if date is in the past
        if (date >= now) return false;
        
        // Check if date is reasonable (not too far in the past)
        const minDate = new Date(now.getFullYear() - 120, 0, 1);
        if (date < minDate) return false;
        
        return true;
    }

    /**
     * Utility methods
     */
    isEmpty(value) {
        return value === null || value === undefined || value === '';
    }

    validateType(value, type) {
        switch (type) {
            case 'string':
                return typeof value === 'string';
            case 'number':
                return typeof value === 'number' && !isNaN(value);
            case 'boolean':
                return typeof value === 'boolean';
            case 'date':
                return value instanceof Date || !isNaN(Date.parse(value));
            default:
                return true;
        }
    }

    getFieldLabel(fieldName) {
        const labels = {
            'user.firstName': 'Nome',
            'user.lastName': 'Sobrenome',
            'user.email': 'Email',
            'user.phone': 'Telefone',
            'user.cpf': 'CPF',
            'user.whatsapp': 'WhatsApp',
            'user.birthDate': 'Data de nascimento',
            'user.address': 'Endereço',
            'category': 'Categoria',
            'isActive': 'Status',
            'emergencyContact': 'Contato de emergência',
            'medicalObservations': 'Observações médicas',
            'internalNotes': 'Notas internas'
        };
        
        return labels[fieldName] || fieldName;
    }

    findRuleByField(fieldName) {
        const parts = fieldName.split('.');
        let rules = this.rules;
        
        for (const part of parts) {
            if (rules[part]) {
                rules = rules[part];
            } else {
                return null;
            }
        }
        
        return rules;
    }

    /**
     * Quick validation methods for real-time feedback
     */
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validatePhone(phone) {
        const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
        return phoneRegex.test(phone);
    }

    /**
     * Format validation errors for display
     */
    formatErrors(errors) {
        return errors.map(error => ({
            field: error.field,
            message: error.message,
            type: 'validation'
        }));
    }

    /**
     * Group errors by field
     */
    groupErrorsByField(errors) {
        const grouped = {};
        
        errors.forEach(error => {
            if (!grouped[error.field]) {
                grouped[error.field] = [];
            }
            grouped[error.field].push(error.message);
        });
        
        return grouped;
    }
}
