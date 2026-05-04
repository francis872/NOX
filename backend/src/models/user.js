// User model (Sequelize or Knex.js style, for Node.js)
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    username: { type: DataTypes.STRING, unique: true, allowNull: false },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    password_hash: { type: DataTypes.STRING, allowNull: false },
    reputation_score: { type: DataTypes.INTEGER, defaultValue: 0 },
    impact_score: { type: DataTypes.INTEGER, defaultValue: 0 },
    thought_profile: { type: DataTypes.JSONB },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'users',
    timestamps: false
  });
  return User;
};