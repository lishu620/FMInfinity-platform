module.exports = (sequelize, DataTypes) => {
  const Notice = sequelize.define('Notice', {
    receiveUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    noticeType: {
      type: DataTypes.ENUM('single', 'group', 'all', 'issue'),
      defaultValue: 'single',
    },
    bizType: DataTypes.STRING,
    bizId: DataTypes.INTEGER,
    title: DataTypes.STRING,
    content: DataTypes.TEXT,
    jumpPath: DataTypes.STRING,
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    sendUserId: DataTypes.INTEGER,
  });

  return Notice;
};