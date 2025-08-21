// ==============================================
// STUDENTS MODULE - VERSÃO ULTRA SIMPLES
// ==============================================

console.log('🚀 Students Ultra Simple carregando...');

// Dados dos alunos
let studentsData = [];
let isInitialized = false;

// Função ultra simples para carregar e exibir alunos
async function loadAndShowStudents() {
    console.log('👥 Carregando alunos de forma simples...');
    
    try {
        // 1. Buscar dados da API (modo mais simples)
        const response = await fetch('/api/students');
        const result = await response.json();
        
        console.log('✅ Dados recebidos:', result);
        
        if (!result.success || !result.data) {
            throw new Error('Dados inválidos da API');
        }
        
        const students = result.data;
        console.log('👥 Alunos encontrados:', students.length);
        
        // 2. Encontrar onde colocar os dados
        let container = document.querySelector('#studentsTableBody') || 
                       document.querySelector('tbody') ||
                       document.querySelector('.table-container') ||
                       document.querySelector('#studentsContainer');
        
        if (!container) {
            console.log('🏗️ Criando tabela simples de alunos...');
            container = createSimpleStudentsTable();
        }
        
        // 3. Mostrar os dados
        displayStudentsSimple(students, container);
        
        // 4. Atualizar estatísticas
        updateStudentsStatsSimple(students);
        
        console.log('✅ Alunos exibidos com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro:', error);
        showStudentsError('Erro ao carregar alunos: ' + error.message);
    }
}

// Criar tabela simples se não existir
function createSimpleStudentsTable() {
    console.log('🔨 Criando tabela simples de alunos...');
    
    // Encontrar onde inserir
    let target = document.querySelector('#app') || 
                 document.querySelector('.spa-content') || 
                 document.querySelector('main') || 
                 document.body;
    
    // Limpar conteúdo se for o body
    if (target === document.body) {
        target.innerHTML = '';
    }
    
    // Criar HTML simples
    target.innerHTML = `
        <div style="max-width: 1200px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <h1>👥 Gestão de Alunos</h1>
            
            <!-- Barra de busca -->
            <div style="margin: 20px 0; display: flex; gap: 10px; align-items: center;">
                <input type="text" id="studentsSearch" placeholder="Buscar alunos..." 
                       onkeyup="filterStudents()" 
                       style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                <button onclick="createNewStudent()" style="background: #007cba; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">
                    ➕ Novo Aluno
                </button>
            </div>
            
            <!-- Estatísticas -->
            <div id="studentsStatsContainer" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center;">
                    <div id="totalStudents" style="font-size: 32px; font-weight: bold;">0</div>
                    <div>Total de Alunos</div>
                </div>
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center;">
                    <div id="activeStudents" style="font-size: 32px; font-weight: bold;">0</div>
                    <div>Alunos Ativos</div>
                </div>
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center;">
                    <div id="newThisMonth" style="font-size: 32px; font-weight: bold;">0</div>
                    <div>Novos este Mês</div>
                </div>
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center;">
                    <div id="totalRevenue" style="font-size: 32px; font-weight: bold;">R$ 0</div>
                    <div>Receita Total</div>
                </div>
            </div>
            
            <!-- Tabela -->
            <div style="background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;">
                <table id="studentsTable" style="width: 100%; border-collapse: collapse;">
                    <thead style="background: #f8f9fa;">
                        <tr>
                            <th style="padding: 15px; text-align: left; border-bottom: 1px solid #ddd;">Avatar</th>
                            <th style="padding: 15px; text-align: left; border-bottom: 1px solid #ddd;">Nome</th>
                            <th style="padding: 15px; text-align: left; border-bottom: 1px solid #ddd;">Email</th>
                            <th style="padding: 15px; text-align: left; border-bottom: 1px solid #ddd;">Telefone</th>
                            <th style="padding: 15px; text-align: left; border-bottom: 1px solid #ddd;">Plano</th>
                            <th style="padding: 15px; text-align: left; border-bottom: 1px solid #ddd;">Status</th>
                            <th style="padding: 15px; text-align: left; border-bottom: 1px solid #ddd;">Criado em</th>
                            <th style="padding: 15px; text-align: left; border-bottom: 1px solid #ddd;">Ações</th>
                        </tr>
                    </thead>
                    <tbody id="studentsTableBody">
                        <tr>
                            <td colspan="8" style="padding: 40px; text-align: center; color: #666;">
                                Carregando alunos...
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div id="studentsErrorContainer" style="display: none; background: #f8d7da; color: #721c24; padding: 20px; border-radius: 8px; margin-top: 20px;">
                <div id="studentsErrorMessage"></div>
                <button onclick="loadAndShowStudents()" style="background: #dc3545; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-top: 10px;">
                    Tentar Novamente
                </button>
            </div>
        </div>
    `;
    
    return document.getElementById('studentsTableBody');
}

// Exibir alunos de forma simples
function displayStudentsSimple(students, container) {
    console.log('🎨 Exibindo', students.length, 'alunos...');
    
    if (students.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="8" style="padding: 40px; text-align: center; color: #666;">
                    👥 Nenhum aluno encontrado
                </td>
            </tr>
        `;
        return;
    }
    
    const rows = students.map(student => `
        <tr style="border-bottom: 1px solid #eee;" onclick="editStudent('${student.id}')" title="Clique para editar">
            <td style="padding: 15px;">
                <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
                    ${getStudentInitials(student)}
                </div>
            </td>
            <td style="padding: 15px; font-weight: 600;">${getStudentName(student)}</td>
            <td style="padding: 15px; color: #666;">${student.user?.email || student.email || 'Sem email'}</td>
            <td style="padding: 15px; color: #666;">${student.user?.phone || student.phone || 'Sem telefone'}</td>
            <td style="padding: 15px;">
                <span style="background: #e9ecef; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                    ${student.plan?.name || 'Sem plano'}
                </span>
            </td>
            <td style="padding: 15px;">
                <span style="background: ${getStatusColor(student.status)}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                    ${getStatusText(student.status)}
                </span>
            </td>
            <td style="padding: 15px; color: #666; font-size: 14px;">
                ${formatDate(student.createdAt)}
            </td>
            <td style="padding: 15px;">
                <button onclick="event.stopPropagation(); editStudent('${student.id}')" style="background: none; border: none; cursor: pointer; font-size: 16px; margin: 0 5px;" title="Editar">
                    ✏️
                </button>
                <button onclick="event.stopPropagation(); toggleStudentStatus('${student.id}')" style="background: none; border: none; cursor: pointer; font-size: 16px; margin: 0 5px;" title="Ativar/Desativar">
                    ${student.status === 'active' ? '⏸️' : '▶️'}
                </button>
                <button onclick="event.stopPropagation(); deleteStudent('${student.id}')" style="background: none; border: none; cursor: pointer; font-size: 16px; margin: 0 5px;" title="Excluir">
                    🗑️
                </button>
            </td>
        </tr>
    `).join('');
    
    container.innerHTML = rows;
}

// Atualizar estatísticas de forma simples
function updateStudentsStatsSimple(students) {
    console.log('📊 Atualizando estatísticas de alunos...');
    
    const totalStudents = students.length;
    const activeStudents = students.filter(s => s.status === 'active').length;
    const thisMonth = new Date();
    const newThisMonth = students.filter(s => {
        if (!s.createdAt) return false;
        const created = new Date(s.createdAt);
        return created.getMonth() === thisMonth.getMonth() && 
               created.getFullYear() === thisMonth.getFullYear();
    }).length;
    
    // Calcular receita total (estimativa baseada nos planos)
    const totalRevenue = students
        .filter(s => s.status === 'active' && s.plan?.price)
        .reduce((sum, s) => sum + (s.plan.price || 0), 0);
    
    // Atualizar elementos
    updateStudentElement('totalStudents', totalStudents);
    updateStudentElement('activeStudents', activeStudents);
    updateStudentElement('newThisMonth', newThisMonth);
    updateStudentElement('totalRevenue', 'R$ ' + formatPrice(totalRevenue));
}

// Funções auxiliares simples
function updateStudentElement(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function formatPrice(price) {
    if (!price) return '0,00';
    return parseFloat(price).toFixed(2).replace('.', ',');
}

function formatDate(dateString) {
    if (!dateString) return 'Não informado';
    try {
        return new Date(dateString).toLocaleDateString('pt-BR');
    } catch (error) {
        return 'Data inválida';
    }
}

function getStudentName(student) {
    if (student.user) {
        return `${student.user.firstName || ''} ${student.user.lastName || ''}`.trim() || 'Sem nome';
    }
    return student.name || student.fullName || 'Sem nome';
}

function getStudentInitials(student) {
    const name = getStudentName(student);
    const parts = name.split(' ');
    if (parts.length >= 2) {
        return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase();
}

function getStatusColor(status) {
    const colors = {
        'active': '#28a745',
        'inactive': '#dc3545',
        'suspended': '#ffc107',
        'pending': '#17a2b8'
    };
    return colors[status] || '#6c757d';
}

function getStatusText(status) {
    const texts = {
        'active': '✅ Ativo',
        'inactive': '❌ Inativo',
        'suspended': '⏸️ Suspenso',
        'pending': '⏳ Pendente'
    };
    return texts[status] || '❓ Indefinido';
}

function showStudentsError(message) {
    const errorContainer = document.getElementById('studentsErrorContainer');
    const errorMessage = document.getElementById('studentsErrorMessage');
    if (errorContainer) errorContainer.style.display = 'block';
    if (errorMessage) errorMessage.textContent = message;
}

// Funções de ação (placeholder)
function createNewStudent() {
    console.log('➕ Criando novo aluno...');
    alert('Funcionalidade em desenvolvimento: Criar novo aluno');
}

function editStudent(studentId) {
    console.log('✏️ Editando aluno:', studentId);
    alert(`Funcionalidade em desenvolvimento: Editar aluno ${studentId}`);
}

function toggleStudentStatus(studentId) {
    console.log('🔄 Toggle status do aluno:', studentId);
    const student = studentsData.find(s => s.id === studentId);
    if (student) {
        student.status = student.status === 'active' ? 'inactive' : 'active';
        displayStudentsSimple(studentsData, document.getElementById('studentsTableBody'));
        updateStudentsStatsSimple(studentsData);
        console.log('✅ Status do aluno alterado');
    }
}

function deleteStudent(studentId) {
    console.log('🗑️ Excluindo aluno:', studentId);
    if (confirm('Tem certeza que deseja excluir este aluno?')) {
        studentsData = studentsData.filter(s => s.id !== studentId);
        displayStudentsSimple(studentsData, document.getElementById('studentsTableBody'));
        updateStudentsStatsSimple(studentsData);
        console.log('✅ Aluno excluído');
    }
}

function filterStudents() {
    const searchTerm = document.getElementById('studentsSearch')?.value.toLowerCase() || '';
    console.log('🔍 Filtrando alunos por:', searchTerm);
    
    const filteredStudents = studentsData.filter(student => {
        const name = getStudentName(student).toLowerCase();
        const email = (student.user?.email || student.email || '').toLowerCase();
        return name.includes(searchTerm) || email.includes(searchTerm);
    });
    
    displayStudentsSimple(filteredStudents, document.getElementById('studentsTableBody'));
}

// Expor funções globalmente
window.loadAndShowStudents = loadAndShowStudents;
window.createNewStudent = createNewStudent;
window.editStudent = editStudent;
window.toggleStudentStatus = toggleStudentStatus;
window.deleteStudent = deleteStudent;
window.filterStudents = filterStudents;

// Expor módulo
window.StudentsModule = {
    init: loadAndShowStudents,
    loadData: loadAndShowStudents,
    isInitialized: () => isInitialized,
    getData: () => studentsData
};

// Auto-inicializar de forma simples
console.log('⏰ Aguardando DOM...');
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(loadAndShowStudents, 100);
        studentsData = []; // Garantir que os dados sejam armazenados
    });
} else {
    setTimeout(() => {
        loadAndShowStudents();
        studentsData = [];
    }, 100);
}

console.log('✅ Students Ultra Simple carregado!');
