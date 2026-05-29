const express = require('express');
const router = express.Router();
const jwt = require("jsonwebtoken");
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');
const { Notice, User, Status } = require('../models');
const noticeEventBus = require('../utils/noticeEventBus');

// SSE 实时通知流 (支持 query token，因 EventSource 不支持自定义 header)
router.get('/stream', async (req, res) => {
  const token = req.query.token;
  if (!token) {
    return res.status(401).json({ message: '未登录' });
  }

  let userId;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.userId, { include: Status });
    if (!user || user.isBanned) {
      return res.status(401).json({ message: '用户无效' });
    }
    userId = user.id;
  } catch (err) {
    return res.status(401).json({ message: 'Token无效' });
  }

  // 设置 SSE 响应头
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  // 发送初始连接确认
  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

  // 监听该用户的通知事件
  const onNotice = (notice) => {
    res.write(`data: ${JSON.stringify({ type: 'new_notice', notice })}\n\n`);
  };

  noticeEventBus.on(`notice:user:${userId}`, onNotice);

  // 心跳保活（每30秒）
  const heartbeat = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, 30000);

  // 客户端断开时清理
  req.on('close', () => {
    clearInterval(heartbeat);
    noticeEventBus.off(`notice:user:${userId}`, onNotice);
  });
});

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

// 删除通知
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const count = await Notice.destroy({
      where: {
        id: req.params.id,
        receiveUserId: req.user.id,
      },
    });
    if (count === 0) {
      return res.status(404).json({ message: '通知不存在' });
    }
    res.json({ message: 'ok' });
  } catch (err) {
    res.status(500).json({ message: '删除失败' });
  }
});

// 全部标记已读
router.post('/read-all', authMiddleware, async (req, res) => {
  try {
    await Notice.update(
      { isRead: true },
      { where: { receiveUserId: req.user.id, isRead: false } }
    );
    res.json({ message: 'ok' });
  } catch (err) {
    res.status(500).json({ message: '失败' });
  }
});

module.exports = router;