const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { Notice } = require('../models');

// 获取我的通知
router.get('/list', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const list = await Notice.findAll({
      where: { receiveUserId: userId },
      order: [['createdAt', 'DESC']],
    });

    const unReadCount = await Notice.count({
      where: { receiveUserId: userId, isRead: false },
    });

    res.json({ list, unReadCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '获取通知失败' });
  }
});

// 标记已读
router.post('/read/:id', authMiddleware, async (req, res) => {
  try {
    await Notice.update(
      { isRead: true },
      {
        where: {
          id: req.params.id,
          receiveUserId: req.user.id,
        },
      }
    );
    res.json({ message: 'ok' });
  } catch (err) {
    res.status(500).json({ message: '失败' });
  }
});

module.exports = router;