/**
 * GERADOR DE TEMPLATES MODULARES
 * Padroniza a criação de novos módulos seguindo CLAUDE.md
 */

class ModuleTemplateGenerator {
    
    /**
     * Gera HTML padronizado para um módulo
     */
    static generateHTML(moduleName, config) {
        const {
            title = 'Módulo',
            subtitle = 'Descrição do módulo',
            icon = '📋',
            buttons = [],
            stats = [],
            content = '',
            tableConfig = null
        } = config;

        return `
<!-- ${title} Module - Generated with ModuleTemplateGenerator -->
<div class="${moduleName}-isolated">
    <div class="${moduleName}-isolated-container module-isolated-base">
        <!-- Header Section -->
        <div class="${moduleName}-isolated-page-header module-isolated-header">
            <div class="${moduleName}-isolated-header-content">
                <div class="${moduleName}-isolated-header-left">
                    <h1 class="${moduleName}-isolated-page-title">
                        ${icon} ${title}
                    </h1>
                    <p class="${moduleName}-isolated-page-subtitle">${subtitle}</p>
                </div>
                <div class="${moduleName}-isolated-header-actions">
                    ${buttons.map(btn => `
                    <button class="module-isolated-btn ${btn.type || 'module-isolated-btn-primary'}" 
                            ${btn.action ? `data-action="${btn.action}"` : ''}>
                        ${btn.text}
                    </button>`).join('')}
                </div>
            </div>
        </div>

        ${stats.length > 0 ? `
        <!-- Stats Grid -->
        <div class="${moduleName}-isolated-stats-grid module-isolated-stats-grid">
            ${stats.map(stat => `
            <div class="${moduleName}-isolated-stat-card module-isolated-stat-card">
                <div class="module-isolated-stat-header">
                    <span class="module-isolated-stat-title">${stat.title}</span>
                    <span class="module-isolated-stat-icon">${stat.icon}</span>
                </div>
                <div class="module-isolated-stat-value" id="${stat.id || ''}">${stat.value}</div>
                <div class="module-isolated-stat-subtitle">${stat.subtitle}</div>
            </div>`).join('')}
        </div>` : ''}

        ${tableConfig ? `
        <!-- Data Section -->
        <div class="${moduleName}-isolated-data-section module-isolated-data-section">
            <div class="${moduleName}-isolated-section-header module-isolated-section-header">
                <h2 class="module-isolated-section-title">${tableConfig.title}</h2>
                <div class="module-isolated-section-actions">
                    ${tableConfig.actions?.map(action => `
                    <button class="module-isolated-btn ${action.type || 'module-isolated-btn-secondary'} module-isolated-btn-sm"
                            ${action.action ? `data-action="${action.action}"` : ''}>
                        ${action.text}
                    </button>`).join('') || ''}
                </div>
            </div>
            
            <div class="${moduleName}-isolated-table-container">
                <table class="${moduleName}-isolated-data-table module-isolated-data-table">
                    <thead>
                        <tr>
                            ${tableConfig.columns?.map(col => `<th>${col}</th>`).join('') || ''}
                        </tr>
                    </thead>
                    <tbody id="${moduleName}TableBody">
                        <!-- Data will be populated by JavaScript -->
                    </tbody>
                </table>
            </div>
        </div>` : ''}

        ${content ? `
        <!-- Custom Content -->
        <div class="${moduleName}-isolated-content">
            ${content}
        </div>` : ''}
    </div>
</div>`;
    }

    /**
     * Gera CSS específico para um módulo (apenas customizações)
     */
    static generateCSS(moduleName, customizations = {}) {
        const {
            primaryColor = '#10b981',
            secondaryColor = '#059669',
            accentColor = '#3b82f6'
        } = customizations;

        return `
/* ${moduleName.toUpperCase()} MODULE - Custom Styles */
/* Base system imported from module-system.css */

/* Customizações específicas do módulo ${moduleName} */
.${moduleName}-isolated .${moduleName}-isolated-page-header {
    background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%) !important;
}

.${moduleName}-isolated .module-isolated-btn-primary {
    background: linear-gradient(135deg, ${accentColor} 0%, ${accentColor}dd 100%) !important;
}

/* Customizações adicionais aqui */
`;
    }

    /**
     * Gera estrutura JavaScript básica para um módulo
     */
    static generateJS(moduleName, config = {}) {
        const {
            apiEndpoint = `/api/${moduleName}`,
            hasStats = true,
            hasTable = true
        } = config;

        return `
/**
 * ${moduleName.toUpperCase()} MODULE
 * Generated with ModuleTemplateGenerator
 */

(function() {
    'use strict';

    // Module state
    let currentData = [];
    let isLoading = false;

    // Initialize module
    async function initialize${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}() {
        console.log('🔧 Initializing ${moduleName} module...');
        
        try {
            // Setup event listeners
            setupEventListeners();
            
            // Load initial data
            await loadData();
            
            console.log('✅ ${moduleName} module initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing ${moduleName} module:', error);
            showError('Erro ao inicializar módulo: ' + error.message);
        }
    }

    // Load data from API
    async function loadData() {
        try {
            setLoading(true);
            
            const response = await fetch('${apiEndpoint}');
            const result = await response.json();
            
            if (result.success) {
                currentData = result.data || [];
                
                ${hasStats ? 'updateStats(currentData);' : ''}
                ${hasTable ? 'renderTable(currentData);' : ''}
            } else {
                throw new Error(result.message || 'Failed to load data');
            }
        } catch (error) {
            console.error('❌ Error loading data:', error);
            showError('Erro ao carregar dados: ' + error.message);
        } finally {
            setLoading(false);
        }
    }

    ${hasStats ? `
    // Update statistics
    function updateStats(data) {
        // Implement stats calculation
        console.log('📊 Updating stats with', data.length, 'items');
    }` : ''}

    ${hasTable ? `
    // Render data table
    function renderTable(data) {
        const tbody = document.getElementById('${moduleName}TableBody');
        if (!tbody) return;
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="100%" class="text-center text-muted">Nenhum dado encontrado</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.map(item => \`
            <tr>
                <!-- Customize table rows here -->
                <td>\${item.name || 'N/A'}</td>
                <td>
                    <button class="module-isolated-btn module-isolated-btn-primary module-isolated-btn-sm" 
                            onclick="editItem('\${item.id}')">
                        Editar
                    </button>
                </td>
            </tr>
        \`).join('');
    }` : ''}

    // Setup event listeners
    function setupEventListeners() {
        // Add your event listeners here
        console.log('🎯 Setting up event listeners for ${moduleName}');
    }

    // Utility functions
    function setLoading(loading) {
        isLoading = loading;
        // Update UI loading state
    }

    function showError(message) {
        console.error('❌ Error:', message);
        alert('Erro: ' + message);
    }

    function showSuccess(message) {
        console.log('✅ Success:', message);
        alert('Sucesso: ' + message);
    }

    // Global functions
    window.editItem = function(id) {
        console.log('✏️ Edit item:', id);
        // Implement edit functionality
    };

    // Export initialization function
    window.initialize${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)} = initialize${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)};

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)});
    } else {
        initialize${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}();
    }

    console.log('📝 ${moduleName} module script loaded');

})();
`;
    }

    /**
     * Gera configuração completa para um módulo
     */
    static generateModuleConfig(moduleName, options = {}) {
        return {
            name: moduleName,
            html: this.generateHTML(moduleName, options),
            css: this.generateCSS(moduleName, options.colors),
            js: this.generateJS(moduleName, options.features)
        };
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModuleTemplateGenerator;
} else {
    window.ModuleTemplateGenerator = ModuleTemplateGenerator;
}

console.log('🏗️ Module Template Generator loaded');
