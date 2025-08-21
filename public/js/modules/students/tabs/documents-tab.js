/**
 * Documents Tab Component
 * Handles student documents and file uploads
 */

export class DocumentsTab {
    constructor(editorController) {
        this.editor = editorController;
        this.documents = [];
        this.uploadQueue = [];
        
        this.init();
    }

    init() {
        console.log('📄 Inicializando aba de Documentos...');
    }

    /**
     * Render documents tab content
     */
    render(container) {
        const html = `
            <div class="documents-tab-content">
                <!-- Upload Section -->
                <div class="form-section">
                    <h3 class="section-title">
                        <span class="section-icon">📁</span>
                        Upload de Documentos
                    </h3>
                    
                    <div class="upload-area">
                        <div class="upload-dropzone" id="upload-dropzone">
                            <div class="upload-icon">📁</div>
                            <h4>Arraste arquivos aqui ou clique para selecionar</h4>
                            <p>Formatos aceitos: PDF, JPG, PNG, DOC, DOCX (máx. 10MB)</p>
                            <input type="file" 
                                   id="document-upload" 
                                   multiple 
                                   accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                   style="display: none;">
                            <button class="btn btn-primary" onclick="document.getElementById('document-upload').click()">
                                Selecionar Arquivos
                            </button>
                        </div>
                        
                        <div id="upload-queue" class="upload-queue" style="display: none;">
                            <!-- Upload progress items will be inserted here -->
                        </div>
                    </div>
                </div>

                <!-- Document Categories -->
                <div class="form-section">
                    <h3 class="section-title">
                        <span class="section-icon">🗂️</span>
                        Categorias de Documentos
                    </h3>
                    
                    <div class="document-categories">
                        <div class="category-filter">
                            <select id="document-category-filter" class="form-control">
                                <option value="all">Todas as categorias</option>
                                <option value="identification">Identificação</option>
                                <option value="medical">Médicos</option>
                                <option value="financial">Financeiros</option>
                                <option value="contracts">Contratos</option>
                                <option value="other">Outros</option>
                            </select>
                        </div>
                        
                        <div class="category-stats">
                            <div class="stat-item">
                                <span class="stat-value" id="total-documents">0</span>
                                <span class="stat-label">Total</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-value" id="recent-documents">0</span>
                                <span class="stat-label">Recentes</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Documents List -->
                <div class="form-section">
                    <h3 class="section-title">
                        <span class="section-icon">📋</span>
                        Documentos do Estudante
                    </h3>
                    
                    <div id="documents-container" class="documents-list">
                        ${this.renderDocumentsList()}
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
        this.bindEvents(container);
        this.loadDocuments();
    }

    /**
     * Render documents list
     */
    renderDocumentsList() {
        if (!this.documents || this.documents.length === 0) {
            return `
                <div class="no-documents">
                    <div class="no-documents-icon">📄</div>
                    <h4>Nenhum documento encontrado</h4>
                    <p>Faça upload dos primeiros documentos do estudante.</p>
                </div>
            `;
        }

        return this.documents.map(doc => this.renderDocumentItem(doc)).join('');
    }

    /**
     * Render single document item
     */
    renderDocumentItem(document) {
        const uploadDate = new Date(document.uploadedAt).toLocaleDateString('pt-BR');
        const fileSize = this.formatFileSize(document.size);
        const categoryLabel = this.getCategoryLabel(document.category);
        const fileIcon = this.getFileIcon(document.type);

        return `
            <div class="document-item" data-document-id="${document.id}">
                <div class="document-icon">
                    ${fileIcon}
                </div>
                
                <div class="document-info">
                    <h4 class="document-name">${document.name}</h4>
                    <div class="document-meta">
                        <span class="document-category">${categoryLabel}</span>
                        <span class="document-size">${fileSize}</span>
                        <span class="document-date">Enviado em ${uploadDate}</span>
                    </div>
                    ${document.description ? `
                        <p class="document-description">${document.description}</p>
                    ` : ''}
                </div>
                
                <div class="document-actions">
                    <button onclick="window.viewDocument('${document.id}')" 
                            class="btn btn-sm btn-secondary"
                            title="Visualizar">
                        👁️
                    </button>
                    <button onclick="window.downloadDocument('${document.id}')" 
                            class="btn btn-sm btn-primary"
                            title="Download">
                        ⬇️
                    </button>
                    <button onclick="window.editDocument('${document.id}')" 
                            class="btn btn-sm btn-secondary"
                            title="Editar">
                        ✏️
                    </button>
                    <button onclick="window.deleteDocument('${document.id}')" 
                            class="btn btn-sm btn-danger"
                            title="Excluir">
                        🗑️
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Load documents from API
     */
    async loadDocuments() {
        if (!this.editor.studentId) return;

        try {
            // Mock data for now - replace with actual API call
            this.documents = [
                {
                    id: '1',
                    name: 'RG - Frente e Verso.pdf',
                    type: 'application/pdf',
                    size: 2048576,
                    category: 'identification',
                    description: 'Documento de identificação - RG',
                    uploadedAt: new Date().toISOString(),
                    url: '/api/documents/1'
                },
                {
                    id: '2',
                    name: 'Atestado Médico.pdf',
                    type: 'application/pdf',
                    size: 1024768,
                    category: 'medical',
                    description: 'Atestado médico para prática de atividades físicas',
                    uploadedAt: new Date(Date.now() - 86400000).toISOString(),
                    url: '/api/documents/2'
                }
            ];
            
            this.updateDocumentsList();
            this.updateDocumentStats();
            
        } catch (error) {
            console.error('❌ Erro ao carregar documentos:', error);
        }
    }

    /**
     * Load data from editor
     */
    loadData(studentData) {
        this.studentData = studentData;
        this.loadDocuments();
    }

    /**
     * Update documents list display
     */
    updateDocumentsList() {
        const container = document.getElementById('documents-container');
        if (container) {
            container.innerHTML = this.renderDocumentsList();
        }
    }

    /**
     * Update document statistics
     */
    updateDocumentStats() {
        const totalElement = document.getElementById('total-documents');
        const recentElement = document.getElementById('recent-documents');
        
        if (totalElement) {
            totalElement.textContent = this.documents.length;
        }
        
        if (recentElement) {
            const recentCount = this.documents.filter(doc => {
                const uploadDate = new Date(doc.uploadedAt);
                const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                return uploadDate > weekAgo;
            }).length;
            recentElement.textContent = recentCount;
        }
    }

    /**
     * Handle file uploads
     */
    async handleFileUpload(files) {
        for (const file of files) {
            if (this.validateFile(file)) {
                await this.uploadFile(file);
            }
        }
    }

    /**
     * Validate file before upload
     */
    validateFile(file) {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        if (file.size > maxSize) {
            alert(`Arquivo "${file.name}" é muito grande. Tamanho máximo: 10MB`);
            return false;
        }

        if (!allowedTypes.includes(file.type)) {
            alert(`Tipo de arquivo "${file.type}" não é permitido.`);
            return false;
        }

        return true;
    }

    /**
     * Upload single file
     */
    async uploadFile(file) {
        const uploadItem = this.createUploadItem(file);
        
        try {
            // Mock upload process - replace with actual API call
            await this.simulateUpload(file, uploadItem);
            
            // Add to documents list
            const newDocument = {
                id: Date.now().toString(),
                name: file.name,
                type: file.type,
                size: file.size,
                category: 'other',
                description: '',
                uploadedAt: new Date().toISOString(),
                url: '/api/documents/' + Date.now()
            };
            
            this.documents.unshift(newDocument);
            this.updateDocumentsList();
            this.updateDocumentStats();
            
            // Remove upload item
            uploadItem.remove();
            
        } catch (error) {
            console.error('❌ Erro no upload:', error);
            this.showUploadError(uploadItem, error.message);
        }
    }

    /**
     * Create upload progress item
     */
    createUploadItem(file) {
        const queueContainer = document.getElementById('upload-queue');
        queueContainer.style.display = 'block';
        
        const uploadItem = document.createElement('div');
        uploadItem.className = 'upload-item';
        uploadItem.innerHTML = `
            <div class="upload-file-info">
                <span class="upload-file-name">${file.name}</span>
                <span class="upload-file-size">${this.formatFileSize(file.size)}</span>
            </div>
            <div class="upload-progress">
                <div class="progress-bar" style="width: 0%"></div>
            </div>
            <div class="upload-status">Enviando...</div>
        `;
        
        queueContainer.appendChild(uploadItem);
        return uploadItem;
    }

    /**
     * Simulate upload progress
     */
    async simulateUpload(file, uploadItem) {
        const progressBar = uploadItem.querySelector('.progress-bar');
        const statusElement = uploadItem.querySelector('.upload-status');
        
        for (let progress = 0; progress <= 100; progress += 10) {
            await new Promise(resolve => setTimeout(resolve, 100));
            progressBar.style.width = progress + '%';
            
            if (progress === 100) {
                statusElement.textContent = 'Concluído!';
                uploadItem.classList.add('upload-complete');
            }
        }
    }

    /**
     * Show upload error
     */
    showUploadError(uploadItem, errorMessage) {
        const statusElement = uploadItem.querySelector('.upload-status');
        statusElement.textContent = `Erro: ${errorMessage}`;
        uploadItem.classList.add('upload-error');
    }

    /**
     * Helper methods
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    getFileIcon(type) {
        const iconMap = {
            'application/pdf': '📄',
            'image/jpeg': '🖼️',
            'image/png': '🖼️',
            'application/msword': '📝',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝'
        };
        return iconMap[type] || '📄';
    }

    getCategoryLabel(category) {
        const categoryLabels = {
            'identification': 'Identificação',
            'medical': 'Médicos',
            'financial': 'Financeiros',
            'contracts': 'Contratos',
            'other': 'Outros'
        };
        return categoryLabels[category] || 'Outros';
    }

    /**
     * Bind events
     */
    bindEvents(container) {
        // File upload input
        const fileInput = container.querySelector('#document-upload');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.handleFileUpload(Array.from(e.target.files));
                }
            });
        }

        // Drag and drop
        const dropzone = container.querySelector('#upload-dropzone');
        if (dropzone) {
            dropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropzone.classList.add('drag-over');
            });
            
            dropzone.addEventListener('dragleave', (e) => {
                e.preventDefault();
                dropzone.classList.remove('drag-over');
            });
            
            dropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropzone.classList.remove('drag-over');
                
                if (e.dataTransfer.files.length > 0) {
                    this.handleFileUpload(Array.from(e.dataTransfer.files));
                }
            });
        }

        // Category filter
        const categoryFilter = container.querySelector('#document-category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.filterDocuments(e.target.value);
            });
        }

        // Make document actions available globally
        window.viewDocument = (id) => this.viewDocument(id);
        window.downloadDocument = (id) => this.downloadDocument(id);
        window.editDocument = (id) => this.editDocument(id);
        window.deleteDocument = (id) => this.deleteDocument(id);
    }

    /**
     * Document actions
     */
    viewDocument(documentId) {
        console.log('👁️ Visualizando documento:', documentId);
        const document = this.documents.find(doc => doc.id === documentId);
        if (document) {
            window.open(document.url, '_blank');
        }
    }

    downloadDocument(documentId) {
        console.log('⬇️ Fazendo download do documento:', documentId);
        const document = this.documents.find(doc => doc.id === documentId);
        if (document) {
            const link = document.createElement('a');
            link.href = document.url;
            link.download = document.name;
            link.click();
        }
    }

    editDocument(documentId) {
        console.log('✏️ Editando documento:', documentId);
        // Implementation for editing document metadata
    }

    async deleteDocument(documentId) {
        if (confirm('Tem certeza que deseja excluir este documento?')) {
            console.log('🗑️ Excluindo documento:', documentId);
            
            try {
                // Remove from API (mock)
                this.documents = this.documents.filter(doc => doc.id !== documentId);
                this.updateDocumentsList();
                this.updateDocumentStats();
                
            } catch (error) {
                console.error('❌ Erro ao excluir documento:', error);
                alert('Erro ao excluir documento');
            }
        }
    }

    /**
     * Filter documents by category
     */
    filterDocuments(category) {
        const documentItems = document.querySelectorAll('.document-item');
        
        documentItems.forEach(item => {
            const documentId = item.dataset.documentId;
            const document = this.documents.find(doc => doc.id === documentId);
            
            if (category === 'all' || document?.category === category) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }

    /**
     * Get tab data
     */
    getData() {
        return {
            documents: this.documents
        };
    }

    /**
     * Validate tab
     */
    async validate() {
        // Documents tab typically doesn't need validation
        return [];
    }

    /**
     * Cleanup
     */
    destroy() {
        // Remove global handlers
        delete window.viewDocument;
        delete window.downloadDocument;
        delete window.editDocument;
        delete window.deleteDocument;
        
        console.log('🧹 Documents Tab destruído');
    }
}
