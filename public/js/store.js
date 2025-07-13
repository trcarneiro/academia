// public/js/store.js

export let currentEditingStudentId = null;
export let allStudents = []; // Cache for student data

export function setCurrentEditingStudentId(id) {
    currentEditingStudentId = id;
}

export function setAllStudents(students) {
    allStudents = students;
}
