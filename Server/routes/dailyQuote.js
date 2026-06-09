const express = require("express");
const router = express.Router();
const { authMiddleware, isSuperAdmin } = require("../middleware/auth");
const { DailyQuote, User, sequelize } = require("../models");
const { Op } = require("sequelize");

// 获取随机一条未使用的每日一言
router.get("/daily-quote/random", authMiddleware, async (req, res) => {
  try {
    const quote = await DailyQuote.findOne({
      where: { isUsed: false },
      order: sequelize.random(),
      include: [{ model: User, as: "submitter", attributes: ["id", "nickname"] }],
    });

    if (!quote) {
      // 如果没有未使用的，返回默认
      return res.json({
        id: 0,
        content: "我的登场即是天意 不必向谁证明唯一",
        link: "",
        isUsed: false,
        submitter: null,
      });
    }

    res.json(quote);
  } catch (err) {
    console.error("获取随机每日一言失败:", err);
    res.status(500).json({ message: "获取失败" });
  }
});

// 获取每日一言列表（管理员看全部，普通用户看自己的）
router.get("/daily-quote", authMiddleware, async (req, res) => {
  try {
    const where = {};
    // 非管理员只看自己的提交
    if (req.user.Status.name !== "admin") {
      where.userId = req.user.id;
    }

    const quotes = await DailyQuote.findAll({
      where,
      order: [["id", "DESC"]],
      include: [{ model: User, as: "submitter", attributes: ["id", "nickname", "username"] }],
    });
    res.json(quotes);
  } catch (err) {
    console.error("获取每日一言列表失败:", err);
    res.status(500).json({ message: "获取失败" });
  }
});

// 提交每日一言
router.post("/daily-quote", authMiddleware, async (req, res) => {
  try {
    const { content, link } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "内容不能为空" });
    }

    const quote = await DailyQuote.create({
      content: content.trim(),
      link: link || "",
      userId: req.user.id,
    });

    const fullQuote = await DailyQuote.findByPk(quote.id, {
      include: [{ model: User, as: "submitter", attributes: ["id", "nickname"] }],
    });

    res.json(fullQuote);
  } catch (err) {
    console.error("提交每日一言失败:", err);
    res.status(500).json({ message: "提交失败" });
  }
});

// 标记为已使用
router.put("/daily-quote/:id/use", authMiddleware, isSuperAdmin, async (req, res) => {
  try {
    const quote = await DailyQuote.findByPk(req.params.id);
    if (!quote) {
      return res.status(404).json({ message: "每日一言不存在" });
    }
    quote.isUsed = true;
    await quote.save();
    res.json(quote);
  } catch (err) {
    console.error("标记每日一言失败:", err);
    res.status(500).json({ message: "操作失败" });
  }
});

// 更新每日一言
router.put("/daily-quote/:id", authMiddleware, isSuperAdmin, async (req, res) => {
  try {
    const quote = await DailyQuote.findByPk(req.params.id);
    if (!quote) {
      return res.status(404).json({ message: "每日一言不存在" });
    }

    const { content, link, isUsed } = req.body;
    if (content !== undefined) quote.content = content;
    if (link !== undefined) quote.link = link;
    if (isUsed !== undefined) quote.isUsed = isUsed;

    await quote.save();

    const fullQuote = await DailyQuote.findByPk(quote.id, {
      include: [{ model: User, as: "submitter", attributes: ["id", "nickname"] }],
    });

    res.json(fullQuote);
  } catch (err) {
    console.error("更新每日一言失败:", err);
    res.status(500).json({ message: "更新失败" });
  }
});

// 删除每日一言
router.delete("/daily-quote/:id", authMiddleware, isSuperAdmin, async (req, res) => {
  try {
    const quote = await DailyQuote.findByPk(req.params.id);
    if (!quote) {
      return res.status(404).json({ message: "每日一言不存在" });
    }
    await quote.destroy();
    res.json({ message: "删除成功" });
  } catch (err) {
    console.error("删除每日一言失败:", err);
    res.status(500).json({ message: "删除失败" });
  }
});

module.exports = router;
