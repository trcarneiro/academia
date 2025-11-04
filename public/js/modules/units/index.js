/**
 * Units Module - SIMPLIFIED VERSION (Single-file)
 * Manages training units (academies) and their training areas
 * Based on Instructors module template - AGENTS.md v2.1 compliant
 */

// Prevent multiple declarations
if (typeof window.UnitsModule !== 'undefined') {
    console.log('🏢 Units Module already loaded, skipping...');
} else {

const UnitsModule = {
    // Module properties
    container: null,
    units: [],
    initialized: false,

    /**
     * Initialize the module - SIMPLIFIED
     */
    async init() {
        try {
            if (this.initialized) {
                console.log('🏢 Units Module already initialized, skipping...');
                return this;
            }
            
            console.log('🏢 Units Module - Starting (Simplified)...');
            
            if (!this.container) {
                throw new Error('Container not set before initialization');
            }
            
            // Load data and render in one go
            await this.loadData();
            this.render();
            this.setupEvents();
            
            // Register module globally for compatibility
            window.unitsModule = this;
            window.unitsController = this; // Compatibility with existing code
            
            // Dispatch module loaded event
            if (window.app) {
                window.app.dispatchEvent('module:loaded', { name: 'units' });
            }
            
            this.initialized = true;
            console.log('✅ Units Module - Loaded (Simplified)');
            
            return this;
        } catch (error) {
            console.error('❌ Units Module initialization failed:', error);
            if (window.app) {
                window.app.handleError(error, 'Units Module Init');
            }
            throw error;
        }
    },

    /**
     * Load units data from API
     */
    async loadData() {
        try {
            console.log('📡 Loading units data...');
            
            const response = await fetch('/api/units');
            const data = await response.json();
            
            if (data.success) {
                this.units = data.data || [];
                console.log(`📊 Loaded ${this.units.length} units`);
            } else {
                throw new Error(data.error || 'Failed to load units');
            }
        } catch (error) {
            console.error('❌ Error loading units:', error);
            throw error;
        }
    },

    /**
     * Show success message
     */
    showSuccess(message) {
        if (window.showSuccess) {
            window.showSuccess(message);
        } else {
            // Fallback: create inline notification
            this.showNotification(message, 'success');
        }
    },

    /**
     * Show error message
     */
    showError(message) {
        if (window.showError) {
            window.showError(message);
        } else {
            // Fallback: create inline notification
            this.showNotification(message, 'error');
        }
    },

    /**
     * Show inline notification
     */
    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existing = document.querySelector('.unit-notification');
        if (existing) {
            existing.remove();
        }

        // Create notification
        const notification = document.createElement('div');
        notification.className = `unit-notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">
                    ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
                </span>
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // Insert at top of container
        this.container.insertBefore(notification, this.container.firstChild);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    },

    /**
     * Render main units list - EXACT SAME STRUCTURE AS INSTRUCTORS
     */
    render() {
        const totalUnits = this.units.length;
        const activeUnits = this.units.filter(unit => unit.isActive).length;
        const totalCapacity = this.units.reduce((sum, unit) => sum + (unit.capacity || 0), 0);

        this.container.innerHTML = `
            <!-- Premium Header -->
            <div class="module-header-premium">
                <div class="breadcrumb">
                    <span class="breadcrumb-item active">🏢 Unidades</span>
                </div>
                <h1 class="module-title-premium">
                    🏢 Gestão de Unidades
                </h1>
                <div class="module-subtitle">
                    Gerencie unidades e áreas de treino da academia
                </div>
                <div class="header-actions">
                    <button class="btn btn-primary" onclick="window.unitsModule.navigateToEditor()">
                        <i class="fas fa-plus"></i>
                        Nova Unidade
                    </button>
                </div>
            </div>

            <!-- Stats Cards - EXACT SAME AS INSTRUCTORS -->
            <div class="stats-grid">
                <div class="stat-card-enhanced">
                    <div class="stat-icon">
                        <i class="fas fa-building"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number">${totalUnits}</div>
                        <div class="stat-label">Total de Unidades</div>
                    </div>
                </div>

                <div class="stat-card-enhanced">
                    <div class="stat-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number">${activeUnits}</div>
                        <div class="stat-label">Unidades Ativas</div>
                    </div>
                </div>

                <div class="stat-card-enhanced">
                    <div class="stat-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number">${totalCapacity}</div>
                        <div class="stat-label">Capacidade Total</div>
                    </div>
                </div>
            </div>

            <!-- Units Table - PREMIUM STYLE -->
            <div class="data-card-premium">
                <div class="card-header">
                    <h3>Lista de Unidades</h3>
                    <div class="search-filter">
                        <input type="text" placeholder="🔍 Buscar unidades..." class="search-input">
                    </div>
                </div>
                <table class="data-table-premium">
                    <thead>
                        <tr>
                            <th>Unidade</th>
                            <th>Localização</th>
                            <th>Capacidade</th>
                            <th>Áreas de Treino</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.units.map(unit => this.renderUnitRow(unit)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    /**
     * Render single unit row - EXACT SAME PATTERN AS INSTRUCTORS
     */
    renderUnitRow(unit) {
        const statusClass = unit.isActive ? 'status-active' : 'status-inactive';
        const statusText = unit.isActive ? 'Ativo' : 'Inativo';

        return `
            <tr class="data-row-premium" data-id="${unit.id}">
                <td>
                    <div class="unit-info-premium">
                        <div class="unit-avatar-premium">
                            <span>🏢</span>
                        </div>
                        <div class="unit-details">
                            <div class="unit-name">${unit.name}</div>
                            <div class="unit-responsible">${unit.responsibleName || 'Sem responsável'}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="location-info">
                        <div class="address">${unit.address}${unit.addressNumber ? ', ' + unit.addressNumber : ''}</div>
                        <div class="city">${unit.city} - ${unit.state}</div>
                    </div>
                </td>
                <td>
                    <div class="capacity-info">
                        <span class="capacity-number">${unit.capacity}</span>
                        <span class="capacity-label">pessoas</span>
                    </div>
                </td>
                <td>
                    <div class="training-areas-info">
                        <span class="areas-count">${unit.trainingAreas?.length || 0}</span>
                        <span class="areas-label">áreas</span>
                    </div>
                </td>
                <td>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon" onclick="window.unitsModule.navigateToEditor('${unit.id}')" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon btn-danger" onclick="window.unitsModule.confirmDelete('${unit.id}')" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    },

    /**
     * Setup event listeners - SAME PATTERN AS INSTRUCTORS
     */
    setupEvents() {
        // Double-click to edit (SPA navigation standard)
        const rows = this.container.querySelectorAll('.data-row-premium');
        rows.forEach(row => {
            row.addEventListener('dblclick', (e) => {
                const unitId = row.getAttribute('data-id');
                this.navigateToEditor(unitId);
            });
        });

        // Search functionality
        const searchInput = this.container.querySelector('.search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterUnits(e.target.value);
            });
        }
    },

    /**
     * Filter units by search term
     */
    filterUnits(searchTerm) {
        const rows = this.container.querySelectorAll('.data-row-premium');
        const term = searchTerm.toLowerCase();

        rows.forEach(row => {
            const unitName = row.querySelector('.unit-name')?.textContent.toLowerCase() || '';
            const address = row.querySelector('.address')?.textContent.toLowerCase() || '';
            const city = row.querySelector('.city')?.textContent.toLowerCase() || '';
            
            const matches = unitName.includes(term) || address.includes(term) || city.includes(term);
            row.style.display = matches ? '' : 'none';
        });
    },

    /**
     * Delete unit with confirmation
     */
    async confirmDelete(unitId) {
        const unit = this.units.find(u => u.id === unitId);
        if (!unit) {
            this.showError('Unidade não encontrada');
            return;
        }

        if (confirm(`Tem certeza que deseja excluir a unidade "${unit.name}"?`)) {
            try {
                const response = await fetch(`/api/units/${unitId}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    this.showSuccess('Unidade excluída com sucesso!');
                    await this.loadData();
                    this.render();
                    this.setupEvents();
                } else {
                    const error = await response.json();
                    this.showError(error.message || 'Erro ao excluir unidade');
                }
            } catch (error) {
                console.error('❌ Erro ao excluir:', error);
                this.showError('Erro ao excluir unidade');
            }
        }
    },

    /**
     * Navigate to editor - INTERNAL NAVIGATION (SPA Style)
     */
    async navigateToEditor(unitId = null) {
        console.log('🔄 Navigating to editor internally:', unitId ? `edit ${unitId}` : 'create new');
        
        try {
            // Render editor within the container
            await this.renderEditor(unitId);
        } catch (error) {
            console.error('❌ Erro ao abrir editor:', error);
            this.showError('Erro ao carregar editor de unidade');
        }
    },

    /**
     * Render inline editor - NEW METHOD
     */
    async renderEditor(unitId = null) {
        const isEdit = unitId !== null;
        const title = isEdit ? 'Editar Unidade' : 'Nova Unidade';
        
        // Get unit data if editing
        let unitData = null;
        if (isEdit) {
            try {
                const response = await fetch(`/api/units/${unitId}`);
                if (response.ok) {
                    const result = await response.json();
                    unitData = result.data;
                    
                    // Convert isActive boolean to status string
                    unitData.status = unitData.isActive ? 'ACTIVE' : 'INACTIVE';
                }
            } catch (error) {
                console.error('❌ Erro ao carregar unidade:', error);
                this.showError('Erro ao carregar dados da unidade');
                return;
            }
        }

        // Render editor form
        this.container.innerHTML = `
            <div class="module-header-premium">
                <div class="breadcrumb">
                    <span class="breadcrumb-item" onclick="window.unitsModule.showList()">🏢 Unidades</span>
                    <span class="breadcrumb-separator">></span>
                    <span class="breadcrumb-item active">${title}</span>
                </div>
                <h1>${title}</h1>
            </div>

            <div class="unit-editor-container">
                <form id="unit-form" class="unit-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="name">Nome da Unidade *</label>
                            <input type="text" id="name" name="name" required 
                                   value="${unitData?.name || ''}">
                        </div>
                        <div class="form-group">
                            <label for="responsibleName">Responsável</label>
                            <input type="text" id="responsibleName" name="responsibleName" 
                                   value="${unitData?.responsibleName || ''}">
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="description">Descrição</label>
                        <textarea id="description" name="description" rows="3">${unitData?.description || ''}</textarea>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="address">Endereço *</label>
                            <input type="text" id="address" name="address" required 
                                   value="${unitData?.address || ''}">
                        </div>
                        <div class="form-group">
                            <label for="addressNumber">Número</label>
                            <input type="text" id="addressNumber" name="addressNumber" 
                                   value="${unitData?.addressNumber || ''}">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="neighborhood">Bairro</label>
                            <input type="text" id="neighborhood" name="neighborhood" 
                                   value="${unitData?.neighborhood || ''}">
                        </div>
                        <div class="form-group">
                            <label for="complement">Complemento</label>
                            <input type="text" id="complement" name="complement" 
                                   value="${unitData?.complement || ''}">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="city">Cidade *</label>
                            <input type="text" id="city" name="city" required 
                                   value="${unitData?.city || ''}">
                        </div>
                        <div class="form-group">
                            <label for="state">Estado *</label>
                            <select id="state" name="state" required>
                                <option value="">Selecione...</option>
                                <option value="SP" ${unitData?.state === 'SP' ? 'selected' : ''}>São Paulo</option>
                                <option value="RJ" ${unitData?.state === 'RJ' ? 'selected' : ''}>Rio de Janeiro</option>
                                <option value="MG" ${unitData?.state === 'MG' ? 'selected' : ''}>Minas Gerais</option>
                                <!-- Add more states as needed -->
                            </select>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="zipCode">CEP *</label>
                            <input type="text" id="zipCode" name="zipCode" required 
                                   value="${unitData?.zipCode || ''}">
                        </div>
                        <div class="form-group">
                            <label for="phone">Telefone</label>
                            <input type="tel" id="phone" name="phone" 
                                   value="${unitData?.phone || ''}">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="email">Email</label>
                            <input type="email" id="email" name="email" 
                                   value="${unitData?.email || ''}">
                        </div>
                        <div class="form-group">
                            <label for="capacity">Capacidade Total *</label>
                            <input type="number" id="capacity" name="capacity" required min="1" 
                                   value="${unitData?.capacity || 100}">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="totalMats">Número de Tatames</label>
                            <input type="number" id="totalMats" name="totalMats" min="1" 
                                   value="${unitData?.totalMats || 1}">
                        </div>
                        <div class="form-group">
                            <label for="status">Status</label>
                            <select id="status" name="status">
                                <option value="ACTIVE" ${unitData?.status === 'ACTIVE' ? 'selected' : ''}>Ativo</option>
                                <option value="INACTIVE" ${unitData?.status === 'INACTIVE' ? 'selected' : ''}>Inativo</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="window.unitsModule.showList()">
                            ← Voltar
                        </button>
                        <button type="submit" class="btn btn-primary">
                            ${isEdit ? 'Atualizar' : 'Criar'} Unidade
                        </button>
                        ${isEdit ? `
                            <button type="button" class="btn btn-danger" onclick="window.unitsModule.confirmDelete('${unitId}')">
                                🗑️ Excluir
                            </button>
                        ` : ''}
                    </div>
                </form>

                ${isEdit ? `
                    <!-- Training Areas Section -->
                    <div class="training-areas-section">
                        <div class="section-header">
                            <h3>🏃 Áreas de Treino</h3>
                            <button type="button" class="btn btn-secondary" onclick="window.unitsModule.addTrainingArea('${unitId}')">
                                <i class="fas fa-plus"></i>
                                Nova Área
                            </button>
                        </div>
                        <div id="training-areas-container" class="training-areas-container">
                            <!-- Training areas will be loaded here -->
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        // Setup form events
        this.setupEditorEvents(unitId);
        
        // Load training areas if editing
        if (unitId) {
            await this.loadTrainingAreas(unitId);
        }
    },

    /**
     * Setup editor form events
     */
    setupEditorEvents(unitId = null) {
        const form = document.getElementById('unit-form');
        const self = this; // Preserve context

        // Format CEP and phone inputs
        const cepInput = document.getElementById('zipCode');
        const phoneInput = document.getElementById('phone');

        if (cepInput) {
            cepInput.addEventListener('input', (e) => {
                e.target.value = self.formatCEP(e.target.value);
            });
        }

        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => {
                e.target.value = self.formatPhone(e.target.value);
            });
        }

        // Form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await self.handleFormSubmit(unitId);
        });
    },

    /**
     * Handle form submission
     */
    async handleFormSubmit(unitId = null) {
        const form = document.getElementById('unit-form');
        const formData = new FormData(form);
        const isEdit = unitId !== null;

        // Prepare data in correct API format
        const data = {
            name: formData.get('name'),
            description: formData.get('description'),
            address: formData.get('address'),
            addressNumber: formData.get('addressNumber'),
            complement: formData.get('complement'),
            neighborhood: formData.get('neighborhood'),
            city: formData.get('city'),
            state: formData.get('state'),
            zipCode: formData.get('zipCode'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            capacity: parseInt(formData.get('capacity')) || 100,
            totalMats: parseInt(formData.get('totalMats')) || 1,
            responsibleName: formData.get('responsibleName'),
            isActive: formData.get('status') === 'ACTIVE' // Convert string to boolean
        };

        console.log('=== UNITS FRONTEND DEBUG ===');
        console.log('Unit ID:', unitId);
        console.log('Is Edit:', isEdit);
        console.log('Form Data:', data);

        try {
            const url = isEdit ? `/api/units/${unitId}` : '/api/units';
            const method = isEdit ? 'PUT' : 'POST';

            console.log('Request URL:', url);
            console.log('Request Method:', method);

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            console.log('Response Status:', response.status);

            if (response.ok) {
                this.showSuccess(isEdit ? 'Unidade atualizada com sucesso!' : 'Unidade criada com sucesso!');
                await this.loadData();
                this.showList();
            } else {
                const error = await response.json();
                console.log('Error Response:', error);
                this.showError(error.message || error.error || 'Erro ao salvar unidade');
            }
        } catch (error) {
            console.error('❌ Erro ao salvar:', error);
            this.showError('Erro ao salvar unidade');
        }
    },

    /**
     * Show main list view
     */
    showList() {
        this.render();
        this.setupEvents();
    },

    /**
     * Format CEP
     */
    formatCEP(value) {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .replace(/(-\d{3})\d+?$/, '$1');
    },

    /**
     * Format phone
     */
    formatPhone(value) {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{4,5})(\d{4})/, '$1-$2')
            .replace(/(-\d{4})\d+?$/, '$1');
    },

    /**
     * Refresh/reload data - SAME AS INSTRUCTORS
     */
    async refresh() {
        try {
            await this.loadData();
            this.render();
            this.setupEvents();
        } catch (error) {
            console.error('❌ Error refreshing units:', error);
            this.showError('Erro ao atualizar dados');
        }
    },

    /**
     * Load training areas for a unit
     */
    async loadTrainingAreas(unitId) {
        try {
            console.log('📡 Loading training areas for unit:', unitId);
            
            const response = await fetch(`/api/training-areas?unitId=${unitId}`);
            const data = await response.json();
            
            if (data.success) {
                const trainingAreas = data.data || [];
                this.renderTrainingAreas(trainingAreas, unitId);
            } else {
                throw new Error(data.error || 'Failed to load training areas');
            }
        } catch (error) {
            console.error('❌ Error loading training areas:', error);
            this.showError('Erro ao carregar áreas de treino');
        }
    },

    /**
     * Render training areas list
     */
    renderTrainingAreas(trainingAreas, unitId) {
        const container = document.getElementById('training-areas-container');
        if (!container) return;

        if (trainingAreas.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🏃</div>
                    <div class="empty-title">Nenhuma área de treino cadastrada</div>
                    <div class="empty-subtitle">Adicione áreas de treino para esta unidade</div>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="training-areas-grid">
                ${trainingAreas.map(area => this.renderTrainingAreaCard(area)).join('')}
            </div>
        `;
    },

    /**
     * Render single training area card
     */
    renderTrainingAreaCard(area) {
        const statusClass = area.isActive ? 'status-active' : 'status-inactive';
        const statusText = area.isActive ? 'Ativo' : 'Inativo';
        const equipmentText = area.equipment && area.equipment.length > 0 
            ? area.equipment.join(', ') 
            : 'Sem equipamentos';

        return `
            <div class="training-area-card" data-id="${area.id}">
                <div class="area-header">
                    <div class="area-name">${area.name}</div>
                    <div class="area-type">${this.getAreaTypeLabel(area.areaType)}</div>
                </div>
                <div class="area-info">
                    <div class="area-capacity">
                        <i class="fas fa-users"></i>
                        ${area.capacity} pessoas
                    </div>
                    <div class="area-dimensions">
                        <i class="fas fa-ruler"></i>
                        ${area.dimensions || 'Não informado'}
                    </div>
                    <div class="area-flooring">
                        <i class="fas fa-layer-group"></i>
                        ${this.getFlooringLabel(area.flooring)}
                    </div>
                </div>
                <div class="area-equipment">
                    <strong>Equipamentos:</strong> ${equipmentText}
                </div>
                <div class="area-status">
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </div>
                <div class="area-actions">
                    <button class="btn btn-sm btn-primary" onclick="window.unitsModule.editTrainingArea('${area.id}')">
                        <i class="fas fa-edit"></i>
                        Editar
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="window.unitsModule.deleteTrainingArea('${area.id}')">
                        <i class="fas fa-trash"></i>
                        Excluir
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Get area type label
     */
    getAreaTypeLabel(areaType) {
        const labels = {
            'DOJO': '🥋 Dojo',
            'OUTDOOR': '🌳 Área Externa',
            'WEIGHT_ROOM': '🏋️ Musculação',
            'CARDIO': '❤️ Cardio',
            'CROSSTRAINING': '🔥 Cross Training',
            'FUNCTIONAL': '💪 Funcional',
            'OTHER': '📦 Outros'
        };
        return labels[areaType] || areaType;
    },

    /**
     * Get flooring label
     */
    getFlooringLabel(flooring) {
        if (!flooring) return 'Não informado';
        
        const labels = {
            'TATAMI': 'Tatami',
            'WOOD': 'Madeira',
            'CONCRETE': 'Concreto',
            'RUBBER': 'Borracha',
            'SYNTHETIC': 'Sintético',
            'GRASS': 'Grama',
            'OTHER': 'Outros'
        };
        return labels[flooring] || flooring;
    },

    /**
     * Add new training area
     */
    async addTrainingArea(unitId) {
        this.showTrainingAreaModal(null, unitId);
    },

    /**
     * Edit training area
     */
    async editTrainingArea(areaId) {
        try {
            const response = await fetch(`/api/training-areas/${areaId}`);
            const data = await response.json();
            
            if (data.success) {
                this.showTrainingAreaModal(data.data, data.data.unitId);
            } else {
                this.showError('Erro ao carregar área de treino');
            }
        } catch (error) {
            console.error('❌ Error loading training area:', error);
            this.showError('Erro ao carregar área de treino');
        }
    },

    /**
     * Show training area modal
     */
    showTrainingAreaModal(areaData, unitId) {
        const isEdit = areaData !== null;
        const title = isEdit ? 'Editar Área de Treino' : 'Nova Área de Treino';
        
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal-content training-area-modal">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <form id="training-area-form" class="modal-form">
                    <div class="form-group">
                        <label for="area-name">Nome da Área *</label>
                        <input type="text" id="area-name" name="name" required 
                               value="${areaData?.name || ''}">
                    </div>
                    
                    <div class="form-group">
                        <label for="area-description">Descrição</label>
                        <textarea id="area-description" name="description" rows="3">${areaData?.description || ''}</textarea>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="area-type">Tipo de Área *</label>
                            <select id="area-type" name="areaType" required>
                                <option value="DOJO" ${areaData?.areaType === 'DOJO' ? 'selected' : ''}>🥋 Dojo</option>
                                <option value="OUTDOOR" ${areaData?.areaType === 'OUTDOOR' ? 'selected' : ''}>🌳 Área Externa</option>
                                <option value="WEIGHT_ROOM" ${areaData?.areaType === 'WEIGHT_ROOM' ? 'selected' : ''}>🏋️ Musculação</option>
                                <option value="CARDIO" ${areaData?.areaType === 'CARDIO' ? 'selected' : ''}>❤️ Cardio</option>
                                <option value="CROSSTRAINING" ${areaData?.areaType === 'CROSSTRAINING' ? 'selected' : ''}>🔥 Cross Training</option>
                                <option value="FUNCTIONAL" ${areaData?.areaType === 'FUNCTIONAL' ? 'selected' : ''}>💪 Funcional</option>
                                <option value="OTHER" ${areaData?.areaType === 'OTHER' ? 'selected' : ''}>📦 Outros</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="area-capacity">Capacidade *</label>
                            <input type="number" id="area-capacity" name="capacity" required min="1" 
                                   value="${areaData?.capacity || 20}">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="area-dimensions">Dimensões</label>
                            <input type="text" id="area-dimensions" name="dimensions" 
                                   placeholder="Ex: 10m x 15m" value="${areaData?.dimensions || ''}">
                        </div>
                        <div class="form-group">
                            <label for="area-flooring">Tipo de Piso</label>
                            <select id="area-flooring" name="flooring">
                                <option value="">Selecione...</option>
                                <option value="TATAMI" ${areaData?.flooring === 'TATAMI' ? 'selected' : ''}>Tatami</option>
                                <option value="WOOD" ${areaData?.flooring === 'WOOD' ? 'selected' : ''}>Madeira</option>
                                <option value="CONCRETE" ${areaData?.flooring === 'CONCRETE' ? 'selected' : ''}>Concreto</option>
                                <option value="RUBBER" ${areaData?.flooring === 'RUBBER' ? 'selected' : ''}>Borracha</option>
                                <option value="SYNTHETIC" ${areaData?.flooring === 'SYNTHETIC' ? 'selected' : ''}>Sintético</option>
                                <option value="GRASS" ${areaData?.flooring === 'GRASS' ? 'selected' : ''}>Grama</option>
                                <option value="OTHER" ${areaData?.flooring === 'OTHER' ? 'selected' : ''}>Outros</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="area-equipment">Equipamentos (separados por vírgula)</label>
                        <input type="text" id="area-equipment" name="equipment" 
                               placeholder="Ex: Sacos de pancada, Espelhos, Tatames extras" 
                               value="${areaData?.equipment ? areaData.equipment.join(', ') : ''}">
                    </div>
                    
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="area-active" name="isActive" 
                                   ${areaData?.isActive !== false ? 'checked' : ''}>
                            Área ativa
                        </label>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                            Cancelar
                        </button>
                        <button type="submit" class="btn btn-primary">
                            ${isEdit ? 'Atualizar' : 'Criar'} Área
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Setup form submission
        const form = document.getElementById('training-area-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveTrainingArea(areaData?.id || null, unitId);
            overlay.remove();
        });
        
        // Focus first input
        document.getElementById('area-name').focus();
    },

    /**
     * Save training area
     */
    async saveTrainingArea(areaId, unitId) {
        const form = document.getElementById('training-area-form');
        const formData = new FormData(form);
        const isEdit = areaId !== null;

        // Prepare equipment array
        const equipmentString = formData.get('equipment') || '';
        const equipment = equipmentString 
            ? equipmentString.split(',').map(item => item.trim()).filter(item => item.length > 0)
            : [];

        const data = {
            unitId: unitId,
            name: formData.get('name'),
            description: formData.get('description'),
            areaType: formData.get('areaType'),
            capacity: parseInt(formData.get('capacity')) || 20,
            dimensions: formData.get('dimensions'),
            flooring: formData.get('flooring') || null,
            equipment: equipment,
            isActive: formData.has('isActive')
        };

        try {
            const url = isEdit ? `/api/training-areas/${areaId}` : '/api/training-areas';
            const method = isEdit ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                this.showSuccess(isEdit ? 'Área de treino atualizada!' : 'Área de treino criada!');
                await this.loadTrainingAreas(unitId);
            } else {
                const error = await response.json();
                this.showError(error.message || error.error || 'Erro ao salvar área de treino');
            }
        } catch (error) {
            console.error('❌ Error saving training area:', error);
            this.showError('Erro ao salvar área de treino');
        }
    },

    /**
     * Delete training area
     */
    async deleteTrainingArea(areaId) {
        if (!confirm('Tem certeza que deseja excluir esta área de treino?')) {
            return;
        }

        try {
            const response = await fetch(`/api/training-areas/${areaId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.showSuccess('Área de treino excluída com sucesso!');
                
                // Reload training areas for current unit
                const unitForm = document.getElementById('unit-form');
                if (unitForm) {
                    // Extract unit ID from the current context
                    const container = document.getElementById('training-areas-container');
                    if (container) {
                        const card = document.querySelector(`[data-id="${areaId}"]`);
                        if (card) {
                            card.remove();
                        }
                    }
                }
            } else {
                const error = await response.json();
                this.showError(error.message || 'Erro ao excluir área de treino');
            }
        } catch (error) {
            console.error('❌ Error deleting training area:', error);
            this.showError('Erro ao excluir área de treino');
        }
    }
};

// Register module globally and expose for compatibility
window.UnitsModule = UnitsModule;
window.unitsModule = UnitsModule;

// Initialization function for SPA router compatibility
window.initUnitsModule = async function(container) {
    console.log('🔧 initUnitsModule called...');
    UnitsModule.container = container;
    return await UnitsModule.init();
};

// Export for module loader
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UnitsModule;
}

// Global registration
console.log('📦 Units Module (Simplified) loaded and ready');

} // End of module wrapper
