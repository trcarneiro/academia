/**
 * CameraView.js
 * Renders live camera feed with face detection UI
 */

class CameraView {
    constructor(container, moduleAPI, callbacks = {}) {
        this.container = container;
        this.moduleAPI = moduleAPI;
        this.onManualSearch = callbacks.onManualSearch || (() => {});
        this.onFaceDetected = callbacks.onFaceDetected || (() => {});
        this.onAutocomplete = callbacks.onAutocomplete || null;
        this.onStudentSelect = callbacks.onStudentSelect || null; // NOVO: callback para seleção direta
    }

    /**
     * Render camera view
     * LAYOUT KIOSK v3: Grid Responsivo + Widgets + Toggle Fullscreen
     */
    render() {
        this.container.innerHTML = `
            <div class="kiosk-container">
                <!-- Header com Toggle -->
                <div class="kiosk-header-actions">
                    <div class="brand-area">
                        <h1>🥋 Check-in Kiosk</h1>
                        <p>Aproxime-se da câmera ou busque seu nome</p>
                    </div>
                    <button id="btn-toggle-kiosk" class="btn-kiosk-toggle">
                        <i class="fas fa-expand"></i> <span>Tela Cheia</span>
                    </button>
                </div>

                <div class="kiosk-grid-new">
                    <!-- AREA 1: Câmera (Esquerda) -->
                    <div class="camera-area">
                        <div class="camera-card-premium">
                            <div class="camera-wrapper">
                                <video 
                                    id="qr-video" 
                                    autoplay 
                                    playsinline 
                                    muted
                                    aria-label="Camera feed for face detection"
                                ></video>
                                <div class="camera-overlay"></div>
                                
                                <div class="camera-status">
                                    <span class="status-dot"></span>
                                    <span id="face-status-text">Aguardando aluno...</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- AREA 2: Busca (Direita) -->
                    <div class="search-area">
                        <div class="search-card-premium">
                            <div class="search-icon-large">
                                <i class="fas fa-search"></i>
                            </div>
                            <h2 style="margin: 0 0 0.5rem 0; color: #1e293b;">Buscar Aluno</h2>
                            <p style="margin: 0 0 2rem 0; color: #64748b;">Digite nome, matrícula ou CPF</p>
                            
                            <div class="search-input-wrapper-large">
                                <i class="fas fa-search search-icon-input"></i>
                                <input
                                    type="text"
                                    id="manual-search"
                                    placeholder="Digite aqui..."
                                    class="kiosk-input-large"
                                    autocomplete="off"
                                    autofocus
                                />
                            </div>
                            <p class="search-hint">Pressione ENTER para buscar</p>
                        </div>
                    </div>

                    <!-- AREA 3: Aulas (Embaixo) -->
                    <div class="classes-area">
                        <div class="classes-card-premium">
                            <div class="classes-header">
                                <h3><i class="fas fa-calendar-alt" style="color: var(--primary-color)"></i> Aulas de Hoje</h3>
                                <div class="live-badge">
                                    <span class="live-dot"></span>
                                    Em Tempo Real
                                </div>
                            </div>
                            <div id="available-classes" class="classes-grid">
                                <p><i class="fas fa-spinner fa-spin"></i> Carregando aulas...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Setup events after render
        this.setupEvents();

        // Wait for DOM to be ready before loading classes
        setTimeout(() => {
            console.log('⏰ Iniciando carregamento de turmas...');
            this.loadTodayClasses();
            this.startTimeUpdater();
        }, 100);
    }

    /**
     * Load today's available classes
     */
    async loadTodayClasses() {
        try {
            console.log('📅 [loadTodayClasses] Iniciando...');
            
            const classesContainer = this.container.querySelector('#available-classes');
            
            console.log('📦 Container check:', {
                hasContainer: !!this.container,
                hasClassesDiv: !!classesContainer,
                containerHTML: this.container?.innerHTML?.substring(0, 200)
            });
            
            if (!classesContainer) {
                console.error('❌ Container #available-classes não encontrado!');
                return;
            }

            // Get today's day of week (0 = Sunday, 1 = Monday, etc.)
            const today = new Date();
            const dayOfWeek = today.getDay();
            
            console.log('🔍 [Turmas] Contextos disponíveis:', {
                organizationContext: !!window.organizationContext,
                app: !!window.app,
                OrganizationContext: !!window.OrganizationContext,
                currentOrganizationId: !!window.currentOrganizationId
            });
            
            // Get organization ID from multiple possible sources
            let organizationId = null;
            
            // Try window.currentOrganizationId (CORRETO - usado pelo app.js)
            if (window.currentOrganizationId) {
                organizationId = window.currentOrganizationId;
            }
            
            // Try window.organizationContext (secondary)
            if (!organizationId && window.organizationContext) {
                organizationId = window.organizationContext.getActiveOrganizationId?.() || 
                                window.organizationContext.activeOrganizationId ||
                                window.organizationContext.organizationId;
            }
            
            // Try window.app (tertiary)
            if (!organizationId && window.app) {
                organizationId = window.app.organizationId;
            }
            
            // Try window.OrganizationContext (fallback)
            if (!organizationId && window.OrganizationContext) {
                organizationId = window.OrganizationContext.getActiveOrganizationId?.() ||
                                window.OrganizationContext.activeOrganizationId;
            }

            console.log('🔍 Organization ID:', organizationId);
            
            if (!organizationId) {
                console.error('❌ No organization ID found. Debug info:', {
                    organizationContext: window.organizationContext,
                    app: window.app,
                    OrganizationContext: window.OrganizationContext
                });
                classesContainer.innerHTML = '<p class="error-state">❌ Organização não encontrada</p>';
                return;
            }

            console.log('📡 Fetching turmas for org:', organizationId, 'day:', dayOfWeek);

            // Fetch turmas from API
            const response = await this.moduleAPI.request(`/api/turmas?organizationId=${organizationId}`, {
                method: 'GET'
            });
            
            // moduleAPI returns { success: true, data: [...] }
            // We need to handle if response is the data object itself or the wrapper
            const data = response; 

            console.log('📦 API Response:', {
                success: data.success,
                totalTurmas: data.data?.length || 0,
                firstTurma: data.data?.[0] ? {
                    name: data.data[0].name,
                    schedule: data.data[0].schedule,
                    isActive: data.data[0].isActive
                } : null
            });

            if (!data.success || !data.data || data.data.length === 0) {
                console.warn('⚠️ No turmas found in API response');
                classesContainer.innerHTML = '<p class="empty-state">📭 Nenhuma turma encontrada</p>';
                return;
            }

            // Filter turmas for today
            const todayClasses = data.data.filter(turma => {
                // Check if turma is for today (schedule.daysOfWeek is an array)
                if (!turma.isActive || !turma.schedule) return false;
                
                // Parse schedule if it's a string
                const schedule = typeof turma.schedule === 'string' 
                    ? JSON.parse(turma.schedule) 
                    : turma.schedule;
                
                // Check if today's day is in the daysOfWeek array
                return schedule.daysOfWeek && schedule.daysOfWeek.includes(dayOfWeek);
            });

            console.log('🗓️ Filtro aplicado:', {
                hoje: dayOfWeek,
                totalTurmas: data.data.length,
                turmasHoje: todayClasses.length,
                turmasHojeNomes: todayClasses.map(t => t.name)
            });

            if (todayClasses.length === 0) {
                classesContainer.innerHTML = '<p class="empty-state">📭 Nenhuma turma disponível para hoje</p>';
                return;
            }

            // Sort by start time
            todayClasses.sort((a, b) => {
                // Parse schedule to get time
                const scheduleA = typeof a.schedule === 'string' ? JSON.parse(a.schedule) : a.schedule;
                const scheduleB = typeof b.schedule === 'string' ? JSON.parse(b.schedule) : b.schedule;
                
                const timeA = this.parseTime(scheduleA.time);
                const timeB = this.parseTime(scheduleB.time);
                return timeA - timeB;
            });

            console.log('✅ Renderizando', todayClasses.length, 'turmas...');

            // Render classes
            this.renderClasses(todayClasses, classesContainer);

        } catch (error) {
            console.error('Error loading today classes:', error);
            const classesContainer = this.container.querySelector('#available-classes');
            if (classesContainer) {
                classesContainer.innerHTML = '<p class="error-state">❌ Erro ao carregar turmas</p>';
            }
        }
    }

    /**
     * Render classes with countdown - PREMIUM LAYOUT
     */
    renderClasses(classes, container) {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        container.innerHTML = classes.map(turma => {
            // Parse schedule to get time and duration
            const schedule = typeof turma.schedule === 'string' 
                ? JSON.parse(turma.schedule) 
                : turma.schedule;
            
            const startTime = schedule.time; // e.g., "19:00"
            const duration = schedule.duration || 60;
            
            // Calculate end time
            const startMinutes = this.parseTime(startTime);
            const endMinutes = startMinutes + duration;
            const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;
            
            const minutesUntilStart = startMinutes - currentMinutes;
            
            let canCheckIn = false;
            let statusText = '';
            let statusColor = '#64748b';

            if (minutesUntilStart > 30) {
                statusText = `Abre em ${this.formatCountdown(minutesUntilStart)}`;
                statusColor = '#f59e0b'; // Amber
            } else if (minutesUntilStart >= -15) {
                canCheckIn = true;
                statusText = 'Check-in Aberto';
                statusColor = '#22c55e'; // Green
            } else {
                statusText = 'Encerrado';
                statusColor = '#ef4444'; // Red
            }

            const instructorName = turma.instructor 
                ? `${turma.instructor.firstName} ${turma.instructor.lastName}`
                : 'Instrutor não definido';

            return `
                <div class="class-card-active" style="border-left: 4px solid ${statusColor}">
                    <div class="class-time" style="color: ${statusColor}">
                        ${startTime} - ${endTime}
                    </div>
                    <div class="class-name">${turma.name || 'Turma sem nome'}</div>
                    <div class="class-instructor">
                        <i class="fas fa-user-ninja"></i> ${instructorName}
                    </div>
                    <div class="class-meta">
                        <span class="student-count">
                            <i class="fas fa-users"></i> ${turma.students?.length || 0}/${turma.maxStudents || 20}
                        </span>
                        ${canCheckIn 
                            ? `<button class="btn-checkin-manual" onclick="window.app.navigateTo('/turmas/${turma.id}')">
                                 <i class="fas fa-check"></i> Check-in
                               </button>` 
                            : `<span style="color: ${statusColor}; font-weight: 600; font-size: 0.85rem;">${statusText}</span>`
                        }
                    </div>
                </div>
            `;
        }).join('');

        // Update countdown every minute
        if (this.classesUpdateInterval) clearInterval(this.classesUpdateInterval);
        this.classesUpdateInterval = setTimeout(() => {
            this.renderClasses(classes, container);
        }, 60000); // 60 seconds
    }

    /**
     * Parse time string to minutes (HH:MM -> minutes since midnight)
     */
    parseTime(timeStr) {
        if (!timeStr) return 0;
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }

    /**
     * Format countdown (minutes to HH:MM)
     */
    formatCountdown(minutes) {
        if (minutes <= 0) return '';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return `Abre em ${hours}h ${mins}min`;
        }
        return `Abre em ${mins}min`;
    }

    /**
     * Start time updater
     */
    startTimeUpdater() {
        const updateTime = () => {
            const timeElement = this.container.querySelector('#current-time');
            if (timeElement) {
                const now = new Date();
                timeElement.textContent = now.toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
            }
        };

        updateTime();
        setInterval(updateTime, 1000);
    }

    /**
     * Setup event listeners - COM AUTOCOMPLETE DIRETO PARA DASHBOARD
     */
    setupEvents() {
        // Evento do botão de Toggle Kiosk Mode
        const btnToggle = document.getElementById('btn-toggle-kiosk');
        if (btnToggle) {
            btnToggle.addEventListener('click', () => this.toggleKioskMode());
        }

        // Atalho de teclado (F11 ou ESC para sair)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.body.classList.contains('kiosk-mode-active')) {
                this.toggleKioskMode();
            }
        });

        const searchInput = this.container.querySelector('#manual-search');
        const searchBtn = this.container.querySelector('.btn-search-large') || this.container.querySelector('.btn-search-tablet') || this.container.querySelector('.search-btn');

        console.log('🔧 Setting up search events:', {
            searchInput: !!searchInput,
            searchBtn: !!searchBtn,
            inputId: searchInput?.id,
            inputValue: searchInput?.value
        });

        if (!searchInput) {
            console.error('❌ Search input not found! Available inputs:', 
                Array.from(this.container.querySelectorAll('input')).map(i => ({ id: i.id, class: i.className }))
            );
            return;
        }

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
            
            console.log('⌨️ Input event fired, query:', `"${query}"`, 'length:', query.length);
            
            // Clear previous timeout
            if (autocompleteTimeout) {
                clearTimeout(autocompleteTimeout);
            }

            // Hide autocomplete if query too short
            if (query.length < 2) {
                console.log('⚠️ Query too short, hiding autocomplete');
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
            if (!e.target.closest('.search-box-large') && !e.target.closest('.search-box-tablet') && !e.target.closest('.search-box')) {
                this.hideAutocomplete();
            }
        });
    }

    toggleKioskMode() {
        const body = document.body;
        const btn = document.getElementById('btn-toggle-kiosk');
        const isKiosk = body.classList.toggle('kiosk-mode-active');

        if (btn) {
            if (isKiosk) {
                btn.innerHTML = '<i class="fas fa-compress"></i> Sair do Modo Kiosk';
                btn.classList.add('btn-danger');
                
                // Tenta colocar o navegador em fullscreen também
                if (document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen().catch(e => console.log(e));
                }
            } else {
                btn.innerHTML = '<i class="fas fa-expand"></i> Modo Tela Cheia';
                btn.classList.remove('btn-danger');
                
                // Sai do fullscreen do navegador
                if (document.exitFullscreen && document.fullscreenElement) {
                    document.exitFullscreen().catch(e => console.log(e));
                }
            }
        }
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
            let searchBox = this.container.querySelector('.search-box-large');
            if (!searchBox) {
                searchBox = this.container.querySelector('.search-box-tablet');
            }
            if (!searchBox) {
                searchBox = this.container.querySelector('.manual-search-card');
            }
            
            if (!searchBox) {
                console.error('❌ Search box container not found');
                console.log('🔍 Available containers:', {
                    searchBoxLarge: !!this.container.querySelector('.search-box-large'),
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
                dropdown.setAttribute('role', 'listbox');
                searchBox.appendChild(dropdown);
                console.log('✅ Autocomplete dropdown created and attached');
            }

            // Ordenar alfabeticamente antes de exibir
            const sortedResults = results.sort((a, b) => {
                const nameA = (a.name || a.firstName + ' ' + a.lastName).toLowerCase();
                const nameB = (b.name || b.firstName + ' ' + b.lastName).toLowerCase();
                return nameA.localeCompare(nameB, 'pt-BR');
            });

            // Mostrar até 10 resultados (aumentado de 5 para 10)
            dropdown.innerHTML = sortedResults.slice(0, 10).map(student => `
                <div class="autocomplete-item" 
                     data-student-id="${student.id}" 
                     data-student-name="${student.name || student.firstName + ' ' + student.lastName}"
                     role="option"
                     tabindex="0"
                     aria-label="Select ${student.name || student.firstName + ' ' + student.lastName}">
                    <span class="student-name">${student.name || student.firstName + ' ' + student.lastName}</span>
                    <span class="student-detail">${student.matricula || student.cpf || 'Sem matrícula'}</span>
                </div>
            `).join('');

            dropdown.style.display = 'block';
            console.log('✅ Autocomplete dropdown visible with', sortedResults.length, 'total results, showing first 10');

            // Add click listeners to items - IR DIRETO PARA DASHBOARD
            dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
                const selectItem = () => {
                    const studentId = item.dataset.studentId;
                    const studentName = item.dataset.studentName;
                    
                    console.log('🎯 Autocomplete item clicked:', studentName, studentId);
                    
                    this.hideAutocomplete();
                    
                    // IR DIRETO PARA DASHBOARD (sem passar pela lista)
                    if (this.onStudentSelect) {
                        this.onStudentSelect({ studentId, name: studentName });
                    }
                };

                item.addEventListener('click', selectItem);
                
                // Add keyboard support
                item.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        selectItem();
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
     * Update detection status - COMPATÍVEL com layout v2 (compacto)
     */
    updateDetectionStatus(face) {
        // Try both old and new layout element IDs
        const statusEl = this.container.querySelector('#face-status');
        const statusTextEl = this.container.querySelector('#face-status-text');
        const qualityEl = this.container.querySelector('#quality-indicator');

        // Safety check: elements may not exist if view changed
        if (!qualityEl) {
            // Silently return - view probably changed to confirmation/success
            return;
        }

        if (face) {
            const quality = Math.round(face.confidence * 100);
            
            // Layout v2 (compacto)
            if (statusTextEl) {
                statusTextEl.textContent = `Detectado ${quality}%`;
                statusEl?.classList.add('detected');
            }
            // Layout v1 (antigo)
            else if (statusEl) {
                statusEl.innerHTML = `
                    <div class="status-pulse"></div>
                    <p>✅ Rosto detectado (${quality}%)</p>
                `;
                statusEl.classList.add('detected');
            }

            qualityEl.textContent = `${quality}%`;
            qualityEl.className = qualityEl.className.includes('compact') 
                ? `quality-badge-compact ${quality > 80 ? 'quality-good' : quality > 60 ? 'quality-fair' : 'quality-poor'}`
                : `quality-badge ${quality > 80 ? 'quality-good' : quality > 60 ? 'quality-fair' : 'quality-poor'}`;
        } else {
            // Layout v2 (compacto)
            if (statusTextEl) {
                statusTextEl.textContent = 'Detectando...';
                statusEl?.classList.remove('detected');
            }
            // Layout v1 (antigo)
            else if (statusEl) {
                statusEl.innerHTML = `
                    <div class="status-spinner"></div>
                    <p>📍 Detectando rosto...</p>
                `;
                statusEl.classList.remove('detected');
            }
            
            qualityEl.textContent = '---';
            qualityEl.className = qualityEl.className.includes('compact') 
                ? 'quality-badge-compact quality-poor'
                : 'quality-badge quality-poor';
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
        return this.container.querySelector('#qr-video');
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
        const video = this.container.querySelector('#qr-video');
        if (video) video.style.opacity = '0.5';
        const btn = this.container.querySelector('.search-btn');
        if (btn) btn.disabled = true;
    }

    /**
     * Enable camera area
     */
    enable() {
        const video = this.container.querySelector('#qr-video');
        if (video) video.style.opacity = '1';
        const btn = this.container.querySelector('.search-btn');
        if (btn) btn.disabled = false;
    }
}

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CameraView;
}
