// Badge model (Sequelize style)
module.exports = (sequelize, DataTypes) => {
  const Badge = sequelize.define('Badge', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.STRING },
    icon: { type: DataTypes.STRING },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'badges',
    timestamps: false
  });
  return Badge;
};