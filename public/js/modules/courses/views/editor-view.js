export class EditorView {
    constructor(container, service) {
        this.container = container;
        this.service = service;
        this.courseId = null;
        this.courseData = {
            graduation: { degrees: [] },
            activityCategories: [],
            lessons: [],
            lessonPlans: [],
            techniques: [],
            metadata: {}
        };
    }

    async render(params) {
        this.courseId = params.id || null;
        
        if (this.courseId) {
            await this.loadCourseData();
        }

        this.container.innerHTML = `
            <div class="module-isolated-courses">
                <div class="module-header-premium">
                    <div class="header-content">
                        <h1>${this.courseId ? 'Edit Course' : 'New Course'}</h1>
                        <nav class="breadcrumb">Home > Courses > ${this.courseId ? 'Edit' : 'New'}</nav>
                    </div>
                    <div class="header-actions">
                        <button id="btn-cancel" class="btn-secondary">Cancel</button>
                        <button id="btn-save" class="btn-primary">
                            <i class="fas fa-save"></i> Save Course
                        </button>
                    </div>
                </div>

                <div class="editor-container">
                    <div class="editor-tabs">
                        <button class="tab-btn active" data-tab="general">General</button>
                        <button class="tab-btn" data-tab="graduation">Graduation</button>
                        <button class="tab-btn" data-tab="categories">Categories</button>
                        <button class="tab-btn" data-tab="syllabus">Syllabus</button>
                        <button class="tab-btn" data-tab="techniques">Techniques</button>
                        <button class="tab-btn" data-tab="lesson-plans">Lesson Plans</button>
                    </div>

                    <div id="tab-general" class="tab-content active">
                        ${this.renderGeneralTab()}
                    </div>
                    <div id="tab-graduation" class="tab-content">
                        ${this.renderGraduationTab()}
                    </div>
                    <div id="tab-categories" class="tab-content">
                        ${this.renderCategoriesTab()}
                    </div>
                    <div id="tab-syllabus" class="tab-content">
                        ${this.renderSyllabusTab()}
                    </div>
                    <div id="tab-techniques" class="tab-content">
                        ${this.renderTechniquesTab()}
                    </div>
                    <div id="tab-lesson-plans" class="tab-content">
                        ${this.renderLessonPlansTab()}
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
    }

    renderGeneralTab() {
        return `
            <div class="form-section">
                <h3>Basic Information</h3>
                <div class="form-grid">
                    <div class="form-group">
                        <label for="course-name">Course Name *</label>
                        <input type="text" id="course-name" class="form-control" value="${this.courseData.name || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="course-level">Level</label>
                        <select id="course-level" class="form-control">
                            <option value="BEGINNER" ${this.courseData.level === 'BEGINNER' ? 'selected' : ''}>Beginner</option>
                            <option value="INTERMEDIATE" ${this.courseData.level === 'INTERMEDIATE' ? 'selected' : ''}>Intermediate</option>
                            <option value="ADVANCED" ${this.courseData.level === 'ADVANCED' ? 'selected' : ''}>Advanced</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="course-duration">Duration (text)</label>
                        <input type="text" id="course-duration" class="form-control" value="${this.courseData.duration || ''}" placeholder="e.g. 6 months">
                    </div>
                    <div class="form-group">
                        <label for="course-total-lessons">Total Lessons</label>
                        <input type="number" id="course-total-lessons" class="form-control" value="${this.courseData.totalLessons || 0}">
                    </div>
                </div>
                <div class="form-group">
                    <label for="course-description">Description</label>
                    <textarea id="course-description" class="form-control" rows="4">${this.courseData.description || ''}</textarea>
                </div>
            </div>
        `;
    }

    renderGraduationTab() {
        const grad = this.courseData.graduation || {};
        return `
            <div class="form-section">
                <h3>Graduation System</h3>
                <div class="form-grid">
                    <div class="form-group">
                        <label>Current Belt</label>
                        <input type="text" id="grad-current-belt" class="form-control" value="${grad.currentBelt || ''}">
                    </div>
                    <div class="form-group">
                        <label>Belt Color</label>
                        <input type="color" id="grad-belt-color" class="form-control" value="${grad.beltColor || '#ffffff'}">
                    </div>
                    <div class="form-group">
                        <label>Next Belt</label>
                        <input type="text" id="grad-next-belt" class="form-control" value="${grad.nextBelt || ''}">
                    </div>
                    <div class="form-group">
                        <label>Next Belt Color</label>
                        <input type="color" id="grad-next-belt-color" class="form-control" value="${grad.nextBeltColor || '#ffffff'}">
                    </div>
                </div>
                
                <div class="degrees-section">
                    <h4>Degrees / Stripes</h4>
                    <div id="degrees-list">
                        <!-- Degrees will be rendered via JS -->
                    </div>
                    <button id="btn-add-degree" class="btn-secondary btn-sm mt-2">+ Add Degree</button>
                </div>
            </div>
        `;
    }

    renderCategoriesTab() {
        return `
            <div class="form-section">
                <h3>Activity Categories</h3>
                <p class="text-muted">Define categories like Postures, Punches, Kicks, etc.</p>
                <div id="categories-list">
                    <!-- Categories rendered via JS -->
                </div>
                <button id="btn-add-category" class="btn-secondary btn-sm mt-2">+ Add Category</button>
            </div>
        `;
    }

    renderSyllabusTab() {
        return `
            <div class="form-section">
                <h3>Syllabus (Lessons)</h3>
                <div id="lessons-list" class="lessons-container">
                    <!-- Lessons rendered via JS -->
                </div>
                <button id="btn-add-lesson" class="btn-secondary btn-sm mt-2">+ Add Lesson</button>
            </div>
        `;
    }

    renderTechniquesTab() {
        return `
            <div class="form-section">
                <h3>Techniques Database</h3>
                <p class="text-muted">Manage techniques available for this course.</p>
                
                <div class="technique-search-container mb-3" style="position: relative;">
                    <div class="input-group">
                        <input type="text" id="tech-search-input" class="form-control" placeholder="Search technique to add...">
                        <button id="btn-search-tech" class="btn-secondary">Search</button>
                    </div>
                    <div id="tech-search-results" class="dropdown-menu" style="display:none; position:absolute; width:100%; z-index:1000; max-height: 200px; overflow-y: auto; background: white; border: 1px solid #ddd; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"></div>
                </div>

                <div id="techniques-list">
                    <!-- Techniques rendered via JS -->
                </div>
            </div>
        `;
    }

    async loadCourseData() {
        try {
            const response = await this.service.getById(this.courseId);
            if (response.success) {
                this.courseData = response.data;
                // Ensure defaults
                if (!this.courseData.graduation) this.courseData.graduation = { degrees: [] };
                if (!this.courseData.activityCategories) this.courseData.activityCategories = [];
                if (!this.courseData.lessons) this.courseData.lessons = [];
                if (!this.courseData.techniques) this.courseData.techniques = [];
                if (!this.courseData.lessonPlans) this.courseData.lessonPlans = [];

                // Load techniques
                try {
                    const techResponse = await this.service.getCourseTechniques(this.courseId);
                    if (techResponse.success) {
                        this.courseData.techniques = techResponse.data.map(ct => ({
                            ...ct.technique,
                            _association: { ...ct }
                        }));
                    }
                } catch (err) {
                    console.warn('Failed to load techniques:', err);
                }

                // Load lesson plans
                try {
                    const plansResponse = await this.service.getLessonPlans(this.courseId);
                    if (plansResponse.success) {
                        this.courseData.lessonPlans = plansResponse.data;
                    }
                } catch (err) {
                    console.warn('Failed to load lesson plans:', err);
                }
            }
        } catch (error) {
            console.error('Error loading course:', error);
            window.coursesModule.navigate('list');
        }
    }

    bindEvents() {
        // Tabs
        this.container.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Save & Cancel
        this.container.querySelector('#btn-cancel')?.addEventListener('click', () => window.coursesModule.navigate('list'));
        this.container.querySelector('#btn-save')?.addEventListener('click', () => this.saveCourse());

        // Dynamic Lists Handlers
        this.bindGraduationEvents();
        this.bindCategoriesEvents();
        this.bindSyllabusEvents();
        this.bindTechniquesEvents();
        this.bindLessonPlansEvents();

        // Initial Render of Dynamic Lists
        this.renderDegreesList();
        this.renderCategoriesList();
        this.renderLessonsList();
        this.renderTechniquesList();
        this.renderLessonPlansList();
    }

    switchTab(tabName) {
        this.container.querySelectorAll('.tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabName));
        this.container.querySelectorAll('.tab-content').forEach(content => content.classList.toggle('active', content.id === `tab-${tabName}`));
    }

    // --- Graduation Logic ---
    bindGraduationEvents() {
        this.container.querySelector('#btn-add-degree')?.addEventListener('click', () => {
            this.courseData.graduation.degrees.push({ name: '', requirements: '' });
            this.renderDegreesList();
        });
    }

    renderDegreesList() {
        const list = this.container.querySelector('#degrees-list');
        if (!list) return;
        
        list.innerHTML = this.courseData.graduation.degrees.map((degree, index) => `
            <div class="degree-item card-premium mb-2">
                <div class="form-grid">
                    <input type="text" class="form-control degree-name" data-index="${index}" value="${degree.name}" placeholder="Degree Name (e.g. 1st Stripe)">
                    <input type="text" class="form-control degree-req" data-index="${index}" value="${degree.requirements || ''}" placeholder="Requirements">
                    <button class="btn-danger btn-sm btn-remove-degree" data-index="${index}">Remove</button>
                </div>
            </div>
        `).join('');

        list.querySelectorAll('.degree-name').forEach(el => el.addEventListener('input', e => this.courseData.graduation.degrees[e.target.dataset.index].name = e.target.value));
        list.querySelectorAll('.degree-req').forEach(el => el.addEventListener('input', e => this.courseData.graduation.degrees[e.target.dataset.index].requirements = e.target.value));
        list.querySelectorAll('.btn-remove-degree').forEach(el => el.addEventListener('click', e => {
            this.courseData.graduation.degrees.splice(e.target.dataset.index, 1);
            this.renderDegreesList();
        }));
    }

    // --- Categories Logic ---
    bindCategoriesEvents() {
        this.container.querySelector('#btn-add-category')?.addEventListener('click', () => {
            this.courseData.activityCategories.push({ name: '', color: '#000000', icon: '' });
            this.renderCategoriesList();
        });
    }

    renderCategoriesList() {
        const list = this.container.querySelector('#categories-list');
        if (!list) return;

        list.innerHTML = this.courseData.activityCategories.map((cat, index) => `
            <div class="category-item card-premium mb-2">
                <div class="form-grid" style="grid-template-columns: 2fr 1fr 1fr auto;">
                    <input type="text" class="form-control cat-name" data-index="${index}" value="${cat.name}" placeholder="Category Name">
                    <input type="color" class="form-control cat-color" data-index="${index}" value="${cat.color || '#000000'}">
                    <input type="text" class="form-control cat-icon" data-index="${index}" value="${cat.icon || ''}" placeholder="Icon (emoji)">
                    <button class="btn-danger btn-sm btn-remove-cat" data-index="${index}">X</button>
                </div>
            </div>
        `).join('');

        list.querySelectorAll('.cat-name').forEach(el => el.addEventListener('input', e => this.courseData.activityCategories[e.target.dataset.index].name = e.target.value));
        list.querySelectorAll('.cat-color').forEach(el => el.addEventListener('input', e => this.courseData.activityCategories[e.target.dataset.index].color = e.target.value));
        list.querySelectorAll('.cat-icon').forEach(el => el.addEventListener('input', e => this.courseData.activityCategories[e.target.dataset.index].icon = e.target.value));
        list.querySelectorAll('.btn-remove-cat').forEach(el => el.addEventListener('click', e => {
            this.courseData.activityCategories.splice(e.target.dataset.index, 1);
            this.renderCategoriesList();
        }));
    }

    // --- Syllabus Logic ---
    bindSyllabusEvents() {
        this.container.querySelector('#btn-add-lesson')?.addEventListener('click', () => {
            const nextNum = this.courseData.lessons.length + 1;
            this.courseData.lessons.push({ lessonNumber: nextNum, name: '', description: '', activities: [] });
            this.renderLessonsList();
        });
    }

    renderLessonsList() {
        const list = this.container.querySelector('#lessons-list');
        if (!list) return;

        list.innerHTML = this.courseData.lessons.map((lesson, index) => `
            <div class="lesson-item card-premium mb-2">
                <div class="lesson-header" style="display:flex; justify-content:space-between; align-items:center; cursor:pointer;" onclick="this.nextElementSibling.classList.toggle('hidden')">
                    <strong>Lesson ${lesson.lessonNumber}: ${lesson.name || '(Untitled)'}</strong>
                    <span></span>
                </div>
                <div class="lesson-body hidden mt-2">
                    <div class="form-group">
                        <label>Name</label>
                        <input type="text" class="form-control lesson-name" data-index="${index}" value="${lesson.name}">
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea class="form-control lesson-desc" data-index="${index}">${lesson.description || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Duration (min)</label>
                        <input type="number" class="form-control lesson-duration" data-index="${index}" value="${lesson.durationMinutes || 60}">
                    </div>
                    <button class="btn-danger btn-sm btn-remove-lesson" data-index="${index}">Remove Lesson</button>
                </div>
            </div>
        `).join('');

        // Bind inputs
        list.querySelectorAll('.lesson-name').forEach(el => el.addEventListener('input', e => this.courseData.lessons[e.target.dataset.index].name = e.target.value));
        list.querySelectorAll('.lesson-desc').forEach(el => el.addEventListener('input', e => this.courseData.lessons[e.target.dataset.index].description = e.target.value));
        list.querySelectorAll('.lesson-duration').forEach(el => el.addEventListener('input', e => this.courseData.lessons[e.target.dataset.index].durationMinutes = parseInt(e.target.value)));
        list.querySelectorAll('.btn-remove-lesson').forEach(el => el.addEventListener('click', e => {
            this.courseData.lessons.splice(e.target.dataset.index, 1);
            this.renderLessonsList();
        }));
    }

    // --- Techniques Logic ---
    bindTechniquesEvents() {
        const searchInput = this.container.querySelector('#tech-search-input');
        const searchBtn = this.container.querySelector('#btn-search-tech');
        const resultsContainer = this.container.querySelector('#tech-search-results');

        let debounceTimer;
        searchInput?.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => this.handleTechniqueSearch(e.target.value), 300);
        });

        searchBtn?.addEventListener('click', () => {
            this.handleTechniqueSearch(searchInput.value);
        });

        // Hide results when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.technique-search-container')) {
                if (resultsContainer) resultsContainer.style.display = 'none';
            }
        });
    }

    async handleTechniqueSearch(query) {
        if (query.length < 2) return;
        const resultsContainer = this.container.querySelector('#tech-search-results');
        if (!resultsContainer) return;
        
        try {
            const response = await this.service.searchTechniques(query);
            if (response.success && response.data) {
                const techniques = response.data.techniques || response.data; // Handle different response formats
                
                if (techniques.length === 0) {
                    resultsContainer.innerHTML = '<div class="dropdown-item p-2">No techniques found</div>';
                } else {
                    resultsContainer.innerHTML = techniques.map(t => `
                        <div class="dropdown-item p-2 tech-result-item" style="cursor:pointer; border-bottom:1px solid #eee;" data-id="${t.id}" data-name="${t.name}" data-difficulty="${t.difficulty || ''}">
                            <strong>${t.name}</strong> <small class="text-muted">(${t.difficulty || 'N/A'})</small>
                        </div>
                    `).join('');
                    
                    resultsContainer.querySelectorAll('.tech-result-item').forEach(item => {
                        item.addEventListener('click', () => {
                            this.addTechnique({
                                id: item.dataset.id,
                                name: item.dataset.name,
                                difficulty: item.dataset.difficulty
                            });
                            resultsContainer.style.display = 'none';
                            this.container.querySelector('#tech-search-input').value = '';
                        });
                    });
                }
                resultsContainer.style.display = 'block';
            }
        } catch (error) {
            console.error('Search error:', error);
        }
    }

    addTechnique(technique) {
        // Check duplicates
        if (this.courseData.techniques.some(t => t.id === technique.id)) return;
        
        this.courseData.techniques.push(technique);
        this.renderTechniquesList();
    }

    renderTechniquesList() {
        const list = this.container.querySelector('#techniques-list');
        if (!list) return;

        list.innerHTML = this.courseData.techniques.map((tech, index) => `
            <div class="technique-item card-premium mb-2">
                <div class="form-grid" style="grid-template-columns: 1fr auto;">
                    <div>
                        <strong>${tech.name}</strong>
                        ${tech.difficulty ? `<span class="badge badge-sm">${tech.difficulty}</span>` : ''}
                    </div>
                    <button class="btn-danger btn-sm btn-remove-tech" data-index="${index}">Remove</button>
                </div>
            </div>
        `).join('');

        list.querySelectorAll('.btn-remove-tech').forEach(el => el.addEventListener('click', e => {
            this.courseData.techniques.splice(e.target.dataset.index, 1);
            this.renderTechniquesList();
        }));
    }

    // --- Lesson Plans Logic ---
    renderLessonPlansTab() {
        return `
            <div class="form-section">
                <h3>Lesson Plans (Weekly Schedule)</h3>
                <p class="text-muted">Define structured lesson plans for each week/class.</p>
                <div id="lesson-plans-list">
                    <!-- Lesson Plans rendered via JS -->
                </div>
                <button id="btn-add-lesson-plan" class="btn-secondary btn-sm mt-2">+ Add Lesson Plan</button>
            </div>
        `;
    }

    bindLessonPlansEvents() {
        this.container.querySelector('#btn-add-lesson-plan')?.addEventListener('click', () => {
            this.courseData.lessonPlans.push({ 
                weekNumber: 1, 
                lessonNumber: 1, 
                title: '', 
                description: '',
                objectives: [] 
            });
            this.renderLessonPlansList();
        });
    }

    renderLessonPlansList() {
        const list = this.container.querySelector('#lesson-plans-list');
        if (!list) return;

        list.innerHTML = this.courseData.lessonPlans.map((plan, index) => `
            <div class="lesson-plan-item card-premium mb-2">
                <div class="form-grid" style="grid-template-columns: 1fr 1fr 3fr auto;">
                    <div class="form-group mb-0">
                        <label class="small text-muted">Week</label>
                        <input type="number" class="form-control plan-week" data-index="${index}" value="${plan.weekNumber || 1}" min="1">
                    </div>
                    <div class="form-group mb-0">
                        <label class="small text-muted">Lesson #</label>
                        <input type="number" class="form-control plan-lesson-num" data-index="${index}" value="${plan.lessonNumber || 1}" min="1">
                    </div>
                    <div class="form-group mb-0">
                        <label class="small text-muted">Title</label>
                        <input type="text" class="form-control plan-title" data-index="${index}" value="${plan.title || ''}" placeholder="e.g. Intro to Stance">
                    </div>
                    <div class="form-group mb-0" style="align-self: end;">
                        <button class="btn-danger btn-sm btn-remove-plan" data-index="${index}">Remove</button>
                    </div>
                </div>
                <div class="mt-2">
                    <input type="text" class="form-control plan-desc" data-index="${index}" value="${plan.description || ''}" placeholder="Description (optional)">
                </div>
            </div>
        `).join('');

        list.querySelectorAll('.plan-week').forEach(el => el.addEventListener('input', e => this.courseData.lessonPlans[e.target.dataset.index].weekNumber = parseInt(e.target.value)));
        list.querySelectorAll('.plan-lesson-num').forEach(el => el.addEventListener('input', e => this.courseData.lessonPlans[e.target.dataset.index].lessonNumber = parseInt(e.target.value)));
        list.querySelectorAll('.plan-title').forEach(el => el.addEventListener('input', e => this.courseData.lessonPlans[e.target.dataset.index].title = e.target.value));
        list.querySelectorAll('.plan-desc').forEach(el => el.addEventListener('input', e => this.courseData.lessonPlans[e.target.dataset.index].description = e.target.value));
        
        list.querySelectorAll('.btn-remove-plan').forEach(el => el.addEventListener('click', e => {
            const plan = this.courseData.lessonPlans[e.target.dataset.index];
            if (plan.id) {
                // Track for deletion if it exists in DB
                if (!this.deletedLessonPlans) this.deletedLessonPlans = [];
                this.deletedLessonPlans.push(plan.id);
            }
            this.courseData.lessonPlans.splice(e.target.dataset.index, 1);
            this.renderLessonPlansList();
        }));
    }

    async saveCourse() {
        // Gather General Data
        this.courseData.name = this.container.querySelector('#course-name').value;
        this.courseData.level = this.container.querySelector('#course-level').value;
        this.courseData.duration = this.container.querySelector('#course-duration').value;
        this.courseData.totalLessons = parseInt(this.container.querySelector('#course-total-lessons').value);
        this.courseData.description = this.container.querySelector('#course-description').value;

        // Gather Graduation Data
        this.courseData.graduation.currentBelt = this.container.querySelector('#grad-current-belt').value;
        this.courseData.graduation.beltColor = this.container.querySelector('#grad-belt-color').value;
        this.courseData.graduation.nextBelt = this.container.querySelector('#grad-next-belt').value;
        this.courseData.graduation.nextBeltColor = this.container.querySelector('#grad-next-belt-color').value;

        try {
            let response;
            let savedId = this.courseId;

            if (this.courseId) {
                response = await this.service.update(this.courseId, this.courseData);
            } else {
                response = await this.service.create(this.courseData);
                if (response.success && response.data && response.data.id) {
                    savedId = response.data.id;
                }
            }

            if (response.success) {
                // Save techniques
                if (this.courseData.techniques && this.courseData.techniques.length > 0) {
                    await this.service.saveCourseTechniques(savedId, this.courseData.techniques);
                }

                // Save Lesson Plans
                if (this.courseData.lessonPlans && this.courseData.lessonPlans.length > 0) {
                    for (const plan of this.courseData.lessonPlans) {
                        const planData = {
                            ...plan,
                            courseId: savedId,
                            // Ensure required fields
                            weekNumber: parseInt(plan.weekNumber) || 1,
                            lessonNumber: parseInt(plan.lessonNumber) || 1,
                            title: plan.title || `Lesson ${plan.lessonNumber}`,
                            duration: 60 // Default duration
                        };
                        
                        try {
                            if (plan.id) {
                                await this.service.updateLessonPlan(plan.id, planData);
                            } else {
                                await this.service.createLessonPlan(planData);
                            }
                        } catch (err) {
                            console.error('Failed to save lesson plan:', err);
                        }
                    }
                }

                // Delete removed lesson plans
                if (this.deletedLessonPlans && this.deletedLessonPlans.length > 0) {
                    for (const id of this.deletedLessonPlans) {
                        try {
                            await this.service.deleteLessonPlan(id);
                        } catch (err) {
                            console.error('Failed to delete lesson plan:', err);
                        }
                    }
                }

                window.coursesModule.navigate('list');
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Error saving course:', error);
            alert(`Failed to save course: ${error.message}`);
        }
    }

    destroy() {
        // Cleanup
    }
}
