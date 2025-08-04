// Course Creator & Universal Course Generator - Extracted from index.html
// =======================================================================

// Global variables
let uploadedFiles = [];
let selectedTemplate = null;

// ==========================================
// UNIVERSAL COURSE CREATOR
// ==========================================

// Open Universal Course Creator (RAG-Enhanced)
function openUniversalCourseCreator() {
    document.getElementById('universalCourseModal').classList.add('active');
    loadTechniqueSelectionArea();
    initializeBeltSystems();
    updateRAGStatus(); // Add RAG status update
}

// Close Universal Course Creator
function closeUniversalCourseModal() {
    document.getElementById('universalCourseModal').classList.remove('active');
    selectedTechniques = [];
    courseModelFile = null;
    updateSelectedTechniquesList();
}

// Update belt options when martial art changes
function updateTechniquesForArt() {
    const martialArt = document.getElementById('martialArt').value;
    const beltSelect = document.getElementById('beltLevel');

    // Clear belt options
    beltSelect.innerHTML = '<option value="">Selecione a faixa/nível</option>';

    if (martialArt && beltSystems[martialArt]) {
        const system = beltSystems[martialArt];
        system.levels.forEach(level => {
            const option = document.createElement('option');
            option.value = level.value;
            option.textContent = level.name;
            option.style.color = level.color === '#FFFFFF' ? '#000000' : level.color;
            beltSelect.appendChild(option);
        });
    }

    // Update techniques based on martial art
    updateTechniqueSelectionStrategy();
}

// Update belt info display
function updateBeltInfo() {
    const martialArt = document.getElementById('martialArt').value;
    const beltLevel = document.getElementById('beltLevel').value;
    const beltInfo = document.getElementById('beltInfo');
    const beltInfoContent = document.getElementById('beltInfoContent');

    if (martialArt && beltLevel && beltSystems[martialArt]) {
        const system = beltSystems[martialArt];
        const level = system.levels.find(l => l.value === beltLevel);

        if (level) {
            beltInfoContent.innerHTML = `
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                    <div style="width: 30px; height: 20px; background: ${level.color}; border: 1px solid #374151; border-radius: 4px;"></div>
                    <div>
                        <div style="font-weight: bold; color: #F8FAFC;">${system.name} - ${level.name}</div>
                        <div style="color: #9CA3AF; font-size: 0.9rem;">Sistema de graduação selecionado</div>
                    </div>
                </div>
            `;
            beltInfo.style.display = 'block';

            // Auto-populate course title
            const titleField = document.getElementById('universalCourseTitle');
            if (!titleField.value) {
                titleField.value = `${system.name} ${level.name} - Curso Completo`;
            }
        } else {
            beltInfo.style.display = 'none';
        }
    } else {
        beltInfo.style.display = 'none';
    }
}

// Load technique selection area
function loadTechniqueSelectionArea() {
    if (allTechniques.length === 0) {
        allTechniques = generateMockTechniques();
    }

    updateTechniqueSelectionStrategy();
}

// Update technique selection based on strategy
function updateTechniqueSelectionStrategy() {
    const strategy = document.querySelector('input[name="selectionStrategy"]:checked')?.value || 'reuse';
    const selectionArea = document.getElementById('techniqueSelectionArea');

    let techniquesToShow = [];

    const martialArt = document.getElementById('martialArt')?.value;
    const beltLevel = document.getElementById('beltLevel')?.value;

    // Filter techniques by martial art if selected
    let availableTechniques = allTechniques;
    if (martialArt) {
        availableTechniques = allTechniques.filter(t => 
            t.martialArt === martialArt || t.martialArt === 'GENERAL'
        );
    }

    switch (strategy) {
        case 'reuse':
            // Show techniques from previous belt level + new ones
            const previousLevelTechniques = availableTechniques.filter(t => t.isPreviousLevel);
            const newTechniques = availableTechniques.filter(t => !t.isPreviousLevel && t.level === 'INTERMEDIATE');
            selectedTechniques = [...previousLevelTechniques];
            techniquesToShow = newTechniques;
            break;

        case 'fresh':
            // Show techniques appropriate for the belt level
            selectedTechniques = [];
            techniquesToShow = availableTechniques.filter(t => {
                if (!beltLevel) return t.level === 'BEGINNER';

                if (beltLevel === 'WHITE' || beltLevel === 'PRACTITIONER_1' || beltLevel === 'BEGINNER' || beltLevel === 'CRUA') {
                    return t.level === 'BEGINNER';
                } else if (beltLevel === 'BLACK' || beltLevel === 'EXPERT_1' || beltLevel === 'PRO' || beltLevel === 'VERMELHO') {
                    return t.level === 'ADVANCED' || t.level === 'EXPERT';
                } else {
                    return t.level === 'INTERMEDIATE';
                }
            });
            break;

        case 'custom':
            // Show all techniques for manual selection
            selectedTechniques = [];
            techniquesToShow = availableTechniques;
            break;
    }

    displayTechniqueSelection(techniquesToShow, strategy);
    updateSelectedTechniquesList();
}

// Display technique selection interface
function displayTechniqueSelection(techniques, strategy) {
    const selectionArea = document.getElementById('techniqueSelectionArea');

    let content = '';

    if (strategy === 'reuse') {
        const previousTechniques = allTechniques.filter(t => t.isPreviousLevel);
        content = `
            <div style="padding: 1rem; background: rgba(16, 185, 129, 0.1); border-bottom: 1px solid #374151;">
                <h4 style="color: #10B981; margin-bottom: 0.5rem;">✅ Técnicas do Nível Anterior (Já Incluídas)</h4>
                <div style="color: #CBD5E1; font-size: 0.9rem;">
                    ${previousTechniques.length > 0 ? previousTechniques.map(t => t.name).join(', ') : 'Nenhuma técnica do nível anterior'}
                </div>
            </div>
            <div style="padding: 1rem;">
                <h4 style="color: #F8FAFC; margin-bottom: 1rem;">📝 Selecione Técnicas Adicionais:</h4>
        `;
    } else {
        content = `
            <div style="padding: 1rem;">
                <h4 style="color: #F8FAFC; margin-bottom: 1rem;">📝 Selecione as Técnicas:</h4>
        `;
    }

    content += techniques.map(tech => `
        <div style="display: flex; align-items: center; gap: 1rem; padding: 0.75rem; border-bottom: 1px solid #374151; hover: background-color: rgba(255,255,255,0.05);">
            <input type="checkbox" id="tech_${tech.id}" value="${tech.id}" onchange="toggleTechniqueSelection('${tech.id}')">
            <label for="tech_${tech.id}" style="flex: 1; cursor: pointer; color: #F8FAFC;">
                <div style="font-weight: bold; margin-bottom: 0.25rem;">${tech.name}</div>
                <div style="font-size: 0.8rem; color: #9CA3AF;">
                    ${getCategoryIcon(tech.category)} ${getCategoryName(tech.category)} • 
                    ${'⭐'.repeat(getLevelStars(tech.level))} ${getLevelName(tech.level)}
                </div>
            </label>
        </div>
    `).join('');

    content += '</div>';
    selectionArea.innerHTML = content;
}

// Toggle technique selection
function toggleTechniqueSelection(techniqueId) {
    const technique = allTechniques.find(t => t.id === techniqueId);
    const checkbox = document.getElementById(`tech_${techniqueId}`);

    if (checkbox.checked) {
        if (!selectedTechniques.find(t => t.id === techniqueId)) {
            selectedTechniques.push(technique);
        }
    } else {
        selectedTechniques = selectedTechniques.filter(t => t.id !== techniqueId);
    }

    updateSelectedTechniquesList();
}

// Update selected techniques list
function updateSelectedTechniquesList() {
    const countElement = document.getElementById('selectedTechniquesCount');
    const listElement = document.getElementById('selectedTechniquesList');

    countElement.textContent = selectedTechniques.length;

    if (selectedTechniques.length === 0) {
        listElement.textContent = 'Nenhuma técnica selecionada ainda';
    } else {
        listElement.innerHTML = selectedTechniques.map(tech => 
            `<span style="background: ${getCategoryColor(tech.category)}; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; margin: 0.25rem; display: inline-block; font-size: 0.8rem;">
                ${getCategoryIcon(tech.category)} ${tech.name}
            </span>`
        ).join('');
    }
}

// Handle Course model upload
function handleCourseModelUpload(event) {
    const file = event.target.files[0];
    if (file) {
        courseModelFile = file;
        document.getElementById('courseModelFileInfo').innerHTML = `
            <div style="text-align: left; padding: 1rem; background: rgba(245, 158, 11, 0.1); border-radius: 8px; border: 1px solid #F59E0B;">
                <div style="color: #F59E0B; font-weight: bold; margin-bottom: 0.5rem;">📎 Arquivo Carregado:</div>
                <div style="color: #F8FAFC;">${getFileIcon(file.name)} ${file.name}</div>
                <div style="color: #9CA3AF; font-size: 0.8rem;">${formatFileSize(file.size)}</div>
            </div>
        `;
        showToast(`Modelo "${file.name}" carregado com sucesso!`, 'success');
    }
}

// Create Universal Course (RAG-Enhanced)
async function createUniversalCourse() {
    const courseData = {
        title: document.getElementById('universalCourseTitle').value,
        duration: parseInt(document.getElementById('universalCourseDuration').value),
        objectives: document.getElementById('universalCourseObjectives').value,
        martialArt: document.getElementById('martialArt').value,
        beltLevel: document.getElementById('beltLevel').value,
        graduation: document.getElementById('courseGraduation').value,
        level: document.getElementById('universalCourseLevel').value,
        lessonsPerWeek: parseInt(document.getElementById('lessonsPerWeekUniversal').value),
        selectedTechniques: selectedTechniques,
        modelFile: courseModelFile,
        generatePlans: document.getElementById('universalGeneratePlans').checked,
        aiModel: document.getElementById('universalAiModel').value,
        selectionStrategy: document.querySelector('input[name="selectionStrategy"]:checked')?.value
    };

    if (!courseData.title || !courseData.martialArt || !courseData.beltLevel || selectedTechniques.length === 0) {
        showToast('Preencha todos os campos obrigatórios e selecione técnicas', 'error');
        return;
    }

    // Show loading state
    const createBtn = document.getElementById('createUniversalBtn');
    const originalText = createBtn.innerHTML;
    createBtn.innerHTML = '<span>⏳</span> Criando Curso...';
    createBtn.disabled = true;

    try {
        // RAG Enhancement: Query knowledge base for course-relevant content
        const ragEnhancement = await queryRAGForCourseCreation(courseData);
        courseData.ragContent = ragEnhancement;

        await simulateUniversalCourseCreation(courseData);

        showToast(`Curso de ${getMartialArtName(courseData.martialArt)} criado com sucesso! ${ragEnhancement.usedSources > 0 ? '🧠 Enriquecido com ' + ragEnhancement.usedSources + ' fontes da base de conhecimento' : ''}`, 'success');
        closeUniversalCourseModal();

        // Refresh course data
        showSection('courses');

    } catch (error) {
        showToast('Erro ao criar curso', 'error');
    } finally {
        // Restore button state
        createBtn.innerHTML = originalText;
        createBtn.disabled = false;
    }
}

// Simulate Universal course creation (RAG-Enhanced)
async function simulateUniversalCourseCreation(courseData) {
    return new Promise((resolve) => {
        setTimeout(() => {
            const enhancedCourse = {
                title: courseData.title,
                duration: courseData.duration,
                totalTechniques: courseData.selectedTechniques.length,
                techniques: courseData.selectedTechniques.map(t => ({
                    name: t.name,
                    category: t.category,
                    level: t.level,
                    isFromWhiteBelt: t.isFromWhiteBelt
                })),
                strategy: courseData.selectionStrategy,
                modelFile: courseData.modelFile?.name,
                generatePlans: courseData.generatePlans,
                totalLessons: courseData.duration * courseData.lessonsPerWeek,
                aiModel: courseData.aiModel,
                courseStructure: generateRAGEnhancedStructure(courseData),
                ragEnhancements: courseData.ragContent
            };

            // If lesson plans should be generated, create RAG-enhanced plans
            if (courseData.generatePlans) {
                enhancedCourse.lessonPlans = generateRAGEnhancedLessonPlans(courseData);
            }

            resolve(enhancedCourse);
        }, 4000); // Simulate 4 second creation
    });
}

// Generate Yellow Belt course structure
function generateYellowBeltStructure(courseData) {
    const totalLessons = courseData.duration * 2;
    const techniquesPerLesson = Math.ceil(courseData.selectedTechniques.length / totalLessons);

    return {
        totalWeeks: courseData.duration,
        totalLessons: totalLessons,
        lessonsPerWeek: 2,
        techniquesDistribution: courseData.selectedTechniques.reduce((acc, tech, index) => {
            const lessonNumber = Math.floor(index / techniquesPerLesson) + 1;
            if (!acc[lessonNumber]) acc[lessonNumber] = [];
            acc[lessonNumber].push(tech.name);
            return acc;
        }, {}),
        prerequisites: {
            requiredCourse: 'Krav Maga Faixa Branca',
            minimumGrade: '70%',
            requiredTechniques: allTechniques.filter(t => t.isFromWhiteBelt).map(t => t.name)
        }
    };
}

// ==========================================
// AI COURSE GENERATOR FUNCTIONALITY
// ==========================================

// Open AI Course Generator Modal
function openAICourseGenerator() {
    document.getElementById('aiCourseGeneratorModal').classList.add('active');
    resetCourseForm();
}

// Close AI Course Generator Modal
function closeAICourseGeneratorModal() {
    document.getElementById('aiCourseGeneratorModal').classList.remove('active');
    resetCourseForm();
}

// Select creation mode
function selectCreationMode(mode) {
    document.getElementById('creationMode').value = mode;

    // Update UI
    document.querySelectorAll('.creation-mode-card').forEach(card => {
        card.style.borderColor = '#374151';
        card.style.background = '';
    });

    const selectedCard = event.target.closest('.creation-mode-card');
    selectedCard.style.borderColor = '#3B82F6';
    selectedCard.style.background = 'rgba(59, 130, 246, 0.1)';

    // Show/hide document section
    const documentSection = document.getElementById('documentSection');
    if (mode === 'document') {
        documentSection.style.display = 'block';
    } else {
        documentSection.style.display = 'none';
    }
}

// Load template
function loadTemplate(templateType) {
    selectedTemplate = templateType;

    // Update template buttons
    document.querySelectorAll('.template-btn').forEach(btn => {
        btn.style.background = btn.style.background.replace('0.2', '0.1');
    });
    event.target.style.background = event.target.style.background.replace('0.1', '0.3');

    // Load template data
    const templates = {
        'krav-maga-basic': {
            title: 'Krav Maga Faixa Branca - Defesa Pessoal 1',
            level: 'INICIANTE',
            category: 'ADULT',
            duration: 24,
            objectives: 'Desenvolver habilidades fundamentais de defesa pessoal, melhorar condicionamento físico, ensinar consciência situacional'
        },
        'self-defense': {
            title: 'Defesa Pessoal para Mulheres',
            level: 'INICIANTE',
            category: 'ADULT',
            duration: 12,
            objectives: 'Ensinar técnicas básicas de defesa, desenvolver confiança, promover segurança pessoal'
        },
        'instructor': {
            title: 'Formação de Instrutores Krav Maga',
            level: 'INSTRUTOR',
            category: 'ADULT',
            duration: 36,
            objectives: 'Formar instrutores qualificados, ensinar metodologia de ensino, desenvolver habilidades de liderança'
        }
    };

    const template = templates[templateType];
    if (template) {
        document.getElementById('courseTitle').value = template.title;
        document.getElementById('courseLevel').value = template.level;
        document.getElementById('courseCategory').value = template.category;
        document.getElementById('courseDuration').value = template.duration;
        document.getElementById('courseObjectives').value = template.objectives;
    }

    showToast(`Template "${templateType}" carregado com sucesso!`, 'success');
}

// Handle file upload
function handleFileUpload(event) {
    const files = Array.from(event.target.files);
    uploadedFiles = [...uploadedFiles, ...files];

    displayUploadedFiles();
    showToast(`${files.length} arquivo(s) carregado(s)`, 'success');
}

// Display uploaded files
function displayUploadedFiles() {
    const container = document.getElementById('uploadedFiles');

    if (uploadedFiles.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = `
        <div style="text-align: left; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #374151;">
            <h4 style="color: #F8FAFC; margin-bottom: 0.5rem;">📎 Arquivos Carregados:</h4>
            ${uploadedFiles.map((file, index) => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: rgba(59, 130, 246, 0.1); border-radius: 6px; margin-bottom: 0.5rem;">
                    <span style="color: #CBD5E1;">
                        ${getFileIcon(file.name)} ${file.name} 
                        <small style="color: #9CA3AF;">(${formatFileSize(file.size)})</small>
                    </span>
                    <button onclick="removeFile(${index})" style="background: #EF4444; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 4px; cursor: pointer;">
                        ✕
                    </button>
                </div>
            `).join('')}
        </div>
    `;
}

// Remove file
function removeFile(index) {
    uploadedFiles.splice(index, 1);
    displayUploadedFiles();
    showToast('Arquivo removido', 'info');
}

// Get file icon
function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
        'pdf': '📄',
        'doc': '📝',
        'docx': '📝',
        'txt': '📄',
        'md': '📋'
    };
    return icons[ext] || '📁';
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Generate course with AI
async function generateCourseWithAI() {
    const formData = collectCourseFormData();

    if (!validateCourseForm(formData)) {
        return;
    }

    // Show loading state
    const generateBtn = document.getElementById('generateCourseBtn');
    const originalText = generateBtn.innerHTML;
    generateBtn.innerHTML = '<span>⏳</span> Gerando Curso...';
    generateBtn.disabled = true;

    try {
        // Simulate AI course generation
        await simulateAICourseGeneration(formData);

        showToast('Curso gerado com sucesso! Criando planos de aula...', 'success');

        if (formData.generateLessonPlans) {
            await simulateLessonPlansGeneration(formData);
            showToast('Planos de aula gerados com sucesso!', 'success');
        }

        closeAICourseGeneratorModal();
        // Refresh course data
        loadAllLessonPlans();

    } catch (error) {
        showToast('Erro ao gerar curso', 'error');
    } finally {
        // Restore button state
        generateBtn.innerHTML = originalText;
        generateBtn.disabled = false;
    }
}

// Collect form data
function collectCourseFormData() {
    return {
        mode: document.getElementById('creationMode').value,
        title: document.getElementById('courseTitle').value,
        duration: document.getElementById('courseDuration').value,
        level: document.getElementById('courseLevel').value,
        category: document.getElementById('courseCategory').value,
        lessonsPerWeek: document.getElementById('lessonsPerWeek').value,
        objectives: document.getElementById('courseObjectives').value,
        additionalContext: document.getElementById('additionalContext').value,
        generateLessonPlans: document.getElementById('generateLessonPlans').checked,
        includeEvaluations: document.getElementById('includeEvaluations').checked,
        aiModel: document.getElementById('aiModel').value,
        adaptations: Array.from(document.querySelectorAll('input[name="adaptations"]:checked')).map(cb => cb.value),
        uploadedFiles: uploadedFiles,
        selectedTemplate: selectedTemplate
    };
}

// Validate form
function validateCourseForm(formData) {
    if (!formData.mode) {
        showToast('Selecione um modo de criação', 'error');
        return false;
    }

    if (!formData.title || !formData.level || !formData.category) {
        showToast('Preencha todos os campos obrigatórios', 'error');
        return false;
    }

    if (formData.mode === 'document' && uploadedFiles.length === 0 && !selectedTemplate) {
        showToast('Carregue documentos ou selecione um template', 'error');
        return false;
    }

    return true;
}

// Simulate AI course generation
async function simulateAICourseGeneration(formData) {
    return new Promise((resolve) => {
        setTimeout(() => {
            const generatedCourse = {
                title: formData.title,
                structure: generateCourseStructure(formData),
                curriculum: generateCourseCurriculum(formData),
                objectives: formData.objectives.split(',').map(obj => obj.trim()),
                totalLessons: formData.duration * formData.lessonsPerWeek,
                weeks: formData.duration,
                level: formData.level,
                category: formData.category,
                adaptations: formData.adaptations,
                evaluationSystem: formData.includeEvaluations ? generateEvaluationSystem(formData) : null,
                generatedWith: {
                    model: formData.aiModel,
                    mode: formData.mode,
                    documentsUsed: uploadedFiles.map(f => f.name),
                    template: selectedTemplate
                }
            };
            resolve();
        }, 3000); // Simulate 3 second generation
    });
}

// Generate course structure
function generateCourseStructure(formData) {
    const totalLessons = formData.duration * formData.lessonsPerWeek;
    const unitsCount = Math.ceil(totalLessons / 10);

    return {
        totalWeeks: formData.duration,
        lessonsPerWeek: formData.lessonsPerWeek,
        totalLessons: totalLessons,
        units: Array.from({length: unitsCount}, (_, i) => ({
            number: i + 1,
            name: generateUnitName(i, formData.level),
            lessonsStart: i * 10 + 1,
            lessonsEnd: Math.min((i + 1) * 10, totalLessons),
            focus: generateUnitFocus(i, formData.level)
        }))
    };
}

// Generate unit names based on level
function generateUnitName(unitIndex, level) {
    const unitNames = {
        'INICIANTE': ['Fundamentos', 'Técnicas Básicas', 'Defesas Simples', 'Aplicação Prática'],
        'INTERMEDIARIO': ['Revisão Avançada', 'Técnicas Complexas', 'Defesas Múltiplas', 'Cenários Reais'],
        'AVANCADO': ['Refinamento Técnico', 'Combos Avançados', 'Defesas Extremas', 'Instrução'],
        'INSTRUTOR': ['Metodologia', 'Pedagogia', 'Demonstração', 'Avaliação']
    };

    return unitNames[level]?.[unitIndex] || `Unidade ${unitIndex + 1}`;
}

// Generate unit focus
function generateUnitFocus(unitIndex, level) {
    const focuses = {
        'INICIANTE': ['Coordenação e postura', 'Técnicas fundamentais', 'Reações básicas', 'Confiança'],
        'INTERMEDIARIO': ['Precisão técnica', 'Combinações', 'Adaptabilidade', 'Condicionamento'],
        'AVANCADO': ['Perfeição técnica', 'Criatividade', 'Liderança', 'Especialização'],
        'INSTRUTOR': ['Ensino efetivo', 'Comunicação', 'Correção técnica', 'Desenvolvimento de alunos']
    };

    return focuses[level]?.[unitIndex] || 'Desenvolvimento geral';
}

// Generate course curriculum
function generateCourseCurriculum(formData) {
    return {
        principles: generateCoursePrinciples(formData.level),
        techniques: generateCourseTechniques(formData.level),
        progressionSystem: generateProgressionSystem(formData.level),
        equipmentNeeded: generateEquipmentList(formData.level)
    };
}

// Generate evaluation system
function generateEvaluationSystem(formData) {
    return {
        evaluationMethods: ['Técnica individual', 'Cenários práticos', 'Exame teórico', 'Avaliação contínua'],
        gradingCriteria: ['Precisão técnica', 'Aplicação prática', 'Conhecimento teórico', 'Progressão'],
        examSchedule: generateExamSchedule(formData.duration),
        certificationRequirements: ['75% frequência mínima', 'Aprovação em todas avaliações', 'Demonstração prática']
    };
}

// Simulate lesson plans generation
async function simulateLessonPlansGeneration(formData) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, 2000);
    });
}

// Reset form
function resetCourseForm() {
    document.getElementById('creationMode').value = '';
    document.querySelectorAll('.creation-mode-card').forEach(card => {
        card.style.borderColor = '#374151';
        card.style.background = '';
    });
    document.getElementById('documentSection').style.display = 'none';
    uploadedFiles = [];
    selectedTemplate = null;
    displayUploadedFiles();
}

// Helper functions for curriculum generation
function generateCoursePrinciples(level) {
    const principles = {
        'INICIANTE': ['Segurança primeiro', 'Simplicidade', 'Efetividade', 'Progressão gradual'],
        'INTERMEDIARIO': ['Adaptabilidade', 'Fluência técnica', 'Tomada de decisão', 'Condicionamento'],
        'AVANCADO': ['Maestria técnica', 'Criatividade', 'Liderança', 'Inovação'],
        'INSTRUTOR': ['Pedagogia efetiva', 'Comunicação clara', 'Desenvolvimento de outros', 'Responsabilidade']
    };
    return principles[level] || principles['INICIANTE'];
}

function generateCourseTechniques(level) {
    const techniques = {
        'INICIANTE': ['Postura básica', 'Golpes fundamentais', 'Defesas simples', 'Movimentação'],
        'INTERMEDIARIO': ['Combinações', 'Defesas múltiplas', 'Contra-ataques', 'Cenários variados'],
        'AVANCADO': ['Técnicas complexas', 'Improvisação', 'Ensino', 'Especialização'],
        'INSTRUTOR': ['Demonstração perfeita', 'Correção técnica', 'Adaptação metodológica', 'Avaliação']
    };
    return techniques[level] || techniques['INICIANTE'];
}

function generateProgressionSystem(level) {
    return {
        assessmentFrequency: level === 'INSTRUTOR' ? 'Semanal' : 'Quinzenal',
        practiceHours: level === 'INICIANTE' ? '2-3 horas/semana' : '4-6 horas/semana',
        masteryLevel: level === 'INICIANTE' ? '70%' : '85%'
    };
}

function generateEquipmentList(level) {
    const equipment = {
        'INICIANTE': ['Tatame', 'Roupas confortáveis'],
        'INTERMEDIARIO': ['Tatame', 'Luvas', 'Protetores'],
        'AVANCADO': ['Tatame completo', 'Equipamentos variados', 'Material de treino'],
        'INSTRUTOR': ['Todo equipamento', 'Material didático', 'Recursos audiovisuais']
    };
    return equipment[level] || equipment['INICIANTE'];
}

function generateExamSchedule(duration) {
    const exams = [];
    for (let week = 6; week <= duration; week += 6) {
        exams.push(`Semana ${week}: Avaliação de Unidade`);
    }
    exams.push(`Semana ${duration}: Exame Final`);
    return exams;
}

// Export functions to global scope
window.openUniversalCourseCreator = openUniversalCourseCreator;
window.closeUniversalCourseModal = closeUniversalCourseModal;
window.updateTechniquesForArt = updateTechniquesForArt;
window.updateBeltInfo = updateBeltInfo;
window.loadTechniqueSelectionArea = loadTechniqueSelectionArea;
window.updateTechniqueSelectionStrategy = updateTechniqueSelectionStrategy;
window.displayTechniqueSelection = displayTechniqueSelection;
window.toggleTechniqueSelection = toggleTechniqueSelection;
window.updateSelectedTechniquesList = updateSelectedTechniquesList;
window.handleCourseModelUpload = handleCourseModelUpload;
window.createUniversalCourse = createUniversalCourse;
window.simulateUniversalCourseCreation = simulateUniversalCourseCreation;
window.generateYellowBeltStructure = generateYellowBeltStructure;
window.openAICourseGenerator = openAICourseGenerator;
window.closeAICourseGeneratorModal = closeAICourseGeneratorModal;
window.selectCreationMode = selectCreationMode;
window.loadTemplate = loadTemplate;
window.handleFileUpload = handleFileUpload;
window.displayUploadedFiles = displayUploadedFiles;
window.removeFile = removeFile;
window.getFileIcon = getFileIcon;
window.formatFileSize = formatFileSize;
window.generateCourseWithAI = generateCourseWithAI;
window.collectCourseFormData = collectCourseFormData;
window.validateCourseForm = validateCourseForm;
window.simulateAICourseGeneration = simulateAICourseGeneration;
window.generateCourseStructure = generateCourseStructure;
window.resetCourseForm = resetCourseForm;

// Global access to variables
window.uploadedFiles = uploadedFiles;
window.selectedTemplate = selectedTemplate;