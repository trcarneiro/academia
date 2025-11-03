/**
 * CameraView.js
 * Renders live camera feed with face detection UI
 */

class CameraView {
    constructor(container, callbacks = {}) {
        this.container = container;
        this.onManualSearch = callbacks.onManualSearch || (() => {});
        this.onFaceDetected = callbacks.onFaceDetected || (() => {});
        this.onAutocomplete = callbacks.onAutocomplete || null;
        this.onStudentSelect = callbacks.onStudentSelect || null; // NOVO: callback para seleção direta
    }

    /**
     * Render camera view
     */
    render() {
        this.container.innerHTML = `
            <div class="module-header-premium">
                <h1>📸 CHECK-IN KIOSK</h1>
                <p>Posicione seu rosto para identificação automática</p>
            </div>

            <div class="camera-section">
                <!-- Coluna Esquerda: Câmera + Stats -->
                <div class="camera-column">
                    <div class="camera-container">
                        <video 
                            id="checkin-video" 
                            class="checkin-video" 
                            autoplay 
                            playsinline 
                            muted
                        ></video>

                        <div class="face-detection-overlay">
                            <svg class="face-outline" viewBox="0 0 200 250">
                                <defs>
                                    <mask id="face-mask">
                                        <rect width="200" height="250" fill="white" />
                                        <rect x="10" y="10" width="180" height="230" rx="20" fill="black" />
                                    </mask>
                                </defs>
                                <rect 
                                    width="200" 
                                    height="250" 
                                    fill="rgba(0,0,0,0.5)" 
                                    mask="url(#face-mask)" 
                                />
                                <rect x="10" y="10" width="180" height="230" rx="20" fill="none" stroke="#667eea" stroke-width="3" />
                            </svg>

                            <div id="face-status" class="face-status">
                                <div class="status-spinner"></div>
                                <p>📍 Detectando rosto...</p>
                            </div>
                        </div>
                    </div>

                    <div class="detection-stats">
                        <div class="stat-card">
                            <span class="stat-label">Qualidade:</span>
                            <span id="quality-indicator" class="quality-badge quality-poor">---</span>
                        </div>
                        <div class="stat-card">
                            <span class="stat-label">Status:</span>
                            <span id="match-status" class="match-badge match-waiting">Aguardando...</span>
                        </div>
                    </div>
                </div>

                <!-- Coluna Direita: Busca Manual -->
                <div class="manual-search-column">
                    <div class="manual-search-card">
                        <div class="search-header">
                            <h3>💡 Busca Manual</h3>
                            <p>Não conseguiu reconhecer? Busque por nome, CPF ou matrícula</p>
                        </div>
                        
                        <div class="search-box-tablet">
                            <input
                                type="text"
                                id="manual-search"
                                placeholder="Digite matrícula, CPF ou nome..."
                                class="search-input-tablet"
                                autocomplete="off"
                            />
                            <button class="btn-search-tablet">
                                <span class="icon">🔍</span>
                                <span class="text">Buscar Aluno</span>
                            </button>
                        </div>

                        <div class="search-tips">
                            <p><strong>Dicas de Busca:</strong></p>
                            <ul>
                                <li>📝 Digite ao menos 3 caracteres</li>
                                <li>🔢 CPF: apenas números</li>
                                <li>👤 Nome: primeiro ou sobrenome</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <div class="checkins-history">
                <div class="history-header">
                    <h3>📋 Check-ins de Hoje</h3>
                    <span id="checkin-count" class="checkin-badge">0</span>
                </div>
                <div id="history-list" class="history-list">
                    <div class="empty-state">
                        <p>Nenhum check-in registrado ainda</p>
                    </div>
                </div>
            </div>
        `;

        this.setupEvents();
    }

    /**
     * Setup event listeners - COM AUTOCOMPLETE DIRETO PARA DASHBOARD
     */
    setupEvents() {
        const searchInput = this.container.querySelector('#manual-search');
        const searchBtn = this.container.querySelector('.btn-search-tablet') || this.container.querySelector('.search-btn');

        let autocompleteTimeout = null;

        // Button click - busca manual se necessário
        searchBtn?.addEventListener('click', () => {
            const query = searchInput.value.trim();
            if (query.length >= 2) {
                console.log('🔍 Search button clicked, query:', query);
                this.onManualSearch(query);
            } else {
                console.warn('⚠️ Query too short:', query);
            }
        });

        // Enter key
        searchInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                console.log('⌨️ Enter pressed');
                searchBtn?.click();
            }
        });

        // Autocomplete on typing (with debounce)
        searchInput?.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            
            // Clear previous timeout
            if (autocompleteTimeout) {
                clearTimeout(autocompleteTimeout);
            }

            // Hide autocomplete if query too short
            if (query.length < 2) {
                this.hideAutocomplete();
                return;
            }

            // Debounce: wait 300ms after user stops typing
            autocompleteTimeout = setTimeout(async () => {
                console.log('🔍 Autocomplete triggered for:', query);
                await this.showAutocomplete(query);
            }, 300);
        });

        // Focus: select all text
        searchInput?.addEventListener('focus', () => {
            searchInput.select();
        });

        // Hide autocomplete on click outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-box-tablet') && !e.target.closest('.search-box')) {
                this.hideAutocomplete();
            }
        });
    }

    /**
     * Show autocomplete suggestions
     */
    async showAutocomplete(query) {
        try {
            // Check if onAutocomplete callback exists
            if (!this.onAutocomplete) {
                console.warn('⚠️ No autocomplete callback defined');
                return;
            }

            const results = await this.onAutocomplete(query);
            
            if (!results || results.length === 0) {
                this.hideAutocomplete();
                return;
            }

            // Find or create wrapper with position:relative
            let searchBox = this.container.querySelector('.search-box-tablet');
            if (!searchBox) {
                searchBox = this.container.querySelector('.manual-search-card');
            }
            
            if (!searchBox) {
                console.error('❌ Search box container not found');
                console.log('🔍 Available containers:', {
                    searchBoxTablet: !!this.container.querySelector('.search-box-tablet'),
                    manualSearchCard: !!this.container.querySelector('.manual-search-card'),
                    container: this.container
                });
                return;
            }

            // Ensure search box has position:relative
            if (getComputedStyle(searchBox).position === 'static') {
                searchBox.style.position = 'relative';
            }

            // Create/update autocomplete dropdown
            let dropdown = this.container.querySelector('.autocomplete-dropdown');
            if (!dropdown) {
                dropdown = document.createElement('div');
                dropdown.className = 'autocomplete-dropdown';
                searchBox.appendChild(dropdown);
                console.log('✅ Autocomplete dropdown created and attached');
            }

            dropdown.innerHTML = results.slice(0, 5).map(student => `
                <div class="autocomplete-item" data-student-id="${student.id}" data-student-name="${student.name || student.firstName + ' ' + student.lastName}">
                    <span class="student-name">${student.name || student.firstName + ' ' + student.lastName}</span>
                    <span class="student-detail">${student.matricula || student.cpf || 'Sem matrícula'}</span>
                </div>
            `).join('');

            dropdown.style.display = 'block';
            console.log('✅ Autocomplete dropdown visible with', results.length, 'results');

            // Add click listeners to items - IR DIRETO PARA DASHBOARD
            dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
                item.addEventListener('click', () => {
                    const studentId = item.dataset.studentId;
                    const studentName = item.dataset.studentName;
                    
                    console.log('🎯 Autocomplete item clicked:', studentName, studentId);
                    
                    this.hideAutocomplete();
                    
                    // IR DIRETO PARA DASHBOARD (sem passar pela lista)
                    if (this.onStudentSelect) {
                        this.onStudentSelect({ studentId, name: studentName });
                    }
                });
            });

        } catch (error) {
            console.error('❌ Autocomplete error:', error);
        }
    }

    /**
     * Hide autocomplete dropdown
     */
    hideAutocomplete() {
        const dropdown = this.container.querySelector('.autocomplete-dropdown');
        if (dropdown) {
            dropdown.style.display = 'none';
        }
    }

    /**
     * Update detection status
     */
    updateDetectionStatus(face) {
        const statusEl = this.container.querySelector('#face-status');
        const qualityEl = this.container.querySelector('#quality-indicator');

        // Safety check: elements may not exist if view changed
        if (!statusEl || !qualityEl) {
            // Silently return - view probably changed to confirmation/success
            return;
        }

        if (face) {
            const quality = Math.round(face.confidence * 100);
            statusEl.innerHTML = `
                <div class="status-pulse"></div>
                <p>✅ Rosto detectado (${quality}%)</p>
            `;
            statusEl.classList.add('detected');

            qualityEl.textContent = `${quality}%`;
            qualityEl.className = `quality-badge ${
                quality > 80 ? 'quality-good' : quality > 60 ? 'quality-fair' : 'quality-poor'
            }`;
        } else {
            statusEl.innerHTML = `
                <div class="status-spinner"></div>
                <p>📍 Detectando rosto...</p>
            `;
            statusEl.classList.remove('detected');
            qualityEl.textContent = '---';
            qualityEl.className = 'quality-badge quality-poor';
        }
    }

    /**
     * Show match found state
     */
    showMatch(match) {
        const matchStatusEl = this.container.querySelector('#match-status');
        matchStatusEl.textContent = `✅ ${match.name} (${match.similarity}%)`;
        matchStatusEl.className = 'match-badge match-found';
    }

    /**
     * Show no match state
     */
    showNoMatch() {
        const matchStatusEl = this.container.querySelector('#match-status');
        matchStatusEl.textContent = 'Nenhuma correspondência';
        matchStatusEl.className = 'match-badge match-none';
    }

    /**
     * Get video element
     */
    getVideoElement() {
        return this.container.querySelector('#checkin-video');
    }

    /**
     * Update history list
     */
    updateHistory(records) {
        const historyList = this.container.querySelector('#history-list');
        const countBadge = this.container.querySelector('#checkin-count');

        if (!records || records.length === 0) {
            historyList.innerHTML = `
                <div class="empty-state">
                    <p>Nenhum check-in registrado ainda</p>
                </div>
            `;
            countBadge.textContent = '0';
            return;
        }

        countBadge.textContent = records.length;

        // Mostrar últimos 5
        const recent = records.slice(0, 5);
        historyList.innerHTML = recent
            .map(
                (r) => `
            <div class="history-item">
                <div class="history-time">${new Date(r.timestamp).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                })}</div>
                <div class="history-info">
                    <div class="history-name">${r.studentName || 'Desconhecido'}</div>
                    <div class="history-course">${r.courseName || 'Sem curso'}</div>
                </div>
                <div class="history-method">
                    ${r.method === 'biometric' ? '👤 Biométrico' : '✏️ Manual'}
                </div>
            </div>
        `
            )
            .join('');
    }

    /**
     * Show loading state
     */
    showLoading() {
        const statusEl = this.container.querySelector('#face-status');
        statusEl.innerHTML = `
            <div class="status-spinner"></div>
            <p>⏳ Processando...</p>
        `;
    }

    /**
     * Show error message with retry option
     * @param {string} message - Error message (supports \n for line breaks)
     * @param {Function} onRetry - Optional callback for retry button
     */
    showError(message, onRetry = null) {
        const statusEl = this.container.querySelector('#face-status');
        
        // Format message with line breaks and better structure
        const lines = message.split('\n').filter(line => line.trim());
        const mainMessage = lines[0] || message;
        const details = lines.slice(1).join('<br>');
        
        let html = `
            <div style="text-align: center; padding: 15px;">
                <p style="font-size: 18px; margin-bottom: 10px; color: #ff6b6b;">
                    ❌ ${mainMessage}
                </p>
                ${details ? `<p style="font-size: 14px; color: #ccc; margin-bottom: 15px; line-height: 1.6;">${details}</p>` : ''}
                ${onRetry ? '<button id="retry-camera-btn" class="btn-retry">🔄 Tentar Novamente</button>' : ''}
            </div>
        `;
        
        statusEl.innerHTML = html;
        statusEl.classList.add('error');
        
        // Attach retry listener
        if (onRetry) {
            const retryBtn = statusEl.querySelector('#retry-camera-btn');
            retryBtn?.addEventListener('click', () => {
                console.log('🔄 Retry button clicked');
                onRetry();
            });
        }
    }

    /**
     * Clear error message
     */
    clearError() {
        const statusEl = this.container.querySelector('#face-status');
        statusEl.classList.remove('error');
    }

    /**
     * Disable camera area (during processing)
     */
    disable() {
        const video = this.container.querySelector('#checkin-video');
        if (video) video.style.opacity = '0.5';
        const btn = this.container.querySelector('.search-btn');
        if (btn) btn.disabled = true;
    }

    /**
     * Enable camera area
     */
    enable() {
        const video = this.container.querySelector('#checkin-video');
        if (video) video.style.opacity = '1';
        const btn = this.container.querySelector('.search-btn');
        if (btn) btn.disabled = false;
    }
}

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CameraView;
}
