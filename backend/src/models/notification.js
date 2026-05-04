// Notification model (Sequelize style)
module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false }, // destinatario
    type: { type: DataTypes.STRING, allowNull: false }, // 'follow', 'message', 'reaction', etc.
    data: { type: DataTypes.JSONB },
    read: { type: DataTypes.BOOLEAN, defaultValue: false },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'notifications',
    timestamps: false
  });
  return Notification;
};