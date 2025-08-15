// Service for activities CRUD logic
// Reference: CLAUDE.md standards

const Activity = require('../models/activity');
const activities = [];

const ActivityService = {
  list() {
    return activities;
  },
  get(id) {
    return activities.find(a => a.id === id);
  },
  create(data) {
    const activity = new Activity({ ...data, id: Date.now().toString() });
    activities.push(activity);
    return activity;
  },
  update(id, data) {
    const idx = activities.findIndex(a => a.id === id);
    if (idx === -1) return null;
    activities[idx] = { ...activities[idx], ...data };
    return activities[idx];
  },
  remove(id) {
    const idx = activities.findIndex(a => a.id === id);
    if (idx !== -1) activities.splice(idx, 1);
  }
};

module.exports = ActivityService;
