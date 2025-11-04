/**
 * Students Grid View
 * Renders students in card/grid format
 */

export class StudentsGridView {
    constructor() {
        this.gridSize = 'medium'; // small, medium, large
    }

    /**
     * Render students grid
     */
    render(container, students) {
        if (!container) return;

        const html = `
            <div class="grid-container">
                <div class="grid-header">
                    <div class="grid-controls">
                        <button onclick="window.setGridSize('small')" 
                                class="grid-size-btn ${this.gridSize === 'small' ? 'active' : ''}"
                                title="Grade pequena">
                            ⬜
                        </button>
                        <button onclick="window.setGridSize('medium')" 
                                class="grid-size-btn ${this.gridSize === 'medium' ? 'active' : ''}"
                                title="Grade média">
                            ⬛
                        </button>
                        <button onclick="window.setGridSize('large')" 
                                class="grid-size-btn ${this.gridSize === 'large' ? 'active' : ''}"
                                title="Grade grande">
                            ⬛⬛
                        </button>
                    </div>
                </div>
                <div class="students-grid grid-${this.gridSize}">
                    ${this.renderGridCards(students)}
                </div>
            </div>
        `;

        container.innerHTML = html;
        this.bindGridEvents(container);
    }

    /**
     * Render grid cards
     */
    renderGridCards(students) {
        if (!students || students.length === 0) {
            return `
                <div class="empty-state-grid">
                    <div class="empty-content">
                        <div class="empty-icon">👥</div>
                        <h3>Nenhum estudante encontrado</h3>
                        <p>Adicione seu primeiro estudante para começar</p>
                        <button onclick="window.addNewStudent()" class="btn btn-primary">
                            ➕ Adicionar Estudante
                        </button>
                    </div>
                </div>
            `;
        }

        return students.map(student => this.renderStudentCard(student)).join('');
    }

    /**
     * Render single student card
     */
    renderStudentCard(student) {
        const user = student.user || {};
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Nome não disponível';
        const email = user.email || 'Email não disponível';
        const category = student.category || 'N/A';
        const status = student.isActive ? 'Ativo' : 'Inativo';
        const statusClass = student.isActive ? 'status-active' : 'status-inactive';
        
        // Get current subscription info
        const subscription = student.subscriptions?.find(s => s.status === 'ACTIVE');
        const planName = subscription?.plan?.name || 'Sem plano';
        const planPrice = subscription?.plan?.price ? `R$ ${subscription.plan.price}` : 'Gratuito';
        
        // Attendance stats
        const totalAttendances = student._count?.attendances || 0;
        const presentAttendances = student.attendances?.filter(a => a.status === 'PRESENT').length || 0;
        const attendanceRate = totalAttendances > 0 ? Math.round((presentAttendances / totalAttendances) * 100) : 0;
        
        // Avatar
        const avatarUrl = user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=3B82F6&color=fff&size=120`;

        return `
            <div class="student-card" 
                 data-student-id="${student.id}"
                 onclick="window.selectStudent('${student.id}')"
                 title="Clique para editar">
                
                <div class="card-header">
                    <div class="avatar-container">
                        <img src="${avatarUrl}" alt="${fullName}" class="student-avatar">
                        <div class="status-indicator ${statusClass}"></div>
                    </div>
                    <div class="card-actions">
                        <button onclick="event.stopPropagation(); window.selectStudent('${student.id}')" 
                                class="card-action-btn edit-btn" 
                                title="Editar">
                            ✏️
                        </button>
                        <button onclick="event.stopPropagation(); window.quickViewStudent('${student.id}')" 
                                class="card-action-btn view-btn" 
                                title="Visualizar">
                            👁️
                        </button>
                    </div>
                </div>

                <div class="card-body">
                    <h3 class="student-name">${fullName}</h3>
                    <p class="student-email">${email}</p>
                    
                    <div class="student-info">
                        <div class="info-item">
                            <span class="info-label">ID:</span>
                            <span class="info-value">${student.id}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Categoria:</span>
                            <span class="category-badge category-${category.toLowerCase()}">${category}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Status:</span>
                            <span class="status-badge ${statusClass}">${status}</span>
                        </div>
                    </div>
                </div>

                <div class="card-footer">
                    <div class="subscription-info">
                        <div class="plan-info">
                            <span class="plan-name">${planName}</span>
                            <span class="plan-price">${planPrice}</span>
                        </div>
                    </div>
                    
                    <div class="attendance-info">
                        <div class="attendance-rate">
                            <span class="rate-value">${attendanceRate}%</span>
                            <span class="rate-label">Frequência</span>
                        </div>
                        <div class="attendance-count">
                            <span class="count-value">${totalAttendances}</span>
                            <span class="count-label">Aulas</span>
                        </div>
                    </div>
                </div>

                <div class="card-overlay">
                    <div class="overlay-content">
                        <button class="btn btn-primary">
                            Editar Estudante
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Set grid size
     */
    setGridSize(size) {
        this.gridSize = size;
        
        // Update grid container class
        const gridContainer = document.querySelector('.students-grid');
        if (gridContainer) {
            gridContainer.className = `students-grid grid-${size}`;
        }

        // Update control buttons
        document.querySelectorAll('.grid-size-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[onclick="window.setGridSize('${size}')"]`)?.classList.add('active');
    }

    /**
     * Bind grid events
     */
    bindGridEvents(container) {
        // Make grid size function available globally
        window.setGridSize = (size) => {
            this.setGridSize(size);
        };

        // Add card hover effects
        const cards = container.querySelectorAll('.student-card');
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.classList.add('hovered');
            });
            card.addEventListener('mouseleave', () => {
                card.classList.remove('hovered');
            });
        });

        // Add keyboard navigation
        cards.forEach((card, index) => {
            card.setAttribute('tabindex', '0');
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    card.click();
                }
                
                // Arrow key navigation
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    const nextCard = cards[index + 1];
                    if (nextCard) nextCard.focus();
                }
                
                if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    const prevCard = cards[index - 1];
                    if (prevCard) prevCard.focus();
                }
            });
        });
    }
}
