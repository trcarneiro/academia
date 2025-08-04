// Knowledge Base & Techniques Manager - Extracted from index.html
// ===========================================================

// Global variables
let allTechniques = [];
let selectedTechniques = [];
let courseModelFile = null;
let beltSystems = {};
let auditResults = [];
let pendingTechniques = [];

// ==========================================
// TECHNIQUES MANAGER FUNCTIONALITY
// ==========================================

// Open Techniques Manager Modal
function openTechniquesManager() {
    document.getElementById('techniquesManagerModal').classList.add('active');
    loadTechniquesDatabase();
}

// Close Techniques Manager Modal
function closeTechniquesManagerModal() {
    document.getElementById('techniquesManagerModal').classList.remove('active');
}

// Load techniques database
async function loadTechniquesDatabase() {
    try {
        // Generate mock techniques based on existing course data
        allTechniques = generateMockTechniques();
        displayTechniquesTable(allTechniques);
        updateTechniquesStats();
    } catch (error) {
        showToast('Erro ao carregar banco de técnicas', 'error');
    }
}

// Generate mock techniques database with audit status
function generateMockTechniques() {
    const techniques = [
        // Krav Maga - Beginner (Practitioner 1)
        { id: '1', name: 'Guarda de Boxe', category: 'STANCE', level: 'BEGINNER', martialArt: 'KRAV_MAGA', usedIn: ['Practitioner 1'], prerequisites: '', isPreviousLevel: false, status: 'APPROVED', videoUrl: null, auditScore: 98 },
        { id: '2', name: 'Jab (Soco Direto)', category: 'STRIKE', level: 'BEGINNER', martialArt: 'KRAV_MAGA', usedIn: ['Practitioner 1'], prerequisites: 'Guarda de Boxe', isPreviousLevel: false, status: 'APPROVED', videoUrl: null, auditScore: 95 },
        { id: '3', name: 'Cross (Soco Cruzado)', category: 'STRIKE', level: 'BEGINNER', martialArt: 'KRAV_MAGA', usedIn: ['Practitioner 1'], prerequisites: 'Guarda de Boxe, Jab', isPreviousLevel: false },
        { id: '4', name: 'Hook (Gancho)', category: 'STRIKE', level: 'BEGINNER', martialArt: 'KRAV_MAGA', usedIn: ['Practitioner 1'], prerequisites: 'Jab, Cross', isPreviousLevel: false },
        { id: '5', name: 'Uppercut', category: 'STRIKE', level: 'BEGINNER', martialArt: 'KRAV_MAGA', usedIn: ['Practitioner 1'], prerequisites: 'Hook', isPreviousLevel: false },
        { id: '6', name: 'Defesa 360° Interior', category: 'DEFENSE', level: 'BEGINNER', usedIn: ['Faixa Branca'], prerequisites: 'Guarda de Boxe', isFromWhiteBelt: true },
        { id: '7', name: 'Defesa 360° Exterior', category: 'DEFENSE', level: 'BEGINNER', usedIn: ['Faixa Branca'], prerequisites: 'Defesa 360° Interior', isFromWhiteBelt: true },
        { id: '8', name: 'Joelhada Frontal', category: 'STRIKE', level: 'BEGINNER', usedIn: ['Faixa Branca'], prerequisites: 'Guarda de Boxe', isFromWhiteBelt: true },
        { id: '9', name: 'Chute Frontal', category: 'STRIKE', level: 'BEGINNER', usedIn: ['Faixa Branca'], prerequisites: 'Joelhada Frontal', isFromWhiteBelt: true },
        { id: '10', name: 'Esquiva Lateral', category: 'MOVEMENT', level: 'BEGINNER', usedIn: ['Faixa Branca'], prerequisites: 'Movimentação Básica', isFromWhiteBelt: true },

        // Jiu-Jitsu techniques
        { id: '23', name: 'Closed Guard', category: 'GRAPPLING', level: 'BEGINNER', martialArt: 'JIU_JITSU', usedIn: ['White Belt'], prerequisites: '', isPreviousLevel: false },
        { id: '24', name: 'Armbar from Guard', category: 'GRAPPLING', level: 'INTERMEDIATE', martialArt: 'JIU_JITSU', usedIn: ['Blue Belt'], prerequisites: 'Closed Guard', isPreviousLevel: false },
        { id: '25', name: 'Triangle Choke', category: 'GRAPPLING', level: 'INTERMEDIATE', martialArt: 'JIU_JITSU', usedIn: ['Blue Belt'], prerequisites: 'Closed Guard', isPreviousLevel: false },

        // Boxing techniques
        { id: '26', name: 'Orthodox Stance', category: 'STANCE', level: 'BEGINNER', martialArt: 'BOXING', usedIn: ['Beginner'], prerequisites: '', isPreviousLevel: false },
        { id: '27', name: 'Slip and Counter', category: 'COMBO', level: 'INTERMEDIATE', martialArt: 'BOXING', usedIn: ['Amateur'], prerequisites: 'Orthodox Stance, Jab', isPreviousLevel: false },

        // Muay Thai techniques
        { id: '28', name: 'Fighting Stance', category: 'STANCE', level: 'BEGINNER', martialArt: 'MUAY_THAI', usedIn: ['White Prajioud'], prerequisites: '', isPreviousLevel: false },
        { id: '29', name: 'Roundhouse Kick', category: 'STRIKE', level: 'INTERMEDIATE', martialArt: 'MUAY_THAI', usedIn: ['Yellow Prajioud'], prerequisites: 'Fighting Stance', isPreviousLevel: false },

        // General techniques (work for all martial arts)
        { id: '30', name: 'Basic Conditioning', category: 'CONDITIONING', level: 'BEGINNER', martialArt: 'GENERAL', usedIn: ['All Levels'], prerequisites: '', isPreviousLevel: false },
        { id: '31', name: 'Situational Awareness', category: 'SCENARIO', level: 'BEGINNER', martialArt: 'GENERAL', usedIn: ['All Levels'], prerequisites: '', isPreviousLevel: false },

        // Krav Maga - Intermediate
        { id: '11', name: 'Defesa 360° Superior', category: 'DEFENSE', level: 'INTERMEDIATE', martialArt: 'KRAV_MAGA', usedIn: [], prerequisites: 'Defesa 360° Interior, Defesa 360° Exterior', isPreviousLevel: false },
        { id: '12', name: 'Combo Jab-Cross-Hook', category: 'COMBO', level: 'INTERMEDIATE', martialArt: 'KRAV_MAGA', usedIn: [], prerequisites: 'Jab, Cross, Hook', isPreviousLevel: false },
        { id: '13', name: 'Defesa contra Agarramento de Ombros', category: 'DEFENSE', level: 'INTERMEDIATE', martialArt: 'KRAV_MAGA', usedIn: [], prerequisites: 'Defesa 360°', isPreviousLevel: false },
        { id: '14', name: 'Cotovelo Horizontal', category: 'STRIKE', level: 'INTERMEDIATE', usedIn: [], prerequisites: 'Joelhada Frontal', isFromWhiteBelt: false },
        { id: '15', name: 'Chute Lateral', category: 'STRIKE', level: 'INTERMEDIATE', usedIn: [], prerequisites: 'Chute Frontal', isFromWhiteBelt: false },
        { id: '16', name: 'Defesa contra Estrangulamento Lateral', category: 'DEFENSE', level: 'INTERMEDIATE', usedIn: [], prerequisites: 'Defesa contra Estrangulamento Frontal', isFromWhiteBelt: false },
        { id: '17', name: 'Liberação de Pegada no Punho', category: 'DEFENSE', level: 'INTERMEDIATE', usedIn: [], prerequisites: 'Movimentação Básica', isFromWhiteBelt: false },
        { id: '18', name: 'Defesa contra Empurrão', category: 'DEFENSE', level: 'INTERMEDIATE', usedIn: [], prerequisites: 'Esquiva Lateral', isFromWhiteBelt: false },
        { id: '19', name: 'Joelhada Diagonal', category: 'STRIKE', level: 'INTERMEDIATE', usedIn: [], prerequisites: 'Joelhada Frontal', isFromWhiteBelt: false },
        { id: '20', name: 'Combo Defesa-Contra-Ataque', category: 'COMBO', level: 'INTERMEDIATE', usedIn: [], prerequisites: 'Defesa 360°, Jab-Cross', isFromWhiteBelt: false },

        // Avançadas para futuras faixas
        { id: '21', name: 'Defesa contra Múltiplos Atacantes', category: 'SCENARIO', level: 'ADVANCED', martialArt: 'KRAV_MAGA', usedIn: [], prerequisites: 'Combo Defesa-Contra-Ataque', isPreviousLevel: false },
        { id: '22', name: 'Finalização e Fuga', category: 'SCENARIO', level: 'ADVANCED', martialArt: 'KRAV_MAGA', usedIn: [], prerequisites: 'Defesa contra Múltiplos Atacantes', isPreviousLevel: false }
    ];

    return techniques.map(tech => ({
        ...tech,
        description: generateTechniqueDescription(tech),
        instructions: generateTechniqueInstructions(tech),
        keyPoints: generateTechniqueKeyPoints(tech),
        equipment: generateTechniqueEquipment(tech.category),
        duration: getTechniqueDuration(tech.level),
        // Audit fields
        status: tech.status || 'PENDING',
        auditScore: tech.auditScore || null,
        duplicateOf: null,
        qualityIssues: [],
        videoUrl: tech.videoUrl || null,
        createdAt: new Date().toISOString(),
        lastAuditAt: tech.status === 'APPROVED' ? new Date().toISOString() : null
    }));
}

// Display techniques table
function displayTechniquesTable(techniques) {
    const tbody = document.getElementById('techniquesTableBody');

    if (techniques.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="padding: 2rem; text-align: center;">
                    <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">🔍</div>
                    Nenhuma técnica encontrada
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = techniques.map(tech => `
        <tr style="border-bottom: 1px solid #374151;">
            <td style="padding: 1rem;">
                <div style="font-weight: bold; color: #F8FAFC; margin-bottom: 0.25rem;">${tech.name}</div>
                <div style="font-size: 0.8rem; color: #9CA3AF;">${tech.description}</div>
            </td>
            <td style="padding: 1rem;">
                <span style="background: ${getCategoryColor(tech.category)}; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem;">
                    ${getCategoryIcon(tech.category)} ${getCategoryName(tech.category)}
                </span>
            </td>
            <td style="padding: 1rem;">
                <div style="color: ${getLevelColor(tech.level)};">
                    ${'⭐'.repeat(getLevelStars(tech.level))} ${getLevelName(tech.level)}
                </div>
            </td>
            <td style="padding: 1rem;">
                <div style="color: #CBD5E1;">
                    ${tech.usedIn.length > 0 ? tech.usedIn.join(', ') : 'Não usado'}
                </div>
            </td>
            <td style="padding: 1rem;">
                <div style="color: #9CA3AF; font-size: 0.8rem;">
                    ${tech.prerequisites || 'Nenhum'}
                </div>
            </td>
            <td style="padding: 1rem; text-align: center;">
                <div style="display: flex; gap: 0.5rem; justify-content: center;">
                    <button onclick="viewTechniqueDetails('${tech.id}')" style="background: #3B82F6; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 4px; cursor: pointer;">
                        👁️
                    </button>
                    <button onclick="editTechnique('${tech.id}')" style="background: #F59E0B; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 4px; cursor: pointer;">
                        ✏️
                    </button>
                    <button onclick="deleteTechnique('${tech.id}')" style="background: #EF4444; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 4px; cursor: pointer;">
                        🗑️
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Update techniques stats
function updateTechniquesStats() {
    document.getElementById('totalTechniquesCount').textContent = allTechniques.length;
    document.getElementById('categoriesCount').textContent = new Set(allTechniques.map(t => t.category)).size;
    document.getElementById('coursesUsingCount').textContent = new Set(allTechniques.flatMap(t => t.usedIn)).size;
    document.getElementById('reusedCount').textContent = allTechniques.filter(t => t.usedIn.length > 0).length;
}

// Helper functions for technique display
function getCategoryColor(category) {
    const colors = {
        'STANCE': '#3B82F6',
        'STRIKE': '#EF4444', 
        'DEFENSE': '#10B981',
        'GRAPPLING': '#8B5CF6',
        'COMBO': '#F59E0B',
        'MOVEMENT': '#06B6D4',
        'SCENARIO': '#EC4899',
        'CONDITIONING': '#84CC16'
    };
    return colors[category] || '#6B7280';
}

function getCategoryIcon(category) {
    const icons = {
        'STANCE': '🥋',
        'STRIKE': '👊',
        'DEFENSE': '🛡️',
        'GRAPPLING': '🤼',
        'COMBO': '⚡',
        'MOVEMENT': '🏃',
        'SCENARIO': '🎭',
        'CONDITIONING': '💪'
    };
    return icons[category] || '🥊';
}

function getCategoryName(category) {
    const names = {
        'STANCE': 'Postura',
        'STRIKE': 'Golpe',
        'DEFENSE': 'Defesa',
        'GRAPPLING': 'Agarramento',
        'COMBO': 'Combinação',
        'MOVEMENT': 'Movimento',
        'SCENARIO': 'Cenário',
        'CONDITIONING': 'Condicionamento'
    };
    return names[category] || category;
}

function getLevelColor(level) {
    const colors = {
        'BEGINNER': '#10B981',
        'INTERMEDIATE': '#F59E0B',
        'ADVANCED': '#EF4444',
        'EXPERT': '#8B5CF6'
    };
    return colors[level] || '#6B7280';
}

function getLevelStars(level) {
    const stars = {
        'BEGINNER': 1,
        'INTERMEDIATE': 2,
        'ADVANCED': 3,
        'EXPERT': 4
    };
    return stars[level] || 1;
}

function getLevelName(level) {
    const names = {
        'BEGINNER': 'Iniciante',
        'INTERMEDIATE': 'Intermediário',
        'ADVANCED': 'Avançado',
        'EXPERT': 'Expert'
    };
    return names[level] || level;
}

// Generate technique details
function generateTechniqueDescription(tech) {
    const descriptions = {
        'STANCE': 'Posição fundamental para execução de técnicas',
        'STRIKE': 'Técnica de ataque direcionada para neutralizar ameaças',
        'DEFENSE': 'Movimento defensivo para proteção contra ataques',
        'GRAPPLING': 'Técnica de combate próximo e controle corporal',
        'COMBO': 'Sequência combinada de movimentos técnicos',
        'MOVEMENT': 'Padrão de movimentação e posicionamento',
        'SCENARIO': 'Aplicação prática em situações realísticas',
        'CONDITIONING': 'Exercício para desenvolvimento físico específico'
    };
    return descriptions[tech.category] || 'Técnica de Krav Maga';
}

function generateTechniqueInstructions(tech) {
    return `1. Posição inicial: ${tech.prerequisites ? 'A partir de ' + tech.prerequisites : 'Postura neutra'}\n2. Execução da técnica ${tech.name}\n3. Finalização em posição segura\n4. Retorno à guarda`;
}

function generateTechniqueKeyPoints(tech) {
    return `Manter postura correta, aplicar força adequada, precisão na execução, fluidez do movimento`;
}

function generateTechniqueEquipment(category) {
    const equipment = {
        'STANCE': 'Tatame',
        'STRIKE': 'Tatame, Pads de foco',
        'DEFENSE': 'Tatame, Equipamento de proteção',
        'GRAPPLING': 'Tatame, Proteções',
        'COMBO': 'Tatame, Pads, Luvas',
        'MOVEMENT': 'Tatame, Espaço amplo',
        'SCENARIO': 'Tatame, Equipamentos variados',
        'CONDITIONING': 'Tatame, Equipamentos de treino'
    };
    return equipment[category] || 'Tatame';
}

function getTechniqueDuration(level) {
    const durations = {
        'BEGINNER': 10,
        'INTERMEDIATE': 15,
        'ADVANCED': 20,
        'EXPERT': 25
    };
    return durations[level] || 10;
}

// Technique actions
function viewTechniqueDetails(techniqueId) {
    const technique = allTechniques.find(t => t.id === techniqueId);
    if (technique) {
        showToast(`Visualizando: ${technique.name}`, 'info');
    }
}

function editTechnique(techniqueId) {
    const technique = allTechniques.find(t => t.id === techniqueId);
    if (technique) {
        showToast(`Editando: ${technique.name}`, 'info');
    }
}

function deleteTechnique(techniqueId) {
    const technique = allTechniques.find(t => t.id === techniqueId);
    if (technique && confirm(`Deseja excluir a técnica "${technique.name}"?`)) {
        allTechniques = allTechniques.filter(t => t.id !== techniqueId);
        displayTechniquesTable(allTechniques);
        updateTechniquesStats();
        showToast(`Técnica "${technique.name}" excluída`, 'success');
    }
}

// Add new technique
function openAddTechniqueModal() {
    document.getElementById('addTechniqueModal').classList.add('active');
}

function closeAddTechniqueModal() {
    document.getElementById('addTechniqueModal').classList.remove('active');
    document.getElementById('addTechniqueForm').reset();
}

function saveTechnique() {
    const formData = {
        id: Date.now().toString(),
        name: document.getElementById('techniqueName').value,
        category: document.getElementById('techniqueCategory').value,
        level: document.getElementById('techniqueLevel').value,
        description: document.getElementById('techniqueDescription').value,
        instructions: document.getElementById('techniqueInstructions').value,
        prerequisites: document.getElementById('techniquePrerequisites').value,
        keyPoints: document.getElementById('techniqueKeyPoints').value,
        equipment: document.getElementById('techniqueEquipment').value,
        duration: parseInt(document.getElementById('techniqueDuration').value),
        usedIn: [],
        isFromWhiteBelt: false
    };

    if (!formData.name || !formData.category || !formData.level) {
        showToast('Preencha todos os campos obrigatórios', 'error');
        return;
    }

    allTechniques.push(formData);
    displayTechniquesTable(allTechniques);
    updateTechniquesStats();
    closeAddTechniqueModal();
    showToast(`Técnica "${formData.name}" adicionada com sucesso!`, 'success');
}

// Search and filter techniques
function filterTechniques() {
    const searchTerm = document.getElementById('techniqueSearch')?.value.toLowerCase() || '';
    const selectedCategory = document.getElementById('categoryFilter')?.value || '';

    let filteredTechniques = allTechniques.filter(tech => {
        const matchesSearch = tech.name.toLowerCase().includes(searchTerm) || 
                            tech.description.toLowerCase().includes(searchTerm);
        const matchesCategory = !selectedCategory || tech.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    displayTechniquesTable(filteredTechniques);
}

// Initialize belt systems for different martial arts
function initializeBeltSystems() {
    beltSystems = {
        'KRAV_MAGA': {
            name: 'Krav Maga',
            levels: [
                { value: 'PRACTITIONER_1', name: 'Practitioner 1', color: '#FFFFFF' },
                { value: 'PRACTITIONER_2', name: 'Practitioner 2', color: '#FFD700' },
                { value: 'PRACTITIONER_3', name: 'Practitioner 3', color: '#FFA500' },
                { value: 'GRADUATE_1', name: 'Graduate 1', color: '#32CD32' },
                { value: 'GRADUATE_2', name: 'Graduate 2', color: '#0000FF' },
                { value: 'EXPERT_1', name: 'Expert 1', color: '#8B4513' },
                { value: 'EXPERT_2', name: 'Expert 2', color: '#000000' }
            ]
        },
        'JIU_JITSU': {
            name: 'Jiu-Jitsu',
            levels: [
                { value: 'WHITE', name: 'Faixa Branca', color: '#FFFFFF' },
                { value: 'BLUE', name: 'Faixa Azul', color: '#0000FF' },
                { value: 'PURPLE', name: 'Faixa Roxa', color: '#800080' },
                { value: 'BROWN', name: 'Faixa Marrom', color: '#8B4513' },
                { value: 'BLACK', name: 'Faixa Preta', color: '#000000' }
            ]
        },
        'BOXING': {
            name: 'Boxe',
            levels: [
                { value: 'BEGINNER', name: 'Iniciante', color: '#FFFFFF' },
                { value: 'AMATEUR', name: 'Amador', color: '#C0C0C0' },
                { value: 'SEMI_PRO', name: 'Semi-Profissional', color: '#FFD700' },
                { value: 'PROFESSIONAL', name: 'Profissional', color: '#000000' }
            ]
        },
        'MUAY_THAI': {
            name: 'Muay Thai',
            levels: [
                { value: 'WHITE', name: 'Prajioud Branco', color: '#FFFFFF' },
                { value: 'YELLOW', name: 'Prajioud Amarelo', color: '#FFD700' },
                { value: 'GREEN', name: 'Prajioud Verde', color: '#008000' },
                { value: 'BLUE', name: 'Prajioud Azul', color: '#0000FF' },
                { value: 'RED', name: 'Prajioud Vermelho', color: '#FF0000' },
                { value: 'BLACK', name: 'Prajioud Preto', color: '#000000' }
            ]
        },
        'KARATE': {
            name: 'Karatê',
            levels: [
                { value: 'WHITE', name: 'Faixa Branca', color: '#FFFFFF' },
                { value: 'YELLOW', name: 'Faixa Amarela', color: '#FFD700' },
                { value: 'ORANGE', name: 'Faixa Laranja', color: '#FFA500' },
                { value: 'GREEN', name: 'Faixa Verde', color: '#008000' },
                { value: 'BLUE', name: 'Faixa Azul', color: '#0000FF' },
                { value: 'BROWN', name: 'Faixa Marrom', color: '#8B4513' },
                { value: 'BLACK', name: 'Faixa Preta', color: '#000000' }
            ]
        },
        'TAEKWONDO': {
            name: 'Taekwondo',
            levels: [
                { value: 'WHITE', name: 'Faixa Branca', color: '#FFFFFF' },
                { value: 'YELLOW', name: 'Faixa Amarela', color: '#FFD700' },
                { value: 'GREEN', name: 'Faixa Verde', color: '#008000' },
                { value: 'BLUE', name: 'Faixa Azul', color: '#0000FF' },
                { value: 'RED', name: 'Faixa Vermelha', color: '#FF0000' },
                { value: 'BLACK', name: 'Faixa Preta', color: '#000000' }
            ]
        },
        'MMA': {
            name: 'MMA',
            levels: [
                { value: 'BEGINNER', name: 'Iniciante', color: '#FFFFFF' },
                { value: 'INTERMEDIATE', name: 'Intermediário', color: '#FFD700' },
                { value: 'ADVANCED', name: 'Avançado', color: '#FFA500' },
                { value: 'PRO', name: 'Profissional', color: '#000000' }
            ]
        },
        'CAPOEIRA': {
            name: 'Capoeira',
            levels: [
                { value: 'CRUA', name: 'Cordão Cru', color: '#F5F5DC' },
                { value: 'AMARELO', name: 'Cordão Amarelo', color: '#FFD700' },
                { value: 'LARANJA', name: 'Cordão Laranja', color: '#FFA500' },
                { value: 'AZUL', name: 'Cordão Azul', color: '#0000FF' },
                { value: 'VERDE', name: 'Cordão Verde', color: '#008000' },
                { value: 'ROXO', name: 'Cordão Roxo', color: '#800080' },
                { value: 'MARROM', name: 'Cordão Marrom', color: '#8B4513' },
                { value: 'VERMELHO', name: 'Cordão Vermelho', color: '#FF0000' }
            ]
        }
    };
}

// Get martial art name
function getMartialArtName(artCode) {
    return beltSystems[artCode]?.name || artCode;
}

// Export functions to global scope
window.openTechniquesManager = openTechniquesManager;
window.closeTechniquesManagerModal = closeTechniquesManagerModal;
window.loadTechniquesDatabase = loadTechniquesDatabase;
window.generateMockTechniques = generateMockTechniques;
window.displayTechniquesTable = displayTechniquesTable;
window.updateTechniquesStats = updateTechniquesStats;
window.getCategoryColor = getCategoryColor;
window.getCategoryIcon = getCategoryIcon;
window.getCategoryName = getCategoryName;
window.getLevelColor = getLevelColor;
window.getLevelStars = getLevelStars;
window.getLevelName = getLevelName;
window.viewTechniqueDetails = viewTechniqueDetails;
window.editTechnique = editTechnique;
window.deleteTechnique = deleteTechnique;
window.openAddTechniqueModal = openAddTechniqueModal;
window.closeAddTechniqueModal = closeAddTechniqueModal;
window.saveTechnique = saveTechnique;
window.filterTechniques = filterTechniques;
window.initializeBeltSystems = initializeBeltSystems;
window.getMartialArtName = getMartialArtName;

// Global access to variables
window.allTechniques = allTechniques;
window.selectedTechniques = selectedTechniques;
window.beltSystems = beltSystems;