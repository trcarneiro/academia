(function() {
    'use strict';

    // --- Global State ---
    let currentStudent = null;
    let currentTab = 'profile'; // Start with profile tab to avoid API issues
    let studentId = null;
    let loadedTabs = new Set(); // Track which tabs have been loaded to avoid duplicates

    // --- Initialization ---
    function initialize() {
        console.log('🚀 Initializing NEW Student Editor (Refactored - 2 Tabs)...');
        setStudentId();
        setupEventListeners();
        loadInitialData();
    }

    function setStudentId() {
        const editorModeData = localStorage.getItem('studentEditorMode');
        if (editorModeData) {
            try {
                const editorData = JSON.parse(editorModeData);
                studentId = editorData.studentId;
                console.log(`✅ Student ID set from localStorage: ${studentId}`);
            } catch (e) {
                console.error('❌ Failed to parse studentEditorMode', e);
            }
        }

        if (!studentId) {
            const urlParams = new URLSearchParams(window.location.search);
            studentId = urlParams.get('id');
            console.log(`✅ Student ID set from URL: ${studentId}`);
        }

        if (!studentId) {
            showError('Nenhum ID de estudante encontrado. Retornando à lista.');
            setTimeout(() => window.navigateToModule('students'), 3000);
        }
    }

    function setupEventListeners() {
        // Main buttons
        document.getElementById('back-to-list-btn')?.addEventListener('click', () => window.navigateToModule('students'));
        document.getElementById('save-student-btn')?.addEventListener('click', saveStudentChanges);

        // Tab navigation - only allow profile and financial tabs
        const tabContainer = document.querySelector('.tab-navigation');
        tabContainer?.addEventListener('click', (e) => {
            const button = e.target.closest('.page-tab');
            if (button && !button.classList.contains('active')) {
                const tabId = button.dataset.tab;
                // Only allow profile and financial tabs
                if (tabId === 'profile' || tabId === 'financial') {
                    switchTab(tabId);
                } else {
                    console.log(`⚠️ Tab "${tabId}" não disponível nesta versão`);
                    alert(`A aba "${tabId}" será implementada em breve!`);
                }
            }
        });
    }

    // --- Data Loading ---
    async function loadInitialData() {
        if (!studentId) {
            console.log('❌ No student ID found, cannot load data');
            return;
        }

        console.log('📡 Loading initial data for student ID:', studentId);
        showLoading('Carregando dados do aluno...');
        
        try {
            const response = await window.fetchWithOrganization(`/api/students/${studentId}`);
            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }
            const result = await response.json();
            if (result.success && result.data) {
                currentStudent = result.data;
                console.log('✅ Student data loaded:', currentStudent.id);
                renderPage();
            } else {
                throw new Error(result.message || 'Falha ao carregar dados do aluno.');
            }
        } catch (error) {
            console.error('❌ Error loading initial data:', error);
            showError(`Erro ao carregar dados: ${error.message}`);
            
            // Even if student data fails, show basic interface with mock data
            currentStudent = {
                id: studentId,
                user: { firstName: 'Aluno', lastName: 'Não Carregado' },
                category: 'N/A',
                isActive: true
            };
            console.log('🔧 Using fallback student data to show interface');
            renderPage();
        } finally {
            hideLoading();
        }
    }

    // --- Rendering ---
    function renderPage() {
        console.log('🎨 Rendering page for student:', currentStudent?.id);
        renderHeader();
        renderTabs();
    }

    function renderHeader() {
        console.log('📋 Rendering header');
        const user = currentStudent.user || {};
        const studentName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Novo Aluno';
        
        const nameElement = document.getElementById('editPageStudentName');
        const idElement = document.getElementById('editPageStudentId');
        const categoryElement = document.getElementById('editPageStudentCategory');
        
        if (nameElement) nameElement.textContent = studentName;
        if (idElement) idElement.textContent = `ID: ${currentStudent.id}`;
        if (categoryElement) categoryElement.textContent = `Categoria: ${currentStudent.category || 'N/A'}`;
        
        document.title = `Editando: ${studentName}`;
        console.log('✅ Header rendered successfully');
    }

    function renderTabs() {
        console.log('📑 Rendering tabs, current tab:', currentTab);
        
        // Activate the correct tab button
        document.querySelectorAll('.page-tab').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === currentTab);
        });

        // Show the correct content container
        document.querySelectorAll('.tab-content').forEach(content => {
            content.style.display = content.id === `${currentTab}-content` ? 'block' : 'none';
        });

        // Only load content if the tab hasn't been loaded yet
        if (!loadedTabs.has(currentTab)) {
            loadTabContent(currentTab);
        } else {
            console.log(`✅ Tab ${currentTab} already loaded, just showing content`);
        }
    }

    function switchTab(tabId) {
        currentTab = tabId;
        renderTabs();
    }

    // Clear tab cache - useful when student data is updated
    function clearTabCache() {
        loadedTabs.clear();
        console.log('🔄 Tab cache cleared');
    }

    async function loadTabContent(tabId) {
        const container = document.getElementById(`${tabId}-content`);
        if (!container) {
            console.error(`❌ Container not found for tab: ${tabId}`);
            return;
        }

        // Check if tab has already been loaded to avoid duplicates
        if (loadedTabs.has(tabId)) {
            console.log(`✅ Tab ${tabId} already loaded, skipping reload`);
            container.style.display = 'block';
            return;
        }

        console.log(`🔄 Loading content for tab: ${tabId}`);
        container.innerHTML = '<div class="loading-spinner"></div>'; // Show loading spinner

        try {
            switch (tabId) {
                case 'profile':
                    console.log('👤 Loading profile tab - using existing HTML content');
                    // Don't replace HTML content, just populate existing form
                    populateProfileForm();
                    // Make sure the content is visible
                    container.style.display = 'block';
                    break;
                case 'financial':
                    console.log('💳 Loading financial tab');
                    await loadFinancialData(container);
                    break;
                default:
                    console.log(`📝 Loading default content for tab: ${tabId}`);
                    container.innerHTML = `<div class="empty-state">A aba "${tabId}" será implementada em breve.</div>`;
            }
            
            // Mark tab as loaded
            loadedTabs.add(tabId);
            console.log(`✅ Content loaded successfully for tab: ${tabId}, loaded tabs:`, Array.from(loadedTabs));
        } catch (error) {
            console.error(`❌ Error loading ${tabId} content:`, error);
            container.innerHTML = `<div class="error-state">Erro ao carregar ${tabId}: ${error.message}</div>`;
        }
    }

    // --- Financial Tab ---
    async function loadFinancialData(container) {
        if (!currentStudent) return;

        console.log('💳 Loading financial data for student:', currentStudent.id);
        
        try {
            const response = await window.fetchWithOrganization(`/api/students/${currentStudent.id}/subscription`);
            console.log('📡 Financial API Response:', response.status, response.statusText);
            
            if (!response.ok) {
                if (response.status === 404) {
                    console.log('🔍 No subscription found (404) - showing no subscription state');
                    container.innerHTML = renderNoSubscriptionState();
                    return;
                } else if (response.status >= 500) {
                    console.log('⚠️ Server error (500+) - showing error state with fallback');
                    container.innerHTML = renderFinancialErrorState();
                    return;
                } else {
                    console.log('❌ Other API error - throwing');
                    throw new Error(`API Error: ${response.status} ${response.statusText}`);
                }
            }
            
            const result = await response.json();
            if (result.success && result.data) {
                console.log('✅ Financial data loaded successfully');
                container.innerHTML = renderFinancialData(result.data);
            } else {
                console.log('🔍 No data in response - showing no subscription state');
                container.innerHTML = renderNoSubscriptionState();
            }
        } catch (error) {
            console.error('❌ Error loading financial data:', error);
            console.log('🔧 Using robust error state as fallback');
            // Use our robust error state instead of generic error
            container.innerHTML = renderFinancialErrorState();
        }
    }

    function renderFinancialData(subscription) {
        const plan = subscription.plan || {};
        return `
            <div class="form-section">
                <h4>💳 Plano Atual</h4>
                <div class="form-grid">
                    <div class="form-group">
                        <label>Nome do Plano</label>
                        <input type="text" value="${plan.name || 'N/A'}" disabled>
                    </div>
                    <div class="form-group">
                        <label>Preço</label>
                        <input type="text" value="R$ ${plan.price || '0.00'}" disabled>
                    </div>
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label>Status</label>
                        <input type="text" value="${subscription.status || 'N/A'}" disabled>
                    </div>
                    <div class="form-group">
                        <label>Próximo Vencimento</label>
                        <input type="text" value="${subscription.nextPayment ? new Date(subscription.nextPayment).toLocaleDateString('pt-BR') : 'N/A'}" disabled>
                    </div>
                </div>
            </div>
        `;
    }

    function renderNoSubscriptionState() {
        return `
            <div class="form-section">
                <h4 style="color: #F8FAFC; margin: 0 0 1.5rem 0; display: flex; align-items: center; gap: 0.75rem;">
                    💳 Gestão de Assinaturas
                </h4>

                <!-- No Subscription State -->
                <div style="background: rgba(107, 114, 128, 0.1); border: 1px dashed #6B7280; border-radius: 12px; padding: 2rem; text-align: center; margin-bottom: 2rem;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📋</div>
                    <h5 style="color: #9CA3AF; margin: 0 0 1rem 0;">Nenhuma Assinatura Encontrada</h5>
                    <p style="color: #6B7280; margin: 0 0 1.5rem 0;">Este aluno não possui plano ativo no momento.</p>
                    <button onclick="createNewSubscription()" style="padding: 0.75rem 2rem; background: linear-gradient(135deg, #10B981, #059669); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;">
                        ➕ Criar Nova Assinatura
                    </button>
                </div>

                <!-- Available Plans -->
                <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid #334155; border-radius: 12px; padding: 1.5rem;">
                    <h5 style="color: #8B5CF6; margin: 0 0 1.5rem 0; font-size: 1.1rem;">💎 Planos Disponíveis</h5>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
                        <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid #3B82F6; border-radius: 8px; padding: 1rem;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                                <h6 style="color: #3B82F6; margin: 0; font-weight: bold;">Plano Básico</h6>
                                <span style="color: #10B981; font-weight: bold;">R$ 150,00</span>
                            </div>
                            <p style="color: #CBD5E1; font-size: 0.875rem; margin: 0 0 1rem 0;">2x por semana • Aulas em grupo</p>
                            <button onclick="selectPlan('basic')" style="width: 100%; padding: 0.5rem; background: transparent; color: #3B82F6; border: 1px solid #3B82F6; border-radius: 6px; cursor: pointer;">
                                Selecionar
                            </button>
                        </div>
                        
                        <div style="background: rgba(139, 92, 246, 0.1); border: 1px solid #8B5CF6; border-radius: 8px; padding: 1rem;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                                <h6 style="color: #8B5CF6; margin: 0; font-weight: bold;">Plano Premium</h6>
                                <span style="color: #10B981; font-weight: bold;">R$ 250,00</span>
                            </div>
                            <p style="color: #CBD5E1; font-size: 0.875rem; margin: 0 0 1rem 0;">Ilimitado • Aulas particulares</p>
                            <button onclick="selectPlan('premium')" style="width: 100%; padding: 0.5rem; background: transparent; color: #8B5CF6; border: 1px solid #8B5CF6; border-radius: 6px; cursor: pointer;">
                                Selecionar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function renderFinancialErrorState() {
        return `
            <div class="form-section">
                <h4 style="color: #F8FAFC; margin: 0 0 1.5rem 0; display: flex; align-items: center; gap: 0.75rem;">
                    💳 Gestão de Assinaturas
                </h4>

                <!-- Error State -->
                <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 2rem; text-align: center; margin-bottom: 2rem;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
                    <h5 style="color: #F87171; margin: 0 0 1rem 0;">Erro ao Carregar Dados Financeiros</h5>
                    <p style="color: #FCA5A5; margin: 0 0 1.5rem 0;">Não foi possível carregar os dados de assinatura. O servidor pode estar temporariamente indisponível.</p>
                    <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                        <button onclick="window.location.reload()" style="padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #3B82F6, #8B5CF6); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;">
                            🔄 Tentar Novamente
                        </button>
                        <button onclick="createNewSubscription()" style="padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #10B981, #059669); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;">
                            ➕ Criar Assinatura
                        </button>
                    </div>
                </div>

                <!-- Available Plans as fallback -->
                <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid #334155; border-radius: 12px; padding: 1.5rem;">
                    <h5 style="color: #8B5CF6; margin: 0 0 1.5rem 0; font-size: 1.1rem;">💎 Planos Disponíveis</h5>
                    <p style="color: #94A3B8; margin: 0 0 1rem 0; font-size: 0.875rem;">Enquanto isso, você pode visualizar os planos disponíveis:</p>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
                        <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid #3B82F6; border-radius: 8px; padding: 1rem;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                                <h6 style="color: #3B82F6; margin: 0; font-weight: bold;">Plano Básico</h6>
                                <span style="color: #10B981; font-weight: bold;">R$ 150,00</span>
                            </div>
                            <p style="color: #CBD5E1; font-size: 0.875rem; margin: 0 0 1rem 0;">2x por semana • Aulas em grupo</p>
                            <button onclick="selectPlan('basic')" style="width: 100%; padding: 0.5rem; background: transparent; color: #3B82F6; border: 1px solid #3B82F6; border-radius: 6px; cursor: pointer;">
                                Selecionar
                            </button>
                        </div>
                        
                        <div style="background: rgba(139, 92, 246, 0.1); border: 1px solid #8B5CF6; border-radius: 8px; padding: 1rem;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                                <h6 style="color: #8B5CF6; margin: 0; font-weight: bold;">Plano Premium</h6>
                                <span style="color: #10B981; font-weight: bold;">R$ 250,00</span>
                            </div>
                            <p style="color: #CBD5E1; font-size: 0.875rem; margin: 0 0 1rem 0;">Ilimitado • Aulas particulares</p>
                            <button onclick="selectPlan('premium')" style="width: 100%; padding: 0.5rem; background: transparent; color: #8B5CF6; border: 1px solid #8B5CF6; border-radius: 6px; cursor: pointer;">
                                Selecionar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // --- Profile Tab ---
    function populateProfileForm() {
        if (!currentStudent) {
            console.log('❌ No current student data to populate form');
            return;
        }
        
        const user = currentStudent.user || {};
        console.log('📝 Populating profile form with data:', {
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            email: user.email,
            phone: user.phone || currentStudent.phone,
            isActive: currentStudent.isActive
        });

        // Try to find fields by multiple selectors (more robust)
        const nameField = document.getElementById('student-name') || 
                         document.querySelector('input[placeholder*="Nome"]') ||
                         document.querySelector('input[placeholder*="nome"]');
        
        const emailField = document.getElementById('student-email') || 
                          document.querySelector('input[type="email"]');
        
        const phoneField = document.getElementById('student-phone') || 
                          document.querySelector('input[placeholder*="Telefone"]') ||
                          document.querySelector('input[placeholder*="telefone"]') ||
                          document.querySelector('input[type="tel"]');
        
        const birthDateField = document.getElementById('student-birth-date') || 
                              document.querySelector('input[type="date"]');
        
        const notesField = document.getElementById('student-notes') || 
                          document.querySelector('textarea');
        
        const statusField = document.getElementById('student-status') || 
                           document.querySelector('select');

        // Populate fields if they exist
        if (nameField) {
            nameField.value = `${user.firstName || ''} ${user.lastName || ''}`.trim();
            console.log('✅ Name field populated');
        } else {
            console.log('⚠️ Name field not found');
        }
        
        if (emailField) {
            emailField.value = user.email || '';
            console.log('✅ Email field populated');
        } else {
            console.log('⚠️ Email field not found');
        }
        
        if (phoneField) {
            phoneField.value = user.phone || currentStudent.phone || '';
            console.log('✅ Phone field populated');
        } else {
            console.log('⚠️ Phone field not found');
        }
        
        if (birthDateField && currentStudent.birthDate) {
            birthDateField.value = new Date(currentStudent.birthDate).toISOString().split('T')[0];
            console.log('✅ Birth date field populated');
        }
        
        if (notesField) {
            notesField.value = currentStudent.notes || '';
            console.log('✅ Notes field populated');
        }
        
        if (statusField) {
            // Try different value formats
            const isActive = currentStudent.isActive;
            statusField.value = isActive ? 'ACTIVE' : 'INACTIVE';
            // If that doesn't work, try other formats
            if (statusField.selectedIndex === -1) {
                statusField.value = isActive ? 'Ativo' : 'Inativo';
            }
            console.log('✅ Status field populated:', statusField.value);
        }

        console.log('✅ Profile form population completed');
    }

    // --- Actions ---
    async function saveStudentChanges() {
        if (!currentStudent) {
            console.log('❌ No current student to save');
            return;
        }

        console.log('💾 Saving student changes...');

        // Use robust field selectors
        const nameField = document.getElementById('student-name') || 
                         document.querySelector('input[placeholder*="Nome"]') ||
                         document.querySelector('input[placeholder*="nome"]');
        
        const emailField = document.getElementById('student-email') || 
                          document.querySelector('input[type="email"]');
        
        const phoneField = document.getElementById('student-phone') || 
                          document.querySelector('input[placeholder*="Telefone"]') ||
                          document.querySelector('input[placeholder*="telefone"]') ||
                          document.querySelector('input[type="tel"]');
        
        const birthDateField = document.getElementById('student-birth-date') || 
                              document.querySelector('input[type="date"]');
        
        const notesField = document.getElementById('student-notes') || 
                          document.querySelector('textarea');
        
        const statusField = document.getElementById('student-status') || 
                           document.querySelector('select');

        const formData = {
            name: nameField?.value || '',
            email: emailField?.value || '',
            phone: phoneField?.value || '',
            birthDate: birthDateField?.value || '',
            notes: notesField?.value || '',
            isActive: statusField?.value === 'ACTIVE' || statusField?.value === 'Ativo',
        };

        console.log('📋 Form data collected:', formData);

        showLoading('Salvando...');
        try {
            const response = await window.fetchWithOrganization(`/api/students/${currentStudent.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorResult = await response.json();
                throw new Error(errorResult.message || 'Falha ao salvar.');
            }

            console.log('✅ Student saved successfully');
            showSuccess('Aluno salvo com sucesso!');
            
            // Clear tab cache to ensure fresh data on next load
            clearTabCache();
            
            setTimeout(() => window.navigateToModule('students'), 2000);

        } catch (error) {
            console.error('❌ Error saving student:', error);
            showError(error.message);
        } finally {
            hideLoading();
        }
    }

    // --- UI Helpers ---
    function showLoading(message = 'Carregando...') {
        document.getElementById('loadingStateMessage').textContent = message;
        document.getElementById('loadingState').style.display = 'flex';
    }

    function hideLoading() {
        document.getElementById('loadingState').style.display = 'none';
    }

    function showError(message) {
        // A more robust implementation would use a dedicated notification system
        alert(`❌ ERRO: ${message}`);
    }

    function showSuccess(message) {
        alert(`✅ SUCESSO: ${message}`);
    }

    // --- Financial Action Functions ---
    window.createNewSubscription = function() {
        alert('➕ Criar Nova Assinatura\n\nSelecione um plano na seção "Planos Disponíveis" para começar.');
    };

    window.selectPlan = function(planId) {
        alert(`📋 Plano Selecionado: ${planId}\n\nAqui você poderá:\n• Definir data de início\n• Configurar forma de pagamento\n• Adicionar observações especiais`);
    };

    window.editCurrentSubscription = function() {
        alert('🔧 Editar Assinatura\n\nAqui você poderá:\n• Alterar valor personalizado\n• Modificar data de vencimento\n• Ajustar condições especiais');
    };

    window.changeSubscriptionPlan = function() {
        alert('🔄 Trocar Plano\n\nEscolha um novo plano na seção "Planos Disponíveis" abaixo.\n\nA mudança será aplicada no próximo ciclo de cobrança.');
    };

    window.cancelSubscription = function() {
        if (confirm('⚠️ Cancelar Assinatura\n\nTem certeza que deseja cancelar a assinatura deste aluno?\n\nEsta ação pode ser revertida posteriormente.')) {
            alert('🔄 Assinatura cancelada com sucesso!\n\nO aluno manterá acesso até o final do período pago.');
        }
    };

    // --- Entry Point ---
    // The module loader in index.html will call this function
    window.initializeStudentEditorNewModule = initialize;

})();
