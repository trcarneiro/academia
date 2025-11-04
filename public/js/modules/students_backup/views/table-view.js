/**
 * Students Table View
 * Renders students in table format
 */

export class StudentsTableView {
    constructor() {
        this.sortColumn = 'name';
        this.sortDirection = 'asc';
    }

    /**
     * Render students table
     */
    render(container, students) {
        if (!container) return;

        const html = `
            <div class="table-wrapper">
                <table class="students-table">
                    <thead>
                        <tr>
                            <th class="th-name">
                                <span class="th-content">
                                    <span class="th-icon">👤</span>
                                    Nome
                                </span>
                            </th>
                            <th class="th-email">
                                <span class="th-content">
                                    <span class="th-icon">📧</span>
                                    Email
                                </span>
                            </th>
                            <th class="th-phone">
                                <span class="th-content">
                                    <span class="th-icon">📱</span>
                                    Telefone
                                </span>
                            </th>
                            <th class="th-status">
                                <span class="th-content">
                                    <span class="th-icon">📈</span>
                                    Status
                                </span>
                            </th>
                            <th class="th-category">
                                <span class="th-content">
                                    <span class="th-icon">🏷️</span>
                                    Categoria
                                </span>
                            </th>
                            <th class="th-activity">
                                <span class="th-content">
                                    <span class="th-icon">⏰</span>
                                    Plano Atual
                                </span>
                            </th>
                            <th class="th-actions">
                                <span class="th-content">
                                    <span class="th-icon">⚙️</span>
                                    Ações
                                </span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.renderTableRows(students)}
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = html;
        this.bindTableEvents(container);
    }

    /**
     * Render table rows
     */
    renderTableRows(students) {
        if (!students || students.length === 0) {
            return `
                <tr class="empty-state">
                    <td colspan="7">
                        <div class="empty-content">
                            <div class="empty-icon">👥</div>
                            <h3>Nenhum estudante encontrado</h3>
                            <p>Adicione seu primeiro estudante para começar</p>
                            <button onclick="window.addNewStudent()" class="btn btn-primary">
                                ➕ Adicionar Estudante
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }

        return students.map(student => this.renderTableRow(student)).join('');
    }

    /**
     * Render single table row
     */
    renderTableRow(student) {
        const user = student.user || {};
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Nome não disponível';
        const email = user.email || 'Email não disponível';
        const phone = user.phone || 'Não informado';
        const category = student.category || 'REGULAR';
        const status = student.isActive ? 'Ativo' : 'Inativo';
        const statusClass = student.isActive ? 'status-active' : 'status-inactive';
        
        // Get current subscription info
        const subscription = student.subscriptions?.find(s => s.status === 'ACTIVE');
        const planName = subscription?.plan?.name || 'Sem plano';
        
        // Last attendance  
        const lastAttendance = student.attendances?.[0];
        const lastAccess = lastAttendance ? 
            new Date(lastAttendance.createdAt).toLocaleDateString('pt-BR') : 
            'Nunca';

        // Category display with emoji
        const categoryDisplay = {
            'REGULAR': '🎯 Regular',
            'VIP': '⭐ VIP', 
            'STUDENT': '🎓 Estudante',
            'SENIOR': '👴 Senior'
        };

        return `
            <tr class="student-row" 
                data-student-id="${student.id}"
                ondblclick="window.selectStudent('${student.id}')"
                title="Dê um duplo clique para editar ${fullName}">
                <td class="student-name">
                    <div class="name-container">
                        <div class="avatar">
                            ${user.avatarUrl ? 
                                `<img src="${user.avatarUrl}" alt="${fullName}" class="avatar-img">` :
                                `<div class="avatar-placeholder">${fullName.charAt(0).toUpperCase()}</div>`
                            }
                        </div>
                        <div class="name-info">
                            <div class="full-name">${fullName}</div>
                            <div class="student-id">ID: ${student.id.substring(0, 8)}...</div>
                        </div>
                    </div>
                </td>
                <td class="student-email">
                    <a href="mailto:${email}" class="email-link" onclick="event.stopPropagation()">
                        ${email}
                    </a>
                </td>
                <td class="student-phone">
                    <a href="tel:${phone}" class="phone-link" onclick="event.stopPropagation()">
                        ${phone}
                    </a>
                </td>
                <td class="student-status">
                    <span class="status-badge ${statusClass}">
                        ${student.isActive ? '✅' : '❌'} ${status}
                    </span>
                </td>
                <td class="student-category">
                    <span class="category-badge category-${category.toLowerCase()}">
                        ${categoryDisplay[category] || category}
                    </span>
                </td>
                <td class="student-plan">
                    <div class="plan-info">
                        <span class="plan-name">${planName}</span>
                        ${subscription ? '<span class="plan-active">●</span>' : ''}
                    </div>
                </td>
                <td class="student-actions">
                    <div class="action-buttons">
                        <button onclick="event.stopPropagation(); window.selectStudent('${student.id}')" 
                                class="btn-action btn-edit" 
                                title="Editar ${fullName}">
                            ✏️
                        </button>
                        <button onclick="event.stopPropagation(); window.quickViewStudent('${student.id}')" 
                                class="btn-action btn-view" 
                                title="Visualizar ${fullName}">
                            👁️
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    /**
     * Get sort icon for column
     */
    getSortIcon(column) {
        if (this.sortColumn !== column) return '↕️';
        return this.sortDirection === 'asc' ? '↑' : '↓';
    }

    /**
     * Sort students by column
     */
    sortStudents(students, column) {
        const direction = this.sortColumn === column && this.sortDirection === 'asc' ? 'desc' : 'asc';
        this.sortColumn = column;
        this.sortDirection = direction;

        return [...students].sort((a, b) => {
            let aValue, bValue;

            switch (column) {
                case 'name':
                    aValue = `${a.user?.firstName || ''} ${a.user?.lastName || ''}`.trim().toLowerCase();
                    bValue = `${b.user?.firstName || ''} ${b.user?.lastName || ''}`.trim().toLowerCase();
                    break;
                case 'email':
                    aValue = (a.user?.email || '').toLowerCase();
                    bValue = (b.user?.email || '').toLowerCase();
                    break;
                case 'category':
                    aValue = a.category || '';
                    bValue = b.category || '';
                    break;
                case 'status':
                    aValue = a.isActive ? 1 : 0;
                    bValue = b.isActive ? 1 : 0;
                    break;
                default:
                    return 0;
            }

            if (aValue < bValue) return direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return direction === 'asc' ? 1 : -1;
            return 0;
        });
    }

    /**
     * Bind table events
     */
    bindTableEvents(container) {
        // Make sort function available globally
        window.sortStudentsTable = (column) => {
            // This would need to be connected to the controller
            // The controller should handle sorting and re-rendering
            console.log('Sort by:', column);
        };

        // Make quick view function available
        window.quickViewStudent = (id) => {
            console.log('Quick view student:', id);
            // Implement quick view modal/drawer
        };

        // Add hover effects
        const rows = container.querySelectorAll('.student-row');
        rows.forEach(row => {
            row.addEventListener('mouseenter', () => {
                row.classList.add('hovered');
            });
            row.addEventListener('mouseleave', () => {
                row.classList.remove('hovered');
            });
        });
    }
}
