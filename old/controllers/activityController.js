// Controller for activities CRUD operations
// Reference: CLAUDE.md standards

const ActivityService = require('../services/activityService');

const activityController = {
  async list(req, res) {
    const activities = await ActivityService.list();
    res.send(activities);
  },
  async get(req, res) {
    const activity = await ActivityService.get(req.params.id);
    res.send(activity);
  },
  async create(req, res) {
    const activity = await ActivityService.create(req.body);
    res.send(activity);
  },
  async update(req, res) {
    const activity = await ActivityService.update(req.params.id, req.body);
    res.send(activity);
  },
  async remove(req, res) {
    await ActivityService.remove(req.params.id);
    res.send({ success: true });
  }
};

module.exports = activityController;
