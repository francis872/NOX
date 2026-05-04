// Follower model (Sequelize style)
module.exports = (sequelize, DataTypes) => {
  const Follower = sequelize.define('Follower', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false }, // El seguido
    follower_id: { type: DataTypes.INTEGER, allowNull: false }, // El que sigue
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'followers',
    timestamps: false
  });
  return Follower;
};