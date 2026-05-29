const { User, Status, Notice } = require("../models");
const noticeEventBus = require("./noticeEventBus");

const STATUS_MAP = {
  draft: "草稿",
  submitting: "收歌中",
  voting: "投票中",
  confirmed: "已确认",
  published: "已发布",
};

async function sendNotice(params) {
  const {
    type,
    target,
    title,
    content,
    bizType = "system",
    bizId = null,
    jumpPath = "",
    sendUserId = null,
  } = params;

  let userList = [];

  try {
    if (type === "single") {
      userList = [{ id: target }];
    } else if (type === "group") {
      userList = await User.findAll({
        include: [{ model: Status, where: { name: target } }],
        attributes: ["id"],
      });
    } else if (type === "all") {
      userList = await User.findAll({ attributes: ["id"] });
    }

    if (!userList || userList.length === 0) {
      console.log("无接收用户，不发送通知");
      return;
    }

    const noticeData = userList.map((user) => ({
      receiveUserId: user.id,
      noticeType: type,
      title,
      content,
      bizType,
      bizId,
      jumpPath,
      sendUserId,
      isRead: false,
    }));

    if (Notice && Notice.bulkCreate) {
      const createdNotices = await Notice.bulkCreate(noticeData);

      // SSE 实时推送：向每个接收用户发送通知
      for (const notice of createdNotices) {
        noticeEventBus.emitToUser(notice.receiveUserId, notice.toJSON());
      }
    } else {
      console.error("Error: Notice 模型未加载");
    }
  } catch (err) {
    console.error("Error:发送通知失败", err);
  }
}

// 稿件状态变更（仅通知文案组和管理员，避免全量广播）
async function sendIssueStatusNotice(issue, newStatus, sendUid) {
  const title = "稿件状态变更通知";
  const content = `【${issue.title}】状态已变更为：${STATUS_MAP[newStatus]}`;

  // 先通知文案组
  await sendNotice({
    type: "group",
    target: "文案组",
    title,
    content,
    bizType: "issue_status",
    bizId: issue.id,
    jumpPath: "/review",
    sendUserId: sendUid,
  });

  // 如果状态变为 voting，额外通知所有用户
  if (newStatus === "voting" || newStatus === "published") {
    await sendNotice({
      type: "all",
      target: null,
      title,
      content,
      bizType: "issue_status",
      bizId: issue.id,
      jumpPath: newStatus === "voting" ? "/vote" : "/show",
      sendUserId: sendUid,
    });
  }
}

module.exports = {
  sendNotice,
  sendIssueStatusNotice,
};
