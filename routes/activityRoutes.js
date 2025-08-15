// Routes for activities CRUD
// Reference: CLAUDE.md standards

const activityController = require('../controllers/activityController');

module.exports = function (fastify, opts, done) {
  fastify.get('/activities', activityController.list);
  fastify.get('/activities/:id', activityController.get);
  fastify.post('/activities', activityController.create);
  fastify.put('/activities/:id', activityController.update);
  fastify.delete('/activities/:id', activityController.remove);
  done();
};
