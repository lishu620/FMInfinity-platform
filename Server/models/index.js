const { Sequelize, DataTypes } = require("sequelize");
const path = require("path");

const DB_DIALECT = process.env.DB_DIALECT || "sqlite";

// 根据 DB_DIALECT 构建 Sequelize 配置
let sequelize;

if (DB_DIALECT === "mysql") {
  sequelize = new Sequelize({
    dialect: "mysql",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    database: process.env.DB_NAME || "fminfinity",
    username: process.env.DB_USER || "fminfinity",
    password: process.env.DB_PASSWORD || "",
    logging: false,
  });
} else {
  // 默认 SQLite
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: process.env.DB_STORAGE || path.join(__dirname, "../main.sqlite"),
    logging: false,
  });
}

console.log(`数据库类型: ${DB_DIALECT}`);

// 1. 用户组表 (status)
const Status = sequelize.define("Status", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
  description: { type: DataTypes.TEXT },
  maxVote: {
    type: DataTypes.INTEGER,
    defaultValue: 3,
    validate: { min: 1, max: 10 },
  },
});

// 2. 用户表
const User = sequelize.define("User", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  nickname: { type: DataTypes.STRING, allowNull: false },
  isGroupAdmin: { type: DataTypes.BOOLEAN, defaultValue: false },
  statusId: { type: DataTypes.INTEGER, allowNull: false },
  isApproved: { type: DataTypes.BOOLEAN, defaultValue: false },
  isBanned: { type: DataTypes.BOOLEAN, defaultValue: false },
  lastSeenAt: { type: DataTypes.DATE, allowNull: true },
});

// 3. 稿件表 (每期)
const Issue = sequelize.define("Issue", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  status: {
    type: DataTypes.ENUM(
      "draft",
      "submitting",
      "voting",
      "confirmed",
      "published",
    ),
    defaultValue: "draft",
    allowNull: false,
  },
  selectedCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 3,
    validate: { min: 1, max: 100 },
  },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
});

// 4. 稿件管理员表 (指定本期管理员)
const IssueAdmin = sequelize.define("IssueAdmin", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  issueId: { type: DataTypes.INTEGER, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false },
});

// 5. 公共提交歌曲表
const PublicSong = sequelize.define("PublicSong", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  issueId: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  link: { type: DataTypes.STRING },
  type: { type: DataTypes.STRING },
  submitter: { type: DataTypes.STRING },
  isSelected: { type: DataTypes.BOOLEAN, defaultValue: false },
  isReviewSelected: { type: DataTypes.BOOLEAN, defaultValue: false },
  SelectedUser: { type: DataTypes.INTEGER },
  isAdminInsert: { type: DataTypes.BOOLEAN, defaultValue: false },
});

// 6. 投票表
const Vote = sequelize.define("Vote", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  issueId: { type: DataTypes.INTEGER, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  songId: { type: DataTypes.INTEGER, allowNull: false },
  voteCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 0, max: 3 },
  },
});

// 7. 文案表
const Copy = sequelize.define("Copy", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  issueId: { type: DataTypes.INTEGER, allowNull: false },
  songId: { type: DataTypes.INTEGER, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
  isSubmitted: { type: DataTypes.BOOLEAN, defaultValue: false },
});

// 8. 歌姬表
const Vsinger = sequelize.define("Vsinger", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  vsingerName: { type: DataTypes.TEXT, allowNull: false },
});

const Notice = require("./notice")(sequelize, DataTypes);

// 表关联
User.belongsTo(Status, { foreignKey: "statusId" });
Status.hasMany(User, { foreignKey: "statusId" });

Issue.hasMany(PublicSong, { foreignKey: "issueId" });
PublicSong.belongsTo(Issue, { foreignKey: "issueId" });

Issue.hasMany(IssueAdmin, { foreignKey: "issueId" });
IssueAdmin.belongsTo(Issue, { foreignKey: "issueId" });
IssueAdmin.belongsTo(User, { foreignKey: "userId" });

Issue.hasMany(Vote, { foreignKey: "issueId" });
Vote.belongsTo(Issue, { foreignKey: "issueId" });
Vote.belongsTo(User, { foreignKey: "userId" });
Vote.belongsTo(PublicSong, { foreignKey: "songId" });
PublicSong.hasMany(Vote, { foreignKey: "songId" });

Issue.hasMany(Copy, { foreignKey: "issueId" });
Copy.belongsTo(Issue, { foreignKey: "issueId" });
Copy.belongsTo(PublicSong, { foreignKey: "songId" });
Copy.belongsTo(User, { foreignKey: "userId" });

PublicSong.belongsTo(User, {
  foreignKey: "SelectedUser",
  as: "selectedUser",
});

// 歌姬--歌曲 多对多
const SongVsinger = sequelize.define("SongVsinger", {}, { timestamps: true });

PublicSong.belongsToMany(Vsinger, {
  through: SongVsinger,
  foreignKey: "songId",
  otherKey: "vsingerId",
  as: "vsingers",
});
Vsinger.belongsToMany(PublicSong, {
  through: SongVsinger,
  foreignKey: "vsingerId",
  otherKey: "songId",
  as: "publicSongs",
});

Notice.belongsTo(User, { foreignKey: "receiveUserId", as: "receiveUser" });
Notice.belongsTo(User, { foreignKey: "sendUserId", as: "sendUser" });

// 8. 每日一言表
const DailyQuote = sequelize.define("DailyQuote", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  content: { type: DataTypes.TEXT, allowNull: false },
  link: { type: DataTypes.STRING },
  isUsed: { type: DataTypes.BOOLEAN, defaultValue: false },
  userId: { type: DataTypes.INTEGER, allowNull: false },
});

DailyQuote.belongsTo(User, { foreignKey: "userId", as: "submitter" });

// 初始化数据库
const initDB = async () => {
  await sequelize.sync({ force: false });

  const [adminGroup] = await Status.findOrCreate({
    where: { name: "admin" },
    defaults: { description: "超级管理员组", maxVote: 3 },
  });

  const [copyGroup] = await Status.findOrCreate({
    where: { name: "文案组" },
    defaults: { description: "文案编辑组", maxVote: 1 },
  });

  const bcrypt = require("bcryptjs");
  const hashedPwd = await bcrypt.hash("admin@123", 10);

  // 初始化默认每日一言
  const [adminUser] = await User.findOrCreate({
    where: { username: "admin" },
    defaults: {
      nickname: "超级管理员",
      password: hashedPwd,
      statusId: adminGroup.id,
      isGroupAdmin: true,
      isApproved: true,
    },
  });

  await DailyQuote.findOrCreate({
    where: { content: "我的登场即是天意 不必向谁证明唯一" },
    defaults: {
      content: "我的登场即是天意 不必向谁证明唯一",
      link: "",
      isUsed: false,
      userId: adminUser.id,
    },
  });

  console.log("数据库初始化完成");
};

initDB();

module.exports = {
  sequelize,
  User,
  Status,
  Issue,
  IssueAdmin,
  PublicSong,
  Vote,
  Copy,
  Vsinger,
  Notice,
  DailyQuote,
};
