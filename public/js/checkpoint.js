(function() {
    'use strict';
    
    // DOM Elements
    const searchInput = document.getElementById('checkinSearchInput');
    const tableBody = document.getElementById('checkinTableBody');
    const resultsCount = document.getElementById('checkinResultsCount');
    const loadingState = document.getElementById('checkinLoadingState');
    const clearBtn = document.getElementById('clearSearchBtn');
    const totalStudentsEl = document.getElementById('total-students-checkin');
    const activeStudentsEl = document.getElementById('active-students-checkin');
    const checkinsTodayEl = document.getElementById('checkins-today');
    
    // Camera Elements
    const startCameraBtn = document.getElementById('startCameraBtn');
    const stopCameraBtn = document.getElementById('stopCameraBtn');
    const cameraSection = document.getElementById('cameraSection');
    const cameraVideo = document.getElementById('cameraVideo');
    const captureCanvas = document.getElementById('captureCanvas');
    const cameraStatus = document.getElementById('cameraStatus');
    const identificationPanel = document.getElementById('identificationPanel');
    const confirmCheckinBtn = document.getElementById('confirmCheckinBtn');
    const rejectIdentificationBtn = document.getElementById('rejectIdentificationBtn');
    
    // State
    let allStudents = [];
    let checkinResults = [];
    let debounceTimer;
    let isLoading = false;
    let cameraStream = null;
    let captureInterval = null;
    let identifiedStudent = null;
    
    // Initialize on page load
    document.addEventListener('DOMContentLoaded', async function() {
        await loadInitialData();
        setupEventListeners();
        setupCameraListeners();
        searchInput.focus();
    });
    
    // Load initial data and metrics
    async function loadInitialData() {
        try {
            await Promise.all([
                loadStudents(),
                loadMetrics()
            ]);
        } catch (error) {
            console.error('❌ Erro ao carregar dados iniciais:', error);
            showError('Erro ao carregar dados. Verifique a conexão.');
        }
    }
    
    // Load all students from API
    async function loadStudents() {
        try {
            const response = await fetch('/api/students');
            const result = await response.json();
            
            if (result.success && Array.isArray(result.data)) {
                allStudents = result.data;
                updateMetrics();
            } else {
                throw new Error('Formato de resposta inválido');
            }
        } catch (error) {
            console.error('❌ Erro ao carregar alunos:', error);
            allStudents = [];
            updateMetrics();
        }
    }
    
    // Load metrics (check-ins today, etc.)
    async function loadMetrics() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const response = await fetch(`/api/attendance?date=${today}`);
            const result = await response.json();
            
            if (result.success && Array.isArray(result.data)) {
                const todayCheckins = result.data.filter(record => record.present).length;
                checkinsTodayEl.textContent = todayCheckins;
            }
        } catch (error) {
            console.error('❌ Erro ao carregar métricas:', error);
            checkinsTodayEl.textContent = '0';
        }
    }
    
    // Update metrics display
    function updateMetrics() {
        const activeStudents = allStudents.filter(student => student.status === 'active').length;
        totalStudentsEl.textContent = allStudents.length;
        activeStudentsEl.textContent = activeStudents;
    }
    
    // Setup event listeners
    function setupEventListeners() {
        // Search input with debounce
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                searchStudents(e.target.value.trim());
            }, 300);
        });
        
        // Enter key for instant check-in if single result
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (checkinResults.length === 1) {
                    performCheckin(checkinResults[0].id);
                }
            }
        });
        
        // Clear search button
        clearBtn.addEventListener('click', clearSearch);
        
        // Table click handler for check-in buttons
        tableBody.addEventListener('click', (e) => {
            if (e.target.classList.contains('action-btn') && e.target.dataset.studentId) {
                performCheckin(e.target.dataset.studentId);
            }
        });
    }
    
    // Setup camera event listeners
    function setupCameraListeners() {
        // Start camera button
        startCameraBtn.addEventListener('click', async () => {
            await startCamera();
        });
        
        // Stop camera button
        stopCameraBtn.addEventListener('click', () => {
            stopCamera();
        });
        
        // Confirm check-in button
        confirmCheckinBtn.addEventListener('click', () => {
            if (identifiedStudent) {
                performCheckin(identifiedStudent.id);
                resetIdentification();
            }
        });
        
        // Reject identification button
        rejectIdentificationBtn.addEventListener('click', () => {
            resetIdentification();
        });
    }
    
    // Search students with smart matching
    function searchStudents(query) {
        if (!query || query.length < 2) {
            checkinResults = [];
            renderTable();
            return;
        }
        
        setLoading(true);
        
        // Smart search logic
        const searchTerm = query.toLowerCase();
        checkinResults = allStudents.filter(student => {
            const user = student.user || {};
            const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
            const email = (user.email || '').toLowerCase();
            const cpf = (user.cpf || '').replace(/\\D/g, '');
            const matricula = (student.matricula || generateMatricula(student.id, 1)).toLowerCase();
            
            return (
                fullName.includes(searchTerm) ||
                email.includes(searchTerm) ||
                cpf.includes(query.replace(/\\D/g, '')) ||
                matricula.includes(searchTerm)
            );
        });
        
        setLoading(false);
        renderTable();
    }
    
    // Render results table
    function renderTable() {
        resultsCount.textContent = checkinResults.length;
        
        if (checkinResults.length === 0) {
            const searchQuery = searchInput.value.trim();
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="empty-message">
                        ${searchQuery ? 'Nenhum aluno encontrado' : 'Digite acima para buscar alunos e fazer check-in'}
                    </td>
                </tr>
            `;
            return;
        }
        
        tableBody.innerHTML = checkinResults.map(student => {
            const user = student.user || {};
            const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
            const cpf = user.cpf || 'N/A';
            const formattedCpf = cpf !== 'N/A' ? formatCPF(cpf) : 'N/A';
            const matricula = student.matricula || generateMatricula(student.id, 1);
            const isHighlighted = checkinResults.length === 1 ? ' highlighted' : '';
            
            return `
                <tr class="${isHighlighted}">
                    <td>
                        <span class="student-matricula">${matricula}</span>
                    </td>
                    <td>
                        <div class="student-name">${fullName}</div>
                    </td>
                    <td>
                        <span class="student-cpf">${formattedCpf}</span>
                    </td>
                    <td>
                        <button class="action-btn" 
                                data-student-id="${student.id}" 
                                title="Check-in Rápido">
                            ⚡ CHECK-IN
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    // Perform check-in for student
    async function performCheckin(studentId) {
        const student = allStudents.find(s => s.id === studentId);
        if (!student) {
            showError('❌ Aluno não encontrado!');
            return;
        }
        
        const user = student.user || {};
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        const matricula = student.matricula || generateMatricula(student.id, 1);
        const now = new Date();
        const timeString = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        // Confirmation dialog
        const confirmed = confirm(`Confirmar check-in?\\n\\n${fullName} (${matricula})\\n${timeString}`);
        
        if (!confirmed) return;
        
        try {
            // Find the button and show loading state
            const btn = document.querySelector(`[data-student-id="${studentId}"]`);
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '⏳ Processando...';
            }
            
            // Call check-in API
            const attendanceData = {
                studentId: studentId,
                date: now.toISOString(),
                present: true,
                arrived_late: false,
                left_early: false,
                method: 'QUICK_CHECKIN'
            };
            
            const response = await fetch('/api/attendance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(attendanceData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Success feedback
                if (btn) {
                    btn.innerHTML = '✅ Feito!';
                    btn.style.background = '#10B981';
                    btn.style.color = 'white';
                }
                
                showSuccess(`✅ Check-in: ${fullName} (${matricula})`);
                
                // Update metrics
                await loadMetrics();
                
                // Auto-clear search after successful check-in
                setTimeout(() => {
                    clearSearch();
                }, 2000);
                
            } else {
                throw new Error(result.error || 'Erro no check-in');
            }
            
        } catch (error) {
            console.error('❌ Erro no check-in:', error);
            showError(`❌ Erro ao fazer check-in: ${error.message}`);
            
            // Reset button state
            const btn = document.querySelector(`[data-student-id="${studentId}"]`);
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '⚡ CHECK-IN';
                btn.style.background = '';
                btn.style.color = '';
            }
        }
    }
    
    // Clear search and reset state
    function clearSearch() {
        searchInput.value = '';
        checkinResults = [];
        renderTable();
        searchInput.focus();
    }
    
    // Set loading state
    function setLoading(loading) {
        isLoading = loading;
        loadingState.style.display = loading ? 'block' : 'none';
    }
    
    // Utility functions
    function generateMatricula(studentId, unitId) {
        const year = new Date().getFullYear().toString().slice(-2);
        const paddedId = studentId.toString().padStart(4, '0');
        return `${year}${unitId}${paddedId}`;
    }
    
    function formatCPF(cpf) {
        const cleaned = cpf.replace(/\\D/g, '');
        if (cleaned.length !== 11) return cpf;
        return cleaned.replace(/(\\d{3})(\\d{3})(\\d{3})(\\d{2})/, '$1.$2.$3-$4');
    }
    
    function showSuccess(message) {
        // Simple alert for now - could be replaced with a toast system
        alert(message);
    }
    
    function showError(message) {
        // Simple alert for now - could be replaced with a toast system
        alert(message);
    }
    
    // Camera functions
    async function startCamera() {
        try {
            updateCameraStatus('🟡', 'Iniciando câmera...');
            
            // Request camera access
            cameraStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                }
            });
            
            // Display video stream
            cameraVideo.srcObject = cameraStream;
            cameraSection.style.display = 'block';
            startCameraBtn.style.display = 'none';
            stopCameraBtn.style.display = 'inline-block';
            
            updateCameraStatus('🟢', 'Câmera ativa - Aguardando identificação...');
            
            // Start automatic capture for identification
            startAutoCapture();
            
        } catch (error) {
            console.error('❌ Erro ao acessar câmera:', error);
            updateCameraStatus('🔴', 'Erro ao acessar câmera');
            showError('Não foi possível acessar a câmera. Verifique as permissões.');
        }
    }
    
    function stopCamera() {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            cameraStream = null;
        }
        
        if (captureInterval) {
            clearInterval(captureInterval);
            captureInterval = null;
        }
        
        cameraVideo.srcObject = null;
        cameraSection.style.display = 'none';
        startCameraBtn.style.display = 'inline-block';
        stopCameraBtn.style.display = 'none';
        
        resetIdentification();
        updateCameraStatus('🔴', 'Câmera desligada');
    }
    
    function startAutoCapture() {
        // Capture and analyze frames every 3 seconds
        captureInterval = setInterval(async () => {
            await captureAndAnalyze();
        }, 3000);
    }
    
    async function captureAndAnalyze() {
        try {
            if (!cameraStream) return;
            
            // Capture frame from video
            const canvas = captureCanvas;
            const ctx = canvas.getContext('2d');
            
            canvas.width = cameraVideo.videoWidth;
            canvas.height = cameraVideo.videoHeight;
            
            ctx.drawImage(cameraVideo, 0, 0);
            
            // Convert to base64
            const imageData = canvas.toDataURL('image/jpeg', 0.8);
            
            updateCameraStatus('🟡', 'Analisando imagem...');
            
            // Send to AI service for facial recognition
            const result = await analyzeStudentFace(imageData);
            
            if (result.success && result.studentId) {
                const student = allStudents.find(s => s.id === result.studentId);
                if (student) {
                    showIdentifiedStudent(student, result.confidence);
                } else {
                    updateCameraStatus('🔴', 'Aluno não encontrado no sistema');
                }
            } else {
                updateCameraStatus('🟢', 'Câmera ativa - Nenhum aluno identificado');
            }
            
        } catch (error) {
            console.error('❌ Erro na captura:', error);
            updateCameraStatus('🔴', 'Erro na análise da imagem');
        }
    }
    
    async function analyzeStudentFace(imageData) {
        try {
            const response = await fetch('/api/ai/face-recognition', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    image: imageData,
                    students: allStudents.map(s => ({
                        id: s.id,
                        name: `${s.user?.firstName || ''} ${s.user?.lastName || ''}`.trim(),
                        photo: s.photo || null
                    }))
                })
            });
            
            const result = await response.json();
            return result;
            
        } catch (error) {
            console.error('❌ Erro na análise facial:', error);
            return { success: false, error: error.message };
        }
    }
    
    function showIdentifiedStudent(student, confidence) {
        const user = student.user || {};
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        const matricula = student.matricula || generateMatricula(student.id, 1);
        
        // Update identification panel
        document.getElementById('identifiedName').textContent = fullName;
        document.getElementById('identifiedMatricula').textContent = matricula;
        document.getElementById('identifiedClass').textContent = student.category || 'Sem categoria';
        document.getElementById('confidenceValue').textContent = Math.round(confidence * 100) + '%';
        
        // Show student photo if available
        const photoEl = document.getElementById('studentPhoto');
        if (student.photo) {
            photoEl.src = student.photo;
            photoEl.style.display = 'block';
            photoEl.nextElementSibling.style.display = 'none';
        } else {
            photoEl.style.display = 'none';
            photoEl.nextElementSibling.style.display = 'flex';
        }
        
        // Store identified student
        identifiedStudent = student;
        
        // Show identification panel
        identificationPanel.style.display = 'block';
        
        // Update camera status
        updateCameraStatus('🟢', `Aluno identificado: ${fullName}`);
        
        // Stop auto capture while showing identification
        if (captureInterval) {
            clearInterval(captureInterval);
            captureInterval = null;
        }
    }
    
    function resetIdentification() {
        identifiedStudent = null;
        identificationPanel.style.display = 'none';
        
        // Restart auto capture if camera is active
        if (cameraStream && !captureInterval) {
            startAutoCapture();
        }
        
        updateCameraStatus('🟢', 'Câmera ativa - Aguardando identificação...');
    }
    
    function updateCameraStatus(icon, message) {
        const statusIcon = cameraStatus.querySelector('.status-icon');
        const statusText = cameraStatus.querySelector('.status-text');
        
        statusIcon.textContent = icon;
        statusText.textContent = message;
    }
    
})();