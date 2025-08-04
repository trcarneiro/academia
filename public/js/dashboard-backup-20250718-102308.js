document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Dashboard inicializado com arquitetura reativa.');

    // Delegação de eventos para toda a aplicação
    document.body.addEventListener('click', function(e) {
        const navLink = e.target.closest('.nav-link');
        if (navLink) {
            e.preventDefault();
            const page = navLink.dataset.page;
            showSection(page);
            return;
        }

        const addNewStudentBtn = e.target.closest('#addNewStudentBtn');
        if (addNewStudentBtn) {
            e.preventDefault();
            showSection('student-editor');
            return;
        }

        const backBtn = e.target.closest('#backBtn');
        if (backBtn) {
            e.preventDefault();
            showSection('students');
            return;
        }

        const tabLink = e.target.closest('.tab-link');
        if (tabLink) {
            e.preventDefault();
            const tabName = tabLink.dataset.tab;
            const tabContentContainer = e.target.closest('.main-content').querySelector('#student-tab-content');
            loadStudentTabData(tabName, tabContentContainer);
            
            // Atualiza o estado ativo da aba
            tabLink.parentElement.querySelector('.active').classList.remove('active');
            tabLink.classList.add('active');
        }

        const tableViewBtn = e.target.closest('#tableViewBtn');
        if (tableViewBtn) {
            e.preventDefault();
            switchStudentView('table');
            return;
        }

        const gridViewBtn = e.target.closest('#gridViewBtn');
        if (gridViewBtn) {
            e.preventDefault();
            switchStudentView('cards');
            return;
        }
    });

    // Event listener para busca de alunos
    document.body.addEventListener('keyup', function(e) {
        if (e.target.id === 'studentSearch') {
            filterStudents(e.target.value);
        }
    });

    // Carrega a seção inicial (dashboard)
    showSection('dashboard');
});

// Cache para views e flags para dados carregados
const viewCache = new Map();
const dataLoaded = {
    dashboard: false,
    students: false
};

// Variável global para armazenar os dados dos alunos
let allStudentsData = [];

async function showSection(pageName) {
    console.log(`📄 Navegando para: ${pageName}`);

    const staticSections = document.querySelectorAll('.static-section');
    const dynamicContainer = document.getElementById('dynamic-view-container');

    // Esconde tudo
    staticSections.forEach(section => section.style.display = 'none');
    dynamicContainer.style.display = 'none';
    dynamicContainer.innerHTML = '';

    // Atualiza o link ativo no menu
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.getAttribute('data-page') === pageName);
    });

    if (pageName === 'student-editor') {
        dynamicContainer.style.display = 'block';
        await loadStudentEditor(dynamicContainer);
    } else {
        const targetSection = document.getElementById(`${pageName}Content`);
        if (targetSection) {
            targetSection.style.display = 'block';
            await loadSectionData(pageName);
        } else {
            document.getElementById('dashboardContent').style.display = 'block';
            await loadSectionData('dashboard');
        }
    }
}

async function loadSectionData(sectionName) {
    switch(sectionName) {
        case 'dashboard':
            if (dataLoaded.dashboard) return;
            console.log('📊 Carregando dados do Dashboard...');
            try {
                const response = await fetch('/api/students');
                const result = await response.json();
                if(result.success) {
                    document.getElementById('total-students').textContent = result.data.length;
                    document.getElementById('active-students').textContent = result.data.filter(s => s.user.isActive).length;
                    dataLoaded.dashboard = true;
                }
            } catch (error) {
                console.error('Erro ao carregar estatísticas:', error);
            }
            break;
        case 'students':
            if (dataLoaded.students) return;
            console.log('👥 Carregando lista de alunos...');
            try {
                const response = await fetch('/api/students');
                const result = await response.json();
                if(result.success) {
                    allStudentsData = result.data; // Armazena os dados globalmente
                    renderStudentTable(allStudentsData); // Renderiza a tabela
                    renderStudentsCards(allStudentsData); // Renderiza os cards
                    switchStudentView('table'); // Define a visualização padrão
                    dataLoaded.students = true;
                }
            } catch (error) {
                console.error('Erro ao carregar alunos:', error);
            }
            break;
    }
}

function renderStudentTable(students) {
    const emptyState = document.getElementById('studentsEmptyState');
    const studentsListTable = document.getElementById('studentsListTable');
    const tbody = document.getElementById('studentsTableBody');

    if (students.length === 0) {
        if(emptyState) emptyState.style.display = 'block';
        if(studentsListTable) studentsListTable.style.display = 'none';
        if(tbody) tbody.innerHTML = '';
        return;
    }

    if(emptyState) emptyState.style.display = 'none';
    if(studentsListTable) studentsListTable.style.display = 'table';
    
    tbody.innerHTML = students.map(student => {
        const user = student.user || {};
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || student.name || 'Nome não informado';
        const email = user.email || 'Email não informado';
        const category = student.category || 'Não informada';
        const isActive = user.isActive !== undefined ? user.isActive : false;

        return `
            <tr data-student-id="${student.id}">
                <td>${fullName}</td>
                <td>${email}</td>
                <td><span class="badge success">${category}</span></td>
                <td><span class="status ${isActive ? 'active' : 'inactive'}">${isActive ? 'Ativo' : 'Inativo'}</span></td>
            </tr>
        `;
    }).join('');
}

function renderStudentsCards(students) {
    const studentsCardsGrid = document.getElementById('studentsCardsGrid');
    const studentsCardsEmpty = document.getElementById('studentsCardsEmpty');

    if (students.length === 0) {
        if(studentsCardsEmpty) studentsCardsEmpty.style.display = 'block';
        if(studentsCardsGrid) studentsCardsGrid.innerHTML = '';
        return;
    }

    if(studentsCardsEmpty) studentsCardsEmpty.style.display = 'none';

    studentsCardsGrid.innerHTML = students.map(student => {
        const user = student.user || {};
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || student.name || 'Nome não informado';
        const email = user.email || 'Email não informado';
        const category = student.category || 'Não informada';
        const isActive = user.isActive !== undefined ? user.isActive : false;

        return `
            <div class="student-card">
                <div class="student-card-header">
                    <div class="student-avatar">${(fullName[0] || '?').toUpperCase()}</div>
                    <div class="student-info">
                        <div class="student-name">${fullName}</div>
                        <div class="student-matricula">ID: ${student.id}</div>
                        <div class="student-email">${email}</div>
                    </div>
                    <span class="student-status status ${isActive ? 'active' : 'inactive'}">${isActive ? 'Ativo' : 'Inativo'}</span>
                </div>
                <div class="student-stats">
                    <div class="student-stat">
                        <div class="student-stat-value">${category}</div>
                        <div class="student-stat-label">Categoria</div>
                    </div>
                    <!-- Adicionar mais estatísticas aqui se necessário -->
                </div>
                <div class="student-actions">
                    <button class="btn btn-student-primary">✏️ Editar</button>
                    <button class="btn btn-student-secondary">👁️ Ver</button>
                </div>
            </div>
        `;
    }).join('');
}

function filterStudents(searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    const filteredStudents = allStudentsData.filter(student => {
        const user = student.user || {};
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim().toLowerCase();
        const email = user.email?.toLowerCase() || '';
        const id = String(student.id).toLowerCase();
        return fullName.includes(term) || email.includes(term) || id.includes(term);
    });

    // Renderiza a visualização atual com os alunos filtrados
    const currentView = document.getElementById('studentsTableView').style.display === 'block' ? 'table' : 'cards';
    if (currentView === 'table') {
        renderStudentTable(filteredStudents);
    } else {
        renderStudentsCards(filteredStudents);
    }
}

function switchStudentView(viewType) {
    const tableView = document.getElementById('studentsTableView');
    const cardsView = document.getElementById('studentsCardsView');
    const tableViewBtn = document.getElementById('tableViewBtn');
    const gridViewBtn = document.getElementById('gridViewBtn');

    if (viewType === 'table') {
        tableView.style.display = 'block';
        cardsView.style.display = 'none';
        tableViewBtn.classList.add('active');
        gridViewBtn.classList.remove('active');
    } else {
        tableView.style.display = 'none';
        cardsView.style.display = 'block';
        tableViewBtn.classList.remove('active');
        gridViewBtn.classList.add('active');
    }
}

async function loadStudentEditor(container) {
    container.innerHTML = '<div class="loading-state"><p>Carregando editor...</p></div>';
    try {
        let editorHtml = viewCache.get('student-editor');
        if (!editorHtml) {
            const response = await fetch('/views/student-editor.html');
            if (!response.ok) throw new Error('Falha ao carregar o esqueleto do editor');
            editorHtml = await response.text();
            viewCache.set('student-editor', editorHtml);
        }
        container.innerHTML = editorHtml;

        // Adiciona os event listeners para o botão de voltar
        const backBtn = container.querySelector('#backBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => showSection('students'));
        }

        // Adiciona os event listeners para as abas
        const tabContainer = container.querySelector('.tabs');
        if(tabContainer) {
            tabContainer.addEventListener('click', (e) => {
                if (e.target.matches('.tab-link')) {
                    const tabName = e.target.dataset.tab;
                    const tabContentContainer = container.querySelector('#student-tab-content');
                    loadStudentTabData(tabName, tabContentContainer);
                    
                    // Atualiza o estado ativo da aba
                    tabContainer.querySelector('.active').classList.remove('active');
                    e.target.classList.add('active');
                }
            });
        }

        // Carrega o conteúdo da primeira aba por padrão
        loadStudentTabData('details', container.querySelector('#student-tab-content'));

    } catch (error) {
        console.error('❌ Erro ao carregar o editor de aluno:', error);
        container.innerHTML = '<div class="error-state"><p>Não foi possível carregar o editor.</p></div>';
    }
}

async function loadStudentTabData(tabName, tabContainer) {
    if (!tabContainer) return;
    tabContainer.innerHTML = '<div class="loading-state"><p>Carregando dados...</p></div>';
    try {
        let tabHtml = viewCache.get(`tab-${tabName}`);
        if (!tabHtml) {
            const response = await fetch(`/views/tabs/student-${tabName}.html`);
            if (!response.ok) throw new Error(`Falha ao carregar o conteúdo da aba: ${tabName}`);
            tabHtml = await response.text();
            viewCache.set(`tab-${tabName}`, tabHtml);
        }
        tabContainer.innerHTML = tabHtml;

        const studentId = 1; // ID Fixo para exemplo
        const apiResponse = await fetch(`/api/students/${studentId}/${tabName}`);
        if (!apiResponse.ok) throw new Error(`API para a aba ${tabName} falhou`);
        const apiData = await apiResponse.json();

        if (apiData.success) {
            populateTabData(tabName, apiData.data);
        } else {
            throw new Error(`API retornou erro para a aba: ${tabName}`);
        }
    } catch (error) {
        console.error(`❌ Erro ao carregar a aba ${tabName}:`, error);
        tabContainer.innerHTML = `<div class="error-state"><p>Erro ao carregar conteúdo.</p></div>`;
    }
}

function populateTabData(tabName, data) {
    switch (tabName) {
        case 'details':
            document.getElementById('firstName').value = data.firstName;
            document.getElementById('lastName').value = data.lastName;
            document.getElementById('email').value = data.email;
            document.getElementById('phone').value = data.phone;
            document.getElementById('cpf').value = data.cpf;
            document.getElementById('birthDate').value = data.birthDate;
            document.getElementById('category').value = data.category;
            // document.getElementById('gender').value = data.gender; // Gênero não está na API mock
            // document.getElementById('physicalCondition').value = data.physicalCondition; // Condição Física não está na API mock
            document.getElementById('enrollmentDate').value = data.enrollmentDate;
            // document.getElementById('medicalConditions').value = data.medicalConditions; // Condições Médicas não está na API mock
            // document.getElementById('emergencyContact').value = data.emergencyContact; // Contato de Emergência não está na API mock
            // document.getElementById('specialNeeds').value = data.specialNeeds; // Necessidades Especiais não está na API mock
            break;
        case 'subscription':
            document.getElementById('sub-plan-name').textContent = data.planName;
            document.getElementById('sub-status').textContent = data.status;
            document.getElementById('sub-status').className = data.status === 'Ativo' ? 'info-value status-active' : 'info-value status-inactive';
            document.getElementById('sub-value').textContent = data.value;
            document.getElementById('sub-due-date').textContent = new Date(data.dueDate).toLocaleDateString();
            break;
        case 'courses':
            const coursesGrid = document.getElementById('student-courses-grid');
            const noCoursesMsg = document.getElementById('no-courses-message');
            if (data.length === 0) {
                noCoursesMsg.style.display = 'block';
                coursesGrid.innerHTML = '';
            } else {
                noCoursesMsg.style.display = 'none';
                coursesGrid.innerHTML = data.map(course => `
                    <div class="course-card">
                        <div class="course-header">
                            <h4>${course.name}</h4>
                            <span class="course-status ${course.status}">${course.status}</span>
                        </div>
                        <div class="course-details">
                            <p>Início em: ${new Date(course.startDate).toLocaleDateString()}</p>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${course.progress}%;"></div>
                            </div>
                            <p>${course.progress}% completo</p>
                        </div>
                        <div class="course-actions">
                            <button class="btn small">Ver Detalhes</button>
                        </div>
                    </div>
                `).join('');
            }
            break;
        case 'attendance':
            document.getElementById('attendance-total').textContent = data.totalClasses;
            document.getElementById('attendance-present').textContent = data.presentClasses;
            document.getElementById('attendance-rate').textContent = `${data.rate} %`;
            const attendanceList = document.getElementById('attendance-list');
            const noAttendanceMsg = document.getElementById('no-attendance-message');
            if(data.recent.length === 0) {
                noAttendanceMsg.style.display = 'block';
                attendanceList.innerHTML = '';
            } else {
                noAttendanceMsg.style.display = 'none';
                attendanceList.innerHTML = data.recent.map(item => `
                    <div class="attendance-item">
                        <span class="attendance-date">${new Date(item.date).toLocaleDateString()}</span>
                        <span class="attendance-class">${item.className}</span>
                        <span class="attendance-status ${item.status}">${item.status === 'present' ? 'Presente' : 'Ausente'}</span>
                    </div>
                `).join('');
            }
            break;
    }
}