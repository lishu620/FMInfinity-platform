const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/auth");
const { Issue, PublicSong, Vote, User, Vsinger, sequelize } = require("../models");

// 获取【所有投票中】的稿件列表
router.get("/vote/issues", authMiddleware, async (req, res) => {
  try {
    const issues = await Issue.findAll({
      where: { status: "voting" },
      order: [["id", "DESC"]],
    });
    res.json(issues);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "获取投票稿件失败" });
  }
});

// 获取单个稿件的【所有可投票歌曲】（全部本期歌曲均可投票）
router.get("/vote/issue/:id/songs", authMiddleware, async (req, res) => {
  try {
    const songs = await PublicSong.findAll({
      where: {
        issueId: req.params.id,
      },
      include: [
        {
          model: Vote,
          attributes: ["id", "userId", "voteCount"],
          include: [
            {
              model: User,
              attributes: ["id", "nickname"],
            },
          ],
        },
        {
          model: Vsinger,
          as: "vsingers",
          attributes: ["id", "vsingerName"],
        },
      ],
      order: [["id", "ASC"]],
    });

    const result = songs.map((song) => {
      const json = song.toJSON();

      return {
        ...json,
        voterDetails: (json.Votes || []).map((vote) => ({
          userId: vote.userId,
          nickname: vote.User?.nickname || "未知用户",
          voteCount: vote.voteCount || 0,
        })),
      };
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "获取投票歌曲失败" });
  }
});

// 重置投票（仅投票中可重置）
router.post("/vote/issue/:id/reset", authMiddleware, async (req, res) => {
  try {
    const { songId } = req.body;
    const issueId = req.params.id;
    const userId = req.user.id;

    const issue = await Issue.findByPk(issueId);
    if (!issue) return res.status(404).json({ message: "稿件不存在" });
    if (issue.status !== "voting") {
      return res.status(400).json({ message: "当前稿件不在投票阶段" });
    }

    await Vote.destroy({
      where: {
        issueId,
        songId,
        userId,
      },
    });

    res.json({ message: "已重置本人投票" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "重置投票失败" });
  }
});

// ====================== 【修复 1】返回数组，不是对象 ======================
router.get("/vote/issue/:id/my-vote", authMiddleware, async (req, res) => {
  try {
    const votes = await Vote.findAll({
      where: {
        issueId: req.params.id,
        userId: req.user.id,
      },
    });
    res.json(votes); // 返回数组
  } catch (err) {
    res.status(500).json({ message: "获取我的投票失败" });
  }
});

// 提交投票（事务保护 + 总票数上限 + 状态检查）
router.post("/vote/issue/:id/submit", authMiddleware, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { songId, voteCount = 1 } = req.body;
    const issueId = req.params.id;
    const userId = req.user.id;
    const maxVote = req.user.Status.maxVote;

    // 状态检查：仅 voting 阶段可投票
    const issue = await Issue.findByPk(issueId, { transaction: t });
    if (!issue) {
      await t.rollback();
      return res.status(404).json({ message: "稿件不存在" });
    }
    if (issue.status !== "voting") {
      await t.rollback();
      return res.status(400).json({ message: "当前稿件不在投票阶段" });
    }

    if (voteCount < 1 || voteCount > maxVote) {
      await t.rollback();
      return res.status(400).json({ message: `单首歌最多可投 ${maxVote} 票` });
    }

    // 删除这首歌的旧投票
    await Vote.destroy({
      where: { issueId, userId, songId },
      transaction: t,
    });

    // 提交这首歌的投票
    await Vote.create(
      {
        issueId,
        userId,
        songId,
        voteCount,
      },
      { transaction: t },
    );

    await t.commit();
    res.json({ message: "投票成功" });
  } catch (err) {
    await t.rollback();
    console.error(err);
    res.status(500).json({ message: "投票失败" });
  }
});

// 获取投票结果
router.get("/vote/issue/:id/result", authMiddleware, async (req, res) => {
  try {
    const votes = await Vote.findAll({
      where: { issueId: req.params.id },
    });

    const countMap = {};
    votes.forEach((v) => {
      countMap[v.songId] = (countMap[v.songId] || 0) + v.voteCount;
    });

    res.json(countMap);
  } catch (err) {
    res.status(500).json({ message: "获取投票结果失败" });
  }
});

module.exports = router;
