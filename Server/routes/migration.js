const express = require("express");
const router = express.Router();
const { Sequelize, DataTypes } = require("sequelize");
const path = require("path");
const fs = require("fs");
const {
  authMiddleware,
  isSuperAdmin,
} = require("../middleware/auth");

/**
 * 根据配置创建 Sequelize 实例
 */
function createSequelize(config) {
  if (config.dialect === "mysql") {
    return new Sequelize({
      dialect: "mysql",
      host: config.host || "localhost",
      port: parseInt(config.port, 10) || 3306,
      database: config.database || "fminfinity",
      username: config.username || "fminfinity",
      password: config.password || "",
      logging: false,
    });
  } else {
    return new Sequelize({
      dialect: "sqlite",
      storage: config.storage || "./main.sqlite",
      logging: false,
    });
  }
}

/**
 * 在目标 Sequelize 实例上定义所有模型（不建立关联，仅用于建表）
 */
function defineModels(targetSeq) {
  const models = {};

  models.Status = targetSeq.define("Status", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    description: { type: DataTypes.TEXT },
    maxVote: { type: DataTypes.INTEGER, defaultValue: 3 },
  });

  models.User = targetSeq.define("User", {
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

  models.Issue = targetSeq.define("Issue", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING, allowNull: false },
    status: { type: DataTypes.STRING, defaultValue: "draft", allowNull: false },
    selectedCount: { type: DataTypes.INTEGER, defaultValue: 3 },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  });

  models.IssueAdmin = targetSeq.define("IssueAdmin", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    issueId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
  });

  models.PublicSong = targetSeq.define("PublicSong", {
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

  models.Vsinger = targetSeq.define("Vsinger", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    vsingerName: { type: DataTypes.TEXT, allowNull: false },
  });

  models.SongVsinger = targetSeq.define("SongVsinger", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    songId: { type: DataTypes.INTEGER, allowNull: false },
    vsingerId: { type: DataTypes.INTEGER, allowNull: false },
    createdAt: { type: DataTypes.DATE },
    updatedAt: { type: DataTypes.DATE },
  });

  models.Vote = targetSeq.define("Vote", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    issueId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    songId: { type: DataTypes.INTEGER, allowNull: false },
    voteCount: { type: DataTypes.INTEGER, allowNull: false },
  });

  models.Copy = targetSeq.define("Copy", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    issueId: { type: DataTypes.INTEGER, allowNull: false },
    songId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
    isSubmitted: { type: DataTypes.BOOLEAN, defaultValue: false },
  });

  models.Notice = targetSeq.define("Notice", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    receiveUserId: { type: DataTypes.INTEGER, allowNull: false },
    noticeType: { type: DataTypes.STRING, defaultValue: "single" },
    bizType: { type: DataTypes.STRING },
    bizId: { type: DataTypes.INTEGER },
    title: { type: DataTypes.STRING },
    content: { type: DataTypes.TEXT },
    jumpPath: { type: DataTypes.STRING },
    isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
    sendUserId: { type: DataTypes.INTEGER },
  });

  models.DailyQuote = targetSeq.define("DailyQuote", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    content: { type: DataTypes.TEXT, allowNull: false },
    link: { type: DataTypes.STRING },
    isUsed: { type: DataTypes.BOOLEAN, defaultValue: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
  });

  return models;
}

/**
 * 将 Sequelize 模型实例转为纯对象（去掉元数据）
 */
function toPlain(obj) {
  if (!obj) return null;
  return obj.get ? obj.get({ plain: true }) : obj;
}

/**
 * 迁移顺序：先无外键依赖的表，再依赖表
 */
const MIGRATION_ORDER = [
  "Status",
  "User",
  "Issue",
  "DailyQuote",
  "IssueAdmin",
  "PublicSong",
  "Vsinger",
  "SongVsinger",
  "Vote",
  "Copy",
  "Notice",
];

// ==================== 路由 ====================

/**
 * POST /api/migration/migrate
 * 将当前数据库数据迁移到目标数据库
 * Body: { target: { dialect, host?, port?, database?, username?, password?, storage? } }
 */
router.post("/migrate", authMiddleware, isSuperAdmin, async (req, res) => {
  const { target } = req.body;

  if (!target || !target.dialect) {
    return res.status(400).json({ message: "缺少目标数据库配置 (target.dialect)" });
  }

  if (!["sqlite", "mysql"].includes(target.dialect)) {
    return res.status(400).json({ message: "dialect 必须为 sqlite 或 mysql" });
  }

  let targetSeq = null;
  const results = {};

  try {
    // 1. 连接目标数据库
    targetSeq = createSequelize(target);
    await targetSeq.authenticate();

    // 2. 在目标库定义模型并建表
    const targetModels = defineModels(targetSeq);
    await targetSeq.sync({ force: true }); // 清空目标库重建

    // 3. 获取源数据
    const sourceModels = require("../models");

    // 4. 按顺序逐表迁移
    for (const tableName of MIGRATION_ORDER) {
      const sourceModel = sourceModels[tableName];
      const targetModel = targetModels[tableName];

      if (!sourceModel || !targetModel) {
        results[tableName] = { skipped: true, reason: "模型未找到" };
        continue;
      }

      // 读取源表所有数据
      const rows = await sourceModel.findAll({ raw: true });
      if (rows.length === 0) {
        results[tableName] = { count: 0 };
        continue;
      }

      // 写入目标表（逐条插入以兼容自增ID）
      let insertedCount = 0;
      for (const row of rows) {
        // 清理 row：移除 Sequelize 自动添加的时间戳以外的未知字段
        const cleanRow = { ...row };
        await targetModel.create(cleanRow);
        insertedCount++;
      }

      results[tableName] = { count: insertedCount };
    }

    res.json({
      message: "迁移完成",
      source: {
        dialect: process.env.DB_DIALECT || "sqlite",
        database: process.env.DB_NAME || process.env.DB_STORAGE || "N/A",
      },
      target: {
        dialect: target.dialect,
        database: target.database || target.storage || "N/A",
      },
      results,
    });
  } catch (err) {
    console.error("数据库迁移失败:", err);
    res.status(500).json({ message: "迁移失败", error: err.message });
  } finally {
    if (targetSeq) {
      await targetSeq.close();
    }
  }
});

/**
 * POST /api/migration/switch
 * 切换数据库：更新 .env 文件中的 DB_DIALECT（及其他 MySQL/SQLite 配置），
 * 可选同时执行迁移。
 * Body: { dialect, host?, port?, database?, username?, password?, storage?, migrate?: boolean }
 */
router.post("/switch", authMiddleware, isSuperAdmin, async (req, res) => {
  const {
    dialect,
    host,
    port,
    database,
    username,
    password,
    storage,
    migrate,
  } = req.body;

  if (!dialect || !["sqlite", "mysql"].includes(dialect)) {
    return res.status(400).json({ message: "dialect 必须为 sqlite 或 mysql" });
  }

  try {
    // 如果需要迁移，先执行迁移
    if (migrate) {
      const targetConfig = {
        dialect,
        host: host || "localhost",
        port: port || 3306,
        database: database || "fminfinity",
        username: username || "fminfinity",
        password: password || "",
        storage: storage || "./main.sqlite",
      };

      // 通过内部调用迁移逻辑
      let targetSeq = null;
      try {
        targetSeq = createSequelize(targetConfig);
        await targetSeq.authenticate();

        const targetModels = defineModels(targetSeq);
        await targetSeq.sync({ force: true });

        const sourceModels = require("../models");
        for (const tableName of MIGRATION_ORDER) {
          const sourceModel = sourceModels[tableName];
          const targetModel = targetModels[tableName];
          if (!sourceModel || !targetModel) continue;

          const rows = await sourceModel.findAll({ raw: true });
          for (const row of rows) {
            await targetModel.create({ ...row });
          }
        }
      } finally {
        if (targetSeq) await targetSeq.close();
      }
    }

    // 更新 .env 文件
    const envPath = path.join(__dirname, "../.env");
    let envContent = fs.readFileSync(envPath, "utf-8");

    // 更新 DB_DIALECT
    envContent = envContent.replace(/^DB_DIALECT=.*$/m, `DB_DIALECT=${dialect}`);

    if (dialect === "mysql") {
      if (host) envContent = envContent.replace(/^DB_HOST=.*$/m, `DB_HOST=${host}`);
      if (port) envContent = envContent.replace(/^DB_PORT=.*$/m, `DB_PORT=${port}`);
      if (database) envContent = envContent.replace(/^DB_NAME=.*$/m, `DB_NAME=${database}`);
      if (username) envContent = envContent.replace(/^DB_USER=.*$/m, `DB_USER=${username}`);
      if (password !== undefined) envContent = envContent.replace(/^DB_PASSWORD=.*$/m, `DB_PASSWORD=${password}`);
    } else {
      if (storage) envContent = envContent.replace(/^DB_STORAGE=.*$/m, `DB_STORAGE=${storage}`);
    }

    fs.writeFileSync(envPath, envContent, "utf-8");

    res.json({
      message: migrate
        ? `数据库已切换为 ${dialect}，数据已迁移，.env 已更新。请重启服务生效。`
        : `数据库已切换为 ${dialect}，.env 已更新。请重启服务生效。`,
      dialect,
      needsRestart: true,
    });
  } catch (err) {
    console.error("数据库切换失败:", err);
    res.status(500).json({ message: "切换失败", error: err.message });
  }
});

module.exports = router;
