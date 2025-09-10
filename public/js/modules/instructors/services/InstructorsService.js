const InstructorsService = {
  async list() {
    return window.instructorsModule.api.fetch('/api/instructors');
  },

  async get(id) {
    return window.instructorsModule.api.fetch(`/api/instructors/${id}`);
  },

  async create(data) {
    return window.instructorsModule.api.post('/api/instructors', data);
  },

  async update(id, data) {
    return window.instructorsModule.api.put(`/api/instructors/${id}`, data);
  },

  async delete(id) {
    return window.instructorsModule.api.delete(`/api/instructors/${id}`);
  }
};

// Export globally
window.InstructorsService = InstructorsService;
