// TurmasController - Controlador principal do módulo de Turmas
// Gerencia todas as visualizações e interações do usuário

import { TurmasListView } from '../views/TurmasListView.js';
import { TurmasDetailView } from '../views/TurmasDetailView.js';
import { TurmasScheduleView } from '../views/TurmasScheduleView.js';
import { TurmasStudentsView } from '../views/TurmasStudentsView.js';
import { TurmasAttendanceView } from '../views/TurmasAttendanceView.js';
import { TurmasReportsView } from '../views/TurmasReportsView.js';
import { safeNavigateTo, safeNavigateToList } from '../../../shared/utils/navigation.js';

export class TurmasController {
    constructor(turmasService) {
        this.service = turmasService;
        this.currentView = null;
        this.container = null;
        
        // Cache de dados para otimização
        this.cache = {
            turmas: new Map(),
            courses: null,
            instructors: null,
            students: null
        };
        
        this.initializeContainer();
    }

    initializeContainer() {
        this.container = document.getElementById('module-container');
        if (!this.container) {
            console.error('❌ Container module-container não encontrado');
            return;
        }
    }

    // ===== Navegação Principal =====

    async showList(filters = {}) {
        try {
            // Re-initialize container to ensure we have fresh DOM reference
            this.initializeContainer();
            if (!this.container) {
                throw new Error('Container #module-container não encontrado');
            }
            
            this.clearCurrentView();
            
            const view = new TurmasListView(this.service, this);
            this.currentView = view;
            
            await view.render(this.container, filters);
            
            this.updateNavigation('turmas');
            
        } catch (error) {
            console.error('❌ Erro ao mostrar lista de turmas:', error);
            this.handleError(error, 'Erro ao carregar lista de turmas');
        }
    }

    async showCreate() {
        try {
            this.clearCurrentView();
            const view = new TurmasDetailView(this.service, this);
            this.currentView = view;

            await view.render(this.container, null, {
                isCreateMode: true
            });

            this.updateNavigation('turmas/create');
            
        } catch (error) {
            console.error('❌ Erro ao mostrar formulário de criação:', error);
            this.handleError(error, 'Erro ao carregar formulário');
        }
    }

    async showEdit(turmaId) {
        try {
            this.clearCurrentView();
            
            const turma = await this.getTurmaFromCache(turmaId);
            if (!turma) {
                throw new Error('Turma não encontrada');
            }
            
            const view = new TurmasDetailView(this.service, this);
            this.currentView = view;

            await view.render(this.container, turma, {
                autoEditSections: ['basic', 'schedule']
            });

            this.updateNavigation(`turmas/edit/${turmaId}`);
            
        } catch (error) {
            console.error('❌ Erro ao mostrar formulário de edição:', error);
            this.handleError(error, 'Erro ao carregar formulário de edição');
        }
    }

    async showView(turmaId) {
        try {
            this.clearCurrentView();
            
            const turma = await this.getTurmaFromCache(turmaId);
            if (!turma) {
                throw new Error('Turma não encontrada');
            }
            
            const view = new TurmasDetailView(this.service, this);
            this.currentView = view;
            
            await view.render(this.container, turma);
            
            this.updateNavigation(`turmas/view/${turmaId}`);
            
        } catch (error) {
            console.error('❌ Erro ao mostrar detalhes da turma:', error);
            this.handleError(error, 'Erro ao carregar detalhes da turma');
        }
    }

    // ===== Cronograma e Aulas =====

    async showSchedule(turmaId) {
        try {
            this.clearCurrentView();
            
            const turma = await this.getTurmaFromCache(turmaId);
            if (!turma) {
                throw new Error('Turma não encontrada');
            }
            
            const view = new TurmasScheduleView(this.service, this);
            this.currentView = view;
            
            await view.render(this.container, turma);
            
            this.updateNavigation(`turmas/schedule/${turmaId}`);
            
        } catch (error) {
            console.error('❌ Erro ao mostrar cronograma:', error);
            this.handleError(error, 'Erro ao carregar cronograma');
        }
    }

    async showLesson(turmaId, lessonId) {
        try {
            // Navegar para a view de frequência da aula específica
            await this.showAttendance(turmaId, { lessonId });
            
        } catch (error) {
            console.error('❌ Erro ao mostrar aula:', error);
            this.handleError(error, 'Erro ao carregar aula');
        }
    }

    // ===== Gestão de Alunos =====

    async showStudents(turmaId) {
        try {
            this.clearCurrentView();
            
            const turma = await this.getTurmaFromCache(turmaId);
            if (!turma) {
                throw new Error('Turma não encontrada');
            }
            
            const view = new TurmasStudentsView(this.service, this);
            this.currentView = view;
            
            await view.render(this.container, turma);
            
            this.updateNavigation(`turmas/students/${turmaId}`);
            
        } catch (error) {
            console.error('❌ Erro ao mostrar alunos:', error);
            this.handleError(error, 'Erro ao carregar alunos da turma');
        }
    }

    async showAttendance(turmaId, filters = {}) {
        try {
            this.clearCurrentView();
            
            const turma = await this.getTurmaFromCache(turmaId);
            if (!turma) {
                throw new Error('Turma não encontrada');
            }
            
            const view = new TurmasAttendanceView(this.service, this);
            this.currentView = view;
            
            await view.render(this.container, turma, filters);
            
            this.updateNavigation(`turmas/attendance/${turmaId}`);
            
        } catch (error) {
            console.error('❌ Erro ao mostrar frequência:', error);
            this.handleError(error, 'Erro ao carregar frequência');
        }
    }

    // ===== Relatórios =====

    async showReports(turmaId) {
        try {
            this.clearCurrentView();
            
            const turma = await this.getTurmaFromCache(turmaId);
            if (!turma) {
                throw new Error('Turma não encontrada');
            }
            
            const view = new TurmasReportsView(this.service, this);
            this.currentView = view;
            
            await view.render(this.container, turma);
            
            this.updateNavigation(`turmas/reports/${turmaId}`);
            
        } catch (error) {
            console.error('❌ Erro ao mostrar relatórios:', error);
            this.handleError(error, 'Erro ao carregar relatórios');
        }
    }

    // ===== Ações CRUD =====

    async createTurma(formData) {
        try {
            // Validar dados
            const errors = this.service.validateTurmaData(formData);
            if (errors.length > 0) {
                throw new Error(errors.join(', '));
            }
            
            // Criar turma
            const result = await this.service.create(formData);
            
            if (result.success) {
                this.showSuccessMessage('Turma criada com sucesso!');
                this.clearCache();
                
                // Navegar para detalhes da turma criada
                setTimeout(() => {
                    this.showView(result.data.id);
                }, 1000);
                
                return result.data;
            } else {
                throw new Error(result.error || 'Erro ao criar turma');
            }
            
        } catch (error) {
            console.error('❌ Erro ao criar turma:', error);
            this.handleError(error, 'Erro ao criar turma');
            throw error;
        }
    }

    async updateTurma(turmaId, formData) {
        try {
            // Validar dados
            const errors = this.service.validateTurmaData(formData);
            if (errors.length > 0) {
                throw new Error(errors.join(', '));
            }
            
            // Atualizar turma
            const result = await this.service.update(turmaId, formData);
            
            if (result.success) {
                this.showSuccessMessage('Turma atualizada com sucesso!');
                this.clearCache();
                
                // Navegar para detalhes da turma
                setTimeout(() => {
                    this.showView(turmaId);
                }, 1000);
                
                return result.data;
            } else {
                throw new Error(result.error || 'Erro ao atualizar turma');
            }
            
        } catch (error) {
            console.error('❌ Erro ao atualizar turma:', error);
            this.handleError(error, 'Erro ao atualizar turma');
            throw error;
        }
    }

    async deleteTurma(turmaId) {
        try {
            if (!confirm('Tem certeza que deseja excluir esta turma? Esta ação não pode ser desfeita.')) {
                return false;
            }
            
            const result = await this.service.delete(turmaId);
            
            if (result.success) {
                this.showSuccessMessage('Turma excluída com sucesso!');
                this.clearCache();
                
                // Voltar para lista
                setTimeout(() => {
                    this.showList();
                }, 1000);
                
                return true;
            } else {
                throw new Error(result.error || 'Erro ao excluir turma');
            }
            
        } catch (error) {
            console.error('❌ Erro ao excluir turma:', error);
            this.handleError(error, 'Erro ao excluir turma');
            return false;
        }
    }

    // ===== Ações de Cronograma =====

    async generateSchedule(turmaId) {
        try {
            const result = await this.service.generateSchedule(turmaId);
            
            if (result.success) {
                this.showSuccessMessage('Cronograma gerado com sucesso!');
                this.clearTurmaFromCache(turmaId);
                
                // Atualizar view atual se for de cronograma
                if (this.currentView && this.currentView.refresh) {
                    await this.currentView.refresh();
                }
                
                return result.data;
            } else {
                throw new Error(result.error || 'Erro ao gerar cronograma');
            }
            
        } catch (error) {
            console.error('❌ Erro ao gerar cronograma:', error);
            this.handleError(error, 'Erro ao gerar cronograma');
            throw error;
        }
    }

    async updateLessonStatus(turmaId, lessonId, status) {
        try {
            const result = await this.service.updateLessonStatus(turmaId, lessonId, status);
            
            if (result.success) {
                this.showSuccessMessage('Status da aula atualizado!');
                this.clearTurmaFromCache(turmaId);
                
                // Atualizar view atual
                if (this.currentView && this.currentView.refresh) {
                    await this.currentView.refresh();
                }
                
                return result.data;
            } else {
                throw new Error(result.error || 'Erro ao atualizar status da aula');
            }
            
        } catch (error) {
            console.error('❌ Erro ao atualizar status da aula:', error);
            this.handleError(error, 'Erro ao atualizar status da aula');
            throw error;
        }
    }

    // ===== Ações de Alunos =====

    async addStudentToTurma(turmaId, studentId) {
        try {
            const result = await this.service.addStudent(turmaId, studentId);
            
            if (result.success) {
                this.showSuccessMessage('Aluno adicionado à turma!');
                this.clearTurmaFromCache(turmaId);
                
                // Atualizar view atual
                if (this.currentView && this.currentView.refresh) {
                    await this.currentView.refresh();
                }
                
                return result.data;
            } else {
                throw new Error(result.error || 'Erro ao adicionar aluno');
            }
            
        } catch (error) {
            console.error('❌ Erro ao adicionar aluno:', error);
            this.handleError(error, 'Erro ao adicionar aluno à turma');
            throw error;
        }
    }

    async removeStudentFromTurma(turmaId, studentId) {
        try {
            if (!confirm('Tem certeza que deseja remover este aluno da turma?')) {
                return false;
            }
            
            const result = await this.service.removeStudent(turmaId, studentId);
            
            if (result.success) {
                this.showSuccessMessage('Aluno removido da turma!');
                this.clearTurmaFromCache(turmaId);
                
                // Atualizar view atual
                if (this.currentView && this.currentView.refresh) {
                    await this.currentView.refresh();
                }
                
                return true;
            } else {
                throw new Error(result.error || 'Erro ao remover aluno');
            }
            
        } catch (error) {
            console.error('❌ Erro ao remover aluno:', error);
            this.handleError(error, 'Erro ao remover aluno da turma');
            return false;
        }
    }

    // ===== Ações de Frequência =====

    async markAttendance(turmaId, attendanceData) {
        try {
            const result = await this.service.markAttendance(turmaId, attendanceData);
            
            if (result.success) {
                this.showSuccessMessage('Frequência registrada!');
                
                // Atualizar view atual
                if (this.currentView && this.currentView.refresh) {
                    await this.currentView.refresh();
                }
                
                return result.data;
            } else {
                throw new Error(result.error || 'Erro ao registrar frequência');
            }
            
        } catch (error) {
            console.error('❌ Erro ao registrar frequência:', error);
            this.handleError(error, 'Erro ao registrar frequência');
            throw error;
        }
    }

    // ===== Gerenciamento de Cache =====

    async getTurmaFromCache(turmaId) {
        if (this.cache.turmas.has(turmaId)) {
            return this.cache.turmas.get(turmaId);
        }
        
        try {
            const result = await this.service.getById(turmaId);
            if (result.success && result.data) {
                this.cache.turmas.set(turmaId, result.data);
                return result.data;
            }
            return null;
        } catch (error) {
            console.error('❌ Erro ao buscar turma:', error);
            return null;
        }
    }

    clearTurmaFromCache(turmaId) {
        this.cache.turmas.delete(turmaId);
    }

    clearCache() {
        this.cache.turmas.clear();
        this.cache.courses = null;
        this.cache.instructors = null;
        this.cache.students = null;
    }

    // ===== Utilitários =====

    clearCurrentView() {
        if (this.currentView && this.currentView.destroy) {
            this.currentView.destroy();
        }
        this.currentView = null;
        
        if (this.container) {
            this.container.innerHTML = '';
        }
    }

    updateNavigation(path) {
        // Atualizar breadcrumb e navegação
        if (window.app && window.app.updateBreadcrumb) {
            const breadcrumb = this.generateBreadcrumb(path);
            window.app.updateBreadcrumb(breadcrumb);
        }
    }

    generateBreadcrumb(path) {
        const parts = path.split('/');
        const breadcrumb = [
            { text: 'Início', href: '/' },
            { text: 'Turmas', href: '/turmas' }
        ];
        
        if (parts.length > 1) {
            const action = parts[1];
            const id = parts[2];
            
            switch (action) {
                case 'create':
                    breadcrumb.push({ text: 'Nova Turma', href: '/turmas/create' });
                    break;
                case 'edit':
                    breadcrumb.push({ text: 'Editar Turma', href: `/turmas/edit/${id}` });
                    break;
                case 'view':
                    breadcrumb.push({ text: 'Detalhes', href: `/turmas/view/${id}` });
                    break;
                case 'schedule':
                    breadcrumb.push({ text: 'Cronograma', href: `/turmas/schedule/${id}` });
                    break;
                case 'students':
                    breadcrumb.push({ text: 'Alunos', href: `/turmas/students/${id}` });
                    break;
                case 'attendance':
                    breadcrumb.push({ text: 'Frequência', href: `/turmas/attendance/${id}` });
                    break;
                case 'reports':
                    breadcrumb.push({ text: 'Relatórios', href: `/turmas/reports/${id}` });
                    break;
            }
        }
        
        return breadcrumb;
    }

    showSuccessMessage(message) {
        if (window.app && window.app.showSuccess) {
            window.app.showSuccess(message);
        } else {
            console.log('✅', message);
        }
    }

    handleError(error, context) {
        if (window.app && window.app.handleError) {
            window.app.handleError(error, context);
        } else {
            console.error('❌', context, error);
            alert(`${context}: ${error.message || error}`);
        }
    }

    // ===== Navegação Externa =====

    navigateToTurma(turmaId, view = 'view') {
        const methodName = `show${view.charAt(0).toUpperCase() + view.slice(1)}`;
        const fallback = () => {
            if (typeof this[methodName] === 'function') {
                return this[methodName](turmaId);
            }
            return this.showView(turmaId);
        };

        safeNavigateTo(`turmas/${view}/${turmaId}`, {
            fallback,
            context: 'turmas:navigateToTurma'
        });
    }

    navigateToList() {
        safeNavigateToList('turmas', {
            fallback: () => this.showList(),
            context: 'turmas:navigateToList'
        });
    }

    // ===== Integração com outros módulos =====

    integrateWithAttendanceModule() {
        // Permitir que o módulo de frequência use as funções de turmas
        if (window.attendanceModule) {
            window.attendanceModule.setTurmasController(this);
        }
    }

    integrateWithCoursesModule() {
        // Permitir navegação entre cursos e turmas
        if (window.coursesModule) {
            window.coursesModule.setTurmasController(this);
        }
    }

    // ===== Gestão de Cursos =====

    async addCourseToTurma(turmaId, courseId) {
        try {
            const result = await this.service.addCourseToTurma(turmaId, courseId);
            if (result.success) {
                // Limpar cache relacionado
                this.clearTurmaFromCache(turmaId);
                return result;
            }
            return result;
        } catch (error) {
            console.error('❌ Erro ao adicionar curso à turma:', error);
            throw error;
        }
    }

    async removeCourseFromTurma(turmaId, courseId) {
        try {
            const result = await this.service.removeCourseFromTurma(turmaId, courseId);
            if (result.success) {
                // Limpar cache relacionado
                this.clearTurmaFromCache(turmaId);
                return result;
            }
            return result;
        } catch (error) {
            console.error('❌ Erro ao remover curso da turma:', error);
            throw error;
        }
    }

    // ===== Cleanup =====

    destroy() {
        this.clearCurrentView();
        this.clearCache();
        this.container = null;
        this.service = null;
    }
}
