/* =============================================================================
   ENHANCED TAB SYSTEM - JavaScript UX Functions
   Designed by UX Specialist for better user experience
   ============================================================================= */

// Enhanced Tab Management System
class EnhancedTabSystem {
    constructor(tabContainerSelector = '.plan-tabs') {
        this.tabContainer = document.querySelector(tabContainerSelector);
        this.tabs = this.tabContainer?.querySelectorAll('.plan-tab') || [];
        this.tabContents = document.querySelectorAll('.plan-tab-content');
        this.progressBar = document.querySelector('.tab-progress');
        this.currentTabIndex = 0;
        this.completedTabs = new Set();
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.updateProgress();
        this.setInitialState();
    }
    
    bindEvents() {
        this.tabs.forEach((tab, index) => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = tab.getAttribute('data-tab');
                this.switchTab(tabName, index);
            });
            
            // Keyboard navigation
            tab.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    tab.click();
                }
                
                if (e.key === 'ArrowLeft' && index > 0) {
                    this.tabs[index - 1].focus();
                }
                
                if (e.key === 'ArrowRight' && index < this.tabs.length - 1) {
                    this.tabs[index + 1].focus();
                }
            });
        });
    }
    
    switchTab(tabName, index = null) {
        if (index === null) {
            index = this.findTabIndex(tabName);
        }
        
        if (index === -1) return;
        
        // Validate tab transition
        if (!this.canSwitchToTab(index)) {
            this.showValidationMessage(index);
            return;
        }
        
        this.currentTabIndex = index;
        this.updateActiveStates(tabName);
        this.updateProgress();
        this.markTabAsCompleted(this.currentTabIndex);
        this.animateTabSwitch(tabName);
        
        // Trigger validation for the new tab
        this.validateCurrentTab();
        
        // Analytics
        this.trackTabSwitch(tabName, index);
    }
    
    findTabIndex(tabName) {
        return Array.from(this.tabs).findIndex(tab => 
            tab.getAttribute('data-tab') === tabName
        );
    }
    
    canSwitchToTab(targetIndex) {
        // Allow switching to any previous tab or the next immediate tab
        const maxAllowedIndex = Math.max(...this.completedTabs) + 1;
        return targetIndex <= maxAllowedIndex || targetIndex <= this.currentTabIndex + 1;
    }
    
    updateActiveStates(activeTabName) {
        // Update tab buttons
        this.tabs.forEach(tab => {
            const isActive = tab.getAttribute('data-tab') === activeTabName;
            tab.classList.toggle('active', isActive);
            tab.setAttribute('aria-selected', isActive);
            tab.setAttribute('tabindex', isActive ? '0' : '-1');
        });
        
        // Update tab contents
        this.tabContents.forEach(content => {
            const isActive = content.id === `planEditTab-${activeTabName}`;
            content.classList.toggle('active', isActive);
            content.setAttribute('aria-hidden', !isActive);
        });
    }
    
    updateProgress() {
        if (!this.progressBar) return;
        
        const progressPercentage = ((this.currentTabIndex + 1) / this.tabs.length) * 100;
        this.progressBar.style.width = `${progressPercentage}%`;
        
        // Add completion animation
        this.progressBar.style.transition = 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
    }
    
    markTabAsCompleted(index) {
        this.completedTabs.add(index);
        const tab = this.tabs[index];
        if (tab) {
            tab.classList.add('completed');
            
            // Add success animation
            const stepCounter = tab.querySelector('.step-counter');
            if (stepCounter) {
                stepCounter.style.animation = 'pulse 0.6s ease';
                setTimeout(() => {
                    stepCounter.style.animation = '';
                }, 600);
            }
        }
    }
    
    animateTabSwitch(tabName) {
        const activeContent = document.querySelector(`#planEditTab-${tabName}`);
        if (activeContent) {
            // Reset animation
            activeContent.style.opacity = '0';
            activeContent.style.transform = 'translateY(20px)';
            
            // Trigger reflow
            activeContent.offsetHeight;
            
            // Animate in
            setTimeout(() => {
                activeContent.style.opacity = '1';
                activeContent.style.transform = 'translateY(0)';
            }, 50);
        }
    }
    
    validateCurrentTab() {
        const currentTab = this.tabs[this.currentTabIndex];
        const tabName = currentTab?.getAttribute('data-tab');
        
        if (!tabName) return;
        
        // Call specific validation based on tab
        switch (tabName) {
            case 'basic':
                this.validateBasicTab();
                break;
            case 'courses':
                this.validateCoursesTab();
                break;
            case 'advanced':
                this.validateAdvancedTab();
                break;
            case 'preview':
                this.validatePreviewTab();
                break;
        }
    }
    
    validateBasicTab() {
        const requiredFields = ['editPlanName', 'editPlanCategory', 'editPlanPrice', 'editPlanBillingType'];
        let isValid = true;
        
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field && !field.value.trim()) {
                isValid = false;
                this.highlightInvalidField(field);
            } else if (field) {
                this.clearFieldValidation(field);
            }
        });
        
        this.updateTabValidationState('basic', isValid);
        return isValid;
    }
    
    validateCoursesTab() {
        const selectedCourses = document.querySelectorAll('#editCoursesGrid input[type="checkbox"]:checked');
        const isValid = selectedCourses.length > 0;
        
        const alert = document.getElementById('coursesValidationAlert');
        const successAlert = document.getElementById('coursesSuccessAlert');
        
        if (alert && successAlert) {
            if (isValid) {
                alert.style.display = 'none';
                successAlert.style.display = 'block';
            } else {
                alert.style.display = 'block';
                successAlert.style.display = 'none';
            }
        }
        
        this.updateTabValidationState('courses', isValid);
        return isValid;
    }
    
    validateAdvancedTab() {
        // Advanced tab is generally optional, so always valid
        this.updateTabValidationState('advanced', true);
        return true;
    }
    
    validatePreviewTab() {
        // Update preview content
        this.updatePreviewContent();
        this.updateTabValidationState('preview', true);
        return true;
    }
    
    updateTabValidationState(tabName, isValid) {
        const tab = document.querySelector(`[data-tab="${tabName}"]`);
        if (tab) {
            tab.classList.toggle('invalid', !isValid);
            tab.classList.toggle('valid', isValid);
            
            // Update ARIA attributes
            tab.setAttribute('aria-invalid', !isValid);
        }
    }
    
    highlightInvalidField(field) {
        field.classList.add('invalid');
        field.style.borderColor = '#EF4444';
        field.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
        
        // Remove highlight after user interaction
        const removeHighlight = () => {
            field.classList.remove('invalid');
            field.style.borderColor = '';
            field.style.boxShadow = '';
            field.removeEventListener('input', removeHighlight);
            field.removeEventListener('change', removeHighlight);
        };
        
        field.addEventListener('input', removeHighlight);
        field.addEventListener('change', removeHighlight);
    }
    
    clearFieldValidation(field) {
        field.classList.remove('invalid');
        field.style.borderColor = '';
        field.style.boxShadow = '';
    }
    
    showValidationMessage(targetIndex) {
        const currentTabName = this.tabs[this.currentTabIndex]?.getAttribute('data-tab');
        
        // Create toast notification
        this.showToast(
            '⚠️ Complete os campos obrigatórios',
            `Por favor, complete todas as informações da aba atual antes de prosseguir.`,
            'warning'
        );
        
        // Highlight current tab validation issues
        this.validateCurrentTab();
    }
    
    showToast(title, message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `tab-toast tab-toast-${type}`;
        toast.innerHTML = `
            <div class="toast-icon">${type === 'warning' ? '⚠️' : '✅'}</div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        // Add toast styles
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'warning' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(16, 185, 129, 0.95)'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 12px;
            max-width: 400px;
            animation: slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        `;
        
        document.body.appendChild(toast);
        
        // Auto remove after 4 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.animation = 'slideOutRight 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                setTimeout(() => toast.remove(), 400);
            }
        }, 4000);
    }
    
    updatePreviewContent() {
        const preview = {
            name: document.getElementById('editPlanName')?.value || 'Nome do Plano',
            price: document.getElementById('editPlanPrice')?.value || '0,00',
            description: document.getElementById('editPlanDescription')?.value || 'Descrição do plano',
            category: document.getElementById('editPlanCategory')?.selectedOptions[0]?.text || '-',
            billingType: document.getElementById('editPlanBillingType')?.selectedOptions[0]?.text || '-',
            classesPerWeek: document.getElementById('editPlanClassesPerWeek')?.value || '2'
        };
        
        // Update preview elements
        const elements = {
            'editPreviewPlanName': preview.name,
            'editPreviewPlanPrice': `R$ ${preview.price}`,
            'editPreviewPlanDescription': preview.description,
            'editPreviewCategory': preview.category,
            'editPreviewBillingType': preview.billingType,
            'editPreviewClassesPerWeek': preview.classesPerWeek + ' aulas'
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
        
        // Update courses preview
        const selectedCourses = document.querySelectorAll('#editCoursesGrid input[type="checkbox"]:checked');
        const coursesText = selectedCourses.length > 0 
            ? Array.from(selectedCourses).map(cb => cb.getAttribute('data-course-name')).join(', ')
            : 'Nenhum curso selecionado';
        
        const coursesElement = document.getElementById('editPreviewCourses');
        if (coursesElement) coursesElement.textContent = coursesText;
    }
    
    setInitialState() {
        // Set first tab as completed by default
        this.markTabAsCompleted(0);
        
        // Set ARIA attributes
        this.tabs.forEach((tab, index) => {
            tab.setAttribute('role', 'tab');
            tab.setAttribute('aria-selected', index === 0);
            tab.setAttribute('tabindex', index === 0 ? '0' : '-1');
        });
        
        this.tabContents.forEach((content, index) => {
            content.setAttribute('role', 'tabpanel');
            content.setAttribute('aria-hidden', index !== 0);
        });
    }
    
    trackTabSwitch(tabName, index) {
        // Analytics tracking
        if (typeof gtag !== 'undefined') {
            gtag('event', 'tab_switch', {
                event_category: 'plan_editor',
                event_label: tabName,
                value: index
            });
        }
        
        console.log(`📊 Tab switched to: ${tabName} (index: ${index})`);
    }
    
    // Public methods for external use
    nextTab() {
        if (this.currentTabIndex < this.tabs.length - 1) {
            const nextIndex = this.currentTabIndex + 1;
            const nextTabName = this.tabs[nextIndex].getAttribute('data-tab');
            this.switchTab(nextTabName, nextIndex);
        }
    }
    
    prevTab() {
        if (this.currentTabIndex > 0) {
            const prevIndex = this.currentTabIndex - 1;
            const prevTabName = this.tabs[prevIndex].getAttribute('data-tab');
            this.switchTab(prevTabName, prevIndex);
        }
    }
    
    goToTab(tabName) {
        const index = this.findTabIndex(tabName);
        if (index !== -1) {
            this.switchTab(tabName, index);
        }
    }
    
    validateAllTabs() {
        let allValid = true;
        
        this.tabs.forEach((tab, index) => {
            const tabName = tab.getAttribute('data-tab');
            const isValid = this.validateTab(tabName);
            if (!isValid) allValid = false;
        });
        
        return allValid;
    }
    
    validateTab(tabName) {
        switch (tabName) {
            case 'basic': return this.validateBasicTab();
            case 'courses': return this.validateCoursesTab();
            case 'advanced': return this.validateAdvancedTab();
            case 'preview': return this.validatePreviewTab();
            default: return true;
        }
    }
}

// Initialize enhanced tab system when DOM is ready
let enhancedTabSystem;

document.addEventListener('DOMContentLoaded', () => {
    enhancedTabSystem = new EnhancedTabSystem();
});

// Enhanced switch function for backward compatibility
function switchPlanEditTab(tabName) {
    if (enhancedTabSystem) {
        enhancedTabSystem.switchTab(tabName);
    } else {
        // Fallback to original function
        console.warn('Enhanced tab system not initialized, using fallback');
        switchPlanEditTabFallback(tabName);
    }
}

// Fallback function
function switchPlanEditTabFallback(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.plan-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('.plan-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab content
    const selectedContent = document.getElementById(`planEditTab-${tabName}`);
    if (selectedContent) {
        selectedContent.classList.add('active');
    }
    
    // Add active class to selected tab
    const selectedTab = document.querySelector(`[data-tab="${tabName}"]`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
}

// CSS animations for toasts
const toastStyles = document.createElement('style');
toastStyles.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
    
    @keyframes pulse {
        0%, 100% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.1);
        }
    }
    
    .toast-close {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        line-height: 1;
    }
    
    .toast-close:hover {
        background: rgba(255, 255, 255, 0.3);
    }
`;

document.head.appendChild(toastStyles);
