// Students Management Functions - Extracted from index.html
// ==========================================
// SISTEMA DE ASSOCIAÇÕES HIERÁRQUICAS
// ==========================================

async function loadStudentWithAssociations(studentId) {
    try {
        // Buscar dados do aluno, matrículas e assinaturas em paralelo
        const [studentResponse, enrollmentsResponse, subscriptionsResponse] = await Promise.all([
            fetch(`/api/students/${studentId}`),
            fetch(`/api/students/${studentId}/enrollments`),
            fetch(`/api/students/${studentId}/subscription`)
        ]);

        const studentData = await studentResponse.json();
        const enrollmentsData = await enrollmentsResponse.json();
        const subscriptionsData = await subscriptionsResponse.json();

        if (!studentData.success) {
            throw new Error(studentData.message || 'Erro ao carregar dados do aluno');
        }

        // Buscar dados complementares
        const [classesResponse, coursesResponse, plansResponse] = await Promise.all([
            fetch('/api/classes'),
            fetch('/api/courses'),
            fetch('/api/billing-plans')
        ]);

        const classesData = await classesResponse.json();
        const coursesData = await coursesResponse.json();
        const plansData = await plansResponse.json();

        // Processar associações
        const associations = processStudentAssociations(
            studentData.data,
            enrollmentsData.success ? enrollmentsData.data : [],
            subscriptionsData.success ? subscriptionsData.data : [],
            classesData.success ? classesData.data : [],
            coursesData.success ? coursesData.data : [],
            plansData.success ? plansData.data : []
        );

        return {
            student: studentData.data,
            associations: associations
        };

    } catch (error) {
        return null;
    }
}

function processStudentAssociations(student, enrollments, subscriptions, allClasses, allCourses, allPlans) {
    const associations = {
        plans: [],
        courses: [],
        classes: [],
        hierarchy: []
    };

    // Processar assinaturas de planos
    subscriptions.forEach(subscription => {
        if (subscription.plan || subscription.billingPlan) {
            const plan = subscription.plan || subscription.billingPlan;
            associations.plans.push({
                subscription: subscription,
                plan: plan
            });
        }
    });

    // Processar matrículas
    enrollments.forEach(enrollment => {
        if (enrollment.course) {
            associations.courses.push({
                enrollment: enrollment,
                course: enrollment.course
            });
        }

        if (enrollment.class) {
            associations.classes.push({
                enrollment: enrollment,
                class: enrollment.class
            });
        }
    });

    // Criar hierarquia
    associations.plans.forEach(planAssoc => {
        const planHierarchy = {
            plan: planAssoc.plan,
            subscription: planAssoc.subscription,
            courses: [],
            directClasses: []
        };

        // Encontrar cursos relacionados ao plano
        associations.courses.forEach(courseAssoc => {
            const course = courseAssoc.course;
            if (course.category === planAssoc.plan.category || 
                course.level === planAssoc.plan.level ||
                course.planId === planAssoc.plan.id ||
                course.id === planAssoc.plan.courseId) {

                const courseInPlan = {
                    course: course,
                    enrollment: courseAssoc.enrollment,
                    classes: []
                };

                // Encontrar turmas do curso
                associations.classes.forEach(classAssoc => {
                    if (classAssoc.class.courseId === course.id) {
                        courseInPlan.classes.push({
                            class: classAssoc.class,
                            enrollment: classAssoc.enrollment
                        });
                    }
                });

                planHierarchy.courses.push(courseInPlan);
            }
        });

        // Verificar se o plano tem um courseId direto que ainda não foi adicionado
        if (planAssoc.plan.courseId && allCourses && allCourses.length > 0) {
            const planCourse = allCourses.find(course => course.id === planAssoc.plan.courseId);
            if (planCourse) {
                // Verificar se o curso já foi adicionado
                const courseAlreadyAdded = planHierarchy.courses.some(courseInPlan => 
                    courseInPlan.course.id === planCourse.id
                );

                if (!courseAlreadyAdded) {
                    const courseInPlan = {
                        course: planCourse,
                        enrollment: null, // Sem matrícula ainda
                        classes: []
                    };

                    // Encontrar turmas do curso
                    associations.classes.forEach(classAssoc => {
                        if (classAssoc.class.courseId === planCourse.id) {
                            courseInPlan.classes.push({
                                class: classAssoc.class,
                                enrollment: classAssoc.enrollment
                            });
                        }
                    });

                    planHierarchy.courses.push(courseInPlan);
                }
            }
        }

        // Encontrar turmas diretas do plano (sem curso)
        associations.classes.forEach(classAssoc => {
            const isInCourse = planHierarchy.courses.some(courseInPlan => 
                courseInPlan.classes.some(c => c.class.id === classAssoc.class.id)
            );

            if (!isInCourse && (
                classAssoc.class.category === planAssoc.plan.category || 
                classAssoc.class.level === planAssoc.plan.level ||
                classAssoc.class.planId === planAssoc.plan.id
            )) {
                planHierarchy.directClasses.push({
                    class: classAssoc.class,
                    enrollment: classAssoc.enrollment
                });
            }
        });

        associations.hierarchy.push(planHierarchy);
    });

    // Se não há planos, criar uma estrutura básica
    if (associations.hierarchy.length === 0 && (associations.courses.length > 0 || associations.classes.length > 0)) {
        associations.hierarchy.push({
            plan: { name: 'Sem Plano Definido', category: 'Geral' },
            subscription: null,
            courses: associations.courses.map(courseAssoc => ({
                course: courseAssoc.course,
                enrollment: courseAssoc.enrollment,
                classes: associations.classes.filter(classAssoc => 
                    classAssoc.class.courseId === courseAssoc.course.id
                )
            })),
            directClasses: associations.classes.filter(classAssoc => 
                !associations.courses.some(courseAssoc => 
                    courseAssoc.course.id === classAssoc.class.courseId
                )
            )
        });
    }

    return associations;
}

// ==========================================
// STUDENT MANAGEMENT FUNCTIONS
// ==========================================

// Global students data storage
let allStudents = [];
let filteredStudents = [];
let currentView = 'table'; // 'table' or 'grid'

// Make allStudents globally accessible
window.allStudents = allStudents;

// Generate simple matricula
function generateMatricula(studentId, index) {
    // Simple format: just the index number (1, 2, 3, etc.)
    return index ? index.toString() : '1';
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        color: white;
        font-weight: 600;
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 400px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        ${type === 'success' ? 'background: linear-gradient(135deg, #10B981, #059669);' : ''}
        ${type === 'error' ? 'background: linear-gradient(135deg, #EF4444, #DC2626);' : ''}
        ${type === 'info' ? 'background: linear-gradient(135deg, #3B82F6, #2563EB);' : ''}
    `;
    toast.textContent = message;

    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 100);

    // Auto remove
    setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 4000);
}

function filterStudents() {
    const searchTerm = document.getElementById('studentSearch').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;

    filteredStudents = allStudents.filter(student => {
        const user = student.user || {};
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
        const email = (user.email || '').toLowerCase();
        const matricula = (student.matricula || `KMA${String(student.id).padStart(4, '0')}`).toLowerCase();

        // Search filter
        const matchesSearch = !searchTerm || 
            fullName.includes(searchTerm) || 
            email.includes(searchTerm) || 
            matricula.includes(searchTerm);

        // Category filter
        const matchesCategory = !categoryFilter || student.category === categoryFilter;

        // Status filter
        const matchesStatus = !statusFilter || String(student.isActive) === statusFilter;

        return matchesSearch && matchesCategory && matchesStatus;
    });

    updateStudentsGrid();
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        ${type === 'success' ? 'background: #10B981;' : ''}
        ${type === 'error' ? 'background: #EF4444;' : ''}
        ${type === 'info' ? 'background: #3B82F6;' : ''}
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Auto remove
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// ==========================================
// ATTENDANCE CAPTURE FUNCTIONALITY
// ==========================================

// Global variables for attendance
const currentClassId = '2e47c8b1-5d4c-4a9b-8f3e-1b2c3d4e5f60'; // Turma 1
const currentLessonNumber = 15;
let selectedStudentId = null;

// Load attendance list with interactive checkboxes
async function loadAttendanceList() {
    try {
        document.getElementById('attendanceList').innerHTML = `
            <div class="loading-message" style="text-align: center; color: #CBD5E1; padding: 2rem;">
                <span style="font-size: 1.5rem; margin-bottom: 0.5rem; display: block;">📋</span>
                Carregando lista de presença...
            </div>
        `;

        const studentsResponse = await fetch(`/api/students`);
        const studentsResult = await studentsResponse.json();

        const attendanceResponse = await fetch(`/api/classes/${currentClassId}/lessons/${currentLessonNumber}/attendance`);
        const attendanceResult = await attendanceResponse.json();

        if (studentsResult.success && attendanceResult.success) {
            displayAttendanceList(studentsResult.data, attendanceResult.data);
            updateAttendanceStats(studentsResult.data, attendanceResult.data);
        } else {
            throw new Error('Failed to load attendance data');
        }
    } catch (error) {
        document.getElementById('attendanceList').innerHTML = `
            <div style="text-align: center; color: #EF4444; padding: 2rem;">
                <span style="font-size: 1.5rem; margin-bottom: 0.5rem; display: block;">⚠️</span>
                Erro ao carregar lista de presença
            </div>
        `;
    }
}

// Display attendance list with interactive cards
function displayAttendanceList(students, attendanceRecords) {
    const attendanceMap = {};
    attendanceRecords.forEach(record => {
        attendanceMap[record.studentId] = record;
    });

    const html = `
        <div class="attendance-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem;">
            ${students.map(enrollment => {
                const student = enrollment?.student;
                if (!student || !student.id) {
                    return '';
                }
                const attendance = attendanceMap[student.id];
                const isPresent = attendance ? attendance.present : false;
                const isLate = attendance ? attendance.arrived_late : false;
                const leftEarly = attendance ? attendance.left_early : false;

                // Safe access to user data
                const user = student.user || {};
                const firstName = user.firstName || 'N';
                const lastName = user.lastName || 'A';
                const email = user.email || 'sem-email@exemplo.com';
                const initials = firstName.charAt(0) + lastName.charAt(0);

                return `
                    <div class="attendance-card" style="background: rgba(255, 255, 255, 0.05); padding: 1rem; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1);">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                            <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #3B82F6, #10B981); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
                                ${initials}
                            </div>
                            <div>
                                <div style="font-weight: 600; color: white;">${firstName} ${lastName}</div>
                                <div style="font-size: 0.875rem; color: #CBD5E1;">${email}</div>
                            </div>
                        </div>

                        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" ${isPresent ? 'checked' : ''} 
                                       onchange="toggleAttendance('${student.id}', 'present', this.checked)"
                                       style="width: 18px; height: 18px;">
                                <span style="color: white;">Presente</span>
                                ${isPresent ? '<span style="color: #10B981; margin-left: auto;">✅</span>' : ''}
                            </label>

                            ${isPresent ? `
                                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; margin-left: 1rem;">
                                    <input type="checkbox" ${isLate ? 'checked' : ''} 
                                           onchange="toggleAttendance('${student.id}', 'arrived_late', this.checked)"
                                           style="width: 16px; height: 16px;">
                                    <span style="color: #CBD5E1; font-size: 0.875rem;">Chegou atrasado</span>
                                </label>

                                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; margin-left: 1rem;">
                                    <input type="checkbox" ${leftEarly ? 'checked' : ''} 
                                           onchange="toggleAttendance('${student.id}', 'left_early', this.checked)"
                                           style="width: 16px; height: 16px;">
                                    <span style="color: #CBD5E1; font-size: 0.875rem;">Saiu mais cedo</span>
                                </label>
                            ` : ''}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;

    document.getElementById('attendanceList').innerHTML = html;
}

// Toggle individual attendance
async function toggleAttendance(studentId, field, value) {
    try {
        const attendanceData = {
            studentId: studentId,
            classId: currentClassId,
            courseId: '750273f9-7508-4fbf-affb-8efe189f2875', // Krav Maga course ID
            lessonNumber: currentLessonNumber,
            date: new Date().toISOString()
        };

        if (field === 'present') {
            attendanceData.present = value;
            attendanceData.arrived_late = false;
            attendanceData.left_early = false;
        } else {
            // Get current attendance status first
            const currentAttendance = await fetch(`/api/classes/${currentClassId}/lessons/${currentLessonNumber}/attendance`);
            const currentResult = await currentAttendance.json();
            const studentAttendance = currentResult.data.find(a => a.studentId === studentId);

            attendanceData.present = studentAttendance ? studentAttendance.present : true;
            attendanceData[field] = value;
        }

        const response = await fetch('/api/attendance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(attendanceData)
        });

        const result = await response.json();

        if (result.success) {
            showToast('Presença atualizada com sucesso!');
            // Reload attendance list after short delay
            setTimeout(loadAttendanceList, 500);
        } else {
            throw new Error(result.message || 'Failed to update attendance');
        }
    } catch (error) {
        showToast('Erro ao atualizar presença', 'error');
    }
}

// Mark all students present
async function markAllPresent() {
    try {
        const studentsResponse = await fetch(`/api/students`);
        const studentsResult = await studentsResponse.json();

        if (!studentsResult.success) {
            throw new Error('Failed to load students');
        }

        const studentsData = studentsResult.data.map(enrollment => ({
            studentId: enrollment.student.id,
            present: true,
            arrived_late: false,
            left_early: false
        }));

        const response = await fetch(`/api/classes/${currentClassId}/lessons/${currentLessonNumber}/attendance/bulk`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                students: studentsData,
                courseId: '750273f9-7508-4fbf-affb-8efe189f2875',
                date: new Date().toISOString()
            })
        });

        const result = await response.json();

        if (result.success) {
            showToast('Todos os alunos marcados como presentes!');
            loadAttendanceList();
        } else {
            throw new Error(result.message || 'Failed to mark all present');
        }
    } catch (error) {
        showToast('Erro ao marcar todos presentes', 'error');
    }
}

// Update attendance statistics
function updateAttendanceStats(students, attendanceRecords) {
    const totalStudents = students.length;
    const presentStudents = attendanceRecords.filter(record => record.present).length;
    const absentStudents = totalStudents - presentStudents;
    const attendanceRate = totalStudents > 0 ? Math.round((presentStudents / totalStudents) * 100) : 0;

    document.getElementById('attendanceRate').textContent = attendanceRate + '%';
    document.getElementById('presentCount').textContent = presentStudents;
    document.getElementById('absentCount').textContent = absentStudents;
}

// ==========================================
// SEARCH FUNCTIONALITY
// ==========================================

async function loadAllStudents() {
    try {
        const response = await fetch(`/api/students`);
        const result = await response.json();
        if (result.success) {
            allStudents = result.data;
        }
    } catch (error) {
        // Error handling
    }
}

function searchStudentByName(query) {
    if (!query.trim()) {
        document.getElementById('searchResults').innerHTML = '<p>Digite para buscar alunos por nome</p>';
        selectedStudentId = null;
        return;
    }

    const filtered = allStudents.filter(enrollment => {
        const student = enrollment?.student;
        if (!student || !student.user) return false;
        const user = student.user;
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
        return fullName.includes(query.toLowerCase());
    });

    displaySearchResults(filtered);
}

function searchStudentByID(query) {
    if (!query.trim()) {
        document.getElementById('searchResults').innerHTML = '<p>Digite para buscar por matrícula</p>';
        selectedStudentId = null;
        return;
    }

    const filtered = allStudents.filter(enrollment => {
        const student = enrollment?.student;
        if (!student) return false;
        const user = student.user || {};
        return student.id?.includes(query) || 
               (user.email || '').includes(query);
    });

    displaySearchResults(filtered);
}

function displaySearchResults(students) {
    if (students.length === 0) {
        document.getElementById('searchResults').innerHTML = '<p style="color: #EF4444;">Nenhum aluno encontrado</p>';
        selectedStudentId = null;
        return;
    }

    const html = students.map(enrollment => {
        const student = enrollment?.student;
        if (!student || !student.id) return '';

        const user = student.user || {};
        const firstName = user.firstName || 'N';
        const lastName = user.lastName || 'A';
        const email = user.email || 'sem-email@exemplo.com';

        return `
            <div onclick="selectStudent('${student.id}')" 
                 style="padding: 0.5rem; margin: 0.25rem 0; background: rgba(59, 130, 246, 0.1); border-radius: 4px; cursor: pointer; border: 1px solid rgba(59, 130, 246, 0.3);"
                 onmouseover="this.style.background='rgba(59, 130, 246, 0.2)'"
                 onmouseout="this.style.background='rgba(59, 130, 246, 0.1)'">
                <strong>${firstName} ${lastName}</strong><br>
                <small style="color: #CBD5E1;">${email} | ID: ${student.id.slice(0, 8)}...</small>
            </div>
        `;
    }).join('');

    document.getElementById('searchResults').innerHTML = html;
}

function selectStudent(studentId) {
    selectedStudentId = studentId;
    const student = allStudents.find(e => e.student.id === studentId);
    if (student) {
        const user = student.student.user || {};
        const firstName = user.firstName || 'N';
        const lastName = user.lastName || 'A';
        document.getElementById('searchResults').innerHTML = `
            <p style="color: #10B981;">✅ Selecionado: ${firstName} ${lastName}</p>
        `;
    }
}

function markSelectedPresent() {
    if (!selectedStudentId) {
        showToast('Selecione um aluno primeiro', 'error');
        return;
    }
    toggleAttendance(selectedStudentId, 'present', true);
}

// Export functions to global scope
window.loadStudentWithAssociations = loadStudentWithAssociations;
window.processStudentAssociations = processStudentAssociations;
window.filterStudents = filterStudents;
window.showNotification = showNotification;
window.loadAttendanceList = loadAttendanceList;
window.toggleAttendance = toggleAttendance;
window.markAllPresent = markAllPresent;
window.loadAllStudents = loadAllStudents;
window.searchStudentByName = searchStudentByName;
window.searchStudentByID = searchStudentByID;
window.selectStudent = selectStudent;
window.markSelectedPresent = markSelectedPresent;
window.showToast = showToast;
