// Idea model (Sequelize or Knex.js style, for Node.js)
module.exports = (sequelize, DataTypes) => {
  const Idea = sequelize.define('Idea', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    author_id: { type: DataTypes.INTEGER, allowNull: false },
    version: { type: DataTypes.INTEGER, allowNull: false },
    parent_id: { type: DataTypes.UUID, allowNull: true },
    premise: { type: DataTypes.TEXT, allowNull: false },
    argument: { type: DataTypes.TEXT, allowNull: false },
    evidence: { type: DataTypes.TEXT, allowNull: false },
    conclusion: { type: DataTypes.TEXT, allowNull: false },
    counterargument: { type: DataTypes.TEXT },
    impact_score: { type: DataTypes.INTEGER, defaultValue: 0 },
    status: { type: DataTypes.STRING, defaultValue: 'active' },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'ideas',
    timestamps: false
  });
  return Idea;
};