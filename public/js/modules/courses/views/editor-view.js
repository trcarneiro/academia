export class EditorView {
    constructor(container, service) {
        this.container = container;
        this.service = service;
        this.courseId = null;
        this.courseData = {};
        this.techniques = [];
    }

    async render(params) {
        this.courseId = params.id || null;
        
        // 1. Load Data if editing
        if (this.courseId) {
            await this.loadCourseData();
        }

        // 2. Render Structure
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
                        <button class="tab-btn active" data-tab="details">Details</button>
                        <button class="tab-btn" data-tab="techniques">Techniques</button>
                    </div>

                    <div id="tab-details" class="tab-content active">
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
                                    <label for="course-duration">Duration (minutes)</label>
                                    <input type="number" id="course-duration" class="form-control" value="${this.courseData.duration || 60}">
                                </div>
                                <div class="form-group">
                                    <label for="course-active">Status</label>
                                    <select id="course-active" class="form-control">
                                        <option value="true" ${this.courseData.active !== false ? 'selected' : ''}>Active</option>
                                        <option value="false" ${this.courseData.active === false ? 'selected' : ''}>Inactive</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="course-description">Description</label>
                                <textarea id="course-description" class="form-control">${this.courseData.description || ''}</textarea>
                            </div>
                        </div>
                    </div>

                    <div id="tab-techniques" class="tab-content">
                        <div class="form-section">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                                <h3>Techniques</h3>
                                <button id="btn-add-technique" class="btn-secondary"><i class="fas fa-plus"></i> Add Technique</button>
                            </div>
                            <div id="techniques-list">
                                <!-- Techniques will be rendered here -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 3. Render Techniques
        this.renderTechniques();

        // 4. Bind Events
        this.bindEvents();
    }

    async loadCourseData() {
        try {
            const response = await this.service.getById(this.courseId);
            if (response.success) {
                this.courseData = response.data;
                this.techniques = this.courseData.techniques || [];
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Error loading course:', error);
            // alert('Failed to load course data');
            window.coursesModule.navigate('list');
        }
    }

    bindEvents() {
        // Tabs
        this.container.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Cancel
        const btnCancel = this.container.querySelector('#btn-cancel');
        if (btnCancel) {
            btnCancel.addEventListener('click', () => {
                window.coursesModule.navigate('list');
            });
        }

        // Save
        const btnSave = this.container.querySelector('#btn-save');
        if (btnSave) {
            btnSave.addEventListener('click', () => {
                this.saveCourse();
            });
        }

        // Add Technique
        const btnAddTech = this.container.querySelector('#btn-add-technique');
        if (btnAddTech) {
            btnAddTech.addEventListener('click', () => {
                this.addTechnique();
            });
        }
    }

    switchTab(tabName) {
        // Update buttons
        this.container.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update content
        this.container.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `tab-${tabName}`);
        });
    }

    renderTechniques() {
        const list = this.container.querySelector('#techniques-list');
        if (!list) return;

        if (this.techniques.length === 0) {
            list.innerHTML = '<p class="text-muted">No techniques added yet.</p>';
            return;
        }

        list.innerHTML = `
            <table class="techniques-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.techniques.map((tech, index) => `
                        <tr>
                            <td>
                                <input type="text" class="form-control tech-name" data-index="${index}" value="${tech.name}" placeholder="Technique Name">
                            </td>
                            <td>
                                <input type="text" class="form-control tech-desc" data-index="${index}" value="${tech.description || ''}" placeholder="Description">
                            </td>
                            <td>
                                <button class="btn-secondary btn-sm btn-remove-tech" data-index="${index}"><i class="fas fa-trash"></i></button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        // Bind inputs
        list.querySelectorAll('.tech-name').forEach(input => {
            input.addEventListener('input', (e) => {
                this.techniques[e.target.dataset.index].name = e.target.value;
            });
        });

        list.querySelectorAll('.tech-desc').forEach(input => {
            input.addEventListener('input', (e) => {
                this.techniques[e.target.dataset.index].description = e.target.value;
            });
        });

        // Bind remove buttons
        list.querySelectorAll('.btn-remove-tech').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.target.closest('button').dataset.index;
                this.removeTechnique(index);
            });
        });
    }

    addTechnique() {
        this.techniques.push({ name: '', description: '' });
        this.renderTechniques();
    }

    removeTechnique(index) {
        this.techniques.splice(index, 1);
        this.renderTechniques();
    }

    async saveCourse() {
        const nameInput = this.container.querySelector('#course-name');
        const name = nameInput ? nameInput.value : '';
        
        if (!name) {
            alert('Course Name is required');
            return;
        }

        const data = {
            name: name,
            description: this.container.querySelector('#course-description').value,
            level: this.container.querySelector('#course-level').value,
            duration: parseInt(this.container.querySelector('#course-duration').value),
            active: this.container.querySelector('#course-active').value === 'true',
            techniques: this.techniques
        };

        try {
            let response;
            if (this.courseId) {
                response = await this.service.update(this.courseId, data);
            } else {
                response = await this.service.create(data);
            }

            if (response.success) {
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