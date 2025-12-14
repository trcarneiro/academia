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

        this.container.innerHTML = 
            <div class="module-isolated-courses">
                <div class="module-header-premium">
                    <div class="header-content">
                        <h1></h1>
                        <nav class="breadcrumb">Home > Courses > </nav>
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
                        
                    </div>
                    <div id="tab-graduation" class="tab-content">
                        
                    </div>
                    <div id="tab-categories" class="tab-content">
                        
                    </div>
                    <div id="tab-syllabus" class="tab-content">
                        
                    </div>
                    <div id="tab-techniques" class="tab-content">
                        
                    </div>
                    <div id="tab-lesson-plans" class="tab-content">
                        
                    </div>
                </div>
            </div>
        ;

        this.bindEvents();
    }

    renderGeneralTab() {
        return 
            <div class="form-section">
                <h3>Basic Information</h3>
                <div class="form-grid">
                    <div class="form-group">
                        <label for="course-name">Course Name *</label>
                        <input type="text" id="course-name" class="form-control" value="" required>
                    </div>
                    <div class="form-group">
                        <label for="course-level">Level</label>
                        <select id="course-level" class="form-control">
                            <option value="BEGINNER" >Beginner</option>
                            <option value="INTERMEDIATE" >Intermediate</option>
                            <option value="ADVANCED" >Advanced</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="course-duration">Duration (text)</label>
                        <input type="text" id="course-duration" class="form-control" value="" placeholder="e.g. 6 months">
                    </div>
                    <div class="form-group">
                        <label for="course-total-lessons">Total Lessons</label>
                        <input type="number" id="course-total-lessons" class="form-control" value="">
                    </div>
                </div>
                <div class="form-group">
                    <label for="course-description">Description</label>
                    <textarea id="course-description" class="form-control" rows="4"></textarea>
                </div>
            </div>
        ;
    }

    renderGraduationTab() {
        const grad = this.courseData.graduation || {};
        return 
            <div class="form-section">
                <h3>Graduation System</h3>
                <div class="form-grid">
                    <div class="form-group">
                        <label>Current Belt</label>
                        <input type="text" id="grad-current-belt" class="form-control" value="">
                    </div>
                    <div class="form-group">
                        <label>Belt Color</label>
                        <input type="color" id="grad-belt-color" class="form-control" value="">
                    </div>
                    <div class="form-group">
                        <label>Next Belt</label>
                        <input type="text" id="grad-next-belt" class="form-control" value="">
                    </div>
                    <div class="form-group">
                        <label>Next Belt Color</label>
                        <input type="color" id="grad-next-belt-color" class="form-control" value="">
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
        ;
    }

    renderCategoriesTab() {
        return 
            <div class="form-section">
                <h3>Activity Categories</h3>
                <p class="text-muted">Define categories like Postures, Punches, Kicks, etc.</p>
                <div id="categories-list">
                    <!-- Categories rendered via JS -->
                </div>
                <button id="btn-add-category" class="btn-secondary btn-sm mt-2">+ Add Category</button>
            </div>
        ;
    }

    renderSyllabusTab() {
        return 
            <div class="form-section">
                <h3>Syllabus (Lessons)</h3>
                <div id="lessons-list" class="lessons-container">
                    <!-- Lessons rendered via JS -->
                </div>
                <button id="btn-add-lesson" class="btn-secondary btn-sm mt-2">+ Add Lesson</button>
            </div>
        ;
    }

    renderTechniquesTab() {
        return 
            <div class="form-section">
                <h3>Techniques Database</h3>
                <p class="text-muted">Manage techniques available for this course.</p>
                <div id="techniques-list">
                    <!-- Techniques rendered via JS -->
                </div>
                <button id="btn-add-technique" class="btn-secondary btn-sm mt-2">+ Add Technique</button>
            </div>
        ;
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
        this.container.querySelectorAll('.tab-content').forEach(content => content.classList.toggle('active', content.id === 	ab-));
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
        
        list.innerHTML = this.courseData.graduation.degrees.map((degree, index) => 
            <div class="degree-item card-premium mb-2">
                <div class="form-grid">
                    <input type="text" class="form-control degree-name" data-index="" value="" placeholder="Degree Name (e.g. 1st Stripe)">
                    <input type="text" class="form-control degree-req" data-index="" value="" placeholder="Requirements">
                    <button class="btn-danger btn-sm btn-remove-degree" data-index="">Remove</button>
                </div>
            </div>
        ).join('');

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

        list.innerHTML = this.courseData.activityCategories.map((cat, index) => 
            <div class="category-item card-premium mb-2">
                <div class="form-grid" style="grid-template-columns: 2fr 1fr 1fr auto;">
                    <input type="text" class="form-control cat-name" data-index="" value="" placeholder="Category Name">
                    <input type="color" class="form-control cat-color" data-index="" value="">
                    <input type="text" class="form-control cat-icon" data-index="" value="" placeholder="Icon (emoji)">
                    <button class="btn-danger btn-sm btn-remove-cat" data-index="">X</button>
                </div>
            </div>
        ).join('');

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

        list.innerHTML = this.courseData.lessons.map((lesson, index) => 
            <div class="lesson-item card-premium mb-2">
                <div class="lesson-header" style="display:flex; justify-content:space-between; align-items:center; cursor:pointer;" onclick="this.nextElementSibling.classList.toggle('hidden')">
                    <strong>Lesson : </strong>
                    <span></span>
                </div>
                <div class="lesson-body hidden mt-2">
                    <div class="form-group">
                        <label>Name</label>
                        <input type="text" class="form-control lesson-name" data-index="" value="">
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea class="form-control lesson-desc" data-index=""></textarea>
                    </div>
                    <div class="form-group">
                        <label>Duration (min)</label>
                        <input type="number" class="form-control lesson-duration" data-index="" value="">
                    </div>
                    <button class="btn-danger btn-sm btn-remove-lesson" data-index="">Remove Lesson</button>
                </div>
            </div>
        ).join('');

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
        this.container.querySelector('#btn-add-technique')?.addEventListener('click', () => {
            this.courseData.techniques.push({ name: '', description: '' });
            this.renderTechniquesList();
        });
    }

    renderTechniquesList() {
        const list = this.container.querySelector('#techniques-list');
        if (!list) return;

        list.innerHTML = this.courseData.techniques.map((tech, index) => 
            <div class="technique-item card-premium mb-2">
                <div class="form-grid">
                    <input type="text" class="form-control tech-name" data-index="" value="" placeholder="Technique Name">
                    <input type="text" class="form-control tech-desc" data-index="" value="" placeholder="Description">
                    <button class="btn-danger btn-sm btn-remove-tech" data-index="">X</button>
                </div>
            </div>
        ).join('');

        list.querySelectorAll('.tech-name').forEach(el => el.addEventListener('input', e => this.courseData.techniques[e.target.dataset.index].name = e.target.value));
        list.querySelectorAll('.tech-desc').forEach(el => el.addEventListener('input', e => this.courseData.techniques[e.target.dataset.index].description = e.target.value));
        list.querySelectorAll('.btn-remove-tech').forEach(el => el.addEventListener('click', e => {
            this.courseData.techniques.splice(e.target.dataset.index, 1);
            this.renderTechniquesList();
        }));
    }

    // --- Lesson Plans Logic ---
    renderLessonPlansTab() {
        return 
            <div class="form-section">
                <h3>Lesson Plans</h3>
                <p class="text-muted">Define structured lesson plans for each week/class.</p>
                <div id="lesson-plans-list">
                    <!-- Lesson Plans rendered via JS -->
                </div>
                <button id="btn-add-lesson-plan" class="btn-secondary btn-sm mt-2">+ Add Lesson Plan</button>
            </div>
        ;
    }

    bindLessonPlansEvents() {
        this.container.querySelector('#btn-add-lesson-plan')?.addEventListener('click', () => {
            this.courseData.lessonPlans.push({ week: '', content: '' });
            this.renderLessonPlansList();
        });
    }

    renderLessonPlansList() {
        const list = this.container.querySelector('#lesson-plans-list');
        if (!list) return;

        list.innerHTML = this.courseData.lessonPlans.map((plan, index) => 
            <div class="lesson-plan-item card-premium mb-2">
                <div class="form-grid">
                    <input type="text" class="form-control plan-week" data-index="" value="" placeholder="Week/Topic (e.g. Week 1)">
                    <textarea class="form-control plan-content" data-index="" placeholder="Content description"></textarea>
                    <button class="btn-danger btn-sm btn-remove-plan" data-index="">Remove</button>
                </div>
            </div>
        ).join('');

        list.querySelectorAll('.plan-week').forEach(el => el.addEventListener('input', e => this.courseData.lessonPlans[e.target.dataset.index].week = e.target.value));
        list.querySelectorAll('.plan-content').forEach(el => el.addEventListener('input', e => this.courseData.lessonPlans[e.target.dataset.index].content = e.target.value));
        list.querySelectorAll('.btn-remove-plan').forEach(el => el.addEventListener('click', e => {
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
            if (this.courseId) {
                response = await this.service.update(this.courseId, this.courseData);
            } else {
                response = await this.service.create(this.courseData);
            }

            if (response.success) {
                window.coursesModule.navigate('list');
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Error saving course:', error);
            alert(Failed to save course: );
        }
    }

    destroy() {
        // Cleanup
    }
}
