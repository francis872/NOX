// IdeaContribution model (Sequelize or Knex.js style, for Node.js)
module.exports = (sequelize, DataTypes) => {
  const IdeaContribution = sequelize.define('IdeaContribution', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    idea_id: { type: DataTypes.UUID, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    contribution_type: { type: DataTypes.STRING }, // 'fork', 'edit', 'review'
    weight: { type: DataTypes.FLOAT, defaultValue: 1.0 },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'idea_contributions',
    timestamps: false
  });
  return IdeaContribution;
};