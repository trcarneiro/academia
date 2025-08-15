// Service layer for students list

export async function fetchStudents() {
  const res = await fetch('/api/students');
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || `Erro ao buscar alunos (${res.status})`);
  }
  return json.data || [];
}
