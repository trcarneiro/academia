/**
 * @fileoverview Form Handler Utility
 * @version 1.0.0
 * @description Form handling, validation, and submission utilities
 */

import { Validator } from './validator.js';
import { DOMUtils } from './dom-utils.js';

// ==============================================
// FORM HANDLER
// ==============================================

export class FormHandler {
    constructor(options = {}) {
        this.validator = new Validator();
        this.domUtils = new DOMUtils();
        this.forms = new Map();
        this.config = {
            validateOnBlur: true,
            validateOnInput: false,
            showInlineErrors: true,
            errorClass: 'is-invalid',
            successClass: 'is-valid',
            debounceDelay: 300,
            ...options
        };
    }

    /**
     * Setup form with validation
     */
    setupForm(formSelector, schema, options = {}) {
        const form = this.domUtils.getElement(formSelector);
        if (!form) {
            console.error(`❌ Form not found: ${formSelector}`);
            return;
        }

        const formConfig = {
            element: form,
            schema,
            options: { ...this.config, ...options },
            fields: new Map(),
            isValid: false,
            data: {}
        };

        // Setup fields
        Object.keys(schema).forEach(fieldName => {
            this.setupField(formConfig, fieldName);
        });

        // Setup form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit(formSelector);
        });

        this.forms.set(formSelector, formConfig);
        
        console.log(`✅ Form setup completed: ${formSelector}`);
        return formConfig;
    }

    /**
     * Setup individual field
     */
    setupField(formConfig, fieldName) {
        const field = this.findFieldElement(formConfig.element, fieldName);
        if (!field) {
            console.warn(`⚠️ Field not found: ${fieldName}`);
            return;
        }

        const fieldConfig = {
            element: field,
            rules: formConfig.schema[fieldName],
            isValid: false,
            errors: [],
            touched: false
        };

        // Setup event listeners
        if (formConfig.options.validateOnBlur) {
            field.addEventListener('blur', () => {
                fieldConfig.touched = true;
                this.validateField(formConfig, fieldName);
            });
        }

        if (formConfig.options.validateOnInput) {
            this.domUtils.addDebouncedEvent(field, 'input', () => {
                if (fieldConfig.touched) {
                    this.validateField(formConfig, fieldName);
                }
            }, formConfig.options.debounceDelay);
        }

        // Setup change listener for data collection
        field.addEventListener('change', () => {
            this.updateFieldData(formConfig, fieldName);
        });

        formConfig.fields.set(fieldName, fieldConfig);
    }

    /**
     * Find field element by various strategies
     */
    findFieldElement(form, fieldName) {
        // Try by ID first
        let field = form.querySelector(`#${fieldName}`);
        if (field) return field;

        // Try by name attribute
        field = form.querySelector(`[name="${fieldName}"]`);
        if (field) return field;

        // Try by data-field attribute
        field = form.querySelector(`[data-field="${fieldName}"]`);
        if (field) return field;

        return null;
    }

    /**
     * Validate individual field
     */
    validateField(formConfig, fieldName) {
        const fieldConfig = formConfig.fields.get(fieldName);
        if (!fieldConfig) return false;

        const value = this.getFieldValue(fieldConfig.element);
        const result = this.validator.validateValue(value, fieldConfig.rules, fieldName);

        fieldConfig.isValid = result.isValid;
        fieldConfig.errors = result.errors;

        if (formConfig.options.showInlineErrors) {
            this.updateFieldUI(fieldConfig, result);
        }

        this.updateFormData(formConfig, fieldName, result.value);
        this.updateFormValidation(formConfig);

        return result.isValid;
    }

    /**
     * Validate entire form
     */
    validateForm(formSelector) {
        const formConfig = this.forms.get(formSelector);
        if (!formConfig) {
            console.error(`❌ Form not registered: ${formSelector}`);
            return false;
        }

        let isFormValid = true;
        const errors = {};

        // Validate all fields
        formConfig.fields.forEach((fieldConfig, fieldName) => {
            const isFieldValid = this.validateField(formConfig, fieldName);
            if (!isFieldValid) {
                isFormValid = false;
                errors[fieldName] = fieldConfig.errors;
            }
        });

        formConfig.isValid = isFormValid;

        if (!isFormValid) {
            this.showFormErrors(formConfig, errors);
        }

        return {
            isValid: isFormValid,
            errors,
            data: formConfig.data
        };
    }

    /**
     * Get field value based on field type
     */
    getFieldValue(field) {
        switch (field.type) {
            case 'checkbox':
                return field.checked;
            case 'radio':
                const radioGroup = document.querySelectorAll(`input[name="${field.name}"]`);
                const checkedRadio = Array.from(radioGroup).find(radio => radio.checked);
                return checkedRadio ? checkedRadio.value : '';
            case 'select-multiple':
                return Array.from(field.selectedOptions).map(option => option.value);
            case 'file':
                return field.files;
            default:
                return field.value;
        }
    }

    /**
     * Set field value based on field type
     */
    setFieldValue(field, value) {
        switch (field.type) {
            case 'checkbox':
                field.checked = Boolean(value);
                break;
            case 'radio':
                const radioGroup = document.querySelectorAll(`input[name="${field.name}"]`);
                radioGroup.forEach(radio => {
                    radio.checked = radio.value === value;
                });
                break;
            case 'select-multiple':
                Array.from(field.options).forEach(option => {
                    option.selected = Array.isArray(value) && value.includes(option.value);
                });
                break;
            case 'file':
                // Cannot programmatically set file input value for security reasons
                console.warn('⚠️ Cannot set value for file input');
                break;
            default:
                field.value = value || '';
        }

        // Trigger change event
        field.dispatchEvent(new Event('change', { bubbles: true }));
    }

    /**
     * Update field UI based on validation result
     */
    updateFieldUI(fieldConfig, result) {
        const { element } = fieldConfig;
        const { errorClass, successClass } = fieldConfig;

        // Update field classes
        element.classList.remove(errorClass, successClass);
        if (result.isValid) {
            element.classList.add(successClass);
        } else {
            element.classList.add(errorClass);
        }

        // Update error message
        this.updateFieldError(element, result.errors);
    }

    /**
     * Update field error display
     */
    updateFieldError(field, errors) {
        const errorId = `${field.id || field.name}-error`;
        let errorElement = document.getElementById(errorId);

        if (errors.length > 0) {
            // Create error element if it doesn't exist
            if (!errorElement) {
                errorElement = this.domUtils.createElement('div', {
                    attributes: {
                        id: errorId,
                        class: 'field-error invalid-feedback'
                    }
                });

                // Insert after field or parent container
                const container = field.closest('.form-group, .field-container') || field.parentNode;
                container.appendChild(errorElement);
            }

            errorElement.textContent = errors[0]; // Show first error
            errorElement.style.display = 'block';
        } else if (errorElement) {
            errorElement.style.display = 'none';
        }
    }

    /**
     * Update field data in form
     */
    updateFieldData(formConfig, fieldName) {
        const fieldConfig = formConfig.fields.get(fieldName);
        if (!fieldConfig) return;

        const value = this.getFieldValue(fieldConfig.element);
        formConfig.data[fieldName] = value;
    }

    /**
     * Update form data
     */
    updateFormData(formConfig, fieldName, value) {
        formConfig.data[fieldName] = value;
    }

    /**
     * Update overall form validation state
     */
    updateFormValidation(formConfig) {
        const allValid = Array.from(formConfig.fields.values()).every(field => field.isValid);
        formConfig.isValid = allValid;

        // Update submit button state
        const submitButton = formConfig.element.querySelector('button[type="submit"], input[type="submit"]');
        if (submitButton) {
            submitButton.disabled = !allValid;
            submitButton.classList.toggle('btn-disabled', !allValid);
        }
    }

    /**
     * Show form-level errors
     */
    showFormErrors(formConfig, errors) {
        // Focus first invalid field
        const firstErrorField = Array.from(formConfig.fields.entries())
            .find(([name, config]) => !config.isValid);

        if (firstErrorField) {
            const [fieldName, fieldConfig] = firstErrorField;
            fieldConfig.element.focus();
            this.domUtils.scrollToElement(fieldConfig.element);
        }

        // Show error summary if configured
        if (formConfig.options.showErrorSummary) {
            this.showErrorSummary(formConfig, errors);
        }
    }

    /**
     * Show error summary
     */
    showErrorSummary(formConfig, errors) {
        let summaryElement = formConfig.element.querySelector('.form-error-summary');
        
        if (!summaryElement) {
            summaryElement = this.domUtils.createElement('div', {
                classes: 'form-error-summary alert alert-danger',
                attributes: { role: 'alert' }
            });
            formConfig.element.insertBefore(summaryElement, formConfig.element.firstChild);
        }

        const errorList = Object.entries(errors)
            .map(([field, fieldErrors]) => `<li><strong>${field}:</strong> ${fieldErrors.join(', ')}</li>`)
            .join('');

        summaryElement.innerHTML = `
            <h5>Por favor, corrija os seguintes erros:</h5>
            <ul>${errorList}</ul>
        `;

        summaryElement.style.display = 'block';
        this.domUtils.scrollToElement(summaryElement);
    }

    /**
     * Hide error summary
     */
    hideErrorSummary(formConfig) {
        const summaryElement = formConfig.element.querySelector('.form-error-summary');
        if (summaryElement) {
            summaryElement.style.display = 'none';
        }
    }

    /**
     * Handle form submission
     */
    async handleSubmit(formSelector) {
        const formConfig = this.forms.get(formSelector);
        if (!formConfig) return;

        console.log('🚀 Handling form submission:', formSelector);

        // Validate form
        const validation = this.validateForm(formSelector);
        if (!validation.isValid) {
            console.log('❌ Form validation failed');
            return { success: false, errors: validation.errors };
        }

        // Hide error summary
        this.hideErrorSummary(formConfig);

        // Call custom submit handler if provided
        if (formConfig.options.onSubmit) {
            try {
                const result = await formConfig.options.onSubmit(validation.data, formConfig);
                console.log('✅ Form submitted successfully');
                return { success: true, data: result };
            } catch (error) {
                console.error('❌ Form submission error:', error);
                this.showSubmissionError(formConfig, error);
                return { success: false, error };
            }
        }

        return { success: true, data: validation.data };
    }

    /**
     * Show submission error
     */
    showSubmissionError(formConfig, error) {
        const errorElement = this.domUtils.createElement('div', {
            classes: 'form-submission-error alert alert-danger',
            attributes: { role: 'alert' },
            text: `Erro ao enviar formulário: ${error.message}`
        });

        const existingError = formConfig.element.querySelector('.form-submission-error');
        if (existingError) {
            existingError.replaceWith(errorElement);
        } else {
            formConfig.element.insertBefore(errorElement, formConfig.element.firstChild);
        }

        this.domUtils.scrollToElement(errorElement);
    }

    /**
     * Populate form with data
     */
    populateForm(formSelector, data) {
        const formConfig = this.forms.get(formSelector);
        if (!formConfig) {
            console.error(`❌ Form not registered: ${formSelector}`);
            return;
        }

        Object.entries(data).forEach(([fieldName, value]) => {
            const fieldConfig = formConfig.fields.get(fieldName);
            if (fieldConfig) {
                this.setFieldValue(fieldConfig.element, value);
                this.updateFieldData(formConfig, fieldName);
            }
        });

        console.log(`📝 Form populated: ${formSelector}`);
    }

    /**
     * Get form data
     */
    getFormData(formSelector) {
        const formConfig = this.forms.get(formSelector);
        if (!formConfig) {
            console.error(`❌ Form not registered: ${formSelector}`);
            return null;
        }

        return { ...formConfig.data };
    }

    /**
     * Reset form
     */
    resetForm(formSelector) {
        const formConfig = this.forms.get(formSelector);
        if (!formConfig) {
            console.error(`❌ Form not registered: ${formSelector}`);
            return;
        }

        // Reset form element
        formConfig.element.reset();

        // Clear validation states
        formConfig.fields.forEach((fieldConfig, fieldName) => {
            fieldConfig.isValid = false;
            fieldConfig.errors = [];
            fieldConfig.touched = false;

            // Clear field classes
            fieldConfig.element.classList.remove(
                formConfig.options.errorClass,
                formConfig.options.successClass
            );

            // Hide error messages
            this.updateFieldError(fieldConfig.element, []);
        });

        // Clear form data
        formConfig.data = {};
        formConfig.isValid = false;

        // Hide error summary
        this.hideErrorSummary(formConfig);

        console.log(`🔄 Form reset: ${formSelector}`);
    }

    /**
     * Setup validation for field configuration
     */
    setupValidation(fields) {
        Object.entries(fields).forEach(([fieldId, config]) => {
            const field = document.getElementById(fieldId);
            if (!field) return;

            // Add required attribute for required fields
            if (config.required) {
                field.setAttribute('required', '');
            }

            // Add pattern for validation
            if (config.type === 'email') {
                field.setAttribute('type', 'email');
            } else if (config.type === 'tel') {
                field.setAttribute('type', 'tel');
            } else if (config.type === 'date') {
                field.setAttribute('type', 'date');
            }

            // Add maxlength
            if (config.maxLength) {
                field.setAttribute('maxlength', config.maxLength);
            }
        });
    }

    /**
     * Destroy form handler
     */
    destroy(formSelector) {
        const formConfig = this.forms.get(formSelector);
        if (formConfig) {
            // Remove event listeners would be handled by garbage collection
            // when references are removed
            this.forms.delete(formSelector);
            console.log(`🗑️ Form handler destroyed: ${formSelector}`);
        }
    }

    /**
     * Get form statistics
     */
    getStats() {
        const stats = {
            totalForms: this.forms.size,
            forms: {}
        };

        this.forms.forEach((config, selector) => {
            stats.forms[selector] = {
                isValid: config.isValid,
                fieldCount: config.fields.size,
                validFields: Array.from(config.fields.values()).filter(f => f.isValid).length,
                touchedFields: Array.from(config.fields.values()).filter(f => f.touched).length
            };
        });

        return stats;
    }
}

// ==============================================
// DEFAULT EXPORT
// ==============================================

export default FormHandler;
