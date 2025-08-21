export const ActivitiesService = {
  async list(params = {}) {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`/api/activities?${query}`);
    if (!response.ok) throw new Error('Failed to fetch activities');
    return response.json();
  },

  async get(id) {
    const response = await fetch(`/api/activities/${id}`);
    if (!response.ok) throw new Error('Failed to fetch activity');
    return response.json();
  },

  async create(activity) {
    const response = await fetch('/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activity)
    });
    if (!response.ok) throw new Error('Failed to create activity');
    return response.json();
  },

  async update(id, activity) {
    const response = await fetch(`/api/activities/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activity)
    });
    if (!response.ok) throw new Error('Failed to update activity');
    return response.json();
  },

  async delete(id) {
    const response = await fetch(`/api/activities/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete activity');
    return response.ok;
  }
};