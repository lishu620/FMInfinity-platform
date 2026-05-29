// 通知事件总线 - 用于 SSE 实时推送
const EventEmitter = require("events");

class NoticeEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(1000);
  }

  // 向特定用户推送通知
  emitToUser(userId, notice) {
    this.emit(`notice:user:${userId}`, notice);
  }

  // 向所有用户推送通知
  emitToAll(notice) {
    this.emit("notice:all", notice);
  }
}

const noticeEventBus = new NoticeEventBus();

module.exports = noticeEventBus;
