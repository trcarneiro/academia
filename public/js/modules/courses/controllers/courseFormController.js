// Course Form Controller - Handles form logic and API integration

let moduleAPI = null;

async function initializeCourseForm() {
    // Initialize API helper
    moduleAPI = window.createModuleAPI('Courses');
    
    // Load course data if editing
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get("id");
    
    if (courseId) {
        document.getElementById("formTitle").textContent = "Editar Curso";
        document.getElementById("breadcrumbCurrent").textContent = "Editar";
        await loadCourseData(courseId);
    }
    
    setupFormEventListeners();
    setupTabNavigation();
}

function setupTabNavigation() {
    const tabButtons = document.querySelectorAll(".tab-btn");
    const tabPanes = document.querySelectorAll(".tab-pane");

    tabButtons.forEach(button => {
        button.addEventListener("click", () => {
            const targetTab = button.dataset.tab;
            
            // Remove active class from all buttons and panes
            tabButtons.forEach(btn => btn.classList.remove("active"));
            tabPanes.forEach(pane => pane.classList.remove("active"));
            
            // Add active class to clicked button and corresponding pane
            button.classList.add("active");
            document.getElementById(`${targetTab}-tab`).classList.add("active");
        });
    });
}

async function loadCourseData(courseId) {
    try {
        await moduleAPI.fetchWithStates(`/api/courses/${courseId}`, {
            loadingElement: document.getElementById("loadingState"),
            onSuccess: (data) => populateForm(data),
            onError: (error) => window.app.handleError(error, "Carregando curso")
        });
    } catch (error) {
        window.app.handleError(error, "Carregando curso");
    }
}

function populateForm(course) {
    document.getElementById("courseId").value = course.courseId || "";
    document.getElementById("courseName").value = course.name || "";
    document.getElementById("courseDescription").value = course.description || "";
    document.getElementById("durationTotalWeeks").value = course.durationTotalWeeks || "";
    document.getElementById("totalLessons").value = course.totalLessons || "";
    document.getElementById("lessonDurationMinutes").value = course.lessonDurationMinutes || "";
    document.getElementById("difficulty").value = course.difficulty || "";
    
    // Populate dynamic lists
    populateDynamicList("objectivesList", course.objectives || []);
    populateDynamicList("equipmentList", course.equipment || []);
    
    if (course.warmup) {
        document.getElementById("warmupDescription").value = course.warmup.description || "";
        document.getElementById("warmupDuration").value = course.warmup.duration || "";
        document.getElementById("warmupType").value = course.warmup.type || "";
    }
    
    populateTechniquesList(course.techniques || []);
    populateSimulationsList(course.simulations || []);
    populateScheduleList(course.schedule?.lessonsPerWeek || []);
    
    if (course.physicalPreparation) {
        document.getElementById("physicalPrepDescription").value = course.physicalPreparation.description || "";
        populateExercisesList(course.physicalPreparation.exercises || []);
    }
    
    populateSupportResourcesList(course.supportResources || []);
    populateDynamicList("generalNotesList", course.generalNotes || []);
    
    if (course.gamification) {
        document.getElementById("gamificationDescription").value = course.gamification.description || "";
        populateRewardsList(course.gamification.rewards || []);
    }
    
    if (course.finalEvent) {
        document.getElementById("finalEventDescription").value = course.finalEvent.description || "";
        document.getElementById("finalEventDuration").value = course.finalEvent.duration || "";
        document.getElementById("finalEventType").value = course.finalEvent.type || "";
        document.getElementById("finalEventDate").value = course.finalEvent.date || "";
    }
}

function populateDynamicList(containerId, items) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";
    items.forEach(item => addListItem(containerId, item));
}

function populateTechniquesList(techniques) {
    const container = document.getElementById("techniquesList");
    container.innerHTML = "";
    techniques.forEach(technique => addTechniqueItem(technique));
}

function populateSimulationsList(simulations) {
    const container = document.getElementById("simulationsList");
    container.innerHTML = "";
    simulations.forEach(simulation => addSimulationItem(simulation));
}

function populateScheduleList(weeks) {
    const container = document.getElementById("scheduleList");
    container.innerHTML = "";
    weeks.forEach(week => addWeekItem(week));
}

function populateExercisesList(exercises) {
    const container = document.getElementById("exercisesList");
    container.innerHTML = "";
    exercises.forEach(exercise => addExerciseItem(exercise));
}

function populateSupportResourcesList(resources) {
    const container = document.getElementById("supportResourcesList");
    container.innerHTML = "";
    resources.forEach(resource => addSupportResourceItem(resource));
}

function populateRewardsList(rewards) {
    const container = document.getElementById("rewardsList");
    container.innerHTML = "";
    rewards.forEach(reward => addRewardItem(reward));
}

function setupFormEventListeners() {
    document.getElementById("saveCourseBtn").addEventListener("click", saveCourse);
    document.getElementById("courseForm").addEventListener("submit", (e) => {
        e.preventDefault();
        saveCourse();
    });
    
    // Import from JSON
    document.getElementById("importFromJsonBtn").addEventListener("click", () => {
        document.getElementById("importJsonFile").click();
    });
    
    document.getElementById("importJsonFile").addEventListener("change", handleJsonImport);
}

async function handleJsonImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
        const text = await file.text();
        const courseData = JSON.parse(text);
        populateForm(courseData);
        window.app.dispatchEvent("course:imported", { courseData });
    } catch (error) {
        window.app.handleError(error, "Importando JSON do curso");
    }
}

async function saveCourse() {
    const formData = collectFormData();
    
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const courseId = urlParams.get("id");
        const endpoint = courseId ? `/api/courses/${courseId}` : "/api/courses";
        const method = courseId ? "PUT" : "POST";
        
        await moduleAPI.fetchWithStates(endpoint, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
            loadingElement: document.getElementById("loadingState"),
            onSuccess: () => {
                window.app.dispatchEvent("course:saved", { courseId: courseId || "new" });
                window.location.href = "/courses"; // Navigate back to courses list
            },
            onError: (error) => {
                document.getElementById("errorMessage").textContent = error.message;
                document.getElementById("errorState").style.display = "block";
            }
        });
    } catch (error) {
        window.app.handleError(error, "Salvando curso");
    }
}

function collectFormData() {
    return {
        courseId: document.getElementById("courseId").value,
        name: document.getElementById("courseName").value,
        description: document.getElementById("courseDescription").value,
        durationTotalWeeks: parseInt(document.getElementById("durationTotalWeeks").value) || null,
        totalLessons: parseInt(document.getElementById("totalLessons").value) || null,
        lessonDurationMinutes: parseInt(document.getElementById("lessonDurationMinutes").value) || null,
        difficulty: document.getElementById("difficulty").value,
        objectives: collectListItems("objectivesList"),
        equipment: collectListItems("equipmentList"),
        warmup: {
            description: document.getElementById("warmupDescription").value,
            duration: parseInt(document.getElementById("warmupDuration").value) || null,
            type: document.getElementById("warmupType").value
        },
        techniques: collectTechniques(),
        simulations: collectSimulations(),
        schedule: {
            weeks: parseInt(document.getElementById("durationTotalWeeks").value) || null,
            lessonsPerWeek: collectSchedule()
        },
        physicalPreparation: {
            description: document.getElementById("physicalPrepDescription").value,
            exercises: collectExercises()
        },
        supportResources: collectSupportResources(),
        generalNotes: collectListItems("generalNotesList"),
        gamification: {
            description: document.getElementById("gamificationDescription").value,
            rewards: collectRewards()
        },
        finalEvent: {
            description: document.getElementById("finalEventDescription").value,
            duration: parseInt(document.getElementById("finalEventDuration").value) || null,
            type: document.getElementById("finalEventType").value,
            date: document.getElementById("finalEventDate").value
        }
    };
}

function collectListItems(containerId) {
    const container = document.getElementById(containerId);
    const inputs = container.querySelectorAll("input[type=\"text\"]");
    return Array.from(inputs).map(input => input.value).filter(value => value.trim() !== "");
}

function collectTechniques() {
    const container = document.getElementById("techniquesList");
    const items = container.querySelectorAll(".technique-item");
    return Array.from(items).map(item => ({
        id: item.querySelector("[name=\"techniqueId\"]").value,
        name: item.querySelector("[name=\"techniqueName\"]").value
    }));
}

function collectSimulations() {
    const container = document.getElementById("simulationsList");
    const items = container.querySelectorAll(".simulation-item");
    return Array.from(items).map(item => ({
        description: item.querySelector("[name=\"simulationDescription\"]").value,
        type: item.querySelector("[name=\"simulationType\"]").value
    }));
}

function collectSchedule() {
    const container = document.getElementById("scheduleList");
    const items = container.querySelectorAll(".week-item");
    return Array.from(items).map(item => ({
        week: parseInt(item.querySelector("[name=\"weekNumber\"]").value) || null,
        lessons: parseInt(item.querySelector("[name=\"lessonsCount\"]").value) || null,
        focus: JSON.parse(item.querySelector("[name=\"weekFocus\"]").value || "[]")
    }));
}

function collectExercises() {
    const container = document.getElementById("exercisesList");
    const items = container.querySelectorAll(".exercise-item");
    return Array.from(items).map(item => ({
        name: item.querySelector("[name=\"exerciseName\"]").value,
        duration: item.querySelector("[name=\"exerciseDuration\"]").value,
        repetitions: parseInt(item.querySelector("[name=\"exerciseRepetitions\"]").value) || null,
        type: item.querySelector("[name=\"exerciseType\"]").value
    }));
}

function collectSupportResources() {
    const container = document.getElementById("supportResourcesList");
    const items = container.querySelectorAll(".resource-item");
    return Array.from(items).map(item => ({
        type: item.querySelector("[name=\"resourceType\"]").value,
        description: item.querySelector("[name=\"resourceDescription\"]").value,
        url: item.querySelector("[name=\"resourceUrl\"]").value
    }));
}

function collectRewards() {
    const container = document.getElementById("rewardsList");
    const items = container.querySelectorAll(".reward-item");
    return Array.from(items).map(item => ({
        name: item.querySelector("[name=\"rewardName\"]").value,
        criteria: item.querySelector("[name=\"rewardCriteria\"]").value,
        points: parseInt(item.querySelector("[name=\"rewardPoints\"]").value) || null
    }));
}

// Dynamic list management functions
function addObjective() { addListItem("objectivesList", ""); }
function addEquipment() { addListItem("equipmentList", ""); }
function addGeneralNote() { addListItem("generalNotesList", ""); }

function addTechnique(technique = {}) {
    const container = document.getElementById("techniquesList");
    const itemDiv = document.createElement("div");
    itemDiv.className = "list-item technique-item";
    
    itemDiv.innerHTML = `
        <input type="text" name="techniqueId" placeholder="ID da Técnica" value="${technique.id || ""}">
        <input type="text" name="techniqueName" placeholder="Nome da Técnica" value="${technique.name || ""}">
        <button type="button" class="btn btn-remove" onclick="this.parentElement.remove()"></button>
    `;
    
    container.appendChild(itemDiv);
}

function addSimulation(simulation = {}) {
    const container = document.getElementById("simulationsList");
    const itemDiv = document.createElement("div");
    itemDiv.className = "list-item simulation-item";
    
    itemDiv.innerHTML = `
        <input type="text" name="simulationDescription" placeholder="Descrição da Simulação" value="${simulation.description || ""}">
        <input type="text" name="simulationType" placeholder="Tipo (ex: CHALLENGE)" value="${simulation.type || ""}">
        <button type="button" class="btn btn-remove" onclick="this.parentElement.remove()"></button>
    `;
    
    container.appendChild(itemDiv);
}

function addWeek(week = {}) {
    const container = document.getElementById("scheduleList");
    const itemDiv = document.createElement("div");
    itemDiv.className = "list-item week-item";
    
    itemDiv.innerHTML = `
        <input type="number" name="weekNumber" placeholder="Número da Semana" value="${week.week || ""}">
        <input type="number" name="lessonsCount" placeholder="Número de Aulas" value="${week.lessons || ""}">
        <textarea name="weekFocus" placeholder="Foco da Semana (JSON)" rows="2">${JSON.stringify(week.focus || [])}</textarea>
        <button type="button" class="btn btn-remove" onclick="this.parentElement.remove()"></button>
    `;
    
    container.appendChild(itemDiv);
}

function addExercise(exercise = {}) {
    const container = document.getElementById("exercisesList");
    const itemDiv = document.createElement("div");
    itemDiv.className = "list-item exercise-item";
    
    itemDiv.innerHTML = `
        <input type="text" name="exerciseName" placeholder="Nome do Exercício" value="${exercise.name || ""}">
        <input type="text" name="exerciseDuration" placeholder="Duração" value="${exercise.duration || ""}">
        <input type="number" name="exerciseRepetitions" placeholder="Repetições" value="${exercise.repetitions || ""}">
        <input type="text" name="exerciseType" placeholder="Tipo (ex: EXERCISE)" value="${exercise.type || ""}">
        <button type="button" class="btn btn-remove" onclick="this.parentElement.remove()"></button>
    `;
    
    container.appendChild(itemDiv);
}

function addSupportResource(resource = {}) {
    const container = document.getElementById("supportResourcesList");
    const itemDiv = document.createElement("div");
    itemDiv.className = "list-item resource-item";
    
    itemDiv.innerHTML = `
        <input type="text" name="resourceType" placeholder="Tipo (ex: Vídeo)" value="${resource.type || ""}">
        <input type="text" name="resourceDescription" placeholder="Descrição" value="${resource.description || ""}">
        <input type="url" name="resourceUrl" placeholder="URL" value="${resource.url || ""}">
        <button type="button" class="btn btn-remove" onclick="this.parentElement.remove()"></button>
    `;
    
    container.appendChild(itemDiv);
}

function addReward(reward = {}) {
    const container = document.getElementById("rewardsList");
    const itemDiv = document.createElement("div");
    itemDiv.className = "list-item reward-item";
    
    itemDiv.innerHTML = `
        <input type="text" name="rewardName" placeholder="Nome da Recompensa" value="${reward.name || ""}">
        <input type="text" name="rewardCriteria" placeholder="Critérios" value="${reward.criteria || ""}">
        <input type="number" name="rewardPoints" placeholder="Pontos" value="${reward.points || ""}">
        <button type="button" class="btn btn-remove" onclick="this.parentElement.remove()"></button>
    `;
    
    container.appendChild(itemDiv);
}

function addListItem(containerId, value) {
    const container = document.getElementById(containerId);
    const itemDiv = document.createElement("div");
    itemDiv.className = "list-item";
    
    const input = document.createElement("input");
    input.type = "text";
    input.value = value;
    input.placeholder = "Descreva...";
    
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "btn btn-remove";
    removeBtn.textContent = "";
    removeBtn.onclick = () => itemDiv.remove();
    
    itemDiv.appendChild(input);
    itemDiv.appendChild(removeBtn);
    container.appendChild(itemDiv);
}

function retrySave() {
    document.getElementById("errorState").style.display = "none";
    saveCourse();
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", initializeCourseForm);
