// Frontend JS module for activities management
// Reference: CLAUDE.md standards

export async function fetchActivities() {
  const res = await fetch('/api/activities');
  if (!res.ok) throw new Error('Failed to fetch activities');
  return res.json().then(r => r.data || []);
}

export async function fetchTechniques({ page = 1, pageSize = 50, q = '', sortField = '', sortOrder = '' } = {}) {
  const params = new URLSearchParams();
  params.set('type', 'TECHNIQUE');
  params.set('page', String(page));
  params.set('pageSize', String(pageSize));
  if (q) params.set('q', q);
  if (sortField) params.set('sortField', sortField);
  if (sortOrder) params.set('sortOrder', sortOrder);

  const res = await fetch('/api/activities?' + params.toString());
  if (!res.ok) throw new Error('Failed to fetch techniques');
  const j = await res.json().catch(() => ({}));
  return {
    items: j.data || [],
    count: j.count || 0,
    page: j.page || page,
    pageSize: j.pageSize || pageSize
  };
}

export async function createActivity(data) {
  const res = await fetch('/api/activities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function updateActivity(id, data) {
  const res = await fetch(`/api/activities/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function deleteActivity(id) {
  const res = await fetch(`/api/activities/${id}`, { method: 'DELETE' });
  // some delete endpoints return 204 no content
  if (res.status === 204) return { success: true };
  return res.json();
}
