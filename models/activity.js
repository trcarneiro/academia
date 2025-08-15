// Activity model for modular activities bank
// Reference: CLAUDE.md standards

class Activity {
  constructor({ id, name, description, category, tags, techniqueIds }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.category = category; // e.g., alongamento, tecnica, drill
    this.tags = tags || [];
    this.techniqueIds = techniqueIds || [];
  }
}

module.exports = Activity;
