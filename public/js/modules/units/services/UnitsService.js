export default {
  async list() {
  const api = window.unitsModule?.api?.api || window.apiClient;
  return api.get('/api/units');
  },

  async get(id) {
  const api = window.unitsModule?.api?.api || window.apiClient;
  return api.get(`/api/units/${id}`);
  },

  async create(data) {
  const api = window.unitsModule?.api?.api || window.apiClient;
  return api.post('/api/units', data);
  },

  async update(id, data) {
  const api = window.unitsModule?.api?.api || window.apiClient;
  return api.put(`/api/units/${id}`, data);
  },

  async delete(id) {
  const api = window.unitsModule?.api?.api || window.apiClient;
  return api.delete(`/api/units/${id}`);
  }
};
