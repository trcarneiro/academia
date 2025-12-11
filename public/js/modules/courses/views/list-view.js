export class ListView {
    constructor(container, service) {
        this.container = container;
        this.service = service;
        this.courses = [];
    }

    async render() {
        // 1. Setup basic structure
        this.container.innerHTML = `
            <div class="module-isolated-courses">
                <div class="module-header-premium">
                    <div class="header-content">
                        <h1>Courses Management</h1>
                        <nav class="breadcrumb">Home > Courses</nav>
                    </div>
                    <button id="btn-new-course" class="btn-secondary">
                        <i class="fas fa-plus"></i> New Course
                    </button>
                </div>

                <div class="stats-grid" id="stats-container">
                    <!-- Stats will be injected here -->
                </div>

                <div class="module-filters-premium">
                    <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input type="text" id="course-search" placeholder="Search courses...">
                    </div>
                    <div class="filter-group">
                        <select id="filter-level" class="form-control">
                            <option value="">All Levels</option>
                            <option value="BEGINNER">Beginner</option>
                            <option value="INTERMEDIATE">Intermediate</option>
                            <option value="ADVANCED">Advanced</option>
                        </select>
                    </div>
                </div>

                <div id="courses-list-container" class="courses-grid">
                    <!-- Courses will be injected here -->
                </div>
            </div>
        `;

        // 2. Bind Events
        this.bindEvents();

        // 3. Load Data
        await this.loadData();
    }

    bindEvents() {
        // New Course Button
        const btnNew = this.container.querySelector('#btn-new-course');
        if (btnNew) {
            btnNew.addEventListener('click', () => {
                window.coursesModule.navigate('editor', { id: null });
            });
        }

        // Search
        const searchInput = this.container.querySelector('#course-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterCourses(e.target.value);
            });
        }
        
        // Filter
        const filterSelect = this.container.querySelector('#filter-level');
        if (filterSelect) {
            filterSelect.addEventListener('change', () => {
                this.filterCourses(searchInput.value);
            });
        }
    }

    async loadData() {
        const listContainer = this.container.querySelector('#courses-list-container');
        
        await this.service.getAll({
            loadingElement: listContainer,
            onSuccess: (data) => {
                // Handle both array and paginated response
                this.courses = Array.isArray(data) ? data : (data.data || []);
                this.renderList(this.courses);
                this.renderStats();
            },
            onEmpty: () => {
                listContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-book-open"></i>
                        <h3>No courses found</h3>
                        <p>Get started by creating your first course.</p>
                        <button onclick="coursesModule.navigate('editor')" class="btn-primary">Create Course</button>
                    </div>
                `;
            },
            onError: (error) => {
                console.error('Error loading courses:', error);
            }
        });
    }

    renderList(courses) {
        const listContainer = this.container.querySelector('#courses-list-container');
        
        if (!courses || courses.length === 0) {
            listContainer.innerHTML = '<div class="no-results">No courses match your search</div>';
            return;
        }

        listContainer.innerHTML = courses.map(course => `
            <div class="course-card" onclick="coursesModule.navigate('editor', { id: '${course.id}' })">
                <div class="course-header">
                    <div class="course-badges">
                        <span class="badge badge-level">${course.level || 'General'}</span>
                        ${!course.active ? '<span class="badge badge-status inactive">Inactive</span>' : '<span class="badge badge-status">Active</span>'}
                    </div>
                </div>
                <div class="course-body">
                    <h3>${course.name}</h3>
                    <p class="course-description">${course.description || 'No description provided.'}</p>
                </div>
                <div class="course-footer">
                    <span><i class="fas fa-clock"></i> ${course.duration || 60} min</span>
                    <span><i class="fas fa-users"></i> ${course._count?.enrollments || 0} students</span>
                </div>
            </div>
        `).join('');
    }

    renderStats() {
        const statsContainer = this.container.querySelector('#stats-container');
        if (!statsContainer) return;

        const total = this.courses.length;
        const active = this.courses.filter(c => c.active).length;
        const students = this.courses.reduce((acc, c) => acc + (c._count?.enrollments || 0), 0);

        statsContainer.innerHTML = `
            <div class="stat-card-enhanced">
                <div class="stat-icon"><i class="fas fa-book"></i></div>
                <div class="stat-info">
                    <h3>${total}</h3>
                    <p>Total Courses</p>
                </div>
            </div>
            <div class="stat-card-enhanced">
                <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
                <div class="stat-info">
                    <h3>${active}</h3>
                    <p>Active Courses</p>
                </div>
            </div>
            <div class="stat-card-enhanced">
                <div class="stat-icon"><i class="fas fa-user-graduate"></i></div>
                <div class="stat-info">
                    <h3>${students}</h3>
                    <p>Total Enrollments</p>
                </div>
            </div>
        `;
    }

    filterCourses(query) {
        const levelSelect = this.container.querySelector('#filter-level');
        const level = levelSelect ? levelSelect.value : '';
        
        const filtered = this.courses.filter(course => {
            const matchesQuery = !query || 
                               course.name.toLowerCase().includes(query.toLowerCase()) || 
                               (course.description && course.description.toLowerCase().includes(query.toLowerCase()));
            const matchesLevel = !level || course.level === level;
            return matchesQuery && matchesLevel;
        });
        this.renderList(filtered);
    }

    destroy() {
        // Cleanup
    }
}